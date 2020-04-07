/*
 * SugarCubes.js
 * Author : Jean-Ferdy Susini
 * Created : 2/12/2014 9:23 PM
 * version : 5.0 alpha
 * implantation : 0.9.4
 * Copyright 2014-2020.
 */

;
var SC = (function(){

/*
 * SugarCubes internals.
 * Many comments are made in french, as they are personal working notes.
 * English comments should be more officials, but it is still a work in
 * progress...
 */

/*
 * Implementation notice: SugarCubes v5 allows one to build reactive systems.
 * Reactive systems are programs executed in a dedicated environment. They are
 * made of reactive programs built using reactive constructions which we call
 * reactive instructions. Reactive instructions allows one to build tree
 * structures which implement abstract syntax trees of reactive programs.
 * Reactive programs are executed by a reactive execution machine (shortly
 * called reactive machine or machine).
 * The reactive machine split the execution of a whole reactive system into a
 * logical succession of steps called "instants of execution" (we also call
 * this step of execution a reaction as it corresponds to the call of the react
 * method) during which
 * reactive instructions get activated according to their semantics.
 * Each instant of execution is decomposed in four successive phases:
 *   1. the reactive execution by itself during which reactive instruction are
 *      activated to execute their operational semantics.
 *   2. a phase where event values for the current instant are collected across
 *      the whole reactive system (visiting the whole abstract syntax tree of
 *      the program).
 *   3. a phase where atomic operations are performed (ideally to compute new
 *      memory states)
 *   4. a phase where the memory state of the system is swapped with the newly
 *      computed one and becomes available for the next instant.
 */

/*
 * Here we manly focus on the reactive phase (phase 1) of an instant of
 * execution, which is itself decomposed into 2 consecutive steps:
 *   - the activation phase: during which each instruction get activated and
 *     executes its operational semantics. The activation propagates across the
 *     AST of the reactive program. The implementation of this phase is mainly
 *     done in the activate() method of instruction objects.
 *   - the end of instant phase: during which the reactive machine decides the
 *     end of the current instant. The reactive machine propagates this
 *     decision all along the AST of the whole reactive programming in order to
 *     make all reactive instructions which are awaiting for the end of instant
 *     to be informed of it. The implementation of this phase mainly take place
 *     in the eoi() method of instruction objects.
 *
 * A reactive instruction is implemented as an object with a private state.
 * This state evolves according to time (ie sequence of reactions). At each
 * instant, the reactive instructions can get activated and so can execute
 * their reaction according to their own operational semantics.
 * 
 * We are now going into further details about the activation() implementation.
 * After each activation (ie each call to the method activation() of an
 * instruction), an instruction informs about its progress returning a
 * status flag whose values are :
 *   - SUSP: meaning that the instruction has to be reactivated (the
 *     activation() method has to be called once again) before the end the
 *     current instant is decided by the reactive machine (before the any call
 *     to the method eoi() by the reactive machine).
 *   - WEOI: meaning that the instruction has to be reactivated if an event is
 *     generated during the current instant or when the end of the instant is
 *     decided by the reactive machine.
 *   - OEOI: meaning that only the eoi() method has to be called on the
 *     instruction when the end of the instant is decided by the reactive
 *     machine whatever happens new during the activation phase.
 *   - STOP: meaning that the instruction has finished its execution for the
 *     current instant. It has to be reactivated only at the subsequent
 *     instant.
 *   - WAIT: meaning that the instruction cannot progress anymore but has not
 *     terminated its execution. It has to be reactivated only if a particular
 *     event occurs (in the current instant or in subsequent ones). The eoi()
 *     method should not be called subsequently on such instructions as it has
 *     no effect. Those instructions are only interested by presence of events
 *     and not absence of events.
 *   - HALT: meaning that the instruction cannot progress anymore. It can only
 *     delays its execution to subsequent instant (we often say it consumes
 *     time). It is useless to activate it but its execution never terminates.
 *   - TERM: the instruction has completely terminated its execution. It is
 *     useless to activate it anymore.
 */
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
 * fonction ne faisant rien permettant de ne pas définir un paramètre non
 * utilisé.
 */
function NO_FUN(){}

/*
 * le binding présente différents cas de figure :
 * - la constante à la construction (cas le plus simple)
 *   ex : SC.repeat(10, ...)
 *                  ^^
 * - l'évaluation à la construction (une fonction évaluée, retourne la
 *   constante à utiliser)
 *   ex : SC.repeat(fun(), ...)
 *                  ^^^^^
 */

/*
 * SC_CubeBinding : permet de gérer l'accès aux ressources non définit à
 * l'écriture d'un programme.
 * type de binding :
 *  - early : à l'écriture du programme (mode standard)
 *  - standard : à l'insertion dans la machine
 *  - late : à la première activation
 *  - dynamic : à chaque activation
 */
function SC_CubeBinding(name){
  if((undefined == name)||(typeof name != "string")||(name == "")){
    throw "invalid binding name "+name;
    }
  this.name = name; // nom de la ressource à récupérer
  this.cube = null; // cube cible où trouver la ressource
  this.args = null; // paramètres éventuels pour trouver la ressource
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
          //console.log("SC_CubeBinding.resolve(): args added", this.args);
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

/*
 * Méthodes utilitaires utilisées dans l'implantation des SugarCubes.
 */
var _SC = {
/*
 * Fonction permettant de transformer un paramètre «bindable» en un
 * SC_CubeBinding permettant une résolution tardive.
 */
  b_ : function(p){
    if(typeof p == "string"){ // si on fournit un objet chaîne de caractères 
                              // c'est qu'on veut probablement faire un
                              // lien tardif vers la ressource. On va donc
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
             o = o.clone();
             o.setCube(this);
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
      else if("function" == typeof param){
        delete copy[name];
        Object.defineProperty(copy, name,{get : param});
        }
      else{
        Object.defineProperty(copy, name,{value: param});
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
}

/*******************************************************************************
 * Events
 * Les événements sont des valeurs globales partagées entre tous les
 * composants d'un programme.
 * La valeur d'un événement est booléenne : présent ou absent à chaque instant.
 * Pour savoir si un événement est présent ou absent, on note dans son état le
 * numéro de l'instant de sa dernière génération. L'événement est présent si le
 * numéro d'instant de sa dernière génération est le numéro d'instant courant
 * de la machine d'exécution. Sinon l'événement est absent.
 * Nous sommes dans le modèle réactif à la Boussinot ce qui implique qu'un
 * événement ne sera réputé absent que à la toute fin de l'instant courant
 * (c'est à dire quand plus personne ne peut l'émettre et que personne ne l'a
 * émis).
 ******************************************************************************/

// *** SC_Event
function SC_Event(params){
  this.lein = -1; // numéro de la l'instant de la dernière émission
  this.name = params.name; // nom donné à l'événement (sert au debug)
  this.distribute = params.distribute;
  this.vals = []; // liste des valeurs associées aux emissions dans un même
                  // instant.
  this.registeredInst = [];  // gestion des instructions intéressées par
                             // l'événement. file d'attente.
  this.m = null; // retient la machine d'exécution réactive utilisée par
                 // l'événement.
}
SC_Event.prototype = {
  constructor : SC_Event
  , isPresent : function(m){
      return this.lein == m.instantNumber;
      }
/*
 * Réveil des instructions sur liste d'attente pour l'événement. Si cela ne
 * suffit pas à débloquer l'instruction (qui reste bloquée sur d'autres
 * événements l'instruction non débloquée est remise dans la liste d'attente
 * en utilisant une liste temporaire).
 * flag est propagé jusqu'au awake() d'un Par pour décider si la réexécution du
 * code est immédiate ou non.
 */
  , wakeupAll : function(m, flag){
      for(var idx in this.registeredInst){
        this.registeredInst[idx].wakeup(m, flag);
        }
      }
/*
 * Génération de l'événement. Si l'événement n'a pas déjà été généré dans
 * l'instant, On mémorise l'instant le numéro de l'instant courrant comme
 * numéro de la dernière émission. On profite de l'occasion pour vider la liste
 * des valeurs.
 */
  , generate : function(m, flag){
      if(!this.isPresent(m)){
        this.lein = m.instantNumber;
        this.vals = [];
        this.wakeupAll(m, flag);
        }
      }
  , generateValues : function(m, val){
      if(undefined !== val){
        if(undefined !== this.distribute){
          this.distribute(this.vals,val);
          }
        else{
          this.vals.push(val);
          }
        }
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
      if(!this.isPresent(m)){
        this.vals.splice(0, this.vals.length);
        }
      return this.vals;
      }
  , getAllValues : function(m, vals){
      vals[this] = this.getValues(m);
      }
  , iterateOnValues : function(combiner){
      if((undefined === combiner.iterateOn)
         ||("function" != typeof(combiner.iterateOn))){
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
      else if(this.m !== engine){
        throw 'bound event ('+this.name+') problem';
        }
      return this;
      }
  , toString : function(){
      return "&"+this.name+" ";
      }
  }
/*
 * Le Sensor est une variante de l'événement. La présence ou l'absence d'un
 * sensor est connue au début de l'instant car il ne peut pas être généré en
 * cours d'instant. Il est soit présent soit absent. C'est une entrée du
 * système réactif. La méthode generate() n'existe donc pas sur un sensor.
 * Une méthode systemGen() permet de générer cet événement dans un contexte
 * extérieur au programme réactif (c'est à dire avant l'exécution de
 * l'instant).
 */
// *** SC_Sensor
function SC_Sensor(params){
  this.lein = -1;
  this.distribute = params.distribute;
  this.name = params.name;
  this.vals = [];
  this.registeredInst = [];
}
SC_Sensor.prototype = {
  constructor : SC_Sensor
  , isPresent : SC_Event.prototype.isPresent
  , wakeupAll : SC_Event.prototype.wakeupAll
  , generateValues : SC_Event.prototype.generateValues
  , systemGen : function(val, m, flag){
     if(!this.isPresent(m)){
        this.lein = m.instantNumber;
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

/*
 * Définition d'une instruction générique afin de réduire la combinatoire de la
 * gestion des états d'instructions réactives.
 */
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
  , "ACTION_N_TIMES_INLINE"
  , "ACTION_N_TIMES_INIT"
  , "ACTION_N_TIMES"
  , "ACTION_FOREVER"
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
  , "NOTHING_INLINED"
  , "NOTHING"
  , "GENERATE_ONE_NO_VAL_INLINE"
  , "GENERATE_ONE_NO_VAL"
  , "GENERATE_ONE_INLINE"
  , "GENERATE_ONE"
  , "GENERATE_FOREVER_NO_VAL"
  , "GENERATE_FOREVER"
  , "GENERATE_INIT_INLINE"
  , "GENERATE_INLINE"
  , "GENERATE_INIT"
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
  , "KILL_BACK"
  , "KILL_WEOI"
  , "KILL_OEOI"
  , "KILL_STOP"
  , "KILL_WAIT"
  , "KILL_HALT"
  , "KILLED"
  , "CONTROL"
  , "CONTROL_REGISTERED_CHECK"
  , "CONTROL_REGISTERED_SUSP"
  , "CONTROL_REGISTERED_BACK"
  , "CONTROL_REGISTERED_EOI"
  , "CONTROL_REGISTERED_HALT"
  , "TEST"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT_REGISTERED"
  , "ACTION_ON_EVENT_FOREVER_NO_DEFAULT_STOP"
  , "ACTION_ON_EVENT_FOREVER"
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
  , "FILTER_NO_ABS"
  , "SEND"
  , "SEND_ONE"
  , "SEND_FOREVER"
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
  , "CUBE_INIT"
  , "CUBE"
  , "CUBE_BACK"
  , "CELL"
  , "RE_CELL"
  , "CUBE_CELL_INIT"
  , "CUBE_CELL"
  , "CUBE_CELL_BACK"
  , "PAR_BRANCH"
  ];
Object.freeze(SC_OpcodesNames);


const SC_Opcodes = {
  toString: function(oc){
    return SC_OpcodesNames[oc]+":"+oc;
    }
  };
for(var n = 0; n < SC_OpcodesNames.length; n++){
  SC_Opcodes[SC_OpcodesNames[n]] = n;
  }

Object.freeze(SC_Opcodes);

function SC_Instruction(opcode){
  this.oc = opcode;
  this.caller = null;
  this.seq = null;
  this.resetCaller = null;
  }

const act_exit = new SC_Instruction(1);

SC_Instruction.prototype = {
  constructor : SC_Instruction
  , tr : function (m, meth, msg, msg2){
      //if(this.c.toString() == "&clickTarget ")
      console.log(
        m.instantNumber
        , meth
        , SC_Opcodes.toString(this.oc)
        , (undefined === msg)?"":msg
        , (undefined === msg2)?"":msg2
        );
      }
  , awake : function(m, flag){
      switch(this.oc){
        case 22:
        case 21:{
          return this.path.awake(m, flag);
          }
        case 56:
        case 55:{
          return true;
          }
        case 60:
        case 57:{
          this.path.awake(m, flag);
          this.oc = 55;
          return true;
          }
        case 62:{
          return false;
          }
        case 64:
        case 67:
        case 65:{
          if(this.c.isPresent(m)){
            var res = this.path.awake(m, flag);
            if(res){
              this.oc = 65;
              }
            return res;
            }
          return true;
          }
        case 66:{
          if(this.c.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return true;
          }
        case 104:
        case 102:
        case 109:
        case 107:{
          if(null != this.path){
            return this.path.awake(m, flag);
            }
          return true;
          }
        case 115:{
          return this.path.awake(m, flag);
          }
        default: throw "awake undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  , wakeup : function(m, flag){
      switch(this.oc){
        case 49:{
          if(this.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 51:{
          if(this.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 53:{
          return this.path.awake(m, flag);
          }
        case 64:
        case 67:
        case 68:
        case 66:
        case 65:{
          this.awake(m, flag, true);
          return false;
          }
        case 72:{
          return false;
          }
        case 71:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 75:{
          return false;
          }
        case 74:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 78:{
          return false;
          }
        case 77:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 81:{
          return false;
          }
        case 80:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 83:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 84:{
          return false;
          }
        case 86:{
          if(this.evtFun.config.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
        case 87:{
          return false;
          }
        case 92:{
          var res = /*this.sensor.isPresent(m);
          if(res){
            res = */this.path.awake(m, flag);
            //}
          return res;
          }
        case 104:
        case 102:{
          if(this.channel.isPresent(m)){
            return this.path.awake(m, flag);
            }
          return false;
          }
      default: throw "wakeup undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  , computeAndAdd : function(m){
      switch(this.oc){
        case 102:{
          var vals = {};
          this.channel.getAllValues(m, vals);
          var prgs = vals[this.channel];
          for(var i = 0 ; i < prgs.length; i++){
            this.addBranch(prgs[i], this.itsParent, m);
            }
          break;
          }
        default: throw "computeAndAdd undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
  }

  , setPurgeable : function(flag){
      switch(this.oc){
        case 106:
        case 101:
        case 102:
        case 107:{
          this.purgeable = flag;
          break;
          }
        default: throw "setPurgeable undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , addBranch : function(p, pb, engine){
      switch(this.oc){
        case 101:
        case 106:
        case 102:
        case 107:{
          if(p instanceof SC_Par){
            for(var n = 0 ; n < p.branches.length; n ++){
              this.addBranch(p.branches[n].prg, pb, engine);
              }
          }
        else{
          var b = new SC_ParBranch(pb, this, SC_Nothing);
          b.prg = p.bindTo(engine, b, null, this.mseq, b, this.cube);
          b.path = this;
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
        case 101:
        case 104:
        case 102:
        case 106:
        case 109:
        case 107:{
          var res = this.prodBranches.length;
          this.prodBranches.push(pb);
          return res;
          }
        default: throw "registerInProdBranch undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , registerForProduction : function(b){
      switch(this.oc){
        case 104:
        case 102:
        case 109:
        case 107:{
          //this.hasProduction = true;
          break;
          }
        case 125:{
          this.emitters.push(b);
          //this.hasProduction = true;
          if(null != this.itsParent){
            this.itsParent.registerForProduction(this.itsPar);
            }
          else{
            this.itsPar.registerForProduction(this);
            }
          break;
          }
        default: throw "registerForProduction undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , removeBranch : function(elt){
      switch(this.oc){
        case 109:
        case 104:{
          var i = this.branches.indexOf(elt);
          this.branches.splice(i,1);
          break;
          }
        default: throw "removeBranch undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , getAllValues: function(m, vals){
      switch(this.oc){
        case 120:
        case 121:{
          var vals = {};
          for(var i in this.eventList){
            if(this.eventList[i].isPresent(m)){
              this.eventList[i].getAllValues(m, vals);
              }
            }
          return vals;
          }
        default: throw "getAllValues undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , val : function(){
      switch(this.oc){
        case 120:{
          return this.state;
          }
        case 121:{
          return this.target[this.field];
          }
        default: throw "getAllValues undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , prepare : function(m){
      switch(this.oc){
        case 120:
        case 121:{
          this.futur = this.sideEffect(this.state, this.getAllValues(m), m);
          break;
          }
        default: throw "prepare undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , swap : function(){
      switch(this.oc){
        case 120:
        case 121:{
          this.state = this.futur;
          break;
          }
        default: throw "swap undefined for opcode "
                         +SC_Opcodes.toString(this.oc);
        }
      }
  , generateValues : function(m){
      switch(this.oc){
        case SC_Opcodes.GENERATE_ONE_INIT_INLINE:
        case SC_Opcodes.GENERATE_ONE_INIT:
        case 36:
        case 37:
        case 40:
        case 42:
        case 41:
        case 43:
        case 39:{
          if(this.val instanceof SC_Instruction
              && this.val.oc == 120){
            this.evt.generateValues(m, this.val.val());
            }
          else if("function" == typeof(this.val)){
            this.evt.generateValues(m, this.val(m));
            }
          else{
            this.evt.generateValues(m, this.val);
            }
          break;
          }
        case 90:{
          if(this.val instanceof SC_CubeBinding){
            var res = this.val.resolve();
            }
          if(this.val instanceof SC_Instruction
              && this.val.oc == 120){
            this.evt.generateValues(m, this.val.val());
            }
          else if("function" == typeof(this.val)){
            this.evt.generateValues(m, this.val(m));
            }
          else{
            this.evt.generateValues(m, this.val);
            }
          break;
          }
        case 91:
        case 92:
        case 93:
        case 94:
        case 95:{
          if(this.val instanceof SC_CubeBinding){
            var res = this.val.resolve();
            }
          if(this.val instanceof SC_Instruction
              && this.val.oc == 120){
            this.evt.generateValues(m, this.val.val());
            }
          else if("function" == typeof(this.val)){
            this.evt.generateValues(m, this.val(m));
            }
          else{
            this.evt.generateValues(m, this.val);
            }
          this.val = null;
          break;
          }
        case 105:
        case 110:
        case 101:
        case 102:
        case 107:{
          for(var nb = 0; nb < this.prodBranches.length; nb++){
            //const b = this.prodBranches[nb];
            //if(b.hasProduction){
            //  b.generateValues(m);
            //  }
            this.prodBranches[nb].generateValues(m);
            }
          //this.hasProduction = false;
          break;
          }
        case 125:{
          for(var i = 0; i < this.emitters.length; i++){
            this.emitters[i].generateValues(m);
            }
          this.emitters = [];
          //this.hasProduction = false;
          break;
          }
        default: throw "generateValues : undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  , its : function(nom){
      switch(this.oc){
        case 118:{
          return this.o["$"+nom];
          }
        default: throw "its : undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  , addCell : function(nom, init, el, fun){
      switch(this.oc){
        case 118:{
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      switch(this.oc){
        case 120:
        case 121:{
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
  , toString(){
      switch(this.oc){
        case 2:{
          return "end repeat ";
          }
        case 8:
        case 9:{
          return "repeat forever ";
          }
        case 3:
        case 6:
        case 7:{
          return "repeat "
                  +((this.count<0)?"as forever from "+this.it+" times"
                              :this.count+"/"+this.it+" times ");
          }
        case 19:{
          return "call "+((undefined == this.action.f)?" "+this.action+" "
                        :this.action.t+"."+this.action.f+"()")+" forever";
          }
        case 20:
        case 23:
        case 21:{
          var res ="[";
          for(var i = 0; i < this.seqElements.length; i++){
            res += this.seqElements[i].toString();
            res += (i<this.seqElements.length-1)?";":"";
            }
          return res+"] ";
          }
        case 24:{
          return "pause forever ";
          }
        case 26:{
          return "pause ";
          }
        case 32:
        case 33:{
          return "nothing ";
          }
        case 34:
        case 35:{
          return "generate "+this.evt.toString();
          }
        case 36:
        case 37:{
          return "generate "+this.evt.toString()
                 +((null != this.val)?"("+this.val.toString()+") ":"");
          }
        case 38:{
          return "generate "+this.evt.toString()+" forever ";
          }
        case 40:
        case 41:
        case 42:
        case 43:{
          return "generate "+this.evt.toString()+" ("
                 +this.val+") for "+this.count+"/"+this.times+" times ";
          }
        case 52:{
          return "when "+this.c.toString()+" then ";
          }
        case 55:{
          return "kill "+this.p.toString()
                  +" on "+this.c.toString()
          }
        case 120:
        case 121:{
          return "compute "+this.sideEffect+" on "+this.state
                 +((null == this.eventList)?"":" with "+this.eventList);
          }
        default: return "toString() : undefined opcode "
                       +SC_Opcodes.toString(this.oc);
        }
      }
  }

/*******************************************************************************
 * Repeat Instruction
 ******************************************************************************/
/*
 * En cas de bug vérifier que le jump arrive bien sur une instruction correcte
 * (jumpable).
 */
// *** SC_RelativeJump (relogeable)
function SC_RelativeJump(jump){
  this.relativeJump = jump; // index relatif ou sauter dans la séquence
  this.seq = null; // pointeur vers la séquence
  }
SC_RelativeJump.prototype = {
  constructor : SC_RelativeJump
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(2);
      copy.relativeJump = parseInt(this.relativeJump);
      copy.seq = seq;
      return copy;
      }
  , toString : function(){
      return "end repeat ";
      }
}

// *** If Cond Repeat sinon quitte la boucle un peu à la manière du while...
function SC_IfRepeatPoint(cond){
  this.condition = cond; // fonction retournant une valeur booleenne
  this.end = 0;
  this.label="";
  }
SC_IfRepeatPoint.prototype = {
  constructor : SC_IfRepeatPoint
  , isAnSCProgram : true
  , toString : function(){
      return "while "+this.condition+" repeat ";
      }
  /*
   * masterSeq doit être une pile de labels, permettant de définir la portée
   * d'un exit
   */
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(10);
      copy.condition = this.condition;
      copy.end = parseInt(this.end);
      copy.label = this.label;
      copy.seq = seq;
      return copy;
      }
  }

// *** Repeats
function SC_RepeatPointForever(){
  this.label="";
  }
SC_RepeatPointForever.prototype = {
  constructor : SC_RepeatPointForever
  , isAnSCProgram : true
  , toString : function(){
      return "repeat forever ";
      }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(8);
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_it = binder(this.it);      
      if(bound_it < 0){
        return new SC_RepeatPointForever()
             .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      var copy = new SC_Instruction(3);
      copy.end = parseInt(this.end);
      if("function" == typeof bound_it){
        Object.defineProperty(copy, "it",{get : bound_it});
        //copy.reset(engine);
        }
      else{
        copy.it = bound_it;
        }
      if(0 === copy.it){
        copy.oc = 2;
        copy.relativeJump = this.end;
        }
      copy.count = copy.it;
      copy._it = this.it;
      copy.seq = seq;
      copy.label = this.label;
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
SC_Await.prototype = {
  constructor : SC_Await
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_config = binder(this.config);
      var zeConf = bound_config
                  .bindTo(engine, parbranch, seq, masterSeq, path, cube);
      var copy = new SC_Instruction(50);
      copy.config = zeConf;
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
  }
SC_GenerateForeverLateEvtNoVal.prototype = {
  constructor : SC_GenerateForeverLateEvtNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(88);
      copy.evt = this.evt;
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
  constructor : SC_GenerateForeverLateVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt);
      var bound_value = binder(this.val);
      var copy = null;
      if(bound_evt.isBinding){
        if(bound_value.isBinding){
          copy = new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube);
          }
        else{
          copy = new SC_Instruction(90);
          copy.evt = bound_evt;
          copy.val = bound_value;
          }
        }
      else{
        if(bound_value instanceof SC_CubeBinding){
          copy = new SC_Instruction(90);
          copy.evt = bound_evt;
          copy.val = bound_value;
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
SC_GenerateForeverNoVal.prototype = {
  constructor : SC_GenerateForeverNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(38);
      copy.evt = this.evt;
      copy._evt = this.evt;
      return copy;
      }
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
  constructor : SC_GenerateForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_evt = binder(this.evt);
      var bound_value = binder(this.val);
      var copy = null;
      if(bound_evt instanceof SC_CubeBinding){
        if(bound_value instanceof SC_CubeBinding){
          return new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube);
          }
        else{
          return new SC_GenerateForeverLateEvt(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube);
          }
        }
      else if(bound_value instanceof SC_CubeBinding){
        return new SC_GenerateForeverLateVal(bound_evt, bound_value)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(39);
      copy.evt = bound_evt;
      copy.val = bound_value;
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

// *** SC_GenerateOneNoVal
function SC_GenerateOneNoVal(evt){
  this.evt = evt;
}
SC_GenerateOneNoVal.prototype = {
  constructor : SC_GenerateOneNoVal
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(35);
      copy.evt = binder(this.evt);
      return copy;
      }
  , toString : function(){
      return "generate "+this.evt.toString();
      }
  }

// *** SC_GenerateOne
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = null;
      if(null === this.evt){
        this.evt = engine.traceEvt;
        }
      var tmp_evt = binder(this.evt);
      var tmp_val = binder(this.val);
      if(undefined === tmp_val){
        return new SC_GenerateOneNoVal(tmp_evt)
                .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(37);
      copy.evt = tmp_evt;
      copy.val = tmp_val;
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
  constructor : SC_Generate
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = null;
      var binder = _SC._b(cube);
      var tmp_times = binder(this.times);
      var tmp_evt = binder(this.evt);
      var tmp_val = binder(this.val);
      if(tmp_times < 0){
        return new SC_GenerateForever(tmp_evt, tmp_val)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      else if(0 === tmp_times){
        return SC_Nothing;
        }
      else if((undefined === tmp_times)||(1 == tmp_times)){
        return new SC_GenerateOne(tmp_evt, tmp_val)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(42);
      copy.evt = tmp_evt;
      copy.val = tmp_val;
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = null;
      var binder = _SC._b(cube);
      var tmp_times = binder(this.times);
      var tmp_evt = binder(this.evt);
      if(tmp_times < 0){
        return new SC_GenerateForeverNoVal(tmp_evt)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      else if(0 === tmp_times){
        return SC_Nothing;
        }
      else if((undefined === tmp_times)||(1 == tmp_times)){
        return new SC_GenerateOneNoVal(tmp_evt)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(44);
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
// *** Filters Instructions
function SC_FilterForeverNoSens(sensor, filterFun, evt){
  if(!(sensor instanceof SC_Sensor) && !(sensor instanceof SC_CubeBinding)){
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
  this.itsParent = null;
  this.path = null;
  this.val = null;
}
SC_FilterForeverNoSens.prototype = {
  constructor : SC_FilterForeverNoSens
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_Instruction(91);
      copy.sensor = bound_sensor;
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
  this.noSens_evt = no_sens;
  this.itsParent = null;
  this.path = null;
  this.val = null;
  }
SC_FilterForever.prototype = {
  constructor : SC_FilterForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_noSens_evt = binder(this.noSens_evt);
      bound_fun = _SC.bindIt(bound_fun);      
      if(undefined === bound_noSens_evt){
        copy = new SC_FilterForeverNoSens(
                         bound_sensor
                       , bound_fun
                       , bound_evt
                       )
                .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        return copy;
        }
      var copy = new SC_Instruction(93);
      copy.sensor = bound_sensor;
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
  constructor : SC_FilterOneNoSens
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_noSens_evt = binder(this.noSens_evt);
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_Instruction(95);
      copy.sensor = bound_sensor;
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
    return new SC_FilterOneNoSens(sensor, filterFun, evt);
    }
  if(!(no_sens instanceof SC_Event)
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var bound_sensor = binder(this.sensor);
      var bound_fun = binder(this.filterFun);
      var bound_evt = binder(this.evt);
      var bound_noSens_evt = binder(this.noSens_evt);
      bound_fun = _SC.bindIt(bound_fun);
      var copy = new SC_Instruction(94);
      copy.sensor = bound_sensor;
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

// *** SC_Filter
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
  }
SC_FilterNoSens.prototype = {
  constructor : SC_FilterNoSens
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
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
           .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      else if(bound_times < 0){
        return new SC_FilterForeverNoSens(bound_sensor, bound_fun, bound_evt
                                                , bound_noSens_evt)
           .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      else{
        copy = new SC_Instruction(97);
        copy.sensor = bound_sensor
        copy.evt = bound_evt
        copy.filterFun = bound_fun
        copy.times = bound_times
        }
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
  constructor : SC_Filter
  , isAnSCProgram : true
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
  constructor : SC_Send
  , isAnSCProgram : true
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
        return SC_SendOne(bound_evt, bound_val)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      else if(bound_times < 0){
        return SC_SendForever(bound_evt, bound_val)
               .bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(98);
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
// -- SC_SendOne
function SC_SendOne(evt, value){
  this.evt = evt;
  this.value = value;
  }
SC_SendOne.prototype = {
  constructor : SC_SendOne
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(99);
      copy.evt = binder(this.evt)
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
// -- SendForever
function SC_SendForever(evt, value){
  this.evt = evt;
  this.value = value;
  }
SC_SendForever.prototype = {
  constructor : SC_SendForever
  , isAnSCProgram : true
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
const SC_Nothing = new SC_Instruction(33);
const SC_Nothing_inlined = new SC_Instruction(32);

SC_Nothing.isAnSCProgram = true;
SC_Nothing_inlined.isAnSCProgram = true;
SC_Nothing_inlined.bindTo = function(engine, parbranch, seq, masterSeq, path
                                   , cube){
    return this;
  }
SC_Nothing.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
    return this;
  }

/*******************************************************************************
 * SC_Pause Instructions
 ******************************************************************************/
// *** SC_PauseForever
const SC_PauseForever = new SC_Instruction(24);
SC_PauseForever.isAnSCProgram = true;
SC_PauseForever.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  return this;
  }

// *** SC_Pause
const SC_PauseInline = new SC_Instruction(25);
SC_PauseInline.isAnSCProgram = true;
SC_PauseInline.bindTo = function(engine, parbranch, seq, masterSeq, path, cube){
  return this;
  }

function SC_PauseOne(){
  this.res = false;
  }
SC_PauseOne.prototype = {
  constructor : SC_PauseOne
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      return new SC_Instruction(26);
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
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
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
        return new SC_PauseOne().bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      copy = new SC_Instruction(30);
      //copy.times = bound_times;
      _SC.lateBindProperty(copy, "times", bound_times);
      //console.log("bindTo ", copy.times);
      copy._times = this.times;
      return copy;
      }
  , toString : function(){
      return "pause "+this.count+"/"+this.times+" times ";
      }
  }

// *** SC_PauseRT
function SC_PauseRT(duration){
  this.duration = duration;
  }
SC_PauseRT.prototype = {
  constructor : SC_PauseRT
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(111);
      copy.duration = this.duration*1000;
      copy._duration = this.duration;
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
  }
SC_Seq.prototype = {
  constructor : SC_Seq
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(20);
      copy.seqElements = [];
      var targetIDx = 0;
      for(var i = 0; i < this.seqElements.length; i++){
        var prg = this.seqElements[i];
        if(prg === SC_Nothing){
          console.log("make it inline");
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
      copy.idx = 0;//-1;
      if(undefined === masterSeq){
        masterSeq = copy;
        }
      for(var i = 0; i < copy.seqElements.length; i++){
        copy.seqElements[i] = copy.seqElements[i].bindTo(engine, parbranch, copy
                                                         , masterSeq, copy, cube);
        switch(copy.seqElements[i].oc){
          case 26:{
            copy.seqElements[i].oc = 25;
            break;
            }
          case 30:{
            copy.seqElements[i].oc = 28;
            break;
            }
          case 14:{
            copy.seqElements[i].oc = 13;
            break;
            }
          case 17:{
            copy.seqElements[i].oc = 15;
            break;
            }
          case 35:{
            copy.seqElements[i].oc = 34;
            break;
            }
          case SC_Opcodes.GENERATE_ONE_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.GENERATE_ONE_INIT_INLINE;
            break;
            }
          case 42:{
            copy.seqElements[i].oc = 40;
            break;
            }
          case 50:{
            copy.seqElements[i].oc = 48;
            break;
            }
          case 44:{
            copy.seqElements[i].oc = 46;
            break;
            }
          default:{
            break;
            }
          }
        }
      copy.seqElements.push(new SC_Instruction(23))
      copy.max = copy.seqElements.length-2;
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
  }
SC_ActionForever.prototype = {
  constructor : SC_ActionForever
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(19);
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
SC_Action.prototype = {
  constructor : SC_Action
  , isAnSCProgram : true
, bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
    var binder = _SC._b(cube);
    var times = binder(this.times);
    if(0 == times){
      return SC_Nothing;
      }
    if((undefined === times)||(1 == times)){
      return new SC_SimpleAction(this.action)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube);
      }
    if(times < 0){
      return new SC_ActionForever(this.action)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube);
      }
    var copy = new SC_Instruction(17);
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
      copy.closure = copy.action;
      }
    return copy;
    }
  , toString : function(){
      return "call "+((undefined == this.action.f)?"call("+this.action+") "
                   :this.action.t+"."+this.action.f+"() ")
                   +((this.times>1)?(this.count+"/"+this.times+" times "):" ");
      }
}
// *** SC_SimpleAction
function SC_SimpleAction(f){
  if(undefined === f){
    throw "undefined action";
    }
  this.action = f;
  }
SC_SimpleAction.prototype={
  constructor : SC_SimpleAction
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(14);
      copy.action = binder(this.action);
      copy._action = this.action;
      if(copy.action.f && copy.action.t){
        copy.closure = copy.action.t[copy.action.f].bind(copy.action.t);
        }
      else{
        copy.closure = copy.action;
        }
      return copy;
      }
  , toString : function(){
      return "call "+((undefined == this.action.f)?"call("+this.action+") "
                   :this.action.t+"."+this.action.f+"() ");
      }
}

/*********
 * ActionOnEvent Class
 *********/
function SC_ActionOnEventForeverNoDef(c, act){
  this.evtFun = {action:act, config:c};
}
SC_ActionOnEventForeverNoDef.prototype = {
  constructor : SC_ActionOnEventForeverNoDef
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(70);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube)
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(73);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube)
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
//--- 
function SC_ActionOnEventNoDef(c, act, times){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.count = this.times = times;
}
SC_ActionOnEventNoDef.prototype = {
  constructor : SC_ActionOnEventNoDef
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(79);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
             .bindTo(engine, parbranch, seq, masterSeq, path, cube)
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

//--- 
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(76);
    copy.evtFun = {
      action:binder(this.evtFun.action)
      , config:binder(this.evtFun.config)
                .bindTo(engine, parbranch, seq, masterSeq, path, cube)
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
//--- 
function SC_SimpleActionOnEventNoDef(c, act){
  this.evtFun = {action:act, config:c};
  this.path = null;
  this.toRegister = true;
  this.terminated = false;
}
SC_SimpleActionOnEventNoDef.prototype = {
  cosntructor : SC_SimpleActionOnEventNoDef
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(82);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                 .bindTo(engine, parbranch, seq, masterSeq, path, cube)
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(85);
      copy.evtFun = {
        action:binder(this.evtFun.action)
        , config:binder(this.evtFun.config)
                   .bindTo(engine, parbranch, seq, masterSeq, path, cube)
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

/*********
 * SC_ParBranch Class
 *********/
function SC_ParBranch(aParent, aPar, prg){
  this.oc = 125;
  this.prev = null;
  this.next = null;
  this.prg = prg;
  this.flag = 1;
  this.itsParent = aParent;
  this.itsPar = aPar;
  //this.hasProduction = false;
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
  , registerForProduction : SC_Instruction.prototype.registerForProduction/*function(gen){
      this.emitters.push(gen);
      //this.hasProduction = true;
      if(null != this.itsParent){
        this.itsParent.registerForProduction(this);
        }
      else{
        this.itsPar.registerForProduction(this);
        }
      }*/
/*
 * L'argument flag ici permet de savoir si on place l'élément dans suspended ou
 * suspendedChain.
 */
  , awake : function(m, flag){
      var res = false;
      //console.log("on awake flag is ",flag);
      switch(this.flag){
        case 2:{
          res = this.path.awake(m, flag);
          if(res){
            this.itsPar.waittingEOI.remove(this);
            ((flag)?this.itsPar.suspended:this.itsPar.suspendedChain).append(this);
            this.flag = 1;
            }
          break;
          }
        case 5:{
          res = this.path.awake(m, flag);
          if(res){
            this.itsPar.waitting.remove(this);
            ((flag)?this.itsPar.suspended:this.itsPar.suspendedChain).append(this);
            this.flag = 1;
            }
          break;
          }
        case 1:{
          return true;
          }
        }
      return res;
      }
  , generateValues : SC_Instruction.prototype.generateValues /*function(m){
      for(var i = 0; i < this.emitters.length; i++){
        this.emitters[i].generateValues(m);
        }
      this.emitters = [];
      this.hasProduction = false;
      }*/
  };

/*********
 * Queues
 *********/
function SC_Queues(){
  this.start = null;
  /*this.end = null;*/
}
SC_Queues.prototype = {
  constructor : SC_Queues
/*  , append : function(elt){
      if(null == this.end){
        this.start = this.end = elt;
        }
      else{
        this.end.next = elt;
        elt.prev = this.end;
        this.end = elt;
        }
      }*/
/*  , pull : function(){
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
      }*/
  , append : function(elt){
      if(null != this.start){
        this.start.prev = elt;
        elt.next = this.start;
        }
      this.start = elt;
      }
  //, append : this.push
  , pop : function(){
      if(null == this.start){
        return null;
        }
      var res = this.start;
      this.start = res.next;
      if(null != this.start){
        this.start.prev = null;
        }
      /*else{
        this.start = this.end = null;
        }*/
      res.next = res.prev = null;
      return res;
      }
  , remove : function(elt){
      if(elt == this.start){
        var res = this.start;
        this.start = res.next;
        res.next = res.prev = null;
        return res;
        }
      /*if(this.start == elt){
        return this.pop();
        }
      if(this.end == elt){
        return this.pull();
        }
      else{*/
      if(null != elt.next){
        elt.next.prev = elt.prev;
        }
      elt.prev.next = elt.next;
      //  }
      elt.next = elt.prev = null;
      return elt;
      }
/*  , contains : function(elt){
      var cursor = this.start;
      while( null != cursor){
        if(elt == cursor){
          return true;
          }
        cursor = cursor.next;
        }
      return false;
      }*/
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
  this.branches = [];
  for(var i of args){
    this.branches.push(new SC_ParBranch(null, null, i));
    }
  }
SC_Par.prototype = {
  constructor : SC_Par
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(106);
      copy.suspended = new SC_Queues();
      copy.suspendedChain = new SC_Queues();
      copy.waittingEOI = new SC_Queues();
      copy.stopped = new SC_Queues();
      copy.waitting = new SC_Queues();
      copy.halted = new SC_Queues();
      copy.terminated = new SC_Queues();
      copy.branches = [];
      copy.prodBranches = [];
      copy.purgeable = false;
      //copy.hasProduction = false;
      copy.itsParent = null;
      copy.mseq = masterSeq;
      copy.cube = cube;
      for(var tmp of this.branches){
        var b = new SC_ParBranch(parbranch, copy, SC_Nothing);
        b.prg = tmp.prg.bindTo(engine, b, null, masterSeq, b, cube);
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
      console.log("debug start", this.branches);
      for(var i in this.branches){
        console.log("--" , i, this.branches[i]);
        res += this.branches[i].prg.toString();
        res += (i<this.branches.length-1)?"||":"";
        }
      console.log("debug stop");
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

/**
  * Opérateur Parallele a extension dynamique...
  * SC_ParDyn
  */
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(101);
      copy.suspended = new SC_Queues();
      copy.suspendedChain = new SC_Queues();
      copy.waittingEOI = new SC_Queues();
      copy.stopped = new SC_Queues();
      copy.waitting = new SC_Queues();
      copy.halted = new SC_Queues();
      copy.terminated = new SC_Queues();
      copy.branches = [];
      copy.prodBranches = [];
      copy.purgeable = false;
      //copy.hasProduction = false;
      copy.originalBranches = [];
      for(var i of this.branches){
        var b = new SC_ParBranch(parbranch, copy, SC_Nothing);
        b.prg = i.prg.bindTo(engine, b, null, masterSeq, b, cube);
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
      copy.channel = this.channel;
      copy.path = path;
      return copy;
      }
  , add: SC_Par.prototype.add
  , toString : SC_Par.prototype.toString
  };

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
  if(undefined !== params.target){
    return new SC_ReCell(params);
    }
  var cell = new SC_Instruction(120);
  cell.state = (undefined == params.init)?null:params.init;
  if(undefined == params.sideEffect){
    throw "undefined sideEffect !";
    }
  else{
    if(undefined != params.sideEffect.t){
      cell.sideEffect = params.sideEffect.t[params.sideEffect.f].bind(params.sideEffect.t);
      }
    else{
      cell.sideEffect = params.sideEffect;
      }
    cell.eventList = (undefined == params.eventList)?null:params.eventList;
    }
    cell.TODO =  -1;
    cell.futur = null;
    cell.clock = null;
    return cell;
  }

function SC_ReCell(params){
  if(undefined == params.field || undefined == params.target[params.field]){
     throw "field not specified on target ("+params.field+")";
    }
  var cell = new SC_Instruction(121);
  if(undefined == params.sideEffect){
    throw "undefined sideEffect !";
    }
  else{
    cell.sideEffect = params.sideEffect;
    cell.eventList = (undefined == params.eventList)?null:params.eventList;
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
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var tgt = cube[this.cellName];
      if(tgt instanceof SC_Instruction
        &&((tgt.oc == 120)||((tgt.oc == 121)))){
        return tgt.bindTo(engine, parbranch, seq, masterSeq, path, cube);
        }
      var copy = new SC_Instruction(122);
      copy.cellName = this.cellName;
      copy.cell=null;
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
  this.prg = new SC_Par([]).bindTo(this, null, null, null, null, null);
  this.instantNumber = 1;
  this.delay = delay;
    this.whenGettingThread = (((undefined !== params)&&(undefined !== params.whenGettingThread))
                      ?params.whenGettingThread
                      :function(){this.react();}).bind(this)
                      ;
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
  if(undefined != params && undefined != params.init){
    this.addProgram(params.init);
    }
  else{
    this.addProgram(SC.pauseForever());
    }
  this.ips = 0;
  this.reactMeasuring = 0;
  if(this.delay > 0){
    this.timer = setInterval(this.whenGettingThread, this.delay);
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
        this.generateEvent(e, evt);
      }.bind(this),
    "keyup" : function(evt, e){
        this.generateEvent(e, evt);
      }.bind(this),
    "keypress" : function(evt, e){
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
  this.systemEvent = function(target, name, sync){
    if(this.handlers.hasOwnProperty(name)){
      var SC_event = new SC_Sensor(""+target+"."+name, true);
      var handler = this.handlers[name];
      var me = this;
      target.addEventListener(name, function(evt){
         handler(evt,SC_event);
         if(sync){
           me.react();
           }
         });
      return SC_event;
    }
    throw "no system event "+name+" defined for "+target;
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
      if(p.isAnSCProgram){
        this.pendingPrograms.push(p);
        }
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
      if(isNaN(d) || d <= 0){
        console.log("negative delay");
        return;
        }
      this.delay = d;
      if(this.timer != 0){
        clearInterval(this.timer);
        this.timer = 0;
        }
      this.timer = setInterval(this.whenGettingThread, this.delay);
      }
  , setKeepRunningTo : function(b){
      if(this.timer != 0){
        if(b){
          return;
          }
        clearInterval(this.timer);
        this.timer = 0;
        }
      else{
        if(b){
          this.timer = setInterval(this.whenGettingThread, this.delay);
          }
        }
      }
  , react : function(){
      var res = 4;
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
      //console.log(this.instantNumber, "--- phase1 ---");
      while(1 == (res = this.activate()) /*&& this.moved*/){
        //this.moved = false;
      }
      //console.log("res = ",res);
      //this.moved = false;
      if((3 == res)||(2 == res)){
        //console.log(this.instantNumber, "--- eoi starts ---");
        this.eoi();
        res = 4;
      }
      // Phase 2 : collecting event values
      //if(this.prg.hasProduction){
        this.prg.generateValues(this);
      //}
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
        if(undefined != this.dumpTraceFun){
          this.dumpTraceFun(this.traceEvt.getValues(this));
          }
        else{
          console.log.call(console, this.traceEvt.getValues(this));
          }
        }
      this.instantNumber++;
      if(this.delay > 0 && res == 7 && (null != this.timer)){
        clearInterval(this.timer)
      }
      if(0 == this.instantNumber%256){
        if(0 != this.reactMeasuring){
          const now = performance.now();
          this.ips = Math.floor(256*10000
                            /(now-this.reactMeasuring))/10;
          this.reactMeasuring = now;
        }
        else{
          if(undefined == performance){
            performance = {now:function(){
                         return new Date().getTime();
                         }
                       };
          }
          this.reactMeasuring = performance.now();
          }
        }
      /*if(this.traces.length>0){
        console.log.call(console, this.traces);
        this.traces = [];
      }*/
      if(7 == res){
        console.log("machine stops");
        }
      return res != 7;
      }
  , getIPS : function(){
      return this.ips;
      }
  , reactASAP : function(){
      setInterval(this.whenGettingThread);
      }
  , activations : 0
  , activate : function(){
      var st = 1;
      var inst = this.prg;
      var seq = null;
      var caller = act_exit;
      //var oldInstOC = null;
      while(true){
        //this.activations++;
ACT:    switch(/*oldInstOC = */inst.oc){
          case 1:{
            return st;
            }
          case 2:{
            seq.idx += inst.relativeJump;
            inst = seq.seqElements[seq.idx];
            break;
            }
          case 32:{
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 8:{
            inst.oc = 9;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 9:{
            inst.oc = 8;
            st = 4;
            inst = caller;
            break;
            }
          case 4:{
            inst.oc = 5;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 5:{
            inst.oc = 4;
            st = 4;
            inst = caller;
            break;
            }
          case 3:{
            inst.count = inst.it;
            if(0 > inst.count){
              inst.oc = 4;
              break;
              }
            if(0 == inst.count){
              seq.idx += inst.end;
              inst = seq.seqElements[seq.idx];
              break;
              }
            }
          case 6:{
            inst.oc = 7;
            inst.count--;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 7:{
            if(0 === inst.count){
              seq.idx += inst.end;
              //this.reset(inst);
              inst.oc = 3;
              inst = seq.seqElements[seq.idx];
              break;
              }
            inst.oc = 6;
            st = 4;
            inst = caller;
            break;
            }
          case 10:{
            if(!inst.condition(this)){
              seq.idx += inst.end;
              inst = seq.seqElements[seq.idx];
              break;
              }
            }
          case 11:{
            inst.oc = 12;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 12:{
            if(!inst.condition(this)){
              seq.idx += inst.end;
              //this.reset(inst);
              inst.oc = 10;
              inst = seq.seqElements[seq.idx];
              break;
              }
            inst.oc = 11;
            st = 4;
            inst = caller;
            break;
            }
          case 13:{
            this.addFun(inst.closure);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 14:{
            this.addFun(inst.closure);
            st = 7;
            inst = caller;
            break;
            }
          case 15:{
            inst.count = inst.times;
            if(inst.count <= 0){
              throw "*** Pb ! action n times "+inst.count;
              }
            inst.oc = 16;
            }
          case 16:{
            this.addFun(inst.closure);
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 15;
              inst = seq.seqElements[++seq.idx];
              }
            else{
              st = 4;
              inst = caller;
              }
            break;
            }
          case 17:{
            inst.count = inst.times;
            if(inst.count <= 0){
              throw "*** Pb ! action n times "+inst.count;
              }
            inst.oc = 18;
            }
          case 18:{
            this.addFun(inst.closure);
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 17;
              st = 7;
              }
            else{
              st = 4;
              }
            inst = caller;
            break;
            }
          case 19:{
            this.addFun(inst.closure);
            st = 4;
            inst = caller;
            break;
            }
          case 20:{
            //inst.idx = 0;
            inst.oc = 21;
            inst.caller = caller;
            inst.seq = seq;
            }
          case 21:{
            caller = seq = inst;
            inst.oc = 22;
            inst = inst.seqElements[inst.idx];
            break;
            }
          case 22:{
            if(7 == st){
              if(inst.idx >= inst.max){
                inst.oc = 21;
                inst.idx = 0;
                //this.reset(inst.seqElements[inst.idx]);
                }
              else{
                caller = seq = inst;
                inst = inst.seqElements[++inst.idx];
                break;
                }
              }
            else{
              inst.oc = 21;
              }
            seq = inst.seq
            caller = inst = inst.caller;
            break;
            }
          case 23:{
            st = 7;
            inst = caller;
            break;
            }
          case 24:{
            st = 6;
            inst = caller;
            break;
            }
          case 25:{
            st = 4;
            seq.idx++;
            inst = caller;
            break;
            }
          case 26:{
            inst.oc = 27;
            st = 4;
            inst = caller;
            break;
            }
          case 27:{
            inst.oc = 26;
            st = 7;
            inst = caller;
            break;
            }
          case 28:{
            inst.oc = 29;
            inst.count = inst.times;
            }
          case 29:{
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 28;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.count--;
            st = 4;
            inst = caller;
            break;
            }
          case 30:{
            inst.oc = 31;
            inst.count = inst.times;
            }
          case 31:{
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 30;
              st = 7;
              inst = caller;
              break;
              }
            inst.count--;
            st = 4;
            inst = caller;
            break;
            }
          case 33:{
            st = 7;
            inst = caller;
            break;
            }
          case 34:{
            inst.evt.generate(this);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 35:{
            inst.evt.generate(this);
            st = 7;
            inst = caller;
            break;
            }
          case 36:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this);
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 37:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this);
            st = 7;
            inst = caller;
            break;
            }
          case 38:{
            inst.evt.generate(this);
            st = 4;
            inst = caller;
            break;
            }
          case 39:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this);
            st = 4;
            inst = caller;
            break;
            }
          case 40:{
            inst.count = inst.times;
            inst.oc = 41;
            }
          case 41:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this);
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 40;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = 4;
            inst = caller;
            break;
            }
          case 42:{
            inst.count = inst.times;
            inst.oc = 43;
            }
          case 43:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this);
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 42;
              st = 7;
              inst = caller;
              break;
              }
            st = 4;
            inst = caller;
            break;
            }
          case 46:{
            inst.count = inst.times;
            inst.oc = 47;
            }
          case 47:{
            inst.evt.generate(this);
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 46;
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = 4;
            inst = caller;
            break;
            }
          case 44:{
            inst.count = inst.times;
            inst.oc = 45;
            }
          case 45:{
            inst.evt.generate(this);
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              inst.oc = 44;
              st = 7;
              }
            else{
              st = 4;
              }
            inst = caller;
            break;
            }
          case 48:{
            if(inst.config.isPresent(this)){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.config.registerInst(this, inst);
            inst.oc = 49;
            st = 5;
            inst = caller;
            break;
            }
          case 49:{
            if(inst.config.isPresent(this)){
              //this.reset(inst);
              inst.oc = 48;
              inst.config.unregister(inst);
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = 5;
            inst = caller;
            break;
            }
          case 50:{
            if(inst.config.isPresent(this)){
              st = 7;
              inst = caller;
              break;
              }
            inst.config.registerInst(this, inst);
            inst.oc = 51
            st = 5;
            inst = caller;
            break;
            }
          case 51:{
            if(inst.config.isPresent(this)){
              //this.reset(inst);
              inst.oc = 50;
              inst.config.unregister(inst);
              st = 7;
              inst = caller;
              break;
              }
            st = 5;
            inst = caller;
            break;
            }
          case 52:{
            if(inst.c.isPresent(this)){
              inst = seq.seqElements[++seq.idx];
              break;
              }
            inst.oc = 53;
            inst.c.registerInst(this, inst);
            st = 2;
            inst = caller;
            break;
            }
          case 53:{
            if(inst.c.isPresent(this)){
              //this.reset(inst);
              inst.oc = 52;
              inst.c.unregister(inst);
              inst = seq.seqElements[++seq.idx];
              break;
              }
            st = 2;
            inst = caller;
            break;
            }
          case 54:{
            inst.caller = caller;
            //inst.oc = 55;
            //break;
            }
          case 55:{
            caller = inst;
            inst.oc = 56;
            inst = inst.p;
            break;
            }
          case 56:{
            caller = inst.caller;
            //seq = inst.seq;
            switch(st){
              case 7:{
                inst.oc = 55;
                //this.reset(inst.p);
                seq.idx += inst.end;
                inst = seq.seqElements[seq.idx];
                break;
                }
              case 1:{
                //st = 1;
                inst.oc = 55;
                inst = inst.caller;
                break;
                }
              case 2:{
                inst.oc = 57;
                inst = inst.caller;
                break;
                }
              case 3:{
                inst.oc = 58;
                inst = inst.caller;
                break;
                }
              case 4:{
                inst.oc = 59;
                st = 3;
                inst = inst.caller;
                break;
                }
              case 6:{
                inst.oc = 61;
                st = 3;
                inst = inst.caller;
                break;
                }
              case 5:{
                inst.oc = 60;
                st = 2;
                inst = inst.caller;
                break;
                }
              default:{
                throw "*** KILL_BACK state pb !"
                }
              }
            break;
            }
          case 61:
          case 57:
          case 60:{
            st = 2;
            caller = inst = inst.caller;
            break;
            }
          case 62:{
            //this.reset(inst.p);
            inst.oc = 55;
            //caller = inst.caller;
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 63:{
            inst.caller = caller;
            inst.c.registerInst(this, inst); // Pas obligatoire ici
            inst.oc = 64;
            }
          case 64:{
            if(inst.c.isPresent(this)){
              inst.oc = 65;
              }
            else{
              st = 5;
              caller = inst = inst.caller;
              break;
              }
            }
          case 65:{
            caller = inst;
            inst.oc = 66;
            inst = inst.p;
            break;
            }
          case 66:{
            inst.oc = 65;
            caller = inst.caller;
            switch(st){
              case 3:
              case 2:{
                inst.oc = 67;
                break;
                }
              case 6:{
                inst.oc = 68;
                break;
                }
              case 5:{
                inst.oc = 64;
                break;
                }
              case 4:{
                inst.oc = 64;
                break;
                }
              case 7:{
                //this.reset(inst.p);
                inst.c.unregister(inst);
                inst.oc = 63;
                break;
                }
              }
            inst = inst.caller;
            break;
            }
          case 69:{
            if(!inst.test(this)){
              seq.idx += inst.elsB;
              inst = seq.seqElements[seq.idx];
              break;
              }
            inst = seq.seqElements[++seq.idx];
            break;
            }
          case 70:{
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = 71;
            }
          case 71:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              //inst.oc = 72;
              st = 4;
              inst = caller;
              break;
              }
            st = 5;
            inst = caller;
            break;
            }
          /*case 72:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              st = 4;
              inst = caller;
              break;
              }
            inst.oc = 71;
            st = 5;
            inst = caller;
            break;
            }*/
          case 73:{
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = 74;
            }
          case 74:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              inst.oc = 75;
              st = 4;
              inst = caller;
              break;
              }
            st = 2;
            inst = caller;
            break;
            }
          case 75:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              st = 4;
              inst = caller;
              break;
              }
            inst.oc = 74;
            st = 2;
            inst = caller;
            break;
            }
          case 76:{
            inst.count = inst.times;
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = 77;
            }
          case 77:{
            if(0 == inst.count){
              //this.reset(inst);
              inst.evtFun.config.unregister(inst);
              inst.oc = 76;
              st = 7;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                //this.reset(inst);
                inst.evtFun.config.unregister(inst);
                inst.oc = 76;
                st = 7;
                inst = caller;
                break;
                }
              inst.oc = 78;
              st = 4;
              inst = caller;
              break;
              }
            st = 2;
            inst = caller;
            break;
            }
          case 78:{
            if(0 == inst.count){
              //this.reset(inst);
              inst.evtFun.config.unregister(inst);
              inst.oc = 76;
              st = 7;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                //this.reset(inst);
                inst.evtFun.config.unregister(inst);
                inst.oc = 76;
                st = 7;
                inst = caller;
                break;
                }
              st = 4;
              inst = caller;
              break;
              }
            inst.oc = 77;
            st = 2;
            inst = caller;
            break;
            }
          case 79:{
            inst.count = inst.times;
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = 80;
            }
          case 80:{
            if(0 == inst.count){
              //this.reset(inst);
              inst.evtFun.config.unregister(inst);
              inst.oc = 79;
              st = 7;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                //this.reset(inst);
                inst.evtFun.config.unregister(inst);
                inst.oc = 79;
                st = 7;
                inst = caller;
                break;
                }
              inst.oc = 81;
              st = 4;
              inst = caller;
              break;
              }
            st = 2;
            inst = caller;
            break;
            }
          case 81:{
            if(0 == inst.count){
              this.reset(inst);
              st = 7;
              inst = caller;
              break;
              }
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              if(inst.count > 0){
                inst.count--;
                }
              if(0 == inst.count){
                this.reset(inst);
                st = 7;
                inst = caller;
                break;
                }
              st = 4;
              inst = caller;
              break;
              }
            inst.oc = 80;
            st = 2;
            inst = caller;
            break;
            }
          case 82:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              this.reset(inst);
              st = 7;
              inst = caller;
              break;
              }
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = 83;
            }
          case 83:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              this.reset(inst);
              st = 7;
              inst = caller;
              break;
              }
            st = 2;
            inst = caller;
            break;
            }
          case 85:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              //this.reset(inst);
              st = 7;
              inst = caller;
              break;
              }
            inst.evtFun.config.registerInst(this, inst);
            inst.oc = 86;
            }
          case 86:{
            if(inst.evtFun.config.isPresent(this)){
              this.addEvtFun(inst.evtFun);
              //this.reset(inst);
              inst.evtFun.config.unregister(inst);
              inst.oc = 85;
              st = 7;
              inst = caller;
              break;
              }
              st = 2;
              inst = caller;
              break;
            }
          case 84:
          case 87:{
            this.reset(inst);
            st = 7;
            inst = caller;
            break;
            }
          case 88:{
            if(inst.evt instanceof SC_CubeBinding){
              inst.evt = inst.evt.resolve();
              }
            inst.oc = 89;
            }
          case 89:{
            inst.evt.generate(this);
            st = 4;
            inst = caller;
            break;
            }
          case 90:{
            inst.itsParent.registerForProduction(inst);
            inst.evt.generate(this);
            st = 4;
            inst = caller;
            break;
            }
          case 91:{
            inst.sensor.registerInst(this, inst);
            inst.oc = 92;
            }
          case 92:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this), this);
              if(undefined !== inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this);
                }
              }
            st = 5;
            inst = caller;
            break;
            }
          case 93:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this), this);
              if(undefined !== inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this);
                }
              else{
                inst.noSens_evt.generate(this);
                }
              }
            st = 4;
            inst = caller;
            break;
            }
          case 94:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this), this);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this);
                }
              }
            else{
              inst.noSens_evt.generate(this);
              }
            st = 7;
            inst = caller;
            break;
            }
          case 95:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this), this);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this);
                }
              }
            st = 7;
            inst = caller;
            break;
            }
          case 96:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this), this);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this);
                }
              }
            else{
              inst.noSens_evt.generate(this);
              }
            st = 7;
            inst = caller;
            break;
            }
          case 97:{
            if(inst.sensor.isPresent(this)){
              inst.val = inst.filterFun(inst.sensor.getValues(this), this);
              if(null != inst.val){
                inst.itsParent.registerForProduction(inst);
                inst.evt.generate(this);
                }
              }
            inst.count--;
            if(0 == inst.count){
              //this.reset(inst);
              st = 7;
              inst = caller;
              break;
              }
            st = 4;
            inst = caller;
            break;
            }
          case 98:{
            if(inst.count-- > 0){
              this.generateEvent(inst.evt, inst.value);
              st = 4;
              inst = caller;
              break;
              }
            this.reset(inst);
            st = 7;
            inst = caller;
            break;
            }
          case 99:{
            this.generateEvent(inst.evt, inst.value);
            st = 7;
            inst = caller;
            break;
            }
          case 100:{
            this.generateEvent(inst.evt, inst.value);
            st = 4;
            inst = caller;
            break;
            }
          case 101:{
            inst.channel.registerInst(this, inst);
            inst.caller = caller;
            inst.tmp = null;
            }
          case 102:{
            if((inst.suspended.start == null) && (inst.suspendedChain.start != null)){
              var t = inst.suspended;
              inst.suspended = inst.suspendedChain;
              inst.suspendedChain = t;
              }
            }
          case 103:{
            if(inst.suspended.start != null){
              caller = inst;
              inst.oc = 104;
              inst.toActivate = inst.suspended.pop();
              inst = inst.toActivate.prg;
              break;
              }
            caller = inst.caller;
            inst.oc = 102;
            if(inst.suspendedChain.start != null){
              var t = inst.suspended;
              inst.suspended = inst.suspendedChain;
              inst.suspendedChain = t;
              st = 1;
              caller = inst = inst.caller;
              break;
              }
            if((inst.waittingEOI.start != null) || (inst.stopped.start != null)){
              st = 2;
              inst = caller;
              break;
              }
            if(inst.channel.isPresent(this)){
              st = 3;
              inst = caller;
              break;
              }
            st = ((inst.waitting.start == null)
                    && (inst.halted.start == null)
                    )?2
                     :5;
            inst = inst.caller;
            break;
            }
          case 104:{
            switch(inst.toActivate.flag = st){
              case 1:{
                   inst.suspendedChain.append(inst.toActivate);
                   break;
                   }
              case 3:
              case 2:{
                   inst.waittingEOI.append(inst.toActivate);
                   break;
                   }
              case 4:{
                   inst.stopped.append(inst.toActivate);
                   break;
                   }
              case 5:{
                   inst.waitting.append(inst.toActivate);
                   break;
                   }
              case 6:{
                   inst.halted.append(inst.toActivate);
                   break;
                   }
              case 7:{
                   if(inst.purgeable){
                     inst.removeBranch(inst.toActivate);
                     }
                   else{
                     inst.terminated.append(inst.toActivate);
                     }
                   break;
                   }
              }
            inst.oc = 103;
            break;
            }
          case 105 : {
            this.reset(inst);
            st = 7;
            inst = caller;
            break;
            }
          case 106:{
            inst.caller = caller;
            inst.tmp = null;
            }
          case 107 :{
            if((inst.suspended.start == null) && (inst.suspendedChain.start != null)){
              var t = inst.suspended;
              inst.suspended = inst.suspendedChain;
              inst.suspendedChain = t;
              }
            }
          case 108:{
            if(inst.suspended.start != null){
              caller = inst; 
              inst.oc = 109;
              inst.toActivate = inst.suspended.pop();
              inst = inst.toActivate.prg;
              break;
              }
            caller = inst.caller;
            inst.oc = 107;
            if(inst.suspendedChain.start != null){
              var t = inst.suspended;
              inst.suspended = inst.suspendedChain;
              inst.suspendedChain = t;
              st = 1;
              caller = inst = inst.caller;
              break;
              }
            if(inst.waittingEOI.start != null){
              st = 2;
              caller = inst = inst.caller;
              break;
              }
            if(inst.stopped.start != null){
              if(inst.waitting.start == null){
                var t = inst.suspended;
                inst.suspended = inst.stopped;
                inst.stopped = t;
                st = 4;
                caller = inst = inst.caller;
                break;
                }
              st = 2;
              caller = inst = inst.caller;
              break;
              }
            if(inst.waitting.start != null){
              st = 5;
              caller = inst = inst.caller;
              break;
              }
            if(inst.halted.start != null){
              st = 6;
              caller = inst = inst.caller;
              break;
              }
            this.reset(inst);
            st = 7;
            caller = inst = inst.caller;
            break;
            }
          case 109:{
            switch(inst.toActivate.flag = st){
              case 1:{
                inst.suspendedChain.append(inst.toActivate);
                break;
                }
              case 3:
              case 2:{
                inst.waittingEOI.append(inst.toActivate);
                break;
                }
              case 4:{
                inst.stopped.append(inst.toActivate);
                break;
                }
              case 5:{
                inst.waitting.append(inst.toActivate);
                break;
                }
              case 6:{
                inst.halted.append(inst.toActivate);
                break;
                }
              case 7:{
                if(inst.purgeable){
                  inst.removeBranch(inst.toActivate);
                  }
                else{
                  inst.terminated.append(inst.toActivate);
                  }
                break;
                }
              }
            inst.oc = 108;
            break;
            }
          case 111:{
            inst.startTime = performance.now();
            inst.oc = 112;
            st = 4;
            inst = caller;
            break;
            }
          case 112:{
            if(performance.now() - inst.startTime > inst.duration){
              //this.reset(inst);
              inst.oc = 111;
              st =  7;
              inst = caller;
              break;
              }
            st = 4;
            inst = caller;
            break;
            }
          case 113:{
            inst.caller = caller;
            }
          case 114:{
            var val = parseInt((null == inst.v.t)
                                   ?eval(inst.v.f):inst.v.t[inst.v.f]);
            inst.choice = inst.cases[val];
            if(undefined == inst.choice){
              inst.choice = SC_Nothing;
              }
            }
          case 115:{
            caller = inst;
            inst.oc = 116;
            inst = inst.choice;
            break;
            }
          case 116:{
            inst.oc = 115;
            if(7 == st){
              this.reset(inst.choice);
              inst.choice = null;
              inst.oc = 114;
              }
            caller = inst = inst.caller;
            break;
            }
          case 117:{
            inst.caller = caller;
            }
          case 118:{
            caller = inst;
            inst.oc = 119;
            inst = inst.p;
            break;
            }
          case 119:{
            inst.oc = 118;
            /*if(7 == st){
              this.reset(inst);
              }*/
            caller = inst = inst.caller;
            break;
            }
          case 120:
          case 121:{
            if(inst.TODO != this.getInstantNumber()){
              inst.TODO = this.getInstantNumber();
              this.addCellFun(inst);
            }
            //this.reset(inst);
            st = 7;
            inst = caller;
            break;
            }
          case 122:{
            inst.caller = caller;
            inst.cell = inst.cube[inst.cellName];
            }
          case 123:{
            caller = inst;
            if(undefined != inst.cell){
              inst.oc = 124;
              inst = inst.cell;
              break;
              }
            }
          case 124:{
            inst.oc = 123;
            if(7 == st){
              this.reset(inst.cell);
              inst.oc = 123;
              }
            caller = inst = inst.caller;
            break;
            }
          default: throw "activate: undefined opcode "
                         +SC_Opcodes.toString(inst.oc);
          }
        }
      }
  , eoi: function(){
      var inst = this.prg;
      var seq = null;
      var caller = act_exit;
      //var oldInstOC = null;
      while(true){
        //this.activations++;
EOI:    switch(/*oldInstOC = */inst.oc){
          case 1:{
            return;
            }
          case 21:{
            caller = seq = inst;
            inst.oc = 22;
            inst = inst.seqElements[inst.idx];
            break;
            }
          case 22:{
            inst.oc = 21;
            seq = inst.seq
            caller = inst = inst.caller;
            break;
            }
          case 53:{
            seq.idx += inst.elsB;
            this.reset(inst);
            inst = caller;
            break;
            }
          case 58:
          case 57:{
            inst.oc = 59;
            caller = inst;
            inst = inst.p;
            break;
            }
          case 59:{
            if(inst.c.isPresent(this)){
              inst.oc = 62;
              this.reset(inst.p);
              }
            else{
              inst.oc = 55;
              }
            inst = caller = inst.caller;
            break;
            }
          case 61:
          case 60:{
            if(inst.c.isPresent(this)){
              inst.oc = 62;
              this.reset(inst.p);
              }
            inst = caller = inst.caller;
            break;
            }
          case 67:{
            caller = inst;
            inst.oc = 66;
            inst = inst.p;
            break;
            }
          case 66:{
            inst.oc = 64;
            inst = caller = inst.caller;
            break;
            }
          case 74:{
            this.addFun(inst.defaultAct);
            inst = caller;
            break;
            }
          case 77:{
            this.addFun(inst.defaultAct);
            }
          case 80:{
            if(inst.count > 0){
              inst.count--;
              }
            inst = caller;
            break;
            }
          case 86:{
            this.addFun(inst.defaultAct);
            inst.oc = 87;
            inst = caller;
            break;
            }
          case 83:{
            inst.oc = 84;
            inst = caller;
            break;
            }
          case 102:{
            if(null != inst.tmp){
              inst.suspended.append(inst.tmp);
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              caller = inst;
              inst = inst.tmp.prg;
              break;
              }
            tmp = inst.stopped.pop();
            while(null != tmp){
              tmp.flag = 1;
              inst.suspended.append(tmp);
              tmp = inst.stopped.pop();
              }
            if(inst.channel.isPresent(this)){
              this.addDynPar(inst);
              }
            else{
              if(inst.suspended.isEmpty()
                && inst.suspendedChain.isEmpty()
                && inst.waitting.isEmpty()
                && inst.halted.isEmpty()
                ){
                  inst.oc = 105;
                }
              }
            inst = caller = inst.caller;
            break;
            }
          case 107:{
            if(null != inst.tmp){
              inst.suspended.append(inst.tmp);
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              caller = inst;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.stopped.pop();
            while(null != tmp){
              tmp.flag = 1;
              inst.suspended.append(tmp);
              tmp = inst.stopped.pop();
              }
            inst = caller = inst.caller;
            break;
            }
          case 115:{
            caller = inst;
            inst.oc = 116;
            inst = inst.choice;
            break;
            }
          case 116:{
            inst.oc = 115;
            inst = caller = inst.caller;
            break;
            }
          case 118:{
            caller = inst;
            inst.oc = 119;
            inst = inst.p;
            break;
            }
          case 119:{
            inst.oc = 118;
            inst = caller = inst.caller;
            break;
            }
          default: throw "eoi : undefined opcode "
                          + SC_Opcodes.toString(inst.oc);

          }
        }
      }
  , reset: function(inst){
      var caller = act_exit;
      var oldInstOC = null;
      while(true){
RST:    switch(oldInstOC = inst.oc){
          case 1:{
            return;
            }
          case 2:
          case 8:{
            inst = caller;
            break;
            }
          case 9:{
            inst.oc = 8;
            inst = caller;
            break;
            }
          case 3:
          case 6:
          case 4:
          case 5:
          case 7:{
            inst.oc = 3;
            inst = caller;
            break;
            }
          case 10:{
            inst = caller;
            break;
            }
          case 12:
          case 11:{
            inst.oc = 10;
            inst = caller;
            break;
            }
          case 7:{
            inst.oc = 3;
            inst = caller;
            break;
            }
          case 13:
          case 14:{
            inst = caller;
            break;
            }
          case 15:
          case 16:{
            inst.oc = 15;
            inst = caller;
            break;
            }
          case 17:
          case 18:{
            inst.oc = 17;
            inst = caller;
            break;
            }
          case 19:
          case 20:{
            inst = caller;
            break;
            }
          case 21:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = 22;
            inst = inst.seqElements[inst.idx];
            break;
            }
          case 22:{
            inst.oc = 21;
            inst.idx = 0;
            inst = caller = inst.resetCaller;
            break;
            }
          case 23:
          case 24:
          case 25:
          case 26:{
            inst = caller;
            break;
            }
          case 27:{
            inst.oc = 26;
            }
          case 28:{
            inst = caller;
            break;
            }
          case 29:{
            inst.oc = 28;
            inst = caller;
            break;
            }
          case 30:{
            inst = caller;
            break;
            }
          case 31:{
            inst.oc = 30;
            inst = caller;
            break;
            }
          case 33:
          case 32:
          case 34:
          case 35:
          case 36:
          case 37:
          case 38:
          case 39:{
            inst = caller;
            break;
            }
          case 40:
          case 41:{
            inst.oc = 40;
            inst = caller;
            break;
            }
          case 42:
          case 43:{
            inst.oc = 42;
            inst = caller;
            break;
            }
          case 46:
          case 47:{
            inst.oc = 46;
            inst = caller;
            break;
            }
          case 44:
          case 45:{
            inst.oc = 44;
            inst = caller;
            break;
            }
          case 48:{
            inst = caller;
            break;
            }
          case 49:{
            inst.oc = 48;
            inst.config.unregister(inst);
            inst = caller;
            break;
            }
          case 50:{
            inst = caller;
            break;
            }
          case 51:{
            inst.oc = 50;
            inst.config.unregister(inst);
            inst = caller;
            break;
            }
          case 53:{
            inst.oc = 52;
            inst.c.unregister(inst);
            inst = caller;
            break;
            }
          case 55:
          case 57:
          case 58:
          case 59:
          case 60:
          case 61:
          case 62:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = 56;
            inst = inst.p;
            break;
            }
          case 56:{
            inst.oc = 55;
            inst = caller = inst.resetCaller;
            break;
            }
          case 63:
          case 64:
          case 65:{
            inst.resetCaller = caller;
            inst.oc = 66;
            caller = inst;
            inst = inst.p;
            break;
            }
          case 66:{
            inst.c.unregister(inst);
            inst.oc = 63;
            inst = caller = inst.resetCaller;
            break;
            }
          case 69:
          case 70:{
            inst = caller;
            break;
            }
          case 71:
          case 72:{
            inst.evtFun.config.unregister(inst);
            inst.oc = 70;
            }
          case 73:{
            inst = caller;
            break;
            }
          case 74:
          case 75:{
            inst.evtFun.config.unregister(inst);
            inst.oc = 73;
            }
          case 76:{
            inst = caller;
            break;
            }
          case 77:
          case 78:{
            inst.evtFun.config.unregister(inst);
            //inst.count = inst.times;
            inst.oc = 76;
            }
          case 79:{
            inst = caller;
            break;
            }
          case 80:
          case 81:{
            inst.evtFun.config.unregister(inst);
            inst.count = inst.times;
            inst.oc = 79;
            }
          case 82:{
            inst = caller;
            break;
            }
          case 83:
          case 84:{
            inst.evtFun.config.unregister(inst);
            inst.oc = 82;
            }
          case 85:{
            inst = caller;
            break;
            }
          case 86:
          case 87:{
            inst.evtFun.config.unregister(inst);
            inst.oc = 85;
            inst = caller;
            break;
            }
          case 88:
          case 89:{
            inst.evt = inst._evt;
            inst.oc = 88;
            }
          case 91:{
            inst = caller;
            break;
            }
          case 92:{
            inst.sensor.unregister(inst);
            inst.oc = 91;
            inst = caller;
            break;
            }
          case 93:
          case 94:
          case 95:
          case 96:
          case 97:{
            inst = caller;
            break;
            }
          case 98: {
            inst.count = inst.times;
            }
          case 99:
          case 100:{
            inst = caller;
            break;
            }
          case 101:
          case 105:
          case 102:{
            inst.resetCaller = caller;
            inst.oc = 103;
            caller = inst;
            }
          case 103:{
            inst.tmp = inst.suspended.pop();
            if(null != inst.tmp){
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.stopped.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waitting.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.halted.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.terminated.pop();
            while(null != tmp){
              tmp.flag = 1;
              tmp = inst.terminated.pop();
            }
            for(var i = 0; i < inst.originalBranches.length; i++){
              inst.suspended.append(inst.originalBranches[i]);
              }
            inst.channel.unregister(inst);
            inst.oc = 101;
            inst = caller = inst.resetCaller;
            break;
            }
          case 106:
          case 107:
          case 110:{
            inst.resetCaller = caller;
            inst.oc = 108;
            caller = inst;
            }
          case 108:{
            inst.tmp = inst.suspended.pop();
            if(null != inst.tmp){
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waittingEOI.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.stopped.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.waitting.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            inst.tmp = inst.halted.pop();
            if(null != inst.tmp){
              inst.tmp.flag = 1;
              inst = inst.tmp.prg;
              break;
              }
            var tmp = inst.terminated.pop();
            while(null != tmp){
              tmp.flag = 1;
              tmp = inst.terminated.pop();
              }
            for(var i = 0; i < inst.branches.length; i++){
              inst.suspended.append(inst.branches[i]);
              }
            inst.oc = 107;
            inst = caller = inst.resetCaller;
            break;
            }
          case 111:
          case 112:{
            inst.oc = 111;
            inst = caller;
            break;
            }
          case 115:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = 116;
            inst = inst.choice;
            break;
            }
          case 116:{
            caller = inst.resetCaller;
            inst.choice = null;
            inst.oc = 114;
            }
          case 114:{
            inst = caller;
            break;
            }
          case 118:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = 119;
            this.addFun(inst.lastWill);
            inst = inst.p;
            break;
            }
          case 119:{
            inst.oc = 118;
            inst = caller = inst.resetCaller;
            break;
            }
          case 120:{
            inst = caller;
            break;
            }
          case 121:{
            inst = caller;
            break;
            }
          case 123:{
            inst.resetCaller = caller;
            caller = inst;
            inst.oc = 124;
            inst = inst.cell;
            break;
            }
          case 124:{
            inst.oc = 123;
            inst = caller = inst.resetCaller;
            break;
            }
          default: throw "reset : undefined opcode "
                          + SC_Opcodes.toString(inst.oc);
          }
        }
      }
  };

