  {
   prg:
     SC.par(
       SC.repeat(2,SC.when(e, SC.write("f"), SC.write("e")))
       , SC.repeat(2, SC.pause(0), SC.generate(e))
       )
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 10
 , expected:
     "\n1 -: f\n2 -: f"
  }
