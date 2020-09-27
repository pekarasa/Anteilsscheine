using System;
using System.Collections.Generic;
using System.Linq;
using ShareCertificate.Model;

namespace ShareCertificate
{
    public class Certificate
    {
        /// <summary>
        /// Number of certificates held by the holder
        /// </summary>
        public int NumberOfCertificatesHeld { get; private set; }

        /// <summary>
        /// Number of certificates by committed electricity buying
        /// </summary>
        public int NumberOfCommittedCertificates { get; private set; }

        /// <summary>
        /// Remaining rounding amount due to electricity buying
        /// </summary>
        public int RemainingBalance { get; private set; }

        /// <summary>
        /// Total number of certificates issued
        /// </summary>
        public int TotalNumberOfCertificates { get; set; }

        /// <summary>
        /// Total number of committed certificates issued
        /// </summary>
        public int TotalNumberOfComittedCertificates { get; set; }

        /// <summary>
        /// Personal part of the power earning
        /// </summary>
        public int PersonalPowerEarning => _powerEarning / TotalNumberOfComittedCertificates * NumberOfCommittedCertificates;

        private readonly ICertificateDocument _document;
        private readonly int _year;
        public readonly string Name;
        private readonly string _street, _city;
        private readonly int _powerEarning;
        private readonly List<Transaction> _allTransUpToYear;
        private readonly List<DynamicShare> _dynamicShares;
        private readonly List<ConversionFactor> _factor;

        public Certificate(ICertificateDocument document, int year, Address address, PowerEarning powerEarning, List<Transaction> transactions, List<DynamicShare> dynamicShares, List<ConversionFactor> factor)
        {
            _document = document;
            _year = year;
            Name = address.Name;
            _street = address.Street;
            _city = address.City;
            _powerEarning = powerEarning.Earning;
            _dynamicShares = dynamicShares;
            _factor = factor;

            List<Transaction> fixTransactions = transactions;
            List<Transaction> dynamicTransactions = new List<Transaction>();
            foreach (DynamicShare bezug in _dynamicShares)
            {
                Transaction transaktion = new Transaction {Date = bezug.Date};
                int y = transaktion.Date.Year;
                try
                {
                    decimal f =_factor.Single(fa => fa.Year == y).Factor;
                    transaktion.Amount = (int)(bezug.PowerPurchase * f);
                    transaktion.Description = $"Jährlicher Strombezug {y}: {bezug.PowerPurchase}.- x {f} =";
                    dynamicTransactions.Add(transaktion);
                }
                catch (Exception)
                {
                    throw new Exception($"Kein passender Umwandlungsfaktor für das Jahr {y} gefunden.");
                }
            }

            var fixTransactionsUpToYear = fixTransactions.Where(t => t.Date.Year <= _year).ToList();
            NumberOfCommittedCertificates = (fixTransactionsUpToYear.Sum(t => t.Amount)
                                           + dynamicTransactions.Sum(t => t.Amount)) / 100;

            var dynamicTransUpToYear = dynamicTransactions.Where(t => t.Date.Year <= _year).ToList();
            var amountHeld = (fixTransactionsUpToYear.Sum(t => t.Amount)
                            + dynamicTransUpToYear.Sum(t => t.Amount));
            NumberOfCertificatesHeld = amountHeld / 100;
            RemainingBalance = amountHeld - NumberOfCertificatesHeld * 100;

            _allTransUpToYear = new List<Transaction>();
            _allTransUpToYear.AddRange(fixTransactionsUpToYear);
            _allTransUpToYear.AddRange(dynamicTransUpToYear);
            _allTransUpToYear = _allTransUpToYear.OrderBy(t => t.Date).ToList();
        }

        public string FillTemplateWithData(int year, string signer1, string signer2, DateTime printDate)
        {
            return _document.FillDocumentTemplate(year, printDate, _powerEarning, TotalNumberOfCertificates, signer1, signer2, Name, _street, _city, NumberOfCertificatesHeld, PersonalPowerEarning, RemainingBalance, _allTransUpToYear);
        }

        internal string GetFileName(string exportFolder)
        {
            string name = Name.Replace(" ","").Replace("-","");
            string fileName = $"{_year}_{name}_Sammelanteilsschein.pdf";
            return System.IO.Path.Combine(exportFolder, fileName);

        }
    }
}