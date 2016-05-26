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
   , async: function(){ m.generateEvent(sens1); }
   , maxI: 15
   , expected :
       "\n1 -: start\n2 -: \n3 -: gen await to \n4 -: \n5 -: go after \n6 -: start\n7 -: \n8 -: to gen await \n9 -: \n10 -: go after \n11 -: start\n12 -: \n13 -: to gen await \n14 -: \n15 -: go after "
  }
