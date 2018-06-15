/*
 * SugarCubes.js
 * Author : Jean-Ferdy Susini
 * Created : 2/12/2014 9:23 PM
 * version : 5.0 alpha
 * implantation : 0.8.3
 * Copyright 2014-2017.
 */

;
var SC = (function(){

const VOID_NODE = {};

function NO_FUN(){}

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

/*
 * le binding présente différents cas de figure :
 * - la constante à la construction (cas le plus simple)
 *   ex : SC.repeat(10, ...)
 *                  ^^
 * - l'évaluation à la construction (une fonction évaluée, retourne la constante à utiliser)
 *   ex : SC.repeat(fun(), ...)
 *                  ^^^^^
 */

/*
 * SC_CubeBinding : permet de gérer l'accès aux ressources non définit à
 * l'écriture d'un programme.
 */
function SC_CubeBinding(name){
  if((undefined == name)||(typeof name != "string")||(name == "")){
    throw "invalid binding name "+name;
    }
  this.name = name;
  this.cube = null;
  this.args = null;
  }
SC_CubeBinding.prototype = {
  constructor: SC_CubeBinding
  , resolve : function(){
      if(null === this.cube){
        throw "cube is null or undefined !";
        }
      var tgt = this.cube[this.name];
      if(undefined === tgt){
        //console.log("target not found");
        throw "target not found";
        //return this;
        }
      if(null !== this.args){
        console.log("SC_CubeBinding.resolve(): args added", this.args);
        tgt = tgt.bind(this.cube, this.args);
        }
      else if("function" == typeof(tgt)){
        tgt = tgt.bind(this.cube);
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

/*
 * Methodes utilitaires utilisées dans l'implantation des SugarCubes.
 */
var _SC = {
/*
 * Fonction permettant de transformer un paramètre «bindable» en un
 * SC_CubeBinding permettant une résolution tardive.
 */
  b_ : function(p){
    if(typeof p == "string"){ // si on fournit un objet chaîne de caractères 
                              // c'est qu'on veut probablement faire un
                              // lien tardif vers la ressources. On va donc
                              // encapsuler cette chaîne dans un
                              // SC_CubeBinding
      var tmp = new SC_CubeBinding(p);
      return tmp;
      }
    return p;
    }
/*
 * Fonction permettant de transformer un paramètre «bindable» en un
 * SC_CubeBinding permettant la résolution tardive d'une fonction.
 */
  , b__ : function(p, args){
      if(typeof p == "string"){
        var tmp = new SC_CubeBinding(p);
        tmp.setArgs(args);
        return tmp;
        }
      throw "not a valid binding";
      }
/*
 * Fonction permettant de résoudre le binding d'un paramètre SC_CubeBinding. Si
 * ce binding n'est pas encore définit, on retourne le l'objet SC_CubeBinding
 * en fixant l'objet cube sur lequel il porte pour réaliser une late binding ou
 * un binding dynamique.
 */
  , _b : function(cube){
      return function(o){
           if(o instanceof SC_CubeBinding){
             /*if((undefined != o.cube) && (this !== o.cube)){
               //throw "invalid cube set on binding : "+o.cube;
               }*/
             o = o.clone();
             o.cube = this;
             return o.resolve();
             }
           return o;
           }.bind(cube);
      }
/*
 * fonction utilitaire permettant de lier les fonctions passées selon l'ancien
 * style : {t: target, f: filed }
 */
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
/*
 * Fonctions utilitaires de vérification de types. Ne sont pas encore très
 * utilisées ni très développées.
 */
  , isEvent : function(evt){
      if(undefined == evt){
        return false;
        }
      return (evt instanceof SC_Event)||(evt instanceof SC_Sensor);
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
      return (evt instanceof SC_Event)
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
      if("function" == typeof param){
        delete copy[name];
        Object.defineProperty(copy, name,{get : param});
        }
      }
  }
/*
 * Fonstion qui étend un cube pour implanter quelques fonctions de base :
 *  - ajout d'un comportemnet en parallèle (les programmes sont émis sur
 *    l'événements SC_cubeAddBehaviorEvt)
 *  - ajout de cellules au cube grâce à l'émission de 2 type d'événements
 *    (SC_cubeAddCellEvt et SC_cubeCellifyEvt)
 */
function SC_cubify(){
  Object.defineProperty(this, "SC_cubeAddBehaviorEvt"
                          , {enumerable:false
                             , value:SC.evt("addBehaviorEvt")
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeKillEvt"
                          , {enumerable:false
                             , value:SC.evt("killSelf")
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeCellifyEvt"
                          , {enumerable:false
                             , value:SC.evt("cellifyEvt")
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeAddCellEvt"
                          , {enumerable:false
                             , value:SC.evt("addCellEvt")
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
}
/*******************************************************************************
 * Events
 * Les événements sont des valeurs glaobals paratagées entre tous les
 * composants d'un programme. La valeur est présent ou absent à chaque instant.
 * Pour savoir si un événement est présent ou absent, on note dans son état le
 * numéro de l'instant de sa dernière génération. L'événement est présent si le
 * numéro d'instant de sa dernière génération est le numéro d'instnat courrant
 * de la machine d'exécution. Sinon l'événement est absent.
 ******************************************************************************/
// *** SC_Event
function SC_Event(name){
  this.its = -1;
  this.name = name;
  this.vals = [];
  this.registeredInst = [];
  this.registeredInst2 = [];
  this.m = null;
}
SC_Event.prototype = {
  constructor : SC_Event
  , isEvent:true
  , isEventOrSensor:true
  , isPresent : function(m){
      return this.its == m.instantNumber;
      }
/*
 * Réveil des instructions sur liste d'attente pour l'évennement. Si cela ne
 * suffit pas à débloquer l'instruction (qui reste bloquée sur d'autres
 * événementsn l'instruction non débloquée est remise dans la liste d'attente
 * en utilisant une liste temporaire)
 */
  , wakeupAll : function(m, flag){
      var n = 0;
      var tmp = this.registeredInst;
      //console.log("wakeUpAll = ",tmp);
      for(var idx = 0; idx < tmp.length; idx++){
        if(!(tmp[idx].wakeup(m,flag))){
          this.registeredInst2[n++]=tmp[idx];
          }
        }
      tmp.splice(0,tmp.length);
      this.registeredInst = this.registeredInst2;
      this.registeredInst2 = tmp;
      }
  , generate : function(m, flag){
      //console.log("genereate = ",this.registeredInst);
      if(!this.isPresent(m)){
        this.its = m.instantNumber;
        this.vals = [];
        this.wakeupAll(m, flag);
        }
      }
  //, nbd : 0
  , generateValues : function(m, val){
      /*if(("requestDisplay" == this.name)
         &&("Terre" == val.name)){
        console.log("tjs vivante"+this.vals.length);
        }*/
      /*if(("requestDisplay" == this.name)
          &&("Terre" == val.name && this.nbd++>100000)){
        console.log(this.vals.length);
        this.nbd = 0;
        }*/
      if(undefined !== val){
        this.vals.push(val);
        }
      else{
        //console.log("generating undefined value...");
        }
      }
  , unregister : function(i){
      var t = this.registeredInst.indexOf(i);
      if(t > -1){
        this.registeredInst.splice(t,1);
        }
      }
  , registerInst : function(m, inst){
      if((this.registeredInst.indexOf(inst)>-1)){
        throw "SugarCubesLib : Internal error";
        return;
        }
      //console.log("register inst = "+inst+" on "+this);
      this.registeredInst[this.registeredInst.length] = inst;
      //console.log("registered = ",this.registeredInst);
      }
  , getValues : function(m){
      if(!this.isPresent(m)){
        this.vals = [];
        }
      return this.vals;
      }
  , getAllValues : function(m, vals){
      vals[this] = this.getValues(m);
      }
  , iterateOnValues : function(combiner){
      if((undefined === combiner.iterateOn)
         ||("function" != typeof(combiner.iterate))){
        throw "invalid combiner";
        }
      const len = this.vals.length;
      for(var i = 0; i < len; i++){
        combiner.iterateOn(this.vals[i]);
        }
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      if(null == this.m){
        this.m = engine;
        }
      if(this.m !== engine){
        console.log('warning bound event ('+this.name+') problem', this.m, engine);
        }
      var copy = this;
      return copy;
      }
  , toString : function(){
      return "&"+this.name+" ";
      }
  }

// *** SC_Sensor
function SC_Sensor(name){
  this.its = -1;
  this.name = name;
  this.vals = [];
  this.registeredInst = [];
  this.registeredInst2 = [];
}
SC_Sensor.prototype = {
  constructor : SC_Sensor
  , isSenor:true
  , isEventOrSensor:true
  , isPresent : SC_Event.prototype.isPresent
  , wakeupAll : SC_Event.prototype.wakeupAll
  , generateValues : SC_Event.prototype.generateValues
  , systemGen : function(val, m, flag){
     if(!this.isPresent(m)){
        this.its = m.instantNumber;
        this.vals = [];
        this.wakeupAll(m, flag);
      }
      if(undefined != val){
        this.vals[this.vals.length] = val;
        }
      }
  , unregister : SC_Event.prototype.unregister
  , registerInst : SC_Event.prototype.registerInst
  , getValues : SC_Event.prototype.getValues
  , getAllValues : SC_Event.prototype.getAllValues
  , bindTo : SC_Event.prototype.bindTo
  , iterateOnValues : SC_Event.prototype.iterateOnValues
  , toString : function(){
      return "&_"+this.name+" ";
      }
}

/*******************************************************************************
 * Repeat Instruction
 ******************************************************************************/
// *** SC_RelativeJump (relogeable)
function SC_RelativeJump(jump){
  this.relativeJump = jump;
  this.seq = null;
  }
SC_RelativeJump.prototype = {
  constructor : SC_RelativeJump
  , activate : function(m){
      this.seq.idx += this.relativeJump;
      return SC_Instruction_State.TERM;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_RelativeJump(this.relativeJump);
      copy.seq = seq;
      return copy;
      }
  , toString : function(){
      return "end repeat ";
      }
}

// *** While
/* Not yet realy implemented */
function SC_WhilePoint(cond, end){
  this.seq = null;
  this.mseq = null;
  this.stopInst = null;
  this.end = end;
  }
SC_WhilePoint.prototype = {
  constructor : SC_WhilePoint
  , activate : function(m){
      if(this.mseq.exits > 0){
        this.mseq.exits--;
        this.seq.idx += this.end;
        this.reset(m);
        return SC_Instruction_State.TERM;
        }
      if(null === this.stopInst || (this.stopInst != m.getInstantNumber())){
        return SC_Instruction_State.TERM;
        }
      return SC_Instruction_State.STOP;
      }
  , reset : function(m){
      this.stopInst = null;
      }
  , toString : function(){
      return "loop forever ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_WhilePoint(this.end);
      copy.seq = seq;
      copy.mseq = masterSeq;
      copy.seq.register4Reset(copy);
      return copy;
      }
  }

// *** Loops
function SC_LoopPointForever(end){
  this.seq = null;
  this.mseq = null;
  this.stopInst = null;
  this.end = end;
}
SC_LoopPointForever.prototype = {
  constructor : SC_LoopPointForever
  , activate : function(m){
      if(this.mseq.exits > 0){
        this.mseq.exits--;
        this.seq.idx += this.end;
        this.reset(m);
        return SC_Instruction_State.TERM;
        }
      if(null === this.stopInst || (this.stopInst != m.getInstantNumber())){
        this.stopInst = m.getInstantNumber();
        return SC_Instruction_State.TERM;
        }
      return SC_Instruction_State.STOP;
      }
  , reset : function(m){
      this.stopInst = null;
      }
  , toString : function(){
      return "loop forever ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_LoopPointForever(this.end);
      copy.seq = seq;
      copy.mseq = masterSeq;
      copy.seq.register4Reset(copy);
      return copy;
      }
  }
function SC_LoopPoint(times, end){
  if(times < 0){
    return new SC_LoopPointForever(end);
    }
  this.count = this.it = times;
  this.stopInst = null;
  this.seq = null;
  this.mseq = null;
  this.end = end;
  }
SC_LoopPoint.prototype = {
  constructor : SC_LoopPoint
  , activate : function(m){
      if(0 === this.count||(this.mseq.exits > 0)){
        this.mseq.exits--;
        this.seq.idx += this.end;
        this.reset(m);
        return SC_Instruction_State.TERM;
        }
      if(null === this.stopInst || (this.stopInst != m.getInstantNumber())){
        this.stopInst = m.getInstantNumber();
        this.count --;
        return SC_Instruction_State.TERM;
        }
      return SC_Instruction_State.STOP;
      }
  , reset : function(m){
      this.stopInst = null;
      this.count = this.it;
      }
  , toString : function(){
      return "loop "+this.count+"/"+this.it+" times ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_LoopPoint(this.it, this.end);
      copy.seq = seq;
      copy.mseq = masterSeq;
      copy.seq.register4Reset(copy);
      return copy;
      }
  }

// *** Repeats
function SC_RepeatPointForever(end){
  this.seq = null;
  this.mseq = null;
  this.stopped = true;
  this.end = end;
}
SC_RepeatPointForever.prototype = {
  activate : function(m){
    if(this.mseq.exits > 0){
      this.mseq.exits--;
      this.seq.idx += this.end;
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    if(this.stopped){
      this.stopped = false;
      return SC_Instruction_State.TERM;
      }
    this.stopped = true;
    return SC_Instruction_State.STOP;
    }
  , reset : function(m){
      this.stopped = true;
      }
  , toString : function(){
      return "repeat forever ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_RepeatPointForever(this.end);
      copy.seq = seq;
      copy.mseq = masterSeq;
      copy.seq.register4Reset(copy);
      return copy;
      }
  }
function SC_RepeatPoint(times, end){
  if(times < 0){
    return new SC_RepeatPointForever(end);
    }
  this.count = this.it = times;
  this.stopped = true;
  this.seq = null;
  this.mseq = null;
  this.end = end;
  }
SC_RepeatPoint.prototype = {
  activate : function(m){
    if(0 === this.count||(this.mseq.exits > 0)){
      this.mseq.exits--;
      this.seq.idx += this.end;
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    if(this.stopped){
      this.stopped = false;
      this.count --;
      return SC_Instruction_State.TERM;
      }
    this.stopped = true;
    return SC_Instruction_State.STOP;
    }
  , reset : function(m){
      this.stopped = true;
      this.activate = function(m){
        //console.log("repeat first");
        this.count = this.it;
        delete this.activate;
        //this.activate = this.__proto__.activate;
        return this.activate(m);
        }
      //this.count = this.it;
      }
  , toString : function(){
      return "repeat "
                  +((this.it<0)?"forever ":this.count+"/"+this.it+" times ");
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_it = binder(this.it);      
      //console.log("repeat "+bound_it);
      var copy = new SC_RepeatPoint(bound_it, this.end);
      if("function" == typeof bound_it){
        Object.defineProperty(copy, "it",{get : bound_it});
        copy.reset(engine);
        }
      copy._it = this.it;
      copy.seq = seq;
      copy.mseq = masterSeq;
      copy.seq.register4Reset(copy);
      return copy;
      }
  }
// *** SC_Exit
function SC_Exit(n){
  if(undefined == n){
    n = 1;
    }
  this.n = n;
  this.mseq = null;
  }
SC_Exit.prototype = {
  activate : function(m){
    this.mseq.exits = this.n;
    return SC_Instruction_State.TERM;
    }
  , reset : NO_FUN
  , toString : function(){
      return "exit "
                  +((this.n>1)?"("+this.n+") ":" ");
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Exit(this.n);
      copy.mseq = masterSeq;
      return copy;
      }
  }

/*******************************************************************************
 * SC_Await Instruction
 ******************************************************************************/
function SC_Await(aConfig){
  this.config = aConfig;
  this.path = null;
}
SC_Await.prototype.activate = function(aMachine){
  //console.log("await.activate()");
  if(this.config.isPresent(aMachine)){
    this.reset(aMachine);
    return SC_Instruction_State.TERM;
    }
  //console.log("await.activate(): on s'enregistre");
  this.config.registerInst(aMachine, this);
  return SC_Instruction_State.WAIT;
  }
SC_Await.prototype.wakeup = function(m, flag){
  var res = this.config.isPresent(m);
  if(res){
    res = this.path.awake(m, flag);
    }
  return res;
  }
SC_Await.prototype.reset = function(m){
  this.config.unregister(this);
  }
SC_Await.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  //console.log("await bind", this.config);
  var binder = _SC._b(cube);
  var bound_config = binder(this.config);
  //console.log("bound_config = ", bound_config, this.config === bound_config);
  var copy = new SC_Await(bound_config.bindTo(engine, parbranch, seq, masterSeq, path, cube));
  copy._config = this.config;
  copy.path = path;
  return copy;
  }
SC_Await.prototype.toString = function(){
  return "await "+this.config.toString()+" ";
  }

/*******************************************************************************
 * Event Generation
 ******************************************************************************/
function SC_GenerateForeverLateEvtNoVal(evt){
  if((undefined == evt)
        ||(! (evt instanceof SC_CubeBinding))){
    throw "GenerateForEver : late binding event error :("+evt+")";
    }
  this.evt = evt;
  this.activate = this.firstAct;
  }
SC_GenerateForeverLateEvtNoVal.prototype = {
  activate : function(m){
           this.evt.generate(m);
           return SC_Instruction_State.STOP;
           }
  , firstAct : function(m){
             if(this.evt instanceof SC_CubeBinding){
               this.evt = this.evt.resolve();
               }
             var tmp = SC_GenerateForeverLateEvtNoVal.prototype.activate.call(this, m);
             delete(this.activate);
             return tmp;
             }
  , reset : function(m){
          this.evt = this._evt;
          this.activate = this.firstAct;
          }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
           var copy = new SC_GenerateForeverLateEvtNoVal(this._evt);
           copy._evt = this._evt;
           return copy;
           }
  , toString : function(){
             return "generate "+this.evt.toString()+" forever ";
             }
  }
// *** SC_GenerateForever
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
  activate : function(m){
    this.itsParent.registerForProduction(this);
    this.evt.generate(m);
    return SC_Instruction_State.STOP;
    }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt);
      var bound_value = binder(this.val);
      var copy = null;
      if(bound_evt.isBinding){
        if(bound_value.isBinding){
          copy = new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value);
          }
        else{
          copy = new SC_GenerateForeverLateEvt(bound_evt, bound_value);
          }
        }
      else{
        if(bound_value instanceof SC_CubeBinding){
          copy = new SC_GenerateForeverLateVal(bound_evt, bound_value);
          }
        else{
          copy = new SC_GenerateForever(bound_evt, bound_value);
          }
        }
      copy.itsParent = parbranch;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , reset : NO_FUN
  , generateValues : function(m){
      if(this.val instanceof SC_CubeBinding){
        var res = this.val.resolve();
        }
      if(this.val instanceof SC_Cell){
        this.evt.generateValues(m, this.val.val());
        }
      else if("function" == typeof(this.val)){
        this.evt.generateValues(m, this.val(m));
        }
      else{
        this.evt.generateValues(m, this.val);
        /*if("requestDisplay" == this.evt.name && "Terre" == this.val.name){
          console.log("buh");
          }*/
        }
      }
  , toString : function(){
      return "generate "+this.evt.toString()
             +((null != this.val)?"("+this.val.toString()+") ":"")
             +" forever ";
      }
}

//-----
function SC_GenerateForeverNoVal(evt){
  if((undefined == evt)
        ||(! (evt instanceof SC_Event
              || evt instanceof SC_CubeBinding
              || evt instanceof SC_Sensor))){
    throw "GenerateForEver error on evt:("+evt+")";
    }
  this.evt = evt;
}
SC_GenerateForeverNoVal.prototype = 
{
  constructor : SC_GenerateForeverNoVal
  , activate : SC_GenerateForeverLateEvtNoVal.prototype.activate
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
           var copy = new SC_GenerateForeverNoVal(this.evt);
           copy._evt = this.evt;
           return copy;
           }
  , reset : NO_FUN
  , toString : SC_GenerateForeverLateEvtNoVal.prototype.toString
  };

//--- Forever
function SC_GenerateForever(evt, val){
  if(undefined === val){
    return new SC_GenerateForeverNoVal(evt);
  }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
}
SC_GenerateForever.prototype = {
  activate : function(m){
    this.itsParent.registerForProduction(this);
    this.evt.generate(m);
    return SC_Instruction_State.STOP;
    }
  , reset : SC_GenerateForeverNoVal.prototype.reset
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt);
      var bound_value = binder(this.val);
      var copy = null;
      if(bound_evt instanceof SC_CubeBinding){
        if(bound_value instanceof SC_CubeBinding){
          copy = new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value);
          }
        else{
          copy = new SC_GenerateForeverLateEvt(bound_evt, bound_value);
          }
        }
      else{
        if(bound_value instanceof SC_CubeBinding){
          copy = new SC_GenerateForeverLateVal(bound_evt, bound_value);
          }
        else{
          copy = new SC_GenerateForever(bound_evt, bound_value);
          }
        }
      copy.itsParent = parbranch;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_GenerateForeverLateVal.prototype.generateValues
  , toString : function(){
      return "generate "+this.evt.toString()
             +this.val+" forever ";
      }
  }

// *** SC_GenerateOneNoVal
function SC_GenerateOneNoVal(evt){
  this.evt = evt;
}
SC_GenerateOneNoVal.prototype = {
  activate : function(m){
    this.evt.generate(m);
    return SC_Instruction_State.TERM;
    }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var tmp_evt = binder(this.evt);
      var copy = new SC_GenerateOneNoVal(tmp_evt);
      return copy;
      }
  , reset : NO_FUN
  , toString : function(){
      return "generate "+this.evt.toString();
      }
  }

// *** SC_GenerateOne
function SC_GenerateOne(evt, val){
  if(undefined === val){
    return new SC_GenerateOneNoVal(evt);
    }
  /*if("requestDisplay"==evt.name){
    console.log("building", this);
    }*/ 
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
}
SC_GenerateOne.prototype = {
  activate : function(m){
    this.itsParent.registerForProduction(this);
    this.evt.generate(m);
    return SC_Instruction_State.TERM;
    }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = null;
      if(this.evt === null){
        this.evt = engine.traceEvt;
        }
      var tmp_evt = binder(this.evt);
      var tmp_val = binder(this.val);
      if(undefined === tmp_val){
        copy = new SC_GenerateOneNoVal(tmp_evt);
        }
      else{
        copy = new SC_GenerateOne(tmp_evt, tmp_val);
        }
      copy.itsParent = parbranch;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , reset : NO_FUN
  , generateValues : SC_GenerateForever.prototype.generateValues
  , toString : function(){
      return "generate "+this.evt.toString()
             +((null != this.val)?"("+this.val.toString()+") ":"");
      }
  }

// *** SC_Generate
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
  activate : function(m){
    if(undefined !== this.val){
      this.itsParent.registerForProduction(this);
      }
    this.evt.generate(m);
    this.count--;
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    return SC_Instruction_State.STOP;
    }
  , reset : function(m){
      this.count = this.times;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = null;
      var binder = _SC._b(cube);
      var tmp_times = binder(this.times);
      var tmp_evt = binder(this.evt);
      var tmp_val = binder(this.val);
      if(tmp_times < 0){
        copy = new SC_GenerateForever(tmp_evt, tmp_val);
        }
      else if(0 === tmp_times){
        return SC_Nothing;
        }
      else if((undefined === tmp_times)||(1 == tmp_times)){
        copy = new SC_GenerateOne(tmp_evt, tmp_val);
        }
      else{
        copy = new SC_Generate(tmp_evt, tmp_val, tmp_times);
        }
      copy.itsParent = parbranch;
      copy._times = this.times;
      copy._evt = this.evt;
      copy._val = this.val;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_GenerateForever.prototype.generateValues
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
  activate : function(m){
    this.evt.generate(m);
    this.count--;
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    return SC_Instruction_State.STOP;
    }
  , reset : SC_Generate.prototype.reset
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = null;
      var binder = _SC._b(cube);
      var tmp_times = binder(this.times);
      var tmp_evt = binder(this.evt);
      if(tmp_times < 0){
        copy = new SC_GenerateForeverNoVal(tmp_evt);
        }
      else if(0 === tmp_times){
        return SC_Nothing;
        }
      else if((undefined === tmp_times)||(1 == tmp_times)){
        copy = new SC_GenerateOneNoVal(tmp_evt);
        }
      else{
        copy = new SC_GenerateNoVal(tmp_evt, tmp_times);
        }
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
// *** Filters Instructions
function SC_FilterForeverNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_Sensor) && !(sensor instanceof SC_CubeBinding)){
      //console.log(sensor, sensor instanceof SC_Sensor)
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_Event)){
    throw "invalid filter event !!";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  /*if("clickTarget" == this.evt.name){
    console.log("filter forever no sens", filterFun);
    }*/
  this.itsParent = null;
  this.path = null;
  this.val = null;
}
SC_FilterForeverNoSens.prototype = {
  activate : function(m){
    /*if("clickTarget" == this.evt.name){
      console.log("filter activate");
      }*/
    if(this.sensor.isPresent(m)){
      /*if("clickTarget" == this.evt.name){
        console.log("sensor present");
        }*/
      this.val = this.filterFun(this.sensor.getValues(m), m);
      /*if("clickTarget" == this.evt.name){
        console.log("val computed", this.val);
        }*/
      if(undefined !== this.val){
        this.itsParent.registerForProduction(this);
        this.evt.generate(m);
        }
      }
    this.sensor.registerInst(m, this);
    return SC_Instruction_State.WAIT;
    }
  , wakeup : function(m, flag){
      /*if("clickTarget" == this.evt.name){
        console.log("filter wakeup");
        }*/
      var res = this.sensor.isPresent(m);
      /*if("clickTarget" == this.evt.name){
        console.log("filter wakeup", res);
        }*/
      if(res){
        res = this.path.awake(m, flag);
        /*if("clickTarget" == this.evt.name){
          console.log("filter wakeup res 2", res, this.path);
          }*/
        }
      return res;
      }
  , reset : function(m){
      this.sensor.unregister(this);
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      /*if(undefined !== this.filterFun.t){
        //console.log("quick resolve");
        bound_fun = this.filterFun.t[this.filterFun.f].bind(this.filterFun.t);
        }*/
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_FilterForeverNoSens(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       );
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy.itsParent = parbranch;
      copy.path = path;
      //console.log(parbranch);
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : function(m){
      if(this.val instanceof SC_CubeBinding){
        var res = this.val.resolve();
        }
      if(this.val instanceof SC_Cell){
        this.evt.generateValues(m, this.val.val());
        }
      else if("function" == typeof(this.val)){
        this.evt.generateValues(m, this.val(m));
        }
      else{
        this.evt.generateValues(m, this.val);
        }
      this.val = null;
      }
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +" forever ";
      }
  }

function SC_FilterForever(sensor, filterFun, evt, no_sens){
  if(!(sensor instanceof SC_Sensor)
    &&!(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_Event) && !(evt instanceof SC_CubeBinding)){
    throw "invalid filter event !!";
    }
  if(undefined === no_sens){
    return new SC_FilterForeverNoSens(sensor, filterFun, evt);
    }
  if(!(no_sens instanceof SC_Event) && !(no_sens instanceof SC_CubeBinding)){
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
SC_FilterForever.prototype = {
  activate : function(m){
    if(this.sensor.isPresent(m)){
      this.val = this.filterFun(this.sensor.getValues(m), m);
      if(null != this.val){
        this.itsParent.registerForProduction(this);
        this.evt.generate(m);
        }
      }
    else{
      this.noSens_evt.generate(m);
      }
    return SC_Instruction_State.STOP;
    }
  , reset : NO_FUN
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_noSens_evt = binder(this.noSens_evt);
      /*if(undefined !== this.filterFun.t){
        //console.log("quick resolve");
        bound_fun = this.filterFun.t[this.filterFun.f].bind(this.filterFun.t);
        }*/
      bound_fun = _SC.bindIt(bound_fun);      
      var copy = new SC_FilterForever(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       , bound_noSens_evt
                       );
      if(undefined === bound_noSens_evt){
        copy = new SC_FilterForeverNoSens(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       );
        }
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_FilterForeverNoSens.prototype.generateValues
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" or "+this.noSens_evt
               +" forever ";
      }
  }
// *** SC_FilterOne
function SC_FilterOneNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_Sensor)
    &&!(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_Event) && !(evt instanceof SC_CubeBinding)){
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
  activate : function(m){
    if(this.sensor.isPresent(m)){
      this.val = this.filterFun(this.sensor.getValues(m), m);
      if(null != this.val){
        this.itsParent.registerForProduction(this);
        this.evt.generate(m);
        }
      }
    return SC_Instruction_State.TERM;
    }
  , reset : NO_FUN
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_noSens_evt = binder(this.noSens_evt);
      /*if((undefined !== this.filterFun.t)
          && (undefined !== this.filterFun.f)){
        //console.log("quick resolve", this.filterFun, this.filterFun.t[this.filterFun.f]);
        bound_fun = this.filterFun.t[this.filterFun.f].bind(this.filterFun.t);
        }*/
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_FilterOne(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       , bound_noSens_evt
                       );
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_FilterForeverNoSens.prototype.generateValues
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      ((-1 == this.times )?" forever ":(" for "+this.count+"/"+this.times+" times ")):"");
      }
  }

function SC_FilterOne(sensor, filterFun, evt, no_sens){
  if(!(sensor instanceof SC_Sensor)
    &&!(sensor instanceof SC_CubeBinding)){
      throw "sensor required !";
    }
  if(undefined === filterFun){
    throw "invalid filter function !";
    }
  if(!(evt instanceof SC_Event) && !(evt instanceof SC_CubeBinding)){
    throw "invalid filter event !!";
    }
  if((undefined !== no_sens)
    &&!(no_sens instanceof SC_Event)
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
  activate : function(m){
    if(this.sensor.isPresent(m)){
      this.val = this.filterFun(this.sensor.getValues(m), m);
      if(null != this.val){
        this.itsParent.registerForProduction(this);
        this.evt.generate(m);
        }
      }
    else if(undefined !== this.noSens_evt){
      this.noSens_evt.generate(m);
      }
    return SC_Instruction_State.TERM;
    }
  , reset : NO_FUN
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_noSens_evt = binder(this.noSens_evt);
      /*if((undefined !== this.filterFun.t)
          && (undefined !== this.filterFun.f)){
        //console.log("quick resolve", this.filterFun, this.filterFun.t[this.filterFun.f]);
        bound_fun = this.filterFun.t[this.filterFun.f].bind(this.filterFun.t);
        }*/
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_FilterOne(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       , bound_noSens_evt
                       );
      copy._Sensor = this.sensor;
      copy._FilterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_FilterForeverNoSens.prototype.generateValues
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      ((-1 == this.times )?" forever ":(" for "+this.count+"/"+this.times+" times ")):"");
      }
  }

