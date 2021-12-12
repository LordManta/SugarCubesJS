  {
   prg:
     `SC.par(
        SC.kill(f, SC.control(g, SC.resetOn(e, SC.pause(5))))
      //, SC.seq(SC.pause(4), SC.generate(e))
      , SC.repeat(6, SC.generate(g), SC.pause())
        )`
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 20
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: " 
 //, persist: true
  }
