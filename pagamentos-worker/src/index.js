// Secrets live only in Cloudflare: FIREBASE_SERVICE_ACCOUNT, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET.
export const plans = {p10:{paid:10,bonus:5,cents:200},p25:{paid:25,bonus:10,cents:500},p50:{paid:50,bonus:20,cents:1000},p100:{paid:100,bonus:50,cents:2000}};
const encoder = new TextEncoder();
const fail = (message,status=400) => { throw Object.assign(new Error(message),{status}); };
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const jwtPart = obj => b64(encoder.encode(JSON.stringify(obj)));
let oauth;
async function googleToken(sa) {
 if(oauth?.email===sa.client_email && oauth.exp>Date.now()+60000) return oauth.token;
 const now=Math.floor(Date.now()/1000);
 const head=jwtPart({alg:'RS256',typ:'JWT'})+'.'+jwtPart({iss:sa.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const der=Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g,'')),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const assertion=head+'.'+b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,encoder.encode(head)));
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
 const j=await r.json(); if(!r.ok) fail('Falha de autenticação do servidor.',503);
 oauth={email:sa.client_email,token:j.access_token,exp:Date.now()+j.expires_in*1000}; return oauth.token;
}
function encode(v) {
 if(v===null) return {nullValue:null};
 if(typeof v==='boolean') return {booleanValue:v};
 if(typeof v==='number') return {integerValue:String(v)};
 return {stringValue:String(v)};
}
function decode(doc) {
 if(!doc) return null;
 return Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,'integerValue'in v?Number(v.integerValue):'booleanValue'in v?v.booleanValue:'nullValue'in v?null:v.stringValue]));
}
class Store {
 constructor(env) { this.sa=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); if(this.sa.project_id!==env.FIREBASE_PROJECT_ID) fail('Projeto Firebase incorreto.',503); this.root=`projects/${this.sa.project_id}/databases/(default)/documents`; }
 async call(suffix,method='GET',body) {
  const r=await fetch(`https://firestore.googleapis.com/v1/${this.root}${suffix}`,{method,headers:{Authorization:`Bearer ${await googleToken(this.sa)}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  if(r.status===404) return null;
  const j=await r.json(); if(!r.ok) { const e=new Error('Falha ao atualizar o saldo. Tente novamente.'); e.status=503; e.retry=['ABORTED','FAILED_PRECONDITION','ALREADY_EXISTS'].includes(j.error?.status); throw e; } return j;
 }
 async get(path) { const raw=await this.call('/'+path); return raw?{data:decode(raw),version:raw.updateTime}:null; }
 write(path,data,old) {return {update:{name:this.root+'/'+path,fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,encode(v)]))},currentDocument:old?{updateTime:old.version}:{exists:false}};}
 async commit(writes) {return this.call(':commit','POST',{writes});}
}
async function retry(fn) {for(let i=0;i<5;i++){try{return await fn();}catch(e){if(!e.retry||i===4)throw e;}}}
async function userFor(request,env) {
 const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]; if(!token)fail('Entre na sua conta.',401);
 const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})});
 const j=await r.json(); const u=j.users?.[0]; if(!r.ok||!u||u.disabled)fail('Sua sessão expirou. Entre novamente.',401); return u.localId;
}
export async function ensureWallet(store,uid) {
 return retry(async()=>{const path='carteiras/'+uid; const current=await store.get(path); if(current)return current;
 const data={saldo:5,recargas:0,ultimoProduto:'',boasVindas:true}; await store.commit([store.write(path,data,null)]); return store.get(path);});
}
export async function validSignature(request,secret) {
 const id=new URL(request.url).searchParams.get('data.id'); const requestId=request.headers.get('x-request-id');
 const parts=Object.fromEntries((request.headers.get('x-signature')||'').split(',').map(x=>x.trim().split('=')));
 if(!secret||!id||!requestId||!parts.ts||!/^\d+$/.test(parts.ts)||!/^[a-f0-9]{64}$/i.test(parts.v1||''))return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const sig=Uint8Array.from(parts.v1.match(/../g),x=>parseInt(x,16));
 // Persistent payment IDs provide replay protection; provider retries can be delayed.
 return crypto.subtle.verify('HMAC',key,sig,encoder.encode(`id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`));
}
export async function settle(store,payment,env) {
 if(payment.live_mode!==true)fail('Pagamento de teste não libera créditos reais.',400);
 if(String(payment.collector_id)!==String(env.MP_COLLECTOR_ID))fail('Recebedor divergente.',400);
 const orderId=String(payment.external_reference||''); if(!/^[a-f0-9-]{36}$/.test(orderId))fail('Pedido inválido.');
 const paymentId=String(payment.id); if(!/^\d+$/.test(paymentId))fail('Pagamento inválido.');
 return retry(async()=>{
  const order=await store.get('recargas/'+orderId); if(!order)fail('Pedido não encontrado.',404);
  const o=order.data, p=plans[o.plan]; if(!p||payment.currency_id!=='BRL'||Math.round(Number(payment.transaction_amount)*100)!==o.cents||o.cents!==p.cents)fail('Valor divergente.');
  const record=await store.get('pagamentos/'+paymentId);
  if(record&&record.data.orderId!==orderId)fail('Pagamento já vinculado.');
  const wallet=await store.get('carteiras/'+o.uid); if(!wallet)fail('Saldo não encontrado.',503);
  const refunded=['refunded','charged_back'].includes(payment.status)||Number(payment.transaction_amount_refunded)>0;
  if(refunded) {
   if(!record||record.data.reversed)return {status:'ignored'};
   await store.commit([store.write('carteiras/'+o.uid,{...wallet.data,saldo:wallet.data.saldo-record.data.credits},wallet),store.write('pagamentos/'+paymentId,{...record.data,reversed:true},record)]);
   return {status:'reversed'};
  }
  if(payment.status!=='approved')return {status:'pending'};
  if(record)return {status:'duplicate'};
  if(o.paymentId)fail('Pedido já pago com outro pagamento.',409);
  const credits=p.paid+(wallet.data.recargas<3?p.bonus:0);
  await store.commit([store.write('carteiras/'+o.uid,{...wallet.data,saldo:wallet.data.saldo+credits,recargas:wallet.data.recargas+1},wallet),store.write('recargas/'+orderId,{...o,paymentId,status:'approved'},order),store.write('pagamentos/'+paymentId,{orderId,uid:o.uid,credits,reversed:false},null)]);
  return {status:'approved',credits};
 });
}
async function mp(env,path,body) {
 const r=await fetch('https://api.mercadopago.com'+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${env.MP_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const j=await r.json(); if(!r.ok)fail('Mercado Pago indisponível. Tente novamente.',502); return j;
}
async function handle(request,env) {
 const url=new URL(request.url), path=url.pathname;
 if(path==='/health')return {servico:'smartdeals-creditos',comprasAtivas:env.PAYMENTS_ENABLED==='true',modo:'production'};
 const store=new Store(env);
 if(path==='/webhooks/mercadopago'&&request.method==='POST') {
  if(!await validSignature(request,env.MP_WEBHOOK_SECRET))fail('Assinatura inválida.',401);
  const body=await request.json(); const id=url.searchParams.get('data.id');
  if(body.type!=='payment')return {status:'ignored'};
  if(String(body.data?.id)!==id||!/^\d+$/.test(id))fail('Identificador inválido.');
  return settle(store,await mp(env,'/v1/payments/'+id),env);
 }
 const uid=await userFor(request,env);
 const isAdmin=(await store.get('administradores/'+uid))?.data.ativo===true;
 if(path==='/account'&&request.method==='GET') {
  if(isAdmin)return {admin:true,ilimitado:true,comprasAtivas:env.PAYMENTS_ENABLED==='true'};
  const w=await ensureWallet(store,uid); return {admin:false,...w.data,comprasAtivas:env.PAYMENTS_ENABLED==='true'};
 }
 if(path==='/checkout'&&request.method==='POST') {
  if(isAdmin)fail('Sua conta de administrador publica gratuitamente.');
  if(env.PAYMENTS_ENABLED!=='true'||!/^\d+$/.test(env.MP_COLLECTOR_ID||''))fail('As compras ainda estão sendo ativadas. Nenhum valor foi cobrado.',503);
  const seller=await mp(env,'/users/me');
  if(String(seller.id)!==String(env.MP_COLLECTOR_ID)||seller.tags?.includes('test_user'))fail('Configure a conta vendedora de produção antes de ativar as compras.',503);
  const body=await request.json(); const plan=plans[body.plan]; if(!plan)fail('Pacote inválido.');
  await ensureWallet(store,uid);
  // One active preference per account/plan within this interval; double-clicks reuse it.
  const slot='checkoutSlots/'+uid+'_'+body.plan;
  const orderId=await retry(async()=>{
   const old=await store.get(slot); if(old&&Date.now()-old.data.createdAt<10*60*1000)return old.data.orderId;
   const id=crypto.randomUUID(); await store.commit([store.write(slot,{orderId:id,createdAt:Date.now()},old),store.write('recargas/'+id,{uid,plan:body.plan,cents:plan.cents,status:'pending',createdAt:Date.now()},null)]);return id;
  });
  let order=await store.get('recargas/'+orderId);
  if(order.data.paymentId)fail('Esta recarga já foi aprovada. Atualize o saldo antes de comprar outra.',409);
  if(order.data.url)return {url:order.data.url};
  await retry(async()=>{order=await store.get('recargas/'+orderId);if(order.data.status==='creating'||order.data.url)fail('Pagamento em preparação. Aguarde e tente novamente.',409);await store.commit([store.write('recargas/'+orderId,{...order.data,status:'creating'},order)]);});
  const back=env.SITE_URL+'/pages/admin.html';
  const pref=await mp(env,'/checkout/preferences',{items:[{id:body.plan,title:`SmartDeals — ${plan.paid} anúncios`,description:'Bônus nas primeiras 3 recargas aprovadas, conforme regulamento.',quantity:1,currency_id:'BRL',unit_price:plan.cents/100}],external_reference:orderId,back_urls:{success:back+'?pagamento=retorno',pending:back+'?pagamento=pendente',failure:back+'?pagamento=falhou'},auto_return:'approved',notification_url:env.WORKER_URL+'/webhooks/mercadopago',expires:true,expiration_date_to:new Date(Date.now()+30*60000).toISOString()});
  const target=new URL(pref.init_point); if(target.protocol!=='https:'||!target.hostname.endsWith('.mercadopago.com.br'))fail('Checkout inválido.',502);
  await retry(async()=>{order=await store.get('recargas/'+orderId);if(!order.data.url)await store.commit([store.write('recargas/'+orderId,{...order.data,url:target.href,preferenceId:pref.id},order)]);});
  return {url:(await store.get('recargas/'+orderId)).data.url};
 }
 fail('Rota não encontrada.',404);
}
export default {async fetch(request,env) {
 const origin=request.headers.get('Origin'); const allowed=new URL(env.SITE_URL).origin;
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origin===allowed)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});
 if(origin&&origin!==allowed)return new Response('{"error":"Origem não permitida."}',{status:403,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try {return new Response(JSON.stringify(await handle(request,env)),{headers});}
 catch(e) {return new Response(JSON.stringify({error:e.status?e.message:'Serviço temporariamente indisponível.'}),{status:e.status||503,headers});}
}};
