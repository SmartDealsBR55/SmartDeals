import{q as Y,c as Z,d as ee,o as te,g as ae}from"./firebase-DYvFj7oz.js";/* empty css              */const M=document.querySelector("#deals-grid"),v=document.querySelector("#mensagem-produtos"),l=document.querySelector("#campo-pesquisa"),oe=document.querySelector("#botao-pesquisa"),q=document.getElementById("aviso-desenvolvimento"),re=document.getElementById("fechar-aviso-desenvolvimento");try{q&&sessionStorage.getItem("smartdeals-aviso-v1")!=="fechado"&&(q.hidden=!1)}catch{q&&(q.hidden=!1)}re?.addEventListener("click",()=>{q.hidden=!0;try{sessionStorage.setItem("smartdeals-aviso-v1","fechado")}catch{}});const O=document.querySelectorAll(".store-card"),V=document.querySelectorAll(".category-card"),$=document.querySelector(".nav-categorias"),L=document.querySelector(".nav-categorias-botao"),h=document.getElementById("menu-categorias"),T=document.querySelector("header");function b(){$?.classList.remove("is-open"),h?.classList.remove("is-open"),L?.setAttribute("aria-expanded","false")}function G(){!h||!$||!T||(b(),window.matchMedia("(max-width: 760px)").matches?T.append(h):$.append(h))}L?.addEventListener("click",()=>{const e=L.getAttribute("aria-expanded")!=="true";b(),e&&($.classList.add("is-open"),h.classList.add("is-open"),L.setAttribute("aria-expanded","true"))});document.addEventListener("click",e=>{!$?.contains(e.target)&&!h?.contains(e.target)&&b()});document.addEventListener("keydown",e=>{e.key==="Escape"&&b()});window.addEventListener("resize",G);G();const D=document.querySelector("#filtros-ativos"),w=document.querySelector("#lista-filtros-ativos"),ie=document.querySelector("#botao-limpar-filtros"),y=document.querySelector("#titulo-produtos"),E=document.querySelector("#descricao-produtos");let _=[],C=[],s="",c="",u="";function f(e,t=""){return e??t}function n(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function m(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()}function x(e,t){return m(e)===m(t)}const ne=[{categoria:"Bebê & Infantil",termos:["bebe","berco","bercinho","mosquiteiro","mamadeira","chupeta","fralda","carrinho de bebe","cadeira de bebe","banheira bebe","maternidade","infantil","crianca"]},{categoria:"Beleza",termos:["maquiagem","batom","base facial","rimel","mascara de cilios","perfume","hidratante","skincare","creme facial","oleo capilar","oleo de cabelo","reparador de pontas","serum capilar","leave-in","shampoo","condicionador","mascara capilar","tratamento capilar","pantene","secador","chapinha","barbeador","depilador","unha","esmalte","cabelo"]},{categoria:"Moda",termos:["calcinha","lingerie","sutia","biquini","maio","cueca","meia","meias","soquete","meia soquete","kit de meias","short","shorts","bermuda","calca","jeans","legging","vestido","saia","camisa","camiseta","blusa","pijama","tenis","chinelo","sandalia","sapato","bolsa","mochila","carteira","oculos","relogio","anel","alianca","colar","pulseira","moda feminina","moda masculina","roupa"]},{categoria:"Games",termos:["playstation","ps4","ps5","xbox","nintendo","switch","controle gamer","joystick","gamepad","gamer","jogo","console","headset gamer"]},{categoria:"Informática",termos:["notebook","laptop","computador","pc ","monitor","teclado","mouse","webcam","ssd","hd externo","pendrive","roteador","impressora","memoria ram","placa de video","gabinete","hub usb","adaptador usb"]},{categoria:"Eletrônicos",termos:["celular","smartphone","fone","bluetooth","carregador","power bank","caixa de som","smartwatch","tablet","camera","microfone","tv ","televisao","projetor","cabo usb","lightning","tipo-c","type-c"]},{categoria:"Esportes",termos:["academia","fitness","halter","musculacao","corrida","ciclismo","bicicleta","bike","bola","futebol","volei","basquete","yoga","treino","esportivo"]},{categoria:"Pets",termos:["pet","cachorro","gato","cao ","racao","coleira","arranhador","comedouro","bebedouro pet","areia gato","casinha pet","brinquedo pet"]},{categoria:"Automotivo",termos:["carro","automotivo","veiculo","moto","motocicleta","pneu","volante","farol","lampada automotiva","tapete carro","suporte veicular","compressor de pneu"]},{categoria:"Ferramentas",termos:["furadeira","parafusadeira","chave catraca","jogo de chave","alicate","martelo","serra","broca","ferramenta","multimetro","soprador","esmerilhadeira"]},{categoria:"Casa & Cozinha",termos:["cozinha","panela","frigideira","omeleteira","chaleira","torneira","ralador","fatiador","cortador","pote","marmita","lixeira","escorredor","organizador","prateleira","cama","travesseiro","lençol","lencol","toalha","tapete","papel de parede","decoracao","decoracoes","decorativo","vaso","vasos","vasilha","vasilhas","utensilio","utensilios","casa e construcao","casa & construcao","porta retrato","porta chaves","ventilador","luminaria","sanduicheira","mixer","liquidificador","cafeteira","air fryer","aspirador","cabide"]}];function W(e){const t=m([e?.nome,e?.categoria,e?.descricao].filter(Boolean).join(" "));for(const i of ne)if(i.termos.some(o=>t.includes(m(o))))return i.categoria;const a=m(e?.categoria);return{casa:"Casa & Cozinha","casa e cozinha":"Casa & Cozinha","casa & cozinha":"Casa & Cozinha",eletronicos:"Eletrônicos",informatica:"Informática",bebe:"Bebê & Infantil",infantil:"Bebê & Infantil",esporte:"Esportes",ferramentas:"Ferramentas",beleza:"Beleza",moda:"Moda",games:"Games",pets:"Pets",automotivo:"Automotivo"}[a]||e?.categoria||"Outros"}function se(e){const t=String(e??"").trim().replace(/\s/g,"").replace(/R\$/gi,"").replace(/\./g,"").replace(",","."),a=Number(t);return Number.isFinite(a)?a:0}function N(e,t=""){const a=String(e??"").trim();if(!a)return t;const r=se(a);return r<=0?a:r.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}async function ce(){try{v.hidden=!1,v.textContent="Carregando produtos...";const e=Y(Z(ee,"produtos"),te("criadoEm","desc"));_=(await ae(e)).docs.map(a=>({id:a.id,...a.data()})),g(!1)}catch(e){console.error("Erro ao carregar produtos:",e),v.hidden=!1,v.textContent="Não foi possível carregar os produtos do Firebase."}}function le(e){return Array.isArray(e.imagens)&&e.imagens.length>0?e.imagens.filter(Boolean):e.imagem?[e.imagem]:["https://placehold.co/600x600?text=Produto"]}function ue(e,t){return e.map((a,r)=>`
        <img
          src="${n(a)}"
          alt="${n(t)} - imagem ${r+1}"
          class="product-photo carousel-slide ${r===0?"active":""}"
          data-slide="${r}"
          loading="${r===0?"eager":"lazy"}"
          onerror="this.src='https://placehold.co/600x600?text=Produto'"
        >
      `).join("")}function de(e){return e.length<=1?"":`
    <div class="carousel-indicators">
      ${e.map((t,a)=>`
            <button
              type="button"
              class="carousel-indicator ${a===0?"active":""}"
              data-slide-to="${a}"
              aria-label="Mostrar imagem ${a+1}"
            ></button>
          `).join("")}
    </div>
  `}function me(e){return e.length<=1?"":`
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
  `}function pe(e){const t=le(e),a=n(f(e.badge)),r=f(e.nome,"Produto sem nome"),i=n(r),o=n(f(e.loja,"Loja")),d=n(f(e.avaliacao,"—")),S=n(N(e.precoAntigo)),U=n(N(e.precoAtual,"Consulte")),z=n(f(e.parcelas)),B=n(f(e.economia)),F=n(f(e.score)),X=n(f(e.link,"#"));return`
    <article
      class="product-card"
      data-product-id="${e.id}"
    >
      <div
        class="product-image product-carousel"
        data-current-slide="0"
      >
        ${a?`
              <span class="product-badge">
                ${a}
              </span>
            `:""}

        <div class="carousel-track">
          ${ue(t,r)}
        </div>

        ${me(t)}
        ${de(t)}
      </div>

      <div class="product-content">

        <span class="product-store">
          ${o}
        </span>

        <h3>${i}</h3>

        <div class="product-rating">
          <span>★★★★★</span>
          <small>${d}</small>
        </div>

        ${S?`
              <p class="old-price">
                De ${S}
              </p>
            `:""}

        <p class="current-price">
          ${U}
        </p>

        ${z?`
              <p class="installments">
                ou ${z}
              </p>
            `:""}

        <div class="product-info">

          <span>
            ${B?`Economize ${B}`:""}
          </span>

          <strong>
            ${F?`SmartScore ${F}`:""}
          </strong>

        </div>

        <a
          href="${X}"
          class="product-button"
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          Ver melhor oferta
        </a>

      </div>
    </article>
  `}function J(){C.forEach(e=>{clearInterval(e)}),C=[]}function I(e,t){const a=e.querySelectorAll(".carousel-slide"),r=e.querySelectorAll(".carousel-indicator");if(a.length===0)return;let i=t;i>=a.length&&(i=0),i<0&&(i=a.length-1),a.forEach((o,d)=>{o.classList.toggle("active",d===i)}),r.forEach((o,d)=>{o.classList.toggle("active",d===i)}),e.dataset.currentSlide=String(i)}function K(e){const t=Number(e.dataset.currentSlide||0);I(e,t+1)}function R(e){return e.querySelectorAll(".carousel-slide").length<=1?null:setInterval(()=>{K(e)},3e3)}function fe(){J(),document.querySelectorAll(".product-carousel").forEach(t=>{let a=R(t);a&&C.push(a);const r=t.querySelector(".carousel-previous"),i=t.querySelector(".carousel-next");r?.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();const d=Number(t.dataset.currentSlide||0);I(t,d-1)}),i?.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),K(t)}),t.querySelectorAll(".carousel-indicator").forEach(o=>{o.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation();const S=Number(o.dataset.slideTo);I(t,S)})}),t.addEventListener("mouseenter",()=>{a&&(clearInterval(a),a=null)}),t.addEventListener("mouseleave",()=>{a||(a=R(t),a&&C.push(a))})})}function ge(e){if(J(),M.innerHTML="",e.length===0){v.hidden=!1,v.textContent="Nenhum produto encontrado com esses filtros.";return}v.hidden=!0,M.innerHTML=e.map(pe).join(""),fe()}function ve(e){if(!u)return!0;const t=m(e.nome),a=m(e.loja),r=m(W(e)),i=m(e.badge),o=m(u);return t.includes(o)||a.includes(o)||r.includes(o)||i.includes(o)}function he(){return _.filter(e=>{const t=!s||x(e.loja,s),a=!c||x(W(e),c),r=ve(e);return t&&a&&r})}function be(){O.forEach(e=>{e.classList.toggle("active",x(e.dataset.loja,s))}),V.forEach(e=>{e.classList.toggle("active",x(e.dataset.categoria,c))})}function k(e,t){return`
    <button
      type="button"
      class="active-filter-tag"
      data-remover-filtro="${t}"
      title="Remover filtro"
    >
      <span>${n(e)}</span>
      <strong>×</strong>
    </button>
  `}function ye(){const e=[];if(s&&e.push(k(s,"loja")),c&&e.push(k(c,"categoria")),u&&e.push(k(`Busca: ${u}`,"pesquisa")),e.length===0){D.hidden=!0,w.innerHTML="";return}D.hidden=!1,w.innerHTML=e.join("")}function Ee(e){if(s&&c){y.textContent=`${c} na ${s}`,E.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa combinação.`;return}if(s){y.textContent=`Achados da ${s}`,E.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa loja.`;return}if(c){y.textContent=`Ofertas de ${c}`,E.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa categoria.`;return}if(u){y.textContent=`Resultados para “${u}”`,E.textContent=`${e} resultado${e===1?"":"s"} encontrado${e===1?"":"s"}.`;return}y.textContent="Todos os produtos",E.textContent="Produtos selecionados com bons descontos e ótimo custo-benefício."}function g(e=!0){const t=he();be(),ye(),Ee(t.length),ge(t),e&&document.querySelector("#achados")?.scrollIntoView({behavior:"smooth",block:"start"})}function qe(){s="",c="",u="",l.value="",g()}O.forEach(e=>{e.addEventListener("click",()=>{s=e.dataset.loja||"",g()})});V.forEach(e=>{e.addEventListener("click",()=>{c=e.dataset.categoria||"",g(),h?.contains(e)&&(b(),document.getElementById("achados")?.scrollIntoView({behavior:"smooth",block:"start"}))})});function j(){u=l.value.trim(),g()}oe.addEventListener("click",j);l.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),j())});l.addEventListener("input",()=>{l.value.trim()||(u="",g(!1))});w?.addEventListener("click",e=>{const t=e.target.closest("[data-remover-filtro]");if(!t)return;const a=t.dataset.removerFiltro;a==="loja"&&(s=""),a==="categoria"&&(c=""),a==="pesquisa"&&(u="",l.value=""),g()});ie?.addEventListener("click",qe);ce();const H=document.querySelector(".hero-search"),P=document.getElementById("header-scroll-search"),p=document.getElementById("campo-pesquisa-sticky"),$e=document.getElementById("botao-pesquisa-sticky");function A(){if(!H||!P||window.innerWidth>760&&window.innerWidth<1100){document.body.classList.remove("header-search-visible"),P?.setAttribute("aria-hidden","true");return}const e=H.getBoundingClientRect().bottom,t=document.querySelector("header")?.offsetHeight||84,a=e<=t+12;document.body.classList.toggle("header-search-visible",a),P.setAttribute("aria-hidden",a?"false":"true"),a&&b(),a&&document.activeElement!==p&&(p.value=l.value)}function Q(){l.value=p.value,j(),document.getElementById("achados")?.scrollIntoView({behavior:"smooth",block:"start"})}$e?.addEventListener("click",Q);p?.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),Q())});p?.addEventListener("input",()=>{p.value.trim()||(l.value="",u="",g(!1))});l?.addEventListener("input",()=>{p&&document.activeElement!==p&&(p.value=l.value)});window.addEventListener("scroll",A,{passive:!0});window.addEventListener("resize",A);window.addEventListener("load",A);A();
