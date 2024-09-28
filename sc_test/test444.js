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
        SC.pause()
      , SC.generate(f)
      , SC.pause(3)
      , SC.generate(g)
      , SC.pause(2)
      , SC.generate(e)
	)
      )
`
, expected:
     `
1 -: 
2 -: f !.
3 -: .
4 -: 
5 -: fin
6 -: 
7 -: 
8 -: 
9 -: 
10 -: `
  }
