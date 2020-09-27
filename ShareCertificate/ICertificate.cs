namespace ShareCertificate
{
    public interface ICertificate
    {
        /// <summary>
        /// Number of certificates held by the holder
        /// </summary>
        public int NumberOfCertificatesHeld { get; }

        /// <summary>
        /// Number of certificates by committed electricity buying
        /// </summary>
        public int NumberOfCommittedCertificates { get; }

        /// <summary>
        /// Remaining rounding amount due to electricity buying
        /// </summary>
        int RemainingBalance { get; }

        /// <summary>
        /// Total number of certificates issued
        /// </summary>
        int TotalNumberOfCertificates { get; set; }

        /// <summary>
        /// Total number of committed certificates issued
        /// </summary>
        int TotalNumberOfCommittedCertificates { get; set; }
    }
}