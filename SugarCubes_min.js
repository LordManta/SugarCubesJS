/*
 * SugarCubes.js
 * Author : Jean-Ferdy Susini
 * Created : 2/12/2014 9:23 PM
 * version : 5.0 alpha
 * implantation : 0.9.2
 * Copyright 2014-2018.
 */
;
(function(){
const SC_Instruction_state_str = [
  "undefined !"
  , "SUSP"
  , "WEOI"
  , "OEOI"
  , "STOP"
  , "WAIT"
  , "HALT"
  , "TERM"
  ];
Object.freeze(SC_Instruction_state_str);
const SC_Instruction_State = {
  SUSP:1
  , WEOI:2
  , OEOI:3
  , STOP:4
  , WAIT:5
  , HALT:6
  , TERM:7
  , toString: function(state){
      return SC_Instruction_state_str[state]+":"+state;
      }
  };
Object.freeze(SC_Instruction_State);
function NO_FUN(){}
function SC_CubeBinding(name){
  if((undefined == name)||(typeof(name)!= "string")||(name == "")){
    throw "invalid binding name "+name;
    }
  this.name = name; 
  this.cube = null; 
  this.args = null; 
  }
SC_CubeBinding.prototype = {
  constructor: SC_CubeBinding
  , resolve : function(){
      if(null == this.cube){
        throw "cube is null or undefined !";
        }
      var tgt = this.cube[this.name];
      if(undefined === tgt){
        console.log("target not found");
        return this;
        }
      else if("function" == typeof(tgt)){
        if(null != this.args){
          tgt = tgt.bind(this.cube, this.args);
          }
        else{
          tgt = tgt.bind(this.cube);
          }
        }
      return tgt;
      }
  , setArgs : function(a){
      this.args = a;
      }
  , setCube : function(aCube){
      this.cube = aCube;
      }
  , toString : function(){
      return "@."+this.name+"";
      }
  , clone : function(){
        var copy = new SC_CubeBinding(this.name);
        if(null !== this.args){
          copy.setArgs(this.args);
          }
        return copy;
        }
  };
Object.defineProperty(SC_CubeBinding.prototype, "isBinding"
                          , {enumerable:false
                             , value:true
                             , writable: false
                             }
                          );
function SC_CubeExposedState(cube){
  this.cube = cube;
  };
SC_CubeExposedState.prototype = {
  constructor : SC_CubeExposedState
, exposedState : function(m){
    return this.cube.getExposeReader(m);
    }
, setCube: function(cube){
    this.cube = cube;
    }
  };
var _SC = {
  b_ : function(p){
    if(typeof p == "string"){ 
      var tmp = new SC_CubeBinding(p);
      return tmp;
      }
    return p;
    }
  , b__ : function(p, args){
      if(typeof p == "string"){
        var tmp = new SC_CubeBinding(p);
        tmp.setArgs(args);
        return tmp;
        }
      throw "not a valid binding";
      }
  , _b : function(cube){
      return function(o){
           if(o instanceof SC_CubeBinding){
             o = o.clone();
             o.setCube(this);
             var res = o.resolve();
             return res;
             }
           return o;
           }.bind(cube);
      }
  , bindIt : function(targetAcion){
      if((undefined !== targetAcion.t)
         &&(undefined !== targetAcion.f)){
        var tmp = targetAcion.t[targetAcion.f];
        if((undefined !== tmp)
            &&("function" == typeof(tmp))){
          return tmp.bind(targetAcion.t);
          }
        }
      return targetAcion;
      }
  , isEvent : function(evt){
      if(undefined == evt){
        return false;
        }
      return (evt instanceof SC_EventId)||(evt instanceof SC_SensorId);
      }
  , checkEvent : function(evt){
      if(! this.isEvent(evt)){
        if(/^[a-zA-Z0-9_$]+$/.test(evt)){
            return this.b_(evt);
          }
        throw "evt is an invalid event";
        }
      return evt;
      }
  , isStrictEvent : function(evt){
      if(undefined == evt){
        return false;
        }
      return (evt instanceof SC_EventId)
             ||(evt instanceof SC_CubeBinding);
      }
  , checkStrictEvent : function(evt){
      if(! this.isStrictEvent(evt)){
        if(/^[a-zA-Z0-9_$]+$/.test(evt)){
            return this.b_(evt);
          }
        throw evt+" is an invalid event";
        }
        return evt;
      }
  , isConfig : function(cfg){
      if(undefined == cfg){
        return false;
        }
      return (cfg instanceof SC_Or) || (cfg instanceof SC_OrBin)
             || (cfg instanceof SC_And) || (cfg instanceof SC_AndBin)
             || (cfg instanceof SC_CubeBinding)
             || (cfg instanceof SC_SensorId)
             || this.isEvent(cfg);
      }
  , checkConfig : function(cfg){
      if(! this.isConfig(cfg)){
        if(/^[a-zA-Z0-9_$]+$/.test(cfg)){
            return this.b_(cfg);
          }
        throw cfg+" is an invalid config";
        }
      return cfg;
      }
  , lateBindProperty : function(copy, name, param){
      if(param instanceof SC_CubeBinding){
        delete copy[name];
        Object.defineProperty(copy, name,{get : param.resolve.bind(param.o)});
        }
      else if("function" == typeof param){
        delete copy[name];
        Object.defineProperty(copy, name,{get : param});
        }
      else{
        Object.defineProperty(copy, name,{value: param});
        }
      }
  }
function SC_cubify(params){
  if(undefined == params){
    params = {};
    }
  Object.defineProperty(this, "SC_cubeAddBehaviorEvt"
                          , {enumerable:false
                             , value:((undefined != params.addEvent)?params.addEvent:SC.evt("addBehaviorEvt"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeKillEvt"
                          , {enumerable:false
                             , value:((undefined != params.killEvent)?params.killEvent:SC.evt("killSelf"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeCellifyEvt"
                          , {enumerable:false
                             , value:((undefined != params.cellifyEvent)?params.cellifyEvent:SC.evt("cellifyEvt"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeAddCellEvt"
                          , {enumerable:false
                             , value:((undefined != params.addCellEvent)?params.addCellEvent:SC.evt("addCellEvt"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "$SC_cellMaker"
                           , { enumerable:false
                               , value:SC.cell({init:null, sideEffect: function(val, evts, m){
                                     var cellifyRequests = evts[this.SC_cubeCellifyEvt];
                                     for(var i = 0 ; i < (undefined === cellifyRequests)?0:cellifyRequests.length; i++){
                                       var tmp = cellifyRequests[i];
                                       var nom = tmp.name;
                                       var sub = tmp.sub;
                                       var el = tmp.el;
                                       var fun = tmp.fun;
                                       if(undefined !== this["$"+nom]){
                                          if(undefined !== this["_"+nom]){
                                            console.log("cell already defined");
                                            }
                                          else{
                                            console.log("filed already used on cube");
                                            }
                                          continue;
                                         }
                                       var t = this;
                                       if(Array.isArray(sub)){
                                         for(var i = 0; i < sub.length; i++){
                                           t = t[sub[i]];
                                           }
                                         }
                                       else if (undefined !== sub){
                                         t = this[sub];
                                         }
                                       if(undefined === t){
                                         console.log("no target for cellification");
                                         continue;
                                         }
                                       if(undefined != fun){
                                         this["_"+nom] = fun;
                                         }
                                       if(undefined == this["_"+nom]){
                                         console.log("no affectator for "+nom+" cell");
                                         continue;
                                         }
                                       Object.defineProperty(this
                                                             , "$"+nom
                                                             , {
                                                               value : SC.cell({target:t, field:nom, sideEffect: SC._(this,"_"+nom), eventList: el})
                                                               }
                                                             );
                                       }
                                     cellifyRequests = evts[this.SC_cubeAddCellEvt];
                                     for(var i = 0 ; i < cellifyRequests.length; i++){
                                       var tmp = cellifyRequests[i];
                                       var nom = tmp.name;
                                       var el = tmp.el;
                                       var init = tmp.init;
                                       var fun = tmp.fun;
                                       if(undefined !== this[nom]){
                                         console.log("object property already defined !");
                                         continue;
                                         }
                                       if(undefined !== this["$"+nom]){
                                          if(undefined !== this["_"+nom]){
                                            console.log("cell already defined");
                                            }
                                          else{
                                            console.log("filed already used on cube");
                                            }
                                          continue;
                                         }
                                       if(undefined != fun){
                                         this["_"+nom] = fun;
                                         }
                                       if(undefined == this["_"+nom]){
                                         console.log("no affectator for "+nom+" cell");
                                         continue;
                                         }
                                       Object.defineProperty(this
                                                             , "$"+nom
                                                             , {
                                                               value : SC.cell({init:init, sideEffect: SC._(this,"_"+nom), eventList: el})
                                                               }
                                                             );
                                       Object.defineProperty(this, nom,{get : (function(nom){
                                             return this["$"+nom].val();
                                           }).bind(this, nom)});
                                       }
                                     }.bind(this)
                                 , eventList: [this.SC_cubeCellifyEvt, this.SC_cubeAddCellEvt]})
                               , writable: false
                               }
                             );
  if(params.sci){
    params.sci.call(this);
    }
  };
const VOID_VALUES=[];
Object.freeze(VOID_VALUES);
var nextEventID = 0;
function SC_EventId(params){
  this.makeNew = params.makeNew;
  this.distribute = params.distribute;
  this.registeredMachines = {};
  Object.defineProperty(this, "internalId"
         , {value: nextEventID++, writable:false});
  Object.defineProperty(this, "name"
         , {value: "&_"+this.internalId+"_"+params.name, writable:false});
  };
SC_EventId.prototype ={
  constructor: SC_EventId
, isSensor:false
, getId: function(){
    return this.internalId;
    }
, toString: function(){
    return this.name;
    }
, getName: function(){
    return this.name;
    }
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    if(!this.registeredMachines[engine.id]){
      this.registeredMachines[engine.id] = engine.getEvent(this);
      }
    return this.registeredMachines[engine.id];
    }
  };
function SC_Event(id, m){
  this.lein = -1; 
  this.name = id.name; 
  this.eventId = id;
  if(
    (undefined != id.makeNew)
    && (undefined != id.distribute)
    ){
    return new SC_EventDistributed(id);
    }
  this.vals = [];
  this.permanentGenerators = [];
  this.permanentValuatedGenerator = 0;
  this.registeredInst = [];  
  this.m = null; 
  };
SC_Event.prototype = {
  constructor : SC_Event
, isPresent : function(m){
    return this.lein == m.instantNumber;
    }
, wakeupAll : function(m, flag){
    for(var inst of this.registeredInst){
      inst.wakeup(m, flag);
      }
    }
, generateInput : function(m, val){
    if(this.lein != m.instantNumber){
      this.lein = m.instantNumber;
      this.vals = [];
      this.wakeupAll(m, true);
      if(undefined != val){
        Object.defineProperty(m.generated_values
             , this.toString()
             , {get : function(){return this.vals; }.bind(this)});
        }
      }
    this.vals.push(val);
    }
, generate : function(m, flag){
    if(this.lein != m.instantNumber){
      this.lein = m.instantNumber;
      this.vals = [];
      this.wakeupAll(m, false);
      if(flag){
        Object.defineProperty(m.generated_values
             , this.toString()
             , {get : function(){return this.vals; }.bind(this)});
        }
      }
    }
, generateValues : function(m, val){
    this.vals.push(val);
    }
, unregister : function(i){
    var t = this.registeredInst.indexOf(i);
    if(t > -1){
      this.registeredInst.splice(t,1);
      }
    }
, registerInst : function(m, inst){
    this.registeredInst.push(inst);
    }
, getValues : function(m){
    if(this.lein != m.instantNumber){
      this.vals = [];
      }
    return this.vals;
    }
, getAllValues : function(m, vals){
    vals[this.eventId] = (this.lein == m.instantNumber)?this.vals:VOID_VALUES;
    }
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
    if(null == this.m){
      this.m = engine;
      }
    else if(this.m !== engine){
      throw 'bound event ('+this.name+') problem';
      }
    return this;
    }
, toString : function(){
    return this.eventId.name;
    }
  };
function SC_EventDistributed(id){
  this.lein = -1; 
  this.name = id.name; 
  this.eventId = id;  
  this.makeNew = id.makeNew;
  this.distribute = id.distribute;
  this.vals = this.makeNew();
  this.permanentGenerators = [];
  this.permanentValuatedGenerator = 0;
  this.registeredInst = [];  
  this.m = null; 
  this.internalID = nextEventID++;
  };
SC_EventDistributed.prototype = {
  constructor: SC_EventDistributed
, generateInput : function(m, val){
    if(this.lein != m.instantNumber){
      this.lein = m.instantNumber;
      this.vals = this.makeNew();
      this.wakeupAll(m, true);
      if(undefined != val){
        Object.defineProperty(m.generated_values
             , this.toString()
             , {get : function(){return this.vals; }.bind(this)});
        }
      }
    this.distribute(this.vals, val);
    }
, generate : function(m, flag){
    if(this.lein != m.instantNumber){
      this.lein = m.instantNumber;
      this.vals = this.makeNew();
      this.wakeupAll(m, false);
      if(flag){
        Object.defineProperty(m.generated_values
             , this.toString()
             , {get : function(){return this.vals; }.bind(this)});
        }
      }
    }
, generateValues : function(m, val){
    this.distribute(this.vals, val);
    }
, getValues : function(m){
    if(this.lein != m.instantNumber){
      this.vals = this.makeNew();
      }
    return this.vals;
    }
, __proto__ : SC_Event.prototype
  };
const SC_registeredMachines = [];
const SC_updateSensor = function(sensorId){
  for(var machine of SC_registeredMachines){
    if(!machine.ended){
      machine.sampleSensor(sensorId);
      }
    }
  };
function SC_SensorId(params){
  Object.defineProperty(this, "internalId"
         , {value: nextEventID++, writable:false});
  Object.defineProperty(this, "name"
         , {value: "#_"+this.internalId+"_"+params.name, writable:false});
  this.currentVal = null;
  Object.defineProperty(this, "dom_evt_listener"
         , {value: function(evt){
            this.newValue(evt);
            }.bind(this), writable:false});
  this.dom_targets = params.dom_targets;
  if(params.owned){
    this.setOwn(params);
    }
  else{
    if(this.dom_targets){
      for(var t of this.dom_targets){
        t.target.addEventListener(t.evt, this.dom_evt_listener);
        }
      }
    }
  };
SC_SensorId.prototype ={
  constructor: SC_SensorId
, isSensor:true
, setOwn: function(params){
    if(undefined == params){
      params = {};
      }
    if(undefined == params.name){
      params.name = this.name;
      }
    const ownMachine = new SC_Machine({
                                   name: params.name
                                 , init: params.init
                                 , sensorId: this
                                   });
    this.getIPS = ownMachine.getIPS.bind(ownMachine);
    this.getInstantNumber = ownMachine.getInstantNumber.bind(ownMachine);
    this.getTopLevelParallelBranchesNumber
             = ownMachine.getTopLevelParallelBranchesNumber.bind(ownMachine);
    this.setStdOut = ownMachine.setStdOut.bind(ownMachine);
    this.enablePrompt = ownMachine.enablePrompt.bind(ownMachine);
    if("function" == typeof(params.dumpTraceFun)){
      ownMachine.dumpTraceFun = params.dumpTraceFun;
      }
    this.addToOwnEntry = function(evtName, value){
      if(evtName instanceof SC_EventId){
        this.addEntry(evtName, value);
        }
      else{
        throw new Error("invalid event Id : "+evtName);
        }
      }.bind(ownMachine);
    this.addToOwnProgram = function(prg){
      if(prg.isAnSCProgram){
        this.addProgram(prg);
        }
      else{
        throw new Error("invalid program : "+prg);
        }
      }.bind(ownMachine);
    const reactMultiple = function(ownMachine){
      do{
        ownMachine.react();
        }
      while(ownMachine.toContinue);
      };
    if(!isNaN(params.delay) && params.delay > 0){
      ownMachine.delay = params.delay;
      ownMachine.timer_handler = function(ownMachine){
                                 this.currentVal = performance.now();
                                 SC_updateSensor(this);
                                 reactMultiple(ownMachine);
                               }.bind(this, ownMachine);
      ownMachine.timer = setInterval(ownMachine.timer_handler, params.delay);
      this.setKeepRunningTo = function(b){
        if(this.timer != 0){
          if(b){
            return;
            }
          clearInterval(this.timer);
          this.timer = 0;
          }
        else{
          if(b){
            this.timer = setInterval(this.timer_handler, this.delay);
            }
          }
        }.bind(ownMachine);
      }
    if(params.sc_RAF){
      if(undefined == ownMachine.lFunc_raf){
        ownMachine.raf_registered = true;
        ownMachine.lFunc_raf = function(ownMachine){
          this.currentVal = performance.now();
          SC_updateSensor(this);
          reactMultiple(ownMachine);
          if(!ownMachine.ended && ownMachine.raf_registered){
            requestAnimationFrame(ownMachine.lFunc_raf);
            }
          }.bind(this, ownMachine);
        requestAnimationFrame(ownMachine.lFunc_raf);
        }
      }
    if(params.dom_targets){
      ownMachine.lFunc_handlers= [];
      for(tgt of params.dom_targets){
        const lFunc_handler = function(ownMachine, lFunc_h, evt) {
          this.currentVal = evt;
          SC_updateSensor(this);            
          reactMultiple(ownMachine);
          if(ownMachine.ended){
            tgt.target.removeEventListener(tgt.evt, lFunc_h)
            }
          }.bind(this, ownMachine);
        const bdh = lFunc_handler.bind(null, lFunc_handler);
        ownMachine.lFunc_handlers.push({tgt: tgt.target, fun:bdh});
        tgt.target.addEventListener(tgt.evt, bdh);
        }
      }
    if(!params.no_manual_control){
      this.newValue = function(ownMachine, value){
        this.currentVal = value;
        SC_updateSensor(this);
        reactMultiple(ownMachine);
        }.bind(this, ownMachine);
      }
    else{
      this.newValue = NO_FUN;
      }
    }
, getId: function(){
    return this.internalId;
    }
, toString: function(){
    return this.name;
    }
, getName: function(){
    return this.name;
    }
, getValue: function(){
    return this.currentVal;
    }
, getIPS: function(){ return 0; }
, getInstantNumber: function(){ return 0; }
, getTopLevelParallelBranchesNumber:  function(){ return 0; }
, postpone: function(delay){
    setTimeout(this.newValue.bind(this), delay);
    }
, enablePrompt: NO_FUN
, setStdOut: NO_FUN
, setKeepRunningTo: NO_FUN
, newValue: function(value){
    this.currentVal = value;
    SC_updateSensor(this);
    }
, addToOwnEntry: NO_FUN
, addToOwnProgram: NO_FUN
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    var sens = engine.getSensor(this);
    return sens;
    }
  };
function SC_Sensor(params){
  this.lein = -1;
  this.sensId = params;
  this.vals = []; 
  this.registeredInst = [];
  };
SC_Sensor.prototype = {
  constructor : SC_Sensor
, isPresent : SC_Event.prototype.isPresent
, wakeupAll : SC_Event.prototype.wakeupAll
, generateValues : NO_FUN
, systemGen : function(val, m, flag){
    if(this.lein != m.instantNumber){
      this.lein = m.instantNumber;
      this.wakeupAll(m, flag);
      this.vals = [];
      if(undefined != this.sensId.getValue()){
        Object.defineProperty(m.generated_values
             , this.sensId.toString()
             , {get : function(){return this.vals; }.bind(this)});
        }
      this.vals.push(this.sensId.getValue());
      }
    }
, unregister : SC_Event.prototype.unregister
, registerInst : SC_Event.prototype.registerInst
, getValues : SC_Event.prototype.getValues
, getAllValues : function(m, vals){
    vals[this.sensId] = (this.lein == m.instantNumber)?this.vals:VOID_VALUES;
    }
, toString : function(){
    return this.sensId.getName();
    }
  };
const SC_OpcodesNames = [
  "NOP"
  , "_EXIT"
  , "REL_JUMP"
  , "REPEAT_N_TIMES_INIT"
  , "REPEAT_N_TIMES_BUT_FOREVER"
  , "REPEAT_N_TIMES_BUT_FOREVER_TO_STOP"
  , "REPEAT_N_TIMES"
  , "REPEAT_N_TIMES_TO_STOP"
  , "REPEAT_FOREVER"
  , "REPEAT_FOREVER_TO_STOP"
  , "IF_REPEAT_INIT"
  , "IF_REPEAT"
  , "IF_REPEAT_TO_STOP"
  , "ACTION_INLINE"
  , "ACTION"
  , "ACTION_N_TIMES_INIT_INLINE"
  , "ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT"
  , "ACTION_N_TIMES_INLINE_BUT_FOREVER"
  , "ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED"
  , "ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED"
  , "ACTION_N_TIMES_INLINE"
  , "ACTION_N_TIMES_INIT"
  , "ACTION_N_TIMES_BUT_FOREVER_INIT"
  , "ACTION_N_TIMES_BUT_FOREVER_CONTROLED"
  , "ACTION_N_TIMES_BUT_FOREVER_HALTED"
  , "ACTION_N_TIMES_BUT_FOREVER"
  , "ACTION_N_TIMES"
  , "ACTION_FOREVER_INIT"
  , "ACTION_FOREVER"
  , "ACTION_FOREVER_HALTED"
  , "ACTION_FOREVER_CONTROLED"
  , "SEQ_INIT"
  , "SEQ"
  , "SEQ_BACK"
  , "SEQ_ENDED"
  , "HALT"
  , "PAUSE_INLINE"
  , "PAUSE"
  , "PAUSE_DONE"
  , "PAUSE_N_TIMES_INIT_INLINE"
  , "PAUSE_N_TIMES_INLINE"
  , "PAUSE_N_TIMES_INIT"
  , "PAUSE_N_TIMES"
  , "PAUSE_UNTIL_INIT"
  , "PAUSE_UNTIL"
  , "PAUSE_UNTIL_DONE"
  , "PAUSE_N_TIMES"
  , "NOTHING_INLINED"
  , "NOTHING"
  , "NEXT_INLINED"
  , "NEXT"
  , "GENERATE_ONE_NO_VAL_INLINE"
  , "GENERATE_ONE_NO_VAL"
  , "GENERATE_ONE_INLINE"
  , "GENERATE_ONE_FUN_INLINE"
  , "GENERATE_ONE_CELL_INLINE"
  , "GENERATE_ONE_EXPOSE_INLINE"
  , "GENERATE_ONE"
  , "GENERATE_ONE_FUN"
  , "GENERATE_ONE_CELL"
  , "GENERATE_ONE_EXPOSE"
  , "GENERATE_FOREVER_NO_VAL_INIT"
  , "GENERATE_FOREVER_NO_VAL_CONTROLED"
  , "GENERATE_FOREVER_NO_VAL_HALTED"
  , "GENERATE_FOREVER_NO_VAL"
  , "GENERATE_FOREVER_INIT"
  , "GENERATE_FOREVER_FUN_INIT"
  , "GENERATE_FOREVER_CELL_INIT"
  , "GENERATE_FOREVER_EXPOSE_INIT"
  , "GENERATE_FOREVER_CONTROLED"
  , "GENERATE_FOREVER_FUN_CONTROLED"
  , "GENERATE_FOREVER_CELL_CONTROLED"
  , "GENERATE_FOREVER_EXPOSE_CONTROLED"
  , "GENERATE_FOREVER_HALTED"
  , "GENERATE_FOREVER_FUN_HALTED"
  , "GENERATE_FOREVER_CELL_HALTED"
  , "GENERATE_FOREVER_EXPOSE_HALTED"
  , "GENERATE_FOREVER"
  , "GENERATE_FOREVER_FUN"
  , "GENERATE_FOREVER_CELL"
  , "GENERATE_FOREVER_EXPOSE"
  , "GENERATE_CELL_INLINE_BUT_FOREVER_INIT"
  , "GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED"
  , "GENERATE_CELL_INLINE_BUT_FOREVER_HALTED"
  , "GENERATE_CELL_INLINE_BUT_FOREVER"
  , "GENERATE_CELL_INIT_INLINE"
  , "GENERATE_FUN_INLINE_BUT_FOREVER_INIT"
  , "GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED"
  , "GENERATE_FUN_INLINE_BUT_FOREVER_HALTED"
  , "GENERATE_FUN_INLINE_BUT_FOREVER"
  , "GENERATE_FUN_INIT_INLINE"
  , "GENERATE_EXPOSE_INLINE_BUT_FOREVER_INIT"
  , "GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED"
  , "GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED"
  , "GENERATE_EXPOSE_INLINE_BUT_FOREVER"
  , "GENERATE_EXPOSE_INIT_INLINE"
  , "GENERATE_INLINE_BUT_FOREVER_INIT"
  , "GENERATE_INLINE_BUT_FOREVER_CONTROLED"
  , "GENERATE_INLINE_BUT_FOREVER_HALTED"
  , "GENERATE_INLINE_BUT_FOREVER"
  , "GENERATE_INIT_INLINE"
  , "GENERATE_CELL_INIT_INLINE"
  , "GENERATE_FUN_INLINE"
  , "GENERATE_EXPOSE_INLINE"
  , "GENERATE_INLINE"
  , "GENERATE_CELL_BUT_FOREVER_INIT"
  , "GENERATE_CELL_BUT_FOREVER_CONTROLED"
  , "GENERATE_CELL_BUT_FOREVER_HALTED"
  , "GENERATE_CELL_BUT_FOREVER"
  , "GENERATE_FUN_BUT_FOREVER_INIT"
  , "GENERATE_FUN_BUT_FOREVER_CONTROLED"
  , "GENERATE_FUN_BUT_FOREVER_HALTED"
  , "GENERATE_FUN_BUT_FOREVER"
  , "GENERATE_EXPOSE_BUT_FOREVER_INIT"
  , "GENERATE_EXPOSE_BUT_FOREVER_CONTROLED"
  , "GENERATE_EXPOSE_BUT_FOREVER_HALTED"
  , "GENERATE_EXPOSE_BUT_FOREVER"
  , "GENERATE_BUT_FOREVER_INIT"
  , "GENERATE_BUT_FOREVER_CONTROLED"
  , "GENERATE_BUT_FOREVER_HALTED"
  , "GENERATE_BUT_FOREVER"
  , "GENERATE_FUN_INIT"
  , "GENERATE_CELL_INIT"
  , "GENERATE_EXPOSE_INIT"
  , "GENERATE_INIT"
  , "GENERATE_FUN"
  , "GENERATE_CELL"
  , "GENERATE_EXPOSE"
  , "GENERATE"
  , "GENERATE_NO_VAL_INIT"
  , "GENERATE_NO_VAL"
  , "GENERATE_NO_VAL_INIT_INLINE"
  , "GENERATE_NO_VAL_INLINE"
  , "AWAIT_INLINE"
  , "AWAIT_REGISTRED_INLINE"
  , "AWAIT"
  , "AWAIT_REGISTRED"
  , "WHEN"
  , "WHEN_REGISTERED"
  , "KILL_SUSP_INIT"
  , "KILL_SUSP"
  , "KILL_SUSP_REGISTERED"
  , "KILL_BACK"
  , "KILL_WEOI"
  , "KILL_OEOI"
  , "KILL_STOP"
  , "KILL_WAIT"
  , "KILL_HALT"
  , "KILLED"
  , "CONTROL_INIT"
  , "CONTROL"
  , "CONTROL_REGISTERED_CHECK"
  , "CONTROL_REGISTERED_SUSP"
  , "CONTROL_REGISTERED_BACK"
  , "CONTROL_REGISTERED_EOI"
  , "CONTROL_REGISTERED_HALT"
  , "TEST"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT_HALTED"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP"
  , "ACTION_ON_EVENT_FOREVER"
  , "ACTION_ON_EVENT_FOREVER_HALTED"
  , "ACTION_ON_EVENT_FOREVER_REGISTERED"
  , "ACTION_ON_EVENT_FOREVER_STOP"
  , "ACTION_ON_EVENT"
  , "ACTION_ON_EVENT_REGISTERED"
  , "ACTION_ON_EVENT_STOP"
  , "ACTION_ON_EVENT_NO_DEFAULT"
  , "ACTION_ON_EVENT_NO_DEFAULT_REGISTERED"
  , "ACTION_ON_EVENT_NO_DEFAULT_STOP"
  , "SIMPLE_ACTION_ON_EVENT_NO_DEFAULT"
  , "SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED"
  , "SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED"
  , "SIMPLE_ACTION_ON_EVENT"
  , "SIMPLE_ACTION_ON_EVENT_REGISTERED"
  , "SIMPLE_ACTION_ON_EVENT_ENDED"
  , "GENERATE_FOREVER_LATE_EVT_NO_VAL"
  , "GENERATE_FOREVER_LATE_EVT_NO_VAL_RESOLVED"
  , "GENERATE_FOREVER_LATE_VAL"
  , "FILTER_FOREVER_NO_ABS"
  , "FILTER_FOREVER_NO_ABS_REGISTERED"
  , "FILTER_FOREVER"
  , "FILTER_ONE"
  , "FILTER_ONE_NO_ABS"
  , "FILTER"
  , "FILTER_NO_ABS_INIT"
  , "FILTER_NO_ABS"
  , "SEND"
  , "SEND_ONE"
  , "SEND_FOREVER"
  , "PAR_DYN_INIT"
  , "PAR_DYN_TO_REGISTER"
  , "PAR_DYN"
  , "PAR_DYN_FIRE"
  , "PAR_DYN_BACK"
  , "PAR_DYN_FORCE"
  , "PAR_INIT"
  , "PAR"
  , "PAR_FIRE"
  , "PAR_BACK"
  , "PAR_FORCE"
  , "PAUSE_RT_INIT"
  , "PAUSE_RT"
  , "MATCH_INIT"
  , "MATCH"
  , "MATCH_CHOOSEN"
  , "MATCH_BACK"
  , "CUBE_ZERO"
  , "CUBE_INIT"
  , "CUBE"
  , "CUBE_BACK"
  , "CELL"
  , "RE_CELL"
  , "CUBE_CELL_INIT"
  , "CUBE_CELL"
  , "CUBE_CELL_BACK"
  , "CUBE_ACTION_INLINE"
  , "CUBE_ACTION"
  , "CUBE_ACTION_N_TIMES_INIT_INLINE"
  , "CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT"
  , "CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER"
  , "CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED"
  , "CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED"
  , "CUBE_ACTION_N_TIMES_INLINE"
  , "CUBE_ACTION_N_TIMES_INIT"
  , "CUBE_ACTION_N_TIMES_BUT_FOREVER_INIT"
  , "CUBE_ACTION_N_TIMES_BUT_FOREVER_CONTROLED"
  , "CUBE_ACTION_N_TIMES_BUT_FOREVER_HALTED"
  , "CUBE_ACTION_N_TIMES_BUT_FOREVER"
  , "CUBE_ACTION_N_TIMES"
  , "CUBE_ACTION_FOREVER_INIT"
  , "CUBE_ACTION_FOREVER"
  , "CUBE_ACTION_FOREVER_HALTED"
  , "CUBE_ACTION_FOREVER_CONTROLED"
  , "PAR_BRANCH"
  , "LOG"
  ];
Object.freeze(SC_OpcodesNames);
const SC_Opcodes = {
  toString: function(oc){
    return SC_OpcodesNames[oc]+":"+oc;
    }
  , isValid(oc){
    return (oc < this.nb_of_instructions && oc > 0);
    }
  };
for(var n = 0; n < SC_OpcodesNames.length; n++){
  SC_Opcodes[SC_OpcodesNames[n]] = n;
  }
SC_Opcodes.nb_of_instructions = SC_OpcodesNames.length;
Object.freeze(SC_Opcodes);
function SC_Instruction(opcode){
  this.oc = SC_Opcodes.NOP;
  if(SC_Opcodes.isValid(opcode)){
    this.oc = opcode;
    }
  this.caller = null;
  this.seq = null;
  this.resetCaller = null;
  }
const act_exit = new SC_Instruction(SC_Opcodes._EXIT);
SC_Instruction.prototype = {
  constructor : SC_Instruction
  , tr : function (m, meth, msg, msg2){
      console.log(
        m.instantNumber
        , meth
        , SC_Opcodes.toString(this.oc)
        , (undefined === msg)?"":msg
        , (undefined === msg2)?"":msg2
        );
      }
  , awake : function(m, flag, toEOI){
      switch(this.oc){
        case SC_Opcodes.SEQ_BACK:
        case SC_Opcodes.SEQ:{
          return this.path.awake(m, flag, toEOI);
          }
        case SC_Opcodes.KILL_SUSP_REGISTERED:
        case SC_Opcodes.KILL_BACK:{
          this.path.awake(m, flag, toEOI);
          return true;
          }
        case SC_Opcodes.KILL_WAIT:
        case SC_Opcodes.KILL_WEOI:{
          this.path.awake(m, flag, toEOI);
          this.oc = SC_Opcodes.KILL_SUSP_REGISTERED;
          return true;
          }
        case SC_Opcodes.CONTROL_REGISTERED_CHECK:
        case SC_Opcodes.CONTROL_REGISTERED_EOI:
        case SC_Opcodes.CONTROL_REGISTERED_SUSP:{
          if(this.c.isPresent(m)){
            var res = this.path.awake(m, flag, toEOI);
            if(res){
              this.oc = SC_Opcodes.CONTROL_REGISTERED_SUSP;
              }
            return res;
            }
          return true;
          }
        case SC_Opcodes.CUBE:{
          return this.path.awake(m, flag, toEOI);
          }
        case SC_Opcodes.CONTROL_REGISTERED_BACK:{
          if(this.c.isPresent(m)){
            return this.path.awake(m, flag, toEOI);
            }
          return true;
          }
        case SC_Opcodes.PAR_DYN_BACK:
        case SC_Opcodes.PAR_DYN:
        case SC_Opcodes.PAR_BACK:
        case SC_Opcodes.PAR:{
          if(null != this.path){
            return this.path.awake(m, flag, toEOI);
            }
          return true;
          }
        case SC_Opcodes.MATCH_CHOOSEN:{
          return this.path.awake(m, flag, toEOI);
          }
        case SC_Opcodes.PAR_BRANCH:{
          var res = false;
          if(SC_Instruction_State.SUSP == this.flag){
            return true;
            }
          if((SC_Instruction_State.WEOI != this.flag)
            &&(SC_Instruction_State.WAIT != this.flag)){
            throw "pb awaiking par branch "
                   +SC_Instruction_State.toString(this.flag)+" !"
            console.trace();
            return false;
            }
          res = this.path.awake(m, flag, toEOI);
          if(toEOI && (SC_Instruction_State.WEOI == this.flag)){
            return res;
            }
          if(res){
            ((SC_Instruction_State.WEOI == this.flag)
                          ?this.itsPar.waittingEOI
                          :this.itsPar.waitting).remove(this);
            ((toEOI)?this.itsPar.waittingEOI
                    :this.itsPar.suspended).append(this);
            this.flag = (toEOI)?SC_Instruction_State.WEOI
                               :SC_Instruction_State.SUSP;
            }
          return res;
          }
        default:{ throw "awake undefined opcode "
                       +SC_Opcodes.toString(this.oc);
          console.trace();
          }
        }
      }
  , wakeup : function(m, flag){
      switch(this.oc){
        case SC_Opcodes.AWAIT_REGISTRED_INLINE:{
          if(this.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.AWAIT_REGISTRED:{
          if(this.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.WHEN_REGISTERED:{
          return this.path.awake(m, flag);
          }
        case SC_Opcodes.CONTROL_REGISTERED_CHECK:
        case SC_Opcodes.CONTROL_REGISTERED_EOI:
        case SC_Opcodes.CONTROL_REGISTERED_HALT:
        case SC_Opcodes.CONTROL_REGISTERED_BACK:
        case SC_Opcodes.CONTROL_REGISTERED_SUSP:{
          this.awake(m, flag);
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP:{
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_STOP:{
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_STOP:{
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_REGISTERED:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_STOP:{
          return false;
          }
        case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED:{
          return false;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_REGISTERED:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case SC_Opcodes.KILL_HALT:
        case SC_Opcodes.KILL_WAIT:{
          if(this.c.isPresent(m)){
            return this.path.awake(m, flag, true);
            }
          }
        case SC_Opcodes.KILL_WEOI:
        case SC_Opcodes.KILL_OEOI:
        case SC_Opcodes.KILL_STOP:
        case SC_Opcodes.KILL_SUSP_REGISTERED:
        case SC_Opcodes.KILL_BACK:{
          return false;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_ENDED:{
          return false;
          }
        case SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED:{
          }
        case SC_Opcodes.FILTER_NO_ABS:{
          return this.path.awake(m, flag);
          }
        case SC_Opcodes.PAR_DYN_BACK:
        case SC_Opcodes.PAR_DYN:{
          if(this.channel.isPresent(m)){
            const res =  this.path.awake(m, flag, true);
            return res;
            }
          return false;
          }
        default:{ throw "wakeup undefined opcode "
                       +SC_Opcodes.toString(this.oc);
          console.trace();
          }
        }
      }
  , computeAndAdd : function(m){
      switch(this.oc){
        case SC_Opcodes.PAR_DYN:{
          const prgs = this.channel.getValues(m);
          const pl = prgs.length;
          for(var i = 0 ; i < pl; i++){
            this.addBranch(prgs[i], this.itsParent, m);
            }
          break;
          }
        default: throw "computeAndAdd undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
  }
, addBranch : function(p, pb, engine){
    switch(this.oc){
      case SC_Opcodes.PAR_DYN_TO_REGISTER:
      case SC_Opcodes.PAR_INIT:
      case SC_Opcodes.PAR_DYN:
      case SC_Opcodes.PAR:{
        if(p instanceof SC_Par){
          for(var n = 0 ; n < p.branches.length; n ++){
            this.addBranch(p.branches[n].prg, pb, engine);
            }
        }
      else{
        var b = new SC_ParBranch(pb, this, SC_Nothing);
        b.prg = p.bindTo(engine, b, null, this.mseq, b, this.cube, this.cinst);
        b.path = this;
        b.purgeable = true;
        this.branches.push(b);
        this.suspended.append(b);
        if(b.hasPotential){
          if(undefined != b.itsParent){
            if(!b.itsParent.hasPotential){
              throw "Here we are, invalid registration of potential emmiters";
              }
            }
          if(b.idxInProd<0){
            b.idxInProd = this.registerInProdBranch(b);
            }
          }
        }
        break;
        }
      default: throw "addBranch undefined for opcode "
                       +SC_Opcodes.toString(this.oc);
      }
    }
  , registerInProdBranch : function(pb){
      switch(this.oc){
        case SC_Opcodes.PAR_DYN_INIT:
        case SC_Opcodes.PAR_DYN_TO_REGISTER:
        case SC_Opcodes.PAR_DYN_BACK:
        case SC_Opcodes.PAR_DYN:
        case SC_Opcodes.PAR_INIT:
        case SC_Opcodes.PAR_BACK:
        case SC_Opcodes.PAR:{
          var res = this.prodBranches.length;
          this.prodBranches.push(pb);
          return res;
          }
        default: throw "registerInProdBranch undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , unregisterFromProduction : function(b){
      switch(this.oc){
        case SC_Opcodes.PAR_DYN_BACK:
        case SC_Opcodes.PAR_DYN:
        case SC_Opcodes.PAR_BACK:
        case SC_Opcodes.PAR:{
          break;
          }
        case SC_Opcodes.PAR_BRANCH:{
          var t = this.permanentEmitters.indexOf(b);
          if(t > -1){
            this.permanentEmitters.splice(t,1);
            }
          if(null != this.itsParent){
            this.itsParent.unregisterFromProduction(this.itsPar);
            }
          else{
            this.itsPar.unregisterFromProduction(this);
            }
          break;
          }
        default: throw "unregisterFromProduction undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , registerForProduction : function(b, perma){
      if(perma){
        if(this.permanentEmitters.indexOf(b) < 0){
          this.permanentEmitters.push(b);
          }
        }
      if(this.emitters.indexOf(b) < 0){
        this.emitters.push(b);
        }
      if(null != this.itsParent){
        this.itsParent.registerForProduction(this.itsPar, perma);
        }
      }
  , removeBranch : function(elt){
      switch(this.oc){
        case SC_Opcodes.PAR_FIRE:
        case SC_Opcodes.PAR_DYN_FIRE:
        case SC_Opcodes.PAR_BACK:
        case SC_Opcodes.PAR_DYN_BACK:{
          var i = this.branches.indexOf(elt);
          this.branches.splice(i,1);
          break;
          }
        default: throw "removeBranch undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , val : function(){
      return this.state;
      }
  , prepare : function(m){
      var vals = {};
      for(var i in this.eventList){
        const evt = m.getEvent(this.eventList[i]);
        if(evt.isPresent(m)){
          evt.getAllValues(m, vals);
          }
        }
      this.futur = this.sideEffect(this.state, vals, m);
      }
  , swap : function(){
      this.state = this.futur;
      }
  , generateValues : function(m){
      switch(this.oc){
        case SC_Opcodes.GENERATE_INIT:
        case SC_Opcodes.GENERATE:
        case SC_Opcodes.GENERATE_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_INIT_INLINE:
        case SC_Opcodes.GENERATE_INLINE:
        case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_ONE_INLINE:
        case SC_Opcodes.GENERATE_ONE:
        case SC_Opcodes.GENERATE_FOREVER_INIT:
        case SC_Opcodes.GENERATE_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_FOREVER_CONTROLED:{
          this.evt.generateValues(m, this.val);
          break;
          }
        case SC_Opcodes.GENERATE_CELL_INIT:
        case SC_Opcodes.GENERATE_CELL:
        case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_CELL_INIT_INLINE:
        case SC_Opcodes.GENERATE_CELL_INLINE:
        case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_ONE_CELL_INLINE:
        case SC_Opcodes.GENERATE_ONE_CELL:
        case SC_Opcodes.GENERATE_FOREVER_CELL_INIT:
        case SC_Opcodes.GENERATE_FOREVER_CELL_HALTED:
        case SC_Opcodes.GENERATE_FOREVER_CELL_CONTROLED:{
          this.evt.generateValues(m, this.val.val());
          break;
          }
        case SC_Opcodes.GENERATE_FUN_INIT:
        case SC_Opcodes.GENERATE_FUN:
        case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_FUN_INIT_INLINE:
        case SC_Opcodes.GENERATE_FUN_INLINE:
        case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_ONE_FUN_INLINE:
        case SC_Opcodes.GENERATE_ONE_FUN:
        case SC_Opcodes.GENERATE_FOREVER_FUN_INIT:
        case SC_Opcodes.GENERATE_FOREVER_FUN_HALTED:
        case SC_Opcodes.GENERATE_FOREVER_FUN_CONTROLED:{
          this.evt.generateValues(m, this.val(m));
          break;
          }
        case SC_Opcodes.GENERATE_EXPOSE_INIT:
        case SC_Opcodes.GENERATE_EXPOSE:
        case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_EXPOSE_INIT_INLINE:
        case SC_Opcodes.GENERATE_EXPOSE_INLINE:
        case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED:
        case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.GENERATE_ONE_EXPOSE_INLINE:
        case SC_Opcodes.GENERATE_ONE_EXPOSE:
        case SC_Opcodes.GENERATE_FOREVER_EXPOSE_INIT:
        case SC_Opcodes.GENERATE_FOREVER_EXPOSE_HALTED:
        case SC_Opcodes.GENERATE_FOREVER_EXPOSE_CONTROLED:{
          this.evt.generateValues(m, this.val.getExposeReader(m));
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_LATE_VAL:{
          if(this.val instanceof SC_CubeBinding){
            var res = this.val.resolve();
            }
          if(this.val instanceof SC_Instruction
              && this.val.oc == SC_Opcodes.CELL){
            this.evt.generateValues(m, this.val.val());
            }
          else if("function" == typeof(this.val)){
            this.evt.generateValues(m, this.val(m));
            }
          else if(this.val instanceof SC_CubeExposedState){
            this.evt.generateValues(m, this.val.exposedState(m));
            }
          else{
            this.evt.generateValues(m, this.val);
            }
          break;
          }
        case SC_Opcodes.FILTER_FOREVER_NO_ABS:
        case SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED:
        case SC_Opcodes.FILTER_FOREVER:
        case SC_Opcodes.FILTER_NO_ABS:
        case SC_Opcodes.FILTER_NO_ABS_INIT:
        case SC_Opcodes.FILTER:
        case SC_Opcodes.FILTER_ONE:
        case SC_Opcodes.FILTER_ONE_NO_ABS:{
          if(this.val instanceof SC_CubeBinding){
            var res = this.val.resolve();
            }
          if(this.val instanceof SC_Instruction
              && this.val.oc == SC_Opcodes.CELL){
            this.evt.generateValues(m, this.val.val());
            }
          else if("function" == typeof(this.val)){
            this.evt.generateValues(m, this.val(m));
            }
          else if(this.val instanceof SC_CubeExposedState){
            this.evt.generateValues(m, this.val.exposedState(m));
            }
          else{
            this.evt.generateValues(m, this.val);
            }
          this.val = null;
          break;
          }
        case SC_Opcodes.PAR_DYN_FORCE:
        case SC_Opcodes.PAR_FORCE:
        case SC_Opcodes.PAR_DYN_TO_REGISTER:
        case SC_Opcodes.PAR_DYN:
        case SC_Opcodes.PAR:{
          const pbl = this.prodBranches.length;
          for(var nb = 0; nb < pbl; nb++){
            const pb = this.prodBranches[nb];
            const el = pb.emitters.length;
            if(0 == el){
              const pel = pb.permanentEmitters.length;
              for(var i = 0; i < pel; i++){
                pb.permanentEmitters[i].generateValues(m);
                }
              }
            else{
              for(var i = 0; i < el; i++){
                pb.emitters[i].generateValues(m);
                }
              pb.emitters = [];
              }
            }
          break;
          }
        default:{
          throw new Error("generateValues : undefined opcode "
                       +SC_Opcodes.toString(this.oc));
          }
        }
      }
  , its : function(nom){
      return this.o["$"+nom];
      }
  , addCell : function(nom, init, el, fun){
      switch(this.oc){
        case SC_Opcodes.CUBE:{
          var tgt = this.o;
          if((undefined !== tgt["$"+nom])
            ||(undefined !== tgt["_"+nom])
            ){
            throw "naming conflict for cell "+nom
                   + "$"+nom+" is "+tgt["$"+nom]
                   + "_"+nom+" is "+tgt["_"+nom]
                   ;
          }
          if(undefined !== fun){
            tgt["_"+nom] = fun;
            }
          if(undefined === tgt["_"+nom]){
            throw "no affectator for "+nom+" cell is defined";
            }
          tgt["$"+nom] = new SC_Cell({init:init
                             , sideEffect: (tgt["_"+nom]).bind(tgt)
                             , eventList: el});
          Object.defineProperty(tgt, nom,{get : (function(nom){
            return tgt["$"+nom].val();
            }).bind(tgt, nom)});
          break;
          }
        default: throw "addCell : undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      switch(this.oc){
        case SC_Opcodes.CELL:
        case SC_Opcodes.RE_CELL:{
          if(null === this.clock){
            this.clock = engine;
            }
          else if(this.clock !== engine){
            throw "Attempt to bind a cell to different clocks";
            }
          return this;
          }
        default: throw "bindTo : undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
, getExposeReader: function(m){
    if(this.exposedState.exposeInstant != m.instantNumber){
      this.swap(m);
      }
    return this.exposeReader;
    }
  , toString(tab){
      if(undefined == tab){
        tab = "";
        }
      switch(this.oc){
        case SC_Opcodes.REL_JUMP:{
          return "end repeat ";
          }
        case SC_Opcodes.REPEAT_FOREVER:
        case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
          return "repeat forever ";
          }
        case SC_Opcodes.REPEAT_N_TIMES_INIT:
        case SC_Opcodes.REPEAT_N_TIMES:
        case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
          return "repeat "
                  +((this.count<0)?"as forever from "+this.it+" times"
                              :this.count+"/"+this.it+" times ");
          }
        case SC_Opcodes.ACTION_FOREVER:{
          return "call "+((undefined == this.action.f)?" "+this.action+" "
                        :this.action.t+"."+this.action.f+"()")+" forever";
          }
        case SC_Opcodes.SEQ_ENDED:{
          return "seqend";
          }
        case SC_Opcodes.SEQ_INIT:
        case SC_Opcodes.SEQ:{
          var res = "[\n"+tab;
          for(var i = 0; i < this.seqElements.length; i++){
            res += this.seqElements[i].toString(tab);
            res += (i<this.seqElements.length-1)?";":"";
            }
          return res+"\n"+tab+"] ";
          }
        case SC_Opcodes.HALT:{
          return "pause forever ";
          }
        case SC_Opcodes.PAUSE:{
          return "pause ";
          }
        case SC_Opcodes.NEXT_INLINED:
        case SC_Opcodes.NEXT:{
          return "next ";
          }
        case SC_Opcodes.NOTHING_INLINED:
        case SC_Opcodes.NOTHING:{
          return "nothing ";
          }
        case SC_Opcodes.GENERATE_ONE_NO_VAL_INLINE:
        case SC_Opcodes.GENERATE_ONE_NO_VAL:{
          return "generate "+this.evt.toString();
          }
        case SC_Opcodes.GENERATE_ONE_INLINE:
        case SC_Opcodes.GENERATE_ONE:{
          return "generate "+this.evt.toString()
                 +((null != this.val)?"("+this.val.toString()+") ":"");
          }
        case SC_Opcodes.GENERATE_FOREVER_NO_VAL:{
          return "generate "+this.evt.toString()+" forever ";
          }
        case SC_Opcodes.GENERATE_INIT_INLINE:
        case SC_Opcodes.GENERATE_INLINE:
        case SC_Opcodes.GENERATE_INIT:
        case SC_Opcodes.GENERATE:{
          return "generate "+this.evt.toString()+" ("
                 +this.val+") for "+this.count+"/"+this.times+" times ";
          }
        case SC_Opcodes.WHEN:{
          return "when "+this.c.toString()+" then ";
          }
        case SC_Opcodes.KILL_SUSP:{
          return "kill \n"
                  +tab+"\t"+this.p.toString(tab+"\t")
                  +"\n"+tab+"on "+this.c.toString() +" end kill "
          }
        case SC_Opcodes.CUBE:{
          return "cube "+(this.o.constructor.name)+" with \n"
                  +tab+"\t"+this.p.toString(tab+"\t")
                  +"\n"+tab+" end cube"
          }
        case SC_Opcodes.PAR_DYN:{
          var res = "{\n"+tab+"\t";
          for(var i = 0; i < this.branches.length; i++){
            res += this.branches[i].prg.toString(tab+"\t");
            res += (i<this.branches.length-1)?"\n"+tab+"|| ":"";
            }
          return res+"\n"+tab+"} "+" <"+this.channel.toString()+">";
          }
        case SC_Opcodes.PAR:{
          var res = "{\n"+tab+"\t";
          for(var i = 0; i < this.branches.length; i++){
            res += this.branches[i].prg.toString(tab+"\t");
            res += (i<this.branches.length-1)?"\n"+tab+"|| ":"";
            }
          return res+"\n"+tab+"} ";
          }
        case SC_Opcodes.AWAIT_INLINE:
        case SC_Opcodes.AWAIT:
        case SC_Opcodes.AWAIT_REGISTRED:
        case SC_Opcodes.AWAIT_REGISTRED_INLINE:{
          return "await "+this.config.toString();
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT:{
          return "action on "+this.evtFun.config.toString()
               + this.evtFun.action.toString()
               ;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED:{
          return "action on "+this.evtFun.config.toString()
               + this.evtFun.action.toString()
               + " forever "
               ;
          }
        case SC_Opcodes.CELL:
        case SC_Opcodes.RE_CELL:{
          return "compute "+this.sideEffect+" on "+this.state
                 +((null == this.eventList)?"":" with "+this.eventList);
          }
        default: return "toString() : undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  }
function SC_RelativeJump(jump){
  this.relativeJump = jump; 
  this.seq = null; 
  }
SC_RelativeJump.prototype = {
  constructor : SC_RelativeJump
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.REL_JUMP);
      copy.relativeJump = parseInt(this.relativeJump);
      copy.seq = seq;
      return copy;
      }
  , toString : function(){
      return "end repeat ";
      }
}
function SC_IfRepeatPoint(cond){
  this.condition = cond; 
  this.end = 0;
  this.label="";
  }
SC_IfRepeatPoint.prototype = {
  constructor : SC_IfRepeatPoint
  , isAnSCProgram : true
  , toString : function(){
      return "while "+this.condition+" repeat ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.IF_REPEAT_INIT);
      copy.condition = this.condition;
      copy.end = parseInt(this.end);
      copy.label = this.label;
      copy.seq = seq;
      return copy;
      }
  }
function SC_RepeatPointForever(){
  this.label="";
  }
SC_RepeatPointForever.prototype = {
  constructor : SC_RepeatPointForever
  , isAnSCProgram : true
  , toString : function(){
      return "repeat forever ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.REPEAT_FOREVER);
      copy.seq = seq;
      copy.label = this.label;
      return copy;
      }
  }
function SC_RepeatPoint(times){
  if(times < 0){
    return new SC_RepeatPointForever();
    }
  this.count = this.it = times;
  this.stopped = true;
  this.seq = null;
  this.end = 0;
  this.label="";
  }
SC_RepeatPoint.prototype = {
  constructor : SC_RepeatPoint
  , isAnSCProgram : true
  , toString : function(){
      return "repeat "
                  +((this.it<0)?"forever ":this.count+"/"+this.it+" times ");
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_it = binder(this.it);      
      if(bound_it < 0){
        return new SC_RepeatPointForever()
             .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      var copy = new SC_Instruction(SC_Opcodes.REPEAT_N_TIMES_INIT);
      copy.end = parseInt(this.end);
      if("function" == typeof bound_it){
        Object.defineProperty(copy, "it",{get : bound_it});
        }
      else{
        copy.it = bound_it;
        if(0 === copy.it){
          copy.oc = SC_Opcodes.REL_JUMP;
          copy.relativeJump = this.end;
          }
        }
      copy.count = copy.it;
      copy._it = this.it;
      copy.seq = seq;
      copy.label = this.label;
      return copy;
      }
  }
function SC_Await(aConfig){
  this.config = aConfig;
  this.path = null;
}
SC_Await.prototype = {
  constructor : SC_Await
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_config = binder(this.config);
      var zeConf = bound_config
                  .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      var copy = new SC_Instruction(SC_Opcodes.AWAIT);
      copy.config = zeConf;
      copy._config = this.config;
      copy.path = path;
      return copy;
      }
  , toString : function(){
      return "await "+this.config.toString()+" ";
      }
}
function SC_GenerateForeverLateEvtNoVal(evt){
  if((undefined == evt)
        ||(! (evt instanceof SC_CubeBinding))){
    throw "GenerateForEver : late binding event error :("+evt+")";
    }
  this.evt = evt;
  }
SC_GenerateForeverLateEvtNoVal.prototype = {
  constructor : SC_GenerateForeverLateEvtNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL);
      copy.evt = this.evt.bindTo(engine);
      copy._evt = this._evt;
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString()+" forever ";
      }
  }
function SC_GenerateForeverLateVal(evt, val){
  if((undefined == val|| !(val instanceof SC_CubeBinding))||(undefined == evt)){
    throw "error on evt:("+evt+") or val:("+val+")";
    }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
}
SC_GenerateForeverLateVal.prototype =
{
  constructor : SC_GenerateForeverLateVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_value = binder(this.val);
      var copy = null;
      if(bound_evt.isBinding){
        if(bound_value.isBinding){
          copy = new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
          }
        else{
          copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_VAL);
          copy.evt = bound_evt;
          copy.val = bound_value;
          if(copy.val instanceof SC_CubeExposedState){
            copy.val.setCube(cinst);
            }
          }
        }
      else{
        if(bound_value instanceof SC_CubeBinding){
          copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_VAL);
          copy.evt = bound_evt;
          copy.val = bound_value;
          if(copy.val instanceof SC_CubeExposedState){
            copy.val.setCube(cinst);
            }
          }
        else{
          copy = new SC_GenerateForever(bound_evt, bound_value)
                  .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
          }
        }
      copy.itsParent = parbranch;
      copy._evt = this.evt.bindTo(engine);
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString()
             +((null != this.val)?"("+this.val.toString()+") ":"")
             +" forever ";
      }
}
function SC_GenerateForeverNoVal(evt){
  if((undefined == evt)
        ||(! (evt instanceof SC_EventId
              || evt instanceof SC_CubeBinding
              || evt instanceof SC_SensorId))){
    throw "GenerateForEver error on evt:("+evt+")";
    }
  this.evt = evt;
}
SC_GenerateForeverNoVal.prototype = {
  constructor : SC_GenerateForeverNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_NO_VAL_INIT);
      copy.evt = this.evt.bindTo(engine);
      copy._evt = this.evt;
      return copy;
      }
  , toString : SC_GenerateForeverLateEvtNoVal.prototype.toString
};
function SC_GenerateForever(evt, val){
  if(undefined === val){
    return new SC_GenerateForeverNoVal(evt);
  }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
}
SC_GenerateForever.prototype = {
  constructor : SC_GenerateForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_value = binder(this.val);
      var copy = null;
      if(bound_evt instanceof SC_CubeBinding){
        if(bound_value instanceof SC_CubeBinding){
          return new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
          }
        else{
          return new SC_GenerateForeverLateEvt(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
          }
        }
      else if(bound_value instanceof SC_CubeBinding){
        return new SC_GenerateForeverLateVal(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_INIT);
      copy.evt = bound_evt;
      copy.val = bound_value;
      if(copy.val instanceof SC_CubeExposedState){
        copy.val = cinst;
        copy.oc = SC_Opcodes.GENERATE_FOREVER_EXPOSE_INIT;
        }
      else if("function" == typeof(copy.val)){
        copy.oc = SC_Opcodes.GENERATE_FOREVER_FUN_INIT;
        }
      else if(copy.val instanceof SC_Instruction
              && copy.val.oc == SC_Opcodes.CELL){
        copy.oc = SC_Opcodes.GENERATE_FOREVER_CELL_INIT;
        }
      copy.itsParent = parbranch;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString()
             +this.val+" forever ";
      }
  }
function SC_GenerateOneNoVal(evt){
  this.evt = evt;
}
SC_GenerateOneNoVal.prototype = {
  constructor : SC_GenerateOneNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.GENERATE_ONE_NO_VAL);
      copy.evt = binder(this.evt).bindTo(engine);
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString();
      }
  }
function SC_GenerateOne(evt, val){
  if(undefined === val){
    return new SC_GenerateOneNoVal(evt);
    }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
}
SC_GenerateOne.prototype = {
  constructor : SC_GenerateOne
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = null;
      if(null === this.evt){
        this.evt = engine.traceEvt;
        }
      var tmp_evt = binder(this.evt).bindTo(engine);
      var tmp_val = binder(this.val);
      if(undefined === tmp_val){
        return new SC_GenerateOneNoVal(tmp_evt)
                .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.GENERATE_ONE);
      copy.evt = tmp_evt;
      copy.val = tmp_val;
      if(copy.val instanceof SC_CubeExposedState){
        copy.val = cinst;
        copy.oc = SC_Opcodes.GENERATE_ONE_EXPOSE;
        }
      else if("function" == typeof(copy.val)){
        copy.oc = SC_Opcodes.GENERATE_ONE_FUN;
        }
      else if(copy.val instanceof SC_Instruction
              && copy.val.oc == SC_Opcodes.CELL){
        copy.oc = SC_Opcodes.GENERATE_ONE_CELL;
        }
      copy.itsParent = parbranch;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      if(null == this.evt){
        return "tarce("+this.val.toString()+");"
        }
      return "generate "+this.evt.toString()
             +((null != this.val)?"("+this.val.toString()+") ":"");
      }
  }
function SC_Generate(evt, val, times){
  if((undefined === times)||(1 === times)){
    return new SC_GenerateOne(evt, val);
    }
  if(0 === times){
    return SC_Nothing;
    }
  if(times < 0){
    return new SC_GenerateForever(evt,val);
    }
  if(val === undefined){
    return new SC_GenerateNoVal(evt, times);
    }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
  this.count = this.times = times;
  }
SC_Generate.prototype = {
  constructor : SC_Generate
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = null;
      var binder = _SC._b(cube);
      var tmp_times = binder(this.times);
      var tmp_evt = binder(this.evt).bindTo(engine);
      var tmp_val = binder(this.val);
      if(tmp_times < 0){
        return new SC_GenerateForever(tmp_evt, tmp_val)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      else if(0 === tmp_times){
        return SC_Nothing;
        }
      else if((undefined === tmp_times)||(1 == tmp_times)){
        return new SC_GenerateOne(tmp_evt, tmp_val)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.GENERATE_INIT);
      copy.evt = tmp_evt;
      copy.val = tmp_val;
      if(copy.val instanceof SC_CubeExposedState){
        copy.val = cinst;
        copy.oc = SC_Opcodes.GENERATE_EXPOSE_INIT;
        }
      else if("function" == typeof(copy.val)){
        copy.oc = SC_Opcodes.GENERATE_FUN_INIT;
        }
      else if(copy.val instanceof SC_Instruction
              && copy.val.oc == SC_Opcodes.CELL){
        copy.oc = SC_Opcodes.GENERATE_CELL_INIT;
        }
      copy.times = tmp_times;
      copy.itsParent = parbranch;
      copy._times = this.times;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString()+" ("
             +this.val+") for "+this.count+"/"+this.times+" times ";
      }
  }
function SC_GenerateNoVal(evt, times){
  this.evt = evt;
  this.itsParent = null;
  this.count = this.times = times;
  }
SC_GenerateNoVal.prototype = {
  constructor : SC_GenerateNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = null;
      var binder = _SC._b(cube);
      var tmp_times = binder(this.times);
      var tmp_evt = binder(this.evt).bindTo(engine);
      if(tmp_times < 0){
        return new SC_GenerateForeverNoVal(tmp_evt)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      else if(0 === tmp_times){
        return SC_Nothing;
        }
      else if((undefined === tmp_times)||(1 == tmp_times)){
        return new SC_GenerateOneNoVal(tmp_evt)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(SC_Opcodes.GENERATE_NO_VAL_INIT);
      copy.evt = tmp_evt
      copy.times = tmp_times;
      copy.itsParent = parbranch;
      copy._times = this.times;
      copy._evt = this.evt;
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString()+" for "
              +this.count+"/"+this.times+" times ";
      }
  }
function SC_FilterForeverNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_SensorId) && !(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_CubeBinding)){
    throw "invalid filter event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  };
SC_FilterForeverNoSens.prototype = {
  constructor : SC_FilterForeverNoSens
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt).bindTo(engine);
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_Instruction(SC_Opcodes.FILTER_FOREVER_NO_ABS);
      copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      copy.filterFun = bound_fun;
      copy.evt = bound_evt;
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +" forever ";
      }
  }
function SC_FilterForever(sensor, filterFun, evt, no_sens){
  if(!(sensor instanceof SC_SensorId)
    &&!(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_CubeBinding)){
    throw "invalid filter event !!";
    }
  if(undefined === no_sens){
    return new SC_FilterForeverNoSens(sensor, filterFun, evt);
    }
  if(!(no_sens instanceof SC_EventId) && !(no_sens instanceof SC_CubeBinding)){
    throw "invalid no sensor event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.noSens_evt = no_sens;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  }
SC_FilterForever.prototype = {
  constructor : SC_FilterForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_noSens_evt = binder(this.noSens_evt);
      bound_fun = _SC.bindIt(bound_fun);      
      if(undefined === bound_noSens_evt){
        copy = new SC_FilterForeverNoSens(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       )
                .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        return copy;
        }
      var copy = new SC_Instruction(SC_Opcodes.FILTER_FOREVER);
      copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      copy.filterFun = bound_fun;
      copy.evt = bound_evt;
      copy.noSens_evt = bound_noSens_evt;
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" or "+this.noSens_evt
               +" forever ";
      }
  }
function SC_FilterOneNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_SensorId)
    &&!(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_CubeBinding)){
    throw "invalid filter event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  }
SC_FilterOneNoSens.prototype = {
  constructor : SC_FilterOneNoSens
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_noSens_evt = binder(this.noSens_evt);
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_Instruction(SC_Opcodes.FILTER_ONE_NO_ABS);
      copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      copy.filterFun = bound_fun;
      copy.evt = bound_evt;
      copy.noSens_evt = bound_noSens_evt;
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      ((-1 == this.times )?" forever ":(" for "+this.count+"/"+this.times+" times ")):"");
      }
  }
function SC_FilterOne(sensor, filterFun, evt, no_sens){
  if(!(sensor instanceof SC_SensorId)
    &&!(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_CubeBinding)){
    throw "invalid filter event !!";
    }
  if(undefined === no_sens){
    return new SC_FilterOneNoSens(sensor, filterFun, evt);
    }
  if(!(no_sens instanceof SC_EventId)
    && !(no_sens instanceof SC_CubeBinding)){
    throw "invalid no sensor event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  this.noSens_evt = no_sens;
  }
SC_FilterOne.prototype = {
  constructor : SC_FilterOne
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_noSens_evt = binder(this.noSens_evt);
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_Instruction(SC_Opcodes.FILTER_ONE);
      copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      copy.filterFun = bound_fun;
      copy.evt = bound_evt;
      copy.noSens_evt = bound_noSens_evt;
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      ((-1 == this.times )?" forever ":(" for "+this.count+"/"+this.times+" times ")):"");
      }
  }
function SC_FilterNoSens(sensor, evt, filterFun, times){
  if(0 == times){
    return SC_Nothing;
    }
  if((undefined === times) || (1 == times)){
    return new SC_FilterForeverNoSens(sensor, filterFun, evt);
    }
  if(times < 0){
    return new SC_FilterForeverNoSens(sensor, filterFun, evt);
    }
  if(!(sensor instanceof SC_SensorId) && !(no_sens instanceof SC_CubeBinding)){
    throw "sensor required !";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  this.count = this.times = times;
  }
SC_FilterNoSens.prototype = {
  constructor : SC_FilterNoSens
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_times = binder(this.times);
      var copy = null;
      bound_fun = _SC.bindIt(bound_fun);
      if(0 == bound_times){
        return SC_Nothing;
        }
      if((undefined === bound_times) || (1 == bound_times)){
        return new SC_FilterOneNoSens(bound_sensor, bound_fun, bound_evt
                                            , bound_noSens_evt)
           .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      else if(bound_times < 0){
        return new SC_FilterForeverNoSens(bound_sensor, bound_fun, bound_evt
                                                , bound_noSens_evt)
           .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.FILTER_NO_ABS_INIT);
      copy.sensor = bound_sensor.bindTo(engine);
      copy.evt = bound_evt.bindTo(engine);
      copy.filterFun = bound_fun
      copy.times = bound_times
      copy._sensor = this.sensor;
      copy._filterFun = this.filterFun;
      copy._evt = this.evt;
      copy._times = this.times;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      (" for "+this.count+"/"+this.times+" times "):"");
      }
  }
function SC_Filter(sensor, evt, filterFun, times, no_sens){
  if(0 == times){
    return SC_Nothing;
    }
  if((undefined === times) || (1 == times)){
    return new SC_FilterOne(sensor, filterFun, evt, no_sens);
    }
  if(times < 0){
    return new SC_FilterForever(sensor, filterFun, evt, no_sens);
    }
  if(!(sensor instanceof SC_SensorId) && !(no_sens instanceof SC_CubeBinding)){
    throw "sensor required !";
    }
  if(undefined == no_sens){
    return new SC_FilterNoSens(sensor, evt, filterFun, times);
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.times = times;
  this.noSens_evt = no_sens;
  }
SC_Filter.prototype = {
  constructor : SC_Filter
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_times = binder(this.times);
      var bound_noSens_evt = binder(this.noSens_evt);
      var copy = null;
      bound_fun = _SC.bindIt(bound_fun);
      if(0 == bound_times){
        return SC_Nothing;
        }
      if((undefined === bound_times) || (1 == bound_times)){
        return SC_FilterOne(bound_sensor, bound_fun, bound_evt, bound_noSens_evt)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      else if(bound_times < 0){
        return SC_FilterForever(bound_sensor
                              , bound_fun, bound_evt, bound_noSens_evt)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.FILTER);
      copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      copy.evt = bound_evt;
      copy.filterFun = bound_fun;
      copy.times = bound_times;
      copy.noSens_evt = bound_noSens_evt;
      copy._sensor = this.sensor;
      copy._filterFun = this.filterFun;
      copy._evt = this.evt;
      copy._times = this.times;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      (" for "+this.count+"/"+this.times+" times "):"");
      }
  }
function SC_Send(evt, value, times){
  if(0 == times){
    return SC_Nothing;
    }
  if((undefined === times) || (1 == times)){
    return new SC_SendOne(evt, value);
    }
  if(times < 0){
    return new SC_SendForever(evt, value);
    }
  this.evt = evt;
  this.count = this.times = times;
  this.value = value;
  }
SC_Send.prototype = {
  constructor : SC_Send
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt).bindTo(engine);
      var bound_times = binder(this.times);
      var bound_val = binder(this.value);
      var copy = null;
      if(0 === bound_times){
        return SC_Nothing;
        }
      if((undefined === bound_times) || (1 == bound_times)){
        return SC_SendOne(bound_evt, bound_val)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      else if(bound_times < 0){
        return SC_SendForever(bound_evt, bound_val)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.SEND);
      copy.evt = bound_evt;
      copy.value = bound_val;
      copy.count = copy.times = bound_times;
      copy._evt = this.evt;
      copy._times = this.times;
      copy._value = this.value;
      return copy;
      }
  , toString : function(){
      return "send "+this.evt.toString()
               +"("+this.value.toString()+")"
               +((1 != this.times)?
                      (" for "+this.count+"/"+this.times+" times "):"");
      }
  }
function SC_SendOne(evt, value){
  this.evt = evt;
  this.value = value;
  }
SC_SendOne.prototype = {
  constructor : SC_SendOne
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.SEND_ONE);
      copy.evt = binder(this.evt).bindTo(engine);
      copy.value = binder(this.value);
      copy._evt = this.evt;
      copy._value = this.value;
      return copy;
      }
  , toString : function(){
      return "send "+this.evt.toString()
               +"("+this.value.toString()+")"
      }
  }
function SC_SendForever(evt, value){
  this.evt = evt;
  this.value = value;
  }
SC_SendForever.prototype = {
  constructor : SC_SendForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = SC_SendForever(binder(this.evt), binder(this.value));
      copy._evt = this.evt;
      return copy;
      }
  , toString : function(){
      return "send "+this.evt.toString()
               +"("+this.value.toString()+")"
               +" forever ";
      }
  }
const SC_Nothing = new SC_Instruction(SC_Opcodes.NOTHING);
const SC_Nothing_inlined = new SC_Instruction(SC_Opcodes.NOTHING_INLINED);
SC_Nothing.isAnSCProgram = true;
SC_Nothing_inlined.isAnSCProgram = true;
SC_Nothing_inlined.bindTo = function(engine, parbranch, seq, masterSeq, path
                                   , cube, cinst){
    return this;
  }
SC_Nothing.bindTo = function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    return this;
  }
const SC_Next = new SC_Instruction(SC_Opcodes.NEXT);
const SC_Next_inlined = new SC_Instruction(SC_Opcodes.NEXT_INLINED);
SC_Next.isAnSCProgram = true;
SC_Next_inlined.isAnSCProgram = true;
SC_Next_inlined.bindTo = function(){
    return this;
  }
SC_Next.bindTo = function(){
    return this;
  }
const SC_PauseForever = new SC_Instruction(SC_Opcodes.HALT);
SC_PauseForever.isAnSCProgram = true;
SC_PauseForever.bindTo = function(engine, parbranch, seq, masterSeq, path, cube, cinst){
  return this;
  }
const SC_PauseInline = new SC_Instruction(SC_Opcodes.PAUSE_INLINE);
SC_PauseInline.isAnSCProgram = true;
SC_PauseInline.bindTo = function(engine, parbranch, seq, masterSeq, path, cube, cinst){
  return this;
  }
function SC_PauseOne(){};
SC_PauseOne.prototype = {
  constructor : SC_PauseOne
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      return new SC_Instruction(SC_Opcodes.PAUSE);
      }
  , toString : function(){
      return "pause ";
      }
  };
function SC_Pause(times){
  if(times < 0){
    return SC_PauseForever;
    }
  if(0 === times){
    return SC_Nothing;
    }
  this.count = this.times = (undefined == times)?1:times;
  if(1 === this.time){
    return new SC_PauseOne();
    }
}
SC_Pause.prototype = {
  constructor : SC_Pause
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var bound_times = binder(this.times);
      var copy = null;
      if(bound_times < 0){
        return SC_PauseForever;
        }
      else if(0 === bound_times){
        return SC_Nothing;
        }
      else if(1 === bound_times){
        return new SC_PauseOne().bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
        }
      copy = new SC_Instruction(SC_Opcodes.PAUSE_N_TIMES_INIT);
      _SC.lateBindProperty(copy, "times", bound_times);
      copy._times = this.times;
      return copy;
      }
  , toString : function(){
      return "pause "+this.count+"/"+this.times+" times ";
      }
  }
function SC_PauseRT(duration){
  this.duration = duration;
  }
SC_PauseRT.prototype = {
  constructor : SC_PauseRT
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.PAUSE_RT_INIT);
      copy.duration = this.duration*1000;
      copy._duration = this.duration;
      return copy;
      }
  , toString : function(){
      return "pause for "+this.duration+" ms ";
      }
  }
function SC_PauseUntil(cond){
  this.cond = cond;
  };
SC_PauseUntil.prototype = {
  constructor : SC_PauseUntil,
  isAnSCProgram : true,
  bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_cond = binder(this.cond);
    var copy = null;
    if(bound_cond === true){
      return SC_PauseOne
              .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      }
    else if(false == bound_cond){
      return SC_PauseForever;
      }
    copy = new SC_Instruction(SC_Opcodes.PAUSE_UNTIL);
    copy.cond = bound_cond;
    copy._cond = this.cond;
    return copy;
    },
  toString : function(){
    return "pause until "+this.cond;
    }
  };
function SC_Seq(seqElements){
  this.seqElements = [];
  var targetIDx = 0;
  for(var i = 0; i < seqElements.length; i++){
    this.add(seqElements[i])
    }
  };
SC_Seq.prototype = {
  constructor : SC_Seq
, isAnSCProgram : true
, add:function(p){
    if(p){
      if(p instanceof SC_Seq){
        for(var j = 0; j < p.seqElements.length; j++){
          this.seqElements.push(p.seqElements[j]);
          }
        }
      else{
        this.seqElements.push(p);
        }
      return;
      }
    throw new Error('Seq.add(): invalid program'+p);
    }
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.SEQ_INIT);
      copy.seqElements = [];
      var targetIDx = 0;
      for(var i = 0; i < this.seqElements.length; i++){
        var prg = this.seqElements[i];
        if(prg === SC_Nothing){
          prg = SC_Nothing_inlined;
          }
        if(prg instanceof SC_Seq){
          throw "Seq : binding while seq is in !"
          for(var j = 0; j < prg.seqElements.length; j++){
            copy.seqElements[targetIDx++] = prg.seqElements[j];
            }
          }
        else{
          copy.seqElements[targetIDx++] = prg;
          }
        }
      copy.idx = 0;
      if(undefined === masterSeq){
        masterSeq = copy;
        }
      for(var i = 0; i < copy.seqElements.length; i++){
        copy.seqElements[i] = copy.seqElements[i].bindTo(engine, parbranch, copy
                                                         , masterSeq, copy, cube, cinst);
        switch(copy.seqElements[i].oc){
          case SC_Opcodes.PAUSE:{
            copy.seqElements[i].oc = SC_Opcodes.PAUSE_INLINE;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.ACTION:{
            copy.seqElements[i].oc = SC_Opcodes.ACTION_INLINE;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.ACTION_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.CUBE_ACTION:{
            copy.seqElements[i].oc = SC_Opcodes.CUBE_ACTION_INLINE;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_NO_VAL:{
            copy.seqElements[i].oc = SC_Opcodes.GENERATE_ONE_NO_VAL_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.GENERATE_ONE_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.GENERATE_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.GENERATE_NO_VAL_INIT_INLINE;
            break;
            }
          case SC_Opcodes.AWAIT:{
            copy.seqElements[i].oc = SC_Opcodes.AWAIT_INLINE;
            break;
            }
          default:{
            break;
            }
          }
        }
      copy.seqElements.push(new SC_Instruction(SC_Opcodes.SEQ_ENDED))
      copy.max = copy.seqElements.length-2;
      copy.path = path;
      return copy;
      },
  toString : function(){
      var res ="[";
      for(var i = 0; i < this.seqElements.length; i++){
        res += this.seqElements[i].toString();
        res += (i<this.seqElements.length-1)?";":"";
        }
      return res+"] ";
      }
  };
function SC_ActionForever(f){
  this.action = f;
  }
SC_ActionForever.prototype = {
  constructor : SC_ActionForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.ACTION_FOREVER_INIT);
      copy.action = binder(this.action);
      copy._action = this.action;
      copy.closure = _SC.bindIt(copy.action);
      return copy;
      }
  , toString : function(){
      return "call "+((undefined == this.action.f)?" "+this.action+" "
                   :this.action.t+"."+this.action.f+"()")+" forever";
      }
  };
function SC_Action(f, times){
  if(0 == times){
    return SC_Nothing;
    }
  if((undefined === times)||(1 == times)){
    return new SC_SimpleAction(f);
    }
  if(times < 0){
    return new SC_ActionForever(f);
    }
  this.count = this.times = times;
  this.action = f;
  this.closure = null;
  }
SC_Action.prototype = {
  constructor : SC_Action
  , isAnSCProgram : true
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    var binder = _SC._b(cube);
    var times = binder(this.times);
    if(0 == times){
      return SC_Nothing;
      }
    if((undefined === times)||(1 == times)){
      return new SC_SimpleAction(this.action)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      }
    if(times < 0){
      return new SC_ActionForever(this.action)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      }
    var copy = new SC_Instruction(SC_Opcodes.ACTION_N_TIMES_INIT);
    copy.action = binder(this.action);
    copy._action = this.action;
    copy._times = this.times;
    if("function" == typeof times){
      Object.defineProperty(copy, "times",{get : times});
      }
    else{
      copy.times = times;
      }
    if(copy.action.f && copy.action.t){
      copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
      }
    else{
      copy.closure = copy.action.bind(cube);
      }
    return copy;
    }
  , toString : function(){
      return "call "+((undefined == this.action.f)?"call("+this.action+") "
                   :this.action.t+"."+this.action.f+"() ")
                   +((this.times>1)?(this.count+"/"+this.times+" times "):" ");
      }
}
function SC_SimpleAction(f){
  if(undefined === f){
    throw "undefined action";
    }
  this.action = f;
  }
SC_SimpleAction.prototype={
  constructor : SC_SimpleAction
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.ACTION);
      copy.action = binder(this.action);
      copy._action = this.action;
      if(copy.action.f && copy.action.t){
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
        }
      else{
        copy.closure = copy.action.bind(cube);
        }
      return copy;
      }
  , toString : function(){
      return "call "+((undefined == this.action.f)?"call("+this.action+") "
                   :this.action.t+"."+this.action.f+"() ");
      }
}
function SC_Log(msg){
  if(undefined === msg){
    throw "undefined msg";
    }
  this.msg = msg;
  }
SC_Log.prototype={
  constructor : SC_Log
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.LOG);
      copy.msg = binder(this.msg);
      copy._msg = this.msg;
      if(copy.msg.f && copy.msg.t){
        copy.closure = copy.msg.t[copy.msg.f].bind(copy.msg.t);
        }
      else{
        copy.closure = copy.msg;
        }
      return copy;
      }
  , toString : function(){
      return "log "+((undefined == this.msg.f)
                           ?""+this.msg+" "
                           :this.msg.t+"."+this.msg.f+"() ");
      }
}
function SC_ActionOnEventForeverNoDef(c, act){
  this.evtFun = {action:act, config:c};
}
SC_ActionOnEventForeverNoDef.prototype = {
  constructor : SC_ActionOnEventForeverNoDef
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
        };
      copy.path = path;
      return copy;
    }
    , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
             +" forever ";
      }
};
function SC_ActionOnEventForever(c, act, defaultAct){
  if(undefined === defaultAct){
    return new SC_ActionOnEventForeverNoDef(c, act);
    }
  this.evtFun = {action:act, config:c};
  this.defaultAct = defaultAct;
}
SC_ActionOnEventForever.prototype = {
  constructor : SC_ActionOnEventForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT_FOREVER);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
        };
      copy.defaultAct = binder(this.defaultAct);
      copy.path = path;
      return copy;
    }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
             +"else call("+this.defaultAct.toString()+")  forever ";
    }
};
function SC_ActionOnEventNoDef(c, act, times){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.count = this.times = times;
}
SC_ActionOnEventNoDef.prototype = {
  constructor : SC_ActionOnEventNoDef
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
        };
      copy.times = binder(this.times);
      copy.path = path;
      return copy;
    }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
             +" for "+this.count+"/"+this.times+" times ";
    }
};
function SC_ActionOnEvent(c, act, defaultAct, times){
  if(undefined === act){ throw "action is not defined"; }
  if(times < 0){ return new SC_ActionOnEventForever(c, act, defaultAct); }
  if(0 === times){ return SC_Nothing(); }
  if(undefined === times){
    return new SC_SimpleActionOnEvent(c, act, defaultAct);
  }
  if(undefined === defaultAct){
    return new SC_ActionOnEventNoDef(c, act, times);
    }
  this.evtFun = {action:act, config:c};
  this.defaultAct = defaultAct;
  this.count = this.times = times;
}
SC_ActionOnEvent.prototype = {
  constructor : SC_ActionOnEvent
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT);
    copy.evtFun = {
      action:binder(this.evtFun.action)
      , config:binder(this.evtFun.config)
                .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
      };
    copy.defaultAct = binder(this.defaultAct);
    copy.count = copy.times = binder(this.times);
    copy.path = path;
    return copy;
  }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
          +"else call("+this.defaultAct.toString()+") for "
          +this.count+"/"+this.times+" times ";
      }
};
function SC_SimpleActionOnEventNoDef(c, act){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.toRegister = true;
  this.terminated = false;
}
SC_SimpleActionOnEventNoDef.prototype = {
  cosntructor : SC_SimpleActionOnEventNoDef
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
        };
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") ";
      }
  };