/*********
 * SC_Kill Class
 *********/
function SC_Kill(c, p, end){
  this.c = c;
  this.p = p;
  this.end = end;
}
SC_Kill.prototype = {
  constructor : SC_Kill
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);  
      var copy = new SC_Instruction(54);
      copy.c = binder(this.c)
                  .bindTo(engine, parbranch, null, masterSeq, copy, cube);
      copy.p = this.p.bindTo(engine, parbranch, null, masterSeq, copy, cube);
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

/*********
 * SC_Control Class
 *********/
function SC_Control(c, p){
  this.c = c;
  this.p = p;
  }
SC_Control.prototype = {
  constructor:SC_Control
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(63);
      copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube);
      copy.p = this.p.bindTo(engine, parbranch, null, masterSeq, copy, cube);
      copy.path = path;
      return copy;
      }
  , toString : function(){
      return "control "+this.p.toString()
              +" by "+this.c.toString()
              +" end control ";
      }
  };

/*********
 * When Class
 *********/
function SC_When(c){
  this.c = c;
  this.elsB = 0;
  }
SC_When.prototype = {
  constructor: SC_When
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(52);
      copy.c = this.c.bindTo(engine, parbranch, null, masterSeq, copy, cube)
      copy.elsB = parseInt(this.elsB);
      copy.path = path;
      copy.seq = seq;
      return copy;
      }
  , toString : function(){
    return "when "+this.c.toString()+" then ";
  }
}

