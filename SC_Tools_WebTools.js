/*
 * File : SC_Tools_WebTools.js
 * Author : Jean-Ferdinand SUSINI (MNF)
 * Created : 20/12/2014 18:46
 * Copyleft 2017-2024.
 */

;
if(SC && SC.sc_build>1 && SC.tools){
  Object.defineProperty(SC.tools, "Web"
  , { value: (function(params){
/*
Obsolète : gestion du Manifest HTML
*/
        if((undefined!==window.applicationCache)){
          var manifest=document.documentElement.manifest;
          if('string'==typeof(manifest) && ''!=manifest){
            var WebAppcache=window.applicationCache;
            WebAppcache._sc_writeStatusInConsole=function(){
              switch(WebAppcache.status){
                case WebAppcache.UNCACHED:{
                  SC.writeInConsole("SC_AppCache: Application non en cache ...\n");
                  break;
                  }
                case WebAppcache.IDLE:{
                  SC.writeInConsole("SC_AppCache: Acune opération sur le cache\n");
                  break;
                  }
                case WebAppcache.CHECKING:{
                  SC.writeInConsole("SC_AppCache: Validation du cache en cours\n");
                  break;
                  }
                case WebAppcache.DOWNLOADING:{
                  SC.writeInConsole("SC_AppCache: Chargement du cache en cours\n");
                  break;
                  }
                case WebAppcache.UPDATEREADY:{
                  SC.writeInConsole("SC_AppCache: Cache mis à jour\n");
                  break;
                  }
                case WebAppcache.OBSOLETE:{
                  SC.writeInConsole("SC_AppCache: Le cache n'est plus utilisé\n");
                  break;
                  }
                }
              }
            WebAppcache._sc_writeStatusInConsole();
            WebAppcache.addEventListener('error', function(evt){
              SC.writeInConsole(
                navigator.onLine?"Erreur pendant la mise à jour du cache\n"
                                :"Application hors ligne\n");
              }.bind(WebAppcache));
            WebAppcache.addEventListener('updateready', function(evt){
              SC.writeInConsole("mise à jour disponible (redémarrez l'appli)\n");
              this.splashScreen.innerHTML="<div> <div><span class='SC_splashH1'>Une mise à jour vient d'être téléchargée</span><br>Cliquez sur le bouton redémarrer:</div> "
                             +"<div class='SC_splashRestart'"
                             +" onclick='window.location.reload();'"
                             +">Redémarrer</div></div>";
              document.body.appendChild(this.splashScreen);
              }.bind(SC.tools));
            WebAppcache.addEventListener('cached', function(){
                SC.writeInConsole("WebApp en cache pour la première fois\n");
              }.bind(SC.tools));
            WebAppcache.addEventListener('progress', function(evt){
              SC.writeInConsole("Chargement de la ressource "+evt.loaded+" sur "
                                        +evt.total+"\n");
              }.bind(SC.tools));
            WebAppcache.addEventListener('noupdate', function(evt){
              SC.writeInConsole("no cache update found\n");
              if(undefined !== this.splashScreen && this.appPageLoaded){
                this.splashScreen.children[0].children[1].style.display="none";
                this.splashScreen.children[0].children[2].style.display="";
                }
              }.bind(SC.tools));
            }
          }
/*
Zone de control
*/
        function Zone(conf){
          if(undefined==conf){
            conf={};
            }
          if(undefined!==conf.zoneID){
            this.num=conf.zoneID;
            }
          this.x=0;
          this.y=0;
          this.r=0; // rayon du cercle tactile
          this.img_zoom=conf.img_zoom; // image associée
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
          //var rx = this.x - touch.cx/z+workspace.offsetLeft;
          //var ry = this.y - touch.cy/z+workspace.offsetTop;
          //var r = Math.sqrt(rx*rx + ry*ry);
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
        SC.globals.CP={
            Evt_appendElement: SC.evt("appendElement")
            };
// Inspector Panel
        Object.defineProperty(SC.tools, "initPanel"
        , { value: function(){
              var workspace= this;
              if(undefined===workspace.sc_getFPS){
                workspace.sc_getFPS=function(){ return "NA"; }
                }
              if(undefined===this.main){
                throw new Error("initialize tools first");
                }
              if(undefined!=this.controlPanel){
                //throw new Error("panel already init");
                console.warn("panel already init");
                return;
                }
              // <link rel="stylesheet" href="mesStyles.css">
              const cssLink=document.createElement("link");
              cssLink.setAttribute('rel', 'stylesheet');
              cssLink.setAttribute('href', params.tools.baseDir
                                           +'SC_Tools_Panel.css');
              document.head.appendChild(cssLink);
              const controlPanel={};
              controlPanel.win=document.createElement("div");
              controlPanel.win.id='SC_ControlPanel';
              controlPanel.toggle=function(b){
                var cpc=this.content;
                var hidden="none"==cpc.style.display;
                if((true===b) || (false===b)){
                  hidden=b;
                  }
                cpc.style.display = (hidden)?"block":"none";
                if(hidden){
                  this.win.style.paddingBottom="2px";
                  }
                else{
                  this.win.style.paddingBottom="5px";
                  }
                }.bind(controlPanel)
              window.addEventListener("load", function(){
                  document.body.appendChild(this.win);
                  }.bind(controlPanel)
                  );
              var tmp=new Image(30,30);
              tmp.setAttribute("src", "images/png/Close.png");
              tmp.onclick=controlPanel.toggle;
              tmp.style.margin="0";
              tmp.style.padding="0";
              controlPanel.win.appendChild(tmp);
              controlPanel.content=document.createElement("div");
              controlPanel.content.setAttribute("id","SC_CP_content");
              controlPanel.win.appendChild(controlPanel.content);
              controlPanel.console=document.createElement("div");
              controlPanel.console.setAttribute("id", "SC_console");
              tmp=document.createElement("p");
              tmp.style.margin="0";
              tmp.style.padding="0";
              tmp.textContent="ScreenShot :";
              controlPanel.screenShot=new Image();
              controlPanel.screenShot.setAttribute("id","SC_ScreenShot_pic");
              controlPanel.Sens_screenShot=SC.sensor("screenShot"
                                 , { dom_targets:[
                                       { target: controlPanel.screenShot
                                       , evt:"click" } ] });
              tmp.appendChild(controlPanel.screenShot);
              controlPanel.content.appendChild(tmp);
              tmp=document.createElement("p");
              tmp.textContent="IPS: ";
              controlPanel.SC_Panel_ips=document.createElement("span");
              tmp.appendChild(controlPanel.SC_Panel_ips);
              controlPanel.SC_Panel_fps=document.createElement("span");
              tmp.appendChild(controlPanel.SC_Panel_fps);
              controlPanel.content.appendChild(tmp);
              var tmpTable=document.createElement("table");
              tmpTable.setAttribute("id", "SC_mouse_tracker");
              tmpTable.innerHTML="<tr><th></th><th>x</th><th>y</th></tr>";
              tmp=document.createElement("tr");
              tmp.innerHTML="<th>offset</th>";
              const SC_evt_mouse_offset_x=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_offset_x);
              const SC_evt_mouse_offset_y=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_offset_y);
              tmpTable.appendChild(tmp);
              tmp=document.createElement("tr");
              tmp.innerHTML="<th>client</th>";
              const SC_evt_mouse_client_x=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_client_x);
              const SC_evt_mouse_client_y=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_client_y);
              tmpTable.appendChild(tmp);
              tmp=document.createElement("tr");
              tmp.innerHTML="<th>page</th>";
              const SC_evt_mouse_page_x=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_page_x);
              const SC_evt_mouse_page_y=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_page_y);
              tmpTable.appendChild(tmp);
              tmp=document.createElement("tr");
              tmp.innerHTML="<th>screen</th>";
              const SC_evt_mouse_screen_x=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_screen_x);
              const SC_evt_mouse_screen_y=document.createElement("td");
              tmp.appendChild(SC_evt_mouse_screen_y);
              tmpTable.appendChild(tmp);
              controlPanel.content.appendChild(tmpTable);
              tmpTable=document.createElement("table");
              tmpTable.setAttribute("id", "SC_reactive_machine_info");
              tmp=document.createElement("tr");
              tmp.innerHTML="<th>toplevel branches:</th>";
              const SC_toplevel_bn=document.createElement("td");
              tmp.appendChild(SC_toplevel_bn);
              tmpTable.appendChild(tmp);
              tmp=document.createElement("tr");
              controlPanel.SC_controlMachine=function(evt){
                if("Resume"==evt.target.innerHTML){
                  SC.tools.resumeMain();
                  }
                else{
                  SC.tools.pauseMain();
                  }
                evt.target.textContent=(("Pause"==evt.target.textContent)
                                             ?"Resume":"Pause");
                };
              tmp.innerHTML="<td><button>Pause</button></td>"
                           +"<td><button>Step</button></td>";
              tmp.children[0].children[0]
                   .onclick=controlPanel.SC_controlMachine.bind(SC.tools);
              controlPanel.Sens_stepper=SC.sensor("Sens_stepper"
                               , { dom_targets: [{
                                       target: tmp.children[1].children[0]
                                     , evt: "click"
                                       }
                                     ]
                               });
              this.main.bindTo(controlPanel.Sens_stepper);        
              tmpTable.appendChild(tmp);
              tmp=document.createElement("tr");
              tmp.innerHTML="<th>instant:</th>";
              const SC_instant_n_cell=document.createElement("td");
              tmp.appendChild(SC_instant_n_cell);
              tmpTable.appendChild(tmp);
              controlPanel.content.appendChild(tmpTable);
              controlPanel.content.appendChild(document.createElement("br"));
              controlPanel.content.appendChild(controlPanel.console);
              //if(undefined !== this.elementInspector){
              //  this.controlPanel.setInspectorBtn();
              //  }
              const Sens_pointerEvtTracker= SC.sensor("Sens_pointerEvtTracker"
                                 , { dom_targets: [
                                       { target: document, evt: "click" }
                                     , { target: document, evt: "mousedown" }
                                     , { target: document, evt: "mouseup" }
                                     , { target: document, evt: "mousemove" }
                                     , { target: document, evt: "touchstart" }
                                     , { target: document, evt: "touchend" }
                                     , { target: document, evt: "touchcancel" }
                                     , { target: document, evt: "touchmove" }
                                               ]
                                 });
              controlPanel.writeInPanel=function(msg, nl){
                if(nl){
                  this.console.appendChild(document.createElement("br"));
                  }
                this.console.appendChild(document.createTextNode(msg));
                console.log.apply(console, arguments);
                };
              SC.writeInPanel= controlPanel.writeInPanel.bind(controlPanel);
              const Prg_trackEvent=
                SC.repeatForever(
                  SC.await(Sens_pointerEvtTracker)
                , SC.action(function(m){
                      const val= m.sensorValueOf(Sens_pointerEvtTracker);
                      SC_evt_mouse_offset_x.textContent= Math.floor(val.offsetX);
                      SC_evt_mouse_offset_y.textContent= Math.floor(val.offsetY);
                      SC_evt_mouse_client_x.textContent= Math.floor(val.clientX);
                      SC_evt_mouse_client_y.textContent= Math.floor(val.clientY);
                      SC_evt_mouse_page_x.textContent= Math.floor(val.x);
                      SC_evt_mouse_page_y.textContent= Math.floor(val.y);
                      SC_evt_mouse_screen_x.textContent= Math.floor(val.screenX);
                      SC_evt_mouse_screen_y.textContent= Math.floor(val.screenY);
                      })
                  );
              controlPanel.Act_screenShotCapture=  function(m){
                  if(workspace.toDataURL){
                    this.screenShot.src= workspace.toDataURL("image/png");
                    }
                  };
              controlPanel.Act_updateIPS= function(m){
                  this.SC_Panel_ips.textContent=" "
                                   +SC.tools.main.getIPS()+" ";
                  };
              controlPanel.Act_updateFPS= function(m){
                  if(workspace && workspace.sc_getFPS){
                    this.SC_Panel_fps.textContent=" FPS : "
                                +workspace.sc_getFPS()+" ";
                    }
                  };
              controlPanel.Act_appendElement= function(re){
                  const data= re.getValuesOf(SC.globals.CP.Evt_appendElement);
                  if(data){
                    const inspector_btn= data[0];
                    this.content.appendChild(inspector_btn);
                    }
                  };
              controlPanel.Act_updateParallelBranchesNumber= function(m){
		  SC_toplevel_bn.textContent= m.getTopLevelParallelBranchesNumber();
	          };
              controlPanel.Act_updateInstantNumber= function(m){
		  SC_instant_n_cell.textContent= m.getInstantNumber();
	          };
              this.addProgram(
                SC.cube(controlPanel
                , SC.par(
                    SC.repeatForever(
                      SC.await(SC.globals.CP.Evt_appendElement)
                    , SC.action("Act_appendElement")
                      )
                  , Prg_trackEvent
                  , SC.repeatForever(
                      SC.action("Act_updateFPS")
                    , SC.pause(200)
                      )                    
                  , SC.repeat(SC.forever
                    , SC.action("Act_updateIPS")
                    , SC.pause(200)
                      )
                  , SC.repeatForever(
                      SC.await(controlPanel.Sens_screenShot)
                    , SC.action("Act_screenShotCapture")
                      )
		  , SC.repeatForever(
                      SC.action("Act_updateInstantNumber")
                    , SC.action("Act_updateParallelBranchesNumber")
                      )
                    )
                  )
                );
              this.main.setStdOut(controlPanel.writeInPanel.bind(controlPanel));
              Object.defineProperty(this, "controlPanel"
              , { value: controlPanel
                , writable: false
                  }
                );
              Object.defineProperty(this, "setWorkspace"
              , { value: function(w){
                    workspace= w;
                    if(undefined===w.sc_getFPS){
                      w.sc_getFPS=function(){ return "NA"; }
                      }
                    }
                , writable: false
                  }
                );
              }
          , writable: false
            }
          );
        Object.defineProperty(SC.globals, "Evt_Start"
        , { value: SC.evt("Start")
          , writable: false
            }
          );
        // WebApp Parameters
        if(this==window && params.appConfig){
          if(document.body){
            throw new Error("Initialisation too late: WebApp init must be called as soon as possible while parsing the header of the page");
            }
          if(SC.tools.appInited){
            throw new Error("Initialisation already occured");
            }
          const config= params.appConfig;
          Object.defineProperty(SC.tools, "appInited"
          , { value: true
            , writable: false
              }
            );
          // Construction des méta données de la page...
          // - Le titre 
          var headTag= document.createElement("title");          
          if(config.appTitle && config.appTitle.text){
            if(config.appTitle.lang){
              headTag.setAttribute('lang', config.appTitle.lang);
              }
            headTag.textContent= config.appTitle.text;
            }
          else if("string"==typeof(config.appTitle)){
            headTag.textContent= config.appTitle;
            }
          else{
            headTag.textContent= config.appTitle= "Sans Nom";
            }
          document.head.appendChild(headTag);
          // - Le ou les auteurs
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'author');
          if(config.appAuthors && undefined!==config.appAuthors.content){
            if(config.appAuthors.lang){
              headTag.setAttribute('lang', config.appAuthors.lang);
              }
            headTag.setAttribute('content', config.appAuthors.content);
            }
          else if("string"==typeof(config.appAuthors)){
            headTag.setAttribute('content', config.appAuthors);
            }
          else{
            headTag.setAttribute('content', 'Sans auteur...');
            }
          document.head.appendChild(headTag);
          // - La description de la page
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'description');
          if(config.appDescription){
            if(config.appDescription.content){
              if(config.appDescription.lang){
                headTag.setAttribute('lang', config.appDescription.lang);
                }
              headTag.setAttribute('content', config.appDescription.content);
              }
            else if("string"==typeof(config.appDescription)){
              headTag.setAttribute('content', config.appDescription);
              }
            }
          else{
            headTag.setAttribute('content', 'Sans description...');
            }
          document.head.appendChild(headTag);
          // - Les mots clés qui ne sont ajoutés que si définis.
          if(config.appKeywords){
            headTag=document.createElement("meta");
            headTag.setAttribute('name', 'keywords');
            if(undefined!==config.appKeywords.content){
              if(config.appKeywords.lang){
                headTag.setAttribute('lang', config.appKeywords.lang);
                }
              headTag.setAttribute('content', config.appKeywords.content);
              }
            else if("string"==typeof(config.appKeywords)){
              headTag.setAttribute('content', config.appKeywords);
              }
            else{
              headTag.setAttribute('content', "Problème de définition des mots clés");
              }
            document.head.appendChild(headTag);
            }
          // - Le viewport
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'viewport');
          if(!config.viewport){
            headTag.setAttribute('content'
            , 'width=device-width,height=device-height,initial-scale=1'
                 +',maximum-scale=1,minimum-scale=1,user-scalable=no');
            }
          else{
            var tmp_vprt= "";
            var data= config.viewport;
            var first= true;
            if(undefined!==data.width){
              tmp_vprt+=(first?"":",")+"width="+data.width;
              first= false;
              }
            if(undefined!==data.height){
              tmp_vprt+=(first?"":",")+"height="+data.height;
              first= false;
              }
            if(undefined!==data.init_scale){
              tmp_vprt+=(first?"":",")+"initial-scale="+data.init_scale;
              first= false;
              }
            if(undefined !== data.max){
              tmp_vprt+= (first?"":",")+"maximum-scale="+data.max;
              first= false;
              }
            if(undefined !== data.min){
              tmp_vprt+= (first?"":",")+"minimum-scale="+data.min;
              first= false;
              }
            if(undefined !== data.scalable){
              tmp_vprt+= (first?"":",")+"user-scalable="+data.scalable;
              first= false;
              }
            if(undefined !== data.minimal_ui){
              tmp_vprt+= (first?"":",")+"minimal-ui";
              first= false;
              }
            headTag.setAttribute('content', tmp_vprt);
            }
          document.head.appendChild(headTag);
          // - Meta elements for WebApp old school...
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'mobile-web-app-capable');
          headTag.setAttribute('content', 'yes');
          document.head.appendChild(headTag);
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'apple-mobile-web-app-capable');
          headTag.setAttribute('content', 'yes');
          document.head.appendChild(headTag);
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
          if(config.statusBarConfig){
            headTag.setAttribute('content', config.statusBarConfig);
            }
          else{
            headTag.setAttribute('content', 'translucent white');
            }
          document.head.appendChild(headTag);
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'mobile-web-app-status-bar-style');
          if(config.statusBarConfig){
            headTag.setAttribute('content', config.statusBarConfig);
            }
          else{
            headTag.setAttribute('content', 'translucent white');
            }
          document.head.appendChild(headTag);
          headTag= document.createElement("meta");
          headTag.setAttribute('name', 'apple-mobile-web-app-title');
          if(config.appTitle){
            headTag.setAttribute('content', config.appTitle);
            }
          else{
            headTag.setAttribute('content', '...');
            }
          document.head.appendChild(headTag);
          headTag=document.createElement("meta");
          headTag.setAttribute('name', 'apple-touch-fullscreen');
          headTag.setAttribute('content', 'yes');
          // - L'image de démarrage (utilisée sur les vielles version d'iOS.)
          document.head.appendChild(headTag);
          if(config.startup_img){
            for(var i in config.startup_img){
              headTag=document.createElement("link");
              headTag.setAttribute('href', config.startup_img[i].rsrc);
              if(config.startup_img[i].media){
                headTag.setAttribute('media', config.startup_img[i].media);
                }
              headTag.setAttribute('rel', 'apple-touch-startup-image');
              document.head.appendChild(headTag);
              }
            }
          // - l'icone d'application adaptée aux différnetes tailels d'écran.
          if(config.iconSet){
            for(var i of config.iconSet){
              headTag=document.createElement("link");
              headTag.setAttribute('href', i.url);
              headTag.setAttribute('sizes', i.size);
              headTag.setAttribute('rel', 'apple-touch-icon'
                           + ((true == i.precomp)?"-precomposed":""));
              document.head.appendChild(headTag);
              headTag=document.createElement("link");
              headTag.setAttribute('href', i.url);
              headTag.setAttribute('sizes', i.size);
              headTag.setAttribute('rel', 'icon');
              document.head.appendChild(headTag);
              headTag=document.createElement("link");
              headTag.setAttribute('href', i.url);
              headTag.setAttribute('sizes', i.size);
              headTag.setAttribute('rel', 'shortcut icon');
              document.head.appendChild(headTag);
              }
            }
          // Les paramètres précédents sont anciens et ne sont plus trop
          // d'actualité... Ce sont ceux qu'on a utilisé pour DanceDoigts
          // sur iOS comme sur Android.
          // La partie qui suit sert à initialiser la gestion audio sur
          // plateforme mobile qui doit explicitement être validée par l'appui
          // sur un boutton par les utilisateurs.
          const tmp_par= SC.par(SC.pause(10));
          if(config.audioSupport){
            if(SC.tools.audioToolbox){
              SC.tools.audioToolbox.init();
              tmp_par.add(SC.await(SC.tools.audioToolbox.Evt_audioLoaded));
              }
            else{
              throw new Error("audio support required by WebApp, but, no audioToolbox loaded.");
              }
            }
          // - Le paneu de contrôle des SugarCubes tools (dérivé de SC_Demo4
          // DanceDoigts).
          if(config.controler){
            SC.tools.initPanel();
            if(config.controler_closed){
              SC.tools.controlPanel.toggle(false);
              }
            if(config.controler_inspectorEnabled && SC.tools.controlPanel.setInspectorBtn){
              SC.tools.controlPanel.setInspectorBtn();
              }
            }
          if(config.splashConfig){
            const cssLink=document.createElement("link");
            cssLink.setAttribute('rel', 'stylesheet');
            cssLink.setAttribute('type', 'text/css');
            cssLink.setAttribute('href'
                         , params.tools.baseDir+'SC_Tools_Splash.css');
            document.head.appendChild(cssLink);
            const splashScreen=document.createElement("div");
            splashScreen.id="App_splashScreen";
            Object.defineProperty(SC.tools, "splashScreen"
            , { value: splashScreen
              , writable: false
                }
              );
            Object.defineProperty(SC.tools, "displaySplash"
            , { value: function(){
                  document.body.appendChild(splashScreen);
                  }
              , writable: false
                }
              );
            splashScreen.innerHTML="<div"
                    +((undefined!=config.splashConfig.background)
                            ?(" style='background:"
                               +config.splashConfig.background+"'")
                            :"")
                    +"> <div><span class='SC_splashH1'"
                    +((undefined!=config.splashConfig.title_style)
                            ?(" style='"+config.splashConfig.title_style +"'")
                            :"")
                    +">"+(config.splashConfig.title?config.splashConfig.title:config.appTitle)
                    +"</span></div> "
                    +"<img id='SC_splash_FB_loading'"
                    +" src='images/gif/CP48_spinner.gif'/>"
                    +"<div "+(config.splashConfig.start_btn_style?("style='"
                                                     +config.splashConfig.start_btn_style+"; display:none;'")
                             :"class='SC_splashH3' style='display:none;'")+">"
                    +(config.splashConfig.start_btn_text?config.splashConfig.start_btn_text:"Start")
                    +"</div></div>";
            const im_anim=splashScreen.children[0].children[1];
            const btn=splashScreen.children[0].children[2];
            splashScreen.Sens_clickStart=SC.sensor("clickStart"
            , { dom_targets: [{ target: btn
                  , evt: "mouseup"
                    }
                  ]
                });
            SC.tools.main.bindTo(splashScreen.Sens_clickStart);
            splashScreen.Evt_allLoaded=SC.evt("Evt_allLoaded");
            splashScreen.btn=btn;
            window.addEventListener("load"
            , function(btn, ia){
                this.appPageLoaded=true;
                ia.style.display="none";
                btn.style.display="";
                this.main.addProgram(
                  SC.seq(
                    SC.await(splashScreen.Evt_allLoaded)
                  , SC.action(function(m){
                      splashScreen.parentElement.removeChild(splashScreen);
                      }.bind(this)
                      )
                  , SC.generate(SC.globals.Evt_appStarted)
                    )
                  );
                }.bind(SC.tools, btn, im_anim)
              );
            SC.tools.main.addProgram(
              SC.seq(
                SC.await(splashScreen.Sens_clickStart)
              , SC.action(function(m){
                  splashScreen.btn.textContent="Loading..."
                  if(this.audioToolbox){
                    this.audioToolbox.loadAll();
                    }
                  }.bind(SC.tools))
              , tmp_par
              , SC.generate(splashScreen.Evt_allLoaded)
              , SC.generate(SC.globals.Evt_Start)
              , SC.action(function(re){
                    SC.tools.addProgram
                      =SC.tools.main.addProgram.bind(this.main);
                    SC.tools.generateEvent
                      =SC.tools.main.addEntry.bind(this.main);
                    }
                  )
                )
              );
            }
          else{
            SC.tools.main.addProgram(
              SC.seq(SC.pause(10), SC.generate((SC.globals.Evt_appStarted)))
              );
            }
          //if(config.inspectorEnabled){
          //  SC.tools.initPanel();
          //  }
          }
        if("complete"!=document.readyState){
          SC.tools.addProgram=function(p){
            this.main.addProgram((SC.globals.Evt_Start)
                  ?SC.seq(SC.await(SC.globals.Evt_Start), p):p);
            }.bind(SC.tools);
          SC.tools.generateEvent=function(evt, v){
            this.main.addProgram((SC.globals.Evt_Start)
                  ?SC.seq(SC.await(SC.globals.Evt_Start), SC.generate(evt, v))
                  :SC.generate(evt, v));
            }.bind(SC.tools);
          if(SC.globals.Evt_Start){
            SC.tools.main.addProgram(
              SC.seq(
                SC.await(SC.globals.Evt_Start)
              , SC.action(function(re){
                  SC.tools.addProgram=SC.tools.main.addProgram.bind(SC.tools.main);
                  SC.tools.generateEvent=SC.tools.main.addEntry.bind(SC.tools.main);
                  re.addEntry(SC.globals.Evt_Start);
                  })
                )
              );
            }
          }
        else{
          SC.tools.addProgram=SC.tools.main.addProgram.bind(SC.tools.main);
          SC.tools.generateEvent=SC.tools.main.addEntry.bind(SC.tools.main);
          }
