  {
   prg:
     SC.par(
       SC.repeat(SC.forever
         , SC.kill(f
             , SC.repeat(SC.forever
                 , SC.await(e)
                 , SC.write("Hello World !")
                 )
             , SC.seq(
                 SC.await(f)
                 , SC.write("f!")
                 )
             )
         , SC.pause()
         , SC.generate(g)
         )
       , SC.repeat(5
           , SC.generate(e)
           )
       , SC.repeat(4
           , SC.pause(2)
           , SC.generate(f) 
           )
       , SC.seq(
           SC.await(g)
           , SC.write("g!")
           )
       )
   , expected :
       "\n1 -: Hello World !\n2 -: Hello World !\n3 -: Hello World !\n4 -: \n5 -: \n6 -: f!\n7 -: g!\n8 -: \n9 -: \n10 -: "
  }
