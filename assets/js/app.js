import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

/* =========================
   ELEMENTOS DA PÁGINA
========================= */

const gridProdutos = document.querySelector("#deals-grid");

const mensagemProdutos = document.querySelector(
  "#mensagem-produtos"
);

const campoPesquisa = document.querySelector(
  "#campo-pesquisa"
);

const botaoPesquisa = document.querySelector(
  "#botao-pesquisa"
);

const avisoDesenvolvimento = document.getElementById("aviso-desenvolvimento");
const botaoFecharAviso = document.getElementById("fechar-aviso-desenvolvimento");

try {
  if (avisoDesenvolvimento && sessionStorage.getItem("smartdeals-aviso-v1") !== "fechado") {
    avisoDesenvolvimento.hidden = false;
  }
} catch {
  if (avisoDesenvolvimento) avisoDesenvolvimento.hidden = false;
}

botaoFecharAviso?.addEventListener("click", () => {
  avisoDesenvolvimento.hidden = true;
  try { sessionStorage.setItem("smartdeals-aviso-v1", "fechado"); } catch { /* armazenamento indisponível */ }
});

const cardsLojas = document.querySelectorAll(
  ".store-card"
);

const cardsCategorias = document.querySelectorAll(
  ".category-card"
);

const navCategorias = document.querySelector(".nav-categorias");
const botaoMenuCategorias = document.querySelector(".nav-categorias-botao");
const menuCategorias = document.getElementById("menu-categorias");
const cabecalho = document.querySelector("header");

function fecharMenuCategorias() {
  navCategorias?.classList.remove("is-open");
  menuCategorias?.classList.remove("is-open");
  botaoMenuCategorias?.setAttribute("aria-expanded", "false");
}

function ajustarMenuCategorias() {
  if (!menuCategorias || !navCategorias || !cabecalho) return;
  fecharMenuCategorias();
  if (window.matchMedia("(max-width: 760px)").matches) {
    // O menu deve ficar fora da navegação horizontal, que corta seu conteúdo.
    cabecalho.append(menuCategorias);
  } else {
    navCategorias.append(menuCategorias);
  }
}

botaoMenuCategorias?.addEventListener("click", () => {
  const abrir = botaoMenuCategorias.getAttribute("aria-expanded") !== "true";
  fecharMenuCategorias();
  if (abrir) {
    navCategorias.classList.add("is-open");
    menuCategorias.classList.add("is-open");
    botaoMenuCategorias.setAttribute("aria-expanded", "true");
  }
});

document.addEventListener("click", (evento) => {
  if (!navCategorias?.contains(evento.target) && !menuCategorias?.contains(evento.target)) {
    fecharMenuCategorias();
  }
});
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") fecharMenuCategorias();
});
window.addEventListener("resize", ajustarMenuCategorias);
ajustarMenuCategorias();

const filtrosAtivos = document.querySelector(
  "#filtros-ativos"
);

const listaFiltrosAtivos = document.querySelector(
  "#lista-filtros-ativos"
);

const botaoLimparFiltros = document.querySelector(
  "#botao-limpar-filtros"
);

const tituloProdutos = document.querySelector(
  "#titulo-produtos"
);

const descricaoProdutos = document.querySelector(
  "#descricao-produtos"
);

/* =========================
   ESTADO DA PÁGINA
========================= */

let produtos = [];
let intervalosCarrosseis = [];

let lojaSelecionada = "";
let categoriaSelecionada = "";
let termoPesquisa = "";

/* =========================
   FUNÇÕES GERAIS
========================= */

