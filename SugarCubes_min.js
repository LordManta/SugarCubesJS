/*
 * SugarCubes_min.js
 * Authors : Jean-Ferdy Susini (MNF), Olivier Pons & Claude Lion
 * Created : 2/12/2014 9:23 PM
 * Part of the SugarCubes Project
 * version : 5.0.780.alpha
 * build: 780
 * Copyleft 2014-2025.
 */
;
(function(sc_global){ 
function NO_FUN(){};
const SC_Instruction_state_str= [
    "UNDF" 
  , "SUSP" 
  , "WEOI" 
  , "OEOI" 
  , "STOP"
  , "WAIT"
  , "HALT"
  , "TERM"
    ];
Object.freeze(SC_Instruction_state_str);
const SC_IState= {
    toString: function(state){
      return SC_Instruction_state_str[state]+":"+state;
      }
    };
for(var st in SC_Instruction_state_str){
  SC_IState[SC_Instruction_state_str[st]]= parseInt(st);
  }
Object.freeze(SC_IState);
function PurgeableCollection(){
  if(!(this instanceof PurgeableCollection)){
    return new PurgeableCollection();
    }
  if(undefined!=sc_global.WeakMap){
    const res= new sc_global.WeakMap();
    res.cleanup= NO_FUN;
    return res;
    }
  this.collection= {};
  this._sc_weak= undefined!=sc_global.WeakRef;
  Object.freeze(this);
  };
(function(){
  const proto= PurgeableCollection.prototype;
  proto.get= function(sym){
      const tk= this.collection[sym];
      return (this._sc_weak && tk)?tk.deref():tk;
      };
  proto.has= function(sym){
      return undefined!==this.get(sym);
      };
  proto.set= function(sym, val){
      if(undefined!==val){
        if(this._sc_weak){
          this.collection[sym]= new sc_global.WeakRef(val);
          }
        else{
          this.collection[sym]= val;
          }
        }
      else{
        delete(this.collection[sym]);
        }
      };
  proto.rm= function(sym){
      delete(this.collection[sym]);
      };
  proto.cleanup= function(){
      const ks= Object.keys(this.collection);
      const kl= ks.length;
      for(var i= 0; i<kl; i++){
        const k=ks[i];
        if(undefined===this.get(k)){
          delete(this.collection[k]);
          }
        }
      };
  Object.freeze(proto);
  })();
function SC_Parameters(p, check){
  if(undefined===p && undefined===check){
    return this;
    }
  if("object"==typeof(p)){
    if(p instanceof SC_Parameters){
      return p;
      }
    const kiz= Object.keys(p);
    const kl= kiz.length
    for(var n= 0; n<kl; n++){
      const key= kiz[n];
      this[key]= p[key];
      }
    if(Array.isArray(check)){
      const len= check.length;
      for(var n= 0; n<len; n++){
        const key= check[n];
        if(undefined===this[key]){
          console.wran(key+" is mandatory but not defined");
          return undefined;
          }
        }
      }
    }
  else{
    return Array.isArray(check)?undefined:p;
    }
  };
(function(){
  const proto= SC_Parameters.prototype;
  Object.defineProperty(proto, "_"
  , { value: function(name, dval){
          const v= this[name];
          return (undefined!==v || (null!==v && undefined===dval))?v:dval;
          }
    , writable: false
      });
  Object.defineProperty(proto, "_e"
  , { value: function(name){
          const v= this[name];
          return undefined!==v;
          }
    , writable: false
      });
  Object.defineProperty(proto, "toString"
  , { value: function(){
          var res= "SC_Parameters:={";
          const kiz= Object.keys(this);
          const klen= kiz.length;
          for(var n= 0; n<klen; n++){
            const key= kiz[n];
            res+= " "+key+": "+this[key];
            }
          return res+"}";
          }
    , writable: false
      });
  Object.freeze(proto);
  })();
const SC_Global_Manager= {
    clocks: []
  , attachments: new PurgeableCollection()
  , registerBinder: function(binder){
        this.attachments.set(binder.sens.iids, binder);
        }
  , connect: function(sid, ream){
        const binder= this.attachments.get(sid.iids);
        binder.add(ream);
        }
  , disconnect: function(sid, ream){
        const binder= this.attachments.get(sid.iids);
        binder.remove(ream);
        }
  , addToRegisteredMachines: function(m){
        this.clocks.push(m);
        }
  , removeFromRegisteredMachines: function(m){
        const idx= this.clocks.indexOf(m);
        if(idx>=0){
          this.clocks.splice(idx, 1);
          }
        else{
          throw new Error(
              "Internal error: trying to remove a not registered machine"
            , m);
          }
        }
  , updateSensor:
      function(sensorId, val){
        const rm= this.clocks;
        const ll= rm.length;
        for(var m= 0 ; m<ll; m++){
          const machine= rm[m];
          machine.sampleSensor(sensorId, val);
          }
        }
    };
Object.freeze(SC_Global_Manager);
function SC_LateBinding(){
  const obj= arguments[0];
  const args= arguments[1];
  Object.defineProperty(this, "vf"
  , { value: (args && args.vf)?true:false , writable: false });
  if("string"==typeof(obj) && ""!=obj){
    Object.defineProperty(this, "name", { value: obj , writable: false });
    }
  else if("object"==typeof(obj) && "object"==typeof(obj.t)
          && "string"==typeof(obj.f) && ""!=obj.f){
    Object.defineProperty(this, "tgt"
    , { value: obj.t, writable: false });
    Object.defineProperty(this, "name"
    , { value: obj.f, writable: false });
    }
  else if("function"==typeof(obj)){
    Object.defineProperty(this, this.vf?"fun":"__"
    , { value: obj, writable: false });
    }
  else if(obj instanceof SC_LateBinding){
    if(this.vf && !obj.vf){
      if(obj.name){
        Object.defineProperty(this, "name"
        , { value: obj.name , writable: false });
        }
      if(obj.tgt){
        Object.defineProperty(this, "tgt"
        , { value: obj.tgt , writable: false });
        }
      if(obj.tp){
        this.tp= obj.tp;
        }
      if(obj.args){
        this.args= obj.args;
        }
      if(obj.__){
        Object.defineProperty(this, "fun"
        , { value: obj.__ , writable: false });
        }
      }
    else{
      return obj;
      }
    }
  else if(undefined===obj){
    console.warn("no parameter found for late binding: "+arguments);
    return undefined;
    }
  else{ 
    Object.defineProperty(this, "tv"
    , { value: true, writable: false });
    Object.defineProperty(this, "value"
    , { value: obj, writable: false });
    }
  if(undefined!==args){
    if(undefined!==args.p){
      if(Array.isArray(args.p)){
        this.args= args.p; 
        }
      else{
        throw new Error("invalid parameters definition: "+args.p);
        }
      }
    else if(undefined!==args.tp){
      this.tp= args.tp;
      }
    else if(!this.vf){
      throw new Error("Invalid use of arguments on binding");
      }
    }
  else if(undefined!==obj.p){
    this.args= obj.p; 
    }
  };
(function(){
  const proto= SC_LateBinding.prototype;
  Object.defineProperty(proto, "isBinding"
    , { enumerable: false, value: true, writable: false });
  Object.defineProperty(proto, "resolve"
  , { enumerable: false
    , value: function(){
          if(undefined!==this.value){
            return this.value;
            }
          var val= undefined;
          if(this.tgt && this.name){
            const getter= function(){
                var val= this.tgt[this.name];
                if(undefined==val && this.tgt._sc_extension){
                  val= this.tgt._sc_extension[this.name];
                  }
                if(undefined==val){
                  console.warn("target still not found : ", this.name, "on",
                                                                        this.tgt);
                  return this;
                  }
                return val;
                };
            val= getter.call(this);
            if(val!=this && "function"!=typeof(val)){
              Object.defineProperty(this, "value", { get: getter });
              }
            else if("function"==typeof(val) && undefined===this.__){
              Object.defineProperty(this, this.vf?"fun":"__", { value: val,
                                                               writable: false });
              }
            }
          if(this.__){
            if(undefined!=this.args){
              const p= [ this.tgt ].concat(this.args);
              val= this.__.bind.apply(this.__, p);
              }
            else if(undefined!==this.tp){
              val= this.__.bind(this.tgt, this.tgt[this.tp]);
              }
            else{
              val= this.__.bind(this.tgt);
              }
            Object.defineProperty(this, "value", { get: val });
            }
          else if(this.fun && this.vf){
            if(undefined!=this.args){
              const p= [ this.tgt ].concat(this.args);
              Object.defineProperty(this, "value"
              , { value: this.fun.bind.apply(this.fun, p)
                , writable: false });
              }
            else if(undefined!==this.tp){
              const p= [ this.tgt ].concat([ this.tgt[this.tp] ]);
              Object.defineProperty(this, "value"
              , { value: this.fun.bind.apply(this.fun, p)
                , writable: false });
              }
            else{
              Object.defineProperty(this, "value"
              , { value: this.fun.bind(this.tgt)
                , writable: false });
              }
            }
          else{
            if(undefined===val){
              debugger;
              }
            }
          return this.value;
          }
    , writable: false });
  Object.defineProperty(proto, "toString"
  , { enumerable: false
    , value: function(){
        if(this.name || this.tgt){
          return "@."+this.name+"";
          }
        else{
          return this.resolve.toString();
          }
        }
    , writable: false });
  })();
function SC_LateBinding_setCube(b, obj){
  if(b instanceof SC_LateBinding){
    if(b.tgt){
      if("object"==typeof(b.tgt)){
        return;
        }
      else{
        throw new Error("Internal Error: invalid binding: "+b);
        }
      }
    if(obj instanceof SC_Cube){
      obj= obj.o;
      }
    Object.defineProperty(b, "tgt"
    , { value: obj, writable: false });
    }
  else{
    throw new Error("Internal Error: is not a binding");
    }
  };
function SC_LateNumBinding(){
  const obj= arguments[0];
  if("string"==typeof(obj) && ""!=obj){
    Object.defineProperty(this, "name"
    , { value: obj , writable: false });
    }
  else if("object"==typeof(obj) && "object"==typeof(obj.t)
          && "string"==typeof(obj.f) && ""!=obj.f){
    Object.defineProperty(this, "tgt"
    , { value: obj.t, writable: false });
    Object.defineProperty(this, "name"
    , { value: obj.f, writable: false });
    }
  else if("function"==typeof(obj)){
    Object.defineProperty(this, "__"
    , { value: obj, writable: false });
    }
  else if(obj instanceof SC_LateBinding){
    return obj;
    }
  else if(undefined===obj){
    return undefined;
    }
  else{
    Object.defineProperty(this, "value"
    , { value: obj, writable: false });
    }
  const args= arguments[1];
  if(undefined!==args){
    if(undefined!==args.p){
      this.args= args.p; 
      }
    else if(undefined!==args.tp){
      this.tp=args.tp;
      }
    else{
      throw new Error("Invalid use of arguments on binding");
      }
    }
  else if(undefined!==obj.p){
    this.args= obj.p; 
    }
  }
function SC_CubeExposedState(){};
(function(){
  const proto= SC_CubeExposedState.prototype;
  Object.defineProperty(proto, "toString"
  , { value: function(){
          return "$@";
          }
    , writable: false });
  Object.freeze(proto);
  })();
function SC_CubeExposedStateInternal(){};
(function(){
  const proto= SC_CubeExposedStateInternal.prototype;
  proto.exposedState= function(m){
      return this.cube.getExposeReader(m);
      };
  proto.setCube= function(cube){
      this.cube= cube;
      return this;
      };
  proto.__proto__= SC_CubeExposedState.prototype;
  Object.freeze(proto);
  })();
const _SC= {
    markProgram: function(p){
        Object.defineProperty(p, "isAnSCProgram", { value: true
                                                           , writable: false });
        }
  , b_: function(nm, args){
        if(("string"==typeof(nm) && ""!=nm)
          ||(!isNaN(parseInt(nm)))
          ||nm===true
          ||nm===false
          ||"function"==typeof(nm)
          ||("object"==typeof(nm)
             && "object"==typeof(nm.t)
             && "string"==typeof(nm.f)
             && ""!=nm.f)
          || nm instanceof SC_LateBinding
              ){
          return new SC_LateBinding(nm, args);
          }
        return nm;
        }
  , _b: function(cube){
        return function(o){
             if(o instanceof SC_LateBinding){
               SC_LateBinding_setCube(o, this);
               return o.resolve();
               }
             return o;
             }.bind(cube);
        }
  , bindIt: function(targetAcion){
      if((undefined!==targetAcion.t)
         &&(undefined!==targetAcion.f)){
        const tmp=targetAcion.t[targetAcion.f];
        if(tmp && ("function"==typeof(tmp))){
          if(undefined!==targetAcion.p){
            throw new Error("buh");
            return tmp.bind(targetAcion.t, targetAcion.p);
            }
          else if(undefined!==targetAcion.tp){
            throw new Error("buh");
            return tmp.bind(targetAcion.t[targetAcion.tp], targetAcion.p);
            }
          else{
            return tmp.bind(targetAcion.t);
            }
          }
        }
      return targetAcion;
      }
  , isEvent: function(evt){
      if(undefined==evt){
        return false;
        }
      return (evt instanceof SC_EventId)||(evt instanceof SC_SensorId)
            || ("string"==typeof(evt))
            || (evt instanceof SC_LateBinding)
            || ("object"==typeof(evt) && "object"==typeof(evt.t)
                   && "string"==typeof(evt.f));
      }
  , isStrictSensor: function(sens){
      if(undefined==sens){
        return false;
        }
      return sens instanceof SC_SensorId
            || ("string"==typeof(sens))
            || (sens instanceof SC_LateBinding)
            || ("object"==typeof(sens) && "object"==typeof(sens.t)
                   && "string"==typeof(sens.f));
      }
  , isStrictEvent: function(evt){
      if(undefined==evt){
        return false;
        }
      return (evt instanceof SC_EventId)
            || ("object"==typeof(evt) && "object"==typeof(evt.t)
                   && "string"==typeof(evt.f))
            || (evt instanceof SC_LateBinding);
      }
  , aConfig_: function(c){
      if(c instanceof SC_EventId){
        return c;
        }
      return new SC_LateNumBinding(c);
      }
  , aNum: function(num){
        if("number"==typeof(num)){
          return parseInt(num)
          }
        if(("object"==typeof(num) && "object"==typeof(num.t)
                     && "string"==typeof(num.f) && ""!=num.f)
              || ("string"==typeof(num) && ""!=num)
              || ("function"==typeof(num))
              || (num instanceof SC_LateBinding)){
          return new SC_LateBinding(num);
          }
        throw new Error("Invalid num parameter: "+num);
        }
  , aNum_: function(num){
        if(undefined===num){
          return num;
          }
        return this.aNum(num);
        }
  , isANum: function(num){
      if(undefined==num){
        return false;
        }
      return ("number"==typeof(num))
            || ("object"==typeof(num) && "object"==typeof(num.t)
                   && "string"==typeof(num.f))
            || (num instanceof SC_LateBinding);
      }
  , isFun: function(fun){
      if(undefined==fun){
        return false;
        }
      return ("function"==typeof(fun))
            || "string"==typeof(fun)
            || ("object"==typeof(fun) && "object"==typeof(fun.t)
                   && "string"==typeof(fun.f))
            || (fun instanceof SC_LateBinding);
      }
  , checkEvent: function(evt){
      if(! this.isEvent(evt)){
        if(/^[a-zA-Z0-9_$]+$/.test(evt)){
            return this.b_(evt);
          }
        throw "evt is an invalid event";
        }
      return evt;
      }
  , isStrictEvent: function(evt){
      if(undefined == evt){
        return false;
        }
      return (evt instanceof SC_EventId)
             || (evt instanceof SC_LateBinding);
      }
  , checkStrictEvent: function(evt){
      if(! this.isStrictEvent(evt)){
        if(/^[a-zA-Z0-9_$]+$/.test(evt)){
            return this.b_(evt);
          }
        throw new Error(evt+" is an invalid event");
        }
      return evt;
      }
  , isConfig: function(cfg){
      if(undefined==cfg){
        return false;
        }
      return (cfg instanceof SC_Or) || (cfg instanceof SC_OrBin)
             || (cfg instanceof SC_And) || (cfg instanceof SC_AndBin)
             || (cfg instanceof SC_LateBinding)
             || (cfg instanceof SC_SensorId)
             || this.isEvent(cfg);
      }
  , checkConfig: function(cfg){
      if(!this.isConfig(cfg)){
        if(/^[a-zA-Z0-9_$]+$/.test(cfg)){
            return this.b_(cfg);
          }
        throw new Error(cfg+" is an invalid config");
        }
      return cfg;
      }
  , lateBindProperty: function(copy, name, param){
      if(param instanceof SC_LateBinding){
        delete copy[name];
        Object.defineProperty(copy, name, {get: param.resolve.bind(param.o)});
        }
      else if("function" == typeof param){
        delete copy[name];
        Object.defineProperty(copy, name,{get: param});
        }
      else{
        Object.defineProperty(copy, name,{value: param});
        }
      }
  };
function SC_cubify(params){
  if(undefined==params){
    params= {};
    }
  Object.defineProperty(this, "SC_cubeAddBehaviorEvt"
                          , { enumerable: false
                            , value: ((undefined!=params.addEvent)
                                          ? params.addEvent
                                          : SC.evt("addBehaviorEvt"))
                            , writable: false
                              }
                            );
  Object.defineProperty(this, "SC_cubeKillEvt"
                          , { enumerable: false
                            , value: ((undefined!=params.killEvent)
                                          ? params.killEvent
                                          : SC.evt("killSelf"))
                            , writable: false
                              }
                            );
  if(params.sci){
    params.sci.call(this);
    }
  };
const VOID_VALUES= [];
Object.freeze(VOID_VALUES);
var nextEventID= 0;
function SC_EventId(params){
  this.makeNew= params.makeNew;
  this.distribute= params.distribute;
  const registeredMachines= {};
  Object.defineProperty(this, "internalId"
         , { value: nextEventID++, writable: false });
  Object.defineProperty(this, "iids"
         , { value: new String(""+this.internalId), writable: false });
  Object.defineProperty(this, "name"
         , { value: "&_"+this.internalId+"_"+params.name, writable: false } );
  Object.defineProperty(this, "bindTo"
         , { value: (function(registeredMachines, engine, parbranch
                            , seq, path, cube, cinst){
    if(!registeredMachines[engine.id]){
      registeredMachines[engine.id]=engine.getEvent(this);
      }
    return registeredMachines[engine.id];
    }).bind(this, registeredMachines), writable: false } );
  };
SC_EventId.prototype={
  constructor: SC_EventId
, isSensor: false
, getId: function(){
    return this.internalId;
    }
, toString: function(){
    return this.name;
    }
, getName: function(){
    return this.name;
    }
  };
function SC_Event(id, m){
  this.lein=-1; 
  this.name=id.name; 
  this.eventId=id;
  if(
    (undefined!=id.makeNew)
    && (undefined!=id.distribute)
    ){
    return new SC_EventDistributed(id);
    }
  this.vals=[];
  this.permanentGenerators=[];
  this.permanentValuatedGenerator=0;
  this.registeredInst=[];  
  this.m=null; 
  };
SC_Event.prototype={
  constructor: SC_Event
, isPresent: function(m){
    return this.lein==m.instantNumber;
    }
, wakeupAll: function(m, flag){
    for(var inst of this.registeredInst){
      inst.wakeup(m, flag);
      }
    }
, generateInput: function(m, val){
    if(this.lein!=m.instantNumber){
      this.lein= m.instantNumber;
      this.vals= [];
      this.wakeupAll(m, true);
      if(undefined!=val){
        m.generated_values[this.eventId.iids]= this.vals;
        }
      }
    this.vals.push(val);
    }
, generate: function(m, flag){
    if(this.lein!=m.instantNumber){
      this.lein=m.instantNumber;
      this.vals= [];
      this.wakeupAll(m, false);
      if(flag){
        m.generated_values[this.eventId.iids]= this.vals;
        }
      }
    }
, generateValues: function(m, val){
    this.vals.push(val);
    }
, unregister: function(i){
    var t=this.registeredInst.indexOf(i);
    if(-1<t){
      this.registeredInst.splice(t, 1);
      }
    }
, registerInst: function(m, inst){
    this.registeredInst.push(inst);
    }
, getValues: function(m){
    if(this.lein!=m.instantNumber){
      this.vals=[];
      }
    return this.vals;
    }
, getAllValues: function(m, vals){
    vals[this.eventId]=(this.lein==m.instantNumber)?this.vals:VOID_VALUES;
    }
, bindTo: function(engine, parbranch, seq, path, cube, cisnt){
    if(null == this.m){
      this.m=engine;
      }
    else if(this.m!==engine){
      throw 'bound event ('+this.name+') problem';
      }
    return this;
    }
, toString: function(){
    return this.eventId.name;
    }
  };
function SC_EventDistributed(id){
  this.lein=-1; 
  this.name=id.name; 
  this.eventId= id;  
  this.makeNew= id.makeNew;
  this.distribute= id.distribute;
  this.vals= this.makeNew();
  this.permanentGenerators= [];
  this.permanentValuatedGenerator= 0;
  this.registeredInst= [];  
  this.m=null; 
  this.internalID= nextEventID++;
  };
SC_EventDistributed.prototype={
  constructor: SC_EventDistributed
, generateInput: function(m, val){
    if(this.lein!=m.instantNumber){
      this.lein= m.instantNumber;
      this.vals= this.makeNew();
      this.wakeupAll(m, true);
      if(undefined!=val){
        m.generated_values[this.eventId.iids]= this.vals;
        }
      }
    this.distribute(this.vals, val);
    }
, generate: function(m, flag){
    if(this.lein!=m.instantNumber){
      this.lein=m.instantNumber;
      this.vals=this.makeNew();
      this.wakeupAll(m, false);
      if(flag){
        m.generated_values[this.eventId.iids]= this.vals;
        }
      }
    }
, generateValues: function(m, val){
    this.distribute(this.vals, val);
    }
, getValues: function(m){
    if(this.lein!=m.instantNumber){
      this.vals=this.makeNew();
      }
    return this.vals;
    }
, __proto__: SC_Event.prototype
  };
function SC_SensorId(params){
  Object.defineProperty(this, "internalId"
         , { value: nextEventID++, writable: false });
  Object.defineProperty(this, "iids"
         , { value: new String(this.internalId), writable: false });
  Object.defineProperty(this, "name"
         , { value: "#_"+this.internalId+"_"+params.name, writable: false });
  const boundClocks= [];
  const binder= {
      sens: this
    , bc: boundClocks
    , add: function(clk){
          if(this.bc.includes(clk)){
            console.wran("already bound");
            }
          else{
            this.bc.push(clk);
            }
          }
    , remove: function(clk){
          const pos= this.bc.indexOf(clk);
          if(pos>=0){
            this.bc.splice(pos, 1);
            }
          else{
            console.wran("cannot remove not existing");
            }
          }
      };
  SC_Global_Manager.registerBinder(binder);
  if(params.isPower){
    if((!isNaN(params.n) || !isNaN(params.delay))){
      this.n=params.n;
      this.delay=params.delay;
      this.async=(params.async)?params.async:NO_FUN;
      if(!isNaN(params.delay)){
        if(params.delay>0){
          const handle=setInterval(function(bc){
            SC_Global_Manager.updateSensor(this);
            for(var c of bc){ c(); }
            }.bind(this, boundClocks), params.delay);
          Object.defineProperty(this, "stop"
                 , { value: function(h){
                       clearInterval(h);
                       }.bind(this, handle), writable: false } );
          }
        else{
          throw new Error("invalid delay");
          }
        }
      else{
        Object.defineProperty(this, "run"
               , { value: function(bc){
                       for(var i= 0; i<this.n; i++){
                         this.async();
                         SC_Global_Manager.updateSensor(this);
                         for(var c of bc){ c(); }
                         }
                       }.bind(this, boundClocks), writable: false } );
        }
      }
    else{
      const b= { 
          ad: null
        , posted: false
          };
      const animDetector= function(b, bc, ts){
        b.posted= false;
        SC_Global_Manager.updateSensor(this, ts);
        for(var c of bc){ c(); }
        }.bind(this, b, boundClocks);
      b.ad= animDetector;
      b.posted= true;
      sc_global.requestAnimationFrame(animDetector);
      Object.defineProperty(this, "needRefresh"
             , { value: function(b){
                   if(!b.posted){
                     b.posted= true;
                     sc_global.requestAnimationFrame(b.ad);
                     }
             }.bind(this, b), writable: false } );
      }
    }
  else{ 
    if(params.dom_targets && Array.isArray(params.dom_targets)){
      this.dom_targets= params.dom_targets;
      }
    else{
      this.dom_targets= [];
      }
    const times= params.times?parseInt(params.times):-1;
    const timer= { count: isNaN(times)?-1:times };
    const basic_handler= function(bc, evt){
        SC_Global_Manager.updateSensor(this, evt);
        for(var c of bc){ c(); }
        }.bind(this, boundClocks);
    const timed_handler= function(timer, evt){
          if(timer.count-->0){
            basic_handler.call(undefined, evt);
            }
          else{
            this.release();
            }
          }.bind(this, timer);
    const handler= (0>=timer.count)
        ?basic_handler
        :timed_handler;
    Object.defineProperty(this, "release"
           , { value: function(handler, some){
                 const rm=(some && "array"==typeof(some))?some
                                      :this.dom_targets;
                 if(rm){
                   for(var t of rm){
                     if(t.evt && "string"==typeof(t.evt)){
                       t.target.removeEventListener(t.evt, handler);
                       }
                     }
                   }
           }.bind(this, handler), writable: false } );
    if(this.dom_targets){
      for(var t of this.dom_targets){
        if(t.evt && "string"==typeof(t.evt)){
          t.target.addEventListener(t.evt, handler);
          }
        }
      Object.defineProperty(this, "addLink"
             , { value: function(handler, dom_targets){
                   if(undefined==dom_targets){
                     return;
                     }
                   if(Array.isArray(dom_targets)){
                     for(var t of dom_targets){
                       if(t.target && "object"==typeof(t.target)
                          && t.evt && "string"==typeof(t.evt)){
                         t.target.addEventListener(t.evt, handler);
                         }
                       }
                     }
                   else if("object"==typeof(dom_targets)){
                     var t= dom_targets
                     if(t.target && "object"==typeof(t.target)
                        && t.evt && "string"==typeof(t.evt)){
                       t.target.addEventListener(t.evt, handler);
                       }
                     }
                   }.bind(this, handler), writable: false } );
      }
    }
  };
(function(){
const proto= SC_SensorId.prototype;
Object.defineProperty(proto, "isSensor"
, { value: true, writable: false });
Object.defineProperty(proto, "bindTo"
, { value: function(engine){
        return engine.getSensor(this);
        }, writable: false });
proto.getId= function(){
    return this.internalId;
    };
proto.toString= function(){
    return this.name;
    };
proto.getName= function(){
    return this.name;
    };
})();
function SC_SampledId(params){
  Object.defineProperty(this, "internalId"
         , { value: nextEventID++, writable: false });
  Object.defineProperty(this, "name"
         , { value: "#_"+this.internalId+"_"+params.name, writable: false });
  Object.defineProperty(this, "iids"
         , { value: new String(""+this.internalId), writable: false });
  Object.defineProperty(this, "bindTo"
           , { value: function(engine, parbranch, seq, path, cube, cinst){
                 const sens=engine.getSensor(this);
                 return sens;
                 }, writable: false } );
  };
SC_SampledId.prototype={
  constructor: SC_SampledId
, isSampled: true
, __proto__: SC_SensorId.prototype
  };
Object.defineProperty(SC_SampledId.prototype, "newValue"
  , { value: function(value){
        SC_Global_Manager.updateSensor(this, value);
        }
     , writable: false
       });
function SC_Sensor(params){
  this.lein=-1;
  this.sensId=params;
  this.val=null; 
  this.sampleVal=null;
  this.sampled=false;
  this.registeredInst=[];
  };
SC_Sensor.prototype={
  constructor: SC_Sensor
, isPresent: SC_Event.prototype.isPresent
, wakeupAll: SC_Event.prototype.wakeupAll
, generateValues: NO_FUN
, systemGen: function(val, m, flag){
    if(this.lein!=m.instantNumber){
      this.lein= m.instantNumber;
      this.wakeupAll(m, flag);
      this.val= val;
      m.setSensors[this.sensId.iids]= val;
      }
    }
, unregister: SC_Event.prototype.unregister
, registerInst: SC_Event.prototype.registerInst
, getValue: function(m){
    return this.val;
    }
, toString: function(){
    return this.sensId.getName();
    }
  };
const SC_OpcodesNames = [
  "NOP"
  , "_EXIT"
  , "REL_JUMP"
  , "REPEAT_BURST_N_TIMES_INIT"
  , "REPEAT_BURST_N_TIMES_BUT_FOREVER"
  , "REPEAT_BURST_N_TIMES_BUT_FOREVER_TO_STOP"
  , "REPEAT_BURST_N_TIMES"
  , "REPEAT_BURST_N_TIMES_TO_STOP"
  , "REPEAT_N_TIMES_INIT"
  , "REPEAT_N_TIMES_BUT_FOREVER"
  , "REPEAT_N_TIMES_BUT_FOREVER_TO_STOP"
  , "REPEAT_N_TIMES"
  , "REPEAT_N_TIMES_TO_STOP"
  , "REPEAT_LATE_N_TIMES_INIT"
  , "REPEAT_LATE_N_TIMES_BUT_FOREVER"
  , "REPEAT_LATE_N_TIMES_BUT_FOREVER_TO_STOP"
  , "REPEAT_LATE_N_TIMES"
  , "REPEAT_LATE_N_TIMES_TO_STOP"
  , "REPEAT_BURST_FOREVER"
  , "REPEAT_BURST_FOREVER_NEXT"
  , "REPEAT_BURST_FOREVER_STOP"
  , "REPEAT_FOREVER"
  , "REPEAT_FOREVER_TO_STOP"
  , "IF_REPEAT_BURST_INIT"
  , "IF_REPEAT_BURST"
  , "IF_REPEAT_BURST_TO_STOP"
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
  , "STEP_INLINE"
  , "STEP"
  , "STEP_DONE"
  , "STEP_N_TIMES_INIT_INLINE"
  , "STEP_N_TIMES_INLINE"
  , "STEP_N_TIMES_INIT"
  , "STEP_N_TIMES"
  , "PAUSE_INLINE"
  , "PAUSE"
  , "PAUSE_DONE"
  , "PAUSE_BURST"
  , "PAUSE_BURST_STOPPED"
  , "PAUSE_BURST_DONE"
  , "PAUSE_N_TIMES_INIT_INLINE"
  , "PAUSE_N_TIMES_INLINE"
  , "PAUSE_N_TIMES_INIT"
  , "PAUSE_N_TIMES"
  , "PAUSE_BURST_N_TIMES_INIT"
  , "PAUSE_BURST_N_TIMES"
  , "PAUSE_BURST_N_TIMES_STOPPED"
  , "PAUSE_BURST_UNTIL"
  , "PAUSE_BURST_UNTIL_STOP"
  , "PAUSE_BURST_UNTIL_DONE"
  , "PAUSE_UNTIL"
  , "PAUSE_UNTIL_DONE"
  , "NOTHING_INLINED"
  , "NOTHING"
  , "NEXT_INLINED"
  , "NEXT"
  , "NEXT_DYN_INLINED"
  , "NEXT_DYN"
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
  , "GENERATE_BURST_FOREVER_NO_VAL_INIT"
  , "GENERATE_FOREVER_NO_VAL_INIT"
  , "GENERATE_FOREVER_NO_VAL_CONTROLED"
  , "GENERATE_FOREVER_NO_VAL_HALTED"
  , "GENERATE_FOREVER_NO_VAL"
  , "GENERATE_BURST_FOREVER_INIT"
  , "GENERATE_BURST_FOREVER_CELL_INIT"
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
  , "GENERATE_CELL_INLINE"
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
  , "GENERATE_BURST_INIT"
  , "GENERATE_BURST"
  , "GENERATE_BURST_TO_STOP"
  , "GENERATE_BURST_BUT_FOREVER"
  , "GENERATE_BURST_BUT_FOREVER_TO_STOP"
  , "GENERATE_BURST_INLINE"
  , "GENERATE_BURST_INLINE_INIT"
  , "GENERATE_BURST_INLINE_TO_STOP"
  , "GENERATE_BURST_INLINE_BUT_FOREVER"
  , "GENERATE_BURST_INLINE_BUT_FOREVER_TO_STOP"
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
  , "GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL"
  , "GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_RESOLVED"
  , "GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_STOPPED"
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
  , "CUBE_STOP"
  , "CUBE_TERM"
  , "CUBE_WAIT"
  , "CUBE_HALT"
  , "CUBE_BACK"
  , "CELL_INIT"
  , "CELL"
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
  , "SEQ_BRANCH_OF_PAR"
  , "BRANCH_ENDED"
  , "GEN_VAL"
  , "LOG"
  , "RESET_ON_INIT"
  , "RESET_ON"
  , "RESET_ON_BACK"
  , "RESET_ON_OEOI"
  , "RESET_ON_WEOI"
  , "RESET_ON_WAIT"
  , "RESET_ON_P_OEOI"
  , "DUMP_INIT"
  , "DUMP"
  , "DUMP_BACK"
  ];
Object.freeze(SC_OpcodesNames);
const SC_Opcodes={
    toString: function(oc){
      return SC_OpcodesNames[oc]+":"+oc;
      }
  , isValid: function(oc){
      return (oc < this.nb_of_instructions && oc > 0);
      }
  , extractCode(inst){
      return inst?this.toString(inst.oc):"inst=undefined";
      }
    };
for(var n= 0; n<SC_OpcodesNames.length; n++){
  SC_Opcodes[SC_OpcodesNames[n]]= n;
  }
SC_Opcodes.nb_of_instructions= SC_OpcodesNames.length;
Object.freeze(SC_Opcodes);
function SC_Instruction(opcode){
  this.oc=SC_Opcodes.NOP;
  if(SC_Opcodes.isValid(opcode)){
    this.oc=opcode;
    }
  else{
    throw new Error("SugarCubes internal error: invalid opcode "
                   +SC_Opcodes.toString(this.oc));
    }
  this.caller=null;
  this.seq=null;
  this.resetCaller=null;
  Object.defineProperty(this, "nm"
     , { get: function(){ return SC_Opcodes.toString(this.oc); }
       , enumerable: true
       }
     );  
  };
const act_exit= new SC_Instruction(SC_Opcodes._EXIT);
SC_Instruction.prototype={
  constructor: SC_Instruction
, tr: function (m, meth, msg, msg2){
    console.log(
      m.instantNumber
      , meth
      , SC_Opcodes.toString(this.oc)
      , (undefined === msg)?"":msg
      , (undefined === msg2)?"":msg2
      );
    }
, awake: function(m, flag, toEOI){
    switch(this.oc){
      case SC_Opcodes.SEQ_BACK:
      case SC_Opcodes.SEQ:{
        return this.path.awake(m, flag, toEOI);
        }
      case SC_Opcodes.RESET_ON_WAIT:
      case SC_Opcodes.RESET_ON_WEOI:{
        this.oc=SC_Opcodes.RESET_ON;
        }
      case SC_Opcodes.RESET_ON:
      case SC_Opcodes.RESET_ON_BACK:{
        this.path.awake(m, flag, toEOI);
        return true;
        }
      case SC_Opcodes.CUBE:
      case SC_Opcodes.CUBE_BACK:{
        this.path.awake(m, flag, toEOI);
        return true;
        }
      case SC_Opcodes.CUBE_STOP:
      case SC_Opcodes.CUBE_WAIT:{
        this.path.awake(m, flag, toEOI);
        this.oc=SC_Opcodes.CUBE;
        return true;
        }
      case SC_Opcodes.KILL_SUSP_REGISTERED:
      case SC_Opcodes.KILL_BACK:{
        this.path.awake(m, flag, toEOI);
        return true;
        }
      case SC_Opcodes.KILL_WAIT:
      case SC_Opcodes.KILL_WEOI:{
        this.path.awake(m, flag, toEOI);
        this.oc=SC_Opcodes.KILL_SUSP_REGISTERED;
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
      case SC_Opcodes.DUMP_BACK:
      case SC_Opcodes.DUMP:{
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
      case SC_Opcodes.MATCH_BACK:
      case SC_Opcodes.MATCH_CHOOSEN:{
        return this.path.awake(m, flag, toEOI);
        }
      case SC_Opcodes.SEQ_BRANCH_OF_PAR:{
        var res = false;
        if(SC_IState.SUSP == this.flag){
          return true;
          }
        if((SC_IState.WEOI != this.flag)
          &&(SC_IState.WAIT != this.flag)){
          throw new Error("pb awaiking par branch "
                 +SC_IState.toString(this.flag)+" !");
          console.trace();
          return false;
          }
        res = this.path.awake(m, flag, toEOI);
        if(toEOI && (SC_IState.WEOI == this.flag)){
          return res;
          }
        if(res){
          ((SC_IState.WEOI == this.flag)
                        ?this.itsPar.waittingEOI
                        :this.itsPar.waitting).remove(this);
          ((toEOI)?this.itsPar.waittingEOI
                  :this.itsPar.suspended).append(this);
          this.flag = (toEOI)?SC_IState.WEOI
                             :SC_IState.SUSP;
          }
        return res;
        }
      default:{ throw new Error("awake undefined opcode "
                     +SC_Opcodes.toString(this.oc));
        console.trace();
        }
      }
    }
, wakeup: function(m, flag){
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
      case SC_Opcodes.RESET_ON_WAIT:{
        if(this.config.isPresent(m)){
          return this.path.awake(m, flag, true);
          }
        }
      case SC_Opcodes.RESET_ON:
      case SC_Opcodes.RESET_ON_BACK:
      case SC_Opcodes.RESET_ON_P_OEOI:
      case SC_Opcodes.RESET_ON_OEOI:
      case SC_Opcodes.RESET_ON_WEOI:{
        return false;
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
      case SC_Opcodes.CUBE_HALT:
      case SC_Opcodes.CUBE_WAIT:{
        if(this.killEvt.isPresent(m)){
          return this.path.awake(m, flag, true);
          }
        }
      case SC_Opcodes.CUBE:
      case SC_Opcodes.CUBE_BACK:
      case SC_Opcodes.CUBE_STOP:{
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
      default:{ throw new Error("wakeup undefined opcode "
                     +SC_Opcodes.toString(this.oc));
        console.trace();
        }
      }
    }
, computeAndAdd: function(m){
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
, addBranch: function(p, pb, engine){
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
          var b= new SC_SeqBranchOfPar(pb, this, SC_Nothing);
          b.setProgram(p.bindTo(engine, b, null, b, this.cube, this.cinst));
          b.path= this;
          b.purgeable= true;
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
      default:{
        throw new Error("addBranch undefined for opcode "
                         +SC_Opcodes.toString(this.oc));
        }
      }
    }
, registerInProdBranch: function(pb){
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
, unregisterFromProduction: function(b){
    switch(this.oc){
      case SC_Opcodes.PAR_DYN_BACK:
      case SC_Opcodes.PAR_DYN:
      case SC_Opcodes.PAR_BACK:
      case SC_Opcodes.PAR:{
        break;
        }
      case SC_Opcodes.SEQ_BRANCH_OF_PAR:{
        if(null!=this.itsParent){
          this.itsParent.unregisterFromProduction(this.itsPar);
          }
        else{
          this.itsPar.unregisterFromProduction(this);
          }
        break;
        }
      default: throw new Error("unregisterFromProduction undefined for opcode "
                       +SC_Opcodes.toString(this.oc));
      }
    }
, registerForProduction: function(b){
    if(this.emitters.indexOf(b)<0){
      this.emitters.push(b);
      }
    if(null!=this.itsParent){
      this.itsParent.registerForProduction(this.itsPar);
      }
    }
, removeBranch: function(elt){
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
, val: function(){
    return this.state;
    }
, prepare: function(m){
    this.futur=this.sideEffect(this.state, m.reactInterface);
    }
, swap: function(){
    this.state= this.futur;
    }
, its: function(nom){
    return this.o["$"+nom];
    }
, addCell: function(nom, init, el, fun){
    switch(this.oc){
      case SC_Opcodes.CUBE:{
        const tgt=this.o;
        if(undefined!==tgt["$_scc_"+nom]
          || undefined!==tgt["_scc_"+nom]
          || "function"!==typeof(fun)
          ){
          throw Error("naming conflict for cell "+nom
                 + " $_scc_"+nom+" is "+tgt["$_scc_"+nom]
                 + " and _scc_"+nom+" is "+tgt["_scc_"+nom]);
        }
        tgt["_scc_"+nom]=fun;
        tgt["$_scc_"+nom]=new SC_Cell({ init: init
                                      , sideEffect: (tgt["_scc_"+nom]).bind(tgt)
                                      , eventList: el });
        Object.defineProperty(tgt, nom, {
          get: (function(nom){
            return tgt["$_scc_"+nom].val();
            }).bind(tgt, nom)});
        break;
        }
      default:{
        throw new Error("addCell : undefined opcode "
                     +SC_Opcodes.toString(this.oc));
        }
      }
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    return this; 
    }
, getExposeReader: function(m){
    switch(this.oc){
      case SC_Opcodes.CUBE_INIT:
      case SC_Opcodes.CUBE_STOP:
      case SC_Opcodes.CUBE_WAIT:
      case SC_Opcodes.CUBE_HALT:
      case SC_Opcodes.CUBE_BACK:
      case SC_Opcodes.CUBE: break;
      default: throw new Error("not a cube");
      }
    if(this.exposedState.exposeInstant!=m.instantNumber){
      this.swap(m);
      }
    return this.exposeReader;
    }
, toString: function(tab){
    if(undefined == tab){
      tab = "";
      }
    switch(this.oc){
      case SC_Opcodes.REL_JUMP:{
        return "end repeat {\""+this.relativeJump+"\"}";
        }
      case SC_Opcodes.REPEAT_FOREVER:
      case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
        return "repeat forever ";
        }
      case SC_Opcodes.REPEAT_LATE_N_TIMES_INIT:
      case SC_Opcodes.REPEAT_LATE_N_TIMES:
      case SC_Opcodes.REPEAT_LATE_N_TIMES_TO_STOP:{
        return "repeat late"
                +((this.count<0)?"as forever from "+this.it+" times"
                            :this.count+"/"+this.it+" times ");
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
      case SC_Opcodes.SEQ_BACK:
      case SC_Opcodes.SEQ_INIT:
      case SC_Opcodes.SEQ:{
        var res = "[ {\""+SC_Opcodes.toString(this.oc)+" : "+this.idx+"/"
                                           +this.seqElements.length+"\"}\n"+tab;
        for(var i = this.idx; i < this.seqElements.length; i++){
          res += this.seqElements[i].toString(tab);
          res += (i<this.seqElements.length-1)?";":"";
          }
        return res+"\n"+tab+"] ";
        }
      case SC_Opcodes.HALT:{
        return "pause forever ";
        }
      case SC_Opcodes.PAUSE_INLINE:
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
      case SC_Opcodes.TEST:{
        return "test [ ";
        }
      case SC_Opcodes.GENERATE_ONE_INLINE:
      case SC_Opcodes.GENERATE_ONE:{
        return "generate "+this.evt.toString()
               +((null != this.val)?"("+this.val.toString()+") ":"");
        }
      case SC_Opcodes.GENERATE_FOREVER_NO_VAL:{
        return "generate "+this.evt.toString()+" forever ";
        }
      case SC_Opcodes.GENERATE_BURST_INIT_INLINE:
      case SC_Opcodes.GENERATE_BURST_INLINE:
      case SC_Opcodes.GENERATE_BURST_INIT:
      case SC_Opcodes.GENERATE_BURST:{
        return "generate burst "+this.evt.toString()+" ("
               +this.val+") for "+this.count+"/"+this.times+" times ";
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
        return "await {\""+SC_Opcodes.toString(this.oc)+"\"} "
                                                        +this.config.toString();
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
      case SC_Opcodes.PAUSE_N_TIMES_INLINE:{
        return "pause "+this.count+"/"+this.times+" times";
        }
      case SC_Opcodes.CUBE_HALT:
      case SC_Opcodes.CUBE_WAIT:
      case SC_Opcodes.CUBE:{
        return "cube "+this.o.toString()
               +" with "+this.p.toString()+" end";
        }
      case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_HALTED:{
        return "action "+this.evtFun+" on "+this.evtFun.config.toString()
                +" forever";
        }
      case SC_Opcodes.ACTION_ON_EVENT:{
        return "action "+this.evtFun+" on "+this.evtFun.config.toString();
        }
      case SC_Opcodes.CUBE_ACTION_INLINE:{
        return "*action "+this.closure;
        }
      case SC_Opcodes.RESET_ON_INIT:
      case SC_Opcodes.RESET_ON:
      case SC_Opcodes.RESET_ON_BACK:
      case SC_Opcodes.RESET_ON_OEOI:
      case SC_Opcodes.RESET_ON_P_OEOI:
      case SC_Opcodes.RESET_ON_BACK:{
        return "reset {\""+SC_Opcodes.toString(this.oc)+"\"} "
                            +this.prog.toString()+" on "+this.config.toString();
        }
      case SC_Opcodes.PAUSE_BURST_STOPPED:{
        return "pause burst ";
        }
      case SC_Opcodes.PAUSE_BURST_UNTIL:{
        return "pause burst until "+this.cond+" ";
        }
      case SC_Opcodes.CELL_INIT:
      case SC_Opcodes.CELL:{
        return "compute "+this.sideEffect+" on "+this.state
               +((null == this.eventList)?"":" with "+this.eventList);
        }
      default: throw new Error("toString() : undefined opcode "
                     +SC_Opcodes.toString(this.oc));
      }
    }
, updateAtEndOfBurst: function(clock){
    switch(this.oc){
      case SC_Opcodes.REPEAT_BURST_FOREVER: 
      case SC_Opcodes.PAUSE_BURST:{ 
        break;
        }
      case SC_Opcodes.PAUSE_BURST_STOPPED:{
        this.oc= SC_Opcodes.PAUSE_BURST_DONE;
        break;
        }
      case SC_Opcodes.REPEAT_BURST_N_TIMES_BUT_FOREVER_TO_STOP:{
        this.oc= SC_Opcodes.REPEAT_BURST_N_TIMES_BUT_FOREVER;
        break;
        }
      case SC_Opcodes.REPEAT_BURST_N_TIMES_TO_STOP:{
        if(0===this.count){
          this.seq.idx+= this.end;
          this.oc= SC_Opcodes.REPEAT_BURST_N_TIMES_INIT;
          break;
          }
        this.oc= SC_Opcodes.REPEAT_BURST_N_TIMES;
        break;
        }
      case SC_Opcodes.IF_REPEAT_BURST_TO_STOP:{
        this.oc = SC_Opcodes.IF_REPEAT_BURST_INIT;
        break;
        }
      case SC_Opcodes.PAUSE_BURST_N_TIMES_STOPPED:{
        this.count--;
        this.oc= SC_Opcodes.PAUSE_BURST_N_TIMES;
        break;
        }
      case SC_Opcodes.REPEAT_BURST_FOREVER_STOP:{
        this.oc= SC_Opcodes.REPEAT_BURST_FOREVER;
        break;
        }
      case SC_Opcodes.GENERATE_BURST_TO_STOP:{
        this.oc= SC_Opcodes.GENERATE_BURST;
        break;
        }
      case SC_Opcodes.GENERATE_BURST_INLINE_TO_STOP:{
        this.oc= SC_Opcodes.GENERATE_BURST_INLINE;
        break;
        }
      case SC_Opcodes.GENERATE_BURST_INLINE_BUT_FOREVER_TO_STOP:{
        this.oc= SC_Opcodes.GENERATE_BURST_INLINE_BUT_FOREVER;
        break;
        }
      case SC_Opcodes.GENERATE_BURST_BUT_FOREVER_TO_STOP:{
        this.oc= SC_Opcodes.GENERATE_BURST_BUT_FOREVER;
        break;
        }
      case SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_STOPPED:{
        this.oc= SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_RESOLVED;
        break;
        }
      case SC_Opcodes.PAUSE_BURST_UNTIL_STOP:{
        this.oc= this.cond(clock.reactInterface)
                                              ?SC_Opcodes.PAUSE_BURST_UNTIL_DONE
                                                  :SC_Opcodes.PAUSE_BURST_UNTIL;
        break;
        }
      default: throw new Error("updateAtEndOfBurst() : undefined opcode "
                     +SC_Opcodes.toString(this.oc));
      }
    }
  };
const SC_nothing= new SC_Instruction(SC_Opcodes.NOTHING);
const SC_Nothing= {
    bindTo: function(){
        return SC_nothing;
        }
    };
proto= SC_Nothing;
_SC.markProgram(proto);
Object.freeze(proto);
function SC_Next(count){
  this.count= count;
  };
proto= SC_Next.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const count= binder(this.count);
    const copy= new SC_Instruction(('function' == typeof(count))
                                          ?SC_Opcodes.NEXT_DYN
                                          :SC_Opcodes.NEXT
                                   );
    copy.count= count;
    copy._count= this.count;
    return copy;
    };
proto.toString= function(){
    return "next "+(this.count>0?(this.count+" times "):"");
    };
const SC_PauseForever= new SC_Instruction(SC_Opcodes.HALT);
const SC_PauseForEver= {
    bindTo: function(engine, parbranch, seq, path, cube, cinst){
        return SC_PauseForever;
        }
    };
proto= SC_PauseForEver;
_SC.markProgram(proto);
Object.freeze(proto);
function SC_PauseBurstOne(){};
proto= SC_PauseBurstOne.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    return new SC_Instruction(SC_Opcodes.PAUSE_BURST);
    };
proto.toString= function(){
    return "pause burst ";
    };
function SC_PauseOne(){};
proto= SC_PauseOne.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    return new SC_Instruction(SC_Opcodes.PAUSE);
    };
proto.toString= function(){
    return "pause ";
    };
function SC_PauseBurst(times){
  if(times<0){
    return SC_PauseForEver;
    }
  if(0===times){
    return SC_Nothing;
    }
  this.times= times?times:1;
  if(1===this.time){
    return new SC_PauseBurstOne();
    }
  };
proto= SC_PauseBurst.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_times= binder(this.times);
    if(bound_times<0){
      return SC_PauseForever;
      }
    else if(0==bound_times){
      return SC_nothing;
      }
    else if(1===bound_times){
      return new SC_PauseBurstOne().bindTo(engine, parbranch, seq, path, cube
                                                                       , cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.PAUSE_BURST_N_TIMES_INIT);
    _SC.lateBindProperty(copy, "times", bound_times);
    copy._times= this.times;
    return copy;
    }
proto.toString= function(){
    return "pause burst "+this.times+" times ";
    };
function SC_Pause(times){
  if(times<0){
    return SC_PauseForEver;
    }
  if(0===times){
    return SC_Nothing;
    }
  this.times= times?times:1;
  if(1===this.time){
    return new SC_PauseOne();
    }
  };
proto= SC_Pause.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_times= binder(this.times);
    if(bound_times<0){
      return SC_PauseForever;
      }
    else if(0==bound_times){
      return SC_nothing;
      }
    else if(1===bound_times){
      return new SC_PauseOne().bindTo(engine, parbranch, seq, path, cube
                                                                       , cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.PAUSE_N_TIMES_INIT);
    _SC.lateBindProperty(copy, "times", bound_times);
    copy._times= this.times;
    return copy;
    }
proto.toString= function(){
    return "pause "+this.times+" times ";
    };
function SC_PauseRT(duration){
  this.duration= duration;
  };
proto= SC_PauseRT.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.PAUSE_RT_INIT);
    copy.duration= binder(this.duration)*1000;
    copy._duration= this.duration;
    return copy;
    };
proto.toString= function(){
    return "pause for "+this.duration+" ms ";
    };
function SC_PauseBurstUntil(cond){
  this.cond= cond;
  };
proto= SC_PauseBurstUntil.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_cond= binder(this.cond);
    if(true===bound_cond){
      return SC_PauseBurstOne.bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(false==bound_cond){
      return SC_PauseForever;
      }
    const copy= new SC_Instruction(SC_Opcodes.PAUSE_BURST_UNTIL);
    copy.cond= bound_cond;
    copy._cond= this.cond;
    return copy;
    }
proto.toString= function(){
    return "pause burst until "+this.cond;
    };
function SC_PauseUntil(cond){
  this.cond= cond;
  };
proto= SC_PauseUntil.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_cond= binder(this.cond);
    if(true===bound_cond){
      return SC_PauseOne.bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(false==bound_cond){
      return SC_PauseForever;
      }
    const copy= new SC_Instruction(SC_Opcodes.PAUSE_UNTIL);
    copy.cond= bound_cond;
    copy._cond= this.cond;
    return copy;
    }
proto.toString= function(){
    return "pause until "+this.cond;
    };
function SC_Seq(seqElements){
  this.seqElements= [];
  for(var i=0; i<seqElements.length; i++){
    const prg= seqElements[i];
    if(SC_Nothing==prg){
      continue;
      }
    if(prg instanceof SC_Seq){
      const len=prg.seqElements.length;
      for(var j=0; j<len; j++){
        this.seqElements.push(prg.seqElements[j]);
        }
      }
    else if(prg instanceof SC_Par && 1==prg.branches.length){
      this.seqElements.push(prg.branches[0].prg);
      }
    else{
      this.seqElements.push(prg);
      }
    }
  };
proto= SC_Seq.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
      const copy= new SC_Instruction(SC_Opcodes.SEQ_INIT);
      copy.seqElements= [];
      for(var i= 0; i<this.seqElements.length; i++){
        var prg= this.seqElements[i];
        if(prg===SC_nothing){
          throw new Error("Seq binding : encountered nothing !");
          }
        if(prg instanceof SC_Seq){
          throw new Error("Seq : binding while seq is in !");
          }
        else{
          copy.seqElements.push(prg);
          }
        }
      copy.idx= 0;
      for(copy.idx= 0; copy.idx<copy.seqElements.length; copy.idx++){
        const eos= copy.seqElements[copy.idx]= copy.seqElements[copy.idx]
                                      .bindTo(engine, parbranch, copy
                                            , copy, cube, cinst);
        switch(eos.oc){
          case SC_Opcodes.PAUSE:{
            eos.oc= SC_Opcodes.PAUSE_INLINE;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT: {
            eos.oc= SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.NEXT: {
            eos.oc= SC_Opcodes.NEXT_INLINED;
            break;
            }
          case SC_Opcodes.NEXT_DYN: {
            eos.oc= SC_Opcodes.NEXT_DYN_INLINED;
            break;
            }
          case SC_Opcodes.ACTION: {
            eos.o = SC_Opcodes.ACTION_INLINE;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INIT: {
            eos.oc= SC_Opcodes.ACTION_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.CUBE_ACTION:{
            eos.oc= SC_Opcodes.CUBE_ACTION_INLINE;
            break;
            }
          case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT:{
            eos.oc= SC_Opcodes.CUBE_ACTION_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_NO_VAL:{
            eos.oc= SC_Opcodes.GENERATE_ONE_NO_VAL_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_INIT:{
            eos.oc= SC_Opcodes.GENERATE_ONE_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_INIT:{
            eos.oc= SC_Opcodes.GENERATE_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_BURST_INIT:{
            eos.oc= SC_Opcodes.GENERATE_BURST_INIT_INLINE;
            break;
            }
          case SC_Opcodes.GENERATE_NO_VAL_INIT:{
            eos.oc= SC_Opcodes.GENERATE_NO_VAL_INIT_INLINE;
            break;
            }
          case SC_Opcodes.AWAIT:{
            eos.oc= SC_Opcodes.AWAIT_INLINE;
            break;
            }
          case SC_Opcodes.STEP:{
            eos.oc= SC_Opcodes.STEP_INLINE;
            break;
            }
          case SC_Opcodes.STEP_N_TIMES_INIT:{
            eos.oc= SC_Opcodes.STEP_N_TIMES_INIT_INLINE;
            break;
            }
          default:{
            break;
            }
          }
        }
      copy.idx= 0;
      copy.seqElements.push(new SC_Instruction(SC_Opcodes.SEQ_ENDED))
      copy.max= copy.seqElements.length-2;
      copy.path= path;
      return copy;
      };
proto.toString= function(){
      var res ="[";
      for(var i = 0; i < this.seqElements.length; i++){
        res += this.seqElements[i].toString();
        res += (i < this.seqElements.length-1)?";":"";
        }
      return res+"] ";
      };
function SC_RelativeJump(jump, no_test){
  this.relativeJump= jump; 
  this.no_test= no_test;
  };
proto= SC_RelativeJump.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(SC_Opcodes.REL_JUMP);
    const jmp= parseInt(this.relativeJump);
    copy.relativeJump= isNaN(jmp)?1:jmp;
    if(jmp<0){
      const i= seq.idx+jmp;
      const rp= seq.seqElements[i];
      if(!this.no_test && !(SC_Opcodes.IF_REPEAT_INIT==rp.oc)
          && !(SC_Opcodes.IF_REPEAT_BURST_INIT==rp.oc)
          && !(SC_Opcodes.REPEAT_BURST_N_TIMES_INIT==rp.oc)
          && !(SC_Opcodes.REPEAT_N_TIMES_INIT==rp.oc)
          && !(SC_Opcodes.REPEAT_LATE_N_TIMES_INIT==rp.oc)
          && !(SC_Opcodes.REL_JUMP==rp.oc)
          && !(SC_Opcodes.REPEAT_BURST_FOREVER==rp.oc)
          && !(SC_Opcodes.REPEAT_FOREVER==rp.oc)){
        console.warn("invalid branching", seq.idx, jmp, rp, seq);
        throw new Error("bad jump");
        }
      }
    copy.seq= seq;
    return copy;
    };
proto.toString= function(){
    return "] end repeat {\""+this.relativeJump+"\"} ";
    };
function SC_IfRepeatBurstPoint(cond){
  this.condition= cond; 
  this.end= 0;
  };
proto= SC_IfRepeatBurstPoint.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(SC_Opcodes.IF_REPEAT_BURST_INIT);
    const binder= _SC._b(cube);
    binder(this.condition)
    const cond= (this.condition.tv)?this.condition.value:this.condition;
    const jmp= parseInt(this.end);
    copy.end= isNaN(jmp)?0:jmp;
    if(0===copy.end){
      throw new Error("Internal error");
      }
    if(true===cond){
      return new SC_RepeatBurstPointForever().bindTo(engine, parbranch, seq
                                                           , path, cube, cinst);
      }
    else if(false==cond){
      return new SC_RelativeJump(copy.end).bindTo(engine, parbranch, seq
                                                           , path, cube, cinst);
      }
    copy.condition= cond;
    copy._condition= this.condition;
    copy.seq= seq;
    return copy;
    };
proto.toString= function(){
    return "while "+this.condition+" repeat burst [ ";
    };
function SC_IfRepeatPoint(cond){
  this.condition= cond; 
  this.end= 0;
  };
proto= SC_IfRepeatPoint.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    binder(this.condition);
    const bound_cond= (this.condition.tv)?this.condition.value:this.condition;
    const jmp= parseInt(this.end);
    const copy= new SC_Instruction(SC_Opcodes.IF_REPEAT_INIT);
    copy.end= isNaN(jmp)?0:jmp;
    if(0===copy.end){
      throw new Error("Internal error");
      }
    if(true===bound_cond){
      return new SC_RepeatPointForever().bindTo(engine, parbranch, seq
                                                           , path, cube, cinst);
      }
    else if(false==bound_cond){
      return new SC_RelativeJump(copy.end).bindTo(engine, parbranch
                                                      , seq, path, cube, cinst);
      }
    copy.condition= bound_cond;
    copy._condition= this.condition;
    copy.seq= seq;
    return copy;
    };
proto.toString= function(){
    return "while "+this.condition+" repeat [ ";
    };
function SC_RepeatBurstPointForever(){};
proto= SC_RepeatBurstPointForever.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(SC_Opcodes.REPEAT_BURST_FOREVER);
    copy.seq= seq;
    return copy;
    };
proto.toString= function(){
    return "repeat forever ";
    };
function SC_RepeatPointForever(){};
proto= SC_RepeatPointForever.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(SC_Opcodes.REPEAT_FOREVER);
    copy.seq= seq;
    return copy;
    };
proto.toString= function(){
    return "repeat forever ";
    };
function SC_RepeatBurstPoint(times){
  if(times<0){
    return new SC_RepeatBurstPointForever();
    }
  this.it= times;
  this.end= 0;
  };
proto= SC_RepeatBurstPoint.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_it= binder(this.it);      
    if(bound_it<0){
      return new SC_RepeatBurstPointForever()
           .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    if(0==bound_it){
      return SC.nothing()
           .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.REPEAT_BURST_N_TIMES_INIT);
    const jmp= parseInt(this.end);
    copy.end= isNaN(jmp)?0:jmp;
    if(0===copy.end){
      throw new Error("Internal error");
      }
    if("function"==typeof bound_it){
      Object.defineProperty(copy, "it",{ get: bound_it });
      }
    else{
      copy.it= bound_it;
      }
    copy.count= copy.it;
    copy._it= this.it;
    copy.seq= seq;
    return copy;
    }
proto.toString= function(){
    return "repeat burst "
                +((this.it<0)?"forever ":this.count+"/"+this.it+" times [ ");
    } ;
function SC_RepeatPoint(times){
  if(times<0){
    return new SC_RepeatPointForever();
    }
  this.it= times;
  this.end= 0;
  };
proto= SC_RepeatPoint.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_it= binder(this.it);      
    if(!isNaN(bound_it) && bound_it<0){
      return new SC_RepeatPointForever()
           .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    if(0===bound_it){
      return new SC_RelativeJump(this.end)
           .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.REPEAT_N_TIMES_INIT);
    const jmp= parseInt(this.end);
    copy.end= isNaN(jmp)?0:jmp;
    if(0===copy.end){
      throw new Error("Internal error");
      }
    copy.count= copy.it= bound_it;
    copy._it= this.it;
    copy.seq= seq;
    return copy;
    }
proto.toString= function(){
    return "repeat "
                +((this.it<0)?"forever ":this.count+"/"+this.it+" times ");
    } ;
function SC_RepeatPointLate(times){
  if(times<0){
    return new SC_RepeatPointForever();
    }
  this.it= times;
  this.end= 0;
  };
proto= SC_RepeatPointLate.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    binder(this.it);      
    const copy= new SC_Instruction(SC_Opcodes.REPEAT_LATE_N_TIMES_INIT);
    const jmp= parseInt(this.end);
    copy.end= isNaN(jmp)?0:jmp;
    if(0===copy.end){
      throw new Error("Internal error");
      }
    copy.it= this.it;
    copy._it= this.it;
    copy.seq= seq;
    return copy;
    }
proto.toString= function(){
    return "repeat "
                +((this.it<0)?"forever ":this.count+"/"+this.it+" times ");
    } ;
function SC_GenerateBurstForeverLateEvtNoVal(evt){
  if((undefined==evt)
        ||(! (evt instanceof SC_LateBinding))){
    throw "GenerateBurstForeverLateEvtNoVal : late binding event error :("
                                                                       +evt+")";
    }
  this.evt= evt;
  };
proto= SC_GenerateBurstForeverLateEvtNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(
                             SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL);
    copy.evt= this.evt.bindTo(engine);
    copy._evt= this._evt;
    return copy;
    }
proto.toString= function(){
    return "generate burst "+this.evt.toString()+" forever ";
    };
function SC_GenerateBurstForeverLateVal(evt, val){
  if((undefined == val|| !(val instanceof SC_LateBinding))||(undefined == evt)){
    throw "error on evt:("+evt+") or val:("+val+")";
    }
  this.evt= evt;
  this.val= val;
  this.itsParent= null;
  };
proto = SC_GenerateBurstForeverLateVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_evt= binder(this.evt).bindTo(engine);
    const bound_value= binder(this.val);
    var copy= null;
    if(bound_evt.isBinding){
      if(bound_value.isBinding){
        copy = new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      else{
        copy= new SC_Instruction(SC_Opcodes.GENERATE_BURST_FOREVER_LATE_VAL);
        copy.evt= bound_evt;
        copy.val= bound_value;
        if(copy.val instanceof SC_CubeExposedState){
          copy.val= new SC_CubeExposedStateInternal().setCube(cinst);
          }
        }
      }
    else if(bound_value instanceof SC_LateBinding){
        copy = new SC_Instruction(SC_Opcodes.GENERATE_BURST_FOREVER_LATE_VAL);
        copy.evt= bound_evt;
        copy.val= bound_value;
        if(copy.val instanceof SC_CubeExposedState){
          copy.val= new SC_CubeExposedStateInternal().setCube(cinst);
          }
        }
    else{
      copy= new SC_GenerateForever(bound_evt, bound_value)
              .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    copy.itsParent= parbranch;
    copy._evt= this.evt.bindTo(engine);
    copy._val= this.val;
    parbranch.declarePotential();
    return copy;
    };
proto.toString= function(){
    return "generate burst "+this.evt.toString()
           +((null != this.val)?"("+this.val.toString()+") ":"")
           +" forever ";
    };
function SC_GenerateForeverLateEvtNoVal(evt){
  if((undefined==evt)
        ||(! (evt instanceof SC_LateBinding))){
    throw "SC_GenerateForeverLateEvtNoVal : late binding event error :("
                                                                       +evt+")";
    }
  this.evt= evt;
  };
proto= SC_GenerateForeverLateEvtNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL);
    copy.evt= this.evt.bindTo(engine);
    copy._evt= this._evt;
    return copy;
    };
proto.toString= function(){
    return "generate "+this.evt.toString()+" forever ";
    };
function SC_GenerateForeverLateVal(evt, val){
  if((undefined == val|| !(val instanceof SC_LateBinding))||(undefined == evt)){
    throw "error on evt:("+evt+") or val:("+val+")";
    }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
  };
proto = SC_GenerateForeverLateVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_evt = binder(this.evt).bindTo(engine);
    var bound_value = binder(this.val);
    var copy = null;
    if(bound_evt.isBinding){
      if(bound_value.isBinding){
        copy = new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      else{
        copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_VAL);
        copy.evt = bound_evt;
        copy.val = bound_value;
        if(copy.val instanceof SC_CubeExposedState){
          copy.val= new SC_CubeExposedStateInternal().setCube(cinst);
          }
        }
      }
    else{
      if(bound_value instanceof SC_LateBinding){
        copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_VAL);
        copy.evt = bound_evt;
        copy.val = bound_value;
        if(copy.val instanceof SC_CubeExposedState){
          copy.val= new SC_CubeExposedStateInternal().setCube(cinst);
          }
        }
      else{
        copy = new SC_GenerateForever(bound_evt, bound_value)
                .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      }
    copy.itsParent = parbranch;
    copy._evt = this.evt.bindTo(engine);
    copy._val = this.val;
    parbranch.declarePotential();
    return copy;
    }
proto.toString= function(){
    return "generate "+this.evt.toString()
           +((null != this.val)?"("+this.val.toString()+") ":"")
           +" forever ";
    };
function SC_GenerateBurstForeverNoVal(evt){
  if((undefined==evt)
        ||(! (evt instanceof SC_EventId
              || evt instanceof SC_Event
              || evt instanceof SC_LateBinding))){
    throw "GenerateBurstForEver error on evt:("+evt+")";
    }
  this.evt= evt;
  };
proto= SC_GenerateBurstForeverNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy=
              new SC_Instruction(SC_Opcodes.GENERATE_BURST_FOREVER_NO_VAL_INIT);
    copy.evt= this.evt.bindTo(engine);
    copy._evt= this.evt;
    return copy;
    };
