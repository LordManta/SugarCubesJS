{
  prg:
    `SC.par(
    // P1
      SC.resetOn(e
      , SC.await(f)
      , SC. write('f !')
      , SC.repeat(2
        , SC.write(".")
          )
      , SC.repeatForever(
          SC.await(g)
        , SC.write("fin")
          )
        )
    // P2
    , SC.seq(
        SC.generate(f)
      , SC.pause(3)
      , SC.generate(g)
      , SC.pause(2)
      , SC.generate(e)
      , SC.pause(2)
      , SC.generate(f)
      , SC.pause(3)
      , SC.generate(g)
      , SC.pause()
      , SC.generate(g)
	)
      )
`
/*
// Executed at initialisation of the test
, init: function(){
    this.altern = 0;
    }
// Executed in between 2 consecutive burst
, async: function(){
    this.altern++;
    if(0 == this.altern%2){
      sens1.newValue();
      }
 // ?
 , persist: true
    }
*/
// Max number of instant (default 10)
, maxI: 15
, expected:
     `
1 -: f !.
2 -: .
3 -: 
4 -: fin
5 -: 
6 -: 
7 -: 
8 -: f !.
9 -: .
10 -: 
11 -: fin
12 -: fin
13 -: 
14 -: 
15 -: `
  }
