  {
   prg:
     "SC.seq(\n"
   + "  SC.pause()\n"
   + "  , SC.generate(e)\n"
   + "  , SC.await(e)\n"
   + "  , SC.write(\"Hello World !\")\n"
   + "  )\n"
   , expected :
       "\n1 -: \n2 -: Hello World !"
  }
const testContinue = true;
