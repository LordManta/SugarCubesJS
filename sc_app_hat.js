/*******
 * Hat
 *******/
const the_NO_EVENT=SC.evt(" ");

function Hat(params){
  this.x= Math.random()*(workspace.width-64)+32;
  this.y= Math.random()*(workspace.height-64)+32;
  this.eaten= false;
  this.eaterMinSize= 30;
  this.Evt_eat= params.eat;
  this.realEater= { x: 0, y: 0, r: 0, followEvent: null };
  this.eating= the_NO_EVENT;
  this.finalPosEvt= params.fin;
  this.finalPos= { x: this.x, y: this.y };
  this.rotate= 0;
  this.r= 32;
  this.clicked= false;
  this.taille= { r: 0 };
  this.Sens_tm= params.stm;
  this.Sens_mm= params.smm;
/* --- Behavior --- */
  main.addProgram(
    SC.cube(this
    , SC.par(
        SC.generate(params.disp, this, SC.forever)
      , SC.seq(
          SC.generate(params.ml, "Blizzard")
        , SC.await(params.mld)
        , SC.pause()
        , SC.generate(params.mp)
        , SC.kill(params.ka
          , SC.par(
              SC.repeatForever(
                SC.test({ t: this, f: "eaten" }
                , SC.seq(
                    SC.action("followingRealEaterReactive")
                  , SC.generate(params.fat, this.taille)
                    )
                , SC.action("scanEatersReactive")
                  )
                )
            , SC.repeatForever(
                SC.await(params.med)
              , SC.generate(params.mp)
                )
              )
            )
        , SC.action("resetAfterBubles")
        , SC.generate(params.ml, "JingleBells")
        , SC.await(params.mld)
        , SC.pause()
        , SC.generate(params.mp)
        , SC.par(
            SC.repeatForever(
              SC.action("updateFinalPos")
            , SC.generate(this.finalPosEvt, this.finalPos)
              )
          , SC.repeatForever(
              SC.await(SC.or(params.smd, params.sts))
            , SC.kill(SC.or(params.ste, params.smu, params.stc)
              , SC.actionOn({ config: SC.or(params.stm, params.smm)
                          , fun: "mouseControlReactive"
                          , times: SC.forever }))
            , SC.pause()
            , SC.action("unClicked")
              )
            )
          )
        )
      )
    );
/* --- --- */
  };
Hat.prototype.draw= function(ctx){
    if(0!=this.rotate){
      ctx.translate(this.x, this.y-this.realEater.r);
      ctx.rotate(this.rotate);
      ctx.drawImage(image, -32, -32, 64, 64);
      ctx.rotate(-this.rotate);
      ctx.translate(-this.x, -this.y+this.realEater.r);
      }
    else{
      ctx.drawImage(image, this.x-32, this.y-32-this.taille.r, 64, 64);
      }
    };
Hat.prototype.scanEatersReactive= function(m){
    const eaters= m.getValuesOf(this.Evt_eat);
    if(eaters){
      for(var i= 0; i<eaters.length; i++){
        const eater= eaters[i];
        var rx= this.x-eater.x;
        var ry= this.y-eater.y;
        var r= Math.sqrt(rx*rx+ry*ry);
        if((r<eater.r) && (this.realEater.r<eater.r)
             && (eater.r>this.eaterMinSize)){
          this.realEater.x= eater.x;
          this.realEater.y= eater.y;
          this.realEater.r= eater.r;
          this.realEater.followEvent= eater.followEvent;
          }
        }
      this.eaten= this.realEater.r>1;
      }
    };
Hat.prototype.followingRealEaterReactive= function(m){
    const data= m.getValuesOf(this.realEater.followEvent);
    if(data){
      following= data[0];
      this.x= following.x;
      this.y= following.y;
      this.taille.r= following.r;
      this.eating= following.eatingEvent;
      if(following.r<=this.eaterMinSize){
        this.realEater.r= 0;
        this.taille.r= 0;
        this.eaten= false;
        this.eating= the_NO_EVENT;
        }
      }
    };
Hat.prototype.resetAfterBubles= function(){
    this.x= Math.min(Math.max(this.x, 32), workspace.width-32);
    this.y= Math.min(Math.max(this.y, 32), workspace.height-32);
    this.finalPos.x= this.x;
    this.finalPos.y= this.y;
    this.rotate= -Math.PI/8;
    this.realEater.r= 0;
    this.eating= the_NO_EVENT;
    };
Hat.prototype.updateFinalPos= function(m){
    this.finalPos.x= this.x;
    this.finalPos.y= this.y;
    };
Hat.prototype.mouseControlReactive= function(m){
    const val= m.sensorValueOf(m.presenceOf(this.Sens_mm)?this.Sens_mm:this.Sens_tm);
    const rx= this.x-(val.offsetX);
    const ry= this.y-(val.offsetY);
    if(this.clicked || (Math.sqrt(rx*rx+ry*ry)<this.r)){
      this.clicked= true;
      this.x= val.offsetX;
      this.y= val.offsetY;
      }
    };
Hat.prototype.unClicked=function(m){
    this.clicked= false;
    };
