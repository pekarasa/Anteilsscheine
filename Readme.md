# ShareCertificate

In order to facilitate the annually recurring work of issuing share certificates, this program has been developed.

The program is written with C# dotnet core 2.0.

## How to build the application

```bash
dotnet build
```

## How to start the application

Go to the folder where the two subfolders _Data_ and _Template_ are. Open an shell and start the programm with the follwing command:

```bash
dotnet path_to/ShareCertificate.dll /Year 2018 > 2018_Sammelanteilsscheine.csv
```

In the csv is an overview of all share certificates per person.

## How to merge all PDFs to a single one

The following command is used to combine all PDFs in one file:

```bash
pdfunite ~Schreibtisch/*.pdf 2018_SammelanteilsscheinSerienbrief.pdf
```

## License

ShareCertificate uses the MIT licence, see the LICENSE file.