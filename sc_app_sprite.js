/*
 * SC_sprite.js
 * Author : Jean-Ferdy Susini
 * Created : 15/12/2014 0:06 AM
 * version : 0.1 alpha
 * implantation : 0.1
 * Copyleft 2014-2024.
 */

function SC_sprite(p){
  const param= SC.$(p);
  var errors= "";
  if(undefined==param.sIA){
    errors+= "SC_sprite : sIA parameter must be provided (images) !\n";
    }
  if(undefined==param.sIM){
    errors+= "SC_sprite : sIM parameter must be provided (numbers of tiles"
              +"in x and y for each images) !\n";
    }
  if(undefined==param.sIO){
     errors+= "SC_sprite : sIO parameter must be provided (tiles"
              +"offsets in x and y for each images) !\n";
    }
  if(errors!=""){
    throw new Error(errors);
    }
  this.sIA= param.sIA;
  this.sIM= param.sIM;
  this.sIO= param.sIO;
  this.sII= param._('sII', 0);
  this.sFIx= param._('sFIx', 0);
  this.sFIy= param._('sFIy', 0);
  // À modifier utilise workspace comme globale
  this.pos= new Point2D(param._('x', Math.random()*workspace.width)
                      , param._('y', Math.random()*workspace.height));
  this.setSpriteImage(this.sII);
  this.worldDim= param._("wd");
  //this.r= new Point2D(this.x, this.y);
}

(function(){
const proto= SC_sprite.prototype;
proto.setSpriteImageOffsets= function(){
    this.cSIOx= this.sIO[this.sII].x;
    if(undefined==this.cSIOx){
      this.cSIOx=0;
      }
    this.cSIOy= this.sIO[this.sII].y;
    if(undefined==this.cSIOy){
      this.cSIOy= 0;
      }
    };
proto.setSpriteWidthAndHeight= function(){
    this.sw= this.img.width/this.sIM[this.sII].x;
    this.sh= this.img.height/this.sIM[this.sII].y;
    };
proto.setSpritePosInX= function(x){
    this.sFIx= (x)%(this.sIM[this.sII].x);
    };
proto.nextSpriteInX= function(){
    this.setSpritePosInX(this.sFIx+1);
    };
proto.setSpritePosInY= function(y){
    this.sFIy= (y)%(this.sIM[this.sII].y);
    if(this.sFIy<0){
      console.warn("this.sFIy", this.sFIy, y);
      debugger;
      }
    };
proto.nextSpriteInY= function(){
    this.setSpritePosInY(this.sFIy+1);
    };
proto.setSpriteImage= function(phase){
    this.sII= (phase)%(this.sIA.length);
    this.img= this.sIA[this.sII];
    this.setSpriteWidthAndHeight();
    this.setSpriteImageOffsets();
    };
proto.nextSpriteImage= function(){
    this.setSpriteImage(this.sII+1);
    };
proto.draw= function(ctx, view){
    const { x, y, w: cw, h: ch }= view;
    const { x: px, y: py }= this.pos;
    const theCtx= ctx.save();
    ctx.translate(px-x, py-y);
    const sw= this.sw;
    const sh= this.sh;
    ctx.drawImage(this.img
                  , this.sFIx*sw, this.sFIy*sh, sw, sh
                  , -sw/2+this.cSIOx, -sh/2+this.cSIOy, sw, sh);
    ctx.restore(theCtx);
    };
})();