proto.toString= function(){
    return "generate burst "+this.evt.toString()+" forever ";
    };
function SC_GenerateForeverNoVal(evt){
  if((undefined==evt)
        ||(! (evt instanceof SC_EventId
              || evt instanceof SC_Event
              || evt instanceof SC_LateBinding))){
    throw "GenerateForEver error on evt:("+evt+")";
    }
  this.evt= evt;
  };
proto= SC_GenerateForeverNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_NO_VAL_INIT);
    copy.evt= this.evt.bindTo(engine);
    copy._evt= this.evt;
    return copy;
    };
proto.toString= function(){
    return "generate "+this.evt.toString()+" forever ";
    };
function SC_GenerateBurstForever(evt, val){
  if(undefined===val){
    return new SC_GenerateBurstForeverNoVal(evt);
    }
  this.evt= evt;
  this.val= val;
  };
proto=SC_GenerateBurstForever.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);
    const bound_evt = binder(this.evt).bindTo(engine);
    const bound_value = binder(this.val);
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_BURST_FOREVER_INIT);
    copy.evt= bound_evt;
    copy.val= bound_value;
    if(copy.val instanceof SC_CubeExposedState){
      copy.val= cinst;
      copy.oc= SC_Opcodes.GENERATE_BURST_FOREVER_EXPOSE_INIT;
      }
    else if(copy.val instanceof SC_Instruction
            && (copy.val.oc==SC_Opcodes.CELL
                || copy.val.oc==SC_Opcodes.CELL_INIT)){
      copy.oc= SC_Opcodes.GENERATE_BURST_FOREVER_CELL_INIT;
      }
    copy.itsParent= parbranch;
    copy._evt= this.evt;
    copy._val= this.val;
    parbranch.declarePotential();
    return copy;
    }
