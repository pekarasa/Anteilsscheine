using Anteilsscheine.Model;
using FakeItEasy;
using NUnit.Framework;
using System;
using System.Collections.Generic;

namespace Anteilsscheine.UnitTests.Certificate
{
    [TestFixture]
    public class CertificateTest
    {
        private class Doc : ICertificateDocument
        {
            public string documentTemplate { get; set; }
            public string tableHeaderTemplate { get; set; }
            public string tableItemTemplate { get; set; }
            public string tableFooterTemplate { get; set; }

            public string FillDocumentTemplate(int year, DateTime printDate, string plantName, int plantPowerEarning, int totalNumberOfShareCertificate, string signer1, string signer2, string addressName, string addressStreet, string addressCity, int personalNumberOfShareCertificate, int personalPowerEarning, int personalRemainingBalance, string table)
            {
                throw new NotImplementedException();
            }

            public string FillTableTemplate(string template, DateTime date, string description, int amount)
            {
                throw new NotImplementedException();
            }
        }

        [Test]
        public void WhenConstructorisCalled_ThenObjectIsReturned()
        {
            // var document = A.Fake<ICertificateDocument>();
            // A.CallTo(() => document.FillDocumentTemplate()).Returns(lollipop);

            ICertificateDocument document = null;
            int year = 2016;
            Adresse address = null;
            Solaranlage powerPlant = new Solaranlage();
            List<Transaktion> transactions = new List<Transaktion>();
            List<Strombezug> strombezuege = new List<Strombezug>();
            List<Umwandlungsfaktor> factor = null;
            var cert = new Anteilsscheine.Certificate(document, year, address, powerPlant, transactions, strombezuege, factor);

            Assert.IsNotNull(cert, "Object must be returned.");
        }
    }
}