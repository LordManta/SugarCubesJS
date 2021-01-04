  {
   prg:
     SC.seq(
       SC.pause(4)
       , SC.generate(e)
       , SC.await(e)
       , SC.generate(f)
       , SC.await(f)
       , SC.write("Hello World !")
       )
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: Hello World !"
  }
