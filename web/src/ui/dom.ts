type Child = Node | string | undefined | null | false;
type Attributes = Record<string, string | boolean | EventListener | undefined>;

/**
 * Creates an element. Attributes starting with "on" are event listeners
 * (onclick -> click). Text children are inserted as text, never as HTML.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) {
      continue;
    }
    if (typeof value === "function") {
      element.addEventListener(name.slice(2), value);
    } else {
      element.setAttribute(name, value === true ? "" : value);
    }
  }
  for (const child of children) {
    if (child !== undefined && child !== null && child !== false) {
      element.append(child);
    }
  }
  return element;
}
