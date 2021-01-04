  {
   prg:
     "SC.repeat(0\n"
   + "  , SC.repeat(2\n"
   + "      , SC.repeat(2\n"
   + "          , SC.write(\"Hello World !\")\n"
   + "          )\n"
   + "      )\n"
   + "  )\n"
   , expected :
       "\n1 -: "
  }
const testContinue = true;
