# ShareCertificate

In order to facilitate the annually recurring work of issuing share certificates, this program has been developed.

[![Build Status](https://dev.azure.com/pekarasa/Anteilsscheine/_apis/build/status/pekarasa.Anteilsscheine?branchName=master)](https://dev.azure.com/pekarasa/Anteilsscheine/_build/latest?definitionId=1&branchName=master)

The program is written with C# .NET 6.0.

## How to build the application

```bash
cd Anteilsscheine
dotnet build
cd ShareCertificate
dotnet publish -r linux-x64 -p:PublishSingleFile=true --self-contained true
```

## How to start the application

Go to the folder where the subfolders _Customer*_ is. Open an shell and start the programm with the follwing command:

```bash
cd Anteilsscheine
publish/linux-x64/ShareCertificate --Year 2019 --CustomerName Test > CustomerTest/Summary_2019.csv
```

In the csv is an overview of all share certificates per person.

The generated PDFs are saved in the subfolder CustomerTest/2019/Generated/.

## How to merge all PDFs to a single one

The following command is used to combine all PDFs in one file and delete the generated:

```bash
pdfunite CustomerTest/2019/Generated/*.pdf SammelanteilsscheinSerienbrief_2019.pdf
rm CustomerTest/2019/Generated/2019_*.pdf
```

## Web application

The `web/` folder contains a static web version of the tool. It runs entirely
in the browser and builds into a single HTML file. No data leaves the computer.

- Use the application: [pekarasa.github.io/Anteilsscheine](https://pekarasa.github.io/Anteilsscheine/)
- User guide (German, for users): [web/docs/Benutzeranleitung.md](web/docs/Benutzeranleitung.md)
- Example data to try it out: [web/docs/Beispiel-Anteilsscheine.zip](web/docs/Beispiel-Anteilsscheine.zip)
- Plan and status of the development: [web/docs/PLAN.md](web/docs/PLAN.md)

Requirements: Node.js 22.12 or newer and npm.

```bash
cd web
npm ci              # install dependencies (once, or after changes to package-lock.json)
npm run dev         # start the development server
npm run typecheck   # TypeScript check
npm test            # run the unit tests
npm run build       # build dist/index.html (one self-contained file)
```

The built file `web/dist/index.html` can be opened by double-click in a browser.
The Azure pipeline runs the same tests and build and publishes the file as the
artifact `Anteilsscheine_Web`.

## License

ShareCertificate uses the MIT licence, see the LICENSE file.
