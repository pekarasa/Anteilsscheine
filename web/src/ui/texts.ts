export const texts = {
  appTitle: "Anteilsscheine",
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
    noYearFolders:
      "Die ZIP-Datei enthält keine Jahresordner. Erwartet wird die Struktur Customer<Name>/<Jahr>/.",
    invalidZip: "Die Datei ist keine gültige ZIP-Datei.",
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
  cells: {
    invalidInteger: "Bitte eine ganze Zahl eingeben.",
    invalidDecimal: "Bitte eine Dezimalzahl eingeben, z. B. 0.8 oder 1.0.",
    invalidDate: "Bitte ein Datum eingeben, z. B. 31.12.2026 oder 31.12.26.",
    unknownAddress: (id: string) => `Die Adress-ID ${id} existiert nicht in der Adressliste.`,
  },
  yearOps: {
    invalidYear: "Das Jahr muss eine vierstellige Zahl sein.",
    yearExists: (year: number) => `Das Jahr ${year} existiert bereits.`,
  },
  severity: {
    error: "Fehler",
    warning: "Warnung",
  },
  review: {
    title: "Prüfung der Daten",
    none: "Keine Fehler oder Warnungen gefunden.",
  },
  start: {
    dropZone: "ZIP-Datei hierher ziehen oder auswählen",
    chooseFile: "ZIP-Datei auswählen",
    otherFile: "Andere ZIP-Datei laden",
    readFailed: "Die Datei konnte nicht gelesen werden.",
    loadedFrom: (name: string) => `Geladen: ${name}`,
    customer: "Kunde",
    year: "Jahr",
    editTitle: (year: number) => `Jahr ${year} bearbeiten / korrigieren`,
    editText:
      "Die Daten dieses Jahres werden direkt geändert. Beim Herunterladen wird das Jahr in der ZIP-Datei aktualisiert.",
    editButton: "Jahr bearbeiten",
    newTitle: (year: number) => `Neues Jahr anlegen auf Basis von ${year}`,
    newText:
      "Alle Daten, die Vorlage und die Einstellungen werden kopiert. Das Druckdatum wird auf heute gesetzt, die Unterzeichnenden bleiben.",
    targetYear: "Neues Jahr",
    createButton: "Neues Jahr anlegen",
    restoreTitle: "Letzte Sitzung wiederherstellen?",
    restoreText: (savedAt: string) =>
      `Auf diesem Rechner ist eine Sitzung gespeichert, die nicht heruntergeladen wurde (Stand: ${savedAt}).`,
    restoreButton: "Wiederherstellen",
    discardButton: "Verwerfen",
    confirmReplace: "Es gibt ungespeicherte Änderungen. Trotzdem eine andere ZIP-Datei laden?",
    storageUnavailable:
      "Die automatische Zwischenspeicherung ist in diesem Browser nicht verfügbar. ZIP-Datei daher regelmässig herunterladen.",
  },
  main: {
    yearLabel: (customer: string, year: number) => `Kunde ${customer}, Jahr ${year}`,
    unsaved: "Ungespeicherte Änderungen",
    saved: "Alles gespeichert",
    download: "ZIP herunterladen",
    changeYear: "Jahr wechseln",
    downloaded: (fileName: string) =>
      `Die Datei ${fileName} wurde heruntergeladen. Der Stand gilt als gespeichert.`,
    downloadFailed: "Die ZIP-Datei konnte nicht erstellt werden.",
    tabEmpty: "Dieser Bereich wird in einer späteren Etappe ausgebaut.",
    tabs: {
      addresses: "Adressen",
      transactions: "Transaktionen",
      dynamicShares: "Strombezug",
      powerEarnings: "Ertrag",
      conversionFactors: "Faktoren",
      settings: "Einstellungen",
      template: "Vorlage",
      print: "Übersicht & Druck",
    },
  },
};
