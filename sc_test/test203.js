  {
   prg:
     SC.kill(g
       , SC.par(
           SC.control(SC.and(e,f)
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
       )
 , fun1: function(v){
           console.log("filter");
           return 1;
           }
 , init: function(){ window.called1 = this.fun1; window.myCount = 0;}
 , async: function(){ 
     window.myCount++;
     if(window.myCount == 10){
       sens1.newValue("Hello World !");
       }
     }
 , maxI: 20
 , expected:
     "\n1 -: \n2 -: \n3 -: go\n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: g\n11 -: "
  }
