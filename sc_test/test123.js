  {
   prg:
     SC.par(
       SC.actionOn(e, function(v){
           var msgs = v[e];
           for(var i in msgs){
             writeInConsole(msgs[i]);
             }
         }, undefined, SC.forever)
       , SC.repeat(5
           , SC.generate(e,"Hello World !")
           )
       , SC.repeat(5
           , SC.pause(0)
           , SC.generate(f, "Bonjour tout le monde !") 
           )
       )
   , expected :
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !\n4 -: Hello World !\n5 -: Hello World !\n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
