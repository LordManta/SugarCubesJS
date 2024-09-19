/*******
Bubble
One uses cubes to declare reactive objects. There are many possibilities to do
this. But in this demo one opts for an immediate addition of the cubes in the
main clock when creating objects.
*******/
const the_SQRT2=Math.sqrt(2);

function Bubble(params){
  if(undefined==params){
    params= {};
    }
  const _= function(name, defaultVal){
    return (this[name])?this[name]:defaultVal;
    }.bind(params);
  this.vx= _("vx", Math.random()*4-2);
  this.vy= _("vy", Math.random()*4-2);
  this.split= false;
  const r= _("r", Math.random()*35+5);
  SC.addCell(this, "x", _("x", Math.random()*(workspace.width-2*r)+r)
           , []
           , function(v, m){
               return v+this.vx;
               });
  SC.addCell(this, "y", _("y", Math.random()*(workspace.height-2*r)+r)
           , []
           , function(v, m){
               return v+this.vy;
               });
  SC.addCell(this, "r", r
           , [ params.col ]);
  this.color= _("c", "rgba("+Math.floor(Math.random()*255)
                 +","+Math.floor(Math.random()*255)
                 +","+Math.floor(Math.random()*255)
                 +","+Math.random()
                 +")")
               ;
  this.colorCircle= "black";
  this.shouldDie= false;
  this.Evt_col= params.col;
  this.Evt_disp= params.disp;
  this.Evt_ba= params.ba;
  this.Evt_fatter= params.fat;
  this.Evt_eat= params.eat;
  this.Evt_ka= params.ka;
  this.Sens_ts= params.sts;
  this.Sens_md= params.smd;
  this.area= {};
  Object.defineProperty(this.area, "r"
      , { get: function(){ const r=this.r; return r*r; }.bind(this) });
  this.collidon= {};
  Object.defineProperty(this.collidon, "x"
      , { get: function(){ return this.x; }.bind(this) });
  Object.defineProperty(this.collidon, "y"
      , { get: function(){ return this.y; }.bind(this) });
  Object.defineProperty(this.collidon, "r"
      , { get: function(){ return this.r; }.bind(this) });
  this.eater= {};
  Object.defineProperty(this.eater, "x"
      , { get: function(){ return this.x; }.bind(this) });
  Object.defineProperty(this.eater, "y"
      , { get: function(){ return this.y; }.bind(this) });
  Object.defineProperty(this.eater, "r"
      , { get: function(){ return this.r; }.bind(this) });
  Object.defineProperty(this.eater, "color"
      , { value: this.color, writable: false });
  Object.defineProperty(this.eater, "followEvent"
      , { value: SC.evt("follow"), writable: false });
  this.follower= {};
  Object.defineProperty(this.follower, "x"
      , { get: function(){ return this.x; }.bind(this) });
  Object.defineProperty(this.follower, "y"
      , { get: function(){ return this.y; }.bind(this) });
  Object.defineProperty(this.follower, "r"
      , { get: function(){ return this.r; }.bind(this) });
  Object.defineProperty(this.follower, "eatingEvent"
      , { value: SC.evt("eating"), writable: false });
  this.hasHat= false;
/* --- Behavior --- */
/*
All those objects are killed when the pay-predator phase ends.
*/
  main.addProgram(
    SC.kill(params.ka
    , SC.cube(this
      , SC.par(
/*
Checking for bouncing on border of the workspace at each instants.
*/
          SC.action("bounce", SC.forever)
/*
Updating main shared informations which are stored as SugarCubes cells, ie:
  - x and y positions which are simply updated according to the current
    velocity : vx, vy.
  - r which is updated by the collision detection algorithm. At each instant,
    one looks at the collidon event to discover other bubbles and the update
    the diameter of the current bubble, based on neighbour which are eaten (if
    smaller) or are eating (if greater).
*/
        , SC.repeatForever(this.$_scc_r, this.$_scc_x, this.$_scc_y)
/*
In parallel one checks user interaction to see if bubble is clicked and so
split it in two.
*/
        , SC.actionOn({ config: SC.or(params.smd, params.sts)
                    , fun: "splitSelf", times: SC.forever })
/*
In parallel one checks if the current bubble is too small and so dies.
*/
        , SC.repeatForever(
            SC.test({ t: this, f: "shouldDie" }
              , SC.seq(SC.killSelf(), SC.log("terminates ?"))
              )
            )
/*
One emits in parallel at each instants various events :
 - collision: to inform others where I am and what is my radius
 - bubleArea: to inform the area I use
 - requestDisplay: to inform canvas cube (called the workspace) that I need to
   be drawn.
 - eater: to inform other objets that I am here so I can eat every letter or
   hat in that area.
 - eater.followEvent: eaten objects then should follow this event to update
   their positions.
*/
        , SC.generate(this.Evt_col, SC.my("collidon"), SC.forever)
        , SC.generate(params.ba, SC.my("area"), SC.forever)
        , SC.generate(params.disp, this, SC.forever)
        , SC.generate(params.eat, this.eater, SC.forever)
        , SC.generate(this.eater.followEvent, this.follower, SC.forever)
/*
Finally this action 
*/
        , SC.actionOn({ config: params.fat, fun: "modifyAppear", times: SC.forever})
          )
        )
      )
    );
/* --- --- */
}

