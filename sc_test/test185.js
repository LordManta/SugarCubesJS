  {
   prg:
     SC.par(
       SC.kill(e, SC.pause(0), SC.write("e"))
       , SC.seq(SC.pause(4), SC.generate(e))
       )
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 10
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: "
  }
