{
  prg: `
SC.par(
  SC.repeat(5
  , SC.nop()
  , SC.pause()
    )
, SC.repeatBurst(5, SC.next(4))
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
3 -: *|
4 -: *|
5 -: *|
6 -: *+_|
7 -: *|
8 -: *|
9 -: *|
10 -: *|
11 -: +_|
12 -: |
13 -: |
14 -: |
15 -: |
16 -: +_|
17 -: |
18 -: |
19 -: |
20 -: |
21 -: +_|
22 -: |
23 -: |
24 -: |
25 -: |
26 -: +_|
27 -: +_|
28 -: +_|
29 -: +_|
30 -: +`
  }

