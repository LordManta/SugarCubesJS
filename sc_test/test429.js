{
  prg:
     `
SC.par(
  SC.repeatForever(
    SC.await(sens1),
    SC.write('go')
    )
, SC.repeat(
    SC.nothing()
    )
  )
`
, async: function(){
    sens1.newValue();
    }
, expected:
     "\n1 -: go\n2 -: go\n3 -: go\n4 -: go\n5 -: go\n6 -: go\n7 -: go\n8 -: go\n9 -: go\n10 -: go"
}
