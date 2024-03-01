  {
   prg:
     SC.par(
       SC.repeatForever(
         SC.control(g
           , SC.seq(
               SC.generate(e, "a ")
               , SC.await(f)
               , SC.generateForever(g)
               , SC.generate(e, "b ")
               )
           )
         )
       , SC.repeat(18
           , SC.await(e)
           , SC.generate(f)
           , SC.actionOn(e, function(re){
               for(var msg of re.getValuesOf(e)){
                 writeInConsole(msg);
                 }
               })
           )
       , SC.seq(
           SC.pause(2)
           , SC.generate(g)
           )
       , SC.repeatForever(
           SC.await(g)
           , SC.generate(e, "c ")
           )
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: \n2 -: \n3 -: a c \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
  }
