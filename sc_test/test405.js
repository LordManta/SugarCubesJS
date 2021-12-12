  {
   prg:
     `SC.par(
        SC.resetOn(f, SC.resetOn(e, SC.pause(5)))
      , SC.seq(SC.pause(5), SC.generate(e))
        )`
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 20
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: "
 //, persist: true
  }

