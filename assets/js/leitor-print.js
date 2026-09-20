import { createWorker } from 'tesseract.js';
import { analisarTextoOferta } from './texto-oferta.js';

const arquivo = document.querySelector('#print-produto');
const ler = document.querySelector('#escanear-print');
const aplicar = document.querySelector('#aplicar-print');
const status = document.querySelector('#status-print');
const nome = document.querySelector('#nome-print');
const preco = document.querySelector('#preco-print');

arquivo.addEventListener('change', () => {
  aplicar.disabled = true;
  nome.value = '';
  preco.replaceChildren(new Option('Selecione após ler o print', ''));
});

ler.addEventListener('click', async () => {
  const foto = arquivo.files[0];
  if (!foto) { status.textContent = 'Selecione um print primeiro.'; return; }
  ler.disabled = true;
  arquivo.disabled = true;
  aplicar.disabled = true;
  let worker;
  let expirou = false;
  let temporizador;
  status.textContent = 'Carregando leitor. Na primeira vez pode demorar...';
  try {
    const operacao = async () => {
      worker = await createWorker('por', 1, {
        logger: m => {
          if (!expirou && m.status === 'recognizing text') status.textContent = `Lendo print: ${Math.round(m.progress * 100)}%`;
        }
      });
      if (expirou) { await worker.terminate(); return null; }
      return worker.recognize(foto);
    };
    const resultado = await Promise.race([
      operacao(),
      new Promise((_, reject) => {
        temporizador = setTimeout(() => { expirou = true; reject(new Error('A leitura demorou demais. Tente novamente com a internet conectada e um recorte do nome e preço.')); }, 120000);
      })
    ]);
    const texto = resultado.data.text.trim();
    if (!texto) throw new Error('Não encontrei texto legível. Use um print mais nítido com nome e preço.');
    const linhas = texto.split('\n').map(x => x.trim()).filter(x =>
      x.length >= 15 && !/R\$|frete|cupom|vendidos|avalia|comprar|carrinho|entrega|desconto/i.test(x));
    nome.value = linhas.sort((a,b) => b.length - a.length)[0] || '';
    const valores = [...new Set(analisarTextoOferta(texto).valores)];
    preco.replaceChildren(new Option('Escolha o preço correto', ''));
    for (const valor of valores) {
      const moeda = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      preco.add(new Option(moeda, moeda));
    }
    if (valores.length === 1) preco.selectedIndex = 1;
    document.querySelector('#texto-oferta').value = texto;
    aplicar.disabled = false;
    status.textContent = 'Leitura concluída. O nome é uma sugestão: corrija palavras ou linhas faltantes. Confira o preço; o texto completo está abaixo.';
  } catch (erro) {
    status.textContent = erro.message || 'Não foi possível ler o print. Tente novamente.';
  } finally {
    clearTimeout(temporizador);
    if (worker) await worker.terminate().catch(() => {});
    ler.disabled = false;
    arquivo.disabled = false;
  }
});

aplicar.addEventListener('click', () => {
  if (!nome.value.trim()) { status.textContent = 'Preencha o nome do produto antes de usar os dados.'; return; }
  window.dispatchEvent(new CustomEvent('smartdeals:print-conferido', {
    detail: { nome: nome.value.trim(), preco: preco.value }
  }));
});
