  {
   prg:
     "SC.repeat(1\n"
   + "  , SC.repeat(3\n"
   + "      , SC.repeat(2\n"
   + "          , SC.write(\"Hello World !\")\n"
   + "          )\n"
   + "      )\n"
   + "  )\n"
   , expected :
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !\n4 -: Hello World !\n5 -: Hello World !\n6 -: Hello World !\n7 -: \n8 -: \n9 -: \n10 -: "
  }
const testContinue = true;
