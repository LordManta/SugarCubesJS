/*
 * SC_Tools.js
 * Author : Jean-Ferdy Susini
 * Created : 20/12/2014 18:46
 * Part of the SugarCubes Project
 * version : 5.0 alpha
 * implantation : 0.5
 * Copyright 2014-2020.
 */

SC.tools = (function(){
  /************************
   * Zone de control
   ************************/
  function Zone(conf){
    if(undefined != conf.zoneID){
      this.num = conf.zoneID;
    }
    this.x = 0;
    this.y = 0;
    this.r = 0; // rayon du cercle tactile
    this.img_zoom = conf.img_zoom; // image associée
    this.hidden = false;
    this.zoneVisible = conf.zoneVisible;
    this.bgcolor = conf.bg_color;
    this.zoneEvt = conf.zoneEvt;
    this.touched = false;
    this.img = conf.img;
    this.flip = false;
    this.rotateImg = (undefined == conf.rotateImg)?0:conf.rotateImg;
  }
  Zone.prototype.getBehavior = function(){
    var localKill = SC.evt("localKill");
    var res = SC.par(
      SC.generate(requestDisplayLvl3, this, SC.forever)
      , SC.par(
          SC.filter(SC_evt_mouse_down, this.zoneEvt, {t:this,f:"filterStart"},SC.forever)
          , SC.filter(SC_evt_mouse_move, this.zoneEvt, {t:this,f:"filterStart"},SC.forever)
          , SC.filter(SC_evt_mouse_move, localKill, {t:this,f:"filterMove"},SC.forever)
          , SC.filter(SC_evt_mouse_up, localKill, {t:this,f:"filterEnd"},SC.forever)
          , SC.filter(SC_evt_touch_start, this.zoneEvt, {t:this,f:"filterStart"},SC.forever)
          , SC.filter(SC_evt_touch_move, this.zoneEvt, {t:this,f:"filterStart"},SC.forever)
          , SC.filter(SC_evt_touch_move, localKill, {t:this,f:"filterMove"},SC.forever)
          , SC.filter(SC_evt_touch_end, localKill, {t:this,f:"filterEnd"},SC.forever)
          , SC.filter(SC_evt_touch_cancel, localKill, {t:this,f:"filterEnd"},SC.forever)
          )
      , SC.repeat(SC.forever
          , SC.await(this.zoneEvt) 
          , SC.kill(
              SC.or(localKill,chooseControlHand)
              , SC.generate(this.zoneEvt,null,SC.forever)
              )
          )
      , SC.actionOn(
          chooseControlHand
          , {t:this,f:"changeHand"}
          , undefined
          , SC.forever
          )
      );
    return res;
    }
  Zone.prototype.inside = function(x,y){
    var z = workspace.style.zoom;
    var rx = Math.abs(this.x - x/z+workspace.offsetLeft);
    var ry = Math.abs(this.y - y/z+workspace.offsetTop);
    return (rx < this.r)&&(ry < this.r);
    }
  Zone.prototype.filterStart= function(t){
      /*if(this instanceof TargetBuble){
        console.log("on check pour ", this);
        }*/
    if(this.hidden){
      return;
      }
    var z = workspace.style.zoom;
    for(var n in t){
      var touch = t[n];
      //var rx = this.x - touch.cx/z+workspace.offsetLeft;
      //var ry = this.y - touch.cy/z+workspace.offsetTop;
      //var r = Math.sqrt(rx*rx + ry*ry);
      /*if(this instanceof TargetBuble){
        console.log("ça clique en ", touch, this);
        }*/
      if(this.inside(touch.cx, touch.cy)){
        this.id = touch.id;
        this.touched = true;
        return {
                ts:window.performance.now()
                , x:touch.cx/z+workspace.offsetLeft
                , y:touch.cy/z+workspace.offsetTop
                };
      }
    }
  }
  Zone.prototype.filterMove= function(t){
    var z = workspace.style.zoom;
    for(var n in t){
      var touch = t[n];
      if( this.id != touch.id ){
        continue;
      }
      //var rx = this.x - touch.cx/z+workspace.offsetLeft;
      //var ry = this.y - touch.cy/z+workspace.offsetTop;
      //var r = Math.sqrt(rx*rx + ry*ry);
      //if(r > this.r){
      if(!this.inside(touch.cx, touch.cy)){
        this.touched = false;
        return "zone1";
      }
    }
  }
  Zone.prototype.filterEnd= function(t){
    for(var n in t){
      if(t[n].id == this.id){
        this.touched = false;
        return "zone1";
      }
    }
  }
  Zone.prototype.draw = function(ctx){
    if(this.hidden){
      return;
    }
    var theCtx = ctx.save();
    ctx.translate(this.x, this.y);
    if(this.zoneVisible){
      //ctx.strokeStyle = (this.touched)?"red":"black";
      //ctx.translate(this.x, this.y);
      ctx.fillStyle = this.bgcolor;
      ctx.beginPath();
      ctx.arc(0,0,this.r, 0,2*Math.PI, false);
      ctx.fill();    
      //ctx.arc(this.x,this.y,this.r, 0,2*Math.PI, false);
      //ctx.stroke();    
      ctx.closePath();
    }
    if(undefined != this.img){
      var iw = this.img.width;
      var ih = this.img.height;
      var dir = 2*this.img_zoom*this.r;
      var zw = dir/iw ;
      var zh = dir/ih;
      var z = Math.min(zw,zh);
      iw *= z;
      ih *= z;
      if(this.flip){
        ctx.scale(-1, 1);
        }
      if(0 != this.rotateImg){
        ctx.rotate(this.rotateImg);
        ctx.drawImage(this.img, -iw/2, -ih/2
                               , iw, ih);
        }
      else{
        ctx.drawImage(this.img, -iw/2
                              , -ih/2
                              , iw, ih);
        }
      }
    ctx.restore(theCtx);
  };
  Zone.prototype.updateZonePos = function(v){
    this.r = workspace.width*5/80;
    switch(v){
      case 1:{ this.flip = false; this.hidden = false; this.x = 60; break;}
      case 2:{ this.flip = true; this.hidden = false; this.x = 740; break;}
      case 0:{ this.hidden = true; this.x = -200; break;}
    }
    switch(this.num){
      case 1:{
        this.y = 2*this.r;
        break;
        }
      case 2:{
        this.y = workspace.height-2*this.r;
        break;
        }
      }
    this.lastV = v;
    }
  Zone.prototype.changeHand = function(v){
    var vals = v[chooseControlHand];
    if(inGame.isPresent(m)){
      this.updateZonePos(vals[0]);
      }
    else{
      this.updateZonePos(0);
      }
    }

  /*
   * Gestion du cache local
   */
  var css_properties = [
    "width"
    , "minWidth"
    , "maxWidth"
    , "height"
    , "minHeight"
    , "maxHeight"
    , "top"
    , "left"
    , "right"
    , "bottom"
    , "background"
    , "border"
    , "display"
    , "position"
    , "visibility"
    , "color"
    , "opacity"
    , "font"
    , "borderRadius"
    , "padding"
    , "margin"
    , "textAlign"
    , "lineHeight"
    , "verticalAlign"
    , "boxSizing"
    , "boxShadow"
    , "outline"
    , "cursor"
    , "float"
    , "overflowX"
    , "overflowY"
    , "zIndex"
    , "zoom"
  ];
  if(undefined !== document.documentElement.style.WebkitFilter){
    css_properties.push("WebkitFilter");
    }
  else{
    css_properties.push("filter");
    }
  var WebAppcache = window.applicationCache;
  var manifest = document.documentElement.manifest;
  function activateElement(tmp){
    tmp.beh =  SC.cube(tmp, SC.nothing());
    tmp.addIn_classListEvt = SC.evt("addIn_classList");
    tmp.removeIn_classListEvt = SC.evt("removeIn_classList");
    SC.cellify(tmp, "classList", function(addEvt, removeEvt, val, evts){
                    var tmp = evts[addEvt];
                    if(undefined !== tmp){
                      for(var i = 0; i < tmp.length; i++){
                        if(!val.contains(tmp[i])){
                          val.add(tmp[i]);
                          }
                        }
                      }
                    tmp = evts[removeEvt];
                    if(undefined !== tmp){
                      for(var i = 0; i < tmp.length; i++){
                        var cl = tmp[i];
                        if(val.contains(cl)){
                          val.remove(cl);
                          }
                        }
                      }
                    return val;
                    }.bind(tmp, tmp.addIn_classListEvt
                          , tmp.removeIn_classListEvt)
                  , [tmp.addIn_classListEvt, tmp.removeIn_classListEvt]);
    tmp.beh.addProgram(SC.repeat(SC.forever
                                , SC.await(SC.or(tmp.addIn_classListEvt
                                             , tmp.removeIn_classListEvt)
                                          )
                                , tmp.$classList));
    if(undefined !== tmp.src){
      tmp.srcEvt = SC.evt("set_src");
      SC.cellify(tmp, "src", SC.simpleCellFun(tmp, tmp.srcEvt)
                    , [tmp.srcEvt]);
      tmp.beh.addProgram(SC.repeat(SC.forever
                           , SC.await(tmp.srcEvt)
                           , tmp.$src
                           )
                         );
      }
    tmp.inHEvt = SC.evt("set_innerHTML");
    SC.cellify(tmp, "innerHTML", SC.simpleCellFun(tmp, tmp.inHEvt)
                  , [tmp.inHEvt]);
    tmp.beh.addProgram(SC.repeat(SC.forever
                         , SC.await(tmp.inHEvt)
                         , tmp.$innerHTML
                         )
                      );
    function stylizer(style_prop){
      var cssEvtName = "css_"+style_prop+"Evt";
      var cssEvt = this[cssEvtName] = SC.evt(cssEvtName);
      SC.cellify(this, style_prop, SC.simpleCellFun(this, cssEvt)
                    , [cssEvt],["style"]);
      this.beh.addProgram(SC.repeat(SC.forever
                           , SC.await(cssEvt)
                           , tmp["$"+style_prop]
                           )
                        );
      }
    for(var i in css_properties){
      if(undefined !== tmp.style[css_properties[i]]){
        stylizer.call(tmp, css_properties[i]);
        }
      }
    tmp.titleEvt = SC.evt("set_title");
    SC.cellify(tmp, "title", SC.simpleCellFun(tmp, tmp.titleEvt)
                  , [tmp.titleEvt]);
    tmp.beh.addProgram(SC.repeat(SC.forever
                         , SC.await(tmp.titleEvt)
                         , tmp.$title
                         )
                      );
    if(undefined !== tmp.alt){
      tmp.altEvt = SC.evt("set_alt");
      SC.cellify(tmp, "alt", SC.simpleCellFun(tmp, tmp.altEvt)
                    , [tmp.altEvt]);
      tmp.beh.addProgram(SC.repeat(SC.forever
                           , SC.await(tmp.altEvt)
                           , tmp.$alt
                           )
                        );
      }
    tmp.sc_inspected = false;
    tmp.addEventListener('click', function(evt){
      if(undefined !== SC_ClientTools.elementInspector){
        //console.log("click = ",evt.detail);
        if((SC_ClientTools.elementInspector.sc_vis) || (4 === evt.detail)){
            SC.tools.generateEvent(SC_ClientTools.elementInspector.setIcobjUnderInspectionEvt
                                                    , this);
            }
        }
    }.bind(tmp));
    return tmp;
    }
  function finishElement(elt, p){
    if(undefined !== p.cl){
      if(p.cl instanceof Array){
        for(var i = 0; i < p.cl.length; i++){
          if(!elt.classList.contains(p.cl[i])){
            elt.classList.add(p.cl[i]);
            }
          }
        }
      else{
        elt.classList.add(p.cl);
        }
      }
    if(undefined !== p.id){
      elt.setAttribute('id', p.id);
      }
    if(p.position){
      elt.style.position = p.position;
      }
    if(p.inH){
      elt.innerHTML = p.inH;
      }
    if(undefined !== p.evt_click){
      elt.evt_click = p.evt_click;
      elt.addEventListener("click", function(m, evt){
         m.generateEvent(this.evt_click);
         }.bind(elt, ((undefined === p.m)?this.m:p.m)));
      }
    if(undefined !== p.src){
      elt.setAttribute("src", p.src);
      }
    if(undefined !== p.alt){
      elt.setAttribute("alt", p.alt);
      }
    if(undefined !== p.title){
      elt.setAttribute("title", p.title);
      }
    if(undefined !== p.on_touchStart){
      elt.on_touchStartEvt= p.on_touchStart;
      elt.addEventListener("touchstart", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_touchStartEvt))
      }
    if(undefined !== p.on_touchStop){
      elt.on_touchStopEvt= p.on_touchStop;
      elt.addEventListener("touchend", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_touchStopEvt))
      }
    if(undefined !== p.on_touchCancel){
      elt.on_touchCancelEvt= p.on_touchCancel;
      elt.addEventListener("touchcancel", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_touchCancelEvt))
      }
    if(undefined !== p.on_mouseUp){
      elt.on_mouseUpEvt= p.on_mouseUp;
      elt.addEventListener("mouseup", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_mouseUpEvt))
      }
    if(undefined !== p.on_mouseDown){
      elt.on_mouseDownEvt= p.on_mouseDown;
      elt.addEventListener("mousedown", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_mouseDownEvt))
      }
    if(undefined !== p.on_keyDown){
      elt.on_keyDownEvt= p.on_keyDown;
      elt.addEventListener("keydown", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_keyDownEvt))
      }
    if(undefined !== p.on_keyUp){
      elt.on_keyUpEvt= p.on_keyUp;
      elt.addEventListener("keyup", function(m, sc_evt, evt){
         m.generateEvent(sc_evt, evt);
         }.bind(elt, ((undefined === p.m)?this.m:p.m), elt.on_keyUpEvt))
      }
    if(undefined !== p.beh){
      elt.beh.addProgram(p.beh);
      }
    if(undefined !== elt.beh){
      //console.log("adding beh to machine ", elt.beh);
      ((undefined === p.m)?SC_ClientTools:p.m).addProgram(elt.beh);
      }
    return elt;
    }
  function makeElement(elt){
    return function(p){
      var tmp = document.createElement(elt);
      activateElement(tmp);
      if(undefined === p){
        p = {};
        }
      return finishElement.call(this,tmp, p);
      }
    }