function SC_SimpleActionOnEvent(c, act, defaultAct){
  if(undefined === defaultAct){
    return new SC_SimpleActionOnEventNoDef(c, act);
    }
  this.evtFun = {action:act, config:c};
  this.defaultAct = defaultAct;
  this.path = null;
  this.toRegister = true;
  this.terminated = false;
}
SC_SimpleActionOnEvent.prototype = {
  constructor : SC_SimpleActionOnEvent
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.SIMPLE_ACTION_ON_EVENT);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
        };
      copy.defaultAct = binder(this.defaultAct);
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
          +"else call("+this.defaultAct.toString()+") ";
      }
  }
function SC_ParBranch(aParent, aPar, prg){
  this.oc = SC_Opcodes.PAR_BRANCH;
  this.prev = null;
  this.next = null;
  this.prg = prg;
  this.flag = SC_Instruction_State.SUSP;
  this.itsParent = aParent;
  this.itsPar = aPar;
  this.emitters = [];
  this.permanentEmitters = [];
  this.subBranches = [];
  this.hasPotential = false;
  this.purgeable = false;
  this.path = null;
  this.idxInProd = -1;
  if(null != aParent){
    aParent.subBranches.push(this);
    }
}
SC_ParBranch.prototype = {
  constructor : SC_ParBranch
  , declarePotential : function(){
      if(this.hasPotential){
        return;
        }
      this.hasPotential = true;
      this.idxInProd = this.itsPar.registerInProdBranch(this);
      if(null != this.itsParent){
        this.itsParent.declarePotential();
        }
      }
  , registerForProduction : SC_Instruction.prototype.registerForProduction
  , unregisterFromProduction : SC_Instruction.prototype.unregisterFromProduction
  , awake : SC_Instruction.prototype.awake
  };
