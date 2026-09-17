import{q as _,c as W,d as J,o as K,g as Q}from"./firebase-DYvFj7oz.js";const z=document.querySelector("#deals-grid"),b=document.querySelector("#mensagem-produtos"),l=document.querySelector("#campo-pesquisa"),U=document.querySelector("#botao-pesquisa"),T=document.querySelectorAll(".store-card"),N=document.querySelectorAll(".category-card"),I=document.querySelector("#filtros-ativos"),L=document.querySelector("#lista-filtros-ativos"),X=document.querySelector("#botao-limpar-filtros"),v=document.querySelector("#titulo-produtos"),h=document.querySelector("#descricao-produtos");let R=[],q=[],s="",c="",u="";function f(e,a=""){return e??a}function n(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function m(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()}function $(e,a){return m(e)===m(a)}const Y=[{categoria:"Bebê & Infantil",termos:["bebe","berco","bercinho","mosquiteiro","mamadeira","chupeta","fralda","carrinho de bebe","cadeira de bebe","banheira bebe","maternidade","infantil","crianca"]},{categoria:"Beleza",termos:["maquiagem","batom","base facial","rimel","mascara de cilios","perfume","hidratante","skincare","creme facial","oleo capilar","oleo de cabelo","reparador de pontas","serum capilar","leave-in","shampoo","condicionador","mascara capilar","tratamento capilar","pantene","secador","chapinha","barbeador","depilador","unha","esmalte","cabelo"]},{categoria:"Moda",termos:["calcinha","lingerie","sutia","biquini","maio","cueca","meia","meias","soquete","meia soquete","kit de meias","short","shorts","bermuda","calca","jeans","legging","vestido","saia","camisa","camiseta","blusa","pijama","tenis","chinelo","sandalia","sapato","bolsa","mochila","carteira","oculos","relogio","anel","alianca","colar","pulseira","moda feminina","moda masculina","roupa"]},{categoria:"Games",termos:["playstation","ps4","ps5","xbox","nintendo","switch","controle gamer","joystick","gamepad","gamer","jogo","console","headset gamer"]},{categoria:"Informática",termos:["notebook","laptop","computador","pc ","monitor","teclado","mouse","webcam","ssd","hd externo","pendrive","roteador","impressora","memoria ram","placa de video","gabinete","hub usb","adaptador usb"]},{categoria:"Eletrônicos",termos:["celular","smartphone","fone","bluetooth","carregador","power bank","caixa de som","smartwatch","tablet","camera","microfone","tv ","televisao","projetor","cabo usb","lightning","tipo-c","type-c"]},{categoria:"Esportes",termos:["academia","fitness","halter","musculacao","corrida","ciclismo","bicicleta","bike","bola","futebol","volei","basquete","yoga","treino","esportivo"]},{categoria:"Pets",termos:["pet","cachorro","gato","cao ","racao","coleira","arranhador","comedouro","bebedouro pet","areia gato","casinha pet","brinquedo pet"]},{categoria:"Automotivo",termos:["carro","automotivo","veiculo","moto","motocicleta","pneu","volante","farol","lampada automotiva","tapete carro","suporte veicular","compressor de pneu"]},{categoria:"Ferramentas",termos:["furadeira","parafusadeira","chave catraca","jogo de chave","alicate","martelo","serra","broca","ferramenta","multimetro","soprador","esmerilhadeira"]},{categoria:"Casa & Cozinha",termos:["cozinha","panela","frigideira","omeleteira","chaleira","torneira","ralador","fatiador","cortador","pote","marmita","lixeira","escorredor","organizador","prateleira","cama","travesseiro","lençol","lencol","toalha","tapete","papel de parede","decoracao","decoracoes","decorativo","vaso","vasos","vasilha","vasilhas","utensilio","utensilios","casa e construcao","casa & construcao","porta retrato","porta chaves","ventilador","luminaria","sanduicheira","mixer","liquidificador","cafeteira","air fryer","aspirador","cabide"]}];function D(e){const a=m([e?.nome,e?.categoria,e?.descricao].filter(Boolean).join(" "));for(const i of Y)if(i.termos.some(o=>a.includes(m(o))))return i.categoria;const t=m(e?.categoria);return{casa:"Casa & Cozinha","casa e cozinha":"Casa & Cozinha","casa & cozinha":"Casa & Cozinha",eletronicos:"Eletrônicos",informatica:"Informática",bebe:"Bebê & Infantil",infantil:"Bebê & Infantil",esporte:"Esportes",ferramentas:"Ferramentas",beleza:"Beleza",moda:"Moda",games:"Games",pets:"Pets",automotivo:"Automotivo"}[t]||e?.categoria||"Outros"}function Z(e){const a=String(e??"").trim().replace(/\s/g,"").replace(/R\$/gi,"").replace(/\./g,"").replace(",","."),t=Number(a);return Number.isFinite(t)?t:0}function w(e,a=""){const t=String(e??"").trim();if(!t)return a;const r=Z(t);return r<=0?t:r.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}async function ee(){try{b.hidden=!1,b.textContent="Carregando produtos...";const e=_(W(J,"produtos"),K("criadoEm","desc"));R=(await Q(e)).docs.map(t=>({id:t.id,...t.data()})),g(!1)}catch(e){console.error("Erro ao carregar produtos:",e),b.hidden=!1,b.textContent="Não foi possível carregar os produtos do Firebase."}}function ae(e){return Array.isArray(e.imagens)&&e.imagens.length>0?e.imagens.filter(Boolean):e.imagem?[e.imagem]:["https://placehold.co/600x600?text=Produto"]}function te(e,a){return e.map((t,r)=>`
        <img
          src="${n(t)}"
          alt="${n(a)} - imagem ${r+1}"
          class="product-photo carousel-slide ${r===0?"active":""}"
          data-slide="${r}"
          loading="${r===0?"eager":"lazy"}"
          onerror="this.src='https://placehold.co/600x600?text=Produto'"
        >
      `).join("")}function oe(e){return e.length<=1?"":`
    <div class="carousel-indicators">
      ${e.map((a,t)=>`
            <button
              type="button"
              class="carousel-indicator ${t===0?"active":""}"
              data-slide-to="${t}"
              aria-label="Mostrar imagem ${t+1}"
            ></button>
          `).join("")}
    </div>
  `}function re(e){return e.length<=1?"":`
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
  `}function ie(e){const a=ae(e),t=n(f(e.badge)),r=f(e.nome,"Produto sem nome"),i=n(r),o=n(f(e.loja,"Loja")),d=n(f(e.avaliacao,"—")),y=n(w(e.precoAntigo)),G=n(w(e.precoAtual,"Consulte")),P=n(f(e.parcelas)),k=n(f(e.economia)),j=n(f(e.score)),V=n(f(e.link,"#"));return`
    <article
      class="product-card"
      data-product-id="${e.id}"
    >
      <div
        class="product-image product-carousel"
        data-current-slide="0"
      >
        ${t?`
              <span class="product-badge">
                ${t}
              </span>
            `:""}

        <div class="carousel-track">
          ${te(a,r)}
        </div>

        ${re(a)}
        ${oe(a)}
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

        ${y?`
              <p class="old-price">
                De ${y}
              </p>
            `:""}

        <p class="current-price">
          ${G}
        </p>

        ${P?`
              <p class="installments">
                ou ${P}
              </p>
            `:""}

        <div class="product-info">

          <span>
            ${k?`Economize ${k}`:""}
          </span>

          <strong>
            ${j?`SmartScore ${j}`:""}
          </strong>

        </div>

        <a
          href="${V}"
          class="product-button"
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          Ver melhor oferta
        </a>

      </div>
    </article>
  `}function M(){q.forEach(e=>{clearInterval(e)}),q=[]}function A(e,a){const t=e.querySelectorAll(".carousel-slide"),r=e.querySelectorAll(".carousel-indicator");if(t.length===0)return;let i=a;i>=t.length&&(i=0),i<0&&(i=t.length-1),t.forEach((o,d)=>{o.classList.toggle("active",d===i)}),r.forEach((o,d)=>{o.classList.toggle("active",d===i)}),e.dataset.currentSlide=String(i)}function H(e){const a=Number(e.dataset.currentSlide||0);A(e,a+1)}function B(e){return e.querySelectorAll(".carousel-slide").length<=1?null:setInterval(()=>{H(e)},3e3)}function ne(){M(),document.querySelectorAll(".product-carousel").forEach(a=>{let t=B(a);t&&q.push(t);const r=a.querySelector(".carousel-previous"),i=a.querySelector(".carousel-next");r?.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();const d=Number(a.dataset.currentSlide||0);A(a,d-1)}),i?.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),H(a)}),a.querySelectorAll(".carousel-indicator").forEach(o=>{o.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation();const y=Number(o.dataset.slideTo);A(a,y)})}),a.addEventListener("mouseenter",()=>{t&&(clearInterval(t),t=null)}),a.addEventListener("mouseleave",()=>{t||(t=B(a),t&&q.push(t))})})}function se(e){if(M(),z.innerHTML="",e.length===0){b.hidden=!1,b.textContent="Nenhum produto encontrado com esses filtros.";return}b.hidden=!0,z.innerHTML=e.map(ie).join(""),ne()}function ce(e){if(!u)return!0;const a=m(e.nome),t=m(e.loja),r=m(D(e)),i=m(e.badge),o=m(u);return a.includes(o)||t.includes(o)||r.includes(o)||i.includes(o)}function le(){return R.filter(e=>{const a=!s||$(e.loja,s),t=!c||$(D(e),c),r=ce(e);return a&&t&&r})}function ue(){T.forEach(e=>{e.classList.toggle("active",$(e.dataset.loja,s))}),N.forEach(e=>{e.classList.toggle("active",$(e.dataset.categoria,c))})}function S(e,a){return`
    <button
      type="button"
      class="active-filter-tag"
      data-remover-filtro="${a}"
      title="Remover filtro"
    >
      <span>${n(e)}</span>
      <strong>×</strong>
    </button>
  `}function de(){const e=[];if(s&&e.push(S(s,"loja")),c&&e.push(S(c,"categoria")),u&&e.push(S(`Busca: ${u}`,"pesquisa")),e.length===0){I.hidden=!0,L.innerHTML="";return}I.hidden=!1,L.innerHTML=e.join("")}function me(e){if(s&&c){v.textContent=`${c} na ${s}`,h.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa combinação.`;return}if(s){v.textContent=`Achados da ${s}`,h.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa loja.`;return}if(c){v.textContent=`Ofertas de ${c}`,h.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa categoria.`;return}if(u){v.textContent=`Resultados para “${u}”`,h.textContent=`${e} resultado${e===1?"":"s"} encontrado${e===1?"":"s"}.`;return}v.textContent="Todos os produtos",h.textContent="Produtos selecionados com bons descontos e ótimo custo-benefício."}function g(e=!0){const a=le();ue(),de(),me(a.length),se(a),e&&document.querySelector("#achados")?.scrollIntoView({behavior:"smooth",block:"start"})}function pe(){s="",c="",u="",l.value="",g()}T.forEach(e=>{e.addEventListener("click",()=>{s=e.dataset.loja||"",g()})});N.forEach(e=>{e.addEventListener("click",()=>{c=e.dataset.categoria||"",g()})});function x(){u=l.value.trim(),g()}U.addEventListener("click",x);l.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),x())});l.addEventListener("input",()=>{l.value.trim()||(u="",g(!1))});L?.addEventListener("click",e=>{const a=e.target.closest("[data-remover-filtro]");if(!a)return;const t=a.dataset.removerFiltro;t==="loja"&&(s=""),t==="categoria"&&(c=""),t==="pesquisa"&&(u="",l.value=""),g()});X?.addEventListener("click",pe);ee();const F=document.querySelector(".hero-search"),C=document.getElementById("header-scroll-search"),p=document.getElementById("campo-pesquisa-sticky"),fe=document.getElementById("botao-pesquisa-sticky");function E(){if(!F||!C||window.innerWidth<1100){document.body.classList.remove("header-search-visible"),C?.setAttribute("aria-hidden","true");return}const e=F.getBoundingClientRect().bottom,a=document.querySelector("header")?.offsetHeight||84,t=e<=a+12;document.body.classList.toggle("header-search-visible",t),C.setAttribute("aria-hidden",t?"false":"true"),t&&document.activeElement!==p&&(p.value=l.value)}function O(){l.value=p.value,x(),document.getElementById("achados")?.scrollIntoView({behavior:"smooth",block:"start"})}fe?.addEventListener("click",O);p?.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),O())});p?.addEventListener("input",()=>{p.value.trim()||(l.value="",u="",g(!1))});l?.addEventListener("input",()=>{p&&document.activeElement!==p&&(p.value=l.value)});window.addEventListener("scroll",E,{passive:!0});window.addEventListener("resize",E);window.addEventListener("load",E);E();
