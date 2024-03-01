  {
   prg:
     SC.par(
       SC.repeatForever(
         SC.kill(g
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
       )
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: a \n2 -: \n3 -: a \n4 -: \n5 -: a \n6 -: \n7 -: a \n8 -: \n9 -: a \n10 -: \n11 -: a \n12 -: \n13 -: a \n14 -: \n15 -: a \n16 -: \n17 -: a \n18 -: \n19 -: a \n20 -: "
  }