/*
 **** Support audio.
 * On crée un AudioContext commun à tous les players.
 */
var sharedContext = null;
var webKitAPI = false;
if('AudioContext' in window){
  sharedContext = new AudioContext();
  }
else if('webkitAudioContext' in window){
  try{
    sharedContext = new webkitAudioContext();
    webKitAPI = true;
    }
  catch(e){
    console.log("no Web Audio API");
    }
  }
else{
  //alert('Your browser does not support yet Web Audio API');
  //throw "no Web Audio API";
  console.log("no Web Audio API");
  }
if(null !== sharedContext){
  /*
   * Mic not yet implemented
   */
  var microPhoneManager = sharedContext.createScriptProcessor(512);
  microPhoneManager.connect(sharedContext.destination);
  microPhoneManager.onaudioprocess = function(evt){
  };
  /*
   * jouer des sons grace aux objets AudioChunk
   */
  function AudioChunk(data){
    if(undefined === sharedContext){
      //alert('Your browser does not support yet Web Audio API');
      //throw "no Web Audio API";
      console.log("no Web Audio API");
      return;
      }
    this.audioContext = sharedContext;
    if('webkitAudioContext' in window){
      this.start = "start";
      }
    else{
      this.start = "start";
      }
    this.buffer = null;
    this.source = null;
    this.log = "";
    this.endedEvt=SC.sensor("ended");
    this.loadedEvt = SC.sensor("AC_"+this.idx+"_loaded");
    this.data = data;
    this.playEvt = SC.evt("play");
    this.pauseEvt = SC.evt("pause");
    this.resumeEvt = SC.evt("resume");
    this.stopEvt = SC.evt("stop");
    this.idx = SC_ClientTools.audioToolbox.sFXs.length;
    SC_ClientTools.audioToolbox.sFXs.push(this);
    SC_ClientTools.audioToolbox.waittingLoad.add(SC.await(this.loadedEvt));
    SC_ClientTools.addProgram(
      SC.repeat(SC.forever
        , SC.kill(this.stopEvt
            , SC.seq(
                SC.await(this.playEvt)
                , SC.action(this.play.bind(this))
                , SC.par(
                    SC.seq(
                      SC.repeat(SC.forever
                        , SC.await(this.pauseEvt)
                        , SC.action(this.pause.bind(this))
                        , SC.await(this.resumeEvt)
                        , SC.action(this.resume.bind(this))
                        )
                      )
                    , SC.seq(SC.await(this.endedEvt), SC.generate(this.stopEvt))
                    )
                )
            , SC.action(this.stop.bind(this))
            )
        )
      );
    }
  AudioChunk.prototype = {
    load : function(){
      var decodedStr = atob(this.data);
      var len = decodedStr.length;
      var arrayBuff = new Uint8Array(len);
      for(var n = 0 ; n < len; n++){
        arrayBuff[n] = decodedStr.charCodeAt(n);
        }
      this.audioContext.decodeAudioData(arrayBuff.buffer, (function (me){ return function(audioData){
        me.buffer = audioData;
        SC_ClientTools.m.generateEvent(me.loadedEvt);
        SC.writeInConsole("loaded"+me.idx+"\n");
        }})(this));
      }
    , toString : function(){
        return "AudioToolbox";
        }
    , setDestination : function(dest){
        this.dest = dest;
        if(null !=  this.source){
          this.source.disconnect();
          this.source.connect(this.dest);
          }
        }
    , pause : function(){
        if(null !=  this.source){
          this.source.disconnect();
          }
        }
    , resume : function(){
        if(null !=  this.source){
          this.source.connect((undefined !== this.dest)?this.dest
                                 :this.audioContext.destination);
          }
        }
    , i : function(msg){
        return this.log += msg;
        }
    , play : function(){
        if(null != this.source){
          return;
          }
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.buffer;
        if(undefined !== this.dest){
          this.source.connect(this.dest);
          }
        else{
          this.source.connect(this.audioContext.destination);
          }
        this.source[this.start](0);
        this.source.onended = (function(me) { return function(evt){
            SC_ClientTools.m.generateEvent(me.endedEvt);
            if(me.dbg){
              console.log("stop");
              }
            me.stop();
          }})(this);
        }
    , stop : function(){
        if(null != this.source){
          this.source.stop(0);
          }
        this.source = null;
        }
    }
  }