proto.toString= function(){
    return "generate burst "+this.evt.toString()
           +this.val+" forever ";
    };
function SC_GenerateForever(evt, val){
  if(undefined===val){
    return new SC_GenerateForeverNoVal(evt);
    }
  this.evt= evt;
  this.val= val;
  };
proto=SC_GenerateForever.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);
    const bound_evt = binder(this.evt).bindTo(engine);
    const bound_value = binder(this.val);
    if(bound_evt instanceof SC_LateBinding){
      if(bound_value instanceof SC_LateBinding){
        return new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
               .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      else{
        return new SC_GenerateForeverLateEvt(bound_evt, bound_value)
               .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      }
    else if(bound_value instanceof SC_LateBinding){
      return new SC_GenerateForeverLateVal(bound_evt, bound_value)
               .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_INIT);
    copy.evt= bound_evt;
    copy.val= bound_value;
    if(copy.val instanceof SC_CubeExposedState){
      copy.val= cinst;
      copy.oc= SC_Opcodes.GENERATE_FOREVER_EXPOSE_INIT;
      }
    else if("function"==typeof(copy.val)){
      copy.oc= SC_Opcodes.GENERATE_FOREVER_FUN_INIT;
      }
    else if(copy.val instanceof SC_Instruction
            && (copy.val.oc==SC_Opcodes.CELL
                || copy.val.oc==SC_Opcodes.CELL_INIT)){
      copy.oc= SC_Opcodes.GENERATE_FOREVER_CELL_INIT;
      }
    copy.itsParent= parbranch;
    copy._evt= this.evt;
    copy._val= this.val;
    parbranch.declarePotential();
    return copy;
    }
proto.toString= function(){
    return "generate "+this.evt.toString()
           +this.val+" forever ";
    };
function SC_GenerateOneNoVal(evt){
  this.evt= evt;
  };
proto= SC_GenerateOneNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_ONE_NO_VAL);
    copy.evt= binder(this.evt).bindTo(engine);
    return copy;
    }
proto.toString= function(){
    return "generate "+this.evt.toString();
    };
function SC_GenerateOne(evt, val){
  if(undefined===val){
    return new SC_GenerateOneNoVal(evt);
    }
  this.evt=evt;
  this.val=val;
  this.itsParent=null;
  };
proto= SC_GenerateOne.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    var binder=_SC._b(cube);
    var copy=null;
    if(null===this.evt){
      this.evt=engine.traceEvt;
      }
    else if(SC_WRITE_ID===this.evt){
      this.evt= engine.writeEvt;
      }
    var tmp_evt=binder(this.evt).bindTo(engine);
    var tmp_val=binder(this.val);
    if(undefined===tmp_val){
      return new SC_GenerateOneNoVal(tmp_evt)
              .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    copy=new SC_Instruction(SC_Opcodes.GENERATE_ONE);
    copy.evt=tmp_evt;
    copy.val=tmp_val;
    if(copy.val instanceof SC_CubeExposedState){
      copy.val=cinst;
      copy.oc=SC_Opcodes.GENERATE_ONE_EXPOSE;
      }
    else if("function"==typeof(copy.val)){
      copy.oc = SC_Opcodes.GENERATE_ONE_FUN;
      }
    else if(copy.val instanceof SC_Instruction
            && (copy.val.oc==SC_Opcodes.CELL
                || copy.val.oc==SC_Opcodes.CELL_INIT)){
      copy.oc=SC_Opcodes.GENERATE_ONE_CELL;
      }
    copy.itsParent=parbranch;
    copy._evt=this.evt;
    copy._val=this.val;
    parbranch.declarePotential();
    return copy;
    };
proto.toString= function(){
    if(null==this.evt){
      return "tarce("+this.val.toString()+");"
      }
    return "generate "+this.evt.toString()
           +((null!=this.val)?"("+this.val.toString()+") ":"");
    };
function SC_GenerateBurst(p){
  if(undefined===p.times || 1===p.times){
    return new SC_GenerateOne(p.evt, p.val);
    }
  if(0==p.times){
    return SC_Nothing;
    }
  if(parseInt(p.times)<0){
    return new SC_GenerateBurstForever(p.evt, p.val);
    }
  if(undefined===p.val && undefined==p.wrap){
    return new SC_GenerateBurstNoVal(p.evt, p.times);
    }
  this.evt= p.evt;
  this.val= p.val;
  this.wrap= p.wrap;
  this.times= p.times;
  };
proto= SC_GenerateBurst.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const tmp_times= binder(this.times);
    const tmp_evt= binder(this.evt).bindTo(engine);
    const tmp_val= binder(this.val);
    const tmp_wrap= binder(this.wrap);
    if(tmp_times<0){
      return new SC_GenerateBurstForever(tmp_evt, tmp_val)
                 .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(0===tmp_times){
      return SC_nothing;
      }
    else if((undefined===tmp_times)||(1===tmp_times)){
      return new SC_GenerateOne(tmp_evt, tmp_val)
                 .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_BURST_INIT);
    copy.evt= tmp_evt;
    copy.val= tmp_val;
    copy.wrap= tmp_wrap;
    if(copy.wrap instanceof SC_CubeExposedState){
      copy.val= cinst;
      copy.oc= SC_Opcodes.GENERATE_BURST_EXPOSE_INIT;
      }
    else if("function"==typeof(copy.wrap)){
      copy.oc= SC_Opcodes.GENERATE_BURST_FUN_INIT;
      copy.val= copy.wrap;
      }
    else if(copy.wrap instanceof SC_Instruction
            && (copy.wrap.oc==SC_Opcodes.CELL
                || copy.wrap.oc==SC_Opcodes.CELL_INIT)){
      copy.oc = SC_Opcodes.GENERATE_BURST_CELL_INIT;
      }
    copy.times= tmp_times;
    copy.itsParent= parbranch;
    copy._times= this.times;
    copy._evt= this.evt;
    copy._val= this.val;
    copy._wrap= this.wrap;
    parbranch.declarePotential();
    return copy;
    }
proto.toString= function(){
    return "generate burst "+this.evt.toString()+" ("
           +this.val+") for "+this.count+"/"+this.times+" times ";
    };
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
  };
proto= SC_Generate.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    var copy = null;
    var binder = _SC._b(cube);
    var tmp_times = binder(this.times);
    var tmp_evt = binder(this.evt).bindTo(engine);
    var tmp_val = binder(this.val);
    if(tmp_times < 0){
      return new SC_GenerateForever(tmp_evt, tmp_val)
                 .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(0 === tmp_times){
      return SC_nothing;
      }
    else if((undefined === tmp_times)||(1 == tmp_times)){
      return new SC_GenerateOne(tmp_evt, tmp_val)
                 .bindTo(engine, parbranch, seq, path, cube, cinst);
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
            && (copy.val.oc==SC_Opcodes.CELL
                || copy.val.oc==SC_Opcodes.CELL_INIT)){
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
proto.toString= function(){
    return "generate "+this.evt.toString()+" ("
           +this.val+") for "+this.count+"/"+this.times+" times ";
    };
function SC_GenerateBurstNoVal(evt, times){
  this.evt= evt;
  this.times= times;
  };
proto= SC_GenerateBurstNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const tmp_times= binder(this.times);
    const tmp_evt= binder(this.evt).bindTo(engine);
    if(undefined!=tmp_times && isNaN(parseInt(tmp_times))
       && (0!==tmp_times)
       && !(tmp_evt instanceof SC_Event)){
      console.warn("Evaluation error", tmp_times, tmp_evt);
      debugger;
      return SC.nothing().bindTo(engine);
      }
    else if(tmp_times<0){
      return new SC_GenerateBurstForeverNoVal(this.evt)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if((undefined===tmp_times)||(1==tmp_times)){
      return new SC_GenerateOneNoVal(this.evt)
             .bindTo(engine, parbranch, seq, path, cube);
      }
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_BURST_NO_VAL_INIT);
    copy.evt= tmp_evt
    copy.times= tmp_times;
    copy.itsParent= parbranch;
    copy._times= this.times;
    copy._evt= this.evt;
    return copy;
    };
proto.toString= function(){
    return "generate burst "+this.evt.toString()+" for "
            +this.count+"/"+this.times+" times ";
    };
function SC_GenerateNoVal(evt, times){
  this.evt= evt;
  this.times= times;
  };
proto= SC_GenerateNoVal.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const tmp_times= binder(this.times);
    const tmp_evt= binder(this.evt).bindTo(engine);
        if(undefined!=tmp_times && isNaN(parseInt(tmp_times))
       && (0!==tmp_times)
       && !(tmp_evt instanceof SC_Event)){
      console.warn("Evaluation error", tmp_times, tmp_evt);
      debugger;
      return SC.nothing().bindTo(engine);
      }
    else if(tmp_times<0){
      return new SC_GenerateForeverNoVal(this.evt)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if((undefined===tmp_times)||(1==tmp_times)){
      return new SC_GenerateOneNoVal(this.evt)
             .bindTo(engine, parbranch, seq, path, cube);
      }
    const copy= new SC_Instruction(SC_Opcodes.GENERATE_NO_VAL_INIT);
    copy.evt= tmp_evt
    copy.times= tmp_times;
    copy.itsParent= parbranch;
    copy._times= this.times;
    copy._evt= this.evt;
    return copy;
    };
proto.toString= function(){
    return "generate "+this.evt.toString()+" for "
            +this.count+"/"+this.times+" times ";
    };
function SC_FilterForeverNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_SensorId) && !(sensor instanceof SC_LateBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_LateBinding)){
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
  constructor: SC_FilterForeverNoSens
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_sensor = binder(this.sensor);
    var bound_fun = binder(this.filterFun);
    var bound_evt = binder(this.evt).bindTo(engine);
    bound_fun = _SC.bindIt(bound_fun);
    var copy = new SC_Instruction(SC_Opcodes.FILTER_FOREVER_NO_ABS);
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path
                                                                 , cube, cinst);
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
, toString: function(){
    return "filter "+this.sensor.toString()
             +" with fun{"+this.filterFun+"} generate "+this.evt+" "
             +" forever ";
    }
  };
function SC_FilterForever(sensor, filterFun, evt, no_sens){
  if(!(sensor instanceof SC_SensorId)
    &&!(sensor instanceof SC_LateBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_LateBinding)){
    throw "invalid filter event !!";
    }
  if(undefined === no_sens){
    return new SC_FilterForeverNoSens(sensor, filterFun, evt);
    }
  if(!(no_sens instanceof SC_EventId) && !(no_sens instanceof SC_LateBinding)){
    throw "invalid no sensor event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.noSens_evt = no_sens;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  };
SC_FilterForever.prototype = {
  constructor: SC_FilterForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
              .bindTo(engine, parbranch, seq, path, cube, cinst);
      return copy;
      }
    var copy = new SC_Instruction(SC_Opcodes.FILTER_FOREVER);
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path
                                                                 , cube, cinst);
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
, toString: function(){
    return "filter "+this.sensor.toString()
           +" with fun{"+this.filterFun+"} generate "+this.evt+" or "
           +this.noSens_evt
           +" forever ";
    }
  }
function SC_FilterOneNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_SensorId)
    &&!(sensor instanceof SC_LateBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_LateBinding)){
    throw "invalid filter event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  };
SC_FilterOneNoSens.prototype = {
  constructor: SC_FilterOneNoSens
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_sensor = binder(this.sensor);
    var bound_fun = binder(this.filterFun);
    var bound_evt = binder(this.evt).bindTo(engine);
    var bound_noSens_evt = binder(this.noSens_evt);
    bound_fun = _SC.bindIt(bound_fun);
    var copy = new SC_Instruction(SC_Opcodes.FILTER_ONE_NO_ABS);
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path
                                                                 , cube, cinst);
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
, toString: function(){
    return "filter "+this.sensor.toString()
             +" with fun{"+this.filterFun+"} generate "+this.evt+" "
             +((1 != this.times)?
                    ((-1 == this.times )?" forever ":(" for "
                                     +this.count+"/"+this.times+" times ")):"");
    }
  };
