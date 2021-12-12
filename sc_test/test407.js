  {
   prg:
     `SC.par(
        SC.resetOn(f, SC.resetOn(e, SC.pause(5)))
      , SC.seq(SC.pause(4), SC.generate(f))
        )`
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 20
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: " 
 //, persist: true
  }
