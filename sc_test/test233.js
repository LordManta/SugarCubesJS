  {
    prg:
      "SC.par(\n"
    + "  SC.repeatForever(SC.kill(e, SC.seq(SC.await(e), SC.pause(), SC.write('e !')), SC.write(':p')))\n"
    + "  , SC.repeatForever(SC.pause(5), SC.generate(e))"
    + ")"
    /*, fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }*/
   , expected :
        "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: :p\n8 -: \n9 -: \n10 -: "
  }

