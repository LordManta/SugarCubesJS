/*
 * WorldMap.js
 * Author: Jean-Ferdy Susini
 * Created : 02/01/2015 17:54
 * version: 0.1 alpha
 * implantation : 0.2
 * Copyleft 2015-2024.
 */

(function(){
const buildParams= {
    tileset: new Image(1024, 128)
  , layers: [ map1_tiles, map1_layer1 ]
  //, layers: null
  , width:1024
  , height:768
  //, width: 512
  //, height: 384
  , offsetX: 0
  , offsetY: 0
  , tileWidth: 32
  , tileHeight: 32
  , tileAnim: []
  , camera: workspace
    };
//buildParams.tileset.src= "SCwar/Ground.png";
buildParams.tileset.src= "SCwar/sols.png";

//buildParams.tileAnim[70]= { img: new Image(32, 512), count: new Array(16), max: 16 };
//buildParams.tileAnim[70].img.src= "SCwar/watterAnim.png";
//for(var n=0; n<buildParams.tileAnim[70].max; n++){
//  buildParams.tileAnim[70].count[n]= n;
//  }
// ipadair 45.4 ordi 48 mini 45.1 ipad 2 37 ipad 3 30.1
//buildParams.layers= [ map1_tiles ]; // issu de map.js : la carte du monde

const tilesAG= new Array(buildParams.layers[0].length);
for(var y= 0; y<buildParams.height; y++){
  for(var x= 0; x<buildParams.width; x++){
    const t= map1_tiles[y*buildParams.width+x]-1;
    var an= 0
    if(70==t){
      //an= Math.floor(Math.random()*buildParams.tileAnim[70].max);
      an= Math.floor(Math.random()*buildParams.tileAnim[8].max);
      an= Math.floor(Math.random()*buildParams.tileAnim[9].max);
      an= Math.floor(Math.random()*buildParams.tileAnim[40].max);
      an= Math.floor(Math.random()*buildParams.tileAnim[41].max);
      }
    tilesAG[y*buildParams.width+x]= an;
    }
  }

var offscreenBuffer = document.createElement("canvas");
offscreenBuffer.width=512;
offscreenBuffer.height=32;
buildParams.tileAnim[8] = {img:new Image(32,512),count:new Array(16),max:16};
buildParams.tileAnim[8].img.src="SCwar/watterAnim.png";
buildParams.tileAnim[9] = {img:new Image(32,512),count:new Array(16),max:16};
buildParams.tileAnim[9].img.src="SCwar/watterAnim9.png";
buildParams.tileAnim[40] = {img:new Image(32,512),count:new Array(16),max:16};
buildParams.tileAnim[40].img.src="SCwar/watterAnim40.png";
buildParams.tileAnim[41] = {img:new Image(32,512),count:new Array(16),max:16};
buildParams.tileAnim[41].img.src="SCwar/watterAnim41.png";
for(var n = 0; n < buildParams.tileAnim[8].max; n++){
  buildParams.tileAnim[8].count[n] = n;
  buildParams.tileAnim[9].count[n] = n;
  buildParams.tileAnim[40].count[n] = n;
  buildParams.tileAnim[41].count[n] = n;
  }
//var tilesAG = new Array(buildParams.layers[0].length);
//for(var y = 0; y < buildParams.height; y++){
//  for(var x = 0; x < buildParams.width; x++){
//    var t = map1_tiles[y*buildParams.width+x]-1;
//    var an = 0
//    if((8 == t)||(9 == t)||(40 == t)||(41 == t)){
//      an = Math.floor(Math.random()*buildParams.tileAnim[8].max);
//      }
//    tilesAG[y*buildParams.width+x] = an;
//    }
//  }
buildParams.tileAnimGroup = tilesAG;
buildParams.tileAnimGroup= tilesAG;
window.TileMap= new SC_TileMap(buildParams);
TileMap.animateWatter= function(m){
  const tm= this.tileAnim[8];
  const max8= tm.max;
  for(var n in tm.count){
    tm.count[n]= (tm.count[n]+1)%max8;
    }
  const max9= this.tileAnim[9].max;
  for(var n in this.tileAnim[9].count){
    this.tileAnim[9].count[n]= (this.tileAnim[9].count[n]+1)%max9;
    }
  const max40= this.tileAnim[40].max;
  for(var n in this.tileAnim[40].count){
    this.tileAnim[40].count[n]= (this.tileAnim[40].count[n]+1)%max40;
    }
  const max41= this.tileAnim[41].max;
  for(var n in this.tileAnim[41].count){
    this.tileAnim[41].count[n]= (this.tileAnim[41].count[n]+1)%max41;
    }
  }
SC.writeInPanel("World size: ("+TileMap.width+", "+TileMap.height+")\n");

/*
At that time TileMap only animates water...
*/
SC.tools.addProgram(
  SC.cube(TileMap
  , SC.par(
      SC.repeatForever(
        SC.action("animateWatter")
      , SC.pause(5)
        )
    , SC.generate(Evt_requestDisplayLvl1, TileMap, SC.forever)
    , SC.repeatForever(
        SC.await(Evt_graphicPOI)
      //, SC.actionOn(Evt_graphicPOI, "updateOffsets")
        )
      )
    )
  );

/*
Building the passing map.
  - 255 is not passable at all
  - 0 is fully passable.
*/
const passingDifficulty= new Array(256);
for(var n= 0; n<passingDifficulty.length; n++){
  passingDifficulty[n]=255;
  }
//passingDifficulty[4]= 6;
//passingDifficulty[5]= 6;
//passingDifficulty[6]= 2;
//passingDifficulty[7]= 2;
//passingDifficulty[8]= 2;
//passingDifficulty[9]= 2;
//passingDifficulty[95]= 1;
//passingDifficulty[20]= 2;
//passingDifficulty[21]= 2;
//passingDifficulty[38]= 6;
//passingDifficulty[39]= 6;
//passingDifficulty[40]= 2;
//passingDifficulty[41]= 2;
//passingDifficulty[42]= 2;
//passingDifficulty[43]= 2;
//passingDifficulty[54]= 2;
//passingDifficulty[55]= 2;
//passingDifficulty[107]= 2;
//passingDifficulty[112]= 2;
//passingDifficulty[113]= 2;
//

passingDifficulty[0]=1.5;
passingDifficulty[1]=1.5;
passingDifficulty[2]=1.5;
passingDifficulty[3]=1.5;
passingDifficulty[4]=4;
passingDifficulty[5]=4;
passingDifficulty[10]=1;
passingDifficulty[11]=1;
passingDifficulty[12]=1;
passingDifficulty[16]=1;
passingDifficulty[32]=1.5;
passingDifficulty[33]=1.5;
passingDifficulty[34]=1.5;
passingDifficulty[35]=1.5;
passingDifficulty[36]=4;
passingDifficulty[37]=4;
passingDifficulty[42]=1;
passingDifficulty[43]=1;
passingDifficulty[108]=1;

const passabilityMap= new Array(TileMap.layers[0].length);
for(var y= 0; y<buildParams.height; y++){
  for(var x= 0; x<buildParams.width; x++){
    const t= map1_tiles[y*buildParams.width+x]-1;
    if(passingDifficulty[t]){
      passabilityMap[y*buildParams.width+x]= passingDifficulty[t];
      }
    else{
      console.log("passing undefined");
      }
    }
  }

TileMap.passmap= passabilityMap;
})();
