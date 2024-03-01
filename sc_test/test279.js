  {
   prg:
     SC.par(
       SC.seq(
         SC.generate(e, "a ")
         , SC.await(f)
         , SC.generate(e, "b ", SC.forever)
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
       "\n1 -: a b \n2 -: b \n3 -: b \n4 -: b \n5 -: b \n6 -: b \n7 -: b \n8 -: b \n9 -: b \n10 -: b \n11 -: b \n12 -: b \n13 -: b \n14 -: b \n15 -: b \n16 -: b \n17 -: b \n18 -: b \n19 -: \n20 -: "
  }
