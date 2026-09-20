import { db, auth, storage } from "./firebase.js";
import { analisarTextoOferta } from "./texto-oferta.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  getDownloadURL,
  ref,
  uploadBytesResumable
} from "firebase/storage";

/* =========================
   ELEMENTOS DA PÁGINA
========================= */

const formulario = document.querySelector("#form-produto");
const listaProdutos = document.querySelector("#lista-produtos");
const contadorProdutos = document.querySelector("#contador-produtos");

const produtoId = document.querySelector("#produto-id");

const tituloFormulario = document.querySelector(
  "#titulo-formulario"
);

const descricaoFormulario = document.querySelector(
  "#descricao-formulario"
);

const indicadorEdicao = document.querySelector(
  "#indicador-edicao"
);

const mensagemFormulario = document.querySelector(
  "#mensagem-formulario"
);

const botaoPublicar = document.querySelector(
  "#botao-publicar"
);

const botaoCancelarEdicao = document.querySelector(
  "#botao-cancelar-edicao"
);

const botaoAtualizarProdutos = document.querySelector(
  "#botao-atualizar-produtos"
);

const botaoReclassificarProdutos = document.querySelector(
  "#botao-reclassificar-produtos"
);

const campoPrecoAntigo = document.querySelector(
  "#preco-antigo"
);

const campoPrecoAtual = document.querySelector(
  "#preco-atual"
);

const botaoBuscarInformacoes = document.querySelector(
  "#botao-buscar-informacoes"
);

const resultadoImportacao = document.querySelector(
  "#resultado-importacao"
);

const campoArquivosImagens = document.querySelector("#arquivos-imagens");
const botaoSelecionarImagens = document.querySelector("#botao-selecionar-imagens");
const previsualizacaoImagens = document.querySelector("#previsualizacao-imagens");
const contadorImagens = document.querySelector("#contador-imagens");

/*
 * Depois de publicar o Cloudflare Worker, cole a URL aqui.
 * Exemplo: https://smartdeals-importador.seuusuario.workers.dev
 */
const URL_IMPORTADOR_PRODUTOS =
  "https://smartdeals-importador.gabriel-d-blaut.workers.dev";

let produtos = [];
let produtoEmEdicao = null;
let linkDaUltimaBusca = "";
let arquivosImagensSelecionados = [];

const LIMITE_IMAGENS = 4;
const DIMENSAO_MAXIMA_IMAGEM = 1000;
const TEMPO_LIMITE_UPLOAD = 120000;

function limparDadosDaBuscaAnterior() {
  if (produtoEmEdicao) return;

  for (const seletor of [
    "#nome", "#loja", "#categoria", "#preco-atual", "#preco-antigo",
    "#imagens", "#parcelas", "#avaliacao", "#economia", "#score", "#badge"
  ]) {
    definirValor(seletor, "");
  }

  arquivosImagensSelecionados = [];
  atualizarPrevisualizacaoImagens();

  esconderResultadoImportacao();
}

function nomeDeProdutoValido(nome) {
  const texto = String(nome || "").trim();
  if (/^temu\s*:\s*compre como um bilion[aá]rio\b/i.test(texto)) return "";
  return texto;
}

/* =========================
   AUTENTICAÇÃO
========================= */

onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    window.location.href = new URL("./login.html", window.location.href).href;
    return;
  }

  carregarProdutos();
});

/* =========================
   FUNÇÕES GERAIS
========================= */

function obterElemento(seletor) {
  return document.querySelector(seletor);
}

function obterValor(seletor) {
  const elemento = obterElemento(seletor);

  if (!elemento) {
    return "";
  }

  return elemento.value.trim();
}

