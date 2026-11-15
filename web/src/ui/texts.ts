export const texts = {
  appTitle: "Anteilsscheine",
  placeholder: "Die Anwendung wird in den nächsten Etappen aufgebaut.",
  errors: {
    invalidDecimal: (value: string) =>
      `Ungültige Dezimalzahl: "${value}". Erwartet wird z. B. 0.8 oder 1.0.`,
    noConversionFactor: (year: number) =>
      `Kein passender Umwandlungsfaktor für das Jahr ${year} gefunden.`,
    duplicateConversionFactor: (year: number) =>
      `Mehrere Umwandlungsfaktoren für das Jahr ${year} gefunden.`,
    noCommittedCertificates:
      "Es gibt keine Anteilsscheine mit Strombezug. Der Ertragsanteil kann nicht berechnet werden.",
  },
};
