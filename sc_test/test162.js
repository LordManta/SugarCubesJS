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
           )
         , SC.repeat(5
             , SC.pause(0)
             , SC.generate(e, "Hello World!")
             )
         )
 , init: function(){}
 , async: function(){}
 , expected:
     "\n1 -: Hello World!\n2 -: \n3 -: \n4 -: \n5 -: "
  }