// *** SC_Filter
function SC_FilterNoSens(sensor, evt, filterFun, times){
  if(0 == times){
    return SC_Nothing;
    }
  if((undefined === times) || (1 == times)){
    return new SC_FilterForever(sensor, filterFun, evt, no_sens);
    }
  if(times < 0){
    return new SC_FilterForever(sensor, filterFun, evt, no_sens);
    }
  if(!(sensor instanceof SC_Sensor) && !(no_sens instanceof SC_CubeBinding)){
    throw "sensor required !";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  this.count = this.times = times;
  this.noSens_evt = no_sens;
  }
SC_FilterNoSens.prototype = {
  activate : function(m){
    if(this.sensor.isPresent(m)){
      if(undefined != this.filterFun.f){
        var t = this.filterFun.t;
        if(undefined != t){
          this.val = t[this.filterFun.f].call(t,this.sensor.getValues(m));
          }
        }
      else{
        this.val = this.filterFun(this.sensor.getValues(m), m);
        }
      if(null != this.val){
        this.itsParent.registerForProduction(this);
        this.evt.generate(m);
        }
      }
    else{
      if(undefined != this.noSens_evt){
        this.noSens_evt.generate(m);
        }
      }
    this.count--;
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM
      }
    return SC_Instruction_State.STOP;
    }
  , wakeup : SC_FilterForever.prototype.wakeup
  , reset : function(m){
      this.sensor.unregister(this);
      this.count = this.times;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_times = binder(this.times);
      var bound_noSens_evt = binder(this.noSens_evt);
      var copy = null;
      /*if((undefined !== this.filterFun.t)
          && (undefined !== this.filterFun.f)){
        //console.log("quick resolve", this.filterFun, this.filterFun.t[this.filterFun.f]);
        bound_fun = this.filterFun.t[this.filterFun.f].bind(this.filterFun.t);
        }*/
      bound_fun = _SC.bindIt(bound_fun);
      if(0 == bound_times){
        return SC_Nothing;
        }
      if((undefined === bound_times) || (1 == bound_times)){
        copy = SC_FilterOne(bound_sensor, bound_fun, bound_evt, bound_noSens_evt);
        }
      else if(bound_times < 0){
        copy = SC_FilterForever(bound_sensor, bound_fun, bound_evt, bound_noSens_evt);
        }
      else{
        copy = new SC_Filter(
                        bound_sensor
                      , bound_evt
                      , bound_fun
                      , bound_times
                      , bound_noSens_evt
                      );
        }
      copy._sensor = this.sensor;
      copy._filterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy._times = this.times;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_FilterForever.prototype.generateValues
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
  if(!(sensor instanceof SC_Sensor) && !(no_sens instanceof SC_CubeBinding)){
    throw "sensor required !";
    }
  this.sensor = sensor;
  this.evt = evt;
  this.filterFun = filterFun;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  this.count = this.times = times;
  this.noSens_evt = no_sens;
  }
SC_Filter.prototype = {
  activate : function(m){
    if(this.sensor.isPresent(m)){
      if(undefined != this.filterFun.f){
        var t = this.filterFun.t;
        if(undefined != t){
          this.val = t[this.filterFun.f].call(t,this.sensor.getValues(m));
          }
        }
      else{
        this.val = this.filterFun(this.sensor.getValues(m), m);
        }
      if(null != this.val){
        this.itsParent.registerForProduction(this);
        this.evt.generate(m);
        }
      }
    else{
      if(undefined != this.noSens_evt){
        this.noSens_evt.generate(m);
        }
      }
    this.count--;
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM
      }
    return SC_Instruction_State.STOP;
    }
  , wakeup : SC_FilterForever.prototype.wakeup
  , reset : function(m){
      this.sensor.unregister(this);
      this.count = this.times;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_times = binder(this.times);
      var bound_noSens_evt = binder(this.noSens_evt);
      var copy = null;
      /*if((undefined !== this.filterFun.t)
          && (undefined !== this.filterFun.f)){
        //console.log("quick resolve", this.filterFun, this.filterFun.t[this.filterFun.f]);
        bound_fun = this.filterFun.t[this.filterFun.f].bind(this.filterFun.t);
        }*/
      bound_fun = _SC.bindIt(bound_fun);
      if(0 == bound_times){
        return SC_Nothing;
        }
      if((undefined === bound_times) || (1 == bound_times)){
        copy = SC_FilterOne(bound_sensor, bound_fun, bound_evt, bound_noSens_evt);
        }
      else if(bound_times < 0){
        copy = SC_FilterForever(bound_sensor, bound_fun, bound_evt, bound_noSens_evt);
        }
      else{
        copy = new SC_Filter(
                        bound_sensor
                      , bound_evt
                      , bound_fun
                      , bound_times
                      , bound_noSens_evt
                      );
        }
      copy._sensor = this.sensor;
      copy._filterFun = this.filterFun;
      copy._evt = this.evt;
      copy._noSens_evt = this.noSens_evt;
      copy._times = this.times;
      copy.itsParent = parbranch;
      copy.path = path;
      parbranch.declarePotential();
      return copy;
      }
  , generateValues : SC_FilterForever.prototype.generateValues
  , toString : function(){
      return "filter "+this.sensor.toString()
               +" with fun{"+this.filterFun+"} generate "+this.evt+" "
               +((1 != this.times)?
                      (" for "+this.count+"/"+this.times+" times "):"");
      }
  }
// -- Send
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
  activate : function(m){
    if(this.count-- > 0){
      m.generateEvent(this.evt, this.value);
      return SC_Instruction_State.STOP;
      }
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  , reset : function(m){
      this.count = this.times;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt);
      var bound_times = binder(this.times);
      var bound_val = binder(this.value);
      var copy = null;
      if(0 === bound_times){
        return SC_Nothing;
        }
      if((undefined === bound_times) || (1 == bound_times)){
        copy = SC_SendOne(bound_evt, bound_val);
        }
      else if(bound_times < 0){
        copy = SC_SendForever(bound_evt, bound_val);
        }
      else{
        copy = new SC_Send(bound_evt, bound_val, bound_times);
        }
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
// -- SC_SendOne
function SC_SendOne(evt, value){
  this.evt = evt;
  this.value = value;
  }
SC_SendOne.prototype = {
  activate : function(m){
    m.generateEvent(this.evt, this.value);
    return SC_Instruction_State.TERM;
    }
  , reset : function(m){}
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_SendOne(binder(this.evt), binder(this.value));
      copy._evt = this.evt;
      copy._value = this.value;
      return copy;
      }
  , toString : function(){
      return "send "+this.evt.toString()
               +"("+this.value.toString()+")"
      }
  }
// -- SendForever
function SC_SendForever(evt, value){
  this.evt = evt;
  this.value = value;
  }
SC_SendForever.prototype = {
  activate : function(m){
    m.generateEvent(this.evt, this.value);
    return SC_Instruction_State.STOP;
    }
  , reset : function(m){}
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
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
/*******************************************************************************
 * Nothing Object
 ******************************************************************************/
const SC_Nothing = {
  activate: function(m){
    return SC_Instruction_State.TERM;
  },
  reset : NO_FUN,
  bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
    return this;
  },
  toString : function(){
    return "nothing ";
  }
}

/*******************************************************************************
 * SC_Pause Instructions
 ******************************************************************************/
// *** SC_PauseForever
const SC_PauseForever = {
  activate : function(m){
      //console.log("halted");
      return SC_Instruction_State.HALT;
      }
  , reset : NO_FUN
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      return this;
      }
  , toString : function(){
      return "pause forever ";
      }
  }

// *** SC_Pause
function SC_PauseOne(){
  this.res = false;
  }
SC_PauseOne.prototype = {
  constructor : SC_PauseOne
  , activate : function(m){
      if(this.res){
        this.reset(m);
        return SC_Instruction_State.TERM;
        }
      this.res = true;
      return SC_Instruction_State.STOP;
      }
  , reset : function(m){
      this.res = false;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_PauseOne();
      return copy;
      }
  , toString : function(){
      return "pause ";
      }
  }

// *** SC_Pause
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
  //console.log("pause n times : "+this.times, this.count);
}
SC_Pause.prototype = {
  constructor : SC_Pause
  , activate : function(m){
      if(0 == this.count){
        this.reset(m);
        return SC_Instruction_State.TERM;
        }
      this.count--;
      return SC_Instruction_State.STOP;
      }
  , first : function(m){
      this.count = this.times;
      delete this.activate;
      return this.activate(m);
      }
  , reset : function(m){
      this.activate = this.first;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_times = binder(this.times);
      var copy = null;
      if(bound_times < 0){
        copy = new SC_PauseForever();
        }
      else{
        copy = new SC_Pause(bound_times);
        }
      var tmp = copy.times;
      _SC.lateBindProperty(copy, "times", copy.times)
      copy._times = this.times;
      return copy;
      }
  , toString : function(){
      return "pause "+this.count+"/"+this.times+" times ";
      }
  }

// *** SC_CubePause
function SC_CubePause(cell){
  this.count = -1;
  this.cell = cell;
  }
SC_CubePause.prototype = {
  activate : function(m){
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    if(this.count < 0){
      this.count = cell.val();
      if(this.count.isNaN() || (this.count < 1)){
        console.log("illegal value for SC_CubePause : "+this.count);
        this.count = 1;
        }
      }
    this.count--;
    return SC_Instruction_State.STOP;
    }
  , reset : function(m){
      this.count = -1;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Pause(binder(this.cell));
      copy._cell = this.cell;
      return copy;
      }
  , toString : function(){
      return "pause on cell "+this.cell+" times ";
      }
  }

// *** SC_PauseRT
function SC_PauseRT(duration){
  this.duration = duration;
  this.startTime = -1;
  }
SC_PauseRT.prototype = {
  activate : function(m){
  if(this.startTime < 0){
    this.startTime = window.performance.now();
    return SC_Instruction_State.STOP;
  }
  if(window.performance.now() - this.startTime > this.duration){
    this.reset(m);
    return SC_Instruction_State.TERM;
  }
  return SC_Instruction_State.STOP;
}
  , reset : function(m){
      this.startTime = -1;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_PauseRT(binder(this.duration));
      copy._duration = this.duration;
      copy.duration *= 1000;
      return copy;
      }
  , toString : function(){
      return "pause for "+this.duration+" ms ";
      }
  }

/*******************************************************************************
 * SC_Seq Instruction
 ******************************************************************************/
function SC_Seq(seqElements){
  this.seqElements = [];
  var targetIDx = 0;
  this.path = null;
  this.exits = 0;
  for(var i = 0; i < seqElements.length; i++){
    var prg = seqElements[i];
    if(prg instanceof SC_Seq){
      for(var j = 0; j < prg.seqElements.length; j++){
        this.seqElements[targetIDx++] = prg.seqElements[j];
        }
      }
    else{
      if(prg === VOID_NODE){
        continue;
        }
      this.seqElements[targetIDx++] = seqElements[i];
      }
    }
  this.idx = -1;
  this.activate = this.first;
  this.toReset = [];
  }
SC_Seq.prototype.add = function(inst){
  //console.log("adding to seq", inst);
  this.seqElements.push(inst);
  }
SC_Seq.prototype.register4Reset = function(client){
  this.toReset[this.toReset.length] = client;
  }
SC_Seq.prototype.act = function(m){
  //console.log("Seq_act", this.idx, this.seqElements.length);
  var res = SC_Instruction_State.TERM;
  while(SC_Instruction_State.TERM == res){
    if(this.idx >= this.seqElements.length){
       this.reset(m);
       return SC_Instruction_State.TERM;
      }
    //console.log("seq_act : ", this.seqElements[this.idx]);
    res = this.seqElements[this.idx].activate(m);
    if(SC_Instruction_State.TERM == res){
      this.idx++;
      }
    }
  return res;
  }
SC_Seq.prototype.awake = function(m, flag){
  //console.log("seq awaking");
  return this.path.awake(m, flag);
  }
SC_Seq.prototype.first = function(m){
  this.idx = 0;
  this.activate = this.act;
  var tmp = this.activate(m);
  return tmp;
  }
SC_Seq.prototype.eoi = function(m){
  this.seqElements[this.idx].eoi(m);
  }
SC_Seq.prototype.reset = function(m){
  if(-1 == this.idx){
    return;
    }
  if(this.idx < this.seqElements.length){
    this.seqElements[this.idx].reset(m);
  }
  for(var i = 0; i < this.toReset.length; i++){
    this.toReset[i].reset(m);
    }
  this.idx = -1;
  this.activate = this.first;
  this.exits = 0;
  }
SC_Seq.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  //console.log("seq bind to ", this.seqElements.length);
  var copy = new SC_Seq(new Array(this.seqElements.length));
  if(undefined === masterSeq){
    //console.log("as master seq");
    masterSeq = copy;
    }
  for(var i = 0; i < this.seqElements.length; i++){
    //console.log("adding to bound", this.seqElements[i]);
    copy.seqElements[i] = this.seqElements[i].bindTo(engine, parbranch, copy
                                                     , masterSeq, copy, cube);
    }
  //console.log("end seq bound");
  copy.path = path;
  return copy;
  }
SC_Seq.prototype.toString = function(){
  var res ="[";
  for(var i = 0; i < this.seqElements.length; i++){
    res += this.seqElements[i].toString();
    res += (i<this.seqElements.length-1)?";":"";
    }
  return res+"] ";
  }