function SC_FilterOne(sensor, filterFun, evt, no_sens){
  if(!(sensor instanceof SC_SensorId)
    &&!(sensor instanceof SC_LateBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_EventId) && !(evt instanceof SC_LateBinding)){
    throw "invalid filter event !!";
    }
  if(undefined === no_sens){
    return new SC_FilterOneNoSens(sensor, filterFun, evt);
    }
  if(!(no_sens instanceof SC_EventId)
    && !(no_sens instanceof SC_LateBinding)){
    throw "invalid no sensor event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  this.noSens_evt = no_sens;
  };
SC_FilterOne.prototype = {
  constructor: SC_FilterOne
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_sensor = binder(this.sensor);
    var bound_fun = binder(this.filterFun);
    var bound_evt = binder(this.evt).bindTo(engine);
    var bound_noSens_evt = binder(this.noSens_evt);
    bound_fun = _SC.bindIt(bound_fun);
    var copy = new SC_Instruction(SC_Opcodes.FILTER_ONE);
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq
                                                           , path, cube, cinst);
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
, toString: function(){
    return "filter "+this.sensor.toString()
             +" with fun{"+this.filterFun+"} generate "+this.evt+" "
             +((1 != this.times)?
                    ((-1 == this.times )?" forever ":(" for "
                                     +this.count+"/"+this.times+" times ")):"");
    }
  };
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
  if(!(sensor instanceof SC_SensorId) && !(sensor instanceof SC_LateBinding)){
    throw new Erro("sensor required !");
    }
  this.sensor= sensor;
  this.evt= evt;
  this.filterFun= filterFun;
  this.times= times;
  };
proto=SC_FilterNoSens.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_sensor = binder(this.sensor);
    const bound_fun = binder(this.filterFun);
    const bound_evt = binder(this.evt);
    const bound_times = binder(this.times);
    if(0 == bound_times){
      return SC_nothing;
      }
    if((undefined===bound_times) || (1==bound_times)){
      return new SC_FilterOneNoSens(bound_sensor, bound_fun, bound_evt)
         .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(bound_times<0){
      return new SC_FilterForeverNoSens(bound_sensor, bound_fun, bound_evt)
         .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    const copy= new SC_Instruction(SC_Opcodes.FILTER_NO_ABS_INIT);
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
    };
proto.toString= function(){
    return "filter "+this.sensor.toString()
             +" with fun{"+this.filterFun+"} generate "+this.evt+" "
             +((1 != this.times)?
                    (" for "+this.count+"/"+this.times+" times "):"");
    };
function SC_Filter(sensor, evt, filterFun, times, no_sens){
  if(0===times){
    return SC_Nothing;
    }
  if((undefined===times) || (1==times)){
    return new SC_FilterOne(sensor, filterFun, evt, no_sens);
    }
  if(times<0){
    return new SC_FilterForever(sensor, filterFun, evt, no_sens);
    }
  if(!(sensor instanceof SC_SensorId) && !(sensor instanceof SC_LateBinding)){
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
  };
SC_Filter.prototype = {
  constructor: SC_Filter
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_sensor = binder(this.sensor);
    var bound_fun = binder(this.filterFun);
    var bound_evt = binder(this.evt).bindTo(engine);
    var bound_times = binder(this.times);
    var bound_noSens_evt = binder(this.noSens_evt);
    var copy = null;
    bound_fun = _SC.bindIt(bound_fun);
    if(0 == bound_times){
      return SC_nothing;
      }
    if((undefined === bound_times) || (1 == bound_times)){
      return SC_FilterOne(bound_sensor, bound_fun, bound_evt, bound_noSens_evt)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(bound_times < 0){
      return SC_FilterForever(bound_sensor
                            , bound_fun, bound_evt, bound_noSens_evt)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    copy = new SC_Instruction(SC_Opcodes.FILTER);
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq
                                                           , path, cube, cinst);
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
, toString: function(){
    return "filter "+this.sensor.toString()
             +" with fun{"+this.filterFun+"} generate "+this.evt+" "
             +((1 != this.times)?
                    (" for "+this.count+"/"+this.times+" times "):"");
    }
  };
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
  };
SC_Send.prototype = {
  constructor: SC_Send
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_evt = binder(this.evt).bindTo(engine);
    var bound_times = binder(this.times);
    var bound_val = binder(this.value);
    var copy = null;
    if(0 === bound_times){
      return SC_nothing;
      }
    if((undefined === bound_times) || (1 == bound_times)){
      return SC_SendOne(bound_evt, bound_val)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(bound_times < 0){
      return SC_SendForever(bound_evt, bound_val)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
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
, toString: function(){
    return "send "+this.evt.toString()
             +"("+this.value.toString()+")"
             +((1 != this.times)?
                    (" for "+this.count+"/"+this.times+" times "):"");
    }
  };
function SC_SendOne(evt, value){
  this.evt = evt;
  this.value = value;
  };
SC_SendOne.prototype = {
  constructor: SC_SendOne
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.SEND_ONE);
    copy.evt = binder(this.evt).bindTo(engine);
    copy.value = binder(this.value);
    copy._evt = this.evt;
    copy._value = this.value;
    return copy;
    }
, toString: function(){
    return "send "+this.evt.toString()
             +"("+this.value.toString()+")";
    }
  };
function SC_SendForever(evt, value){
  this.evt = evt;
  this.value = value;
  };
SC_SendForever.prototype = {
  constructor: SC_SendForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = SC_SendForever(binder(this.evt), binder(this.value));
    copy._evt = this.evt;
    return copy;
    }
, toString: function(){
    return "send "+this.evt.toString()
             +"("+this.value.toString()+")"
             +" forever ";
    }
  };
function SC_Await(aConfig){
  this.config = aConfig;
  this.path = null;
}
SC_Await.prototype = {
  constructor: SC_Await
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder=_SC._b(cube);
    const bound_config=binder(this.config);
    var zeConf;
    if("object"==typeof(bound_config) && "object"==typeof(bound_config.t)
           && "string"==typeof(bound_config.f)){
      zeConf=bound_config.t[bound_config.f]
           .bindTo(engine, parbranch, seq, path, cube, cinst);
      }    
    else{
      zeConf=bound_config.bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    var copy = new SC_Instruction(SC_Opcodes.AWAIT);
    copy.config=zeConf;
    copy._config=this.config;
    copy.path=path;
    return copy;
    }
, toString: function(){
    return "await "+this.config.toString()+" ";
    }
  };
function SC_StepOne(){
  };
SC_StepOne.prototype = {
  constructor: SC_StepOne
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    return new SC_Instruction(SC_Opcodes.STEP);
    }
, toString: function(){
    return "step ";
    }
  };
function SC_Step(times){
  if(times < 0){
    return SC_StopForever;
    }
  if(0 === times){
    return SC_Nothing;
    }
  this.count = this.times = (undefined == times)?1:times;
  if(1 === this.time){
    return new SC_StepOne();
    }
  };
SC_Step.prototype = {
  constructor: SC_Step
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_times = binder(this.times);
    var copy = null;
    if(bound_times < 0){
      return SC_PauseForever;
      }
    else if(0 === bound_times){
      return SC_nothing;
      }
    else if(1 === bound_times){
      return new SC_StepOne().bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    copy = new SC_Instruction(SC_Opcodes.STEP_N_TIMES_INIT);
    _SC.lateBindProperty(copy, "times", bound_times);
    copy._times = this.times;
    return copy;
    }
, toString: function(){
    return "step "+this.count+"/"+this.times+" times ";
    }
  }
function SC_ResetOn(config, prog){
  this.config= config;
  this.prog= prog;
  Object.defineProperty(this, "isAnSCProgram", { value: true
                                               , writable: false });
  };
SC_ResetOn.prototype.bindTo= function(engine, parbranch, seq
                                                           , path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.RESET_ON_INIT);
    copy.config= binder(this.config)
                .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.prog= this.prog
                .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.path= path;
    return copy;
    };
function SC_ActionForever(f){
  this.action= f;
  Object.defineProperty(this, "isAnSCProgram", { value: true
                                               , writable: false });
  };
SC_ActionForever.prototype.bindTo= function(engine, parbranch
                                                      , seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.ACTION_FOREVER_INIT);
    copy.action= binder(this.action);
    copy._action= this.action;
    copy.closure= _SC.bindIt(copy.action);
    return copy;
    };
SC_ActionForever.prototype.toString= function(){
    return "call "+((undefined == this.action.f)?" "+this.action+" "
                 :this.action.t+"."+this.action.f+"()")+" forever";
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
  };
SC_Action.prototype = {
  constructor: SC_Action
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var times = binder(this.times);
    if(0 == times){
      return SC_nothing;
      }
    if((undefined === times)||(1 == times)){
      return new SC_SimpleAction(this.action)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    if(times < 0){
      return new SC_ActionForever(this.action)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    var copy = new SC_Instruction(SC_Opcodes.ACTION_N_TIMES_INIT);
    copy.action = binder(this.action);
    copy._action = this.action;
    copy._times = this.times;
    if("function" == typeof times){
      Object.defineProperty(copy, "times",{get: times});
      }
    else{
      copy.times = times;
      }
    if(copy.action.f && copy.action.t){
      if(undefined!==copy.action.p){
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t
                                                       , copy.action.p);
        }
      else{
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
        }
      }
    else{
      copy.closure = copy.action.bind(cube);
      }
    return copy;
    }
, toString: function(){
    return "call "+((undefined == this.action.f)?"call("+this.action+") "
                 :this.action.t+"."+this.action.f+"() ")
                 +((this.times>1)?(this.count+"/"+this.times+" times "):" ");
    }
  };
function SC_SimpleAction(f){
  this.action=f;
  }
SC_SimpleAction.prototype = {
  constructor: SC_SimpleAction
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder=_SC._b(cube);
    const copy=new SC_Instruction(SC_Opcodes.ACTION);
    copy.action=binder(this.action);
    copy._action=this.action;
    if(copy.action.f && copy.action.t){
      if(undefined!==copy.action.p){
        copy.closure=copy.action.t[copy.action.f].bind(copy.action.t
                                                       , copy.action.p);
        }
      else{
        copy.closure=copy.action.t[copy.action.f].bind(copy.action.t);
        }
      }
    else{
      copy.closure=copy.action.bind(cube);
      }
    return copy;
    }
, toString: function(){
    return "call "+((undefined == this.action.f)?"call("+this.action+") "
                 :this.action.t+"."+this.action.f+"() ");
    }
  };
function SC_Log(msg){
  if(undefined === msg){
    throw "undefined msg";
    }
  this.msg = msg;
  };
SC_Log.prototype = {
  constructor: SC_Log
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
, toString: function(){
    return "log "+((undefined == this.msg.f)
                         ?""+this.msg+" "
                         :this.msg.t+"."+this.msg.f+"() ");
    }
  };
function SC_ActionOnEventForeverNoDef(c, act){
  this.evtFun={action: act, config: c};
  };
SC_ActionOnEventForeverNoDef.prototype = {
  constructor: SC_ActionOnEventForeverNoDef
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(
                                 SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT);
    copy.evtFun={
      action: binder(this.evtFun.action)
    , config: binder(this.evtFun.config)
               .bindTo(engine, parbranch, seq, path, cube, cinst)
      };
    copy.path = path;
    return copy;
    }
  , toString: function(){
    var res ="on "+this.evtFun.config.toString();
    return res+"call("+this.evtFun.action.toString()+") "
           +" forever ";
    }
  };
function SC_ActionOnEventForever(c, act, defaultAct){
  if(undefined === defaultAct){
    return new SC_ActionOnEventForeverNoDef(c, act);
    }
  this.evtFun={action:act, config:c};
  this.defaultAct = defaultAct;
  };
SC_ActionOnEventForever.prototype = {
  constructor: SC_ActionOnEventForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT_FOREVER);
    copy.evtFun={
      action: binder(this.evtFun.action)
    , config: binder(this.evtFun.config)
                 .bindTo(engine, parbranch, seq, path, cube, cinst)
      };
    copy.defaultAct = binder(this.defaultAct);
    copy.path = path;
    return copy;
    }
, toString: function(){
    var res ="on "+this.evtFun.config.toString();
    return res+"call("+this.evtFun.action.toString()+") "
           +"else call("+this.defaultAct.toString()+")  forever ";
    }
  };
function SC_ActionOnEventNoDef(c, act, times){
  this.evtFun={action:act, config:c};
  this.path = null;
  this.count = this.times = times;
  };
SC_ActionOnEventNoDef.prototype = {
  constructor: SC_ActionOnEventNoDef
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT);
    copy.evtFun={
      action: binder(this.evtFun.action)
    , config: binder(this.evtFun.config)
           .bindTo(engine, parbranch, seq, path, cube, cinst)
      };
    copy.times = binder(this.times);
    copy.path = path;
    return copy;
    }
, toString: function(){
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
  this.evtFun={action:act, config:c};
  this.defaultAct = defaultAct;
  this.count = this.times = times;
  };
SC_ActionOnEvent.prototype = {
  constructor: SC_ActionOnEvent
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
  var binder = _SC._b(cube);
  var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT);
  copy.evtFun = {
    action: binder(this.evtFun.action)
  , config: binder(this.evtFun.config)
              .bindTo(engine, parbranch, seq, path, cube, cinst)
    };
  copy.defaultAct = binder(this.defaultAct);
  copy.count = copy.times = binder(this.times);
  copy.path = path;
  return copy;
  }
, toString: function(){
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
  };
SC_SimpleActionOnEventNoDef.prototype = {
  cosntructor: SC_SimpleActionOnEventNoDef
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT);
    copy.evtFun={
      action: binder(this.evtFun.action)
    , config: binder(this.evtFun.config)
               .bindTo(engine, parbranch, seq, path, cube, cinst)
      };
    copy.path = path;
    return copy;
    }
, toString: function(){
    var res ="on "+this.evtFun.config.toString();
    return res+"call("+this.evtFun.action.toString()+") ";
    }
  };
function SC_SimpleActionOnEvent(c, act, defaultAct){
  if(undefined === defaultAct){
    return new SC_SimpleActionOnEventNoDef(c, act);
    }
  this.evtFun={action:act, config:c};
  this.defaultAct = defaultAct;
  this.path = null;
  this.toRegister = true;
  this.terminated = false;
}
SC_SimpleActionOnEvent.prototype = {
  constructor: SC_SimpleActionOnEvent
  , isAnSCProgram: true
  , bindTo: function(engine, parbranch, seq, path, cube, cinst){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(SC_Opcodes.SIMPLE_ACTION_ON_EVENT);
      copy.evtFun={
          action: binder(this.evtFun.action)
        , config: binder(this.evtFun.config)
                   .bindTo(engine, parbranch, seq, path, cube, cinst)
          };
      copy.defaultAct = binder(this.defaultAct);
      copy.path = path;
      return copy;
      }
  , toString: function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
          +"else call("+this.defaultAct.toString()+") ";
      }
  };
function SC_SeqBranchOfPar(aParent, aPar, prg){
  this.oc= SC_Opcodes.SEQ_BRANCH_OF_PAR;
  this.prev= null;
  this.next= null;
  this.prg= prg;
  this.seqElements= [];
  this.idx=0;
  this.flag= SC_IState.SUSP;
  this.itsParent= aParent;
  this.itsPar= aPar;
  this.emitters= [];
  this.subBranches= [];
  this.hasPotential= false;
  this.purgeable= false;
  this.path= null;
  this.idxInProd= -1;
  this.remains= [];
  this.genIdx= 0;
  if(null!=aParent){
    aParent.subBranches.push(this);
    }
  };
(function(){
const proto= SC_SeqBranchOfPar.prototype;
proto.setProgram= function(prg){
    this.prg= prg;
    };
proto.declarePotential= function(){
    if(this.hasPotential){
      return;
      }
    this.hasPotential= true;
    this.idxInProd= this.itsPar.registerInProdBranch(this);
    if(null!=this.itsParent){
      this.itsParent.declarePotential();
      }
    };
proto.registerForProduction= SC_Instruction.prototype.registerForProduction;
proto.unregisterFromProduction= SC_Instruction.prototype.unregisterFromProduction;
proto.awake= SC_Instruction.prototype.awake;
})();
function SC_Queues(){
  this.start = null;
  };
SC_Queues.prototype = {
  constructor: SC_Queues
, append: function(elt){
    if(null != this.start){
      this.start.prev = elt;
      }
    elt.next = this.start;
    this.start = elt;
    }
, pop: function(){
    var res = this.start;
    if(null != res){
      this.start = res.next;
      }
    return res;
    }
, remove: function(elt){
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
, isEmpty: function(){
    return (null == this.start);
    }
, setFlags: function(st){
    var b = this.start;
    while(null != b){
      b.flag = st;
      b = b.next;
      }
    }
  };
function SC_Par(args, channel){
  if(undefined!==channel){
    return new SC_ParDyn(channel, args);
    }
  this.branches=[];
  for(var i of args){
    if(undefined==i || !(i.isAnSCProgram)){
      console.error("pb", i);
      debugger;
      }
    this.branches.push(new SC_SeqBranchOfPar(null, null, i));
    }
  };
SC_Par.prototype={
  constructor: SC_Par
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.PAR_INIT);
    copy.suspended = new SC_Queues();
    copy.waittingEOI = new SC_Queues();
    copy.stopped = new SC_Queues();
    copy.stepped = new SC_Queues();
    copy.waitting = new SC_Queues();
    copy.halted = new SC_Queues();
    copy.terminated = new SC_Queues();
    copy.branches = [];
    copy.cinst = cinst;
    copy.prodBranches = [];
    copy.itsParent = null;
    copy.cube = cube;
    for(var tmp of this.branches){
      var b = new SC_SeqBranchOfPar(parbranch, copy, SC_nothing);
      b.setProgram(tmp.prg.bindTo(engine, b, null, b, cube, cinst));
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
, toString: function(){
    var res ="[";
    for(var i in this.branches){
      res += this.branches[i].prg.toString();
      res += (i<this.branches.length-1)?"||":"";
      }
    return res+"] ";
    }
, add: function(p){
    if(undefined == p){
      throw "adding branch to par, p is undefined";
      }
    if(p instanceof SC_Par){
      for(var n = 0; n < p.branches.length; n++){
        this.add(p.branches[n].prg);
        }
      }
    else{
      var b = new SC_SeqBranchOfPar(null, null, p);
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
    this.branches.push(new SC_SeqBranchOfPar(null, this, args[i]));
    }
  this.channel = channel;
  };
SC_ParDyn.prototype = {
  constructor: SC_ParDyn
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
      var b = new SC_SeqBranchOfPar(parbranch, copy, SC_nothing);
      b.setProgram(i.prg.bindTo(engine, b, null, b, cube, cinst));
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
    copy.itsParent = parbranch;
    copy.cube = cube;
    copy.channel = this.channel.bindTo(engine, b, null
                               , b, cube, cinst);
    copy.path = path;
    return copy;
    }
, add: SC_Par.prototype.add
, toString: SC_Par.prototype.toString
  };
function SC_AndBin(c1,c2){
  this.c1 = c1;
  this.c2 = c2;
  }
SC_AndBin.prototype = {
  constructor: SC_AndBin
, isAnSCProgram: true
, isPresent: function(m){
    return this.c1.isPresent(m) && this.c2.isPresent(m);
    }
, getAllValues: function(m,vals){
    this.c1.getAllValues(m,vals);
    this.c2.getAllValues(m,vals);
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_AndBin();
    copy.c1 = binder(this.c1).bindTo(engine, parbranch, seq, path, cube, cinst)
    copy.c2 = binder(this.c2).bindTo(engine, parbranch, seq, path, cube, cinst)
    return copy;
    }
, toString: function(){
    var res ="(";
    res += this.c1.toString()
            res += " /\\ "+this.c2.toString()
            return res+") ";
    }
, unregister: function(i){
    this.c1.unregister(i);
    this.c2.unregister(i);
    }
, registerInst: function(m,i){
    this.c1.registerInst(m,i);
    this.c2.registerInst(m,i);
    }
  };
function SC_And(configsArray){
  if((undefined == configsArray)||!(configsArray instanceof Array)){
    throw "no valid configuration for And combinator";
    }
  if(2 > configsArray.length){
    throw "not enough elements to combine with And operator ("
                                                       +configsArray.length+")";
    }
  if(2 == configsArray.length){
    return new SC_AndBin(configsArray[0], configsArray[1])
    }
  this.c = configsArray;
  };
SC_And.prototype = {
  constructor: SC_And
, isAnSCProgram: true
, isPresent: function(m){
    for(var i in this.c){
      if(this.c[i].isPresent(m)){
        continue;
        }
      return false;
      }
    return true;
    }
, getAllValues: function(m,vals){
    for(var i in this.c){
      this.c[i].getAllValues(m,vals);
      }
    }
, bindTo: function(engine, parbranch, seq, path, cube){
    var binder = _SC._b(cube);
    var tmp_configs = [];
    for(var i in this.c){
      tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch
                                                     , seq, path, cube, cinst));
      }
    var copy = new SC_And(tmp_configs);
    return copy;
    }
, toString: function(){
    var res ="("+this.c[0].toString();
    for(var i in this.c){
      res += " /\\ "+this.c[i].toString()
      }
    return res+") ";
    }
, unregister: function(i){
    for(var j in this.c){
      this.c[j].unregister(i);
      }
    }
, registerInst: function(m,i){
    for(var j in this.c){
      this.c[j].registerInst(m,i);
      }
    }
  };
function SC_OrBin(c1,c2){
  this.c1 = c1;
  this.c2 = c2;
  };
SC_OrBin.prototype = {
  constructor: SC_OrBin
, isAnSCProgram: true
, isPresent: function(m){
    return this.c1.isPresent(m) || this.c2.isPresent(m);
    }
, getAllValues: SC_AndBin.prototype.getAllValues
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_OrBin();
    copy.c1 = binder(this.c1).bindTo(engine, parbranch, seq, path, cube, cinst)
    copy.c2 = binder(this.c2).bindTo(engine, parbranch, seq, path, cube, cinst)
    return copy;
    }
, toString: function(){
    var res ="(";
    res += this.c1.toString()
            res += " \\/ "+this.c2.toString()
            return res+") ";
    }
, unregister: SC_AndBin.prototype.unregister
, registerInst: SC_AndBin.prototype.registerInst
  };
function SC_Or(configsArray){
  if((undefined == configsArray)||!(configsArray instanceof Array)){
    throw "no valid configuration for And combinator";
    }
  if(2 > configsArray.length){
    throw "not enough elements to combine with And operator ("
                                                       +configsArray.length+")";
    }
  if(2 == configsArray.length){
    return new SC_OrBin(configsArray[0], configsArray[1])
    }
  this.c = configsArray;
  };
SC_Or.prototype = {
  constructor: SC_Or
, isPresent: function(m){
    for(var i in this.c){
      if(this.c[i].isPresent(m)){
        return true
        }
      }
    return false;
    }
, getAllValues: SC_And.prototype.getAllValues
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);
    const tmp_configs = [];
    for(var i in this.c){
      tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch
                                                     , seq, path, cube, cinst));
      }
    const copy = new SC_Or(tmp_configs);
    return copy;
    }
, toString: function(){
    var res ="("+this.c[0].toString();
    for(var i in this.c){
      res += " \\/ "+this.c[i].toString()
      }
    return res+") ";
    }
, unregister: SC_And.prototype.unregister
, registerInst: SC_And.prototype.registerInst
  };
function SC_Cell(params){
  this.params= params;
  };
Object.defineProperty(SC_Cell.prototype, "isAnSCProgram", { value: true
                                                          , writable: false });
SC_Cell.prototype.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const p= this.params;
    const cell= new SC_Instruction(SC_Opcodes.CELL);
    cell.itsParent= this;
    if(p._sc_targeted){
      Object.defineProperty(cell, "state", { set: (function(nom, x){
            this[nom]= x;
            }).bind(p.target, p.field)
        , get: (function(nom){
            return this[nom];
            }).bind(p.target, p.field)
        });
      }
    else{
      cell.state= (p.init)?p.init:null;
      }
    cell.sideEffect= binder(p.sideEffect)
    cell.TODO=-1;
    cell.futur=null;
    Object.defineProperty(this, "val", {
        value: function(){ return this.val(); }.bind(cell)
      , writable: false
        });
    Object.defineProperty(this, "bindTo", {
        value: function(){ return this; }.bind(cell)
      , writable: false
        });
    return cell;
    };
function SC_CubeCell(c){
  this.cellName=c;
  };
SC_CubeCell.prototype = {
  constructor: SC_CubeCell
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var tgt=cube[this.cellName];
    var copy=new SC_Instruction(SC_Opcodes.CUBE_CELL_INIT);
    if(tgt instanceof SC_Instruction
      && (tgt.oc==SC_Opcodes.CELL
                || tgt.oc==SC_Opcodes.CELL_INIT)){
      return tgt.bindTo(engine, parbranch, seq, copy, cube, cinst);
      }
    copy.cellName=this.cellName;
    copy.cell=null;
    copy.cube=cube;
    copy.path=path;
    return copy;
    }
, toString: function(){
    return "activ cell "+this.cellName;
    }
  };
function SC_Kill(c, p, end){
  this.c = c;
  this.p = p;
  this.end = end;
  };
SC_Kill.prototype = {
  constructor: SC_Kill
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);  
    const copy = new SC_Instruction(SC_Opcodes.KILL_SUSP_INIT);
    copy.c = binder(this.c)
                .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.p = this.p.bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.end = parseInt(this.end);
    copy.path = path;
    copy.seq = seq;
    return copy;
    }
, toString: function(){
    return "kill "+this.p.toString()
            +" on "+this.c.toString()
            +((null != this.h)?"handle "+this.h:"")
            +" end kill ";
  }
  };
function SC_Control(c, p){
  this.c = c;
  this.p = p;
  };
SC_Control.prototype = {
  constructor:SC_Control
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.CONTROL_INIT);
    copy.c = this.c.bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.p = this.p.bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.path = path;
    return copy;
    }
, toString: function(){
    return "control "+this.p.toString()
            +" by "+this.c.toString()
            +" end control ";
    }
  };
function SC_Dump(p){
  this.p= p;
  _SC.markProgram(this);
  };
(function(){
const proto= SC_Dump.prototype;
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    var copy= new SC_Instruction(SC_Opcodes.DUMP_INIT);
    copy.p= this.p.bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.path= path;
    return copy;
    };
proto.toString= function(){
    return "dump "+this.p.toString()
            +" end dump ";
    };
})();
function SC_When(c){
  this.c= c;
  this.elsB= 0;
  _SC.markProgram(this);
  };
SC_When.prototype.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const bound_config= binder(this.c);
    const copy= new SC_Instruction(SC_Opcodes.WHEN);
    copy.c= bound_config.bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.elsB= parseInt(this.elsB);
    copy.path= path;
    copy.seq= seq;
    return copy;
    };
