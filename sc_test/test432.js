{
  prg:
     `
SC.par(
  SC.kill(e
  , SC.seq(
      SC.par(
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
  , SC.write("kill")
    )
, SC.seq(SC.pause(), SC.generate(e))
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
3 -: kill`
  }