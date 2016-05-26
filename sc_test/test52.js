  {
   prg:
     "SC.seq(\n"
   + "  SC.pause(4)\n"
   + "  , SC.generate(e)\n"
   + "  , SC.await(e)\n"
   + "  , SC.write(\"Hello World !\")\n"
   + "  )\n"
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: Hello World !\n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
const testContinue = true;
