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
using CsvHelper.Configuration.Attributes;

namespace ShareCertificate
{
    class Program
    {
        private class MyArgumentsClass : Arguments
        {
            [Required]
            [Display(Description = "Year for which the collective share certificates are issued.")]
            public int Year { get; set; }

            [Required]
            [Display(Description = "Customer name for whom the collective share certificates are issued.")]
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

                string dataPath = $"./Customer{cliArguments.CustomerName}/{year}";

                using (StreamReader addressReader = new StreamReader($"{dataPath}/Address.csv"))
                using (StreamReader powerPlantReader = new StreamReader($"{dataPath}/PowerEarning.csv"))
                using (StreamReader powerPurchasesReader = new StreamReader($"{dataPath}/DynamicShare.csv"))
                using (StreamReader transactionsReader = new StreamReader($"{dataPath}/Transaction.csv"))
                using (StreamReader conversionFactorsReader = new StreamReader($"{dataPath}/ConversionFactor.csv"))
                {
                    db = new Context(addressReader, powerPlantReader, powerPurchasesReader, transactionsReader,
                        conversionFactorsReader);
                }

                Console.Out.WriteLine($"Year: {year}");
                Console.Out.WriteLine(
                    "Id, Name, Street, City, NumberOfCertificatesHeld, RemainingBalance, NumberOfCommittedCertificates");

                CertificateCollection certificates = new CertificateCollection();
                foreach (Address address in db.Addresses)
                {
                    int adressId = address.Id;

                    PowerEarning powerPlant = db.PowerEarnings.Single(pp => pp.Year == year);
                    List<Transaction> transactions = db.Transactions.Where(t => t.AddressId == adressId).ToList();
                    List<DynamicShare> strombezuege = db.DynamicShares.Where(pp => pp.AddressId == adressId).ToList();
                    List<ConversionFactor> factor = db.ConversionFactors;

                    ICertificateDocument document = new CertificateDocument($"{dataPath}/Template");
                    Certificate certificate = new Certificate(document, year, address, powerPlant, transactions,
                        strombezuege, factor);

                    certificates.Add(certificate);
                    Console.Out.WriteLine(
                        $"{address.Id}, {address.Name}, {address.Street}, {address.City}, {certificate.NumberOfCertificatesHeld}, {certificate.RemainingBalance}, {certificate.NumberOfCommittedCertificates}");
                }

                int totalNumberOfCertificates = certificates.TotalNumberOfCertificates;
                int totalNumberOfCommittedCertificates = certificates.TotalNumberOfCommittedCertificates;
                int remainingBalance = certificates.TotalRemainingBalance;
                Console.Out.WriteLine(
                    $"999, Total, , , {totalNumberOfCertificates}, {remainingBalance}, {totalNumberOfCommittedCertificates}");

                string exportFolder = $"{dataPath}/Generated";
                if (!Directory.Exists(exportFolder))
                {
                    Directory.CreateDirectory(exportFolder);
                }

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

                    string htmlData = certificate.FillTemplateWithData(year);
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
            finally
            {
                Console.ReadLine();
            }
        }
    }
}