/*******************************************************************************
 * SC_Action Instruction
 ******************************************************************************/
// *** SC_ActionForever
function SC_ActionForever(f){
  this.action = f;
  this.closure = null;
  }
SC_ActionForever.prototype.activate = function(m){
  m.addFun(this.closure);
  return SC_Instruction_State.STOP;
  }
SC_ActionForever.prototype.reset = NO_FUN
SC_ActionForever.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_ActionForever(binder(this.action));
  copy._action = this.action;
  copy.closure = _SC.bindIt(copy.action);
  return copy;
}
SC_ActionForever.prototype.toString = function(){
  return "call "+((undefined == this.action.f)?" "+this.action+" "
               :this.action.t+"."+this.action.f+"()")+" forever";
}
// *** SC_Action
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
SC_Action.prototype.activate = function(m){
  m.addFun(this.closure);
  this.count--;
  if(0 == this.count){
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  return SC_Instruction_State.STOP;
  }
SC_Action.prototype.reset = function(m){
  this.activate = function(m){
    this.count = this.times;
    delete this.activate;
    return this.activate(m);
    };
}
SC_Action.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_Action(binder(this.action), binder(this.times));
  copy._action = this.action;
  copy._times = this.times;
  if("function" == typeof copy.times){
    Object.defineProperty(copy, "times",{get : copy.times});
    }
  if(copy.action.f && copy.action.t){
    copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
    }
  else{
    copy.closure = copy.action;
    }
  return copy;
}
SC_Action.prototype.toString = function(){
  return "call "+((undefined == this.action.f)?"call("+this.action+") "
               :this.action.t+"."+this.action.f+"() ")
               +((this.times>1)?(this.count+"/"+this.times+" times "):" ");
}
// *** SC_SimpleAction
function SC_SimpleAction(f){
  if(undefined === f){
    throw "undefined action";
    }
  this.action = f;
  }
SC_SimpleAction.prototype.activate = function(m){
  m.addFun(this.closure);
  return SC_Instruction_State.TERM;
  }
SC_SimpleAction.prototype.reset = function(m){}
SC_SimpleAction.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_SimpleAction(binder(this.action));
  copy._action = this.action;
  if(copy.action.f && copy.action.t){
    copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
    }
  else{
    copy.closure = copy.action.bind(cube);
    }
  //console.log("action.bound");
  return copy;
}
SC_SimpleAction.prototype.toString = function(){
  return "call "+((undefined == this.action.f)?"call("+this.action+") "
               :this.action.t+"."+this.action.f+"() ");
}

/*********
 * ActionOnEvent Class
 *********/
function SC_ActionOnEventForeverNoDef(c, act){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.toRegister = true;
}
SC_ActionOnEventForeverNoDef.prototype.activate = function(m){
  if(this.evtFun.config.isPresent(m)){
    m.addEvtFun(this.evtFun);
    return SC_Instruction_State.STOP;
    }
  if(this.toRegister){
    this.evtFun.config.registerInst(m, this);
    this.toRegister = false;
    }
  return SC_Instruction_State.WAIT;
  }
SC_ActionOnEventForeverNoDef.prototype.wakeup = function(m, flag){
  if(this.evtFun.config.isPresent(m)){
    res = this.path.awake(m, flag);
    }
  return false;
  }
SC_ActionOnEventForeverNoDef.prototype.reset = function(m){
  this.evtFun.config.unregister(this);
  this.toRegister = true;
  }
SC_ActionOnEventForeverNoDef.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_ActionOnEventForeverNoDef(
                       binder(this.evtFun.config).bindTo(engine, parbranch, seq, masterSeq, path, cube)
                       , binder(this.evtFun.action));
  copy.path = path;
  return copy;
}
SC_ActionOnEventForeverNoDef.prototype.toString = function(){
  var res ="on "+this.evtFun.config.toString();
  return res+"call("+this.evtFun.action.toString()+") "
         +" forever ";
}

function SC_ActionOnEventForever(c, act, defaultAct){
  if(undefined === defaultAct){
    return new SC_ActionOnEventForeverNoDef(c, act);
    }
  this.evtFun = {action:act, config:c};
  this.defaultAct = defaultAct;
  this.path = null;
  this.toRegister = true;
}
SC_ActionOnEventForever.prototype.activate = function(m){
  if(this.evtFun.config.isPresent(m)){
    m.addEvtFun(this.evtFun);
    return SC_Instruction_State.STOP;
    }
  if(this.toRegister){
    this.evtFun.config.registerInst(m, this);
    this.toRegister = false;
    }
  return SC_Instruction_State.WEOI;
  }
SC_ActionOnEventForever.prototype.wakeup = SC_ActionOnEventForeverNoDef.prototype.wakeup;
SC_ActionOnEventForever.prototype.reset = SC_ActionOnEventForeverNoDef.prototype.reset;
SC_ActionOnEventForever.prototype.eoi = function(m){
  if(false){ // debug
    if(this.evtFun.config.isPresent(m)){
      throw "SC_ActionOnEventForever : fatalerror";
      }
    }
  m.addFun(this.defaultAct);
  }
SC_ActionOnEventForever.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_ActionOnEventForever(
                       binder(this.evtFun.config).bindTo(engine, parbranch, seq, masterSeq, path, cube)
                       , binder(this.evtFun.action)
                       , binder(this.defaultAct));
  copy.path = path;
  return copy;
}
SC_ActionOnEventForever.prototype.toString = function(){
  var res ="on "+this.evtFun.config.toString();
  return res+"call("+this.evtFun.action.toString()+") "
         +"else call("+this.defaultAct.toString()+")  forever ";
}

//--- 
function SC_ActionOnEventNoDef(c, act, times){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.toRegister = true;
  this.count = this.times = times;
}
SC_ActionOnEventNoDef.prototype.activate = function(m){
  if(0 == this.count){
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  if(this.evtFun.config.isPresent(m)){
    m.addEvtFun(this.evtFun);
    if(this.count > 0){
      this.count--;
      }
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    return SC_Instruction_State.STOP;
    }
  if(this.toRegister){
    this.evtFun.config.registerInst(m, this);
    this.toRegister = false;
    }
  return SC_Instruction_State.WEOI;
  }
SC_ActionOnEventNoDef.prototype.wakeup = SC_ActionOnEventForever.prototype.wakeup;
SC_ActionOnEventNoDef.prototype.reset = function(m){
  this.count = this.times;
  this.evtFun.config.unregister(this);
  this.toRegister = true;
  }
SC_ActionOnEventNoDef.prototype.eoi = function(m){
  if(false){ // Debug
    if(this.evtFun.config.isPresent(m)){
      throw "heu buh dummy error";
      }
    }
  if(this.count > 0){
    this.count--;
    }
  }
SC_ActionOnEventNoDef.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_ActionOnEventNoDef(binder(this.evtFun.config).bindTo(engine, parbranch, seq, masterSeq, path, cube)
                               , binder(this.evtFun.action)
                               , binder(this.times));
  copy.path = path;
  return copy;
}
SC_ActionOnEventNoDef.prototype.toString = function(){
  var res ="on "+this.evtFun.config.toString();
  return res+"call("+this.evtFun.action.toString()+") "
         +" for "+this.count+"/"+this.times+" times ";
}
//--- 
function SC_ActionOnEventNoDef(c, act, times){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.toRegister = true;
  this.count = this.times = times;
}
SC_ActionOnEventNoDef.prototype.activate = function(m){
  if(0 == this.count){
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  if(this.evtFun.config.isPresent(m)){
    m.addEvtFun(this.evtFun);
    if(this.count > 0){
      this.count--;
      }
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    return SC_Instruction_State.STOP;
    }
  if(this.toRegister){
    this.evtFun.config.registerInst(m, this);
    this.toRegister = false;
    }
  return SC_Instruction_State.WEOI;
  }
SC_ActionOnEventNoDef.prototype.wakeup = SC_ActionOnEventForever.prototype.wakeup;
SC_ActionOnEventNoDef.prototype.reset = function(m){
  this.count = this.times;
  this.evtFun.config.unregister(this);
  this.toRegister = true;
  }
SC_ActionOnEventNoDef.prototype.eoi = function(m){
  if(false){ // Debug
    if(this.evtFun.config.isPresent(m)){
      throw "heu buh dummy error";
      }
    }
  if(this.count > 0){
    this.count--;
    }
  if(undefined != this.defaultAct){
    m.addFun(this.defaultAct);
    }
  }
SC_ActionOnEventNoDef.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_ActionOnEventNoDef(binder(this.evtFun.config).bindTo(engine, parbranch, seq, masterSeq, path, cube)
                               , binder(this.evtFun.action)
                               , binder(this.times));
  copy.path = path;
  return copy;
}
SC_ActionOnEventNoDef.prototype.toString = function(){
  var res ="on "+this.evtFun.config.toString();
  return res+"call("+this.evtFun.action.toString()+") "
      +"for "+this.count+"/"+this.times+" times ";
}//--- 
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
  this.path = null;
  this.toRegister = true;
  this.count = this.times = times;
}
SC_ActionOnEvent.prototype.activate = function(m){
  if(0 == this.count){
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  if(this.evtFun.config.isPresent(m)){
    m.addEvtFun(this.evtFun);
    if(this.count > 0){
      this.count--;
      }
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    return SC_Instruction_State.STOP;
    }
  if(this.toRegister){
    this.evtFun.config.registerInst(m, this);
    this.toRegister = false;
    }
  return SC_Instruction_State.WEOI;
  }
SC_ActionOnEvent.prototype.wakeup = SC_ActionOnEventForever.prototype.wakeup;
SC_ActionOnEvent.prototype.reset = function(m){
  this.count = this.times;
  this.evtFun.config.unregister(this);
  this.toRegister = true;
  }
SC_ActionOnEvent.prototype.eoi = function(m){
  if(false){ // Debug
    if(this.evtFun.config.isPresent(m)){
      throw "heu buh dummy error";
      }
    }
  if(this.count > 0){
    this.count--;
    }
  if(undefined != this.defaultAct){
    m.addFun(this.defaultAct);
    }
  }
SC_ActionOnEvent.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_ActionOnEvent(binder(this.evtFun.config).bindTo(engine, parbranch, seq, masterSeq, path, cube)
                               , binder(this.evtFun.action)
                               , binder(this.defaultAct)
                               , binder(this.times));
  copy.path = path;
  return copy;
}
SC_ActionOnEvent.prototype.toString = function(){
  var res ="on "+this.evtFun.config.toString();
  return res+"call("+this.evtFun.action.toString()+") "
      +"else call("+this.defaultAct.toString()+") for "+this.count+"/"+this.times+" times ";
}
//--- 
function SC_SimpleActionOnEventNoDef(c, act){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.toRegister = true;
  this.terminated = false;
}
SC_SimpleActionOnEventNoDef.prototype = {
  activate : function(m){
    if(this.terminated){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    if(this.evtFun.config.isPresent(m)){
      m.addEvtFun(this.evtFun);
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    if(this.toRegister){
      this.evtFun.config.registerInst(m, this);
      this.toRegister = false;
      }
    return SC_Instruction_State.WEOI;
    }
  , wakeup : SC_ActionOnEvent.prototype.wakeup
  , reset : function(m){
      this.evtFun.config.unregister(this);
      this.toRegister = true;
      this.terminated = false;
      }
  , eoi : function(m){
      if(false){
        if(this.evtFun.config.isPresent(m)){
          throw "heu buh dummy error";
          }
        }
      this.terminated = true;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_SimpleActionOnEventNoDef(
                     binder(this.evtFun).config.bindTo(engine, parbranch, seq, masterSeq, path, cube)
                     , binder(this.evtFun.action));
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") ";
      }
  }

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
  activate : SC_SimpleActionOnEventNoDef.prototype.activate
  , wakeup : SC_SimpleActionOnEventNoDef.prototype.wakeup
  , reset : SC_SimpleActionOnEventNoDef.prototype.reset
  , eoi : function(m){
      if(false){ // Debug
        if(this.evtFun.config.isPresent(m)){
          throw "heu buh dummy error";
          }
        } // Debug
      m.addFun(this.defaultAct);
      this.terminated = true;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_SimpleActionOnEvent(binder(this.evtFun.config)
                                                          .bindTo(engine, parbranch, seq, masterSeq, path, cube)
                                              , binder(this.evtFun.action)
                                              , binder(this.defaultAct));
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var res ="on "+this.evtFun.config.toString();
      return res+"call("+this.evtFun.action.toString()+") "
          +"else call("+this.defaultAct.toString()+") ";
      }
  }

/*********
 * SC_ParBranch Class
 *********/
function SC_ParBranch(aParent, aPar, prg){
  this.prev = null;
  this.next = null;
  this.prg = prg;
  this.flag = SC_Instruction_State.SUSP;
  this.itsParent = aParent;
  this.itsPar = aPar;
  this.hasProduction = false;
  this.emitters = [];
  this.hasPotential = false;
  this.path = null;
  this.idxInProd = -1;
}

SC_ParBranch.prototype = {
  constructor : SC_ParBranch
  , declarePotential : function(){
      if(this.hasPotential){
        return;
        }
      this.hasPotential = true;
      if(null != this.itsPar){
        this.idxInProd = this.itsPar.registerInProdBranch(this);
        }
      if(null != this.itsParent){
        this.itsParent.declarePotential();
        }
      }
  , registerForProduction : function(gen){
      this.emitters.push(gen);
      this.hasProduction = true;
      if(null != this.itsParent){
        this.itsParent.registerForProduction(this);
        }
      else{
        this.itsPar.registerForProduction(this);
        }
      }
  , awake : function(m, flag){
      var res = false;
      switch(this.flag){
        case SC_Instruction_State.WEOI:{
          res = this.path.awake(m, flag);
          if(res){
            this.itsPar.waittingEOI.remove(this);
            ((flag)?this.itsPar.suspended:this.itsPar.suspendedChain).append(this);
            this.flag = SC_Instruction_State.SUSP;
            }
          break;
          }
        case SC_Instruction_State.WAIT:{
          res = this.path.awake(m, flag);
          if(res){
            this.itsPar.waitting.remove(this);
            ((flag)?this.itsPar.suspended:this.itsPar.suspendedChain).append(this);
            this.flag = SC_Instruction_State.SUSP;
            }
          break;
          }
        case SC_Instruction_State.SUSP:{
          return true;
          }
        }
      return res;
      }
  , generateValues : function(m){
      for(var i = 0; i < this.emitters.length; i++){
        this.emitters[i].generateValues(m);
        }
      this.emitters = [];
      this.hasProduction = false;
      }
  };

/*********
 * Queues
 *********/
function SC_Queues(){
  this.start = null;
  this.end = null;
}
SC_Queues.prototype = {
  constructor : SC_Queues
  , append : function(elt){
      if(null == this.end){
        this.start = this.end = elt;
        }
      else{
        this.end.next = elt;
        elt.prev = this.end;
        this.end = elt;
        }
      }
  , pull : function(){
      if(null == this.end){
        return null;
        }
      var res = this.end;
      this.end = res.prev;
      if(null != this.end){
        this.end.next = null;
        }
      else{
        this.start = this.end = null;
        }
      res.next = res.prev = null;
      return res;
      }
  , push : function(elt){
      if(null == this.start){
        this.start = this.end = elt;
        }
      else{
        this.start.prev = elt;
        elt.next = this.start;
        this.end = elt;
        }
      }
  , pop : function(){
      if(null == this.start){
        return null;
        }
      var res = this.start;
      this.start = res.next;
      if(null != this.start){
        this.start.prev = null;
        }
      else{
        this.start = this.end = null;
        }
      res.next = res.prev = null;
      return res;
      }
  , remove : function(elt){
      if(this.start == elt){
        return this.pop();
        }
      if(this.end == elt){
        return this.pull();
        }
      else{
        elt.next.prev = elt.prev;
        elt.prev.next = elt.next;
        }
      elt.next = elt.prev = null;
      return elt;
      }
  , contains : function(elt){
      var cursor = this.start;
      while( null != cursor){
        if(elt == cursor){
          return true;
          }
        cursor = cursor.next;
        }
      return false;
      }
  , isEmpty : function(){
      return (null == this.start);
      }
  };

/*********
 * SC_Par Class
 *********/
function SC_Par(args, channel){
  if(undefined !== channel){
    return new SC_ParDyn(channel, args);
    }
  this.suspended = new SC_Queues();
  this.suspendedChain = new SC_Queues();
  this.waittingEOI = new SC_Queues();
  this.stopped = new SC_Queues();
  this.waitting = new SC_Queues();
  this.halted = new SC_Queues();
  this.terminated = new SC_Queues();
  this.branches = [];
  this.prodBranches = [];
  this.purgeable = false;
  this.hasProduction = false;
  this.path = null;
  this.itsParent = null;
  this.cube = null;
  for(var i in args){
    this.branches[i] = new SC_ParBranch(null, this, args[i]);
    this.suspended.append(this.branches[i]);
    }
  }
SC_Par.prototype = {
  constructor : SC_Par
  , setPurgeable : function(flag){
      this.purgeable = flag;
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
        this.branches[this.branches.length] = b;
        this.suspended.append(b);
        }
      }
  , addBranch : function(p, pb, engine){
      if(p instanceof SC_Par){
        //console.log("adding a par -> exploring");
        for(var n = 0 ; n < p.branches.length; n ++){
          this.addBranch(p.branches[n].prg, pb, engine);
          }
        }
      else{
        var b = new SC_ParBranch(pb, this, SC_Nothing);
        b.prg = p.bindTo(engine, b, null, this.mseq, b, this.cube);
        b.path = this;
        /*if(this instanceof SC_ParDyn){
          console.log("adding branch : ", this.branches)
          }*/
        this.branches.push(b);
        //console.log(this.suspended.isEmpty());
        this.suspended.append(b);
        //console.log(this.suspended.isEmpty());
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
      }
  , registerInProdBranch : function(pb){
      /*console.log('register in prod branches'
                   , pb, this.prodBranches);*/
      var res = this.prodBranches.length;
      this.prodBranches.push(pb);
      return res;
      }
  , awake : function(m, flag){
      if(null != this.path){
        return this.path.awake(m, flag);
        }
      return true;
      }
  };
SC_Par.prototype.activate = function(m){
  //console.log("par activate", this.suspended.isEmpty(), this.suspendedChain.isEmpty());
  var res = SC_Instruction_State.TERM;
  if(this.suspended.isEmpty() && (!this.suspendedChain.isEmpty()) ){
    //console.log("go");
    var t = this.suspended;
    this.suspended = this.suspendedChain;
    this.suspendedChain = t;
  }
  var toActivate = this.suspended.pop();
  //console.log("toActivate", toActivate, this.suspended.isEmpty());
  while(null !== toActivate){
    switch(toActivate.flag = toActivate.prg.activate(m)){
      case SC_Instruction_State.SUSP:{
             this.suspendedChain.append(toActivate);
             break;
           }
      case SC_Instruction_State.WEOI:{
             this.waittingEOI.append(toActivate);
             break;
           }
      case SC_Instruction_State.STOP:{
             this.stopped.append(toActivate);
             break;
           }
      case SC_Instruction_State.WAIT:{
             this.waitting.append(toActivate);
             break;
           }
      case SC_Instruction_State.HALT:{
             this.halted.append(toActivate);
             break;
           }
      case SC_Instruction_State.TERM:{
             if(this.purgeable){
               this.removeBranch(toActivate);
             }
             else{
               toActivate.flag = SC_Instruction_State.TERM;
               //toActivate.prg.reset(m);
               this.terminated.append(toActivate);
             }
             break;
           }
    }
    toActivate = this.suspended.pop();
  }
  if(!this.suspendedChain.isEmpty()){
    var t = this.suspended;
    this.suspended = this.suspendedChain;
    this.suspendedChain = t;
    //console.log("SUSP -> susp");
    return SC_Instruction_State.SUSP;
  }
  if(!this.waittingEOI.isEmpty()){
    return SC_Instruction_State.WEOI;
  }
  if(!this.stopped.isEmpty()){
    if(this.waitting.isEmpty()){
      var t = this.suspended;
      this.suspended = this.stopped;
      this.stopped = t;
      return SC_Instruction_State.STOP;
    }
    return SC_Instruction_State.WEOI;
  }
  if(!this.waitting.isEmpty()){
    return SC_Instruction_State.WAIT;
  }
  if(!this.halted.isEmpty()){
    return SC_Instruction_State.HALT;
  }
  //var t = this.suspended;
  //this.suspended = this.terminated;
  //this.terminated = t;
  this.reset(m);
  //console.log("par term");
  return SC_Instruction_State.TERM;
}
SC_Par.prototype.eoi = function(m){
/*  var tmp = this.suspended.start;
  while(null != tmp){
    tmp.prg.eoi(m);
    tmp = tmp.next;
  }*/
  var tmp = this.waittingEOI.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.eoi(m);
    this.suspended.append(tmp);
    tmp = this.waittingEOI.pop();
  }
  tmp = this.stopped.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    this.suspended.append(tmp);
    tmp = this.stopped.pop();
  }
}
SC_Par.prototype.reset = function(m){
  var tmp = this.suspended.start;
  while(null != tmp){
    tmp.prg.reset(m);
    tmp = tmp.next;
  }
  tmp = this.waittingEOI.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    this.suspended.append(tmp);
    tmp = this.waittingEOI.pop();
  }
  tmp = this.stopped.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    this.suspended.append(tmp);
    tmp = this.stopped.pop();
  }
  tmp = this.waitting.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    this.suspended.append(tmp);
    tmp = this.waitting.pop();
  }
  tmp = this.halted.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    this.suspended.append(tmp);
    tmp = this.halted.pop();
  }
  tmp = this.terminated.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    this.suspended.append(tmp);
    tmp = this.terminated.pop();
  }
}
SC_Par.prototype.registerForProduction = function(b){
  /*if(this instanceof SC_ParDyn){
    console.log("register");
  }*/
  //this.prodBranches[this.prodBranches.length] = b;
  this.hasProduction = true;
  }
