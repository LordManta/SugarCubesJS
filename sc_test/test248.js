  {
   prg:
      "SC.test(false\n"
    + "  , SC.test(true\n"
    + "      , SC.write('ok 2')"
    + "      , SC.write('ko 2')"
    + "      )"
    + "  , SC.write('ko 1')"
    + ")"
 , expected:
      "\n1 -: ko 1"
  }
