using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CsvHelper;

namespace Anteilsscheine.Model
{
    public class Context
    {
        public readonly List<Adresse> Addresses;
        public readonly List<Solaranlage> PowerPlants;
        public readonly List<Strombezug> PowerPurchases;
        public readonly List<Transaktion> Transactions;
        public readonly List<Umwandlungsfaktor> ConversionFactors;

        public Context(StreamReader addressReader,
                       StreamReader powerPlantReader,
                       StreamReader powerPurchasesReader,
                       StreamReader transactionsReader,
                       StreamReader conversionFactorsReader)
        {
            using (var csv = new CsvReader(addressReader))
            {
                Addresses = csv.GetRecords<Adresse>().ToList();
            }
            using (var csv = new CsvReader(powerPlantReader))
            {
                PowerPlants = csv.GetRecords<Solaranlage>().ToList();
            }
            using (var csv = new CsvReader(powerPurchasesReader))
            {
                PowerPurchases = csv.GetRecords<Strombezug>().ToList();
            }
            using (var csv = new CsvReader(transactionsReader))
            {
                Transactions = csv.GetRecords<Transaktion>().ToList();
            }
            using (var csv = new CsvReader(conversionFactorsReader))
            {
                ConversionFactors = csv.GetRecords<Umwandlungsfaktor>().ToList();
            }
        }
    }
}