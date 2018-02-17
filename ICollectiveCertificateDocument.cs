using System;

namespace Anteilsscheine
{
    public interface ICollectiveCertificateDocument
    {
        string documentTemplate { get; set; }
        string tableHeaderTemplate { get; set; }
        string tableItemTemplate { get; set; }
        string tableFooterTemplate { get; set; }

        string FillTableTemplate(string template, DateTime date, string description, int amount);
    }
}