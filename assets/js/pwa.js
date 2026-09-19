let eventoInstalacao = null;
const botaoInstalar = document.querySelector("#botao-instalar-app");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/SmartDeals/service-worker.js").catch((erro) => {
      console.warn("Não foi possível ativar o modo aplicativo:", erro);
    });
  });
}

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  eventoInstalacao = evento;
  if (botaoInstalar) botaoInstalar.hidden = false;
});

botaoInstalar?.addEventListener("click", async () => {
  if (!eventoInstalacao) {
    alert('No Chrome, abra o menu ⋮ e escolha "Adicionar à tela inicial" ou "Instalar app".');
    return;
  }
  eventoInstalacao.prompt();
  await eventoInstalacao.userChoice;
  eventoInstalacao = null;
  botaoInstalar.hidden = true;
});

window.addEventListener("appinstalled", () => {
  eventoInstalacao = null;
  if (botaoInstalar) botaoInstalar.hidden = true;
});

const parametros = new URLSearchParams(window.location.search);
const compartilhado = [parametros.get("url"), parametros.get("text"), parametros.get("title")]
  .filter(Boolean).join(" ").match(/https?:\/\/[^\s]+/i)?.[0] || "";
const campoLink = document.querySelector("#link");

if (compartilhado && campoLink) {
  campoLink.value = compartilhado;
  campoLink.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector("#form-produto")?.scrollIntoView({ behavior: "smooth" });
  history.replaceState({}, "", window.location.pathname + window.location.hash);
}