function definirValor(seletor, valor) {
  const elemento = obterElemento(seletor);

  if (!elemento) {
    return;
  }

  elemento.value = valor ?? "";
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mostrarMensagem(texto, tipo = "erro") {
  if (!mensagemFormulario) {
    alert(texto);
    return;
  }

  mensagemFormulario.hidden = false;
  mensagemFormulario.textContent = texto;

  mensagemFormulario.classList.remove(
    "sucesso",
    "erro"
  );

  mensagemFormulario.classList.add(tipo);
}

function esconderMensagem() {
  if (!mensagemFormulario) {
    return;
  }

  mensagemFormulario.hidden = true;
  mensagemFormulario.textContent = "";

  mensagemFormulario.classList.remove(
    "sucesso",
    "erro"
  );
}

function mostrarResultadoImportacao(texto, tipo = "aviso") {
  if (!resultadoImportacao) {
    return;
  }

  resultadoImportacao.hidden = false;
  resultadoImportacao.textContent = texto;
  resultadoImportacao.classList.remove(
    "sucesso",
    "aviso",
    "erro"
  );
  resultadoImportacao.classList.add(tipo);
}

function esconderResultadoImportacao() {
  if (!resultadoImportacao) {
    return;
  }

  resultadoImportacao.hidden = true;
  resultadoImportacao.textContent = "";
  resultadoImportacao.classList.remove(
    "sucesso",
    "aviso",
    "erro"
  );
}

/* =========================
   FORMATAÇÃO DE MOEDA
========================= */

function formatarMoedaPorDigitos(valor) {
  const apenasNumeros = String(valor ?? "")
    .replace(/\D/g, "");

  if (!apenasNumeros) {
    return "";
  }

  const numero = Number(apenasNumeros) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function converterMoedaParaNumero(valor) {
  const texto = String(valor ?? "")
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function formatarMoedaExistente(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return "";
  }

  if (texto.includes("R$")) {
    const numero = converterMoedaParaNumero(texto);

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  /*
   * Compatibilidade com produtos antigos:
   * "179,90" vira "R$ 179,90"
   * "1.299,90" vira "R$ 1.299,90"
   */
  if (texto.includes(",") || texto.includes(".")) {
    let numero;

    if (texto.includes(",")) {
      numero = Number(
        texto
          .replace(/\./g, "")
          .replace(",", ".")
      );
    } else {
      numero = Number(texto);
    }

    if (Number.isFinite(numero)) {
      return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    }
  }

  return formatarMoedaPorDigitos(texto);
}

function aplicarMascaraMoeda(campo) {
  if (!campo) {
    return;
  }

  campo.addEventListener("input", () => {
    campo.value = formatarMoedaPorDigitos(
      campo.value
    );
  });

  campo.addEventListener("blur", () => {
    if (campo.value) {
      campo.value = formatarMoedaExistente(
        campo.value
      );
    }
  });
}

aplicarMascaraMoeda(campoPrecoAntigo);
aplicarMascaraMoeda(campoPrecoAtual);

/* =========================
   SELECTS E COMPATIBILIDADE
========================= */

function selecionarOpcao(seletor, valor) {
  const select = obterElemento(seletor);
  const texto = String(valor ?? "").trim();

  if (!select) {
    return;
  }

  if (!texto) {
    select.value = "";
    return;
  }

  const opcaoExistente = Array.from(
    select.options
  ).find((opcao) => opcao.value === texto);

  if (!opcaoExistente) {
    const novaOpcao = document.createElement("option");

    novaOpcao.value = texto;
    novaOpcao.textContent = texto;
    select.appendChild(novaOpcao);
  }

  select.value = texto;
}

/* =========================
   IMPORTAÇÃO PELO LINK
========================= */

function normalizarTextoCategoria(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const REGRAS_CATEGORIA_ADMIN = [
  ["Bebê & Infantil", [
    "bebe", "berco", "bercinho", "mosquiteiro", "mamadeira", "chupeta",
    "fralda", "carrinho de bebe", "cadeira de bebe", "banheira bebe",
    "maternidade", "infantil", "crianca"
  ]],
  ["Beleza", [
    "maquiagem", "batom", "base facial", "rimel", "mascara de cilios",
    "perfume", "hidratante", "skincare", "creme facial", "oleo capilar",
    "oleo de cabelo", "shampoo", "condicionador", "secador", "chapinha",
    "barbeador", "depilador", "unha", "esmalte", "cabelo"
  ]],
  ["Moda", [
    "corta vento", "corta-vento", "jaqueta", "casaco", "calcinha", "lingerie", "sutia", "biquini", "maio", "cueca",
      "meia", "meias", "soquete", "meia soquete", "kit de meias", "short",
    "shorts", "bermuda", "calca", "jeans", "legging", "vestido", "saia",
    "camisa", "camiseta", "blusa", "pijama", "tenis", "chinelo", "sandalia",
    "sapato", "bolsa", "mochila", "carteira", "oculos", "relogio", "anel",
    "alianca", "colar", "pulseira", "moda feminina", "moda masculina", "roupa"
  ]],
  ["Games", [
    "playstation", "ps4", "ps5", "xbox", "nintendo", "switch", "controle gamer",
    "joystick", "gamepad", "gamer", "console", "headset gamer"
  ]],
  ["Informática", [
    "notebook", "laptop", "computador", "pc gamer", "monitor", "teclado", "mouse",
    "webcam", "ssd", "hd externo", "pendrive", "roteador", "impressora",
    "memoria ram", "placa de video", "gabinete", "hub usb", "adaptador usb"
  ]],
  ["Eletrônicos", [
    "celular", "smartphone", "fone", "bluetooth", "carregador", "power bank",
    "caixa de som", "smartwatch", "tablet", "camera", "microfone", "televisao",
    "projetor", "cabo usb", "lightning", "tipo-c", "type-c"
  ]],
  ["Esportes", [
    "halter", "musculacao", "bicicleta", "bike", "bola de futebol", "volei",
    "basquete", "yoga", "equipamento fitness", "equipamento academia"
  ]],
  ["Pets", [
    "pet", "cachorro", "gato", "racao", "coleira", "arranhador", "comedouro",
    "bebedouro pet", "areia gato", "casinha pet", "brinquedo pet"
  ]],
  ["Automotivo", [
    "automotivo", "veiculo", "motocicleta", "pneu", "volante", "farol",
    "lampada automotiva", "tapete carro", "suporte veicular", "compressor de pneu"
  ]],
  ["Ferramentas", [
    "furadeira", "parafusadeira", "chave catraca", "jogo de chave", "alicate",
    "martelo", "serra", "broca", "ferramenta", "multimetro", "soprador",
    "esmerilhadeira"
  ]],
  ["Casa & Cozinha", [
    "cozinha", "panela", "frigideira", "omeleteira", "chaleira", "torneira",
    "ralador", "fatiador", "cortador", "pote", "marmita", "lixeira", "escorredor",
    "organizador", "prateleira", "cama", "travesseiro", "lencol", "toalha",
    "tapete", "papel de parede", "decoracao", "decoracoes", "decorativo",
    "vaso", "vasos", "vasilha", "vasilhas", "utensilio", "utensilios",
    "casa e construcao", "casa & construcao", "porta retrato", "porta chaves",
    "ventilador", "luminaria", "sanduicheira", "mixer", "liquidificador",
    "cafeteira", "air fryer", "aspirador", "cabide"
  ]]
];

function categoriaInteligentePorTexto(valor, categoriaAtual = "") {
  const texto = normalizarTextoCategoria(valor);

  for (const [categoria, termos] of REGRAS_CATEGORIA_ADMIN) {
    if (termos.some((termo) => texto.includes(normalizarTextoCategoria(termo)))) {
      return categoria;
    }
  }

  const original = normalizarTextoCategoria(categoriaAtual);
  const aliases = {
    casa: "Casa & Cozinha",
    "casa e cozinha": "Casa & Cozinha",
    "casa & cozinha": "Casa & Cozinha",
    eletronicos: "Eletrônicos",
    informatica: "Informática",
    game: "Games",
    games: "Games",
    moda: "Moda",
    beleza: "Beleza",
    esporte: "Esportes",
    esportes: "Esportes",
    pet: "Pets",
    pets: "Pets",
    automotivo: "Automotivo",
    ferramenta: "Ferramentas",
    ferramentas: "Ferramentas",
    bebe: "Bebê & Infantil",
    infantil: "Bebê & Infantil",
    outros: "Outros"
  };

  return aliases[original] || categoriaAtual || "Outros";
}

function normalizarCategoriaImportada(valor, contexto = "") {
  if (![valor, contexto].some((parte) => String(parte || "").trim())) {
    return "";
  }
  const textoCombinado = [valor, contexto].filter(Boolean).join(" ");
  const categoria = categoriaInteligentePorTexto(textoCombinado, valor);

  // "Outros" não deve encerrar a classificação quando ainda temos
  // nome/descrição do produto para analisar.
  if (categoria === "Outros" && contexto) {
    const alternativa = categoriaInteligentePorTexto(contexto, "");
    return alternativa === "Outros" ? "" : alternativa;
  }

  return categoria === "Outros" ? "" : categoria;
}

function preencherSeVazio(seletor, valor) {
  if (valor === null || valor === undefined || valor === "") {
    return false;
  }

  const elemento = obterElemento(seletor);

  if (!elemento || elemento.value.trim()) {
    return false;
  }

  elemento.value = String(valor).trim();
  return true;
}

function preencherSelectSeVazio(seletor, valor) {
  if (!valor) {
    return false;
  }

  const select = obterElemento(seletor);

  if (!select || select.value) {
    return false;
  }

  selecionarOpcao(seletor, valor);
  return true;
}

function aplicarDadosImportados(dados) {
  const preenchidos = [];

  if (preencherSeVazio("#nome", nomeDeProdutoValido(dados.nome))) {
    preenchidos.push("nome");
  }

  if (preencherSelectSeVazio("#loja", dados.loja)) {
    preenchidos.push("loja");
  }

  const contextoCategoria = [
    dados.categoria,
    dados.categoriaOrigem,
    dados.sourceCategory,
    dados.subcategoria,
    dados.nome,
    dados.descricao
  ].filter(Boolean).join(" ");

  const categoria = normalizarCategoriaImportada(
    dados.categoria || dados.categoriaOrigem || dados.sourceCategory || "",
    contextoCategoria
  );

  if (preencherSelectSeVazio("#categoria", categoria)) {
    preenchidos.push("categoria");
  }

  if (dados.precoAtual && !campoPrecoAtual.value) {
    campoPrecoAtual.value = formatarMoedaExistente(
      dados.precoAtual
    );
    preenchidos.push("preço atual");
  }

  if (dados.precoAntigo && !campoPrecoAntigo.value) {
    campoPrecoAntigo.value = formatarMoedaExistente(
      dados.precoAntigo
    );
    preenchidos.push("preço antigo");
  }

  if (preencherSeVazio("#parcelas", dados.parcelas)) {
    preenchidos.push("parcelamento");
  }

  if (preencherSeVazio("#avaliacao", dados.avaliacao)) {
    preenchidos.push("avaliação");
  }

  const imagens = Array.isArray(dados.imagens)
    ? dados.imagens.filter(Boolean)
    : [];

  if (imagens.length > 0 && !obterValor("#imagens")) {
    definirValor("#imagens", imagens.slice(0, LIMITE_IMAGENS).join("\n"));
    atualizarPrevisualizacaoImagens();
    preenchidos.push(
      `${imagens.length} imagem${imagens.length === 1 ? "" : "s"}`
    );
  }

  return preenchidos;
}

async function buscarInformacoesProduto() {
  const link = obterValor("#link");

  esconderMensagem();
  esconderResultadoImportacao();

  if (!link) {
    mostrarResultadoImportacao(
      "Cole primeiro o link de afiliado do produto.",
      "erro"
    );
    return;
  }

  if (linkDaUltimaBusca && link !== linkDaUltimaBusca) {
    limparDadosDaBuscaAnterior();
  }
  linkDaUltimaBusca = link;

  if (URL_IMPORTADOR_PRODUTOS.includes("COLE_AQUI")) {
    mostrarResultadoImportacao(
      "O importador ainda não foi conectado. Publique o Worker e cole a URL dele no arquivo admin.js.",
      "erro"
    );
    return;
  }

  const textoOriginal = botaoBuscarInformacoes.textContent;

  try {
    botaoBuscarInformacoes.disabled = true;
    botaoBuscarInformacoes.textContent = "Buscando...";

    mostrarResultadoImportacao(
      "Abrindo o link e procurando as informações do produto...",
      "aviso"
    );

    const resposta = await fetch(URL_IMPORTADOR_PRODUTOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: link })
    });

    const retorno = await resposta.json().catch(() => ({}));

    if (obterValor("#link") !== link) {
      return;
    }

    if (!resposta.ok) {
      throw new Error(
        retorno.erro ||
          "Não foi possível consultar esse produto."
      );
    }

    const preenchidos = aplicarDadosImportados(
      retorno.produto || {}
    );

    const faltando = [
      ["nome", obterValor("#nome")],
      ["categoria", obterValor("#categoria")],
      ["preço atual", obterValor("#preco-atual")],
      ["imagem", obterValor("#imagens")]
    ].filter(([, valor]) => !valor).map(([nome]) => nome);

    if (faltando.length > 0) {
      mostrarResultadoImportacao(
        `A loja não forneceu todos os dados. Complete manualmente: ${faltando.join(", ")}. Confira também loja e categoria antes de publicar.`,
        "aviso"
      );
      return;
    }

    mostrarResultadoImportacao(
      `Encontrado automaticamente: ${preenchidos.join(", ")}. Confira os dados e complete o que estiver faltando.`,
      retorno.parcial ? "aviso" : "sucesso"
    );
  } catch (erro) {
    console.error("Erro ao importar produto:", erro);

    mostrarResultadoImportacao(
      erro.message ||
        "Não foi possível buscar as informações. Você ainda pode preencher o produto manualmente.",
      "erro"
    );
  } finally {
    botaoBuscarInformacoes.disabled = false;
    botaoBuscarInformacoes.textContent = textoOriginal;
  }
}

/* =========================
   IMAGENS
========================= */

function obterImagensDoFormulario() {
  const conteudo = obterValor("#imagens");

  return conteudo
    .split(/\r?\n/)
    .map((imagem) => imagem.trim())
    .filter((imagem) => imagem.length > 0);
}

function obterImagensProduto(produto) {
  if (
    Array.isArray(produto.imagens) &&
    produto.imagens.length > 0
  ) {
    return produto.imagens;
  }

  if (produto.imagem) {
    return [produto.imagem];
  }

  return [];
}

function atualizarPrevisualizacaoImagens() {
  if (!previsualizacaoImagens) return;

  const imagensSalvas = obterImagensDoFormulario();
  const total = imagensSalvas.length + arquivosImagensSelecionados.length;

  if (contadorImagens) {
    contadorImagens.textContent = `${total} de ${LIMITE_IMAGENS} imagens`;
  }

  if (total === 0) {
    previsualizacaoImagens.innerHTML =
      '<p class="mensagem-sem-imagens">Nenhuma imagem selecionada.</p>';
    return;
  }

  const itensSalvos = imagensSalvas.map((url, indice) => ({
    url,
    tipo: "url",
    indice,
    nome: `Imagem ${indice + 1}`
  }));

  const itensNovos = arquivosImagensSelecionados.map((arquivo, indice) => ({
    url: URL.createObjectURL(arquivo),
    tipo: "arquivo",
    indice,
    nome: arquivo.name,
    temporaria: true
  }));

  previsualizacaoImagens.innerHTML = [...itensSalvos, ...itensNovos]
    .map((item, indiceGeral) => `
      <div class="preview-imagem ${indiceGeral === 0 ? "preview-imagem-principal" : ""}">
        <img src="${escaparHtml(item.url)}" alt="${escaparHtml(item.nome)}">
        <button
          class="botao-remover-imagem"
          type="button"
          data-tipo="${item.tipo}"
          data-indice="${item.indice}"
          aria-label="Remover ${escaparHtml(item.nome)}"
          title="Remover imagem"
        >×</button>
      </div>
    `).join("");

  if (itensNovos.length) {
    previsualizacaoImagens.querySelectorAll('img[src^="blob:"]').forEach((imagem) => {
      imagem.addEventListener("load", () => URL.revokeObjectURL(imagem.src), { once: true });
    });
  }
}

function selecionarArquivosImagens(listaArquivos) {
  const imagensSalvas = obterImagensDoFormulario();
  const vagas = LIMITE_IMAGENS - imagensSalvas.length - arquivosImagensSelecionados.length;
  const arquivos = Array.from(listaArquivos || []);

  if (vagas <= 0) {
    mostrarMensagem(`O limite é de ${LIMITE_IMAGENS} imagens por produto.`);
    return;
  }

  const imagensValidas = arquivos.filter((arquivo) => arquivo.type.startsWith("image/"));

  if (imagensValidas.length !== arquivos.length) {
    mostrarMensagem("Alguns arquivos não foram adicionados porque não são imagens.");
  } else {
    esconderMensagem();
  }

  arquivosImagensSelecionados.push(...imagensValidas.slice(0, vagas));

  if (imagensValidas.length > vagas) {
    mostrarMensagem(`Foram adicionadas apenas ${vagas} imagens para respeitar o limite de ${LIMITE_IMAGENS}.`);
  }

  if (campoArquivosImagens) campoArquivosImagens.value = "";
  atualizarPrevisualizacaoImagens();
}

function extensaoDaImagem(arquivo) {
  const extensoes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif"
  };

  return extensoes[arquivo.type] || "jpg";
}

