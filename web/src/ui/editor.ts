import { Jodit } from "jodit";
import "jodit/es2021/jodit.min.css";

export interface EditorHandle {
  /** Inserts an HTML fragment at the cursor. */
  insert: (fragment: string) => void;
}

let current: Jodit | undefined;

/** Removes the editor from the page. Called before the view is replaced. */
export function destroyEditor(): void {
  current?.destruct();
  current = undefined;
}

/**
 * Shows a WYSIWYG editor for HTML in host. onInput gets the HTML after each
 * change made by the user. Setting the content does not count as a change.
 */
export function mountEditor(host: HTMLElement, html: string, onInput: (html: string) => void): EditorHandle {
  destroyEditor();
  const editor = Jodit.make(host, {
    language: "de",
    height: 440,
    toolbarAdaptive: false,
    statusbar: false,
    buttons: "bold,italic,underline,|,ul,ol,|,paragraph,align,|,eraser,|,undo,redo",
    askBeforePasteHTML: false,
    defaultActionOnPaste: "insert_clear_html",
    useSearch: false,
  });
  editor.value = html;
  editor.editor.addEventListener("input", () => onInput(editor.value));
  current = editor;
  return {
    insert: (fragment) => {
      editor.s.insertHTML(fragment);
      onInput(editor.value);
    },
  };
}