function SC_Queues(){
  this.start = null;
}
SC_Queues.prototype = {
  constructor : SC_Queues
  , append : function(elt){
      if(null != this.start){
        this.start.prev = elt;
        }
      elt.next = this.start;
      this.start = elt;
      }
  , pop : function(){
      var res = this.start;
      if(null != res){
        this.start = res.next;
        }
      return res;
      }
  , remove : function(elt){
      if(elt === this.start){
        this.start = elt.next;
        return elt;
        }
      if(null != elt.next){
        elt.next.prev = elt.prev;
        }
      elt.prev.next = elt.next;
      return elt;
      }
  , isEmpty : function(){
      return (null == this.start);
      }
  , setFlags : function(st){
      var b = this.start;
      while(null != b){
        b.flag = st;
        b = b.next;
        }
      }
  };
function SC_Par(args, channel){
  if(undefined !== channel){
    return new SC_ParDyn(channel, args);
    }
  this.branches = [];
  for(var i of args){
    this.branches.push(new SC_ParBranch(null, null, i));
    }
  }
SC_Par.prototype = {
  constructor : SC_Par
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.PAR_INIT);
      copy.suspended = new SC_Queues();
      copy.waittingEOI = new SC_Queues();
      copy.stopped = new SC_Queues();
      copy.waitting = new SC_Queues();
      copy.halted = new SC_Queues();
      copy.terminated = new SC_Queues();
      copy.branches = [];
      copy.cinst = cinst;
      copy.prodBranches = [];
      copy.itsParent = null;
      copy.mseq = masterSeq;
      copy.cube = cube;
      for(var tmp of this.branches){
        var b = new SC_ParBranch(parbranch, copy, SC_Nothing);
        b.prg = tmp.prg.bindTo(engine, b, null, masterSeq, b, cube, cinst);
        b.path = copy;
        copy.branches.push(b);
        copy.suspended.append(b);
        if(b.hasPotential){
          if(undefined != b.itsParent){
            b.itsParent.hasPotential = true;
            }
          if(copy.prodBranches.indexOf(b)<0){
            copy.prodBranches.push(b);
            }
          }
        }
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var res ="[";
      for(var i in this.branches){
        res += this.branches[i].prg.toString();
        res += (i<this.branches.length-1)?"||":"";
        }
      return res+"] ";
      }
  , add : function(p){
      if(undefined == p){
        throw "adding branch to par, p is undefined";
        }
      if(p instanceof SC_Par){
        for(var n = 0; n < p.branches.length; n++){
          this.add(p.branches[n].prg);
          }
        }
      else{
        var b = new SC_ParBranch(null, null, p);
        this.branches.push(b);
        }
      }
  };
