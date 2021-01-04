  {
   prg:
     "SC.seq(\n"
   + "  SC.pause(2)\n"
   + "  , SC.generate(e)\n"
   + "  , SC.await(e)\n"
   + "  , SC.write(\"Hello World !\")\n"
   + "  )\n"
   , expected :
       "\n1 -: \n2 -: \n3 -: Hello World !"
  }
const testContinue = true;
