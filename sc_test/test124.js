  {
   prg:`
       SC.par(
         SC.actionOn(e, function(re){
             var msgs=re.getValuesOf(e);
             for(var i in msgs){
               writeInConsole(msgs[i]);
               }
           }, undefined, SC.forever)
         , SC.repeat(5
             , SC.filter(sens1, e, fun1) 
             )
         )`
   , expected :
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !\n4 -: Hello World !\n5 -: Hello World !\n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
   , fun1: function(v){
             return "Hello World !"
             }
   , init: function(){ window.called1 = this.fun1; }
   , async: function(){ sens1.newValue("Hello World !"); }
  }
