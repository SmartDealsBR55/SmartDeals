import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
const form = document.querySelector('#form-login');
const message = document.querySelector('#mensagem-login');
const button = form.querySelector('[type=submit]');
const toggle = document.querySelector('#alternar-cadastro');
let cadastro = new URLSearchParams(location.search).has('cadastro');
let ocupado = false;
const go = () => location.assign(new URL('./admin.html', location.href));
function show(text) { message.hidden = false; message.textContent = text; }
function render() {
 document.querySelector('#campo-nome').hidden = !cadastro;
 document.querySelector('#nome-conta').required = cadastro;
 document.querySelector('#senha').autocomplete = cadastro ? 'new-password' : 'current-password';
 document.querySelector('#senha').minLength = cadastro ? 8 : 1;
 button.textContent = cadastro ? 'Criar minha conta' : 'Entrar no painel';
 toggle.textContent = cadastro ? 'Já tenho conta — entrar' : 'Sou afiliado — criar conta';
 document.querySelector('#titulo-acesso').textContent = cadastro ? 'Cadastre-se para publicar suas ofertas' : 'Área dos afiliados';
}
render();

toggle.addEventListener('click', () => { cadastro = !cadastro; render(); message.hidden = true; });
form.addEventListener('submit', async e => {
 e.preventDefault(); if (ocupado) return;
 ocupado = true; button.disabled = toggle.disabled = true; show(cadastro ? 'Criando conta...' : 'Entrando...');
 try {
 const email = document.querySelector('#email').value.trim();
 const password = document.querySelector('#senha').value;
 if (cadastro) {
 const result = await createUserWithEmailAndPassword(auth, email, password);
 try { await updateProfile(result.user, { displayName: document.querySelector('#nome-conta').value.trim() }); }
 catch { /* O cadastro já existe; o nome não deve impedir o acesso. */ }
 } else { await signInWithEmailAndPassword(auth, email, password); }
 go();
 } catch (err) {
 const messages = {'auth/email-already-in-use':'Este e-mail já possui uma conta. Entre ou recupere sua senha.', 'auth/weak-password':'Use uma senha mais forte, com pelo menos 8 caracteres.', 'auth/invalid-email':'Confira o e-mail informado.', 'auth/invalid-credential':'E-mail ou senha incorretos.', 'auth/network-request-failed':'Falha de conexão. Tente novamente.', 'auth/too-many-requests':'Muitas tentativas. Aguarde e tente novamente.', 'auth/operation-not-allowed':'O cadastro ainda não está habilitado. Contate o administrador.'};
 show(messages[err.code] || 'Não foi possível concluir. Tente novamente.');
 } finally { ocupado = false; button.disabled = toggle.disabled = false; }
});
document.querySelector('#recuperar-senha').addEventListener('click', async () => {
 const email = document.querySelector('#email').value.trim();
 if (!email) return show('Digite seu e-mail acima para recuperar a senha.');
 try { auth.languageCode = 'pt-BR'; await sendPasswordResetEmail(auth, email); show('Se houver uma conta para esse e-mail, você receberá instruções. Confira também o spam.'); }
 catch { show('Não foi possível enviar as instruções. Confira o e-mail e tente novamente.'); }
});
