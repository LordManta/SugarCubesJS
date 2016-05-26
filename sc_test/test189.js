  {
   prg:
     SC.par(
       SC.when(e, SC.write("f"), SC.write("e"))
       , SC.seq(SC.pause(1), SC.generate(e))
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 10
   , expected :
       "\n1 -: \n2 -: e\n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
