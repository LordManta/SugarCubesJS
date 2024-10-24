/*******
 * Classe SC_Buttons.js de control
 *******/
function SC_Button(params){
  this.x= params.x;
  this.y= params.y;
  this.r= params.r;
  this.hidden= false;
  this.bgcolor= params.clr;
  this.offset= 0;
  this.zoneEvt= params.zoneEvt;
  const localKill= SC.evt("localKill");
  const sustain= (params.sustain)?
                        SC.repeatForever(
                          SC.await(this.zoneEvt) 
                        , SC.kill(localKill
                          , SC.generate(this.zoneEvt, null, SC.forever)
                            )
                          )
                        : SC.nothing();

  SC.tools.addProgram(
    SC.cube(this
    , SC.par(
        SC.generate(params.e_disp, this, SC.forever)
      , SC.filter(params.s_md, this.zoneEvt, "filterStart", SC.forever)
      , SC.filter(params.s_ts, this.zoneEvt, "filterStart", SC.forever)
      , SC.filter(params.s_tm, this.zoneEvt, "filterStart", SC.forever)
      , SC.filter(params.s_tm, localKill, "filterMove", SC.forever)
      , SC.filter(params.s_te, localKill, "filterEnd", SC.forever)
      , SC.filter(params.s_tc, localKill, "filterEnd", SC.forever)
      , SC.filter(params.s_mu, localKill, "filterEnd", SC.forever)
      , SC.filter(params.s_mm, localKill, "filterMove", SC.forever)
      , sustain
        )
      )
    );
  };
(function(){
const proto= SC_Button.prototype;
proto.filterStart= function(touch){
  const rx= this.x-touch.pageX;
  const ry= this.y-touch.pageY;
  const r= Math.sqrt(rx*rx+ry*ry);
  if(r<this.r){
    this.id= touch.id;
    return "zone1";
    }
  };
proto.inside= function(touch){
  const rx= this.x-touch.x;
  const ry= this.y-touch.y;
  const r= Math.sqrt(rx*rx+ry*ry);
  return r<this.r;
  };
proto.filterMove= function(touch){
  if(this.id!=touch.id){
    return;
    }
  const rx= this.x-touch.pageX;
  const ry= this.y-touch.pageY;
  const r= Math.sqrt(rx*rx+ry*ry);
  if(r>this.r){
    return "zone1";
    }
  };
proto.filterEnd= function(touch){
  if(touch.id==this.id){
    return "zone1";
    }
  };
proto.draw= function(ctx, view){
  if(this.hidden){ return; }
  const theCtx= ctx.save();
  ctx.strokeStyle= "black";
  ctx.fillStyle= this.bgcolor;
  ctx.beginPath();
  ctx.arc(this.x,this.y+this.offset,this.r, 0,2*Math.PI, false);
  ctx.fill();    
  ctx.arc(this.x,this.y+this.offset,this.r, 0,2*Math.PI, false);
  ctx.stroke();    
  ctx.closePath();
  ctx.restore(theCtx);
  };
})();
