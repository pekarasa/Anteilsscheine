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
    templateWithoutBody: "Die Vorlage Document.html enthält keinen Bereich <body>.",
  },
  print: {
    documentTitle: (year: number) => `Sammelanteilsscheine ${year}`,
  },
  issues: {
    missingFile: (file: string) => `Die Datei ${file} fehlt.`,
    missingColumns: (columns: string[]) => `Spalte(n) fehlen: ${columns.join(", ")}.`,
    invalidCsvLine:
      "Die Zeile kann nicht gelesen werden. Anführungszeichen und Spaltenanzahl prüfen.",
    invalidInteger: (column: string, value: string) =>
      `Ungültige Ganzzahl in Spalte ${column}: "${value}".`,
    invalidDate: (column: string, value: string) =>
      `Ungültiges Datum in Spalte ${column}: "${value}". Erwartet wird z. B. 31.12.2012 oder 31.12.12.`,
    encodingFallback: (file: string) =>
      `${file} ist nicht UTF-8 kodiert und wurde als Windows-1252 gelesen. Beim Speichern wird die Datei als UTF-8 geschrieben.`,
    invalidJson: "Die Datei ist kein gültiges JSON.",
    invalidSettings: (field: string) => `Ungültiger Wert für "${field}".`,
    settingsMissing:
      "Settings.json fehlt. Es werden Standardwerte verwendet: Druckdatum heute, Unterzeichnende leer.",
    duplicateAddressId: (id: number) => `Die Adress-ID ${id} kommt mehrfach vor.`,
    unknownAddressId: (id: number) =>
      `Die Adress-ID ${id} existiert nicht in Address.csv. Der Eintrag wird keiner Person zugeordnet.`,
    missingPowerEarning: (year: number) =>
      `Kein Ertrag für das Jahr ${year} in PowerEarning.csv gefunden.`,
    duplicatePowerEarning: (year: number) =>
      `Mehrere Erträge für das Jahr ${year} in PowerEarning.csv gefunden.`,
    unknownPlaceholder: (name: string) => `Unbekannter Platzhalter: \${${name}}.`,
    location: (file: string, line?: number) => (line ? `${file}, Zeile ${line}` : file),
  },
  yearOps: {
    invalidYear: "Das Jahr muss eine vierstellige Zahl sein.",
    yearExists: (year: number) => `Das Jahr ${year} existiert bereits.`,
  },
};
