  {
   prg:
       SC.par(
         SC.actionOn(
           e
           , function(re){
               var msgs=re.getValuesOf(e);
               for(var msg in msgs){
                 writeInConsole(msgs[msg]);
                 }
               }
           , undefined
           , SC.forever
           )
         , SC.repeat(20
             , SC.pause(0)
             , SC.generate(e, "Hello World!")
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: Hello World!\n2 -: Hello World!\n3 -: Hello World!\n4 -: Hello World!\n5 -: Hello World!\n6 -: Hello World!\n7 -: Hello World!\n8 -: Hello World!\n9 -: Hello World!\n10 -: Hello World!"
  }
