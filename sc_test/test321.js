  {
   prg:
     "SC.seq(\n"
   + "  SC.generate(e)\n"
   + "  , SC.await(e)\n"
   + "  , SC.write(\"Hello World !\")\n"
   + "  )\n"
 , expected:
       "\n1 -: Hello World !\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
const testContinue = true;
