  {
   prg:
       SC.repeat(SC.forever
         , SC.pause(1)
         , SC.control(sens1
             , SC.kill(g
                 , SC.seq(
                     SC.pause(2)
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
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
