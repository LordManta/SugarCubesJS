/*******
Letter
*******/
const the_FONT_BIG="64px Baskerville";
const the_FONT="24px Baskerville";

function Letter(msg, offset, finalPosEvt, eat, disp, ka){
  this.message= msg;
  this.l= msg.charAt(offset);
  this.offset= offset;
  this.x= Math.random()*(workspace.width-20)+10;
  this.y= Math.random()*(workspace.height-20)+10;
  this.font= "64px Baskerville";
  this.offsetX= this.offsetY= 0;
  this.color= null;
  this.bg_color= null;
  this.shadowEffect= { c: "rgba(255,255,0,0.3)", b: 0.5, x: 0, y: 0 };
  this.shX= 0;
  this.shY= 0
  this.shD= 0;
  this.fsD= 4;
  this.Evt_eat= eat;
  this.rotateIdx= 0;
  this.finalPosEvt= finalPosEvt;
  this.eaterMinSize= 24;
  this.eaten= false;
  this.realEater= { r: 0 }; 
/* --- Behavior --- */
  main.addProgram(
    SC.cube(this
    , SC.par(
        SC.seq(
          SC.kill(ka
          , SC.repeatForever(
              SC.test({ t: this, f: "eaten" }
              , SC.action("followEatersReactive")
              , SC.action("scanEatersReactive")
                )
              )
            )
        , SC.pause()
        , SC.action("resetAtEnd")
        , SC.pause()
        , SC.par(
            SC.actionOn({ config: this.finalPosEvt
                        , fun: "followHat", times: SC.forever })
          , SC.repeatForever(
              SC.action("glowingEffect")
            , SC.pause(3)
              )
          , SC.repeatForever(
              SC.action("sizingEffect")
            , SC.pause(Math.floor(Math.random()*5)+5)
              )
          , SC.repeatForever(
              SC.repeat(this.rotateData.length
              , SC.action("shakeEffect")
                )
            , SC.pause(Math.floor(Math.random()*10)+5)
              )
            )
          )
      , SC.generate(disp, this, SC.forever)
        )
      )
    );
/* ---  --- */
}
Letter.prototype.draw= function(ctx){
    const theCtx= ctx.save();
    ctx.fillStyle= this.color?this.color:"white";
    ctx.font= this.font;
    if(-1==this.offsetX){
      this.offsetX= ctx.measureText(this.message.substring(0, this.offset)).width;
      this.offsetY= 0;
      }
    if(0!=this.shD){
      ctx.shadowColor= this.shadowEffect.c;
      ctx.shadowBlur= this.shadowEffect.b;
      ctx.shadowOffsetX= this.shadowEffect.x;
      ctx.shadowOffsetY= this.shadowEffect.y;
      }
    const messageWidth= this.eaten?(ctx.measureText(this.message).width/2):0;
    if(0!=this.rotate){
      const tmp= ctx.measureText(this.l).width/2;
      ctx.translate(this.x+this.offsetX-messageWidth+tmp, this.y+this.offsetY);
      ctx.rotate(this.rotate);
      ctx.fillText(this.l, -tmp, 0);
      ctx.strokeText(this.l, -tmp, 0);
      }
    else{
      ctx.fillText(this.l, this.x+this.offsetX-messageWidth, this.y+this.offsetY);
      ctx.strokeText(this.l, this.x+this.offsetX-messageWidth, this.y+this.offsetY);
      }
    ctx.restore(theCtx);
    };
Letter.prototype.resetAtEnd= function(m){
    this.eaten= false;
    this.font= the_FONT_BIG;
    this.offsetX= this.offsetY= -1;
    this.realEater= { r: 0 };
    this.shD= 1;
    };
Letter.prototype.followHat= function(re){
    const pos= re.getValuesOf(this.finalPosEvt);
    for(var i in pos){
      this.x= pos[i].x;
      this.y= pos[i].y+40;
      }
    };
Letter.prototype.followEatersReactive= function(m){
    const data= m.getValuesOf(this.realEater.followEvent);
    if(data){
      const following = data[0];
      if(following.r<=this.eaterMinSize){
        this.font= the_FONT_BIG;
        this.realEater= { r: 0 };
        this.eaten= false;
        this.x+= Math.random()*10*this.offset;
        this.y+= Math.random()*10*this.offset;
        this.offsetX= this.offsetY= 0;
        }
      else{
        this.x= following.x;
        this.y= following.y;
        }
      }
    };
Letter.prototype.scanEatersReactive= function(m){
    const eaters= m.getValuesOf(this.Evt_eat);
    if(eaters){
      for(var i= 0; i<eaters.length; i++){
        const eater= eaters[i]
        const rx= this.x+32-eater.x;
        const ry= this.y-32-eater.y;
        const r= Math.sqrt(rx*rx+ry*ry);
        if((r<eater.r+5) && (this.realEater.r<eater.r)
             && (eater.r>this.eaterMinSize)){
          this.realEater= eater;
          this.offsetX= -1;
          this.offsetY= -1;
          if(null==this.color){
            this.color= this.realEater.color;
            }
          }
        }
      }
    this.eaten= this.realEater.r>this.eaterMinSize;
    this.font= this.eaten?the_FONT:the_FONT_BIG;
    };
Letter.prototype.offsetShadow = [-3,-2,-1,0,1,2,3];
Letter.prototype.glowingEffect= function(){
    const l= this.offsetShadow.length;
    switch(this.shD){
      case 1:{
        this.shX++;
        if(l<=this.shX){
          this.shX= l-1;
          this.shD= 2;
          }
        break;
        }
      case 2:{
        this.shY++;
        if(l<=this.shY){
          this.shY= l-1;
          this.shD= -1;
          }
        break;
        }
      case -1:{
        this.shX--;
        if(0>this.shX){
          this.shX= 0;
          this.shD= -2;
          }
        break;
        }
      case -2:{
        this.shY--;
        if(0>this.shY){
          this.shY= 0;
          this.shD= 1;
          }
        break;
        }
      default: return;
      }
    this.shadowEffect.x=this.offsetShadow[this.shX];
    this.shadowEffect.y=this.offsetShadow[this.shY];
    };
Letter.prototype.sizingData=[56,57,58,59,60,61,62,63,64,63,62,61,60,59,58,57,56];
Letter.prototype.sizingEffect= function(){
    this.fsD= (this.fsD+1)%this.sizingData.length;
    this.font= ""+this.sizingData[this.fsD]+"px Baskerville";
    };
Letter.prototype.rotateData= [ 0, -Math.PI/16, -Math.PI/8
                             , -Math.PI/16, 0, Math.PI/16
                             , Math.PI/8, Math.PI/16 ];
Letter.prototype.shakeEffect= function(){
    this.rotateIdx= (this.rotateIdx+1)%this.rotateData.length;
    this.rotate= this.rotateData[this.rotateIdx];
    };
