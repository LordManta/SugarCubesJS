  {
   prg:
       SC.par(
         SC.repeat(SC.forever
           , SC.await(e)
           , SC.actionOn(e, function(v){
                 var msgs = v[e];
                 for(var i in msgs){
                   writeInConsole(msgs[i]);
                   }
               })
           , SC.pause()
           )
         , SC.repeat(SC.forever
             , SC.await(sens1)
             , SC.filter(sens1, e, fun1) 
             , SC.pause()
             )
         )
   , expected :
       "\n1 -: Hello World !\n2 -: \n3 -: Hello World !\n4 -: \n5 -: Hello World !\n6 -: \n7 -: Hello World !\n8 -: \n9 -: Hello World !\n10 -: "
   , fun1: function(v){
             return v;
             }
   , init: function(){ window.called1 = this.fun1; }
   , async: function(){ sens1.newValue("Hello World !"); }
  }
