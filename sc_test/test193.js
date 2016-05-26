  {
   prg:
     SC.par(
       SC.repeat(4,SC.when(e, SC.write("f"), SC.write("e")))
       , SC.repeat(4, SC.pause(0), SC.generate(e))
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 10
   , expected :
       "\n1 -: f\n2 -: f\n3 -: f\n4 -: f\n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
