  {
   prg:
     SC.par(
       SC.generate(e,undefined,2)
       , SC.seq(
           SC.pause()
           , SC.await(e)
           , SC.await(SC.or(e,f))
           , SC.write("Hello World !")
           )
       )
 , expected:
       "\n1 -: \n2 -: Hello World !\n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
