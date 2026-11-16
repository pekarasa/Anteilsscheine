const bodyPattern = /(<body\b[^>]*>)([\s\S]*)(<\/body>)/i;
const escapedDollar = '<span class="escaped-dollar">$</span>';
const escapedDollarPattern = /<span class="escaped-dollar">\$<\/span>/g;

/** The content of the body, or undefined if the document has no body. */
export function bodyContent(html: string): string | undefined {
  return bodyPattern.exec(html)?.[2];
}

/** Replaces only the content of the body. Everything else, including the head, stays unchanged. */
export function replaceBodyContent(html: string, content: string): string {
  return html.replace(bodyPattern, (_match, open: string, _old: string, close: string) => `${open}${content}${close}`);
}

/**
 * An editor writes "&#36;" as a plain dollar sign, which would turn a literal
 * into a placeholder. The entity is therefore wrapped in a marker element.
 */
export function protectEscapedDollars(content: string): string {
  return content.replace(/&#36;/g, () => escapedDollar);
}

export function restoreEscapedDollars(content: string): string {
  return content.replace(escapedDollarPattern, () => "&#36;");
}
