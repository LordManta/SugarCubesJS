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
                SC.tools.Web.elementInspector._sc_extension.Evt_setIcobjUnderInspection
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
             , mkListener(evt
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
      const elementInspector= this.elementInspector= document.createElement("div");
      elementInspector.style.display= "inline-block";
      elementInspector.style.position= "fixed";
      elementInspector.style.color= "rgba(255,255,255,0.9)";
      elementInspector.style.backgroundColor= "rgba(0,0,0,0.6)";
      elementInspector.style.borderRadius= "10px";
      elementInspector.style.padding= "5px";
      elementInspector._sc_extension= {};
      elementInspector._sc_extension.Evt_set_xy= SC.evt("panel_set_xy");
      elementInspector._sc_extension.Evt_show= SC.evt("show");
      elementInspector._sc_extension.Evt_hide= SC.evt("hide");
      elementInspector._sc_makeCell= function(nom, init, el){
        this._sc_extension["$_scc_"+nom]= SC.cell({ init: init
                                , sideEffect: this._sc_extension["_scc_"+nom].bind(this)
                                , eventList: el});
        Object.defineProperty(this, nom,{get: (function(nom){
          return this._sc_extension["$_scc_"+nom].val();
        }).bind(this, nom)});
        }
      elementInspector._sc_extension._scc_updatePanel= function(val, re){
        const pos= re.getValuesOf(this._sc_extension.Evt_set_xy);
        if(pos){
          const psn= pos[0];
          if(0<(psn.x-this.panel_mid)){
            if((psn.x-this.panel_mid)<(window.innerWidth-80)){
              this.style.left= (psn.x-this.panel_mid)+"px";
              }
            else{
              this.style.left= (window.innerWidth-80)+"px";
              }
            }
          else{
            this.style.left= "1px";
            }
          if(psn.y>0){
            if(psn.y<window.innerHeight-10){
              this.style.top= psn.y+"px";
              }
            else{
              this.style.top= (window.innerHeight-10)+"px";
              }
            }
          else{
            this.style.top = "1px";
            }
          }
        };
    /* ---- */
      elementInspector._sc_icobjListener= function(nom, evt){
        return SC.actionOn(evt, function(n, e, re){
                   this['scis_'+n].value= re.getValuesOf(e)[0];
                   }.bind(this, nom, evt), undefined, SC.forever);
      }
      this.elementInspector._sc_extension.Evt_setIcobjUnderInspection= SC.evt("setIcobjUnderInspection");
      this.elementInspector._sc_extension.Evt_setIcobjNoMoreInspection= SC.evt("setIcobjNoMoreInspection");
      this.elementInspector._sc_extension._scc_icobjControled= function(val, re){
        var e= re.getValuesOf(this._sc_extension.Evt_setIcobjUnderInspection);
        var i= val;
        if(undefined===e){
          e= evts[this._sc_extension.Evt_setIcobjNoMoreInspection];
          if(undefined===e){
            return val;
            }
          if(e[0]==val){
            this.scis_background.value= "";
            this.scis_position.value= "";
            this.scis_display.value= "";
            this.scis_left.value= "";
            this.scis_top.value= "";
            this.scis_color.value= "";
            this.scis_opacity.value= "";
            this.scis_font.value= "";
            this.scis_border.value= "";
            this.scis_borderRadius.value= "";
            this.scis_width.value= "";
            this.scis_height.value= "";
            this.scis_padding.value= "";
            this.scis_boxSizing.value= "";
            this.scis_boxShadow.value= "";
            this.scis_filter.value= "";
            this.scis_outline.value= "";
            this.scis_overflowX.value= "";
            this.scis_overflowY.value= "";
            this.scis_zoom.value= "";
            this.scis_sc_title.value= "";
            this.scis_sc_src.value= "";
            i= null;
            }
          else{
            return val;
            }
          }
        else{
          i= e[0];
          }
        this.controlTitle.innerHTML= i?i.tagName:"--";
        if(i){
          this.scis_background.value= i.style.background;
          this.scis_position.value= i.style.position;
          this.scis_display.value= i.style.display;
          this.scis_left.value= i.style.left;
          this.scis_top.value= i.style.top;
          this.scis_color.value= i.style.color;
          this.scis_opacity.value= i.style.opacity;
          this.scis_font.value= i.style.font;
          this.scis_border.value= i.style.border;
          this.scis_borderRadius.value= i.style.borderRadius;
          this.scis_width.value= i.style.width;
          this.scis_height.value= i.style.height;
          this.scis_padding.value= i.style.padding;
          this.scis_margin.value= i.style.margin;
          this.scis_boxSizing.value= i.style.boxSizing;
          this.scis_boxShadow.value= i.style.boxShadow;
          this.scis_filter.value= (i.style.WebkitFilter)?i.style.WebkitFilter
                                   :i.style.filter;
          this.scis_outline.value= i.style.outline;
          this.scis_overflowX.value= i.style.overflowX;
          this.scis_overflowY.value= i.style.overflowY;
          this.scis_zoom.value= i.style.zoom;
          this.scis_sc_title.value= i.title;
          this.scis_sc_src.value= i.src?i.src:"";
          SC.tools.addProgram(
            SC.kill(SC.or(this._sc_extension.Evt_setIcobjUnderInspection
                         ,this._sc_extension.Evt_setIcobjNoMoreInspection)
              , SC.par(
                  this._sc_icobjListener("background", i._sc_getEvt('css_background'))
                , this._sc_icobjListener("position", i._sc_getEvt('css_position'))
                , this._sc_icobjListener("display", i._sc_getEvt('css_display'))
                , this._sc_icobjListener("top", i._sc_getEvt('css_top'))
                , this._sc_icobjListener("left", i._sc_getEvt('css_left'))
                , this._sc_icobjListener("color", i._sc_getEvt('css_color'))
                , this._sc_icobjListener("opacity", i._sc_getEvt('css_opacity'))
                , this._sc_icobjListener("font", i._sc_getEvt('css_font'))
                , this._sc_icobjListener("border", i._sc_getEvt('css_border'))
                , this._sc_icobjListener("borderRadius", i._sc_getEvt('css_borderRadius'))
                , this._sc_icobjListener("width", i._sc_getEvt('css_width'))
                , this._sc_icobjListener("height", i._sc_getEvt('css_height'))
                , this._sc_icobjListener("padding", i._sc_getEvt('css_padding'))
                , this._sc_icobjListener("margin", i._sc_getEvt('css_margin'))
                , this._sc_icobjListener("boxSizing", i._sc_getEvt('css_boxSizing'))
                , this._sc_icobjListener("boxShadow", i._sc_getEvt('css_boxShadow'))
                , (i.style.WebkitFilter
                     ?this._sc_icobjListener("filter", i._sc_getEvt('css_WebkitFilter'))
                     :this._sc_icobjListener("filter", i._sc_getEvt('css_filter')))
                , this._sc_icobjListener("outline", i._sc_getEvt('css_outline'))
                , this._sc_icobjListener("overflowX", i._sc_getEvt('css_overflowX'))
                , this._sc_icobjListener("overflowY", i._sc_getEvt('css_overflowY'))
                , i._sc_getEvt('css_zoom')?this._sc_icobjListener("zoom", i._sc_getEvt('css_zoom'))
                    :SC.nothing()
                , this._sc_icobjListener("sc_title", i._sc_getEvt('title'))
                , i._sc_getEvt('src')?this._sc_icobjListener("sc_src", i._sc_extension.Evt_src)
                                     :SC.nothing()
                )
              )
          );
        }
        var mid= parseInt(window.getComputedStyle(this.controlTitle.parentNode).width)/2;
        this.panel_mid= isNaN(mid)?this.panel_mid:mid;
        return i;
        }
      /* the icobj under inspection */
      this.elementInspector._sc_makeCell("icobjControled", null
                        , [ this.elementInspector._sc_extension.Evt_setIcobjUnderInspection
                          , this.elementInspector._sc_extension.Evt_setIcobjNoMoreInspection]);
      /* mise à jour de la position du panel */
      this.elementInspector._sc_makeCell("updatePanel", null
                                           , [this.elementInspector._sc_extension.Evt_set_xy]);
      this.elementInspector.sc_vis= false;
      this.elementInspector._sc_extension._scc_display= function(val, re){
          if(re.presenceOf(SC.tools.Web.elementInspector._sc_extension.Evt_show)){
            SC.tools.Web.elementInspector.sc_vis= true;
            return "";
            }
          if(re.presenceOf(SC.tools.Web.elementInspector._sc_extension.Evt_hide)){
            SC.tools.Web.elementInspector.sc_vis= false;
            return "none";
            }
          return val;
          };
      SC.toCell({ target: this.elementInspector
               , name: "display"
               , fun: undefined
               , el: [ this.elementInspector._sc_extension.Evt_show
                     , this.elementInspector._sc_extension.Evt_hide ]
               , store: this.elementInspector._sc_extension
               , sub: [ "style" ]
                 }
               );
      /* fonction pour créer des entrées dans l'inspector */
      function pilot(p/*{tr, title, ctrl_kind, lst, help}*/){
        if(undefined==p.title){
          throw new Error('no title provided');
          }
        var tr= p.tr?p.tr:document.createElement("tr");
        tr.innerHTML= "<th>"+p.title+"</th><td></td>";
        var css_control= null;
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
              SC.tools.generateEvent(this.icobjControled._sc_getEvt(p.targetEventName), parseInt(evt.target.value));
              }
            }.bind(SC.tools.Web.elementInspector);
          }
        else{
          css_control.onchange = function(evt){
            if(null != this.icobjControled){
              SC.tools.generateEvent(this.icobjControled._sc_getEvt(p.targetEventName), evt.target.value);
              }
            }.bind(SC.tools.Web.elementInspector);
          }
        SC.tools.Web.elementInspector['scis_'+p.title] = css_control;
        //JFS.inspector["v_"+p.title] = tr.children[1];
        tr.title = (undefined == p.help)?"an icobj css control":p.help;
        //tr.children[2].appendChild(css_control);
        tr.children[1].appendChild(css_control);
        return tr;
        };
      /* on ajout l'inspecteur dans la page */
      this.elementInspector.innerHTML= "<div style='text-align:center;border-bottom:2px solid white;'>"
             +"<img src='images/png/hideBtn.png' style='float:left;width:16px;'/>Element inspector on <em> </em></div>"
             +"<table>"
             +"<tr></t></table>"
      var table= SC.tools.Web.elementInspector.children[1];
      table.style.maxHeight= "50vh";
      table.style.height= "50vh";
      table.style.overflowY= "scroll";
      table.style.display= "inline-block";
      SC.tools.addProgram(
          SC.action(function(re){
            document.body.appendChild(this.elementInspector);
            this.elementInspector.panel_mid= parseInt(window.getComputedStyle(this.elementInspector.children[0]).width)/2;
            this.elementInspector.style.display= "none";
            }.bind(this))
          );
      this.elementInspector._sc_extension.Sens_hideClick= SC.sensor({ name: "hideClickSensor"
                             , dom_targets: [
                                   { target: this.elementInspector.children[0].children[0]
                                   , evt: "click" }
                                   ]
                             });
      this.elementInspector.children[0].children[0].addEventListener("mousedown", function(evt){
        evt.preventDefault();
        });
      this.elementInspector.controlTitle= this.elementInspector.children[0].children[1];
      /* une entrée */
      var tr= table.children[0].children[0];
      pilot({tr: tr
           , ctrl_kind: 1
           , title: "display"
           , lst: [ "", "none", "flex", "block", "inline", "inline-block" ]
           , help: "the css display field"
           , targetEventName: "css_display"});
      var propTable= [
        { ctrl_kind: 1
             , title: "position"
             , lst: [ "", "static", "relative", "absolute", "fixed" ]
             , help: "the css position field"
             , targetEventName: "css_position"
             }
        , { ctrl_kind: 2
             , title: "background"
             , help: "the css background field"
             , targetEventName: "css_background"
             , suggestions: [ "yellow", "pink", "blue", "green", "olive" ]
             }
        , { ctrl_kind: 2
             , title: "left"
             , help: "the css left property"
             , targetEventName: "css_left"
             }
        , {ctrl_kind: 2
             , title: "top"
             , help: "the css top property"
             , targetEventName: "css_top"
             }
        , {ctrl_kind: 2
             , title: "color"
             , help: "the css color property"
             , targetEventName: "css_color"
             }
        , {ctrl_kind: 2
             , title: "opacity"
             , help: "the css opacity property"
             , targetEventName: "css_opacity"
             }
        , {ctrl_kind: 2
             , title: "font"
             , help: "the css font property"
             , targetEventName: "css_font"
             }
        , {ctrl_kind: 2
             , title: "border"
             , help: "the css border property"
             , targetEventName: "css_border"
             }
        , {ctrl_kind: 2
             , title: "borderRadius"
             , help: "the css border-radius property"
             , targetEventName: "css_borderRadius"
             }
        , {ctrl_kind:2
             , title:"width"
             , help: "the css width property"
             , targetEventName:"css_width"
             }
        , {ctrl_kind:2
             , title:"height"
             , help: "css height property"
             , targetEventName:"css_height"
             }
        , {ctrl_kind:2
             , title:"padding"
             , help: "the css padding property"
             , targetEventName:"css_padding"
             }
        , {ctrl_kind:2
             , title:"margin"
             , help: "the css margin property"
             , targetEventName:"css_margin"
             }
        , {ctrl_kind:1
             , title:"boxSizing"
             , lst:["", "intial", "inherit", "content-box", "border-box"]
             , help: "the css box-sizing property"
             , targetEventName:"css_boxSizing"
             }
        , {ctrl_kind:2
             , title:"boxShadow"
             , help: "the css box-shadow property"
             , targetEventName:"css_boxShadow"
             }
        , {ctrl_kind:2
             , title:"filter"
             , help: "the css filter property"
             , targetEventName: this.elementInspector.style.WebkitFilter?"css_WebkitFilter"
                                                                        :"css_filter"
             }
        , {ctrl_kind:2
             , title:"outline"
             , help: "the css outline property"
             , targetEventName:"css_outline"
             }
        , {ctrl_kind:1
             , title:"overflowX"
             , lst:["", "visible", "hidden", "scroll", "auto", "initial", "inherit"]
             , help: "the css overflow-x property"
             , targetEventName:"css_overflowX"
             }
        , {ctrl_kind:1
             , title:"overflowY"
             , lst:["", "visible", "hidden", "scroll", "auto", "initial", "inherit"]
             , help: "the css overflow-y property"
             , targetEventName:"css_overflowY"
             }
        , {ctrl_kind:2
             , title:"zoom"
             , help: "the css zoom property"
             , targetEventName:"css_zoom"
             }
        , {ctrl_kind:2
             , title:"sc_title"
             , help: "the title property"
             , targetEventName:"title"
             }
        , {ctrl_kind:2
             , title:"sc_src"
             , help: "the title property"
             , targetEventName:"src"
             }
        ];
      for(var i in propTable){
        table.children[0].appendChild(pilot(propTable[i]));
        }
      this.elementInspector._sc_extension.Sens_panel_md= SC.sensor({ name: "panel_md"
                             , dom_targets: [
                                   { target: this.elementInspector.children[0]
                                   , evt: "mousedown" }
                                   ]
                             });
      this.elementInspector._sc_extension.Sens_panel_ts= SC.sensor({ name: "panel_ts"
                             , dom_targets: [
                                   { target: this.elementInspector.children[0]
                                   , evt: "touchstart" }
                                   ]
                             });
      this.elementInspector.children[0].addEventListener("mousedown", function(evt){
        evt.preventDefault();
        });
      this.elementInspector.children[0].addEventListener("touchstart", function(evt){
        evt.preventDefault();
        });
      this.elementInspector.onMousePanelMove= function(pos){
        if(pos){
          return { x : pos.clientX, y: pos.clientY };
          }
        }
      this.touchStart = SC.sensor({ name: "touchStart"
                             , dom_targets: [
                                   { target: document
                                   , evt: "touchstart" }
                                   ]
                             });
      this.touchMove = SC.sensor({name:"touchMove"
                             , dom_targets:[
                                   {
                                     target:document
                                   , evt:"touchmove"
                                   }
                                           ]
                             });
      this.touchEnd = SC.sensor({name:"touchEnd"
                             , dom_targets:[
                                   {
                                     target:document
                                   , evt:"touchend"
                                   }
                                           ]
                             });
      this.mmSensor = SC.sensor({name:"mmSensor"
                             , dom_targets:[
                                   {
                                     target:document
                                   , evt:"mousemove"
                                   }
                                           ]
                             });
      this.muSensor = SC.sensor({name:"muSensor"
                             , dom_targets:[
                                   {
                                     target:document
                                   , evt:"mouseup"
                                   }
                                           ]
                             });
      SC.tools.addProgram(SC.par(
          SC.repeat(SC.forever
                  , SC.await(SC.or(this.elementInspector._sc_extension.Sens_panel_md
                                 , this.elementInspector._sc_extension.Sens_panel_ts))
                  , SC.kill(SC.or(this.muSensor, this.touchEnd)
                      , SC.par(
                          SC.filter(this.mmSensor
                              , this.elementInspector._sc_extension.Evt_set_xy
                              , SC._(this.elementInspector , "onMousePanelMove")
                              , SC.forever
                              )
                          , SC.filter(this.touchMove
                              , this.elementInspector._sc_extension.Evt_set_xy
                              , SC._(this.elementInspector, "onMousePanelMove")
                              , SC.forever
                              )
                          )
                      )
                  )
          , SC.repeatForever(
                SC.await(this.elementInspector._sc_extension.Evt_set_xy)
              , this.elementInspector._sc_extension.$_scc_updatePanel
              )
          , SC.repeatForever(
                SC.await(SC.or(this.elementInspector._sc_extension.Evt_show
                            , this.elementInspector._sc_extension.Evt_hide))
              , this.elementInspector._sc_extension.$_scc_display
              )
          , SC.repeatForever(
                SC.await(SC.or(this.elementInspector._sc_extension.Evt_setIcobjUnderInspection
                            , this.elementInspector._sc_extension.Evt_setIcobjNoMoreInspection))
              , this.elementInspector._sc_extension.$_scc_icobjControled
              )
          , SC.repeatForever(
                SC.await(this.elementInspector._sc_extension.Evt_setIcobjUnderInspection)
              , SC.generate(this.elementInspector._sc_extension.Evt_show)
              )
          , SC.repeatForever(
                SC.await(this.elementInspector._sc_extension.Evt_setIcobjNoMoreInspection)
              , SC.generate(this.elementInspector._sc_extension.Evt_hide)
              )
          , SC.repeatForever(
                SC.await(this.elementInspector._sc_extension.Sens_hideClick)
              , SC.generate(this.elementInspector._sc_extension.Evt_hide)
              )
          ));
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
    let SC_energize= function(p){
        var tmp= document.currentScript.previousElementSibling;
        tmp._sc_extension={};
        tmp= finishElement.call(this
        , activateElement(tmp)
        , p
          );
        return tmp;
        }
    Object.defineProperty(SC.tools.Web, "activateElement"
                            , { value: activateElement
                              , writable: false
                                }
                            );
    Object.defineProperty(SC.tools.Web, "energize"
                            , { value: SC_energize
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
