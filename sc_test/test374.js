  {
   prg:
`SC.par(
  SC.whileRepeat(fun, SC.write('hello'))
, SC.seq(SC.pause(5), SC.action(go))
  )`
 , fun: function(){
     return globalCond;
     }
 , go: function(){
     globalCond = false;
     }
 , init: function(){
     window.go = this.go;
     window.fun = this.fun;
     globalCond = true;
     }
 , expected:
     "\n1 -: hello\n2 -: hello\n3 -: hello\n4 -: hello\n5 -: hello\n6 -: hello\n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
