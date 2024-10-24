{
  prg: `
SC.par(
  SC.generateBurst({ evt: e , val: "Hello", times: 10 })
, SC.actionOn(e, function(re){
      const msgs= re.getValuesOf(e);
      for(var i in msgs){
        writeInConsole(msgs[i]);
        }
      }, undefined, SC.forever)
, SC.repeat(2, SC.next(2), SC.pause(2))
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
4 -: Hello
5 -: 
6 -: 
7 -: Hello
8 -: Hello
9 -: Hello
10 -: Hello
11 -: Hello
12 -: Hello
13 -: Hello
14 -: Hello`
  }
