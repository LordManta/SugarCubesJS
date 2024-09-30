{
  prg:
    `SC.par(
    // P1
      SC.seq(
	SC.write('-- burst start --')
      , SC.pauseBurst()
      , SC.write('-- burst ends --')
        )
    // P2
    , SC.seq(
        SC.next(4)
      , SC.repeat(5, SC.write('in'))
	)
      )
`
/*
// Executed at initialisation of the test
, init: function(){
    this.altern = 0;
    }
// Executed in between 2 consecutive burst
, async: function(){
    this.altern++;
    if(0 == this.altern%2){
      sens1.newValue();
      }
    }
 // ?
 , persist: true
// Max number of instant (default 10)
, maxI: 15
*/
, expected:
     `
1 -: -- burst start --in
2 -: in
3 -: in
4 -: in
5 -: in
6 -: -- burst ends --`
  }