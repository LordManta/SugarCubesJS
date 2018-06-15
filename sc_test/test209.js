  {
   prg:
    SC.parex(e
      , SC.seq(SC.write("start")
          , SC.pause()
	  , SC.repeat(10, SC.write("new"))
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
       "\n1 -: start\n2 -: new\n3 -: new\n4 -: new\n5 -: new\n6 -: new\n7 -: new\n8 -: new\n9 -: new\n10 -: new"
  }
