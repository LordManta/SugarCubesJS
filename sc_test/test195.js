  {
   prg:
     SC.par(
       SC.repeat(4,SC.when(e, SC.write("f"), SC.write("e")))
       , SC.repeat(4, SC.pause(1), SC.generate(e), SC.pause(1), SC.generate(e))
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 10
   , expected :
       "\n1 -: \n2 -: e\n3 -: f\n4 -: \n5 -: e\n6 -: f\n7 -: \n8 -: \n9 -: \n10 -: "
  }
