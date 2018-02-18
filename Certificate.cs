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
        private readonly ICertificateDocument _document;
        private readonly Adresse _address;
        private readonly Solaranlage _powerPlant;
        private readonly List<Transaktion> _transactions;

        public Certificate(ICertificateDocument document,
                                    Adresse address,
                                    Solaranlage powerPlant,
                                    List<Transaktion> transactions)
        {
            _document = document;
            _address = address;
            _powerPlant = powerPlant;
            _transactions = transactions;
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
            string transactionTable = CollectTransactions(year, transactions);

            return _document.FillDocumentTemplate(
                year,
                printDate,
                _powerPlant.Plant,
                _powerPlant.PowerEarning,
                anteilsscheine,
                signature1,
                signature2,
                _address.Name,
                _address.Street,
                _address.City,
                personalAnteilsscheine,
                personalPowerEarning,
                personalRemainingBalance,
                transactionTable);
        }

        private string CollectTransactions(int year, List<Transaktion> transactions)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine(_document.tableHeaderTemplate);

            foreach (Transaktion transaktion in transactions.OrderBy(t => t.Date))
            {
                var line = _document.FillTableTemplate(_document.tableItemTemplate, transaktion.Date, transaktion.Description, transaktion.Amount);
                sb.AppendLine(line);
            }

            var endLine = _document.FillTableTemplate(_document.tableFooterTemplate, new DateTime(year, 12, 31), "Total", transactions.Sum(t => t.Amount));
            sb.AppendLine(endLine);

            return sb.ToString();
        }
    }
}