  {
   prg:
     SC.par(
       SC.kill(e, SC.pauseForever(), SC.write("e"))
       , SC.seq(SC.pause(4), SC.generate(e))
       )
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 10
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: e\n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
