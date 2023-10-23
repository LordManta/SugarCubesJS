/*
 * SC_Tools.js
 * Author : Jean-Ferdy Susini (MNF)
 * Created : 20/12/2014 18:46
 * Part of the SugarCubes Project
 * version : 5.0 alpha
 * implantation : 0.6
 * Copyleft 2014-2023.
 */
if(SC && SC.sc_build>1){
  SC.tools=(function(){
    var WebAppcache=window.applicationCache;
    var manifest=document.documentElement.manifest;
    function Zone(conf){
      if(undefined==conf){
        conf={};
        }
      if(undefined!==conf.zoneID){
        this.num=conf.zoneID;
        }
      this.x=0;
      this.y=0;
      this.r=0; 
      this.img_zoom=conf.img_zoom; 
      this.hidden=false;
      this.zoneVisible=conf.zoneVisible;
      this.bgcolor=conf.bg_color;
      this.zoneEvt=conf.zoneEvt;
      this.touched=false;
      this.img=conf.img;
      this.flip=false;
      this.rotateImg=(undefined==conf.rotateImg)?0:conf.rotateImg;
      };
    Zone.prototype.getBehavior=function(){
      var localKill=SC.evt("localKill");
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
    Zone.prototype.inside=function(x,y){
      var z=workspace.style.zoom;
      var rx=Math.abs(this.x-x/z+workspace.offsetLeft);
      var ry=Math.abs(this.y-y/z+workspace.offsetTop);
      return (rx<this.r)&&(ry<this.r);
      }
    Zone.prototype.filterStart= function(touch){
      var z = workspace.style.zoom;
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
    Zone.prototype.filterMove= function(touch){
      var z = workspace.style.zoom;
      if( this.id != touch.id ){
        return false;
        }
      if(!this.inside(touch.cx, touch.cy)){
        this.touched = false;
        return "zone1";
        }
      }
    Zone.prototype.filterEnd= function(touch){
      if(touch.id == this.id){
        this.touched = false;
        return "zone1";
        }
      }
    Zone.prototype.draw = function(ctx){
      if(this.hidden){
        return;
      }
      var theCtx = ctx.save();
      ctx.translate(this.x, this.y);
      if(this.zoneVisible){
        ctx.fillStyle = this.bgcolor;
        ctx.beginPath();
        ctx.arc(0,0,this.r, 0,2*Math.PI, false);
        ctx.fill();    
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
    var css_properties=[
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
    if(undefined!==document.documentElement.style.WebkitFilter){
      css_properties.push("WebkitFilter");
      }
    else{
      css_properties.push("filter");
      }
    function activateElement(tmp){
      tmp.beh = SC.cube(tmp, SC.nothing());
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
          if((SC_ClientTools.elementInspector.sc_vis) || (4 === evt.detail)){
              SC.tools.generateEvent(
                      SC_ClientTools.elementInspector.setIcobjUnderInspectionEvt
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
      if(undefined !== p.src){
        elt.setAttribute("src", p.src);
        }
      if(undefined !== p.alt){
        elt.setAttribute("alt", p.alt);
        }
      if(undefined !== p.title){
        elt.setAttribute("title", p.title);
        }
      function mkListener(sc_evt, m){
        return (sc_evt.isSensor)? function(evt){
              this.newValue(evt);
              }.bind(sc_evt)
            : function(m, evt){
              m.addToOwnEntry(this, evt);
              }.bind(sc_evt, m)
        };
      if(undefined !== p.evt_click){
        elt.evt_click = p.evt_click;
        elt.addEventListener("click"
             , mkListener(elt.evt_click, ((undefined === p.m)?this.m:p.m)));
        }
      if(undefined !== p.on_touchStart){
        elt.on_touchStartEvt= p.on_touchStart;
        elt.addEventListener("touchstart"
           , mkListener(elt.on_touchStartEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.on_touchStop){
        elt.on_touchStopEvt= p.on_touchStop;
        elt.addEventListener("touchend"
           , mkListener(elt.on_touchStopEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.on_touchCancel){
        elt.on_touchCancelEvt= p.on_touchCancel;
        elt.addEventListener("touchcancel"
           , mkListener(elt.on_touchCancelEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.on_mouseUp){
        elt.on_mouseUpEvt= p.on_mouseUp;
        elt.addEventListener("mouseup"
           , mkListener(elt.on_mouseUpEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.on_mouseDown){
        elt.on_mouseDownEvt= p.on_mouseDown;
        elt.addEventListener("mousedown"
           , mkListener(elt.on_mouseDownEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.on_keyDown){
        elt.on_keyDownEvt= p.on_keyDown;
        elt.addEventListener("keydown"
           , mkListener(elt.on_keyDownEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.on_keyUp){
        elt.on_keyUpEvt= p.on_keyUp;
        elt.addEventListener("keyup"
           , mkListener(elt.on_keyUpEvt, ((undefined === p.m)?this.m:p.m)))
        }
      if(undefined !== p.beh){
        elt.beh.addProgram(p.beh);
        }
      if(undefined !== elt.beh){
        if(p.m){
          p.m.addToOwnProgram(elt.beh);
          }
        else{
          SC_ClientTools.addProgram(elt.beh);
          }
        }
      return elt;
      }
    function makeElement(elt, p){
      const tmp=document.createElement(elt);
      if(undefined==p){
        p={};
        }
      const meths=p.actions;
      if(meths && "object"==typeof(meths)){
        for(var met of Object.keys(meths)){
          if("function"!=typeof(meths[met])){
            throw new Error("cubify fun "+meths[met]+" not valid");
            }
          tmp[met]=meths[met];
          }
        }
      if(p.sc_cubeInit){
        p.sc_cubeInit.call(tmp);
        }
      activateElement(tmp);
      return finishElement.call(this, tmp, p);
      }
  const bubble_view_setNewText=function(msg){
    function _(data){
      if('function'==typeof data){
        return data();
        }
      return data;
      };
    this.style.maxWidth=(msg.max_w)?msg.max_w:"";
    this.style.minWidth=(msg.min_w)?msg.min_w:"";
    this.frame.style.transform="";
    this.frame.style.bottom="";
    this.frame.style.right="";
    this.frame.style.left="";
    this.frame.style.top="";
    switch(msg.dir){
      case 0:{ 
        this.dir = 0;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_0");;
        this.frame.style.left = msg.x;
        this.frame.style.top = msg.y;
        break;
        }
      case 1:{ 
        this.dir = 1;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_1");
        this.frame.style.left = msg.x;
        this.frame.style.top = msg.y;
        break;
        }
      case 2:{ 
        this.dir = 2;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_2");
        this.frame.style.left = _(msg.x);
        this.frame.style.top = _(msg.y);
        break;
        }
      case 3:{ 
        this.dir = 3;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_3");
        this.frame.style.right = _(msg.x);
        this.frame.style.top = _(msg.y);
        break;
        }
      case 4:{ 
        this.dir = 4;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_4");
        this.frame.style.left = msg.x;
        this.frame.style.bottom = _(msg.y);
        break;
        }
      case 5:{ 
        this.dir = 5;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_5");
        this.frame.style.left = msg.x;
        this.frame.style.bottom = _(msg.y);
        break;
        }
      case 6:{ 
        this.dir = 6;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_6");
        this.frame.style.right = _(msg.x);
        this.frame.style.bottom = _(msg.y);
        break;
        }
      case 7:{ 
        this.dir = 7;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_7");
        this.frame.style.left = msg.x;
        this.frame.style.top = msg.y;
        break;
        }
      case 8:{ 
        this.dir = 8;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_8");
        this.frame.style.left = msg.x;
        this.frame.style.top = msg.y;
        this.frame.style.transform = 'translate(0, -50%)';
        break;
        }
      case 9:{ 
        this.dir = 9;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_9");
        this.frame.style.left = msg.x;
        this.frame.style.bottom = msg.y;
        break;
        }
      case 10:{ 
        this.dir = 10;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_10");
        this.frame.style.right = _(msg.x);
        this.frame.style.top = _(msg.y);
        break;
        }
      case 11:{ 
        this.dir = 11;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_11");
        this.frame.style.right = msg.x;
        this.frame.style.top = msg.y;
        this.frame.style.transform = 'translate(0, -50%)';
        break;
        }
      case 12:{ 
        this.dir = 12;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_12");
        this.frame.style.right = msg.x;
        this.frame.style.bottom = msg.y;
        break;
        }
      default: {
        this.dir = 0;      
        this.frame.style.top = msg.y;
        this.frame.style.left = msg.x;
        break;
        }
      }
    this.frame.style.position = ("fixed" == msg.mode)?"fixed":"absolute";
    };
  var sharedContext=null;
  var webKitAPI=false;
  if('AudioContext' in window){
    sharedContext=new AudioContext();
    }
  else if('webkitAudioContext' in window){
    try{
      sharedContext=new webkitAudioContext();
      webKitAPI=true;
      }
    catch(e){
      console.error("no Web Audio API");
      }
    }
  else{
    console.error("no Web Audio API");
    }
  var SC_ClientTools={
    init: function(m){
      if(this.m){
        console.log("already initialized...");
        return;
        }
      if(undefined===m || !m.isSCClock){
        m=SC.clock({ init: SC.pauseForever() });
        }
      Object.defineProperty(SC.tools, "m"
      , { value: m
        , writable: false
          }
        );
      this.setWorkspace(document);
      if("complete"!=document.readyState){
        this.addProgram=function(p){
          console.log("add before start", this.Evt_Sart);
          this.m.addProgram((this.Evt_Sart)
                ?SC.seq(SC.await(this.Evt_Sart), p):p);
          }.bind(this);
        this.generateEvent=function(evt, v){
          this.m.addProgram((this.Evt_Sart)
                ?SC.seq(SC.await(this.Evt_Sart), SC.generate(evt, p))
                :SC.generate(evt, p));
          }.bind(this);
        }
      else{
        this.addProgram=this.m.addProgram.bind(this.m);
        this.generateEvent=this.m.addEntry.bind(this.m);
        }
      }
  , workspace: document
  , setWorkspace: function(w){
      this.workspace=w;
      if(undefined===w.sc_getFPS){
        w.sc_getFPS=function(){return "NA";}
        }
      }
  , Evt_appStarted: SC.evt("appStarted")
  , appInited: false
  , makeDiv: makeElement.bind(this, "div")
  , makeP: makeElement.bind(this, "p")
  , makeUl: makeElement.bind(this, "ul")
  , makeInput: makeElement.bind(this, "input")
  , makeLabel: makeElement.bind(this, "label")
  , makeSpan: makeElement.bind(this, "span")
  , makeImage: function(args){
      var tmp=null;
      if(undefined!==args.w
         && undefined!==args.h
        ){
        tmp=new Image(args.w, args.h);
        }
      else{
        tmp=new Image();
        }
      activateElement(tmp);
      return finishElement.call(this, tmp, args);
      }
  , audioContext: sharedContext
  , activateElement: activateElement
  , configureElement: finishElement
  , energize: function(p){
      var tmp=finishElement.call(this
      , activateElement(document.currentScript.previousElementSibling)
      , p
        );
      return tmp;
      }
  , loadData: function(url, resEvt, engine){
      if(undefined===resEvt){
        resEvt=SC.sampled("lodingData("+url+")");
        }
      const xmlHttpReq=new XMLHttpRequest();
      xmlHttpReq.open("GET", url, true);
      xmlHttpReq.onload=(function(sensor){
          if(200==this.status || 0==this.status){
            sensor.newValue(this.responseText);
            }
          }).bind(xmlHttpReq, resEvt);
      xmlHttpReq.send(null);
      return resEvt;
      }
  , initPanel: function(){
      if(undefined===this.m){
        throw new Error("initialize tools first");
        }
      this.controlPanel={};
      this.controlPanel.win=document.createElement("div");
      this.controlPanel.win.id='SC_ControlPanel';
      this.controlPanel.toggle=function(b){
        var cpc = this.content;
        var hidden = "none" == cpc.style.display;
        if((true === b)||(false === b)){
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
      tmp.setAttribute("src", "images/png/Close.png");
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
      this.controlPanel.screenShotSensor = SC.sensorize({name:"screenShotSensor"
                         , dom_targets:[
                               {target:this.controlPanel.screenShot, evt:"click"}
                                       ]
                         });
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
      tmp.innerHTML="<tr><td><button onclick='SC_ClientTools.SC_controlMachine(event);'>Pause</button></td><td><button onclick='SC_ClientTools.m.newValue()'>Step</button></td></tr>";
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
      SC_evt_mouse_click = SC.sensorize({name:"SC_evt_mouse_click"
                         , dom_targets:[
                               {target:document, evt:"click"}
                                       ]
                         });
      SC_evt_mouse_down = SC.sensorize({name:"SC_evt_mouse_down"
                         , dom_targets:[
                               {target:document, evt:"mousedown"}
                                       ]
                         });
      SC_evt_mouse_up = SC.sensorize({name:"SC_evt_mouse_up"
                         , dom_targets:[
                               {target:document, evt:"mouseup"}
                                       ]
                         });
      SC_evt_mouse_move = SC.sensorize({name:"SC_evt_mouse_move"
                         , dom_targets:[
                               {target:document, evt:"mousemove"}
                                       ]
                         });
      SC_evt_touch_start = SC.sensorize({name:"SC_evt_touch_start"
                         , dom_targets:[
                               {target:document, evt:"touchstart"}
                                       ]
                         });
      SC_evt_touch_end = SC.sensorize({name:"SC_evt_touch_end"
                         , dom_targets:[
                               {target:document, evt:"touchend"}
                                       ]
                         });
      SC_evt_touch_cancel = SC.sensorize({name:"SC_evt_touch_cancel"
                         , dom_targets:[
                               {target:document, evt:"touchcancel"}
                                       ]
                         });
      SC_evt_touch_move = SC.sensorize({name:"SC_evt_touch_move"
                         , dom_targets:[
                               {target:document, evt:"touchmove"}
                                       ]
                         });
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
            , SC.action(function(evt, m){
                 var val = m.sensorValueOf(evt);
                 SC_evt_mouse_client_x.innerHTML = (undefined == val)?"--"
                                                          :Math.floor(val.clientX);
                 SC_evt_mouse_client_y.innerHTML = (undefined == val)?"--"
                                                          :Math.floor(val.clientY);
                 SC_evt_mouse_page_x.innerHTML = (undefined == val)?"--"
                                                          :Math.floor(val.x);
                 SC_evt_mouse_page_y.innerHTML = (undefined == val)?"--"
                                                          :Math.floor(val.y);
                 SC_evt_mouse_screen_x.innerHTML = (undefined == val)?"--"
                                                          :Math.floor(val.screenX);
                 SC_evt_mouse_screen_y.innerHTML = (undefined == val)?"--"
                                                          :Math.floor(val.screenY);
               }.bind(undefined, theEvt))
            );
        return res;
      }
      this.m.addToOwnProgram(trackEvent(SC_evt_mouse_down));
      this.m.addToOwnProgram(trackEvent(SC_evt_mouse_move));
      this.m.addToOwnProgram(trackEvent(SC_evt_mouse_up));
      this.m.addToOwnProgram(trackEvent(SC_evt_touch_start));
      this.m.addToOwnProgram(trackEvent(SC_evt_touch_move));
      this.m.addToOwnProgram(trackEvent(SC_evt_touch_end));
      this.m.addToOwnProgram(
          SC.repeat(SC.forever
            , SC.act(function(m){
                  this.controlPanel.SC_Panel_fps.innerHTML = " FPS : "
                                                             +this.workspace.getFPS()+" ";
                }.bind(this))
            , SC.pause(200)
            )
        );
      this.m.addToOwnProgram(
          SC.repeat(SC.forever
            , SC.act(function(m){
                  this.controlPanel.SC_Panel_ips.innerHTML = " "+m.getIPS()+" ";
                }.bind(this))
            , SC.pause(200)
            )
        );
      this.m.addToOwnProgram(
          SC.repeatForever(
                SC.await(this.controlPanel.screenShotSensor)
              , SC.action(
                  function(m){
                    if(undefined !== this.workspace.toDataURL){
                      this.controlPanel.screenShot.src=this.workspace.toDataURL("image/png");
                      }
                    }.bind(this))
            )
        );
      this.m.addToOwnProgram(
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
      SC.write = function(msg){
        return SC.act(function(){
                   SC.writeInConsole(msg);
                 });
        }
    }
  , appInit: function(config){
      this.appInited=true;
      if(undefined!==config.appTitle.text){
        document.write("<title"
                      +((undefined===config.appTitle.lang)
                           ?"":(" lang='"+config.appTitle.lang+"'"))
                      +">"
                      +config.appTitle.text+"</title>");
        }
      else{
        document.write("<title>"+config.appTitle+"</title>");
        }
      if(undefined!==config.appAuthors.content){
        document.write("<meta name='athor'"
                          +((undefined === config.appAuthors.lang)
                                    ?"":" lang='"+config.appAuthors.lang+"'")
                        +" content='"+config.appAuthors.content+"'/>");
        }
      else{
        document.write("<meta name='athor' content='"+config.appAuthors+"'/>");
        }
      if(undefined!==config.appDescription){
        if(undefined!==config.appDescription.content){
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
        var tmp_vprt="<meta name='viewport' content='"
        var data=config.viewport;
        var first=true;
        if(undefined!==data.width){
          tmp_vprt+=(first?"":",")+"width="+data.width;
          first=false;
          }
        if(undefined!==data.height){
          tmp_vprt+=(first?"":",")+"height="+data.height;
          first=false;
          }
        if(undefined!==data.init_scale){
          tmp_vprt+=(first?"":",")+"initial-scale="+data.init_scale;
          first=false;
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
      const config_m=(config.machineConfig)?config.machineConfig
                                           :{ delay: config.tickTime };
      if(!config_m.delay){
        config_m.delay=100;
        }
      config_m.name="SC_Tools_clock";
      const m=SC.clock(config_m);
      m.setStdOut(SC.writeInConsole);
      this.init(m);
      this.periodic=SC.periodic(config_m);
      this.m.bindTo(this.periodic);
      const tmp_par=SC.par(SC.pause(10));
      if(config.audioSupport){
        this.audioToolbox.init();
        tmp_par.add(SC.await(this.audioToolbox.Evt_audioLoaded));
        }
      if(config.controler){
        this.initPanel();
        if(config.controler_closed){
          this.controlPanel.toggle(false);
          }
        }
      this.t=[];
      SC_ify=function(p){
        var res;
        this.t.push(res=this.energize(p));
        return res;
        }.bind(this);
      this.splashScreen=this.makeDiv({
        id:"App_splashScreen"
        });
      if(undefined!==config.splashConfig){
        this.splashScreen=this.makeDiv({
            id:"App_splashScreen"
          , inH: "<div"
                +((undefined!=config.splashConfig.background)?(" style='background:"+config.splashConfig.background+"'"):"")
                +"> <div><span class='SC_splashH1'"
                +((undefined!=config.splashConfig.title_style)?(" style='"+config.splashConfig.title_style +"'"):"")
                +">"+config.splashConfig.title+"</span></div> "
                +"<img id='SC_splash_FB_loading' src='/images/gif/CP48_spinner.gif'/>"
                +"<div class='SC_splashH3' style='display:none;'>"
                +config.splashConfig.start
                +"</div></div>"
            }
          );
        const im_anim=this.splashScreen.children[0].children[1];
        const btn=this.splashScreen.children[0].children[2];
        this.splashScreen.Evt_clickStart=SC.sensor("Evt_clickStart"
        , { dom_targets: [{ target: btn
              , evt: "mousedown"
                }
              ]
            });
        this.m.bindTo(this.splashScreen.Evt_clickStart);
        this.splashScreen.Evt_allLoaded=SC.evt("Evt_allLoaded");
        this.splashScreen.btn=btn;
        window.addEventListener("load"
        , function(btn, ia){
            this.appPageLoaded=true;
            ia.style.display="none";
            btn.style.display="";
            this.m.addProgram(
              SC.seq(
                SC.await(this.splashScreen.Evt_allLoaded)
              , SC.action(function(m){
                  this.splashScreen.parentElement.removeChild(
                                                        this.splashScreen);
                  }.bind(this)
                  )
              , SC.generate(this.Evt_appStarted)
                )
              );
            }.bind(this, btn, im_anim)
          );
        this.m.addProgram(
          SC.seq(
            SC.await(this.splashScreen.Evt_clickStart)
          , SC.action(function(m){
              this.splashScreen.btn.innerHTML="Loading..."
              this.audioToolbox.loadAll();
              }.bind(this))
          , tmp_par
          , SC.generate(this.splashScreen.Evt_allLoaded)
            )
          );
        }
      else{
        this.m.addProgram(
          SC.seq(SC.pause(10),SC.generate((this.Evt_appStarted)))
          );
        }
      if(true == config.inspectorEnabled){
        this.initInspector();
        }
      }
    , displaySplash: function(){
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
    , speech: function(params){
        params.get=function(field, d){
          return (this[field])?this[field]:d;
          }
        const speeckable=new SpeechSynthesisUtterance(params.get("speech",""));
        speeckable.lang=params.get("lang", "fr-FR");
        speeckable.Evt_startSpeak=params.get("start_evt"
                                           , SC.evt("Evt_startSpeak"));
        speeckable.Sns_ended=params.get("stop_evt", SC.sensor("Sns_ended"));
        speeckable.Evt_cancel=params.get("cancel_evt", SC.evt("Evt_cancel"));
        speeckable.onend=speeckable.Sns_ended.newValue.bind(speeckable.Sns_ended);
        speeckable.sc_speech_beh=
          SC.kill(speeckable.Evt_cancel
          , SC.par(
              SC.seq(
                SC.await(speeckable.Evt_startSpeak)
              , SC.action(
                  window.speechSynthesis.speak.bind(window.speechSynthesis
                                                  , speeckable))
              , SC.await(speeckable.Sns_ended)
                )
            , SC.seq(
                SC.await(speeckable.Evt_cancel)
              , SC.action(
                  window.speechSynthesis.cancel.bind(window.speechSynthesis))
                )
              )
            );
          return speeckable;
        }
    , initNotificationSupport: function(){
        SC.tools.makeNotification = function(){}
        Notification.requestPermission(
             function(status){
               if(SC.tools.notificationGranted = ("granted" === status)){
                 SC.tools.makeNotification = function(params){
                   var n = new Notification(params.title, params.p); 
                   }
                 }
               });
        }
    , initSpeakingBubble: function(params){
        const Evt_newWritting = SC.evt("Evt_newWritting");
        const Evt_talkEnded=SC.evt("Evt_talkEnded");
        const Evt_bubbleFinish=SC.evt("Evt_bubbleFinish");
        const Sns_talkOK=SC.sensor("Sns_talkOK");
        const Evt_shadowReady = SC.evt("Evt_shadowReady");
        const getPauseAfterEnd = "getPauseAfterEnd";
        const hasToWaitClick = "hasToWaitClick";
        const textRemains = "textRemains";
        const RESET="reset";
        const setNewText = "setNewText";
        const progressiveText = "progressiveText";
        const displayNextBtn = "displayNextBtn";
        const bubble_frame = SC.tools.makeDiv({});
        const bubble_view = SC.tools.makeDiv({
          cl : "JFSCSS_text_bubble_0"
          , inH : ""
          , beh: SC.par(
              SC.seq(
                SC.await(Evt_newWritting)
              , SC.action("setNewText")
              , SC.pause()
              , SC.resetOn(Evt_newWritting
                , SC.par(
                    SC.seq(
                      SC.await(Evt_newWritting)
                    , SC.action("setNewText")
                    , SC.generate(Evt_bubbleFinish)
                    , SC.pause()
                      )
                  , SC.seq(
                      SC.par(
                        SC.kill(params.killAnim?params.killAnim
                                             :SC.evt("Evt_killAnim")
                        , SC.seq(
                            SC.await(Evt_shadowReady)
                          , SC.pause(2)
                          , SC.repeatIf(SC.my(textRemains)
                            , SC.action(SC.my(progressiveText))
                            , SC.pause()
                              )
                          , SC.action(SC.my("postTyped"))
                          , SC.await(Evt_shadowReady)
                          , SC.test(SC.my(hasToWaitClick)
                            , SC.seq(
                                SC.action(SC.my(displayNextBtn))
                              , SC.await(Sns_talkOK)
                                )
                            , SC.pause(SC.my(getPauseAfterEnd))
                              )
                            )
                          )
                      , SC.await(Evt_talkEnded)
                        )
                    , SC.generate(Evt_bubbleFinish)
                    , SC.action(SC.my(RESET))
                      )
                    )
                  )
                )
              )
        });
        bubble_view.jfs_shadow = document.createElement("div");
        bubble_view.jfs_shadow.style.display = "none";
        bubble_view.Evt_newWritting = Evt_newWritting;
        bubble_view.Sns_talkOK=Sns_talkOK;
        bubble_view.hasToWaitClick = function(){
          return this._wc;
          };
        bubble_view.pauseAfterEnd = 0;
        bubble_view.text = "";
        bubble_view.toWriteTxt = "";
        bubble_view.toWriteTxtIdx = 0;
        bubble_view.displayNextBtn=function(){
          const ok = document.createElement("div");
          ok.style.textAlign="right";
          ok.innerHTML="<em style='font-size:10px;cursor:pointer'>OK</em>";
          ok.onclick=this.Sns_talkOK.newValue.bind(this.Sns_talkOK);
          this.appendChild(ok);
          };
        bubble_view.textRemains=function(){
          return this.toWriteTxtIdx<this.toWriteTxt.length;
          };
        bubble_view.updateAppearance=bubble_view_setNewText;
        bubble_view.getPauseAfterEnd=function(){
          return this.pauseAfterEnd;
          };
        bubble_view.Evt_shadowReady=Evt_shadowReady;
        bubble_view.setNewText=function(m){
          const data=m.getValuesOf(this.Evt_newWritting);
          this.reset(m);
          if(data){
            const msg=data[0];
            this.style.color=(msg.clr)?msg.clr:"black";
            this.style.background=(msg.bgclr)?msg.bgclr:"yellow";
            this.hidden=false;
            this.ntAMode=msg.nTA
            this.jfs_shadow.innerHTML=this.jfs_shadow.jfs_rawMsg=msg.text;
            setTimeout(function(){
                JFS.postTreatmentOfDOM(this.jfs_shadow
                                 , function(){
                                     this.toWriteTxt=this.jfs_shadow.innerHTML;
                                     if(this.ntAMode){
                                       this.toWriteTxtIdx=this.toWriteTxt.length;
                                       }
                                     SC.tools.generateEvent(this.Evt_shadowReady);
                                     }.bind(this))
                }.bind(this));
            this.updateAppearance(msg);
            this._wc=(msg.waitClick)?msg.waitClick:false;
            this.pauseAfterEnd=(msg.pauseAfterEnd)?msg.pauseAfterEnd:0;
            }
          };
        bubble_view.postTyped=function(m){
          this.innerHTML=this.jfs_shadow.jfs_rawMsg;
          setTimeout(function(){
            JFS.postTreatmentOfDOM(this
                                 , function(){
                                     SC.tools.generateEvent(this.Evt_shadowReady);
                                     }.bind(this))
            }.bind(this));
          }
        bubble_view.reset=function(m){
          if(0==this.toWriteTxtIdx && !this.hidden){
            return;
            }
          this.toWriteTxtIdx=0;
          this.innerHTML="";
          this.hidden=true;
          };
        bubble_view.progressiveText=function(){
          if(this.toWriteTxtIdx>this.toWriteTxt.length){
            return;
            }
          if("<"==this.toWriteTxt.charAt(this.toWriteTxtIdx)){
            while(">"!=this.toWriteTxt.charAt(this.toWriteTxtIdx)
                  && (this.toWriteTxtIdx<this.toWriteTxt.length)){
              this.toWriteTxtIdx++;
              }
            }
          if("&"==this.toWriteTxt.charAt(this.toWriteTxtIdx)){
            while(";"!=this.toWriteTxt.charAt(this.toWriteTxtIdx)
                  && (this.toWriteTxtIdx<this.toWriteTxt.length)){
              this.toWriteTxtIdx++;
              }
            }
          this.toWriteTxtIdx++;
          this.innerHTML=this.toWriteTxt.substring(0,this.toWriteTxtIdx);
          };
        bubble_view.display=function(Evt_ka, data){
          if(data.icn && "function"==typeof(icn)){
            data.icn=icn();
            }
          data.pre=(data.icn)?(SC.seq(SC.action(function(icn){
                                             this.frame.appendChild(icn);
                                             this.jfs_icn=icn;
                                             }.bind(this, data.icn)), SC.purge(data.pre)))
                               :data.pre;
          data.post=(data.icn)?(SC.seq(SC.action(function(){
                                             if(this.jfs_icn){
                                               this.frame.removeChild(this.jfs_icn);
                                               this.jfs_icn=undefined;
                                               }
                                             }.bind(this)), SC.purge(data.post)))
                               :data.post;
          if(data.talk){
            const Sns_ended= SC.sensor("Sns_ended");
            SC.tools.addProgram(SC.seq(
                SC.purge(data.pre)
              , SC.generate(this.Evt_newWritting, data)
              , SC.pause()
              , SC.await(this.Evt_shadowReady)
              , SC.pause()
              , SC.action(function(evt, re){
                    const raw=this.jfs_shadow.innerHTML;
                    const speech_shadow=document.createElement("div");
                    speech_shadow.innerHTML=raw;
                    JFS.speechAlternative(speech_shadow);
                    const textToSpeak=(data.speech?data.speech
                                                  :speech_shadow.innerText);
                    const tmp = SC.tools.speech({ speech: textToSpeak
                                                , cancel_evt: data.kill
                                                , stop_evt: evt
                                                });
                    SC.tools.addProgram(
                      SC.seq(
                        SC.generate(tmp.Evt_startSpeak)
                      , tmp.sc_speech_beh
                        )
                      );
                    this.Sns_ended=tmp.Sns_ended;
                  }.bind(this, Sns_ended))
              , SC.await(SC.or(Sns_ended, Evt_ka))
              , SC.generate(Evt_talkEnded)
              , SC.await(Evt_bubbleFinish)
              , SC.purge(data.post)
                ));
            return { evt_cancel: data.kill };
            }
          else{
            if(data.text){
              SC.tools.addProgram(SC.seq(
                  SC.purge(data.pre)
                , SC.generate(this.Evt_newWritting, data)
                , SC.pause()
                , SC.generate(Evt_talkEnded)
                , SC.await(Evt_bubbleFinish)
                , SC.purge(data.post)
                  ));
              }
            }
          return {};
          }.bind(bubble_view, params.killAnim);
        bubble_view.hidden=true;
        bubble_frame.style.position="absolute";
        bubble_view.frame=bubble_frame;
        bubble_frame.style.zIndex="18";
        if(params && params.prt){
          params.prt.appendChild(bubble_frame);
          }  
        bubble_frame.appendChild(bubble_view);
        bubble_frame.appendChild(bubble_view.jfs_shadow);
        return bubble_view;
        }
    , simpleCommentBubble: function(params){
        if(params && params.anim){
          return this.initSpeakingBubble(params);
          }
        const bubble_frame = SC.tools.makeDiv({});
        const bubble_view = SC.tools.makeDiv({
          cl : "JFSCSS_text_bubble_0"
        , inH : ""
        });
        bubble_view.updateAppearance=bubble_view_setNewText;
        bubble_view.setText = function(msg){
          function _(data){
            if('function' == typeof data){
              return data();
              }
            return data;
            };
          this.innerHTML = msg.text;
          JFS.postTreatmentOfDOM(this);
          this.updateAppearance(msg);
          };
        bubble_view.display = function(data){
          if(data.icn && "function"==typeof(icn)){
            data.icn=icn();
            }
          data.pre = (data.icn)?(SC.seq(SC.action(function(icn){
                                             this.frame.appendChild(icn);
                                             }.bind(this, data.icn)), SC.purge(data.post)))
                               :data.pre;
          if(data.talk){
            const text = data.speech?data.speech:data.text;
            const tmp = SC.tools.speech({ speech: text });
            SC.tools.addProgram(tmp.sc_speech_beh);
            SC.tools.addProgram(SC.seq(
                SC.purge(data.pre)
              , SC.generate(tmp.Evt_startSpeak)
              , SC.action(this.setText.bind(this, data))
              , SC.await(tmp.Sns_ended)
              , SC.purge(data.post)
                ));
            }
          else{
            SC.tools.addProgram(SC.seq(
                SC.purge(data.pre)
              , SC.action(this.setText.bind(this, data))
              , SC.purge(data.post)
                ));
            }
          };
        bubble_frame.style.position="absolute";
        bubble_view.frame = bubble_frame;
        bubble_frame.style.zIndex="18";
        if(params && params.prt){
          params.prt.appendChild(bubble_frame);
          }  
        bubble_frame.appendChild(bubble_view);
        return bubble_view;
        }
    , setCookie: function(cname, cvalue, params){
        const exdays = (params.days)?params.days:1;
        const d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        const expires = "expires="+d.toUTCString();
        const cookieString = cname + "=" + cvalue + ";" + expires + ";path=/"
            +((params.dmn != undefined)?";domain="+params.dmn:"");
        document.cookie = cookieString;
        }
    , getCookie: function(cname){
        const name = cname + "=";
        const ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++){
          var c = ca[i];
          while(' ' == c.charAt(0)){
            c = c.substring(1);
            }
          if(0 == c.indexOf(name)){
            return c.substring(name.length, c.length);
            }
          }
        return "";
        }
    , addStyleSheet : function(name,rules){
        var style = document.styleSheets[0];
        style.addRule(name, rules);
        }
    , makeDataDrawer : function(){
        const div = document.createElement("div");
        const canvas = document.createElement("canvas")
        return div;
        }
  , crc32_bin: function(bytes){
      const crc=new Uint32Array(3);
      crc[0]=0xFFFFFFFF;
      const n=input.length;
      for(var i=0; i<n; i++){
        crc[1]=(bytes[i]&0xFF);
        for(var j=0; j<8; j++){
          crc[2]=((crc[1]>>j)^crc[0])&0x1;      
          crc[0]>>>= 1;
          if(crc[2]){
            crc[0]^=0xEDB88320;
            }
          }
        }
      crc[0]=~crc[0];
      return crc[0];
      }
  , signal_ft: function(signal , threshold = 1e-8){
      const N = signal.length;
      const DE_PI_N = 2*Math.PI/N;
      const ft = [];
      for(var f = 0; f < N; f++){
        const freq = {re: 0, im: 0};
        for(var t = 0; t < N; t++){
          const st = signal[t];
          const amp = (undefined !== st.re && undefined !== st.im)?Math.sqrt(st.re*st.re+st.im*st.im):st;
          if(isNaN(amp)){
            console.error("DFT error", amp, st);
            }
          const alpha = -DE_PI_N*f*t;
          const part = {
              re: amp*Math.cos(alpha)
            , im: amp*Math.sin(alpha)
            };
          freq.re += part.re;
          freq.im += part.im;
        }
        freq.re = (Math.abs(freq.re) < threshold)?0:freq.re;
        freq.im = (Math.abs(freq.im) < threshold)?0:freq.im;
        ft[f] = freq;
        }
      return ft;
      }
  , spectrum_ft: function(spectrum , threshold = 1e-8){
      const N = spectrum.length;
      const DE_PI_N = 2*Math.PI/N;
      const s = [];
      for(var t = 0; t < N; t++){
        const sig = {re: 0, im: 0};
        for(var f = 0; f < N; f++){
          const sf = spectrum[f];
          const alpha = DE_PI_N*f*t;
          const part = {
              re: Math.cos(alpha)
            , im: Math.sin(alpha)
            };
          sig.re += part.re*sf.re-part.im*sf.im;
          sig.im += part.re*sf.im+part.im*sf.re;
          }
        sig.re /= N;
        sig.im /= N;
        sig.re = (Math.abs(sig.re) < threshold)?0:sig.re;
        sig.im = (Math.abs(sig.im) < threshold)?0:sig.im;
        s[t] = sig;
        }
      return s;
      }
  , getRealParts: function(complex, mul){
      const N=complex.length;
      const mu=(mul)?mul:1;
      const norms=[];
      for(var i=0; i<N; i++){
        const c=complex[i];
        norms[i]=c.re*mu;
        }
      return norms;
      }
  , getNormsOf: function(complex, mul){
      const N=complex.length;
      const mu=(mul)?mul:1;
      const norms=[];
      for(var i=0; i<N; i++){
        const c=complex[i];
        norms[i]=mu*Math.sqrt(c.re*c.re+c.im*c.im);
        }
      return norms;
      }
  , applyFilter: function(complex, filter){
      const N=complex.length;
      const norms=[];
      for(var i=0; i<N; i++){
        const c=complex[i];
        const filtered=filter(i, c);
        norms[i]=filtered;
        }
      return norms;
      }
  , getUnSymNormsOf: function(complex, mul, disp0){
      const N=complex.length;
      const N2=Math.floor(N/2);
      const mu=(mul)?mul:1;
      const norms=[];
      for(var i=0; i<N; i++){
        const c=complex[i];
        if(disp0 || 0!=i){
          norms[(i<=N2)?(N2+i):i-N2]=mu*Math.sqrt(c.re*c.re+c.im*c.im);
          }
        }
      return norms;
      }
  , ranRange: function(max, min){
      min = (undefined === min)?0:min;
      const range = max-min;
      return Math.random()*range+min;
      }
  , ranRange_i: function(max, min){
      return parseInt(this.ranRange(parseInt(max), parseInt(min)));
      }
  , ran: function(amplitude, base){
      return Math.random()*amplitude+(base?base:0);
      }
  , rani: function(face, base){
      return parseInt(this.ran(parseInt(face), parseInt(base)));
      }
  , gauss: function(min, max, skew){
      let u=0.0, v=0.0;
      while(0===u){
        u=Math.random();
        }
      while(0===v){
        v=Math.random();
        }
      let num=Math.sqrt(-2.0*Math.log(u))*Math.cos(2.0*Math.PI*v);
      num=num/10.0+0.5;
      if(num>1 || num<0){ 
        num=this.gauss(min, max, skew);
        }
      num=Math.pow(num, skew);
      num*=max-min;
      num+=min;
      return num;
      }
  , gaussi: function(min, max, skew){
      return parseInt(this.gauss(parseInt(min), parseInt(max), skew));
      }
    };
  function AudioResource(url, ticks){
    const audio=new Audio(url);
    const Samp_loaded=SC.sampled("Evt_loaded");
    const Samp_ended=SC.sampled("Evt_ended");
    this.a=audio;
    this.Evt_loaded=Evt_loaded;
    this.Evt_ended=Evt_ended;
    this.playing=false;
    this.rt=ticks;
    this.rt_count=ticks;
    this.src=url;
    this.lh=function(evt){
      this.Samp_loaded.newValue();
      }.bind(this);
    audio.addEventListener("loadeddata", this.lh);
    this.eh=function(evt){
      this.Samp_ended.newValue();
      this.rt_count=this.rt;
      this.playing=false;
      }.bind(this);
    audio.addEventListener("ended", this.eh);
    };
  AudioResource.prototype.play=function(){
    if(this.rt<0){
      this.a.play();
      }
    else if(this.rt_count>0){
      this.rt_count--;
      }
    else if(!this.playing){
      this.playing=true;
      this.a.play();
      }
    };
  AudioResource.prototype.stop=function(){
    if(this.playing){
      this.playing=false;
      this.a.pause();
      this.a.currentTime=0;
      }
    };
  var microPhoneManager=sharedContext.createScriptProcessor(512);
  microPhoneManager.connect(sharedContext.destination);
  microPhoneManager.onaudioprocess=function(evt){};
  function AudioChunk(data){
    if(undefined===sharedContext){
      console.error("no Web Audio API");
      return false;
      }
    this.buffer=null;
    this.source=null;
    this.idx=SC_ClientTools.audioToolbox.sFXs.length;
    this.log="";
    this.Samp_ended=SC.sampled("Samp_ended");
    this.Samp_loaded=SC.sampled("Samp_"+this.idx+"_loaded");
    this.data=data;
    this.Evt_play=SC.evt("Evt_play");
    this.Evt_pause=SC.evt("Evt_pause");
    this.Evt_resume=SC.evt("Evt_resume");
    this.Evt_stop=SC.evt("Evt_stop");
    SC_ClientTools.addProgram(
      SC.seq(
        SC.await(this.Samp_loaded)
      , SC.repeatForever(
          SC.kill(this.Evt_stop
          , SC.seq(
              SC.await(this.Evt_play)
            , SC.action({ t: this, f: "play" })
            , SC.par(
                SC.seq(
                  SC.repeatForever(
                    SC.await(this.Evt_pause)
                  , SC.action({ t: this, f: "pause" })
                  , SC.await(this.Evt_resume)
                  , SC.action({ t: this, f: "resume" })
                    )
                  )
              , SC.seq(SC.await(this.Samp_ended), SC.generate(this.Evt_stop))
                )
              )
          , SC.action({ t: this, f: "stop" })
            )
          )
        )
      );
    this.load();
    };
  AudioChunk.prototype.load=function(){
    const decodedStr=atob(this.data);
    const len=decodedStr.length;
    const arrayBuff=new Uint8Array(len);
    for(var n=0; n<len; n++){
      arrayBuff[n]=decodedStr.charCodeAt(n);
      }
    SC.tools.audioContext.decodeAudioData(arrayBuff.buffer
    , function(audioData){
        this.buffer=audioData;
        this.Samp_loaded.newValue();
        }.bind(this));
    };
  AudioChunk.prototype.toString=function(){
    return "AudioToolbox.AudioChunk";
    };
  AudioChunk.prototype.setDestination=function(dest){
    this.dest=dest;
    if(null!=this.source){
      this.source.disconnect();
      this.source.connect(this.dest);
      }
    };
  AudioChunk.prototype.pause=function(){
          if(null !=  this.source){
            this.source.disconnect();
            }
          }
  AudioChunk.prototype.resume=function(){
          if(null !=  this.source){
            this.source.connect((undefined !== this.dest)?this.dest
                                   :SC.tools.audioContext.destination);
            }
          }
  AudioChunk.prototype.i=function(msg){
          return this.log += msg;
          }
  AudioChunk.prototype.play=function(){
    if(null!=this.source){
      return;
      }
    this.source=SC.tools.audioContext.createBufferSource();
    this.source.buffer=this.buffer;
    if(undefined!==this.dest){
      this.source.connect(this.dest);
      }
    else{
      this.source.connect(SC.tools.audioContext.destination);
      }
    this.source.onended=function(evt){
      this.Samp_ended.newValue();
      console.log("stop");
      this.stop();
      }.bind(this);
    this.source.start(0);
    };
  AudioChunk.prototype.stop=function(){
          if(null != this.source){
            this.source.stop(0);
            }
          this.source = null;
          }
    Object.defineProperty(SC_ClientTools, 'audioToolbox', {
        value: {
          audioFormats: ["audio/mp3", "audio/mp4"]
        , Evt_audioLoaded: SC.evt("Evt_audioLoaded")
        , audioExtensions: [".mp3", ".m4a"]
        , extension: ""
        , altextension: ""
        , waittingLoad: SC.par()
        , sFXs: []
        , init: function(){
            if(undefined===SC_ClientTools.m){
              throw new Error("initialize tools first");
              }
            var dummy=new Audio();
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
              if(""!=this.extension){
                break;
                }
              }
            if((""==this.extension) && (""!=this.altextension)){
              this.extension=this.altextension;
              }
            }
        , loadAudioFile: function(url, ticks){
            var res=new AudioResource(url, ticks);
            res.a.src=url;
            res.a.load();
            return res;
            }
        , addAudioFile: function(url, ticks){
            var res=new AudioResource(url, ticks);
            this.sFXs.push(res);
            this.waittingLoad.add(SC.await(res.Samp_loaded));
            res.a.sc_needToLoad=true;
            return res;
            }
        , newAudioChunck: function(data){
            var res=new AudioChunk(data);
            this.sFXs.push(res);
            this.waittingLoad.add(SC.await(res.Samp_loaded));
            return res;
            }
        , mkBQFilter: function(p){
            var tmp=SC.tools.audioContext.createBiquadFilter();
            tmp.connect(SC.tools.audioContext.destination);
            tmp.type=(undefined!==p.type)?p.type:"bandpass";
            tmp.frequency.value=(undefined!==p.f)?p.f:2050;
            tmp.Q.value=(undefined!==p.Q)?p.Q:5;
            tmp.gain.value=(undefined!==p.g)?p.g:0;
            return tmp;
            }
        , loadAll: function(){
            SC.tools.m.addProgram(
              SC.seq(
                this.waittingLoad
              , SC.generate(this.Evt_audioLoaded)
                )
              );
            for(var n in this.sFXs){
              if(this.sFXs[n] instanceof(AudioChunk)){
                var audio=this.sFXs[n];
                audio.load();
                }
              else{
                var audio=this.sFXs[n].a;
                if(audio.sc_needToLoad){
                  audio.src=this.sFXs[n].src;
                  audio.load();
                  audio.sc_needToLoad=false;
                  }
                }
              }
            }
          }
      , writable: false
        });
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
      this["$"+nom] = SC.cell({ init: init
                              , sideEffect: this["_"+nom].bind(this)
                              , eventList: el});
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
    this.elementInspector.makeCell("icobjControled", null, [this.elementInspector.setIcobjUnderInspectionEvt
                                                           , this.elementInspector.setIcobjNoMoreInspectionEvt]);
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
    function pilot(p){
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
      tr.title = (undefined == p.help)?"an icobj css control":p.help;
      tr.children[1].appendChild(css_control);
      return tr;
      }
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
    this.elementInspector.hideClickSensor
              = SC.sensorize({name:"hideClickSensor"
                           , dom_targets:[
                                 {target:SC_ClientTools.elementInspector
                                            .children[0].children[0], evt:"click"}
                                         ]
                           });
    this.elementInspector.children[0].children[0].addEventListener("mousedown", function(evt){
      evt.preventDefault();
      });
    this.elementInspector.controlTitle = SC_ClientTools.elementInspector.children[0].children[1];
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
    this.elementInspector.panel_mdSensor = SC.sensorize({name:"panel_mdSensor"
                           , dom_targets:[
                                 {
                                   target:this.elementInspector.children[0]
                                 , evt:"mousedown"
                                 }
                                         ]
                           });
    this.elementInspector.panel_tsSensor = SC.sensorize({name:"panel_tsSensor"
                           , dom_targets:[
                                 {
                                   target:this.elementInspector.children[0]
                                 , evt:"touchstart"
                                 }
                                         ]
                           });
    this.elementInspector.children[0].addEventListener("mousedown", function(evt){
      evt.preventDefault();
      });
    this.elementInspector.children[0].addEventListener("touchstart", function(evt){
      evt.preventDefault();
      });
    this.elementInspector.onMousePanelMove = function(pos){
      if(pos){
        return {x : pos.clientX, y: pos.clientY};
        }
      }
    this.touchStart = SC.sensorize({name:"touchStart"
                           , dom_targets:[
                                 {
                                   target:document
                                 , evt:"touchstart"
                                 }
                                         ]
                           });
    this.touchMove = SC.sensorize({name:"touchMove"
                           , dom_targets:[
                                 {
                                   target:document
                                 , evt:"touchmove"
                                 }
                                         ]
                           });
    this.touchEnd = SC.sensorize({name:"touchEnd"
                           , dom_targets:[
                                 {
                                   target:document
                                 , evt:"touchend"
                                 }
                                         ]
                           });
    this.mmSensor = SC.sensorize({name:"mmSensor"
                           , dom_targets:[
                                 {
                                   target:document
                                 , evt:"mousemove"
                                 }
                                         ]
                           });
    this.muSensor = SC.sensorize({name:"muSensor"
                           , dom_targets:[
                                 {
                                   target:document
                                 , evt:"mouseup"
                                 }
                                         ]
                           });
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
  }
else{
  throw new Error("SugarCubesJS must be loaded first");
  }