function valorSeguro(valor, textoPadrao = "") {
  return valor ?? textoPadrao;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function textosIguais(valorA, valorB) {
  return normalizarTexto(valorA) === normalizarTexto(valorB);
}

/* =========================
   CATEGORIA INTELIGENTE
   Mantém compatibilidade com produtos antigos que foram
   publicados em categorias genéricas ou incorretas.
========================= */

const REGRAS_CATEGORIA = [
  {
    categoria: "Bebê & Infantil",
    termos: [
      "bebe", "berco", "bercinho", "mosquiteiro", "mamadeira",
      "chupeta", "fralda", "carrinho de bebe", "cadeira de bebe",
      "banheira bebe", "maternidade", "infantil", "crianca"
    ]
  },
  {
    categoria: "Beleza",
    termos: [
      "maquiagem", "batom", "base facial", "rimel", "mascara de cilios",
      "perfume", "hidratante", "skincare", "creme facial", "oleo capilar",
      "oleo de cabelo", "reparador de pontas", "serum capilar", "leave-in",
      "shampoo", "condicionador", "mascara capilar", "tratamento capilar", "pantene", "secador",
      "chapinha", "barbeador", "depilador", "unha", "esmalte", "cabelo"
    ]
  },
  {
    categoria: "Moda",
    termos: [
      "calcinha", "lingerie", "sutia", "biquini", "maio", "cueca",
      "meia", "meias", "soquete", "meia soquete", "kit de meias",
      "short", "shorts", "bermuda", "calca", "jeans", "legging",
      "vestido", "saia", "camisa", "camiseta", "blusa", "pijama",
      "tenis", "chinelo", "sandalia", "sapato", "bolsa", "mochila",
      "carteira", "oculos", "relogio", "anel", "alianca", "colar",
      "pulseira", "moda feminina", "moda masculina", "roupa"
    ]
  },
  {
    categoria: "Games",
    termos: [
      "playstation", "ps4", "ps5", "xbox", "nintendo", "switch",
      "controle gamer", "joystick", "gamepad", "gamer", "jogo",
      "console", "headset gamer"
    ]
  },
  {
    categoria: "Informática",
    termos: [
      "notebook", "laptop", "computador", "pc ", "monitor", "teclado",
      "mouse", "webcam", "ssd", "hd externo", "pendrive", "roteador",
      "impressora", "memoria ram", "placa de video", "gabinete",
      "hub usb", "adaptador usb"
    ]
  },
  {
    categoria: "Eletrônicos",
    termos: [
      "celular", "smartphone", "fone", "bluetooth", "carregador",
      "power bank", "caixa de som", "smartwatch", "tablet", "camera",
      "microfone", "tv ", "televisao", "projetor", "cabo usb",
      "lightning", "tipo-c", "type-c"
    ]
  },
  {
    categoria: "Esportes",
    termos: [
      "academia", "fitness", "halter", "musculacao", "corrida",
      "ciclismo", "bicicleta", "bike", "bola", "futebol", "volei",
      "basquete", "yoga", "treino", "esportivo"
    ]
  },
  {
    categoria: "Pets",
    termos: [
      "pet", "cachorro", "gato", "cao ", "racao", "coleira",
      "arranhador", "comedouro", "bebedouro pet", "areia gato",
      "casinha pet", "brinquedo pet"
    ]
  },
  {
    categoria: "Automotivo",
    termos: [
      "carro", "automotivo", "veiculo", "moto", "motocicleta",
      "pneu", "volante", "farol", "lampada automotiva", "tapete carro",
      "suporte veicular", "compressor de pneu"
    ]
  },
  {
    categoria: "Ferramentas",
    termos: [
      "furadeira", "parafusadeira", "chave catraca", "jogo de chave",
      "alicate", "martelo", "serra", "broca", "ferramenta", "multimetro",
      "soprador", "esmerilhadeira"
    ]
  },
  {
    categoria: "Casa & Cozinha",
    termos: [
      "cozinha", "panela", "frigideira", "omeleteira", "chaleira",
      "torneira", "ralador", "fatiador", "cortador", "pote", "marmita",
      "lixeira", "escorredor", "organizador", "prateleira", "cama",
      "travesseiro", "lençol", "lencol", "toalha", "tapete",
      "papel de parede", "decoracao", "decoracoes", "decorativo",
      "vaso", "vasos", "vasilha", "vasilhas", "utensilio", "utensilios",
      "casa e construcao", "casa & construcao", "porta retrato", "porta chaves",
      "ventilador", "luminaria", "sanduicheira", "mixer", "liquidificador",
      "cafeteira", "air fryer", "aspirador", "cabide"
    ]
  }
];

function obterCategoriaProduto(produto) {
  const texto = normalizarTexto(
    [produto?.nome, produto?.categoria, produto?.descricao].filter(Boolean).join(" ")
  );

  for (const regra of REGRAS_CATEGORIA) {
    if (regra.termos.some((termo) => texto.includes(normalizarTexto(termo)))) {
      return regra.categoria;
    }
  }

  const categoriaOriginal = normalizarTexto(produto?.categoria);

  const aliases = {
    casa: "Casa & Cozinha",
    "casa e cozinha": "Casa & Cozinha",
    "casa & cozinha": "Casa & Cozinha",
    eletronicos: "Eletrônicos",
    informatica: "Informática",
    bebe: "Bebê & Infantil",
    infantil: "Bebê & Infantil",
    esporte: "Esportes",
    ferramentas: "Ferramentas",
    beleza: "Beleza",
    moda: "Moda",
    games: "Games",
    pets: "Pets",
    automotivo: "Automotivo"
  };

  return aliases[categoriaOriginal] || produto?.categoria || "Outros";
}

/* =========================
   FORMATAÇÃO DOS PREÇOS
========================= */

function converterMoedaParaNumero(valor) {
  const texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function formatarPreco(valor, textoPadrao = "") {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return textoPadrao;
  }

  const numero = converterMoedaParaNumero(texto);

  if (numero <= 0) {
    return texto;
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/* =========================
   CARREGAMENTO DO FIREBASE
========================= */

async function carregarProdutos() {
  try {
    mensagemProdutos.hidden = false;
    mensagemProdutos.textContent =
      "Carregando produtos...";

    const consulta = query(
      collection(db, "produtos"),
      orderBy("criadoEm", "desc")
    );

    const resultado = await getDocs(consulta);

    produtos = resultado.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }));

    aplicarFiltros(false);
  } catch (erro) {
    console.error(
      "Erro ao carregar produtos:",
      erro
    );

    mensagemProdutos.hidden = false;
    mensagemProdutos.textContent =
      "Não foi possível carregar os produtos do Firebase.";
  }
}

/* =========================
   IMAGENS DO PRODUTO
========================= */

function obterImagensProduto(produto) {
  if (
    Array.isArray(produto.imagens) &&
    produto.imagens.length > 0
  ) {
    return produto.imagens.filter(Boolean);
  }

  if (produto.imagem) {
    return [produto.imagem];
  }

  return [
    "https://placehold.co/600x600?text=Produto"
  ];
}

function criarSlides(imagens, nome) {
  return imagens
    .map((imagem, indice) => {
      return `
        <img
          src="${escaparHtml(imagem)}"
          alt="${escaparHtml(nome)} - imagem ${indice + 1}"
          class="product-photo carousel-slide ${
            indice === 0 ? "active" : ""
          }"
          data-slide="${indice}"
          loading="${indice === 0 ? "eager" : "lazy"}"
          onerror="this.src='https://placehold.co/600x600?text=Produto'"
        >
      `;
    })
    .join("");
}

function criarIndicadores(imagens) {
  if (imagens.length <= 1) {
    return "";
  }

  return `
    <div class="carousel-indicators">
      ${imagens
        .map((_, indice) => {
          return `
            <button
              type="button"
              class="carousel-indicator ${
                indice === 0 ? "active" : ""
              }"
              data-slide-to="${indice}"
              aria-label="Mostrar imagem ${indice + 1}"
            ></button>
          `;
        })
        .join("")}
    </div>
  `;
}

