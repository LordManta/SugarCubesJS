  {
   prg:
     SC.par(
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
                 , SC.pause()
                 )
               , SC.seq(
                   SC.generate(e, "d ")
                   , SC.pause()
                   , SC.generate(e, "d ")
                   , SC.generate(e, "f ")
                   , SC.await(g)
                   , SC.generate(e, "g ")
                   )
               )
           )
       , SC.repeat(4
           , SC.pause()
           , SC.generate(g)
           )
       , SC.repeat(10
           , SC.await(e)
           , SC.generate(f)
           , SC.actionOn(e, function(re){
               for(var msg of re.getValuesOf(e)){
                 writeInConsole(msg);
                 }
               })
           )
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: a b c d \n2 -: a e b d f g \n3 -: a b c d \n4 -: a e b d f g \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
  }
