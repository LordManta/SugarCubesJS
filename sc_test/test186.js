  {
   prg:
     SC.par(
       SC.when(e, SC.write("f"), SC.write("e"))
       , SC.seq(SC.pause(4), SC.generate(e))
       )
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 10
 , expected:
     "\n1 -: \n2 -: e\n3 -: \n4 -: \n5 -: "
  }
