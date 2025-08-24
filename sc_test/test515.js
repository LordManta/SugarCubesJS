{
prg:`SC.par(
  SC.kill(e
    , SC.seq(
        SC.write('init')
        , SC.generate(f, conf.main)
        , SC.par(
            SC.control(SC.and(zone1,zone2)
              , SC.repeat(SC.forever
	          , SC.write("-->")
                  , SC.match({t:conf, f:'val'}
                      , SC.write('case 0')
                      , SC.write('case 1')
                      , SC.write('case 2')
                      , SC.write('case 3')
                      , SC.write('case 4')
                      )
                  , SC.pause(10)
                  , SC.write('done')
                  , SC.pause()
                  , SC.action({t:conf, f:'compute'})
                  )
              )
            , SC.generate(inGame, 2, SC.forever)
            )
        )
    )
    , SC.repeat(1, SC.generate(zone1), SC.generate(zone2))
  )`
    /*, fun : function(){
        writeInConsole("hello");
        }*/
   , maxI: 30
   , init: function(){
      window.fun = this.fun;
      window.zone1 = SC.evt("zone1");
      window.zone2 = SC.evt("zone2");
      window.inGame = SC.evt("inGame");
      window.conf = {
        val:0
        , compute:function(){
            writeInConsole('compute');
            }
        };
      }
   , expected :
        "\n1 -: init-->case 0\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: \n21 -: \n22 -: \n23 -: \n24 -: \n25 -: \n26 -: \n27 -: \n28 -: \n29 -: \n30 -: "
  }

