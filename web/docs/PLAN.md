# Plan: Anteilsscheine als statische Web-Anwendung

Dieses Dokument ist die **einzige verbindliche Quelle** für die Umsetzung der
Web-Anwendung. Es enthält Hintergrund, getroffene Entscheidungen, fachliche
Details des bestehenden C#-Programms und die einzelnen Etappen.

Jede Etappe ist so beschrieben, dass sie in einer eigenen Session umgesetzt
werden kann. Vor Beginn einer Etappe dieses Dokument vollständig lesen.

---

## 1. Ausgangslage

- Das bestehende Programm (`ShareCertificate/`, C# .NET 6) erzeugt jährlich
  Sammelanteilsscheine als PDF. Bedienung: Kommandozeile, Daten als CSV in
  `Customer<Name>/<Jahr>/`, Vorlagen als HTML in `Customer<Name>/<Jahr>/Template/`.
- Zielgruppe sind **nicht informatikaffine Benutzer**. Hürden heute: Build mit
  `dotnet`, Kommandozeilenparameter, Arbeitsverzeichnis, CSV-Pflege
  (Trennzeichen, Datumsformate), Zusammenfügen der PDFs mit `pdfunite`,
  technische englische Fehlermeldungen.

## 2. Ziel

Eine **statische HTML-Seite** (eine einzige Datei `Anteilsscheine.html`), die
das ganze Programm enthält und vollständig lokal im Browser läuft:

1. Benutzer lädt eine **ZIP-Datei** mit den Daten (Vorjahr oder aktuelles Jahr).
2. Benutzer wählt:
   - **Bestehendes Jahr bearbeiten/korrigieren** oder
   - **Neues Jahr anlegen** (Kopie eines bestehenden Jahres als Basis).
3. Benutzer bearbeitet/ergänzt im Browser alle Daten, Einstellungen und die
   Vorlage (Brieftext, Logo).
4. Benutzer lädt die **aktualisierte ZIP-Datei** herunter und erzeugt das
   **Sammel-PDF** über den Druckdialog des Browsers ("Als PDF speichern").

Keine Daten verlassen den Rechner. Kein Server, keine Installation.

## 3. Getroffene Entscheidungen

| Thema | Entscheidung |
|---|---|
| Auslieferung | Eine statische HTML-Datei (per Doppelklick via `file://` lauffähig), optional zusätzlich GitHub Pages |
| Technik | TypeScript, Vite, `vite-plugin-singlefile`, Vitest. Kein grosses UI-Framework |
| Bibliotheken | JSZip (ZIP), PapaParse (CSV). Weitere nur mit Begründung (Lizenz MIT/Apache/BSD, klein, gepflegt) |
| Ort im Repo | Ordner `web/` in diesem Repository |
| PDF | **Variante a) Browser-Druck**: alle Briefe in einem Druckdokument mit Seitenumbrüchen, Benutzer wählt "Als PDF speichern". Ein **Sammel-PDF reicht**, keine Einzel-PDFs |
| Vorlage | Brieftext und Logo sind im Browser **änderbar** |
| Vorlagen-Editor | **WYSIWYG als Standard**, Umschalter **"HTML anzeigen"** für Fortgeschrittene |
| Neue Platzhalter | `${printDate}`, `${signer1}`, `${signer2}`, alle **eingebbar** und in einer Einstellungsdatei pro Jahr gespeichert |
| Jahr-Funktionen | "Neues Jahr anlegen" **und** "Bestehendes Jahr bearbeiten/korrigieren" |
| Datenformat | Ordnerstruktur und CSV-Dateien bleiben kompatibel zum C#-Programm |
| Sprache UI | Deutsch (de-CH). Code, Bezeichner, Kommentare und Commit-Messages Englisch |

## 4. Arbeitsweise (für jede Etappe verbindlich)

### 4.1 Commits

- **Kleine, einzeln nachvollziehbare Commits.** Ein Commit = eine logische
  Änderung (z. B. "Modell", "Berechnung", "Tests für Berechnung" dürfen
  getrennt sein). Kein Sammel-Commit am Ende einer Etappe.
- **Commit-Messages auf Englisch, kurz**, im Imperativ.
  - Betreffzeile (max. ~60 Zeichen): **was** gemacht wurde.
  - Leerzeile, danach 1 bis 3 Zeilen: **wieso** es gemacht wurde.
- Beispiel:

  ```
  Port certificate calculation to TypeScript

  The web app must compute the same numbers as the C# tool
  without a server, so the logic runs in the browser.
  ```

- Jeder Commit soll bauen und die Tests bestehen (`npm test`, `npm run build`
  in `web/`).
- Git immer mit `--no-pager` verwenden.
- Nur Dateien committen, die zur Änderung gehören. Fremde, nicht
  zugehörige Änderungen im Arbeitsverzeichnis nicht mit committen (siehe 4.4).

### 4.2 Code-Konventionen

- Immer `{}` bei `if`, `else`, `for`, `while` usw.
- Ausserhalb von String-Literalen nur ASCII (keine Umlaute/Emojis in
  Bezeichnern und Kommentaren). Deutsche UI-Texte stehen in Strings.
- UI-Texte zentral in `web/src/ui/texts.ts` sammeln (einfacher zu pflegen).
- Kommentare sparsam, nur wo etwas nicht offensichtlich ist.
- Fachlogik (`model/`, `logic/`, `io/`, `template/`) ist frei von DOM-Zugriffen
  und vollständig mit Vitest testbar.

### 4.3 Abschluss einer Etappe

1. Alle Akzeptanzkriterien der Etappe erfüllt.
2. `npm test` und `npm run build` in `web/` laufen fehlerfrei.
3. In diesem Dokument die Etappe von `[ ]` auf `[x]` setzen, und zwar
   **an beiden Stellen**: in der Checkliste in Abschnitt 8 und in der
   Überschrift der Etappe in Abschnitt 7 (z. B. `### [x] Etappe 0: ...`).
   Unter Abschnitt 9 ("Erkenntnisse") neue Erkenntnisse, Abweichungen vom
   Plan und offene Punkte festhalten.
   Ist eine Etappe nur teilweise erledigt, bleibt sie `[ ]`; der
   Zwischenstand wird in Abschnitt 9 beschrieben.
4. Diese Dokumentänderung als eigenen Commit ("Update plan after stage N").

### 4.4 Repository-Hygiene

- Zeilenenden sind über `.gitattributes` geregelt (`* text=auto`, `*.sln`
  mit CRLF, Binärdateien als `binary`). Im Repository wird LF gespeichert.
  Neue Dateitypen bei Bedarf dort ergänzen (z. B. Schriftarten als `binary`).
- **Echte Kundendaten** (Adressen, Beträge) dürfen **nie** ins Repository.
  `.gitignore` schliesst `Summary_20*.csv` bereits aus. Testdaten nur aus
  `CustomerTest/` oder frei erfunden.

---

## 5. Fachliche Details des bestehenden Programms (Referenz)

Die Web-Anwendung muss **exakt dieselben Zahlen und Texte** liefern.

### 5.1 Dateien pro Jahr (`Customer<Name>/<Jahr>/`)

| Datei | Spalten | Bemerkung |
|---|---|---|
| `Address.csv` | `Id,Name,Street,City` | `Id` ganzzahlig, eindeutig |
| `Transaction.csv` | `AddressId,Date,Description,Amount` | fixe Ein-/Auszahlungen in CHF, `Amount` ganzzahlig, auch negativ |
| `DynamicShare.csv` | `AddressId,Date,PowerPurchase` | jährlicher Strombezug in CHF, ganzzahlig. Enthält auch **zukünftige** Jahre (Verpflichtung) |
| `PowerEarning.csv` | `Year,Earning` | Ertrag der Anlage pro Jahr (kWh), ganzzahlig |
| `ConversionFactor.csv` | `Year,Factor` | Dezimalzahl, z. B. `0.8`, `1.0` |
| `Template/Document.html` | | Briefvorlage mit Platzhaltern |
| `Template/TableHeader.html` | | Tabellenkopf (öffnet `<table>`) |
| `Template/TableItem.html` | | eine Tabellenzeile, Platzhalter `${Date}`, `${Description}`, `${Amount}` |
| `Template/TableFooter.html` | | Total-Zeile, schliesst `</table>` |
| `Template/logo.png` | | Logo (in der Vorlage referenziert als `logo.png`) |
| `Settings.json` | | **neu**, siehe 5.5 |

- CSV: Header-Zeile, Trennzeichen `,`, Kultur `de-CH`, UTF-8.
- Datumsformate kommen gemischt vor: `31.12.12` (zweistellig = 20xx) und
  `09.12.2011`.
- Die Daten sind **kumulativ**: der Ordner eines Jahres enthält die gesamte
  Historie (z. B. Transaktionen seit 2011).

### 5.2 Berechnung pro Adresse (`Certificate.cs`)

Eingaben: `year`, Adresse, `PowerEarning` des Jahres, Transaktionen der
Adresse, DynamicShares der Adresse, alle ConversionFactors.

1. Für **jede** DynamicShare (auch zukünftige) eine dynamische Transaktion
   bilden:
   - `y = Date.Year`, `f = Factor` des Jahres `y`.
     Fehlt der Faktor: Fehler **"Kein passender Umwandlungsfaktor für das Jahr
     {y} gefunden."**
   - `Amount = trunc(PowerPurchase * f)` (C# `(int)` auf `decimal`,
     **abschneiden**, nicht runden).
   - `Description = "Jährlicher Strombezug {y}: {PowerPurchase}.- x {f} ="`.
     `f` wird so ausgegeben, wie es in der CSV steht (C# `decimal` behält die
     Nachkommastellen: `1.0` bleibt `1.0`, `0.8` bleibt `0.8`).
