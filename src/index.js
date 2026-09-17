const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

const LIMITE_HTML = 6_000_000;

function responderJson(dados, status = 200) {
  return new Response(JSON.stringify(dados, null, 2), {
    status,
    headers: {
      ...CABECALHOS_CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function validarUrl(valor) {
  let url;

  try {
    url = new URL(valor);
  } catch {
    throw new Error("Link inválido.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Use um link que comece com http:// ou https://.");
  }

  const host = url.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    throw new Error("Esse endereço não é permitido.");
  }

  return url;
}

function detectarLoja(url) {
  const host = url.hostname.toLowerCase();

  if (host.includes("amazon.") || host.includes("amzn.to")) {
    return "Amazon";
  }

  if (host.includes("shopee.")) {
    return "Shopee";
  }

  if (
    host.includes("mercadolivre.") ||
    host.includes("mercadolibre.") ||
    host.includes("meli.la")
  ) {
    return "Mercado Livre";
  }

  if (host.includes("temu.")) {
    return "Temu";
  }

  if (host.includes("aliexpress.")) {
    return "AliExpress";
  }

  if (
    host.includes("magazineluiza.") ||
    host.includes("magalu.")
  ) {
    return "Magazine Luiza";
  }

  return "";
}

function textoLimpo(valor) {
  return String(valor ?? "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function primeiro(...valores) {
  return valores.find((valor) => textoLimpo(valor)) || "";
}

function capturarPrimeiro(texto, expressoes) {
  for (const expressao of expressoes) {
    const resultado = texto.match(expressao);

    if (resultado?.[1]) {
      return textoLimpo(resultado[1]);
    }
  }

  return "";
}

function normalizarPreco(valor, divisor = 1) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  const original = textoLimpo(valor);
  const limpo = original
    .replace(/R\$/gi, "")
    .replace(/[^\d.,-]/g, "")
    .trim();

  if (!limpo) {
    return "";
  }

  let numero;

  if (typeof valor === "number") {
    numero = valor / divisor;
  } else if (limpo.includes(",")) {
    numero = Number(
      limpo.replace(/\./g, "").replace(",", ".")
    );
  } else {
    numero = Number(limpo) / divisor;
  }

  if (!Number.isFinite(numero) || numero <= 0) {
    return "";
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function adicionarImagem(destino, imagem, baseUrl) {
  if (!imagem) {
    return;
  }

  try {
    const url = new URL(String(imagem), baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return;
    }

    destino.imagens.add(url.toString());
  } catch {
    // Ignora imagens inválidas.
  }
}

function encontrarMeta(html, chave) {
  const chaveEscapada = String(chave).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  return capturarPrimeiro(html, [
    new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${chaveEscapada}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${chaveEscapada}["'][^>]*>`,
      "i"
    )
  ]);
}

function extrairJsonLd(html, destino, baseUrl) {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const correspondencia of scripts) {
    const conteudo = correspondencia[1]?.trim();

    if (!conteudo) {
      continue;
    }

    try {
      const json = JSON.parse(conteudo);
      const fila = Array.isArray(json) ? [...json] : [json];

      while (fila.length) {
        const item = fila.shift();

        if (!item || typeof item !== "object") {
          continue;
        }

        if (Array.isArray(item["@graph"])) {
          fila.push(...item["@graph"]);
        }

        const tipos = Array.isArray(item["@type"])
          ? item["@type"]
          : [item["@type"]];

        if (
          !tipos.some(
            (tipo) => String(tipo).toLowerCase() === "product"
          )
        ) {
          continue;
        }

        destino.nome ||= textoLimpo(item.name);
        destino.descricao ||= textoLimpo(item.description);
        destino.categoria ||= textoLimpo(item.category);

        const imagens = Array.isArray(item.image)
          ? item.image
          : item.image
            ? [item.image]
            : [];

        for (const imagem of imagens) {
          adicionarImagem(
            destino,
            typeof imagem === "string"
              ? imagem
              : primeiro(imagem?.url, imagem?.contentUrl),
            baseUrl
          );
        }

        const ofertas = Array.isArray(item.offers)
          ? item.offers[0]
          : item.offers;

        if (ofertas) {
          destino.precoAtual ||= normalizarPreco(
            primeiro(ofertas.price, ofertas.lowPrice)
          );

          destino.precoAntigo ||= normalizarPreco(
            ofertas.highPrice
          );
        }

        if (item.aggregateRating) {
          destino.avaliacao ||= textoLimpo(
            item.aggregateRating.ratingValue
          );
        }
      }
    } catch {
      // Algumas páginas têm JSON-LD quebrado.
    }
  }
}

function extrairGenerico(html, destino, baseUrl) {
  destino.nome ||= primeiro(
    encontrarMeta(html, "og:title"),
    encontrarMeta(html, "twitter:title"),
    encontrarMeta(html, "name")
  );

  destino.descricao ||= primeiro(
    encontrarMeta(html, "og:description"),
    encontrarMeta(html, "description"),
    encontrarMeta(html, "twitter:description")
  );

  destino.categoria ||= primeiro(
    encontrarMeta(html, "product:category"),
    encontrarMeta(html, "category")
  );

  destino.precoAtual ||= normalizarPreco(
    primeiro(
      encontrarMeta(html, "product:price:amount"),
      encontrarMeta(html, "price"),
      encontrarMeta(html, "lowprice")
    )
  );

  destino.precoAntigo ||= normalizarPreco(
    primeiro(
      encontrarMeta(html, "product:original_price:amount"),
      encontrarMeta(html, "highprice")
    )
  );

  destino.avaliacao ||= primeiro(
    encontrarMeta(html, "ratingValue"),
    encontrarMeta(html, "rating")
  );

  [
    encontrarMeta(html, "og:image"),
    encontrarMeta(html, "og:image:url"),
    encontrarMeta(html, "twitter:image"),
    encontrarMeta(html, "image")
  ].forEach((imagem) =>
    adicionarImagem(destino, imagem, baseUrl)
  );

  extrairJsonLd(html, destino, baseUrl);
}

function extrairShopee(html, destino, baseUrl) {
  destino.nome ||= capturarPrimeiro(html, [
    /"name"\s*:\s*"((?:\\.|[^"\\])+)"/i,
    /"item_name"\s*:\s*"((?:\\.|[^"\\])+)"/i,
    /"product_name"\s*:\s*"((?:\\.|[^"\\])+)"/i
  ]);

  const precoAtualBruto = capturarPrimeiro(html, [
    /"price"\s*:\s*(\d{4,})/i,
    /"price_min"\s*:\s*(\d{4,})/i
  ]);

  if (precoAtualBruto && !destino.precoAtual) {
    const numero = Number(precoAtualBruto);
    const divisor = numero >= 100000 ? 100000 : 100;

    destino.precoAtual = normalizarPreco(numero, divisor);
  }

  const precoAntigoBruto = capturarPrimeiro(html, [
    /"price_before_discount"\s*:\s*(\d{4,})/i,
    /"price_max_before_discount"\s*:\s*(\d{4,})/i
  ]);

  if (precoAntigoBruto && !destino.precoAntigo) {
    const numero = Number(precoAntigoBruto);
    const divisor = numero >= 100000 ? 100000 : 100;

    destino.precoAntigo = normalizarPreco(numero, divisor);
  }

  destino.avaliacao ||= capturarPrimeiro(html, [
    /"rating_star"\s*:\s*([\d.]+)/i,
    /"rating_average"\s*:\s*([\d.]+)/i
  ]);

  destino.categoria ||= capturarPrimeiro(html, [
    /"category_name"\s*:\s*"((?:\\.|[^"\\])+)"/i
  ]);

  const ids = [
    ...html.matchAll(
      /"(?:image|image_id)"\s*:\s*"([a-zA-Z0-9_-]{20,})"/g
    )
  ];

  for (const item of ids.slice(0, 8)) {
    adicionarImagem(
      destino,
      `https://down-br.img.susercontent.com/file/${item[1]}`,
      baseUrl
    );
  }
}

