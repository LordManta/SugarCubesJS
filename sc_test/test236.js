  {
    prg:
      "SC.par(\n"
    + "  SC.repeatForever(SC.kill(e, SC.seq(SC.await(e), SC.pause(), SC.write('e !')), SC.seq(SC.write(':p '), SC.write('e ?'))))\n"
    + "  , SC.repeatForever(SC.pause(3), SC.generate(e))"
    + ")"
    /*, fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }*/
   , expected :
        "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: :p e ?\n6 -: \n7 -: \n8 -: \n9 -: :p e ?\n10 -: "
  }

