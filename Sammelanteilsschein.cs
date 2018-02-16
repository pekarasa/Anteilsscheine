using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Anteilsscheine.Model;
using iText.Html2pdf;
using iText.Kernel.Pdf;

namespace Anteilsscheine
{
    public class Sammelanteilsschein
    {
        private readonly string _template;
        private readonly Adresse _address;
        private readonly Solaranlage _powerPlant;
        private readonly List<Transaktion> _transactions;
        private readonly List<Strombezug> _strombezuege;
        private readonly List<Umwandlungsfaktor> _factor;

        public Sammelanteilsschein(string template,
                                    Adresse address,
                                    Solaranlage powerPlant,
                                    List<Transaktion> transactions,
                                    List<Strombezug> strombezuege,
                                    List<Umwandlungsfaktor> factor)
        {
            _template = template;
            _address = address;
            _powerPlant = powerPlant;
            _transactions = transactions;
            _strombezuege = strombezuege;
            _factor = factor;
        }

        public void WritePdf(string path, int year)
        {
            string fileName = $"{year}_{_address.Name}_Sammeanteilsschein.pdf";
            string exportFile = System.IO.Path.Combine(path, fileName);

            string htmlData = FillIn(year, 3, 123, DateTime.Now, "Ich", "Du", 321, 998, _transactions);
            Stream pdfStream = new FileStream(exportFile, FileMode.Create);
            HtmlConverter.ConvertToPdf(htmlData, pdfStream);
        }

        private string FillIn(int year,
                              int personalAnteilsscheine,
                              int personalPowerEarning,
                              DateTime printDate,
                              string signature1,
                              string signature2,
                              int personalRemainingBalance,
                              int anteilsscheine,
                              List<Transaktion> transactions)
        {
            string table = CollectTransactions(transactions, year);

            return _template.Replace("${Plant}", _powerPlant.Plant)
                            .Replace("${Year}", year.ToString())
                            .Replace("${PowerEarning}", _powerPlant.PowerEarning.ToString())
                            .Replace("${Name}", _address.Name)
                            .Replace("${Street}", _address.Street)
                            .Replace("${City}", _address.City)
                            .Replace("${PersonalAnteilsscheine}", personalAnteilsscheine.ToString())
                            .Replace("${PersonalPowerEarning}", personalPowerEarning.ToString())
                            .Replace("${PrintDate}", printDate.ToString("dd. MMM yyyy"))
                            .Replace("${Signature1}", signature1)
                            .Replace("${Signature2}", signature2)
                            .Replace("${Transactions}", table)
                            .Replace("${PersonalRemainingBalance}", personalRemainingBalance.ToString())
                            .Replace("${Anteilsscheine}", anteilsscheine.ToString());
        }

        private string CollectTransactions(List<Transaktion> transactions, int year)
        {
            StringBuilder sb = new StringBuilder();
            string firstLine = "<table width='575' cellspacing='0' style='page-break-before: always'><col width='108'><col width='367'><col width='76'><tbody><tr valign='top'><td style='border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none'><p align='left'>Datum per</p></td><td style='border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none'><p align='left'>Text</p></td><td style='border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none'><p align='right'>Betrag</p></td></tr>".Replace("'", "\"");
            sb.AppendLine(firstLine);
            string lineTemplate = "<tr valign='top'><td style='border: none'><p align='left'>${Date}</p></td><td style='border: none'><p align='left'>${Description}</p></td><td style='border: none'><p align='right'>${Amount}.-</p></td></tr>".Replace("'", "\"");
            foreach (Transaktion transaktion in transactions.OrderBy(t => t.Date))
            {
                var line = FillTemplate(lineTemplate, transaktion.Date, transaktion.Description, transaktion.Amount);
                sb.AppendLine(line);
            }
            string endTemplate = "<tr valign='top'><td style='border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none'><p align='left'>${Date}</p></td><td style='border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none'><p align='left'>${Description}</p></td><td style='border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none'><p align='right'>${Amount}.-</p></td></tr></tbody></table>".Replace("'", "\"");
            var endLine = FillTemplate(endTemplate, new DateTime(year, 12, 31), "Total", transactions.Sum(t => t.Amount));
            sb.AppendLine(endLine);
            return sb.ToString();
        }

        private static string FillTemplate(string lineTemplate,
                                           DateTime date,
                                           string description,
                                           int amount)
        {
            return lineTemplate.Replace("${Date}", date.ToString("dd.MM.yyyy"))
                               .Replace("${Description}", description)
                               .Replace("${Amount}", amount.ToString());
        }
    }
}