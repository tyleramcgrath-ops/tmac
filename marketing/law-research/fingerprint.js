// Fingerprints law-firm homepages from raw HTML + response headers fetched by fetch.sh.
const fs = require('fs');
const cheerio = require('/home/user/tmac/node_modules/.pnpm/cheerio@1.2.0/node_modules/cheerio');
const firms = require('./firms.json');

const reg = h => { const p = h.replace(/^www\./, '').split('.'); return p.length > 2 && /^(co|com|org|net)$/.test(p[p.length - 2]) ? p.slice(-3).join('.') : p.slice(-2).join('.'); };

// [name, regex tested against full HTML+headers]
const PLATFORMS = [
  ['WordPress', /wp-content\/|wp-includes\/|\/wp-json\/|<meta[^>]+generator[^>]+WordPress/i],
  ['Webflow', /data-wf-site=|assets\.website-files\.com|cdn\.prod\.website-files\.com|<meta[^>]+generator[^>]+Webflow/i],
  ['Squarespace', /static1\.squarespace\.com|<!-- This is Squarespace/i],
  ['Wix', /static\.wixstatic\.com|x-wix-request-id|wix-bolt|_wixCIDX/i],
  ['Duda', /irp\.cdn-website\.com|multiscreensite\.com|dudamobile|d2bwo9zemjwxh5\.cloudfront/i],
  ['Drupal', /Drupal\.settings|drupal-settings-json|\/sites\/default\/files\/|x-generator: Drupal|<meta[^>]+generator[^>]+Drupal/i],
  ['Joomla', /<meta[^>]+generator[^>]+Joomla|\/media\/jui\/|\/components\/com_/i],
  ['HubSpot CMS', /hs-sites\.com|hubspotusercontent|x-hs-hub-id|<meta[^>]+generator[^>]+HubSpot/i],
  ['GoDaddy Website Builder', /img1\.wsimg\.com\/isteam|<meta[^>]+generator[^>]+Starfield/i],
  ['Framer', /framerusercontent\.com|<meta[^>]+generator[^>]+Framer/i],
  ['Gatsby', /id="___gatsby"/i],
  ['Astro', /\/_astro\/|<meta[^>]+generator[^>]+Astro/i],
  ['Next.js', /__NEXT_DATA__|\/_next\/static\//i],
  ['Nuxt', /__NUXT__|\/_nuxt\//i],
  ['ASP.NET', /__VIEWSTATE|x-aspnet-version|x-powered-by: ASP\.NET/i],
];
// vendor: [name, host/asset regex, credit-text regex]
const VENDORS = [
  ['Scorpion', /scorpion\.co\b|scorpioncms|\.scorpion\.co\//i, /Scorpion/],
  ['FindLaw / LawyerMarketing (Thomson Reuters)', /(?<![a-z])lawyermarketing\.com|findlaw-website/i, /FindLaw|Thomson Reuters/],
  ['Justia', /justatic\.com|justia\.com\/marketing|\.justia\.(net|site)/i, /Justia/],
  ['LawRank', /lawrank\.com/i, /LawRank/],
  ['Juris Digital', /jurisdigital\.com/i, /Juris Digital/],
  ['Consultwebs', /consultwebs\.com/i, /Consultwebs/],
  ['iLawyerMarketing', /ilawyermarketing\.com/i, /iLawyerMarketing|iLawyer Marketing/i],
  ['OVC Lawyer Marketing', /ovclawyermarketing\.com/i, /OVC Lawyer/i],
  ['Brandlytics', /brandlytics\.io/i, /Brandlytics/i],
  ['EverConvert', /everconvert\.com/i, /EverConvert/i],
  ['Say So Marketing', /saysomarketing\.com/i, /Say So Marketing/i],
  ['BSPE Legal Marketing', /bspelegal|bspe\.(com|co)/i, /BSPE Legal Marketing/i],
  ['SearchNexus', /searchnexus\.com/i, /SearchNexus/i],
  ['TSEG', /tseg\.com/i, /Powered by TSEG/i],
  ['Fyve (Thryv)', /fyve\.|thryv\.com/i, /Designed by Fyve/i],
  ['Gorilla Webtactics', /gorillawebtactics\.com/i, /Marketing by Gorilla/i],
  ['Lifted Logic', /liftedlogic\.com/i, /Lifted Logic/i],
  ['Patrick Marketing', /patrickmarketingny\.com/i, /Patrick Marketing/i],
  ['Acute SEO', /acuteseo\.com/i, /Acute SEO/i],
  ['Woland Web', /wolandweb\.com/i, /Woland Web/i],
  ['Omnizant', /omnizant\.com/i, /Omnizant/i],
  ['Twelve Three Media', /digitalmarketingcompany\.com|twelvethreemedia/i, /Twelve Three Media/i],
  ['OrangeSky Websites', /orangeskywebsites\.com/i, /OrangeSky/i],
  ['Digital Law Marketing', /digitallawmarketing\.com/i, /Digital Law Marketing/i],
  ['Nifty Marketing', /niftymarketing\.com/i, /Nifty Marketing/],
  ['Rankings.io', /rankings\.io/i, /Rankings\.io/],
  ['LawLytics', /lawlytics\.com/i, /LawLytics/i],
  ['Officite', /officite\.com/i, /Officite/],
  ['PaperStreet', /paperstreet\.com/i, /PaperStreet/i],
  ['Foster Web Marketing', /fosterwebmarketing\.com/i, /Foster Web Marketing/i],
  ['Mockingbird Marketing', /mockingbird\.marketing/i, /Mockingbird/],
  ['Market My Market', /marketmymarket\.com/i, /Market My Market/i],
  ['Postali', /postali\.com/i, /Postali/],
  ['On The Map Marketing', /onthemap\.com/i, /On The Map/i],
  ['Hennessey Digital', /hennessey\.com|hennesseydigital/i, /Hennessey Digital/i],
  ['Custom Legal Marketing', /customlegalmarketing\.com/i, /Custom Legal Marketing/i],
  ['Esquire Digital', /esquiredigital\.com/i, /Esquire Digital/i],
  ['Grow Law Firm', /growlawfirm\.com/i, /Grow Law Firm/i],
  ['1Point21 Interactive', /1point21interactive\.com/i, /1Point21/i],
  ['Webris', /webris\.org/i, /WEBRIS/i],
  ['Einstein Law / Einstein Marketer', /einsteinmarketer\.com|einsteinlaw/i, /Einstein Marketer/i],
  ['Martindale-Nolo / Internet Brands', /martindalenolo|nolo\.com\/lawyer-websites|internetbrands/i, /Martindale-Nolo|Martindale/],
  ['Spotlight Branding', /spotlightbranding\.com/i, /Spotlight Branding/i],
  ['BluShark Digital', /blusharkdigital\.com/i, /BluShark/i],
  ['MeanPug', /meanpug\.com/i, /MeanPug/i],
  ['The Modern Firm', /themodernfirm\.com/i, /The Modern Firm/i],
  ['Cardinal Digital', /cardinaldigitalmarketing\.com/i, /Cardinal Digital/i],
  ['Gladiator Law Marketing', /gladiatorlawmarketing\.com/i, /Gladiator Law/i],
  ['Lawmatics', /lawmatics\.com/i, null],
  ['Big Sea / LawLogix etc', /$^/, null],
  ['Crisp Video / Crisp', /crispvideo\.com/i, /Crisp Video/i],
  ['Webstract', /webstract\.com/i, /Webstract/i],
  ['Lexicon Legal Content', /lexiconlegalcontent\.com/i, /Lexicon Legal/i],
  ['Law Firm Sites / Others', /$^/, null],
  ['AttorneySync', /attorneysync\.com/i, /AttorneySync/i],
  ['Uptick Marketing', /uptickmarketing\.com/i, /Uptick/i],
  ['Legal Growth Marketing', /legalgrowthmarketing/i, null],
  ['Cornerstone Content / LegalMarketing', /$^/, null],
  ['Einstein Industries', /einsteinindustries\.com/i, /Einstein Industries/i],
  ['Optimized Attorney (OptimizeAttorney)', /optimizedattorney|optimizeattorney/i, null],
  ['Too Darn Loud', /toodarnloud\.com/i, /Too Darn Loud/i],
  ['eLaw / DSS', /$^/, null],
  ['Legal Marketing Solutions / LegalSites', /$^/, null],
].filter(v => v[1].source !== '$^');

const CHAT = [
  ['Intaker', /intaker\.(com|co)/i], ['Ngage / Ngage Live', /ngageics\.com|ngage-ics|ngagelive/i], ['ApexChat', /apexchat\.(net|com)/i],
  ['LiveChat', /livechatinc\.com|cdn\.livechat/i], ['Drift', /driftt\.com|js\.drift\.com/i], ['Intercom', /widget\.intercom\.io|intercomcdn/i],
  ['CaseFuel', /casefuel\.com/i], ['Juvo Leads', /juvoleads\.com/i], ['Smith.ai', /smith\.ai/i], ['Podium', /podium\.com|podium-webchat/i],
  ['Birdeye', /birdeye\.com/i], ['Tawk.to', /tawk\.to/i], ['Zendesk Chat', /zdassets\.com|zopim/i], ['HubSpot chat', /js\.usemessages\.com/i],
  ['Olark', /olark\.com/i], ['Tidio', /tidio\.co/i], ['Crisp chat', /client\.crisp\.chat/i], ['LeadConnector / GoHighLevel', /leadconnectorhq\.com|msgsndr\.com/i],
  ['Gabby / Answering-service chat', /gabbyville|answerconnect|ruby\.com\/chat/i], ['Comm100', /comm100/i], ['Freshchat', /freshchat|wchat\.freshchat/i],
  ['Scorpion chat', /scorpion\.co[^"']*chat|scorpion-chat/i], ['Captorra', /captorra\.com/i], ['LawLytics chat', /lawlytics\.com[^"']*chat/i],
  ['Chatbot (Lexi/Juris etc)', /$^/],
];
const CALL = [['CallRail', /callrail\.com|swappingnumbers/i], ['CallTrackingMetrics', /tctm\.co|calltrackingmetrics/i], ['Invoca', /invocacdn\.com|invoca\.net/i],
  ['WhatConverts', /whatconverts\.com/i], ['Marchex', /marchex/i], ['DialogTech / Avanser etc', /dialogtech/i]];
const ANALYTICS = [['Google Tag Manager', /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/], ['Google Analytics 4 (gtag G-)', /gtag\/js\?id=G-|['"]G-[A-Z0-9]{6,}['"]/],
  ['Universal Analytics (UA-)', /['"]UA-\d+-\d+['"]|google-analytics\.com\/analytics\.js/], ['Google Ads (AW-)', /AW-\d{6,}/], ['Meta Pixel', /connect\.facebook\.net\/[^"']*fbevents|fbq\(/],
  ['Microsoft Clarity', /clarity\.ms/], ['Bing UET', /bat\.bing\.com/], ['Hotjar', /hotjar\.com/], ['LinkedIn Insight', /snap\.licdn\.com/], ['TikTok Pixel', /analytics\.tiktok\.com/],
  ['Segment', /cdn\.segment\.com/], ['Matomo', /matomo|piwik/i]];

function first(re, s) { const m = s.match(re); return m ? m[0].slice(0, 120) : null; }

const results = [];
for (const f of firms) {
  const d = f.domain, base = 'html/' + d;
  const r = { domain: d, query: f.query, rank: f.rank };
  let curl = {}; try { curl = JSON.parse(fs.readFileSync(base + '.curl', 'utf8')); } catch (e) { }
  const err = fs.existsSync(base + '.err') ? fs.readFileSync(base + '.err', 'utf8').trim() : '';
  r.status = curl.http_code || 0; r.final_url = curl.url_effective; r.redirects = curl.redirects;
  r.ttfb_s = curl.ttfb; r.total_s = curl.total; r.curl_error = err || undefined;
  const html = fs.existsSync(base + '.html') ? fs.readFileSync(base + '.html', 'utf8') : '';
  const headers = fs.existsSync(base + '.headers') ? fs.readFileSync(base + '.headers', 'utf8') : '';
  r.bytes = Buffer.byteLength(html);
  const lastHdr = headers.split(/\r?\n\r?\n/).filter(Boolean).pop() || '';
  r.server = (lastHdr.match(/^server:\s*(.+)$/im) || [])[1]?.trim();
  r.x_powered_by = (lastHdr.match(/^x-powered-by:\s*(.+)$/im) || [])[1]?.trim();
  const blocked = r.status >= 400 || r.status === 202 || r.bytes < 3000 || /<title>Just a moment|cf-chl|captcha/i.test(html.slice(0, 4000)) && r.bytes < 20000;
  if (!r.status || blocked) { r.ok = false; r.failure = !r.status ? ('fetch error: ' + err) : `blocked/challenge (HTTP ${r.status}, ${r.bytes} B, server ${r.server || '?'})`; results.push(r); continue; }
  r.ok = true;
  const all = html + '\n' + lastHdr;
  const $ = cheerio.load(html);
  const host = new URL(r.final_url || ('https://' + d)).hostname; const own = reg(host);

  r.generator = $('meta[name="generator"]').map((i, e) => $(e).attr('content')).get().join(' | ') || undefined;
  r.platform_evidence = {};
  for (const [n, re] of PLATFORMS) { const m = first(re, all); if (m) r.platform_evidence[n] = m; }
  const pk = Object.keys(r.platform_evidence);
  r.platform = pk.includes('WordPress') ? 'WordPress' : (pk[0] || 'custom/unknown');
  if (pk.includes('WordPress') && pk.includes('Next.js')) r.platform = 'WordPress (headless/Next.js mix)';
  if (r.platform === 'custom/unknown' && /justatic\.com/i.test(html)) { r.platform = 'Justia (proprietary)'; r.platform_evidence['Justia (proprietary)'] = first(/https?:\/\/[a-z0-9.-]*justatic\.com[^"' ]{0,60}/i, html); }
  if (r.platform === 'custom/unknown' && /Dynamic Self-Syndication/i.test(html)) { r.platform = 'Foster DSS (proprietary)'; r.platform_evidence['Foster DSS (proprietary)'] = 'Powered By Dynamic Self-Syndication'; }
  if (r.platform === 'custom/unknown' && /ovclawyermarketing\.com/i.test(html)) { r.platform = 'OVC (proprietary)'; r.platform_evidence['OVC (proprietary)'] = 'footer link ovclawyermarketing.com'; }
  r.hosting = [/^server:\s*cloudflare/im.test(lastHdr) && 'Cloudflare', /x-vercel|server:\s*Vercel/i.test(lastHdr) && 'Vercel', /wpe-backend|x-powered-by:\s*WP Engine/i.test(lastHdr) && 'WP Engine',
    /x-kinsta|kinsta/i.test(lastHdr) && 'Kinsta', /x-nf-request-id|server:\s*Netlify/i.test(lastHdr) && 'Netlify', /flywheel/i.test(lastHdr) && 'Flywheel', /x-pantheon|pantheon/i.test(lastHdr) && 'Pantheon',
    /server:\s*nginx/i.test(lastHdr) && 'nginx', /server:\s*Apache/i.test(lastHdr) && 'Apache', /server:\s*Microsoft-IIS/i.test(lastHdr) && 'IIS', /x-amz-cf|cloudfront/i.test(lastHdr) && 'CloudFront',
    /nitrocdn|x-nitro/i.test(all) && 'NitroPack', /x-sucuri/i.test(lastHdr) && 'Sucuri', /siteground|x-proxy-cache-info|sg-optimizer/i.test(all) && 'SiteGround', /x-litespeed|server:\s*LiteSpeed/i.test(lastHdr) && 'LiteSpeed', /x-github-request|godaddy|x-siteid/i.test(lastHdr) && 'GoDaddy?'].filter(Boolean);
  r.wp_builder = pk.includes('WordPress') ? [/\/plugins\/elementor|elementor-section|e-con-inner/i.test(html) && 'Elementor', /et_pb_|\/themes\/Divi/.test(html) && 'Divi', /wpb_|js_composer/i.test(html) && 'WPBakery', /fl-builder/i.test(html) && 'Beaver Builder', /class="[^"]*wp-block-(?!library)/i.test(html) && 'Gutenberg blocks', /oxygen-body|\/plugins\/oxygen\//i.test(html) && 'Oxygen', /bricks-/i.test(html) && 'Bricks'].filter(Boolean) : undefined;

  // scripts
  const scripts = $('script'); r.script_tags = scripts.length;
  const SRC = e => $(e).attr('src') || $(e).attr('data-src') || $(e).attr('data-rocket-src') || $(e).attr('nitro-lazy-src') || $(e).attr('data-litespeed-src') || $(e).attr('data-cfasync-src');
  const extEls = $('script').filter((i, e) => !!SRC(e));
  r.external_scripts = extEls.length; r.inline_scripts = r.script_tags - r.external_scripts - $('script[type="application/ld+json"]').length;
  const hosts = new Set(); const allHosts = new Set();
  extEls.each((i, e) => { let s = SRC(e); if (!/^(https?:)?\/\//.test(s)) return; try { const u = new URL(s, 'https://' + host); if (u.hostname && reg(u.hostname) !== own) hosts.add(u.hostname); } catch (x) { } });
  // also script hosts referenced in inline loaders (e.g. "https://www.googletagmanager.com/gtm.js")
  $('script:not([src])').each((i, e) => { for (const m of ($(e).html() || '').matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})\/[^"'\s]*\.js/gi)) { if (reg(m[1]) !== own) allHosts.add(m[1].toLowerCase()); } });
  r.third_party_script_hosts = [...hosts].sort(); r.third_party_script_host_count = hosts.size;
  r.inline_loader_hosts = [...allHosts].filter(h => !hosts.has(h)).sort(); r.third_party_hosts_incl_inline = hosts.size + r.inline_loader_hosts.length;
  // asset hosts (img/link/iframe) for vendor evidence
  const assetHosts = new Set();
  $('[src],[href],[data-src]').each((i, e) => { for (const a of ['src', 'href', 'data-src']) { const v = $(e).attr(a); if (v && /^https?:|^\/\//.test(v)) { try { assetHosts.add(new URL(v, 'https://' + host).hostname); } catch (x) { } } } });

  // footer / credit text
  const footerText = ($('footer').text() + ' ' + $('[class*=footer],[id*=footer]').text()).replace(/\s+/g, ' ');
  const bodyText = $('body').clone().find('script,style,noscript').remove().end().text().replace(/\s+/g, ' ');
  const creditRe = /(?:web\s*site|site|web design|website design|law firm (?:website|marketing)[^.|]{0,20}|designed|developed|powered|marketing|built|crafted|created)\s*(?:design\s*)?(?:&|and)?\s*(?:development\s*)?by:?\s*[A-Z0-9][\w.&' -]{2,40}/gi;
  const credits = [...new Set((footerText + ' ' + bodyText.slice(-3000)).match(creditRe) || [])].map(s => s.trim()).filter(s => !/powered by (?:google|youtube|wordpress$)/i.test(s)).slice(0, 4);
  const creditLinks = []; $('a[href]').each((i, e) => { const t = ($(e).text() + ' ' + $(e).find('img').map((j, im) => $(im).attr('alt') || '').get().join(' ')).replace(/\s+/g, ' ').trim(); const h = $(e).attr('href'); if (/(website|web site|site|design|marketing|powered|built|development).{0,25}by|^by /i.test(t + ' ' + ($(e).parent().text() || '').slice(-120)) && /^https?:/.test(h) && reg(new URL(h).hostname) !== own && !/facebook|twitter|linkedin|instagram|youtube|google|x\.com|tiktok|avvo|yelp|bbb|superlawyers|justia\.com\/lawyers|martindale|wordpress\.org/i.test(h)) creditLinks.push(t.slice(0, 60) + ' -> ' + h.slice(0, 80)); });
  r.credit_strings = credits; r.credit_links = [...new Set(creditLinks)].slice(0, 3);
  r.vendor = null; r.vendor_evidence = null;
  const creditBlob = credits.join(' ') + ' ' + creditLinks.join(' ');
  for (const [n, hre, tre] of VENDORS) {
    const ah = [...assetHosts, ...hosts].find(h => hre.test(h));
    const linkHit = creditLinks.find(c => hre.test(c));
    const textHit = tre && credits.find(c => tre.test(c));
    if (linkHit || textHit || ah) { r.vendor = n; r.vendor_evidence = linkHit ? 'credit link: ' + linkHit : textHit ? 'credit text: ' + textHit : 'footer/asset link host: ' + ah; break; }
  }
  // HTML comment credits e.g. <!-- Site by X -->
  if (!r.vendor) { const c = first(/<!--[^>]{0,80}(Scorpion|FindLaw|Justia|PaperStreet|Foster Web|Juris Digital|Consultwebs|LawRank|iLawyer|Nifty|Mockingbird)[^>]{0,80}-->/i, html); if (c) { const nm = c.match(/(Scorpion|FindLaw|Justia|PaperStreet|Foster Web|Juris Digital|Consultwebs|LawRank|iLawyer|Nifty|Mockingbird)/i)[1]; r.vendor = /ilawyer/i.test(nm) ? 'iLawyerMarketing' : nm; r.vendor_evidence = 'html comment: ' + c; } }

  const sniff = (list) => { const o = {}; for (const [n, re] of list) { const m = first(re, html); if (m) o[n] = m; } return o; };
  r.chat_widgets = sniff(CHAT); r.call_tracking = sniff(CALL); r.analytics = sniff(ANALYTICS);

  // JSON-LD
  const types = new Set(); let ldBlocks = 0, ldErrors = 0;
  const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); const t = o['@type']; if (t) [].concat(t).forEach(x => types.add(String(x))); for (const k in o) if (typeof o[k] === 'object') walk(o[k]); };
  $('script[type="application/ld+json"]').each((i, e) => { ldBlocks++; try { walk(JSON.parse(($(e).html() || '').trim())); } catch (x) { ldErrors++; } });
  r.jsonld_blocks = ldBlocks; r.jsonld_parse_errors = ldErrors; r.schema_types = [...types].sort();
  r.microdata_types = [...new Set($('[itemtype]').map((i, e) => ($(e).attr('itemtype') || '').split('/').pop()).get())];
  const T = r.schema_types;
  r.schema = {
    LegalService: T.includes('LegalService'), Attorney: T.includes('Attorney'), LocalBusiness: T.includes('LocalBusiness'),
    Organization: T.includes('Organization'), FAQPage: T.includes('FAQPage'), Review_or_AggregateRating: T.some(x => /^(Review|AggregateRating)$/.test(x)),
    BreadcrumbList: T.includes('BreadcrumbList'), WebSite: T.includes('WebSite'), Person: T.includes('Person'),
    any_legal_business: T.some(x => /LegalService|Attorney|LocalBusiness|Lawyer/.test(x)),
  };

  // forms
  let contactForm = false, formCount = $('form').length;
  $('form').each((i, e) => { const f = $(e); const role = (f.attr('role') || '') + (f.attr('class') || '') + (f.attr('id') || '') + (f.attr('action') || ''); if (/search/i.test(role) && !f.find('textarea,[type=email],[type=tel]').length) return;
    if (f.find('input[type=email],input[type=tel],textarea,input[name*=email i],input[name*=phone i],input[name*=message i]').length) contactForm = true; });
  r.form_count = formCount; r.contact_form = contactForm;
  r.form_iframe = $('iframe[src]').map((i, e) => $(e).attr('src')).get().filter(s => /form|intake|lawmatics|clio|jotform|typeform|hubspot|leadconnector/i.test(s)).slice(0, 2);
  r.js_form_embeds = ['lawmatics', 'hsforms', 'leadconnectorhq.com/widget/form', 'jotform', 'typeform', 'formstack', 'clio', 'cognitoforms', 'paperform', 'intaker', 'msgsndr'].filter(k => html.toLowerCase().includes(k));
  r.tel_links = $('a[href^="tel:"]').length;
  r.meta_description = ($('meta[name="description"]').attr('content') || '').trim() || null;
  r.meta_description_len = r.meta_description ? r.meta_description.length : 0;
  r.title = $('title').first().text().trim().slice(0, 140);
  r.h1_count = $('h1').length; r.h1 = $('h1').first().text().replace(/\s+/g, ' ').trim().slice(0, 120) || null;
  r.viewport = !!$('meta[name="viewport"]').length;
  const imgs = $('img'); r.img_count = imgs.length;
  r.img_missing_alt = imgs.filter((i, e) => $(e).attr('alt') === undefined).length;
  r.img_empty_alt = imgs.filter((i, e) => $(e).attr('alt') !== undefined && !$(e).attr('alt').trim()).length;
  r.img_lazy = imgs.filter((i, e) => $(e).attr('loading') === 'lazy' || $(e).attr('data-src') !== undefined).length;
  const rv = bodyText.match(/.{0,40}\b(reviews?|testimonials?|5[- ]star|five[- ]star|★|rated \d|google rating|client stories)\b.{0,40}/i);
  r.mentions_reviews = !!rv; r.reviews_evidence = rv ? rv[0].trim() : null;
  r.stylesheets = $('link[rel="stylesheet"]').length;
  r.inline_style_bytes = $('style').text().length;
  results.push(r);
}
fs.writeFileSync('results.json', JSON.stringify(results, null, 1));
console.log('total', results.length, 'ok', results.filter(r => r.ok).length);
