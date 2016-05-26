  {
   prg:
       SC.repeat(SC.forever
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
                         , SC.pause(6)
                         , SC.write("go ")
                         , SC.generate(e)
                         )
                     )
                 )
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: \n3 -: gen await to \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: go after \n10 -: "
  }
