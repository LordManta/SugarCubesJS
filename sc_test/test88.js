  {
   prg:
     SC.par(
       SC.repeat(3
         , SC.generate(e)
         , SC.generate(f)
         )
       , SC.repeat(1
           , SC.pause(1)
           , SC.await(e)
           , SC.await(SC.and(e,f))
           , SC.write("Hello World !")
           )
       )
   , expected :
       "\n1 -: \n2 -: Hello World !\n3 -: "
  }
