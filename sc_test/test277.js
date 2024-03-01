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
           , SC.generate(g, undefined, SC.forever)
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
       "\n1 -: \n2 -: \n3 -: a c \n4 -: c \n5 -: c \n6 -: c \n7 -: c \n8 -: c \n9 -: c \n10 -: c \n11 -: c \n12 -: c \n13 -: c \n14 -: c \n15 -: c \n16 -: c \n17 -: c \n18 -: c \n19 -: c \n20 -: c "
  }
