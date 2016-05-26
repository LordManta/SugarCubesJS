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
           , SC.forever
           )
         , SC.repeat(20
             , SC.pause(2)
             , SC.generate(e, "Hello World!")
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: \n3 -: Hello World!\n4 -: \n5 -: \n6 -: Hello World!\n7 -: \n8 -: \n9 -: Hello World!\n10 -: "
  }
