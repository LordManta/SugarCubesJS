  {
   prg:
     SC.repeat(2
       , SC.par(
           SC.repeat(2
             , SC.await(f)
             , SC.generate(e, "a ", 2)
             , SC.generate(e, "e ")
             )
           , SC.generate(e, "b ",4)
           , SC.repeat(2
               , SC.par(
                   SC.seq(
                     SC.await(SC.and(f,e))
                     , SC.generate(e, "c ")
                     )
                   , SC.generate(e, "d ")
                   )
               )
           , SC.repeat(6
               , SC.await(e)
               , SC.generate(f)
               , SC.actionOn(e, function(all){
                   for(var msg in all[e]){
                     writeInConsole(all[e][msg]);
                     }
                   })
               )
           )
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: a b c d \n2 -: a e b c d \n3 -: a b \n4 -: a e b \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
  }