async function compactarImagem(arquivo) {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, DIMENSAO_MAXIMA_IMAGEM / Math.max(bitmap.width, bitmap.height));
    const largura = Math.max(1, Math.round(bitmap.width * escala));
    const altura = Math.max(1, Math.round(bitmap.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext("2d", { alpha: false });
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, largura, altura);
    contexto.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (resultado) => resultado ? resolve(resultado) : reject(new Error("Falha ao preparar a imagem.")),
        "image/webp",
        0.82
      );
    });

    return new File(
      [blob],
      `${arquivo.name.replace(/\.[^.]+$/, "")}.webp`,
      { type: "image/webp", lastModified: Date.now() }
    );
  } catch (erro) {
    console.warn("A imagem será enviada no formato original:", erro);
    return arquivo;
  }
}

function enviarArquivoComProgresso(referencia, arquivo, indice, total) {
  return new Promise((resolve, reject) => {
    const tarefa = uploadBytesResumable(referencia, arquivo, { contentType: arquivo.type });
    const temporizador = setTimeout(() => {
      reject(new Error("O armazenamento não concluiu o envio em 2 minutos. Confira no Firebase se o Storage está ativado, o bucket está correto e sua conta tem permissão. Os dados continuam no formulário."));
      tarefa.cancel();
    }, TEMPO_LIMITE_UPLOAD);

    tarefa.on(
      "state_changed",
      (snapshot) => {
        const percentual = Math.max(0, Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        ));
        botaoPublicar.textContent = snapshot.bytesTransferred === 0
          ? `Conectando ao armazenamento (${indice + 1}/${total})...`
          : `Imagem ${indice + 1}/${total}: ${percentual}%`;
      },
      (erro) => {
        clearTimeout(temporizador);
        reject(erro);
      },
      () => {
        clearTimeout(temporizador);
        resolve(tarefa.snapshot);
      }
    );
  });
}

function arquivoParaDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível preparar uma das fotos."));
    leitor.readAsDataURL(arquivo);
  });
}

async function enviarImagensSelecionadas() {
  const urls = [];
  for (let indice = 0; indice < arquivosImagensSelecionados.length; indice += 1) {
    botaoPublicar.textContent = `Preparando imagem ${indice + 1}/${arquivosImagensSelecionados.length}...`;
    const arquivo = await compactarImagem(arquivosImagensSelecionados[indice]);
    const url = await arquivoParaDataUrl(arquivo);
    if (url.length > 180000) {
      throw new Error("Uma foto ainda ficou grande demais. Escolha uma foto com menos detalhes ou faça um recorte antes de publicar.");
    }
    urls.push(url);
  }
  return urls;
}

/* =========================
   MONTAGEM E VALIDAÇÃO
========================= */

function montarProduto() {
  const imagens = obterImagensDoFormulario();
  const validade = obterDatasValidade();

  return {
    nome: obterValor("#nome"),
    loja: obterValor("#loja"),
    categoria: obterValor("#categoria"),

    precoAntigo: formatarMoedaExistente(
      obterValor("#preco-antigo")
    ),

    precoAtual: formatarMoedaExistente(
      obterValor("#preco-atual")
    ),

    parcelas: obterValor("#parcelas"),
    avaliacao: obterValor("#avaliacao"),
    economia: obterValor("#economia"),
    score: obterValor("#score"),
    badge: obterValor("#badge"),

    imagens,

    // Mantém compatibilidade com o site
    imagem: imagens[0] || "",

    link: obterValor("#link"),
    expiraEm: validade.expiraEm,
    excluirEm: validade.excluirEm
  };
}

