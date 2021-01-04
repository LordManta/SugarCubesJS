  {
  prg:
      "SC.test(true\n"
    + "  , SC.test(false\n"
    + "      , SC.write('ok 2')"
    + "      , SC.write('ko 2')"
    + "      )"
    + "  , SC.write('ko 1')"
    + ")"
 , expected:
      "\n1 -: ko 2\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
