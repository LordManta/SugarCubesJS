  {
   prg:
     SC.par(
       SC.repeat(3
         , SC.pause(0)
         , SC.log("e")
         , SC.await(e)
         , SC.log("e et f")
         , SC.await(SC.and(e,f))
         , SC.write("Hello World !")
         )
       , SC.repeat(5
           , SC.generate(e)
           , SC.generate(f)
           , SC.pause(2)
           )
       )
   , expected :
       "\n1 -: Hello World !\n2 -: \n3 -: \n4 -: Hello World !\n5 -: \n6 -: \n7 -: Hello World !\n8 -: \n9 -: \n10 -: "
  }
