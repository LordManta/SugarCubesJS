  {
   prg:
     "SC.seq(\n"
   + "  SC.generate(e)\n"
   + "  , SC.await(e)\n"
   + "  , SC.write(\"Hello World !\")\n"
   + "  )\n"
   , expected :
       "\n1 -: Hello World !"
  }
const testContinue = true;