function criarControlesCarrossel(imagens) {
  if (imagens.length <= 1) {
    return "";
  }

  return `
    <button
      type="button"
      class="carousel-button carousel-previous"
      aria-label="Imagem anterior"
    >
      &#10094;
    </button>

    <button
      type="button"
      class="carousel-button carousel-next"
      aria-label="Próxima imagem"
    >
      &#10095;
    </button>
  `;
}

/* =========================
   CARD DO PRODUTO
========================= */

function criarCardProduto(produto) {
  const imagens = obterImagensProduto(produto);

  const badge = escaparHtml(
    valorSeguro(produto.badge)
  );

  const nomeOriginal = valorSeguro(
    produto.nome,
    "Produto sem nome"
  );

  const nome = escaparHtml(nomeOriginal);

  const loja = escaparHtml(
    valorSeguro(produto.loja, "Loja")
  );

  const avaliacao = escaparHtml(
    valorSeguro(produto.avaliacao, "—")
  );

  const precoAntigo = escaparHtml(
    formatarPreco(produto.precoAntigo)
  );

  const precoAtual = escaparHtml(
    formatarPreco(
      produto.precoAtual,
      "Consulte"
    )
  );

  const parcelas = escaparHtml(
    valorSeguro(produto.parcelas)
  );

  const economia = escaparHtml(
    valorSeguro(produto.economia)
  );

  const score = escaparHtml(
    valorSeguro(produto.score)
  );

  const link = escaparHtml(
    valorSeguro(produto.link, "#")
  );

  return `
    <article
      class="product-card"
      data-product-id="${produto.id}"
    >
      <div
        class="product-image product-carousel"
        data-current-slide="0"
      >
        ${
          badge
            ? `
              <span class="product-badge">
                ${badge}
              </span>
            `
            : ""
        }

        <div class="carousel-track">
          ${criarSlides(imagens, nomeOriginal)}
        </div>

        ${criarControlesCarrossel(imagens)}
        ${criarIndicadores(imagens)}
      </div>

      <div class="product-content">

        <span class="product-store">
          ${loja}
        </span>

        <h3>${nome}</h3>

        <div class="product-rating">
          <span>★★★★★</span>
          <small>${avaliacao}</small>
        </div>

        ${
          precoAntigo
            ? `
              <p class="old-price">
                De ${precoAntigo}
              </p>
            `
            : ""
        }

        <p class="current-price">
          ${precoAtual}
        </p>

        ${
          parcelas
            ? `
              <p class="installments">
                ou ${parcelas}
              </p>
            `
            : ""
        }

        <div class="product-info">

          <span>
            ${
              economia
                ? `Economize ${economia}`
                : ""
            }
          </span>

          <strong>
            ${
              score
                ? `SmartScore ${score}`
                : ""
            }
          </strong>

        </div>

        <a
          href="${link}"
          class="product-button"
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          Ver melhor oferta
        </a>

      </div>
    </article>
  `;
}

/* =========================
   CARROSSEL
========================= */

function limparIntervalosCarrosseis() {
  intervalosCarrosseis.forEach((intervalo) => {
    clearInterval(intervalo);
  });

  intervalosCarrosseis = [];
}

function mostrarSlide(carrossel, novoIndice) {
  const slides = carrossel.querySelectorAll(
    ".carousel-slide"
  );

  const indicadores = carrossel.querySelectorAll(
    ".carousel-indicator"
  );

  if (slides.length === 0) {
    return;
  }

  let indice = novoIndice;

  if (indice >= slides.length) {
    indice = 0;
  }

  if (indice < 0) {
    indice = slides.length - 1;
  }

  slides.forEach((slide, slideIndice) => {
    slide.classList.toggle(
      "active",
      slideIndice === indice
    );
  });

  indicadores.forEach(
    (indicador, indicadorIndice) => {
      indicador.classList.toggle(
        "active",
        indicadorIndice === indice
      );
    }
  );

  carrossel.dataset.currentSlide =
    String(indice);
}

function avancarSlide(carrossel) {
  const indiceAtual = Number(
    carrossel.dataset.currentSlide || 0
  );

  mostrarSlide(
    carrossel,
    indiceAtual + 1
  );
}

