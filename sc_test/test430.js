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
, init: function(){
    console.log("init");
    this.altern=0;
    }
, async: function(){
    this.altern++;
    if(0==this.altern%2){
      console.log("trig", sens1);
      sens1.newValue();
      }
    }
, expected:
     "\n1 -: \n2 -: go\n3 -: \n4 -: go\n5 -: \n6 -: go\n7 -: \n8 -: go\n9 -: \n10 -: go"
}
