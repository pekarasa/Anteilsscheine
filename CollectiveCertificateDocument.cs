using System;
using System.IO;

namespace Anteilsscheine
{
    public class CollectiveCertificateDocument : ICollectiveCertificateDocument
    {
        public string documentTemplate { get; set; }
        public string tableHeaderTemplate { get; set; }
        public string tableItemTemplate { get; set; }
        public string tableFooterTemplate { get; set; }

        public CollectiveCertificateDocument()
        {
            documentTemplate = File.ReadAllText("./Template/Document.html");
            tableHeaderTemplate = File.ReadAllText("./Template/TableHeader.html");
            tableItemTemplate = File.ReadAllText("./Template/TableItem.html");
            tableFooterTemplate = File.ReadAllText("./Template/TableFooter.html");
        }

        public string FillTableTemplate(string template, DateTime date, string description, int amount)
        {
            return template.Replace("${Date}", date.ToString("dd.MM.yyyy"))
                           .Replace("${Description}", description)
                           .Replace("${Amount}", amount.ToString());
        }
    }
}