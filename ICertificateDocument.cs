using System;

namespace Anteilsscheine
{
    public interface ICertificateDocument
    {
        string documentTemplate { get; set; }
        string tableHeaderTemplate { get; set; }
        string tableItemTemplate { get; set; }
        string tableFooterTemplate { get; set; }

        string FillTableTemplate(string template, DateTime date, string description, int amount);
        string FillDocumentTemplate(int year,
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
                                    string table);
    }
}