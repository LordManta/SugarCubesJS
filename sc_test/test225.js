  {
   prg:
     "SC.par(\n"
   + "  SC.ifRepeat(fun, SC.write('hello'))\n"
   + "  , SC.seq(SC.pause(5), SC.action(go))\n"
   + "  )"
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
     "\n1 -: hello\n2 -: hello\n3 -: hello\n4 -: hello\n5 -: hello\n6 -: hello\n7 -: hello"
  }
