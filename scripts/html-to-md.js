/**
 * Convert article HTML to clean markdown.
 * Usage: node scripts/html-to-md.js <html-file> <output-md-file> [title] [author] [source-url]
 */
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node html-to-md.js <html-file> <output-md-file> [title] [author] [source-url]');
  process.exit(1);
}

const [htmlFile, outputFile, title, author, sourceUrl] = args;

let md = fs.readFileSync(htmlFile, 'utf8');

// ===== STEP 1: Decode HTML entities =====
md = md.replace(/&nbsp;/g, ' ');
md = md.replace(/&lt;/g, '<');
md = md.replace(/&gt;/g, '>');
md = md.replace(/&amp;/g, '&');
md = md.replace(/&quot;/g, '"');
md = md.replace(/&#34;/g, '"');
md = md.replace(/&#39;/g, "'");
md = md.replace(/&mdash;/g, '—');
md = md.replace(/&ldquo;/g, '"');
md = md.replace(/&rdquo;/g, '"');
md = md.replace(/&lsquo;/g, "'");
md = md.replace(/&rsquo;/g, "'");

// ===== STEP 2: Handle images FIRST (before stripping data-src) =====
md = md.replace(/<img[^>]*data-src="([^"]*)"[^>]*\/?>/g, (match, url) => {
  const altMatch = match.match(/alt="([^"]*)"/);
  const alt = altMatch ? altMatch[1] : '';
  return '\n\n![' + alt + '](' + url + ')\n\n';
});
md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/g, (match, url) => {
  const altMatch = match.match(/alt="([^"]*)"/);
  const alt = altMatch ? altMatch[1] : '';
  return '\n\n![' + alt + '](' + url + ')\n\n';
});

// ===== STEP 3: Remove style/data/class attributes =====
md = md.replace(/\s*style="[^"]*"/g, '');
md = md.replace(/\s*data-[a-z-]+="[^"]*"/g, '');
md = md.replace(/\s*nodeleaf=""/g, '');
md = md.replace(/\s*leaf=""/g, '');
md = md.replace(/\s*type="[^"]*"/g, '');
md = md.replace(/\s*class="[^"]*"/g, '');
md = md.replace(/\s*aria-[a-z-]+="[^"]*"/g, '');
md = md.replace(/\s*role="[^"]*"/g, '');
md = md.replace(/\s*target="[^"]*"/g, '');
md = md.replace(/\s*id="[^"]*"/g, '');

// ===== STEP 4: Handle code blocks (before other conversions) =====
let codeBlocks = [];
md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
  const idx = codeBlocks.length;
  let cleaned = code.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
  cleaned = cleaned.replace(/<br\s*\/?>/g, '\n');
  codeBlocks.push(cleaned);
  return `%%CODEBLOCK_${idx}%%`;
});

// ===== STEP 5: Handle inline code =====
let inlineCodes = [];
md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_, code) => {
  const idx = inlineCodes.length;
  inlineCodes.push(code.trim());
  return `%%INLINECODE_${idx}%%`;
});

// ===== STEP 6: Handle links =====
let linkUrls = [];
md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>/g, (_, url) => {
  linkUrls.push(url);
  return `%%LINKSTART_${linkUrls.length - 1}%%`;
});
md = md.replace(/<\/a>/g, '%%LINKEND%%');

// ===== STEP 7: Handle headings =====
md = md.replace(/<\/h([1-6])>/g, '\n\n');
md = md.replace(/<h([1-6])[^>]*>/g, (_, n) => '\n\n' + '#'.repeat(parseInt(n)) + ' ');

// ===== STEP 8: Handle paragraphs =====
md = md.replace(/<\/p>/g, '\n\n');
md = md.replace(/<p[^>]*>/g, '');

// ===== STEP 9: Handle line breaks =====
md = md.replace(/<br\s*\/?>/g, '\n');

// ===== STEP 10: Handle strong/bold and emphasis =====
md = md.replace(/<\/strong>/g, '**');
md = md.replace(/<strong[^>]*>/g, '**');
md = md.replace(/<\/b>/g, '**');
md = md.replace(/<b[^>]*>/g, '**');
md = md.replace(/<\/em>/g, '*');
md = md.replace(/<em[^>]*>/g, '*');
md = md.replace(/<\/i>/g, '*');
md = md.replace(/<i[^>]*>/g, '*');

// ===== STEP 11: Handle lists =====
md = md.replace(/<ul[^>]*>/g, '\n');
md = md.replace(/<\/ul>/g, '\n');
md = md.replace(/<ol[^>]*>/g, '\n');
md = md.replace(/<\/ol>/g, '\n');
md = md.replace(/<\/li>/g, '');
md = md.replace(/<li[^>]*>/g, '- ');

// ===== STEP 12: Handle sections, spans, divs =====
md = md.replace(/<section[^>]*>/g, '');
md = md.replace(/<\/section>/g, '');
md = md.replace(/<span[^>]*>/g, '');
md = md.replace(/<\/span>/g, '');
md = md.replace(/<div[^>]*>/g, '');
md = md.replace(/<\/div>/g, '');
md = md.replace(/<figure[^>]*>/g, '');
md = md.replace(/<\/figure>/g, '');
md = md.replace(/<figcaption[^>]*>/g, '');
md = md.replace(/<\/figcaption>/g, '');

// ===== STEP 13: Clean up remaining tags =====
md = md.replace(/<[^>]*>/g, '');

// ===== STEP 14: Restore inline code =====
md = md.replace(/%%INLINECODE_(\d+)%%/g, (_, i) => '`' + inlineCodes[parseInt(i)] + '`');

// ===== STEP 15: Process link syntax =====
md = md.replace(/%%LINKSTART_(\d+)%%([\s\S]*?)%%LINKEND%%/g, (_, i, text) => {
  const url = linkUrls[parseInt(i)];
  return '[' + text.trim() + '](' + url + ')';
});

// ===== STEP 16: Restore code blocks =====
md = md.replace(/%%CODEBLOCK_(\d+)%%/g, (_, i) => '\n\n```\n' + codeBlocks[parseInt(i)] + '\n```\n\n');

// ===== STEP 17: Fix bold-italic patterns =====
md = md.replace(/\*\*\*([^*]*?)\*\*(?!\*)/g, '***$1***');

// ===== STEP 18: Clean up whitespace =====
md = md.replace(/\r\n/g, '\n');
md = md.replace(/\r/g, '\n');
md = md.replace(/\n{4,}/g, '\n\n\n');
md = md.replace(/^[ \t]+/gm, '');
md = md.replace(/ {2,}/g, ' ');

// ===== STEP 19: Fix artifacts =====
md = md.replace(/<span[^>]*>/g, '');
md = md.replace(/<\/span>/g, '');
md = md.replace(/\*\*\*\*/g, '');
md = md.replace(/^\*(?=\S)/gm, '');

// ===== STEP 20: Build final document =====
const finalTitle = title || 'Untitled';
const headerLines = [`# ${finalTitle}`, ''];
if (author) headerLines.push(`> 作者: ${author}`);
if (sourceUrl) headerLines.push(`> 来源: [原文链接](${sourceUrl})`);
if (author || sourceUrl) headerLines.push('');

const finalMd = headerLines.join('\n') + '\n' + md.trim() + '\n';

fs.writeFileSync(outputFile, finalMd);
console.log(JSON.stringify({
  status: 'ok',
  output: outputFile,
  length: finalMd.length,
  title: finalTitle
}));