SC_Par.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var copy = new SC_Par();
  copy.mseq = masterSeq;
  copy.cube = cube;
  var tmp = this.suspended.start;
  while(null != tmp){
    var b = new SC_ParBranch(parbranch, copy, SC_Nothing);
    //if(null != parbranch){
    //  //parbranch.registerForProduction(b);
    //  }
    b.prg = tmp.prg.bindTo(engine, b, null, masterSeq, b, cube);
    b.path = copy
    copy.branches[copy.branches.length] = b;
    copy.suspended.append(b);
    if(b.hasPotential){
      if(undefined != b.itsParent){
        //if(!b.itsParent.hasPotential){
            b.itsParent.hasPotential = true;
          //}
        }
      if(copy.prodBranches.indexOf(b)<0){
        copy.prodBranches[copy.prodBranches.length] = b;
        }
      }
    tmp = tmp.next;
    }
  copy.path = path;
  return copy;
  }
SC_Par.prototype.removeBranch = function(elt){
  //console.log("removing branch", elt);
  var i = this.branches.indexOf(elt);
  this.branches.splice(i,1);
  }
SC_Par.prototype.toString = function(){
  var res ="[";
  for(var i = 0; i < this.branches.length; i++){
    res += this.branches[i].prg.toString();
    res += (i<this.branches.length-1)?"||":"";
  }
  return res+"] ";
}
SC_Par.prototype.generateValues = function(m){
  /*if((this instanceof SC_ParDyn)
    &&(this.prodBranches.length>2)
    ){
    console.log("produce");
    }*/
  for(var nb = 0; nb < this.prodBranches.length; nb++){
    var b = this.prodBranches[nb];
    if(b.hasProduction){
      b.generateValues(m);
      }
    }
  //this.prodBranches = [];
  this.hasProduction = false;
  }

/**
  * Opérateur Parallele a extension dynamique...
  * SC_ParDyn
  */
function SC_ParDyn(channel, args){
  if(undefined === channel){
    throw "Illegal dynamic Parrellel instruction use !";
    }
  //console.log("SC_Par Dyn !");
  this.suspended = new SC_Queues();
  this.suspendedChain = new SC_Queues();
  this.waittingEOI = new SC_Queues();
  this.stopped = new SC_Queues();
  this.waitting = new SC_Queues();
  this.halted = new SC_Queues();
  this.terminated = new SC_Queues();
  this.branches = [];
  this.prodBranches = [];
  this.purgeable = false;
  this.hasProduction = false;
  this.path = null;
  this.itsParent = null;
  this.originalBranches = [];
  for(var i in args){
    this.originalBranches[i] = this.branches[i] = new SC_ParBranch(null, this, args[i]);
    this.suspended.append(this.branches[i]);
    }
  this.channel = channel;
  this.toRegister = true;
  this.forceTermination = false;
  }
SC_ParDyn.prototype = {
  constructor : SC_ParDyn
  , registerInProdBranch : SC_Par.prototype.registerInProdBranch
  , setPurgeable : SC_Par.prototype.setPurgeable
  , add : SC_Par.prototype.add
  , addBranch : SC_Par.prototype.addBranch
  , awake : SC_Par.prototype.awake
}
SC_ParDyn.prototype.wakeup = function(m, flag){
  var res = this.channel.isPresent(m);
  if(res){
    res = this.path.awake(m, flag);
    }
  return false;
  }
SC_ParDyn.prototype.activate = function(m){
  var res = SC_Instruction_State.WAIT;
  //console.log("activate");
  if(this.forceTermination){
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  if(this.toRegister){
    this.channel.registerInst(m, this);
    this.toRegister = false;
    }
  if(this.suspended.isEmpty() && (!this.suspendedChain.isEmpty()) ){
    var t = this.suspended;
    this.suspended = this.suspendedChain;
    this.suspendedChain = t;
  }
  var toActivate = this.suspended.pop();
  //console.log("toActivate", toActivate, this.suspended.isEmpty());
  while(null !== toActivate){
    switch(toActivate.flag = toActivate.prg.activate(m)){
      case SC_Instruction_State.SUSP:{
             this.suspendedChain.append(toActivate);
             break;
           }
      case SC_Instruction_State.WEOI:{
             this.waittingEOI.append(toActivate);
             break;
           }
      case SC_Instruction_State.STOP:{
             this.stopped.append(toActivate);
             break;
           }
      case SC_Instruction_State.WAIT:{
             this.waitting.append(toActivate);
             break;
           }
      case SC_Instruction_State.HALT:{
             this.halted.append(toActivate);
             break;
           }
      case SC_Instruction_State.TERM:{
             if(this.purgeable){
               this.removeBranch(toActivate);
             }
             else{
               toActivate.flag = SC_Instruction_State.TERM;
               //toActivate.prg.reset(m);
               this.terminated.append(toActivate);
             }
             break;
           }
    }
    toActivate = this.suspended.pop();
  }
  if(!this.suspendedChain.isEmpty()){
    var t = this.suspended;
    this.suspended = this.suspendedChain;
    this.suspendedChain = t;
    //console.log("SUSP -> susp");
    return SC_Instruction_State.SUSP;
  }
  if(!this.waittingEOI.isEmpty()){
    //console.log("WEOI -> weoi");
    return SC_Instruction_State.WEOI;
  }
  if(!this.stopped.isEmpty()){
/*    if(this.waitting.isEmpty()){
      var t = this.suspended;
      this.suspended = this.stopped;
      this.stopped = t;
    }*/
    //console.log("STOP -> weoi");
    return SC_Instruction_State.WEOI;
  }
  if(this.channel.isPresent(m)){
    //console.log("WAIT -> weoi");
    return SC_Instruction_State.WEOI;
    }
  //console.log("WAIT -> wait");
  return (this.suspended.isEmpty()
          && this.waitting.isEmpty()
          && this.halted.isEmpty()
          )?SC_Instruction_State.WEOI
           :SC_Instruction_State.WAIT;
  }
SC_ParDyn.prototype.computeAndAdd = function(m){
  var vals = {};
  //console.log("adding p");
  this.channel.getAllValues(m, vals);
  var prgs = vals[this.channel];
  //console.log("computeAndAdd",this.itsParent);
  for(var i = 0 ; i < prgs.length; i++){
    //console.log(prgs[i]);
    //console.log(this.path);
    //console.log(m);
    //console.log(this.itsParent);
    this.addBranch(prgs[i], /*this.path*/ this.itsParent, m);
    }
  }
SC_ParDyn.prototype.eoi = function(m){
  var tmp = this.waittingEOI.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.eoi(m);
    this.suspended.append(tmp);
    tmp = this.waittingEOI.pop();
    }
  tmp = this.stopped.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    this.suspended.append(tmp);
    tmp = this.stopped.pop();
    }
  if(this.channel.isPresent(m)){
    console.log("there's something to add "+m.actions.length);
    m.addDynPar(this);
    }
  else{
    /*console.log('par dyn testing at eoi'
          //, this.suspended.isEmpty()
          //, this.suspended.start
          , this.suspended
          //, this.waitting.isEmpty()
          //, this.waitting.start
          , this.waitting
          //, this.halted.isEmpty()
          //, this.halted.start
          , this.halted
          );*/
    if(this.suspended.isEmpty()
      && this.waitting.isEmpty()
      && this.halted.isEmpty()
      ){
        //console.log("terminate !");
        this.forceTermination = true;
      }
    }
  }
