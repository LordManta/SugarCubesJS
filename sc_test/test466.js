{
  prg:
    `SC.par(
    // P1
      SC.seq(
	SC.write('-- burst start --')
      , SC.pauseBurst(2)
      , SC.write('-- burst ends --')
      , SC.pauseBurstUntil(sc_test_isEnded)
      , SC.write('-- FIN --')
        )
    // P2
    , SC.seq(
        SC.next()
      , SC.repeat(5, SC.write('in'))
      , SC.next(2)
      , SC.repeat(4, SC.write('in2'))
      , SC.next(2)
      , SC.repeat(3, SC.write('in3'))
	)
    , SC.repeatForever(
        SC.write("*")
        )
    , SC.repeatBurstForever(
        SC.write("+")
        )
      )
`
// Executed at initialisation of the test
, init: function(){
    window.varCount= 0;
    window.sc_test_isEnded= function(){ return 0==varCount++; };
    }
/*
// Executed in between 2 consecutive burst
, async: function(){
    this.altern++;
    if(0 == this.altern%2){
      sens1.newValue();
      }
 // ?
 , persist: true
    }
// Max number of instant (default 10)
, maxI: 15
*/
, expected:
     `
1 -: -- burst start --in*+
2 -: in*
3 -: in*+
4 -: -- burst ends --in*+
5 -: -- FIN --inin2*+
6 -: in2*
7 -: in2*
8 -: in2in3*+
9 -: in3*
10 -: in3*
11 -: *+
12 -: *+
13 -: *+
14 -: *+
15 -: *+`
  }

