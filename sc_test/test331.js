  {
   prg:
     SC.seq(
       SC.generate(e)
       , SC.await(e)
       , SC.generate(f)
       , SC.await(f)
       , SC.write("Hello World !")
       )
 , expected:
       "\n1 -: Hello World !\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