SC_ParDyn.prototype.reset = function(m){
  var tmp = this.suspended.pop();
  while(null != tmp){
    tmp.prg.reset(m);
    tmp = this.suspended.pop();
  }
  tmp = this.waittingEOI.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    //this.suspended.append(tmp);
    tmp = this.waittingEOI.pop();
  }
  tmp = this.stopped.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    //this.suspended.append(tmp);
    tmp = this.stopped.pop();
  }
  tmp = this.waitting.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    //this.suspended.append(tmp);
    tmp = this.waitting.pop();
  }
  tmp = this.halted.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    tmp.prg.reset(m);
    //this.suspended.append(tmp);
    tmp = this.halted.pop();
  }
  tmp = this.terminated.pop();
  while(null != tmp){
    tmp.flag = SC_Instruction_State.SUSP;
    //this.suspended.append(tmp);
    tmp = this.terminated.pop();
  }
  for(var i = 0; i < this.originalBranches.length; i++){
    //this.branches[i] = new SC_ParBranch(null, this, args[i]);
    this.suspended.append(this.originalBranches[i]);
    }
  this.channel.unregister(this);
  this.toRegister = true;
  this.forceTermination = false;
}
SC_ParDyn.prototype.registerForProduction = SC_Par.prototype.registerForProduction;
SC_ParDyn.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  //console.log(parbranch);
  var copy = new SC_ParDyn(this.channel);
  copy.mseq = masterSeq;
  copy.itsParent = parbranch;
  copy.cube = cube;
  var tmp = this.suspended.start;
  while(null != tmp){
    var b = new SC_ParBranch(parbranch, copy, SC_Nothing);
    b.prg = tmp.prg.bindTo(engine, b, null, masterSeq, b, cube);
    b.path = copy;
    //b.dynamicPar = true;
    copy.branches[copy.branches.length] = b;
    copy.originalBranches[copy.originalBranches.length] = b;
    if(b.hasPotential){
      if(undefined != b.itsParent){
        b.itsParent.hasPotential = true;
        }
      if(copy.prodBranches.indexOf(b)<0){
        copy.prodBranches.push(b);
        }
      }
    copy.suspended.append(b);
    tmp = tmp.next;
    }
  copy.path = path;
  return copy;
  }
SC_ParDyn.prototype.removeBranch = SC_Par.prototype.removeBranch;
SC_ParDyn.prototype.toString = function(){
  var res ="[";
  for(var i = 0; i < this.branches.length; i++){
    res += this.branches[i].prg.toString();
    res += (i<this.branches.length-1)?"||":"";
  }
  return res+"] ";
}
SC_ParDyn.prototype.generateValues = SC_Par.prototype.generateValues;
/*********
 * And Class
 *********/
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
SC_AndBin.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_AndBin();
  copy.c1 = binder(this.c1).bindTo(engine, parbranch, seq, masterSeq, path, cube)
  copy.c2 = binder(this.c2).bindTo(engine, parbranch, seq, masterSeq, path, cube)
  return copy;
  }
SC_AndBin.prototype.toString = function(){
  var res ="(";
  res += this.c1.toString()
          res += " /\ "+this.c2.toString()
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
    tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch, seq, masterSeq, path, cube));
    }
  var copy = new SC_And(tmp_configs);
  return copy;
  }
SC_And.prototype.toString = function(){
  var res ="("+this.c[0].toString();
  for(var i in this.c){
    res += " /\ "+this.c[i].toString()
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

/*********
 * Or Class
 *********/
function SC_OrBin(c1,c2){
  this.c1 = c1;
  this.c2 = c2;
  }
SC_OrBin.prototype ={
  isPresent : function(m){
  return this.c1.isPresent(m) || this.c2.isPresent(m);
  }
  , getAllValues : SC_AndBin.prototype.getAllValues
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
    var binder = _SC._b(cube);
    var copy = new SC_OrBin();
    copy.c1 = binder(this.c1).bindTo(engine, parbranch, seq, masterSeq, path, cube)
    copy.c2 = binder(this.c2).bindTo(engine, parbranch, seq, masterSeq, path, cube)
    return copy;
    }
  , toString : function(){
    var res ="(";
    res += this.c1.toString()
            res += " \/ "+this.c2.toString()
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var tmp_configs = [];
      //console.log("binding n-ary or", this.c);
      for(var i in this.c){
        tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch, seq, masterSeq, path, cube));
        }
      var copy = new SC_Or(tmp_configs);
      return copy;
      }
  , toString : function(){
    var res ="("+this.c[0].toString();
    for(var i in this.c){
      res += " \/ "+this.c[i].toString()
      }
    return res+") ";
    }
  , unregister : SC_And.prototype.unregister
  , registerInst : SC_And.prototype.registerInst
  }

/*
 * Cells
 */
function SC_Cell(params){
  if(undefined == params){
    throw "undefined params for Cell";
    }
  if(undefined != params.target){
    return new SC_ReCell(params);
    }
  this.state = (undefined == params.init)?null:params.init;
  if(undefined == params.sideEffect){
    throw "undefined sideEffect !";
    }
  else{
    if(undefined != params.sideEffect.t){
      this.sideEffect = params.sideEffect.t[params.sideEffect.f].bind(params.sideEffect.t);
      }
    else{
      this.sideEffect = params.sideEffect;
      }
    this.eventList = (undefined == params.eventList)?null:params.eventList;
    }
    this.TODO =  -1;
    this.futur = null;
    //this.self = (undefined == params.self)?null:params.self;
    this.clock = null;
  }
SC_Cell.prototype = {
  activate : function(m){
    if(this.TODO != m.getInstantNumber()){
      m.addCellFun(this);
      this.TODO = m.getInstantNumber();
      }
    this.reset(m);
    return SC_Instruction_State.TERM;
    }
  , getAllValues : function(m, vals){
      var vals = {};
      for(var i in this.eventList){
        if(this.eventList[i].isPresent(m)){
          this.eventList[i].getAllValues(m, vals);
          }
        }
      return vals;
      }
  , val : function(){
      return this.state;
      }
  , reset : NO_FUN
  , prepare : function(m){
      this.futur = this.sideEffect(this.state, this.getAllValues(m), m);
      }
  , swap : function(){
      this.state = this.futur;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      if(null === this.clock){
        this.clock = engine;
        }
      else if(this.clock !== engine){
        throw "Attempt to bind a cell to different clocks";
        }
      return this;
      }
  , toString : function(){
      return "compute "+this.sideEffect+" on "+this.state
             +((null == this.eventList)?"":" with "+this.eventList);
      }
}

function SC_ReCell(params){
  if(undefined == params.field || undefined == params.target[params.field]){
     throw "field not specified on target ("+params.field+")";
    }
  if(undefined == params.sideEffect){
    throw "undefined sideEffect !";
    }
  else{
    this.sideEffect = params.sideEffect;
    this.eventList = (undefined == params.eventList)?null:params.eventList;
    }
  this.target = params.target;
  this.field = params.field;
  this.TODO =  -1;
  this.futur = null;
  //this.self = (undefined == params.self)?null:params.self;
  Object.defineProperty(this, "state",{set : (function(nom, x){
      this[nom] = x;
    }).bind(this.target, this.field)
    , get: (function(nom){
      return this[nom];
    }).bind(this.target, this.field)
    }); 
  this.clock = null;
  }
SC_ReCell.prototype = {
  activate : SC_Cell.prototype.activate
  , getAllValues : SC_Cell.prototype.getAllValues
  , val : function(){
      return this.target[this.field];
      }
  , reset : NO_FUN
  , prepare : SC_Cell.prototype.prepare
  , swap : SC_Cell.prototype.swap
  , bindTo : SC_Cell.prototype.bindTo
  , toString : SC_Cell.prototype.toString
}

function SC_CubeCell(c){
  this.cellName = c;
  this.cell=null;
  this.cube=null;
  }
