  {
   prg:
`SC.cube(
  { x: 0
  , dump: function(){ testPanel.value+= this.x.toString(); }
    }
, SC.seq(
    SC.write('hello')
  , SC.action('dump')
    )
  )`
 , expected:
       "\n1 -: 0hello"
  }