/*
---------------------------
Define globals and WebTools
---------------------------
*/
        SC.globals.globalKeydown={
            esc: SC.evt("esc")
          , home: SC.evt("home")
          , left: SC.evt("left")
          , up: SC.evt("up")
          , down: SC.evt("down")
          , right: SC.evt("right")
          , end: SC.evt("end")
            };
        SC.globals.Sns_screen_orientation=SC.sensor("screen_orientation"
          , { dom_targets: [{
                target: window
              , evt: "orientationchange"
                }
                ]
              }
            );
        SC.globals.globalKeydownSensor=SC.sensor("globalKeydownSensor"
            , { dom_targets: [{
                  target: document
                , evt: "keyup"
                  }
                ]
              }
            );
        const WebTools={
            loadData: function(url, act){
              if(url){
                console.log("WebTools_Tools.loadData()", url);
                const loadSensor=SC.tools.loadData(url);
                if(loadSensor){
                  SC.tools.main.addProgram(
                    SC.seq(
                      SC.await(loadSensor)
                    , SC.action(function(loadEvt, action, engine){
                        const data=engine.sensorValueOf(loadEvt);
                        if(data){
                          action(data, engine, loadEvt);
                          }
                        }.bind(null, loadSensor, act))
                      )
                    );
                  }
                }
              }
          , postTreatmentOfDOM: function(element, continuation){
              //if(element.parentElement){
                const jfs_tags = element.getElementsByTagName("*");
                const anotator = this.listingAnotator;
                for(var idx= 0; idx < jfs_tags.length; idx++){
                  var tag= jfs_tags[idx];
                  const jfs_processed = tag.getAttribute("jfs_processed");
                  if(jfs_processed && (jfs_processed == "true")){
                    continue;
                    }
                  switch(tag.tagName){
                    case "JFS_METHJ":{
                      const packSum = "package-summary.html";
                      const packName = tag.getAttribute("pack");
                      const args = tag.getAttribute("args");
                      const packPath = packName.replace(/\./g,"/");
                      const cls = tag.getAttribute("cls");
                      const dispp = ((tag.getAttribute("disp") == "")||(tag.getAttribute("disp") == "true"));
                      var txt = tag.innerText;
                      txt= "<a title='"+packName+"."+cls+"'"
                        + " onclick='window.open(\"https://docs.oracle.com/javase/8/docs/api/"
                        + packPath+"/"+cls+".html#"+txt+"-"+((args)?args:"")+"-"+"\""
                        + ",\"java_api_window\",\"width=1000,height=900\");'"
                        + " style='cursor:help;'>"
                        + ((dispp)?packName+".":"")+txt+"</a>"
                      tag.innerHTML = "<code><span class='WebTools_CSSClass_APIJava'>"+txt+"</span></code>";
                      tag.setAttribute("jfs_processed", "true");          
                      break;
                      }
                    case "JFS_CLASSJ":{
                      const packSum = "package-summary.html";
                      const packName = tag.getAttribute("pack");
                      const packPath = packName.replace(/\./g,"/");
                      const dispp = ((tag.getAttribute("disp") == "")||(tag.getAttribute("disp") == "true"));
                      var txt = tag.innerText;
                      txt= "<a title='"+packName+"."+txt+"'"
                        + " onclick='window.open(\"https://docs.oracle.com/javase/8/docs/api/"
                        + packPath+"/"+txt+".html\""
                        + ",\"java_api_window\",\"width=1000,height=900\");'"
                        + " style='cursor:help;'>"
                        + ((dispp)?packName+".":"")+txt+"</a>"
                      tag.innerHTML = "<code><span class='WebTools_CSSClass_APIJava'>"+txt+"</span></code>";
                      tag.setAttribute("jfs_processed", "true");
                      break;
                      }
                    case "JFS_LISTJ":{
                      var txt = tag.innerText;
                      tag.style.display="inline";
                      const wrapTag = (("" == tag.getAttribute("inline"))
                               ||("true"  == tag.getAttribute("inline")))?"code":"pre";
                      const base = document.createElement(wrapTag);
                      base.jfs_src = base;
                      base.parsed = WebTools.jfs_java_parse(txt, true, true, anotator);
                      base.innerHTML += base.parsed[2];
                      tag.innerHTML='';
                      tag.appendChild(base);
                      tag.setAttribute("jfs_processed", "true");
                      break;
                      }
                    case "JFS_BLKLJ":{
                      tag.style.textIndent='none';
                      var txt = tag.innerText;
                      const block = document.createElement("div");
                      block.setAttribute("class","WebTools_slide_codeBlock");
                      const base = document.createElement("pre");
                      base.jfs_src = base;
                      base.parsed = WebTools.jfs_java_parse(txt,true,false, anotator);
                      base.innerHTML += base.parsed[2];
                      tag.innerHTML='';
                      block.appendChild(base);
                      tag.appendChild(block);
                      tag.setAttribute("jfs_processed", "true");
                      break;
                      }
                    case 'JFS_CANVAS':{
                      const cvs = tag.children[0]?tag.children[0]
                                         :WebTools.SP.buildCanvas({w: tag.getAttribute("width")
                                                            , h: tag.getAttribute("height")});
                      if(!cvs.jfs_isASPCanvas){
                        WebTools.SP.buildCanvas({cvs: cvs});
                        }
                      if(!cvs.parentElement){
                        tag.appendChild(cvs);
                        }
                      const drawingMethodName = tag.getAttribute("drawing");
                      WebTools.cvs_draw[drawingMethodName](cvs);
                      break;
                      }
                    case 'JFS_CODE':{
                      var txt=tag.textContent;
                      const wrapTag=((""==tag.getAttribute("inline"))
                               ||("true"==tag.getAttribute("inline")))?"code":"pre";
                      tag.style.display=("pre"==wrapTag)?"block":"inline";
                      const base=document.createElement(wrapTag);
                      base.style=tag.getAttribute("style");
                      //base.jfs_src=base;
                      const langAtt=tag.getAttribute("language")?tag.getAttribute("language"):"JAVA";
                      const hideComments=(("pre"==wrapTag)&&((""==tag.getAttribute("hideComments"))
                               ||("true"==tag.getAttribute("hideComments"))));
                      const numbering=(("pre"==wrapTag)&&((""==tag.getAttribute("numbering"))
                               ||("true"==tag.getAttribute("numbering"))));
                      const collapsable=(("pre"==wrapTag)&&((""==tag.getAttribute("collapsable"))
                               ||("true"==tag.getAttribute("collapsable"))));
                      const downloadable=(("pre"==wrapTag)&&((""==tag.getAttribute("downloadable"))
                               ||("true"==tag.getAttribute("downloadable"))));
                      const selectable=(("pre"==wrapTag)&&((""==tag.getAttribute("selectable"))
                               ||("true"==tag.getAttribute("selectable"))));
                      const limitH=(("pre"==wrapTag)&&(tag.getAttribute("limitH")))?tag.getAttribute("limitH"):undefined;
                      if((""==tag.getAttribute("hlapi"))
                               ||("true"==tag.getAttribute("hlapi"))){
                        switch(langAtt.toUpperCase()){
                          case "C":{
                            txt=SC.tools.LST.qp.preAPIC(txt);
                            break;
                            }
                          case "JAVA":{
                            txt=SC.tools.LST.qp.preAPIJava(txt);
                            break;
                            }
                          case "JS":{
                            txt=SC.tools.LST.qp.preAPIJS(txt);
                            break;
                            }
                          }
                        }
                      if(("" == tag.getAttribute("useapi"))
                               ||("true"  == tag.getAttribute("useapi"))){
                        tag.innerHTML='';
                        WebTools.listings.qp.parse(base, txt, langAtt);
                        }
                      else {
                        base.parsed=SC.tools.LST.jfs_parseDoc({
                             src: txt
                           , lang: langAtt.toUpperCase()
                           , no_final_br: true
                             });
                        /*switch(langAtt.toUpperCase()){
                          case "XML":
                          case "HTML":{
                            base.parsed=this.jfs_XML_parse(txt, true, true, this.XML_listingAnotator);
                            break;
                            }
                          case "BASH":{
                            base.parsed=this.jfs_Bash_parse(txt, true, true, this.Bash_listingAnotator);
                            break;
                            }
                          case "KEYV":{
                            base.parsed=this.jfs_KEYV_parse(txt, { no_list: true
                                                                   , no_final_br: true
                                                                   , HLA: this.Bash_listingAnotator});
                            break;
                            }
                          case "MAKF":{
                            base.parsed=this.jfs_MKF_parse(txt, true, true, this.Bash_listingAnotator);
                            break;
                            }
                          case "JS":{
                            base.parsed=this.jfs_JS_parse(WebTools.listings.qp.preAPIJS(txt), true, true, this.JS_listingAnotator);
                            break;
                            }
                          case "LUSTRE":{
                            base.parsed=this.jfs_Lustre_parse(txt, true, true, this.Lustre_listingAnotator);
                            break;
                            }
                          case "C":{
                            base.parsed=this.jfs_C_parse(txt, true, true, this.C_listingAnotator);
                            break;
                            }
                          case "JAVA":
                          default: {
                            base.parsed=this.jfs_java_parse(txt, true, true, this.listingAnotator);
                            break;
                            }
                          }*/
                        }
                      tag.innerHTML='';
                      if(collapsable||numbering||selectable||hideComments||tag.getAttribute("filename")){
                        base.innerText=txt;
                        SC.tools.Web.formatSnipet({ selectCmd: selectable
                                                   , lineNumberCmd: numbering
                                                   , downloadable: downloadable
                                                   , maskCmd: collapsable
                                                   , commentCmd: hideComments
                                                   , lang: langAtt.toUpperCase()
                                                   , base: tag
                                                   , snip: base.parsed[2]
                                                   , limitH: limitH
                                                   , filename: tag.getAttribute("filename")
                                                     });
                        }
                      else{
                        tag.appendChild(base);
                        base.innerHTML=base.parsed[2];
                        }
                      tag.setAttribute("jfs_processed", "true");
                      break;
                      }
                    }
                  }
                try{ if(SC.tools.MJ){SC.tools.MJ.typeset(element);} } catch(e){}
              //  }
              if('function'==typeof(continuation)){
                continuation();
                }
              }
            };
        SC.tools.main.bindTo(SC.globals.globalKeydownSensor);
        SC.tools.addProgram(
          SC.par(
            SC.filter(
              SC.globals.globalKeydownSensor
              , SC.globals.globalKeydown.home
              , function(evt){
                  if(evt.which == 36){
                    return "home";
                    }
                  }
              , SC.forever
              )
            , SC.filter(
                SC.globals.globalKeydownSensor
                , SC.globals.globalKeydown.end
                , function(evt){
                    if(evt.which == 35){
                      return "end";
                      }
                    }
                , SC.forever
                )
            , SC.filter(
                SC.globals.globalKeydownSensor
                , SC.globals.globalKeydown.left
                , function(evt){
                    if(evt.which == 37){
                      return "left";
                      }
                    }
                , SC.forever
                )
            , SC.filter(
                SC.globals.globalKeydownSensor
                , SC.globals.globalKeydown.right
                , function(evt){
                    if(evt.which == 39){
                      return "right";
                      }
                    }
                , SC.forever
                )
            , SC.filter(
                SC.globals.globalKeydownSensor
                , SC.globals.globalKeydown.up
                , function(evt){
                    if(evt.which == 38){
                      return "right";
                      }
                    }
                , SC.forever
                )
            , SC.filter(
                SC.globals.globalKeydownSensor
                , SC.globals.globalKeydown.down
                , function(evt){
                    if(evt.which == 40){
                      return "right";
                      }
                    }
                , SC.forever
                )
            , SC.filter(
                SC.globals.globalKeydownSensor
                , SC.globals.globalKeydown.esc
                , function(evt){
                    if(evt.which == 27){
                      return "esc";
                      }
                    }
                , SC.forever
                )
            )
          );
        function initTouchTracker(){
          if(SC.globals.Sens_touchTrackerSensor){
            throw new Error("Internal Tracker Error");
            }
          function prevention(evt){
            //evt.preventDefault();
            };
          window.addEventListener('touchstart', prevention);
          window.addEventListener('touchmove', prevention);
          window.addEventListener('touchend', prevention);
          window.addEventListener('touchcancel', prevention);
          const Sens_tracker=SC.globals.Sens_touchTrackerSensor=SC.sensor("sensTracking"
            , { dom_targets: [{
                  target: window
                , evt: "touchstart"
                  }
              , {
                  target: window
                , evt: "touchmove"
                  }
              , {
                  target: window
                , evt: "touchend"
                  }
              , {
                  target: window
                , evt: "touchcancel"
                  }
                  ]
                }
              );
          const trackerClock=SC.clock({ init: SC.pauseForever()});
          trackerClock.bindTo(Sens_tracker);
          trackerClock.addProgram(
            SC.cube({
              }
            , SC.repeatForever(
                SC.await(Sens_tracker)
              , SC.action(function(re){
                  const evt=re.sensorValueOf(Sens_tracker);
                  const changes=evt.changedTouches;
                  switch(evt.type){
                    case 'touchmove':{
                      for(var ch of changes){
                        const id=ch.identifier;
                        const tracker=this[id];
                        tracker.style.top=(ch.screenY-tracker.clientHeight/2)+"px";
                        tracker.style.left=(ch.screenX-tracker.clientWidth/2)+"px";
                        }
                      break;
                      }
                    case 'touchcancel':
                    case 'touchend':{
                      for(var ch of changes){
                        const id=ch.identifier;
                        const tracker=this[id];
                        tracker.parentNode.removeChild(tracker);
                        delete(this[id]);
                        }
                      break;
                      }
                    case 'touchstart':{
                      for(var ch of changes){
                        const id=ch.identifier;
                        var tracker=undefined;
                        if(undefined==this[id]){
                          tracker=this[id]=document.createElement('div');
                          tracker.innerHTML=' ';
                          tracker.style.position="fixed";
                          tracker.trackID=id;
                          tracker.style.background="yellow";
                          tracker.style.padding="20px";
                          tracker.style.borderRadius="20px";
                          tracker.style.display="none";
                          tracker.style.transform="transform: translate(-50%, -50%);";
                          document.body.appendChild(tracker);
                          }
                        else{
                          tracker=this[id];
                          }
                        tracker.style.top=ch.screenY+"px";
                        tracker.style.left=ch.screenX+"px";
                        tracker.style.display="";
                        }
                      break;
                      }
                    }
                  })
                )
              )
            );
          };
      Object.defineProperty(SC.tools, "initTouchTracker"
      , { value: initTouchTracker
        , writable: false
          }
        );

