  {
   prg:
     SC.par(
       SC.repeat(5
         , SC.when(e
             , SC.when(SC.and(f,g)
                 , SC.write("f")
                 , SC.write("g")
                 )
             , SC.write("e")
             )
         )
       , SC.repeat(SC.forever
           , SC.generate(e, undefined, 5)
           )
       , SC.repeat(5
           , SC.pause(1)
           , SC.generate(f)
           , SC.pause(1)
           , SC.generate(f)
           , SC.generate(g)
           )
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 10
   , expected :
       "\n1 -: \n2 -: g\n3 -: f\n4 -: \n5 -: g\n6 -: f\n7 -: \n8 -: g\n9 -: \n10 -: "
  }
