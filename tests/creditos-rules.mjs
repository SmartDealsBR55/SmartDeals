import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,updateDoc,getDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
const env=await initializeTestEnvironment({projectId:'demo-smartdeals',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(process.env.RULES_FILE||'firestore.rules','utf8')}});
const a=env.authenticatedContext('alice').firestore(),b=env.authenticatedContext('bob').firestore(),admin=env.authenticatedContext('admin').firestore();
const product=owner=>({nome:'Oferta',loja:'Shopee',categoria:'Moda',link:'https://example.com/offer',imagens:['https://example.com/a.jpg'],imagem:'https://example.com/a.jpg',ownerId:owner,criadoEm:serverTimestamp(),atualizadoEm:serverTimestamp(),expiraEm:null,excluirEm:null});
const publish=(db,uid,id,saldo)=>{const batch=writeBatch(db);batch.set(doc(db,'produtos',id),product(uid));batch.update(doc(db,'carteiras',uid),{saldo,ultimoProduto:id});return batch.commit();};
try {
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'administradores/admin'),{ativo:true});await setDoc(doc(c.firestore(),'carteiras/alice'),{saldo:2,recargas:0,ultimoProduto:'',boasVindas:true});await setDoc(doc(c.firestore(),'carteiras/bob'),{saldo:0,recargas:0,ultimoProduto:'',boasVindas:true});});
 await assertSucceeds(setDoc(doc(admin,'produtos/admin-free'),product('admin')));
 await assertFails(setDoc(doc(a,'produtos/no-debit'),product('alice')));
 await assertFails(setDoc(doc(a,'administradores/alice'),{ativo:true}));
 await assertFails(updateDoc(doc(a,'carteiras/alice'),{saldo:100}));
 await assertFails(updateDoc(doc(a,'carteiras/alice'),{recargas:0,saldo:1,ultimoProduto:'missing'}));
 await assertFails(getDoc(doc(b,'carteiras/alice')));
 await assertFails(setDoc(doc(b,'carteiras/new'),{saldo:100}));
 await assertSucceeds(publish(a,'alice','first',1));
 const batch=writeBatch(a);batch.set(doc(a,'produtos/second'),product('alice'));batch.set(doc(a,'produtos/third'),product('alice'));batch.update(doc(a,'carteiras/alice'),{saldo:0,ultimoProduto:'second'});
 await assertFails(batch.commit());
 await assertFails(publish(b,'bob','zero-credit',-1));
 await assertSucceeds(publish(a,'alice','last',0));
 await assertFails(publish(a,'alice','overdrawn',-1));
 await assertSucceeds(updateDoc(doc(a,'produtos/first'),{nome:'Editado',atualizadoEm:serverTimestamp()}));
 await assertFails(updateDoc(doc(b,'produtos/first'),{nome:'Ataque',atualizadoEm:serverTimestamp()}));
 console.log('PASS: 14 checks; administrator free, atomic debit, empty wallet, wallet tampering and ownership.');
} finally {await env.cleanup();}
