{
  prg: `
SC.par(
  SC.repeat(5
  , SC.nop()
  , SC.pause()
    )
, SC.repeatBurst(11, SC.next())
, SC.repeat(10
  , SC.write("*")
    )
, SC.repeatBurst(10
  , SC.write("+")
    )
, SC.whileRepeatBurst(sc_test_isEnded
  , SC.write("_")
    )
, SC.whileRepeat(sc_test_isEnded
  , SC.write("|")
    )
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
1 -: *+_|
2 -: *|
3 -: *+_|
4 -: *|
5 -: *+_|
6 -: *|
7 -: *+_|
8 -: *|
9 -: *+_|
10 -: *|
11 -: +_|
12 -: |
13 -: +_|
14 -: |
15 -: +_|
16 -: |
17 -: +_|
18 -: |
19 -: +
20 -: `
  }

