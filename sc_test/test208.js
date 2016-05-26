  {
   prg:
    SC.seq(
      SC.write("start")
      , SC.pause(1)
      , SC.kill(SC.or(e1,e2)
          , SC.kill(e3
              , SC.par(
     	     SC.generate(e4, undefined, SC.forever)
                  , SC.control(SC.and(e,f)
                      , SC.par(
                          SC.filter(sens1, g, fun1, SC.forever)
                          , SC.filter(sens2, g, fun1, SC.forever)
                          )
                      )
                  , SC.seq(SC.await(g),SC.write("g"))
                  , SC.seq(SC.pause(2)
                      , SC.write("go")
                      , SC.repeat(SC.forever, SC.generate(e),SC.generate(f))
                      )
                  )
              , SC.write("fin")
              )
          )
      )
   , fun1: function(v){
             console.log("filter");
             return 1;
             }
   , init: function(){ window.called1 = this.fun1; window.myCount = 0;}
   , async: function(){ 
       window.myCount++;
       if(window.myCount == 10){
         m.generateEvent(sens1, "Hello World !");
         }
       }
   , maxI: 20
   , expected :
       "\n1 -: start\n2 -: \n3 -: \n4 -: go\n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: g\n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: "
  }
