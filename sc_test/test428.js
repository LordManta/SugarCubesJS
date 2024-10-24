  {
   prg:
     `
SC.par(
  SC.repeatForever(
    SC.await(sens1),
    SC.write('go')
    )
, SC.repeatForever(
    SC.nothing()
    )
  )
`
 , expected:
     "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }

