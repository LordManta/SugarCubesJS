  {
   prg:
     SC.seq(
       SC.generate(e)
       , SC.generate(f)
       , SC.await(e)
       , SC.await(SC.and(e,f))
       , SC.write("Hello World !")
       )
   , expected :
       "\n1 -: Hello World !"
  }
