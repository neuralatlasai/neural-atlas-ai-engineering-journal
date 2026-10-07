/**
 * Keep the authored document intact; add only the shared hosting layer. The
 * sandbox isolates its scripts and CSS from the publication. Relative asset
 * URLs work at both an origin root and a GitHub Pages project base path.
 */
export function prepareExplorerDocument(source: string): string {
  if (!/<\/head>/i.test(source) || !/<\/body>/i.test(source)) {
    throw new Error("An explorer must be a complete HTML document");
  }
  return source
    // Skip script/style bodies: authored computation code remains byte-for-byte
    // intact. Static external links get the explicit relation our export gate
    // requires, including when noreferrer already implies it in browsers.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<a\b[^>]*>/gi, (tag) => {
      if (!/^<a\b/i.test(tag) || !/\btarget\s*=\s*["']_blank["']/i.test(tag)) return tag;
      const rel = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i);
      if (!rel) return tag.replace(/>$/, ' rel="noopener">');
      if (/\bnoopener\b/i.test(rel[2])) return tag;
      return tag.replace(rel[0], `rel=${rel[1]}${rel[2]} noopener${rel[1]}`);
    })
    .replace(/<section class="atlas-inspector"/g, '<section class="atlas-inspector table-scroll"')
    .replace(/<\/head>/i, '<link rel="stylesheet" href="./explorer.css">\n</head>')
    .replace(/<\/body>/i, '<script src="./host.js"></script>\n<noscript><style>.atlas-tabs,.atlas-toolbar,.atlas-export{display:none}.atlas-stage>svg{min-width:680px}</style></noscript>\n</body>');
}
