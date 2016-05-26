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
           , 12
           )
         , SC.repeat(5
             , SC.pause(1)
             , SC.generate(e, "Hello World!")
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: Hello World!\n3 -: \n4 -: Hello World!\n5 -: \n6 -: Hello World!\n7 -: \n8 -: Hello World!\n9 -: \n10 -: Hello World!"
  }
