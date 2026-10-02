import {auth} from './firebase.js';
const API='https://smartdeals-pagamentos.gabriel-d-blaut.workers.dev';
let admin=false, busy=false, panel, note;
async function request(path,body) {
 if(!auth.currentUser)throw new Error('Entre na sua conta para continuar.');
 const token=await auth.currentUser.getIdToken();
 const r=await fetch(API+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||'Não foi possível concluir. Tente novamente.');
 if(data.etapa==='diagnostico')throw new Error('A compra de créditos ainda está em ativação. Nenhum valor foi cobrado.');
 return data;
}
export async function atualizarSaldo() {
 if(!panel||admin)return;
 try {
  const data=await request('/account');
  if(!Number.isInteger(data.saldo))throw new Error('Não foi possível consultar seu saldo.');
  note.textContent=`Saldo: ${data.saldo} anúncio(s). Bônus disponível em ${Math.max(0,3-data.recargas)} recarga(s).`;
  if(!data.comprasAtivas)note.textContent+=' Compras em ativação; nenhum pagamento será iniciado por enquanto.';
  panel.querySelectorAll('.sd-plan small').forEach(el=>{if(data.recargas>=3)el.textContent='Pacote sem bônus adicional';});
 }catch(e){note.textContent=e.message;}
}
export function iniciarCreditos(isAdmin) {
 admin=isAdmin; panel=document.querySelector('.sd-offer');if(!panel)return;
 const box=document.createElement('div');box.className='sd-account';box.style.gridColumn='1 / -1';box.setAttribute('role','status');
 note=document.createElement('p');box.append(note);panel.prepend(box);
 if(admin){
  note.textContent='Administrador · Publicações ilimitadas e gratuitas. Você não precisa comprar créditos.';
  panel.querySelector('.sd-price')?.setAttribute('hidden','');
  return;
 }
 const refresh=document.createElement('button');refresh.type='button';refresh.className='sd-buy';refresh.textContent='Atualizar saldo';refresh.onclick=atualizarSaldo;box.append(refresh);
 panel.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',async()=>{
  if(busy)return;busy=true;
  panel.querySelectorAll('[data-plan]').forEach(b=>b.disabled=true);
  note.textContent='Preparando pagamento seguro…';
  try {
   const data=await request('/checkout',{plan:button.dataset.plan});const target=new URL(data.url);
   if(target.protocol!=='https:'||!target.hostname.endsWith('.mercadopago.com.br'))throw new Error('Não foi possível abrir o pagamento.');
   location.assign(target.href);
  } catch(e){note.textContent=e.message;}
  finally {busy=false;panel.querySelectorAll('[data-plan]').forEach(b=>b.disabled=false);}
 }));
 atualizarSaldo();
 if(new URLSearchParams(location.search).has('pagamento')){
  // Returning from checkout is never proof of payment. Only server-verified balance is used.
  let attempts=0;const timer=setInterval(()=>{if(++attempts>6||!auth.currentUser){clearInterval(timer);return;}atualizarSaldo();},5000);
 }
 const selected=new URLSearchParams(location.search).get('plano');
 if(['p10','p25','p50','p100'].includes(selected))panel.querySelector(`[data-plan="${selected}"]`)?.focus();
}
