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
    noYearData: "Die Daten dieses Jahres sind unvollständig und können nicht bearbeitet werden.",
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
  summary: {
    title: "Übersicht",
    intro:
      "So erscheint die Zusammenfassung im Export (Summary_<Jahr>.csv). Sie wird bei jeder Änderung neu berechnet.",
    unavailable:
      "Die Übersicht erscheint, sobald alle Daten gültig sind. Die Hinweise oben zeigen, was noch fehlt.",
    total: "Total",
    columns: {
      id: "ID",
      name: "Name",
      street: "Strasse",
      city: "Ort",
      held: "Anteilsscheine",
      remaining: "Restbetrag (CHF)",
      committed: "Verpflichtet",
    },
  },
  intro: {
    addresses:
      "Eine Zeile je Person. Die ID muss eindeutig sein; sie wird in den anderen Registerkarten verwendet.",
    transactions:
      "Feste Ein- und Auszahlungen in CHF. Datum als tt.mm.jjjj, Beträge als ganze Zahlen (auch negativ).",
    dynamicShares:
      "Jährlicher Strombezug in CHF pro Person. Auch künftige Jahre gehören hierher.",
    powerEarnings: "Ertrag der Anlage pro Jahr in kWh. Für das bearbeitete Jahr muss eine Zeile vorhanden sein.",
    conversionFactors:
      "Umwandlungsfaktor pro Jahr, z. B. 0.8 oder 1.0. Für jedes Jahr mit Strombezug wird einer benötigt.",
  },
  columns: {
    Id: "ID",
    Name: "Name",
    Street: "Strasse",
    City: "Ort",
    AddressId: "Person",
    Date: "Datum",
    Description: "Beschreibung",
    Amount: "Betrag (CHF)",
    PowerPurchase: "Strombezug (CHF)",
    Year: "Jahr",
    Earning: "Ertrag (kWh)",
    Factor: "Faktor",
  },
  tables: {
    search: "Suchen",
    count: (shown: number, total: number) => `${shown} von ${total} Zeilen`,
    empty: "Noch keine Zeilen vorhanden.",
    addRow: "Zeile hinzufügen",
    deleteRow: "Löschen",
    confirmDeleteRow: "Diese Zeile wirklich löschen?",
    emptyChoice: "(keine Auswahl)",
    unknownChoice: (id: string) => `${id} (unbekannt)`,
    addressInUse: (id: string, transactions: number, shares: number) =>
      `Die Adress-ID ${id} wird noch verwendet (Transaktionen: ${transactions}, Strombezug: ${shares}). Diese Zeilen bleiben erhalten, sind danach aber keiner Person mehr zugeordnet.`,
    addressChoice: (id: number, name: string) => `${name} (${id})`,
    datePlaceholder: "tt.mm.jjjj",
    sortedAscending: " \u25B2",
    sortedDescending: " \u25BC",
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
  template: {
    intro:
      "So sieht der Brief aus. Die Platzhalter werden beim Erstellen jedes Briefes mit den Daten der Person ersetzt.",
    placeholdersHint: "Platzhalter an der Cursorposition einfügen:",
    reset: "Vorlage zurücksetzen",
    resetHint: "Stellt die Vorlage so her, wie sie beim ersten Öffnen dieses Jahres war (Text und Logo).",
    confirmReset: "Alle Änderungen an der Vorlage dieses Jahres gehen verloren. Wirklich zurücksetzen?",
    previewTitle: "Vorschau",
    previewPerson: "Person",
    previewHint: "So sieht der Brief für die gewählte Person aus. Die Vorschau aktualisiert sich bei jeder Änderung.",
    previewUnavailable: "Die Vorschau erscheint, sobald alle Daten gültig sind und mindestens eine Person erfasst ist.",
    previewFailed: "Die Vorschau kann nicht erstellt werden.",
    previewFrame: "Vorschau des Briefs",
    logoTitle: "Logo",
    logoHint:
      "Das Bild steht oben im Brief (Datei Template/logo.png). PNG, JPG und SVG sind erlaubt; JPG und SVG werden in PNG umgewandelt.",
    logoAlt: "Logo",
    logoNone: "Kein Logo vorhanden.",
    logoChoose: "Logo auswählen",
    logoUnsupported: "Dieses Dateiformat wird nicht unterstützt. Erlaubt sind PNG, JPG und SVG.",
    logoFailed: "Das Logo konnte nicht gelesen werden.",
    fields: {
      document: "Brief (Document.html)",
      tableHeader: "Tabellenkopf (TableHeader.html)",
      tableItem: "Tabellenzeile (TableItem.html)",
      tableFooter: "Tabellenende (TableFooter.html)",
    },
    placeholders: {
      addressName: "Name der Person",
      addressStreet: "Strasse der Person",
      addressCity: "Ort der Person",
      year: "Jahr",
      printDate: "Druckdatum",
      signer1: "Unterzeichnende Person 1",
      signer2: "Unterzeichnende Person 2",
      plantPowerEarning: "Ertrag der Anlage (kWh)",
      totalNumberOfShareCertificate: "Anteilsscheine insgesamt",
      personalNumberOfShareCertificate: "Anteilsscheine der Person",
      personalPowerEarning: "Ertragsanteil der Person (kWh)",
      personalRemainingBalance: "Restbetrag der Person (CHF)",
      transactionTable: "Tabelle der Transaktionen",
      Date: "Datum (nur in Tabellenzeilen)",
      Description: "Beschreibung (nur in Tabellenzeilen)",
      Amount: "Betrag (nur in Tabellenzeilen)",
    },
  },
  settings: {
    title: "Einstellungen",
    intro: "Diese Angaben stehen in Settings.json des Jahres und werden im Brief eingesetzt.",
    printDate: "Druckdatum",
    signer1: "Unterzeichnende Person 1",
    signer2: "Unterzeichnende Person 2",
    invalidDate: "Bitte ein gültiges Druckdatum wählen.",
    missing:
      "Settings.json fehlt. Die Datei wird angelegt, sobald Sie hier eine Angabe ändern.",
    invalid:
      "Settings.json ist ungültig und kann nicht gelesen werden. Sie kann durch Standardwerte ersetzt werden (Druckdatum heute, Unterzeichnende leer).",
    repair: "Mit Standardwerten ersetzen",
    confirmRepair: "Die ungültige Settings.json wird durch Standardwerte ersetzt. Fortfahren?",
  },
  severity: {
    error: "Fehler",
    warning: "Warnung",
  },
  review: {
    title: "Prüfung der Daten",
    none: "Keine Fehler oder Warnungen gefunden.",
    show: "Anzeigen",
  },
  hints: {
    missingPowerEarning: (year: number) =>
      `Für das Jahr ${year} fehlt der Ertrag der Anlage (Registerkarte Ertrag).`,
    missingConversionFactor: (year: number) =>
      `Für das Jahr ${year} fehlt der Umwandlungsfaktor, obwohl es Strombezug in diesem Jahr gibt (Registerkarte Faktoren).`,
    capture: "jetzt erfassen",
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
