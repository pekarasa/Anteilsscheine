using System;

namespace Anteilsscheine.Model
{
    public class Strombezug
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public int PowerPurchase { get; set; }
    }
}