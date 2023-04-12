using System;
using System.Collections.Generic;
using ShareCertificate.Model;

namespace ShareCertificate
{
    public interface ICertificateDocument
    {
        string FillDocumentTemplate(int year,
                                    int plantPowerEarning,
                                    int totalNumberOfShareCertificate,
                                    string addressName,
                                    string addressStreet,
                                    string addressCity,
                                    int personalNumberOfShareCertificate,
                                    int personalPowerEarning,
                                    int personalRemainingBalance,
                                    List<Transaction> transactions);
    }
}