/*
 * SC_TileMap.js
 * Author : Jean-Ferdy Susini
 * Created : 15/12/2014 0:06 AM
 * version : 0.1 alpha
 * implantation : 0.2
 * Copyright 2014-2024.
 */

function SC_TileMap(p){
  const params= SC.$(p);
  var errors= "";
  if(undefined==params.layers){
    errors+= "SC_TileMap : layers parameter must be provided (map) !\n";
    }
  if(undefined==params.tileset){
    errors+= "SC_TileMap : tileset parameter must be provided (image) !\n";
    }
/*  if(undefined==params.camera){
    errors+= "SC_TileMap : camera parameter must be provided (workspace) !\n";
    }*/
  if(undefined==params.width){
    errors+= "SC_TileMap : width parameter must be provided "
                                                +"(in tiles metric) !\n";
    }
  if(undefined==params.height){
    errors+= "SC_TileMap : height parameter must be provided "
                                                +"(in tiles metric) !\n";
    }
  if(params.layers && ((params.width*params.height) != params.layers[0].length)){
    errors+= "SC_TileMap : width & height are not consistent with tiles array !\n";
    }
  if(""!=errors){
    throw new Error(errors);
    }
  this.img= params.tileset;
  this.layers= params.layers;
  this.width= params.width;
  this.height= params.height;
  this.offset= new Point2D(params._("offsetX", 0)
                         , params._("offsetY", 0));
  this.tileAnim= params.tileAnim; //objet : image+count[]+max
  //this.camera= params.camera;
  if(undefined != this.tileAnim){
      if(undefined == params.tileAnimGroup){
        throw "SC_TileMap : Parameter tileAnimGroup must be specified if "
               +"tileAnim exists !";
        }
    this.tileAnimGroup = params.tileAnimGroup;
    this.tilesNum = (undefined != params.tilesNum)?params.tilesNum
                                                  :this.tileAnim.length;
    this.tileWidth = (undefined == params.tileWidth)
                      ? this.img.width/this.tilesNum
                      : params.tileWidth;
    this.tileHeight = (undefined == params.tileHeight)
                       ? this.img.height/this.tilesMaxAnimNum
                       : params.tileHeight;
    }
  else{
    if(undefined == params.tilesNum){
      throw "SC_TileMap : Parameter tilesNum must be specified !";
      }
    this.tilesNum = params.tilesNum;
    if(undefined == params.tileWidth){
      throw "SC_TileMap : Parameter tileWidth must be specified !";
      }
    this.tileWidth = params.tileWidth;
    if(undefined == params.tileHeight){
      throw "SC_TileMap : Parameter tileHeight must be specified !";
      }
    this.tileHeight =  params.tileHeight;
    }
  this.fullSize= new Point2D(this.width*this.tileWidth, this.height*this.tileHeight);
  };
(function(){
const proto= SC_TileMap.prototype;
proto.draw= function(ctx, view){
/*
 * croping de la tilemap
 */
    const tw= this.tileWidth;
    const th= this.tileHeight;
    const ww= this.width;
    const { x: posX, y: posY, w: cw, h: ch }= view;
    const { x: mapW, y: mapH }= this.fullSize;
    this.offset.x= Math.min(Math.max(0, posX), mapW-cw);
    this.offset.y= Math.min(Math.max(0, posY), mapH-ch);
    const startX= Math.floor(posX/tw);
    const startY= Math.floor(posY/th);
    const img= this.img;
    var endX= Math.floor(cw/tw)+startX+2;
    endX= (endX<this.width)?endX:this.width;
    var endY= Math.floor(ch/th)+startY+2;
    endY= (endY<this.height)?endY:this.height;
    for(var y= startY; y<endY; y++){
      for(var x= startX; x<endX; x++){
        for(var l in this.layers){
          const tile= (this.layers[l][y*ww+x])-1;
          if(tile<0){
            continue;
            }
          if(undefined!=this.tileAnim[tile]){
            var animator= this.tileAnim[tile];
            var ainmCount= animator.count[this.tileAnimGroup[y*ww+x]]*tw;
            ctx.drawImage(animator.img
                , ainmCount, 0, tw, th
                , x*tw-posX, y*th-posY, tw, th);
            }
          else{
            ctx.drawImage(img
                , ((tile)%32)*tw, Math.floor(tile/32)*th, tw, th
                , x*tw-posX, y*th-posY, tw, th);
            }
          }
        }
      }
    };
})();
