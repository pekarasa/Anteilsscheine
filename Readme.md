# Anteilsscheine (Share Certificates)

A static single-file web application to facilitate the annually recurring work of issuing share certificates and generating annual series letters as PDF.

[![Build Status](https://dev.azure.com/pekarasa/Anteilsscheine/_apis/build/status/pekarasa.Anteilsscheine?branchName=master)](https://dev.azure.com/pekarasa/Anteilsscheine/_build/latest?definitionId=1&branchName=master)

The application runs entirely in the browser; no data leaves the computer.

## Using the Application

- **Web app:** [pekarasa.github.io/Anteilsscheine](https://pekarasa.github.io/Anteilsscheine/)
- **User guide (German):** [web/docs/Benutzeranleitung.md](web/docs/Benutzeranleitung.md)
- **Example data:** [web/docs/Beispiel-Anteilsscheine.zip](web/docs/Beispiel-Anteilsscheine.zip)
- **Architecture and development plan (German):** [web/docs/PLAN.md](web/docs/PLAN.md)

Alternatively, the built HTML file `web/dist/index.html` (or `Anteilsscheine.html` from the build artifacts) can be opened locally in any modern browser (`file://`) without installation or a web server.

## Test Data

The folder `CustomerTest/` contains fictional test data (year 2019) used by the automated test suite.

## Development

The web application is located in the `web/` folder and is built with TypeScript and Vite (`vite-plugin-singlefile`).

### Prerequisites

- Node.js 22.12 or newer
- npm

### Commands

```bash
cd web
npm ci              # install dependencies
npm run dev         # start local development server
npm run typecheck   # run TypeScript type check
npm test            # run unit tests (Vitest)
npm run build       # build self-contained single-file HTML into dist/index.html
```

## Continuous Integration

The Azure pipeline runs automated tests and builds `Anteilsscheine.html` as the pipeline artifact `Anteilsscheine_Web`.
A GitHub Actions workflow automatically deploys `master` to GitHub Pages.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
