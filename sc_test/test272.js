  {
   prg:
     SC.repeat(3
       , SC.par(
           SC.repeat(3
             , SC.await(f)
             , SC.generate(e, "a ", 2)
             , SC.generate(e, "e ")
             )
           , SC.generate(e, "b ",6)
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
               , SC.actionOn(e, function(re){
               for(var msg of re.getValuesOf(e)){
                 writeInConsole(msg);
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
 , expected:
     "\n1 -: a b c d \n2 -: a e b c d \n3 -: a b \n4 -: a e b \n5 -: a b \n6 -: a e b \n7 -: a b c d \n8 -: a e b c d \n9 -: a b \n10 -: a e b \n11 -: a b \n12 -: a e b \n13 -: a b c d \n14 -: a e b c d \n15 -: a b \n16 -: a e b \n17 -: a b \n18 -: a e b "
  }