function extrairAmazon(html, destino, baseUrl) {
  destino.nome ||= textoLimpo(
    capturarPrimeiro(html, [
      /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i
    ]).replace(/<[^>]+>/g, " ")
  );

  destino.precoAtual ||= normalizarPreco(
    capturarPrimeiro(html, [
      /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*R\$\s*([\d.,]+)/i,
      /"priceAmount"\s*:\s*([\d.]+)/i
    ])
  );

  destino.avaliacao ||= capturarPrimeiro(html, [
    /title=["']([\d,.]+)\s+de\s+5/i,
    /"ratingValue"\s*:\s*"?([\d.,]+)"?/i
  ]);

  const imagens = [
    ...html.matchAll(/"hiRes"\s*:\s*"([^"]+)"/gi)
  ];

  for (const item of imagens.slice(0, 8)) {
    adicionarImagem(destino, item[1], baseUrl);
  }
}

function extrairMercadoLivre(html, destino, baseUrl) {
  destino.nome ||= capturarPrimeiro(html, [
    /"title"\s*:\s*"((?:\\.|[^"\\])+)"/i,
    /"item_name"\s*:\s*"((?:\\.|[^"\\])+)"/i
  ]);

  destino.precoAtual ||= normalizarPreco(
    capturarPrimeiro(html, [
      /"price"\s*:\s*([\d.]+)/i,
      /"amount"\s*:\s*([\d.]+)/i
    ])
  );

  destino.avaliacao ||= capturarPrimeiro(html, [
    /"rating_average"\s*:\s*([\d.]+)/i,
    /"ratingValue"\s*:\s*"?([\d.]+)"?/i
  ]);

  const imagens = [
    ...html.matchAll(/"secure_url"\s*:\s*"([^"]+)"/gi)
  ];

  for (const item of imagens.slice(0, 8)) {
    adicionarImagem(destino, item[1], baseUrl);
  }
}

