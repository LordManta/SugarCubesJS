  {
    prg:
      "SC.cube({x:0, dump: function(){ testPanel.value += this.x.toString(); }}, SC.seq(SC.write('hello'), SC.action('dump')))"
    , expected :
        "\n1 -: hello0\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }

