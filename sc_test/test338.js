  {
   prg:
     SC.par(
       SC.generate(e,undefined,3)
       , SC.seq(
           SC.pause(2)
           , SC.await(e)
           , SC.await(SC.or(e,f))
           , SC.write("Hello World !")
           )
       )
 , expected:
       "\n1 -: \n2 -: \n3 -: Hello World !\n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
