  {
   prg:
     `SC.repeat(3
, SC.kill(e
  , SC.cube(
      {
        x:0
      , dump: function(){
          testPanel.value += this.x.toString();
          }
      , inc: function(){
          this.x++;
          }
      }
    , SC.seq(
        SC.write('hello')
      , SC.action('inc')
      , SC.killSelf()
      , SC.generate(e)
      , SC.pause()
      , SC.action('dump')
        )
      )
  , SC.write('killed by e')
    )
, SC.pause()
  )`
 , expected:
     "\n1 -: hello\n2 -: killed by e\n3 -: \n4 -: hello\n5 -: killed by e\n6 -: \n7 -: hello\n8 -: killed by e\n9 -: "
  }

