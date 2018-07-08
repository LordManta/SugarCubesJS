{
prg:
      "SC.test(false\n"
    + "  , SC.test(true\n"
    + "      , SC.write('ok 2')"
    + "      , SC.write('ko 2')"
    + "      )"
    + "  , SC.write('ko 1')"
    + ")"
    /*, fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }*/
   , expected :
        "\n1 -: ko 1\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }

