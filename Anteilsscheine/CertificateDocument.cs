using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Anteilsscheine.Model;

namespace Anteilsscheine
{
    public class CertificateDocument : ICertificateDocument
    {
        private string documentTemplate { get; set; }
        private string tableHeaderTemplate { get; set; }
        private string tableItemTemplate { get; set; }
        private string tableFooterTemplate { get; set; }

        public CertificateDocument()
        {
            documentTemplate = File.ReadAllText("./Template/Document.html");
            tableHeaderTemplate = File.ReadAllText("./Template/TableHeader.html");
            tableItemTemplate = File.ReadAllText("./Template/TableItem.html");
            tableFooterTemplate = File.ReadAllText("./Template/TableFooter.html");
        }

        public string FillDocumentTemplate(int year,
                                           DateTime printDate,
                                           string plantName,
                                           int plantPowerEarning,
                                           int totalNumberOfShareCertificate,
                                           string signer1,
                                           string signer2,
                                           string addressName,
                                           string addressStreet,
                                           string addressCity,
                                           int personalNumberOfShareCertificate,
                                           int personalPowerEarning,
                                           int personalRemainingBalance,
                                           List<Transaktion> transactions)
        {
            string transactionTable = CollectTransactions(year, transactions.Where(t=>t.Date.Year<=year).ToList());

            return documentTemplate
                .Replace("${plantName}", plantName)
                .Replace("${year}", year.ToString())
                .Replace("${plantPowerEarning}", plantPowerEarning.ToString())
                .Replace("${addressName}", addressName)
                .Replace("${addressStreet}", addressStreet)
                .Replace("${addressCity}", addressCity)
                .Replace("${personalNumberOfShareCertificate}", personalNumberOfShareCertificate.ToString())
                .Replace("${personalPowerEarning}", personalPowerEarning.ToString())
                .Replace("${printDate}", printDate.ToString("dd. MMM yyyy"))
                .Replace("${signer1}", signer1)
                .Replace("${signer2}", signer2)
                .Replace("${transactionTable}", transactionTable)
                .Replace("${personalRemainingBalance}", personalRemainingBalance.ToString())
                .Replace("${totalNumberOfShareCertificate}", totalNumberOfShareCertificate.ToString());
        }
        private string FillTableTemplate(string template, DateTime date, string description, int amount)
        {
            return template.Replace("${Date}", date.ToString("dd.MM.yyyy"))
                           .Replace("${Description}", description)
                           .Replace("${Amount}", amount.ToString("##,#"));
        }

        private string CollectTransactions(int year, List<Transaktion> transactions)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine(tableHeaderTemplate);

            foreach (Transaktion transaktion in transactions.OrderBy(t => t.Date))
            {
                var line = FillTableTemplate(tableItemTemplate, transaktion.Date, transaktion.Description, transaktion.Amount);
                sb.AppendLine(line);
            }

            var endLine = FillTableTemplate(tableFooterTemplate, new DateTime(year, 12, 31), "Total", transactions.Sum(t => t.Amount));
            sb.AppendLine(endLine);

            return sb.ToString();
        }

    }
}