SC_When.prototype.toString= function(){
    return "when "+this.c.toString()+" then ";
    };
function SC_Test(b, thenB, elseB){
  this.b= b;
  this._thenB= thenB;
  this._elseB= elseB;
  };
proto= SC_Test.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.TEST);
    copy._b= this.b;
    binder(this.b);
    copy.test= this.b
    copy.elsB= this.elsB;
    copy.path= path;
    copy.seq= seq;
    return copy;
    };
proto.toString= function(){
    return "test "+this.b.toString()
            +" then "+this._thenB.toString()
            +(this._elseB?"else "+this._elseB.toString():"")
            +" end test ";
    };
function SC_Match(val, cases){
  this.v= val;
  this.cases= cases;
  };
proto= SC_Match.prototype;
_SC.markProgram(proto);
proto.bindTo= function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.MATCH_INIT);
    binder(this.v);
    copy.v= this.v;
    copy.cases = new Array(this.cases.length);
    for(var n in this.cases){
      copy.cases[n] = this.cases[n]
                       .bindTo(engine, parbranch, null, copy, cube, cinst);
    }
    copy.path= path;
    return copy;
    };
proto.toString= function(){
    var choices = "";
    for(var v in this.cases){
        choices += "{ "+v+" : "+this.cases[v]+"}"
      }
    return "match "+this.v+" selsect "+choices
            +" end match ";
    };
function SC_Cube(o, p, extension){
  this.o= o;
  this.p= p;
  this.init= NO_FUN;
  this.lastWill= NO_FUN;
  if(extension){
    if(extension.init){
      this.init= _SC.isFun(extension.init)?extension.init:null;
      }
    if(extension.lastWill){
      this.lastWill= _SC.isFun(extension.lastWill)?extension.lastWill:null;
      }
    if(extension.swapList){
      this.swapList= extension.swapList;
      }
    if(extension.cubeProto){
      this.cubeProto= extension.cubeProto;
      }
    else {
      this.cubeProto= {};
      }
    }
  else{
    this.cubeProto= {};
    }
  this.toAdd= [];
  };
function SC_CubeReader(){
  };
(function(){
  const proto= SC_CubeReader.prototype;
  Object.freeze(proto);
})();
SC_Cube.prototype= {
  constructor: SC_Cube
, isAnSCProgram: true
, addProgram: function(p){
    if((undefined == p)||!p.isAnSCProgram){
      throw new Error("undefined program to add in cube: "+p);
      }
    this.toAdd.push(p);
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder= _SC._b(this);
    if(undefined!==this.o.SC_cubeAddBehaviorEvt){
      throw new Error("warning javascript object already configured !"
                  +"Be sure that it is not used bound to another program"
                  +", especially in a different reactive machine");
      }
    SC_cubify.apply(this.o, this.cubeProto);
    const copy= new SC_Instruction(SC_Opcodes.CUBE_ZERO);
    copy.o= this.o;
    const Evt_kill= this.o.SC_cubeKillEvt;
    copy.killEvt = Evt_kill.bindTo(engine, parbranch
                                 , null, copy, cube, cinst);
    copy.swapList= this.swapList;
    copy.exposeReader= new SC_CubeReader();
    copy.exposedState= { exposeInstant: -1 };
    const cells= copy.swapList;
    if(cells){
      for(var i of cells){
        const idn= i.id;
        Object.defineProperty(copy.exposeReader
        , idn
        , { get: (function(name){
                return this[name];
                }).bind(copy.exposedState, idn)
            }
          );
        copy.exposedState[idn]= null;
        }
      }
    Object.defineProperty(copy.o
                        , "SC_me"
                        , { value: new SC_CubeExposedState() , writable: false }
                        );
    var tmp_par_dyn;
    var tmp_beh= tmp_par_dyn= SC.parex(this.o.SC_cubeAddBehaviorEvt
             , this.p
               );
    for(var i=0; i<this.toAdd.length; i++){
      tmp_par_dyn.add(this.toAdd[i]);
      }
    copy.path=path;
    var swap_text="(function(state, m){ this.exposeInstant=m.instantNumber; ";
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
            swap_text+= "  this."+k.id
                      + " = state."+k.id
                      + ";";
            break;
            }
          }
        }
      }
    swap_text+= " })";
    copy.exposedState.__proto__= copy.o;
    copy.swap = cells?(eval(swap_text).bind(copy.exposedState, copy.o)):NO_FUN;
    copy.init= binder(this.init);
    copy.lastWill= binder(this.lastWill);
    copy.p= tmp_beh.bindTo(engine, parbranch, null
                      , copy, copy.o, copy);
    copy.dynamic= tmp_par_dyn;
    copy.m= engine;
    copy.pb= parbranch;
    return copy;
    }
, toString: function(){
    return "cube "+this.o.toString()
            +" with "+this.p.toString()
            +" end cube ";
    }
  };
function SC_CubeActionForever(params){
  this.action= params.fun;
  this.evtList= (params.evtList)?params.evtList:[];
  };
SC_CubeActionForever.prototype = {
  constructor: SC_CubeActionForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder= _SC._b(cube);
    const copy= new SC_Instruction(SC_Opcodes.CUBE_ACTION_FOREVER_INIT);
    copy.action= binder(this.action);
    copy.evtList= [];
    for(var i= 0; i<this.evtList.length; i++){
      copy.evtList.push(binder(this.evtList[i]));
      }
    copy._action= this.action;
    copy._evtList= this.evtList;
    copy.closure= _SC.bindIt(copy.action);
    return copy;
    }
, toString: function(){
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
  };
