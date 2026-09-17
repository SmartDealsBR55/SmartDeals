import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

const formulario = document.querySelector("#form-login");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const mensagem = document.querySelector("#mensagem-login");

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    window.location.href = "/pages/admin.html";
  }
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  mensagem.hidden = false;
  mensagem.textContent = "Entrando...";

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);

    window.location.href = "/pages/admin.html";
  } catch (erro) {
    console.error("Erro no login:", erro.code, erro.message);

    mensagem.hidden = false;

    if (erro.code === "auth/invalid-credential") {
      mensagem.textContent = "E-mail ou senha incorretos.";
    } else if (erro.code === "auth/user-not-found") {
      mensagem.textContent = "Esse usuário não existe no Firebase.";
    } else if (erro.code === "auth/wrong-password") {
      mensagem.textContent = "Senha incorreta.";
    } else {
      mensagem.textContent = `Erro ao entrar: ${erro.code}`;
    }
  }
});