SC_ClientTools = {
    makeDiv: makeElement("div")
  , makeP: makeElement("p")
  , makeUl: makeElement("ul")
  , makeInput: makeElement("input")
  , makeLabel: makeElement("label")
  , makeSpan: makeElement("span")
  , makeImage : function(args){
      var width = args.w;
      var height = args.h;
      var tmp = null;
      if((undefined !== width)
         &&(undefined !== height)
        ){
        tmp = new Image(args.w, args.h);
        }
      else{
        tmp = new Image();
        }
      activateElement(tmp);
      return finishElement.call(this, tmp, args);
      }
  , audioContext : sharedContext
  , activateElement : activateElement
  , configureElement : finishElement
  , energize : function(p){
      var tmp = finishElement.call(this,
               activateElement(document.currentScript.previousElementSibling)
               , p
               );
      return tmp;
      }
  , m : null
  , workspace : document
  , setWorkspace : function(w){
      this.workspace = w;
      if(undefined === w.getFPS){
        w.getFPS = function(){return "NA";}
        }
      }
  , addProgram : function(p){
      throw "Not well initialized !";
      }
  , systemEvent : function(evt, val){
      if(null === this.m){
        throw "Not well initialized !";
        }
      this.m.systemEvent.apply(this.m, arguments);
      }
  , appStartedEvt : SC.evt("appStarted")
  , appInited : false
  , init : function(m){
      this.setWorkspace(document);
      this.m = m;
      if("complete" != document.readyState){
        this.programsToAdd=SC.par();
        this.addProgram = function(p){
          this.programsToAdd.add(p);
          };
        this.systemEvent = function(evt, val){
          return this.m.systemEvent.apply(this.m, arguments);
          };
        window.addEventListener("load", function(){
            this.m.addProgram(SC.seq(
                  (this.appInited)?SC.await(this.appStartedEvt):SC.nothing()
                  , SC.action(function(){
                    this.addProgram = function(p){
                      this.m.addProgram(p);
                      }
                    this.m.addProgram(this.programsToAdd);
                    }.bind(this))
                  )
                );
            }.bind(this));
        }
      else{
        console.log("Probably initialized too late !");
        if(null != this.m){
          this.addProgram = function(p){
            this.m.addProgram(p);
            }
          }
        else{
          console.log("no reactiveMachine set");
          }
        }
      this.generateEvent = function(evt, val){
        this.m.generateEvent.apply(this.m, arguments);
        }
      this.setRunningDelay = function(d){
        this.m.setRunningDelay.apply(this.m, arguments);
        }
      }
  , loadData : function(url, resEvt, engine){
      if(undefined === resEvt){
        resEvt = SC.sensor("lodingData("+url+")");
        }
      //console.log("loading data tool", resEvt);
      var xmlHttpReq = new XMLHttpRequest();
      xmlHttpReq.open("GET", url, true);
      xmlHttpReq.onload= (function(machine, me, act){ return function(){
              //console.log("onload", me.status);
              if(200 == me.status || 0 == me.status){
                SC.tools.addProgram(SC.send(machine, act, me.responseText));
                }
              }
          })(((undefined != engine)?engine:this.m), xmlHttpReq, resEvt)
          ;
      xmlHttpReq.send(null);
      return resEvt;
      }
  , m : null
  , initPanel: function(){
      if(undefined === this.m){
        throw "initialize tools first";
        }
      this.controlPanel = {};
      this.controlPanel.win = document.createElement("div");
      this.controlPanel.win.id = 'SC_ControlPanel';
      this.controlPanel.toggle = function(b){
        var cpc = this.content;
        var hidden = "none" == cpc.style.display;
        if((true === b)||(false === b)){
          //console.log(b)
          hidden = b;
          }
        cpc.style.display = (hidden)?"block":"none";
        if(hidden){
          this.win.style.paddingBottom="2px";
          }
        else{
          this.win.style.paddingBottom="5px";
          }
        }.bind(this.controlPanel)
      window.addEventListener("load", function(){
          document.body.appendChild(this.controlPanel.win);
          }.bind(this)
          );
      var tmp = new Image(30,30);
      tmp.setAttribute("src","images/png/Close.png");
      tmp.onclick = this.controlPanel.toggle;
      tmp.style.margin="0";
      tmp.style.padding="0";
      this.controlPanel.win.appendChild(tmp);
      this.controlPanel.content = document.createElement("div");
      this.controlPanel.content.setAttribute("id","SC_CP_content");
      this.controlPanel.win.appendChild(this.controlPanel.content);
      this.controlPanel.console = document.createElement("div");
      this.controlPanel.console.setAttribute("id","SC_console");
      tmp=document.createElement("p");
      tmp.style.margin="0";
      tmp.style.padding="0";
      tmp.innerHTML="ScreenShot :";
      this.controlPanel.screenShot = new Image();
      this.controlPanel.screenShot.setAttribute("id","SC_ScreenShot_pic");
      this.controlPanel.screenShotSensor = 
                   this.m.systemEvent(this.controlPanel.screenShot, "click");
      tmp.appendChild(this.controlPanel.screenShot);
      this.controlPanel.content.appendChild(tmp);
      tmp=document.createElement("p");
      tmp.innerHTML = "IPS: ";
      this.controlPanel.SC_Panel_ips = document.createElement("span");
      tmp.appendChild(this.controlPanel.SC_Panel_ips);
      this.controlPanel.SC_Panel_fps = document.createElement("span");
      tmp.appendChild(this.controlPanel.SC_Panel_fps);
      this.controlPanel.content.appendChild(tmp);
      var tmpTable=document.createElement("table");
      tmpTable.setAttribute("id","SC_mouse_tracker");
      tmpTable.innerHTML="<tr><th></th><th>x</th><th>y</th></tr>";
      tmp=document.createElement("tr");
      tmp.innerHTML="<th>client</th>";
      var SC_evt_mouse_client_x = document.createElement("td");
      tmp.appendChild(SC_evt_mouse_client_x);
      var SC_evt_mouse_client_y = document.createElement("td");
      tmp.appendChild(SC_evt_mouse_client_y);
      tmpTable.appendChild(tmp);
      tmp=document.createElement("tr");
      tmp.innerHTML="<th>page</th>";
      var SC_evt_mouse_page_x = document.createElement("td");
      tmp.appendChild(SC_evt_mouse_page_x);
      var SC_evt_mouse_page_y = document.createElement("td");
      tmp.appendChild(SC_evt_mouse_page_y);
      tmpTable.appendChild(tmp);
      tmp=document.createElement("tr");
      tmp.innerHTML="<th>screen</th>";
      var SC_evt_mouse_screen_x = document.createElement("td");
      tmp.appendChild(SC_evt_mouse_screen_x);
      var SC_evt_mouse_screen_y = document.createElement("td");
      tmp.appendChild(SC_evt_mouse_screen_y);
      tmpTable.appendChild(tmp);
      this.controlPanel.content.appendChild(tmpTable);
      tmpTable=document.createElement("table");
      tmpTable.setAttribute("id","SC_reactive_machine_info");
      tmp=document.createElement("tr");
      tmp.innerHTML="<th>toplevel branches:</th>";
      var SC_toplevel_bn = document.createElement("td");
      tmp.appendChild(SC_toplevel_bn);
      tmpTable.appendChild(tmp);
      tmp=document.createElement("tr");
      tmp.innerHTML="<tr><td><button onclick='SC_ClientTools.SC_controlMachine(event);'>Pause</button></td><td><button onclick='SC_ClientTools.m.react()'>Step</button></td></tr>";
      tmpTable.appendChild(tmp);
      tmp=document.createElement("tr");
      tmp.innerHTML="<th>instant:</th>";
      var SC_instant_n_cell = document.createElement("td");
      tmp.appendChild(SC_instant_n_cell);
      tmpTable.appendChild(tmp);
      this.controlPanel.content.appendChild(tmpTable);
      this.controlPanel.content.appendChild(document.createElement("br"));
      this.controlPanel.content.appendChild(this.controlPanel.console);
      this.controlPanel.setInspectorBtn = function(){
        var inspector_btn = document.createElement("button");
        inspector_btn.innerHTML="Element Inspector";
        inspector_btn.onclick=function(){
          SC.tools.generateEvent(SC_ClientTools.elementInspector.setIcobjUnderInspectionEvt, null);
          };
        this.content.appendChild(inspector_btn);
        }
      if(undefined !== this.elementInspector){
        this.controlPanel.setInspectorBtn();
        }
      SC_evt_mouse_click = this.m.systemEvent(document, "click");
      SC_evt_mouse_down = this.m.systemEvent(document, "mousedown");
      SC_evt_mouse_up = this.m.systemEvent(document, "mouseup");
      SC_evt_mouse_move = this.m.systemEvent(document, "mousemove");
      SC_evt_touch_start = this.m.systemEvent(document, "touchstart");
      SC_evt_touch_end = this.m.systemEvent(document, "touchend");
      SC_evt_touch_cancel = this.m.systemEvent(document, "touchcancel");
      SC_evt_touch_move = this.m.systemEvent(document, "touchmove");
      this.SC_controlMachine = function(evt){
        this.m.setKeepRunningTo("Pause" != evt.target.innerHTML);
        evt.target.innerHTML=(("Pause" == evt.target.innerHTML)?"Resume":"Pause");
        }
      SC.writeInConsole = function(msg, nl){
        if(nl){
          this.controlPanel.console.appendChild(document.createElement("br"));
          }
        this.controlPanel.console.appendChild(document.createTextNode(msg));
        console.log.apply(console, arguments);
        }.bind(this);
      function trackEvent(theEvt){
        var res = SC.repeat(SC.forever
            , SC.await(theEvt)
            , SC.act(function(evt, m){
                 var vals = evt.getValues(m);
                 SC_evt_mouse_client_x.innerHTML = (0 == vals.length)?"--"
                                                          :Math.floor(vals[0].cx);
                 SC_evt_mouse_client_y.innerHTML = (0 == vals.length)?"--"
                                                          :Math.floor(vals[0].cy);
                 SC_evt_mouse_page_x.innerHTML = (0 == vals.length)?"--"
                                                          :Math.floor(vals[0].x);
                 SC_evt_mouse_page_y.innerHTML = (0 == vals.length)?"--"
                                                          :Math.floor(vals[0].y);
                 SC_evt_mouse_screen_x.innerHTML = (0 == vals.length)?"--"
                                                          :Math.floor(vals[0].sx);
                 SC_evt_mouse_screen_y.innerHTML = (0 == vals.length)?"--"
                                                          :Math.floor(vals[0].sy);
               }.bind(undefined, theEvt))
            );
        return res;
      }
      
      this.m.addProgram(trackEvent(SC_evt_mouse_down));
      this.m.addProgram(trackEvent(SC_evt_mouse_move));
      this.m.addProgram(trackEvent(SC_evt_mouse_up));
      this.m.addProgram(trackEvent(SC_evt_touch_start));
      this.m.addProgram(trackEvent(SC_evt_touch_move));
      this.m.addProgram(trackEvent(SC_evt_touch_end));
      
      this.m.addProgram(
          SC.repeat(SC.forever
            , SC.act(function(m){
                  this.controlPanel.SC_Panel_fps.innerHTML = " FPS : "
                                                             +this.workspace.getFPS()+" ";
                }.bind(this))
            , SC.pause(200)
            )
        );
      this.m.addProgram(
          SC.repeat(SC.forever
            , SC.act(function(m){
                  this.controlPanel.SC_Panel_ips.innerHTML = " "+m.getIPS()+" ";
                }.bind(this))
            , SC.pause(200)
            )
        );
      this.m.addProgram(
          SC.repeat(SC.forever
              , SC.await(this.controlPanel.screenShotSensor)
              , SC.act(
                  function(){
                    if(undefined !== this.workspace.toDataURL){
                      this.controlPanel.screenShot.src=this.workspace.toDataURL("image/png");
                      }
                  }.bind(this)
                )
            )
        );
      this.m.addProgram(
          SC.repeat(SC.forever
            , SC.act(function(view, m){
                view.innerHTML=m.getInstantNumber();
                }.bind(this, SC_instant_n_cell)
                )
            , SC.act(function SC_updateTLBN(view, m){
                view.innerHTML=m.getTopLevelParallelBranchesNumber();
                }.bind(this, SC_toplevel_bn)
                )
            )
        );
      /*
       * on ajoute une instruction utilitaire
       */
      SC.write = function(msg){
        return SC.act(function(){
                   SC.writeInConsole(msg);
                 });
        }
    }
  , appInit: function(config){
      this.appInited = true;
      if(undefined !== config.appTitle.text){
        document.write("<title"
                          +((undefined === config.appTitle.lang)
                                    ?"":" lang='"+config.appTitle.lang+"'")
                          +">"
                       +config.appTitle.text+"</title>");
        }
      else{
        document.write("<title>"+config.appTitle+"</title>");
        }
      if(undefined !== config.appAuthors.content){
        document.write("<meta name='athor'"
                          +((undefined === config.appAuthors.lang)
                                    ?"":" lang='"+config.appAuthors.lang+"'")
                        +" content='"+config.appAuthors.content+"'/>");
        }
      else{
        document.write("<meta name='athor' content='"+config.appAuthors+"'/>");
        }
      if(undefined !== config.appDescription){
        if(undefined !== config.appDescription.content){
          document.write("<meta name='description' content='"
                            +((undefined === config.appDescription.lang)
                                      ?"":" lang='"+config.appDescription.lang+"'")
                         +config.appDescription.content+"'/>");
        }
        else{
          document.write("<meta name='description' content='"+config.appDescription+"'/>");
          }
        }
      if(undefined !== config.appKeywords){
        if(undefined !== config.appKeywords.content){
          document.write("<meta name='athor'"
                            +((undefined === config.appKeywords.lang)
                                      ?"":" lang='"+config.appKeywords.lang)+"'"+">"
                          +" content='"+config.appKeywords.content+"'/>");
          }
        else{
          document.write("<meta name='athor' content='"+config.appKeywords+"'/>");
          }
        }
      if(undefined === config.viewport){
        document.write("<meta name='viewport' content='width=device-width,height=device-height,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no'/>");
        }
      else{
        var tmp_vprt = "<meta name='viewport' content='"
        var data = config.viewport;
        var first = true;
        if(undefined !== data.width){
          tmp_vprt += (first?"":",")+"width="+data.width;
          first = false;
          }
        if(undefined !== data.height){
          tmp_vprt += (first?"":",")+"height="+data.height;
          first = false;
          }
        if(undefined !== data.init_scale){
          tmp_vprt += (first?"":",")+"initial-scale="+data.init_scale;
          first = false;
          }
        if(undefined !== data.max){
          tmp_vprt += (first?"":",")+"maximum-scale="+data.max;
          first = false;
          }
        if(undefined !== data.min){
          tmp_vprt += (first?"":",")+"minimum-scale="+data.min;
          first = false;
          }
        if(undefined !== data.scalable){
          tmp_vprt += (first?"":",")+"user-scalable="+data.scalable;
          first = false;
          }
        tmp_vprt += "'/>"
        document.write(tmp_vprt);
        }
      document.write("<meta name='apple-mobile-web-app-capable' content='yes'>");
      if(undefined !== config.statusBarConfig){
        document.write("<meta name='apple-mobile-web-app-status-bar-style'"
                     + " content='"+config.statusBarConfig+"'>");
        }
      else{
        document.write("<meta name='apple-mobile-web-app-status-bar-style'"
                     + " content='translucent white'>");
        }
      document.write("<meta name='apple-touch-fullscreen' content='yes'>");
      if(undefined !== config.startup_img){
        for(var i in config.startup_img){
          document.write("<link href='"+config.startup_img[i].rsrc+"'"
                       + ((undefined !== config.startup_img[i].media)
                            ?" media='"+config.startup_img[i].media+"'"
                            :"")
                       + " rel='apple-touch-startup-image'/>");
          }
        }
      if(undefined !== config.controler_style){
        document.write("<link rel ='stylesheet' type='text/css' href='"+config.controler_style+"' title='Style'/>");
        }
      if(undefined !== config.iconSet){
        for(var j in config.iconSet){
          var i = config.iconSet[j];
          var base_tmp = "<link"
                  + " sizes='"+i.size+"'"
                  + " href='"+i.url+"'";
          document.write(base_tmp
                  + " rel='apple-touch-icon"
                           + ((true == i.precomp)?"-precomposed":"")+"'/>"
                  );
          document.write(base_tmp
                  + " rel='icon'/>"
                  );
          document.write(base_tmp
                  + " rel='shortcut icon'/>"
                  );
          }
        }
      var m = SC.machine(config.tickTime, config.machineConfig);
      this.init(m);
      var tmp_par = SC.par(SC.pause(10));
      if(config.audioSupport){
        this.audioToolbox.init();
        tmp_par.add(SC.await(this.audioToolbox.audioLoaded));
        this.audioToolbox.loadAll();
        }
      if(config.controler){
        this.initPanel();
        if(config.controler_closed){
          this.controlPanel.toggle(false);
          }
        }
      this.t = [];
      SC_ify = function(p){
        var res;
        this.t.push(res = this.energize(p));
        return res;
        }.bind(this);
      this.splashScreen = this.makeDiv({
          id:"App_splashScreen"
          });
      if(undefined !== config.splashConfig){
        this.splashScreen = this.makeDiv({
            id:"App_splashScreen"
            , inH: "<div"
                   +((undefined !== config.splashConfig.background)?(" style='background:"+config.splashConfig.background+"'"):"")
                   +"> <div><span class='SC_splashH1'"
                   +((undefined !== config.splashConfig.title_style)?(" style='"+config.splashConfig.title_style +"'"):"")
                   + ">"+config.splashConfig.title+"</span></div> "
                   + "<img id='SC_splash_FB_loading' src='/images/gif/CP48_spinner.gif'/>"
                   + "<div class='SC_splashH3' style='display:none;'"
                   + " onclick='"
                   + "if((undefined != window.applicationCache)&&((window.applicationCache.IDLE !== window.applicationCache.status)"
                   + "    &&(window.applicationCache.UNCACHED !== window.applicationCache.status))){"
                   //+ "console.log(\"cache update pending\");"
                   + "return;};"
                   //+ "console.log(\"démarrage\");"
                   + "window.SC.tools.m.generateEvent("
                   + "SC_ClientTools.splashScreen.clickStartEvt);"
                   + ((config.voiceSupport)?" window.speechSynthesis.speak(new SpeechSynthesisUtterance(\"Démarrer\"));":"")
                   + " window.SC.tools.m.react();'"
                   + ">"+config.splashConfig.start
                   +"</div></div>"
            }
            );
        this.splashScreen.clickStartEvt = SC.sensor("startClick");
        this.splashScreen.SCSS_allLoaded = SC.evt("All Loaded");
        this.splashScreen.btn = this.splashScreen.children[0].children[2];
        //console.log(this.splashScreen.btn, this.splashScreen.btn.classList)
        window.addEventListener("load"
          , function(sp){
            this.appPageLoaded = true;
            if(undefined != window.applicationCache){
              //console.log("page loaded", window.applicationCache.status, window.applicationCache.IDLE, window.applicationCache.CHECKING);
              if(window.applicationCache.IDLE !== window.applicationCache.status && window.applicationCache.UNCACHED !== window.applicationCache.status){
                //console.log("still waiting for cache",window.applicationCache.status);
                return;
                }
              }
            //console.log("dismissing splash");
            this.splashScreen.children[0].children[1].style.display="none";
            this.splashScreen.children[0].children[2].style.display="";
            this.m.addProgram(
                SC.seq(
                  /*SC.log("awaiting evt")
                  , */SC.await(this.splashScreen.SCSS_allLoaded)
                  , SC.action(function(m){
                      this.splashScreen.parentElement.removeChild(
                                                            this.splashScreen);
                      }.bind(this)
                      )
                  , SC.generate(this.appStartedEvt)
                  )
                );
              }.bind(this, config.splashConfig.startEvt)
          );
        //console.log(tmp_par);
        this.m.addProgram(
          SC.seq(
            SC.await(this.splashScreen.clickStartEvt)
            //, SC.log("start clicked")
            , SC.action(function(m){
                this.audioToolbox.loadAll();
                this.splashScreen.btn.innerHTML="Loading..."
                }.bind(this)
                )
            //, SC.log("button reaction")
            , tmp_par
            //, SC.log("tmp par done")
            , SC.generate(this.splashScreen.SCSS_allLoaded)
            )
          );
        }
        else{
          this.m.addProgram(
            SC.seq(SC.pause(10),SC.generate((this.appStartedEvt)/*,SC.log("appstarted")*/))
            );
          }
        if(true == config.inspectorEnabled){
          this.initInspector();
          }
      }
  , displaySplash : function(){
      if(!this.appInited){
        console.log("Application Not inited, can't call this one.");
        return;
        }
      if(undefined == this.splashScreen){
        console.log("No splash Screen defined.");
        return;

        }
      document.body.appendChild(this.splashScreen);
      }
  , audioToolbox : {
      audioFormats:["audio/mp3", "audio/mp4"]
      , audioLoaded : SC.evt("audioLoaded")
      , audioExtensions:[".mp3",".mp4"]
      , extension:""
      , altextension:""
      , waittingLoad:SC.par()
      , sFXs:[]
      , addAudioFile: function(url, ticks){
          var res ;
          this.sFXs.push(res = {a:new Audio()
                                    , loadedEvt:SC.sensor("loaded")
                                    , endedEvt:SC.sensor("ended")
                                    , playing:false
                                    , rt:ticks
                                    });
          res.a.addEventListener("loadeddata", function(m, evt){
              m.generateEvent(this.sens);
            }.bind(res, SC_ClientTools.m));
          
          res.a.addEventListener("ended", function(m, evt){
              m.generateEvent(this.endedEvt);
              this.rt_count = this.rt;
              this.playing=false;
            }.bind(res, SC_ClientTools.m));
          this.waittingLoad.add(SC.await(res.loadedEvt));
          res.src = url+this.extension;
          res.a.needToLoad = true;
          res.play=function(){
            if(res.rt<0){
              res.a.play();
              }
            else if(res.rt_count>0){
              res.rt_count--;
              }
            else if(!res.playing){
              res.playing = true;
              res.a.play();
              }
          }
          return res;
        }
      , init:function(){
          if(undefined === SC_ClientTools.m){
            throw "initialize tools first";
            }
          var dummy = new Audio();
          /*
           * détermine un format audio supporté
           */
          for(var i in this.audioFormats){
            switch(dummy.canPlayType(this.audioFormats[i])){
              case "probably":{
                this.extension=this.audioExtensions[i];
                break;
                }
              case "maybe":{
                this.altextension=this.audioExtensions[i];
                break;
                }
              }
              if("" != this.extension){
                break;
                }
            }
          if(("" == this.extension) && ("" != this.altextension)){
            this.extension = this.altextension;
            }
          }
      , newAudioChunck:function(data){
          return new AudioChunk(data);
          }
      , mkBQFilter:function(p){
          var tmp = SC.tools.audioContext.createBiquadFilter();
          tmp.connect(SC.tools.audioContext.destination);
          tmp.type = (undefined !== p.type)?p.type:"bandpass";
          tmp.frequency.value=(undefined !== p.f)?p.f:2050;
          tmp.Q.value=(undefined !== p.Q)?p.Q:5;
          tmp.gain.value=(undefined !== p.g)?p.g:0;
          return tmp;
          }
      , loadAll:function(){
            SC_ClientTools.m.addProgram(
              SC.seq(
                this.waittingLoad
                , SC.generate(this.audioLoaded)
                )
              );
            for(var n in this.sFXs){
              if(this.sFXs[n] instanceof(AudioChunk)){
                var audio = this.sFXs[n];
                audio.load();
                }
              else{
                var audio = this.sFXs[n].a;
                if(audio.needToLoad){
                  /* Pour capturer le load dans une interaction */
                  audio.src = this.sFXs[n].src;
                  audio.load();
                  audio.needToLoad = false;
                  }
                }
              }
          }
    }
  , initTouchTracker : function(){
      this.touchTrackers = [];
      this.touchSensor = SC.sensor("sensTracking");
      window.addEventListener(
        "touchstart"
        , function(evt){
            var changes = evt.changedTouches;
            for(var i=0; i < changes.length; i++){
              var id = changes[i].identifier;
              var tracker = undefined;
              if(undefined == this.touchTrackers[id]){
                tracker = this.touchTrackers[id] = this.makeDiv({inH:" "});
                tracker.style.position="fixed";
                tracker.trackID = id;
                tracker.style.background = "yellow";
                tracker.style.padding = "20px";
                tracker.style.borderRadius="20px";
                tracker.style.display="none";
                tracker.style.transform="transform: translate(-50%, -50%);";
                document.body.appendChild(tracker);
                }
              else{
                tracker = this.touchTrackers[id];
                }
              this.generateEvent(tracker.css_topEvt, changes[i].screenY+"px");
              this.generateEvent(tracker.css_leftEvt, changes[i].screenX+"px");
              this.generateEvent(tracker.css_displayEvt, "");
              this.generateEvent(this.touchSensor, {x:changes[i].pageX, y:changes[i].pageY
                      , cx:changes[i].clientX, cy:changes[i].clientY
                      , sx:changes[i].screenX, sy:changes[i].screenY
                      , id:changes[i].identifier
                      });
              }
            }.bind(this)
        );
      window.addEventListener(
        "touchmove"
        , function(evt){
            var changes = evt.changedTouches;
            for(var i=0; i < changes.length; i++){
              var id = changes[i].identifier;
              var tracker = this.touchTrackers[id];
              this.generateEvent(tracker.css_topEvt, (changes[i].screenY-tracker.clientHeight/2)+"px");
              this.generateEvent(tracker.css_leftEvt, (changes[i].screenX-tracker.clientWidth/2)+"px");
              this.generateEvent(this.touchSensor, {x:changes[i].pageX, y:changes[i].pageY
                      , cx:changes[i].clientX, cy:changes[i].clientY
                      , sx:changes[i].screenX, sy:changes[i].screenY
                      , id:changes[i].identifier
                      });
              }
            }.bind(this)
        );
      window.addEventListener(
        "touchend"
        , function(evt){
            var changes = evt.changedTouches;
            for(var i=0; i < changes.length; i++){
              var id = changes[i].identifier;
              var tracker = this.touchTrackers[id];
              tracker.parentNode.removeChild(tracker);
              this.touchTrackers[id] = undefined;
              }
            }.bind(this)
        );
      window.addEventListener(
        "touchcancel"
        , function(evt){
            var changes = evt.changedTouches;
            for(var i=0; i < changes.length; i++){
              var id = changes[i].identifier;
              var tracker = this.touchTrackers[id];
              tracker.parentNode.removeChild(tracker);
              this.touchTrackers[id] = undefined;
              }
            }.bind(this)
        );
      }
    /**
      * Liste des paramètres :
      * { start_evt:null, end_evt:null , r_delay:0 , rm :null , speech:"" , repeat:1 }
      * - start_evt : événement SC de début du talk
      * - end_evt : événement SC de fin du talk
      * - r_delay : délais d'attente de réaction de la machine reactive à la
      *             fin du talk sur l'événement de fin du talk
      * - rm : machine réactive gérant le comportement du talk
      * - speech : texte du talk
      * - repeat : nombre de répétition du talk (SC.forever : répétition infinie)
      */
  , speech : function(params){
      params.get = function(field, d){
        return (undefined !== this[field])?this[field]:d;
        }
      var speeckable = new SpeechSynthesisUtterance(params.get("speech",""));
      speeckable.sc_startSpeakEvt = params.get("start_evt",SC.evt("start"));
      speeckable.sc_endedEvt = params.get("end_evt",SC.evt("stop"));
      speeckable.sc_delay = params.get("r_delay",0);
      speeckable.sc_m = params.get("rm",null);
      speeckable.sc_speak = function(){
        window.speechSynthesis.speak(this);
        };
      speeckable.sc_initSpeakable = function(m){
        this.sc_m = m;
        };
      speeckable.onend = function(){
        if(null == this.sc_m){
          console.log('no speak reactive machine !');
          return;
          }
        this.sc_m.generateEvent(this.sc_endedEvt);
        setTimeout(this.sc_m.react.bind(this.sc_m), this.sc_delay); 
        }.bind(speeckable);
      if(null !== speeckable.sc_m){
        var tmp_b =  SC.seq(
           SC.await(SC.my("sc_startSpeakEvt"))
           //, SC.log("speakable item realy start talking")
           , SC.action(SC.my("sc_speak"))
           , SC.await(SC.my("sc_endedEvt"))
           //, SC.log("speakable item realy ends talking")
           );
        speeckable.sc_m.addProgram(SC.seq(
               SC.cube(speeckable
                 , SC.seq(
                     SC.action(SC.my("sc_initSpeakable"))
                     //, SC.log("speackable item init...")
                     , SC.pause()
                     , (undefined !== params.repeat)?
                         SC.repeat(params.repeat, tmp_b)
                         : tmp_b
                     //, SC.log("speakable item terminates")
                     )
                 )
               //, SC.log("speakable item garbageable")
               )
             );
        }
        return speeckable;
      }
  , initNotificationSupport: function(){
      SC.tools.makeNotification = function(){}
      Notification.requestPermission(
           function(status){
             console.log(status); // les notifications ne seront affichées que si "autorisées"
             if(SC.tools.notificationGranted = ("granted" === status)){
               SC.tools.makeNotification = function(params){
                 var n = new Notification(params.title, params.p); // this also shows the notification
                 }
               }
             });
                 //var n = new Notification("Bonjour,", {body: "Merci d'avoir autorisé les notification pour ce site. Cette focntionnalité vous permettra d'être informé rapidement des modifications et des nouveautés qui seront publiées au fur et à mesure."});
      }
   /**
      * Liste des paramètres :
      * { prt:null }
      * - prt : élément DOM parent de la bubbleView.
      */
  , initSpeakingBubble : function(params){
      /*
       * Bulle de commentaire.
       */
      const killEvt = SC.evt("writting");
      const stopItEvt = SC.evt("stop it");
      const talkOKEvt = SC.evt("talkOK");
      const writeOKEvt = SC.evt("writeOKEvt");
      const propagateEvt = SC.evt("propagateEvt");
      const pauseAfterEnd = "pauseAfterEnd";
      const waitClick = "waitClick";
      const textSize = "textSize";
      const RESET = "reset";
      const setNewText = "setNewText";
      const progressiveText = "progressiveText";
      const displayNextBtn = "displayNextBtn";
      const talkMachine = SC.machine(undefined,{init:SC.pauseForever()})
      const bubble_frame = SC.tools.makeDiv({});
      const bubble_view = SC.tools.makeDiv({
        cl : "JFSCSS_text_bubble_0"
        , inH : ""
        , beh: SC.par(
            SC.seq(
              SC.await(killEvt)
              , SC.pause()
              , SC.repeat(SC.forever
                  , SC.kill(killEvt
                      , SC.seq(
                          SC.repeat(SC.my(textSize)
                            , SC.action(SC.my(progressiveText))
                            , SC.pause()
                            )
                          , SC.send(talkMachine, writeOKEvt)
                          )
                      , SC.generate(propagateEvt)
                      )
                  //, SC.log("typewritting finished")
                  , SC.when(propagateEvt
                      , SC.nop("no propagation")
                      , SC.test(SC.my(waitClick)
                          , SC.seq(SC.nop("wait ok")
                              , SC.action(SC.my(displayNextBtn))
                              , SC.await(SC.or(killEvt,stopItEvt))
                              , SC.actionWhen(killEvt, SC.NO_ACTION, SC.my(RESET))
                              )
                          , SC.seq(SC.nop("no wait")
                              , SC.pause(SC.my(pauseAfterEnd))
                              , SC.action(SC.my(RESET))
                              )
                          )
                       )
                  , SC.await(SC.or(killEvt,propagateEvt))
                  )
              )
            , SC.action(SC.my("activeTalk"))
            , SC.actionOn(killEvt
                , SC.my(setNewText)
                , undefined
                , SC.forever
                )
            )
        });
      bubble_view.writtingEvt = killEvt;
      bubble_view.stopItEvt = stopItEvt;
      bubble_view.talkOKEvt = talkOKEvt;
      bubble_view.activeTalk = function(){
        this.talkMachine.reactASAP();
        };
      bubble_view.waitClick = function(){
        /*console.log("waitClick ?", this._wc);*/
        return this._wc;
        };
      bubble_view.pauseAfterEnd = 0;
      bubble_view.text = "";
      bubble_view.toWriteTxt = "";
      bubble_view.toWriteTxtIdx = 0;
      bubble_view.displayNextBtn = function(){
        const ok = document.createElement("div");
        ok.style.textAlign="right";
        ok.innerHTML = "<em style='font-size:10px;cursor:pointer'>OK</em>";
        ok.onclick = function(){
          SC.tools.generateEvent(this.stopItEvt);
          this.talkMachine.generateEvent(this.talkOKEvt);
          this.talkMachine.reactASAP();
          }.bind(this)
        this.appendChild(ok);
        }
      bubble_view.textSize = function(){
        //console.log("get text Size : "+this.toWriteTxt.length);
        return this.toWriteTxt.length;
        };
      bubble_view.setNewText = function(val){
        function _(data){
          if(typeof data == "function"){
            return data();
            }
          return data;
          }
        var msg = val[this.writtingEvt][0];
        this.reset();
        if((undefined == msg)||(undefined == msg.txt)){
          console.log("no valid message sent to the bubble");
          return;
          }
        this.hidden=false;
        this.toWriteTxt = msg.txt;
        if(undefined !== msg.max_w){
          this.style.maxWidth=msg.max_w;
          }
        else{
          this.style.maxWidth="";
          }
        if(undefined !== msg.min_w){
          this.style.minWidth=msg.min_w;
          }
        else{
          this.style.minWidth="";
          }
        switch(msg.dir){
          case 0:{
            this.dir = 0;
            this.classList.remove(this.classList[0]);
            this.classList.add("JFSCSS_text_bubble_0");
            this.frame.style.bottom = "";
            this.frame.style.right = "";
            this.frame.style.left = msg.x;
            this.frame.style.top = msg.y;
            break;
            }
          case 1:{
            this.dir = 1;
            this.classList.remove(this.classList[0]);
            this.classList.add("JFSCSS_text_bubble_1");
            this.frame.style.bottom = "";
            this.frame.style.right = "";
            this.frame.style.left = msg.x;
            this.frame.style.top = msg.y;
            break;
            }
          case 2:{
            this.dir = 2;
            this.classList.remove(this.classList[0]);
            this.classList.add("JFSCSS_text_bubble_2");
            this.frame.style.bottom = "";
            this.frame.style.right = "";
            this.frame.style.left = msg.x;
            this.frame.style.top = msg.y;
            break;
            }
          case 3:{
            this.dir = 3;
            this.classList.remove(this.classList[0]);
            this.classList.add("JFSCSS_text_bubble_3");
            this.frame.style.top = "";
            this.frame.style.right = "";
            this.frame.style.left = msg.x;
            this.frame.style.bottom = _(msg.y);
            break;
            }
          case 4:{
            this.dir = 4;
            this.classList.remove(this.classList[0]);
            this.classList.add("JFSCSS_text_bubble_4");
            this.frame.style.top = "";
            this.frame.style.left = "";
            this.frame.style.right = _(msg.x);
            this.frame.style.bottom = _(msg.y);
            break;
            }
          case 5:{
            this.dir = 5;
            this.classList.remove(this.classList[0]);
            this.classList.add("JFSCSS_text_bubble_5");
            this.frame.style.bottom = "";
            this.frame.style.left = "";
            this.frame.style.right = _(msg.x);
            this.frame.style.top = _(msg.y);
            break;
            }
          default: {
            this.frame.style.top = msg.y;
            this.frame.style.left = msg.x;
            this.frame.style.bottom = "";
            this.frame.style.right = "";
            break;
            }
          }
        this._wc = (undefined != msg.waitClick)?msg.waitClick:false;
        this.pauseAfterEnd = (undefined != msg.pauseAfterEnd)?msg.pauseAfterEnd:0;
        this.frame.style.position=("fixed" == msg.mode)?"fixed":"absolute";
        };
      bubble_view.reset = function(){
        this.toWriteTxtIdx = 0;
        this.innerHTML = "";
        this.toWriteTxtIdx = 0;
        this.toWriteTxt = "";
        this.hidden = true;
        };
        /**
           * Liste des paramètres :
           * { start_evt:null, end_evt:null , r_delay:0 , rm :null , speech:"" , repeat:1 }
           * - start_evt : événement SC de début du talk
           * - end_evt : événement SC de fin du talk
           * - r_delay : délais d'attente de réaction de la machine reactive à la
           *             fin du talk sur l'événement de fin du talk
           * - rm : machine réactive gérant le comportement du talk
           * - speech : texte du talk
           * - repeat : nombre de répétition du talk (SC.forever : répétition infinie)
           */
      bubble_view.display = function(data){
        var tmp = SC.tools.speech({
          rm : this.talkMachine
          , speech: data.speech
          , r_delay: data.r_delay
          });
        this.talkMachine.addProgram(SC.seq(
            SC.next()
            , SC.pause()
            //, SC.log("talkingM: enterring pre talk beh")
            , SC.purge(data.pre)
            //, SC.log("talkingM: start talking")
            , SC.generate(tmp.sc_startSpeakEvt)
            , SC.send(SC.tools.m, this.writtingEvt, data)
            , SC.await(tmp.sc_endedEvt)
            ///, SC.log("talkingM: talk finished")
            , SC.purge(data.post)
            , SC.next()
            //, SC.log("talkingM: end of post talk beh")
            ));
        }
      bubble_view.progressiveText = function(){
        if(this.toWriteTxtIdx > this.toWriteTxt.length){
          return;
          }
        if("<" == this.toWriteTxt.charAt(this.toWriteTxtIdx)){
          //console.log("HTML tag");
          while(">" != this.toWriteTxt.charAt(this.toWriteTxtIdx)){
            this.toWriteTxtIdx++;
            }
          }
        this.toWriteTxtIdx++;
        this.innerHTML = this.toWriteTxt.substring(0,this.toWriteTxtIdx);
        }
      bubble_view.writeOKEvt = writeOKEvt;
      bubble_view.talkMachine = talkMachine;
      talkMachine.addProgram(SC.log("talk M inited"));
      bubble_view.hidden=true;
      bubble_frame.style.position="absolute";
      bubble_view.frame = bubble_frame;
      bubble_frame.style.zIndex="18";
      if((undefined !== params) && (undefined !== params.prt)){
        params.prt.appendChild(bubble_frame);
        }  
      bubble_frame.appendChild(bubble_view);
      return bubble_view;
      }
  , setCookie: function(cname, cvalue, params){
      var exdays = (params.days != undefined)?params.days:1;
      const d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      const expires = "expires="+d.toUTCString();
      const cookieString = cname + "=" + cvalue + ";" + expires + ";path=/"
          +((params.dmn != undefined)?";domain="+params.dmn:"");
      console.log(cookieString);
      document.cookie = cookieString;
      }
  , getCookie: function(cname){
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++){
        var c = ca[i];
        while(c.charAt(0) == ' '){
          c = c.substring(1);
          }
        if(c.indexOf(name) == 0){
          return c.substring(name.length, c.length);
          }
        }
      return "";
      }
  , addStyleSheet : function(name,rules){
      var style = document.styleSheets[0];
      //style.type = 'text/css';
      //document.getElementsByTagName('head')[0].appendChild(style);
      style.addRule(name, rules);
      }
