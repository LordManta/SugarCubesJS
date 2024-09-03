/*
 * SC_Tools_WebEnergize.js
 * Author : Jean-Ferdinand SUSINI (MNF)
 * Created : 25/10/2015 at 21:31
 * version : 1.0 alpha
 * implantation : 0.0.3
 * Copyleft 2015-2021.
 */

;
if(SC && SC.sc_build>1 && SC.tools){
  (function(){
    const css_properties=[
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
    , "filter"
      ];
    function activateElement(tmp){
      tmp._sc_extension.beh=SC.cube(tmp, SC.nothing());
      tmp._sc_extension.Evt_addInClassList=SC.evt("Evt_addInClassList");
      tmp._sc_extension.Evt_removeFromClassList=SC.evt("Evt_removeFromClassList");
      SC.toCell({ target: tmp, name: "classList", fun: function(val, re){
          const tmp=re.getValuesOf(this._sc_extension.Evt_addInClassList);
          if(tmp){
            for(var n of tmp){
              if(!val.contains(n)){
                val.add(n);
                }
              }
            }
          tmp=re.getValuesOf(this._sc_extension.Evt_removeFromClassList);
          if(tmp){
            for(var cl of tmp){
              if(val.contains(cl)){
                val.remove(cl);
                }
              }
            }
          return val;
          }.bind(tmp)
      , el: [tmp._sc_extension.Evt_addInClassList, tmp._sc_extension.Evt_removeFromClassList]
      , store: tmp._sc_extension
        });
      tmp._sc_extension.beh.addProgram(SC.repeat(SC.forever
                           , SC.await(SC.or(tmp._sc_extension.Evt_addInClassList
                                        , tmp._sc_extension.Evt_removeFromClassList)
                                     )
                           , tmp._sc_extension.$_scc_classList));
      if(undefined!==tmp.src){
        tmp._sc_extension.Evt_src=SC.evt("src");
        SC.toCell({ target: tmp
                  , name: "src"
                  , fun: SC.toCellFun(tmp._sc_extension, tmp._sc_extension.Evt_src)
                  , store: tmp._sc_extension
                  , el: [tmp._sc_extension.Evt_src] });
        tmp._sc_extension.beh.addProgram(SC.repeat(SC.forever
                             , SC.await(tmp._sc_extension.Evt_src)
                             , tmp._sc_extension.$_scc_src
                             )
                           );
        }
      tmp._sc_extension.Evt_innerHTML=SC.evt("innerHTML");
      SC.toCell({ target: tmp
                , name: "innerHTML"
                , fun: SC.toCellFun(tmp._sc_extension, tmp._sc_extension.Evt_innerHTML)
                , store: tmp._sc_extension
                , el: [tmp._sc_extension.Evt_innerHTML]});
      tmp._sc_extension.beh.addProgram(SC.repeat(SC.forever
                           , SC.await(tmp._sc_extension.Evt_innerHTML)
                           , tmp._sc_extension.$_scc_innerHTML
                           )
                        );
      function stylizer(tgt, style_prop){
        const cssEvtName="css_"+style_prop;
        const cssEvt=this["Evt_"+cssEvtName]=SC.evt(cssEvtName);
        SC.toCell({ target: tgt
                  , name: style_prop
                  , fun: SC.toCellFun(this, cssEvt)
                  , el: [cssEvt]
                  , store: this
                  , sub: ["style"] });
        this.beh.addProgram(SC.repeat(SC.forever
                             , SC.await(cssEvt)
                             , this["$_scc_"+style_prop]
                             )
                          );
        };
      for(var i in css_properties){
        const propName=css_properties[i];
        if(undefined!==tmp.style[propName]){
          stylizer.call(tmp._sc_extension, tmp, propName);
          }
        }
      tmp._sc_extension.Evt_title=SC.evt("att::title");
      SC.toCell({ target: tmp
                , name: "title"
                , fun: SC.toCellFun(tmp._sc_extension, tmp._sc_extension.Evt_title)
                , store: tmp._sc_extension
                , el: [tmp._sc_extension.Evt_title] });
      tmp._sc_extension.beh.addProgram(SC.repeat(SC.forever
                           , SC.await(tmp._sc_extension.Evt_title)
                           , tmp._sc_extension.$_scc_title
                           )
                        );
      if(undefined!==tmp.alt){
        tmp._sc_extension.Evt_alt=SC.evt("att::alt");
        SC.toCell({ target: tmp
                  , name: "alt"
                  , fun: SC.toCellFun(tmp._sc_extension, tmp._sc_extension.Evt_alt)
                  , store: tmp._sc_extension
                  , el: [tmp._sc_extension.Evt_alt] });
        tmp._sc_extension.beh.addProgram(SC.repeat(SC.forever
                             , SC.await(tmp._sc_extension.Evt_alt)
                             , tmp._sc_extension.$_scc_alt
                             )
                          );
        }
      tmp._sc_extension._inspected=false;
      tmp.addEventListener('click', function(evt){
        if(SC.tools.Web.elementInspector){
          if(SC.tools.Web.elementInspector.sc_vis || (4===evt.detail)){
            SC.tools.generateEvent(
                SC.tools.Web.elementInspector.setIcobjUnderInspectionEvt
              , this);
            }
          }
        }.bind(tmp));
      return tmp;
      };
    function finishElement(elt, p){
      if(p.cl){
        if(p.cl instanceof Array){
          for(var i=0; i<p.cl.length; i++){
            if(!elt.classList.contains(p.cl[i])){
              elt.classList.add(p.cl[i]);
              }
            }
          }
        else{
          elt.classList.add(p.cl);
          }
        }
      if(p.id){
        elt.setAttribute('id', p.id);
        }
      if(p.position){
        elt.style.position=p.position;
        }
      if(p.inH){
        elt.innerHTML=p.inH;
        }
      if(p.src){
        elt.setAttribute("src", p.src);
        }
      if(p.alt){
        elt.setAttribute("alt", p.alt);
        }
      if(p.title){
        elt.setAttribute("title", p.title);
        }
      function mkListener(sc_evt, m){
        return (sc_evt.isSampled)? function(evt){
              this.newValue(evt);
              }.bind(sc_evt)
            : function(m, evt){
              m.addEntry(this, evt);
              }.bind(sc_evt, m)
        };
      if(p.evt_click){
        const evt=elt._sc_extension.Evt_click=p.evt_click;
        const jsevt='click';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt }])
          }
        else{
          elt.addEventListener(jsevt
             , mkListener(elt.evt_click
                       , (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_touchStart){
        const evt=elt._sc_extension.Evt_touchStart=p.on_touchStart;
        const jsevt='touchstart';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_touchStop){
        const evt=elt._sc_extension.Evt_touchStop=p.on_touchStop;
        const jsevt='touchend';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_touchCancel){
        const evt=elt._sc_extension.Evt_touchCancel=p.on_touchCancel;
        const jsevt='touchcancel';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_mouseUp){
        const evt=elt._sc_extension.Evt_on_mouseUp=p.on_mouseUp;
        const jsevt='mouseup';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_mouseDown){
        const evt=elt._sc_extension.Evt_on_mouseDown= p.on_mouseDown;
        const jsevt='mousedown';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_keyDown){
        const evt=elt._sc_extension.Evt_on_keyDown= p.on_keyDown;
        const jsevt='keydown';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.on_keyUp){
        const evt=elt._sc_extension.Evt_on_keyUp= p.on_keyUp;
        const jsevt='keyup';
        if(evt.isSensor && !evt.isSampled){
          evt.addLink([{ target: elt, evt: jsevt}])
          }
        else{
          elt.addEventListener(jsev
             , mkListener(evt, (p.m?p.m:SC.tools.main)));
          }
        }
      if(p.beh){
        elt._sc_extension.beh.addProgram(p.beh);
        }
      if(elt._sc_extension.beh){
        if(p.m){
          p.m.addProgram(elt._sc_extension.beh);
          }
        else{
          SC.tools.addProgram(elt._sc_extension.beh);
          }
        }
      elt._sc_getEvt= function(name){
	return this._sc_extension['Evt_'+name];
        }
      return elt;
      };
    function makeElement(elt, p={}){
      const tmp=document.createElement(elt);
      tmp._sc_extension={};
      const meths=p.actions;
      if("object"==typeof(meths)){
        for(var met of Object.keys(meths)){
          if("function"!=typeof(meths[met])){
            throw new Error("cubify fun "+meths[met]+" not valid");
            }
          tmp._sc_extension[met]=meths[met];
          }
        }
      if(p.sc_cubeInit){
        p.sc_cubeInit.call(tmp);
        }
      activateElement(tmp);
      return finishElement.call(this, tmp, p);
      };
    /**/
    /* DOM Element Inspector */
    /* JFS Inspector */
    function initInspector(){
      if(undefined==SC.tools.main){
        throw new Error("tools not initialized");
        }
      this.elementInspector=document.createElement("div");
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
      this.elementInspector.controlTitle = this.elementInspector.children[0].children[1];
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
      };
    Object.defineProperty(SC.tools.Web, "initInspector"
                            , { value: initInspector
                              , writable: false
                                }
                            );
  /*
  Energizing HRML Elements.
  */
      //, configureElement: finishElement
      //, energize: function(p){
      //    var tmp=finishElement.call(this
      //    , activateElement(document.currentScript.previousElementSibling)
      //    , p
      //      );
      //    return tmp;
      //    }
    //  , makeImage: function(args){
    //      var tmp=null;
    //      if(undefined!==args.w
    //         && undefined!==args.h
    //        ){
    //        tmp=new Image(args.w, args.h);
    //        }
    //      else{
    //        tmp=new Image();
    //        }
    //      activateElement(tmp);
    //      return finishElement.call(this, tmp, args);
    //      }
    Object.defineProperty(SC.tools.Web, "activateElement"
                            , { value: activateElement
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeDiv"
                            , { value: makeElement.bind(SC.tools.Web, "div")
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeP"
                            , { value: makeElement.bind(SC.tools.Web, "p")
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeUl"
                            , { value: makeElement.bind(SC.tools.Web, "ul")
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeInput"
                            , { value: makeElement.bind(SC.tools.Web, "input")
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeLabel"
                            , { value: makeElement.bind(SC.tools.Web, "label")
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeSpan"
                            , { value: makeElement.bind(SC.tools.Web, "span")
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "makeImage"
                            , { value: makeElement.bind(SC.tools.Web, "img")
                              , writable: false
                                }
                            );
    }).call(window);
  }
else{
  throw new Error("SugarCubesJS must be loaded first, tools and WebTools initialized");
  }
