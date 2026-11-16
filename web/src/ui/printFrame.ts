import { h } from "./dom";
import { texts } from "./texts";

let current: HTMLIFrameElement | undefined;

/**
 * Opens the browser print dialog for the document. The document is loaded in
 * a hidden frame, so the page of the application stays as it is. The dialog
 * opens once all images are loaded. Resolves when the dialog was requested.
 */
export function printHtml(html: string): Promise<void> {
  current?.remove();
  return new Promise((resolve, reject) => {
    const frame: HTMLIFrameElement = h("iframe", {
      class: "print-frame",
      title: texts.print.frameTitle,
      "aria-hidden": "true",
      tabindex: "-1",
    });
    current = frame;
    frame.addEventListener(
      "load",
      () => {
        startPrint(frame).then(resolve, (failure: unknown) => {
          frame.remove();
          reject(failure);
        });
      },
      { once: true },
    );
    frame.srcdoc = html;
    document.body.append(frame);
  });
}

async function startPrint(frame: HTMLIFrameElement): Promise<void> {
  const view = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!view || !doc) {
    throw new Error(texts.print.failed);
  }
  await Promise.all(Array.from(doc.images, (image) => image.decode().catch(() => undefined)));
  view.addEventListener("afterprint", () => frame.remove(), { once: true });
  view.focus();
  view.print();
}
