using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Anteilsscheine.Model;
using iText.Html2pdf;
using iText.Kernel.Pdf;

namespace Anteilsscheine
{
    public class Certificate
    {
        public int NumberOfCertificatesHeld { get; set; }
        public int RemainingBalance { get; set; }
        public int TotalNumberOfCertificates { get; set; }
        public int PersonalPowerEarning
        {
            get { 
                return _powerPlant.PowerEarning / TotalNumberOfCertificates * NumberOfCertificatesHeld; }
        }
        private readonly ICertificateDocument _document;
        private readonly int _year;
        private readonly Adresse _address;
        private readonly Solaranlage _powerPlant;
        private readonly List<Transaktion> _transactions;
        private readonly List<Strombezug> _strombezuege;
        private readonly List<Umwandlungsfaktor> _factor;

        public Certificate(ICertificateDocument document, int year, Adresse address, Solaranlage powerPlant, List<Transaktion> transactions, List<Strombezug> strombezuege, List<Umwandlungsfaktor> factor)
        {
            _document = document;
            _year = year;
            _address = address;
            _powerPlant = powerPlant;
            _transactions = transactions;
            _strombezuege = strombezuege;
            _factor = factor;

            foreach (Strombezug bezug in _strombezuege)
            {
                Transaktion transaktion = new Transaktion();
                transaktion.Date = bezug.Date;
                int y = transaktion.Date.Year;
                try
                {
                    decimal f = _factor.Single(fa => fa.Year == y).Factor;
                    transaktion.Amount = (int)(bezug.PowerPurchase * f);
                    transaktion.Description = $"Jährlicher Strombezug {y}: {bezug.PowerPurchase}.- x {f} =";
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
            return _document.FillDocumentTemplate(year, printDate, _powerPlant.Plant, _powerPlant.PowerEarning, TotalNumberOfCertificates, signer1, signer2, _address.Name, _address.Street, _address.City, NumberOfCertificatesHeld, PersonalPowerEarning, RemainingBalance, _transactions);
        }

        internal string GetFileName(string exportFolder)
        {
            string fileName = $"{_year}_{_address.Name}_Sammeanteilsschein.pdf";
            return System.IO.Path.Combine(exportFolder, fileName);

        }
    }
}