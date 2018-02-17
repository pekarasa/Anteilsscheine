using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
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
            [Display(Description = "This text will be displayed in the help, when requested")]
            public bool Argument1 { get; set; }

            // Not required
            [Display(Description = "This text will be displayed in the help, when requested")]
            public string Name { get; set; }
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

            if (cliArguments.Argument1)
            {

            }

            Adresse address = new Adresse()
            {
                Id = 1,
                Name = "Karin Oetterli + Peter Portmann",
                Street = "Mattenweg 186",
                City = "4494 Oltingen"
            };
            Solaranlage powerPlant = new Solaranlage()
            {
                Year = 2017,
                Plant = "Fohrenhof",
                PowerEarning = 1234,
                Anteilsscheine = 4321
            };
            List<Transaktion> transactions = new List<Transaktion>()
            {
                new Transaktion()
                {
                    Id=1,
                    Date= new DateTime(2011, 12,28),
                    Description = "Kauf Anteilsscheine",
                    Amount = 6000
                },
                new Transaktion()
                {
                    Id=1,
                    Date= new DateTime(2012, 12,28),
                    Description = "Verkauf Anteilsscheine",
                    Amount = -1000
                }
            };
            List<Strombezug> strombezuege = new List<Strombezug>()
            {
                new Strombezug()
                {
                    Id = 1,
                    Date = new DateTime(2012, 12, 31),
                    PowerPurchase = 600
                },
                new Strombezug()
                {
                    Id = 1,
                    Date = new DateTime(2013, 12, 31),
                    PowerPurchase = 601
                }
            };
            List<Umwandlungsfaktor> factor = new List<Umwandlungsfaktor>()
            {
                new Umwandlungsfaktor()
                {
                    Year=2012,
                    Factor=0.8M
                },
                new Umwandlungsfaktor()
                {
                    Year=2013,
                    Factor=0.9M
                }
            };

            ICollectiveCertificateDocument document = new CollectiveCertificateDocument();
            CollectiveCertificate CollectiveCertificate = new CollectiveCertificate(document, address, powerPlant, transactions, strombezuege, factor);
            var exportFolder = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            CollectiveCertificate.WritePdf(exportFolder, 2017);
        }
    }
}
