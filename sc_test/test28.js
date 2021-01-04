  {
   prg:
     "SC.repeat(1\n"
   + "  , SC.repeat(1\n"
   + "      , SC.repeat(3\n"
   + "          , SC.write(\"Hello World !\")\n"
   + "          )\n"
   + "      )\n"
   + "  )\n"
   , expected :
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !"
  }
const testContinue = true;