SC_CubeCell.prototype = {
  activate : function(m){
    /*if(null == this.cell){
      this.cell = this.cube[this.cellName];
      }*/
    return this.cell.activate(m);
    }
  , reset : function(m){
      this.cell.reset();
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var tgt = cube[this.cellName];
      if((tgt instanceof SC_Cell)||((tgt instanceof SC_ReCell))){
        return tgt.bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      var copy = new SC_CubeCell(this.cellName);
      copy.cube = cube;
      return copy;
      }
  , toString : function(){
      return "activ cell "+this.cellName;
      }
}

/*********
 * SC_Machine Class
 *********/
function SC_Machine(delay, params){
  this.prg = new SC_Par([]);
  //this.moved = true;
  this.instantNumber = 1;
  this.delay = delay;
  this.actions = [];
  this.actionsOnEvents = [];
  this.cells = [];
  this.prg.setPurgeable(true);
  this.pending = [];
  this.pendingPrograms = [];
  this.parActions = [];
  this.name = ((undefined === params)||(undefined === params.name))?"machine_"+SC.count:params.name;
  SC_cubify.apply(this);
  this.prg.cube = this;
  this.stdOut = NO_FUN;
  if(undefined != params){
    this.setStdOut(params.sortie);
    }
  this.traceEvt = SC.evt("traceEvt");
  /*this.traces = [];
  this.addTrace = function(msg){
    this.traces.push(msg);
    }*/
  if(undefined != params && undefined != params.init){
    this.addProgram(params.init);
    }
  else{
    this.addProgram(SC.pauseForever());
    }
  this.ips = 0;
  this.reactMeasuring = 0;
  if(this.delay > 0){
    this.timer = window.setInterval(
        (function(m){ return function(){m.react();}
         })(this)
        , this.delay);
    }
  else{
    this.delay = -1;
    this.run = function(){
      while(this.react())/*if(this.instantNumber > 20) break*/;
      }
    }
  this.handlers = {
    "click" : function(evt, e){
        this.generateEvent(e, {x:evt.pageX, y:evt.pageY
                    , cx:evt.clientX, cy:evt.clientY
                    , sx:evt.screenX, sy:evt.screenY
                    , ctrl: evt.ctrlKey, alt: evt.altKey
                    , btn:((undefined == evt.button)?-1:evt.button)
                    });
      }.bind(this),
    "keydown" : function(evt, e){
        //console.log("evt keydown");
        //console.log(evt);
        this.generateEvent(e, {which:evt.which, target: evt.target});
      }.bind(this),
    "keyup" : function(evt, e){
        //console.log("evt keyup");
        this.generateEvent(e, {which:evt.which
                              , keyCode: evt.keyCode
                              , target: evt.target});
      }.bind(this),
    "keypress" : function(evt, e){
        //console.log("evt keypress");
        this.generateEvent(e, {which:evt.which
                              , keyCode: evt.keyCode
                              , target: evt.target});
      }.bind(this),
    "mousedown" : function(evt, e){
        this.generateEvent(e, {x:evt.pageX, y:evt.pageY
                    , cx:evt.clientX, cy:evt.clientY
                    , sx:evt.screenX, sy:evt.screenY
                    , btn:((undefined == evt.button)?-1:evt.button)
                    , which: evt.which
                    , buttons : evt.buttons
                    });
      }.bind(this),
    "mousemove" : function(evt, e){
        this.generateEvent(e, {x:evt.pageX, y:evt.pageY
                    , cx:evt.clientX, cy:evt.clientY
                    , sx:evt.screenX, sy:evt.screenY
                    , btn:((undefined == evt.button)?-1:evt.button)
                    , which: evt.which
                    , buttons : evt.buttons
                    });
      }.bind(this),
    "mouseup" : function(evt, e){
        this.generateEvent(e, {x:evt.pageX, y:evt.pageY
                    , cx:evt.clientX, cy:evt.clientY
                    , sx:evt.screenX, sy:evt.screenY
                    , btn:((undefined == evt.button)?-1:evt.button)
                    , which: evt.which
                    , buttons : evt.buttons
                    });
      }.bind(this),
    "touchstart" : function(evt, e){
        var changes = evt.changedTouches;
        for(var i=0; i < changes.length; i++){
          this.generateEvent(e, {x:changes[i].pageX, y:changes[i].pageY
                      , cx:changes[i].clientX, cy:changes[i].clientY
                      , sx:changes[i].screenX, sy:changes[i].screenY
                      , id:changes[i].identifier
                      });
        }
      }.bind(this),
    "touchmove" : function(evt, e){
        var changes = evt.changedTouches;
        for(var i=0; i < changes.length; i++){
          this.generateEvent(e, {x:changes[i].pageX, y:changes[i].pageY
                      , cx:changes[i].clientX, cy:changes[i].clientY
                      , sx:changes[i].screenX, sy:changes[i].screenY
                      , id:changes[i].identifier
                      });
        }
      }.bind(this),
    "touchend" : function(evt, e){
        var changes = evt.changedTouches;
        for(var i=0; i < changes.length; i++){
          this.generateEvent(e, {x:changes[i].pageX, y:changes[i].pageY
                      , cx:changes[i].clientX, cy:changes[i].clientY
                      , sx:changes[i].screenX, sy:changes[i].screenY
                      , id:changes[i].identifier
                      });
        }
      }.bind(this),
    "touchcancel" : function(evt, e){
        var changes = evt.changedTouches;
        for(var i=0; i < changes.length; i++){
          this.generateEvent(e, {x:changes[i].pageX, y:changes[i].pageY
                      , cx:changes[i].clientX, cy:changes[i].clientY
                      , sx:changes[i].screenX, sy:changes[i].screenY
                      , id:changes[i].identifier
                      });
        }
      }.bind(this),
    "load" : function(evt, e){
          this.generateEvent(e, true);
        }.bind(this),
    "resize" : function(evt, e){
          this.generateEvent(e, {});
        }.bind(this),
    "orientationchange" : function(evt, e){
          this.generateEvent(e, {orientation:screen.orientation});
        }.bind(this),
    "online" : function(evt, e){
          this.generateEvent(e);
        }.bind(this),
    "offline" : function(evt, e){
          this.generateEvent(e);
        }.bind(this),
    "storage" : function(evt, e){
          this.generateEvent(e);
        }.bind(this)
  };
  this.systemEvent = function(target, name){
    if(this.handlers.hasOwnProperty(name)){
      var SC_event = new SC_Sensor(""+target+name, true);
      var handler = this.handlers[name];
      target.addEventListener(name, function(evt){
         handler(evt,SC_event)});
      return SC_event;
    }
  }
}
SC_Machine.prototype = 
{
  constructor : SC_Machine
  , setStdOut : function(stdout){
      this.stdOut = NO_FUN;
      if((undefined != stdout)&&("function" == typeof(stdout))){
        this.stdOut = stdout;
        }
      }
  /* internal */
  , addCellFun : function(aCell){
      this.cells.push(aCell);
      }
  , generateEvent : function(evt, val){
      if(undefined == evt){
        throw "undefined event !";
        }
      this.pending.push({e:evt, v:val});
      }
  , addProgram : function(p){
      if(undefined == p){ /* more checks to do */
        throw "program to add not defined";
        }
      this.pendingPrograms.push(p);
      }
  , addEvtFun : function(f){
      this.actionsOnEvents.push(f);
      }
  , addFun : function(fun){
      this.actions.push(fun);
      }
  , getInstantNumber : function(){
      return this.instantNumber;
      }
  , getTopLevelParallelBranchesNumber : function(){
      return this.prg.branches.length;
      }
  , addDynPar : function(p){
      this.parActions.push(p);
      }
  , setRunningDelay : function(d){
      if(isNan(d) || d <= 0){
        console.log("negative delay");
        return;
        }
      this.delay = d;
      if(this.timer != 0){
        window.clearInterval(this.timer);
        this.timer = 0;
        }
      this.timer = window.setInterval(function(){this.react();}.bind(this), this.delay);
      }
  , setKeepRunningTo : function(b){
      if(this.timer != 0){
        if(b){
          return;
          }
        window.clearInterval(this.timer);
        this.timer = 0;
        }
      else{
        if(b){
          this.timer = window.setInterval(function(){this.react();}.bind(this), this.delay);
          }
        }
      }
  , react : function(){
      var res = SC_Instruction_State.STOP;
      var tmp = this.pending;
      this.pending=[];
      for(var n in tmp){
        if(tmp[n].e instanceof SC_Sensor){
          tmp[n].e.systemGen(tmp[n].v, this, true);
          }
        else{
          tmp[n].e.generate(this, true);
          tmp[n].e.generateValues(this, tmp[n].v);
          }
        //this.moved = true;
        }
      tmp = this.pendingPrograms;
      this.pendingPrograms = [];
      for(var i in tmp){
        this.prg.addBranch(tmp[i], null, this);
        }
      this.actions = [];
      this.actionsOnEvents = [];
      this.cells = [];
      this.parActions = [];
      this.stdOut("\n"+this.instantNumber+" -: ");
      // Phase 1 : pure reactive execution
      while(SC_Instruction_State.SUSP == (res = this.prg.activate(this)) /*&& this.moved*/){
        //this.moved = false;
      }
      //console.log("res = ",res);
      //this.moved = false;
      if((SC_Instruction_State.SUSP == res)||(SC_Instruction_State.WEOI == res)){
        this.prg.eoi(this);
        res = SC_Instruction_State.STOP;
      }
      // Phase 2 : collecting event values
      if(this.prg.hasProduction){
        this.prg.generateValues(this);
      }
      // Phase 3 : atomic computations
      for(var cell in this.cells){
        this.cells[cell].prepare(this);
        }
      for(var i = 0; i < this.actionsOnEvents.length; i++){
        var act = this.actionsOnEvents[i];
        var a = act.action;
        var vals = {};
        act.config.getAllValues(this, vals);
        if(null != a.f){
          var t = a.t;
          if(null == t) continue;
          t[a.f].call(t,vals, this);
          }
        else{
          a(vals, this);
          }
        }
      for(var i = 0; i < this.actions.length; i++){
        var act = this.actions[i];
        if(null != act.f){
          var t = act.t;
          if(null == t) continue;
          t[act.f].call(t,this);
          }
        else{
          act(this);
          }
        }
      // Phase 4 : swap states
      for(var cell in this.cells){
        this.cells[cell].swap();
        //var zeCell = this.cells[cell];
        //zeCell.state = zeCell.futur;
        }
      for(var i = 0; i < this.parActions.length; i++){
        this.parActions[i].computeAndAdd(this);
        }
      if(this.traceEvt.isPresent(this)){
        console.log.call(console, this.traceEvt.getValues(this));
        }
      this.instantNumber++;
      if(this.delay > 0 && res == SC_Instruction_State.TERM && (null != this.timer)){
        window.clearInterval(this.timer)
      }
      if(0 == this.instantNumber%256){
        if(0 != this.reactMeasuring){
          this.ips = Math.floor(this.instantNumber*10000
                            /(window.performance.now()-this.reactMeasuring))/10;
        }
        else{
          if(undefined == window.performance){
            window.performance = {now:function(){
                         return new Date().getTime();
                         }
                       };
          }
          this.reactMeasuring = window.performance.now();
          }
        }
      /*if(this.traces.length>0){
        console.log.call(console, this.traces);
        this.traces = [];
      }*/
      if(SC_Instruction_State.TERM == res){
        console.log("machine stops");
        }
      return res != SC_Instruction_State.TERM;
      }
  , getIPS : function(){
      return this.ips;
      }
  , reactASAP : function(){
      window.setInterval(
          (function(m){ return function(){m.react();}
           })(this));
      }
  };

/*********
 * Kill Class
 *********/
function Kill(c, p, h){
  if(undefined == h){
    h = SC_Nothing;
  }
  this.state = SC_Instruction_State.SUSP;
  this.c = c;
  this.p = p;
  this.h = h;
  this.path = null;
}
Kill.prototype.activate = function(m){
  if(this.state == SC_Instruction_State.TERM){
    var res = this.h.activate(m);
    if(SC_Instruction_State.TERM == res){
      this.reset(m);
      }
    return res;
    }
  if(this.state == SC_Instruction_State.SUSP){
    this.state = this.p.activate(m);
    if(SC_Instruction_State.TERM == this.state){
      this.p.reset(m);
      this.state = SC_Instruction_State.SUSP;
      return SC_Instruction_State.TERM;
      }
    }
  return (SC_Instruction_State.SUSP != this.state)?SC_Instruction_State.WEOI:SC_Instruction_State.SUSP;
  }
Kill.prototype.awake = function(m, flag){
  var res = false;
  switch(this.state){
    case SC_Instruction_State.WAIT:
    case SC_Instruction_State.WEOI:{
      res = this.path.awake(m, flag);
      if(!res){
        return false;
        }
      this.state = SC_Instruction_State.SUSP;
      }
    case SC_Instruction_State.SUSP: return true;
    case SC_Instruction_State.TERM:{
      res = this.path.awake(m, flag);
      return res;
      }
    }
  return false;
  }
Kill.prototype.eoi = function(m){
  if((SC_Instruction_State.TERM != this.state) && this.c.isPresent(m)){
    if(SC_Instruction_State.WEOI == this.state){
      this.p.eoi(m);
      }
    this.p.reset(m);
    this.state = SC_Instruction_State.TERM;
    }
  else if(this.state == SC_Instruction_State.WEOI){
    this.p.eoi(m);
    this.state = SC_Instruction_State.SUSP;
    }
  else if(this.state == SC_Instruction_State.STOP){
    this.state = SC_Instruction_State.SUSP;
    }
  else if(this.state == SC_Instruction_State.TERM){
    this.h.eoi(m);
    }
  }
Kill.prototype.reset = function(m){
  if(this.state != SC_Instruction_State.TERM){
    this.p.reset(m);
  }
  else{
    this.h.reset(m);
  }
  this.state = SC_Instruction_State.SUSP;
}
Kill.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);  
  var copy = new Kill();
  if(this.c instanceof SC_CubeBinding){
    copy.c = binder(this.c);
    }
  else{
    copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube);
    }
  copy.p = this.p.bindTo(engine, parbranch, null, masterSeq, copy, cube);
  copy.h = this.h.bindTo(engine, parbranch, null, masterSeq, copy, cube);
  copy.path = path;
  return copy;
}
Kill.prototype.toString = function(){
  return "kill "+this.p.toString()
          +" on "+this.c.toString()
          +((null != this.h)?"handle "+this.h:"")
          +" end kill ";
}

/*********
 * Control Class
 *********/
function Control(c, p){
  this.c = c;
  this.p = p;
  this.state = SC_Instruction_State.SUSP;
  this.toRegister = true;
  this.path = null;
}
Control.prototype.activate = function(m){
  /*var dbg = ((undefined !== this.p.seqElements[0].branches)
      && (undefined !== this.p.seqElements[0].branches[0].prg.evt)
      && ("clickTarget" == this.p.seqElements[0].branches[0].prg.evt.name));*/
  if(this.toRegister){
    /*if(dbg){
      console.log("register", this.c);
      }*/
    this.c.registerInst(m, this);
    this.toRegister = false;
    }
  if(this.c.isPresent(m)){
   //console.log("SC_Control.activate() : config present");
    if(SC_Instruction_State.SUSP == this.state){
      /*if(dbg){
        console.log("SC_Control.activate() : activate prg");
        }*/
      this.state = this.p.activate(m);
      /*if(dbg){
        console.log("SC_Control.activate() : ------------("+this.state+")");
        }*/
      }
    if(SC_Instruction_State.STOP == this.state){
      this.state = SC_Instruction_State.SUSP;
      return SC_Instruction_State.STOP;
      }
    if(SC_Instruction_State.TERM == this.state){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    return this.state;
    }
  return SC_Instruction_State.WAIT;
  }
Control.prototype.wakeup = function(m, flag){
  /*var dbg = ((undefined !== this.p.seqElements[0].branches)
      && (undefined !== this.p.seqElements[0].branches[0].prg.evt)
      && ("clickTarget" == this.p.seqElements[0].branches[0].prg.evt.name));
  if(dbg){
    console.log("SC_Control.wakeup()");
    }*/
  this.awake(m, flag, true);
  return false;
  }
Control.prototype.awake = function(m, flag, me){
  //console.log(this.p);
  /*var dbg = ((undefined !== this.p.seqElements[0].branches)
      && (undefined !== this.p.seqElements[0].branches[0].prg.evt)
      && ("clickTarget" == this.p.seqElements[0].branches[0].prg.evt.name));
  if(dbg){
    console.log("SC_Control.awake() : on se reveille", this.p);
    }*/
  if(this.c.isPresent(m)){
    /*if(dbg){
      console.log("SC_Control.awake() : config ok");
      }*/
    var res = this.path.awake(m, flag);
    if(res && !me){
      /*if(dbg){
        console.log("SC_Control.awake() : awake prg", this.p);
        }*/
      this.state = SC_Instruction_State.SUSP;
      }
    return res;
    }
  if(me){
    //console.log("control awake");
    return false;
    }
  else{
    //console.log("body of control awake");
  }
  this.state = SC_Instruction_State.SUSP;
  return true;
  }
Control.prototype.eoi = function(m){
  if(this.c.isPresent(m) && ((SC_Instruction_State.SUSP == this.state)||(SC_Instruction_State.WEOI == this.state))){
    this.p.eoi(m);
  }
  if(SC_Instruction_State.STOP >= this.state){
    this.state = SC_Instruction_State.SUSP;
  }
}
Control.prototype.reset = function(m){
  this.p.reset(m);
  this.c.unregister(this);
  this.toRegister = true;
  this.state = SC_Instruction_State.SUSP;
}
Control.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var copy = new Control();
  copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube);
  copy.p = this.p.bindTo(engine, parbranch, null, masterSeq, copy, cube);
  copy.path = path;
  return copy;
}
Control.prototype.toString = function(){
  return "control "+this.p.toString()
          +" by "+this.c.toString()
          +" end control ";
}

/*********
 * SC_Cube Class
 *********/
function SC_Cube(o, p, lastWill){
  this.o = o;
  this.p = p;
  this.lastWill = (undefined != lastWill)?lastWill:NO_FUN;
  //console.log("cube last will", this.lastWill);
  this.toAdd = [];
  //this.addProgram = this.addFirst;
}
SC_Cube.prototype = {
  constructor : SC_Cube
  , activate : function(m){
      return this.p.activate(m);
      }
  , eoi : function(m){
    this.p.eoi(m);
    }
  , reset : function(m){
      m.addFun(this.lastWill);
      this.p.reset(m);
      }
  /*, addSecond: function(p){
    //console.log("adding second", p);
    this.dynamic.addBranch(p, this.pb, this.m);
    }*/
  , addProgram : function(p){
    //console.log("adding first", p);
    this.toAdd.push(p);
    }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      //console.log("adding on bind");
      var binder = _SC._b(this);
      var tmp_par = SC.par();
      var tmp_par_dyn;
      if(undefined !== this.o.SC_cubeAddBehaviorEvt){
        console.log("warning javascript object already configured !"
                    +"Be sure that it is not used bound to another program, especially in a different reactive machine");
        }
      else{
         SC_cubify.apply(this.o);
         tmp_par.add(
           SC.repeat(SC.forever
             , SC.await(SC.or(this.o.SC_cubeCellifyEvt, this.o.SC_cubeAddCellEvt))
             , this.o.$SC_cellMaker
             )
           );
        }
      const dieEvt = this.o.SC_cubeKillEvt;
      tmp_par.add(SC.seq(tmp_par_dyn = SC.parex(this.o.SC_cubeAddBehaviorEvt
                         , this.p
                        )
                     //, SC.log("cube finished will die")
                     , SC.generate(dieEvt)
                     ));
      for(var i = 0 ; i < this.toAdd.length; i++){
        //console.log("adding on bind", this.toAdd[i]);
        tmp_par_dyn.add(this.toAdd[i]);
        }
      var tmp_beh = SC.kill(
        dieEvt
        , tmp_par
        );
      var copy = new SC_Cube(this.o, tmp_beh.bindTo(engine, parbranch, null, masterSeq, path, this.o), binder(this.lastWill));
      if(copy.lastWill.f && copy.lastWill.t){
        copy.lastWill = copy.lastWill.t[copy.lastWill.f].bind(copy.lastWill.t);
        }
      else{
        copy.lastWill = copy.lastWill;
        }
      copy.dynamic = tmp_par_dyn;
      copy.toAdd = undefined;
      //copy.addProgram = copy.addSecond;
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
/*  , me : function(){
    return this.o;
    }*/
  , addCell : function(nom, init, el, fun){
      var tgt = this.o;
      if(undefined !== fun){
        tgt["_"+nom] = fun;
        }
      if(undefined === tgt["_"+nom]){
        throw "no affectator for "+nom+" cell is defined";
        }
      tgt["$"+nom] = new SC_Cell({init:init, sideEffect: (tgt["_"+nom]).bind(tgt), eventList: el});
      Object.defineProperty(tgt, nom,{get : (function(nom){
        return tgt["$"+nom].val();
        }).bind(tgt, nom)});
      }
  };

/*********
 * When Class
 *********/
function When(c, t, e){
  this.c = c;
  this.t = t;
  this.e = (null == e)?SC_Nothing:e;
  this.choice = null;
  this.path = null;
}
When.prototype = {
  activate : function(m){
    if(null != this.choice){
      var res = this.choice.activate(m);
      if(SC_Instruction_State.TERM == res){
        this.reset(m);
        }
      return res;
      }
    if(this.c.isPresent(m)){
      this.choice = this.t;
      var res = this.choice.activate(m);
      if(SC_Instruction_State.TERM == res){
        this.reset(m);
        }
      return res;
      }
    this.c.registerInst(m, this);
    return SC_Instruction_State.WEOI;
    }
  , wakeup : function(m, flag){
      return this.awake(m, flag, true);
      }
}
When.prototype.awake = function(m, flag, me){
  if(null == this.choice){
    if(this.c.isPresent(m)){
      return this.path.awake(m, flag);
      }
    if(!me){
      throw "When pb on awake";
    }
    return false;
    }
  return this.path.awake(m, flag);
  }