/*window.addEventListener('orientationchange', function(){
  //console.log("window.orientation = "+window.orientation);
  SC.tools.generateEvent(WebTools.events.screen_orientation, window.orientation);
  switch(window.orientation){
    case -90:
    case 90:{
      console.log("paysage");
      break;
      }
    default:{
      console.log("portrait");
      break;
      }
    }
  });
*/
/*
Liste des paramètres :
{ start_evt: null, cancel_evt: null , r_delay: 0, speech: "" , repeat: 1 }
- start_evt : événement SC de début du talk
- cancel_evt : événement SC qui force la fin du talk
- r_delay : délais d'attente de réaction de la machine reactive à la
            fin du talk sur l'événement de fin du talk
- speech : texte du talk
- repeat : nombre de répétition du talk (SC.forever : répétition infinie)
*/
        function speech(params){
          params.get=function(field, d){
            return (undefined!==this[field])?this[field]:d;
            }
          const tts=document.createElement("div");
          tts.innerHTML=params.get("speech","");
          this.speechAlternative(tts);
          const speakable=new SpeechSynthesisUtterance(tts.textContent);
          speakable.lang=params.get("lang", "fr-FR");
	  console.log(speakable);
          speakable.Evt_startSpeak=params.get("start_evt"
                                             , SC.evt("Evt_startSpeak"));
          speakable.Evt_cancel=params.get("cancel", SC.evt("Evt_cancel"));
          speakable.Evt_talkEnded=params.get("talkEnded", SC.evt("talkEnded"));
          //console.log("speech Evt_talkEnded", speakable.Evt_talkEnded);
          speakable.Sns_ended=SC.sensor("Sns_ended"
            , { dom_targets: [ { target: speakable, evt: 'end' } ] });
          speakable.sc_speech_beh=SC.seq(
              SC.kill(speakable.Evt_cancel
              , SC.seq(
                  SC.await(speakable.Evt_startSpeak)
                , SC.action(
                    window.speechSynthesis.speak.bind(window.speechSynthesis
                                                    , speakable))
                , SC.await(speakable.Sns_ended)
                  )
              , SC.action(
                    window.speechSynthesis.cancel.bind(window.speechSynthesis))
                )
            , SC.generate(speakable.Evt_talkEnded)
              );
            return speakable;
          };
        Object.defineProperty(WebTools, "speech"
        , { value: speech
          , writable: false
            }
          );
        function speechAlternative(element){
          const jfs_tags=element.getElementsByTagName("JFS_AS");
          for(var tag of jfs_tags){
            tag.textContent=tag.getAttribute("text");
            }
          };
        Object.defineProperty(WebTools, "speechAlternative"
        , { value: speechAlternative
          , writable: false
            }
          );
/*
Bubble view utility funs
*/
        function bubble_view_setNewText(msg){
          const frame=this._sc_frame;
          function _(data){
            if('function'==typeof data){
              return data();
              }
            else if(!isNaN(data)){
              return data+"px";
              }
            return data;
            };
          this.style.maxWidth=(msg.max_w)?msg.max_w:"";
          this.style.minWidth=(msg.min_w)?msg.min_w:"";
          //this.frame.onresize = undefined;
          frame.style.transform="";
          frame.style.bottom="";
          frame.style.right="";
          frame.style.left="";
          frame.style.top="";
          switch(msg.dir){
            case 0:{ // no dir
              this.dir = 0;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_0");;
              frame.style.left=_(msg.x);
              frame.style.top=_(msg.y);
              break;
              }
            case 1:{ // top left
              this.dir = 1;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_1");
              frame.style.left=_(msg.x);
              frame.style.top=_(msg.y);
              break;
              }
            case 2:{ // top middle
              this.dir = 2;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_2");
              frame.style.left=_(msg.x);
              frame.style.top=_(msg.y);
              break;
              }
            case 3:{ // top right
              this.dir = 3;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_3");
              frame.style.right=_(msg.x);
              frame.style.top=_(msg.y);
              break;
              }
            case 4:{ // bottom left
              this.dir = 4;
              //console.log("bottom left");
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_4");
              frame.style.left=msg.x;
              frame.style.bottom=_(msg.y);
              break;
              }
            case 5:{ // bottom middle
              this.dir = 5;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_5");
              frame.style.left=_(msg.x);
              frame.style.bottom=_(msg.y);
              break;
              }
            case 6:{ // bottom right
              this.dir = 6;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_6");
              frame.style.right=_(msg.x);
              frame.style.bottom=_(msg.y);
              break;
              }
            case 7:{ //left top
              this.dir = 7;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_7");
              frame.style.left=_(msg.x);
              frame.style.top=_(msg.y);
              break;
              }
            case 8:{ //left middle
              this.dir = 8;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_8");
              //frame.style.left = msg.x;
              frame.style.left=_(msg.x);
              //this.frame.style.top = "calc("+msg.y+"-50%)";
              frame.style.top=_(msg.y);
              frame.style.transform = 'translate(0, -50%)';
              //this.onchange = function(y){
              //  console.log('need reflow ?');
              //  this._sc_frame.style.top = "clac("+msg.y+"-50%)";
              //  }.bind(this, msg.y);
              break;
              }
            case 9:{ //left right
              this.dir = 9;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_9");
              frame.style.left=_(msg.x);
              frame.style.bottom=_(msg.y);
              break;
              }
            case 10:{ //right top
              this.dir = 10;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_10");
              frame.style.right=_(msg.x);
              frame.style.top=_(msg.y);
              break;
              }
            case 11:{ //right middle
              this.dir = 11;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_11");
              frame.style.right=_(msg.x);
              frame.style.top=_(msg.y);
              frame.style.transform = 'translate(0, -50%)';
              break;
              }
            case 12:{ //right bottom
              this.dir = 12;
              this.classList.remove(this.classList[0]);
              this.classList.add("SC_bubble_text_12");
              frame.style.right=_(msg.x);
              frame.style.bottom=_(msg.y);
              break;
              }
            default: {
              this.dir = 0;      
              frame.style.top=_(msg.y);
              frame.style.left=_(msg.x);
              break;
              }
            }
          frame.style.position="fixed"==msg.mode?"fixed":"absolute";
          };
        function searchIdentifiedParent(elt){
          var tmp=elt.parentElement;
          while(null!=tmp && tmp.id=="" && document.body!=tmp){
            tmp=tmp.parentElement;
            }
          return tmp;
          };
        function fromIdentifiedEltGetPath(elt){
          var tmp=elt;
          const res=[];
          while(null!=tmp && tmp.id=="" && document.body!=tmp){
            res.push(
              Array.prototype.indexOf.call(tmp.parentElement.children
              , tmp));
            tmp=tmp.parentElement;
            }
          res.push(tmp.id);
          return res;
          };
        function quickElt(p={ tag: 'div' }){
          const res=document.createElement(p.tag);
          if(p.id){
            res.id=p.id;
            }
          if("string"==typeof(p.cls)){
            res.classList.add(p.cls);
            }
          if("array"==typeof(p.cls)){
            for(var cls of this.cls){
              res.classList.add(cls);
              }
            }
          if(p.innerHTML){
            res.innerHTML=p.innerHTML;
            }
          if(p.width){
            res.setAttribute("width", p.width);
            }
          if(p.height){
            res.setAttribute("height", p.height);
            }
          if(p.style){
            res.style=p.style;
            }
          if(p.src){
            res.src=p.src;
            }
          if(p.alt){
            res.setAttribute('alt', p.alt);
            }
          if(p.title){
            res.setAttribute('title', p.title);
            }
          return res;
          }
        function mkBubbleMenuBar(){
          const bar=quickElt({ tag: 'div'
              , style:`position: relative;
                       width: 100%;
                       padding: 0;
                       border: 0;
                       margin: 0;`
                });
          const moveView=quickElt({ tag: 'img'
              , width: 24
              , height: 24
              , style: `cursor: pointer;`
              , src: "images/png/move_bubble.png"
              , alt: "Déplacer"
              , title: "Déplacer la bulle"
                });
          bar.appendChild(moveView);
          const editView=quickElt({ tag: 'img'
              , width: 24
              , height: 24
              , style: `cursor: pointer;`
              , src: 'images/png/edit_bubble.png'
              , alt: "Edit"
              , title: "Editer la bulle"
                });
          bar.appendChild(editView);
          const saveView=quickElt({ tag: 'img'
              , width: 24
              , height: 24
              , style: `cursor: pointer;`
              , src: "images/png/save_bubble.png"
              , alt: "Enregistrer"
              , title: "Enregistrer la bulle sur le serveur (connexion internet nécessaire)."
                });
          bar.appendChild(saveView);
          const minimizeView=quickElt({ tag: 'img'
              , width: 24
              , height: 24
              , style: `cursor: pointer;`
              , src: "images/png/mini_bubble.png"
              , alt: "Réduire"
              , title: "Réduire la bulle"
                });
          bar.appendChild(minimizeView);
          const deleteView=quickElt({ tag: 'img'
              , width: 24
              , height: 24
              , style: `cursor: pointer;`
              , src: "images/png/delete_bubble.png"
              , alt: "Supprimer"
              , title: "Supprimer la bulle"
                });
          deleteView.style.position="absolute";
          deleteView.style.right="0";
          bar.appendChild(deleteView);
          return bar;
          };
        function loadBubbleCSS(){
          const cssLink=document.createElement("link");
          cssLink.setAttribute('rel', 'stylesheet');
          cssLink.setAttribute('href', params.tools.baseDir
                                       +'SC_Tools_Bubble.css');
          document.head.appendChild(cssLink);
          Object.defineProperty(WebTools, "scc_bubbles_link"
          , { value: cssLink
            , writable: false
              }
            );            
          };
        function simpleCommentBubble(params={}){
          //console.log("make bubble...", params);
          if(undefined===this.scc_bubbles_link){
            loadBubbleCSS();
            }
          const bubble_frame=quickElt({ tag: 'div' 
            , cls: 'SC_bubble_textFrame'
              });
          const bubble_view=quickElt({ tag: 'div'
            , cls: "SC_bubble_text_0"
              });
          bubble_view.Evt_show=SC.evt("show");
          bubble_view.Evt_bubbleFinish=SC.evt("Evt_bubbleFinish");
          bubble_view.Evt_showBar=SC.evt("showBar");
          bubble_view.Evt_display=SC.evt("display");
          const Evt_nextMessage=SC.evt("nextMessage");
          bubble_view._sc_bar=mkBubbleMenuBar();
          bubble_view.appendChild(bubble_view._sc_bar);          
          bubble_view._sc_showBar=function(re){
            const data=re.getValuesOf(this.Evt_showBar);
            if(data){
              const s=data[0];
              this._sc_bar.style.display=s?'block':'none';
              }
            }
          bubble_view._sc_content=quickElt({ tag: 'div' });
          bubble_view.appendChild(bubble_view._sc_content);          
          bubble_view._sc_updateAppearance=bubble_view_setNewText;
          bubble_view._sc_ok=quickElt({ tag: "div"
              , style: `text-align: right;
                        margin: 0;
                        padding: 0;`
              , innerHTML: "<em style='font-size:10px;cursor:pointer'>OK</em>"
                });
          const Sns_talkOK=SC.sensor("Sns_talkOK"
               , { dom_targets: [{ target: bubble_view._sc_ok.children[0]
                                 , evt: "click" }] });
          bubble_view._sc_displayNextBtn=function(re){
            this._sc_content.appendChild(this._sc_ok);
            };
          const SC_parDisplay=SC.par(SC.seq(
              SC.await(bubble_view.Evt_display)
            , SC.action("_sc_display")
            , SC.pause()
              )
            );
          bubble_view.Evt_talkEnded=SC.evt("talkEnded");
          if(params.typer){
            bubble_view._sc_shadow=quickElt({ tag: "div" });
            bubble_view._sc_pauseAfterEnd=0;
            bubble_view._sc_toWriteTxt=bubble_view._sc_text="";
            bubble_view._sc_toWriteTxtIdx=0;
            bubble_view._sc_textRemains=true;
            const Evt_shadowReady=SC.evt("Evt_shadowReady");
            bubble_view._sc_setText=function(msg){
              this._sc_toWriteTxtIdx=0;
              this._sc_content.innerHTML="";              
              this.style.color=(msg.clr)?msg.clr:"black";
              this.style.background=(msg.bgclr)?msg.bgclr:"yellow";
              this.hidden=false;
              this._sc_textRemains=true;
              this._sc_ntAMode=msg.nTA
              this._sc_shadow.innerHTML=this._sc_shadow._sc_rawMsg=msg.text;
              setTimeout(function(Evt_shadowReady){
                  WebTools.postTreatmentOfDOM(this._sc_shadow
                    , function(){
                        this._sc_toWriteTxt=this._sc_shadow.innerHTML;
                        if(this._sc_ntAMode){
                          this._sc_toWriteTxtIdx=this._sc_toWriteTxt.length;
                          }
                        //console.log(this._sc_shadow.innerHTML);
                        ((this._sc_clock)?this._sc_clock:SC.tools).generateEvent(Evt_shadowReady);
                        }.bind(this));
                  }.bind(this, Evt_shadowReady));
              this._sc_wc=(msg.waitClick)?true:false;
              this._sc_pauseAfterEnd=(msg.pauseAfterEnd)?msg.pauseAfterEnd:0;
              this._sc_updateAppearance(msg);
              };
            bubble_view._sc_postTyped=function(m){
              this._sc_content.innerHTML=this._sc_shadow._sc_rawMsg;
              setTimeout(function(Evt_shadowReady){
                WebTools.postTreatmentOfDOM(this
                  , function(){
                      ((this._sc_clock)?this._sc_clock:SC.tools).generateEvent(Evt_shadowReady);
                      }.bind(this))
                }.bind(this, Evt_shadowReady));
              }
            bubble_view._sc_progressiveText=function(){
              var idx=this._sc_toWriteTxtIdx;
              const max=this._sc_toWriteTxt.length;
              if(idx>max){
                return;
                }
              if("<"==this._sc_toWriteTxt.charAt(idx)){
                while(">"!=this._sc_toWriteTxt.charAt(idx)
                      && (idx<max)){
                  idx++;
                  }
                }
              if("&"==this._sc_toWriteTxt.charAt(idx)){
                while(";"!=this._sc_toWriteTxt.charAt(idx)
                      && (idx<max)){
                  idx++;
                  }
                }
              idx++;
              this._sc_content.innerHTML=this._sc_toWriteTxt.substring(0, idx);
              this._sc_toWriteTxtIdx=idx;
              this._sc_textRemains
                  =this._sc_toWriteTxtIdx<this._sc_toWriteTxt.length;
              };
            SC_parDisplay.add(SC.seq(
                SC.par(
                  SC.kill(params.killAnim
                  , SC.seq(
                      SC.await(Evt_shadowReady)
                    , SC.pause(2)
                    , SC.whileRepeat({ t: bubble_view, f: '_sc_textRemains' }
                      , SC.action("_sc_progressiveText")
                      , SC.pause()
                        )
                    , SC.action("_sc_postTyped")
                    , SC.await(Evt_shadowReady)
                    , SC.pause()
                    , SC.test({ t: bubble_view, f: "_sc_wc" }
                      , SC.seq(
                          SC.action("_sc_displayNextBtn")
                        , SC.await(Sns_talkOK)
                        , SC.generate('Evt_bubbleFinish')
                          )
                      , SC.pause({ t: bubble_view, f: '_sc_pauseAfterEnd' })
                        )
                    , SC.test({ t: bubble_view, f: "_sc_noSpeech" }
                      , SC.seq(SC.generate('Evt_talkEnded'), SC.trace("no speech => simulate talk ended"))
                        )
                      )
                  , SC.nop("the animation is killed")
                    )
                , SC.kill(params.killAnim, SC.seq(SC.await('Evt_talkEnded'), SC.nop("talk has ended before killAnim")))
                  )
              , SC.generate('Evt_bubbleFinish')
              , SC.nop("bubble finish !")
              , SC.pause()
                )
              );
            }
          else{
            bubble_view._sc_setText=function(msg){
              this._sc_toWriteTxtIdx=0;
              this._sc_content.innerHTML="";              
              this.style.color=(msg.clr)?msg.clr:"black";
              this.style.background=(msg.bgclr)?msg.bgclr:"yellow";
              this.hidden=false;
              this._sc_content.innerHTML=msg.text;
              SC.tools.Web.postTreatmentOfDOM(this._sc_content);
              this._sc_wc=(msg.waitClick)?true:false;
              this._sc_pauseAfterEnd=(msg.pauseAfterEnd)?msg.pauseAfterEnd:0;
              this._sc_updateAppearance(msg);
              };
            }
          bubble_view._sc_display=function(re){
            const entry=re.getValuesOf(this.Evt_display);
            if(entry){
              const data=entry[0];
              //console.log("bubble display", data);
              if("function"==typeof(data.ficn)){
                data.icn=data.ficn();
                }
              data.pre=(data.icn)?(SC.seq(SC.action(function(icn){
                                         this._sc_frame.appendChild(icn);
                                         }.bind(this, data.icn))
                                   , SC.purge(data.pre)))
                                 :data.pre;
              data.post=(data.icn)?(SC.seq(SC.action(function(icn){
                                          this._sc_frame.removeChild(icn);
                                          }.bind(this, data.icn))
                                    , SC.purge(data.post)))
                                  :data.post;
              if(data.talk){
                this._sc_noSpeech=false;
                const text=data.speech?data.speech:data.text;
                const tmp=SC.tools.Web.speech({ speech: text
                    , talkEnded: this.Evt_talkEnded
                    , cancel: SC.or(this.Evt_display, this.Evt_bubbleFinish)});
                ((this._sc_clock)?this._sc_clock:SC.tools).addProgram(tmp.sc_speech_beh);
                ((this._sc_clock)?this._sc_clock:SC.tools).generateEvent(this.SC_cubeAddBehaviorEvt
                , SC.kill(this.Evt_display
                  , SC.seq(
                      SC.purge(data.pre)
                    , SC.generate(tmp.Evt_startSpeak)
                    , SC.action(this._sc_setText.bind(this, data))
                    , SC.await(this.Evt_bubbleFinish)
                    , SC.purge(data.post)
                      )
                    )
                  );
                }
              else{
                this._sc_noSpeech=true;
                ((this._sc_clock)?this._sc_clock:SC.tools).generateEvent(this.SC_cubeAddBehaviorEvt
                , SC.kill(this.Evt_display
                  , SC.seq(
                      SC.purge(data.pre)
                    , SC.action(this._sc_setText.bind(this, data))
                    , SC.await(this.Evt_bubbleFinish)
                    , SC.purge(data.post)
                      )
                    )
                  );
                }
              }
            };
          bubble_view._sc_frame=bubble_frame;
          bubble_frame.style.zIndex="18";
          bubble_view._sc_showBubble=function(re){
            const data=re.getValuesOf(this.Evt_show);
            if(data){
              const s=data[0];
              this._sc_frame.style.display=s?'block':'none';
              }
            }
          bubble_view._sc_beh=SC.cube(bubble_view
            , SC.par(
                SC.actionOn(bubble_view.Evt_show
                          , '_sc_showBubble', undefined, SC.forever)  
              , SC.actionOn(bubble_view.Evt_showBar
                          , '_sc_showBar', undefined, SC.forever)  
              , SC.resetOn(bubble_view.Evt_display
                , SC_parDisplay
                  )
                )
              );
          if(params.prt){
            params.prt.appendChild(bubble_frame);
            SC.tools.addProgram(bubble_view._sc_beh);
            }
          bubble_view._sc_bar.style.display=true===params.menu
                  ?'block':'none';          
          bubble_view._sc_frame.style.display=true===params.initShow
                  ?'block':'none';          
          bubble_frame.appendChild(bubble_view);
          return bubble_view;
          };
        Object.defineProperty(WebTools, "simpleCommentBubble"
        , { value: simpleCommentBubble
          , writable: false
            }
          );
        function removeCookie(cname){
          const expires=";expires = Thu, 01 Jan 1970 00:00:00 GMT";
          const cookieString=cname+"="+expires;
          document.cookie=cookieString;
          };
        Object.defineProperty(WebTools, "removeCookie"
        , { value: removeCookie
          , writable: false
            }
          );
        function setCookie(cname, cvalue, params){
          const old=this.getCookie(cname);
          if(undefined!=old.value){
            this.removeCookie(cname);
            }
          const exdays=(params && params.days)?params.days:1;
          const d=new Date();
          d.setTime(d.getTime()+(exdays*24*60*60*1000));
          const expires=(params && params.days)?(";expires="+d.toUTCString())
                                               :"";
          const cookieString=cname+"="+encodeURIComponent(cvalue)
              +expires
              +((params && params.path)?";path="+params.path:"")
              +((params && params.domain)?";domain="+params.domain:"")
              +((params && params.secure)?";secure":"")
              +((params && params.HttpOnly)?";HttpOnly":"");
          document.cookie=cookieString;
          };
        Object.defineProperty(WebTools, "setCookie"
        , { value: setCookie
          , writable: false
            }
          );
        function getCookies(){
          const res=[];
          const decodedCookie=decodeURIComponent(document.cookie);
          if(decodedCookie==""){
            return res;
            }
          const ca=decodedCookie.split(';');
          var cookie={};
          for(var i=0; i<ca.length; i++){
            var c=ca[i];
            while(' '==c.charAt(0)){
              c=c.substring(1);
              }
            const splt=c.indexOf('=');
            console.log("=>", splt);
            const k=(splt<0)?c:c.substring(0, splt);
            const v=(splt<0)?"":c.substring(splt+1);
            cookie.name=k;
            cookie.value=v;
            res.push(cookie);
            cookie={};
            }
          return res;
          };
        Object.defineProperty(WebTools, "getCookies"
        , { value: getCookies
          , writable: false
            }
          );
        function getCookie(cname){
          const res={ name: cname };
          const decodedCookie=decodeURIComponent(document.cookie);
          const name=cname+"=";
          const ca=decodedCookie.split(';');
          for(var i=0; i<ca.length; i++){
            var c=ca[i];
            while(' '==c.charAt(0)){
              c=c.substring(1);
              }
            if(0==c.indexOf(name)){
              res.value=c.substring(name.length, c.length);
              }
            }
          return res;
          };
        Object.defineProperty(WebTools, "getCookie"
        , { value: getCookie
          , writable: false
            }
          );
        function addToMainStyleSheet(rule, index){
          if(undefined==this.main_style){
            this.main_style=document.createElement('style');
            this.main_style.setAttribute("type", "text/css");
            document.head.appendChild(this.main_style);
            }
          this.main_style.sheet.insertRule(rule, index);
          this.removeFromMainStyleSheet=function(index){
            this.main_style.sheet.deleteRule(index);
            };
          };
        Object.defineProperty(WebTools, "addToMainStyleSheet"
        , { value: addToMainStyleSheet
          , writable: false
            }
          );
        function initNotificationSupport(){
          SC.tools.makeNotification=function(){}
          Notification.requestPermission(
            function(status){
              if(SC.tools.notificationGranted=("granted" === status)){
                SC.tools.makeNotification=function(params){
                  var n=new Notification(params.title, params.p);
                  // this also shows the notification
                  }
                }
              });
          //var n = new Notification("Bonjour,"
          //  , { body: "Merci d'avoir autorisé les notification pour ce site. Cette focntionnalité vous permettra d'être informé rapidement des modifications et des nouveautés qui seront publiées au fur et à mesure."});
          }
        Object.defineProperty(WebTools, "initNotificationSupport"
        , { value: initNotificationSupport
          , writable: false
            }
          );
/* Code source tools */
        WebTools.listingTools={
          strings: {
            VIS_BTN_YES: "&nbsp;Afficher le fichier&nbsp;"
          , VIS_BTN_NO: "&nbsp;Masquer le fichier&nbsp;"
          , SELECT_BTN: "&nbsp;Selectionner le Source&nbsp;"
          , COMMENT_BTN_YES: "&nbsp;Afficher les commentaires&nbsp;"
          , COMMENT_BTN_NO: "&nbsp;Masquer les commentaires&nbsp;"
          , LN_BTN_YES: "&nbsp;Afficher la numérotation&nbsp;"
          , LN_BTN_NO: "&nbsp;Masquer la numérotation&nbsp;"
            }
          };
        function selectCode(evt){
          const main=evt.target._sc_lst_frame;
          const code_tag=main._sc_lst_code;
          const selection=window.getSelection();
          if(selection){
            selection.removeAllRanges();
            const codeSelection=document.createRange();
            codeSelection.selectNodeContents(code_tag);
            selection.addRange(codeSelection);
            }
          document.execCommand("copy");        
          };
        function setCodeVisibility(f, vis){
          const frame='string'==typeof(f)
                        ?document.getElementById(f).parentElement
                        :f;
          frame._sc_lst_visBtn.innerHTML=
                           vis?WebTools.listingTools.strings.VIS_BTN_NO
                              :WebTools.listingTools.strings.VIS_BTN_YES;
          frame._sc_lst_code.style.display=vis?"block":"none";
          frame._sc_lst_selBtn.hidden=!vis;
          frame._sc_lst_cmtBtn.hidden=!vis;
          frame._sc_lst_lnBtn.hidden=!vis;
          };
        function jfs_lst_toggle_codeVisibility(frame){
          jfs_lst_setCodeVisibility(frame
            , 'none'==frame._sc_lst_code.style.display);
          };
        function codeVisibility(evt){
          toggle_codeVisibility(evt.target._sc_lst_frame);
          }
        function numberingCode(evt){
          const main=evt.target._sc_lst_frame;
          const lines=main._sc_lst_code._sc_lst_lines;
          const ln_status='none'!=lines.style.display;
          main._sc_lst_lnBtn.innerHTML=ln_status
                         ?WebTools.listingTools.strings.LN_BTN_YES
                         :WebTools.listingTools.strings.LN_BTN_NO;
          lines.style.display=ln_status?"none":"block";
          setTimeout(function(){
            main._sc_maskUpdateFun(main);
            });
          };
        function makeLNText(src_nb_lines){
          const n_digits=(""+src_nb_lines).length;
          var lines_nb_txt = "";
          for(var i=0; i<src_nb_lines; i++){
            var lnr="    "+(i+1);
            lnr=lnr.substring(lnr.length-n_digits , lnr.length);
            lines_nb_txt+=(lnr+' \n');
            }
          return lines_nb_txt;
          };
        Object.defineProperty(WebTools, "makeLNText"
        , { value: makeLNText , writable: false });
        function toggle_hideComments(main){
          const code_tag=main._sc_lst_code;
          var comment_lines=code_tag.getElementsByClassName('Comment');
          const cmt_btn=main._sc_lst_cmtBtn;
          if(comment_lines.length>0){
            const comment_visibility=!cmt_btn._sc_hidden;
            cmt_btn._sc_hidden=comment_visibility;
            cmt_btn.innerHTML=comment_visibility
                                ?WebTools.listingTools.strings.COMMENT_BTN_YES
                                :WebTools.listingTools.strings.COMMENT_BTN_NO
            for(var a_line=comment_lines.length-1; a_line>=0; a_line--){
              comment_lines[a_line].hidden=comment_visibility;
              if(comment_lines[a_line].nextSibling 
                  && (comment_lines[a_line].textContent.startsWith('/*')
                     || comment_lines[a_line].textContent.startsWith('#'))
                  && comment_lines[a_line].nextSibling.tagName=="BR"
                  ){// hidding br
                comment_lines[a_line].nextSibling.hidden=comment_visibility;
                }
              if(comment_lines[a_line].style
                   && 'none'==comment_lines[a_line].style.display){
                continue;
                }
              const nested_br_in_cmt=comment_lines[a_line]
                                       .getElementsByTagName('BR');
              for(var i in nested_br_in_cmt){
                nested_br_in_cmt[i].hidden=comment_visibility;
                }
              }
            comment_lines=code_tag.getElementsByClassName('Folded');
            for(var a_line=comment_lines.length-1; a_line>=0; a_line--){
              comment_lines[a_line].hidden=comment_visibility;
              if(comment_lines[a_line].nextSibling
                 && 'BR'==comment_lines[a_line].nextSibling.tagName){
                comment_lines[a_line].nextSibling.hidden=comment_visibility;
                }
              }
            const pre_line=code_tag._sc_lst_lines;
            const src_lines=code_tag.getElementsByTagName('BR');
            var src_nb_lines=0;
            for(var j=src_lines.length-1; j>=0; j--){
              if(!src_lines[j].hidden){
                src_nb_lines++;
                }
              }
            lines_nb_txt=makeLNText(src_nb_lines);
            pre_line.textContent=lines_nb_txt;
            }
          setTimeout(function(){
            main._sc_maskUpdateFun(main);
            });
          };
        function hideComments(evt){
          toggle_hideComments(evt.target._sc_lst_frame);
          };
        var lst_css_needed=params.tools.baseDir;
        function makeInterface(params){
          if(lst_css_needed){
            const cssLink=document.createElement("link");
            cssLink.setAttribute('rel', 'stylesheet');
            cssLink.setAttribute('href', lst_css_needed
                                         +'SC_Tools_ListingsIHM.css');
            document.head.appendChild(cssLink);
            lst_css_needed=false;
            }
          const frame=quickElt({ tag: 'div', cls: "interfaceMenuBar" });
          if(params.maskCmd){
            const _sc_inners= [
                "&nbsp;▶︎&nbsp;"
              , "&nbsp;▼&nbsp;"
                ];
            const b= quickElt({
                  tag: 'span'
                , innerHTML: _sc_inners[1]
                , cls: "interfaceBtn"
                , title: "Masquer/Afficher le code."
                  });
            const Sens_click= SC.sensor('Sens_click'
	      , { dom_targets: [ { target: b, evt: 'click' } ] });
            b._sc_click= function(s, re){
              const evt= re.sensorValueOf(s);
              const cmdBtn= evt.target;
              const code_parent= cmdBtn._sc_lst_root;
              const code_spc= code_parent.children[1];
              if(this.innerHTML==_sc_inners[0] && code_spc.style.display=="none"){
                this.innerHTML=_sc_inners[1];
                code_spc.style.display="flex";
                code_parent._sc_maskUpdateFun(code_parent);
                }
              else{
                this.innerHTML=_sc_inners[0];
                code_spc.style.display="none";
                code_parent._sc_maskUpdateFun(code_parent);
                }
              }.bind(b, Sens_click);
            SC.tools.addProgram(SC.cube(b, SC.repeatForever(
		  SC.nop("enter loop")
                , SC.await(Sens_click)
		, SC.nop("click collapse ?")
                , SC.action("_sc_click")
                  )
                )
              );
            b._sc_lst_root=params.code_parent;
            frame.appendChild(b);
            params.code_parent._sc_lst_visBtn=b;
            }
          if(params.selectCmd){
            const b=quickElt({
                tag: 'span'
              , innerHTML: WebTools.listingTools.strings.SELECT_BTN
              , cls: "interfaceBtn"
                });
            b.addEventListener("click", selectCode);
            b._sc_lst_frame=params.code_parent;
            frame.appendChild(b);
            params.code_parent._sc_lst_selBtn=b;
            }
          if(params.commentCmd){
            const b=quickElt({
                tag: 'span'
              , innerHTML: WebTools.listingTools.strings.COMMENT_BTN_NO
              , cls: "interfaceBtn"
                });
            b.addEventListener("click", hideComments);
            b._sc_lst_frame=params.code_parent;
            b._sc_hidden=false;
            frame.appendChild(b);
            params.code_parent._sc_lst_cmtBtn=b;
            }
          if(params.lineNumberCmd){
            const b=quickElt({
                tag: 'span'
              , innerHTML: WebTools.listingTools.strings.LN_BTN_NO
              , cls: "interfaceBtn"
                });
            b.addEventListener("click", numberingCode);
            b._sc_lst_frame=params.code_parent;
            frame.appendChild(b);
            params.code_parent._sc_lst_lnBtn=b;
            }
          if(params.filename){
            const b=quickElt({
                tag: 'span'
              , innerHTML: "&nbsp;"
                  +(params.downloadable?`<a download="${params.filename}" htref="">`
                                       :"<span>")
                  +params.filename
                  +(params.downloadable?"</a>":"</span>")
                  +"&nbsp;"
              , style: "font-size: 8pt;margin: 0;padding: 0;"
                           +(params.downloadable
                               ?("cursor: pointer; color: blue;"
                                        +"text-decoration-line: underline;")
                               :"")
              });
            if(params.downloadable){
              b.addEventListener("click", function(evt){
                var blob = new Blob([this._sc_lst_code.innerText]
                                  , {type : 'javsacript/text'});
                this._sc_lst_pathName.children[0].href=URL.createObjectURL(blob);
                }.bind(params.code_parent));
              }
            frame.appendChild(b);
            params.code_parent._sc_lst_pathName=b;
            }
          return frame;
          };
        function formatSnipet(params={}){
          var code_parent=null;
          var code_section=null;
          var anchor=null;
          var lines=null;
          var mask=null;
          var pre_line=null;
          var code_tag=(params.base)?params.base
                                    :('string'==typeof(params.id))
                                         ?document.getElementById(params.id)
                                         :quickElt({tag: "pre"});
          if(undefined==code_tag
              || !['PRE','CODE', 'JFS_CODE'].includes(code_tag.tagName)){
            throw new Error("code element doesn't exist");
            }
          if('JFS_CODE'==code_tag.tagName){
            code_parent=code_tag;
            }
          else{
            params.base=code_tag;
            }
          if(!code_tag._sc_tooled){
            const prt=code_tag.parentElement;
            if('JFS_CODE'==code_tag.tagName){
              code_tag=quickElt({ tag: "pre" });
              }
            params.base=code_tag;
            code_tag.classList.add('jfs_snipet');
            anchor=prt;
            if(undefined==code_parent){
              code_parent=quickElt({ tag: 'jfs_code'
                                   , cls: 'jfs_snipetRoot' });
              }
            code_section=quickElt({ tag: 'section'
              , style: 'position: relative; display: flex;' });
            pre_line=quickElt({ tag: 'pre' , cls: 'lnr' });
            code_parent.appendChild(code_section);
            code_section.appendChild(pre_line)
            code_section.appendChild(code_tag)
            if(params.snip){
              code_tag.innerHTML=params.snip;
              }
            else{
              code_tag.innerHTML=SC.tools.LST.parseDoc({
                                           src: code_tag.textContent
                                         , lang: params.lang
                                         , no_list: params.no_list
                                         , no_final_br: params.no_final_br
                                         , annotator: params.annotator
                                         })[2];
              }
            code_tag.style.width=params.w?params.w:"";
            params.code_parent=code_parent;
            code_parent._sc_lst_code=code_tag;
            const frame=makeInterface(params);
            const src_nb_lines=code_tag.innerText.split("\n").length;
            pre_line.textContent=makeLNText(src_nb_lines);
            code_tag._sc_lst_lines=pre_line;
            code_parent.insertBefore(frame, code_section);
            const bg_hi_pre=quickElt({ tag: 'pre'
              , style: code_tag.getAttribute("style") });
            bg_hi_pre.style.position="absolute";
            bg_hi_pre.style.margin="0";
            bg_hi_pre.style.padding="0";
            bg_hi_pre.style.zIndex="-1";
            bg_hi_pre.style.left=code_tag.offsetLeft+"pt";
            bg_hi_pre.style.width=code_tag.offsetWidth+"pt";
            code_parent._sc_maskUpdateFun=function(c){};
            code_parent._sc_registerMaskUpdate=function(fun){
              this._sc_maskUpdateFun=fun;
              };
            code_parent._sc_set_pathName=function(pname){
              this._sc_lst_pathName.children[0].innerHTML=pname;
              this._sc_lst_pathName.children[0].setAttribute('download', pname);
              };
            code_parent._sc_setMask=function(code_tag, html){
              this.innerHTML=html;
              this.style.width=code_tag.offsetWidth+"px";
              this.style.left=code_tag.offsetLeft+"px";
              }.bind(bg_hi_pre, code_tag);
            code_parent._sc_setMask("");
            code_parent.children[1].appendChild(bg_hi_pre);
            if(params.lineNumberCmd||params.showLN){
              pre_line.style.display="";
              }
            else{
              pre_line.style.display="none";
              }
            if(params.notVisible && !params.notVisible){
              toggle_codeVisibility(code_parent);
              }
            }
          return code_parent;
          };
        this._sc_idGenerator=0;
        Object.defineProperty(WebTools, "formatSnipet"
        , { value: formatSnipet
          , writable: false
            }
          );
        /* intialise l'image viewer comme un champ du document */
        function initPopup(){
          if(SC.globals.popup){
            return;
            }
          SC.globals.popup={
              Evt_hide: SC.evt("hide")
            , Evt_show: SC.evt("show")
            , Evt_afterNews: SC.evt("afterNews")
            , Evt_setNewContent: SC.evt("setNewContent")
              };
          //SC.globals.news={
          //    loaded: SC.evt("loaded")
          //  , displayNews: SC.evt("displayNews")
          //    };
          const DP=quickElt({
                tag: 'img'
              , id : "JFS_DOMID_currentImgInTheImageViewer"
              , alt: "Capture d'écran"
                });
          SC.globals.DP={
            Evt_reload: SC.sensor("reload",{ dom_targets: [ {
                target: DP
              , evt: 'load' }
                ]})
            };
          SC.tools.main.addProgram(SC.cube(DP
            , SC.actionOn(SC.globals.DP.Evt_reload
              , "_sc_imageReloaded"
              , undefined
              , SC.forever
                )
              )
            );
          DP._sc_imageReloaded=function(events, m){
            const frame=this.parentNode;
            const imw=this.width;
            const imh=this.height;
            const fow=frame.offsetWidth;
            const foh=frame.offsetHeight;
            var ratio_h=imw/fow;
            var ratio_v=imh/foh;
            if(ratio_h>ratio_v){
              if(ratio_h<1){
                ratio_h=1;
                }
              if((fow-10)<imw){
                this.style.width=(fow-10)+"px";
                this.style.left="5px";
                }
              else{
                this.style.width="auto";
                this.style.left=((fow-imw)/2)+"px";
                }
              this.style.height="auto";
              this.style.top=Math.round((foh-imh/ratio_h)/2)+"px";
              }
            else{
              if(ratio_v<1){
                ratio_v=1;
                }
              if((foh-10)<imh){
                this.style.height=(foh-10)+"px";
                this.style.top="5px";
                }
              else{
                this.style.height="auto";
                this.style.top=((foh-imh)/2)+"px";
                }
              this.style.width="auto";
              this.style.left=Math.round((fow-imw/ratio_v)/2)+"px";
              }
            this.hidden=false;
            };
          function displayPhoto(src){
            SC.tools.generateEvent(SC.globals.popup.Evt_setNewContent, DP);
            SC.tools.generateEvent(SC.globals.popup.Evt_show);
            if(DP.getAttribute("src")!=src){
              DP.hidden=true;
              DP.setAttribute("src", src);
              }
            return false;
            };
          Object.defineProperty(WebTools, "displayPhoto"
          , { value: displayPhoto
            , writable: false
              }
            );
          const popupTools=quickElt({
              tag: 'div'
            , id: 'SCWebTools_DOMID_popup_screen'
              }
            );
          popupTools._sc_setPopupOffset=function(m){
            if(! SC.tools.Web.identified){
              this.style.top="30pt";
              }
            this.style.display="";
            };
          popupTools.Evt_esc=SC.evt("esc")
          popupTools.hiddable="none";
          popupTools._sc_displayHide=function(re){
            this.style.display=this.hiddable;
            }
          const pp=params.popup;
          popupTools._sc_init=(pp && pp.init)?pp.init:function(re){
            console.log("std popup init");
            const tmp=quickElt({
                tag: 'img'
              , cls: "WebTools_IHMStyle_CloseBtn"
              , src: "images/png/Close.png"
              , width: 30
              , height: 30
              , alt: "Close"
              , title: "Close Popup Window"
                });
            tmp.addEventListener('click', function(evt){
              SC.tools.main.generateEvent(SC.globals.popup.Evt_hide);
              });
            this._sc_content=quickElt({
                tag: 'div'
              , id: 'WebToolsDOMID_popup_content'
                });
            tmp.style.position="fixed";
            tmp.style.zIndex="25";
            //this.jfs_content.style.top="30px";
            this.appendChild(this._sc_content);
            this.appendChild(tmp);
            document.body.appendChild(this);
            this.style.display="none";
            };
          popupTools.showLastNews=function(re){
            /*if(undefined == WebTools_Globals.ine){
              return;
              }
            var tmp_news = document.getElementById("page_news");
            //console.log("page news", tmp_news);
            if(null !== tmp_news){
              tmp_news = tmp_news.children[1].children[0].lastChild;
              }
            else{
              tmp_news={innerHTML:"pas de nouvelle..."};
              }
            //console.log("last news", tmp_news);
            //console.log("content last news", tmp_news.innerHTML);
            WebTools.popupTools.jfs_content.innerHTML
                                   = "<div class='WebTools_news_cart'>"
                                   + tmp_news.innerHTML+"</div>";
            SC.tools.generateEvent(WebTools.events.popup.show);*/
            };
          popupTools._sc_setNewContent=function(re){
            const contents=re.getValuesOf(SC.globals.popup.Evt_setNewContent);
            this._sc_content.innerHTML="";
            if(contents){
              this._sc_content.appendChild(contents[0]);
              }
            };
          SC.tools.addProgram(
            SC.cube(popupTools
            , SC.par(
                SC.actionOn(SC.globals.popup.Evt_show, "_sc_setPopupOffset"
                , undefined, SC.forever)
              , SC.repeatForever(
                  SC.await(SC.or(SC.globals.popup.Evt_hide
                                 , "Evt_esc"))
                , SC.action("_sc_displayHide")
                , SC.generate(SC.globals.popup.Evt_hide)
                  )
              , SC.repeatForever(
                  SC.await(SC.globals.globalKeydown.esc)
                , SC.generate("Evt_esc")
                  )
              , SC.seq(
                  SC.action("_sc_init")
                , SC.pause(2)
                //, SC.action("_sc_showLastNews")
                //, SC.pause()
                //, SC.test(function(){
                //        return ((undefined == SC.globals.formResps)
                //              || (undefined == SC.globals.formResps.form1))
                //                    && (undefined !== SC.globals.ine);
                //        }
                //     , SC.seq(
                //         SC.generate("css_displayEvt", "")
                //         //, SC.log()
                //         , SC.await(SC.or(SC.globals.popup.Evt_hide, "Evt_esc"))
                //         , SC.generate(SC.globals.popup.Evt_afterNews)
                //         )
                //     //, SC.log("no afternews cause of form1 exists.")
                //     )
                  )
              , SC.actionOn(SC.globals.popup.Evt_setNewContent
                  , "_sc_setNewContent"
                  , undefined
                  , SC.forever
                    )
              //, SC.actionOn(WebTools.events.displayNews
              //    , "showLastNews"
              //    , undefined
              //    , SC.forever
              //    )
                )
              )
            );
/*    SC.tools.Web.popupTools=SC.tools.Web.makeDiv({
        id:"SCWebTools_DOMID_popup_screen"
      , beh: 
        });
    WebTools.popupTools.jfs_onclickTrap = function(file_to_downoad){
      //if(window.navigator.standalone){
        var tmp=document.createElement('div');
        PDFObject.embed(file_to_downoad,tmp);
        tmp.style.height="90%";
        SC.tools.generateEvent(WebTools.events.popup.setNewContent,tmp);
        SC.tools.generateEvent(WebTools.events.popup.show);
        return false;
        //}
      //return true;
      }*/
          };
        Object.defineProperty(WebTools, "initPopup"
        , { value: initPopup
          , writable: false
            }
          );
