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
           , SC.pause(4)
           , SC.await(e)
           , SC.await(SC.and(e,f))
           , SC.write("Hello World !")
           )
       )
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: Hello World !\n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
