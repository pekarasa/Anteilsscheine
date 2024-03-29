using System;
using System.Collections.Generic;
using System.Text;
using FluentAssertions;
using NUnit.Framework;
using ShareCertificate.Model;

namespace ShareCertificate.Test
{
    [TestFixture]
    public class CertificateTest
    {
        [Test]
        public void ConstructorTest()
        {
            // Arrange

            // Act
            var sut = new Certificate(null, 2016, new Address(), new PowerEarning(), new List<Transaction>(), new List<DynamicShare>(), new List<ConversionFactor>{new ConversionFactor{Year=2016, Factor=1}});

            // Assert
            Assert.IsNotNull(sut, "Object must be returned.");
        }

        [Test]
        public void WhenACustomerHas10DynamicÂnd15TransactionalShares_ThenTheNumberOfCommittedCertificatesMustBe25()
        {
            // arrange
            // 20 dynamic certificates: 2 dynamic certificate annually between 2010 - 2019
            List<DynamicShare> strombezuege = new List<DynamicShare>();
            List<ConversionFactor> factor = new List<ConversionFactor>();
            for (int year = 2010; year <= 2019; year++)
            {
                DateTime date = new DateTime(year, 12, 31);
                strombezuege.Add(new DynamicShare { AddressId = 1, Date = date, PowerPurchase = 200 });
                factor.Add(new ConversionFactor { Year = year, Factor = 1 });
            }

            // 15 certificates in 2012: Single transaction of 15 certificates in 2012
            List<Transaction> transactions =
                new List<Transaction> { new Transaction { Date = new DateTime(2012, 2, 15), Amount = 1500 } };

            ICertificateDocument document = new DocumentMock();
            Address address = new Address();
            PowerEarning powerPlant = new PowerEarning();

            // act
            Certificate sut = new Certificate(document, 2018, address, powerPlant, transactions, strombezuege, factor);

            // assert
            sut.NumberOfCommittedCertificates.Should().Be(35, "20 dynamic certificates plus 15 certificates from a transaction gives a total of 35 certificates");
        }

        [Test]
        public void WhenAPartyOwnsAQuarterOfTheCertificates_ThenItIsEntitledToAQuarterOfThePowerEarnings()
        {
            // arrange
            // 25 certificates in 2012: Single transaction of 15 certificates in 2012
            List<Transaction> transactions =
                new List<Transaction> { new Transaction { Date = new DateTime(2012, 2, 15), Amount = 2500 } };

            // Plant Earning is 100
            PowerEarning powerPlant = new PowerEarning { Earning = 1000 };

            List<DynamicShare> strombezuege = new List<DynamicShare>();
            List<ConversionFactor> factor = new List<ConversionFactor>();
            ICertificateDocument document = new DocumentMock();
            Address address = new Address();

            // act
            Certificate sut = new Certificate(document, 2018, address, powerPlant, transactions, strombezuege, factor)
            { 
                TotalNumberOfCommittedCertificates = 100 
            };

            // assert
            sut.PersonalPowerEarning.Should().Be(250, "25 out of 100 is a quarter and a quarter of 1000 kWh gives 250 kWh");
        }

        [Test]
        public void WhenDynamicCertificatesExistForTheFuture_ThenTheseAreNotShownOnTheDocument()
        {
            const int Year = 2015;
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
            List<Transaction> fixShare = new List<Transaction>
            {
                // Subscription of 15 certificates in 2012
                new Transaction {Date = new DateTime(2012, 2, 15), Amount = 1500},
                // Subscription of 25 certificates in 2016
                new Transaction {Date = new DateTime(2016, 2, 15), Amount = 2500}
            };
            Certificate sut = new Certificate(document, Year, address, powerPlant, fixShare, dynymicShare, factor)
            {
                TotalNumberOfCommittedCertificates = 1
            };

            // Act
            // Calculation date 2015
            string html = sut.FillTemplateWithData(Year);

            // Assert
            html.Should().ContainAll(new List<string> { "2010", "2011", "2012", "2013", "2014", "2015" });
            html.Should().NotContainAny(new List<string> { "2016", "2017", "2018", "2019" });
            sut.NumberOfCertificatesHeld.Should().Be(21, "dynymicShare: 6 + fixShare: 15 => 21");
        }

        private class DocumentMock : ICertificateDocument
        {
            string ICertificateDocument.FillDocumentTemplate(int year, int plantPowerEarning, int totalNumberOfShareCertificate, string addressName, string addressStreet, string addressCity, int personalNumberOfShareCertificate, int personalPowerEarning, int personalRemainingBalance, List<Transaction> transactions)
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