/*********
 * SC_Test Class
 *********/
function SC_Test(b){
  this.b = b;
  }
SC_Test.prototype = {
  constructor : SC_Test
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(cube);
      var copy = new SC_Instruction(69);
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

/*********
 * SC_Match Class
 *********/
function SC_Match(val, cases){
  this.v = val;
  this.cases = cases;
}
SC_Match.prototype = {
  constructor : SC_Match
  , isAnSCProgram : true
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var copy = new SC_Instruction(113);
      copy.v = this.v;
      copy.cases = new Array(this.cases.length);
      for(var n in this.cases){
        copy.cases[n] = this.cases[n]
                         .bindTo(engine, parbranch, null, masterSeq, copy, cube);
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

/*********
 * SC_Cube Class
 *********/
function SC_Cube(o, p, lastWill){
  this.o = o;
  this.p = p;
  this.lastWill = (undefined != lastWill)?lastWill:NO_FUN;
  this.toAdd = [];
}
SC_Cube.prototype = {
  constructor : SC_Cube
  , isAnSCProgram : true
  , addProgram : function(p){
    this.toAdd.push(p);
    }
  , bindTo : function(engine, parbranch, seq, masterSeq, path, cube){
      var binder = _SC._b(this);
      var tmp_par = SC.par();
      var tmp_par_dyn;
      if(undefined !== this.o.SC_cubeAddBehaviorEvt){
        throw "warning javascript object already configured !"
                    +"Be sure that it is not used bound to another program"
                    +", especially in a different reactive machine";
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
      var copy = new SC_Instruction(117);
      copy.o = this.o;
      copy.lastWill = binder(this.lastWill);
      copy.p = tmp_beh.bindTo(engine, parbranch, null
                        , masterSeq, path, this.o);
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
      tgt["$"+nom] = new SC_Cell({init:init, sideEffect: (tgt["_"+nom]).bind(tgt), eventList: el});
      Object.defineProperty(tgt, nom,{get : (function(nom){
        return tgt["$"+nom].val();
        }).bind(tgt, nom)});
      }
  };

function SC_ValueWrapper(tgt, n){
  this.tgt = tgt;
  this.n = n;
  }

SC_ValueWrapper.prototype.getVal = function(){
  return this.tgt[this.n];
  }

/*
 * Public API
 */
SC = {
  /*
   * SugarCubes Event Constructor.
   * The parameter (optional) act as a name for the event allowing one to
   * identify the event while debugging.
   */
  evt: function(name, distributeFun){
    return new SC_Event({name:name, distribute : distributeFun});
    },
  sensor: function(name, distributeFun){
    return new SC_Sensor({name:name, distribute : distributeFun});
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
    //end.relativeJump = -prgs.length;
    prgs[0].end = jump+1;
    //var t = new Repeat(n, prgs);
    var t = new SC_Seq(prgs);
    return t;
  },
  ifRepeatLabel: function(l, c){
    //console.log("original args ", arguments);
    var label = Array.prototype.shift.apply(arguments);
    //console.log("args splited in ",label , arguments)
    var tmp = this.ifRepeat.apply(this, arguments);
    tmp.seqElements[0].label = label;
    //console.log("what is built", tmp);
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
    //end.relativeJump = -prgs.length;
    prgs[0].end = jump+1;
    //var t = new Repeat(n, prgs);
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
    //console.log("or with ", tmp);
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
  },
  cube: function(o, p, lastWill){
    return new SC_Cube(o, p, lastWill);
  },
  cubeCell: function(c){
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
  _const_opcodes : SC_Opcodes,
  _const_opcodes_names : SC_OpcodesNames,
  _const_statevals : SC_Instruction_State,
  _const_statevals_names : SC_Instruction_state_str,
  forever: -1
};

/*******************************************************************************
* Language extension (prototype)                                               *
*******************************************************************************/
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