function obterDatasValidade() {
  const prazo = obterValor("#prazo-publicacao") || "30";
  if (prazo === "0") return { expiraEm: null, excluirEm: null };

  let vencimento;
  if (prazo === "personalizado") {
    const data = obterValor("#data-expiracao");
    if (!data) return { expiraEm: null, excluirEm: null };
    vencimento = new Date(`${data}T23:59:59`);
  } else {
    vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + Number(prazo));
  }

  const exclusao = new Date(vencimento);
  exclusao.setDate(exclusao.getDate() + 7);
  return {
    expiraEm: Timestamp.fromDate(vencimento),
    excluirEm: Timestamp.fromDate(exclusao)
  };
}

function converterTimestampEmData(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === "function") return valor.toDate();
  if (valor.seconds) return new Date(valor.seconds * 1000);
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function descricaoValidade(produto) {
  const data = converterTimestampEmData(produto.expiraEm);
  if (!data) return "Sem prazo";
  const vencido = data.getTime() <= Date.now();
  return `${vencido ? "Vencido" : "Válido até"} ${data.toLocaleDateString("pt-BR")}`;
}

function validarProduto(produto) {
  if (!produto.nome) {
    mostrarMensagem("Digite o nome do produto.");
    return false;
  }

  if (!produto.loja) {
    mostrarMensagem("Selecione a loja.");
    return false;
  }

  if (!produto.categoria) {
    mostrarMensagem("Selecione a categoria.");
    return false;
  }

  if (!produto.precoAtual) {
    mostrarMensagem("Digite o preço atual.");
    return false;
  }

  if (
    converterMoedaParaNumero(produto.precoAtual) <= 0
  ) {
    mostrarMensagem(
      "Digite um preço atual válido."
    );

    return false;
  }

  if (produto.imagens.length === 0 && arquivosImagensSelecionados.length === 0) {
    mostrarMensagem(
      "Adicione pelo menos uma imagem do produto."
    );

    return false;
  }

  if (!produto.link) {
    mostrarMensagem("Digite o link de afiliado.");
    return false;
  }

  return true;
}

function normalizarLinkParaComparacao(valor) {
  try {
    const url = new URL(String(valor || "").trim());
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(valor || "").trim().replace(/\/$/, "").toLowerCase();
  }
}

function encontrarProdutoDuplicado(produto) {
  const link = normalizarLinkParaComparacao(produto.link);
  const nome = normalizarTextoCategoria(produto.nome);
  const loja = normalizarTextoCategoria(produto.loja);

  return produtos.find((existente) => {
    if (existente.id === produtoEmEdicao?.id) return false;
    const mesmoLink = link && normalizarLinkParaComparacao(existente.link) === link;
    const mesmoProduto = nome
      && normalizarTextoCategoria(existente.nome) === nome
      && normalizarTextoCategoria(existente.loja) === loja;
    return mesmoLink || mesmoProduto;
  });
}

/* =========================
   NOVO PRODUTO / EDIÇÃO
========================= */

function ativarModoEdicao(produto) {
  produtoEmEdicao = produto;
  produtoId.value = produto.id;

  definirValor("#nome", produto.nome);

  selecionarOpcao("#loja", produto.loja);
  selecionarOpcao(
    "#categoria",
    produto.categoria
  );

  definirValor(
    "#preco-antigo",
    formatarMoedaExistente(produto.precoAntigo)
  );

  definirValor(
    "#preco-atual",
    formatarMoedaExistente(produto.precoAtual)
  );

  definirValor("#parcelas", produto.parcelas);
  definirValor("#avaliacao", produto.avaliacao);

  selecionarOpcao(
    "#economia",
    produto.economia
  );

  definirValor("#score", produto.score);

  selecionarOpcao(
    "#badge",
    produto.badge
  );

  definirValor("#link", produto.link);

  const dataExpiracao = converterTimestampEmData(produto.expiraEm);
  if (dataExpiracao) {
    selecionarOpcao("#prazo-publicacao", "personalizado");
    definirValor("#data-expiracao", dataExpiracao.toISOString().slice(0, 10));
    obterElemento("#campo-data-expiracao").hidden = false;
  } else {
    selecionarOpcao("#prazo-publicacao", "0");
    obterElemento("#campo-data-expiracao").hidden = true;
  }

  const imagens = obterImagensProduto(produto);

  definirValor(
    "#imagens",
    imagens.join("\n")
  );
  arquivosImagensSelecionados = [];
  atualizarPrevisualizacaoImagens();

  tituloFormulario.textContent =
    "Editar produto";

  descricaoFormulario.textContent =
    `Editando: ${produto.nome}`;

  indicadorEdicao.hidden = false;

  botaoPublicar.textContent =
    "Salvar alterações";

  botaoCancelarEdicao.hidden = false;

  esconderMensagem();

  formulario.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  obterElemento("#nome")?.focus();
}

