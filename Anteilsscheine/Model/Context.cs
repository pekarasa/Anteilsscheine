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
            Addresses = GetRecords<Adresse>(addressReader);
            PowerPlants = GetRecords<Solaranlage>(powerPlantReader);
            PowerPurchases = GetRecords<Strombezug>(powerPurchasesReader);
            Transactions = GetRecords<Transaktion>(transactionsReader);
            ConversionFactors = GetRecords<Umwandlungsfaktor>(conversionFactorsReader);
        }

        private List<T> GetRecords<T>(StreamReader reader)
        {
            using (var csv = new CsvReader(reader))
            {
                return csv.GetRecords<T>().ToList();
            }
        }
    }
}