{
  prg:
     `
SC.par(
  SC.resetOn(e
  , SC.par(
      SC.await(f)
    , SC.repeat(3
        , SC.write(".")
        , SC.pause()
        )
      )
  , SC.write("nop")
  , SC.await(e)
  , SC.write("fin")
  , SC.pauseForever()
    )
, SC.seq(SC.pause(4), SC.generate(e), SC.generate(f))
  )
`
/*, init: function(){
    this.altern = 0;
    }
, async: function(){
    this.altern++;
    if(0 == this.altern%2){
      sens1.newValue();
      }
    }*/
, expected:
     `
1 -: .
2 -: 
3 -: .
4 -: 
5 -: .
6 -: .
7 -: 
8 -: .
9 -: 
10 -: .`
  }
