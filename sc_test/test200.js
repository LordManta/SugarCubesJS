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
           )
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: \n2 -: g\n3 -: f\n4 -: \n5 -: g\n6 -: \n7 -: e\n8 -: \n9 -: g\n10 -: \n11 -: g\n12 -: \n13 -: e\n14 -: \n15 -: g\n16 -: \n17 -: g\n18 -: \n19 -: e\n20 -: "
  }
