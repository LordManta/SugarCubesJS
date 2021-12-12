{
  prg:
     `
SC.par(
  SC.repeatForever(
    SC.await(sens1),
    SC.write('go')
    )
, SC.repeatForever(
    SC.next(1)
  , SC.pause()
    )
  )
`
, init: function(){
    this.altern = 0;
    }
, async: function(){
    this.altern++;
    if(0 == this.altern%2){
      sens1.newValue();
      }
    }
, expected:
     "\n1 -: \n2 -: \n3 -: go\n4 -: \n5 -: \n6 -: \n7 -: go\n8 -: \n9 -: \n10 -: \n11 -: go\n12 -: \n13 -: \n14 -: \n15 -: go\n16 -: \n17 -: \n18 -: \n19 -: go\n20 -: "
}
