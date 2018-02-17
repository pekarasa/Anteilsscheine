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
    public class CollectiveCertificate
    {
        private readonly ICollectiveCertificateDocument _document;
        private readonly Adresse _address;
        private readonly Solaranlage _powerPlant;
        private readonly List<Transaktion> _transactions;
        private readonly List<Strombezug> _strombezuege;
        private readonly List<Umwandlungsfaktor> _factor;

        public CollectiveCertificate(ICollectiveCertificateDocument document,
                                    Adresse address,
                                    Solaranlage powerPlant,
                                    List<Transaktion> transactions,
                                    List<Strombezug> strombezuege,
                                    List<Umwandlungsfaktor> factor)
        {
            _document = document;
            _address = address;
            _powerPlant = powerPlant;
            _transactions = transactions;
            _strombezuege = strombezuege;
            _factor = factor;
        }

        public void WritePdf(string path, int year)
        {
            string fileName = $"{year}_{_address.Name}_Sammeanteilsschein.pdf";
            string exportFile = System.IO.Path.Combine(path, fileName);

            string htmlData = FillIn(year, 3, 123, DateTime.Now, "Ich", "Du", 321, 998, _transactions);
            Stream pdfStream = new FileStream(exportFile, FileMode.Create);
            HtmlConverter.ConvertToPdf(htmlData, pdfStream);
        }

        private string FillIn(int year,
                              int personalAnteilsscheine,
                              int personalPowerEarning,
                              DateTime printDate,
                              string signature1,
                              string signature2,
                              int personalRemainingBalance,
                              int anteilsscheine,
                              List<Transaktion> transactions)
        {
            string table = CollectTransactions(transactions, year);

            return _document.documentTemplate.Replace("${Plant}", _powerPlant.Plant)
                            .Replace("${Year}", year.ToString())
                            .Replace("${PowerEarning}", _powerPlant.PowerEarning.ToString())
                            .Replace("${Name}", _address.Name)
                            .Replace("${Street}", _address.Street)
                            .Replace("${City}", _address.City)
                            .Replace("${PersonalAnteilsscheine}", personalAnteilsscheine.ToString())
                            .Replace("${PersonalPowerEarning}", personalPowerEarning.ToString())
                            .Replace("${PrintDate}", printDate.ToString("dd. MMM yyyy"))
                            .Replace("${Signature1}", signature1)
                            .Replace("${Signature2}", signature2)
                            .Replace("${Transactions}", table)
                            .Replace("${PersonalRemainingBalance}", personalRemainingBalance.ToString())
                            .Replace("${Anteilsscheine}", anteilsscheine.ToString());
        }

        private string CollectTransactions(List<Transaktion> transactions, int year)
        {
            StringBuilder sb = new StringBuilder();
            string firstLine = _document.tableHeaderTemplate;
            sb.AppendLine(firstLine);
            string lineTemplate = _document.tableItemTemplate;
            foreach (Transaktion transaktion in transactions.OrderBy(t => t.Date))
            {
                var line = _document.FillTableTemplate(lineTemplate, transaktion.Date, transaktion.Description, transaktion.Amount);
                sb.AppendLine(line);
            }
            string endTemplate = _document.tableFooterTemplate;
            var endLine = _document.FillTableTemplate(endTemplate, new DateTime(year, 12, 31), "Total", transactions.Sum(t => t.Amount));
            sb.AppendLine(endLine);
            return sb.ToString();
        }
    }
}