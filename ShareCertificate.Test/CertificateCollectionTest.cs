using FluentAssertions;
using Moq;
using NUnit.Framework;

namespace ShareCertificate.Test
{
    /// <summary>
    /// UnitTests to test class <see cref="CertificateCollection"/>
    /// </summary>
    [TestFixture]
    public class CertificateCollectionTest
    {
        [Test]
        public void ConstructorTest()
        {
            // Arrange

            // Act
            var sut = new CertificateCollection();

            // Assert
            sut.Should().NotBeNull("Object must be returned.");
            sut.TotalNumberOfCertificates.Should().Be(0);
            sut.TotalNumberOfCommittedCertificates.Should().Be(0);
            sut.TotalRemainingBalance.Should().Be(0);
        }

        [Test]
        public void Add_WhenCalled_ThenAllTotalsAreCalculated()
        {
            // arrange
            var sut = new CertificateCollection();
            ICertificate certificate1 = MockCertificate(numberOfCertificatesHeld: 2, numberOfCommittedCertificates: 5, remainingBalance: 3);
            ICertificate certificate2 = MockCertificate(numberOfCertificatesHeld: 1, numberOfCommittedCertificates: 5, remainingBalance: 1);

            // act
            sut.Add(certificate1);
            sut.Add(certificate2);

            // assert
            sut.TotalNumberOfCertificates.Should().Be(3);
            certificate1.TotalNumberOfCertificates.Should().Be(3);
            certificate2.TotalNumberOfCertificates.Should().Be(3);

            sut.TotalNumberOfCommittedCertificates.Should().Be(10);
            certificate1.TotalNumberOfCommittedCertificates.Should().Be(10);
            certificate2.TotalNumberOfCommittedCertificates.Should().Be(10);

            sut.TotalRemainingBalance.Should().Be(4);
        }

        private ICertificate MockCertificate(int numberOfCertificatesHeld, int numberOfCommittedCertificates, int remainingBalance)
        {
            ICertificate certificate = Mock.Of<ICertificate>();
            Mock.Get(certificate).Setup(c => c.NumberOfCertificatesHeld).Returns(numberOfCertificatesHeld);
            Mock.Get(certificate).Setup(c => c.NumberOfCommittedCertificates).Returns(numberOfCommittedCertificates);
            Mock.Get(certificate).Setup(c => c.RemainingBalance).Returns(remainingBalance);
            return certificate;
        }
    }
}
