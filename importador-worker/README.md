# Importador de produtos do SmartDeals

Este Worker recebe um link de afiliado, segue o redirecionamento e tenta extrair metadados públicos da página: nome, loja, preços, imagens, avaliação e categoria.

Ele não burla bloqueios das lojas. Se a loja esconder ou bloquear um campo, o painel continua permitindo preencher o restante manualmente.

## Publicar

Abra o terminal dentro desta pasta e rode:

```powershell
npm.cmd install
npx.cmd wrangler login
npm.cmd run deploy
```

No final, o terminal mostrará uma URL parecida com:

```text
https://smartdeals-importador.seuusuario.workers.dev
```

Copie essa URL e cole em:

```text
assets/js/admin.js
```

Substituindo:

```js
const URL_IMPORTADOR_PRODUTOS =
  "COLE_AQUI_A_URL_DO_WORKER";
```

Depois reinicie o site com `npm.cmd run dev` e teste no painel administrativo.
