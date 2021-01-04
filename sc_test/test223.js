  {
   prg:
     "SC.par(\n"
   + "  SC.cube({x:0\n"
   + "           , dump: function(){ testPanel.value += this.x.toString(); }\n"
   + "           , inc: function(){this.x++;}\n"
   + "           }\n"
   + "    , SC.seq(SC.write('hello'), SC.repeat(5, SC.action('inc')), SC.action('dump')))\n"
   + "  , SC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }, inc: function(){this.x++;}}\n"
   + "      , SC.seq(SC.write('hello'), SC.repeat(6, SC.action('inc')), SC.action('dump')))\n)"
 , expected:
     "\n1 -: hellohello\n2 -: \n3 -: \n4 -: \n5 -: 5\n6 -: 6\n7 -: "
  }
