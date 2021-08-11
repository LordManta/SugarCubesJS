  {
   prg:
     `SC.par(
        SC.resetOn(e, SC.pause(4))
      , SC.seq(SC.pause(), SC.generate(e))
        )`
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 20
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: "
 //, persist: true
  }