function cancelarEdicao() {
  produtoEmEdicao = null;
  linkDaUltimaBusca = "";
  produtoId.value = "";

  formulario.reset();
  arquivosImagensSelecionados = [];
  definirValor("#imagens", "");
  atualizarPrevisualizacaoImagens();

  tituloFormulario.textContent =
    "Novo produto";

  descricaoFormulario.textContent =
    "Cadastre uma nova oferta no SmartDeals.";

  indicadorEdicao.hidden = true;

  botaoPublicar.textContent =
    "Publicar produto";

  botaoCancelarEdicao.hidden = true;

  esconderMensagem();
  esconderResultadoImportacao();
}

async function publicarProduto(produto) {
  await addDoc(
    collection(db, "produtos"),
    {
      ...produto,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    }
  );
}

async function atualizarProduto(id, produto) {
  await updateDoc(
    doc(db, "produtos", id),
    {
      ...produto,
      atualizadoEm: serverTimestamp()
    }
  );
}

async function salvarProduto(evento) {
  evento.preventDefault();

  esconderMensagem();

  const produto = montarProduto();

  if (!validarProduto(produto)) {
    return;
  }

  const duplicado = encontrarProdutoDuplicado(produto);
  if (duplicado) {
    mostrarMensagem(`Esse produto já está cadastrado: ${duplicado.nome}`);
    duplicado.id && document.querySelector(`[data-id="${duplicado.id}"]`)?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const estaEditando = Boolean(produtoEmEdicao);
  const idEmEdicao = produtoEmEdicao?.id;

  try {
    botaoPublicar.disabled = true;

    botaoPublicar.textContent = estaEditando
      ? "Salvando..."
      : "Publicando...";

    if (arquivosImagensSelecionados.length > 0) {
      const novasImagens = await enviarImagensSelecionadas();
      produto.imagens = [...produto.imagens, ...novasImagens].slice(0, LIMITE_IMAGENS);
      produto.imagem = produto.imagens[0] || "";
    }

    if (estaEditando) {
      await atualizarProduto(
        idEmEdicao,
        produto
      );
    } else {
      await publicarProduto(produto);
    }

    cancelarEdicao();

    await carregarProdutos();

    mostrarMensagem(
      estaEditando
        ? "Produto atualizado com sucesso!"
        : "Produto publicado com sucesso!",
      "sucesso"
    );
  } catch (erro) {
    console.error(
      "Erro ao salvar produto:",
      erro
    );

    mostrarMensagem(
      erro.message || (estaEditando
        ? "Não foi possível atualizar o produto."
        : "Não foi possível publicar o produto.")
    );
  } finally {
    botaoPublicar.disabled = false;

    botaoPublicar.textContent =
      produtoEmEdicao
        ? "Salvar alterações"
        : "Publicar produto";
  }
}

/* =========================
   LISTAGEM
========================= */

function criarItemProduto(produto) {
  const nome = escaparHtml(produto.nome);
  const loja = escaparHtml(produto.loja);
  const categoria = escaparHtml(
    produto.categoria
  );

  const precoAtual = escaparHtml(
    formatarMoedaExistente(produto.precoAtual)
  );

  const imagens = obterImagensProduto(produto);
  const imagemPrincipal = imagens[0] || "";
  const totalImagens = imagens.length;

  return `
    <article class="admin-product">

      <div class="admin-product-info">

        <div class="admin-product-imagem">
          ${
            imagemPrincipal
              ? `
                <img
                  src="${imagemPrincipal}"
                  alt="${nome}"
                  loading="lazy"
                >
              `
              : `
                <span>Sem foto</span>
              `
          }
        </div>

        <div>
          <h3>${nome}</h3>

          <p>
            ${loja} · ${categoria} · ${precoAtual}
          </p>

          <p>
            ${totalImagens}
            foto${totalImagens === 1 ? "" : "s"}
          </p>

          <p class="validade-produto">${escaparHtml(descricaoValidade(produto))}</p>
        </div>

      </div>

      <div class="admin-product-acoes">

        <button
          type="button"
          data-id="${produto.id}"
          class="botao-editar"
        >
          Editar
        </button>

        <button
          type="button"
          data-id="${produto.id}"
          class="botao-excluir"
        >
          Excluir
        </button>

      </div>

    </article>
  `;
}

function mostrarProdutos() {
  contadorProdutos.textContent =
    `${produtos.length} produto${
      produtos.length === 1 ? "" : "s"
    }`;

  if (produtos.length === 0) {
    listaProdutos.innerHTML = `
      <p class="lista-vazia">
        Nenhum produto cadastrado.
      </p>
    `;

    return;
  }

  listaProdutos.innerHTML = produtos
    .map(criarItemProduto)
    .join("");
}

async function carregarProdutos() {
  try {
    listaProdutos.innerHTML = `
      <p class="lista-vazia">
        Carregando produtos...
      </p>
    `;

    const consulta = query(
      collection(db, "produtos"),
      orderBy("criadoEm", "desc")
    );

    const resultado = await getDocs(consulta);

    produtos = resultado.docs.map(
      (documento) => ({
        id: documento.id,
        ...documento.data()
      })
    );

    const agora = Date.now();
    const paraExcluir = produtos.filter((produto) => {
      const data = converterTimestampEmData(produto.excluirEm);
      return data && data.getTime() <= agora;
    });

    if (paraExcluir.length) {
      await Promise.all(
        paraExcluir.map((produto) => deleteDoc(doc(db, "produtos", produto.id)))
      );
      const idsExcluidos = new Set(paraExcluir.map((produto) => produto.id));
      produtos = produtos.filter((produto) => !idsExcluidos.has(produto.id));
    }

    mostrarProdutos();
  } catch (erro) {
    console.error(
      "Erro ao carregar produtos:",
      erro
    );

    contadorProdutos.textContent =
      "Erro ao carregar";

    listaProdutos.innerHTML = `
      <p class="lista-vazia">
        Não foi possível carregar os produtos.
      </p>
    `;
  }
}


/* =========================
   RECLASSIFICAÇÃO DE CATEGORIAS
   Atualiza os registros já existentes no Firestore.
========================= */

async function reclassificarProdutosExistentes() {
  if (!produtos.length) {
    mostrarMensagem("Não há produtos carregados para reclassificar.");
    return;
  }

  const alteracoes = produtos
    .map((produto) => {
      const categoriaNova = categoriaInteligentePorTexto(
        `${produto.nome || ""} ${produto.descricao || ""}`,
        produto.categoria || ""
      );

      return {
        produto,
        categoriaNova
      };
    })
    .filter(({ produto, categoriaNova }) =>
      categoriaNova && categoriaNova !== produto.categoria
    );

  if (!alteracoes.length) {
    mostrarMensagem(
      "As categorias já estão atualizadas.",
      "sucesso"
    );
    return;
  }

  const confirmou = confirm(
    `Vou corrigir a categoria de ${alteracoes.length} produto(s) já cadastrados. Deseja continuar?`
  );

  if (!confirmou) {
    return;
  }

  const textoOriginal = botaoReclassificarProdutos.textContent;

  try {
    botaoReclassificarProdutos.disabled = true;

    for (let indice = 0; indice < alteracoes.length; indice += 1) {
      const { produto, categoriaNova } = alteracoes[indice];

      botaoReclassificarProdutos.textContent =
        `Corrigindo ${indice + 1}/${alteracoes.length}...`;

      await updateDoc(
        doc(db, "produtos", produto.id),
        {
          categoria: categoriaNova,
          atualizadoEm: serverTimestamp()
        }
      );
    }

    await carregarProdutos();

    mostrarMensagem(
      `${alteracoes.length} produto(s) reclassificado(s) com sucesso!`,
      "sucesso"
    );
  } catch (erro) {
    console.error("Erro ao reclassificar categorias:", erro);
    mostrarMensagem(
      "Não foi possível concluir a reclassificação das categorias."
    );
  } finally {
    botaoReclassificarProdutos.disabled = false;
    botaoReclassificarProdutos.textContent = textoOriginal;
  }
}

/* =========================
   EDITAR E EXCLUIR
========================= */

function editarProduto(id) {
  const produto = produtos.find(
    (item) => item.id === id
  );

  if (!produto) {
    mostrarMensagem(
      "Não foi possível encontrar esse produto."
    );

    return;
  }

  ativarModoEdicao(produto);
}

async function excluirProduto(id) {
  const produto = produtos.find(
    (item) => item.id === id
  );

  const confirmou = confirm(
    produto
      ? `Tem certeza que deseja excluir "${produto.nome}"?`
      : "Tem certeza que deseja excluir este produto?"
  );

  if (!confirmou) {
    return;
  }

  try {
    await deleteDoc(
      doc(db, "produtos", id)
    );

    if (produtoEmEdicao?.id === id) {
      cancelarEdicao();
    }

    await carregarProdutos();

    mostrarMensagem(
      "Produto excluído com sucesso.",
      "sucesso"
    );
  } catch (erro) {
    console.error(
      "Erro ao excluir produto:",
      erro
    );

    mostrarMensagem(
      "Não foi possível excluir o produto."
    );
  }
}

/* =========================
   EVENTOS
========================= */

listaProdutos.addEventListener(
  "click",
  (evento) => {
    const botaoEditar = evento.target.closest(
      ".botao-editar"
    );

    if (botaoEditar) {
      editarProduto(botaoEditar.dataset.id);
      return;
    }

    const botaoExcluir = evento.target.closest(
      ".botao-excluir"
    );

    if (botaoExcluir) {
      excluirProduto(botaoExcluir.dataset.id);
    }
  }
);

botaoBuscarInformacoes?.addEventListener(
  "click",
  buscarInformacoesProduto
);

botaoSelecionarImagens?.addEventListener("click", () => {
  campoArquivosImagens?.click();
});

campoArquivosImagens?.addEventListener("change", () => {
  selecionarArquivosImagens(campoArquivosImagens.files);
});

previsualizacaoImagens?.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".botao-remover-imagem");
  if (!botao) return;

  const indice = Number(botao.dataset.indice);
  if (botao.dataset.tipo === "arquivo") {
    arquivosImagensSelecionados.splice(indice, 1);
  } else {
    const imagens = obterImagensDoFormulario();
    imagens.splice(indice, 1);
    definirValor("#imagens", imagens.join("\n"));
  }
  atualizarPrevisualizacaoImagens();
});

