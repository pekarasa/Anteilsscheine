using System;
using System.IO;

namespace Anteilsscheine
{
    public class CertificateDocument : ICertificateDocument
    {
        public string documentTemplate { get; set; }
        public string tableHeaderTemplate { get; set; }
        public string tableItemTemplate { get; set; }
        public string tableFooterTemplate { get; set; }

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
                                           string transactionTable)
        {
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
        public string FillTableTemplate(string template, DateTime date, string description, int amount)
        {
            return template.Replace("${Date}", date.ToString("dd.MM.yyyy"))
                           .Replace("${Description}", description)
                           .Replace("${Amount}", amount.ToString());
        }
    }
}