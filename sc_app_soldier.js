/*
 * SC_Soldier.js
 * Author : Jean-Ferdy Susini
 * Created : 01/01/2015 14:06
 * version : 0.1 alpha
 * implantation : 0.2
 * Copyright 2015-2024.
 */
(function(){
/*
L'objet sprite permet de gérer un sprite à partir de plusieurs images disposées
en matrices. En general, Une image -> un type d'animation. L'axe horizontal de
la matrice => animation.
L'axe versitcal permet de choisir un direction (essentiellement 3D iso). Dans
cette démo on mélange tout : 2D classique 3D iso ... c'est laid mais on s'en
fout :DDD
*/
const STATE_PAUSE= 0;
const STATE_RUN= 1;
const STATE_HIT= 2;
const STATE_SAIL= 3;

const soldierImagesFiles= [
    { src: "SCwar/SoldierStand.png", w: 100, h: 288 }
  , { src: "SCwar/SoldierRun.png", w: 576, h: 320 }
  , { src: "SCwar/SoldierDef.png", w: 102, h: 272 }
  , { src: "SCwar/SoldierAttack.png", w: 784, h: 408 }
  , { src: "SCwar/SoldierDeath.png", w: 656, h: 416 }
  , { src: "SCwar/SoldierDecay.png", w: 62, h: 256 }
    ];
const soldierImages= new Array(soldierImagesFiles.length);
for(var v in soldierImagesFiles){
  const data= soldierImagesFiles[v];
  soldierImages[v]= new Image(data.w, data.h);
  soldierImages[v].src= data.src;
  }
const soldierMatrix= [
    { x: 2, y: 8 }
  , { x: 12, y: 8 }
  , { x: 2, y: 8 }
  , { x: 8, y: 8 }
  , { x: 8, y: 8 }
  , { x: 1, y: 8 }
    ];
const soldierOffsets= [
    { x: 0, y: 0 }
  , { x: 0, y: 0 }
  , { x: 0, y: 0 }
  , { x: 0, y: 0 }
  , { x: 0, y: 0 }
  , { x: 0, y: 0 }
    ];
const sec1= Math.cos(Math.PI/8);
const sec2= Math.cos(Math.PI/4);
const _internal_dir = [ 3, 4, 5, 2, -1, 6, 1, 0, 7 ];
Object.freeze(_internal_dir);
const _internal_cell_idx = [
     [{x:-1,y:0},{x:0,y:-1}]
     , [{x:-1,y:-1},{x:-1,y:1}]
     , [{x:-1,y:0},{x:0,y:1}]
     , [{x:-1,y:-1},{x:1,y:-1}]
     , undefined, [{x:-1,y:1},{x:1,y:1}]
     , [{x:1,y:0},{x:0,y:-1}]
     , [{x:1,y:-1},{x:1,y:1}]
     , [{x:1,y:0},{x:0,y:1}] ];
Object.freeze(_internal_cell_idx);
const dir= function(x,y){
    return _internal_dir[(x+1)*3+y+1];
    };
const getCheckCell= function(x,y){
    return _internal_cell_idx[(x+1)*3+y+1];
    };

function SC_Target(x, y, sx, sy, dx, dy, visc){
  this.x= x;
  this.y= y;
  this.sx= sx;
  this.sy= sy;
  this.dx= dx;
  this.dy= dy;
  this.visc= visc;
  this.count= 0;
  };
(function(){
const proto=SC_Target.prototype;
proto.toString= function(){
    return `sc_target: { x: ${this.x}, y: ${this.y}, count: ${this.count} }`;
    };
proto.__proto__= Point2D.prototype;
})();

/*
sprite.js doit-être chargé avant.
SC_Soldier est exposé globalement.
*/
window.SC_Soldier= function(name, init_x, init_y, world
                          , cancelObjective= SC.evt("cancelObjective")){
  this.appearance= new SC_sprite({
      sIA: soldierImages
    , sIM: soldierMatrix
    , sIO: soldierOffsets
    , sII: 0
    , sFIx: 0
    , sFIy: 0
    , x: init_x //6800//2799
    , y: init_y //1300//15
    , wd: new Point2D(world.width*world.tileWidth
                    , world.height*world.tileHeight)
      });
  this.pos= new Point2D(init_x, init_y);
  this.cell= new Point2D(0, 0);
  this.action= 0;
  this.goPoint= new Point2D(this.pos.x, this.pos.y);
  this.Evt_attack= SC.evt("attack");
  this.Evt_changeAnim= SC.evt("changeAnim");
  this.Evt_moveComplete= SC.evt("moveComplete");
  this.Evt_moveSkip= SC.evt("moveSkip");
  this.Evt_moveCancel= SC.evt("moveCancel");
  this.Evt_resetMove= SC.evt("resetMove");
  this.poi= new Point2D(this.pos.x, this.pos.y);
  this.poi.cw= workspace.width;
  this.poi.ch= workspace.height;
  this.boardingPoint= new Point2D(this.pos.x, this.pos.y);
  this.speed= 2;
  this.name= name;
  this.speedAnim= 0;
  this.world= world;
  this.cancelObjective = cancelObjective;
  this.nextTarget= null;
/* --- Behavior --- */
SC.tools.addProgram(
  SC.cube(this
  , SC.par(SC.nop()
    , SC.repeatForever(
        SC.whileRepeat(SC.my("free")
        , SC.await(Evt_barqueIsHere)
        , SC.action("Act_checkBoarding")
          )
      , SC.generate("Evt_changeAnim")
      , SC.generate("Evt_moveCancel")
      , SC.action("Act_cancelMove")
      , SC.pause()
      , SC.await(Evt_getDown)
      , SC.action("Act_jumpOnGround")
      , SC.generate("Evt_changeAnim")
      , SC.generate(Sound_ayeCaptain.Evt_play)
        )
    , SC.repeatForever(
        SC.action("Act_updatePOI")
      , SC.pause()
      , SC.generate(Evt_graphicPOI, SC.my("poi"))
        )
    , SC.repeatForever(
        SC.await(Evt_attack)
      , SC.action("Act_checkAttack")
      , SC.generate("Evt_changeAnim")
      , SC.generate(Sound_slash.Evt_play)
      , SC.pause(5)
      , SC.generate(Sound_clang.Evt_play)
      , SC.pause(30)
      , SC.action("Act_endsHit")
      , SC.generate("Evt_changeAnim")
        )
    , SC.resetOn("Evt_resetMove"
      , SC.par(
          SC.actionOn({ config: Evt_moveOrder, fun: "Act_checkMove", times: SC.forever })
        , SC.seq(SC.await("Evt_moveCancel"), SC.generate("Evt_moveComplete"))
        , SC.seq(
	    SC.kill("Evt_moveSkip"
	    , SC.seq(
                SC.kill("Evt_moveComplete"
		, SC.seq(
                    SC.await(Evt_moveOrder)
                  , SC.generate(Sound_alright.Evt_play)
                  , SC.generate("Evt_changeAnim")
                  , SC.action("Act_moveTowardGoTarget", SC.forever)
		    )
                  )
              //, SC.generate(Sound_workComplete.Evt_play)
              , SC.generate("Evt_changeAnim")
                )
	      )
          , SC.generate(Evt_workCompleted)
          , SC.generate("Evt_resetMove")
            )
          )
        )
    , SC.resetOn(SC.my("Evt_changeAnim")
      , SC.seq(
          SC.match(SC.my("action")
          , SC.seq(SC.action("Act_setPauseMode"))
          , SC.seq(SC.action("Act_setRunMode"))
          , SC.seq(SC.action("Act_setAttackMode"))
          , SC.seq(SC.action("Act_setTransportMode"))
            )
        , SC.par(
            SC.repeatForever(
              SC.pause(4)
            , SC.action("Act_nextSprite")
              )
          , SC.generate(Evt_requestDisplayLvl3, this, SC.forever)
          , SC.action("Act_updatePosView", SC.forever)
            )
          )
        )
      )
    )
  );
/* --- --- */
  };

const proto= SC_Soldier.prototype;
proto.free= true;
proto.toString= function(){
    return "soldier "+this.name;
    };
proto.draw= function(ctx, view){
    this.appearance.draw(ctx, view);
    };
proto.Act_nextSprite= function(re){
    this.appearance.nextSpriteInX();
    };
proto.Act_updatePosView= function(re){
    this.appearance.pos.from(this.pos);
    };
proto.Act_setPauseMode= function(re){
    this.appearance.setSpriteImage(0);
    };
proto.Act_setRunMode= function(re){
    this.appearance.setSpriteImage(1);
    };
proto.Act_setAttackMode= function(re){
    this.appearance.setSpriteImage(3);
    };
proto.Act_setTransportMode= function(re){
    this.appearance.setSpriteImage(0);
    };
proto.Act_updatePOI= function(re){
    this.poi.from(this.pos);
    };
proto.Act_endsHit= function(re){
    this.action= this.oldAction;
    };
proto.Act_checkAttack= function(re){
    this.oldAction= this.action;
    this.action= STATE_HIT;
    };
proto.Act_follow= function(evt, re){
    const data= re.getValuesOf(evt);
    this.pos.from(data[0]);
    };
proto.Act_trace= function(msg, re){
    console.log(re.getInstantNumber()+": "+msg);
    };
proto.Act_jumpOnGround= function(re){
    const data= re.getValuesOf(Evt_getDown);
    const jump= data[0];
    this.free= true;
    this.pos.x+= jump.x;
    this.action= STATE_PAUSE;
    };
proto.Act_checkBoarding= function(re){
    const data= re.getValuesOf(Evt_barqueIsHere);
    if(data){
      for(const barque of data){
        if(barque.inside(this.pos.x, this.pos.y)){
          if(STATE_SAIL!=this.action){
            this.free= false;
            this.action= STATE_SAIL;
            re.addEntry(Evt_onBoard, this.boardingPoint.from(this.pos));
            re.addEntry(this.SC_cubeAddBehaviorEvt
            , SC.kill(this.Evt_moveCancel
              , SC.actionOn({ config: barque.Evt_followMe
                            , fun: this.Act_follow.bind(this, barque.Evt_followMe)
                            , times: SC.forever })
                )
              );
            }
          break;
          }
        }
      }
    };
proto.Act_checkMove= function(re){
    if(STATE_SAIL==this.action){
      re.addEntry(this.Evt_moveSkip);
      this.nextTarget= null;
      }
    else{
      const data= re.getValuesOf(Evt_moveOrder);
      this.goPoint.from(data[0]);
      this.nextTarget= null;
      this.action= STATE_RUN;
      }
    };
proto.readPassabilityOn= function(x, y){
    const world= this.world;
    const res= world.passmap[y*world.width+x];
    return res;
    };
proto.getCurrrentVisc= function(){
    this.cell.x= Math.floor(this.pos.x/this.world.tileWidth);
    this.cell.y= Math.floor(this.pos.y/this.world.tileHeight);
    const visc= this.readPassabilityOn(this.cell.x, this.cell.y);
    switch(visc){
      case 1 : this.speedAnim= 0; break;
      case 1.5 : this.speedAnim= 1; break;
      default : this.speedAnim= 2; break;
      }
    return visc;
    }
proto.getNextTarget= function(sx, sy){
    var min= this.readPassabilityOn(this.cell.x+sx,this.cell.y+sy);
    var tmpCell= new SC_Target(this.cell.x+sx, this.cell.y+sy, sx, sy);
    if(min>1){
      const test= getCheckCell(sx, sy);
      var tmp= this.readPassabilityOn(this.cell.x+test[0].x
                                                 ,this.cell.y+test[0].y);
      if(tmp<min){
        min= tmp;
        tmpCell.sx= test[0].x;
        tmpCell.sy= test[0].y;
        tmpCell.x= this.cell.x+test[0].x;
        tmpCell.y= this.cell.y+test[0].y;
        }
      tmp= this.readPassabilityOn(this.cell.x+test[1].x
                                                , this.cell.y+test[1].y);
      if(tmp<min){
        min= tmp;
        tmpCell.sx= test[1].x;
        tmpCell.sy= test[1].y;
        tmpCell.x= this.cell.x+test[1].x;
        tmpCell.y= this.cell.y+test[1].y;
        }
      }
    if(10<min){
      tmpCell.sx= tmpCell.sy= 0;
      tmpCell.x= this.cell.x;
      tmpCell.y= this.cell.y;
    }
    this.nextTarget= tmpCell;
    };
proto.Act_cancelMove= function(re){
    this.nextTarget= null;
    this.goPoint.from(this.pos);
    };
proto.Act_moveTowardGoTarget= function(re){
    if(STATE_HIT==this.action){
      return;
      }
    if(STATE_SAIL==this.action){
      re.addEntry(this.Evt_moveComplete);
      this.nextTarget= null;
      return;
      }
    const px= this.pos.x;
    const py= this.pos.y;
    const rx= this.goPoint.x-px;
    const ry= this.goPoint.y-py;
    const r= Math.sqrt(rx*rx+ry*ry);
    if(0==r){ return; }
    var visc= this.getCurrrentVisc();
    if(r<=this.speed/visc){
      this.pos.from(this.goPoint);
      this.nextTarget= null;
      re.addEntry(this.Evt_moveComplete);
      this.action= STATE_PAUSE;
      return;
      }
    var dx= 0;
    var dy= 0;
    var sx= 0;
    var sy= 0;
    if(undefined==this.nextTarget){
      const tx= rx/r;
      const ty= ry/r;
      if(tx>sec1){
        sx= 1; dx= this.speed;
        }
      else if(tx<-sec1){
        sx = -1; dx = -this.speed;
        }
      else if(ty>sec1){
        sy= 1; dy= this.speed;
        }
      else if(ty<-sec1){
        sy= -1; dy= -this.speed;
        }
      else{
        sx= (0<tx)?1:-1;
        sy= (0<ty)?1:-1;
        dx= sx*this.speed*sec2;
        dy= sy*this.speed*sec2;
        if((0==sx) || (0==sy)){
          throw new Error("sx ("+sx+") or sy("+sy+") ar null ...");
          }
        }
      if(r>24){
        this.getNextTarget(sx,sy);
        sx= this.nextTarget.sx;
        sy= this.nextTarget.sy;
        const mult= ((sx!=0) && (sy!=0))?sec2:1;
        this.nextTarget.dx= sx*this.speed*mult;
        this.nextTarget.dy= sy*this.speed*mult;
        const rpx= (this.cell.x+sx+0.5)*this.world.tileWidth-this.pos.x;
        const rpy= (this.cell.y+sy+0.5)*this.world.tileHeight-this.pos.y;
        const rp= Math.sqrt(rpx*rpx+rpy*rpy);
        this.nextTarget.count= Math.floor(rp/this.speed*visc);
        this.nextTarget.visc= visc;
        }
      this.pos.x+= dx/visc;
      this.pos.y+= dy/visc;
      }
    else{
      dx= this.nextTarget.dx;
      dy= this.nextTarget.dy;
      sx= this.nextTarget.sx;
      sy= this.nextTarget.sy;
      this.nextTarget.count--;
      visc= this.nextTarget.visc;
      if(0>=this.nextTarget.count){
        this.pos.x= (this.nextTarget.x+0.5)*this.world.tileWidth;
        this.pos.y= (this.nextTarget.y+0.5)*this.world.tileHeight;
        this.nextTarget = null;
        }
      else{
        this.pos.x+= dx/visc;
        this.pos.y+= dy/visc;
        }
      }
    var tmp= dir(sx, sy);
    if(-1!=tmp){
      this.appearance.setSpritePosInY(tmp);
      }
    };
})();
