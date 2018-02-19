using Anteilsscheine.Model;
using Anteilsscheine;
using FakeItEasy;
using NUnit.Framework;
using System;
using System.Collections.Generic;

namespace Anteilsscheine.UnitTests
{
    [TestFixture]
    public class CertificateTest
    {
        [Test]
        public void WhenConstructorisCalled_ThenObjectIsReturned()
        {
            // var document = A.Fake<ICertificateDocument>();
            // A.CallTo(() => document.FillDocumentTemplate()).Returns(lollipop);
            // Arrange

            // Act
            var sut = new Anteilsscheine.Certificate(null, 2016, null, new Solaranlage(), new List<Transaktion>(), new List<Strombezug>(), null);

            // Assert
            Assert.IsNotNull(sut, "Object must be returned.");
        }

        [Test]
        //public void WhenHundredCertificatesExist_Then10CertificatesResultIn10PercentOfThePlantProduction()
        public void WhenAnEnergyPurchaseContractOf1CertificatePerYearRunsFor10Years_Then10CertificatesAreCountedAllways()
        {
            // Arrange
            int id = 1;
            List<Strombezug> strombezuege = new List<Strombezug>();
            List<Umwandlungsfaktor> factor = new List<Umwandlungsfaktor>();
            DateTime date = new DateTime(2012,12,31);
            for (int i = 0; i < 10; i++)
            {
                strombezuege.Add(new Strombezug{Id=id, Date=date, PowerPurchase=100});
                factor.Add(new Umwandlungsfaktor{Year=date.Year, Factor=1});
                date=date.AddYears(1);
            }

            // Act
            var sut = new Certificate(null, 2016, null, new Solaranlage{Year=2016, PowerEarning=3000}, new List<Transaktion>(), strombezuege, factor);

            // Assert
            Assert.AreEqual(10, sut.NumberOfCertificatesHeld);
        }
    }
}