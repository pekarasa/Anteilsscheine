import { describe, expect, it } from "vitest";
import documentHtml from "../../CustomerTest/2019/Template/Document.html?raw";
import {
  bodyContent,
  protectEscapedDollars,
  replaceBodyContent,
  restoreEscapedDollars,
} from "../src/template/templateBody";

const html = '<!DOCTYPE html><html><head><style>p { color: red }</style></head><body lang="de-CH"><p>${year}</p></body></html>';

describe("bodyContent", () => {
  it("returns the content of the body without the tags", () => {
    expect(bodyContent(html)).toBe("<p>${year}</p>");
  });

  it("is undefined without a body", () => {
    expect(bodyContent("<p>ohne Body</p>")).toBeUndefined();
  });
});

describe("replaceBodyContent", () => {
  it("replaces only the body content and keeps the head and the attributes", () => {
    const result = replaceBodyContent(html, "<p>Neu</p>");
    expect(result).toBe(
      '<!DOCTYPE html><html><head><style>p { color: red }</style></head><body lang="de-CH"><p>Neu</p></body></html>',
    );
  });

  it("inserts special replacement patterns literally", () => {
    expect(replaceBodyContent(html, "<p>$& $1 $$</p>")).toContain("<p>$& $1 $$</p>");
  });

  it("keeps the body of the test template when its content is taken over unchanged", () => {
    const body = bodyContent(documentHtml) ?? "";
    expect(replaceBodyContent(documentHtml, body)).toBe(documentHtml);
  });
});

describe("escaped dollar signs", () => {
  it("writes an escaped placeholder as a marker and back", () => {
    const content = "<p>&#36;{year}: ${year}</p>";
    const protectedContent = protectEscapedDollars(content);
    expect(protectedContent).not.toContain("&#36;");
    expect(restoreEscapedDollars(protectedContent)).toBe(content);
  });

  it("restores the escaped placeholders of the test template", () => {
    const body = bodyContent(documentHtml) ?? "";
    expect(restoreEscapedDollars(protectEscapedDollars(body))).toBe(body);
  });
});
