import{o as re,s as ie,l as ne,q as se,c as ce,d as le,g as ue}from"./pwa-_RSgl-5D.js";/* empty css              */const O=document.querySelector("#deals-grid"),v=document.querySelector("#mensagem-produtos"),l=document.querySelector("#campo-pesquisa"),de=document.querySelector("#botao-pesquisa"),$=document.getElementById("aviso-desenvolvimento"),me=document.getElementById("fechar-aviso-desenvolvimento");try{$&&sessionStorage.getItem("smartdeals-aviso-v1")!=="fechado"&&($.hidden=!1)}catch{$&&($.hidden=!1)}me?.addEventListener("click",()=>{$.hidden=!0;try{sessionStorage.setItem("smartdeals-aviso-v1","fechado")}catch{}});const J=document.querySelectorAll(".store-card"),K=document.querySelectorAll(".category-card"),C=document.querySelector(".nav-categorias"),x=document.querySelector(".nav-categorias-botao"),h=document.getElementById("menu-categorias"),H=document.querySelector("header");function y(){C?.classList.remove("is-open"),h?.classList.remove("is-open"),x?.setAttribute("aria-expanded","false")}function Q(){!h||!C||!H||(y(),window.matchMedia("(max-width: 760px)").matches?H.append(h):C.append(h))}x?.addEventListener("click",()=>{const e=x.getAttribute("aria-expanded")!=="true";y(),e&&(C.classList.add("is-open"),h.classList.add("is-open"),x.setAttribute("aria-expanded","true"))});document.addEventListener("click",e=>{!C?.contains(e.target)&&!h?.contains(e.target)&&y()});document.addEventListener("keydown",e=>{e.key==="Escape"&&y()});window.addEventListener("resize",Q);Q();const G=document.querySelector("#filtros-ativos"),B=document.querySelector("#lista-filtros-ativos"),fe=document.querySelector("#botao-limpar-filtros"),E=document.querySelector("#titulo-produtos"),q=document.querySelector("#descricao-produtos"),b=document.querySelector("#botao-carregar-mais");let D=[],k=[],s="",c="",u="",S=null,I=!1,A=!1;const V=24;function p(e,t=""){return e??t}function n(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function m(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()}function P(e,t){return m(e)===m(t)}const pe=[{categoria:"Bebê & Infantil",termos:["bebe","berco","bercinho","mosquiteiro","mamadeira","chupeta","fralda","carrinho de bebe","cadeira de bebe","banheira bebe","maternidade","infantil","crianca"]},{categoria:"Beleza",termos:["maquiagem","batom","base facial","rimel","mascara de cilios","perfume","hidratante","skincare","creme facial","oleo capilar","oleo de cabelo","reparador de pontas","serum capilar","leave-in","shampoo","condicionador","mascara capilar","tratamento capilar","pantene","secador","chapinha","barbeador","depilador","unha","esmalte","cabelo"]},{categoria:"Moda",termos:["calcinha","lingerie","sutia","biquini","maio","cueca","meia","meias","soquete","meia soquete","kit de meias","short","shorts","bermuda","calca","jeans","legging","vestido","saia","camisa","camiseta","blusa","pijama","tenis","chinelo","sandalia","sapato","bolsa","mochila","carteira","oculos","relogio","anel","alianca","colar","pulseira","moda feminina","moda masculina","roupa"]},{categoria:"Games",termos:["playstation","ps4","ps5","xbox","nintendo","switch","controle gamer","joystick","gamepad","gamer","jogo","console","headset gamer"]},{categoria:"Informática",termos:["notebook","laptop","computador","pc ","monitor","teclado","mouse","webcam","ssd","hd externo","pendrive","roteador","impressora","memoria ram","placa de video","gabinete","hub usb","adaptador usb"]},{categoria:"Eletrônicos",termos:["celular","smartphone","fone","bluetooth","carregador","power bank","caixa de som","smartwatch","tablet","camera","microfone","tv ","televisao","projetor","cabo usb","lightning","tipo-c","type-c"]},{categoria:"Esportes",termos:["academia","fitness","halter","musculacao","corrida","ciclismo","bicicleta","bike","bola","futebol","volei","basquete","yoga","treino","esportivo"]},{categoria:"Pets",termos:["pet","cachorro","gato","cao ","racao","coleira","arranhador","comedouro","bebedouro pet","areia gato","casinha pet","brinquedo pet"]},{categoria:"Automotivo",termos:["carro","automotivo","veiculo","moto","motocicleta","pneu","volante","farol","lampada automotiva","tapete carro","suporte veicular","compressor de pneu"]},{categoria:"Ferramentas",termos:["furadeira","parafusadeira","chave catraca","jogo de chave","alicate","martelo","serra","broca","ferramenta","multimetro","soprador","esmerilhadeira"]},{categoria:"Casa & Cozinha",termos:["cozinha","panela","frigideira","omeleteira","chaleira","torneira","ralador","fatiador","cortador","pote","marmita","lixeira","escorredor","organizador","prateleira","cama","travesseiro","lençol","lencol","toalha","tapete","papel de parede","decoracao","decoracoes","decorativo","vaso","vasos","vasilha","vasilhas","utensilio","utensilios","casa e construcao","casa & construcao","porta retrato","porta chaves","ventilador","luminaria","sanduicheira","mixer","liquidificador","cafeteira","air fryer","aspirador","cabide"]}];function X(e){const t=m([e?.nome,e?.categoria,e?.descricao].filter(Boolean).join(" "));for(const i of pe)if(i.termos.some(o=>t.includes(m(o))))return i.categoria;const a=m(e?.categoria);return{casa:"Casa & Cozinha","casa e cozinha":"Casa & Cozinha","casa & cozinha":"Casa & Cozinha",eletronicos:"Eletrônicos",informatica:"Informática",bebe:"Bebê & Infantil",infantil:"Bebê & Infantil",esporte:"Esportes",ferramentas:"Ferramentas",beleza:"Beleza",moda:"Moda",games:"Games",pets:"Pets",automotivo:"Automotivo"}[a]||e?.categoria||"Outros"}function ge(e){const t=String(e??"").trim().replace(/\s/g,"").replace(/R\$/gi,"").replace(/\./g,"").replace(",","."),a=Number(t);return Number.isFinite(a)?a:0}function _(e,t=""){const a=String(e??"").trim();if(!a)return t;const r=ge(a);return r<=0?a:r.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function ve(e){const t=e.expiraEm;if(!t)return!0;const a=typeof t.toDate=="function"?t.toDate():t.seconds?new Date(t.seconds*1e3):new Date(t);return Number.isNaN(a.getTime())||a.getTime()>Date.now()}async function Y(e=!0){if(!(I||!e&&A))try{I=!0,b.disabled=!0,b.textContent="Carregando...",e&&(D=[],S=null,A=!1,v.hidden=!1,v.textContent="Carregando produtos...");const t=[re("criadoEm","desc")];S&&t.push(ie(S)),t.push(ne(V));const a=se(ce(le,"produtos"),...t),r=await ue(a);S=r.docs.at(-1)||S,A=r.size<V;const i=r.docs.map(o=>({id:o.id,...o.data()})).filter(ve);D.push(...i),g(!1),b.hidden=A}catch(t){console.error("Erro ao carregar produtos:",t),v.hidden=!1,v.textContent="Não foi possível carregar os produtos do Firebase."}finally{I=!1,b.disabled=!1,b.textContent="Carregar mais produtos"}}function he(e){return Array.isArray(e.imagens)&&e.imagens.length>0?e.imagens.filter(Boolean):e.imagem?[e.imagem]:["https://placehold.co/600x600?text=Produto"]}function be(e,t){return e.map((a,r)=>`
        <img
          src="${n(a)}"
          alt="${n(t)} - imagem ${r+1}"
          class="product-photo carousel-slide ${r===0?"active":""}"
          data-slide="${r}"
          loading="${r===0?"eager":"lazy"}"
          onerror="this.src='https://placehold.co/600x600?text=Produto'"
        >
      `).join("")}function ye(e){return e.length<=1?"":`
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
  `}function Ee(e){return e.length<=1?"":`
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
  `}function qe(e){const t=he(e),a=n(p(e.badge)),r=p(e.nome,"Produto sem nome"),i=n(r),o=n(p(e.loja,"Loja")),d=n(p(e.avaliacao,"—")),L=n(_(e.precoAntigo)),ae=n(_(e.precoAtual,"Consulte")),N=n(p(e.parcelas)),T=n(p(e.economia)),R=n(p(e.score)),oe=n(p(e.link,"#"));return`
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
          ${be(t,r)}
        </div>

        ${Ee(t)}
        ${ye(t)}
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

        ${L?`
              <p class="old-price">
                De ${L}
              </p>
            `:""}

        <p class="current-price">
          ${ae}
        </p>

        ${N?`
              <p class="installments">
                ou ${N}
              </p>
            `:""}

        <div class="product-info">

          <span>
            ${T?`Economize ${T}`:""}
          </span>

          <strong>
            ${R?`SmartScore ${R}`:""}
          </strong>

        </div>

        <a
          href="${oe}"
          class="product-button"
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          Ver melhor oferta
        </a>

      </div>
    </article>
  `}function Z(){k.forEach(e=>{clearInterval(e)}),k=[]}function F(e,t){const a=e.querySelectorAll(".carousel-slide"),r=e.querySelectorAll(".carousel-indicator");if(a.length===0)return;let i=t;i>=a.length&&(i=0),i<0&&(i=a.length-1),a.forEach((o,d)=>{o.classList.toggle("active",d===i)}),r.forEach((o,d)=>{o.classList.toggle("active",d===i)}),e.dataset.currentSlide=String(i)}function ee(e){const t=Number(e.dataset.currentSlide||0);F(e,t+1)}function W(e){return e.querySelectorAll(".carousel-slide").length<=1?null:setInterval(()=>{ee(e)},3e3)}function Se(){Z(),document.querySelectorAll(".product-carousel").forEach(t=>{let a=W(t);a&&k.push(a);const r=t.querySelector(".carousel-previous"),i=t.querySelector(".carousel-next");r?.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();const d=Number(t.dataset.currentSlide||0);F(t,d-1)}),i?.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),ee(t)}),t.querySelectorAll(".carousel-indicator").forEach(o=>{o.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation();const L=Number(o.dataset.slideTo);F(t,L)})}),t.addEventListener("mouseenter",()=>{a&&(clearInterval(a),a=null)}),t.addEventListener("mouseleave",()=>{a||(a=W(t),a&&k.push(a))})})}function $e(e){if(Z(),O.innerHTML="",e.length===0){v.hidden=!1,v.textContent="Nenhum produto encontrado com esses filtros.";return}v.hidden=!0,O.innerHTML=e.map(qe).join(""),Se()}function Ce(e){if(!u)return!0;const t=m(e.nome),a=m(e.loja),r=m(X(e)),i=m(e.badge),o=m(u);return t.includes(o)||a.includes(o)||r.includes(o)||i.includes(o)}function Le(){return D.filter(e=>{const t=!s||P(e.loja,s),a=!c||P(X(e),c),r=Ce(e);return t&&a&&r})}function Ae(){J.forEach(e=>{e.classList.toggle("active",P(e.dataset.loja,s))}),K.forEach(e=>{e.classList.toggle("active",P(e.dataset.categoria,c))})}function j(e,t){return`
    <button
      type="button"
      class="active-filter-tag"
      data-remover-filtro="${t}"
      title="Remover filtro"
    >
      <span>${n(e)}</span>
      <strong>×</strong>
    </button>
  `}function xe(){const e=[];if(s&&e.push(j(s,"loja")),c&&e.push(j(c,"categoria")),u&&e.push(j(`Busca: ${u}`,"pesquisa")),e.length===0){G.hidden=!0,B.innerHTML="";return}G.hidden=!1,B.innerHTML=e.join("")}function ke(e){if(s&&c){E.textContent=`${c} na ${s}`,q.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa combinação.`;return}if(s){E.textContent=`Achados da ${s}`,q.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa loja.`;return}if(c){E.textContent=`Ofertas de ${c}`,q.textContent=`${e} produto${e===1?"":"s"} encontrado${e===1?"":"s"} nessa categoria.`;return}if(u){E.textContent=`Resultados para “${u}”`,q.textContent=`${e} resultado${e===1?"":"s"} encontrado${e===1?"":"s"}.`;return}E.textContent="Todos os produtos",q.textContent="Produtos selecionados com bons descontos e ótimo custo-benefício."}function g(e=!0){const t=Le();Ae(),xe(),ke(t.length),$e(t),e&&document.querySelector("#achados")?.scrollIntoView({behavior:"smooth",block:"start"})}function Pe(){s="",c="",u="",l.value="",g()}J.forEach(e=>{e.addEventListener("click",()=>{s=e.dataset.loja||"",g()})});K.forEach(e=>{e.addEventListener("click",()=>{c=e.dataset.categoria||"",g(),h?.contains(e)&&(y(),document.getElementById("achados")?.scrollIntoView({behavior:"smooth",block:"start"}))})});function M(){u=l.value.trim(),g()}de.addEventListener("click",M);l.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),M())});l.addEventListener("input",()=>{l.value.trim()||(u="",g(!1))});B?.addEventListener("click",e=>{const t=e.target.closest("[data-remover-filtro]");if(!t)return;const a=t.dataset.removerFiltro;a==="loja"&&(s=""),a==="categoria"&&(c=""),a==="pesquisa"&&(u="",l.value=""),g()});fe?.addEventListener("click",Pe);b?.addEventListener("click",()=>Y(!1));Y();const U=document.querySelector(".hero-search"),z=document.getElementById("header-scroll-search"),f=document.getElementById("campo-pesquisa-sticky"),we=document.getElementById("botao-pesquisa-sticky");function w(){if(!U||!z||window.innerWidth>760&&window.innerWidth<1100){document.body.classList.remove("header-search-visible"),z?.setAttribute("aria-hidden","true");return}const e=U.getBoundingClientRect().bottom,t=document.querySelector("header")?.offsetHeight||84,a=e<=t+12;document.body.classList.toggle("header-search-visible",a),z.setAttribute("aria-hidden",a?"false":"true"),a&&y(),a&&document.activeElement!==f&&(f.value=l.value)}function te(){l.value=f.value,M(),document.getElementById("achados")?.scrollIntoView({behavior:"smooth",block:"start"})}we?.addEventListener("click",te);f?.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),te())});f?.addEventListener("input",()=>{f.value.trim()||(l.value="",u="",g(!1))});l?.addEventListener("input",()=>{f&&document.activeElement!==f&&(f.value=l.value)});window.addEventListener("scroll",w,{passive:!0});window.addEventListener("resize",w);window.addEventListener("load",w);w();