Bubble.prototype.draw= function(ctx){
    const tmp_ss= ctx.fillStyle;
    const tmp_fs= ctx.strokeStyle;
    ctx.strokeStyle= this.colorCircle;
    ctx.fillStyle= this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI, false);
    ctx.fill();    
    ctx.stroke();    
    ctx.closePath();
    ctx.strokeStyle= tmp_ss;
    ctx.fillStyle= tmp_fs;
    };
Bubble.prototype.bounce= function(m){
    if(((this.x<this.r) && (this.vx<0))
      || ((this.x>workspace.width-this.r) && (this.vx>0))){
      this.vx= -this.vx;
      }
    if(((this.y<this.r) && (this.vy<0))
     || ((this.y>workspace.height-this.r) && (this.vy>0))){
      this.vy= -this.vy;
      }
    };
Bubble.prototype.splitSelf= function(m){
    var val= m.sensorValueOf(this.Sens_md);
    if(!val){/* on a pas de mousedown on essai touchstart */
      val= m.sensorValueOf(this.Sens_ts);
      }
    const rx= this.x-val.offsetX;
    const ry= this.y-val.offsetY;
    const r=Math.sqrt(rx*rx+ry*ry);
    if(r<this.r){
      const nr= this.r/the_SQRT2;
      const sr= Math.sqrt(this.vx*this.vx+this.vy*this.vy);
      const a= (Math.asin(this.vy/sr)>0?1:-1)*Math.acos(this.vx/sr);
      new Bubble({ r: nr, c: this.color, vx: this.vy, vy: -this.vx
                , x: this.x+(this.r+nr+5)*Math.cos(a), y: this.y+(this.r+nr+5)*Math.sin(a)
		, fat: this.Evt_fatter
		, sts: this.Sens_ts
                , smd: this.Sens_md
		, disp: this.Evt_disp
		, ba: this.Evt_ba
		, col: this.Evt_col
		, eat: this.Evt_eat
		, ka: this.Evt_ka
		  });
      this.split= true;
      }
    };
Bubble.prototype.modifyAppear= function(m){
    const val= m.getValuesOf(this.Evt_fatter)[0].r;
    this.colorCircle= (val>this.r)?"blue"
                      :((val<this.r)?"red":"black");
    };
Bubble.prototype._scc_r= function(v, m){
    const group= m.getValuesOf(this.Evt_col);
    var fres= v;
    for(var i= 0; i<group.length; i++){
      const other= group[i]
      if(this.collidon==other){ continue; }
      const rx= this.x-other.x;
      const ry = this.y-other.y;
      const r= Math.sqrt(rx*rx+ry*ry);
      const dr= r-(v+other.r);
      if(dr<0){
        const or= other.r;
        if(v==or){ continue; }
        const comp=v<or;
        const R= comp?or:v;
        const r= comp?v:or;
        const delta= R*R+2*r-1; 
        const res= fres+(comp?-1:Math.sqrt(delta)-R);
        if(res<1){
          this.shouldDie=true;
          return 0;
          }
        fres=res
        }
      }
    if(this.split){
      this.split= false;
      fres/= the_SQRT2;
      }
    return fres;
    };

