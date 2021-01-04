  {
      prg:
        "SC.seq(\n"
      + "  SC.pause(2)\n"
      + "  , SC.write(\"Hello World !\")\n"
      + "  )"
    , expected :
          "\n1 -: \n2 -: \n3 -: Hello World !\n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
    , persist: true
    };
const testContinue = true;

