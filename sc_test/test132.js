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
             , SC.await(SC.or(sens1,sens2))
             , SC.par(
                 SC.filter(sens1, e, fun1) 
                 , SC.filter(sens2, e, fun1)
                 )
             , SC.pause()
             )
         )
   , expected :
       "\n1 -: Hello World !1_1\n2 -: \n3 -: Hello World !3_2\n4 -: \n5 -: Hello World !5_3\n6 -: \n7 -: Hello World !7_4\n8 -: \n9 -: Hello World !9_5\n10 -: "
   , fun1: function(v){
             return v[0]+"_"+(window.myCount2++);
             }
   , init: function(){
             window.called1 = this.fun1;
             window.myCount = 1;
             window.myCount2 = 1;
             }
   , async: function(){ sens1.newValue("Hello World !"+(window.myCount++)); }
  }
