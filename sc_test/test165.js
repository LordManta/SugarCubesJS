  {
   prg:
       SC.par(
         SC.actionOn(
           e
           , function(v){
               var msgs = v[e];
               for(var msg in msgs){
                 writeInConsole(msgs[msg]);
                 }
               }
           , undefined
           , 3
           )
         , SC.repeat(5
             , SC.pause(1)
             , SC.generate(e, "Hello World!")
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: Hello World!\n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
