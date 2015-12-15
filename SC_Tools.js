/*
 * SC_Tools.js
 * Author : Jean-Ferdy Susini
 * Created : 20/12/2014 18:46
 * Part of the SugarCubes Project
 * version : 5.0 alpha
 * implantation : 0.3
 * Copyright 2014-2015.
 */

SC.tools = (function(){
  /*
   * Gestion du cache local
   */
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
    stylizer.call(tmp, "width");
    stylizer.call(tmp, "minWidth");
    stylizer.call(tmp, "maxWidth");
    stylizer.call(tmp, "height");
    stylizer.call(tmp, "minHeight");
    stylizer.call(tmp, "maxHeight");
    stylizer.call(tmp, "top");
    stylizer.call(tmp, "left");
    stylizer.call(tmp, "right");
    stylizer.call(tmp, "bottom");
    stylizer.call(tmp, "background");
    stylizer.call(tmp, "border");
    stylizer.call(tmp, "display");
    stylizer.call(tmp, "position");
    stylizer.call(tmp, "color");
    stylizer.call(tmp, "opacity");
    stylizer.call(tmp, "font");
    stylizer.call(tmp, "borderRadius");
    stylizer.call(tmp, "padding");
    stylizer.call(tmp, "margin");
    stylizer.call(tmp, "textAlign");
    stylizer.call(tmp, "verticalAlign");
    stylizer.call(tmp, "boxSizing");
    stylizer.call(tmp, "boxShadow");
    stylizer.call(tmp, "outline");
    stylizer.call(tmp, "cursor");
    stylizer.call(tmp, "float");
    stylizer.call(tmp, "overflowX");
    stylizer.call(tmp, "overflowY");
    stylizer.call(tmp, "overflowY");
    stylizer.call(tmp, "zIndex");
    if(undefined !== tmp.style.WebkitFilter){
      stylizer.call(tmp, "WebkitFilter");
      }
    else{
      stylizer.call(tmp, "filter");
      }
    if(undefined !== tmp.style.WebkitFilter){
      stylizer.call(tmp, "WebkitFilter");
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
    if(p.inH){
      elt.innerHTML = p.inH;
      }
    if((undefined !== p.evt_click)&&(undefined !== p.m)){
      elt.evt_click = p.evt_click;
      elt.addEventListener("click", function(m, sc_evt, evt){
         m.generateEvent(sc_evt);
         }.bind(elt, p.m, elt.evt_click));
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
    if(undefined !== elt.beh){
      ((undefined === p.m)?SC_ClientTools:p.m).addProgram(elt.beh);
      }
    return elt;
    }
  function makeElement(elt){
    return function(p){
      var tmp = document.createElement(elt);
      activateElement(tmp);
      return finishElement(tmp, p);
      }
    }
/*
 **** Support audio.
 * On crée un AudioContext commun à tous les players.
 */
var sharedContext;
var webKitAPI = false;
if('AudioContext' in window){
  sharedContext = new AudioContext();
  }
else if('webkitAudioContext' in window){
  sharedContext = new webkitAudioContext();
  webKitAPI = true;
  }
else{
  alert('Your browser does not support yet Web Audio API');
  throw "no Web Audio API";
  }
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
    alert('Your browser does not support yet Web Audio API');
    throw "no Web Audio API";
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
              , SC.await(this.endedEvt)
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
      return finishElement(tmp, args);
      }
  , activateElement : activateElement
  , configureElement : finishElement
  , energize : function(p){
      var tmp = finishElement(
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
  , init : function(m){
      this.setWorkspace(document);
      this.m = m;
      this.addProgram = function(p){
        this.programsToAdd.add(p);
        }
      }
  , loadData : function(url, m){
      var resEvt = SC.sensor("lodingData("+url+")");
      var xmlHttpReq = new XMLHttpRequest();
      xmlHttpReq.open("GET", url, true);
      xmlHttpReq.send(null);
      xmlHttpReq.addEventListener('readystatechange'
                               , (function(machine, me, act){ return function(){
            if(4 == me.readyState){
              //console.log(me.responseText);
              if(200 == me.status || 0 == me.status){
                machine.generateEvent(resultEvt, me.responseText);
                }
              }
            }
          })(m, xmlHttpReq, resEvt)
          );
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
  , appInit(config){
      document.write("<title>"+config.appTitle+"</title>");
      document.write("<meta name='athor' content='"+config.appAuthors+"'/>");
      document.write("<meta name='description' content='"+config.appDescription+"'/>");
      document.write("<meta name='viewport' content='width=device-width,height=device-height,user-scalable=no'/>");
      document.write("<meta name='apple-mobile-web-app-capable' content='yes'>");
      document.write("<meta name='apple-mobile-web-app-status-bar-style' content='black'>");
      document.write("<meta name='apple-touch-fullscreen' content='yes'>");
      document.write("<link rel ='stylesheet' type='text/css' href='SC_Panel.css' title='Style'/>");
      this.programsToAdd=SC.par();
      var m = SC.machine(config.tickTime, config.machineConfig);
      this.init(m);
      var tmp_par = SC.par(SC.pause(50));
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
      if(undefined !== config.splashConfig){
        this.splashScreen = this.makeDiv({
            id:"App_splashScreen"
            , inH: "<div"
                   +((undefined !== config.splashConfig.background)?(" style='background:"+config.splashConfig.background+"'"):"")
                   +"> <div><span class='SC_splashH1'"
                   +((undefined !== config.splashConfig.title_style)?(" style='"+config.splashConfig.title_style +"'"):"")
                   + ">"+config.splashConfig.title+"</span></div> "
                   + "<div class='SC_splashH3'"
                   + " onclick='window.SC_ClientTools.m.generateEvent("
                   + "SC_ClientTools.splashScreen.clickStartEvt); window.SC_ClientTools.m.react();'"
                   + ">"+config.splashConfig.start
                   +"</div></div>"
            }
            );
        this.splashScreen.clickStartEvt = SC.sensor("startClick");
        this.splashScreen.SCSS_allLoaded = SC.evt("All Loaded");
        this.splashScreen.btn = this.splashScreen.children[0].children[1];
        //console.log(this.splashScreen.btn, this.splashScreen.btn.classList)
        window.addEventListener("load"
          , function(sp){
              document.body.appendChild(this.splashScreen);
              this.m.addProgram(
                SC.seq(
                  SC.await(this.splashScreen.SCSS_allLoaded)
                  , SC.action(function(m){
                      this.splashScreen.parentElement.removeChild(
                                                            this.splashScreen);
                      m.addProgram(this.programsToAdd);
                      this.addProgram = function(p){
                        this.m.addProgram(p);
                        }
                      }.bind(this)
                      )
                  )
                );
              }.bind(this, config.splashConfig.startEvt)
          );
        //console.log(tmp_par);
        this.m.addProgram(
          SC.seq(
            SC.await(this.splashScreen.clickStartEvt)
            , SC.action(function(m){
                this.audioToolbox.loadAll();
                this.splashScreen.btn.innerHTML="Loading..."
                }.bind(this)
                )
            , tmp_par
            , SC.generate(this.splashScreen.SCSS_allLoaded)
            )
          );
        }
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
      , newAudioChunck(data){
          return new AudioChunk(data);
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
  };
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
                     +" onclick='window.location = window.location;'"
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
    }
  return SC_ClientTools;
})();

