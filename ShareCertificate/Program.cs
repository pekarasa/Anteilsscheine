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
            //[Required]
            [Display(Description = "Year for which the collective share certificates are to be created.")]
            public int Year { get; set; }

            // Not required
            [Display(Description = "You can use the name filter to restrict for whom collective share certificates should be created. For example, if you enter 'mann', only documents are created for addresses that contain this part in the name.")]
            public string NameFilter { get; set; }
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

                IEnumerable<Address> addresses;
                if (cliArguments.NameFilter != null)
                {
                    addresses = db.Addresses.Where(a => a.Name.Contains(cliArguments.NameFilter));
                }
                else
                {
                    addresses = db.Addresses;
                }

                List<Certificate> certificates = new List<Certificate>();
                foreach (Address address in addresses)
                {
                    Console.Out.WriteLine($"{address.Id}, {address.Name}, {address.Street}, {address.City}");
                    int adressId = address.Id;

                    PowerEarning powerPlant = db.PowerEarnings.Single(pp => pp.Year == year);
                    List<Transaction> transactions = db.Transactions.Where(t => t.AddressId == adressId).ToList();
                    List<DynamicShare> strombezuege = db.DynamicShares.Where(pp => pp.AddressId == adressId).ToList();
                    List<ConversionFactor> factor = db.ConversionFactors;

                    ICertificateDocument document = new CertificateDocument();
                    Certificate certificate = new Certificate(document, year, address, powerPlant, transactions, strombezuege, factor);

                    certificates.Add(certificate);
                }

                int totalNumberOfCertificates = certificates.Sum(c => c.NumberOfCertificatesHeld);
                int remainingBalance = certificates.Sum(c => c.RemainingBalance);
                certificates.ForEach(c => c.TotalNumberOfCertificates = totalNumberOfCertificates);

                foreach (Certificate certificate in certificates)
                {
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
