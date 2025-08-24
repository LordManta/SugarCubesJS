{
  prg: `
SC.par(
  SC.resetOn(SC.and(e, f)
  , SC.par(
      SC.await(e)
    , SC.await(f)
      )
  , SC.generate(g)
  , SC.pauseForever()
    )
, SC.generate(e)
, SC.generate(f)
, SC.generate(e1)
, SC.seq(SC.await(g), SC.write("o!"))
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
1 -: o!
2 -: 
3 -: 
4 -: 
5 -: 
6 -: 
7 -: 
8 -: 
9 -: 
10 -: `
  }
