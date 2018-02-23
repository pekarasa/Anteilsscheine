using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using ShareCertificate.Model;
using iText.Html2pdf;
using iText.Kernel.Pdf;

namespace ShareCertificate
{
    public class Certificate
    {
        /// <summary>
        /// Number of certificates held by the holder
        /// </summary>
        public int NumberOfCertificatesHeld { get; set; }

        /// <summary>
        /// Number of certificates by committed electricity buying
        /// </summary>
        public int NumberOfCommittedCertificates { get; set; }

        /// <summary>
        /// Remaining rounding amount due to electricity buying
        /// </summary>
        public int RemainingBalance { get; set; }

        /// <summary>
        /// Total number of certificates issued
        /// </summary>
        public int TotalNumberOfCertificates { get; set; }

        /// <summary>
        /// Personal part of the power earning
        /// </summary>

        public int PersonalPowerEarning
        {
            get
            {
                return _powerEarning / TotalNumberOfCertificates * NumberOfCertificatesHeld;
            }
        }

        private readonly ICertificateDocument _document;
        private readonly int _year;
        private readonly string _name, _street, _city;
        private readonly int _powerEarning;
        private readonly List<Transaction> _transactions;
        private readonly List<DynamicShare> _dynamicShares;
        private readonly decimal _factor;

        public Certificate(ICertificateDocument document, int year, Address address, PowerEarning powerEarning, List<Transaction> transactions, List<DynamicShare> dynamicShares, List<ConversionFactor> factor)
        {
            _document = document;
            _year = year;
            _name = address.Name;
            _street = address.Street;
            _city = address.City;
            _powerEarning = powerEarning.Earning;
            _transactions = transactions;
            _dynamicShares = dynamicShares;
            _factor = factor.Single(fa => fa.Year == _year).Factor;

            foreach (DynamicShare bezug in _dynamicShares)
            {
                Transaction transaktion = new Transaction();
                transaktion.Date = bezug.Date;
                int y = transaktion.Date.Year;
                try
                {
                    transaktion.Amount = (int)(bezug.PowerPurchase * _factor);
                    transaktion.Description = $"Jährlicher Strombezug {y}: {bezug.PowerPurchase}.- x {_factor} =";
                    _transactions.Add(transaktion);
                }
                catch (Exception)
                {
                    throw new Exception($"Kein passender Umwandlungsfaktor für das Jahr {y} gefunden.");
                }
            }

            NumberOfCertificatesHeld = _transactions.Sum(t => t.Amount) / 100;
        }

        public string FillTemplateWithData(int year, string signer1, string signer2, DateTime printDate)
        {
            return _document.FillDocumentTemplate(year, printDate, _powerEarning, TotalNumberOfCertificates, signer1, signer2, _name, _street, _city, NumberOfCertificatesHeld, PersonalPowerEarning, RemainingBalance, _transactions);
        }

        internal string GetFileName(string exportFolder)
        {
            string fileName = $"{_year}_{_name}_Sammeanteilsschein.pdf";
            return System.IO.Path.Combine(exportFolder, fileName);

        }
    }
}