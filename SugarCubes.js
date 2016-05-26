/*
 * SugarCubes.js
 * Author : Jean-Ferdy Susini
 * Created : 2/12/2014 9:23 PM
 * version : 5.0 alpha
 * implantation : 0.8.3
 * Copyright 2014-2015.
 */

SC = (function(){

function NO_FUN(){}

const SC_Instruction_State = {
  SUSP:1
  , WEOI:2
  , OEOI:3
  , STOP:4
  , WAIT:5
  , HALT:6
  , TERM:7
  , str :[ "undefined !"
    , "SUSP:1"
    , "WEOI:2"
    , "OEOI:3"
    , "STOP:4"
    , "WAIT:5"
    , "HALT:6"
    , "TERM:7"
    ]
  , toString: function(state){
      return str[state];
      }
};

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
  this.isFun = false;
  this.args = null;
  }
SC_CubeBinding.prototype = {
  resolve : function(){
    if(null == this.cube){
      throw "cube is null or undefined !";
      }
    var tgt = this.cube[this.name];
    if(undefined == tgt){
      return this;
      }
    if(this.isFun){
      tgt = tgt.bind(this.cube, this.args);
      }
    else if("function" == typeof(tgt)){
      tgt = tgt.bind(this.cube);
      }
    return tgt;
    }
  , setArgs(a){
      this.isFun = true;
      this.args = a;
      }
  , toString : function(){
      return "@."+this.name+"";
      }
  , isBinding : true
  };
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
 * en fixant l'objet cube sur lquel il porte pour réaliser une late binding ou
 * un binding dynamique.
 */
  , _b : function(cube){
      return function(o){
           if(o instanceof SC_CubeBinding){
             if((undefined != o.cube) && (this !== o.cube)){
               throw "invalid cube set on binding : "+o.cube;
               }
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
}
SC_Event.prototype = {
  isEvent:true
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
      if(!this.isPresent(m)){
        this.its = m.instantNumber;
        this.vals = [];
        this.wakeupAll(m, flag);
        }
      }
  , generateValues : function(m, val){
      if(undefined !== val){
        this.vals.push(val);
        }
      else{
	console.log("generating undefined value...");
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
      this.registeredInst[this.registeredInst.length] = inst;
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
  isSenor:true
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
  activate : function(m){
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

// *** Loops
function SC_LoopPointForever(end){
  this.seq = null;
  this.mseq = null;
  this.stopInst = null;
  this.end = end;
}
SC_LoopPointForever.prototype = {
  activate : function(m){
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
  activate : function(m){
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
      this.count = this.it;
      }
  , toString : function(){
      return "repeat "
                  +((this.it<0)?"forever ":this.count+"/"+this.it+" times ");
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_RepeatPoint(this.it, this.end);
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
function SC_Await(config){
  this.config = config;
  this.path = null;
}
SC_Await.prototype = {
  activate : function(m){
    if(this.config.isPresent(m)){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    this.config.registerInst(m, this);
    return SC_Instruction_State.WAIT;
    }
  , wakeup : function(m, flag){
      var res = this.config.isPresent(m);
      if(res){
        res = this.path.awake(m, flag);
        }
      return res;
      }
  , reset : function(m){
      this.config.unregister(this);
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_config = binder(this.config);
      var copy = new SC_Await(bound_config.bindTo(engine, parbranch, seq, masterSeq, path, cube));
      copy._config = this.config;
      copy.path = path;
      return copy;
      }
  , toString : function(){
      return "await "+this.config.toString()+" ";
      }
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
  activate : SC_GenerateForeverLateEvtNoVal.prototype.activate
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
           var copy = new SC_GenerateForeverNoVal(this.evt);
           copy._evt = this.evt;
           return copy;
           }
  , reset : NO_FUN
  , toString : SC_GenerateForeverLateEvtNoVal.prototype.toString
  }

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
  /*if("setBorder"==evt.name){
    console.log("building", this);
    } */
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
          b   +this.count+"/"+this.times+" times ";
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
var SC_Nothing = {
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
var SC_PauseForever = {
}
SC_PauseForever = {
  activate : function(m){
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
function SC_Pause(times){
  if(times < 0){
    return SC_PauseForever;
    }
  if(0 == times){
    return SC_Nothing;
    }
  this.count = this.times = (undefined == times)?1:times;
}
SC_Pause.prototype = {
  activate : function(m){
    if(0 == this.count){
      this.reset(m);
      return SC_Instruction_State.TERM;
      }
    this.count--;
    return SC_Instruction_State.STOP;
    }
  , reset : function(m){
      this.count = this.times;
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
      this.seqElements[targetIDx++] = seqElements[i];
      }
    }
  this.idx = -1;
  this.activate = this.first;
  this.toReset = [];
  }
SC_Seq.prototype = {
  register4Reset : function(client){
    this.toReset[this.toReset.length] = client;
    }
  , act : function(m){
      //console.log("Seq_act", this.idx, this.seqElements.length);
      var res = SC_Instruction_State.TERM;
      while(SC_Instruction_State.TERM == res){
        if(this.idx >= this.seqElements.length){
           this.reset(m);
           return SC_Instruction_State.TERM;
          }
        res = this.seqElements[this.idx].activate(m);
        if(SC_Instruction_State.TERM == res){
          this.idx++;
          }
        }
      return res;
      }
  , awake : function(m, flag){
      return this.path.awake(m, flag);
      }
  , first : function(m){
      this.idx = 0;
      this.activate = this.act;
      var tmp = this.activate(m);
      return tmp;
      }
  , eoi : function(m){
      this.seqElements[this.idx].eoi(m);
      }
  , reset : function(m){
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Seq(new Array(this.seqElements.length));
      if(undefined === masterSeq){
        masterSeq = copy;
        }
      for(var i = 0; i < this.seqElements.length; i++){
        copy.seqElements[i] = this.seqElements[i].bindTo(engine, parbranch, copy
                                                         , masterSeq, copy, cube);
        }
      copy.path = path;
      return copy;
      }
  , toString : function(){
      var res ="[";
      for(var i = 0; i < this.seqElements.length; i++){
        res += this.seqElements[i].toString();
        res += (i<this.seqElements.length-1)?";":"";
      }
      return res+"] ";
      }
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
SC_ActionForever.prototype.reset = function(m){}
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
  this.count = this.times;
}
SC_Action.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var binder = _SC._b(cube);
  var copy = new SC_Action(binder(this.action), binder(this.times));
  copy._action = this.action;
  copy._times = this.times;
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
 * ParBranch Class
 *********/
function ParBranch(p, par, prg){
  this.prev = null;
  this.next = null;
  this.prg = prg;
  this.flag = SC_Instruction_State.SUSP;
  this.itsParent = p;
  this.par = par;
  this.hasProduction = false;
  this.emitters = [];
  this.hasPotential = false;
  this.path = null;
  this.idxInProd = -1;
}
ParBranch.prototype = {
  declarePotential : function(){
    if(this.hasPotential){
      return;
      }
    this.hasPotential = true;
    if(null != this.par){
      this.idxInProd = this.par.registerInProdBranch(this);
      }
    if(null != this.itsParent){
      this.itsParent.declarePotential();
      }
    }
  , registerForProduction : function(gen){
      this.emitters[this.emitters.length] = gen;
      this.hasProduction = true;
      if(null != this.itsParent){
        this.itsParent.registerForProduction(this);
        }
      else{
        this.par.registerForProduction(this);
        }
      }
  , awake : function(m, flag){
    var res = false;
    switch(this.flag){
      case SC_Instruction_State.WEOI:{
        res = this.path.awake(m, flag);
        if(res){
          this.par.waittingEOI.remove(this);
          ((flag)?this.par.suspended:this.par.suspendedChain).append(this);
          this.flag = SC_Instruction_State.SUSP;
          }
        break;
        }
      case SC_Instruction_State.WAIT:{
        res = this.path.awake(m, flag);
        if(res){
          this.par.waitting.remove(this);
          /*if((undefined !== this.prg.evt)&&("clickTarget" == this.prg.evt.name)){
            //console.log("unsuspend flag, par, path",flag,this.par.suspended,this.path);
            }*/
          ((flag)?this.par.suspended:this.par.suspendedChain).append(this);
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
}

/*********
 * Queues
 *********/
function SC_Queues(){
  this.start = null;
  this.end = null;
}
SC_Queues.prototype = {
  append : function(elt){
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
}

/*********
 * Par Class
 *********/
function Par(args, channel){
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
  for(var i in args){
    this.branches[i] = new ParBranch(null, this, args[i]);
    this.suspended.append(this.branches[i]);
    }
  }
Par.prototype = {
  setPurgeable : function(flag){
    this.purgeable = flag;
    }
  , add : function(p){
      if(undefined == p){
        throw "adding branch to par, p is undefined";
        }
      if(p instanceof Par){
        for(var n = 0; n < p.branches.length; n++){
          this.add(p.branches[n].prg);
          }
        }
      else{
        var b = new ParBranch(null, null, p);
        this.branches[this.branches.length] = b;
        this.suspended.append(b);
        }
      }
  , addBranch : function(p, pb, engine){
      if(p instanceof Par){
        for(var n = 0 ; n < p.branches.length; n ++){
          this.addBranch(p.branches[n].prg, pb, engine);
          }
        }
      else{
        var b = new ParBranch(pb, this, SC_Nothing);
        b.prg = p.bindTo(engine, b, null, this.mseq, b, this.cube);
        b.path = this;
        this.branches[this.branches.length] = b;
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
      }
  , registerInProdBranch : function(pb){
      var res = this.prodBranches.length;
      this.prodBranches[this.prodBranches.length] = pb;
      return res;
      }
  , awake : function(m, flag){
      if(null != this.path){
        return this.path.awake(m, flag);
        }
      return true;
      }
}
Par.prototype.activate = function(m){
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
    //console.log("Par -> SUSP");
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
  return SC_Instruction_State.TERM;
}
Par.prototype.eoi = function(m){
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
Par.prototype.reset = function(m){
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
Par.prototype.registerForProduction = function(b){
  /*if(this instanceof SC_ParDyn){
    console.log("register");
  }*/
  //this.prodBranches[this.prodBranches.length] = b;
  this.hasProduction = true;
  }
Par.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  var copy = new Par();
  copy.mseq = masterSeq;
  copy.cube = cube;
  var tmp = this.suspended.start;
  while(null != tmp){
    var b = new ParBranch(parbranch, copy, SC_Nothing);
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
Par.prototype.removeBranch = function(elt){
  var i = this.branches.indexOf(elt);
  this.branches.splice(i,1);
  }
Par.prototype.toString = function(){
  var res ="[";
  for(var i = 0; i < this.branches.length; i++){
    res += this.branches[i].prg.toString();
    res += (i<this.branches.length-1)?"||":"";
  }
  return res+"] ";
}
Par.prototype.generateValues = function(m){
  /*if(this instanceof SC_ParDyn){
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

function SC_ParDyn(channel, args){
  if(undefined === channel){
    throw "Illegal dynamic Parrellel instruction use !";
    }
  //console.log("Par Dyn !");
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
    this.originalBranches[i] = this.branches[i] = new ParBranch(null, this, args[i]);
    this.suspended.append(this.branches[i]);
    }
  this.channel = channel;
  this.toRegister = true;
  }
SC_ParDyn.prototype = {
  registerInProdBranch : Par.prototype.registerInProdBranch
  , setPurgeable : Par.prototype.setPurgeable
  , add : Par.prototype.add
  , addBranch : Par.prototype.addBranch
  , awake : Par.prototype.awake
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
  while(null != toActivate){
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
    if(this.waitting.isEmpty()){
      var t = this.suspended;
      this.suspended = this.stopped;
      this.stopped = t;
    }
    //console.log("STOP -> weoi");
    return SC_Instruction_State.WEOI;
  }
  if(this.channel.isPresent(m)){
    //console.log("WAIT -> weoi");
    return SC_Instruction_State.WEOI;
    }
  //console.log("WAIT -> wait");
  return SC_Instruction_State.WAIT;
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
    //console.log("ther's something to add");
    m.addDynPar(this);
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
    //this.branches[i] = new ParBranch(null, this, args[i]);
    this.suspended.append(this.originalBranches[i]);
    }
  this.channel.unregister(this);
  this.toRegister = true;
}
SC_ParDyn.prototype.registerForProduction = Par.prototype.registerForProduction;
SC_ParDyn.prototype.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  //console.log(parbranch);
  var copy = new SC_ParDyn(this.channel);
  copy.mseq = masterSeq;
  copy.itsParent = parbranch;
  copy.cube = cube;
  var tmp = this.suspended.start;
  while(null != tmp){
    var b = new ParBranch(parbranch, copy, SC_Nothing);
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
        copy.prodBranches[copy.prodBranches.length] = b;
        }
      }
    copy.suspended.append(b);
    tmp = tmp.next;
    }
  copy.path = path;
  return copy;
  }
SC_ParDyn.prototype.removeBranch = Par.prototype.removeBranch;
SC_ParDyn.prototype.toString = function(){
  var res ="[";
  for(var i = 0; i < this.branches.length; i++){
    res += this.branches[i].prg.toString();
    res += (i<this.branches.length-1)?"||":"";
  }
  return res+"] ";
}
SC_ParDyn.prototype.generateValues = Par.prototype.generateValues;
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
 * Machine Class
 *********/
function Machine(delay, params){
  this.prg = new Par([]);
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
  this.stdOut = function(){};
  this.setStdOut = function(stdout){
    this.stdOut = (undefined == stdout)? function(){}
                                       : stdout;
    }
  if(undefined != params){
    this.setStdOut(params.sortie);
    }
  this.traceEvt = SC.evt("traceEvt");
  /*this.traces = [];
  this.addTrace = function(msg){
    this.traces.push(msg);
    }*/
  this.addCellFun = function(aCell){
    this.cells[this.cells.length] = aCell;
    }
  this.generateEvent = function(evt,val){
    if(undefined == evt){
      throw "undefined event !";
      }
    this.pending[this.pending.length] = {e:evt,v:val};
    }
  this.addProgram = function(p){
    if(undefined == p){
      throw "program to add not defined";
      }
    this.pendingPrograms[this.pendingPrograms.length] = p;
    }
  this.addEvtFun = function(f){
    this.actionsOnEvents[this.actionsOnEvents.length] = f;
    }
  this.addFun = function(fun){
    this.actions[this.actions.length] = fun;
    }
  this.getInstantNumber = function(){
          return this.instantNumber;
  }
  this.getTopLevelParallelBranchesNumber = function(){
          return this.prg.branches.length;
  }
  this.addDynPar = function(p){
    this.parActions.push(p);
    }
  this.setKeepRunningTo = function(b){
    if(this.timer != 0){
      if(b){
        return;
      }
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    else{
      if(b){
        this.timer = window.setInterval(function(){this.react();}.bind(this), delay);
      }
    }
  }
  if(undefined != params && undefined != params.init){
    this.addProgram(params.init);
    }
  else{
    this.addProgram(SC.pauseForever());
    }
  this.react = function(){
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
    for(var i in this.actionsOnEvents){
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
    for(var i in this.actions){
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
  this.ips = 0;
  this.reactMeasuring = 0;
  this.getIPS = function(){
    return this.ips;
    }
  if(delay > 0){
    this.timer = window.setInterval(
    (function(m){ return function(){m.react();}
    })(this)
    , delay);
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
                    });
      }.bind(this),
    "mousemove" : function(evt, e){
        this.generateEvent(e, {x:evt.pageX, y:evt.pageY
                    , cx:evt.clientX, cy:evt.clientY
                    , sx:evt.screenX, sy:evt.screenY
                    , btn:((undefined == evt.button)?-1:evt.button)
                    });
      }.bind(this),
    "mouseup" : function(evt, e){
        this.generateEvent(e, {x:evt.pageX, y:evt.pageY
                    , cx:evt.clientX, cy:evt.clientY
                    , sx:evt.screenX, sy:evt.screenY
                    , btn:((undefined == evt.button)?-1:evt.button)
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
  var copy = new Kill();
  copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube);
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
function SC_Cube(o, p){
  this.o = o;
  this.p = p;
  this.toAdd = [];
  this.addProgram = this.addFirst;
}
SC_Cube.prototype = {
  activate : function(m){
    return this.p.activate(m);
    }
  , eoi : function(m){
    this.p.eoi(m);
    }
  , reset : function(m){
      this.p.reset(m);
      }
  , addSecond: function(p){
    //console.log("adding second", p);
    this.dynamic.addBranch(p, this.pb, this.m);
    }
  , addFirst : function(p){
    //console.log("adding first", p);
    this.toAdd.push(p);
    }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      //console.log("adding on bind");
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
      tmp_par.add(tmp_par_dyn = SC.parex(this.o.SC_cubeAddBehaviorEvt
                         , this.p
                        ));
      for(var i = 0 ; i < this.toAdd.length; i++){
        //console.log("adding on bind", this.toAdd[i]);
        tmp_par_dyn.add(this.toAdd[i]);
        }
      var copy = new SC_Cube(this.o, tmp_par.bindTo(engine, parbranch, null, masterSeq, path, this.o));
      copy.dynamic = tmp_par_dyn;
      copy.toAdd = undefined;
      copy.addProgram = copy.addSecond;
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
  activate : function(m){
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
      return (((null == this.b.t)?eval(this.b.f):this.b.t[this.b.f]));
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
      copy._b = this.b;
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
    return new Machine(delay, initParams);
    },
  pauseForever: function(){
    return SC_PauseForever;
  },
  nothing: function(){
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
    return new Par(arguments, undefined);
  },
  parex: function(evt){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs.push(arguments[i]);
    }
    return new Par(prgs, evt);
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
  loop: function(n){
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
  cube: function(o, p){
    return new SC_Cube(o,p);
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
  return SC;
})();
