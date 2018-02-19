using System;

namespace Anteilsscheine.Model
{
    public class Transaktion{
        public int Id {get;set;}
        public DateTime Date {get;set;}
        public string Description {get;set;}
        public int Amount{get;set;}
    }
}