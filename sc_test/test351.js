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
           , 2
           )
         , SC.repeat(5
             , SC.pause(0)
             , SC.generate(e, "Hello World!")
             )
         )
 , init: function(){}
 , async: function(){}
 , expected:
     "\n1 -: Hello World!\n2 -: Hello World!\n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