function iniciarCarrosselAutomatico(carrossel) {
  const slides = carrossel.querySelectorAll(
    ".carousel-slide"
  );

  if (slides.length <= 1) {
    return null;
  }

  return setInterval(() => {
    avancarSlide(carrossel);
  }, 3000);
}

function configurarCarrosseis() {
  limparIntervalosCarrosseis();

  const carrosseis = document.querySelectorAll(
    ".product-carousel"
  );

  carrosseis.forEach((carrossel) => {
    let intervalo =
      iniciarCarrosselAutomatico(carrossel);

    if (intervalo) {
      intervalosCarrosseis.push(intervalo);
    }

    const botaoAnterior = carrossel.querySelector(
      ".carousel-previous"
    );

    const botaoProximo = carrossel.querySelector(
      ".carousel-next"
    );

    botaoAnterior?.addEventListener(
      "click",
      (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        const indiceAtual = Number(
          carrossel.dataset.currentSlide || 0
        );

        mostrarSlide(
          carrossel,
          indiceAtual - 1
        );
      }
    );

    botaoProximo?.addEventListener(
      "click",
      (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        avancarSlide(carrossel);
      }
    );

    carrossel
      .querySelectorAll(".carousel-indicator")
      .forEach((indicador) => {
        indicador.addEventListener(
          "click",
          (evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            const indice = Number(
              indicador.dataset.slideTo
            );

            mostrarSlide(
              carrossel,
              indice
            );
          }
        );
      });

    carrossel.addEventListener(
      "mouseenter",
      () => {
        if (intervalo) {
          clearInterval(intervalo);
          intervalo = null;
        }
      }
    );

    carrossel.addEventListener(
      "mouseleave",
      () => {
        if (!intervalo) {
          intervalo =
            iniciarCarrosselAutomatico(
              carrossel
            );

          if (intervalo) {
            intervalosCarrosseis.push(
              intervalo
            );
          }
        }
      }
    );
  });
}

/* =========================
   EXIBIÇÃO DOS PRODUTOS
========================= */

function mostrarProdutos(listaProdutos) {
  limparIntervalosCarrosseis();

  gridProdutos.innerHTML = "";

  if (listaProdutos.length === 0) {
    mensagemProdutos.hidden = false;

    mensagemProdutos.textContent =
      "Nenhum produto encontrado com esses filtros.";

    return;
  }

  mensagemProdutos.hidden = true;

  gridProdutos.innerHTML = listaProdutos
    .map(criarCardProduto)
    .join("");

  configurarCarrosseis();
}

/* =========================
   FILTROS
========================= */

function produtoCombinaComPesquisa(produto) {
  if (!termoPesquisa) {
    return true;
  }

  const nome = normalizarTexto(produto.nome);
  const loja = normalizarTexto(produto.loja);
  const categoria = normalizarTexto(
    obterCategoriaProduto(produto)
  );

  const badge = normalizarTexto(
    produto.badge
  );

  const termo = normalizarTexto(
    termoPesquisa
  );

  return (
    nome.includes(termo) ||
    loja.includes(termo) ||
    categoria.includes(termo) ||
    badge.includes(termo)
  );
}

function filtrarProdutos() {
  return produtos.filter((produto) => {
    const combinaLoja =
      !lojaSelecionada ||
      textosIguais(
        produto.loja,
        lojaSelecionada
      );

    const combinaCategoria =
      !categoriaSelecionada ||
      textosIguais(
        obterCategoriaProduto(produto),
        categoriaSelecionada
      );

    const combinaPesquisa =
      produtoCombinaComPesquisa(produto);

    return (
      combinaLoja &&
      combinaCategoria &&
      combinaPesquisa
    );
  });
}

