  {
   prg:
     SC.par(
       SC.generate(e)
       , SC.seq(
           SC.generate(f)
           , SC.await(e)
           , SC.await(SC.and(e,f))
           , SC.write("Hello World !")
           )
       )
 , expected:
       "\n1 -: Hello World !"
  }
