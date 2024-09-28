{
  prg:
    `SC.par(
    // P1
      SC.resetOn(e
      , SC.await(f)
      , SC. write('f !')
      , SC.repeat(2
        , SC.write(".")
          )
      , SC.repeatForever(
          SC.await(g)
        , SC.write("fin")
          )
        )
    // P2
    , SC.seq(
        SC.generate(f)
      , SC.pause(3)
      , SC.generate(g)
      , SC.pause(2)
      , SC.generate(e)
	)
      )
`
/*, init: function(){
    this.altern = 0;
    }
, async: function(){
    this.altern++;
    if(0 == this.altern%2){
      sens1.newValue();
      }
    }*/
, expected:
     `
1 -: f !.
2 -: .
3 -: 
4 -: fin
5 -: 
6 -: 
7 -: 
8 -: 
9 -: 
10 -: `
  }
