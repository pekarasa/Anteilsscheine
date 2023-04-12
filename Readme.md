# ShareCertificate

In order to facilitate the annually recurring work of issuing share certificates, this program has been developed.

[![Build Status](https://dev.azure.com/pekarasa/Anteilsscheine/_apis/build/status/pekarasa.Anteilsscheine?branchName=master)](https://dev.azure.com/pekarasa/Anteilsscheine/_build/latest?definitionId=1&branchName=master)

The program is written with C# .NET 6.0.

## How to build the application

```bash
dotnet build
```

## How to start the application

Go to the folder where the subfolders _Customer*_ is. Open an shell and start the programm with the follwing command:

```bash
dotnet ShareCertificate/bin/Debug/netcoreapp3.1\ShareCertificate.dll /Year 2019 /CustomerName Test > CustomerTest/Summary_2019.csv
```

In the csv is an overview of all share certificates per person.

The generated PDFs are saved in the subfolder CustomerTest/2019/Generated/.

## How to merge all PDFs to a single one

The following command is used to combine all PDFs in one file and delete the generated:

```bash
pdfunite CustomerTest/2019/Generated/*.pdf SammelanteilsscheinSerienbrief_2019.pdf
rm CustomerTest/2019/Generated/2019_*.pdf
```

## License

ShareCertificate uses the MIT licence, see the LICENSE file.