function extrairEspecifico(html, destino, baseUrl) {
  switch (destino.loja) {
    case "Shopee":
      extrairShopee(html, destino, baseUrl);
      break;
    case "Amazon":
      extrairAmazon(html, destino, baseUrl);
      break;
    case "Mercado Livre":
      extrairMercadoLivre(html, destino, baseUrl);
      break;
    default:
      break;
  }
}

async function buscarDireto(url) {
  const resposta = await fetch(url.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7"
    }
  });

  if (!resposta.ok) {
    throw new Error(`Resposta HTTP ${resposta.status}.`);
  }

  const html = await resposta.text();

  if (html.length > LIMITE_HTML) {
    throw new Error("Página grande demais.");
  }

  return {
    html,
    urlFinal: validarUrl(resposta.url || url.toString()),
    metodo: "fetch"
  };
}

async function buscarComNavegador(url, env) {
  if (!env.BROWSER) {
    throw new Error("Browser Run não está configurado.");
  }

  const resposta = await env.BROWSER.quickAction("content", {
    url: url.toString(),
    gotoOptions: {
      waitUntil: "networkidle2",
      timeout: 30000
    },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(
      `Browser Run respondeu com ${resposta.status}: ${erro.slice(0, 200)}`
    );
  }

  const html = await resposta.text();

  if (html.length > LIMITE_HTML) {
    throw new Error("Página renderizada grande demais.");
  }

  return {
    html,
    urlFinal: url,
    metodo: "browser"
  };
}

function montarProduto(html, urlOriginal, urlFinal) {
  const dados = {
    nome: "",
    descricao: "",
    loja:
      detectarLoja(urlFinal) ||
      detectarLoja(urlOriginal),
    categoria: "",
    precoAtual: "",
    precoAntigo: "",
    parcelas: "",
    avaliacao: "",
    imagens: new Set()
  };

  extrairGenerico(html, dados, urlFinal);
  extrairEspecifico(html, dados, urlFinal);

  dados.nome ||= capturarPrimeiro(html, [
    /<title[^>]*>([\s\S]*?)<\/title>/i
  ])
    .replace(/<[^>]+>/g, " ")
    .replace(
      /\s*[|–—-]\s*(Amazon|Shopee|Mercado Livre|Temu|AliExpress|Magazine Luiza).*$/i,
      ""
    );

  return {
    nome: textoLimpo(dados.nome),
    descricao: textoLimpo(dados.descricao),
    loja: dados.loja,
    categoria: textoLimpo(dados.categoria),
    precoAtual: dados.precoAtual,
    precoAntigo: dados.precoAntigo,
    parcelas: textoLimpo(dados.parcelas),
    avaliacao: textoLimpo(dados.avaliacao),
    imagens: [...dados.imagens].filter(Boolean).slice(0, 8),
    urlFinal: urlFinal.toString()
  };
}

function contarCampos(produto) {
  return [
    produto.nome,
    produto.loja,
    produto.precoAtual,
    produto.precoAntigo,
    produto.avaliacao,
    produto.categoria,
    produto.imagens.length
  ].filter(Boolean).length;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CABECALHOS_CORS
      });
    }

    if (request.method === "GET") {
      return responderJson({
        online: true,
        servico: "SmartDeals Importador v2",
        browserRun: Boolean(env.BROWSER)
      });
    }

    if (request.method !== "POST") {
      return responderJson(
        { erro: "Use uma requisição POST." },
        405
      );
    }

    try {
      const corpo = await request.json();
      const urlOriginal = validarUrl(corpo?.url);

      let pagina;
      let produto;
      let erroDireto = "";

      try {
        pagina = await buscarDireto(urlOriginal);
        produto = montarProduto(
          pagina.html,
          urlOriginal,
          pagina.urlFinal
        );
      } catch (erro) {
        erroDireto =
          erro instanceof Error ? erro.message : String(erro);
      }

      if (!produto || contarCampos(produto) < 4) {
        const paginaRenderizada = await buscarComNavegador(
          urlOriginal,
          env
        );

        const produtoRenderizado = montarProduto(
          paginaRenderizada.html,
          urlOriginal,
          paginaRenderizada.urlFinal
        );

        if (
          !produto ||
          contarCampos(produtoRenderizado) > contarCampos(produto)
        ) {
          pagina = paginaRenderizada;
          produto = produtoRenderizado;
        }
      }

      const camposEncontrados = contarCampos(produto);

      return responderJson({
        produto,
        parcial: camposEncontrados < 5,
        camposEncontrados,
        metodo: pagina?.metodo || "desconhecido",
        aviso:
          camposEncontrados < 3
            ? "A loja bloqueou ou ocultou grande parte das informações. Complete manualmente."
            : "",
        erroDireto
      });
    } catch (erro) {
      return responderJson(
        {
          erro:
            erro instanceof Error
              ? erro.message
              : "Não foi possível ler o produto."
        },
        400
      );
    }
  }
};
