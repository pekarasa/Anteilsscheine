using System;
using System.Collections.Generic;
using ShareCertificate.Model;

namespace ShareCertificate
{
    public interface ICertificateDocument
    {
        string FillDocumentTemplate(int year,
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
                                    List<Transaction> transactions);
    }
}