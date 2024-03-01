  {
   prg:
     SC.par(
       SC.seq(
         SC.generate(e, "a ")
         , SC.await(f)
         , SC.generate(e, "b ", SC.forever)
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
   , init: function(){
             }
   , async: function(){
              }
   , maxI: 20
   , expected :
       "\n1 -: a b \n2 -: b \n3 -: b \n4 -: b \n5 -: b \n6 -: b \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
  }
