{
prg:
      "SC.par(\n"
    + "  SC.kill(e\n"
    + "    , SC.seq(\n"
    + "        SC.write('init')\n"
    + "        , SC.generate(f, conf.main)\n"
    + "        , SC.par(\n"
    + "            SC.control(SC.and(zone1,zone2)\n"
    + "              , SC.repeat(SC.forever\n"
    + "                  , SC.match({t:conf, f:'val'}\n"
    + "                      , SC.write('case 0')\n"
    + "                      , SC.write('case 1')\n"
    + "                      , SC.write('case 2')\n"
    + "                      , SC.write('case 3')\n"
    + "                      , SC.write('case 4')\n"
    + "                      )\n"
    + "                  , SC.pause(10)\n"
    + "                  , SC.write('done')\n"
    + "                  , SC.pause()\n"
    + "                  , SC.action({t:conf, f:'compute'})\n"
    + "                  )\n"
    + "              )\n"
    + "            , SC.generate(inGame, 2, SC.forever)\n"
    + "            )\n"
    + "        )\n"
    + "    )\n"
    + "    , SC.repeat(1, SC.generate(zone1), SC.generate(zone2))\n"
    + "  )\n"
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
        "\n1 -: initcase 0\n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: \n11 -: \n12 -: \n13 -: \n14 -: \n15 -: \n16 -: \n17 -: \n18 -: \n19 -: \n20 -: \n21 -: \n22 -: \n23 -: \n24 -: \n25 -: \n26 -: \n27 -: \n28 -: \n29 -: \n30 -: "
  }

