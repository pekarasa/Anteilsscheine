using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using Anteilsscheine.Model;
using AtleX;
using AtleX.CommandLineArguments;

namespace Anteilsscheine
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
            MyArgumentsClass cliArguments;
            if (!CommandLineArguments.TryParse<MyArgumentsClass>(args, out cliArguments))
            {
                // Something wrong, exit or display help?
                CommandLineArguments.DisplayHelp(cliArguments);
                return;
            }

            Context db;
            using (StreamReader addressReader = new StreamReader("./Daten/Adresse.csv"))
            using (StreamReader powerPlantReader = new StreamReader("./Daten/Solaranlage.csv"))
            using (StreamReader powerPurchasesReader = new StreamReader("./Daten/Strombezug.csv"))
            using (StreamReader transactionsReader = new StreamReader("./Daten/Transaktion.csv"))
            using (StreamReader conversionFactorsReader = new StreamReader("./Daten/Umwandlungsfaktor.csv"))
            {
                db = new Context(addressReader, powerPlantReader, powerPurchasesReader, transactionsReader, conversionFactorsReader);
            }

            int year = cliArguments.Year;
            if (year == 0)
            {
                year = db.PowerPlants.Max(pp => pp.Year);
            }

            IEnumerable<Adresse> addresses;
            if (cliArguments.NameFilter != null)
            {
                addresses = db.Addresses.Where(a => a.Name.Contains(cliArguments.NameFilter));
            }
            else
            {
                addresses = db.Addresses;
            }

            foreach (Adresse address in addresses)
            {
                Console.Out.WriteLine($"{address.Id}, {address.Name}, {address.Street}, {address.City}");
                int id = address.Id;
                Solaranlage powerPlant = db.PowerPlants.Single(pp => pp.Year == year);
                List<Transaktion> transactions = db.Transactions.Where(t => t.Id == id).ToList();
                List<Strombezug> strombezuege = db.PowerPurchases.Where(pp => pp.Id == id).ToList();
                List<Umwandlungsfaktor> factor = db.ConversionFactors;

                ICertificateDocument document = new CertificateDocument();
                Certificate certificate = new Certificate(document);

                var exportFolder = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                certificate.WritePdf(exportFolder, year, "Kuster Micha", "Portmann Peter", DateTime.Now, address, powerPlant, transactions, strombezuege, factor);
            }
        }
    }
}
