import type { Template } from "../model/types";
import { h } from "./dom";
import type { ViewContext } from "./context";
import { texts } from "./texts";

const acceptedTypes = ["image/png", "image/jpeg", "image/svg+xml"];
/** Used for SVG files without a fixed size. */
const fallbackSize = 800;

/** The logo of the letter and a button to replace it. */
export function logoSection(ctx: ViewContext, logo: Template["logo"]): HTMLElement {
  const { store, local } = ctx;
  const picture = logo ? logoImage(logo) : h("p", { class: "intro" }, texts.template.logoNone);
  const input: HTMLInputElement = h("input", {
    type: "file",
    accept: acceptedTypes.join(","),
    "aria-label": texts.template.logoChoose,
    onchange: () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      if (!acceptedTypes.includes(file.type)) {
        local.message = texts.template.logoUnsupported;
        ctx.render();
        return;
      }
      void readAsPng(file).then(
        (bytes) => store.updateTemplate((template) => ({ ...template, logo: bytes })),
        () => {
          local.message = texts.template.logoFailed;
          ctx.render();
        },
      );
    },
  });
  return h(
    "section",
    { class: "logo-section" },
    h("h2", {}, texts.template.logoTitle),
    h("p", { class: "intro" }, texts.template.logoHint),
    picture,
    h("label", { class: "field" }, h("span", {}, texts.template.logoChoose), input),
  );
}

/** PNG files are taken as they are. Other formats are drawn on a canvas and stored as PNG. */
async function readAsPng(file: File): Promise<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === "image/png") {
    return bytes;
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || fallbackSize;
    canvas.height = image.naturalHeight || fallbackSize;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(texts.template.logoFailed);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      throw new Error(texts.template.logoFailed);
    }
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(texts.template.logoFailed));
    image.src = url;
  });
}

function logoImage(bytes: Uint8Array): HTMLImageElement {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/png" }));
  return h("img", {
    class: "logo",
    alt: texts.template.logoAlt,
    src: url,
    onload: () => URL.revokeObjectURL(url),
  });
}
