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

        public Certificate(ICertificateDocument document)
        {
            _document = document;
        }

        internal void WritePdf(string exportFolder, int year, string signer1, string signer2, DateTime printDate, Adresse address, Solaranlage powerPlant, List<Transaktion> transactions, List<Strombezug> strombezuege, List<Umwandlungsfaktor> factor)
        {
            string fileName = $"{year}_{address.Name}_Sammeanteilsschein.pdf";
            string exportFile = System.IO.Path.Combine(exportFolder, fileName);

            string transactionTable = CollectTransactions(year, transactions);

            int totalNumberOfShareCertificate = 0;
            int personalPowerEarning = 0;
            int personalRemainingBalance = 0;
            int personalNumberOfShareCertificate = 0;

            string htmlData = _document.FillDocumentTemplate(year, printDate, powerPlant.Plant, powerPlant.PowerEarning, totalNumberOfShareCertificate, signer1, signer2, address.Name, address.Street, address.City, personalNumberOfShareCertificate, personalPowerEarning, personalRemainingBalance, transactionTable);

            Stream pdfStream = new FileStream(exportFile, FileMode.Create);
            HtmlConverter.ConvertToPdf(htmlData, pdfStream);
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