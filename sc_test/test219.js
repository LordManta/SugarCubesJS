  {
   prg:
     "SC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }, inc: function(){this.x++;}}, SC.seq(SC.write('hello'), SC.repeat(2, SC.action('inc')), SC.action('dump')))"
 , expected:
     "\n1 -: hello\n2 -: 2"
  }
