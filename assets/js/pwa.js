let eventoInstalacao = null;
const botaoInstalar = document.querySelector("#botao-instalar-app");
const instaladoComoAplicativo = window.matchMedia("(display-mode: standalone)").matches
  || window.navigator.standalone === true;

if (botaoInstalar && instaladoComoAplicativo) {
  botaoInstalar.hidden = true;
}

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
const tituloCompartilhado = parametros.get("title") || "";
const textoCompartilhado = parametros.get("text") || "";
const urlCompartilhada = parametros.get("url") || "";
const conteudoCompartilhado = [urlCompartilhada, textoCompartilhado, tituloCompartilhado]
  .filter(Boolean).join(" ");
const compartilhado = conteudoCompartilhado.match(/https?:\/\/[^\s]+/i)?.[0] || "";
const campoLink = document.querySelector("#link");

if (conteudoCompartilhado) {
  const dadosCompartilhados = {
    title: tituloCompartilhado,
    text: textoCompartilhado,
    url: compartilhado || urlCompartilhada,
    recebidoEm: Date.now()
  };

  sessionStorage.setItem(
    "smartdeals:compartilhamento",
    JSON.stringify(dadosCompartilhados)
  );

  if (compartilhado && campoLink) {
    campoLink.value = compartilhado;
    campoLink.dispatchEvent(new Event("input", { bubbles: true }));
  }

  window.dispatchEvent(new CustomEvent(
    "smartdeals:compartilhamento-recebido",
    { detail: dadosCompartilhados }
  ));

  document.querySelector("#form-produto")?.scrollIntoView({ behavior: "smooth" });
  history.replaceState({}, "", window.location.pathname + window.location.hash);
}
