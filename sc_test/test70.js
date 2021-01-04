  {
   prg:
     SC.seq(
       SC.generate(e)
       , SC.await(e)
       , SC.generate(f)
       , SC.await(f)
       , SC.write("Hello World !")
       )
   , expected :
       "\n1 -: Hello World !"
  }
