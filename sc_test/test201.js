  {
   prg:
     SC.par(
       SC.repeat(SC.forever
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
           , SC.pause(1)
           )
       , SC.repeat(SC.forever
           , SC.pause(1)
           , SC.generate(f)
           , SC.pause(1)
           , SC.generate(f)
           , SC.generate(g)
           , SC.pause(1)
           , SC.generate(f)
           , SC.generate(g)
           )
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: \n2 -: g\n3 -: f\n4 -: f\n5 -: \n6 -: g\n7 -: f\n8 -: f\n9 -: \n10 -: g\n11 -: f\n12 -: \n13 -: e\n14 -: \n15 -: g\n16 -: f\n17 -: \n18 -: g\n19 -: f\n20 -: f"
  }
