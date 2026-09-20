export function analisarTextoOferta(texto) {
  const original = String(texto || '').trim();
  const url = original.match(/https?:\/\/[^\s<>]+/i)?.[0]?.replace(/[).,!?]+$/, '') || '';
  const semLinks = original.replace(/https?:\/\/[^\s<>]+/gi, '');
  const valores = [...semLinks.matchAll(/R\$\s*((?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2}|\.\d{2})?)/gi)]
    .map(m => m[1].includes(',') ? Number(m[1].replaceAll('.', '').replace(',', '.')) : Number(m[1]));
  const nome = semLinks
    .replace(/^\s*(?:d[êe] uma olhada em|confira|olha s[oó])\s*/i, '')
    .replace(/\s+(?:por|a partir de)\s+R\$[\s\S]*$/i, '')
    .replace(/\s*R\$[\s\S]*$/i, '')
    .replace(/\s*compre\s+na\s+shopee\s+agora[! .]*$/i, '')
    .replace(/\s+/g, ' ').trim().slice(0, 240);
  return { url, nome, valores, faixa: valores.length > 1 };
}
