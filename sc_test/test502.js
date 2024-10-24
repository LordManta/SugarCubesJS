{
  prg: `
SC.par(
  SC.generateBurst({ evt: e , val: "Hello", times: 10 })
, SC.actionOn(e, function(re){
      const msgs= re.getValuesOf(e);
      for(var i in msgs){
        writeInConsole(msgs[i]);
        }
      }, undefined, 10)
, SC.repeat(3, SC.next(3), SC.pause(3))
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
1 -: Hello
2 -: 
3 -: 
4 -: 
5 -: Hello
6 -: 
7 -: 
8 -: 
9 -: Hello
10 -: 
11 -: 
12 -: 
13 -: 
14 -: 
15 -: 
16 -: 
17 -: 
18 -: 
19 -: `
  }
