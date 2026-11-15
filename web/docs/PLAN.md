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
  cd ShareCertificate && dotnet run -- --Year 2019 --CustomerName Test < /dev/null
  ```
  (Arbeitsverzeichnis muss den Ordner `CustomerTest` enthalten; `Console.ReadLine()`
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

### [ ] Etappe 2: CSV, ZIP, Validierung und Jahr-Funktionen

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

### [ ] Etappe 3: Vorlage füllen und Druckdokument

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

### [ ] Etappe 4: UI-Grundgerüst, Laden, Speichern

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

### [ ] Etappe 5: Daten bearbeiten und Übersicht

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

### [ ] Etappe 6: Einstellungen und Vorlagen-Editor

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

### [ ] Etappe 7: Sammel-PDF über Browser-Druck

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

### [ ] Etappe 8: Auslieferung und Dokumentation

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
- Pipeline erzeugt `Anteilsscheine.html`.
- Eine nicht informatikaffine Testperson schafft den Jahresablauf mit der
  Anleitung ohne Hilfe (Rückmeldungen in Abschnitt 9 festhalten).

---

### [ ] Etappe 9 (optional): C#-Programm angleichen oder ablösen

**Ziel:** Klarheit über die Zukunft des C#-Programms.

**Voraussetzungen:** Etappe 8.

**Aufgaben (nach Rücksprache, eine Variante):**
- **Angleichen:** `Settings.json` und die Platzhalter `${printDate}`,
  `${signer1}`, `${signer2}` im C#-Programm unterstützen.
- **Ablösen:** C#-Programm als "veraltet" kennzeichnen, Readme anpassen,
  ggf. entfernen.

---

## 8. Status

`[ ]` = offen, `[x]` = abgeschlossen. Eine Etappe wird **nur** dann mit
`[x]` markiert, wenn alle Akzeptanzkriterien erfüllt sind (siehe 4.3). Die
Markierung erfolgt **hier und** in der Überschrift der Etappe in Abschnitt 7.

- [x] Etappe 0: Projektgerüst
- [x] Etappe 1: Datenmodell und Berechnung
- [ ] Etappe 2: CSV, ZIP, Validierung, Jahr-Funktionen
- [ ] Etappe 3: Vorlage füllen und Druckdokument
- [ ] Etappe 4: UI-Grundgerüst, Laden, Speichern
- [ ] Etappe 5: Daten bearbeiten und Übersicht
- [ ] Etappe 6: Einstellungen und Vorlagen-Editor
- [ ] Etappe 7: Sammel-PDF über Browser-Druck
- [ ] Etappe 8: Auslieferung und Dokumentation
- [ ] Etappe 9 (optional): C#-Programm angleichen oder ablösen

Nächste Etappe = die erste mit `[ ]`, deren Voraussetzungen alle `[x]` sind.

Abhängigkeiten: 0 -> 1 -> 2 -> 4 -> 5 -> 7 -> 8; 3 benötigt 1;
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
