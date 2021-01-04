  {
   prg:
     SC.par(
       SC.generate(e)
       , SC.seq(
           SC.generate(f)
           , SC.await(e)
           , SC.await(SC.or(e,f))
           , SC.write("Hello World !")
           )
       )
   , expected :
       "\n1 -: Hello World !"
  }
