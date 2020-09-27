# ShareCertificate

In order to facilitate the annually recurring work of issuing share certificates, this program has been developed.

[![Build Status](https://dev.azure.com/pekarasa/Anteilsscheine/_apis/build/status/pekarasa.Anteilsscheine?branchName=master)](https://dev.azure.com/pekarasa/Anteilsscheine/_build/latest?definitionId=1&branchName=master)

The program is written with C# dotnet core 2.0.

## How to build the application

```bash
dotnet build
```

## How to start the application

Go to the folder where the two subfolders _Data_ and _Template_ are. Open an shell and start the programm with the follwing command:

```bash
dotnet path_to/ShareCertificate.dll /Year 2019 /CustomerName Test > CustomerTest/Summary_2019.csv
dotnet ShareCertificate/bin/Debug/netcoreapp2.0/ShareCertificate.dll /Year 2019 /CustomerName SolarOltingen > CustomerSolarOltingen/Summary_2019.csv
```

In the csv is an overview of all share certificates per person.

## How to merge all PDFs to a single one

The following command is used to combine all PDFs in one file and delete the generated:

```bash
pdfunite ~/Schreibtisch/*.pdf 2018_SammelanteilsscheinSerienbrief.pdf
rm ~/Schreibtisch/2018_*.pdf
```

## License

ShareCertificate uses the MIT licence, see the LICENSE file.
