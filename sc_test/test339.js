  {
   prg:
     SC.par(
       SC.repeat(3
         , SC.generate(e)
         , SC.generate(f)
         )
       , SC.seq(
           SC.pause(2)
           , SC.await(e)
           , SC.await(SC.and(e,f))
           , SC.write("Hello World !")
           )
       )
 , expected:
       "\n1 -: \n2 -: \n3 -: Hello World !\n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
