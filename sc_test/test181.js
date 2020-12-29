  {
   prg:
     SC.par(
       SC.repeat(SC.forever
         , SC.write("start")
         , SC.pause(1)
         , SC.control(sens1
             , SC.kill(g
                 , SC.seq(
                     SC.pause(1)
                     , SC.par(
                         SC.seq(
                           SC.write("gen ")
                           , SC.generate(f)
                           , SC.write("await ")
                           , SC.await(e)
                           , SC.write("after ")
                           )
                         , SC.seq(
                             SC.write("to ")
                             , SC.pause(2)
                             , SC.write("go ")
                             , SC.generate(e)
                             )
                         )
                     )
                 )
             )
         )
       , SC.actionOn(sens1, function(){
              writeInConsole("sens1");
           }
           ,undefined, SC.forever)
       )
   , init: function(){window.sctest_count = 0;}
   , async: function(){
              window.sctest_count++;
              if(0 == (window.sctest_count%2)){
                sens1.newValue();
                }
              }
   , maxI: 20
   , expected :
       "\n1 -: start\n2 -: sens1\n3 -: \n4 -: sens1gen await to \n5 -: \n6 -: sens1\n7 -: \n8 -: sens1after go \n9 -: start\n10 -: sens1\n11 -: \n12 -: sens1gen await to \n13 -: \n14 -: sens1\n15 -: \n16 -: sens1after go \n17 -: start\n18 -: sens1\n19 -: \n20 -: sens1gen await to "
  }