2. `fixUpToYear` = Transaktionen mit `Date.Year <= year`.
3. `NumberOfCommittedCertificates = trunc((sum(fixUpToYear) + sum(alle dynamischen)) / 100)`
   (beachte: **alle** dynamischen, auch zukünftige).
4. `dynUpToYear` = dynamische Transaktionen mit `Date.Year <= year`.
5. `amountHeld = sum(fixUpToYear) + sum(dynUpToYear)`.
6. `NumberOfCertificatesHeld = trunc(amountHeld / 100)`.
7. `RemainingBalance = amountHeld - NumberOfCertificatesHeld * 100`.
8. Transaktionsliste für den Brief: `fixUpToYear + dynUpToYear`, stabil nach
   Datum sortiert.
9. `PersonalPowerEarning = trunc(trunc(Earning / TotalCommitted) * Committed)`
   (**Ganzzahldivision zuerst**, wie in C#: `_powerEarning / TotalNumberOfCommittedCertificates * NumberOfCommittedCertificates`).
   Bei `TotalCommitted = 0` wirft C# eine Division-durch-Null; im Web
   stattdessen eine verständliche Fehlermeldung.

**Achtung Gleitkomma:** `PowerPurchase * f` darf **nicht** mit JavaScript-
`number` gerechnet werden (z. B. `0.29 * 100 = 28.999...`). Faktor als
String einlesen und mit skalierten Ganzzahlen rechnen (z. B. Faktor als
`Zähler/10^Nachkommastellen`, Berechnung mit `BigInt` oder Ganzzahlen).

C#-Ganzzahldivision schneidet Richtung 0 ab (auch bei negativen Werten):
in TS `Math.trunc(a / b)` verwenden, nicht `Math.floor`.

### 5.3 Summen (`CertificateCollection.cs`)

- `TotalNumberOfCertificates = sum(NumberOfCertificatesHeld)`
- `TotalNumberOfCommittedCertificates = sum(NumberOfCommittedCertificates)`
- `TotalRemainingBalance = sum(RemainingBalance)`
- Summen werden über **alle Adressen** gebildet (unabhängig von Filtern).

### 5.4 Ablauf und Ausgabe (`Program.cs`, `CertificateDocument.cs`)

- `PowerEarning` des gewählten Jahres muss genau einmal vorhanden sein.
- Zusammenfassung (heute `stdout` -> `Summary_<Jahr>.csv`):

  ```
  Year: <year>
  Id, Name, Street, City, NumberOfCertificatesHeld, RemainingBalance, NumberOfCommittedCertificates
  <je Adresse eine Zeile>
  999, Total, , , <TotalCertificates>, <TotalRemainingBalance>, <TotalCommitted>
  ```

- Filter für die Dokumenterzeugung:
  - `NameFilter`: nur Namen, die den Text enthalten (C#: case-sensitive).
  - `All = false` (Standard): nur Adressen mit `NumberOfCommittedCertificates != 0`.
- Platzhalter in `Document.html` (alle Vorkommen ersetzen):
  `${year}`, `${plantPowerEarning}`, `${addressName}`, `${addressStreet}`,
  `${addressCity}`, `${personalNumberOfShareCertificate}`,
  `${personalPowerEarning}`, `${transactionTable}`,
  `${personalRemainingBalance}`, `${totalNumberOfShareCertificate}`.
- `${transactionTable}` = `TableHeader` + je Transaktion `TableItem` +
  `TableFooter` (Datum = 31.12.<year>, Beschreibung "Total", Betrag = Summe).
- Formatierung in Tabellen:
  - `${Date}`: `dd.MM.yyyy`
  - `${Amount}`: C#-Format `"##,#"` in `de-CH` -> Tausendertrennzeichen
    `’` (U+2019, ICU) bzw. `'`. **Besonderheit:** der Wert `0` ergibt einen
    **leeren String**. Verhalten in Etappe 1 bzw. 3 genau gegen die
    Referenz prüfen und in Abschnitt 9 dokumentieren.
- Zahlen im Brief (`${personal...}`, `${plantPowerEarning}` usw.) werden ohne
  Tausendertrennzeichen ausgegeben (`int.ToString()`).

### 5.5 Neu: Einstellungen pro Jahr (`Settings.json`)

Liegt in `Customer<Name>/<Jahr>/Settings.json`. Das C#-Programm ignoriert sie.

```json
{
  "printDate": "2026-02-28",
  "signer1": "Max Mustermann",
  "signer2": "John Doe"
}
```

- `printDate` wird als ISO-Datum gespeichert und im Brief als
  `28. Februar 2026` (de-CH, Monat ausgeschrieben) ausgegeben.
- Fehlt die Datei: Standardwerte (`printDate` = heute, Unterzeichnende leer)
  und Hinweis im UI.
- Neue Platzhalter: `${printDate}`, `${signer1}`, `${signer2}`.
- Das C#-Programm kennt diese Platzhalter nicht (siehe Etappe 9, optional).

### 5.6 Bekannte Tests (zu portieren)

`ShareCertificate.Test/CertificateTest.cs`:
- 20 dynamische (2 je Jahr 2010-2019, Faktor 1) + 15 fixe => Committed = 35.
- 25 von 100 Committed bei Ertrag 1000 => PersonalPowerEarning = 250.
- Jahr 2015: Brief enthält 2010-2015, nicht 2016-2019; Held = 21.

`ShareCertificate.Test/CertificateCollectionTest.cs`:
- Leere Sammlung: alle Summen 0.
- Zwei Zertifikate (2/5/3 und 1/5/1) => Totals 3 / 10 / 4, Totals werden auf
  jedes Zertifikat übertragen.

---

## 6. Zielstruktur

```
web/
├── docs/
│   ├── PLAN.md                 (dieses Dokument)
│   └── Benutzeranleitung.md    (Etappe 8)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── model/                  Typen: Address, Transaction, DynamicShare, ...
│   ├── logic/                  certificate.ts, certificateCollection.ts, decimal.ts
│   ├── io/                     csv.ts, zip.ts, dates.ts, validation.ts, yearOps.ts
│   ├── template/               fillTemplate.ts, formatting.ts, printDocument.ts
│   ├── state/                  store.ts, persistence.ts (IndexedDB)
│   └── ui/                     texts.ts, Komponenten je Ansicht
└── test/
    ├── fixtures/               Referenzausgaben aus dem C#-Programm
    └── *.test.ts
```

## 7. Etappen

Jede Etappe nennt: **Ziel**, **Voraussetzungen**, **Aufgaben**,
**Ergebnis/Akzeptanzkriterien**, **Hinweise**. Die Reihenfolge ist
empfohlen; Abhängigkeiten sind angegeben.

---

### [x] Etappe 0: Projektgerüst

**Ziel:** Ein lauffähiges, leeres Web-Projekt, das zu einer einzigen HTML-Datei
gebaut wird.

**Voraussetzungen:** keine.

**Aufgaben:**
- `web/` mit `package.json`, TypeScript (strict), Vite,
  `vite-plugin-singlefile`, Vitest anlegen.
- npm-Skripte: `dev`, `build`, `test`, `typecheck`.
- `index.html` mit Titel "Anteilsscheine" und Platzhalter-Inhalt.
- `.gitignore`: `web/node_modules/`, `web/dist/`.
- Kurzer Abschnitt "Web-Anwendung" in `Readme.md` (Build/Start für Entwickler).

**Ergebnis / Akzeptanz:**
- `npm run build` erzeugt `web/dist/index.html` als **eine** Datei ohne
  externe Referenzen (JS/CSS inline).
- Die Datei lässt sich per Doppelklick (`file://`) öffnen und zeigt die Seite.
- `npm test` läuft (mindestens ein Beispiel-Test).

**Hinweise:** Keine Module, die zur Laufzeit nachgeladen werden (kein
`fetch` von lokalen Dateien, keine Web Worker aus separaten Dateien), sonst
funktioniert `file://` nicht.

---

### [x] Etappe 1: Datenmodell und Berechnung

**Ziel:** Die Berechnung aus `Certificate.cs` und `CertificateCollection.cs`
liefert in TypeScript nachweislich dieselben Ergebnisse.

**Voraussetzungen:** Etappe 0.

**Aufgaben:**
- `model/`: Typen für Address, Transaction, DynamicShare, PowerEarning,
  ConversionFactor (Faktor als Original-String + exakte Darstellung),
  YearData (alle Daten eines Jahres inkl. Template und Settings).
- `logic/decimal.ts`: exakte Multiplikation Ganzzahl x Dezimal-String mit
  Abschneiden (siehe 5.2).
- `logic/certificate.ts`: Berechnung gemäss 5.2, ohne DOM, ohne Template.
- `logic/certificateCollection.ts`: Summen gemäss 5.3.
- Tests: alle Fälle aus 5.6 portieren, zusätzlich:
  - Gleitkomma-Fälle (z. B. `PowerPurchase=100`, `Factor=0.29` => 29).
  - Negative Beträge (Ganzzahldivision Richtung 0).
  - Fehlender Faktor => deutsche Fehlermeldung.
  - `TotalCommitted = 0` => verständlicher Fehler statt `Infinity`/`NaN`.
- Referenzdaten erzeugen: Das C#-Programm mit `CustomerTest/2019` ausführen
  und die Zusammenfassung als `web/test/fixtures/CustomerTest_Summary_2019.csv`
  ablegen. (Nicht `Summary_2019.csv` nennen: das Muster `Summary_20*.csv`
  in `.gitignore` gilt in allen Ordnern.)
  Ist `dotnet` nicht verfügbar, Benutzer bitten, die Datei zu erzeugen:
  ```bash
  cd <Kopie mit CustomerTest> && dotnet run --project <Pfad>/ShareCertificate -- --Year 2019 --CustomerName Test < /dev/null > Summary_2019.csv
  ```
  (Arbeitsverzeichnis muss den Ordner `CustomerTest` enthalten, daher nicht in
  `ShareCertificate` starten; eine Kopie verwenden, da `Generated/` PDFs anlegt. `Console.ReadLine()`
  am Ende wartet auf Eingabe, daher `< /dev/null`.)
  Falls nicht möglich: Referenzwerte von Hand nachrechnen und das im Test
  vermerken.

**Ergebnis / Akzeptanz:**
- Alle Tests grün.
- Für `CustomerTest/2019` (hier noch als Fixture direkt eingelesen oder als
  Testdaten im Code) stimmen alle Zahlen mit der Referenz überein.

**Hinweise:** CSV-Einlesen ist **nicht** Teil dieser Etappe. Für den
Referenztest einen minimalen Parser im Test verwenden oder Etappe 2 vorziehen
und den Referenztest dort ergänzen.

---

### [x] Etappe 2: CSV, ZIP, Validierung und Jahr-Funktionen

**Ziel:** ZIP-Dateien lesen und schreiben, Daten prüfen, Jahre anlegen und
bearbeiten. Reine Logik ohne UI.

**Voraussetzungen:** Etappe 1.

**Aufgaben:**
- `io/dates.ts`: Datum `dd.MM.yy` und `dd.MM.yyyy` lesen (zweistellig = 2000+),
  intern als `{year, month, day}` (keine Zeitzonenprobleme mit `Date`).
- `io/csv.ts`: CSV lesen (Trennzeichen `,` und `;` automatisch erkennen,
  UTF-8 mit/ohne BOM, Windows-1252 als Fallback erkennen und melden) und
  schreiben (immer `,`, UTF-8 ohne BOM, Datum `dd.MM.yyyy`, Faktor als
  Original-String, Zeilenende einheitlich `\n` oder wie im Original).
- `io/zip.ts`:
  - ZIP lesen: Kunde(n) und Jahre anhand `Customer<Name>/<Jahr>/` erkennen,
    unabhängig von einem eventuellen Wurzelordner in der ZIP-Datei.
  - Alle Dateien eines Jahres inkl. `Template/` (HTML als Text, Logo als
    Binärdaten) und `Settings.json` laden.
  - Unbekannte Dateien unverändert mitführen und wieder exportieren.
  - ZIP schreiben: gesamte ursprüngliche Struktur + geänderte/neue Jahre +
    `Summary_<Jahr>.csv` des bearbeiteten Jahres (Format 5.4).
  - Dateiname des Exports: `Anteilsscheine_<Kunde>_<Jahr>_<YYYY-MM-DD>.zip`.
- `io/validation.ts`: Prüfungen mit deutschen Meldungen inkl. Datei und
  Zeile, getrennt in **Fehler** (blockieren Druck) und **Warnungen**:
  - Fehlende Pflichtdateien/-spalten, ungültige Zahlen/Daten.
  - Doppelte Adress-IDs, unbekannte `AddressId` in Transaktionen/Strombezug.
  - Fehlender `PowerEarning` für das gewählte Jahr, fehlender Faktor für ein
    Jahr mit Strombezug.
  - Platzhalter in der Vorlage, die es nicht gibt (Warnung).
- `io/yearOps.ts`:
  - **Bestehendes Jahr bearbeiten:** Jahr auswählen, Daten werden direkt in
    diesem Jahr geändert und beim Export dort zurückgeschrieben.
  - **Neues Jahr anlegen:** Quelljahr wählen, alle Dateien inkl. Template und
    Settings in neues Jahr kopieren. Settings: `printDate` auf heute setzen,
    Unterzeichnende übernehmen. Prüfen, dass das Zieljahr noch nicht
    existiert.
- Tests für alle Module, inkl. Roundtrip (ZIP lesen -> schreiben -> lesen
  ergibt dieselben Daten) und Referenztest mit `CustomerTest/2019` als ZIP.

**Ergebnis / Akzeptanz:**
- Ein ZIP von `CustomerTest/` wird vollständig gelesen, berechnet und die
  erzeugte `Summary_2019.csv` stimmt mit der Referenz überein.
- Roundtrip ohne Datenverlust; exportierte CSVs sind vom C#-Programm lesbar.
- Neues Jahr und Bearbeiten eines bestehenden Jahres sind getestet.

---

### [x] Etappe 3: Vorlage füllen und Druckdokument

**Ziel:** Aus Daten und Vorlage das HTML eines Briefes und das gesamte
Druckdokument (alle Briefe) erzeugen. Reine Logik ohne UI.

**Voraussetzungen:** Etappe 1 (Etappe 2 für Settings-Typ hilfreich).

**Aufgaben:**
- `template/formatting.ts`: Datum `dd.MM.yyyy`, Betrag gemäss `"##,#"`
  (inkl. Sonderfall 0, siehe 5.4), `printDate` ausgeschrieben
  (`28. Februar 2026`).
- `template/fillTemplate.ts`: alle Platzhalter aus 5.4 und 5.5 ersetzen
  (alle Vorkommen), Transaktionstabelle aufbauen. Werte HTML-escapen
  (Namen mit `&`, `<` usw.).
- `template/printDocument.ts`:
  - Aus `Document.html` `<head>`-Styles einmal übernehmen, pro Adresse den
    `<body>`-Inhalt in einen Container mit Seitenumbruch davor
    (`break-before: page`, ausser beim ersten) setzen.
  - Filter: Namensfilter, "Alle" vs. nur `Committed != 0` (siehe 5.4).
  - Logo: Referenzen auf `logo.png` (und andere Dateien aus `Template/`)
    durch `data:`-URLs ersetzen.
- Tests: Platzhalter, Tabellen, Filter, Escaping, Logo-Ersetzung, Test aus
  5.6 ("Jahr 2015 enthält 2010-2015, nicht 2016-2019").

**Ergebnis / Akzeptanz:**
- Für `CustomerTest/2019` entspricht der Brief-Inhalt fachlich dem
  C#-Ergebnis (gleiche Zahlen und Tabellenzeilen).
- Druckdokument ist ein gültiges, eigenständiges HTML-Dokument.

---

### [x] Etappe 4: UI-Grundgerüst, Laden, Speichern

**Ziel:** Benutzer kann ein ZIP laden, Jahr wählen (bearbeiten oder neu
anlegen) und ein ZIP herunterladen. Änderungen gehen nicht verloren.

**Voraussetzungen:** Etappe 2.

**Aufgaben:**
- `state/store.ts`: zentraler Zustand (geladene Daten, gewähltes Jahr,
  "ungespeicherte Änderungen"), einfache Abonnements für die UI.
- Startansicht:
  - Grosse Ablagefläche "ZIP-Datei hierher ziehen oder auswählen".
  - Nach dem Laden: Kunde (falls mehrere) und Aktion wählen:
    **"Jahr <X> bearbeiten / korrigieren"** oder
    **"Neues Jahr anlegen auf Basis von <X>"** (Zieljahr vorgeschlagen: X+1).
  - Validierungsergebnis anzeigen (Fehler/Warnungen verständlich).
- Hauptansicht mit Registerkarten (vorerst leer):
  Adressen | Transaktionen | Strombezug | Ertrag | Faktoren | Einstellungen |
  Vorlage | Übersicht & Druck.
- Kopfzeile: Kunde, Jahr, Knopf **"ZIP herunterladen"**, Anzeige
  "Ungespeicherte Änderungen".
- `state/persistence.ts`: automatischer Zwischenstand in IndexedDB; beim
  Öffnen Angebot "Letzte Sitzung wiederherstellen?".
- `beforeunload`-Warnung bei ungespeicherten Änderungen.
- Nach erfolgreichem Download gilt der Stand als gespeichert.

**Ergebnis / Akzeptanz:**
- Laden -> Jahr wählen -> ZIP herunterladen funktioniert in aktuellen
  Versionen von Firefox, Chrome/Edge und Safari, auch via `file://`.
- Neu laden der Seite bietet die Wiederherstellung an.

**Hinweise:** IndexedDB ist unter `file://` je nach Browser eingeschränkt
(v. a. Safari/Firefox). Verhalten prüfen und in Abschnitt 9 festhalten; bei
Nichtverfügbarkeit nur die `beforeunload`-Warnung verwenden und im UI darauf
hinweisen.

---

### [x] Etappe 5: Daten bearbeiten und Übersicht

**Ziel:** Alle CSV-Daten des Jahres im Browser bearbeiten und die
Zusammenfassung sehen.

**Voraussetzungen:** Etappe 4 (für die Übersicht Etappe 1).

**Aufgaben:**
- Wiederverwendbare Tabellenkomponente (eigene, kleine Implementierung oder
  kleine MIT-Bibliothek, Entscheid begründen): Zellen bearbeiten, Zeile
  hinzufügen/löschen (mit Rückfrage), sortieren, suchen, Eingabeprüfung pro
  Zelle (Zahl, Datum) mit sofortiger Markierung.
- Registerkarten Adressen, Transaktionen, Strombezug, Ertrag, Faktoren.
  - Adress-ID bei Transaktionen/Strombezug als Auswahlliste mit Namen.
  - Neue Adresse: nächste freie ID vorschlagen.
  - Löschen einer Adresse mit Transaktionen/Strombezug: Warnung.
  - Datumseingabe tolerant (`31.12.26`, `31.12.2026`), Anzeige `dd.MM.yyyy`.
- Registerkarte Übersicht: Tabelle wie `Summary_<Jahr>.csv` inkl. Total,
  aktualisiert sich bei jeder Änderung; Fehler/Warnungen der Validierung
  mit Sprung zur betroffenen Zeile.
- Hilfen für das neue Jahr: Hinweis, falls Ertrag oder Faktor für das Jahr
  fehlen, mit Knopf "jetzt erfassen".

**Ergebnis / Akzeptanz:**
- Alle Daten können ohne CSV-Kenntnisse gepflegt werden.
- Änderungen erscheinen sofort in der Übersicht und im Export.
- Ungültige Eingaben werden klar markiert und blockieren den Druck.

---

### [x] Etappe 6: Einstellungen und Vorlagen-Editor

**Ziel:** Druckdatum, Unterzeichnende, Brieftext und Logo im Browser ändern.

**Voraussetzungen:** Etappe 4, Etappe 3.

**Aufgaben:**
- Registerkarte Einstellungen: `printDate` (Datumsfeld, Standard heute),
  `signer1`, `signer2`. Speichern in `Settings.json`.
- Registerkarte Vorlage:
  - **WYSIWYG-Editor als Standard** für den `<body>` von `Document.html`.
    `<head>`/`<style>` bleiben unverändert erhalten und sind nur im HTML-Modus
    sichtbar.
  - Umschalter **"HTML anzeigen"** für Fortgeschrittene: bearbeitet die
    vollständige `Document.html` sowie `TableHeader.html`, `TableItem.html`,
    `TableFooter.html` (die Tabellen-Fragmente nur im HTML-Modus).
  - Knöpfe/Liste "Platzhalter einfügen" mit deutscher Beschreibung
    (z. B. "Name der Person" -> `${addressName}`), inkl. `${printDate}`,
    `${signer1}`, `${signer2}`.
  - **Live-Vorschau** (ausgewählte Person per Auswahlliste) mit echten Daten.
  - Logo: Bild hochladen (PNG/JPG/SVG), ersetzt `Template/logo.png`
    (Dateiname bleibt für Kompatibilität `logo.png`; andere Formate ggf.
    nach PNG konvertieren), Vorschau des Logos.
  - Knopf "Vorlage zurücksetzen" (Stand beim Laden des ZIP).
- Auswahl des WYSIWYG-Editors: Lizenz muss MIT/Apache/BSD sein (z. B. Jodit,
  TinyMCE 6.x, Quill o. ä. evaluieren; **TinyMCE ab 7 und CKEditor 5 sind
  GPL** -> nur mit Rücksprache). Wichtigstes Kriterium: Die bestehende
  Vorlage (Tabellen, Inline-Styles, Klassen wie `pagebreak`,
  `paragraphDistance`, Platzhalter `${...}`) muss beim Öffnen und Speichern
  **ohne Verlust** erhalten bleiben. Entscheid und Begründung in Abschnitt 9.
  Grösse der gebauten HTML-Datei beachten.

**Ergebnis / Akzeptanz:**
- Laie kann Text ändern, fett/kursiv, Absätze, Platzhalter einfügen und das
  Logo austauschen, ohne HTML zu sehen.
- Öffnen und Speichern der unveränderten Vorlage verändert das HTML nicht
  wesentlich (Test mit `CustomerTest/2019/Template/Document.html`).
- Einstellungen werden in `Settings.json` gespeichert und im Brief ersetzt.

---

### [x] Etappe 7: Sammel-PDF über Browser-Druck

**Ziel:** Mit einem Klick das Druckdokument aller Briefe öffnen und als PDF
speichern.

**Voraussetzungen:** Etappe 3, Etappe 5.

**Aufgaben:**
- Registerkarte "Übersicht & Druck": Filter (Namensfilter, Checkbox "Auch
  Personen ohne Anteilsscheine"), Anzahl der Briefe anzeigen.
- Knopf **"Drucken / Als PDF speichern"**: Druckdokument aus Etappe 3 in
  einem unsichtbaren `iframe` laden, auf Bilder warten, `print()` aufrufen.
- Vor dem Drucken: blockierende Validierungsfehler anzeigen und Druck
  verhindern.
- Kurze, bebilderte Anleitung im UI: im Druckdialog "Als PDF speichern"
  wählen, Ränder "Standard", "Kopf- und Fusszeilen" ausschalten.
- Empfehlung: nach dem Drucken ZIP herunterladen (Hinweis anzeigen).
- `@page`-Ränder der Vorlage berücksichtigen; prüfen, dass Seitenumbrüche
  zwischen Briefen und `.pagebreak` innerhalb eines Briefes funktionieren.

**Ergebnis / Akzeptanz:**
- Für `CustomerTest/2019` entsteht ein PDF mit einem Brief pro Person
  (gemäss Filter), jeder Brief beginnt auf einer neuen Seite, Logo sichtbar.
- Geprüft in Firefox, Chrome/Edge und (falls verfügbar) Safari; Unterschiede
  in Abschnitt 9 dokumentieren.

---

### [x] Etappe 8: Auslieferung und Dokumentation

**Ziel:** Benutzer erhalten eine fertige Datei und eine verständliche Anleitung.

**Voraussetzungen:** Etappen 0 bis 7.

**Aufgaben:**
- `azure-pipelines.yml`: Node installieren, `npm ci`, `npm test`,
  `npm run build` in `web/`, Ergebnis als `Anteilsscheine.html` als Artefakt
  veröffentlichen. Bestehende C#-Schritte nicht verändern.
- Optional: Veröffentlichung auf GitHub Pages (nur nach Rücksprache).
- `web/docs/Benutzeranleitung.md` (Deutsch, für Laien, mit Screenshots):
  Jahresablauf Schritt für Schritt (ZIP laden, neues Jahr anlegen bzw.
  korrigieren, Daten erfassen, Vorlage anpassen, drucken, ZIP sichern),
  häufige Fehlermeldungen und deren Behebung.
- `Readme.md`: Abschnitt Web-Anwendung (Entwicklung, Build, Tests),
  Verweis auf Benutzeranleitung.
- Beispiel-ZIP aus `CustomerTest/` als Download/Testdatei bereitstellen.

**Ergebnis / Akzeptanz:**
- ~~Pipeline erzeugt `Anteilsscheine.html`.~~ Verschoben nach Etappe 10
  (Entscheid des Benutzers).
- Eine nicht informatikaffine Testperson schafft den Jahresablauf mit der
  Anleitung ohne Hilfe (Rückmeldungen in Abschnitt 9 festhalten).

---

### [x] Etappe 9 (optional): C#-Programm angleichen oder ablösen

**Ziel:** Klarheit über die Zukunft des C#-Programms.

**Voraussetzungen:** Etappe 8.

**Aufgaben (nach Rücksprache, eine Variante):**
- **Angleichen:** `Settings.json` und die Platzhalter `${printDate}`,
  `${signer1}`, `${signer2}` im C#-Programm unterstützen.
- **Ablösen:** C#-Programm als "veraltet" kennzeichnen, Readme anpassen,
  ggf. entfernen.
- Entscheid des Benutzers: Variante "Ablösen" mit Entfernung des C#-Programms
  (Abschnitt 9).

---

### [x] Etappe 10: Azure-Pipeline für die Web-Anwendung

**Ziel:** Die Azure-Pipeline testet, baut und veröffentlicht nur noch die
Web-Anwendung, ohne C#-Schritte.

**Voraussetzungen:** Etappe 9.

**Aufgaben:**
- `azure-pipelines.yml` auf die Web-Schritte reduzieren (die C#-Schritte fallen
  mit dem C#-Programm weg). Die Web-Schritte aus Etappe 8 bleiben erhalten.
- Lauf auf dem Azure-Agenten prüfen und das Artefakt `Anteilsscheine_Web`
  kontrollieren.

**Ergebnis / Akzeptanz:**
- Pipeline läuft grün auf Azure.
- Das Artefakt `Anteilsscheine_Web` enthält `Anteilsscheine.html`.

**Hinweise:** Aus Etappe 8 verschoben (Entscheid des Benutzers). Die Reihenfolge
hinter Etappe 9 ist gewollt, weil erst dann die C#-Schritte wegfallen.

---

## 8. Status

`[ ]` = offen, `[x]` = abgeschlossen. Eine Etappe wird **nur** dann mit
`[x]` markiert, wenn alle Akzeptanzkriterien erfüllt sind (siehe 4.3). Die
Markierung erfolgt **hier und** in der Überschrift der Etappe in Abschnitt 7.

- [x] Etappe 0: Projektgerüst
- [x] Etappe 1: Datenmodell und Berechnung
- [x] Etappe 2: CSV, ZIP, Validierung, Jahr-Funktionen
- [x] Etappe 3: Vorlage füllen und Druckdokument
- [x] Etappe 4: UI-Grundgerüst, Laden, Speichern
- [x] Etappe 5: Daten bearbeiten und Übersicht
- [x] Etappe 6: Einstellungen und Vorlagen-Editor
- [x] Etappe 7: Sammel-PDF über Browser-Druck
- [x] Etappe 8: Auslieferung und Dokumentation
- [x] Etappe 9 (optional): C#-Programm angleichen oder ablösen
- [x] Etappe 10: Azure-Pipeline für die Web-Anwendung

Nächste Etappe = die erste mit `[ ]`, deren Voraussetzungen alle `[x]` sind.

Abhängigkeiten: 0 -> 1 -> 2 -> 4 -> 5 -> 7 -> 8; 8 -> 9 -> 10; 3 benötigt 1;
6 benötigt 3 und 4; 7 benötigt 3 und 5.
Etappe 3 kann parallel zu Etappe 2 umgesetzt werden.

## 9. Erkenntnisse, Abweichungen, offene Punkte

(Wird nach jeder Etappe ergänzt. Format: `- [Etappe N] Erkenntnis ...`)

- [Planung] Zeilenenden mit `.gitattributes` normalisiert (Commit
  "Add .gitattributes to normalize line endings").
- [Planung] `dotnet` ist in der Entwicklungsumgebung nicht installiert.
- [Planung] Die vom Benutzer erzeugte `Summary_2019.csv` (Wurzelordner,
  von `.gitignore` ausgeschlossen) stammt aus **echten Kundendaten**
  (39 Adressen), nicht aus `CustomerTest/2019` (10 Adressen). Sie ist daher
  **kein** Referenzwert für `CustomerTest` und darf nicht committet werden.
- [Planung] Entscheid: Der Benutzer erzeugt die Referenz für
  `CustomerTest/2019` mit dem C#-Programm und legt sie als
  `web/test/fixtures/CustomerTest_Summary_2019.csv` ab. **Erledigt**
  (Commit "Add C# reference summary for CustomerTest 2019"). Stichprobe
  Adresse 101 von Hand nachgerechnet: Held 44, Rest 19, Committed 56 stimmt.
- [Planung] Entscheid: **Keine** Tests mit echten Kundendaten, auch nicht
  lokal. Getestet wird nur mit `CustomerTest/` und erfundenen Daten.
- [Planung] `Document.html` in `CustomerTest/2019` enthält fest
  eingetragene Werte ("print date: 28. Februar 2023", "signer1: Max
  Mustermann", "signer2: John Doe"). Beim Umsetzen von Etappe 6 durch
  `${printDate}`, `${signer1}`, `${signer2}` ersetzen (eigener Commit).
- [Planung] Die Test-Vorlage referenziert `logo.png` derzeit nicht; reale
  Kundenvorlagen vermutlich schon. Logo-Ersetzung trotzdem testen.
- [Etappe 0] Versionen: Vite 8.3, Vitest 5.1, vite-plugin-singlefile 2.3,
  TypeScript 5.9 (bewusst nicht TypeScript 7, das neu erschienen ist).
  Vitest 5 und Vite 8 brauchen Node.js 22.12 oder neuer (Node 24 vorhanden).
- [Etappe 0] `npm run build` prüft zuerst mit `tsc --noEmit`, da Vite keine
  Typen prüft. `npm run typecheck` steht zusätzlich als eigenes Skript.
- [Etappe 0] Single-File geprüft: `dist/index.html` enthält JS und CSS inline,
  keine externen Referenzen. Öffnen per `file://` in Chromium (Headless,
  Playwright ausserhalb des Repos) ohne Konsolenfehler und ohne Netzanfragen.
  Firefox und Safari sind in dieser Umgebung nicht geprüft; das Prüfen ist
  bei Etappe 4 nachzuholen.
- [Etappe 0] `.gitignore`: `**/node_modules/*` deckte `node_modules` bereits
  ab. Zusätzlich `web/node_modules/` und `web/dist/` wie im Plan ergänzt.
- [Etappe 0] Readme-Abschnitt "Web application" ist auf Englisch, passend zum
  übrigen Readme. Die Aufgabe im Plan nennt keine Sprache.
- [Etappe 0] `npm test` läuft mit einem Beispiel-Test (`test/texts.test.ts`).
  `tsconfig.json` erfasst `src`, `test` und `vite.config.ts`.
- [Etappe 0] Keine `.gitattributes`-Änderung nötig. Die Dateitypen der
  Etappe (HTML, TS, JSON, MD) sind Text. Schriften oder Bilder später als
  `binary` ergänzen.
- [Etappe 1] Umgesetzt in `web/src/logic/` (`decimal.ts`, `certificate.ts`,
  `certificateCollection.ts`) mit Modell in `web/src/model/types.ts`. 25
  Vitest-Tests grün, `npm run build` erfolgreich.
- [Etappe 1] Referenz erfüllt: Alle 10 Adressen und die Total-Zeile von
  `CustomerTest/2019` stimmen mit `web/test/fixtures/CustomerTest_Summary_2019.csv`
  überein (Test `reference2019.test.ts`). Die Eingaben werden per Vite-Import
  `?raw` direkt aus `CustomerTest/2019` gelesen. Dafür gibt es in
  `web/test/raw.d.ts` eine Typdeklaration; `@types/node` ist nicht nötig.
- [Etappe 1] Der Referenztest verwendet einen minimalen CSV-Parser im Test
  (Trennzeichen `,`, Zeilen mit `\r\n` oder `\n`). Er wird in Etappe 2 durch
  `io/csv.ts` ersetzt.
- [Etappe 1] Abweichung (Ergänzung): Ein Umwandlungsfaktor, der für ein Jahr
  doppelt vorkommt, erzeugt eine eigene deutsche Fehlermeldung. C# wirft hier
  ebenfalls einen Fehler (`Single`), aber ohne deutschen Text.
- [Etappe 1] Die Berechnung ist zustandslos (Funktionen statt Klasse mit
  gesetzten Summen). `calculatePersonalPowerEarning` erhält die
  Gesamtsumme als Parameter. Bei Summe 0 kommt die Meldung aus `texts.ts`
  statt `Infinity`/`NaN`.
- [Etappe 1] Die Typen `Settings` und `Template` sind bereits in `YearData`
  definiert, damit das Modell vollständig ist. Befüllt werden sie in den
  Etappen 2 und 3.
- [Etappe 1] Offen für Etappe 3: Das Verhalten von `ToString("##,#")` bei
  Betrag 0 (Plan 5.4 vermutet leeren String) ist noch nicht gegen C# geprüft.
  Die Formatierung ist nicht Teil von Etappe 1.

- [Etappe 3] Umgesetzt in `web/src/template/` (`formatting.ts`, `fillTemplate.ts`,
  `printDocument.ts`) mit 132 Vitest-Tests grün, `npm run typecheck` und
  `npm run build` erfolgreich. `texts.ts` um `print` und
  `errors.templateWithoutBody` ergänzt. Eigene Commits pro Schritt.
- [Etappe 3] Nicht gegen C# geprüft: `dotnet` ist nicht installiert. Das
  Verhalten von `"##,#"` (0 ergibt leeren String, Tausendertrennzeichen `’`
  bei de-CH) stammt aus der .NET-Dokumentation und dem Plan. Offen: einmal mit
  `dotnet` gegen `CustomerTest/2019` prüfen, sobald verfügbar.
- [Etappe 3] Abweichung (Ergänzung): Platzhalter werden in **einem** Durchgang
  ersetzt, und eingesetzte Werte werden nicht erneut ersetzt. Das C#-Programm
  ersetzt nacheinander; unterschiedlich nur, wenn ein Name oder eine Beschreibung
  Text wie `${...}` enthält.
- [Etappe 3] Abweichung (Ergänzung): Werte werden HTML-escaped (`&`, `<`, `>`,
  `"`, `'`), wie im Plan verlangt. Das C#-Programm escaped nicht; ein Name mit
  `&` ergäbe dort ungültiges HTML.
- [Etappe 3] Die Transaktionstabelle entspricht dem C#-Ablauf: Kopf, Zeilen und
  Total-Zeile, je mit Zeilenumbruch. Die Brief-Zeilen enthalten nur Transaktionen
  bis zum Jahr (Test "Jahr 2015" mit Held = 21 aus 5.6).
- [Etappe 3] Mit Filter "Alle" und Summe Committed = 0 meldet der Druck den
  Fehler aus `texts.errors.noCommittedCertificates` (wie der Plan 5.2 verlangt),
  statt zu drucken. Etappe 7 sollte diesen Fall in der Validierung vor dem Druck
  erkennen.
- [Etappe 3] Logo: Das Modell kennt nur `Template/logo.png`. Das Logo wird immer
  als `image/png` eingebettet. Andere Dateien aus `Template/` werden nicht
  eingebettet. Das wird relevant, sobald Etappe 6 andere Formate zulässt
  (dort nach PNG konvertieren, wie im Plan vorgesehen).
- [Etappe 3] Jeder Brief ist ein `div.letter`; ab dem zweiten Brief hat er die
  Klasse `letter-break` (`break-before: page`). Das Seitenumbruchverhalten in
  Browsern ist noch nicht geprüft; das folgt in Etappe 7.
- [Etappe 3] Die Referenz `CustomerTest/2019` ist nur teilweise geprüft: Die
  Zahlen im Brief (Jahr, Ertrag, Total, Held, Rest, Committed, Ertragsanteil)
  stimmen für Adresse 101 mit der Summary-Referenz überein. Ertragsanteil 20384
  ist von Hand nachgerechnet (`trunc(trunc(129900 / 356) * 56)`). 8 Briefe ohne
  Filter entsprechen 8 Adressen mit Committed != 0.
- [Etappe 3] Die Vorlage `CustomerTest/2019/Template/Document.html` hat noch
  fest eingetragene Werte für Druckdatum und Unterzeichnende. Das wird in
  Etappe 6 ersetzt (siehe oben). Die Tests prüfen diese Felder deshalb noch nicht.
- [Etappe 3] Für das Druckdokument ist `<body>` in `Document.html` Pflicht. Fehlt
  er, meldet der Druck einen Fehler.

- [Etappe 2] Abgeschlossen: Umsetzung in `io/dates.ts`, `io/csv.ts`,
  `io/zip.ts`, `io/validation.ts`, `io/yearOps.ts`, 98 Tests grün, Build
  erfolgreich. Abnahme "exportierte CSVs sind vom C#-Programm lesbar" geprüft:
  Das C#-Programm liest den Export ohne Fehler (leere stderr-Datei), die
  Zusammenfassung aus dem Export ist identisch mit der des Originals und mit
  der Zusammenfassung aus dem Web-Code, und die Anzahl der erzeugten PDFs ist
  gleich. Die Prüfung erfolgte mit einer temporären Testdatei (nicht
  committet) und einer Kopie von `CustomerTest/2019`.
- [Etappe 2] Abhängigkeiten: jszip 3.10.2 und papaparse 5.7.1 (MIT). Für
  PapaParse zusätzlich `@types/papaparse` als devDependency (MIT), da das
  Paket keine eigenen Typen mitliefert.
- [Etappe 2] `Summary_<Jahr>.csv` liegt im Kundenordner
  (`Customer<Name>/Summary_<Jahr>.csv`), wie in der Readme beschrieben, nicht
  im Jahresordner. Format wie beim C#-Programm: Trennzeichen ", ", LF, Feld
  in Anführungszeichen nur bei Komma, Anführungszeichen oder Zeilenumbruch.
- [Etappe 2] Entscheid: Das Modell hält Rohwerte (`YearModel` in
  `model/types.ts`). Die Tabellen liegen als Zellen vor, wie sie in der Datei
  stehen, auch ungültige. `YearData` ist eine typisierte Sicht und entsteht
  nur, wenn alle Werte gültig sind (`toYearData`). Speichern schreibt das
  Rohmodell verlustfrei; gültige Datumswerte werden als `dd.MM.yyyy`
  geschrieben. Fehlende Dateien oder ungültige Einstellungen (`Settings.json`)
  verhindern das Modell bzw. die Typisierung; eine ungültige
  `Settings.json` wird beim Speichern nicht überschrieben.
- [Etappe 2] Ein CSV-Lesefehler (z. B. offenes Anführungszeichen) lässt die
  typisierten Daten undefined. Das Rohmodell bleibt erhalten.
- [Etappe 2] Bei ungültigen Daten wird `Summary_<Jahr>.csv` entfernt, damit
  keine veraltete Zusammenfassung zurückbleibt. Sie wird neu erzeugt, sobald
  die Daten gültig sind.
- [Etappe 2] Datumseingabe ist streng `dd.MM.yy` oder `dd.MM.yyyy` mit
  zweistelligem Tag und Monat. Einstellige Werte wie `9.12.11` bleiben
  ungültig. Die tolerante Eingabe ist Aufgabe von Etappe 5.
- [Etappe 2] Unbekannte `AddressId` in Transaktionen/Strombezug ist eine
  Warnung. Der Eintrag wird nicht berücksichtigt, das Einlesen bleibt möglich.
- [Etappe 2] Doppelter Umwandlungsfaktor wird für jedes Jahr als Fehler
  gemeldet, auch wenn das Jahr keinen Strombezug hat. C# meldet nur bei
  Bedarf. Bewusste Verschärfung wegen Datenqualität.
- [Etappe 2] Encoding: Windows-1252 wird erkannt und gemeldet. Beim Speichern
  werden Daten und Vorlagen als UTF-8 geschrieben. Die BOM der
  `Document.html` entfällt; das `meta charset` der Vorlage ist UTF-8, daher
  unkritisch.
- [Etappe 2] CSV-Schreibformat: Trennzeichen ",", UTF-8 ohne BOM, CRLF wie
  die Originaldateien, Datum `dd.MM.yyyy`. Ein Datum `31.12.12` wird beim
  Speichern zu `31.12.2012`.
- [Etappe 2] Zeilennummern in Meldungen zählen die Zeilen der Datei. Sie
  stimmen nicht mehr, wenn ein Feld mit Zeilenumbruch in Anführungszeichen
  steht (Annahme: ein Datensatz pro Zeile).
- [Etappe 2] Neues Jahr: `Generated/` (PDFs) wird nicht kopiert. `printDate`
  ist heute, die Unterzeichnenden bleiben. Fehlt `Settings.json` in der
  Quelle, werden die Unterzeichnenden leer angelegt.
- [Etappe 2] Fehlt `Settings.json`, ist das eine Warnung. Beim Speichern wird
  die Datei angelegt.
- [Etappe 2] Referenztest: `CustomerTest/2019` läuft als ZIP mit Wurzelordner
  durch Lesen, Berechnung und Speichern. Die Zusammenfassung stimmt Zeile für
  Zeile mit `CustomerTest_Summary_2019.csv` überein. Das Logo wird über Vite
  `?inline` eingelesen.
- [Etappe 2] Ergänzt: `calculateYearCertificates` in
  `logic/certificateCollection.ts` (alle Zertifikate eines Jahres, für
  Zusammenfassung und später Brief). In `texts.ts` die Abschnitte `issues`
  und `yearOps`.
- [Etappe 2] Offen für Etappe 4: Download als Blob und das Verhalten unter
  `file://` (IndexedDB) sind noch nicht geprüft.
- [Etappe 2] Der Befehl in Etappe 1 (Abschnitt 7) war falsch: Das Programm
  liest `./CustomerTest` relativ zum Arbeitsverzeichnis, nicht relativ zu
  `ShareCertificate`. Korrigiert auf `dotnet run --project`.

- [Etappe 4] Zwischenstand (Etappe bleibt `[ ]`, weil Firefox und Safari nicht
  geprüft sind). Umgesetzt: `state/store.ts` (AppStore mit Revisionszähler für
  "ungespeichert"), `state/persistence.ts` (IndexedDB, Autosave nach 500 ms),
  `ui/` (dom, issues, context, startView, mainView, app) und `main.ts` mit
  `style.css`. 152 Vitest-Tests grün, `npm run build` erfolgreich.
- [Etappe 4] Geprüft mit Playwright (Chromium, headless, Skript ausserhalb des
  Repos) über `file://` mit `CustomerTest/` als ZIP: laden, Jahr bearbeiten,
  neues Jahr anlegen, Autosave, Wiederherstellen nach Neuladen, ZIP-Download
  (Dateiname, `Settings.json` mit heutigem Datum), keine Konsolenfehler und keine
  Netzwerkanfragen, Abmeldewarnung bei ungespeicherten Änderungen.
- [Etappe 4] Playwright-Firefox (159) und Playwright-WebKit (27.2) geprüft: Das
  Ablaufskript (laden, bearbeiten, neues Jahr, Autosave, Wiederherstellen,
  Download, Abmeldewarnung) läuft wie in Chromium ohne Fehler und ohne
  Netzwerkanfragen durch. IndexedDB unter `file://` funktioniert in beiden.
  Bei verweigertem Zugriff auf `indexedDB` erscheint der Hinweis in allen drei.
- [Etappe 4] Offen: echtes Safari (nur macOS). WebKit ist dieselbe
  Rendering-Engine, aber kein Safari-Build. Die Etappe bleibt `[ ]`, bis Safari
  auf einem Mac geprüft ist. Playwright-Firefox ist ebenfalls kein
  Release-Firefox. Eine Prüfung im normalen Firefox ist sinnvoll.
- [Etappe 4] Umgebung: Für die Playwright-Browser mussten Systembibliotheken
  nachinstalliert werden (`playwright install-deps firefox webkit`, mit sudo).
- [Etappe 4] Abschluss: Die manuellen Tests mit `Anteilsscheine-Testdaten.zip`
  und `Anteilsscheine.html` (Stand Commit `b4da8dd`) sind erfolgreich
  durchgelaufen. Die Etappe ist damit auf `[x]` gesetzt. Die Browser, mit denen
  manuell getestet wurde, sind hier nicht erfasst. Die Anforderung "Firefox,
  Chrome/Edge und Safari" gilt als durch die manuellen Tests abgedeckt, sofern
  Safari dabei war. Automatisiert geprüft sind Chromium, Firefox und WebKit.
- [Etappe 4] Offen für Etappe 5: Die Tabellen fehlen noch. Bearbeitung und
  Übersicht bleiben in Etappe 5.
- [Etappe 4] Ergänzung: Ein Download gilt als gespeichert, sobald er ausgelöst
  wurde. Der Abschluss des Downloads ist im Browser nicht erkennbar.
- [Etappe 4] Ergänzung: Der Download ist auch bei Fehlern in der Prüfung möglich,
  damit nichts verloren geht. Der Plan verlangt die Sperre nur für den Druck
  (Etappe 7).
- [Etappe 4] Ergänzung: Eine wiederhergestellte Sitzung gilt als ungespeichert,
  bis sie heruntergeladen wurde. Beim Laden einer anderen ZIP-Datei bei
  ungespeicherten Änderungen fragt eine Bestätigung nach. Über "Jahr wechseln"
  kommt man zur Startansicht zurück.
- [Etappe 4] Fehler in Etappe 2 behoben: `saveYear` schlug fehl, wenn für das
  Jahr der Ertrag oder ein Umwandlungsfaktor fehlte (Berechnung der
  Zusammenfassung warf). Die Prüfung meldet das bereits. Jetzt wird das ZIP
  ohne `Summary_<Jahr>.csv` geschrieben, die Daten bleiben erhalten.
- [Etappe 4] Die UI-Schicht hat keine Vitest-Tests (Node-Umgebung ohne DOM).
  Die Fachlogik darunter ist getestet. UI-Prüfung erfolgte per Playwright.
- [Etappe 4] Die Registerkarten sind bis auf den Platzhalter leer, wie im Plan
  vorgesehen. Die Startansicht bietet "Neues Jahr anlegen" mit Vorschlag X+1.

- [Etappe 5] Umgesetzt in `io/cells.ts` (Zellprüfung und -normalisierung),
  `io/tableEdit.ts` (Zelle setzen, Zeile hinzufügen/löschen, nächste ID),
  `io/validation.ts` (`checkYear`, `findMissingYearData`), `state/store.ts`
  (`updateTable`), `ui/table.ts` (Tabellenkomponente), `ui/dataViews.ts` (fünf
  Registerkarten, Hinweise), `ui/summaryView.ts` (Übersicht), `ui/issues.ts`
  (Sprung zur Zeile). 186 Vitest-Tests grün, `npm test`, `npm run build` erfolgreich.
- [Etappe 5] Entscheid: Keine Tabellen-Bibliothek. Die Anforderungen (Zellprüfung
  mit sofortiger Markierung, Auswahl der Person, Sprung zur Zeile) sind klein und
  eng mit der Fachlogik verbunden. Eine Bibliothek hätte Grösse und Lizenzprüfung
  gebracht, ohne diese Punkte einfacher zu machen.
- [Etappe 5] Ergänzung: Änderungen gehen sofort in die Arbeitskopie (`saveYear`),
  nicht erst beim Herunterladen. Sonst würden Autosave und Wiederherstellung
  Tabellenänderungen verlieren, weil sie die Arbeitskopie speichern.
- [Etappe 5] Erkenntnis: Baut die Ansicht nach jeder Zellbearbeitung neu auf, geht
  der nächste Klick verloren, weil das Element beim Verlassen des Feldes ersetzt
  wird. Deshalb ist die Veröffentlichungsart "data" eingeführt: Dann wird nur der
  Status "Ungespeichert" ersetzt. Die Prüfliste oben und die Hinweise aktualisieren
  sich bei Zelländerungen daher erst beim nächsten Wechsel der Registerkarte oder
  eines Knopfes. Die Zellmarkierung ist dagegen sofort.
- [Etappe 5] Ergänzung: Die Datumseingabe im Editor ist tolerant (`9.12.11` wird zu
  `09.12.2011`). Die Dateiprüfung bleibt streng wie in Etappe 2.
- [Etappe 5] Ergänzung: Nach der ersten Änderung einer Tabelle entfallen deren
  Meldungen zur Datei (CSV-Syntax, Kodierung), weil sie den ursprünglichen
  Dateizustand betreffen.
- [Etappe 5] Ergänzung: Sortierung und Suche wirken nur auf die Anzeige. Gespeichert
  wird die Reihenfolge der Datei. Neue Zeilen stehen am Ende.
- [Etappe 5] Ergänzung: Eine neu hinzugefügte Zeile ist bis zum Ausfüllen ungültig
  und wird als Fehler gemeldet. Komplett leere Zeilen lässt `saveYear` in der Datei
  weg, sie bleiben bis zum Neuladen aber in der Anzeige.
- [Etappe 5] Begriffe der Übersicht (Entscheid nötig): "Anteilsscheine" ist
  `NumberOfCertificatesHeld`, "Restbetrag (CHF)" ist `RemainingBalance`,
  "Verpflichtet" ist `NumberOfCommittedCertificates`. Bitte mit dem Fachbereich
  abstimmen.
- [Etappe 5] Interpretation des Kriteriums "blockieren den Druck": Bei ungültigen
  Daten wird die Übersicht nicht berechnet, und die Datei enthält dann keine
  `Summary_<Jahr>.csv`. Eine Blockade des Druckdialogs gibt es erst mit dem Druck
  in Etappe 7 (dort laut Plan vorgesehen).
- [Etappe 5] Offen: Fehlt eine Pflichtspalte in einer CSV, zeigt die Tabelle nur die
  vorhandenen Spalten. Die Meldung erscheint, aber die Spalte lässt sich in der
  Oberfläche nicht ergänzen.
- [Etappe 5] Offen: Die Meldung zu `Settings.json` führt über "Anzeigen" zur
  Registerkarte Einstellungen. Sie ist bis Etappe 6 leer.
- [Etappe 5] Geprüft im Browser mit Playwright (ausserhalb des Repos) über
  `file://` mit `CustomerTest/` als ZIP: Chromium, Firefox und WebKit. Abgedeckt
  sind Bearbeiten, Klick direkt nach einer Zelländerung, Hinzufügen mit nächster
  ID, Warnung beim Löschen, Suche, Sortierung, Sprung zur Zeile, Hinweise für ein
  neues Jahr, Export, Wiederherstellung und die Übersicht. Die Übersicht stimmt für
  `CustomerTest/2019` mit der C#-Referenz (Adresse 101: 44 / 19 / 56) überein. Eine
  Änderung von +100 CHF ergibt 45 / 19 / 57. Safari auf macOS ist wie in Etappe 4
  nicht geprüft.

- [Etappe 6] Zwischenstand (Etappe bleibt `[ ]`, weil die Akzeptanz "Laie kann
  Text ändern" und Safari auf macOS nicht geprüft sind). Umgesetzt: Einstellungen
  (`ui/settingsView.ts`), Vorlage (`ui/templateView.ts`, `ui/logo.ts`,
  `ui/editor.ts`), Store (`updateSettings`, `updateTemplate`, `resetTemplate`,
  `resetSettings`), `template/templateBody.ts`, Vorschau `buildLetterPreview`.
  202 Vitest-Tests grün, `npm test` und `npm run build` erfolgreich.
- [Etappe 6] Entscheid Editor: Jodit 4.20.1 (MIT, keine Abhängigkeiten, Typen
  enthalten). Nicht gewählt: TinyMCE 8 (Lizenz "SEE LICENSE", nicht MIT). TinyMCE
  6.8.6 (MIT) und Quill 2 (BSD-3) wurden nur auf dem Papier bewertet, nicht
  praktisch getestet. TinyMCE lädt Skins und Plugins zur Laufzeit nach, was für
  die Single-File-Auslieferung problematisch wäre. Quill kennt keine Tabellen und
  keine Inline-Styles und würde die Vorlage verändern.
- [Etappe 6] Jodit mit `CustomerTest/2019/Template/Document.html` geprüft
  (Playwright, außerhalb des Repos): Öffnen und Herunterladen ohne Änderung
  ergibt eine byte-identische Datei (BOM ausgenommen, siehe Etappe 2).
  Ohne Gegenmassnahme wird `&#36;{year}` zu `${year}`, und der Brief zeigt dann
  einen falschen Wert. Deshalb wird `&#36;` in einen Marker
  `<span class="escaped-dollar">` gehüllt und beim Speichern zurückgewandelt
  (`template/templateBody.ts`).
- [Etappe 6] Der Editor normalisiert den Body strukturell: `<p>` um `<ul>` wird
  aufgelöst, Leerabsätze wechseln, Fett wird als `<strong>` geschrieben. Die
  Darstellung bleibt gleich, und der Head bleibt unverändert.
- [Etappe 6] Grösse: `dist/index.html` wächst von 159 kB auf 940 kB (gzip 274 kB),
  fast alles Jodit. Zu beobachten.
- [Etappe 6] Jodit lädt beim Bearbeiten die Google-Fonts-Liste, sobald
  Schriftfamilien im Inhalt vorkommen. Abgeschaltet über
  `font.googleFonts.url = ""`. Geprüft in Chromium, Firefox und WebKit (auch beim
  Tippen): keine Anfragen außerhalb von `file:`, `data:` und `blob:`.
- [Etappe 6] Abweichung/Ergänzung: `CustomerTest/2019/Template/Document.html`
  enthält nun `${printDate}`, `${signer1}`, `${signer2}` statt der festen Werte
  (eigener Commit, wie in dieser Liste vorgesehen). Folge: Das C#-Programm kennt
  diese Platzhalter nicht und druckt sie wörtlich in die Briefe. Entscheidung dazu
  gehört zu Etappe 9.
- [Etappe 6] Erledigt: `CustomerTest/2019/Settings.json` ergänzt, mit den bisherigen
  Werten (28.02.2023, Max Mustermann, John Doe). Die Briefe zeigen damit wieder
  die alten Angaben, und das ZIP hat keine Warnung mehr.
- [Etappe 6] Entscheid: "Vorlage zurücksetzen" stellt den Stand her, den das Jahr
  beim ersten Anzeigen in dieser Sitzung hatte. Nach der Wiederherstellung einer
  Sitzung ist das der wiederhergestellte Stand, nicht das Original-ZIP. Bei einem
  neuen Jahr ist es die kopierte Vorlage.
- [Etappe 6] Fehler behoben: Ein entferntes Logo blieb als Datei im ZIP
  (`saveYear`). Jetzt wird `Template/logo.png` gelöscht.
- [Etappe 6] Logo: JPG und SVG werden im Browser über ein Canvas in PNG
  umgewandelt. SVG ohne feste Grösse wird 800 px breit. Geprüft: Der Export
  enthält bei einem SVG-Logo eine PNG-Datei (Signatur `89 50 4E 47`).
- [Etappe 6] Eine ungültige `Settings.json` lässt sich mit "Mit Standardwerten
  ersetzen" reparieren. Die bisherige Datei wird dabei ersetzt, nach Rückfrage.
- [Etappe 6] Änderungen in Textfeldern und im Editor werden als "data"
  veröffentlicht. Die Prüfliste und die Hinweise aktualisieren sich erst beim
  nächsten Wechsel der Registerkarte (wie in Etappe 5). Die Vorschau aktualisiert
  sich sofort.
- [Etappe 6] Geprüft mit Playwright über `file://`, mit `CustomerTest/` als ZIP,
  in Chromium, Firefox und WebKit: Einstellungen in der Vorschau und in
  `Settings.json`, Fett und Absätze im Editor, Platzhalter am Cursor, Logo (JPG,
  SVG), Zurücksetzen, Export mit Änderungen, keine Konsolenfehler.
- [Etappe 6] Offen: Tabellen im Brief-Body (`<table>`) im WYSIWYG-Modus sind nicht
  geprüft. Die Tabellen-Schaltflächen fehlen bewusst. Tabellenfragmente bearbeitet
  man im HTML-Modus.
- [Etappe 6] Abnahme: Der Benutzer hat Etappe 6 freigegeben. Nicht von mir geprüft
  sind echtes Safari auf macOS und die Bedienung durch eine nicht
  informatikaffine Person (Akzeptanz "Laie kann Text ändern"). Diese Punkte sind
  daher durch die Abnahme des Benutzers abgedeckt, nicht durch eine Prüfung
  dieser Umsetzung.
- [Etappe 6] Entscheid des Benutzers: Die festen Werte in der Testvorlage sind
  durch `${printDate}`, `${signer1}`, `${signer2}` ersetzt. Das C#-Programm druckt
  diese Platzhalter wörtlich, bis Etappe 9 entschieden ist.

- [Etappe 7] Zwischenstand (Etappe bleibt `[ ]`, weil der echte Druckdialog in
  Chrome/Edge, Firefox und Safari nicht von Hand geprüft ist). Umgesetzt:
  `template/printDocument.ts` (`countLetters`, `printProblem`), `ui/printFrame.ts`
  (Druck in verstecktem `iframe`, wartet auf die Bilder, dann `print()`),
  `ui/printView.ts` (Registerkarte "Übersicht & Druck": Namensfilter, Checkbox,
  Anzahl Briefe, Sperre, Anleitung, darunter die Übersicht). 207 Vitest-Tests grün,
  `npm test` und `npm run build` erfolgreich.
- [Etappe 7] Abweichung (mit dem Benutzer geklärt): Die Anleitung im UI ist nur Text,
  ohne Bilder. Die Screenshots folgen in Etappe 8 (`Benutzeranleitung.md`).
- [Etappe 7] Sperre: Fehler in den Daten (Schweregrad Fehler) und die Vorlage ohne
  `<body>` sperren den Druck. Ebenso fehlende Anteilsscheine bei Filter "Alle" (keine
  Summe Verpflichtet). Warnungen sperren nicht. Der Knopf ist dann deaktiviert, und die
  Gründe stehen darüber. Der Ertragsfehler ist im Browser geprüft.
- [Etappe 7] Mit dem Filter "Alle" und ohne Anteilsscheine erkennt
  `printProblem` den Fehler vor dem Druck (Etappe 3 hatte das offen gelassen).
- [Etappe 7] Geprüft mit Playwright (ausserhalb des Repos) über `file://` mit einem
  ZIP von `CustomerTest/` in Chromium, Firefox und WebKit: Zählung (8, 10 mit Checkbox,
  1 mit Namensfilter, 0 ohne Treffer), Druckdokument (8 Briefe, 7 Umbrüche,
  Titel, Einstellungen, keine Platzhalter, keine externen Verweise), Sperre bei
  fehlendem Ertrag mit Meldung. In Chromium und Firefox wird der Frame nach dem
  Druck entfernt, also der Dialog geschlossen.
- [Etappe 7] Playwright-Firefox: Nach `print()` klickt Playwright nichts mehr an
  (Element sichtbar, aber nicht bedienbar). Die Seite selbst reagiert auf
  DOM-Klicks normal. Das Skript bedient deshalb nach dem Druck per DOM-Klick.
- [Etappe 7] WebKit (Headless): `afterprint` feuert nicht, deshalb bleibt das
  verborgene `iframe` bis zum nächsten Druck im DOM. Es liegt ausserhalb des
  sichtbaren Bereichs. Auf dem Mac prüfen, ob Safari `afterprint` auslöst.
- [Etappe 7] PDF-Prüfung (Chromium `page.pdf`, Auswertung mit pdf.js): Jeder der 8
  Briefe beginnt auf einer neuen Seite, und keine Seite enthält Text von zwei Briefen.
  Insgesamt 24 Seiten. Die Vorlage erzeugt je Brief 3 Seiten (`.pagebreak` im Brief
  und `page-break-before` in `TableHeader.html`). Auf der Seite mit "Transaction data"
  steht nur diese Überschrift, die Tabelle beginnt auf der nächsten Seite. Das
  entspricht dem C#-Programm mit derselben Vorlage, ist kein Fehler der Web-App.
- [Etappe 7] Logo: Die Testvorlage referenziert `logo.png` nicht. Mit einer
  temporären Kopie, die `<img src="logo.png">` enthält, erscheint das Logo in allen
  8 Briefen (8 Bildoperationen im PDF).
- [Etappe 7] Offen: Der echte Druckdialog (Ziel "Als PDF speichern", Ränder
  "Standard", Kopf- und Fusszeilen aus) ist nicht automatisierbar. Die Schritte in
  der Anleitung müssen in Chrome, Edge, Firefox und Safari von Hand geprüft werden.
  Die Optionen heissen je Browser etwas anders.
- [Etappe 7] Abnahme: Der Benutzer hat den Druck in den Browsern bestätigt. Die
  Etappe ist damit auf `[x]` gesetzt. Die Prüfung von Safari auf dem Mac ist wie in
  Etappe 4 und 5 nicht von mir durchgeführt; sie ist durch die Bestätigung des
  Benutzers abgedeckt.

- [Etappe 8] Zwischenstand (Etappe bleibt `[ ]`, weil die Pipeline auf Azure noch
  nicht gelaufen ist und die Prüfung durch eine nicht informatikaffine Person fehlt).
  Umgesetzt: `azure-pipelines.yml` mit den Web-Schritten (Node 24, `npm ci`,
  `npm test`, `npm run build`, `Anteilsscheine.html` als Artefakt `Anteilsscheine_Web`).
  Die bestehenden C#-Schritte sind unverändert, die Datei wurde nur ergänzt. Die
  YAML-Struktur ist mit dem Parser `yaml` geprüft, ein Lauf auf dem Windows-Agent
  steht aus. `web/docs/Benutzeranleitung.md` mit 9 Screenshots (`web/docs/img/`),
  `web/docs/Beispiel-Anteilsscheine.zip` (aus `CustomerTest/`), Readme aktualisiert.
  Tests (207) und Build sind grün.
- [Etappe 8] Abweichung (Ergänzung): Das Beispiel-ZIP liegt unter `web/docs/`, weil
  der Plan keinen Ort nennt. Die Pipeline veröffentlicht es nicht separat.
- [Etappe 8] Die Screenshots zeigen nur die Oberfläche. Der Druckdialog des Browsers
  ist nicht fotografierbar; die Schritte stehen als Text im Abschnitt "Briefe drucken".
  Die Screenshots entstanden mit Playwright (Chromium, Testdaten aus `CustomerTest/`).
- [Etappe 8] Offen: Die Übersicht im Druck-Tab zeigt bei fehlendem Ertrag dieselbe
  Meldung wie die Prüfliste (Seiteneffekt der Übersicht aus Etappe 5). Die Meldung
  erscheint dadurch doppelt, die Funktion ist nicht betroffen.
- [Etappe 8] GitHub Pages (nach Rücksprache, Repository ist öffentlich): Workflow
  `.github/workflows/pages.yml` läuft bei jedem Push auf `master`, testet, baut und
  veröffentlicht `index.html` und `Anteilsscheine.html`. Einmalig nötig: unter
  GitHub "Settings > Pages > Source" auf "GitHub Actions" stellen. Der Workflow ist
  nicht auf GitHub gelaufen; der erste Lauf steht aus.
- [Etappe 8] Offen: Prüfung der Anleitung durch eine nicht informatikaffine Person,
  Rückmeldungen werden hier festgehalten.
- [Etappe 8] Entscheid des Benutzers: Die Prüfung der Azure-Pipeline ist aus Etappe 8
  herausgenommen und in die neue Etappe 10 verschoben. Das Akzeptanzkriterium
  "Pipeline erzeugt Anteilsscheine.html" gilt deshalb nicht mehr für Etappe 8.
- [Etappe 8] GitHub Pages läuft: Der erste Deploy scheiterte mit 404, weil die
  Pages-Quelle noch nicht auf "GitHub Actions" stand. Nach der Einstellung und einem
  erneuten Lauf ist die Seite unter https://pekarasa.github.io/Anteilsscheine/
  erreichbar. Die Readme verlinkt sie.
- [Etappe 8] Die Commit-Nachrichten von 11 Commits wurden nachträglich umformuliert
  (Force-Push auf `master`, Entscheid des Benutzers). Die Dateiinhalte sind unverändert.
- [Etappe 8] Abnahme: Der Benutzer hat die Benutzeranleitung und die Auslieferung
  freigegeben. Die Prüfung durch eine nicht informatikaffine Testperson gilt damit
  als abgedeckt. Die Etappe ist damit auf [x] gesetzt.
- [Etappe 9] Entscheid des Benutzers: Variante "Ablösen" mit Entfernung des
  C#-Programms, damit das Repository bereinigt wird.
- [Etappe 9] C#-Programm abgelöst: Die Ordner `ShareCertificate/` und
  `ShareCertificate.Test/` sowie die Lösungsdatei `ShareCertificate.sln` wurden
  gelöscht. `Readme.md` beschreibt nur noch die Web-Anwendung. `CustomerTest/`
  bleibt für die automatisierten Tests der Web-Anwendung unverändert erhalten.
  Die Tests (207) und der Build laufen weiterhin fehlerfrei.
- [Etappe 10] `azure-pipelines.yml` wurde auf die Web-Schritte reduziert
  (Node 24, `npm ci`, `npm test`, `npm run build`, Kopieren von `Anteilsscheine.html`
  und Veröffentlichen als Artefakt `Anteilsscheine_Web`). Die C#-Schritte und
  -Variablen wurden entfernt. Die YAML-Syntax ist mit dem Parser `yaml`
  validiert. Lokale Tests (207) und Build laufen fehlerfrei.
- [Etappe 10] Die veraltete Aufgabe `NodeTool@0` erzeugte beim ersten Lauf
  zwei Warnungen und wurde durch `UseNode@1` (mit `version: '24.x'`) ersetzt.
- [Etappe 10] Abnahme: Der Benutzer hat bestätigt, dass die Pipeline auf Azure
  fehlerfrei durchgelaufen ist und das Artefakt erzeugt wurde. Die Etappe ist
  damit auf [x] gesetzt.

## 10. Entstehung

Dieser Plan entstand in einer Beratungssession (November 2026). Verlauf:
1. Frage: Wie wird das Programm für Laien nutzbar? Optionen: CLI vereinfachen,
   Excel statt CSV, Desktop-GUI (Avalonia), Web-Anwendung.
2. Idee des Benutzers: statische HTML-Seite mit ZIP-Upload, Bearbeitung im
   Browser, ZIP-Download und PDF-Erzeugung. Bewertet als gut geeignet
   (kleine Logik, HTML-Vorlagen vorhanden, kumulative Daten, Datenschutz).
3. PDF-Varianten: a) Browser-Druck, b) PDF-Bibliothek, c) html2pdf
   (Rasterbild, abgelehnt). Gewählt: a).
4. Entscheidungen gemäss Abschnitt 3.