When.prototype.eoi = function(m){
  if(null == this.choice){
    this.c.unregister(this);
    this.choice = this.e;
  }
  else{
    this.choice.eoi(m);
  }
}
When.prototype.reset = function(m){
  if(null != this.choice){
    //console.log("resting choice", this.choice);
    this.choice.reset(m);
  }
  this.choice = null;
  this.c.unregister(this);
}
When.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var copy = new When();
  copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube)
  copy.t = this.t.bindTo(engine, parbranch, null, masterSeq, copy, cube)
  copy.e = this.e.bindTo(engine, parbranch, null, masterSeq, copy, cube)
  copy.path = path;
  return copy;
}
When.prototype.toString = function(){
  return "when "+this.c.toString()
          +" then "+this.t.toString()
          +"else "+this.e.toString()
          +" end when ";
}

/*********
 * SC_Test Class
 *********/
function SC_Test(b, t, e){
  this.b = b;
  this.t = t;
  this.e = (null == e)?SC_Nothing:e;
  this.choice = null;
  this.path = null;
}
SC_Test.prototype = {
  constructor : SC_Test
  , activate : function(m){
      if(null != this.choice){
        var res = this.choice.activate(m);
        if(SC_Instruction_State.TERM == res){
          this.reset(m);
          }
        return res;
        }
      if(this.test(m)){
        this.choice = this.t;
        }
      else{
        this.choice = this.e;
        }
      var res = this.choice.activate(m);
      if(SC_Instruction_State.TERM == res){
        this.reset(m);
        }
      return res;
      }
  , test : function(m){
      if("function" == typeof(this.b)){
        return this.b(m);
        }
      return (((null == this.b.t)?this.b:this.b.t[this.b.f]));
      }
  , awake : function(m, flag){
      return this.path.awake(m, flag);
      }
  , eoi : function(m){
      this.choice.eoi(m);
      }
  , reset : function(m){
      if(null != this.choice){
        this.choice.reset(m);
        }
      this.choice = null;
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Test(binder(this.b));
      //console.log("testing : ", copy.b);
      copy._b = this.b;
      //console.log("SC.test condition = "+copy.b);
      copy.t = this.t.bindTo(engine, parbranch, null, masterSeq, copy, cube);
      copy.e = this.e.bindTo(engine, parbranch, null, masterSeq, copy, cube);
      copy.path = path;
      return copy;
      }
  , toString : function(){
      return "test "+this.b.toString()
              +" then "+this.t.toString()
              +"else "+this.e.toString()
              +" end test ";
      }
};

/*********
 * Match Class
 *********/
function Match(val, cases){
  this.v = val;
  this.cases = cases;
  this.choice = null;
  this.path = null;
}
Match.prototype.activate = function(m){
  if(null != this.choice){
    var res = this.choice.activate(m);
    if(SC_Instruction_State.TERM == res){
      //this.choice.reset(m);
      this.reset(m);
    }
    return res;
  }
  var val = (null == this.v.t)?eval(this.v.f):this.v.t[this.v.f];
  this.choice = this.cases[val];
  if(undefined == this.choice){
    this.choice = SC_Nothing;
    }
  var res = this.choice.activate(m);
  if(SC_Instruction_State.TERM == res){
    //this.choice.reset(m);
    this.reset(m);
  }
  return res;
}
Match.prototype.awake = function(m, flag){
  return this.path.awake(m, flag);
  }
Match.prototype.eoi = function(m){
  this.choice.eoi(m);
}
Match.prototype.reset = function(m){
  if(null != this.choice){
    this.choice.reset(m);
  }
  this.choice = null;
}
Match.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var copy = new Match(this.v,new Array(this.cases.length));
  for(var n in this.cases){
    copy.cases[n] = this.cases[n].bindTo(engine, parbranch, null, masterSeq, copy, cube);
  }
  copy.path = path;
  return copy;
}
Match.prototype.toString = function(){
  var choices = "";
  for(var v in this.cases){
      choices += "{ "+v+" : "+this.cases[v]+"}"
    }
  return "match "+this.v+" selsect "+choices
          +" end match ";
  }

/*********
 * SC_Trace Class
 *********/
/*function SC_Trace(msg){
  this.msg = msg;
}
SC_Trace.prototype = {
  activate : function(m){
    m.addTrace(this.msg);
    return SC_Instruction_State.TERM;
    }
  , reset : function(m){}
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      return new SC_Trace(this.msg);
      }
  , toString : function(){
      return "trace(\""+this.msg+"\") ";
  }
};*/


function SC_ValueWrapper(tgt, n){
  this.tgt = tgt;
  this.n = n;
  }

SC_ValueWrapper.prototype.getVal = function(){
  return this.tgt[this.n];
  }
SC = {
  evt: function(name){
    return new SC_Event(name);
    },
  sensor: function(name){
    return new SC_Sensor(name);
    },
  machine: function(delay, initParams){
    return new SC_Machine(delay, initParams);
    },
  pauseForever: function(){
    return SC_PauseForever;
  },
  nothing: function(){
    return SC_Nothing;
    },
  purge: function(prg){
    return (undefined == prg)?VOID_NODE:prg;
    },
  nop: function(){
    return SC_Nothing;
    },
  pauseRT: function(n){
    return new SC_PauseRT(_SC.b_(n));
  },
  myPause: function(cell){
    return new SC_CubePause(_SC.b_(cell));
  },
  pause: function(n){
    return new SC_Pause(_SC.b_(n));
  },
  await: function(config){
    if(undefined == config){
      throw "config not defined";
      }
    return new SC_Await(_SC.b_(config));
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
  function(n){
    var prgs = [];
    var jump = 1;
    prgs[0] = new SC_LoopPoint(n);
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i] = arguments[i];
      if(prgs[i] instanceof SC_Seq){
        jump+= prgs[i].seqElements.length;
        }
      else{
        jump++;
        }
    }
    var end = new SC_RelativeJump(-(jump+1));
    prgs[prgs.length] = end;
    //end.relativeJump = -prgs.length;
    prgs[0].end = jump;
    //var t = new Repeat(n, prgs);
    var t = new SC_Seq(prgs);
    return t;
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
    var end = new SC_RelativeJump(-(jump+1));
    prgs[prgs.length] = end;
    //end.relativeJump = -prgs.length;
    prgs[0].end = jump;
    //var t = new Repeat(n, prgs);
    var t = new SC_Seq(prgs);
    return t;
  },
  exit: function(n){
    return new SC_Exit(n);
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
    //console.log("or with ", tmp);
    return new SC_Or(tmp);
  },
  kill: function(c,p,h){
    _SC.checkConfig(c);
    return new Kill(c, p, h);
  },
  control: function(c){
    _SC.checkConfig(c);
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i-1] = arguments[i];
    }
   return new Control(c, new SC_Seq(prgs));
  },
  when: function(c,t,e){
    _SC.checkConfig(c);
    return new When(c,t,e);
  },
  test: function(b,t,e){
    return new SC_Test(b,t,(null == e)?SC_Nothing:e);
  },
  match: function(val){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i-1] = arguments[i];
    }
    return new Match(val, prgs);
  },
  matches: function(val,branches){
    return new Match(val, branches);
  },
  filter: function(s,e,f,t,n){
    return new SC_Filter(_SC.b_(s)
                       , _SC.b_(e)
                       , _SC.b_(f)
                       , _SC.b_(t)
                       , _SC.b_(n));
  },
  cube: function(o, p, lastWill){
    return new SC_Cube(o, p, lastWill);
  },
  mark: function(f){
    return new Mark(f);
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
    function act(msg){
      console.log(msg);
      }
    //console.log("preparing log for : ",msg);
    return SC.action(act.bind(null, msg));
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
      //console.log("sending ",evt, v);
      this.generateEvent(evt, v);
      }.bind(m, evt, v))
    },
  next: function(delay){
    if(undefined === delay){
      delay = 0;
      }
    if(delay < 0){
      throw "invalid delay : "+delay;
      }
    return SC.action(function(delay, m){
      setTimeout(m.react.bind(m), delay);
      }.bind(null, delay));
    },
  writeInConsole:function(){
    console.log.call(console,arguments);
    },
  forever: -1
};

function Mark(f){
  this.f = f;
  }
Mark.prototype.activate = function(m){
  this.f(m);
  return SC_Instruction_State.TERM;
  }
Mark.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var copy = new Mark(this.f);
  return copy;
}

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

//-- ReactiveWorld
function SC_ReactiveWorld(){
  this.events = {};
  this.machine = SC.machine();
  }
SC_ReactiveWorld.prototype.include = function(aSource){
  var zeRes = SC.lang.parse(aSource, this);
  }
SC_ReactiveWorld.prototype.react = function(){
  //console.log("react");
  return this.machine.react();
  }

//-- Definition
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

//-- GlobalDef
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
  //console.log(this.id.substr(0,1));
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

//-- SC_ParDef
function SC_ParDef(p1, p2){
  this.content = Array.prototype.concat([p1], p2);
  //console.log("pardef ", this.content, p1, p2);
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
      //console.log("par adding = "+node.result);
      }
    }
  //console.log("par prg = ", this.result);
  //console.log("par prg = "+this.result);
  return res;
  }

//-- SC_ParOpDef
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

//-- SC_SeqDef
function SC_SeqDef(p1, p2){
  this.content = Array.prototype.concat([p1], p2);
  //console.log("seqdef ", this.content, p1, p2);
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
    //console.log("in seq = ", node);
    if(node.processable){
      res += node.process(env);
      this.result.add(node.result);
      }
    }
  //console.log("seq res = ", this.result)
  return res;
  }

//-- SC_SeqOpDef
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
//-- SC_BoolANDOPDef
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

//-- SC_PauseDef
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
  //console.log("pause... ", times, this.forever, this.times);
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
    //console.log("pause forever");
    this.result = SC.pauseForever();
    }
  else{
    //console.log("pause ", this.times);
    var steps = (undefined == this.times)?undefined:this.times.val;
    //console.log(typeof steps);
    this.result=SC.pause(steps);
  }
  return res;
  }

//-- SC_ParenDef
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

//-- SC_RepeatDef
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
    //console.log('repeat forever', this.body, this.body[5].result);
    this.result = SC.repeat(SC.forever, this.body[5].result);
    }
  else{
    //console.log('repeat '+this.body[1][1][0].val+' times', this.body, this.body[5].result);
    this.result = SC.repeat(this.body[1][1][0].val, this.body[5].result);
    }
  return res;
  }

//-- SC_KillDef
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
  //console.log('kill', this.body, evt, this.body[2].result);
  this.result = SC.kill(evt, this.body[8].result);
  return res;
  }

//-- SC_LogDef
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

//-- SC_AwaitDef
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

//-- SC_GenerateDef
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

//-- SkipDef
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

//-- Spaces
function SC_Spaces(str){
  this.text = str;
  }
SC_Spaces.prototype.html = function(){
  return this.text;
  }
SC_Spaces.prototype.process = function(env){
  return "";
  }

//-- Comments
function SC_Comment(str){
  this.text = str;
  }
SC_Comment.prototype.html = function(){
  return "<span class='comment'>"+this.text+"</span>";
  }
SC_Comment.prototype.process = function(env){
  return "";
  }

//-- SC_Keyword
function SC_Keyword(str){
  this.text = str;
  }
SC_Keyword.prototype.html = function(){
  return "<span class='keyword'>"+this.text+"</span>";
  }
SC_Keyword.prototype.process = function(env){
  return "";
  }

//-- SC_KeywordVal
function SC_KeywordVal(str){
  this.text = str;
  }
SC_KeywordVal.prototype.html = function(){
  return "<span class='constante'>"+this.text+"</span>";
  }
SC_KeywordVal.prototype.process = function(env){
  return "";
  }

//-- SC_Ponctuation
function SC_Ponctuation(str){
  this.text = str;
  }
SC_Ponctuation.prototype.html = function(){
  return this.text;
  }
SC_Ponctuation.prototype.process = function(env){
  return "";
  }

//-- SC_FieldIDDef
function SC_FieldIDDef(str){
  this.text = str;
  }
SC_FieldIDDef.prototype.html = function(){
  return "<span class='field_id'>"+this.text+"</span>";
  }
SC_FieldIDDef.prototype.process = function(env){
  return "";
  }

//-- SC_EventIDDef
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

//-- SC_SensorIDDef
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

//-- SC_NumberDef
function SC_NumberDef(str){
  this.val = parseInt(str);
  //console.log("num = ", str, this.val);
  }
SC_NumberDef.prototype.html = function(){
  return "<span class='number'>"+this.val+"</span>";
  }
SC_NumberDef.prototype.process = function(env){
  return "";
  }

//-- Module
function SC_Module(args){
  var a = Array.prototype.slice.call(args);
  this.content = [];
  this.globalEvents = [];
  this.localEvents = [];
  this.myRW = null;
  //console.log("a = ",a);
  for(var i = 0; i < args.length; i++){
    var n = args[i];
    //console.log("node",n);
    this.content.push(n);
    }
  }
SC_Module.prototype.html = function(){
  var res = "";
  for(var i in this.content){
    res += (this.content[i]).html();
    }
  //console.log(res);
  return res;
  }
SC_Module.prototype.process = function(aRW){
  var res = "processing a module<br>";
  this.myRW = aRW;
  /* processing definitions */
  var defs = this.content[1];
  if(undefined !== defs){
    res += defs.process(this);
    }
  for(var i in this.globalEvents){
    var evt = this.globalEvents[i];
    //console.log("evt to define ", evt);
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
  //console.log("ze script", this.result);
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
        //console.log("grammar = ",me.grammar);
        me.parser = peg.generate(me.grammar);
        //console.log("parser = ",me.parser);
        if(null !== me.parser){
          for(var i in me.pendingParsing){
            //console.log("parsing...", me.pendingParsing[i]);
            me.parse(me.pendingParsing[i], me.pendingParsing[i].RW);
            }
          }
        }
      }
    //console.log("loading");
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
    //console.log("parser exists...");
    var zePrg = this.parser.parse(aSource.toParse);
    //console.log(zePrg);
    if(undefined != aSource.onParsed){
      aSource.onParsed(zePrg.html());
      }
    var zeLog = zePrg.process(aSource.RW);
    if(undefined != aSource.onBuilt){
      aSource.onBuilt(zeLog);
      }
    aSource.RW.machine.addProgram(zePrg.result);
    return zePrg;
    }
  this.pendingParsing.push(aSource);
  }
  return SC;
})();
