using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using ShareCertificate.Model;

namespace ShareCertificate
{
    public class CertificateDocument : ICertificateDocument
    {
        private string DocumentTemplate { get; }
        private string TableHeaderTemplate { get; }
        private string TableItemTemplate { get; }
        private string TableFooterTemplate { get; }

        public CertificateDocument()
        {
            DocumentTemplate = File.ReadAllText("./Template/Document.html");
            TableHeaderTemplate = File.ReadAllText("./Template/TableHeader.html");
            TableItemTemplate = File.ReadAllText("./Template/TableItem.html");
            TableFooterTemplate = File.ReadAllText("./Template/TableFooter.html");
        }

        public string FillDocumentTemplate(int year,
                                           DateTime printDate,
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
                                           List<Transaction> transactions)
        {
            string transactionTable = CollectTransactions(year, transactions.Where(t=>t.Date.Year<=year).ToList());

            return DocumentTemplate
                .Replace("${year}", year.ToString())
                .Replace("${plantPowerEarning}", plantPowerEarning.ToString())
                .Replace("${addressName}", addressName)
                .Replace("${addressStreet}", addressStreet)
                .Replace("${addressCity}", addressCity)
                .Replace("${personalNumberOfShareCertificate}", personalNumberOfShareCertificate.ToString())
                .Replace("${personalPowerEarning}", personalPowerEarning.ToString())
                .Replace("${printDate}", printDate.ToString("dd. MMMM yyyy"))
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

        private string CollectTransactions(int year, List<Transaction> transactions)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine(TableHeaderTemplate);

            foreach (Transaction transaktion in transactions)
            {
                var line = FillTableTemplate(TableItemTemplate, transaktion.Date, transaktion.Description, transaktion.Amount);
                sb.AppendLine(line);
            }

            var endLine = FillTableTemplate(TableFooterTemplate, new DateTime(year, 12, 31), "Total", transactions.Sum(t => t.Amount));
            sb.AppendLine(endLine);

            return sb.ToString();
        }

    }
}