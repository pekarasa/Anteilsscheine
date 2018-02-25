using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using ShareCertificate.Model;
using AtleX;
using AtleX.CommandLineArguments;
using iText.Html2pdf;

namespace ShareCertificate
{
    class Program
    {
        private class MyArgumentsClass : Arguments
        {
            [Required]
            [Display(Description = "Year for which the collective share certificates are to be created.")]
            public int Year { get; set; }

            // Not required
            [Display(Description = "You can use the name filter to restrict for whom collective share certificates should be created. For example, if you enter 'mann', only documents are created for addresses that contain this part in the name.")]
            public string NameFilter { get; set; }

            [Display(Description = "If set to 'false', then only Certificates with NumberOfCommittedCertificates != 0 will be created. ")]
            public bool All { get; set; }
        }

        static void Main(string[] args)
        {
            try
            {
                MyArgumentsClass cliArguments;
                if (!CommandLineArguments.TryParse<MyArgumentsClass>(args, out cliArguments))
                {
                    // Something wrong, exit or display help?
                    CommandLineArguments.DisplayHelp(cliArguments);
                    return;
                }

                Context db;
                using (StreamReader addressReader = new StreamReader("./Daten/Address.csv"))
                using (StreamReader powerPlantReader = new StreamReader("./Daten/PowerEarning.csv"))
                using (StreamReader powerPurchasesReader = new StreamReader("./Daten/DynamicShare.csv"))
                using (StreamReader transactionsReader = new StreamReader("./Daten/Transaction.csv"))
                using (StreamReader conversionFactorsReader = new StreamReader("./Daten/ConversionFactor.csv"))
                {
                    db = new Context(addressReader, powerPlantReader, powerPurchasesReader, transactionsReader, conversionFactorsReader);
                }

                int year = cliArguments.Year;
                if (year == 0)
                {
                    year = db.PowerEarnings.Max(pp => pp.Year);
                }
                Console.Out.WriteLine($"Year: {year}");
                Console.Out.WriteLine("Id, Name, Street, City, NumberOfCertificatesHeld, RemainingBalance, NumberOfCommittedCertificates");


                List<Certificate> certificates = new List<Certificate>();
                foreach (Address address in db.Addresses)
                {
                    int adressId = address.Id;

                    PowerEarning powerPlant = db.PowerEarnings.Single(pp => pp.Year == year);
                    List<Transaction> transactions = db.Transactions.Where(t => t.AddressId == adressId).ToList();
                    List<DynamicShare> strombezuege = db.DynamicShares.Where(pp => pp.AddressId == adressId).ToList();
                    List<ConversionFactor> factor = db.ConversionFactors;

                    ICertificateDocument document = new CertificateDocument();
                    Certificate certificate = new Certificate(document, year, address, powerPlant, transactions, strombezuege, factor);

                    certificates.Add(certificate);
                    Console.Out.WriteLine($"{address.Id}, {address.Name}, {address.Street}, {address.City}, {certificate.NumberOfCertificatesHeld}, {certificate.RemainingBalance}, {certificate.NumberOfCommittedCertificates}");
                }

                int totalNumberOfCertificates = certificates.Sum(c => c.NumberOfCertificatesHeld);
                int totalNumberOfCommittedCertificates = certificates.Sum(c => c.NumberOfCommittedCertificates);
                int remainingBalance = certificates.Sum(c => c.RemainingBalance);
                certificates.ForEach(c => c.TotalNumberOfCertificates = totalNumberOfCertificates);
                certificates.ForEach(c => c.TotalNumberOfComittedCertificates = totalNumberOfCommittedCertificates);
                Console.Out.WriteLine($"999, Total, , , {totalNumberOfCertificates}, {remainingBalance}, {totalNumberOfCommittedCertificates}");

                foreach (Certificate certificate in certificates)
                {
                    if (cliArguments.NameFilter != null && !certificate.Name.Contains(cliArguments.NameFilter))
                    {
                        continue;
                    }

                    if (!cliArguments.All && certificate.NumberOfCommittedCertificates == 0)
                    {
                        continue;
                    }

                    var exportFolder = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    string htmlData = certificate.FillTemplateWithData(year, "Kuster Micha", "Portmann Peter", DateTime.Now);
                    string fileName = certificate.GetFileName(exportFolder);
                    Stream pdfStream = new FileStream(fileName, FileMode.Create);
                    HtmlConverter.ConvertToPdf(htmlData, pdfStream);
                }
            }
            catch (Exception e)
            {

                Console.Error.WriteLine(e.Message);
                if (e.InnerException != null)
                {
                    Console.Error.WriteLine(e.InnerException.Message);
                }
            }
        }
    }
}
