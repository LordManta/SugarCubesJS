{
prg:
`SC.par(
  SC.repeat(3, SC.pause(2), SC.generate(e, 1))
, SC.generate(e, 2, SC.forever)
, SC.repeat(2, SC.generate(e, 3, 3), SC.pause())
, SC.repeat(12, SC.actionOn(e, fun))
  )`
    , fun : function(re){
        const data= re.getValuesOf(e);
	if(data){
	  const dlen= data.length;
	  for(var i= 0; i<dlen; i++){
	    const val= data[i];
	    writeInConsole(val+" ");
	    }
	  }
        }
   , maxI: 15
   , init: function(){
      window.fun = this.fun;
      //window.zone1 = SC.evt("zone1");
      //window.zone2 = SC.evt("zone2");
      //window.inGame = SC.evt("inGame");
      //window.conf = {
      //  val: 0
      //  , compute:function(){
      //      writeInConsole('compute');
      //      }
      //  };
      }
   , expected :
        "\n1 -: 2 3 \n2 -: 2 3 \n3 -: 1 2 3 \n4 -: 2 \n5 -: 2 3 \n6 -: 1 2 3 \n7 -: 2 3 \n8 -: 2 \n9 -: 1 2 \n10 -: 2 \n11 -: 2 \n12 -: 2 \n13 -: \n14 -: \n15 -: "
  }

