{
  prg: `
SC.par(
  SC.resetOn(SC.or(e1, SC.and(e,f))
  , SC.par(
      SC.await(e)
    , SC.await(f)
      )
  , SC.pause()
  , SC.generate(g)
  , SC.pauseForever()
    )
, SC.repeat(4, SC.pause(), SC.generate(e))
, SC.repeat(4, SC.generate(f), SC.pause())
, SC.repeat(5, SC.generate(e1), SC.pause(2))
, SC.generate(e)
, SC.generate(f)
, SC.generate(e1)
, SC.repeat(10, SC.await(g), SC.write("o!"))
  )
`
// Executed at initialisation of the test
, init: function(){
    window.varCount= 0;
    window.sc_test_isEnded= function(){ return 10>varCount; };
    }
, async: function(){
    varCount++;
    }
/*
// Executed in between 2 consecutive burst
// Max number of instant (default 10)
, maxI: 15
 // ?
 , persist: true
*/
, expected:
     `
1 -: 
2 -: 
3 -: 
4 -: o!
5 -: 
6 -: 
7 -: o!
8 -: 
9 -: 
10 -: `
  }
