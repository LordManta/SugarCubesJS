  {
   prg:
     SC.seq(
       SC.generate(e)
       , SC.await(e)
       , SC.await(SC.or(e,f))
       , SC.write("Hello World !")
       )
 , expected:
       "\n1 -: Hello World !"
  }