///* affichage de la photo dans le cadre dédié */
//JFS.paperTool = SC.tools.makeDiv({
//  id : 'JFSDOMID_pageViewer'
//  });
//function jfs_displayPaper(file){
//  var section = JFS.paperTool;
//  SC.tools.generateEvent(JFS.events.popup.show);
//  SC.tools.generateEvent(JFS.events.popup.setNewContent, section);
//  //JFS.popupTools.jfs_content.innerHTML="";
//  //JFS.popupTools.jfs_content.appendChild(section);
//  JFS.loadData(file, (function(section){ return function(res){
//    section.innerHTML = res;
//    //console.log(res);
//    var scriptNodes = section.getElementsByTagName("script");
//    try{
//      //console.log("script nodes to activate", scriptNodes);
//      for(var i = 0; i < scriptNodes.length; i++){
//        eval(scriptNodes[i].text);
//        }
//      if(navigator.onLine){
//        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"JFSDOMID_pageViewer"]);
//        }
//      }
//    catch(e){}
//    }})(section));
//  return false;
//}
//
///* affichage de la photo dans le cadre dédié */
///* Ajoute le thumb dans la série de screenshots */
//function jfs_addNewImage(the_path, the_id, the_alt){
//  var img_thumb = document.createElement("img");
//  img_thumb.setAttribute("src",the_path);
//  img_thumb.setAttribute("onclick","javascript:jfs_displayPhoto(\""+the_path+"\");");
//  img_thumb.style.height="200px";
//  img_thumb.style.alt=the_alt;
//  document.getElementById(the_id).appendChild(img_thumb);
//}


        return WebTools;
        }).call(sc_global, p)
    , writable: false
      }
    );
  }
else{
  throw new Error("SugarCubesJS must be loaded first and tools initialized");
  }
