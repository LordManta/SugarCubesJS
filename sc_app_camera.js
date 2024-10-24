/*
 * SC_Camera.js
 * Author: Jean-Ferdy Susini
 * Created: 08/10/2024 11:39
 * version: 0.1 alpha
 * implantation : 0.2
 * Copyleft 2024.
 */

;
/********
Point2D
********/
function Point2D(x, y){
  if(isNaN(x) || isNaN(y)){
    throw new Error("invalid coordinates: "+arguments);
    }
  this.x= x;
  this.y= y;
  };
// -- prototype --
(function(){
const proto= Point2D.prototype;
proto.setXY= function(x, y){
    this.x= x;
    this.y= y;
    };
proto.from= function(p){
    if(p instanceof Point2D){
      this.x= p.x;
      this.y= p.y;
      }
    else{
      throw new Error("cannot clone non point object: "+p);
      }
    return this;
    };
proto.add= function(p){
    if(p instanceof Point2D){
      this.x+= p.x;
      this.y+= p.y;
      }
    else{
      throw new Error("cannot clone non point object: "+p);
      }
    return this;
    };
proto.magnitude= function(){
    return Math.sqrt(this.x*this.x+this.y*this.y);
    };
proto.normalize= function(){
    const r= this.magnitude();
    return new Point2D(this.x/r, this.y/r);
    };
proto.toString= function(){
    return "/*Point2D*/{ x: "+this.x+", y: "+this.y+" }";
    };
proto.round= function(){
    this.x= Math.round(this.x);
    this.y= Math.round(this.y);
    return this;
    };
})();
// ---- ----

/********
SC_Rect2D
********/
function SC_Rect2D(x, y, w, h){
  if(isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h) || w<0 || h<0){
    throw new Error("SC_Rect: Invalid Parameters: "+arguments);
    }
  this.x= x;
  this.y= y;
  this.w= w;
  this.h= h;
  };
// -- prototype --
(function(){
const proto= SC_Rect2D.prototype;
Object.defineProperty(proto, "cx"
, { get: function(){
        return this.x+this.w/2;
        }
    });
Object.defineProperty(proto, "cy"
, { get: function(){
        return this.y+this.h/2;
        }
    });
Object.defineProperty(proto, "p1"
, { get: function(){
        return new Point2D(this.x, this.y);
        }
    });
Object.defineProperty(proto, "p2"
, { get: function(){
        return new Point2D(this.x+this.w, this.y+this.h);
        }
    });
proto.inside= function(point){
    const { x: tx, y: ty }= point;
    return ((tx-this.x)<this.w) && ((ty-this.y)<this.h);
    };
proto.moveCenter= function(point){
    this.x= point.x-this.w/2;
    this.y= point.y-this.h/2;
    };
proto.moveRoundCenter= function(point){
    this.x= Math.round(point.x-this.w/2);
    this.y= Math.round(point.y-this.h/2);
    };
proto.enlargeWH= function(w, h){
    this.w= w;
    this.h= h;
    };
Object.defineProperty(proto, "area"
, { get: function(){
        return this.w*this.h;
        }
    });
Object.defineProperty(proto, "perimeter"
, { get: function(){
        return 2*this.w+2*this.h;
        }
    });
})();
// ---- ----

(function(){
/********
SC_Camera
********/
window.SC_Camera= function(prm){
  const p= SC.$(prm);
  this.canvas= p._("cvs");
  this.sc_fps= 0;
  this.sc_frameNumber= 0;
  this.fpsMeasuring= 0;
  this.sc_dropFrame= false;
  this.worldView= new SC_Rect2D(1000, 100, this.width, this.height);
/*
-- Reactive behavior --
*/
  SC.tools.addProgram(
    SC.cube(this
    , SC.par(
        SC.actionOn({
            config: SC.or(Evt_requestDisplayLvl1, Evt_requestDisplayLvl2
                                 , Evt_requestDisplayLvl3)
          , fun: "sc_drawingReq"
          , times: SC.forever }
          )
      , SC.repeatForever(
          SC.await(Evt_graphicPOI)
        , SC.action("Act_updatePOI")
          )
        )
    , { life: {
            init: this.Act_printDim
            }
        }
      )
    );
  };

const proto= SC_Camera.prototype;
proto.sc_getFPS= function(){
    return this.sc_fps;
    };
proto.sc_setDim= function(w, h){
    this.canvas.width= w;
    this.canvas.height= h;
    this.worldView.enlargeWH(w, h);
    };
proto.toDataURL= function(type){
    return this.canvas.toDataURL(type);
    };
Object.defineProperty(proto, "style"
, { get: function(){ return this.canvas.style; } });
Object.defineProperty(proto, "offsetLeft"
, { get: function(){ return this.canvas.offsetLeft; } });
Object.defineProperty(proto, "offsetTop"
, { get: function(){ return this.canvas.offsetTop; } });
Object.defineProperty(proto, "width"
, { get: function(){ return this.canvas.width; } });
Object.defineProperty(proto, "height"
, { get: function(){ return this.canvas.height; } });
proto.Act_printDim= function(m){
    SC.writeInPanel("workspace: (x:"+this.width+", y:"+this.height+")");
    };
proto.Act_updatePOI= function(m){
    const data= m.getValuesOf(Evt_graphicPOI);
    const poi= data[0];
    this.worldView.moveRoundCenter(poi);
    if(this.worldView.x<0){
      this.worldView.x= 0;
      }
    if(this.worldView.y<0){
      this.worldView.y= 0;
      }
    };
proto.sc_drawingReq= function(m){
    if(this.sc_dropFrame){ return; }
    function _(x){
      return x?x:[];
      };
    this.sc_dropFrame= true;
    const lvl1= _(m.getValuesOf(Evt_requestDisplayLvl1));
    const lvl2= _(m.getValuesOf(Evt_requestDisplayLvl2));
    const lvl3= _(m.getValuesOf(Evt_requestDisplayLvl3));
    window.requestAnimationFrame(
      function(){
        this.sc_frameNumber++;
        const ctx= this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.width, this.height);
        for(var i in lvl1){
          const obj= lvl1[i];
          obj.draw(ctx, this.worldView);
          }
        for(var i in lvl2){
          const obj= lvl2[i];
          obj.draw(ctx, this.worldView);
           }
        for(var i in lvl3){
          const obj= lvl3[i];
          obj.draw(ctx, this.worldView);
          }
        if(0==this.sc_frameNumber%256){
          const now= window.performance.now();
          this.sc_fps= Math.floor(this.sc_frameNumber*10000
               /(now-this.fpsMeasuring))/10;
          this.sc_frameNumber= 0;
          this.fpsMeasuring= now;
          }
        this.sc_dropFrame= false;
        }.bind(this));
    };
})();
