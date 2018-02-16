using System;
using System.ComponentModel.DataAnnotations;
using AtleX;
using AtleX.CommandLineArguments;

namespace Anteilsscheine
{
    class Program
    {
        private class MyArgumentsClass : Arguments
        {
            [Required]
            [Display(Description = "This text will be displayed in the help, when requested")]
            public bool Argument1 { get; set; }

            // Not required
            [Display(Description = "This text will be displayed in the help, when requested")]
            public string Name { get; set; }
        }

        static void Main(string[] args)
        {
            MyArgumentsClass cliArguments;
            if (!CommandLineArguments.TryParse<MyArgumentsClass>(args, out cliArguments))
            {
                // Something wrong, exit or display help?
                CommandLineArguments.DisplayHelp(cliArguments);
                return;
            }

            if (cliArguments.Argument1)
            {

            }
        }
    }
}