function atualizarCardsAtivos() {
  cardsLojas.forEach((card) => {
    card.classList.toggle(
      "active",
      textosIguais(
        card.dataset.loja,
        lojaSelecionada
      )
    );
  });

  cardsCategorias.forEach((card) => {
    card.classList.toggle(
      "active",
      textosIguais(
        card.dataset.categoria,
        categoriaSelecionada
      )
    );
  });
}

function criarEtiquetaFiltro(texto, tipo) {
  return `
    <button
      type="button"
      class="active-filter-tag"
      data-remover-filtro="${tipo}"
      title="Remover filtro"
    >
      <span>${escaparHtml(texto)}</span>
      <strong>×</strong>
    </button>
  `;
}

function atualizarFiltrosAtivos() {
  const etiquetas = [];

  if (lojaSelecionada) {
    etiquetas.push(
      criarEtiquetaFiltro(
        lojaSelecionada,
        "loja"
      )
    );
  }

  if (categoriaSelecionada) {
    etiquetas.push(
      criarEtiquetaFiltro(
        categoriaSelecionada,
        "categoria"
      )
    );
  }

  if (termoPesquisa) {
    etiquetas.push(
      criarEtiquetaFiltro(
        `Busca: ${termoPesquisa}`,
        "pesquisa"
      )
    );
  }

  if (etiquetas.length === 0) {
    filtrosAtivos.hidden = true;
    listaFiltrosAtivos.innerHTML = "";
    return;
  }

  filtrosAtivos.hidden = false;

  listaFiltrosAtivos.innerHTML =
    etiquetas.join("");
}

function atualizarTituloProdutos(total) {
  if (
    lojaSelecionada &&
    categoriaSelecionada
  ) {
    tituloProdutos.textContent =
      `${categoriaSelecionada} na ${lojaSelecionada}`;

    descricaoProdutos.textContent =
      `${total} produto${
        total === 1 ? "" : "s"
      } encontrado${
        total === 1 ? "" : "s"
      } nessa combinação.`;

    return;
  }

  if (lojaSelecionada) {
    tituloProdutos.textContent =
      `Achados da ${lojaSelecionada}`;

    descricaoProdutos.textContent =
      `${total} produto${
        total === 1 ? "" : "s"
      } encontrado${
        total === 1 ? "" : "s"
      } nessa loja.`;

    return;
  }

  if (categoriaSelecionada) {
    tituloProdutos.textContent =
      `Ofertas de ${categoriaSelecionada}`;

    descricaoProdutos.textContent =
      `${total} produto${
        total === 1 ? "" : "s"
      } encontrado${
        total === 1 ? "" : "s"
      } nessa categoria.`;

    return;
  }

  if (termoPesquisa) {
    tituloProdutos.textContent =
      `Resultados para “${termoPesquisa}”`;

    descricaoProdutos.textContent =
      `${total} resultado${
        total === 1 ? "" : "s"
      } encontrado${
        total === 1 ? "" : "s"
      }.`;

    return;
  }

  tituloProdutos.textContent =
    "Todos os produtos";

  descricaoProdutos.textContent =
    "Produtos selecionados com bons descontos e ótimo custo-benefício.";
}

function aplicarFiltros(rolarAteProdutos = true) {
  const produtosFiltrados =
    filtrarProdutos();

  atualizarCardsAtivos();
  atualizarFiltrosAtivos();
  atualizarTituloProdutos(
    produtosFiltrados.length
  );

  mostrarProdutos(produtosFiltrados);

  if (rolarAteProdutos) {
    document
      .querySelector("#achados")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }
}

function limparTodosFiltros() {
  lojaSelecionada = "";
  categoriaSelecionada = "";
  termoPesquisa = "";

  campoPesquisa.value = "";

  aplicarFiltros();
}

/* =========================
   EVENTOS DAS LOJAS
========================= */

cardsLojas.forEach((card) => {
  card.addEventListener("click", () => {
    lojaSelecionada =
      card.dataset.loja || "";

    aplicarFiltros();
  });
});

/* =========================
   EVENTOS DAS CATEGORIAS
========================= */

