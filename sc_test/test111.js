  {
   prg:
     SC.par(
       SC.repeat(SC.forever
         , SC.kill(f
             , SC.repeat(SC.forever
                 , SC.await(e)
                 , SC.write("Hello World !")
                 )
             )
         , SC.pause()
         , SC.generate(g)
         )
       , SC.repeat(5
           , SC.generate(e)
           )
       )
   , expected :
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !\n4 -: Hello World !\n5 -: Hello World !\n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
