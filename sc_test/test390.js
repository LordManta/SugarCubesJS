  {
   prg:
     `SC.kill(f
     , SC.kill(e
       , SC.seq(SC.repeat(1, SC.write("-")), SC.write("+"), SC.generate(e), SC.pause(0))
       , SC.write("killed")
         )
       )`
 , init: function(){
           }
 , async: function(){
            }
 , maxI: 20
 , expected:
     "\n1 -: -+"
     //"\n1 -: -+\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
 //, persist: true
  }