//createClass('.whatever',"background-color: green;");
  , makeDataDrawer : function(){
      const div = document.createElement("div");
      const canvas = document.createElement("canvas")
      return div;
      }
  };
/**/
/* DOM Element Inspector */
/* JFS Inspector */
SC_ClientTools.initInspector = function(){
  if(undefined == this.m){
    throw "tools not initialized";
    }
  this.elementInspector = document.createElement("div");
  this.elementInspector.style.display="inline-block";
  this.elementInspector.style.position="fixed";
  this.elementInspector.style.color="rgba(255,255,255,0.9)";
  this.elementInspector.style.backgroundColor="rgba(0,0,0,0.6)";
  this.elementInspector.style.borderRadius="10px";
  this.elementInspector.style.padding="5px";
  this.elementInspector.set_xyEvt = SC.evt("panel_set_xy");
  this.elementInspector.showEvt = SC.evt("show");
  this.elementInspector.hideEvt = SC.evt("hide");
  this.elementInspector.makeCell = function(nom, init, el){
    this["$"+nom] = SC.cell({init:init, sideEffect: this["_"+nom].bind(this), eventList: el});
    Object.defineProperty(this, nom,{get : (function(nom){
      return this["$"+nom].val();
    }).bind(this, nom)});
    }
  this.elementInspector._updatePanel = function(val, evts){
    var pos = evts[this.set_xyEvt];
    if(undefined === pos){
      return null;
      }
    if((pos[0].x-this.panel_mid) > 0){
      if((pos[0].x-this.panel_mid) < window.innerWidth-80){
        this.style.left = (pos[0].x-this.panel_mid)+"px";
        }
      else{
        this.style.left = (window.innerWidth-80)+"px";
        }
      }
    else{
      this.style.left = "1px";
      }
    if(pos[0].y > 0){
      if(pos[0].y < window.innerHeight-10){
        this.style.top = pos[0].y+"px";
        }
      else{
        this.style.top = (window.innerHeight-10)+"px";
        }
      }
    else{
      this.style.top = "1px";
      }
    };
/* ---- */
  this.elementInspector.icobjListener = function(nom, evt){
    return SC.repeat(SC.forever
             , SC.await(evt)
             , SC.actionOn(evt, function(n, e, vals){
                 this[n].value = vals[e][0];
                 }.bind(this, nom, evt))
             );
  }
  this.elementInspector.setIcobjUnderInspectionEvt = SC.evt("setIcobjUnderInspection");
  this.elementInspector.setIcobjNoMoreInspectionEvt = SC.evt("setIcobjNoMoreInspection");
  this.elementInspector._icobjControled = function(val, evts){
    var e = evts[this.setIcobjUnderInspectionEvt];
    var i = val;
    if(undefined === e){
      e = evts[this.setIcobjNoMoreInspectionEvt];
      if(undefined === e){
        return val;
        }
      if(e[0] == val){
        this.background.value = "";
        this.position.value = "";
        this.display.value = "";
        this.left.value = "";
        this.top.value = "";
        this.color.value = "";
        this.opacity.value = "";
        this.font.value = "";
        this.border.value = "";
        this.borderRadius.value = "";
        this.width.value = "";
        this.height.value = "";
        this.padding.value = "";
        this.boxSizing.value = "";
        this.boxShadow.value = "";
        this.filter.value = "";
        this.outline.value = "";
        this.overflowX.value = "";
        this.overflowY.value = "";
        this.zoom.value = "";
        this.sc_title.value = "";
        this.sc_src.value = "";
        i = null;
        }
      else{
        return val;
        }
      }
    else{
      i = e[0];
      }
    this.controlTitle.innerHTML = (null == i)?"--":i.tagName;
    if(null !== i){
      this.background.value = i.style.background;
      this.position.value = i.style.position;
      this.display.value = i.style.display;
      this.left.value = i.style.left;
      this.top.value = i.style.top;
      this.color.value = i.style.color;
      this.opacity.value = i.style.opacity;
      this.font.value = i.style.font;
      this.border.value = i.style.border;
      this.borderRadius.value = i.style.borderRadius;
      this.width.value = i.style.width;
      this.height.value = i.style.height;
      this.padding.value = i.style.padding;
      this.margin.value = i.style.margin;
      this.boxSizing.value = i.style.boxSizing;
      this.boxShadow.value = i.style.boxShadow;
      this.filter.value = (undefined === i.style.WebkitFilter)?i.style.filter
                               :i.style.WebkitFilter;
      this.outline.value = i.style.outline;
      this.overflowX.value = i.style.overflowX;
      this.overflowY.value = i.style.overflowY;
      this.zoom.value = i.style.zoom;
      this.sc_title.value = i.title;
      this.sc_src.value = (undefined === i.src)?"":i.src;
      SC.tools.addProgram(
        SC.kill(SC.or(this.setIcobjUnderInspectionEvt,this.setIcobjNoMoreInspectionEvt)
          , SC.par(
              this.icobjListener("background", i.css_backgroundEvt)
              , this.icobjListener("position", i.css_positionEvt)
              , this.icobjListener("display", i.css_displayEvt)
              , this.icobjListener("top", i.css_topEvt)
              , this.icobjListener("left", i.css_leftEvt)
              , this.icobjListener("color", i.css_colorEvt)
              , this.icobjListener("opacity", i.css_opacityEvt)
              , this.icobjListener("font", i.css_fontEvt)
              , this.icobjListener("border", i.css_borderEvt)
              , this.icobjListener("borderRadius", i.css_borderRadiusEvt)
              , this.icobjListener("width", i.css_widthEvt)
              , this.icobjListener("height", i.css_heightEvt)
              , this.icobjListener("padding", i.css_paddingEvt)
              , this.icobjListener("margin", i.css_marginEvt)
              , this.icobjListener("boxSizing", i.css_boxSizingEvt)
              , this.icobjListener("boxShadow", i.css_boxShadowEvt)
              , ((undefined === i.style.WebkitFilter)?this.icobjListener("filter", i.css_filterEvt)
                   :this.icobjListener("filter", i.css_WebkitFilterEvt))
              , this.icobjListener("outline", i.css_outlineEvt)
              , this.icobjListener("overflowX", i.css_overflowXEvt)
              , this.icobjListener("overflowY", i.css_overflowYEvt)
              , (undefined === i.css_zoomEvt)?SC.nothing()
                  :this.icobjListener("zoom", i.css_zoomEvt)
              )
              , this.icobjListener("sc_title", i.titleEvt)
              , (undefined === i.srcEvt)?SC.nothing()
                                             :this.icobjListener("sc_src", i.srcEvt)
          )
      );
    }
    var mid = parseInt(window.getComputedStyle(this.controlTitle.parentNode).width)/2;
    this.panel_mid = isNaN(mid)?this.panel_mid:mid;
    return i;
    }
  /* the icobj under inspection */
  this.elementInspector.makeCell("icobjControled", null, [this.elementInspector.setIcobjUnderInspectionEvt
                                                         , this.elementInspector.setIcobjNoMoreInspectionEvt]);
  /* mise à jour de la position du panel */
  this.elementInspector.makeCell("updatePanel", null, [this.elementInspector.set_xyEvt]);
  this.elementInspector.sc_vis = false;
  this.elementInspector._display = function(val, evts){
      var tmp = evts[this.showEvt];
      if(undefined != tmp){
        this.sc_vis = true;
        return "";
        }
      var tmp = evts[this.hideEvt];
      if(undefined != tmp){
        this.sc_vis = false;
        return "none";
        }
      return val;
    }
  SC.cellify(this.elementInspector
           , "display"
           , undefined
           , [this.elementInspector.showEvt, this.elementInspector.hideEvt]
           , "style"
           );
  /* fonction pour créer des entrées dans l'inspector */
  function pilot(p/*{tr, title, ctrl_kind, lst, help}*/){
    if(undefined == p.title){
      throw 'no title provided';
      }
    var tr = (undefined == p.tr)?document.createElement("tr"):p.tr;
    tr.innerHTML ="<th>"+p.title+"</th><td></td>";
    var css_control = null;
    switch(p.ctrl_kind){
      case 1 : {
          css_control = document.createElement("select");
          for(var i in p.lst){
            var tmp = document.createElement("option");
            tmp.classList.add("icobj");
            tmp.innerHTML=p.lst[i];
            css_control.appendChild(tmp);
            }
          break;
        }
      default:
      case 2 : {
          if(undefined !== p.suggestions){
            css_control = document.createElement("div");
            var tmp_css_ctrl = document.createElement("input");
            tmp_css_ctrl.type = "text";
            css_control.appendChild(tmp_css_ctrl);
            tmp_css_ctrl = document.createElement("select");
            for(var i in p.suggestions){
              var tmp = document.createElement("option");
              tmp.classList.add("icobj");
              tmp.innerHTML=p.suggestions[i];
              tmp_css_ctrl.appendChild(tmp);
              }
            css_control.appendChild(tmp_css_ctrl);
            }
          else{
            css_control = document.createElement("input");
            css_control.type = "text";
            }
          break;
        }
      }
    if(p.numeric){
      css_control.onchange = function(evt){
        if(null != this.icobjControled){
          SC.tools.generateEvent(this.icobjControled[p.targetEventName], parseInt(evt.target.value));
          }
        }.bind(SC_ClientTools.elementInspector);
      }
    else{
      css_control.onchange = function(evt){
        if(null != this.icobjControled){
          SC.tools.generateEvent(this.icobjControled[p.targetEventName], evt.target.value);
          }
        }.bind(SC_ClientTools.elementInspector);
      }
    SC_ClientTools.elementInspector[p.title] = css_control;
    //JFS.inspector["v_"+p.title] = tr.children[1];
    tr.title = (undefined == p.help)?"an icobj css control":p.help;
    //tr.children[2].appendChild(css_control);
    tr.children[1].appendChild(css_control);
    return tr;
    }
  /* on ajout l'inspecteur dans la page */
  this.elementInspector.innerHTML = "<div style='text-align:center;border-bottom:2px solid white;'>"
         +"<img src='images/png/hideBtn.png' style='float:left;width:16px;'/>Element inspector on <em> </em></div>"
         +"<table>"
         +"<tr></t></table>"
  var table = SC_ClientTools.elementInspector.children[1];
  table.style.maxHeight = "50vh";
  table.style.height = "50vh";
  table.style.overflowY = "scroll";
  table.style.display = "inline-block";
  this.addProgram(
      SC.action(function(){
        document.body.appendChild(this.elementInspector);
        this.elementInspector.panel_mid = parseInt(window.getComputedStyle(this.elementInspector.children[0]).width)/2;
        this.elementInspector.style.display="none";
        }.bind(this))
      );
  this.elementInspector.hideClickSensor = SC.tools.m.systemEvent(SC_ClientTools.elementInspector.children[0].children[0],"click")
  this.elementInspector.children[0].children[0].addEventListener("mousedown", function(evt){
    evt.preventDefault();
    });
  this.elementInspector.controlTitle = SC_ClientTools.elementInspector.children[0].children[1];
  /* une entrée */
  var tr = table.children[0].children[0];
  pilot({tr:tr
       , ctrl_kind:1
       , title:"display"
       , lst:["", "none", "flex", "block", "inline", "inline-block"]
       , help: "the css display field"
       , targetEventName:"css_displayEvt"});
  var propTable = [
    {ctrl_kind:1
         , title:"position"
         , lst:["", "static", "relative", "absolute", "fixed"]
         , help: "the css position field"
         , targetEventName:"css_positionEvt"
         }
    , {ctrl_kind:2
         , title:"background"
         , help: "the css background field"
         , targetEventName:"css_backgroundEvt"
         , suggestions:["yellow", "pink", "blue", "green", "olive"]
         }
    , {ctrl_kind:2
         , title:"left"
         , help: "the css left property"
         , targetEventName:"css_leftEvt"
         }
    , {ctrl_kind:2
         , title:"top"
         , help: "the css top property"
         , targetEventName:"css_topEvt"
         }
    , {ctrl_kind:2
         , title:"color"
         , help: "the css color property"
         , targetEventName:"css_colorEvt"
         }
    , {ctrl_kind:2
         , title:"opacity"
         , help: "the css opacity property"
         , targetEventName:"css_opacityEvt"
         }
    , {ctrl_kind:2
         , title:"font"
         , help: "the css font property"
         , targetEventName:"css_fontEvt"
         }
    , {ctrl_kind:2
         , title:"border"
         , help: "the css border property"
         , targetEventName:"css_borderEvt"
         }
    , {ctrl_kind:2
         , title:"borderRadius"
         , help: "the css border-radius property"
         , targetEventName:"css_borderRadiusEvt"
         }
    , {ctrl_kind:2
         , title:"width"
         , help: "the css width property"
         , targetEventName:"css_widthEvt"
         }
    , {ctrl_kind:2
         , title:"height"
         , help: "css height property"
         , targetEventName:"css_heightEvt"
         }
    , {ctrl_kind:2
         , title:"padding"
         , help: "the css padding property"
         , targetEventName:"css_paddingEvt"
         }
    , {ctrl_kind:2
         , title:"margin"
         , help: "the css margin property"
         , targetEventName:"css_marginEvt"
         }
    , {ctrl_kind:1
         , title:"boxSizing"
         , lst:["", "intial", "inherit", "content-box", "border-box"]
         , help: "the css box-sizing property"
         , targetEventName:"css_boxSizingEvt"
         }
    , {ctrl_kind:2
         , title:"boxShadow"
         , help: "the css box-shadow property"
         , targetEventName:"css_boxShadowEvt"
         }
    , {ctrl_kind:2
         , title:"filter"
         , help: "the css filter property"
         , targetEventName:(undefined === this.elementInspector.style.WebkitFilter)?"css_filterEvt":"css_WebkitFilterEvt"
         }
    , {ctrl_kind:2
         , title:"outline"
         , help: "the css outline property"
         , targetEventName:"css_outlineEvt"
         }
    , {ctrl_kind:1
         , title:"overflowX"
         , lst:["", "visible", "hidden", "scroll", "auto", "initial", "inherit"]
         , help: "the css overflow-x property"
         , targetEventName:"css_overflowXEvt"
         }
    , {ctrl_kind:1
         , title:"overflowY"
         , lst:["", "visible", "hidden", "scroll", "auto", "initial", "inherit"]
         , help: "the css overflow-y property"
         , targetEventName:"css_overflowYEvt"
         }
    , {ctrl_kind:2
         , title:"zoom"
         , help: "the css zoom property"
         , targetEventName:"css_zoomEvt"
         }
    , {ctrl_kind:2
         , title:"sc_title"
         , help: "the title property"
         , targetEventName:"titleEvt"
         }
    , {ctrl_kind:2
         , title:"sc_src"
         , help: "the title property"
         , targetEventName:"srcEvt"
         }
    ];
  for(var i in propTable){
    table.children[0].appendChild(pilot(propTable[i]));
    }
  this.elementInspector.panel_mdSensor = this.m.systemEvent(this.elementInspector.children[0],"mousedown");
  this.elementInspector.panel_tsSensor = this.m.systemEvent(this.elementInspector.children[0],"touchstart");
  this.elementInspector.children[0].addEventListener("mousedown", function(evt){
    evt.preventDefault();
    });
  this.elementInspector.children[0].addEventListener("touchstart", function(evt){
    evt.preventDefault();
    });
  this.elementInspector.onMousePanelMove = function(vals){
    var pos = vals[0];
    if(undefined != pos){
      return {x : pos.cx, y: pos.cy};
      }
    }
  this.touchStart = this.m.systemEvent(document, "touchstart");
  this.touchMove = this.m.systemEvent(document, "touchmove");
  this.touchEnd = this.m.systemEvent(document, "touchend");
  this.mmSensor = this.m.systemEvent(window, "mousemove");
  this.muSensor = this.m.systemEvent(window, "mouseup");
  SC.tools.addProgram(SC.par(
      SC.repeat(SC.forever
              , SC.await(SC.or(this.elementInspector.panel_mdSensor, this.elementInspector.panel_tsSensor))
              , SC.kill(SC.or(this.muSensor, this.touchEnd)
                  , SC.par(
                      SC.filter(this.mmSensor
                          , this.elementInspector.set_xyEvt
                          , SC._(this.elementInspector , "onMousePanelMove")
                          , SC.forever
                          )
                      , SC.filter(this.touchMove
                          , this.elementInspector.set_xyEvt
                          , SC._(this.elementInspector, "onMousePanelMove")
                          , SC.forever
                          )
                      )
                  )
              )
      , SC.repeat(SC.forever
          , SC.await(this.elementInspector.set_xyEvt)
          , this.elementInspector.$updatePanel
          )
      , SC.repeat(SC.forever
          , SC.await(SC.or(this.elementInspector.showEvt
                        , this.elementInspector.hideEvt))
          , this.elementInspector.$display
          )
      , SC.repeat(SC.forever
          , SC.await(SC.or(this.elementInspector.setIcobjUnderInspectionEvt
                        , this.elementInspector.setIcobjNoMoreInspectionEvt))
          , this.elementInspector.$icobjControled
          )
      , SC.repeat(SC.forever
          , SC.await(this.elementInspector.setIcobjUnderInspectionEvt)
          , SC.generate(this.elementInspector.showEvt)
          )
      , SC.repeat(SC.forever
          , SC.await(this.elementInspector.setIcobjNoMoreInspectionEvt)
          , SC.generate(this.elementInspector.hideEvt)
          )
      , SC.repeat(SC.forever
          , SC.await(this.elementInspector.hideClickSensor)
          , SC.generate(this.elementInspector.hideEvt)
          )
      ));
  if(undefined !== SC.tools.controlPanel){
    SC.tools.controlPanel.setInspectorBtn();
    }
  }
