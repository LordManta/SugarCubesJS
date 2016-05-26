  {
   prg:
     SC.seq(
       SC.pause(4)
       , SC.generate(e)
       , SC.await(e)
       , SC.generate(e)
       , SC.await(f)
       , SC.write("Hello World !")
       )
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
