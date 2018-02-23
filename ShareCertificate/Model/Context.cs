using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CsvHelper;

namespace ShareCertificate.Model
{
    public class Context
    {
        public readonly List<Address> Addresses;
        public readonly List<PowerEarning> PowerEarnings;
        public readonly List<DynamicShare> DynamicShares;
        public readonly List<Transaction> Transactions;
        public readonly List<ConversionFactor> ConversionFactors;

        public Context(StreamReader addressReader,
                       StreamReader powerEarningReader,
                       StreamReader dynamicShareReader,
                       StreamReader transactionsReader,
                       StreamReader conversionFactorsReader)
        {
            Addresses = GetRecords<Address>(addressReader);
            PowerEarnings = GetRecords<PowerEarning>(powerEarningReader);
            DynamicShares = GetRecords<DynamicShare>(dynamicShareReader);
            Transactions = GetRecords<Transaction>(transactionsReader);
            ConversionFactors = GetRecords<ConversionFactor>(conversionFactorsReader);
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