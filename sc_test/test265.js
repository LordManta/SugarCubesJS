  {
   prg:
     SC.par(
       SC.repeat(2
         , SC.await(f)
         , SC.generate(e, "a ")
         , SC.generate(e, "e ")
         )
       , SC.generate(e, "b ")
       , SC.repeat(2
           , SC.await(f)
           , SC.generate(e, "c ")
           )
       , SC.generate(e, "d ")
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
       "\n1 -: a e b c d \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
  }
