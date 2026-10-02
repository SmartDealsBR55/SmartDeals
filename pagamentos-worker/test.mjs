import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker,{settle,ensureWallet,validSignature} from './src/index.js';
globalThis.crypto ||= webcrypto;
class Memory {
 data=new Map(); version=0;
 async get(path){return structuredClone(this.data.get(path)||null);}
 write(path,data,old){return {path,data,old};}
 async commit(writes){for(const w of writes)if(this.data.get(w.path)?.version!==w.old?.version)throw Object.assign(new Error('conflict'),{retry:true});for(const w of writes)this.data.set(w.path,{data:structuredClone(w.data),version:++this.version});}
}
const env={MP_COLLECTOR_ID:'123',SITE_URL:'https://smartdealsbr55.github.io/SmartDeals',PAYMENTS_ENABLED:'false'};
async function order(store,uid='affiliate',plan='p10') {const id=crypto.randomUUID();await store.commit([store.write('recargas/'+id,{uid,plan,cents:200,status:'pending'},null)]);return id;}
const pay=(orderId,id)=>({id,external_reference:orderId,collector_id:123,live_mode:true,status:'approved',currency_id:'BRL',transaction_amount:2});
test('welcome credit is granted only once under concurrency',async()=>{const s=new Memory();await Promise.all([ensureWallet(s,'a'),ensureWallet(s,'a')]);assert.equal((await s.get('carteiras/a')).data.saldo,5);});
test('three bonuses, fourth base only; replay cannot duplicate; refunds do not reset bonus count',async()=>{
 const s=new Memory();await ensureWallet(s,'affiliate');const payments=[];
 for(let i=0;i<4;i++){const p=pay(await order(s),i+1);payments.push(p);await settle(s,p,env);}
 let w=(await s.get('carteiras/affiliate')).data;assert.equal(w.saldo,60);assert.equal(w.recargas,4);
 await Promise.all([settle(s,payments[0],env),settle(s,payments[0],env)]);assert.equal((await s.get('carteiras/affiliate')).data.saldo,60);
 await settle(s,{...payments[0],status:'refunded'},env);await settle(s,{...payments[0],status:'refunded'},env);
 w=(await s.get('carteiras/affiliate')).data;assert.equal(w.saldo,45);assert.equal(w.recargas,4);
});
test('concurrent approvals are atomic',async()=>{const s=new Memory();await ensureWallet(s,'affiliate');const p=pay(await order(s),1);await Promise.all([settle(s,p,env),settle(s,p,env)]);assert.equal((await s.get('carteiras/affiliate')).data.saldo,20);});
test('reject tampered prices, test payments, incorrect seller and repeated order',async()=>{
 const s=new Memory();await ensureWallet(s,'affiliate');const p=pay(await order(s),1);
 for(const changes of [{transaction_amount:0.2},{currency_id:'USD'},{collector_id:999},{live_mode:false}])await assert.rejects(settle(s,{...p,...changes},env));
 await settle(s,{...p,status:'pending'},env);assert.equal((await s.get('carteiras/affiliate')).data.saldo,5);
 await settle(s,p,env);await assert.rejects(settle(s,{...p,id:2},env));
});
test('signed notifications and tampering',async()=>{
 const id='123',ts='123456789',secret='test-secret';const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sig=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`id:${id};request-id:req;ts:${ts};`))).toString('hex');
 const headers={'x-request-id':'req','x-signature':`ts=${ts},v1=${sig}`};
 assert.equal(await validSignature(new Request('https://example.com/?data.id=123',{headers}),secret),true);
 assert.equal(await validSignature(new Request('https://example.com/?data.id=124',{headers}),secret),false);
 assert.equal(await validSignature(new Request('https://example.com/'),secret),false);
});
test('purchases start disabled; disallowed origins blocked',async()=>{
 let r=await worker.fetch(new Request('https://example.com/health'),env);assert.equal((await r.json()).comprasAtivas,false);
 r=await worker.fetch(new Request('https://example.com/health',{headers:{Origin:'https://evil.example'}}),env);assert.equal(r.status,403);
});
