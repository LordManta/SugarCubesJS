  {
   prg:
     "SC.par(\nSC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }, inc: function(){this.x++;}}, SC.seq(SC.write('hello'), SC.repeat(4, SC.action('inc')), SC.action('dump')))\n, SC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }, inc: function(){this.x++;}}, SC.seq(SC.write('hello'), SC.repeat(7, SC.action('inc')), SC.action('dump')))\n)"
 , expected:
     "\n1 -: hellohello\n2 -: \n3 -: \n4 -: 4\n5 -: \n6 -: \n7 -: 7\n8 -: \n9 -: \n10 -: "
 , persist: true
  }
