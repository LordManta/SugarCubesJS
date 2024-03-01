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
       ,SC.repeatForever(
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
       "\n1 -: a c \n2 -: \n3 -: a c \n4 -: \n5 -: a c \n6 -: \n7 -: a c \n8 -: \n9 -: a c \n10 -: \n11 -: a c \n12 -: \n13 -: a c \n14 -: \n15 -: a c \n16 -: \n17 -: a c \n18 -: \n19 -: a c \n20 -: "
  }
