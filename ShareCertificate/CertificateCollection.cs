using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace ShareCertificate
{
    /// <summary>
    /// Collection of all <see cref="ICertificates"/>s
    /// </summary>
    /// <remarks>
    /// Is used to obtain data concerning all certificates.
    /// </remarks>
    public class CertificateCollection: IEnumerable
    {
        private readonly List<ICertificate> certificates = new List<ICertificate>();

        /// <summary>
        /// Adds a new <see cref="ICertificate"/> to the end of the <see cref="CertificateCollection"/>.
        /// </summary>
        /// <remarks>
        /// With each new added certificate, the fields for 
        /// TotalNumberOfCertificates, TotalNumberOfCommittedCertificates, and RemainingBalance are recalculated.
        /// </remarks>
        public void Add(ICertificate certificate)
        {
            certificates.Add(certificate);
            Summarize();
        }

        /// <summary>
        /// The fields for TotalNumberOfCertificates, TotalNumberOfCommittedCertificates, and RemainingBalanceare recalculated and set on each certificate
        /// </summary>
        private void Summarize()
        {
            TotalNumberOfCertificates = certificates.Sum(c => c.NumberOfCertificatesHeld);
            TotalNumberOfCommittedCertificates = certificates.Sum(c => c.NumberOfCommittedCertificates);
            TotalRemainingBalance = certificates.Sum(c => c.RemainingBalance);
            certificates.ForEach(c => c.TotalNumberOfCertificates = TotalNumberOfCertificates);
            certificates.ForEach(c => c.TotalNumberOfCommittedCertificates = TotalNumberOfCommittedCertificates);
        }

        public IEnumerator GetEnumerator()
        {
            return certificates.GetEnumerator();
        }

        /// <summary>
        /// Returns the number of certificates already purchased by the certificate owners
        /// </summary>
        public int TotalNumberOfCertificates { get; private set; }

        /// <summary>
        /// Returns the number of Certificates which the individual Certificate Holders have committed to purchase over the agreed term
        /// </summary>
        public int TotalNumberOfCommittedCertificates { get; private set; }

        /// <summary>
        /// Returns the sum of all remaining balances
        /// </summary>
        public int TotalRemainingBalance { get; private set; }
    }
}
