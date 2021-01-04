  {
      prg:
        "SC.seq(\n"
      + "  SC.pause(3)\n"
      + "  , SC.write(\"Hello World !\")\n"
      + "  )\n"
    , expected :
          "\n1 -: \n2 -: \n3 -: \n4 -: Hello World !\n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
    , persist: true
     };
const testContinue = true;
