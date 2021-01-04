  {
   prg:
      "SC.test(true\n"
    + "  , SC.test(true\n"
    + "      , SC.write('ok 2')"
    + "      , SC.write('ko 2')"
    + "      )"
    + "  , SC.write('ko 1')"
    + ")"
 , expected:
      "\n1 -: ok 2"
  }
