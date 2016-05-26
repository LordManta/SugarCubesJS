  {
   prg:
     SC.par(
       SC.generate(f)
       , SC.seq(
           SC.generate(f)
           , SC.await(e)
           , SC.await(SC.and(e,f))
           , SC.write("Hello World !")
           )
       )
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
