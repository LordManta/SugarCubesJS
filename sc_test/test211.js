  {
   prg:
    SC.parex(e
      , SC.seq(SC.write("start")
          , SC.pause()
	  , SC.repeat(10, SC.write("bip"))
          )
      , SC.seq(SC.pause()
          , SC.generate(e, SC.repeat(5, SC.write("new")))
          )
      )
   //, fun1:unfe
   //, init: function(){ window.called1 = this.fun1; window.myCount = 0;}
   /*, async: function(){ 
       window.myCount++;
       if(window.myCount == 10){
         m.generateEvent(sens1, "Hello World !");
         }
       }*/
   , maxI: 10
   , expected :
       "\n1 -: start\n2 -: bip\n3 -: bipnew\n4 -: bipnew\n5 -: bipnew\n6 -: bipnew\n7 -: bipnew\n8 -: bip\n9 -: bip\n10 -: bip"
  }
