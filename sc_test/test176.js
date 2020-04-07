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
                             , SC.pause(4)
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
   , expected :
       "\n1 -: start\n2 -: \n3 -: gen await to \n4 -: \n5 -: \n6 -: \n7 -: after go \n8 -: start\n9 -: \n10 -: gen await to "
  }
