import { describe, expect, it } from "vitest";
import { texts } from "../src/ui/texts";

describe("texts", () => {
  it("provides the application title", () => {
    expect(texts.appTitle).toBe("Anteilsscheine");
  });
});
