using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using ShareCertificate.Model;
using AtleX.CommandLineArguments;
using iText.Html2pdf;
using System.Threading;
using System.Globalization;

namespace ShareCertificate
{
    class Program
    {
        private class MyArgumentsClass : Arguments
        {
            [Required]
            [Display(Description = "Year for which the collective share certificates are created.")]
            public int Year { get; set; }

            [Required]
            [Display(Description = "Customer name for whom the collective share certificates are created.")]
            public string CustomerName { get; set; }

            // Not required
            [Display(Description = "You can use the name filter to restrict for whom collective share certificates should be created. For example, if you enter 'mann', only documents are created for addresses that contain this part in the name.")]
            public string NameFilter { get; set; }

            [Display(Description = "If set to 'false' (default), then only Certificates with NumberOfCommittedCertificates != 0 will be created. ")]
            public bool All { get; set; }
        }

        static void Main(string[] args)
        {
            try
            {
                if (!CommandLineArguments.TryParse<MyArgumentsClass>(args, out var cliArguments))
                {
                    // Something wrong, exit or display help?
                    CommandLineArguments.DisplayHelp(cliArguments);
                    Console.Error.WriteLine("Error in the command line arguments");
                    return;
                }

                Thread.CurrentThread.CurrentCulture = new CultureInfo("de-CH");

                int year = cliArguments.Year;
                
                Context db;
                using (StreamReader addressReader = new StreamReader($"./Data{cliArguments.CustomerName}/{year}/Address.csv"))
                using (StreamReader powerPlantReader = new StreamReader($"./Data{cliArguments.CustomerName}/{year}/PowerEarning.csv"))
                using (StreamReader powerPurchasesReader = new StreamReader($"./Data{cliArguments.CustomerName}/{year}/DynamicShare.csv"))
                using (StreamReader transactionsReader = new StreamReader($"./Data{cliArguments.CustomerName}/{year}/Transaction.csv"))
                using (StreamReader conversionFactorsReader = new StreamReader($"./Data{cliArguments.CustomerName}/{year}/ConversionFactor.csv"))
                {
                    db = new Context(addressReader, powerPlantReader, powerPurchasesReader, transactionsReader, conversionFactorsReader);
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
                    string htmlData = certificate.FillTemplateWithData(year, "Micha Kuster", "Peter Portmann", new DateTime(2020, 5, 5));
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