/**/
  if((undefined !== WebAppcache)
      &&("" !== manifest)
      ){
    WebAppcache.writeStatusInConsole = function(){
      switch(WebAppcache.status){
        case WebAppcache.UNCACHED:{
          SC.writeInConsole("Application non en cache ...\n");
          break;
          }
        case WebAppcache.IDLE:{
          SC.writeInConsole("Acune opération sur le cache\n");
          break;
          }
        case WebAppcache.CHECKING:{
          SC.writeInConsole("Validation du cache en cours\n");
          break;
          }
        case WebAppcache.DOWNLOADING:{
          SC.writeInConsole("Chargement du cache en cours\n");
          break;
          }
        case WebAppcache.UPDATEREADY:{
          SC.writeInConsole("Cache mis à jour\n");
          break;
          }
        case WebAppcache.OBSOLETE:{
          SC.writeInConsole("Le cache n'est plus utilisé\n");
          break;
          }
        }
      }
    WebAppcache.writeStatusInConsole();
    WebAppcache.addEventListener('error', function(evt){
      SC.writeInConsole(
        navigator.onLine?"Erreur pendant la mise à jour du cache\n"
                        :"Application hors ligne\n");
      }.bind(SC_ClientTools));
    WebAppcache.addEventListener('updateready', function(evt){
      SC.writeInConsole("mise à jour disponible (redémarrez l'appli)\n");
      this.splashScreen.innerHTML="<div> <div><span class='SC_splashH1'>Une mise à jour vient d'être téléchargée</span><br>Cliquez sur le bouton redémarrer:</div> "
                     +"<div class='SC_splashRestart'"
                     +" onclick='window.location.reload();'"
                     +">Redémarrer</div></div>";
      document.body.appendChild(this.splashScreen);
      }.bind(SC_ClientTools));
    WebAppcache.addEventListener('cached', function(){
        SC.writeInConsole("WebApp en cache pour la première fois\n");
      }.bind(SC_ClientTools));
    WebAppcache.addEventListener('progress', function(evt){
      SC.writeInConsole("Chargement de la ressource "+evt.loaded+" sur "
                                +evt.total+"\n");
      }.bind(SC_ClientTools));
    WebAppcache.addEventListener('noupdate', function(evt){
      SC.writeInConsole("no cache update found\n");
      if(undefined !== this.splashScreen && this.appPageLoaded){
        this.splashScreen.children[0].children[1].style.display="none";
        this.splashScreen.children[0].children[2].style.display="";
        }
      }.bind(SC_ClientTools));
    }
  SC.speak = function(msg){
    return SC.action(function(m){ window.speechSynthesis.speak(this); }.bind(msg));
    };
  SC.click = function(clickable){
    return SC.action( function(){ this.dispatchEvent(new Event("click")); }.bind(clickable));
    }
  return SC_ClientTools;

})();