SC_CubeAction.prototype = {
  constructor: SC_CubeAction
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var times = binder(this.times);
    if(0 == times){
      return SC_nothing;
      }
    if((undefined === times)||(1 == times)){
      return new SC_CubeSimpleAction(this.action)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    if(times < 0){
      return new SC_CubeActionForever(this.action)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    var copy = new SC_Instruction(SC_Opcodes.CUBE_ACTION_N_TIMES_INIT);
    copy.action = binder(this.action);
    copy._action = this.action;
    copy._times = this.times;
    if("function" == typeof times){
      Object.defineProperty(copy, "times",{get: times});
      }
    else{
      copy.times = times;
      }
    if(copy.action.f && copy.action.t){
      if(undefined!==copy.action.p){
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t
                                                       , copy.action.p);
        }
      else{
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
        }
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
, toString: function(){
    return "call "+((undefined == this.action.f)?"call("+this.action+") "
                 :this.action.t+"."+this.action.f+"() ")
                 +((this.times>1)?(this.count+"/"+this.times+" times "):" ");
    }
  };
function SC_CubeSimpleAction(params){
  this.action = params.fun;
  this.evtList = (params.evtList)?params.evtList:[];
  };
SC_CubeSimpleAction.prototype={
  constructor: SC_CubeSimpleAction
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder=_SC._b(cube);
    var copy=new SC_Instruction(SC_Opcodes.CUBE_ACTION);
    copy.action=binder(this.action);
    copy._action=this.action;
    if(copy.action.f && copy.action.t){
      if(undefined!==copy.action.p){
        copy.closure=copy.action.t[copy.action.f].bind(copy.action.t
                                                       , copy.action.p);
        }
      else{
        copy.closure=copy.action.t[copy.action.f].bind(copy.action.t);
        }
      }
    else{
      copy.closure=copy.action.bind(cube);
      }
    copy.evtList = [];
    for(var i = 0; i < this.evtList.length; i++){
      copy.evtList.push(binder(this.evtList[i]));
      }
    return copy;
    }
, toString: function(){
    return "call "+((undefined == this.action.f)?"call("+this.action+") "
                 :this.action.t+"."+this.action.f+"() ");
    }
  };
function SC_ValueWrapper(tgt, n){
  this.tgt = tgt;
  this.n = n;
  }
SC_ValueWrapper.prototype.getVal = function(){
  return this.tgt[this.n];
  }
var nextMachineID= 0;
const SC_WRITE_EVT= new SC_EventId("SC_WRITE_EVT");
const SC_WRITE_ID= new SC_EventId("SC_WRITE_ID");
function SC_ReactiveInterface(){
  };
function SC_Machine(params){
  if(undefined==performance){
    performance={ now: function(){
                 return new Date().getTime();
                 }
               };
    }
  Object.defineProperty(this, "id"
           , { value: "@_"+nextMachineID++
             , writable: false
             }
           );
  this.prg= new SC_Par([]).bindTo(this, null, null, null, null, null,null);
  this.instantNumber= 1;
  this.ended= false;
  this.toContinue= 0;
  this.startReaction= 0;
  this.burstMode= false;
  this.permanentActions= [];
  this.permanentGenerate= [];
  this.permanentActionsOn= [];
  this.permanentActionsOnOnly= [];
  this.permanentCubeActions= [];
  this.actions= [];
  this.actionsOnEvents= [];
  this.cells=[];
  this.generated_values= {};
  this.pending= [];
  this.externalPending= [];
  this.burstState= [];
  this.pendingSensors= [];
  this.pendingPrograms= [];
  this.parActions= [];
  this.setSensors= {};
  this.forEOB= [];
  this.name= (params.name)?params.name:"machine_"+SC.count;
  SC_cubify.apply(this);
  this.prg.cube= this;
  this.setStdOut(params.fun_stdout);
  this.setStdErr(params.fun_stderr);
  this.traceEvt=new SC_Event({ name: "traceEvt" });
  this.traceEvt.eventId= SC_WRITE_EVT;
  this.writeEvt=new SC_Event({ name: "writeEvt" });
  this.writeEvt.eventId= SC_WRITE_ID;
  if(params.init && params.init.isAnSCProgram){
    this.addProgram(params.init);
    }
  this.ips= 0;
  this.reactMeasuring= 0;
  this.environment= new PurgeableCollection();
  this.reactInterface= new SC_ReactiveInterface();
  this.reactInterface.getIPS= this.getIPS.bind(this);
  this.reactInterface.writeToStdout= function(s){
    this.pending.push({ e: this.traceEvt, v: s })
    }.bind(this);
  this.reactInterface.getInstantNumber= this.getInstantNumber.bind(this);
  this.reactInterface.getTopLevelParallelBranchesNumber
                      = this.getTopLevelParallelBranchesNumber.bind(this);
  this.reactInterface.sensorValueOf= function(sensorID){
    if(sensorID instanceof SC_SensorId){
      const val= this.generated_values[sensorID.iids];
      return val;
      }
    throw new Error("ask for value of non sensor ID");
    }.bind(this);
  this.reactInterface.addEntry= function(evtName, value){
      if(evtName instanceof SC_EventId){
        this.addEntry(evtName, value);
        }
      else{
        throw new Error("invalid event Id : "+evtName);
        }
      }.bind(this);
  this.reactInterface.addProgram= function(prg){
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
  Object.defineProperty(this.reactInterface, "burstMode"
           , {get: function(){
                      return this.burstMode;
                      }.bind(this)
             }
           );
  Object.defineProperty(this.reactInterface, "id"
           , { get: function(){
                      return this.id;
                      }.bind(this)
             }
           );
  SC_Global_Manager.addToRegisteredMachines(this);
  };
SC_Machine.prototype = {
  constructor: SC_Machine
, toString: function(){
    return this.id;
    }
, enablePrompt: function(flag){
    this.promptEnabled= flag;
    }
, setStdOut: function(stdout){
    this.stdOut= ("function"==typeof(stdout))?stdout:NO_FUN;
    }
, setDumpTraceFun: function(stdout){
    this.dumpTraceFun= ("function"==typeof(stdout))?stdout:NO_FUN;
    }
, setStdErr: function(stderr){
    this.stdErr= ("function" == typeof(stderr))?stderr:NO_FUN;
    }
, addEntry: function(evtId, val){
    const evt= this.getEvent(evtId);
    this.pending.push({ e: evt, v: val });
    }
, addProgram: function(p){
    this.pendingPrograms.push(p);
    }
, getInstantNumber: function(){
    return this.instantNumber;
    }
, getTopLevelParallelBranchesNumber: function(){
    return this.prg.branches.length;
    }
, getIPS: function(){
    return this.ips;
    }
, collapse: function(){
    this.prg= null;
    this.promptEnabled= false;
    this.whenGettingThread= null;
    this.permanentActions= null;
    this.permanentGenerate= null;
    this.permanentActionsOn= null;
    this.permanentActionsOnOnly= null;
    this.cubeActions= null;
    this.permanentCubeActions= null;
    this.lastWills= null
    this.actions= null;
    this.actionsOnEvents= null;
    this.cells= null;
    this.pending= null;
    this.pendingSensors= null;
    this.pendingPrograms= null;
    this.parActions= null;
    this.stdOut= NO_FUN;
    this.traceEvt= null;
    this.writeEvt= null;
    this.forEOB= null;
    this.environment= null;
    if(0!=this.timer){
      clearInterval(this.timer);
      this.timer= 0;
      }
    this.addProgram= NO_FUN;
    this.addEntry= NO_FUN;
    this.getTopLevelParallelBranchesNumber= function(){ return 0; };
    }
, getEvent: function(id){
    var res= this.environment.get(id.iids);
    if(undefined==res){
      this.environment.set(id.iids, res= new SC_Event(id, this));
      }
    else if(!(res instanceof SC_Event)){
      throw new Error("invalid event type");
      }
    return res;
    }
, getSensor: function(id){
    var res= this.environment.get(id.iids);
    if(undefined==res){
      this.environment.set(id.iids, res= new SC_Sensor(id));
      }
    else if(!(res instanceof SC_Sensor)){
      throw new Error("invalid sensor type");
      }
    return res;
    }
, sampleSensor: function(sensId, val){
    const sensor= this.getSensor(sensId);
    sensor.sampleVal= val;
    if(!sensor.sampled){
      sensor.sampled= true;
      this.pendingSensors.push(sensor);
      }
    }
, addCellFun: function(aCell){
    this.cells.push(aCell);
    }
, addEvtFun: function(f){
    this.actionsOnEvents.push(f);
    }
, addPermanentGenerate: function(inst, genVal){
    const evt= inst.evt;
    evt.permanentGenerators.push(inst);
    evt.permanentValuatedGenerator+= genVal;
    const t= this.permanentGenerate.indexOf(evt);
    if(0>t){
      this.permanentGenerate.push(evt);
      }
    }
, removeFromPermanentGenerate: function(inst, genVal){
    const evt= inst.evt;
    const t= evt.permanentGenerators.indexOf(inst);
    if(t>-1){
      evt.permanentGenerators.splice(t, 1);
      evt.permanentValuatedGenerator-= genVal;
      }
    if(0==evt.permanentGenerators.length){
      const te= this.permanentGenerate.indexOf(evt);
      this.permanentGenerate.splice(te, 1);
      }
    }
, addPermanentFun: function(fun){
    this.permanentActions.push(fun);
    }
, removeFromPermanent: function(fun){
    const t= this.permanentActions.indexOf(fun);
    if(t>-1){
      this.permanentActions.splice(t, 1);
      }
    }
, addPermanentActionOnOnly: function(inst){
    this.permanentActionsOnOnly.push(inst);
    }
, removeFromPermanentActionsOnOnly: function(inst){
    const t= this.permanentActionsOnOnly.indexOf(inst);
    if(t>-1){
      this.permanentActionsOnOnly.splice(t, 1);
      }
    }
, addPermanentActionOn: function(inst){
    this.permanentActionsOn.push(inst);
    }
, removeFromPermanentActionsOn: function(inst){
    var t= this.permanentActionsOn.indexOf(inst);
    if(t>-1){
      this.permanentActionsOn.splice(t, 1);
      }
    }
, addCubeFun: function(inst){
    this.cubeActions.push(inst);
    }
, addPermanentCubeFun: function(inst){
    this.permanentCubeActions.push(inst);
    }
, removeFromPermanentCube: function(inst){
    var t= this.permanentCubeActions.indexOf(inst);
    if(t>-1){
      this.permanentCubeActions.splice(t, 1);
      }
    }
, addFun: function(fun){
    this.actions.push(fun);
    }
, addDynPar: function(p){
    this.parActions.push(p);
    }
, registerForEndOfBurst: function(inst){
      this.forEOB.push(inst);
      }
, react: function(){
   if(this.ended){ return !this.ended; }
    var res = SC_IState.STOP;
    if(0<this.toContinue){
      this.burstMode= true;
      this.toContinue--;
      }
    else{
      if(0!=this.startReaction){
        this.startReaction= 0;
        }
      if(0>this.toContinue){
        this.toContinue= 0;
        }
      const pst= this.pendingSensors;
      const psl= pst.length;
      for(var i= 0; i<psl; i++){
        const sens= pst.pop();
        sens.systemGen(sens.sampleVal, this, true);
        sens.sampled= false;
        }
      this.pendingSensors = [];
      }
    this.generated_values= Object.assign({}, this.setSensors);
    var tmp= this.pending;
    this.pending= [];
    for(var n in tmp){
      tmp[n].e.generateInput(this, tmp[n].v);
      }
    for(var n in this.permanentGenerate){
      const evt= this.permanentGenerate[n];
      evt.generate(this, evt.permanentValuatedGenerator > 0);
      }
    tmp= this.pendingPrograms;
    this.pendingPrograms= [];
    for(var i in tmp){
      this.prg.addBranch(tmp[i], null, this);
      }
    this.actions= [];
    this.cubeActions= [];
    this.actionsOnEvents= [];
    this.cells= [];
    this.lastWills= [];
    this.parActions= [];
    if(this.promptEnabled){
      this.stdOut("\n"+this.instantNumber+" -: ");
      }
    while(SC_IState.SUSP == (res = this.activate())){
      }
    if((SC_IState.OEOI == res)||(SC_IState.WEOI == res)){
      this.eoi();
      res = SC_IState.STOP;
      }
    this.reactInterface.getValuesOf= function(evtID){
      if(evtID instanceof SC_EventId){
        return this.generated_values[evtID.iids];
        }
      throw new Error("ask for values of non event ID");
      }.bind(this);
    this.reactInterface.presenceOf=function(id){
      if(id instanceof SC_EventId){
        return this.getEvent(id).isPresent(this);
        }
      else if(id instanceof SC_SensorId){
        return this.getSensor(id).isPresent(this);
        }
      }.bind(this);
    this.generateValues();
    for(var cell in this.cells){
      this.cells[cell].prepare(this);
      }
    for(var i=0; i<this.actionsOnEvents.length; i++){
      const act=this.actionsOnEvents[i];
      var a=this.actionsOnEvents[i].action;
      if(a.f){
        const t=a.t;
        if(null==t){
          continue;
          }
        if(a.p){
          t[a.f].call(t, a.p, this.reactInterface);
          }
        else{
          t[a.f].call(t, this.reactInterface);
          }
        }
      else{
        a(this.reactInterface);
        }
      }
    for(var i=0; i<this.permanentActionsOnOnly.length; i++){
      const inst=this.permanentActionsOnOnly[i];
      const pres=inst.evtFun.config.isPresent(this);
      if(pres){
        const a=inst.evtFun.action;
        if(a.f){
          var t=a.t;
          if(null==t){
            continue;
            }
          if(a.p){
            t[a.f].call(t, a.p, this.reactInterface);
            }
          else{
            t[a.f].call(t, this.reactInterface);
            }
          }
        else{
          a(this.reactInterface);
          }
        }
      }
    for(var i=0; i<this.permanentActionsOn.length; i++){
      const inst=this.permanentActionsOn[i];
      const pres=inst.evtFun.config.isPresent(this);
      if(pres){
        const a=inst.evtFun.action;
        if(a.f){
          const t=a.t;
          if(null==t){
            continue;
            }
          if(a.p){
            t[a.f].call(t, a.p, this.reactInterface);
            }
          else{
            t[a.f].call(t, this.reactInterface);
            }
          }
        else{
          a(this.reactInterface);
          }
        }
      else if(SC_Opcodes.ACTION_ON_EVENT_FOREVER_HALTED == inst.oc){
        const act=inst.defaultAct;
        if(act.f){
          const t=act.t;
          if(null==t){
            continue;
            }
          if(a.p){
            t[act.f].call(t, a.p, this.reactInterface);
            }
          else{
            t[act.f].call(t, this.reactInterface);
            }
          }
        else{
          act(this.reactInterface);
          }
        }
      }
    const cal=this.cubeActions.length;
    for(var i= 0; i<cal; i++){
      const inst= this.cubeActions[i];
      inst.closure(this.reactInterface);
      }
    const pcal=this.permanentCubeActions.length;
    for(var i= 0; i<pcal; i++){
      const inst= this.permanentCubeActions[i];
      inst.closure(this.reactInterface);
      }
    for(var i=0; i<this.actions.length; i++){
      var act=this.actions[i];
      if(act.f){
        var t=act.t;
        if(null==t){
          continue;
          }
        if(a.p){
          t[act.f].call(t, a.p, this.reactInterface);
          }
        else{
          t[act.f].call(t, this.reactInterface);
          }
        }
      else{
        act(this.reactInterface);
        }
      }
    for(var i=0; i<this.permanentActions.length; i++){
      var act=this.permanentActions[i];
      if(act.f){
        var t=act.t;
        if(null==t){
          continue;
          }
        if(a.p){
          t[act.f].call(t, a.p, this.reactInterface);
          }
        else{
          t[act.f].call(t, this.reactInterface);
          }
        }
      else{
        act(this.reactInterface);
        }
      }
    for(var cell in this.cells){
      this.cells[cell].swap();
      }
    for(var i=0; i<this.parActions.length; i++){
      this.parActions[i].computeAndAdd(this);
      }
    const lws= this.lastWills;
    const lwsl= lws.length;
    for(var n= 0; n<lwsl; n++){
      const will= lws[n];
      will(this.reactInterface);
      }
    if(this.writeEvt.isPresent(this)){
      for(var msg of this.writeEvt.getValues(this)){
        if(msg._){ msg= "["+this.instantNumber+": "+msg.t+"]"; }
        this.stdOut(msg);
        }
      }
    if(this.traceEvt.isPresent(this)){
      if(this.dumpTraceFun){
        this.dumpTraceFun(this.traceEvt.getValues(this));
        }
      else{
        console.log.call(console, this.instantNumber
                                               , this.traceEvt.getValues(this));
        }
      }
    const eobs= this.forEOB.length;
    if(0==this.toContinue && eobs>0){
      this.startReaction=0;
      for(var i=0; i<eobs; i++){
        const eobi= this.forEOB.pop();
        eobi.updateAtEndOfBurst(this);
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
    this.ended=(res==SC_IState.TERM);
    if(this.ended){
      this.collapse();
      SC_Global_Manager.removeFromRegisteredMachines(this);
      }
    this.reactInterface.getValuesOf= undefined;
    this.reactInterface.presenceOf= undefined;
    this.burstMode= false;
    return !this.ended;
    }
, trace(){
    const args=[];
    args.push(`machine(${this.instantNumber}): `);
    for(var i of arguments){
      args.push(i);
      }
    console.log.apply(console, args);
    }
, activate: function(){
    var st = SC_IState.SUSP;
    var inst = this.prg;
    var seq = null;
    var control_body = false;
    var caller = act_exit;
    while(true){
ACT:  switch(inst.oc){
        case SC_Opcodes._EXIT:{
          return st;
          }
        case SC_Opcodes.REL_JUMP:{
          seq.idx += inst.relativeJump;
          inst = seq.seqElements[seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_BURST_FOREVER:{
          inst.oc = SC_Opcodes.REPEAT_BURST_FOREVER_NEXT;
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_BURST_FOREVER_NEXT:{
          this.registerForEndOfBurst(inst);
          inst.oc= SC_Opcodes.REPEAT_BURST_FOREVER_STOP;
          }
        case SC_Opcodes.REPEAT_BURST_FOREVER_STOP:{
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.REPEAT_FOREVER:{
          inst.oc = SC_Opcodes.REPEAT_FOREVER_TO_STOP;
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
          inst.oc = SC_Opcodes.REPEAT_FOREVER;
          st = SC_IState.STOP;
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
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.REPEAT_N_TIMES_INIT:{
          inst.count= inst.it;
          if(0>inst.count){
            inst.oc= SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER;
            break;
            }
          if(0===inst.count){
            seq.idx+= inst.end;
            inst= seq.seqElements[seq.idx];
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
            inst.oc= SC_Opcodes.REPEAT_N_TIMES_INIT;
            inst= seq.seqElements[seq.idx];
            break;
            }
          inst.oc= SC_Opcodes.REPEAT_N_TIMES;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER:{
          inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER_TO_STOP;
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER_TO_STOP:{
          inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_LATE_N_TIMES_INIT:{
          inst.count= inst.it.value;
          if(0>inst.count){
            inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER;
            break;
            }
          if(0===inst.count){
            seq.idx+= inst.end;
            inst= seq.seqElements[seq.idx];
            break;
            }
          }
        case SC_Opcodes.REPEAT_LATE_N_TIMES:{
          inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES_TO_STOP;
          inst.count--;
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_LATE_N_TIMES_TO_STOP:{
          if(0===inst.count){
            seq.idx+= inst.end;
            inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES_INIT;
            inst= seq.seqElements[seq.idx];
            break;
            }
          inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_BURST_N_TIMES_BUT_FOREVER:{
          inst.oc= SC_Opcodes.REPEAT_BURST_N_TIMES_BUT_FOREVER_TO_STOP;
          this.registerForEndOfBurst(inst);
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_BURST_N_TIMES_BUT_FOREVER_TO_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_BURST_N_TIMES_INIT:{
          inst.count= inst.it;
          if(0>inst.count){
            inst.oc= SC_Opcodes.REPEAT_BURST_N_TIMES_BUT_FOREVER;
            break;
            }
          if(0==inst.count){
            seq.idx+= inst.end;
            inst= seq.seqElements[seq.idx];
            break;
            }
          }
        case SC_Opcodes.REPEAT_BURST_N_TIMES:{
          inst.oc= SC_Opcodes.REPEAT_BURST_N_TIMES_TO_STOP;
          this.registerForEndOfBurst(inst);
          inst.count--;
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.REPEAT_BURST_N_TIMES_TO_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.IF_REPEAT_BURST_INIT:{
          if(!inst.condition.value){
            seq.idx+= inst.end;
            inst= seq.seqElements[seq.idx];
            break;
            }
          }
        case SC_Opcodes.IF_REPEAT_BURST:{
          inst.oc= SC_Opcodes.IF_REPEAT_BURST_TO_STOP;
          this.registerForEndOfBurst(inst);
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.IF_REPEAT_BURST_TO_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.IF_REPEAT_INIT:{
          if(!inst.condition.value){
            seq.idx+= inst.end;
            inst= seq.seqElements[seq.idx];
            break;
            }
          }
        case SC_Opcodes.IF_REPEAT:{
          inst.oc = SC_Opcodes.IF_REPEAT_TO_STOP;
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.IF_REPEAT_TO_STOP:{
          inst.oc = SC_Opcodes.IF_REPEAT_INIT;
          st = SC_IState.STOP;
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
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_INIT:{
          if(control_body){
            inst.oc=
                    SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED;
            break;
            }
          }
        case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER:{
          this.addPermanentCubeFun(inst);
          st= SC_IState.HALT;
          inst.oc= SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED;
          inst= caller;
          break;
          }
        case SC_Opcodes.CUBE_ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:{
          this.addPermanentCubeFun(inst);
          st= SC_IState.STOP;
          inst= caller;
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
            st = SC_IState.STOP;
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
          st = SC_IState.HALT;
          inst.oc = SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_HALTED;
          inst = caller;
          break;
          }
        case SC_Opcodes.CUBE_ACTION_N_TIMES_BUT_FOREVER_CONTROLED:{
          this.addCubeFun(inst);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.CUBE_ACTION_N_TIMES_INIT:{
          inst.count = inst.times;
          if(inst.count == 0){
            st = SC_IState.TERM;
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
            st = SC_IState.TERM;
            }
          else{
            st = SC_IState.STOP;
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
          st = SC_IState.HALT;
          inst.oc = SC_Opcodes.CUBE_ACTION_FOREVER_HALTED;
          inst = caller;
          break;
          }
        case SC_Opcodes.CUBE_ACTION_FOREVER_CONTROLED:{
          this.addCubeFun(inst);
          st = SC_IState.STOP;
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
          st = SC_IState.TERM;
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
          st = SC_IState.HALT;
          inst.oc = SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:{
          this.addFun(inst.closure);
          st = SC_IState.STOP;
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
            st = SC_IState.STOP;
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
          st = SC_IState.HALT;
          inst.oc = SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_HALTED;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_N_TIMES_BUT_FOREVER_CONTROLED:{
          this.addFun(inst.closure);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_N_TIMES_INIT:{
          inst.count = inst.times;
          if(inst.count == 0){
            st = SC_IState.TERM;
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
            st = SC_IState.TERM;
            }
          else{
            st = SC_IState.STOP;
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
          st = SC_IState.HALT;
          inst.oc = SC_Opcodes.ACTION_FOREVER_HALTED;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_FOREVER_CONTROLED:{
          this.addFun(inst.closure);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.SEQ_INIT:{
          inst.caller = caller;
          inst.seq = seq;
          }
        case SC_Opcodes.SEQ:{
          caller=seq=inst;
          inst.oc=SC_Opcodes.SEQ_BACK;
          inst=inst.seqElements[inst.idx];
          break;
          }
        case SC_Opcodes.SEQ_BACK:{
          if(SC_IState.TERM == st){
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
          st=SC_IState.TERM;
          inst=caller;
          break;
          }
        case SC_Opcodes.HALT:{
          st=SC_IState.HALT;
          inst=caller;
          break;
          }
        case SC_Opcodes.PAUSE_INLINE:{
          st = SC_IState.STOP;
          seq.idx++;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST:{
          inst.oc= SC_Opcodes.PAUSE_BURST_STOPPED;
          st= SC_IState.STOP;
          this.registerForEndOfBurst(inst);
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_STOPPED:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_DONE:{
          inst.oc= SC_Opcodes.PAUSE_BURST;
          st= SC_IState.TERM;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE:{
          inst.oc = SC_Opcodes.PAUSE_DONE;
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAUSE_DONE:{
          inst.oc = SC_Opcodes.PAUSE;
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_UNTIL_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_UNTIL_DONE:{
          st= SC_IState.TERM;
          inst.oc= SC_Opcodes.PAUSE_BURST_UNTIL;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_UNTIL:{
          st= SC_IState.OEOI;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_UNTIL_DONE:{
          st = SC_IState.TERM;
          inst.oc = SC_Opcodes.PAUSE_UNTIL;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAUSE_UNTIL:{
          st = SC_IState.OEOI;
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
          st = SC_IState.STOP;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          inst.count--;
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_N_TIMES_INIT:{
          inst.count= inst.times;
          }
        case SC_Opcodes.PAUSE_BURST_N_TIMES:{
          if(0==inst.count){
            inst.oc= SC_Opcodes.PAUSE_BURST_N_TIMES_INIT;
            st= SC_IState.TERM;
            inst= caller;
            break;
            }
          inst.oc= SC_Opcodes.PAUSE_BURST_N_TIMES_STOPPED;
          this.registerForEndOfBurst(inst);
          }
        case SC_Opcodes.PAUSE_BURST_N_TIMES_STOPPED:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.NEXT_INLINED:{
          if(0==this.startReaction){
            this.startReaction= this.instantNumber;
            }
          this.toContinue= Math.max(this.toContinue, inst.count
                                                    +this.startReaction
                                                    -this.instantNumber);
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.NEXT:{
          if(0==this.startReaction){
            this.startReaction= this.instantNumber;
            }
          this.toContinue= Math.max(this.toContinue, inst.count
                                                    +this.startReaction
                                                    -this.instantNumber);
          st= SC_IState.TERM;
          inst= caller;
          break;
          }
        case SC_Opcodes.NEXT_DYN_INLINED:{
          if(0==this.startReaction){
            this.startReaction= this.instantNumber;
            }
          this.toContinue= Math.max(this.toContinue
                                               , inst.count(this.reactInterface)
                                                 +this.startReaction
                                                 -this.instantNumber);
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.NEXT_DYN:{
          if(0==this.startReaction){
            this.startReaction= this.instantNumber;
            }
          this.toContinue= Math.max(this.toContinue
                                               , inst.count(this.reactInterface)
                                                +this.startReaction
                                                -this.instantNumber);
          st= SC_IState.TERM;
          inst= caller;
          break;
          }
        case SC_Opcodes.NOTHING_INLINED:{
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.NOTHING:{
          st = SC_IState.TERM;
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
          st = SC_IState.TERM;
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
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_FOREVER_NO_VAL_INIT:{
          if(control_body){
            inst.oc = SC_Opcodes.GENERATE_BURST_FOREVER_NO_VAL_CONTROLED;
            break;
            }
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
          st = SC_IState.HALT;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_NO_VAL_CONTROLED:{
          inst.evt.generate(this);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_FOREVER_INIT:{
          if(control_body){
            inst.oc= SC_Opcodes.GENERATE_BURST_FOREVER_CONTROLED;
            break;
            }
          }
        case SC_Opcodes.GENERATE_BURST_FOREVER:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.registerForEndOfBurst(inst);
          this.addPermanentGenerate(inst, 1);
          inst.oc = SC_Opcodes.GENERATE_FOREVER_HALTED;
          st = SC_IState.HALT;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc = SC_Opcodes.GENERATE_FOREVER_EXPOSE_HALTED;
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_EXPOSE_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_EXPOSE_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc = SC_Opcodes.GENERATE_FOREVER_FUN_HALTED;
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_FUN_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_FUN_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_FOREVER_CELL_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_CELL_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_CELL_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_INIT:{
          if(control_body){
            inst.oc= SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED;
            break;
            }
          }
        case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_EXPOSE_INLINE_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FUN_INLINE_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_CELL_INLINE_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_INLINE_BUT_FOREVER:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.registerForEndOfBurst(inst);
          inst.oc= SC_Opcodes.GENERATE_BURST_INLINE_BUT_FOREVER_TO_STOP;
          }
        case SC_Opcodes.GENERATE_BURST_INLINE_BUT_FOREVER_TO_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_INLINE_INIT:{
          inst.count= inst.times;
          if(0==inst.count){
            inst= seq.seqElements[++seq.idx];
            break;
            }
          if(0>inst.count){
            inst.oc= SC_Opcodes.GENERATE_BURST_INLINE_BUT_FOREVER;
            break;
            }
          }
        case SC_Opcodes.GENERATE_BURST_INLINE:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          inst.count--;
          if(0==inst.count){
            inst.oc = SC_Opcodes.GENERATE_BURST_INLINE_INIT;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          inst.oc= SC_Opcodes.GENERATE_BURST_INLINE_TO_STOP;
          this.registerForEndOfBurst(inst);
          }
        case SC_Opcodes.GENERATE_BURST_INLINE_TO_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_INIT:{
          if(control_body){
            inst.oc = SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED;
            break;
            }
          }
        case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_INLINE_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_EXPOSE_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_FUN_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FUN_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.STOP;
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
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_CELL_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_CELL_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_BUT_FOREVER:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.registerForEndOfBurst(inst);
          inst.oc= SC_Opcodes.GENERATE_BURST_BUT_FOREVER_TO_STOP;
          }
        case SC_Opcodes.GENERATE_BURST_BUT_FOREVER_TO_STOP:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_INIT:{
          inst.count= inst.times;
          if(0==inst.count){
            inst = seq.seqElements[++seq.idx];
            break;
            }
          if(0>inst.count){
            inst.oc= SC_Opcodes.GENERATE_BURST_BUT_FOREVER;
            break;
            }
          inst.oc= SC_Opcodes.GENERATE_BURST;
          }
        case SC_Opcodes.GENERATE_BURST:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          inst.count--;
          if(0==inst.count){
            inst.oc= SC_Opcodes.GENERATE_BURST_INIT;
            st= SC_IState.TERM;
            inst= caller;
            break;
            }
          inst.oc= SC_Opcodes.GENERATE_BURST_TO_STOP;
          this.registerForEndOfBurst(inst);
          }
        case SC_Opcodes.GENERATE_BURST_TO_STOP:{
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_BUT_FOREVER:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          this.addPermanentGenerate(inst, 1);
          inst.oc= SC_Opcodes.GENERATE_BUT_FOREVER_HALTED;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_BUT_FOREVER_HALTED:{
          inst.itsParent.registerForProduction(inst);
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_BUT_FOREVER_CONTROLED:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.STOP;
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
          st = SC_IState.STOP;
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
            st = SC_IState.TERM;
            }
          else{
            st = SC_IState.STOP;
            }
          inst = caller;
          break;
          }
        case SC_Opcodes.AWAIT_INLINE:{
          if(inst.config.isPresent(this)){
            inst = seq.seqElements[++seq.idx];
            break;
            }
          inst.caller=caller;
          inst.config.registerInst(this, inst);
          inst.oc=SC_Opcodes.AWAIT_REGISTRED_INLINE;
          st=SC_IState.WAIT;
          inst=caller;
          break;
          }
        case SC_Opcodes.AWAIT_REGISTRED_INLINE:{
          if(inst.config.isPresent(this)){
            inst.oc=SC_Opcodes.AWAIT_INLINE;
            inst.config.unregister(inst);
            inst=seq.seqElements[++seq.idx];
            break;
            }
          st=SC_IState.WAIT;
          inst=caller;
          break;
          }
        case SC_Opcodes.AWAIT:{
          if(inst.config.isPresent(this)){
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          inst.config.registerInst(this, inst);
          inst.oc = SC_Opcodes.AWAIT_REGISTRED
          st = SC_IState.WAIT;
          inst = caller;
          break;
          }
        case SC_Opcodes.AWAIT_REGISTRED:{
          if(inst.config.isPresent(this)){
            inst.oc = SC_Opcodes.AWAIT;
            inst.config.unregister(inst);
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.WAIT;
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
          st = SC_IState.WEOI;
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
          st = SC_IState.WEOI;
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
            case SC_IState.TERM:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_SUSP;
              inst.c.unregister(inst);
              seq.idx += inst.end;
              inst = seq.seqElements[seq.idx];
              break ACT;
              }
            case SC_IState.SUSP:{
              caller = inst;
              inst = inst.p;
              break;
              }
            case SC_IState.WEOI:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_WEOI;
              inst = inst.caller;
              break;
              }
            case SC_IState.OEOI:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_OEOI;
              st = SC_IState.WEOI;
              inst = inst.caller;
              break;
              }
            case SC_IState.STOP:{
              caller=inst.caller;
              inst.oc=SC_Opcodes.KILL_STOP;
              st=SC_IState.WEOI;
              inst=inst.caller;
              break;
              }
            case SC_IState.WAIT:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_WAIT;
              st=(inst.c.isPresent(this))?SC_IState.WEOI
                                           :SC_IState.WAIT;
              inst = inst.caller;
              break;
              }
            case SC_IState.HALT:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_HALT;
              st=(inst.c.isPresent(this))?SC_IState.WEOI
                                           :SC_IState.WAIT;
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
          st = SC_IState.WEOI;
          caller = inst = inst.caller;
          break;
          }
        case SC_Opcodes.KILLED:{
          inst.oc = SC_Opcodes.KILL_SUSP;
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.RESET_ON_INIT:{
          inst.caller=caller;
          inst.config.registerInst(this, inst);
          }
        case SC_Opcodes.RESET_ON:{
          caller=inst;
          inst.oc=SC_Opcodes.RESET_ON_BACK;
          inst=inst.prog;
          break;
          }
        case SC_Opcodes.RESET_ON_BACK:{
          switch(st){
            case SC_IState.TERM:{
              caller= inst.caller;
              inst.oc= SC_Opcodes.RESET_ON_INIT;
              inst.config.unregister(inst);
              inst= caller;
              break;
              }
            case SC_IState.SUSP:{
              caller= inst;
              inst= inst.prog;
              break;
              }
            case SC_IState.WEOI:{
              caller= inst.caller;
              inst.oc= SC_Opcodes.RESET_ON_WEOI;
              inst=inst.caller;
              break;
              }
            case SC_IState.STOP:{
              st=SC_IState.OEOI;
              }
            case SC_IState.OEOI:{
              caller= inst.caller;
              inst.oc= SC_Opcodes.RESET_ON_P_OEOI;
              inst= inst.caller;
              break;
              }
            case SC_IState.HALT:{
              caller= inst.caller;
              inst.oc= SC_Opcodes.RESET_ON_WAIT;
              st= (inst.config.isPresent(this))?SC_IState.OEOI
                                               :SC_IState.WAIT;
              inst=inst.caller;
              break;
              }
            case SC_IState.WAIT:{
              caller= inst.caller;
              st= (inst.config.isPresent(this))?SC_IState.WEOI
                                               :SC_IState.WAIT;
              inst.oc= SC_Opcodes.RESET_ON_WAIT;
              inst= inst.caller;
              break;
              }
            default:{
              throw "*** RESET_ON state pb !"
              }
            }
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
            st = SC_IState.WAIT;
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
            case SC_IState.SUSP:{
              inst = inst.p;
              break;
              }
            case SC_IState.OEOI:
            case SC_IState.WEOI:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.CONTROL_REGISTERED_EOI;
              st = SC_IState.WEOI;
              inst = caller;
              break;
              }
            case SC_IState.STOP:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.CONTROL_REGISTERED_CHECK;
              st = SC_IState.WAIT;
              inst = caller;
              break;
              }
            case SC_IState.WAIT:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.CONTROL_REGISTERED_CHECK;
              st = SC_IState.WAIT;
              inst = caller;
              break;
              }
            case SC_IState.HALT:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.CONTROL_REGISTERED_HALT;
              st = SC_IState.WAIT;
              inst = caller;
              break;
              }
            case SC_IState.TERM:{
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
          if(undefined!==inst.test.value && !inst.test.value){
            seq.idx+= inst.elsB;
            inst= seq.seqElements[seq.idx];
            break;
            }
          else if(undefined===inst.test.value){
            inst.test.resolve(this);
            seq.idx+= inst.elsB;
            inst= seq.seqElements[seq.idx];
            break;
            }
          inst= seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT:{
          if(!control_body){
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_HALTED;
            this.addPermanentActionOnOnly(inst);
            st = SC_IState.HALT;
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
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          st = SC_IState.WAIT;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP:{
          if(inst.evtFun.config.isPresent(this)){
            this.addEvtFun(inst.evtFun);
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED;
          st = SC_IState.WAIT;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER:{
          if(!control_body){
            this.addPermanentActionOn(inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_HALTED;
            st = SC_IState.HALT;
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
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          st = SC_IState.WEOI;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_STOP:{
          if(inst.evtFun.config.isPresent(this)){
            this.addEvtFun(inst.evtFun);
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          inst.oc = SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED;
          st = SC_IState.WEOI;
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
            st = SC_IState.TERM;
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
              st = SC_IState.TERM;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_STOP;
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          st = SC_IState.WEOI;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_STOP:{
          if(0 == inst.count){
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT;
            st = SC_IState.TERM;
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
              st = SC_IState.TERM;
              inst = caller;
              break;
              }
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          inst.oc = SC_Opcodes.ACTION_ON_EVENT_REGISTERED;
          st = SC_IState.WEOI;
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
            st = SC_IState.TERM;
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
              st = SC_IState.TERM;
              inst = caller;
              break;
              }
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_STOP;
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          st = SC_IState.WEOI;
          inst = caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_STOP:{
          if(0 == inst.count){
            inst.evtFun.config.unregister(inst);
            inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT;
            st = SC_IState.TERM;
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
              st = SC_IState.TERM;
              inst = caller;
              break;
              }
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          inst.oc = SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED;
          st = SC_IState.WEOI;
          inst = caller;
          break;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT:{
          if(inst.evtFun.config.isPresent(this)){
            this.addEvtFun(inst.evtFun);
            st = SC_IState.TERM;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.WEOI;
          inst = caller;
          break;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT:{
          if(inst.evtFun.config.isPresent(this)){
            this.addEvtFun(inst.evtFun);
            st = SC_IState.TERM;
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
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
            st = SC_IState.WEOI;
            inst = caller;
            break;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED:{
          inst.evtFun.config.unregister(inst);
          inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT;
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_ENDED:{
          inst.evtFun.config.unregister(inst);
          inst.oc = SC_Opcodes.SIMPLE_ACTION_ON_EVENT;
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL:{
          if(inst.evt instanceof SC_LateBinding){
            inst.evt = inst.evt.resolve();
            }
          }
        case SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_RESOLVED:{
          inst.evt.generate(this);
          inst.oc= SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_STOPPED;
          this.registerForEndOfBurst(inst);
          }
        case SC_Opcodes.GENERATE_BURST_FOREVER_LATE_EVT_NO_VAL_STOPPED:{
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL:{
          if(inst.evt instanceof SC_LateBinding){
            inst.evt = inst.evt.resolve();
            }
          inst.oc = SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL_RESOLVED;
          }
        case SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL_RESOLVED:{
          inst.evt.generate(this);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_LATE_VAL:{
          inst.itsParent.registerForProduction(inst);
          inst.evt.generate(this, true);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.FILTER_FOREVER_NO_ABS:{
          inst.sensor.registerInst(this, inst);
          inst.oc = SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED;
          }
        case SC_Opcodes.FILTER_FOREVER_NO_ABS_REGISTERED:{
          if(inst.sensor.isPresent(this)){
            inst.val = inst.filterFun(inst.sensor.getValue(this)
                                      , this.reactInterface);
            if(undefined !== inst.val){
              inst.itsParent.registerForProduction(inst);
              inst.evt.generate(this, true);
              }
            }
          st = SC_IState.WAIT;
          inst = caller;
          break;
          }
        case SC_Opcodes.FILTER_FOREVER:{
          if(inst.sensor.isPresent(this)){
            inst.val = inst.filterFun(inst.sensor.getValue(this)
                                    , this.reactInterface);
            if(undefined !== inst.val){
              inst.itsParent.registerForProduction(inst);
              inst.evt.generate(this, true);
              }
            else{
              inst.noSens_evt.generate(this);
              }
            }
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.FILTER_ONE:{
          if(inst.sensor.isPresent(this)){
            inst.val = inst.filterFun(inst.sensor.getValue(this)
                                    , this.reactInterface);
            if(null != inst.val){
              inst.itsParent.registerForProduction(inst);
              inst.evt.generate(this, true);
              }
            }
          else{
            inst.noSens_evt.generate(this);
            }
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.FILTER_ONE_NO_ABS:{
          if(inst.sensor.isPresent(this)){
            inst.val = inst.filterFun(inst.sensor.getValue(this)
                                    , this.reactInterface);
            if(null != inst.val){
              inst.itsParent.registerForProduction(inst);
              inst.evt.generate(this, true);
              }
            }
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.FILTER:{
          if(inst.sensor.isPresent(this)){
            inst.val = inst.filterFun(inst.sensor.getValue(this)
                                    , this.reactInterface);
            if(null != inst.val){
              inst.itsParent.registerForProduction(inst);
              inst.evt.generate(this, true);
              }
            }
          else{
            inst.noSens_evt.generate(this);
            }
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.FILTER_NO_ABS_INIT:{
          inst.count = inst.times;            
          inst.oc = SC_Opcodes.FILTER_NO_ABS;
          }
        case SC_Opcodes.FILTER_NO_ABS:{
          if(inst.sensor.isPresent(this)){
            inst.val = inst.filterFun(inst.sensor.getValue(this)
                                    , this.reactInterface);
            if(null != inst.val){
              inst.itsParent.registerForProduction(inst);
              inst.evt.generate(this, true);
              }
            }
          inst.count--;
          if(0 == inst.count){
            inst.oc = SC_Opcodes.FILTER_NO_ABS_INIT;
            st = SC_IState.TERM;
            inst = caller;
            break;
            }
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.SEND:{
          if(inst.count-- > 0){
            this.generateEvent(inst.evt, inst.value);
            st = SC_IState.STOP;
            inst = caller;
            break;
            }
          inst.count = inst.times;
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.SEND_ONE:{
          this.generateEvent(inst.evt, inst.value);
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.SEND_FOREVER:{
          this.generateEvent(inst.evt, inst.value);
          st = SC_IState.STOP;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAR_DYN_INIT:{
          inst.caller = caller;
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
            st = SC_IState.WEOI;
            inst = caller;
            break;
            }
          if((inst.waitting.start != null) || (inst.halted.start != null)){
            st = inst.channel.isPresent(this)
                             ?SC_IState.WEOI
                             :SC_IState.WAIT
                             ;
            inst = caller;
            break;
            }
          this.reset(inst);
          st = SC_IState.TERM;
          inst = inst.caller;
          break;
          }
        case SC_Opcodes.PAR_DYN_BACK:{
          switch(inst.toActivate.flag = st){
            case SC_IState.SUSP:{
                 inst = inst.toActivate.prg
                 break;
                 }
            case SC_IState.OEOI:
            case SC_IState.WEOI:{
                 inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                 inst.waittingEOI.append(inst.toActivate);
                 break;
                 }
            case SC_IState.STOP:{
                 inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                 inst.stopped.append(inst.toActivate);
                 break;
                 }
            case SC_IState.WAIT:{
                 inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                 inst.waitting.append(inst.toActivate);
                 break;
                 }
            case SC_IState.HALT:{
                 inst.oc = SC_Opcodes.PAR_DYN_FIRE;
                 inst.halted.append(inst.toActivate);
                 break;
                 }
            case SC_IState.TERM:{
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
        case SC_Opcodes.PAR_DYN_FORCE: {
          this.reset(inst);
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.PAR_INIT:{
          inst.caller = caller;
          inst.tmp = null;
          }
        case SC_Opcodes.PAR:{
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
            st = SC_IState.WEOI;
            caller = inst = inst.caller;
            break;
            }
          if(inst.stopped.start != null){
            if(inst.waitting.start == null){
              var t = inst.suspended;
              inst.suspended = inst.stopped;
              inst.stopped = t;
              inst.suspended.setFlags(SC_IState.SUSP);
              st = SC_IState.STOP;
              caller = inst = inst.caller;
              break;
              }
            st = SC_IState.WEOI;
            caller = inst = inst.caller;
            break;
            }
          if(inst.waitting.start != null){
            st = SC_IState.WAIT;
            caller = inst = inst.caller;
            break;
            }
          if(inst.halted.start != null){
            st = SC_IState.HALT;
            caller = inst = inst.caller;
            break;
            }
          this.reset(inst);
          st = SC_IState.TERM;
          caller = inst = inst.caller;
          break;
          }
        case SC_Opcodes.PAR_BACK:{
          switch(inst.toActivate.flag = st){
            case SC_IState.SUSP:{
              inst = inst.toActivate.prg;
              break;
              }
            case SC_IState.OEOI:
            case SC_IState.WEOI:{
              inst.oc = SC_Opcodes.PAR_FIRE;
              inst.waittingEOI.append(inst.toActivate);
              break;
              }
            case SC_IState.STOP:{
              inst.oc = SC_Opcodes.PAR_FIRE;
              inst.stopped.append(inst.toActivate);
              break;
              }
            case SC_IState.WAIT:{
              inst.oc = SC_Opcodes.PAR_FIRE;
              inst.waitting.append(inst.toActivate);
              break;
              }
            case SC_IState.HALT:{
              inst.oc = SC_Opcodes.PAR_FIRE;
              inst.halted.append(inst.toActivate);
              break;
              }
            case SC_IState.TERM:{
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
          inst.startTime= performance.now();
          inst.oc= SC_Opcodes.PAUSE_RT;
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_RT:{
          if(performance.now()-inst.startTime > inst.duration){
            inst.oc= SC_Opcodes.PAUSE_RT_INIT;
            st=  SC_IState.TERM;
            inst= caller;
            break;
            }
          st= SC_IState.STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.MATCH_INIT:{
          inst.caller= caller;
          }
        case SC_Opcodes.MATCH:{
          const val= inst.v.value;
          inst.choice= inst.cases[val];
          if(undefined==inst.choice){
            inst.choice= SC_nothing;
            }
          }
        case SC_Opcodes.MATCH_CHOOSEN:{
          caller= inst;
          inst.oc= SC_Opcodes.MATCH_BACK;
          inst= inst.choice;
          break;
          }
        case SC_Opcodes.MATCH_BACK:{
          inst.oc= SC_Opcodes.MATCH_CHOOSEN;
          if(SC_IState.TERM==st){
            this.reset(inst.choice);
            inst.choice=null;
            inst.oc= SC_Opcodes.MATCH;
            }
          caller= inst= inst.caller;
          break;
          }
        case SC_Opcodes.CUBE_ZERO:{
          inst.caller = caller;
          }
        case SC_Opcodes.CUBE_INIT:{
          inst.init.call(inst.o, this.reactInterface);
          inst.killEvt.registerInst(this, inst);
          inst.swap(this);
          }
        case SC_Opcodes.CUBE:{
          caller = inst;
          inst.oc = SC_Opcodes.CUBE_BACK;
          inst = inst.p;
          break;
          }
        case SC_Opcodes.CUBE_BACK:{
          switch(st){
            case SC_IState.TERM:{
              this.lastWills.push(inst.lastWill.bind(inst.o));
              this.reset(inst.p);
              inst.killEvt.unregister(inst);
              inst.oc = SC_Opcodes.CUBE_INIT;
              break;
              }
            case SC_IState.WAIT:{
              if(inst.killEvt.isPresent(this)){
                inst.oc = SC_Opcodes.CUBE_STOP;
                st = SC_IState.WEOI;
                }
              else{
                inst.oc = SC_Opcodes.CUBE_WAIT;
                }
              break;
              }
            case SC_IState.HALT:{
              if(inst.killEvt.isPresent(this)){
                inst.oc = SC_Opcodes.CUBE_STOP;
                st = SC_IState.OEOI;
                }
              else{
                inst.oc = SC_Opcodes.CUBE_WAIT;
                }
              break;
              }
            case SC_IState.OEOI:
            case SC_IState.STOP:{
              st = SC_IState.OEOI;
              }
            case SC_IState.WEOI:
            case SC_IState.SUSP:{
              inst.oc = SC_Opcodes.CUBE;
              break;
              }
            default:{
              console.error("stop");
              }
            }
          caller = inst = inst.caller;
          break;
          }
        case SC_Opcodes.CUBE_TERM:{
          inst.oc = SC_Opcodes.CUBE_INIT;
          st = SC_IState.TERM;
          caller = inst = inst.caller;
          break;
          }
        case SC_Opcodes.CELL_INIT:{
          inst.oc=SC_Opcodes.CELL;
          }
        case SC_Opcodes.CELL:{
          if(inst.TODO!=this.getInstantNumber()){
            inst.TODO=this.getInstantNumber();
            this.addCellFun(inst);
          }
          st=SC_IState.TERM;
          inst=caller;
          break;
          }
        case SC_Opcodes.CUBE_CELL_INIT:{
          inst.caller=caller;
          inst.cell=inst.cube[inst.cellName];
          }
        case SC_Opcodes.CUBE_CELL:{
          caller=inst;
          if(undefined!=inst.cell){
            inst.oc=SC_Opcodes.CUBE_CELL_BACK;
            inst=inst.cell;
            break;
            }
          }
        case SC_Opcodes.CUBE_CELL_BACK:{
          inst.oc=SC_Opcodes.CUBE_CELL;
          if(SC_IState.TERM==st){
            inst.oc=SC_Opcodes.CUBE_CELL;
            }
          caller=inst=inst.caller;
          break;
          }
        case SC_Opcodes.DUMP_INIT:{
          inst.caller= caller;
          }
        case SC_Opcodes.DUMP:{
          inst.oc= SC_Opcodes.DUMP_BACK;
          console.log("DUMP before prg:", inst.p);
          caller= inst;
          inst= inst.p
          break;
          }
        case SC_Opcodes.DUMP_BACK:{
          console.log("DUMP after prg:", inst.p);
          inst.oc= SC_Opcodes.DUMP;
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.LOG:{
          this.stdOut(inst.msg);
          st = SC_IState.TERM;
          inst = caller;
          break;
          }
        default:{ throw new Error("activate: undefined opcode "
                       +SC_Opcodes.toString(inst.oc))
                       ;
          console.trace();
          }
        }
      }
    }
, eoi: function(){
    var inst=this.prg;
    var seq=null;
    var caller=act_exit;
    while(true){
EOI:  switch(inst.oc){
        case SC_Opcodes._EXIT:{
          return;
          }
        case SC_Opcodes.GENERATE_ONE_NO_VAL_INLINE:
        case SC_Opcodes.ACTION:
        case SC_Opcodes.ACTION_INLINE:
        case SC_Opcodes.REPEAT_FOREVER:
        case SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER:
        case SC_Opcodes.REPEAT_LATE_N_TIMES:
        case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER:
        case SC_Opcodes.REPEAT_N_TIMES:
        case SC_Opcodes.AWAIT_REGISTRED_INLINE:
        case SC_Opcodes.AWAIT_REGISTRED:
        case SC_Opcodes.PAUSE_N_TIMES_INLINE:
        case SC_Opcodes.PAUSE_N_TIMES:
        case SC_Opcodes.SEQ_ENDED:
        case SC_Opcodes.SEQ_INIT:{
          inst=caller;
          break;
          }
        case SC_Opcodes.SEQ:{
          caller= seq= inst;
          inst.oc= SC_Opcodes.SEQ_BACK;
          inst= inst.seqElements[inst.idx];
          break;
          }
        case SC_Opcodes.SEQ_BACK:{
          inst.oc= SC_Opcodes.SEQ;
          seq= inst.seq
          caller= inst= inst.caller;
          break;
          }
        case SC_Opcodes.WHEN_REGISTERED:{
          seq.idx+= inst.elsB;
          inst.oc= SC_Opcodes.WHEN;
          inst.c.unregister(inst);
          inst= caller;
          break;
          }
        case SC_Opcodes.RESET_ON:
        case SC_Opcodes.RESET_ON_P_OEOI:
        case SC_Opcodes.RESET_ON_WEOI:{
          inst.rstOC= inst.oc;
          inst.oc= SC_Opcodes.RESET_ON_BACK;
          caller= inst;
          inst= inst.prog;
          break;
          }
        case SC_Opcodes.RESET_ON_WAIT:
        case SC_Opcodes.RESET_ON_BACK:{
          inst.oc= SC_Opcodes.RESET_ON;
          if(inst.config.isPresent(this)){
            this.reset(inst.prog);
            }
          else if(inst.rstOC===SC_Opcodes.RESET_ON_WAIT){
            inst.oc= inst.rstOC;
            }
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.KILL_SUSP_REGISTERED:
        case SC_Opcodes.KILL_OEOI:
        case SC_Opcodes.KILL_WEOI:{
          inst.oc= SC_Opcodes.KILL_STOP;
          caller= inst;
          inst= inst.p;
          break;
          }
        case SC_Opcodes.KILL_STOP:{
          if(inst.c.isPresent(this)){
            inst.oc= SC_Opcodes.KILLED;
            this.reset(inst.p);
            inst.c.unregister(inst);
            }
          else{
            inst.oc= SC_Opcodes.KILL_SUSP_REGISTERED;
            }
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.KILL_HALT:
        case SC_Opcodes.KILL_WAIT:{
          if(inst.c.isPresent(this)){
            inst.oc= SC_Opcodes.KILLED;
            inst.c.unregister(inst);
            this.reset(inst.p);
            }
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.CONTROL_REGISTERED_EOI:{
          caller= inst;
          inst.oc= SC_Opcodes.CONTROL_REGISTERED_BACK;
          inst= inst.p;
          break;
          }
        case SC_Opcodes.CONTROL_REGISTERED_BACK:{
          inst.oc= SC_Opcodes.CONTROL_REGISTERED_CHECK;
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_FOREVER_REGISTERED:{
          this.addFun(inst.defaultAct);
          inst= caller;
          break;
          }
        case SC_Opcodes.ACTION_ON_EVENT_REGISTERED:{
          this.addFun(inst.defaultAct);
          }
        case SC_Opcodes.ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
          if(inst.count>0){
            inst.count--;
            }
          inst= caller;
          break;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_REGISTERED:{
          this.addFun(inst.defaultAct);
          inst.oc= SC_Opcodes.SIMPLE_ACTION_ON_EVENT_ENDED;
          inst= caller;
          break;
          }
        case SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_REGISTERED:{
          inst.oc= SC_Opcodes.SIMPLE_ACTION_ON_EVENT_NO_DEFAULT_ENDED;
          inst= caller;
          break;
          }
        case SC_Opcodes.HALT:
        case SC_Opcodes.PAUSE_N_TIMES_INLINE:{
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_UNTIL:{
          if(inst.cond(this.reactInterface)){
            inst.oc= SC_Opcodes.PAUSE_UNTIL_DONE;
            }
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_UNTIL:{
          this.registerForEndOfBurst(inst);
          inst.oc= SC_Opcodes.PAUSE_BURST_UNTIL_STOP;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAR_DYN:{
          if(null!=inst.tmp){
            inst.suspended.append(inst.tmp);
            }
          inst.tmp= inst.waittingEOI.pop();
          if(null!=inst.tmp){
            inst.tmp.flag= SC_IState.SUSP;
            caller= inst;
            inst= inst.tmp.prg;
            break;
            }
          var tmp= inst.stopped.pop();
          while(null!=tmp){
            tmp.flag= SC_IState.SUSP;
            inst.suspended.append(tmp);
            tmp= inst.stopped.pop();
            }
          if(inst.channel.isPresent(this)){
            this.addDynPar(inst);
            }
          else{
            if(inst.suspended.isEmpty()
                && inst.waitting.isEmpty()
                && inst.halted.isEmpty()){
              inst.oc= SC_Opcodes.PAR_DYN_FORCE;
              }
            }
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.PAR:{
          if(null!=inst.tmp){
            inst.suspended.append(inst.tmp);
            }
          inst.tmp= inst.waittingEOI.pop();
          if(null!=inst.tmp){
            inst.tmp.flag= SC_IState.SUSP;
            caller= inst;
            inst= inst.tmp.prg;
            break;
            }
          var tmp= inst.stopped.pop();
          while(null!=tmp){
            tmp.flag= SC_IState.SUSP;
            inst.suspended.append(tmp);
            tmp= inst.stopped.pop();
            }
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.MATCH_CHOOSEN:{
          caller= inst;
          inst.oc= SC_Opcodes.MATCH_BACK;
          inst= inst.choice;
          break;
          }
        case SC_Opcodes.MATCH_BACK:{
          inst.oc= SC_Opcodes.MATCH_CHOOSEN;
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.CUBE:{
          caller= inst;
          inst.oc= SC_Opcodes.CUBE_BACK;
          inst= inst.p;
          break;
          }
        case SC_Opcodes.CUBE_HALT:
        case SC_Opcodes.CUBE_WAIT:
        case SC_Opcodes.CUBE_STOP:
        case SC_Opcodes.CUBE_BACK:{
          if(inst.killEvt.isPresent(this)){
            this.lastWills.push(inst.lastWill.bind(inst.o));            
            this.reset(inst.p);
            inst.oc= SC_Opcodes.CUBE_TERM;
            inst.killEvt.unregister(inst);
            }
          else{
            inst.oc= SC_Opcodes.CUBE;
            }
          inst= caller= inst.caller;
          break;
          }
        case SC_Opcodes.DUMP:{
          caller= inst;
          inst.oc= SC_Opcodes.DUMP_BACK;
          console.log('DUMP at EOI before', inst.p);
          inst= inst.p;
          break;
          }
        case SC_Opcodes.DUMP_BACK:{
          inst.oc= SC_Opcodes.DUMP;
          console.log('DUMP at EOI after', inst.p);
          inst= caller= inst.caller;
          break;
          }
        default:{ throw new Error("eoi: undefined opcode "
                       +SC_Opcodes.toString(inst.oc))
                       ;
          console.trace();
          }
        }
      }
    }
, reset: function(inst){
    var caller=act_exit;
    while(true){
RST:  switch(inst.oc){
        case SC_Opcodes._EXIT:{
          return;
          }
        case SC_Opcodes.REL_JUMP:
        case SC_Opcodes.REPEAT_BURST_FOREVER:
        case SC_Opcodes.REPEAT_FOREVER:{
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_BURST_FOREVER_NEXT:
        case SC_Opcodes.REPEAT_BURST_FOREVER_STOP:{
          inst.oc= SC_Opcodes.REPEAT_BURST_FOREVER;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
          inst.oc= SC_Opcodes.REPEAT_FOREVER;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_LATE_N_TIMES_INIT:
        case SC_Opcodes.REPEAT_LATE_N_TIMES:
        case SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER:
        case SC_Opcodes.REPEAT_LATE_N_TIMES_BUT_FOREVER_TO_STOP:
        case SC_Opcodes.REPEAT_LATE_N_TIMES_TO_STOP:{
          inst.oc= SC_Opcodes.REPEAT_LATE_N_TIMES_INIT;
          inst= caller;
          break;
          }
        case SC_Opcodes.REPEAT_N_TIMES_INIT:
        case SC_Opcodes.REPEAT_N_TIMES:
        case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER:
        case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER_TO_STOP:
        case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
          inst.oc= SC_Opcodes.REPEAT_N_TIMES_INIT;
          inst= caller;
          break;
          }
        case SC_Opcodes.IF_REPEAT_INIT:{
          inst= caller;
          break;
          }
        case SC_Opcodes.IF_REPEAT_TO_STOP:
        case SC_Opcodes.IF_REPEAT:{
          inst.oc=SC_Opcodes.IF_REPEAT_INIT;
          inst=caller;
          break;
          }
        case SC_Opcodes.ACTION_INLINE:
        case SC_Opcodes.ACTION:{
          inst=caller;
          break;
          }
        case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_CONTROLED:
        case SC_Opcodes.ACTION_N_TIMES_INLINE_BUT_FOREVER_HALTED:
        case SC_Opcodes.ACTION_N_TIMES_INIT_INLINE:
        case SC_Opcodes.ACTION_N_TIMES_INLINE:{
          inst.oc=SC_Opcodes.ACTION_N_TIMES_INIT_INLINE;
          inst=caller;
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
          inst.oc=SC_Opcodes.CUBE_ACTION_FOREVER;
          this.removeFromPermanentCube(inst)
          }
        case SC_Opcodes.SEQ_INIT:
        case SC_Opcodes.TEST:
        case SC_Opcodes.CUBE_ACTION_FOREVER_CONTROLED:
        case SC_Opcodes.CUBE_ACTION_FOREVER:{
          inst= caller;
          break;
          }
        case SC_Opcodes.SEQ:{
          inst.oc=SC_Opcodes.SEQ;
          const len=inst.seqElements.length;
          for(var i= 0; i<len; i++){
            this.reset(inst.seqElements[i]);
            }
          inst.idx= 0;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_BURST_STOPPED:
        case SC_Opcodes.PAUSE_BURST_DONE:{
          inst.oc= SC_Opcodes.PAUSE_BURST;
          }
        case SC_Opcodes.PAUSE_BURST:{
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_UNTIL_DONE:{
          inst.oc= SC_Opcodes.PAUSE_UNTIL;
          }
        case SC_Opcodes.SEQ_ENDED:
        case SC_Opcodes.HALT:
        case SC_Opcodes.PAUSE_UNTIL:{
          inst= caller;
          break;
          }
        case SC_Opcodes.PAUSE_INLINE:
        case SC_Opcodes.PAUSE:{
          inst= caller;
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
        case SC_Opcodes.RESET_ON:
        case SC_Opcodes.RESET_ON_OEOI:
        case SC_Opcodes.RESET_ON_WEOI:
        case SC_Opcodes.RESET_ON_WAIT:{
          inst.resetCaller=caller;
          caller=inst;
          inst.oc=SC_Opcodes.RESET_ON_BACK;
          inst=inst.prog;
          break;
          }
        case SC_Opcodes.RESET_ON_BACK:{
          inst.config.unregister(inst);
          inst.oc=SC_Opcodes.RESET_ON_INIT;
          caller=inst.resetCaller;
          }
        case SC_Opcodes.KILL_SUSP_INIT:
        case SC_Opcodes.RESET_ON_INIT:{
          inst=caller;
          break;
          }
        case SC_Opcodes.KILL_SUSP_REGISTERED:
        case SC_Opcodes.KILL_WEOI:
        case SC_Opcodes.KILL_OEOI:
        case SC_Opcodes.KILL_STOP:
        case SC_Opcodes.KILL_WAIT:
        case SC_Opcodes.KILL_HALT:{
          inst.resetCaller=caller;
          caller=inst;
          inst.oc=SC_Opcodes.KILL_BACK;
          inst=inst.p;
          break;
          }
        case SC_Opcodes.KILL_BACK:{
          inst.c.unregister(inst);
          caller=inst.resetCaller;
          }
        case SC_Opcodes.KILLED:{
          inst.oc=SC_Opcodes.KILL_SUSP;
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
        case SC_Opcodes.LOG:
        case SC_Opcodes.SEND_ONE:
        case SC_Opcodes.SEND_FOREVER:{
          inst = caller;
          break;
          }
        case SC_Opcodes.PAR_DYN_TO_REGISTER:
        case SC_Opcodes.PAR_DYN_FORCE:
        case SC_Opcodes.PAR_DYN:{
          inst.resetCaller=caller;
          while(! inst.suspended.isEmpty()){
            inst.suspended.pop();
            }
          while(! inst.waittingEOI.isEmpty()){
            inst.waittingEOI.pop();
            }
          while(! inst.stopped.isEmpty()){
            inst.stopped.pop();
            }
          while(! inst.waitting.isEmpty()){
            inst.waitting.pop();
            }
          while(! inst.halted.isEmpty()){
            inst.halted.pop();
            }
          inst.oc=SC_Opcodes.PAR_DYN_FIRE;
          caller=inst;
          inst.tmp_idx=0;
          }
        case SC_Opcodes.PAR_DYN_FIRE:{
          inst.tmp = inst.originalBranches[inst.tmp_idx++];
          if(null != inst.tmp){
            inst.tmp.flag = SC_IState.SUSP;
            inst = inst.tmp.prg;
            break;
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
          inst.resetCaller=caller;
          inst.oc=SC_Opcodes.PAR_FIRE;
          caller=inst;
          }
        case SC_Opcodes.PAR_FIRE:{
          inst.tmp = inst.suspended.pop();
          if(null != inst.tmp){
            inst = inst.tmp.prg;
            break;
            }
          inst.tmp = inst.waittingEOI.pop();
          if(null != inst.tmp){
            inst.tmp.flag = SC_IState.SUSP;
            inst = inst.tmp.prg;
            break;
            }
          inst.tmp = inst.stopped.pop();
          if(null != inst.tmp){
            inst.tmp.flag = SC_IState.SUSP;
            inst = inst.tmp.prg;
            break;
            }
          inst.tmp = inst.waitting.pop();
          if(null != inst.tmp){
            inst.tmp.flag = SC_IState.SUSP;
            inst = inst.tmp.prg;
            break;
            }
          inst.tmp = inst.halted.pop();
          if(null != inst.tmp){
            inst.tmp.flag = SC_IState.SUSP;
            inst = inst.tmp.prg;
            break;
            }
          var tmp = inst.terminated.pop();
          while(null != tmp){
            tmp.flag = SC_IState.SUSP;
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
          inst.resetCaller= caller;
          caller= inst;
          inst.oc= SC_Opcodes.MATCH_BACK;
          inst= inst.choice;
          break;
          }
        case SC_Opcodes.MATCH_BACK:{
          caller= inst.resetCaller;
          inst.choice= null;
          inst.oc= SC_Opcodes.MATCH;
          }
        case SC_Opcodes.MATCH:{
          inst= caller;
          break;
          }
        case SC_Opcodes.CUBE_HALT:
        case SC_Opcodes.CUBE_WAIT:
        case SC_Opcodes.CUBE_STOP:
        case SC_Opcodes.CUBE:{
          inst.killEvt.unregister(this);
          inst.resetCaller = caller;
          caller= inst;
          inst.oc= SC_Opcodes.CUBE_BACK;
          this.lastWills.push(inst.lastWill.bind(inst.o));
          inst= inst.p;
          break;
          }
        case SC_Opcodes.CUBE_BACK:{
          inst.oc= SC_Opcodes.CUBE_INIT;
          inst= caller= inst.resetCaller;
          break;
          }
        case SC_Opcodes.CUBE_TERM:
        case SC_Opcodes.CUBE_INIT:{
          inst.oc= SC_Opcodes.CUBE_INIT;
          }
        case SC_Opcodes.CUBE_ZERO:{
          inst= caller;
          break;
          }
        case SC_Opcodes.DUMP:{
          inst.resetCaller= caller;
          caller= inst;
          inst.oc= SC_Opcodes.DUMP_BACK;
          console.log('DUMP reset before', inst.p);
          inst= inst.p;
          break;
          }
        case SC_Opcodes.DUMP_BACK:{
          inst.oc= SC_Opcodes.DUMP;
          console.log('DUMP reset after', inst.p);
          inst= caller= inst.resetCaller;
          break;
          }
        case SC_Opcodes.CELL:{
          inst= caller;
          break;
          }
        case SC_Opcodes.CUBE_CELL:{
          inst.resetCaller= caller;
          caller= inst;
          inst.oc= SC_Opcodes.CUBE_CELL_BACK;
          inst= inst.cell;
          break;
          }
        case SC_Opcodes.CUBE_CELL_BACK:{
          inst.oc= SC_Opcodes.CUBE_CELL;
          inst= caller= inst.resetCaller;
          break;
          }
        default:{ throw new Error("reset : undefined opcode "
                        + SC_Opcodes.toString(inst.oc));
          console.trace();
          }
        }
      }
    }
, generateValues: function(){
    var inst= this.prg;
    var caller= act_exit;
    while(true){
GRV:  switch(inst.oc){
        case SC_Opcodes._EXIT:{
          return;
          }
        case SC_Opcodes.GENERATE_BURST_INIT:
        case SC_Opcodes.GENERATE_BURST_TO_STOP:
        case SC_Opcodes.GENERATE_BURST_INLINE__TO_STOP:
        case SC_Opcodes.GENERATE_BURST_INLINE_INIT:
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
            inst.evt.generateValues(this, inst.val);
            inst= caller;
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
          inst.evt.generateValues(this, inst.val.val());
          inst= caller;
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
          inst.evt.generateValues(this, inst.val(this));
          inst= caller;
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
          inst.evt.generateValues(this, inst.val.getExposeReader(this));
          inst= caller;
          break;
          }
        case SC_Opcodes.GENERATE_FOREVER_LATE_VAL:{
          if(inst.val instanceof SC_Instruction
              && inst.val.oc == SC_Opcodes.CELL){
            inst.evt.generateValues(this, inst.val.val());
            }
          else if("function"==typeof(inst.val)){
            inst.evt.generateValues(this, inst.val(this));
            }
          else if(inst.val instanceof SC_CubeExposedState){
            inst.evt.generateValues(this, inst.val.exposedState(this));
            }
          else{
            inst.evt.generateValues(this, inst.val);
            }
          inst= caller;
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
          if(inst.val instanceof SC_Instruction
              && inst.val.oc==SC_Opcodes.CELL){
            inst.evt.generateValues(this, inst.val.val());
            }
          else if("function"==typeof(inst.val)){
            inst.evt.generateValues(this, inst.val(this));
            }
          else if(inst.val instanceof SC_CubeExposedState){
            inst.evt.generateValues(this, inst.val.exposedState(this));
            }
          else{
            inst.evt.generateValues(this, inst.val);
            }
          inst.val= null;
          inst= caller;
          break;
          }
        case SC_Opcodes.PAR_DYN_FORCE:
        case SC_Opcodes.PAR_FORCE:
        case SC_Opcodes.PAR_DYN_TO_REGISTER:
        case SC_Opcodes.PAR_DYN:
        case SC_Opcodes.PAR:{
          inst.gen_caller= caller;
          inst.gen_type= inst.oc;
          inst.oc= SC_Opcodes.GEN_VAL;
          inst.prodIdx= 0;
          }
        case SC_Opcodes.GEN_VAL:{
          if(inst.prodIdx<inst.prodBranches.length){
            const pb= inst.prodBranches[inst.prodIdx];
            if(pb.genIdx<pb.emitters.length){
              const em= pb.emitters[pb.genIdx];
              caller= inst;
              inst= em;
              pb.genIdx++;
              break;
              }
	    pb.emitters= [];
            pb.genIdx= 0;
            inst.prodIdx++;
            break;
            }
          inst.oc= inst.gen_type;
          inst= inst.gen_caller;
          break;
          }
        default:{ throw new Error("generateValues(): undefined opcode "
                       +SC_Opcodes.toString(inst.oc)
                       );
          console.trace();
          }
        }
      }
    }
  };
var nextID= 0;
const SC= {
    nop: function(){
      return this.nothing();
      }
  , pauseBurst: function(n){
      return new SC_PauseBurst(_SC.aNum_(n));
      }
  , pauseBurstUntil: function(cond){
          if(undefined==cond){
            throw new Error('pauseBurstUntil(): invalid condition: '+cond);
            }
          if(false===cond){
            console.error("pauseBurstUntil(): pauseForever for a false const.");
            return this.pauseForever();
            }
          if(true===cond){
            console.error("pauseBurstUntil(): single pause for a true const.");
            return this.pauseBurst();
            }
          if("function"!=typeof(cond) && !(cond instanceof SC_LateBinding)){
            throw new Error(
                         'pauseBurstUntil(): invalid condition implementation: '
                        +cond);
            }
          return new SC_PauseBurstUntil(cond);
          }
  , purge: function(prg){
      return (prg && prg.isAnSCProgram)?prg:this.nothing();
      }
  , repeatBurstForever: function(){
        Array.prototype.unshift.call(arguments, this.forever);
        return this.repeatBurst.apply(this, arguments);
        }
  , repeatBurst: function(n){
        if(0===n){
          return this.nothing();
          }
        const prgs= [];
        var jump= 1;
        prgs[0]= new SC_RepeatBurstPoint(_SC.aNum_(n));
        for(var i= 1 ; i<arguments.length; i++){
          const p= arguments[i];
          if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
          prgs.push(p);
          jump+= (p instanceof SC_Seq)?p.seqElements.length:1;
          }
        const end= new SC_RelativeJump(-jump);
        prgs.push(end);
        prgs[0].end= jump+1;
        const t= new SC_Seq(prgs);
        return t;
        }
  , whileRepeatBurst: function(c){
        const prgs= [];
        var jump= 1;
        if('function'!=typeof(c) && true!==c && false!==c
           && ("object"!=typeof(c.t) || 'string'!=typeof(c.f))
           && !(c instanceof SC_LateBinding)){
          throw new Error("invalid condition: "+c);
          }
        prgs[0]= new SC_IfRepeatBurstPoint(_SC.b_(c));
        for(var i= 1; i<arguments.length; i++){
          const p= arguments[i];
          if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
          prgs.push(p);
          jump+= (p instanceof SC_Seq)?p.seqElements.length:1;
          }
        const end= new SC_RelativeJump(-jump);
        prgs[prgs.length]= end;
        prgs[0].end= jump+1;
        const t= this.seq.apply(this, prgs);
        return t;
        }
  , generateBurst: function(p){ 
        const params= SC.$({});
        if(p && p.evt){
          if(("string"==typeof(p.evt) && ""!=p.evt)
            && !(p.evt instanceof SC_LateBinding)
            && !(p.evt instanceof SC_EventId)
            && !("object"==typeof(p.times) && "object"==typeof(p.t)
                                          && "object"==typeof(p.f))
            && "function"!=typeof(p.evt)){
            throw new Error("invalid param event: "+p.evt);
            }
          params.evt= _SC.b_(p.evt);
          if(undefined!==p.val){
            params.val= p.val;
            if(undefined!==p.wrap){
              console.warn("WARNINIG: wrap is set but also val in parameters of"
                          +" generateBurst => val has stronggest precedence.");
              }
            }
          else if(p.wrap instanceof SC_LateBinding
            || p.wrap instanceof SC_CubeExposedState
            || p.wrap instanceof SC_CubeCell
            || p.wrap instanceof SC_Cell
            || (p.wrap instanceof SC_Instruction
                && (p.wrap.oc==SC_Opcodes.CELL
                 || p.wrap.oc==SC_Opcodes.CELL_INIT))
            || "function"==typeof(p.wrap)
            || ("object"==typeof(p.times) && "object"==typeof(p.t)
                                          && "object"==typeof(p.f))
            || ("string"==typeof(p.wrap) && ""!=p.wrap)){
            params.wrap= _SC.b_(p.wrap);
            }
          if((p.times && !isNaN(parseInt(p.times)))
            || ("string"==typeof(p.times) && ""!=p.times)
            || "function"==typeof(p.times)
            || ("object"==typeof(p.times) && "object"==typeof(p.t)
                                          && "object"==typeof(p.f))
            || p.times instanceof SC_LateBinding){
            params.times= _SC.b_(p.times);
            }
          }
        else{
          throw new Error("invalid parameters: "+p);
          }
        return new SC_GenerateBurst(params);
        }
  , repeatForever: function(n){
      Array.prototype.unshift.call(arguments, this.forever);
      return this.repeat.apply(this, arguments);
      }
  , matches: function(){
      const args=[] 
      args.push(arguments[0]);
      for(var b of arguments[1]){
        args.push(b);
        }
      return this.match.apply(this, args);
      }
  , cubeAction: function(params){
      if(undefined == params){
        throw new Error("no params for cubeAction");
        }
      if(undefined==params.fun){
        throw new Error("no fun for cubeAction: "+params.fun
                      +" fun type "+typeof(params.fun));
        }
      params.fun= _SC.b_(params.fun, { vf: true })
      return new SC_CubeAction(params);
      }
  , cubeCell: function(c){
      return new SC_CubeCell(c);
      }
  , log: function(msg){
      return new SC_Log(msg);
      }
  , _: function(tgt, fun){
      return (tgt[fun]).bind(tgt);
      }
  , _my: function(name, tp){
      if(name && ("string"==typeof(name)) && (""!=name)){
        if(tp && "string"==typeof(tp) && ""!=tp){
          return this.__(name, { tp: tp });
          }
        return this.__(name);
        }
      throw new Error("invalid object property name "+arguments);
      }
  , my: function(name){
      const p= [];
      for(var i= 1; i<arguments.length; i++){
        p.push(arguments[i]);
        }
      if(undefined!=name && "string"==typeof(name) && ""!=name){
        if(0==p.length){
          return this.__(name);
          }
        return this.__(name, { p: p });
        }
      throw new Error("invalid object property name "+arguments);
      }
    };
  Object.defineProperty(SC, "sc_build"
                          , { value: 780
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "sc_version"
                          , { value: "5.0.780.alpha"
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "writeInConsole"
                          , { value: console.log.bind(console)
                            , writable: false
                              }
                          );
 Object.defineProperty(SC, "externalEvent"
                          , { value: function(pElt_target, ps_DomEvt, times) {
                                if(undefined===times || isNaN(times)){
                                  times=-1;
                                  }
                                const pSensor= SC.sensor({
                                        name: Elt_target+'.'+ps_DomEvt
                                      , dom_targets: [ { target: pElt_target
                                          , evt: ps_DomEvt } ]
                                      , times: parseInt(times)
                                      , owned: true
                                        });
                                return pSensor
                                }
                            , writable: false
                              }
                          );
  var animator= null;
  Object.defineProperty(SC, "me"
                          , { value: new SC_CubeExposedState()
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "animSensor"
                          , { value: function(){
                                if(animator){
                                  return animator;
                                  }
                                const params={ name: "animator"
                                  , isPower: true };
                                return animator=new SC_SensorId(params);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "evt"
                          , { value: function(name, params){
                                if("string"!=typeof(name)){
                                  name="no_name";
                                  }
                                if(undefined!=params){
                                  params.name=name;
                                  }
                                else{
                                  params={ name: name };
                                  }
                                return new SC_EventId(params);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "sampled"
                          , { value: function(name, params){
                                if(undefined!=params){
                                  params.name=name;
                                  }
                                else{
                                  params={ name: name };
                                  }
                                return new SC_SampledId(params);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "sensor"
                          , { value: function(name, params){
                                const p= {};
                                if(undefined==name){
                                  throw new Error("Invalid parameters: "
                                                                    +arguments);
                                  }
                                else if("string"==typeof(name)){
                                  p.name= name;
                                  }
                                else if(name.name){
                                  params= name;
                                  }
                                if(params){
                                  p.isPower= params.isPower;
                                  p.n= params.n;
                                  p.delay= params.delay;
                                  p.async= params.async;
                                  p.dom_targets= params.dom_targets;
                                  p.times= params.times;
                                  }
                                return new SC_SensorId(p);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "processor"
                          , { enumerable: false
                            , value: function(p){
                                if(undefined==p || "object"!=typeof(p)){
                                  p={};
                                  }
                                p.name="processor";
                                p.isPower=true;
                                delete(p.delay);
                                if(undefined==p.n || 0>p.n){
                                  p.n=1;
                                  }
                                return new SC_SensorId(p);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "periodic"
                          , { enumerable: false
                            , value: function(p){
                                if(undefined==p || "object"!=typeof(p)){
                                  throw new Error(
                                             "SC.periodic(): invalid param "+p);
                                  }
                                if(isNaN(p.delay) || p.delay<=0){
                                  throw new Error(
                                       "SC.periodic(): invalid delay "+p.delay);
                                  }
                                p.name="periodic";
                                p.isPower=true;
                                return new SC_SensorId(p);
                                }
                            , writable: false
                              }
                          );
  var newID= 0;
  Object.defineProperty(SC, "newID"
  , { 
      value: function(){
        return newID++;
        }
      }
    );
  Object.defineProperty(SC, "clock"
  , { 
      value: function(p){
        if(undefined==p){
          p={};
          }
        if(undefined==p.name){
          p.name=(nextID++)+"_unanmed_machine"
          }
        else if("string"!=typeof(p.name)){
          throw new Error("invalid name : "+p.name);
          }
 if(p.init && !p.init.isAnSCProgram){
          throw new Error("invalid initial program : "+p.init);
          }
        if(p.fun_stdout && "function"!=typeof(p.fun_stdout)){
          throw new Error("invalid stdout function : "+p.fun_stdout);
          }
        if(p.fun_stderr && "function"!=typeof(p.fun_stderr)){
          throw new Error("invalid stderr function : "+p.fun_stderr);
          }
        if(p.fun_prompt && "function"!=typeof(p.fun_prompt)){
          throw new Error("invalid prompt function : "+p.fun_prompt);
          }
        const ownMachine=new SC_Machine(p);
        var res={};
        res.getIPS=ownMachine.getIPS.bind(ownMachine);
        res.getInstantNumber=ownMachine.getInstantNumber.bind(ownMachine);
        res.getTopLevelParallelBranchesNumber
           =ownMachine.getTopLevelParallelBranchesNumber.bind(ownMachine);
        res.setStdOut= ownMachine.setStdOut.bind(ownMachine);
        res.setDumpTraceFun= ownMachine.setDumpTraceFun.bind(ownMachine);
        res.enablePrompt=ownMachine.enablePrompt.bind(ownMachine);
        if("function"==typeof(p.dumpTraceFun)){
          ownMachine.dumpTraceFun=p.dumpTraceFun;
          }
        res.addEntry=function(evtName, value){
          if(evtName instanceof SC_EventId){
            this.addEntry(evtName, value);
            }
          else{
            throw new Error("invalid event Id : "+evtName);
            }
          }.bind(ownMachine);
        res.addProgram=function(prg){
          if(prg.isAnSCProgram){
            this.addProgram(prg);
            }
          else{
            throw new Error("invalid program : "+prg);
            }
          }.bind(ownMachine);
        const reaction= function(){
          do{
            this.react();
            if(this.ended){
              return true;
              }
            }
          while(this.toContinue>0);
          return false;
          }.bind(ownMachine);
        const registrations= {};
        res.bindTo= function(ream, registrations, sensor){
          if(sensor instanceof SC_SensorId){
            if(registrations[sensor.iids]){
              return;
              }
            registrations[sensor.iids]= sensor;
            SC_Global_Manager.connect(sensor, ream);
            }
          else{
            throw new Error("invalid sensor to be bound with");
            }
          }.bind(res, reaction, registrations);
        res.disconnectFrom=function(ream, registrations, sensor){
          if(undefined==registrations[sensor.iids]){
            return;
            }
          delete(registrations[sensor.iids]);
          SC_Global_Manager.disconnect(sensor, ream);
          }.bind(res, reaction, registrations);
        Object.defineProperty(res, "isSCClock"
                                , { value: true
                                  , writable: false
                                    }
                                );
        return res;
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "actionOn"
  , { value: function(c, fun, deffun, times){
        if(undefined==c){
          throw new Error("invalid parameters : "+arguments);
          }
        const prm={};
        if(1==arguments.length && "object"==typeof(c)){
          if(undefined==c.config){
            throw new Error("invalid parameters : "+c);
            }
          prm.c= c.config;
          if(undefined==c.fun && undefined== c.deffun){
            throw new Error("invalid parameters : "+c);
            }
          prm.fun= c.fun;
          prm.deffun= c.deffun;
          prm.times= c.times;
          }
        else{
          if(undefined==fun && undefined== deffun){
            throw new Error("invalid parameters : fun="+fun+" deffun="+deffun);
            }
          prm.c= c;
          prm.fun= fun;
          prm.deffun= deffun;
          prm.times= times;
          }
        return new SC_ActionOnEvent(_SC.b_(prm.c), _SC.b_(prm.fun, { vf: true })
                                  , _SC.b_(prm.deffun, { vf: true })
                                  , _SC.b_(prm.times));
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "pauseForever"
  , { value: function(name, params){
        return SC_PauseForEver;
        }
    , writable: false
    , enumerable: true
      }
    );
  Object.defineProperty(SC, "nothing"
  , { value: function(name, params){
        return SC_Nothing;
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "write"
  , { value: function(msg){
        if(undefined===msg){
          throw new Error("Invalid message: "+msg);
          }
        if(false==msg._){
          msg= msg.toString();
          }
        return new SC_GenerateOne(SC_WRITE_ID, msg);
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "trace"
  , { value: function(msg){
        if("string"!=typeof(msg)){
          throw new Error("Invalid message: "+msg);
          }
        return new SC_GenerateOne(null, msg);
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "pause"
  , { value: function(n){
        return new SC_Pause(_SC.b_(n));
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "pauseUntil"
  , { value: function(cond){
          if(undefined==cond){
            throw new Error('pauseUntil(): invalid condition: '+cond);
            }
          if(false===cond){
            console.error("pauseUntil(): pauseForever for a false const.");
            return this.pauseForever();
            }
          if(true===cond){
            console.error("pauseUntil(): single pause for a true const.");
            return this.pause();
            }
          if("function"!=typeof(cond) && !(cond instanceof SC_LateBinding)){
            throw new Error('pauseUntil(): invalid condition implementation: '
                           +cond);
            }
          return new SC_PauseUntil(cond);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "pauseRT"
  , { value: function(n){
        if(_SC.isANum(n)){
          return new SC_PauseRT(_SC.b_(n));
          }
        throw new Error("invalid duration paramter: "+n);
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "send"
  , { value: function(m, evt, v){
          if(m && m.isSCClock){
            if(evt && evt instanceof SC_EventId){
              return SC.action(function(evt, v){
                this.addEntry(evt, v);
                }.bind(m, evt, v));
              }
            throw new Error("target event is incorrect "+evt);
            }
          throw new Error("target clock is not set: "+m);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "next"
  , { value: function(count){
        if(undefined==count){
          count= 1;
          }
        const num= parseInt(count);
        if(isNaN(num)){
          if('function'==typeof(count)){
            return new SC_Next(count);
            }
          if('object'==typeof(count)
             && "object"==typeof(count.f) && "string"==typeof(count.t)){
            return new SC_Next(count);
            }
          throw new Error("count of invalid type");
          }
        if(num<=0|| num>1000000){
          throw new Error(
                         "count paramater must be an int between ]0, 1000000[");
          }
        return new SC_Next(num);
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "cube"
  , { value: function(o, p, extensions){
          const params= {};
          if(undefined==extensions || "object"!=typeof(extensions)){
            extensions= {};
            }
          if(undefined==o){
            throw new Error("undefined object for cube");
            }
          extensions.root= o;
          if(undefined==p || !p.isAnSCProgram){
            throw new Error("undefined program for cube: "+p);
            }
          extensions.prg= p;
          return this.cubify(extensions);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "cubify"
  , { value: function(params){
          if(undefined==params){
            throw new Error("cubify no params provided");
            }
          if(undefined==params.prg || !params.prg.isAnSCProgram){
            throw new Error("cubify no program provided");
            }
          if(undefined==params.root){
            params.root= {};
            }
          const funs= params.methods;
          if(funs && Array.isArray(funs)){
            for(var i of funs){
              if("string"!=typeof(i.name)){
                throw new Error("cubify fun name "+i.name+" not valid");
                }
              if("function"!=typeof(i.fun)){
                throw new Error("cubify fun "+i.fun+" not valid");
                }
              params.root[i.name]= i.fun;
              }
            }
          const meths= params.actions;
          if(meths && typeof(meths)=="object"){
            for(var met of Object.keys(meths)){
              if(typeof(meths[met])!="function"){
                throw new Error("cubify fun "+meths[met]+" not valid");
                }
              params.root[met]=meths[met];
              }
            }
          if(params.state && !params.expose){
            params.expose= params.state;
            }
          const cells= params.expose;
          if(cells){
            if(!params.life){
              params.life = {};
              }
            params.life.swapList = [];
            for(var i of cells){
              if(typeof(i.id) != "string"){
                throw new Error("cubify state name "+i.id+" not valid in "
                                                                        +cells);
                }
              switch(i.type){
                case 'fun':{
                  if(typeof(params.root[i.id]) != "function"){
                    throw new Error("cubify state inconsistent type of field "
                                                      +i.id+" not a function.");
                    }
                  break;
                  }
                }
              params.life.swapList.push(i);
              }
            }
          return new SC_Cube(params.root, params.prg, params.life);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "toCell"
                          , { value: function(p){
    if(!p || "object"!=typeof(p.target) || !p.name){
      throw new Error("invalid parameters");
      }
    var t= p.target;
    if(Array.isArray(p.sub)){ 
      for(var nd of p.sub){
        t=t[nd];
        if(undefined===t){
          throw new Error("sub field doesn't seems to exist: "+p.sub);
          }
        }
      }
    else{
      t=(undefined==p.sub)?p.target:p.target[p.sub];
      }
    if(undefined===t){
      throw new Error("sub field doesn't seems to exist: "+p.sub);
      }
    p.store=("object"==typeof(p.store))?p.store:p.target;
    const funn="_scc_"+p.name;
    if(undefined!=p.fun){
      p.store[funn]=p.fun.bind(p.target);
      }
    if("function"!=typeof(p.store[funn])){
      throw new Error("no affectator for "+p.name+" cell");
      }
    if("function"==typeof(p.store[funn])){
      p.store[funn]= p.store[funn].bind(p.target);
      }
    const celln="$_scc_"+p.name;
    p.store[celln]=SC.cell({ target: t
                       , field: p.name
                       , sideEffect: p.store[funn]
                       , eventList: p.el
                         });
    }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "toCellFun"
  , { value: function(tgt, evt, trace){
        return function(e, trace, val, re){
          const v= re.getValuesOf(e);
          if(trace){
            console.log("toCellFun", this, re, evt)
          }
          if(v){
            var newVal=v[0];
            if(newVal instanceof SC_ValueWrapper){
              newVal=newVal.getVal();
              }
            return newVal;
            }
          return val;
          }.bind(tgt, evt, trace);
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "addCell"
  , { value: function(tgt, name, init, el, fun){
        const params= {};
        if(undefined===tgt || null===tgt){
          throw new Error("No target specified in "+arguments);
          }
        if(tgt instanceof SC_Cube){
          tgt= tgt.o;
          }
        if(undefined==name || "string"!=typeof(name) || ""==name){
          throw new Error("Invalid field name "+arguments);
          }
        if(tgt[name]){
          throw new Error("Already existing name "+ name);
          }
        const fun_name= "_scc_"+name;
        if(undefined==fun && undefined==tgt[fun_name]){
          throw new Error("undefined affectatir on "+tgt+" or "+arguments);
          }
        if(fun){
          tgt[fun_name]= fun;
          }
        params.init= init;
        params.sideEffect= SC._(tgt, fun_name);
        params.eventList= el;
        params.id= name;
        const cell= tgt["$_scc_"+name]= SC.cell(params);
        Object.defineProperty(tgt, name, { get: function(init){
          if(undefined==this.val){
            console.log(" not yet defined ");
            debuger;
            }
          return this.val();
          }.bind(cell, params.init)});
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "filter"
  , { value: function(s,e,f,t,n){
        if(undefined==s || undefined==e || undefined== f){
          throw new Error("arguments not specified: "+arguments)
          }
        if(!_SC.isStrictSensor(s)){
          throw new Error("invalid sensor specified: "+arguments)
          }
        if(!_SC.isStrictEvent(e)){
          throw new Error("invalid filtered event specified: "+arguments)
          }
        if(!_SC.isFun(f)){
          throw new Error("invalid filter function specified: "+arguments)
          }
        if(t && isNaN(t)){
          throw new Error("invalid times to iterate specified: "+arguments)
          }
        if(n && !_SC.isStrictEvent(n)){
          throw new Error("invalid absence evet specified: "+arguments)
          }
        return new SC_Filter(_SC.b_(s)
                           , _SC.b_(e)
                           , _SC.b_(f, { vf: true })
                           , _SC.b_(t, { vf: true })
                           , _SC.b_(n));
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "addToSelf"
  , { value: function(p){
          if(p && p.isAnSCProgram){    
            return this.generate(_SC.b_("SC_cubeAddBehaviorEvt"), p)
            }
          throw new Error("Invalid parameter: "+p);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "killSelf"
  , { value: function(p){
          return this.generate(_SC.b_("SC_cubeKillEvt"))
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "cell"
  , { value: function(p){
          if(undefined==p){
            throw new Error("undefined params for cell");
            }
          const params= {};
          params.target= p.target;
          params.field= p.field;
          params.init= p.init;
          params.sideEffect= p.sideEffect;
          Object.defineProperty(params, "_sc_targeted", {
              get: function(){ return ("object"==typeof(this.target)); }
              });
          if(params._sc_targeted
            && ("string"!=typeof(params.field)
              || undefined===params.target[params.field])){
             throw new Error("field not specified on target ("
                                                             +params.field+")");
            }
          return new SC_Cell(params);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "kill"
  , { value: function(c, p, h){
          _SC.checkConfig(c);
          const prgs= [ new SC_Kill(_SC.b_(c), p, 1) ];
          if(h && h!=SC_Nothing){
            prgs.push(h);
            if(h instanceof SC_Seq){
              prgs[0].end+= h.seqElements.length;
              }
            else{
              prgs[0].end+= 1;
              }
            }
          return new SC_Seq(prgs);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "whileRepeat"
  , { value: function(c){
          const prgs= [];
          var jump= 1;
          if('function'!=typeof(c) && true!==c && false!==c
             && ("object"!=typeof(c.t) || 'string'!=typeof(c.f))
             && !(c instanceof SC_LateBinding)){
            throw new Error("invalid condition: "+c);
            }
          prgs[0]= new SC_IfRepeatPoint(_SC.b_(c));
          for(var i= 1; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            jump+= (p instanceof SC_Seq)?p.seqElements.length:1;
            }
          const end=new SC_RelativeJump(-jump);
          prgs[prgs.length]= end;
          prgs[0].end= jump+1;
          const t= this.seq.apply(this, prgs);
          return t;
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "repeat"
  , { value: function(n){
          if(0===n){
            return this.nothing();
            }
          const prgs= [];
          var jump= 1;
          prgs[0]= new SC_RepeatPoint(_SC.aNum_(n));
          for(var i= 1 ; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            jump+= (p instanceof SC_Seq)?p.seqElements.length:1;
            }
          const end= new SC_RelativeJump(-jump);
          prgs.push(end);
          prgs[0].end= jump+1;
          const t= new SC_Seq(prgs);
          return t;
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "repeatLate"
  , { value: function(n){
          if(0===n){
            return this.nothing();
            }
          const prgs= [];
          var jump= 1;
          prgs[0]= new SC_RepeatPointLate(_SC.aNum_(n));
          for(var i= 1 ; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            jump+= (p instanceof SC_Seq)?p.seqElements.length:1;
            }
          const end= new SC_RelativeJump(-jump);
          prgs.push(end);
          prgs[0].end= jump+1;
          const t= new SC_Seq(prgs);
          return t;
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "resetOn"
  , { value: function(config){
          const prgs= [];
          if(_SC.isConfig(config)){
            for(var i= 1; i<arguments.length; i++){
              const p= arguments[i];
              if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
              prgs.push(p);
              }
            const t= this.seq.apply(this, prgs);
            return new SC_ResetOn(_SC.b_(config), t);
            }
          throw new Error("Invalid configuration: "+c);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "control"
  , { value: function(c){
          _SC.checkConfig(c);
          const prgs= [];
          for(var i= 1; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            }
          return new SC_Control(c, this.seq.apply(this, prgs));
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "when"
  , { value: function(c, t, e){
          _SC.checkConfig(c);
          const prgs= [new SC_When(c)];    
          var elsJ= 2;
          var end= 1;
          if(t && SC_Nothing!=t){
            prgs.push(t);
            elsJ+= (t instanceof SC_Seq)?t.seqElements.length:1;
            }
          prgs[0].elsB= elsJ;
          end+= (e instanceof SC_Seq)?e.seqElements.length
                            :((e && SC_Nothing!=e)?1:0);
          prgs.push(new SC_RelativeJump(end));
          if(e && SC_Nothing!=e){
            prgs.push(e);
            }
          return this.seq.apply(this, prgs);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "test"
  , { value: function(b, t, e){
          if(undefined==b
            || (true!==b && false!==b && "function"!=typeof(b)
                && "object"!=typeof(b) && "string"!=typeof(b))
            || ("string"==typeof(b) && ""==b)
            || ("object"==typeof(b.t) && "object"!=typeof(b.t)
                                      && "string"!=typeof(b.f)
                                      && !(b instanceof SC_LateBinding))
            ){
            throw new Error("invalid test condition: "+b);
            }
          const prgs= [new SC_Test(_SC.b_(b), t, e)];    
          var elsJ= 2;
          var end= 1;
          if(t && SC_Nothing!=t){
            prgs.push(t);
            elsJ+= (t instanceof SC_Seq)?t.seqElements.length:1;
            }
          prgs[0].elsB= elsJ;
          end+= (e instanceof SC_Seq)?e.seqElements.length
                            :((e && SC_Nothing!=e)?1:0);
          prgs.push(new SC_RelativeJump(end));
          if(e && SC_Nothing!=e){
            prgs.push(e);
            }
          return this.seq.apply(this, prgs);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "action"
  , { value: function(fun, times){
          if(undefined===fun){
            throw new Error("invalid function arg "+fun);
            }
          return new SC_Action(_SC.b_(fun, { vf: true }), _SC.b_(times));
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "await"
  , { value: function(config){
          if(!_SC.isConfig(config)){
            throw new Error("config not defined");
            }
          return new SC_Await(_SC.b_(config));
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "generate"
  , { value: function(evt, v, times){
          return new SC_Generate(_SC.checkStrictEvent(evt)
                                      , v, _SC.b_(times));
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "generateForever"
  , { value: function(evt, v){
          return new SC_GenerateForever(_SC.checkStrictEvent(evt), v);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "seq"
  , { value: function(){
          const prgs= [];
          for(var i= 0 ; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            }
          if(1==prgs.length){
            return prgs[0];
            }
          return new SC_Seq(prgs);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "par"
  , { value: function(){
          const prgs= [];
          for(var i= 0 ; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            }
          return new SC_Par(prgs);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "match"
  , { value: function(val){
          const prgs= [];
          if(undefined==val){
            throw new Error("undefined macth condition");
            }
          if(!val instanceof SC_LateBinding){
            switch(typeof(val)){
              case "object":{
                if(undefined==val.t || ("object"!=typeof(val.t)
                                        && "string"==typeof(val.f))){
                  throw new Error("invalid object math condition: "+val);
                  }
                }
              case "function":{
                break;
                }
              default:{
                throw new Error("invalid math condition: "+val);
                }
              }
            }
          for(var i= 1; i<arguments.length; i++){
            const a= arguments[i];
            if(("object"!=typeof(a)) || (!a.isAnSCProgram)){
              throw new Error("invalid programs in match "+arguments);
              }
            prgs.push(a);
            }
          return new SC_Match(_SC.b_(val), prgs);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "parex"
  , { value: function(evt){
          const prgs= [];
          for(var i= 1; i<arguments.length; i++){
            const p= arguments[i];
            if(undefined==p || p==SC_Nothing || !p.isAnSCProgram){ continue; }
            prgs.push(p);
            }
          return new SC_Par(prgs, evt);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "and"
  , { value: function(){
          const tmp= [];
          for(var i in arguments){
            const c= arguments[i];
            if(_SC.isConfig(c))
            tmp.push(_SC.b_(c));
            }
          return new SC_And(tmp);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "or"
  , { value: function(){
          const tmp= [];
          for(var i in arguments){
            const c= arguments[i];
            if(_SC.isConfig(c)){
              tmp.push(_SC.b_(c))
              };
            }
          return new SC_Or(tmp);
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "__"
  , { enumerable: false
    , value: function(name, paramObject){
          const args= [ undefined, name, paramObject ];
          return new (Function.prototype.bind.apply(SC_LateBinding, args));
          }
    , writable: false
      });
  Object.defineProperty(SC, "$"
  , { enumerable: false
    , value: function(params, check){
          return new SC_Parameters(params, check);
          }
    , writable: false
      });
  Object.defineProperty(SC, "NO_ACTION"
                          , { enumerable: false
                            , value: NO_FUN
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "traceExec"
  , { enumerable: false
    , value: function(){
          const prgs= [];
          for(var i in arguments){
            const c= arguments[i];
            if(c.isAnSCProgram){
              prgs.push(c);
              }
            else{
              console.warn(""+c+" is not a SugarCubes program ... ignored...");
              }
            }
          return new SC_Dump(this.seq.apply(this, prgs));
          }
    , writable: false
      }
    );
  Object.defineProperty(SC, "forever"
                          , { enumerable: false
                            , value: -1
                            , writable: false
                              }
                          );
  this.SC=SC;
  try{
    const loadModule=new XMLHttpRequest();
    var glob=this;
    Object.defineProperty(SC, "init"
    , { value: function(p={}){
          if(p.tools){
            const bd=p.tools.baseDir?p.tools.baseDir:"";
            loadModule.open("GET", bd+"SC_Tools.js", false);
            loadModule.send(null);
            if(200==loadModule.status || 0==loadModule.status){
              console.log("loading", bd+'SC_Tools.js');
              eval(loadModule.responseText);
              }
            if(p.tools.list){
              for(var url of p.tools.list){
                loadModule.open("GET", bd+'SC_Tools_'+url+'.js', false);
                loadModule.send(null);
                if(200==loadModule.status || 0==loadModule.status){
                  console.log("loading", bd+'SC_Tools_'+url+'.js');
                  eval(loadModule.responseText);
                  }
                }
              }
            }
          }
      , writable: false
        }
      );
    }
  catch(e){
    global.SC=SC;
    const fs=require('fs');
    function read(f) {
      return fs.readFileSync(f).toString();
      }
    function include(f) {
      eval.apply(glob, [read(f)]);
      }
    Object.defineProperty(global.SC, "init"
    , { value: function(p={}){
          if(p.tools){
            const bd= p.tools.baseDir?p.tools.baseDir:"./";
            global.glob= global;
            global.p= p;
            global.sc_global= global;
            include(bd+"SC_Tools.js");
            if(p.tools.list){
              for(var url of p.tools.list){
                include(bd+'SC_Tools_'+url+'.js');
                }
              }
            }
          }
      , writable: false
        }
      );
    }
  }).call(this, this);