obterElemento("#link")?.addEventListener("input", () => {
  if (linkDaUltimaBusca && obterValor("#link") !== linkDaUltimaBusca) {
    limparDadosDaBuscaAnterior();
    linkDaUltimaBusca = "";
  }
});

obterElemento("#nome")?.addEventListener("blur", () => {
  if (obterValor("#categoria")) return;
  const categoria = normalizarCategoriaImportada("", obterValor("#nome"));
  if (categoria) selecionarOpcao("#categoria", categoria);
});

obterElemento("#prazo-publicacao")?.addEventListener("change", (evento) => {
  const personalizado = evento.target.value === "personalizado";
  obterElemento("#campo-data-expiracao").hidden = !personalizado;
  obterElemento("#data-expiracao").required = personalizado;
});

formulario.addEventListener(
  "submit",
  salvarProduto
);

botaoCancelarEdicao.addEventListener(
  "click",
  cancelarEdicao
);

botaoReclassificarProdutos?.addEventListener(
  "click",
  reclassificarProdutosExistentes
);

botaoAtualizarProdutos.addEventListener(
  "click",
  carregarProdutos
);

function identificarLojaCompartilhada(url, texto = "") {
  const referencia = `${url} ${texto}`.toLowerCase();

  if (referencia.includes("shopee")) return "Shopee";
  if (referencia.includes("amazon")) return "Amazon";
  if (referencia.includes("mercadolivre") || referencia.includes("mercado livre") || referencia.includes("meli")) return "Mercado Livre";
  if (referencia.includes("temu")) return "Temu";
  if (referencia.includes("aliexpress")) return "AliExpress";
  if (referencia.includes("magazineluiza") || referencia.includes("magalu")) return "Magazine Luiza";
  return "";
}

