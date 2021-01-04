  {
   prg:
     SC.seq(
       SC.pause(4)
       , SC.generate(e)
       , SC.generate(f)
       , SC.await(e)
       , SC.await(f)
       , SC.write("Hello World !")
       )
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: Hello World !\n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
