{
   prg:
`SC.par(
  SC.whileRepeat(fun, SC.write('hello'))
, SC.seq(SC.pause(5), SC.action(go))
  )`
, fun: function(){
       return globalCond;
       }
 , go: function(re){
       toGo= true;
       }
 , async: function(){
       if(toGo){
         globalCond= false;
	 toGo= false;
         }
       }
 , init: function(){
     window.toGo= false;
     window.go= this.go;
     window.fun= this.fun;
     globalCond= true;
     }
 , expected:
     `
1 -: hello
2 -: hello
3 -: hello
4 -: hello
5 -: hello
6 -: hello
7 -: `
  }
