  {
    prg:
      "SC.par(\n"
    + "  SC.kill(e\n"
    + "    , SC.par(\n"
    + "        SC.seq(\n"
    + "          SC.kill(f\n"
    + "            , SC.seq(SC.await(e), SC.pause(), SC.write('e !'))\n"
    + "            , SC.seq(SC.write(':p '), SC.write('e ?'), SC.pause())\n"
    + "            )\n"
    + "          , SC.generate(e)\n"
    + "          )\n"
    + "        )\n"
    + "    )\n"
    + "  , SC.repeatForever(SC.pause(10), SC.generate(e))"
    + ")"
    /*, fun : function(){
        writeInConsole("hello");
        }
     , init: function(){
	window.fun = this.fun;
        }*/
   , expected :
        "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }

