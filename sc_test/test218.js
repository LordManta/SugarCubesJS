  {
    prg:
      "SC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }, inc: function(){this.x++;}}, SC.seq(SC.write('hello'), SC.action('inc'), SC.pause(), SC.action('dump')))"
    , expected :
        "\n1 -: hello\n2 -: 1\n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }

