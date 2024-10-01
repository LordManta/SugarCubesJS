{
  prg: `
SC.par(
  SC.repeatForever(
    SC.next()
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
1 -: *+
2 -: *
3 -: *+
4 -: *
5 -: *+
6 -: *
7 -: *+
8 -: *
9 -: *+
10 -: *
11 -: *+
12 -: *
13 -: *+
14 -: *
15 -: *+
16 -: *
17 -: *+
18 -: *
19 -: *+
20 -: *`
  }

