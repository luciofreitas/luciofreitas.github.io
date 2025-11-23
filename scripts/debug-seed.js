const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const seed = 'https://lista.mercadolivre.com.br/amortecedor';

async function fetchUrl(url){
  try{
    const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
    return res.data;
  } catch(e){ console.error('fetch error', e.message); return null; }
}

function parseSearchPage(html){
  const $ = cheerio.load(html);
  const links = new Set();
  $('a.ui-search-link').each((i, el) => {
    const href = $(el).attr('href');
    if (href) links.add(href.split('?')[0]);
  });
  $('[data-search-item] a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) links.add(href.split('?')[0]);
  });
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('MLB-')) links.add(href.split('?')[0]);
  });
  return Array.from(links);
}

(async ()=>{
  console.log('Fetching seed:', seed);
  const html = await fetchUrl(seed);
  if (!html) return console.log('no html');
  const links = parseSearchPage(html);
  console.log('found links:', links.length);
  console.log('sample links:');
  console.log(links.slice(0,20).join('\n'));
})();