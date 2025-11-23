#!/usr/bin/env node
// Improved scraper to collect parts from MercadoLivre search pages and save normalized JSON.
// Features: robots.txt basic check, configurable delays, retries, JSON-LD + OG extraction fallbacks.
// Usage: node collect-parts.js --limit=500 --out=backend/parts_5000_pending.json --delay-min=1000 --delay-max=2500

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const argv = require('minimist')(process.argv.slice(2));
const LIMIT = parseInt(argv.limit || argv.l || '100', 10);
const OUTFILE = path.resolve(argv.out || path.resolve(__dirname, '..', 'backend', 'parts_5000_pending.json'));
const DELAY_MIN = parseInt(argv['delay-min'] || '1000', 10);
const DELAY_MAX = parseInt(argv['delay-max'] || '2500', 10);
const RETRIES = parseInt(argv.retries || '2', 10);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// default seeds (MercadoLivre search pages)
let seeds = [
  'https://lista.mercadolivre.com.br/amortecedor',
  'https://lista.mercadolivre.com.br/filtro-de-óleo',
  'https://lista.mercadolivre.com.br/pastilha-de-freio',
  'https://lista.mercadolivre.com.br/filtro-de-ar',
  'https://lista.mercadolivre.com.br/vela-de-ignição-ngk'
];

// Allow overriding seeds from a JSON file provided via --seeds-file
const SEEDS_FILE = argv['seeds-file'] || argv['seeds_file'];
if (SEEDS_FILE) {
  try {
    const filePath = path.resolve(SEEDS_FILE);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length) seeds = parsed;
      else console.warn('Seeds file parsed but contained no entries:', filePath);
    } else {
      console.warn('Seeds file not found:', filePath);
    }
  } catch (e) {
    console.warn('Failed to read seeds file:', SEEDS_FILE, e.message);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchUrl(url, tries = 0) {
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 20000 });
    return res.data;
  } catch (err) {
    if (tries < RETRIES) {
      console.warn('retry fetch', url, 'attempt', tries + 1);
      await sleep(1000 * (tries + 1));
      return fetchUrl(url, tries + 1);
    }
    console.warn('fetch error', url, err.message);
    return null;
  }
}

function normalizePrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9,\.]/g, '').trim();
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function simpleRobotsCheckFactory() {
  const cache = {};
  return async function isAllowed(url) {
    try {
      const u = new URL(url);
      // Allow crawling MercadoLivre hosts regardless of robots.txt (per user approval)
      // This bypass is intentionally narrow: it only applies to hosts that include 'mercadolivre'
      if (u.hostname && u.hostname.toLowerCase().includes('mercadolivre')) return true;
      const origin = u.origin;
      if (cache[origin]) {
        const disallows = cache[origin];
        return !disallows.some(d => u.pathname.startsWith(d));
      }
      const robotsUrl = origin + '/robots.txt';
      const txt = await fetchUrl(robotsUrl) || '';
      const disallows = [];
      txt.split('\n').forEach(line => {
        const l = line.trim();
        if (!l) return;
        if (/^Disallow:/i.test(l)) {
          const parts = l.split(':');
          if (parts[1]) disallows.push(parts.slice(1).join(':').trim());
        }
      });
      cache[origin] = disallows;
      return !disallows.some(d => d && u.pathname.startsWith(d));
    } catch (e) {
      return true; // if robots can't be read, allow (conservative fallback)
    }
  };
}

async function parseSearchPage(html, seedUrl) {
  // handle sitemap XML with <loc> entries
  if (html && (html.trim().startsWith('<?xml') || html.includes('<urlset') || html.includes('<sitemapindex'))) {
    const locs = [];
    const re = /<loc>(.*?)<\/loc>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      try { locs.push(m[1].trim()); } catch (e) { /* ignore */ }
    }
    return locs;
  }

  const $ = cheerio.load(html);
  const links = new Set();

  // common product-listing selectors (retailers/manufacturers)
  const listingSelectors = [
    'a.product-link', 'a.card a', '.product-item a', '.produto a', '.produto-link a', 'a[href*="/p/"]',
    'a[href*="/produto"], a[href*="/produto-"]', 'a[href*="/produto/"]', 'a[href*="/produto"]'
  ];
  for (const sel of listingSelectors) {
    $(sel).each((i, el) => {
      const href = $(el).attr('href');
      if (href) links.add(href.split('?')[0]);
    });
  }

  // generic anchors fallback: collect anchors that look like product pages
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const clean = href.split('?')[0];
    // ignore anchors, javascript and obvious navigation links
    if (clean.startsWith('#') || clean.startsWith('javascript:')) return;
    // heuristics: looks like a product if it contains common tokens or numeric ids
    if (/\/p\//.test(clean) || /produto/.test(clean) || /\/produto-/.test(clean) || /\/produto\//.test(clean) || /\/[A-Za-z0-9\-]+-p\//.test(clean) || /\/produto_id\//.test(clean) || /product|sku|produto|p\//i.test(clean)) {
      links.add(clean);
    }
  });

  // resolve relative URLs against seed origin when possible
  const resolved = [];
  try {
    const base = seedUrl ? new URL(seedUrl).origin : null;
    for (const u of Array.from(links)) {
      try {
        const resolvedUrl = base && !/^https?:\/\//i.test(u) ? new URL(u, base).toString() : u;
        resolved.push(resolvedUrl);
      } catch (e) {
        resolved.push(u);
      }
    }
  } catch (e) {
    for (const u of Array.from(links)) resolved.push(u);
  }

  // prefer links that include product-like tokens
  const products = resolved.filter(u => /\/p\//.test(u) || /produto/.test(u) || /\/produto-/.test(u) || /\/produto\//.test(u) || /sku=|sku\//i.test(u));
  return products.length ? products : resolved;
}

function extractFromLD(jsonld) {
  try {
    const v = JSON.parse(jsonld);
    if (Array.isArray(v)) {
      for (const item of v) if (item['@type'] && item['@type'].toLowerCase().includes('product')) return item;
    }
    if (v && v['@type'] && v['@type'].toLowerCase().includes('product')) return v;
  } catch (e) {
    return null;
  }
  return null;
}

function inferGroupingFromUrl(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('filtro-de-ar') || u.includes('filtro-de-oleo') || u.includes('filtro')) return 'Filtros';
  if (u.includes('amortecedor')) return 'Suspensão';
  if (u.includes('pastilha') || u.includes('pastilha-de-freio')) return 'Freios';
  if (u.includes('vela') || u.includes('vela-de-igni') ) return 'Ignição';
  if (u.includes('luz') || u.includes('luzes')) return 'Elétrica';
  return null;
}

function sanitizePartNumber(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  let s = candidate.trim();
  // remove common url fragments and leftover '/p' markers
  s = s.replace(/https?:\/\/.*/gi, '');
  // remove trailing '/p' markers or '/p' with timestamps
  s = s.replace(/\/?p\d.*$/i, '');
  s = s.replace(/\/?p[-_\/]?20\d{2}.*$/i, '');
  // remove ISO-like dates that may have been appended
  s = s.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '');
  // remove stray 'http' or 'https' tokens
  s = s.replace(/http[s]*/gi, '');
  // remove common timestamp fragments like '2025-11-21' or 'p2025'
  s = s.replace(/20\d{2}[-_/]?\d{2}[-_/]?\d{2}/g, '');
  // remove weird characters except allowed separators
  s = s.replace(/[^A-Za-z0-9\-_/\.]/g, ' ');
  // collapse whitespace and separators
  s = s.replace(/[\s_]+/g, '-');
  // trim separators
  s = s.replace(/^[-._\/]+|[-._\/]+$/g, '');
  // limit length
  if (s.length > 60) s = s.slice(0, 60);
  if (!s) return null;
  // normalize repeated hyphens
  s = s.replace(/-+/g, '-');
  // require at least one digit
  if (!/\d/.test(s)) return null;
  // discard very long random-like tokens (likely hashes/base64)
  const alphaNumRun = s.replace(/[-_.\/]/g, '');
  if (alphaNumRun.length > 40 && /^[A-Za-z0-9]+$/.test(alphaNumRun) && /[A-Z]/.test(alphaNumRun) && /[a-z]/.test(alphaNumRun) && /\d/.test(alphaNumRun)) return null;
  // discard tokens with embedded 'https' or too many slashes
  if (/https?/i.test(s) || (s.match(/\//g) || []).length > 2) return null;
  return s;
}

async function parseProductPage(html, url) {
  const $ = cheerio.load(html);
  // Try JSON-LD product
  let product = null;
  $('script[type="application/ld+json"]').each((i, el) => {
    const text = $(el).contents().text();
    const p = extractFromLD(text);
    if (p) product = p;
  });

  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const title = (product && (product.name || product.title)) || ogTitle || $('h1, .product-title, .title, .ui-pdp-title').first().text().trim() || null;

  // Price: JSON-LD > meta > selectors
  let price = null;
  if (product && product.offers) {
    const offers = product.offers;
    price = offers && offers.price ? parseFloat(offers.price) : price;
  }
  if (!price) {
    const priceSel = $('[class*=price], .andes-money-amount__fraction, [data-testid="price"]').first();
    const priceText = priceSel && priceSel.text ? priceSel.text().trim() : null;
    price = normalizePrice(priceText) || price;
  }

  const description = (product && (product.description || product.summary)) || $('#description, #description-text, .ui-pdp-description__content, .ui-pdp-description__text').text().trim().slice(0, 2000) || null;

  // manufacturer / brand
  const manufacturer = (product && (product.brand && (product.brand.name || product.brand))) || $('a[aria-label*="marca"], .ui-pdp-subtitle').first().text().trim() || null;

  // try to extract part number from sku, mpn, model, or title
  let part_number = null;
  if (product && (product.sku || product.model || product.mpn)) part_number = product.sku || product.model || product.mpn;
  if (!part_number && title) {
    const pnMatch = title.match(/[A-Za-z0-9\-]{3,40}/g);
    if (pnMatch && pnMatch.length) part_number = pnMatch[0];
  }

  // try harder: look for common labels around part numbers on product pages
  if (!part_number) {
    const textAll = ($('body').text() || '').replace(/\s+/g, ' ');
    // look for keywords and capture nearby token that contains at least one digit
    const labelRe = /(C[oó]digo(?: de pe[cç]a)?|Refer[eê]ncia|Ref\.?|Part(?: |-)?Number|Part Number|SKU|MPN)\s*[:\-]?\s*([A-Za-z0-9\-_/\.]*\d+[A-Za-z0-9\-_/\.]*)/i;
    const m = labelRe.exec(textAll);
    if (m && m[2]) part_number = m[2].trim();
  }

  // sanitize the candidate part number
  part_number = sanitizePartNumber(part_number);

  // specifications / key-value attributes (try JSON-LD additionalProperty first)
  let specifications = {};
  if (product && product.additionalProperty) {
    try {
      const ap = Array.isArray(product.additionalProperty) ? product.additionalProperty : [product.additionalProperty];
      ap.forEach(a => { if (a.name && a.value) specifications[a.name] = a.value; });
    } catch (e) { /* ignore */ }
  }
  // fallback: read attribute lists/tables
  if (!Object.keys(specifications).length) {
    $('.specs, .ui-pdp-attributes__container, .item-attributes, table.specs, table.attributes').each((i, el) => {
      $(el).find('tr, li, div').each((j, row) => {
        const key = $(row).find('th, .attr-key, span')?.first().text()?.trim();
        const val = $(row).find('td, .attr-value, span')?.last().text()?.trim();
        if (key && val) specifications[key] = val;
      });
    });
  }

  // applications / compatibility detection: look for vehicle lists or year ranges
  let applications = null;
  try {
    const appCandidates = [];
    $('table, .applications, .compatibility, .product-compatibility, .apps, .compat').each((i, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (/\b\d{4}\b/.test(txt) || /Fiat|Volkswagen|Chevrolet|Ford|Toyota|Renault|Honda|Nissan/i.test(txt)) {
        appCandidates.push(txt);
      }
    });
    if (appCandidates.length) {
      // try to split lines into applications
      applications = appCandidates.join('\n').split(/\n|;|\|/).map(s => s.trim()).filter(Boolean).slice(0,20);
    }
  } catch (e) { applications = null; }

  const image = $('meta[property="og:image"]').attr('content') || $('img.product-image, img.ui-pdp-image').first().attr('src') || null;

  return {
    // Full normalized item matching parts_db.json structure
    name: title || null,
    manufacturer: manufacturer || null,
    part_number: part_number || null,
    category: (product && product.category) || null,
    description: description || null,
    specifications: Object.keys(specifications).length ? specifications : null,
    applications: applications || null,
    image: image || null,
    created_at: new Date().toISOString()
  };
}

function looksLikeCategoryPage(html) {
  // heuristic: many links / many headings and short descriptions
  try {
    const $ = cheerio.load(html);
    const linkCount = $('a[href]').length;
    const headings = $('h2,h3,h4').length;
    // If page has many links and many headings it's likely a category
    return linkCount > 30 && headings > 3;
  } catch (e) {
    return false;
  }
}

async function collect(limit) {
  const results = [];
  const isAllowed = simpleRobotsCheckFactory();
  const visited = new Set();
  for (const seed of seeds) {
    if (results.length >= limit) break;
    console.log('Seed:', seed);
    const seedHtml = await fetchUrl(seed);
    if (!seedHtml) continue;
    const links = await parseSearchPage(seedHtml, seed);
    console.log('Found links on seed:', links.length);
    for (const l of links) {
      if (results.length >= limit) break;
      try {
        if (visited.has(l)) continue;
        const allowed = await isAllowed(l);
        if (!allowed) { console.log('Skipping (robots):', l); continue; }
        const delay = DELAY_MIN + Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1));
        await sleep(delay);
        const prodHtml = await fetchUrl(l);
        if (!prodHtml) continue;
        const item = await parseProductPage(prodHtml, l);
        // infer grouping from the seed that produced this product link
        item.grouping = inferGroupingFromUrl(seed) || null;
        item.id = require('crypto').createHash('sha1').update(l).digest('hex');
        // sanitize and accept only if we have both part_number and name
        item.part_number = sanitizePartNumber(item.part_number);
        // prefer name from parsed product; if title is not suitable, try to infer from selectors
        if (item.part_number && item.name) {
          // normalize output structure to match parts_db.json
          const out = {
            id: require('crypto').createHash('sha1').update(l).digest('hex'),
            name: (item.name || '').trim() || null,
            category: item.category || null,
            manufacturer: (item.manufacturer || '').trim() || null,
            part_number: item.part_number,
            description: (item.description || '').trim() || null,
            specifications: item.specifications || null,
            applications: item.applications || null,
            image: item.image || null,
            source_url: l,
            grouping: inferGroupingFromUrl(seed) || null,
            created_at: item.created_at || new Date().toISOString()
          };
          results.push(out);
          visited.add(l);
          console.log(`Collected ${results.length}:`, (out.part_number || out.name).slice(0, 120));
        } else {
          // If no part_number, but page looks like a category, try one-level deeper crawl
          if (looksLikeCategoryPage(prodHtml)) {
            const subLinks = await parseSearchPage(prodHtml, l);
            console.log('Following category links:', subLinks.length);
            for (const sl of subLinks) {
              if (results.length >= limit) break;
              if (visited.has(sl)) continue;
              const allowed2 = await isAllowed(sl);
              if (!allowed2) { console.log('Skipping (robots):', sl); continue; }
              await sleep(DELAY_MIN + Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)));
              const slHtml = await fetchUrl(sl);
              if (!slHtml) continue;
              const subItem = await parseProductPage(slHtml, sl);
              subItem.grouping = inferGroupingFromUrl(seed) || null;
              subItem.id = require('crypto').createHash('sha1').update(sl).digest('hex');
              subItem.part_number = sanitizePartNumber(subItem.part_number);
              if (subItem.part_number && subItem.name) {
                const out2 = {
                  id: require('crypto').createHash('sha1').update(sl).digest('hex'),
                  name: (subItem.name || '').trim() || null,
                  category: subItem.category || null,
                  manufacturer: (subItem.manufacturer || '').trim() || null,
                  part_number: subItem.part_number,
                  description: (subItem.description || '').trim() || null,
                  specifications: subItem.specifications || null,
                  applications: subItem.applications || null,
                  image: subItem.image || null,
                  source_url: sl,
                  grouping: inferGroupingFromUrl(seed) || null,
                  created_at: subItem.created_at || new Date().toISOString()
                };
                results.push(out2);
                visited.add(sl);
                console.log(`Collected ${results.length}:`, (out2.part_number || out2.name).slice(0, 120));
              }
            }
          }
          // mark this link as visited either way so we don't reprocess it
          visited.add(l);
        }
      } catch (e) {
        console.warn('item parse failed', l, e.message);
      }
    }
    await sleep(1000 + Math.random() * 2000);
  }
  return results.slice(0, limit);
}

(async function main() {
  console.log('Collecting limit=', LIMIT, '->', OUTFILE);
  const collected = await collect(LIMIT);
  let existing = [];
  if (fs.existsSync(OUTFILE)) {
    try { existing = JSON.parse(fs.readFileSync(OUTFILE, 'utf8')); } catch(e){ existing = []; }
  }
  // Keep only items that have a part_number (user requirement)
  // Keep only items that have a validated part_number (must contain a digit)
  // sanitize existing items' part_numbers and keep only valid ones
  const sanitizedExisting = (existing || []).map(i => {
    if (i && i.part_number) i.part_number = sanitizePartNumber(i.part_number);
    return i;
  });
  const newItems = collected.filter(i => i && i.part_number && /\d/.test(i.part_number) && i.name);
  const existingWithPN = (sanitizedExisting || []).filter(i => i && i.part_number && /\d/.test(i.part_number) && i.name);
  // dedupe by part_number, preferring newer items
  const map = {};
  existingWithPN.forEach(i => { if (i.part_number) map[i.part_number] = i; });
  newItems.forEach(i => { if (i.part_number) map[i.part_number] = i; });
  const merged = Object.keys(map).map(k => map[k]);
  fs.writeFileSync(OUTFILE, JSON.stringify(merged, null, 2));
  console.log('Collected (with part_number):', newItems.length, 'Existing (with part_number):', existingWithPN.length, 'Saved total:', merged.length, 'to', OUTFILE);
})();
