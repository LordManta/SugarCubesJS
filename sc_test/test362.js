  {
   prg:
     SC.par(
       SC.repeat(4,SC.when(e, SC.write("f"), SC.write("e")))
       , SC.repeat(4, SC.pause(1), SC.generate(e))
       )
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 10
 , expected:
     "\n1 -: \n2 -: e\n3 -: \n4 -: e\n5 -: \n6 -: e\n7 -: \n8 -: e\n9 -: \n10 -: "
 , persist: true
  }
