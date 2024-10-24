/*
 * SC_Barque.js
 * Author: Jean-Ferdy Susini
 * Created: 16/01/2015 23:52
 * version: 0.1 alpha
 * implantation: 0.1
 * Copyleft 2015-2024.
 */

(function(){
var BarqueFactory= {
    counter: 0
  , params: { x: 400, y: 420, sII: 0, sFIx: 0, sFIy: 1 }
    };
BarqueFactory.params.sIA= [ new Image(128, 128) ];
BarqueFactory.params.sIA[0].src= "SCwar/barque.png";
BarqueFactory.params.sIM= [ { x: 1, y: 2 } ];
BarqueFactory.params.sIO= [ { x: 0, y: 0 } ];

function SC_Barque(appearance, dir){
  this.appearance= appearance;
  this.pos= new Point2D(this.appearance.pos.x, this.appearance.pos.y);
  this.active= false
  this.dir= Math.abs(dir);
  this.Evt_followMe= SC.evt("followMe");
  this.jump= { x: this.dir*50 };
  this.startMove= false;
  if(0>dir){
    this.reverse();
    }
  };

const proto= SC_Barque.prototype;
proto.Act_updatePosObject= function(re){
    this.appearance.pos.from(this.pos);
    };
proto.Act_init= function(re){
    this.appearance.setSpriteImage(0);
    };
proto.Act_isInPOI= function(re){
    const { x: px, y: py }= this.pos;
    const data= re.getValuesOf(Evt_graphicPOI);
    if(data){
      const { x: tx, y: ty }= data[0];
      const rx= tx-px;
      const ry= ty-py;
      const r= Math.sqrt(rx*rx+ry*ry);
      this.active= r<1024;
      }
    };
proto.move= function(){
    this.pos.x+= this.dir;
    };
proto.reverse= function(){
    this.dir= -this.dir;
    this.jump.x= this.dir*70;
    this.appearance.nextSpriteInY();
    };
proto.toString= function(){
    return "barque_"+this.id;
    };
proto.inside= function(x,y){
  const sIA0= this.appearance.sIA[0]
  const p0x= this.pos.x-sIA0.width/2;
  const p0y= this.pos.y-sIA0.height/2;
  const p1x= this.pos.x+sIA0.width/2;
  const p1y= this.pos.y+sIA0.height/2;
  return (p0x<x) && (x<p1x) && (p0y<y) && (y<p1y);
  };
proto.Act_isMe= function(re){
    const data= re.getValuesOf(Evt_onBoard);
    if(data){
      const pos= data[0];
      this.startMove= this.inside(pos.x, pos.y);
      }
    };

window.makeBarque= function(x, y, dir, wd, time){
  BarqueFactory.params.wd= wd;
  BarqueFactory.params.dir= dir;
  const appearance= new SC_sprite(BarqueFactory.params);
  const barque= new SC_Barque(appearance, dir);
  barque.pos.x= x;
  barque.pos.y= y;
  barque.id=BarqueFactory.counter++;
  SC.tools.addProgram(
    SC.cube(barque
    , SC.par(
        SC.nothing()
      , SC.action("Act_updatePosObject", SC.forever)
      , SC.generate(Evt_requestDisplayLvl2, barque.appearance, SC.forever)
      , SC.actionOn({ config: Evt_graphicPOI, fun: "Act_isInPOI", times: SC.forever })
      , SC.repeatForever(
          SC.test(SC.my("active")
          , SC.seq(SC.nop("here"), SC.generate(Evt_barqueIsHere, barque))
            )
          )
      , SC.repeatForever(
          SC.await(Evt_onBoard)
        , SC.actionOn(Evt_onBoard, "Act_isMe")
        , SC.pause()
        , SC.test(SC.my("startMove")
          , SC.seq(
              SC.generate(Sound_captainOnBridge.Evt_play)
            , SC.repeat(time
              , SC.action("move")
              , SC.generate("Evt_followMe", SC.my("pos"))
                )
            , SC.pause()
            , SC.generate(Evt_getDown, barque.jump)
            , SC.pause()
            , SC.action("reverse")
              )
            )
          )
        )
    , {
        life: {
            init: barque.Act_init
            }
        }
      )
    );
  return barque;
  };

})();