cardsCategorias.forEach((card) => {
  card.addEventListener("click", () => {
    categoriaSelecionada =
      card.dataset.categoria || "";

    aplicarFiltros();
    if (menuCategorias?.contains(card)) {
      fecharMenuCategorias();
      document.getElementById("achados")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

/* =========================
   EVENTOS DA PESQUISA
========================= */

function executarPesquisa() {
  termoPesquisa = campoPesquisa.value.trim();

  aplicarFiltros();
}

botaoPesquisa.addEventListener(
  "click",
  executarPesquisa
);

campoPesquisa.addEventListener(
  "keydown",
  (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      executarPesquisa();
    }
  }
);

campoPesquisa.addEventListener(
  "input",
  () => {
    if (!campoPesquisa.value.trim()) {
      termoPesquisa = "";
      aplicarFiltros(false);
    }
  }
);

/* =========================
   REMOVER FILTROS
========================= */

listaFiltrosAtivos?.addEventListener(
  "click",
  (evento) => {
    const botao = evento.target.closest(
      "[data-remover-filtro]"
    );

    if (!botao) {
      return;
    }

    const tipo =
      botao.dataset.removerFiltro;

    if (tipo === "loja") {
      lojaSelecionada = "";
    }

    if (tipo === "categoria") {
      categoriaSelecionada = "";
    }

    if (tipo === "pesquisa") {
      termoPesquisa = "";
      campoPesquisa.value = "";
    }

    aplicarFiltros();
  }
);

botaoLimparFiltros?.addEventListener(
  "click",
  limparTodosFiltros
);

/* =========================
   INICIALIZAÇÃO
========================= */

carregarProdutos();

/* =========================
   PESQUISA FIXA APÓS PASSAR A BUSCA DO HERO
========================= */

const buscaHero = document.querySelector(".hero-search");
const buscaSticky = document.getElementById("header-scroll-search");
const campoPesquisaSticky = document.getElementById("campo-pesquisa-sticky");
const botaoPesquisaSticky = document.getElementById("botao-pesquisa-sticky");

function atualizarVisibilidadePesquisaSticky() {
  if (!buscaHero || !buscaSticky || (window.innerWidth > 760 && window.innerWidth < 1100)) {
    document.body.classList.remove("header-search-visible");
    buscaSticky?.setAttribute("aria-hidden", "true");
    return;
  }

  const limite = buscaHero.getBoundingClientRect().bottom;
  const headerAltura = document.querySelector("header")?.offsetHeight || 84;
  const mostrar = limite <= headerAltura + 12;

  document.body.classList.toggle("header-search-visible", mostrar);
  buscaSticky.setAttribute("aria-hidden", mostrar ? "false" : "true");
  if (mostrar) fecharMenuCategorias();

  if (mostrar && document.activeElement !== campoPesquisaSticky) {
    campoPesquisaSticky.value = campoPesquisa.value;
  }
}

function executarPesquisaSticky() {
  campoPesquisa.value = campoPesquisaSticky.value;
  executarPesquisa();
  document.getElementById("achados")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

botaoPesquisaSticky?.addEventListener("click", executarPesquisaSticky);

campoPesquisaSticky?.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    executarPesquisaSticky();
  }
});

campoPesquisaSticky?.addEventListener("input", () => {
  if (!campoPesquisaSticky.value.trim()) {
    campoPesquisa.value = "";
    termoPesquisa = "";
    aplicarFiltros(false);
  }
});

campoPesquisa?.addEventListener("input", () => {
  if (campoPesquisaSticky && document.activeElement !== campoPesquisaSticky) {
    campoPesquisaSticky.value = campoPesquisa.value;
  }
});

window.addEventListener("scroll", atualizarVisibilidadePesquisaSticky, { passive: true });
window.addEventListener("resize", atualizarVisibilidadePesquisaSticky);
window.addEventListener("load", atualizarVisibilidadePesquisaSticky);
atualizarVisibilidadePesquisaSticky();
