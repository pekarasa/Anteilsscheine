using System;
using System.Collections.Generic;
using Anteilsscheine.Model;

namespace Anteilsscheine
{
    public interface ICertificateDocument
    {
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
                                    List<Transaktion> transactions);
    }
}