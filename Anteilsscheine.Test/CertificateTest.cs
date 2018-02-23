using Anteilsscheine.Model;
using Anteilsscheine;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;

namespace Anteilsscheine.UnitTests
{
    [TestFixture]
    public class CertificateTest
    {
        [Test]
        public void WhenConstructorisCalled_ThenObjectIsReturned()
        {
            // Arrange

            // Act
            var sut = new Anteilsscheine.Certificate(null, 2016, null, new Solaranlage(), new List<Transaktion>(), new List<Strombezug>(), null);

            // Assert
            Assert.IsNotNull(sut, "Object must be returned.");
        }

        [Test]
        public void ShareOfEarningsIsDerivedFromCommittedAndEmittedCertificates()
        {
            const int YEAR = 2015;
            ICertificateDocument document = new DocumentMock();
            Adresse address = new Adresse();
            // Arrange
            // 1 dynamic certificate annually between 2010 - 2019 => Total 10
            List<Strombezug> strombezuege = new List<Strombezug>();
            List<Umwandlungsfaktor> factor = new List<Umwandlungsfaktor>();
            for (int year = 2010; year <= 2019; year++)
            {
                DateTime date = new DateTime(year, 12, 31);
                strombezuege.Add(new Strombezug { Id = 1, Date = date, PowerPurchase = 100 });
                factor.Add(new Umwandlungsfaktor { Year = year, Factor = 1 });
            }
            // Single subscription of 15 certificates in 2012
            List<Transaktion> transactions = new List<Transaktion>();
            transactions.Add(new Transaktion { Date = new DateTime(2012, 2, 15), Amount = 1500 });
            // Plant Earning is 100
            Solaranlage powerPlant = new Solaranlage { PowerEarning = 100 };
            // Total comitted certifiactes = 100
            Certificate sut = new Certificate(document, YEAR, address, powerPlant, transactions, strombezuege, factor);
            sut.TotalNumberOfCertificates = 100;

            // Act
            // Calculation date 2015 has no influence on the result
            sut.FillTemplateWithData(YEAR, null, null, DateTime.Now);

            // Assert
            // Personal Power Earning must be 25
            sut.PersonalPowerEarning.Should().Be(25);
        }

        [Test]
        public void OnlyPastTransactionsCanBeSeenInTheHistoryOfTheCertificate()
        {
            const int YEAR = 2015;
            ICertificateDocument document = new DocumentMock();
            Adresse address = new Adresse();
            Solaranlage powerPlant = new Solaranlage();
            // Arrange
            // 1 dynamic certificate annually between 2010 - 2019 => Total 10
            List<Strombezug> strombezuege = new List<Strombezug>();
            List<Umwandlungsfaktor> factor = new List<Umwandlungsfaktor>();
            for (int year = 2010; year <= 2019; year++)
            {
                DateTime date = new DateTime(year, 12, 31);
                strombezuege.Add(new Strombezug { Id = 1, Date = date, PowerPurchase = 100 });
                factor.Add(new Umwandlungsfaktor { Year = year, Factor = 1 });
            }
            // Subscription of 15 certificates in 2012
            List<Transaktion> transactions = new List<Transaktion>();
            transactions.Add(new Transaktion { Date = new DateTime(2012, 2, 15), Amount = 1500 });
            // Subscription of 25 certificates in 2016
            transactions.Add(new Transaktion { Date = new DateTime(2016, 2, 15), Amount = 2500 });
            Certificate sut = new Certificate(document, YEAR, address, powerPlant, transactions, strombezuege, factor);
            sut.TotalNumberOfCertificates = 1;

            // Act
            // Calculation date 2015
            string html = sut.FillTemplateWithData(YEAR, null, null, DateTime.Now);

            // Assert
            html.Should().ContainAll(new List<string> { "2010", "2011", "2012", "2013", "2014", "2015" });
            html.Should().NotContainAny(new List<string> { "2016", "2017", "2018", "2019" });
            sut.NumberOfCertificatesHeld.Should().Be(25);
        }
        [Test]
        public void WhenAnEnergyPurchaseContractOf1CertificatePerYearRunsFor10Years_Then10CertificatesAreCountedRegardlessOfYear()
        {
            // Arrange
            int id = 1;
            List<Strombezug> strombezuege = new List<Strombezug>();
            List<Umwandlungsfaktor> factor = new List<Umwandlungsfaktor>();
            DateTime date = new DateTime(2012, 12, 31);
            for (int i = 0; i < 10; i++)
            {
                strombezuege.Add(new Strombezug { Id = id, Date = date, PowerPurchase = 100 });
                factor.Add(new Umwandlungsfaktor { Year = date.Year, Factor = 1 });
                date = date.AddYears(1);
            }

            // Act;
            const int Year = 2016;
            var sut = new Certificate(null, Year, null, new Solaranlage { Year = Year, PowerEarning = 0 }, new List<Transaktion>(), strombezuege, factor);

            // Assert
            Assert.AreEqual(10, sut.NumberOfCertificatesHeld);
        }

        [Test]
        public void WhenAnEnergyPurchaseContractOf1CertificatePerYearRunsFor10Years_ThenOnly5CertificatesAreListedAfter5Years()
        {
            // Arrange
            int id = 1;
            List<Strombezug> strombezuege = new List<Strombezug>();
            List<Umwandlungsfaktor> factor = new List<Umwandlungsfaktor>();
            DateTime date = new DateTime(2012, 12, 31);
            for (int i = 0; i < 10; i++)
            {
                strombezuege.Add(new Strombezug { Id = id, Date = date, PowerPurchase = 100 });
                factor.Add(new Umwandlungsfaktor { Year = date.Year, Factor = 1 });
                date = date.AddYears(1);
            }
            const int Year = 2016;
            var sut = new Certificate(null, Year, null, new Solaranlage { Year = Year, PowerEarning = 0 }, new List<Transaktion>(), strombezuege, factor);

            // Act
            string htmlData = sut.FillTemplateWithData(Year, null, null, DateTime.Now);
            // Assert
            Assert.AreEqual(10, sut.NumberOfCertificatesHeld);
        }

        private class DocumentMock : ICertificateDocument
        {
            string ICertificateDocument.FillDocumentTemplate(int year, DateTime printDate, string plantName, int plantPowerEarning, int totalNumberOfShareCertificate, string signer1, string signer2, string addressName, string addressStreet, string addressCity, int personalNumberOfShareCertificate, int personalPowerEarning, int personalRemainingBalance, List<Transaktion> transactions)
            {
                StringBuilder sb = new StringBuilder();
                foreach (Transaktion trans in transactions)
                {
                    sb.AppendLine(string.Format("{0:dd.MM.yyyy}, {1}, {2}", trans.Date, trans.Description, trans.Amount));
                }
                Console.Out.Write(sb.ToString());
                return sb.ToString();
            }
        }
    }
}