  {
   prg:
     `SC.kill(e
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
  )`
 , expected:
     "\n1 -: hello\n2 -: killed by e"
  }

