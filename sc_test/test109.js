  {
   prg:
     SC.par(
       SC.kill(f
         , SC.repeat(5
             , SC.await(SC.and(e,f))
             , SC.write("Hello World !")
             )
         )
       , SC.repeat(5
           , SC.generate(e)
           , SC.generate(f)
           )
       )
   , expected :
       "\n1 -: Hello World !\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