function SC_ParDyn(channel, args){
  if(undefined === channel){
    throw "Illegal dynamic Parrellel instruction use !";
    }
  this.branches = [];
  for(var i in args){
    this.branches.push(new SC_ParBranch(null, this, args[i]));
    }
  this.channel = channel;
  }
SC_ParDyn.prototype = {
  constructor : SC_ParDyn
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.PAR_DYN_INIT);
      copy.suspended = new SC_Queues();
      copy.waittingEOI = new SC_Queues();
      copy.stopped = new SC_Queues();
      copy.waitting = new SC_Queues();
      copy.halted = new SC_Queues();
      copy.terminated = new SC_Queues();
      copy.branches = [];
      copy.cinst = cinst;
      copy.prodBranches = [];
      copy.originalBranches = [];
      for(var i of this.branches){
        var b = new SC_ParBranch(parbranch, copy, SC_Nothing);
        b.prg = i.prg.bindTo(engine, b, null, masterSeq, b, cube, cinst);
        b.path = copy;
        copy.branches.push(b);
        copy.originalBranches.push(b);
        if(b.hasPotential){
          if(undefined != b.itsParent){
            b.itsParent.hasPotential = true;
            }
          if(copy.prodBranches.indexOf(b)<0){
            copy.prodBranches.push(b);
            }
          }
        copy.suspended.append(b);
        }
      copy.mseq = masterSeq;
      copy.itsParent = parbranch;
      copy.cube = cube;
      copy.channel = this.channel.bindTo(engine);
      copy.path = path;
      return copy;
      }
  , add: SC_Par.prototype.add
  , toString : SC_Par.prototype.toString
  };
function SC_AndBin(c1,c2){
  this.c1 = c1;
  this.c2 = c2;
  }
SC_AndBin.prototype.isPresent = function(m){
  return this.c1.isPresent(m) && this.c2.isPresent(m);
  }
SC_AndBin.prototype.getAllValues = function(m,vals){
  this.c1.getAllValues(m,vals);
  this.c2.getAllValues(m,vals);
  }
SC_AndBin.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube, cinst){
  var binder = _SC._b(cube);
  var copy = new SC_AndBin();
  copy.c1 = binder(this.c1).bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
  copy.c2 = binder(this.c2).bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
  return copy;
  }
SC_AndBin.prototype.toString = function(){
  var res ="(";
  res += this.c1.toString()
          res += " /\\ "+this.c2.toString()
          return res+") ";
  }
SC_AndBin.prototype.unregister = function(i){
  this.c1.unregister(i);
  this.c2.unregister(i);
  }
SC_AndBin.prototype.registerInst = function(m,i){
  this.c1.registerInst(m,i);
  this.c2.registerInst(m,i);
  }
function SC_And(configsArray){
  if((undefined == configsArray)||!(configsArray instanceof Array)){
    throw "no valid configuration for And combinator";
    }
  if(2 > configsArray.length){
    throw "not enough elements to combine with And operator ("+configsArray.length+")";
    }
  if(2 == configsArray.length){
    return new SC_AndBin(configsArray[0], configsArray[1])
    }
  this.c = configsArray;
  }
SC_And.prototype.isPresent = function(m){
  for(var i in this.c){
    if(this.c[i].isPresent(m)){
      continue;
      }
    return false;
    }
  return true;
  }
SC_And.prototype.getAllValues = function(m,vals){
  for(var i in this.c){
    this.c[i].getAllValues(m,vals);
    }
  }
SC_And.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var tmp_configs = [];
  for(var i in this.c){
    tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst));
    }
  var copy = new SC_And(tmp_configs);
  return copy;
  }
SC_And.prototype.toString = function(){
  var res ="("+this.c[0].toString();
  for(var i in this.c){
    res += " /\\ "+this.c[i].toString()
    }
  return res+") ";
  }
SC_And.prototype.unregister = function(i){
  for(var j in this.c){
    this.c[j].unregister(i);
    }
  }
SC_And.prototype.registerInst = function(m,i){
  for(var j in this.c){
    this.c[j].registerInst(m,i);
    }
  }
function SC_OrBin(c1,c2){
  this.c1 = c1;
  this.c2 = c2;
  }
SC_OrBin.prototype ={
  isPresent : function(m){
  return this.c1.isPresent(m) || this.c2.isPresent(m);
  }
  , getAllValues : SC_AndBin.prototype.getAllValues
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_OrBin();
    copy.c1 = binder(this.c1).bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
    copy.c2 = binder(this.c2).bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst)
    return copy;
    }
  , toString : function(){
    var res ="(";
    res += this.c1.toString()
            res += " \\/ "+this.c2.toString()
            return res+") ";
    }
  , unregister : SC_AndBin.prototype.unregister
  , registerInst : SC_AndBin.prototype.registerInst
  }
function SC_Or(configsArray){
  if((undefined == configsArray)||!(configsArray instanceof Array)){
    throw "no valid configuration for And combinator";
    }
  if(2 > configsArray.length){
    throw "not enough elements to combine with And operator ("+configsArray.length+")";
    }
  if(2 == configsArray.length){
    return new SC_OrBin(configsArray[0], configsArray[1])
    }
  this.c = configsArray;
  }
SC_Or.prototype = {
  isPresent : function(m){
    for(var i in this.c){
      if(this.c[i].isPresent(m)){
        return true
        }
      }
    return false;
    }
  , getAllValues : SC_And.prototype.getAllValues
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var tmp_configs = [];
      for(var i in this.c){
        tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst));
        }
      var copy = new SC_Or(tmp_configs);
      return copy;
      }
  , toString : function(){
    var res ="("+this.c[0].toString();
    for(var i in this.c){
      res += " \\/ "+this.c[i].toString()
      }
    return res+") ";
    }
  , unregister : SC_And.prototype.unregister
  , registerInst : SC_And.prototype.registerInst
  }
function SC_Cell(params){
  if(undefined == params){
    throw new Error("undefined params for SC_Cell");
    }
  if(undefined !== params.target){
    return new SC_ReCell(params);
    }
  var cell = new SC_Instruction(SC_Opcodes.CELL);
  cell.state = (undefined == params.init)?null:params.init;
  if(undefined == params.sideEffect){
    throw new Error("undefined sideEffect !");
    }
  else{
    if(undefined != params.sideEffect.t){
      cell.sideEffect = params.sideEffect.t[params.sideEffect.f].bind(params.sideEffect.t);
      }
    else{
      cell.sideEffect = params.sideEffect;
      }
    cell.eventList = (undefined == params.eventList)?[]:params.eventList;
    }
  cell.TODO =  -1;
  cell.futur = null;
  cell.clock = null;
  return cell;
  }
function SC_ReCell(params){
  if(undefined == params){
    throw new Error("undefined params for SC_ReCell");
    }
  if((undefined == params.field)
    || (undefined == params.target)
    || (undefined == params.target[params.field])
    ){
     throw new Error("field not specified on target ("+params.field+")");
    }
  var cell = new SC_Instruction(SC_Opcodes.RE_CELL);
  if(undefined == params.sideEffect){
    throw new Error("undefined sideEffect !");
    }
  else{
    cell.sideEffect = params.sideEffect;
    cell.eventList = (undefined == params.eventList)?[]:params.eventList;
    }
  cell.target = params.target;
  cell.field = params.field;
  cell.TODO =  -1;
  cell.futur = null;
  Object.defineProperty(cell, "state",{set : (function(nom, x){
      this[nom] = x;
    }).bind(cell.target, cell.field)
    , get: (function(nom){
      return this[nom];
    }).bind(cell.target, cell.field)
    }); 
  cell.clock = null;
  return cell;
  }
function SC_CubeCell(c){
  this.cellName = c;
  }
SC_CubeCell.prototype = {
  constructor : SC_CubeCell
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var tgt = cube[this.cellName];
      var copy = new SC_Instruction(SC_Opcodes.CUBE_CELL_INIT);
      if(tgt instanceof SC_Instruction
        &&((tgt.oc == SC_Opcodes.CELL)||((tgt.oc == SC_Opcodes.RE_CELL)))){
        return tgt.bindTo(engine, parbranch, seq, masterSeq, copy, cube, cinst);
        }
      copy.cellName = this.cellName;
      copy.cell=null;
      copy.cube = cube;
      copy.path = path;
      return copy;
      }
  , toString : function(){
      return "activ cell "+this.cellName;
      }
}
function SC_Kill(c, p, end){
  this.c = c;
  this.p = p;
  this.end = end;
}
SC_Kill.prototype = {
  constructor : SC_Kill
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);  
      var copy = new SC_Instruction(SC_Opcodes.KILL_SUSP_INIT);
      copy.c = binder(this.c)
                  .bindTo(engine, parbranch, null, masterSeq, copy, cube, cinst);
      copy.p = this.p.bindTo(engine, parbranch, null, masterSeq, copy, cube, cinst);
      copy.end = parseInt(this.end);
      copy.path = path;
      copy.seq = seq;
      return copy;
      }
  , toString : function(){
      return "kill "+this.p.toString()
              +" on "+this.c.toString()
              +((null != this.h)?"handle "+this.h:"")
              +" end kill ";
    }
  };
function SC_Control(c, p){
  this.c = c;
  this.p = p;
  }
SC_Control.prototype = {
  constructor:SC_Control
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.CONTROL_INIT);
      copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube, cinst);
      copy.p = this.p.bindTo(engine, parbranch, null, masterSeq, copy, cube, cinst);
      copy.path = path;
      return copy;
      }
  , toString : function(){
      return "control "+this.p.toString()
              +" by "+this.c.toString()
              +" end control ";
      }
  };
function SC_When(c){
  this.c = c;
  this.elsB = 0;
  };
SC_When.prototype = {
  constructor: SC_When
, isAnSCProgram : true
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    const binder = _SC._b(cube);
    const bound_config = binder(this.c);
    const copy = new SC_Instruction(SC_Opcodes.WHEN);
    copy.c = bound_config
               .bindTo(engine, parbranch, null, masterSeq, copy, cube, cinst);
    copy.elsB = parseInt(this.elsB);
    copy.path = path;
    copy.seq = seq;
    return copy;
    }
, toString : function(){
    return "when "+this.c.toString()+" then ";
    }
  };
function SC_Test(b){
  this.b = b;
  }
SC_Test.prototype = {
  constructor : SC_Test
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.TEST);
      copy.b = binder(this.b);
      copy.test = function(m){
        if("function" == typeof(this.b)){
          return this.b(m);
          }
        return (((null == this.b.t)?this.b:this.b.t[this.b.f]));
        }
      copy._b = this.b;
      copy.elsB = this.elsB;
      copy.path = path;
      copy.seq = seq;
      return copy;
      }
  , toString : function(){
      return "test "+this.b.toString()
              +" then "+this.t.toString()
              +"else "+this.e.toString()
              +" end test ";
      }
};
function SC_Match(val, cases){
  this.v = val;
  this.cases = cases;
}
SC_Match.prototype = {
  constructor : SC_Match
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var copy = new SC_Instruction(SC_Opcodes.MATCH_INIT);
      copy.v = this.v;
      copy.cases = new Array(this.cases.length);
      for(var n in this.cases){
        copy.cases[n] = this.cases[n]
                         .bindTo(engine, parbranch, null, masterSeq, copy, cube, cinst);
      }
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var choices = "";
      for(var v in this.cases){
          choices += "{ "+v+" : "+this.cases[v]+"}"
        }
      return "match "+this.v+" selsect "+choices
              +" end match ";
      }
  };
function SC_Cube(o, p, extension){
  this.o = o;
  this.p = p;
  this.init = NO_FUN;
  this.lastWill = NO_FUN;
  if(undefined != extension){
    if(undefined != extension.init){
      this.init = extension.init;
      }
    if(undefined != extension.lastWill){
      this.lastWill =extension.lastWill;
      }
    if(undefined != extension.swapList){
      this.swapList = extension.swapList;
      }
    if(undefined != extension.cubeProto){
      this.cubeProto = extension.cubeProto;
      }
    else {
      this.cubeProto = {};
      }
    }
  else{
    this.cubeProto = {};
    }
  this.toAdd = [];
  }
