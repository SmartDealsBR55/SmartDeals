const CACHE = "smartdeals-ia-v3";
const ESSENCIAIS = ["./", "./index.html", "./pages/admin.html", "./pages/login.html", "./manifest.webmanifest"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(caches.keys().then((chaves) => Promise.all(
    chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;

  if (evento.request.mode === "navigate") {
    evento.respondWith(fetch(evento.request).then((resposta) => {
      const copia = resposta.clone();
      caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
      return resposta;
    }).catch(() => caches.match(evento.request).then((resposta) => resposta || caches.match("./pages/admin.html"))));
    return;
  }

  if (new URL(evento.request.url).origin !== self.location.origin) return;
  evento.respondWith(caches.match(evento.request).then((armazenada) => {
    const atualizacao = fetch(evento.request).then((resposta) => {
      if (resposta.ok) caches.open(CACHE).then((cache) => cache.put(evento.request, resposta.clone()));
      return resposta;
    });
    return armazenada || atualizacao;
  }));
});
