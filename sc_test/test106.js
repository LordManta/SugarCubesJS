  {
   prg:
     SC.par(
       SC.repeat(5
         , SC.generate(e)
         , SC.pause(0)
         , SC.generate(f)
         , SC.pause(0)
         )
       , SC.repeat(3
           , SC.pause(0)
           , SC.await(e)
           , SC.await(SC.and(e,f))
           , SC.write("Hello World !")
           )
       )
 , expected:
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !\n4 -: \n5 -: "
  }
