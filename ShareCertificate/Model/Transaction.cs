using System;

namespace ShareCertificate.Model
{
    public class Transaction{
        public int AddressId {get;set;}
        public DateTime Date {get;set;}
        public string Description {get;set;}
        public int Amount{get;set;}
    }
}