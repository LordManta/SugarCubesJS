  {
    prg:
      "SC.par(\n"
    + "  SC.repeatForever(SC.await(e), SC.write('event &e is generated !'))\n"
    + "  , SC.repeatForever(SC.pause(5), SC.generate(e))"
    + ")"
    /*, fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }*/
   , expected :
        "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: event &e is generated !\n7 -: \n8 -: \n9 -: \n10 -: "
  }

