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
       "\n1 -: \n2 -: \n3 -: Hello World !"
  }
