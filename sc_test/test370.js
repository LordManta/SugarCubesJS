  {
   prg:
     "SC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }, inc: function(){this.x++;}}, SC.seq(SC.write('hello'), SC.repeat(3, SC.action('inc')), SC.action('dump')))"
 , expected:
     "\n1 -: hello\n2 -: \n3 -: 3\n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
