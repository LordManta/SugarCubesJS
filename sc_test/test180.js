  {
   prg:
       SC.repeat(SC.forever
         , SC.write("start")
         , SC.pause(1)
         , SC.control(sens1
             , SC.kill(g
                 , SC.seq(
                     SC.pause(1)
                     , SC.par(
                         SC.seq(
                           SC.write("gen ")
                           , SC.generate(f)
                           , SC.write("await ")
                           , SC.await(e)
                           , SC.write("after ")
                           )
                         , SC.seq(
                             SC.write("to ")
                             , SC.pause(2)
                             , SC.write("go ")
                             , SC.generate(e)
                             )
                         )
                     )
                 )
             )
         )
   , init: function(){}
   , async: function(){ sens1.newValue(); }
   , maxI: 20
   , expected :
       "\n1 -: start\n2 -: \n3 -: gen await to \n4 -: \n5 -: after go \n6 -: start\n7 -: \n8 -: gen await to \n9 -: \n10 -: after go \n11 -: start\n12 -: \n13 -: gen await to \n14 -: \n15 -: after go \n16 -: start\n17 -: \n18 -: gen await to \n19 -: \n20 -: after go "
  }