SC_Cube.prototype = {
  constructor : SC_Cube
  , isAnSCProgram : true
  , addProgram : function(p){
      if((undefined == p)||!p.isAnSCProgram){
        throw new Error("undefined program to add in cube: "+p);
        }
      this.toAdd.push(p);
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(this);
      if(undefined !== this.o.SC_cubeAddBehaviorEvt){
        throw "warning javascript object already configured !"
                    +"Be sure that it is not used bound to another program"
                    +", especially in a different reactive machine";
        console.trace();        
        return null;
        }
      SC_cubify.apply(this.o, this.cubeProto);
      var copy = new SC_Instruction(SC_Opcodes.CUBE_ZERO);
      copy.o = this.o;
      copy.swapList = this.swapList;
      copy.exposeReader = {};
      copy.exposedState = {
        exposeInstant:-1
        };
      const cells = copy.swapList;
      if(cells){
        for(var i of cells){
          const idn = i.id;
          Object.defineProperty(copy.exposeReader
                     , idn
                     , {get:(function(name){
                           return this[name];
                           }).bind(copy.exposedState, idn)
                        }
                        );
          copy.exposedState[idn] = null;
          }
        }
      Object.defineProperty(copy.o
                          , "SC_me"
                          , { value: copy.exposeReader , writable:false }
                          );
      var tmp_par_dyn;
      var tmp_beh = SC.kill(this.o.SC_cubeKillEvt
           , SC.par(
               SC.repeatForever(
                 SC.await(
                       SC.or(this.o.SC_cubeCellifyEvt
                         , this.o.SC_cubeAddCellEvt))
                 , this.o.$SC_cellMaker
                 )
               , SC.seq(
                   tmp_par_dyn = SC.parex(this.o.SC_cubeAddBehaviorEvt
                     , this.p
                     )
                   , SC.generate(this.o.SC_cubeKillEvt)
                   )
               )
           );
      for(var i = 0 ; i < this.toAdd.length; i++){
        tmp_par_dyn.add(this.toAdd[i]);
        }
      copy.path = path;
      var swap_text = "(function(state, m){";
      if(cells){
        for(var k of cells){
          switch(k.type){
            case 'fun':{
              copy.exposedState[k.id] = copy.o[k.id].bind(copy.exposedState);
              break;
              }
            case 'const':{
              copy.exposedState[k.id] = copy.o[k.id];
              break;
              }
            case 'var':
            default:{
              swap_text += "  this."+k.id
                        +" = state."+k.id
                        +";";
              break;
              }
            }
          }
        }
      swap_text += "})";
      copy.exposedState.__proto__ = copy.o;
      copy.swap = (cells)?eval(swap_text).bind(copy.exposedState, copy.o):NO_FUN;
      copy.init = binder(this.init);
      copy.lastWill = binder(this.lastWill);
      copy.p = tmp_beh.bindTo(engine, parbranch, null
                        , masterSeq, copy, copy.o, copy);
      copy.dynamic = tmp_par_dyn;
      copy.m = engine;
      copy.pb = parbranch;
      return copy;
      }
  , toString : function(){
      return "cube "+this.o.toString()
              +" with "+this.p.toString()
              +" end cube ";
      }
  , its : function(nom){
      return this.o["$"+nom];
      }
  , addCell : function(nom, init, el, fun){
      var tgt = this.o;
      if((undefined !== tgt["$"+nom])
        ||(undefined !== tgt["_"+nom])
        ){
        throw new Error("naming conflict for cell "+nom
               + "$"+nom+" is "+tgt["$"+nom]
               + "_"+nom+" is "+tgt["_"+nom]
               );
      }
      if(undefined !== fun){
        tgt["_"+nom] = fun;
        }
      if(undefined === tgt["_"+nom]){
        throw new Error("no affectator for "+nom+" cell is defined");
        }
      tgt["$"+nom] = new SC_Cell({init:init, sideEffect: (tgt["_"+nom]).bind(tgt), eventList: el});
      Object.defineProperty(tgt, nom,{get : (function(nom){
        return tgt["$"+nom].val();
        }).bind(tgt, nom)});
      }
  };
function SC_CubeActionForever(params){
  this.action = params.fun;
  this.evtList = (params.evtList)?params.evtList:[];
  }
SC_CubeActionForever.prototype = {
  constructor : SC_CubeActionForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.CUBE_ACTION_FOREVER_INIT);
      copy.action = binder(this.action);
      copy.evtList = [];
      for(var i = 0; i < this.evtList.length; i++){
        copy.evtList.push(binder(this.evtList[i]));
        }
      copy._action = this.action;
      copy._evtList = this.evtList;
      copy.closure = _SC.bindIt(copy.action);
      return copy;
      }
  , toString : function(){
      return "call "+((undefined == this.action.f)?" "+this.action+" "
                   :this.action.t+"."+this.action.f+"()")+" forever";
      }
  };
function SC_CubeAction(params){
  if(0 == params.times){
    return SC_Nothing;
    }
  if((undefined === params.times)||(1 == params.times)){
    return new SC_CubeSimpleAction(params);
    }
  if(params.times < 0){
    return new SC_CubeActionForever(params);
    }
  this.count = this.times = params.times;
  this.action = params.fun;
  this.evtList = (params.evtList)?params.evtList:[];
  }
SC_CubeAction.prototype = {
  constructor : SC_CubeAction
  , isAnSCProgram : true
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
    var binder = _SC._b(cube);
    var times = binder(this.times);
    if(0 == times){
      return SC_Nothing;
      }
    if((undefined === times)||(1 == times)){
      return new SC_CubeSimpleAction(this.action)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      }
    if(times < 0){
      return new SC_CubeActionForever(this.action)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube, cinst);
      }
    var copy = new SC_Instruction(SC_Opcodes.CUBE_ACTION_N_TIMES_INIT);
    copy.action = binder(this.action);
    copy._action = this.action;
    copy._times = this.times;
    if("function" == typeof times){
      Object.defineProperty(copy, "times",{get : times});
      }
    else{
      copy.times = times;
      }
    if(copy.action.f && copy.action.t){
      copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
      }
    else{
      copy.closure = copy.action.bind(cube);
      }
    copy.evtList = [];
    for(var i = 0; i < this.evtList.length; i++){
      copy.evtList.push(binder(this.evtList[i]));
      }
    copy._evtList = this.evtList;
    return copy;
    }
  , toString : function(){
      return "call "+((undefined == this.action.f)?"call("+this.action+") "
                   :this.action.t+"."+this.action.f+"() ")
                   +((this.times>1)?(this.count+"/"+this.times+" times "):" ");
      }
}
function SC_CubeSimpleAction(params){
  this.action = params.fun;
  this.evtList = (params.evtList)?params.evtList:[];
  }
SC_CubeSimpleAction.prototype={
  constructor : SC_CubeSimpleAction
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.CUBE_ACTION);
      copy.action = binder(this.action);
      copy._action = this.action;
      if(copy.action.f && copy.action.t){
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
        }
      else{
        copy.closure = copy.action.bind(cube);
        }
      copy.evtList = [];
      for(var i = 0; i < this.evtList.length; i++){
        copy.evtList.push(binder(this.evtList[i]));
        }
      return copy;
      }
  , toString : function(){
      return "call "+((undefined == this.action.f)?"call("+this.action+") "
                   :this.action.t+"."+this.action.f+"() ");
      }
}
function SC_ValueWrapper(tgt, n){
  this.tgt = tgt;
  this.n = n;
  }
SC_ValueWrapper.prototype.getVal = function(){
  return this.tgt[this.n];
  }
var nextMachineID = 0;
function SC_ReactiveInterface(){
  };
SC_ReactiveInterface.prototype = {
  constructor: SC_ReactiveInterface
, sensorValueOf : function(sensorID){
    if(sensorID instanceof SC_SensorId){
      let val = this.all[sensorID.name];
      return val?val[0]:undefined;
      }
    throw new Error("ask for value of non sensor ID");
    }
};
function SC_Machine(params){
  if(undefined == performance){
    performance = {now:function(){
                 return new Date().getTime();
                 }
               };
    }
  Object.defineProperty(this, "sensorId"
           , { value: params.sensorId
             , writable: false
             }
           );
  Object.defineProperty(this, "id"
           , { value: "@_"+nextMachineID++
             , writable: false
             }
           );
  this.prg = new SC_Par([]).bindTo(this, null, null, null, null, null,null);
  this.instantNumber = 1;
  this.ended = false;
  this.toContinue = false;
  this.burstMode = false;
  this.eventID = 0;
  this.permanentActions = [];
  this.permanentGenerate = [];
  this.permanentActionsOn = [];
  this.permanentActionsOnOnly = [];
  this.permanentCubeActions = [];
  this.actions = [];
  this.actionsOnEvents = [];
  this.cells = [];
  this.generated_values = {};
  this.pending = [];
  this.burstState = [];
  this.pendingSensors = [];
  this.pendingPrograms = [];
  this.parActions = [];
  this.name = ((undefined === params)||(undefined === params.name))?"machine_"+SC.count:params.name;
  SC_cubify.apply(this);
  this.prg.cube = this;
  this.stdOut = NO_FUN;
  if(undefined != params){
    this.setStdOut(params.sortie);
    }
  this.traceEvt = new SC_Event({name:"traceEvt"});
  if(undefined != params && undefined != params.init){
    this.addProgram(params.init);
    }
  else{
    this.addProgram(SC.pauseForever());
    }
  this.ips = 0;
  this.reactMeasuring = 0;
  this.environment = {};
  this.reactInterface = new SC_ReactiveInterface();
  this.reactInterface.getIPS = this.getIPS.bind(this);
  this.reactInterface.getInstantNumber = this.getInstantNumber.bind(this);
  this.reactInterface.getTopLevelParallelBranchesNumber = this.getTopLevelParallelBranchesNumber.bind(this);
  this.reactInterface.addToOwnEntry = function(evtName, value){
      if(evtName instanceof SC_EventId){
        this.addEntry(evtName, value);
        }
      else{
        throw new Error("invalid event Id : "+evtName);
        }
      }.bind(this);
  this.reactInterface.addToOwnProgram = function(prg){
    if(prg.isAnSCProgram){
      this.addProgram(prg);
      }
    else{
      throw new Error("invalid program : "+prg);
      }
    }.bind(this);
  Object.defineProperty(this.reactInterface, "continue"
           , {get: function(){
                      return this.continue;
                      }.bind(this)
             }
           );
  Object.defineProperty(this.reactInterface, "this.burstMode"
           , {get: function(){
                      return this.this.burstMode;
                      }.bind(this)
             }
           );
  Object.defineProperty(this.reactInterface, "all"
           , {get : function(){
                      return this.generated_values;
                      }.bind(this)
             }
           );
  Object.defineProperty(this.reactInterface, "id"
           , { get : function(){
                      return this.id;
                      }.bind(this)
             }
           );
  SC_registeredMachines.push(this);
  };
