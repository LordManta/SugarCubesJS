  {
    prg:
      "SC.action(fun, SC.forever)"
    , fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }
   , expected :
        "\n1 -: hello\n2 -: hello\n3 -: hello\n4 -: hello\n5 -: hello\n6 -: hello\n7 -: hello\n8 -: hello\n9 -: hello\n10 -: hello"
  }

