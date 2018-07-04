  {
    prg:
      "SC.par(\n"
    + "  SC.repeatForever(SC.kill(e, SC.seq(SC.await(e), SC.pause(), SC.write('e !')), SC.seq(SC.write(':p '), SC.write('e ?'), SC.pause())))\n"
    + "  , SC.repeatForever(SC.pause(0), SC.generate(e))"
    + ")"
    /*, fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }*/
   , expected :
        "\n1 -: \n2 -: :p e ?\n3 -: \n4 -: \n5 -: :p e ?\n6 -: \n7 -: \n8 -: :p e ?\n9 -: \n10 -: "
  }