SC_Machine.prototype = {
  constructor : SC_Machine
, toString: function(){
    return this.id;
    }
, enablePrompt: function(flag){
    this.promptEnabled = flag;
    }
, setStdOut : function(stdout){
    this.stdOut = NO_FUN;
    if((undefined != stdout)&&("function" == typeof(stdout))){
      this.stdOut = stdout;
      }
    }
, addEntry : function(evtId, val){
    const evt = this.getEvent(evtId);
    this.pending.push({e:evt, v:val});
    }
, addProgram : function(p){
    this.pendingPrograms.push(p);
    }
, getInstantNumber : function(){
    return this.instantNumber;
    }
, getTopLevelParallelBranchesNumber : function(){
    return this.prg.branches.length;
    }
, getIPS : function(){
    return this.ips;
    }
, collapse : function(){
    this.prg = null;
    this.promptEnabled = false;
    this.whenGettingThread = null;
    this.permanentActions = null;
    this.permanentGenerate = null;
    this.permanentActionsOn = null;
    this.permanentActionsOnOnly = null;
    this.cubeActions = null;
    this.permanentCubeActions = null;
    this.lastWills = null
    this.actions = null;
    this.actionsOnEvents = null;
    this.cells = null;
    this.pending = null;
    this.pendingSensors = null;
    this.pendingPrograms = null;
    this.parActions = null;
    this.stdOut = NO_FUN;
    this.traceEvt = null;
    this.environment = null;
    if(this.timer != 0){
      clearInterval(this.timer);
      this.timer = 0;
      }
    this.addProgram = NO_FUN;
    this.addEntry = NO_FUN;
    this.getTopLevelParallelBranchesNumber = function(){ return 0; };
    }
, getEvent : function(id){
    var res = this.environment[id];
    if(undefined === res){
      this.environment[id] = res = new SC_Event(id, this);
      }
    else if(!(res instanceof SC_Event)){
      throw new Error("invalid event type");
      }
    return res;
    }
, getSensor : function(id){
    var res = this.environment[id];
    if(undefined === res){
      this.environment[id] = res = new SC_Sensor(id);
      }
    else if(!(res instanceof SC_Sensor)){
      throw new Error("invalid sensor type");
      }
    return res;
    }
, sampleSensor: function(sensId){
    this.pendingSensors[sensId] = {s:sensId,v:sensId.getValue()};
    }
, addCellFun : function(aCell){
    this.cells.push(aCell);
    }
, addEvtFun : function(f){
    this.actionsOnEvents.push(f);
    }
, addPermanentGenerate : function(inst, genVal){
    const evt = inst.evt;
    evt.permanentGenerators.push(inst);
    evt.permanentValuatedGenerator += genVal;
    const t = this.permanentGenerate.indexOf(evt);
    if(0 > t){
      this.permanentGenerate.push(evt);
      }
    }
, removeFromPermanentGenerate : function(inst, genVal){
    const evt = inst.evt;
    const t = evt.permanentGenerators.indexOf(inst);
    if(t > -1){
      evt.permanentGenerators.splice(t, 1);
      evt.permanentValuatedGenerator -= genVal;
      }
    if(0 == evt.permanentGenerators.length){
      const te = this.permanentGenerate.indexOf(evt);
      this.permanentGenerate.splice(te, 1);
      }
    }
, addPermanentFun : function(fun){
    this.permanentActions.push(fun);
    }
, removeFromPermanent : function(fun){
    var t = this.permanentActions.indexOf(fun);
    if(t > -1){
      this.permanentActions.splice(t,1);
      }
    }
, addPermanentActionOnOnly : function(inst){
    this.permanentActionsOnOnly.push(inst);
    }
, removeFromPermanentActionsOnOnly : function(inst){
    var t = this.permanentActionsOnOnly.indexOf(inst);
    if(t > -1){
      this.permanentActionsOnOnly.splice(t,1);
      }
    }
, addPermanentActionOn : function(inst){
    this.permanentActionsOn.push(inst);
    }
, removeFromPermanentActionsOn : function(inst){
    var t = this.permanentActionsOn.indexOf(inst);
    if(t > -1){
      this.permanentActionsOn.splice(t,1);
      }
    }
, addCubeFun : function(inst){
    this.cubeActions.push(inst);
    }
, addPermanentCubeFun : function(inst){
    this.permanentCubeActions.push(inst);
    }
, removeFromPermanentCube : function(inst){
    var t = this.permanentCubeActions.indexOf(inst);
    if(t > -1){
      this.permanentCubeActions.splice(t,1);
      }
    }
, addFun : function(fun){
    this.actions.push(fun);
    }
, addDynPar : function(p){
    this.parActions.push(p);
    }
, react : function(){
   if(this.ended){ return !this.ended; }
    this.generated_values = {};
    var res = SC_Instruction_State.STOP;
    if(this.toContinue){
      this.burstMode = true;
      this.toContinue = false;
      }
    else{
      this.burstState = this.pendingSensors;
      this.pendingSensors={};
      }
    for(var n in this.burstState){
      const p = this.burstState[n];
      const sens = this.getSensor(p.s);
      if(sens){
        sens.systemGen(p.v, this, true);
        }
      }
    var tmp = this.pending;
    this.pending=[];
    for(var n in tmp){
      tmp[n].e.generateInput(this, tmp[n].v);
      }
    for(var n in this.permanentGenerate){
      const evt = this.permanentGenerate[n];
      evt.generate(this, evt.permanentValuatedGenerator > 0);
      }
    tmp = this.pendingPrograms;
    this.pendingPrograms = [];
    for(var i in tmp){
      this.prg.addBranch(tmp[i], null, this);
      }
    this.actions = [];
    this.cubeActions = [];
    this.actionsOnEvents = [];
    this.cells = [];
    this.lastWills = [];
    this.parActions = [];
    if(this.promptEnabled){
      this.stdOut("\n"+this.instantNumber+" -: ");
      }
    while(SC_Instruction_State.SUSP == (res = this.activate())){
      }
    if((SC_Instruction_State.OEOI == res)||(SC_Instruction_State.WEOI == res)){
      this.eoi();
      res = SC_Instruction_State.STOP;
      }
    this.reactInterface.getValuesOf = function(evtID){
      if(evtID instanceof SC_EventId){
        return this.all[evtID.name];
        }
      throw new Error("ask for values of non event ID");
      };
    this.reactInterface.presenceOf = function(id){
      if(id instanceof SC_EventId){
        return this.getEvent(id).isPresent(this);
        }
      else if(id instanceof SC_SensorId){
        return this.getSensor(id).isPresent(this);
        }
      }.bind(this);
    this.prg.generateValues(this);
    for(var cell in this.cells){
      this.cells[cell].prepare(this);
      }
    for(var i = 0; i < this.actionsOnEvents.length; i++){
      var act = this.actionsOnEvents[i];
      var a = act.action;
      if(null != a.f){
        var t = a.t;
        if(null == t) continue;
        t[a.f].call(t, this.generated_values, this.reactInterface);
        }
      else{
        a(this.generated_values, this.reactInterface);
        }
      }
    for(var i = 0; i < this.permanentActionsOnOnly.length; i++){
      const inst = this.permanentActionsOnOnly[i];
      const pres = inst.evtFun.config.isPresent(this);
      if(pres){
        const a = inst.evtFun.action;
        if(null != a.f){
          var t = a.t;
          if(null == t) continue;
          t[a.f].call(t, this.generated_values, this.reactInterface);
          }
        else{
          a(this.generated_values, this.reactInterface);
          }
        }
      }
    for(var i = 0; i < this.permanentActionsOn.length; i++){
      const inst = this.permanentActionsOn[i];
      const pres = inst.evtFun.config.isPresent(this);
      if(pres){
        const a = inst.evtFun.action;
        if(null != a.f){
          const t = a.t;
          if(null == t) continue;
          t[a.f].call(t, this.generated_values, this.reactInterface);
          }
        else{
          a(this.generated_values, this.reactInterface);
          }
        }
      else if(SC_Opcodes.ACTION_ON_EVENT_FOREVER_HALTED == inst.oc){
        const act = inst.defaultAct;
        if(null != act.f){
          const t = act.t;
          if(null == t) continue;
          t[act.f].call(t, this.reactInterface);
          }
        else{
          act(this.reactInterface);
          }
        }
      }
    const cal = this.cubeActions.length;
    for(var i = 0; i < cal; i++){
      const inst = this.cubeActions[i];
      inst.closure(this.reactInterface);
      }
    const pcal = this.permanentCubeActions.length;
    for(var i = 0; i < pcal; i++){
      const inst = this.permanentCubeActions[i];
      inst.closure(this.reactInterface);
      }
    for(var i = 0; i < this.actions.length; i++){
      var act = this.actions[i];
      if(null != act.f){
        var t = act.t;
        if(null == t) continue;
        t[act.f].call(t, this.reactInterface);
        }
      else{
        act(this.reactInterface);
        }
      }
    for(var i = 0; i < this.permanentActions.length; i++){
      var act = this.permanentActions[i];
      if(null != act.f){
        var t = act.t;
        if(null == t) continue;
        t[act.f].call(t, this.reactInterface);
        }
      else{
        act(this.reactInterface);
        }
      }
    for(var cell in this.cells){
      this.cells[cell].swap();
      }
    for(var i = 0; i < this.parActions.length; i++){
      this.parActions[i].computeAndAdd(this);
      }
    for(var will of this.lastWills){
      will(this.reactInterface);
      }
    if(this.traceEvt.isPresent(this)){
      if(undefined != this.dumpTraceFun){
        this.dumpTraceFun(this.traceEvt.getValues(this));
        }
      else{
        console.log.call(console, this.traceEvt.getValues(this));
        }
      }
    this.instantNumber++;
    if(0 == this.instantNumber%256){
      if(0 != this.reactMeasuring){
        const now = performance.now();
        this.ips = Math.floor(256*10000.0
                          /(now-this.reactMeasuring))/10.0;
        this.reactMeasuring = now;
      }
      else{
        this.reactMeasuring = performance.now();
        }
      }
    this.ended = (res == SC_Instruction_State.TERM);
    if(this.ended){
      this.collapse();
      }
    this.reactInterface.getValuesOf = NO_FUN;
    this.reactInterface.presenceOf = NO_FUN;
    this.burstMode = false;
    return !this.ended;
    }
  , activate : function(){
      var st = SC_Instruction_State.SUSP;
      var inst = this.prg;
      var seq = null;
      var control_body = false;
      var caller = act_exit;
      while(true){
ACT:    switch(inst.oc){
          case SC_Opcodes._EXIT:{
            return st;
            }
          case SC_Opcodes.REL_JUMP:{
            seq.idx += inst.relativeJump;
            inst = seq.seqElements[seq.idx];
            break;
            }
          case SC_Opcodes.REPEAT_FOREVER:{
            inst.oc = SC_Opcodes.REPEAT_FOREVER_TO_STOP;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
            inst.oc = SC_Opcodes.REPEAT_FOREVER;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER:{
            inst.oc = SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER_TO_STOP;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER_TO_STOP:{
            inst.oc = SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.REPEAT_N_TIMES_INIT:{
            inst.count = inst.it;
            if(0 > inst.count){
              inst.oc = SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER;
              break;
              }
            if(0 == inst.count){
              seq.idx += inst.end;
              inst = seq.seqElements[seq.idx];
              break;
              }
            }
          case SC_Opcodes.REPEAT_N_TIMES:{
            inst.oc = SC_Opcodes.REPEAT_N_TIMES_TO_STOP;
            inst.count--;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
            if(0 === inst.count){
              seq.idx += inst.end;
              inst.oc = SC_Opcodes.REPEAT_N_TIMES_INIT;
              inst = seq.seqElements[seq.idx];
              break;
              }
            inst.oc = SC_Opcodes.REPEAT_N_TIMES;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.IF_REPEAT_INIT:{
            if(!inst.condition(this)){
              seq.idx += inst.end;
              inst = seq.seqElements[seq.idx];
              break;
              }
            }
          case SC_Opcodes.IF_REPEAT:{
            inst.oc = SC_Opcodes.IF_REPEAT_TO_STOP;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.IF_REPEAT_TO_STOP:{
            if(!inst.condition(this)){
              seq.idx += inst.end;
              inst.oc = SC_Opcodes.IF_REPEAT_INIT;
              inst = seq.seqElements[seq.idx];
              break;
              }
            inst.oc = SC_Opcodes.IF_REPEAT;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_INLINE:{
            this.addCubeFun(inst);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.CUBE_ACTION:{
            this.addCubeFun(inst);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER:{
            this.addPermanentCubeFun(inst);
            st = SC_Instruction_State.HALT;
            inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:{
            this.addPermanentCubeFun(inst);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT_INLINE:{
            inst.count = inst.times;
            if(inst.count == 0){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE:{
            this.addCubeFun(inst);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              }
            else{
              st = SC_Instruction_State.STOP;
              inst = caller;
              }
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER:{
            this.addPermanentCubeFun(inst);
            st = SC_Instruction_State.HALT;
            inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_HALTED;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_CONTROLED:{
            this.addCubeFun(inst);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT:{
            inst.count = inst.times;
            if(inst.count == 0){
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES:{
            this.addCubeFun(inst);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INIT;
              st = SC_Instruction_State.TERM;
              }
            else{
              st = SC_Instruction_State.STOP;
              }
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.CUBE_ACTION_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.CUBE_ACTION_FOREVER:{
            this.addPermanentCubeFun(inst);
            st = SC_Instruction_State.HALT;
            inst.oc = SC_Opcodes.CUBE_ACTION_FOREVER_HALTED;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_FOREVER_CONTROLED:{
            this.addCubeFun(inst);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_INLINE:{
            this.addFun(inst.closure);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.ACTION:{
            this.addFun(inst.closure);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER:{
            this.addPermanentFun(inst.closure);
            st = SC_Instruction_State.HALT;
            inst.oc = SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:{
            this.addFun(inst.closure);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INIT_INLINE:{
            inst.count = inst.times;
            if(inst.count == 0){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_N_TIMES_INLINE;
            }
          case SC_Opcodes.ACTION_N_TIMES_INLINE:{
            this.addFun(inst.closure);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.ACTION_N_TIMES_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              }
            else{
              st = SC_Instruction_State.STOP;
              inst = caller;
              }
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER:{
            this.addPermanentFun(inst.closure);
            st = SC_Instruction_State.HALT;
            inst.oc = SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_HALTED;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_CONTROLED:{
            this.addFun(inst.closure);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INIT:{
            inst.count = inst.times;
            if(inst.count == 0){
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_N_TIMES;
            }
          case SC_Opcodes.ACTION_N_TIMES:{
            this.addFun(inst.closure);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.ACTION_N_TIMES_INIT;
              st = SC_Instruction_State.TERM;
              }
            else{
              st = SC_Instruction_State.STOP;
              }
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.ACTION_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.ACTION_FOREVER:{
            this.addPermanentFun(inst.closure);
            st = SC_Instruction_State.HALT;
            inst.oc = SC_Opcodes.ACTION_FOREVER_HALTED;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_FOREVER_CONTROLED:{
            this.addFun(inst.closure);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.SEQ_INIT:{
            inst.caller = caller;
            inst.seq = seq;
            }
          case SC_Opcodes.SEQ:{
            caller = seq = inst;
            inst.oc = SC_Opcodes.SEQ_BACK;
            inst = inst.seqElements[inst.idx];
            break;
            }
          case SC_Opcodes.SEQ_BACK:{
            if(SC_Instruction_State.TERM == st){
              if(inst.idx >= inst.max){
                inst.oc = SC_Opcodes.SEQ;
                inst.idx = 0;
                }
              else{
                caller = seq = inst;
                inst = inst.seqElements[++inst.idx];
                break;
                }
              }
            else{
              inst.oc = SC_Opcodes.SEQ;
              }
            seq = inst.seq
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.SEQ_ENDED:{
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.HALT:{
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_INLINE:{
            st = SC_Instruction_State.STOP;
            seq.idx++;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE:{
            inst.oc = SC_Opcodes.PAUSE_DONE;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_DONE:{
            inst.oc = SC_Opcodes.PAUSE;
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_UNTIL_DONE:{
            st = SC_Instruction_State.TERM;
            inst.oc = SC_Opcodes.PAUSE_UNTIL;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_UNTIL:{
            st = SC_Instruction_State.OEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE:{
            inst.oc = SC_Opcodes.PAUSE_N_TIMES_INLINE;
            inst.count = inst.times;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INLINE:{
            if(0 == inst.count){
              inst.oc = SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.count--;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT:{
            inst.oc = SC_Opcodes.PAUSE_N_TIMES;
            inst.count = inst.times;
            }
          case SC_Opcodes.PAUSE_N_TIMES:{
            if(0 == inst.count){
              inst.oc = SC_Opcodes.PAUSE_N_TIMES_INIT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            inst.count--;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.NEXT_INLINED:{
            this.toContinue = true;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.NEXT:{
            this.toContinue = true;
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.NOTHING_INLINED:{
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.NOTHING:{
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_NO_VAL_INLINE:{
            inst.evt.generate(this);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.GENERATE_ONE_NO_VAL:{
            inst.evt.generate(this);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_EXPOSE_INLINE:
          case SC_Opcodes.GENERATE_ONE_CELL_INLINE:
          case SC_Opcodes.GENERATE_ONE_FUN_INLINE:
          case SC_Opcodes.GENERATE_ONE_INLINE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.GENERATE_ONE_EXPOSE:
          case SC_Opcodes.GENERATE_ONE_CELL:
          case SC_Opcodes.GENERATE_ONE_FUN:
          case SC_Opcodes.GENERATE_ONE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_NO_VAL_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FOREVER_NO_VAL_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FOREVER_NO_VAL:{
            inst.evt.generate(this);
            this.addPermanentGenerate(inst, 0);
            inst.oc = SC_Opcodes.GENERATE_FOREVER_NO_VAL_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_NO_VAL_CONTROLED:{
            inst.evt.generate(this);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FOREVER:{
            inst.itsParent.registerForProduction(inst,true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FOREVER_EXPOSE_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE:{
            inst.itsParent.registerForProduction(inst,true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_FOREVER_EXPOSE_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_FUN_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FOREVER_FUN_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FOREVER_FUN:{
            inst.itsParent.registerForProduction(inst,true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_FOREVER_FUN_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_FUN_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_CELL_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FOREVER_CELL_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FOREVER_CELL:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_FOREVER_CELL_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_CELL_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INIT_INLINE:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_EXPOSE_INLINE;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INLINE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_EXPOSE_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_INIT_INLINE:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_FUN_INLINE;
            }
          case SC_Opcodes.GENERATE_FUN_INLINE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_FUN_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_INIT_INLINE:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_CELL_INLINE;
            }
          case SC_Opcodes.GENERATE_CELL_INLINE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_CELL_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_INIT_INLINE:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_INLINE;
            }
          case SC_Opcodes.GENERATE_INLINE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INIT:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_EXPOSE;
            }
          case SC_Opcodes.GENERATE_EXPOSE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_EXPOSE_INIT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_FUN_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_FUN_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_INIT:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_FUN_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_FUN;
            }
          case SC_Opcodes.GENERATE_FUN:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_FUN_INIT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_CELL_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_CELL_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_INIT:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_CELL_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_CELL;
            }
          case SC_Opcodes.GENERATE_CELL:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_CELL_INIT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_BUT_FOREVER_INIT:{
            if(control_body){
              inst.oc = SC_Opcodes.GENERATE_BUT_FOREVER_CONTROLED;
              break;
              }
            }
          case SC_Opcodes.GENERATE_BUT_FOREVER:{
            inst.itsParent.registerForProduction(inst, true);
            inst.evt.generate(this, true);
            this.addPermanentGenerate(inst, 1);
            inst.oc = SC_Opcodes.GENERATE_BUT_FOREVER_HALTED;
            st = SC_Instruction_State.HALT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_BUT_FOREVER_CONTROLED:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_INIT:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            if(inst.count < 0){
              inst.oc = SC_Opcodes.GENERATE_BUT_FOREVER_INIT;
              break;
              }
            inst.oc = SC_Opcodes.GENERATE;
            }
          case SC_Opcodes.GENERATE:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_INIT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INIT_INLINE:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_NO_VAL_INLINE;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INLINE:{
            inst.evt.generate(this);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_NO_VAL_INIT_INLINE;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INIT:{
            inst.count = inst.times;
            if(0 == inst.count){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.oc = SC_Opcodes.GENERATE_NO_VAL;
            }
          case SC_Opcodes.GENERATE_NO_VAL:{
            inst.evt.generate(this);
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.GENERATE_NO_VAL_INIT;
              st = SC_Instruction_State.TERM;
              }
            else{
              st = SC_Instruction_State.STOP;
              }
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT_INLINE:{
            if(inst.config.isPresent(this)){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.AWAIT_REGISTRED_INLINE;
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT_REGISTRED_INLINE:{
            if(inst.config.isPresent(this)){
              inst.oc = SC_Opcodes.AWAIT_INLINE;
              inst.config.unregister(inst);
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT:{
            if(inst.config.isPresent(this)){
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            inst.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.AWAIT_REGISTRED
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT_REGISTRED:{
            if(inst.config.isPresent(this)){
              inst.oc = SC_Opcodes.AWAIT;
              inst.config.unregister(inst);
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.WHEN:{
            if(inst.c.isPresent(this)){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.oc = SC_Opcodes.WHEN_REGISTERED;
            inst.c.registerInst(this, inst);
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.WHEN_REGISTERED:{
            if(inst.c.isPresent(this)){
              inst.oc = SC_Opcodes.WHEN;
              inst.c.unregister(inst);
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.KILL_SUSP_INIT:{
            inst.caller = caller;
            }
          case SC_Opcodes.KILL_SUSP:{
            inst.c.registerInst(this, inst);
            }
          case SC_Opcodes.KILL_SUSP_REGISTERED:{
            caller = inst;
            inst.oc = SC_Opcodes.KILL_BACK;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.KILL_BACK:{
            switch(st){
              case SC_Instruction_State.TERM:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.KILL_SUSP;
                inst.c.unregister(inst);
                seq.idx += inst.end;
                inst = seq.seqElements[seq.idx];
                break ACT;
                }
              case SC_Instruction_State.SUSP:{
                caller = inst;
                inst = inst.p;
                break;
                }
              case SC_Instruction_State.WEOI:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.KILL_WEOI;
                inst = inst.caller;
                break;
                }
              case SC_Instruction_State.OEOI:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.KILL_OEOI;
                st = SC_Instruction_State.WEOI;
                inst = inst.caller;
                break;
                }
              case SC_Instruction_State.STOP:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.KILL_STOP;
                st = SC_Instruction_State.WEOI;
                inst = inst.caller;
                break;
                }
              case SC_Instruction_State.WAIT:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.KILL_WAIT;
                st = (inst.c.isPresent(this))?SC_Instruction_State.WEOI
                                             :SC_Instruction_State.WAIT;
                inst = inst.caller;
                break;
                }
              case SC_Instruction_State.HALT:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.KILL_HALT;
                st = (inst.c.isPresent(this))?SC_Instruction_State.WEOI
                                             :SC_Instruction_State.WAIT;
                inst = inst.caller;
                break;
                }
              default:{
                throw "*** KILL_BACK state pb !"
                }
              }
            break;
            }
          case SC_Opcodes.KILL_WEOI:
          case SC_Opcodes.KILL_WAIT:
          case SC_Opcodes.KILL_HALT:{
            st = SC_Instruction_State.WEOI;
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.KILLED:{
            inst.oc = SC_Opcodes.KILL_SUSP;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.CONTROL_INIT:{
            inst.caller = caller;
            inst.activ_cb = control_body;
            }
          case SC_Opcodes.CONTROL:{
            inst.c.registerInst(this, inst); 
            inst.oc = SC_Opcodes.CONTROL_REGISTERED_CHECK;
            }
          case SC_Opcodes.CONTROL_REGISTERED_CHECK:{
            if(inst.c.isPresent(this)){
              inst.oc = SC_Opcodes.CONTROL_REGISTERED_SUSP;
              }
            else{
              st = SC_Instruction_State.WAIT;
              caller = inst = inst.caller;
              break;
              }
            }
          case SC_Opcodes.CONTROL_REGISTERED_SUSP:{
            control_body = true;
            caller = inst;
            inst.oc = SC_Opcodes.CONTROL_REGISTERED_BACK;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.CONTROL_REGISTERED_BACK:{
            switch(st){
              case SC_Instruction_State.SUSP:{
                inst = inst.p;
                break;
                }
              case SC_Instruction_State.OEOI:
              case SC_Instruction_State.WEOI:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.CONTROL_REGISTERED_EOI;
                st = SC_Instruction_State.WEOI;
                inst = caller;
                break;
                }
              case SC_Instruction_State.STOP:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.CONTROL_REGISTERED_CHECK;
                st = SC_Instruction_State.WAIT;
                inst = caller;
                break;
                }
              case SC_Instruction_State.WAIT:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.CONTROL_REGISTERED_CHECK;
                st = SC_Instruction_State.WAIT;
                inst = caller;
                break;
                }
              case SC_Instruction_State.HALT:{
                caller = inst.caller;
                inst.oc = SC_Opcodes.CONTROL_REGISTERED_HALT;
                st = SC_Instruction_State.WAIT;
                inst = caller;
                break;
                }
              case SC_Instruction_State.TERM:{
                caller = inst.caller;
                inst.c.unregister(inst);
                inst.oc = SC_Opcodes.CONTROL;
                inst = caller;
                break;
                }
              }
            control_body = inst.activ_cb;
            break;
            }
          case SC_Opcodes.TEST:{
            if(!inst.test(this)){
              seq.idx += inst.elsB;
              inst = seq.seqElements[seq.idx];
              break;
              }
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT:{
            if(!control_body){
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_HALTED;
              this.addPermanentActionOnOnly(inst);
              st = SC_Instruction_State.HALT;
              inst = caller;
              break;
              }
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP;
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED;
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER:{
            if(!control_body){
              this.addPermanentActionOn(inst);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_HALTED;
              st = SC_Instruction_State.HALT;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED;
            inst.evtFun.config.registerInst(this, inst);
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_STOP;
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_STOP:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED;
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT:{
            inst.count = inst.times;
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_REGISTERED;
            }
          case SC_Opcodes.ACTION_ON_EVENT_REGISTERED:{
            if(0 == inst.count){
              inst.evtFun.config.unregister(inst);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                inst.evtFun.config.unregister(inst);
                inst.oc = SC_Opcodes.ACTION_ON_EVENT;
                st = SC_Instruction_State.TERM;
                inst = caller;
                break;
                }
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_STOP;
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_STOP:{
            if(0 == inst.count){
              inst.evtFun.config.unregister(inst);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                inst.evtFun.config.unregister(inst);
                inst.oc = SC_Opcodes.ACTION_ON_EVENT;
                st = SC_Instruction_State.TERM;
                inst = caller;
                break;
                }
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_REGISTERED;
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT:{
            inst.count = inst.times;
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED;
            }
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
            if(0 == inst.count){
              inst.evtFun.config.unregister(inst);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                inst.evtFun.config.unregister(inst);
                inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT;
                st = SC_Instruction_State.TERM;
                inst = caller;
                break;
                }
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_STOP;
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_STOP:{
            if(0 == inst.count){
              inst.evtFun.config.unregister(inst);
              inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                inst.evtFun.config.unregister(inst);
                inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT;
                st = SC_Instruction_State.TERM;
                inst = caller;
                break;
                }
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED;
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              inst.evtFun.config.unregister(inst);
              inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.WEOI;
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_REGISTERED;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_REGISTERED:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              inst.evtFun.config.unregister(inst);
              inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
              st = SC_Instruction_State.WEOI;
              inst = caller;
              break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT;
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_ENDED:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT;
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL:{
            if(inst.evt instanceof SC_CubeBinding){
              inst.evt = inst.evt.resolve();
              }
            inst.oc = SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL_RESOLVED;
            }
          case SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL_RESOLVED:{
            inst.evt.generate(this);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_LATE_VAL:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this, true);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_FOREVER_NO_ABS:{
            inst.sensor.registerInst(this, inst);
            inst.oc = SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED;
            }
          case SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this)
                                        , this.reactInterface);
              if(undefined !== inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this, true);
                }
              }
            st = SC_Instruction_State.WAIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_FOREVER:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this)
                                      , this.reactInterface);
              if(undefined !== inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this, true);
                }
              else{
                inst.noSens_evt.generate(this);
                }
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_ONE:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this)
                                      , this.reactInterface);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this, true);
                }
              }
            else{
              inst.noSens_evt.generate(this);
              }
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_ONE_NO_ABS:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this)
                                      , this.reactInterface);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this, true);
                }
              }
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this)
                                      , this.reactInterface);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this, true);
                }
              }
            else{
              inst.noSens_evt.generate(this);
              }
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_NO_ABS_INIT:{
            inst.count = inst.times;            
            inst.oc = SC_Opcodes.FILTER_NO_ABS;
            }
          case SC_Opcodes.FILTER_NO_ABS:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this)
                                      , this.reactInterface);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this, true);
                }
              }
            inst.count--;
            if(0 == inst.count){
              inst.oc = SC_Opcodes.FILTER_NO_ABS_INIT;
              st = SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.SEND:{
            if(inst.count-- > 0){
              this.generateEvent(inst.evt, inst.value);
              st = SC_Instruction_State.STOP;
              inst = caller;
              break;
              }
            inst.count = inst.times;
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.SEND_ONE:{
            this.generateEvent(inst.evt, inst.value);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.SEND_FOREVER:{
            this.generateEvent(inst.evt, inst.value);
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAR_DYN_INIT:{
            inst.caller = caller;
            inst.oc = SC_Opcodes.PAR_DYN_TO_REGISTER;
            }
          case SC_Opcodes.PAR_DYN_TO_REGISTER:{
            inst.channel.registerInst(this, inst);
            inst.tmp = null;
            }
          case SC_Opcodes.PAR_DYN:{
            caller = inst;
            }
          case SC_Opcodes.PAR_DYN_FIRE:{
            if(null != inst.suspended.start){
              inst.oc = SC_Opcodes.PAR_DYN_BACK;
              inst.toActivate = inst.suspended.start;
              inst.suspended.start = inst.suspended.start.next;
              inst = inst.toActivate.prg;
              break;
              }
            caller = inst.caller;
            inst.oc = SC_Opcodes.PAR_DYN;
            if((inst.waittingEOI.start != null) || (inst.stopped.start != null)){
              st = SC_Instruction_State.WEOI;
              inst = caller;
              break;
              }
            if((inst.waitting.start != null) || (inst.halted.start != null)){
              st = inst.channel.isPresent(this)
                               ?SC_Instruction_State.WEOI
                               :SC_Instruction_State.WAIT
                               ;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.TERM;
            inst = inst.caller;
            break;
            }
          case SC_Opcodes.PAR_DYN_BACK:{
            switch(inst.toActivate.flag = st){
              case SC_Instruction_State.SUSP:{
                   inst = inst.toActivate.prg
                   break;
                   }
              case SC_Instruction_State.OEOI:
              case SC_Instruction_State.WEOI:{
                   inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                   inst.waittingEOI.append(inst.toActivate);
                   break;
                   }
              case SC_Instruction_State.STOP:{
                   inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                   inst.stopped.append(inst.toActivate);
                   break;
                   }
              case SC_Instruction_State.WAIT:{
                   inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                   inst.waitting.append(inst.toActivate);
                   break;
                   }
              case SC_Instruction_State.HALT:{
                   inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                   inst.halted.append(inst.toActivate);
                   break;
                   }
              case SC_Instruction_State.TERM:{
                   inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                   if(inst.toActivate.purgeable){
                     inst.removeBranch(inst.toActivate);
                     }
                   else{
                     inst.terminated.append(inst.toActivate);
                     }
                   break;
                   }
              }
            break;
            }
          case SC_Opcodes.PAR_DYN_FORCE : {
            this.reset(inst);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAR_INIT:{
            inst.caller = caller;
            inst.tmp = null;
            }
          case SC_Opcodes.PAR :{
            caller = inst;
            }
          case SC_Opcodes.PAR_FIRE:{
            if(null != inst.suspended.start){
              inst.oc = SC_Opcodes.PAR_BACK;
              inst.toActivate = inst.suspended.start;
              inst.suspended.start = inst.suspended.start.next;
              inst = inst.toActivate.prg;
              break;
              }
            caller = inst.caller;
            inst.oc = SC_Opcodes.PAR;
            if(inst.waittingEOI.start != null){
              st = SC_Instruction_State.WEOI;
              caller = inst = inst.caller;
              break;
              }
            if(inst.stopped.start != null){
              if(inst.waitting.start == null){
                var t = inst.suspended;
                inst.suspended = inst.stopped;
                inst.stopped = t;
                inst.suspended.setFlags(SC_Instruction_State.SUSP);
                st = SC_Instruction_State.STOP;
                caller = inst = inst.caller;
                break;
                }
              st = SC_Instruction_State.WEOI;
              caller = inst = inst.caller;
              break;
              }
            if(inst.waitting.start != null){
              st = SC_Instruction_State.WAIT;
              caller = inst = inst.caller;
              break;
              }
            if(inst.halted.start != null){
              st = SC_Instruction_State.HALT;
              caller = inst = inst.caller;
              break;
              }
            this.reset(inst);
            st = SC_Instruction_State.TERM;
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.PAR_BACK:{
            switch(inst.toActivate.flag = st){
              case SC_Instruction_State.SUSP:{
                inst = inst.toActivate.prg;
                break;
                }
              case SC_Instruction_State.OEOI:
              case SC_Instruction_State.WEOI:{
                inst.oc = SC_Opcodes.PAR_FIRE;
                inst.waittingEOI.append(inst.toActivate);
                break;
                }
              case SC_Instruction_State.STOP:{
                inst.oc = SC_Opcodes.PAR_FIRE;
                inst.stopped.append(inst.toActivate);
                break;
                }
              case SC_Instruction_State.WAIT:{
                inst.oc = SC_Opcodes.PAR_FIRE;
                inst.waitting.append(inst.toActivate);
                break;
                }
              case SC_Instruction_State.HALT:{
                inst.oc = SC_Opcodes.PAR_FIRE;
                inst.halted.append(inst.toActivate);
                break;
                }
              case SC_Instruction_State.TERM:{
                inst.oc = SC_Opcodes.PAR_FIRE;
                if(inst.toActivate.purgeable){
                  inst.removeBranch(inst.toActivate);
                  }
                else{
                  inst.terminated.append(inst.toActivate);
                  }
                break;
                }
              }
            break;
            }
          case SC_Opcodes.PAUSE_RT_INIT:{
            inst.startTime = performance.now();
            inst.oc = SC_Opcodes.PAUSE_RT;
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_RT:{
            if(performance.now() - inst.startTime > inst.duration){
              inst.oc = SC_Opcodes.PAUSE_RT_INIT;
              st =  SC_Instruction_State.TERM;
              inst = caller;
              break;
              }
            st = SC_Instruction_State.STOP;
            inst = caller;
            break;
            }
          case SC_Opcodes.MATCH_INIT:{
            inst.caller = caller;
            }
          case SC_Opcodes.MATCH:{
            var val = parseInt((null == inst.v.t)
                                   ?eval(inst.v.f):inst.v.t[inst.v.f]);
            inst.choice = inst.cases[val];
            if(undefined == inst.choice){
              inst.choice = SC_Nothing;
              }
            }
          case SC_Opcodes.MATCH_CHOOSEN:{
            caller = inst;
            inst.oc = SC_Opcodes.MATCH_BACK;
            inst = inst.choice;
            break;
            }
          case SC_Opcodes.MATCH_BACK:{
            inst.oc = SC_Opcodes.MATCH_CHOOSEN;
            if(SC_Instruction_State.TERM == st){
              inst.choice = null;
              inst.oc = SC_Opcodes.MATCH;
              }
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.CUBE_ZERO:{
            inst.caller = caller;
            }
          case SC_Opcodes.CUBE_INIT:{
            inst.init.call(inst.o, this);
            inst.swap(this);
            }
          case SC_Opcodes.CUBE:{
            caller = inst;
            inst.oc = SC_Opcodes.CUBE_BACK;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.CUBE_BACK:{
            inst.oc = SC_Opcodes.CUBE;
            if(SC_Instruction_State.TERM == st){
              this.lastWills.push(inst.lastWill);
              }
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.CELL:
          case SC_Opcodes.RE_CELL:{
            if(inst.TODO != this.getInstantNumber()){
              inst.TODO = this.getInstantNumber();
              this.addCellFun(inst);
            }
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_CELL_INIT:{
            inst.caller = caller;
            inst.cell = inst.cube[inst.cellName];
            }
          case SC_Opcodes.CUBE_CELL:{
            caller = inst;
            if(undefined != inst.cell){
              inst.oc = SC_Opcodes.CUBE_CELL_BACK;
              inst = inst.cell;
              break;
              }
            }
          case SC_Opcodes.CUBE_CELL_BACK:{
            inst.oc = SC_Opcodes.CUBE_CELL;
            if(SC_Instruction_State.TERM == st){
              inst.oc = SC_Opcodes.CUBE_CELL;
              }
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.LOG:{
            this.stdOut(inst.msg);
            st = SC_Instruction_State.TERM;
            inst = caller;
            break;
            }
          default:{ throw "activate: undefined opcode "
                         +SC_Opcodes.toString(inst.oc)
                         ;
            console.trace();
            }
          }
        }
      }
  , eoi: function(){
      var inst = this.prg;
      var seq = null;
      var caller = act_exit;
      while(true){
EOI:    switch(inst.oc){
          case SC_Opcodes._EXIT:{
            return;
            }
          case SC_Opcodes.SEQ:{
            caller = seq = inst;
            inst.oc = SC_Opcodes.SEQ_BACK;
            inst = inst.seqElements[inst.idx];
            break;
            }
          case SC_Opcodes.SEQ_BACK:{
            inst.oc = SC_Opcodes.SEQ;
            seq = inst.seq
            caller = inst = inst.caller;
            break;
            }
          case SC_Opcodes.WHEN_REGISTERED:{
            seq.idx += inst.elsB;
            inst.oc = SC_Opcodes.WHEN;
            inst.c.unregister(inst);
            inst = caller;
            break;
            }
          case SC_Opcodes.KILL_SUSP_REGISTERED:
          case SC_Opcodes.KILL_OEOI:
          case SC_Opcodes.KILL_WEOI:{
            inst.oc = SC_Opcodes.KILL_STOP;
            caller = inst;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.KILL_STOP:{
            if(inst.c.isPresent(this)){
              inst.oc = SC_Opcodes.KILLED;
              this.reset(inst.p);
              inst.c.unregister(inst);
              }
            else{
              inst.oc = SC_Opcodes.KILL_SUSP_REGISTERED;
              }
            inst = caller = inst.caller;
            break;
            }
          case SC_Opcodes.KILL_HALT:
          case SC_Opcodes.KILL_WAIT:{
            if(inst.c.isPresent(this)){
              inst.oc = SC_Opcodes.KILLED;
              inst.c.unregister(inst);
              this.reset(inst.p);
              }
            inst = caller = inst.caller;
            break;
            }
          case SC_Opcodes.CONTROL_REGISTERED_EOI:{
            caller = inst;
            inst.oc = SC_Opcodes.CONTROL_REGISTERED_BACK;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.CONTROL_REGISTERED_BACK:{
            inst.oc = SC_Opcodes.CONTROL_REGISTERED_CHECK;
            inst = caller = inst.caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED:{
            this.addFun(inst.defaultAct);
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_REGISTERED:{
            this.addFun(inst.defaultAct);
            }
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
            if(inst.count > 0){
              inst.count--;
              }
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_REGISTERED:{
            this.addFun(inst.defaultAct);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_ENDED;
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_UNTIL:{
            if(inst.cond(this.reactInterface)){
              inst.oc = SC_Opcodes.PAUSE_UNTIL_DONE;
              }
            inst = caller;
            break;
            }
          case SC_Opcodes.PAR_DYN:{
            if(null != inst.tmp){
              inst.suspended.append(inst.tmp);
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              caller = inst;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.stopped.pop();
            while(null != tmp){
              tmp.flag = SC_Instruction_State.SUSP;
              inst.suspended.append(tmp);
              tmp = inst.stopped.pop();
              }
            if(inst.channel.isPresent(this)){
              this.addDynPar(inst);
              }
            else{
              if(inst.suspended.isEmpty()
                && inst.waitting.isEmpty()
                && inst.halted.isEmpty()
                ){
                  inst.oc = SC_Opcodes.PAR_DYN_FORCE;
                }
              }
            inst = caller = inst.caller;
            break;
            }
          case SC_Opcodes.PAR:{
            if(null != inst.tmp){
              inst.suspended.append(inst.tmp);
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              caller = inst;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.stopped.pop();
            while(null != tmp){
              tmp.flag = SC_Instruction_State.SUSP;
              inst.suspended.append(tmp);
              tmp = inst.stopped.pop();
              }
            inst = caller = inst.caller;
            break;
            }
          case SC_Opcodes.MATCH_CHOOSEN:{
            caller = inst;
            inst.oc = SC_Opcodes.MATCH_BACK;
            inst = inst.choice;
            break;
            }
          case SC_Opcodes.MATCH_BACK:{
            inst.oc = SC_Opcodes.MATCH_CHOOSEN;
            inst = caller = inst.caller;
            break;
            }
          case SC_Opcodes.CUBE:{
            caller = inst;
            inst.oc = SC_Opcodes.CUBE_BACK;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.CUBE_BACK:{
            inst.oc = SC_Opcodes.CUBE;
            inst = caller = inst.caller;
            break;
            }
          default:{ throw "eoi: undefined opcode "
                         +SC_Opcodes.toString(inst.oc)
                         ;
            console.trace();
            }
          }
        }
      }
  , reset: function(inst){
      var caller = act_exit;
      var oldInstOC = null;
      while(true){
RST:    switch(oldInstOC = inst.oc){
          case SC_Opcodes._EXIT:{
            return;
            }
          case SC_Opcodes.REL_JUMP:
          case SC_Opcodes.REPEAT_FOREVER:{
            inst = caller;
            break;
            }
          case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
            inst.oc = SC_Opcodes.REPEAT_FOREVER;
            inst = caller;
            break;
            }
          case SC_Opcodes.REPEAT_N_TIMES_INIT:
          case SC_Opcodes.REPEAT_N_TIMES:
          case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER:
          case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER_TO_STOP:
          case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
            inst.oc = SC_Opcodes.REPEAT_N_TIMES_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.IF_REPEAT_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.IF_REPEAT_TO_STOP:
          case SC_Opcodes.IF_REPEAT:{
            inst.oc = SC_Opcodes.IF_REPEAT_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
            inst.oc = SC_Opcodes.REPEAT_N_TIMES_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_INLINE:
          case SC_Opcodes.ACTION:{
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.ACTION_N_TIMES_INIT_INLINE:
          case SC_Opcodes.ACTION_N_TIMES_INLINE:{
            inst.oc = SC_Opcodes.ACTION_N_TIMES_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INIT:
          case SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_HALTED:
          case SC_Opcodes.ACTION_N_TIMES:{
            inst.oc = SC_Opcodes.ACTION_N_TIMES_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_FOREVER_HALTED:{
            inst.oc = SC_Opcodes.ACTION_FOREVER;
            this.removeFromPermanent(inst.closure)
            this.addFun(inst.closure)
            }
          case SC_Opcodes.ACTION_FOREVER_CONTROLED:
          case SC_Opcodes.ACTION_FOREVER:{
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_INLINE:
          case SC_Opcodes.CUBE_ACTION:{
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT_INLINE:
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE:{
            inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT:
          case SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_HALTED:
          case SC_Opcodes.CUBE_ACTION_N_TIMES:{
            inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_FOREVER_HALTED:{
            inst.oc = SC_Opcodes.CUBE_ACTION_FOREVER;
            this.removeFromPermanentCube(inst)
            }
          case SC_Opcodes.CUBE_ACTION_FOREVER_CONTROLED:
          case SC_Opcodes.CUBE_ACTION_FOREVER:{
            inst = caller;
            break;
            }
          case SC_Opcodes.SEQ:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = SC_Opcodes.SEQ_BACK;
            inst = inst.seqElements[inst.idx];
            break;
            }
          case SC_Opcodes.SEQ_BACK:{
            inst.oc = SC_Opcodes.SEQ;
            inst.idx = 0;
            inst = caller = inst.resetCaller;
            break;
            }
          case SC_Opcodes.PAUSE_UNTIL_DONE:{
            inst.oc = SC_Opcodes.PAUSE_UNTIL;
            }
          case SC_Opcodes.SEQ_ENDED:
          case SC_Opcodes.HALT:
          case SC_Opcodes.PAUSE_UNTIL:{
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_INLINE:
          case SC_Opcodes.PAUSE:{
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_DONE:{
            inst.oc = SC_Opcodes.PAUSE;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE:{
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INLINE:{
            inst.oc = SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES:{
            inst.oc = SC_Opcodes.PAUSE_N_TIMES_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.NEXT:
          case SC_Opcodes.NEXT_INLINED:
          case SC_Opcodes.NOTHING:
          case SC_Opcodes.NOTHING_INLINED:
          case SC_Opcodes.GENERATE_ONE_NO_VAL_INLINE:
          case SC_Opcodes.GENERATE_ONE_NO_VAL:
          case SC_Opcodes.GENERATE_ONE_FUN_INLINE:
          case SC_Opcodes.GENERATE_ONE_CELL_INLINE:
          case SC_Opcodes.GENERATE_ONE_EXPOSE_INLINE:
          case SC_Opcodes.GENERATE_ONE_FUN:
          case SC_Opcodes.GENERATE_ONE_CELL:
          case SC_Opcodes.GENERATE_ONE_EXPOSE:
          case SC_Opcodes.GENERATE_ONE:{
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_NO_VAL_HALTED:{
            this.removeFromPermanentGenerate(inst, 0);
            }
          case SC_Opcodes.GENERATE_FOREVER_NO_VAL_CONTROLED:{
            inst.oc = SC_Opcodes.GENERATE_FOREVER_NO_VAL_INIT;
            }
          case SC_Opcodes.GENERATE_FOREVER_NO_VAL_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_HALTED:{
            this.removeFromPermanentGenerate(inst, 1);
            inst.itsParent.unregisterFromProduction(inst);
            inst.itsParent.registerForProduction(inst);
            }
          case SC_Opcodes.GENERATE_FOREVER_CONTROLED:{
            inst.oc = SC_Opcodes.GENERATE_FOREVER_INIT;
            }
          case SC_Opcodes.GENERATE_FOREVER_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_HALTED:{
            this.removeFromPermanentGenerate(inst, 1);
            inst.itsParent.unregisterFromProduction(inst);
            inst.itsParent.registerForProduction(inst);
            }
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_CONTROLED:{
            inst.oc = SC_Opcodes.GENERATE_FOREVER_EXPOSE_INIT;
            }
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_FUN_HALTED:{
            this.removeFromPermanentGenerate(inst, 1);
            inst.itsParent.unregisterFromProduction(inst);
            inst.itsParent.registerForProduction(inst);
            }
          case SC_Opcodes.GENERATE_FOREVER_FUN_CONTROLED:{
            inst.oc = SC_Opcodes.GENERATE_FOREVER_FUN_INIT;
            }
          case SC_Opcodes.GENERATE_FOREVER_FUN_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_CELL_HALTED:{
            this.removeFromPermanentGenerate(inst, 1);
            inst.itsParent.unregisterFromProduction(inst);
            inst.itsParent.registerForProduction(inst);
            }
          case SC_Opcodes.GENERATE_FOREVER_CELL_CONTROLED:{
            inst.oc = SC_Opcodes.GENERATE_FOREVER_CELL_INIT;
            }
          case SC_Opcodes.GENERATE_FOREVER_CELL_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_INIT_INLINE:
          case SC_Opcodes.GENERATE_INLINE:{
            inst.oc = SC_Opcodes.GENERATE_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_INIT:
          case SC_Opcodes.GENERATE:{
            inst.oc = SC_Opcodes.GENERATE_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_EXPOSE_INIT_INLINE:
          case SC_Opcodes.GENERATE_EXPOSE_INLINE:{
            inst.oc = SC_Opcodes.GENERATE_EXPOSE_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_EXPOSE_INIT:
          case SC_Opcodes.GENERATE_EXPOSE:{
            inst.oc = SC_Opcodes.GENERATE_EXPOSE_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_CELL_INIT_INLINE:
          case SC_Opcodes.GENERATE_CELL_INLINE:{
            inst.oc = SC_Opcodes.GENERATE_CELL_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_CELL_INIT:
          case SC_Opcodes.GENERATE_CELL:{
            inst.oc = SC_Opcodes.GENERATE_CELL_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_FUN_INIT_INLINE:
          case SC_Opcodes.GENERATE_FUN_INLINE:{
            inst.oc = SC_Opcodes.GENERATE_FUN_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_FUN_INIT:
          case SC_Opcodes.GENERATE_FUN:{
            inst.oc = SC_Opcodes.GENERATE_FUN_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INIT_INLINE:
          case SC_Opcodes.GENERATE_NO_VAL_INLINE:{
            inst.oc = SC_Opcodes.GENERATE_NO_VAL_INIT_INLINE;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INIT:
          case SC_Opcodes.GENERATE_NO_VAL:{
            inst.oc = SC_Opcodes.GENERATE_NO_VAL_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT_INLINE:{
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT_REGISTRED_INLINE:{
            inst.oc = SC_Opcodes.AWAIT_INLINE;
            inst.config.unregister(inst);
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.AWAIT_REGISTRED:{
            inst.oc = SC_Opcodes.AWAIT;
            inst.config.unregister(inst);
            inst = caller;
            break;
            }
          case SC_Opcodes.WHEN_REGISTERED:{
            inst.oc = SC_Opcodes.WHEN;
            inst.c.unregister(inst);
            inst = caller;
            break;
            }
          case SC_Opcodes.KILL_SUSP_REGISTERED:
          case SC_Opcodes.KILL_WEOI:
          case SC_Opcodes.KILL_OEOI:
          case SC_Opcodes.KILL_STOP:
          case SC_Opcodes.KILL_WAIT:
          case SC_Opcodes.KILL_HALT:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = SC_Opcodes.KILL_BACK;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.KILL_BACK:{
            inst.c.unregister(inst);
            }
          case SC_Opcodes.KILLED:{
            inst.oc = SC_Opcodes.KILL_SUSP;
            caller = inst.resetCaller;
            }
          case SC_Opcodes.KILL_SUSP:{
            inst = caller;
            break;
            }
          case SC_Opcodes.CONTROL:
          case SC_Opcodes.CONTROL_REGISTERED_CHECK:
          case SC_Opcodes.CONTROL_REGISTERED_SUSP:{
            inst.resetCaller = caller;
            inst.oc = SC_Opcodes.CONTROL_REGISTERED_BACK;
            caller = inst;
            inst = inst.p;
            break;
            }
          case SC_Opcodes.CONTROL_REGISTERED_BACK:{
            inst.c.unregister(inst);
            inst.oc = SC_Opcodes.CONTROL;
            inst = caller = inst.resetCaller;
            break;
            }
          case SC_Opcodes.TEST:
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_HALTED:{
            this.removeFromPermanentActionsOnOnly(inst);
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED:
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT;
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_HALTED:{
            this.removeFromPermanentActionsOn(inst);
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              }
            else{
              this.addFun(inst.defaultAct);
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER:{
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED:
          case SC_Opcodes.ACTION_ON_EVENT_FOREVER_STOP:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER;
            }
          case SC_Opcodes.ACTION_ON_EVENT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_REGISTERED:
          case SC_Opcodes.ACTION_ON_EVENT_STOP:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT;
            }
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:
          case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_STOP:{
            inst.evtFun.config.unregister(inst);
            inst.count = inst.times;
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_REGISTERED:
          case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_ENDED:{
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT;
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL:
          case SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL_RESOLVED:{
            inst.evt = inst._evt;
            inst.oc = SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL;
            }
          case SC_Opcodes.FILTER_FOREVER_NO_ABS:{
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED:{
            inst.sensor.unregister(inst);
            inst.oc = SC_Opcodes.FILTER_FOREVER_NO_ABS;
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_FOREVER:
          case SC_Opcodes.FILTER_ONE:
          case SC_Opcodes.FILTER_ONE_NO_ABS:
          case SC_Opcodes.FILTER:{
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_NO_ABS:{
            inst.oc = SC_Opcodes.FILTER_NO_ABS_INIT;
            }
          case SC_Opcodes.FILTER_NO_ABS_INIT:{
            inst = caller;
            break;
            }
          case SC_Opcodes.SEND: {
            inst.count = inst.times;
            }
          case SC_Opcodes.SEND_ONE:
          case SC_Opcodes.SEND_FOREVER:{
            inst = caller;
            break;
            }
          case SC_Opcodes.PAR_DYN_TO_REGISTER:
          case SC_Opcodes.PAR_DYN_FORCE:
          case SC_Opcodes.PAR_DYN:{
            inst.resetCaller = caller;
            inst.oc = SC_Opcodes.PAR_DYN_FIRE;
            caller = inst;
            }
          case SC_Opcodes.PAR_DYN_FIRE:{
            inst.tmp = inst.suspended.pop();
            if(null != inst.tmp){
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.stopped.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waitting.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.halted.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.terminated.pop();
            while(null != tmp){
              tmp.flag = SC_Instruction_State.SUSP;
              tmp = inst.terminated.pop();
            }
            for(var i = 0; i < inst.originalBranches.length; i++){
              inst.suspended.append(inst.originalBranches[i]);
              }
            inst.channel.unregister(inst);
            inst.oc = SC_Opcodes.PAR_DYN_TO_REGISTER;
            inst = caller = inst.resetCaller;
            break;
            }
          case SC_Opcodes.PAR_INIT:
          case SC_Opcodes.PAR:
          case SC_Opcodes.PAR_FORCE:{
            inst.resetCaller = caller;
            inst.oc = SC_Opcodes.PAR_FIRE;
            caller = inst;
            }
          case SC_Opcodes.PAR_FIRE:{
            inst.tmp = inst.suspended.pop();
            if(null != inst.tmp){
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.stopped.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waitting.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.halted.pop();
            if(null != inst.tmp){
              inst.tmp.flag = SC_Instruction_State.SUSP;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.terminated.pop();
            while(null != tmp){
              tmp.flag = SC_Instruction_State.SUSP;
              tmp = inst.terminated.pop();
              }
            for(var i = 0; i < inst.branches.length; i++){
              inst.suspended.append(inst.branches[i]);
              }
            inst.oc = SC_Opcodes.PAR;
            inst = caller = inst.resetCaller;
            break;
            }
          case SC_Opcodes.PAUSE_RT_INIT:
          case SC_Opcodes.PAUSE_RT:{
            inst.oc = SC_Opcodes.PAUSE_RT_INIT;
            inst = caller;
            break;
            }
          case SC_Opcodes.MATCH_CHOOSEN:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = SC_Opcodes.MATCH_BACK;
            inst = inst.choice;
            break;
            }
          case SC_Opcodes.MATCH_BACK:{
            caller = inst.resetCaller;
            inst.choice = null;
            inst.oc = SC_Opcodes.MATCH;
            }
          case SC_Opcodes.MATCH:{
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = SC_Opcodes.CUBE_BACK;
            this.lastWills.push(inst.lastWill);
            inst = inst.p;
            break;
            }
          case SC_Opcodes.CUBE_BACK:{
            inst.oc = SC_Opcodes.CUBE_INIT;
            inst = caller = inst.resetCaller;
            break;
            }
          case SC_Opcodes.CELL:
          case SC_Opcodes.RE_CELL:{
            inst = caller;
            break;
            }
          case SC_Opcodes.CUBE_CELL:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = SC_Opcodes.CUBE_CELL_BACK;
            inst = inst.cell;
            break;
            }
          case SC_Opcodes.CUBE_CELL_BACK:{
            inst.oc = SC_Opcodes.CUBE_CELL;
            inst = caller = inst.resetCaller;
            break;
            }
          default:{ throw "reset : undefined opcode "
                          + SC_Opcodes.toString(inst.oc);
            console.trace();
            }
          }
        }
      }
  , generateValues: function(){
      var inst = this.prg;
      var seq = null;
      var caller = act_exit;
      var stack = [];
      while(true){
GRV:    switch(inst.oc){
          case SC_Opcodes._EXIT:{
            return;
            }
          case SC_Opcodes.GENERATE_INIT:
          case SC_Opcodes.GENERATE:
          case SC_Opcodes.GENERATE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_INIT_INLINE:
          case SC_Opcodes.GENERATE_INLINE:
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_ONE_INLINE:
          case SC_Opcodes.GENERATE_ONE:
          case SC_Opcodes.GENERATE_FOREVER_INIT:
          case SC_Opcodes.GENERATE_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_FOREVER_CONTROLED:{
            inst.evt.generateValues(m, inst.val);
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_CELL_INIT:
          case SC_Opcodes.GENERATE_CELL:
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_CELL_INIT_INLINE:
          case SC_Opcodes.GENERATE_CELL_INLINE:
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_ONE_CELL_INLINE:
          case SC_Opcodes.GENERATE_ONE_CELL:
          case SC_Opcodes.GENERATE_FOREVER_CELL_HALTED:
          case SC_Opcodes.GENERATE_FOREVER_CELL_CONTROLED:{
            inst.evt.generateValues(m, inst.val.val());
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FUN_INIT:
          case SC_Opcodes.GENERATE_FUN:
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_FUN_INIT_INLINE:
          case SC_Opcodes.GENERATE_FUN_INLINE:
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_ONE_FUN_INLINE:
          case SC_Opcodes.GENERATE_ONE_FUN:
          case SC_Opcodes.GENERATE_FOREVER_FUN_HALTED:
          case SC_Opcodes.GENERATE_FOREVER_FUN_CONTROLED:{
            inst.evt.generateValues(m, inst.val(m));
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_EXPOSE_INIT:
          case SC_Opcodes.GENERATE_EXPOSE:
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_EXPOSE_INIT_INLINE:
          case SC_Opcodes.GENERATE_EXPOSE_INLINE:
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED:
          case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED:
          case SC_Opcodes.GENERATE_ONE_EXPOSE_INLINE:
          case SC_Opcodes.GENERATE_ONE_EXPOSE:
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_HALTED:
          case SC_Opcodes.GENERATE_FOREVER_EXPOSE_CONTROLED:{
            inst.evt.generateValues(m, inst.val.exposedState(m));
            inst = caller;
            break;
            }
          case SC_Opcodes.GENERATE_FOREVER_LATE_VAL:{
            if(inst.val instanceof SC_CubeBinding){
              var res = inst.val.resolve();
              }
            if(inst.val instanceof SC_Instruction
                && inst.val.oc == SC_Opcodes.CELL){
              inst.evt.generateValues(m, inst.val.val());
              }
            else if("function" == typeof(inst.val)){
              inst.evt.generateValues(m, inst.val(m));
              }
            else if(inst.val instanceof SC_CubeExposedState){
              inst.evt.generateValues(m, inst.val.exposedState(m));
              }
            else{
              inst.evt.generateValues(m, inst.val);
              }
            inst = caller;
            break;
            }
          case SC_Opcodes.FILTER_FOREVER_NO_ABS:
          case SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED:
          case SC_Opcodes.FILTER_FOREVER:
          case SC_Opcodes.FILTER_NO_ABS:
          case SC_Opcodes.FILTER:
          case SC_Opcodes.FILTER_ONE:
          case SC_Opcodes.FILTER_ONE_NO_ABS:{
            if(inst.val instanceof SC_CubeBinding){
              var res = inst.val.resolve();
              }
            if(inst.val instanceof SC_Instruction
                && inst.val.oc == SC_Opcodes.CELL){
              inst.evt.generateValues(m, inst.val.val());
              }
            else if("function" == typeof(inst.val)){
              inst.evt.generateValues(m, inst.val(m));
              }
            else{
              inst.evt.generateValues(m, inst.val);
              }
            inst.val = null;
            inst = caller;
            break;
            }
          case SC_Opcodes.PAR_DYN_FORCE:
          case SC_Opcodes.PAR_DYN_TO_REGISTER:
          case SC_Opcodes.PAR_DYN:{
            const pbl = inst.prodBranches.length;
            for(var nb = 0; nb < pbl; nb++){
              const pb = inst.prodBranches[nb];
              const el = pb.emitters.length;
              if(0 == el){
                const pel = pb.permanentEmitters.length;
                for(var i = 0; i < pel; i++){
                  pb.permanentEmitters[i].generateValues(m);
                  }
                }
              else{
                for(var i = 0; i < el; i++){
                  pb.emitters[i].generateValues(m);
                  }
                pb.emitters = [];
                }
              }
            break;
            }
          case SC_Opcodes.PAR:{
            const pbl = inst.prodBranches.length;
            for(var nb = 0; nb < pbl; nb++){
              inst.prodBranches[nb].generateValues(m);
              }
            break;
            }
          default:{ throw new Error("generateForever(): undefined opcode "
                         +SC_Opcodes.toString(inst.oc)
                         );
            console.trace();
            }
          }
        }
      }
  };
SC = {
  clock : function(params){
    if(undefined == params){
      throw new Error("no params for clock");
      return;
      }
    if((undefined == params.name)
       ||("string" != typeof(params.name))
       ||(undefined == params.delay)
       ||(isNaN(params.delay))
       ||(params.delay < 1)
       ){
      throw new Error("missing mandatory parameters : name, delay <"+params+">");
      return;
      }
    params.owned=true;
    params.init = (params.init)?params.init:SC.pauseForever();
    return new SC_SensorId(params);
    }
, evt: function(name, params){
    if(undefined != params){
      params.name = name;
      }
    else{
      params = {name:name};
      }
    return new SC_EventId(params);
    }
, sensor: function(name, params){
    if(undefined != params){
      params.name = name;
      }
    else{
      params = {name:name};
      }
    return new SC_SensorId(params);
    }
, sensorize: function(params){
    if(undefined == params){
      throw new Error("SC.sensorize(): undefined params "+params);
      }
    if(undefined == params.name){
      throw new Error("SC.sensorize(): undefined params.name "+params);
      }
    if(undefined == params.dom_targets){
      throw new Error("SC.sensorize(): undefined dom_targets "+params);
      }
    return new SC_SensorId(params);
    }
, reactiveMachine: function(initParams){
    if(undefined == initParams){
      initParams = {};
      }
    if(undefined == initParams.name){
      initParams.name = "unanmed_machine";
      }
    initParams.owned=true;
    return new SC_SensorId(initParams);
    }
, machine: function(delay, initParams){
    if(undefined == initParams){
      initParams = (undefined != delay)?{ delay : delay }:{};
      }
    else if(undefined == initParams.delay){
      initParams.delay = delay;
      }
    initParams.owned=true;
    return new SC_SensorId(initParams);
    },
  pauseForever: function(){
    return SC_PauseForever;
  },
  nothing: function(){
    return SC_Nothing;
    },
  purge: function(prg){
    return (undefined == prg)?this.nothing():prg;
    },
  nop: function(){
    return SC_Nothing;
    },
  pauseRT: function(n){
    return new SC_PauseRT(_SC.b_(n));
  },
  pause: function(n){
    return new SC_Pause(_SC.b_(n));
    },
  pauseUntil(cond){
    if((undefined === cond)||(null === cond)){
      throw new Error('pauseUntil(): invalid condition: '+cond);
      }
    if(false === cond){
      console.log("pauseUntil(): pauseForever for a false const.");
      return this.pauseForever();
      }
    if(true === cond){
      console.log("pauseUntil(): single pause for a true const.");
      return this.pause();
      }
    if("function" != typeof(cond) && !(cond instanceof SC_CubeBinding)){
      throw new Error('pauseUntil(): invalid condition implementation: '+cond);
      }
    return new SC_PauseUntil(cond);
    },
  await: function(config){
    if(undefined == config){
      throw "config not defined";
      }
    return new SC_Await(_SC.b_(config));
  },
  resetOnEach: function(params){
    if(undefined == params){
      throw new Error("resetOnEach(): undefined params")
      }
    return new SC.repeatForever(
        SC.kill(params.killCond
          , SC.seq(params.prg, SC.pauseForever())
          )
        );
    },
  seq: function(){
    return new SC_Seq(arguments);
  },
  action: function(fun, times){
    return new SC_Action(_SC.b_(fun), _SC.b_(times));
  },
  actionWhen: function(c, fun, deffun, times){
    if(undefined == c){
      throw "config not defined";
      }
    return new SC_ActionOnEvent(_SC.b_(c), _SC.b_(fun), _SC.b_(deffun), _SC.b_(times));
  },
  actionOn: function(c, fun, deffun, times){
    if(undefined == c){
      throw "config not defined";
      }
    return new SC_ActionOnEvent(_SC.b_(c), _SC.b_(fun), _SC.b_(deffun), _SC.b_(times));
  },
  act: function(fun){
    return new SC_Action(fun);
  },
  par: function(){
    return new SC_Par(arguments, undefined);
  },
  NO_ACTION:NO_FUN,
  parex: function(evt){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs.push(arguments[i]);
    }
    return new SC_Par(prgs, evt);
  },
  nextInput: function(evt, v, t){
    return new SC_Send(_SC.b_(evt), v, _SC.b_(t));
  },
  generateForever: function(evt, v){
    return new SC_GenerateForever(_SC.b_(evt), v);
  },
  generate: function(evt, v, times){
    return new SC_Generate(_SC.checkStrictEvent(evt)
                                , v, _SC.b_(times));
  },
  generateWrapped: function(evt, v, times){
    return new SC_Generate(_SC.b_(evt), _SC.b_(v), _SC.b_(times));
    },
  repeatForever: function(n){
    Array.prototype.unshift.call(arguments, this.forever);
    return this.repeat.apply(this, arguments);
    },
  repeat: function(n){
    var prgs = [];
    var jump = 1;
    prgs[0] = new SC_RepeatPoint(n);
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i] = arguments[i];
      if(prgs[i] instanceof SC_Seq){
        jump+= prgs[i].seqElements.length;
        }
      else{
        jump++;
        }
    }
    var end = new SC_RelativeJump(-jump);
    prgs.push(end);
    prgs[0].end = jump+1;
    var t = new SC_Seq(prgs);
    return t;
  },
  ifRepeatLabel: function(l, c){
    var label = Array.prototype.shift.apply(arguments);
    var tmp = this.ifRepeat.apply(this, arguments);
    tmp.seqElements[0].label = label;
    return tmp;
    },
  ifRepeat: function(c){
    var prgs = [];
    var jump = 1;
    prgs[0] = new SC_IfRepeatPoint(c);
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i] = arguments[i];
      if(prgs[i] instanceof SC_Seq){
        jump+= prgs[i].seqElements.length;
        }
      else{
        jump++;
        }
    }
    var end = new SC_RelativeJump(-jump);
    prgs[prgs.length] = end;
    prgs[0].end = jump+1;
    var t = new SC_Seq(prgs);
    return t;
  },
  and: function(){
    var tmp = [];
    for(var i in arguments){
      tmp.push(_SC.b_(arguments[i]));
      }
    return new SC_And(tmp);
  },
  or: function(){
    var tmp = [];
    for(var i in arguments){
      tmp.push(_SC.b_(arguments[i]));
      }
    return new SC_Or(tmp);
  },
  kill: function(c,p,h){
    _SC.checkConfig(c);
    var prgs = [new SC_Kill(c,p,1)];
    if(undefined != h){
      prgs.push(h);
      if(h instanceof SC_Seq){
        prgs[0].end += h.seqElements.length;
        }
      else{
        prgs[0].end += 1;
        }
      }
    var res = new SC_Seq(prgs);
    return res;
  },
  control: function(c){
    _SC.checkConfig(c);
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i-1] = arguments[i];
    }
   return new SC_Control(c, new SC_Seq(prgs));
  },
  when: function(c,t,e){
    _SC.checkConfig(c);
    var prgs = [new SC_When(c)];    
    var elsJ = 2;
    var end = 1;
    if(undefined != t){
      prgs.push(t);
      if(t instanceof SC_Seq){
        elsJ += t.seqElements.length;
        }
      else{
        elsJ++;
        }
      }
    prgs[0].elsB = elsJ;
    if(e instanceof SC_Seq){
      end += e.seqElements.length;
      }
    else if(undefined != e){
      end++;
      }
    prgs.push(new SC_RelativeJump(end));
    if(undefined != e){prgs.push(e);}
    return new SC_Seq(prgs);
    },
  test: function(b,t,e){
    var prgs = [new SC_Test(b)];    
    var elsJ = 2;
    var end = 1;
    if(undefined != t){
      prgs.push(t);
      if(t instanceof SC_Seq){
        elsJ += t.seqElements.length;
        }
      else{
        elsJ++;
        }
      }
    prgs[0].elsB = elsJ;
    if(e instanceof SC_Seq){
      end += e.seqElements.length;
      }
    else if(undefined != e){
      end++;
      }
    prgs.push(new SC_RelativeJump(end));
    if(undefined != e){prgs.push(e);}
    return new SC_Seq(prgs);
  },
  match: function(val){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i-1] = arguments[i];
    }
    return new SC_Match(val, prgs);
  },
  matches: function(val,branches){
    return new SC_Match(val, branches);
  },
  filter: function(s,e,f,t,n){
    return new SC_Filter(_SC.b_(s)
                       , _SC.b_(e)
                       , _SC.b_(f)
                       , _SC.b_(t)
                       , _SC.b_(n));
  }
, me : new SC_CubeExposedState()
, cubify: function(params){
  if(undefined == params){
    throw new Error("cubify no params provided");
    }
  if(undefined == params.prg){
    throw new Error("cubify no program provided");
    }
  if(undefined == params.root){
    params.root = {};
    }
  const funs = params.methods;
  if(funs){
    for(var i of funs){
      if(typeof(i.name) != "string"){
        throw new Error("cubify fun name "+i.name+" not valid");
        }
      if(typeof(i.fun) != "function"){
        throw new Error("cubify fun "+i.fun+" not valid");
        }
      params.root[i.name] = i.fun;
      }
    }
  if(params.state && !params.expose){
    params.expose = params.state;
    }
  const cells = params.expose;
  if(cells){
    if(!params.life){
      params.life = {};
      }
    params.life.swapList = [];
    for(var i of cells){
      if(typeof(i.id) != "string"){
        throw new Error("cubify state name "+i.id+" not valid in "+cells);
        }
      switch(i.type){
        case 'fun':{
          if(typeof(params.root[i.id]) != "function"){
            throw new Error("cubify state inconsistent type of field "+i.id+" not a function.");
            }
          break;
          }
        }
      params.life.swapList.push(i);
      }
    }
  return new SC_Cube(params.root, params.prg, params.life);
  }
, cubeAction: function(params){
    if(undefined == params){
      throw new Error("no params for cubeAction");
      }
    if(undefined == params.fun){
      throw new Error("no fun for cubeAction: "+params.fun
                    +" fun type "+typeof(params.fun));
      }
    return new SC_CubeAction(params);
    }
, cube: function(o, p, extensions){
    if(undefined == o){
      throw new Error("undefined object for cube");
      }
    if((undefined == p)||!p.isAnSCProgram){
      throw new Error("undefined program for cube: "+p);
      }
    return new SC_Cube(o, p, extensions);
    }
, cubeCell: function(c){
    return new SC_CubeCell(c);
  },
  cell: function(params){
    return new SC_Cell(params);
    },
  traceEvent: function(msg){
    return new SC_GenerateOne(null, msg);
    },
  trace: function(msg){
    return new SC_GenerateOne(null, msg);
    },
  log: function(msg){
    return new SC_Log(msg);
    },
  cellify: function(tgt, nom, fun, el, sub){
    var t = tgt;
    if(Array.isArray(sub)){
      for(var i = 0; i < sub.length; i++){
        t = t[sub[i]];
        }
      }
    else{
      t = (undefined == sub)?tgt:tgt[sub];
      }
    if(undefined != fun){
      tgt["_"+nom] = fun;
      }
    if(undefined == tgt["_"+nom]){
      throw "no affectator for "+nom+" cell";
      }
    tgt["$"+nom] = SC.cell({target:t, field:nom, sideEffect: SC._(tgt,"_"+nom), eventList: el});
    },
  simpleCellFun : function(tgt, evt, trace){
    return function(e, trace, val, evts){
      var v = evts[e];
      if(trace){
        console.log("simpleFun", this, evts, evt)
      }
      if(undefined != v){
        var newVal = v[0];
        if(newVal instanceof SC_ValueWrapper){
          newVal = newVal.getVal();
          }
        return newVal;
        }
      return val;
      }.bind(tgt, evt, trace);
    },
  addCell: function(tgt, nom, init, el, fun){
    if(tgt instanceof SC_Cube){
      tgt = tgt.o;
      }
    if(undefined !== fun){
      tgt["_"+nom] = fun;
      }
    if(undefined === tgt["_"+nom]){
      throw "no affectator for "+nom+" cell is defined";
      }
    tgt["$"+nom] = SC.cell({init:init, sideEffect: SC._(tgt,"_"+nom), eventList: el});
    Object.defineProperty(tgt, nom,{get : (function(nom){
      return tgt["$"+nom].val();
    }).bind(tgt, nom)});
    },
  _: function(tgt, fun){
    return (tgt[fun]).bind(tgt);
    },
  linkToCube:function(s){
    return _SC.b_(s);
    },
  power: function(field){
    return _SC.b_(field);
    },
  myCell: function(c){
    return new SC_CubeCell("$"+c);
  },
  myFun: function(field){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i-1] = arguments[i];
    }
    return _SC.b__(field, prgs);
    },
  my: function(field){
    return _SC.b_(field);
    },
  send: function(m, evt, v){
    return SC.action(function(evt, v){
      this.addToOwnEntry(evt, v);
      }.bind(m, evt, v))
    },
  next: function(){
    return SC_Next;
    },
  externalEvent: function externalEvent(pElt_target, ps_DomEvt, pn_nbreFois) {
    if(undefined === pn_nbreFois){ pn_nbreFois = -1; }
    const pSensor = new SC.sensorize({
            name: ''+ Elt_target+'.'+ps_DomEvt
          , dom_targets:[{target: pElt_target, evt:ps_DomEvt}]
          , pn_nbreFois: pn_nbreFois
          , owned:true
            });
    return pSensor
    },
  writeInConsole:function(){
    console.log.call(console,arguments);
    },
  _const_opcodes : SC_Opcodes,
  _const_opcodes_names : SC_OpcodesNames,
  _const_statevals : SC_Instruction_State,
  _const_statevals_names : SC_Instruction_state_str,
  forever: -1
};
SC.lang ={
  grammar : ""
  };
function SC_Def_crowlHTML(anArray){
  var res = "";
  for(var i in anArray){
    var tmp = anArray[i];
    if(tmp instanceof Array){
      res += SC_Def_crowlHTML(tmp);
      }
    else if(null == tmp){
      }
    else{
      res += tmp.html();
      }
    }
  return res;
  }
function SC_ReactiveWorld(){
  this.events = {};
  this.machine = SC.machine();
  }
SC_ReactiveWorld.prototype.include = function(aSource){
  var zeRes = SC.lang.parse(aSource, this);
  }
SC_ReactiveWorld.prototype.react = function(){
  console.log("react");
  return this.machine.newValue();
  }
function SC_Definition(content){
  this.content = content;
  }
SC_Definition.prototype.html = function(){
  var res = "<span class='def_block'>";
  res += (this.content[0]).html();
  res += (this.content[1]).html();
  for(var i in this.content[2]){
    res += (this.content[2][i]).html();
    }
  res += (this.content[3]).html();
  return res+'</span>';
  }
SC_Definition.prototype.process = function(env){
  var res = "processing definition<br>";
  for(var i in this.content[2]){
    res += (this.content[2][i]).process(env);
    }
  return res;
  }
function SC_GlobalDef(content){
  this.content = content;
  this.id = content[2];
  this.global = (content[0].text == 'map');
  }
SC_GlobalDef.prototype.html = function(){
  var res = "";
  if(this.global){
    res += this.content[0].html();
    }
  else{
    res += this.content[0][0].html();
    if(this.content[0].length> 1){
      if(undefined != this.content[0][1]){
        res += this.content[0][1][0].html();
        res += this.content[0][1][1].html();
        }
      }
    }
  res += this.content[1].html();
  res += this.id.html();
  res += this.content[3].html();
  if(undefined != this.content[4]){
    res += this.content[4][0];
    res += this.content[4][1].html();
    res += this.content[4][2];
    res += this.content[4][3].html();
    for(var i in this.content[4][4]){
      var tmp = this.content[4][4][i];
      res += tmp[0].html();
      res += tmp[1].html();
      res += tmp[2].html();
      res += tmp[3].html();
      res += tmp[4].html();
      res += tmp[5].html();
      res += tmp[6].html();
      res += tmp[7].html();
      }
    res += this.content[4][5];
    res += this.content[4][6].html();
    }
  res += this.content[5].html();
  res += this.content[6].html();
  return res;
  }
SC_GlobalDef.prototype.process = function(env){
  var res = "";
  env.addGlobalEventDefinition(this.id)
  return res;
  }
function SC_ParDef(p1, p2){
  this.content = Array.prototype.concat([p1], p2);
  }
SC_ParDef.prototype.processable = true;
SC_ParDef.prototype.html = function(){
  var res = "";
  for(var i in this.content){
    var node = this.content[i];
    res += node.html();
    }
  res += "";
  return res;
  }
SC_ParDef.prototype.process = function(env){
  var res = "processing par<br>";
  this.result = SC.par();
  for(var i in this.content){
    var node = this.content[i];
    if(node.processable){
      res += node.process(env);
      this.result.add(node.result);
      }
    }
  return res;
  }
function SC_ParOpDef(p1, p2){
  this.skip1 = p1;
  this.skip2 = p2;
  }
SC_ParOpDef.prototype.html = function(){
  var res = "";
  res += this.skip1.html()
  res += "||";
  res += this.skip2.html()
  return res;
  }
SC_ParOpDef.prototype.process = function(env){
  var res = "";
  return res;
  }
function SC_SeqDef(p1, p2){
  this.content = Array.prototype.concat([p1], p2);
  }
SC_SeqDef.prototype.processable = true;
SC_SeqDef.prototype.html = function(){
  var res = "";
  for(var i in this.content){
    var node = this.content[i];
    res += node.html();
    }
  res += "";
  return res;
  }
SC_SeqDef.prototype.process = function(env){
  var res = "processing seq<br>";
  this.result = SC.seq();
  for(var i in this.content){
    var node = this.content[i];
    if(node.processable){
      res += node.process(env);
      this.result.add(node.result);
      }
    }
  return res;
  }
function SC_SeqOpDef(p1, p2){
  this.skip1 = p1;
  this.skip2 = p2;
  }
SC_SeqOpDef.prototype.html = function(){
  var res = "";
  res += this.skip1.html()
  res += ";";
  res += this.skip2.html()
  return res;
  }
SC_SeqOpDef.prototype.process = function(env){
  var res = "";
  return res;
  }
function SC_BoolANDOPDef(p1, p2){
  this.skip1 = p1;
  this.skip2 = p2;
  }
SC_BoolANDOPDef.prototype.html = function(){
  var res = "";
  res += this.skip1.html()
  res += "/\\";
  res += this.skip2.html()
  return res;
  }
SC_BoolANDOPDef.prototype.process = function(env){
  var res = "";
  return res;
  }
function SC_PauseDef(times){
  if(undefined == times){
    }
  else if('forever' == times[1].text){
    this.skip= SC.lang.skip(times[0]);
    this.forever=true;
    }
  else{
    this.skip= SC.lang.skip(times[0]);
    this.times = times[1][0];
    this.skip2 = SC.lang.skip(times[1][1]);
    }
  }
SC_PauseDef.prototype.processable = true;
SC_PauseDef.prototype.html = function(){
  var res = "<span class='keyword'>pause</span>";
  if(undefined != this.skip){
    res += this.skip.html();
    if(this.forever){
      res += "<span class='keyword'>forever</span>";
      }
    else{
      res += this.times.html();
      res += this.skip2.html();
      res += "<span class='keyword'>times</span>";
      }
    }
  return res;
  }
SC_PauseDef.prototype.process = function(env){
  var res = "processing pause<br>";
  if(this.forever){
    this.result = SC.pauseForever();
    }
  else{
    var steps = (undefined == this.times)?undefined:this.times.val;
    this.result=SC.pause(steps);
  }
  return res;
  }
function SC_ParenDef(skp1, prg, skp2){
  this.skp1 = skp1;
  this.skp2 = skp2;
  this.prg = prg;
  }
SC_ParenDef.prototype.processable = true;
SC_ParenDef.prototype.html = function(){
  var res = "<span class='parenBlock'>{";
  res += this.skp1.html();
  res += this.prg.html();
  res += this.skp2.html();
  res += "}</span>";
  return res;
  }
SC_ParenDef.prototype.process = function(env){
  var res = "";
  res += this.prg.process(env);
  this.result=this.prg.result;
  return res;
  }
function SC_RepeatDef(body){
  this.body = body;
  }
SC_RepeatDef.prototype.processable = true;
SC_RepeatDef.prototype.html = function(){
  var res = "<span class='repeatBlock'>"+SC_Def_crowlHTML(this.body)+"</span>";
  return res;
  }
SC_RepeatDef.prototype.process = function(env){
  var res = "processing repeat<br>";
  res += this.body[5].process(env);
  if(null == this.body[1]){
    this.result = SC.repeat(SC.forever, this.body[5].result);
    }
  else{
    this.result = SC.repeat(this.body[1][1][0].val, this.body[5].result);
    }
  return res;
  }
function SC_KillDef(body){
  this.body = body;
  this.id = body[4];
  }
SC_KillDef.prototype.processable = true;
SC_KillDef.prototype.html = function(){
  var res = "<span class='killBlock'>";
  res += SC_Def_crowlHTML(this.body);
  return res+"</span>";
  }
SC_KillDef.prototype.process = function(env){
  var res = "processing kill<br>";
  res += this.body[8].process(env);
  var evt = env.getGlobalEvent(this.id);
  this.result = SC.kill(evt, this.body[8].result);
  return res;
  }
function SC_LogDef(skip, msg){
  this.skip = skip;
  this.msg = msg;
  }
SC_LogDef.prototype.processable = true;
SC_LogDef.prototype.html = function(){
  var res = "<span class='keyword'>log</span>";
  res += this.skip.html();
  res += "<span class='strings'>"+this.msg+"</span>";
  return res;
  }
SC_LogDef.prototype.process = function(env){
  var res = "processing log<br>";
  this.result=SC.log(this.msg);
  return res;
  }
function SC_AwaitDef(skip, id){
  this.skip = skip;
  this.id = id;
  }
SC_AwaitDef.prototype.processable = true;
SC_AwaitDef.prototype.html = function(){
  var res = "<span class='keyword'>await</span>";
  res += this.skip.html();
  res += this.id.html();
  return res;
  }
SC_AwaitDef.prototype.process = function(env){
  var res = "processing await<br>";
  var evt = env.getGlobalEvent(this.id);
  if(undefined === evt){
    throw "Undefined event id after await : "+this.id;
    }
  this.result=SC.await(evt);
  return res;
  }
function SC_GenerateDef(skip, id){
  this.skip = skip;
  this.id = id;
  }
SC_GenerateDef.prototype.processable = true;
SC_GenerateDef.prototype.html = function(){
  var res = "<span class='keyword'>generate</span>";
  res += this.skip.html();
  res += "<span class='ftk_emit'>"+this.id.html()+"</span>";
  return res;
  }
SC_GenerateDef.prototype.process = function(env){
  var res = "processing generate<br>";
  var evt = env.getGlobalEvent(this.id);
  if(undefined === evt){
    throw "Undefined event id after generate : "+this.id;
    }
  this.result=SC.generate(evt);
  return res;
  }
function SC_SkipDef(data){
  if(data instanceof Array){
    this.content = data;
    }
  else{
    this.content = [data];
    }
  }
SC_SkipDef.prototype.html = function(){
  var res = "";
  for(var i in this.content){
    res += (this.content[i]).html();
    }
  return res;
  }
SC_SkipDef.prototype.process = function(env){
  return "";
  }
function SC_Spaces(str){
  this.text = str;
  }
SC_Spaces.prototype.html = function(){
  return this.text;
  }
SC_Spaces.prototype.process = function(env){
  return "";
  }
function SC_Comment(str){
  this.text = str;
  }
SC_Comment.prototype.html = function(){
  return "<span class='comment'>"+this.text+"</span>";
  }
SC_Comment.prototype.process = function(env){
  return "";
  }
function SC_Keyword(str){
  this.text = str;
  }
SC_Keyword.prototype.html = function(){
  return "<span class='keyword'>"+this.text+"</span>";
  }
SC_Keyword.prototype.process = function(env){
  return "";
  }
function SC_KeywordVal(str){
  this.text = str;
  }
SC_KeywordVal.prototype.html = function(){
  return "<span class='constante'>"+this.text+"</span>";
  }
SC_KeywordVal.prototype.process = function(env){
  return "";
  }
function SC_Ponctuation(str){
  this.text = str;
  }
SC_Ponctuation.prototype.html = function(){
  return this.text;
  }
SC_Ponctuation.prototype.process = function(env){
  return "";
  }
function SC_FieldIDDef(str){
  this.text = str;
  }
SC_FieldIDDef.prototype.html = function(){
  return "<span class='field_id'>"+this.text+"</span>";
  }
SC_FieldIDDef.prototype.process = function(env){
  return "";
  }
function SC_EventIDDef(str){
  this.text = str;
  }
SC_EventIDDef.prototype.html = function(){
  return "<span class='field_id'>"+this.text+"</span>";
  }
SC_EventIDDef.prototype.getID = function(){
  return this.text.substr(1);
  }
SC_EventIDDef.prototype.process = function(env){
  return "";
  }
function SC_SensorIDDef(str){
  this.text = str;
  }
SC_SensorIDDef.prototype.html = function(){
  return "<span class='sensor_id'>"+this.text+"</span>";
  }
SC_SensorIDDef.prototype.getID = function(){
  return this.text.substr(1);
  }
SC_SensorIDDef.prototype.process = function(env){
  return "";
  }
function SC_NumberDef(str){
  this.val = parseInt(str);
  }
SC_NumberDef.prototype.html = function(){
  return "<span class='number'>"+this.val+"</span>";
  }
SC_NumberDef.prototype.process = function(env){
  return "";
  }
function SC_Module(args){
  var a = Array.prototype.slice.call(args);
  this.content = [];
  this.globalEvents = [];
  this.localEvents = [];
  this.myRW = null;
  for(var i = 0; i < args.length; i++){
    var n = args[i];
    this.content.push(n);
    }
  }
SC_Module.prototype.html = function(){
  var res = "";
  for(var i in this.content){
    res += (this.content[i]).html();
    }
  return res;
  }
SC_Module.prototype.process = function(aRW){
  var res = "processing a module<br>";
  this.myRW = aRW;
  var defs = this.content[1];
  if(undefined !== defs){
    res += defs.process(this);
    }
  for(var i in this.globalEvents){
    var evt = this.globalEvents[i];
    if(evt in aRW.events){
      res += evt+" already defined.";
      }
    else {
      var zeSCEvent = SC.evt(evt.getID());
      this.myRW.events[evt] = zeSCEvent;
      res += "Defining "+evt+" ("+zeSCEvent+").";
      }
    }
  for(var i in this.localEvents){
    var evt = this.localEvents[i];
    if(evt in aRW.events){
      res += evt+" already defined.";
      }
    else {
      var zeSCEvent = SC.evt(evt.getID());
      this.myRW.events[evt] = zeSCEvent;
      res += "Defining "+evt+" ("+zeSCEvent+").";
      }
    }
  var script = this.content[3];
  if(undefined !== script){
    res += script.process(this);
    this.result = script.result;
    }
  return res;
  }
SC_Module.prototype.addGlobalEventDefinition = function(id){
  this.globalEvents.push(id);
  }
SC_Module.prototype.addLocalEventDefinition = function(id){
  this.localEvents.push(id);
  }
SC_Module.prototype.getGlobalEvent = function(id){
  return this.myRW.events[id];
  }
SC.lang.module= function(){
    return new SC_Module(arguments);
    }
SC.lang.comment= function(str){
      return new SC_Comment(str);
      }
SC.lang.space= function(str){
      return new SC_Spaces(str);
      }
SC.lang.skip= function(str){
      return new SC_SkipDef(str);
      }
SC.lang.define= function(content){
      return new SC_Definition(content);
      }
SC.lang.globalDef= function(content){
      return new SC_GlobalDef(content);
      }
SC.lang.initAReactiveWorld = function(){
  if(undefined == this.parser){
    const tmp = new XMLHttpRequest();
    this.pendingParsing = [];
    const me = this;
    tmp.open("GET","/SugarCubes.pegjs", true);
    tmp.onload = function(){
      if(200 === tmp.status){
        me.grammar = tmp.responseText;
        me.parser = peg.generate(me.grammar);
        if(null !== me.parser){
          for(var i in me.pendingParsing){
            me.parse(me.pendingParsing[i], me.pendingParsing[i].RW);
            }
          }
        }
      }
    tmp.send(null);
    }
  return new SC_ReactiveWorld();
  }
SC.lang.await = function(skip, id){
  return new SC_AwaitDef(skip, id);
  }
SC.lang.generate = function(skip, id){
  return new SC_GenerateDef(skip, id);
  }
SC.lang.log= function(skp, msg){
  return new SC_LogDef(skp, msg);
  }
SC.lang.par = function(p1, p2){
  if(undefined === p2){
    return p1;
    }
  return new SC_ParDef(p1, p2);
  }
SC.lang.parOp = function(skp1, skp2){
  return new SC_ParOpDef(skp1, skp2);
  }
SC.lang.BoolAndOp = function(skp1, skp2){
  return new SC_BoolANDOPDef(skp1, skp2);
  }
SC.lang.seq = function(p1, p2){
  if(undefined === p2){
    return p1;
    }
  return new SC_SeqDef(p1, p2);
  }
SC.lang.seqOp = function(skp1, skp2){
  return new SC_SeqOpDef(skp1, skp2);
  }
SC.lang.paren = function(skp1, prg, skp2){
  return new SC_ParenDef(skp1, prg, skp2);
  }
SC.lang.pause = function(times){
  return new SC_PauseDef(times);
  }
SC.lang.kill = function(kill){
  return new SC_KillDef(kill);
  }
SC.lang.keyword = function(text){
  return new SC_Keyword(text);
  }
SC.lang.keywordVal = function(text){
  return new SC_KeywordVal(text);
  }
SC.lang.ponct = function(text){
  return new SC_Ponctuation(text);
  }
SC.lang.fieldId = function(text){
  return new SC_FieldIDDef(text);
  }
SC.lang.number = function(text){
  return new SC_NumberDef(text);
  }
SC.lang.fieldId = function(text){
  return new SC_FieldIDDef(text);
  }
SC.lang.eventIds = function(text){
  return new SC_EventIDDef(text);
  }
SC.lang.sensorIds = function(text){
  return new SC_SensorIDDef(text);
  }
SC.lang.repeat = function(data){
  return new SC_RepeatDef(data);
  }
SC.lang.parse = function(aSource, aReactiveWorld){
  aSource.RW = aReactiveWorld;
  if(undefined !== this.parser){
    var zePrg = this.parser.parse(aSource.toParse);
    if(undefined != aSource.onParsed){
      aSource.onParsed(zePrg.html());
      }
    var zeLog = zePrg.process(aSource.RW);
    if(undefined != aSource.onBuilt){
      aSource.onBuilt(zeLog);
      }
    aSource.RW.machine.addToOwnProgram(zePrg.result);
    return zePrg;
    }
  this.pendingParsing.push(aSource);
  }
  this.SC = SC;
}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
