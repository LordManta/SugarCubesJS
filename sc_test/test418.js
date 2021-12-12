  {
   prg:
     `SC.par(
        SC.kill(f, SC.control(g, SC.resetOn(e, SC.pause(4))))
      , SC.seq(SC.pause(2), SC.generate(e))
      , SC.repeat(6, SC.generate(g), SC.pause())
        )`
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 20
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: " 
 //, persist: true
  }
