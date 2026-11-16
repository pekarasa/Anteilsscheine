import { describe, expect, it } from "vitest";
import {
  buildTransactionTable,
  escapeHtml,
  fillLetter,
  replacePlaceholders,
  type LetterValues,
} from "../src/template/fillTemplate";
import type { Template, Transaction } from "../src/model/types";

const template: Template = {
  document:
    "<p>${year}/${plantPowerEarning}</p><p>${addressName}</p><p>${addressStreet}, ${addressCity}</p>" +
    "<p>${personalNumberOfShareCertificate} ${personalPowerEarning} ${personalRemainingBalance}</p>" +
    "<p>${totalNumberOfShareCertificate}</p><p>${printDate} ${signer1} ${signer2}</p>" +
    "<div>${transactionTable}</div><p>${year}</p>",
  tableHeader: "<table>",
  tableItem: "<tr><td>${Date}</td><td>${Description}</td><td>${Amount}.-</td></tr>",
  tableFooter: "<tr><td>${Date}</td><td>${Description}</td><td>${Amount}.-</td></tr></table>",
};

function transaction(day: number, month: number, year: number, description: string, amount: number): Transaction {
  return { addressId: 101, date: { year, month, day }, description, amount };
}

const values: LetterValues = {
  year: 2019,
  plantPowerEarning: 129900,
  totalNumberOfShareCertificate: 328,
  address: { id: 101, name: "Maya Graf", street: "Unter der Fluh 22", city: "4450 Sissach" },
  personalNumberOfShareCertificate: 44,
  personalPowerEarning: 20384,
  personalRemainingBalance: 19,
  transactions: [
    transaction(9, 12, 2011, "Kauf Anteilsscheine", 200),
    transaction(31, 12, 2019, "Jährlicher Strombezug 2019: 600.- x 1.0 =", 600),
  ],
  printDate: "28. Februar 2026",
  signer1: "Max Mustermann",
  signer2: "John Doe",
};

describe("replacePlaceholders", () => {
  it("replaces all occurrences", () => {
    const result = replacePlaceholders("${year} und ${year}", new Map([["year", "2019"]]));
    expect(result).toBe("2019 und 2019");
  });

  it("keeps unknown placeholders", () => {
    expect(replacePlaceholders("${unknown}", new Map())).toBe("${unknown}");
  });

  it("does not replace placeholders inside inserted values", () => {
    const result = replacePlaceholders(
      "${a} ${b}",
      new Map([
        ["a", "${b}"],
        ["b", "x"],
      ]),
    );
    expect(result).toBe("${b} x");
  });

  it("does not treat object property names as placeholders", () => {
    expect(replacePlaceholders("${constructor}", new Map())).toBe("${constructor}");
  });
});

describe("escapeHtml", () => {
  it("escapes characters with a meaning in HTML", () => {
    expect(escapeHtml(`Müller & Söhne <AG> "Ost" 'West'`)).toBe(
      "Müller &amp; Söhne &lt;AG&gt; &quot;Ost&quot; &#39;West&#39;",
    );
  });
});

describe("buildTransactionTable", () => {
  it("writes header, rows and a total row dated 31.12. of the year", () => {
    const table = buildTransactionTable(template, 2019, [
      transaction(9, 12, 2011, "Kauf Anteilsscheine", 200),
    ]);
    expect(table).toBe(
      "<table>\n" +
        "<tr><td>09.12.2011</td><td>Kauf Anteilsscheine</td><td>200.-</td></tr>\n" +
        "<tr><td>31.12.2019</td><td>Total</td><td>200.-</td></tr></table>\n",
    );
  });

  it("formats thousands and negative amounts and sums the total", () => {
    const table = buildTransactionTable(template, 2019, [
      transaction(1, 2, 2015, "Übertrag", -5000),
      transaction(1, 2, 2015, "Kauf", 12000),
    ]);
    expect(table).toContain("<td>-5\u2019000.-</td>");
    expect(table).toContain("<td>12\u2019000.-</td>");
    expect(table).toContain("<td>31.12.2019</td><td>Total</td><td>7\u2019000.-</td>");
  });

  it("leaves the amount empty for zero, as the C# tool does", () => {
    const table = buildTransactionTable(template, 2019, []);
    expect(table).toBe(
      "<table>\n<tr><td>31.12.2019</td><td>Total</td><td>.-</td></tr></table>\n",
    );
  });

  it("escapes descriptions", () => {
    const table = buildTransactionTable(template, 2019, [
      transaction(1, 1, 2019, "A & B <c>", 1),
    ]);
    expect(table).toContain("<td>A &amp; B &lt;c&gt;</td>");
  });
});

describe("fillLetter", () => {
  it("replaces all placeholders of the document", () => {
    const letter = fillLetter(template, values);
    expect(letter).toContain("<p>2019/129900</p>");
    expect(letter).toContain("<p>Maya Graf</p>");
    expect(letter).toContain("<p>Unter der Fluh 22, 4450 Sissach</p>");
    expect(letter).toContain("<p>44 20384 19</p>");
    expect(letter).toContain("<p>328</p>");
    expect(letter).toContain("<p>28. Februar 2026 Max Mustermann John Doe</p>");
    expect(letter).toContain("<p>2019</p>");
    expect(letter).not.toMatch(/\$\{\w+\}/);
  });

  it("inserts the transaction table without escaping it", () => {
    const letter = fillLetter(template, values);
    expect(letter).toContain("<div><table>\n<tr><td>09.12.2011</td>");
    expect(letter).toContain("<td>31.12.2019</td><td>Total</td><td>800.-</td></tr></table>\n</div>");
  });

  it("escapes names, addresses and signers", () => {
    const letter = fillLetter(template, {
      ...values,
      address: { id: 1, name: "Brenzikofer & <Co>", street: "Weg 1", city: "Ort" },
      signer1: "A & B",
    });
    expect(letter).toContain("<p>Brenzikofer &amp; &lt;Co&gt;</p>");
    expect(letter).toContain("A &amp; B");
  });
});
