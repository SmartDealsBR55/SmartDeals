const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

const LIMITE_HTML = 2_000_000;

function responderJson(dados, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      ...CABECALHOS_CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function hostnamePrivado(hostname) {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (!ipv4) {
    return false;
  }

  const partes = ipv4.slice(1).map(Number);

  if (partes.some((parte) => parte < 0 || parte > 255)) {
    return true;
  }

  const [a, b] = partes;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
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

  if (hostnamePrivado(url.hostname)) {
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
    .replace(/\s+/g, " ")
    .trim();
}

function primeiro(...valores) {
  return valores.find((valor) => textoLimpo(valor)) || "";
}

function normalizarPreco(valor) {
  const texto = textoLimpo(valor)
    .replace(/[^\d.,]/g, "")
    .trim();

  if (!texto) {
    return "";
  }

  if (texto.includes(",")) {
    return texto;
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return texto;
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function extrairProdutoJsonLd(valor, destino) {
  const texto = valor.trim();

  if (!texto) {
    return;
  }

  try {
    const json = JSON.parse(texto);
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

      if (!tipos.some((tipo) => String(tipo).toLowerCase() === "product")) {
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
        if (typeof imagem === "string") {
          destino.imagens.add(imagem);
        } else if (imagem?.url) {
          destino.imagens.add(imagem.url);
        }
      }

      const ofertas = Array.isArray(item.offers)
        ? item.offers[0]
        : item.offers;

      if (ofertas) {
        destino.precoAtual ||= normalizarPreco(
          primeiro(ofertas.price, ofertas.lowPrice)
        );
      }

      const avaliacao = item.aggregateRating;

      if (avaliacao) {
        destino.avaliacao ||= textoLimpo(avaliacao.ratingValue);
      }
    }
  } catch {
    // Muitas páginas têm scripts JSON-LD quebrados ou concatenados.
  }
}

class ColetorMeta {
  constructor(destino) {
    this.destino = destino;
  }

  element(elemento) {
    const propriedade = textoLimpo(
      primeiro(
        elemento.getAttribute("property"),
        elemento.getAttribute("name"),
        elemento.getAttribute("itemprop")
      )
    ).toLowerCase();

    const conteudo = textoLimpo(
      primeiro(
        elemento.getAttribute("content"),
        elemento.getAttribute("value")
      )
    );

    if (!propriedade || !conteudo) {
      return;
    }

    const d = this.destino;

    if (["og:title", "twitter:title", "name"].includes(propriedade)) {
      d.nome ||= conteudo;
    }

    if (["og:description", "description", "twitter:description"].includes(propriedade)) {
      d.descricao ||= conteudo;
    }

    if (["og:image", "og:image:url", "twitter:image", "image"].includes(propriedade)) {
      d.imagens.add(conteudo);
    }

    if (["product:price:amount", "price", "lowprice"].includes(propriedade)) {
      d.precoAtual ||= normalizarPreco(conteudo);
    }

    if (["product:original_price:amount", "highprice"].includes(propriedade)) {
      d.precoAntigo ||= normalizarPreco(conteudo);
    }

    if (["ratingvalue", "rating"].includes(propriedade)) {
      d.avaliacao ||= conteudo;
    }

    if (["category", "product:category"].includes(propriedade)) {
      d.categoria ||= conteudo;
    }
  }
}

class ColetorTitulo {
  constructor(destino) {
    this.destino = destino;
  }

  text(texto) {
    this.destino.tituloHtml += texto.text;
  }
}

class ColetorJsonLd {
  constructor(destino) {
    this.destino = destino;
    this.buffer = "";
  }

  text(texto) {
    this.buffer += texto.text;

    if (texto.lastInTextNode) {
      extrairProdutoJsonLd(this.buffer, this.destino);
      this.buffer = "";
    }
  }
}

async function buscarPagina(url) {
  const resposta = await fetch(url.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36 SmartDealsBot/1.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7"
    }
  });

  if (!resposta.ok) {
    throw new Error(`A loja respondeu com erro ${resposta.status}.`);
  }

  const tipo = resposta.headers.get("content-type") || "";

  if (!tipo.includes("text/html")) {
    throw new Error("O link não retornou uma página de produto em HTML.");
  }

  const tamanho = Number(resposta.headers.get("content-length") || 0);

  if (tamanho > LIMITE_HTML) {
    throw new Error("A página do produto é grande demais para leitura automática.");
  }

  return resposta;
}

async function extrairDados(resposta, urlOriginal) {
  const dados = {
    nome: "",
    descricao: "",
    loja: "",
    categoria: "",
    precoAtual: "",
    precoAntigo: "",
    parcelas: "",
    avaliacao: "",
    tituloHtml: "",
    imagens: new Set()
  };

  const urlFinal = validarUrl(resposta.url || urlOriginal.toString());
  dados.loja = detectarLoja(urlFinal) || detectarLoja(urlOriginal);

  await new HTMLRewriter()
    .on("meta", new ColetorMeta(dados))
    .on("title", new ColetorTitulo(dados))
    .on('script[type="application/ld+json"]', new ColetorJsonLd(dados))
    .transform(resposta)
    .arrayBuffer();

  dados.nome ||= textoLimpo(dados.tituloHtml)
    .replace(/\s*[|–—-]\s*(Amazon|Shopee|Mercado Livre|Temu|AliExpress|Magazine Luiza).*$/i, "")
    .trim();

  const imagens = [...dados.imagens]
    .filter((imagem) => {
      try {
        const url = new URL(imagem, urlFinal);
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    })
    .map((imagem) => new URL(imagem, urlFinal).toString())
    .slice(0, 8);

  return {
    nome: dados.nome,
    descricao: dados.descricao,
    loja: dados.loja,
    categoria: dados.categoria,
    precoAtual: dados.precoAtual,
    precoAntigo: dados.precoAntigo,
    parcelas: dados.parcelas,
    avaliacao: dados.avaliacao,
    imagens,
    urlFinal: urlFinal.toString()
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CABECALHOS_CORS
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
      const url = validarUrl(corpo?.url);
      const resposta = await buscarPagina(url);
      const produto = await extrairDados(resposta, url);

      const camposEncontrados = [
        produto.nome,
        produto.loja,
        produto.precoAtual,
        produto.precoAntigo,
        produto.avaliacao,
        produto.categoria,
        produto.imagens.length
      ].filter(Boolean).length;

      return responderJson({
        produto,
        parcial: camposEncontrados < 5,
        camposEncontrados
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
