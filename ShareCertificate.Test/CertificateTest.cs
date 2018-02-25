using ShareCertificate.Model;
using ShareCertificate;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;

namespace ShareCertificate.UnitTests
{
    [TestFixture]
    public class CertificateTest
    {
        [Test]
        public void ConstructorTest()
        {
            // Arrange

            // Act
            var sut = new ShareCertificate.Certificate(null, 2016, new Address(), new PowerEarning(), new List<Transaction>(), new List<DynamicShare>(), new List<ConversionFactor>{new ConversionFactor{Year=2016, Factor=1}});

            // Assert
            Assert.IsNotNull(sut, "Object must be returned.");
        }

        [Test]
        public void ShareOfEarningsIsDerivedFromCommittedAndEmittedCertificates()
        {
            const int YEAR = 2015;
            ICertificateDocument document = new DocumentMock();
            Address address = new Address();
            // Arrange
            // 1 dynamic certificate annually between 2010 - 2019 => Total 10
            List<DynamicShare> strombezuege = new List<DynamicShare>();
            List<ConversionFactor> factor = new List<ConversionFactor>();
            for (int year = 2010; year <= 2019; year++)
            {
                DateTime date = new DateTime(year, 12, 31);
                strombezuege.Add(new DynamicShare { AddressId = 1, Date = date, PowerPurchase = 100 });
                factor.Add(new ConversionFactor { Year = year, Factor = 1 });
            }
            // Single subscription of 15 certificates in 2012
            List<Transaction> transactions = new List<Transaction>();
            transactions.Add(new Transaction { Date = new DateTime(2012, 2, 15), Amount = 1500 });
            // Plant Earning is 100
            PowerEarning powerPlant = new PowerEarning { Earning = 1000 };
            // Total comitted certifiactes = 100
            Certificate sut = new Certificate(document, YEAR, address, powerPlant, transactions, strombezuege, factor);
            sut.TotalNumberOfComittedCertificates = 100;

            // Act
            // Calculation date 2015 has no influence on the result
            sut.FillTemplateWithData(YEAR, null, null, DateTime.Now);

            // Assert
            sut.NumberOfCommittedCertificates.Should().Be(25);
            // Personal Power Earning must be 250
            sut.PersonalPowerEarning.Should().Be(250);
        }

        [Test]
        public void OnlyPastTransactionsCanBeSeenInTheHistoryOfTheCertificate()
        {
            const int YEAR = 2015;
            ICertificateDocument document = new DocumentMock();
            Address address = new Address();
            PowerEarning powerPlant = new PowerEarning();
            // Arrange
            // 1 dynamic certificate annually between 2010 - 2019
            List<DynamicShare> dynymicShare = new List<DynamicShare>();
            List<ConversionFactor> factor = new List<ConversionFactor>();
            for (int year = 2010; year <= 2019; year++)
            {
                DateTime date = new DateTime(year, 12, 31);
                dynymicShare.Add(new DynamicShare { AddressId = 1, Date = date, PowerPurchase = 100 });
                factor.Add(new ConversionFactor { Year = year, Factor = 1 });
            }
            // Subscription of 15 certificates in 2012
            List<Transaction> fixShare = new List<Transaction>();
            fixShare.Add(new Transaction { Date = new DateTime(2012, 2, 15), Amount = 1500 });
            // Subscription of 25 certificates in 2016
            fixShare.Add(new Transaction { Date = new DateTime(2016, 2, 15), Amount = 2500 });
            Certificate sut = new Certificate(document, YEAR, address, powerPlant, fixShare, dynymicShare, factor);
            sut.TotalNumberOfComittedCertificates = 1;

            // Act
            // Calculation date 2015
            string html = sut.FillTemplateWithData(YEAR, null, null, DateTime.Now);

            // Assert
            html.Should().ContainAll(new List<string> { "2010", "2011", "2012", "2013", "2014", "2015" });
            html.Should().NotContainAny(new List<string> { "2016", "2017", "2018", "2019" });
            sut.NumberOfCertificatesHeld.Should().Be(21, "dynymicShare: 6 + fixShare: 15 => 21");
        }

        private class DocumentMock : ICertificateDocument
        {
            string ICertificateDocument.FillDocumentTemplate(int year, DateTime printDate, int plantPowerEarning, int totalNumberOfShareCertificate, string signer1, string signer2, string addressName, string addressStreet, string addressCity, int personalNumberOfShareCertificate, int personalPowerEarning, int personalRemainingBalance, List<Transaction> transactions)
            {
                StringBuilder sb = new StringBuilder();
                foreach (Transaction trans in transactions)
                {
                    sb.AppendLine(string.Format("{0:dd.MM.yyyy}, {1}, {2}", trans.Date, trans.Description, trans.Amount));
                }
                Console.Out.Write(sb.ToString());
                return sb.ToString();
            }
        }
    }
}