function extrairNomeCompartilhado(title, text) {
  const semLinks = `${title || ""}\n${text || ""}`
    .replace(/https?:\/\/[^\s]+/gi, " ")
    .replace(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|R\$\s*\d+(?:[.,]\d{2})?/gi, " ")
    .replace(/(?:confira|olha\s+s[oó]|compre\s+agora|aproveite|veja)\s*(?:este|esse|esta|essa|aqui|na loja)?\s*/gi, " ")
    .replace(/(?:link\s+de\s+afiliado|produto\s+na\s+shopee|na\s+shopee|shopee\s+brasil)/gi, " ")
    .replace(/[|•]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:–—-]+|[\s:–—-]+$/g, "")
    .trim();

  return nomeDeProdutoValido(semLinks).slice(0, 240);
}

function aproveitarCompartilhamento(dadosRecebidos = null) {
  let dados = dadosRecebidos;

  if (!dados) {
    try {
      dados = JSON.parse(sessionStorage.getItem("smartdeals:compartilhamento") || "null");
    } catch {
      sessionStorage.removeItem("smartdeals:compartilhamento");
      return;
    }
  }

  if (!dados) return;

  const textoCompleto = `${dados.title || ""} ${dados.text || ""}`.trim();
  const preco = textoCompleto.match(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|R\$\s*\d+(?:[.,]\d{2})?/i)?.[0] || "";
  const nome = extrairNomeCompartilhado(dados.title, dados.text);
  const loja = identificarLojaCompartilhada(dados.url, textoCompleto);

  if (dados.url) preencherSeVazio("#link", dados.url);
  if (nome) preencherSeVazio("#nome", nome);
  if (loja && !obterValor("#loja")) selecionarOpcao("#loja", loja);
  if (preco && !obterValor("#preco-atual")) campoPrecoAtual.value = formatarMoedaExistente(preco);

  if (!obterValor("#categoria") && nome) {
    const categoria = normalizarCategoriaImportada("", nome);
    if (categoria) selecionarOpcao("#categoria", categoria);
  }

  const preenchidos = [nome && "nome", preco && "preço", loja && "loja"].filter(Boolean);
  mostrarResultadoImportacao(
    preenchidos.length
      ? `Dados recebidos do celular: ${preenchidos.join(", ")}. Confira e complete o que faltar.`
      : "Link recebido do celular. A loja não enviou os outros dados; complete o que faltar.",
    preenchidos.length ? "sucesso" : "aviso"
  );

  sessionStorage.removeItem("smartdeals:compartilhamento");
}

obterElemento("#botao-preencher-texto")?.addEventListener("click", () => {
  const texto = obterValor("#texto-oferta");
  const dados = analisarTextoOferta(texto);
  if (!dados.url) {
    mostrarResultadoImportacao("Cole o texto completo, incluindo o link de afiliado.", "aviso");
    return;
  }
  if (produtoEmEdicao) {
    mostrarResultadoImportacao("Cancele a edição antes de importar outro produto.", "aviso");
    return;
  }
  const temDados = ["#nome", "#preco-atual", "#imagens", "#link"].some(s => obterValor(s)) || arquivosImagensSelecionados.length;
  if (temDados && !confirm("Substituir os dados e imagens do formulário pelo texto colado? Os produtos publicados não serão alterados.")) return;
  limparDadosDaBuscaAnterior();
  definirValor("#link", dados.url);
  definirValor("#nome", nomeDeProdutoValido(dados.nome));
  selecionarOpcao("#loja", identificarLojaCompartilhada(dados.url, texto));
  selecionarOpcao("#categoria", normalizarCategoriaImportada("", dados.nome));
  if (dados.valores.length === 1) {
    campoPrecoAtual.value = dados.valores[0].toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  linkDaUltimaBusca = dados.url;
  mostrarResultadoImportacao(dados.faixa
    ? "O texto contém mais de um preço. Confira a variação na loja e preencha o preço atual. Revise a categoria e adicione as fotos antes de publicar."
    : "Texto lido! Confira nome, loja, categoria e preço. Adicione as fotos antes de publicar.", "aviso");
});

window.addEventListener("smartdeals:compartilhamento-recebido", (evento) => {
  aproveitarCompartilhamento(evento.detail);
});

window.addEventListener("smartdeals:print-conferido", (evento) => {
  const { nome, preco } = evento.detail;
  if (produtoEmEdicao) {
    mostrarResultadoImportacao("Cancele a edição antes de usar um print de outro produto.");
    return;
  }
  if ((obterValor("#nome") || obterValor("#preco-atual")) && !confirm("Substituir nome, preço e categoria pelos dados conferidos do print? Confira também o link e as fotos deste produto.")) return;
  definirValor("#nome", nome);
  definirValor("#preco-atual", preco);
  selecionarOpcao("#categoria", normalizarCategoriaImportada("", nome));
  mostrarResultadoImportacao("Dados do print aplicados. Confira a loja, o link de afiliado e as fotos antes de publicar.");
});

aproveitarCompartilhamento();

atualizarPrevisualizacaoImagens();
