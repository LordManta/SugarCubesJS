  {
   prg:
     "SC.repeat(2\n"
   + "  , SC.repeat(2\n"
   + "      , SC.repeat(0\n"
   + "          , SC.write(\"Hello World !\")\n"
   + "          )\n"
   + "      )\n"
   + "  )\n"
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: "
  }
const testContinue = true;
