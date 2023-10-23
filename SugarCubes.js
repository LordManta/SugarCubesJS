/*
 * SugarCubes.js
 * Authors : Jean-Ferdy Susini (MNF), Olivier Pons & Claude Lion
 * Created : 2/12/2014 9:23 PM
 * version : 5.0 alpha
 * implantation : 0.9.9
 * Copyleft 2014-2023.
 */
;
(function(){ //Chargement et identification du module
/*----------------------------------------------------------------------------*/
/*
SugarCubes internals.
Many comments are made in french, as they are personal working notes. English
comments should be more official, but it is still a work in progress...
 */
/*
Implementation notice: SugarCubesJS is used to build « reactive systems »
executed in a dedicated execution model «à la Boussinot». They are made of
reactive instructions built using reactive constructions. Reactive instructions
allows one to build tree structures which implement abstract syntax trees of
reactive programs. Reactive programs are executed by a reactive clock (shortly
called reactive machine or machine).
The reactive machine splits the execution of a whole reactive system into a
succession of logical steps called "instants of execution", during which
reactive instructions get activated according to their semantics.
Each instant of execution is decomposed in four successive phases:
  1. the reactive execution by itself during which reactive instruction are
     activated to execute their operational semantics.
  2. a phase where event values for the current instant are collected across
     the whole reactive system (visiting the whole abstract syntax tree of
     the program).
  3. a phase where atomic operations are performed (ideally to compute new
     memory states)
  4. a phase where the memory state of the system is swapped with the newly
     computed one and becomes available for the next instant.
 */
/*
Here we mainly focus on the reactive phase (phase 1) of an instant of execution,
which is itself is decomposed into 2 consecutive steps:
  - the activation phase: during which each instruction get activated and
    executes its operational semantics. The activation propagates across the
    AST of the reactive program. The implementation of this phase is mainly
    done by the activate() method of the reactive machine.
  - the end of instant phase: during which the reactive machine decides the
    end of the current instant. The reactive machine propagates this
    decision all along the AST of the whole reactive program, in order to
    make all reactive instructions which are awaiting for the end of instant
    to be informed of it. The implementation of this phase mainly takes place
    in the eoi() method of the reactive machine.
A reactive instruction is implemented as an object with a private state.
This state evolves according to time (ie the sequence of reactions). At each
instant, the reactive instructions can get activated and so can execute
their reaction according to their own operational semantics.
We are now going into further details about the activation() implementation.
After each activation (ie each call to the method activation() of an
instruction), an instruction informs about its progress returning a
status flag whose values are :
  - SUSP: meaning that the instruction has to be reactivated (the
    activation() method has to be called once again) before the end the
    current instant is decided by the reactive machine (before the any call
    to the method eoi() by the reactive machine).
  - WEOI: meaning that the instruction has to be reactivated if an event is
    generated during the current instant or when the end of the instant is
    decided by the reactive machine.
  - OEOI: meaning that only the eoi() method has to be called on the
    instruction when the end of the instant is decided by the reactive
    machine whatever happens new during the activation phase.
  - STOP: meaning that the instruction has finished its execution for the
    current instant. It has to be reactivated only at the subsequent
    instant.
  - WAIT: meaning that the instruction cannot progress anymore but has not
    terminated its execution. It has to be reactivated only if a particular
    event occurs (in the current instant or in subsequent ones). The eoi()
    method should not be called subsequently on such instructions as it has
    no effect. Those instructions are only interested by presence of events
    and not absence of events.
  - HALT: meaning that the instruction cannot progress anymore. It can only
    delays its execution to subsequent instant (we often say it consumes
    time). It is useless to activate it but its execution never terminates.
  - TERM: the instruction has completely terminated its execution. It is
    useless to activate it anymore.
 */
const SC_Instruction_state_str=[
  "UNDF" // Undefined => should be handled has an exception
, "SUSP" // Suspended => instruction release control allowing over parallel
         //              instructions to progress in turn. End of instant
         //              cannot occur until the suspended instruction has been
         //              resumed.
, "WEOI" // Wait End Of Instant => instruction releases control but it should
         //                        be resumed only if a waiting condition
         //                        happens (becomes true) during the very
         //                        current instant of the execution, or if the
         //                        end of instant is decided without satisfying
         //                        the waited condition. In this last case, the
         //                        execution is postponed to the next instant.
         //                        
, "OEOI" // Only End Of Instant => instruction release control until the end of
         //                        of instant is decided and the execution
         //                        resumes at the next instant
, "STOP"
, "WAIT"
, "STEP" // Stopping execution until the next reaction (not the next instant)
, "HALT"
, "TERM"
  ];
Object.freeze(SC_Instruction_state_str);
const SC_Instruction_State={
  toString: function(state){
    return SC_Instruction_state_str[state]+":"+state;
    }
  };
for(var st in SC_Instruction_state_str){
  SC_Instruction_State[SC_Instruction_state_str[st]]=st;
  }
Object.freeze(SC_Instruction_State);
const SC_Global_Manager={
  registeredMachines: []
, attachments: {}
/*
Ok les pending ne sont plus autorisés car ils posent différents problèmes
d'ordre sémantique... On va à nouveau dissocier machine et sensor.
  1. un sensor est un flot global unique qui définit une horloge logique.
  2. chaque sensor à un représentant unique dans une machine réactive
  3. la valeur du représentant d'un sensor est unique et a une seule valeur à
     chaque réaction.
*/
, connect: function(sid, ream){
    var list=this.attachments[sid];
    if(undefined==list){
      list=this.attachments[sid]=[];
      }
    list.push(ream);
    }
, disconnect: function(sid, ream){
    var list=this.attachments[sid];
    var i=list.indexOf(ream);
    list.splice(i, 1);
    }
, addToRegisteredMachines: function(m){
    this.registeredMachines.push(m);
    }
, removeFromRegisteredMachines: function(m){
    const idx= this.registeredMachines.indexOf(m);
    if(idx >= 0){
      this.registeredMachines.splice(idx, 1);
      }
    else{
      throw new Error("Internal error: trying to remove a not registered machine", m);
      }
    }
, updateSensor:
    function(sensorId, val){
/*
On parcours les machines pour enregistrer la nouvelle valeur, d'un Sensor...
C'est pas forcément l'idée du siècle, mais le but est de faciliter
l'échantillonnage par les machines réactives...
 */
    const ll=this.registeredMachines.length;
    for(var m=0 ; m<ll; m++){
      const machine=this.registeredMachines[m];
      machine.sampleSensor(sensorId, val);
      }
    const reactions=this.attachments[sensorId];
    if(reactions){
      for(var m of reactions){
        m();
        }
      }
    }
  };
Object.freeze(SC_Global_Manager);
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
function SC_CubeBinding(name, p){
  this.name=name; // nom de la ressource à récupérer
  this.cube=null; // cube cible où trouver la ressource
  this.args=undefined;
  if(undefined!==p){
    this.p=p;
    if(undefined!==p.p){
      this.args=p.p; // paramètres éventuels pour trouver la ressource
      }
    else if(undefined!==p.tp){
      this.tp=p.tp;
      }
    else{
      throw new Error("Invalid use of arguments on binding");
      }
    }
  };
SC_CubeBinding.prototype={
  constructor: SC_CubeBinding
, resolve: function(){
    if(undefined==this.cube){
      throw new Error("cube is null or undefined !");
      }
    var tgt=this.cube[this.name];
    if(undefined===tgt){
      console.error("target not found");
      return this;
      }
    else if("function"==typeof(tgt)){
      if(undefined!==this.args){
        tgt = tgt.bind(this.cube, this.args);
        }
      else if(undefined!==this.tp){
        tgt = tgt.bind(this.cube, this.cube[this.tp]);
        }
      else{
        tgt = tgt.bind(this.cube);
        }
      }
    return tgt;
    }
, setArgs: function(a){
    this.args=a;
    }
, setCube: function(aCube){
    this.cube=aCube;
    }
, toString: function(){
    return "@."+this.name+"";
    }
, clone: function(){
    if(this.p){
      return new SC_CubeBinding(this.name, this.p);
      }
    return new SC_CubeBinding(this.name);
    }
  };
Object.defineProperty(SC_CubeBinding.prototype, "isBinding"
                          , {enumerable: false
                             , value: true
                             , writable: false
                             }
                          );
function SC_CubeExposedState(cube){
  this.cube=cube;
  };
SC_CubeExposedState.prototype = {
  constructor: SC_CubeExposedState
, exposedState: function(m){
    return this.cube.getExposeReader(m);
    }
, setCube: function(cube){
    this.cube=cube;
    }
  };
/*
 * Méthodes utilitaires utilisées dans l'implantation des SugarCubes.
 */
var _SC={
/*
 * Fonction permettant de transformer un paramètre «bindable» en un
 * SC_CubeBinding permettant une résolution tardive.
 */
  b_: function(nm, args){
    if("string"==typeof(nm)){ // si on fournit un objet chaîne de caractères 
                              // c'est qu'on veut probablement faire un
                              // lien tardif vers la ressource. On va donc
                              // encapsuler cette chaîne dans un
                              // SC_CubeBinding
      //var tmp = new SC_CubeBinding(p);
      return new SC_CubeBinding(nm, args);
      }
    return nm;
    }
/*
 * Fonction permettant de transformer un paramètre «bindable» en un
 * SC_CubeBinding permettant la résolution tardive d'une fonction.
 */
  , b__: function(nm, args){
      if("string"==typeof(nm)){
        const tmp=new SC_CubeBinding(nm, args);
        return tmp;
        }
      throw new Error("not a valid binding");
      }
/*
 * Fonction permettant de résoudre le binding d'un paramètre SC_CubeBinding. Si
 * ce binding n'est pas encore définit, on retourne le l'objet SC_CubeBinding
 * en fixant l'objet cube sur lequel il porte pour réaliser une late binding ou
 * un binding dynamique.
 */
  , _b: function(cube){
      return function(o){
           if(o instanceof SC_CubeBinding){
             o=o.clone();
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
  , bindIt: function(targetAcion){
      if((undefined!==targetAcion.t)
         &&(undefined!==targetAcion.f)){
        const tmp=targetAcion.t[targetAcion.f];
        if((undefined!==tmp)
            &&("function"==typeof(tmp))){
          if(undefined!==targetAcion.p){
            return tmp.bind(targetAcion.t, targetAcion.p);
            }
          else if(undefined!==targetAcion.tp){
            return tmp.bind(targetAcion.t[targetAcion.tp], targetAcion.p);
            }
          else{
            return tmp.bind(targetAcion.t);
            }
          }
        }
      return targetAcion;
      }
/*
 * Fonctions utilitaires de vérification de types. Ne sont pas encore très
 * utilisées ni très développées.
 */
  , isEvent: function(evt){
      if(undefined == evt){
        return false;
        }
      return (evt instanceof SC_EventId)||(evt instanceof SC_SensorId);
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
             ||(evt instanceof SC_CubeBinding);
      }
  , checkStrictEvent: function(evt){
      if(! this.isStrictEvent(evt)){
        if(/^[a-zA-Z0-9_$]+$/.test(evt)){
            return this.b_(evt);
          }
        throw evt+" is an invalid event";
        }
        return evt;
      }
  , isConfig: function(cfg){
      if(undefined == cfg){
        return false;
        }
      return (cfg instanceof SC_Or) || (cfg instanceof SC_OrBin)
             || (cfg instanceof SC_And) || (cfg instanceof SC_AndBin)
             || (cfg instanceof SC_CubeBinding)
             || (cfg instanceof SC_SensorId)
             || this.isEvent(cfg);
      }
  , checkConfig: function(cfg){
      if(! this.isConfig(cfg)){
        if(/^[a-zA-Z0-9_$]+$/.test(cfg)){
            return this.b_(cfg);
          }
        throw cfg+" is an invalid config";
        }
      return cfg;
      }
  , lateBindProperty: function(copy, name, param){
      if(param instanceof SC_CubeBinding){
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
/*
 * Fonction qui étend un cube pour implanter quelques fonctions de base :
 *  - ajout d'un comportemnet en parallèle (les programmes sont émis sur
 *    l'événements SC_cubeAddBehaviorEvt)
 * Une cellule dans une cube est référencée par un champ préfixé par $
 * L'affectateur de la cellule est référencé par un champ préfixé par _
 * Cela n'est utile qu'à l'enregistrement...
 */
function SC_cubify(params){
  if(undefined==params){
    params={};
    }
  Object.defineProperty(this, "SC_cubeAddBehaviorEvt"
                          , {enumerable: false
                             , value: ((undefined != params.addEvent)
                                          ? params.addEvent
                                          : SC.evt("addBehaviorEvt"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeKillEvt"
                          , {enumerable: false
                             , value: ((undefined != params.killEvent)
                                          ? params.killEvent
                                          : SC.evt("killSelf"))
                             , writable: false
                             }
                          );
/*  Object.defineProperty(this, "SC_cubeCellifyEvt"
                          , {enumerable: false
                             , value: ((undefined != params.cellifyEvent)
                                          ?params.cellifyEvent
                                          :SC.evt("cellifyEvt"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "SC_cubeAddCellEvt"
                          , {enumerable: false
                             , value: ((undefined != params.addCellEvent)
                                          ?params.addCellEvent
                                          :SC.evt("addCellEvt"))
                             , writable: false
                             }
                          );
  Object.defineProperty(this, "$SC_cellMaker"
                           , { enumerable:false
                             , value: SC.cell(
                                        {
                                          init: null
                                        , sideEffect: function(val, evts, m){
               const cellifyRequests = m.getValuesOf(this.SC_cubeCellifyEvt);
               const ln = (undefined === cellifyRequests)
                                                   ?0
                                                   :cellifyRequests.length;
               for(var i = 0 ; i < ln; i++){
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
                     console.log("field already used on cube");
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
                             );*/
  if(params.sci){
    params.sci.call(this);
    }
  };
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
const VOID_VALUES=[];
Object.freeze(VOID_VALUES);
var nextEventID=0;
function SC_EventId(params){
/*
 * On définit idéalement un Event par :
 *  - un identifiant
 *  - mais aussi un type d'événement attendu
 *  - une structure de liste de valeurs produites dans l'instant
 *  - une fonction d'affectation de valeurs dans la structure
 *  - une fonction de récupération de valeurs dans la structure
 */
  this.makeNew=params.makeNew;
  this.distribute=params.distribute;
/*
 * Pour chaque identifiant, on aura une structure dédiée de type SC_Event
 * on garde un acces rapide en fonction d'une machine dans un tableau
 * associatif.
 */
  const registeredMachines={};
  Object.defineProperty(this, "internalId"
         , { value: nextEventID++, writable: false });
  Object.defineProperty(this, "name"
         , { value: "&_"+this.internalId+"_"+params.name, writable: false } );
/*
 * On va se lier à une instruction s'exécutant dans une machine spécifique.
 */
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
// *** SC_Event
function SC_Event(id, m){
  this.lein=-1; // numéro de la l'instant de la dernière émission
  this.name=id.name; // nom donné à l'événement (sert au debug)
  this.eventId=id;
  if(
    (undefined!=id.makeNew)
    && (undefined!=id.distribute)
    ){
    return new SC_EventDistributed(id);
    }
  // liste des valeurs associées aux emissions dans un même
  // instant.
  this.vals=[];
  this.permanentGenerators=[];
  this.permanentValuatedGenerator=0;
  this.registeredInst=[];  // gestion des instructions intéressées par
                           // l'événement. file d'attente.
  this.m=null; // retient la machine d'exécution réactive utilisée par
               // l'événement.
  //this.internalID = nextEventID++;
  };
SC_Event.prototype={
  constructor: SC_Event
, isPresent: function(m){
    return this.lein==m.instantNumber;
    }
/*
 * Réveil des instructions sur liste d'attente pour l'événement. Si cela ne
 * suffit pas à débloquer l'instruction (qui reste bloquée sur d'autres
 * événements l'instruction non débloquée est remise dans la liste d'attente
 * en utilisant une liste temporaire).
 * flag est propagé jusqu'au awake() d'un Par pour décider si la réexécution du
 * code est immédiate ou non.
 */
, wakeupAll: function(m, flag){
    //this.registeredInst.forEach(function(inst){
    //  inst.wakeup(m, flag);
    //  });
    for(var inst of this.registeredInst){
      inst.wakeup(m, flag);
      }
    }
/*
 * Génération de l'événement. Si l'événement n'a pas déjà été généré dans
 * l'instant, On mémorise l'instant le numéro de l'instant courrant comme
 * numéro de la dernière émission. On profite de l'occasion pour vider la liste
 * des valeurs.
 */
, generateInput: function(m, val){
    if(this.lein!=m.instantNumber){
      this.lein=m.instantNumber;
      this.vals=[];
      this.wakeupAll(m, true);
      if(undefined!=val){
        Object.defineProperty(m.generated_values
             , this.toString()
             , { get: function(){ return this.vals; }.bind(this) } );
        }
      }
    this.vals.push(val);
    }
, generate: function(m, flag){
    // flag indique désormais un generate valué.
    if(this.lein!=m.instantNumber){
      this.lein=m.instantNumber;
      this.vals=[];
      this.wakeupAll(m, false);
      if(flag){
        Object.defineProperty(m.generated_values
             , this.toString()
             , { get: function(){ return this.vals; }.bind(this) } );
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
  this.lein=-1; // numéro de la l'instant de la dernière émission
  this.name=id.name; // nom donné à l'événement (sert au debug)
  this.eventId=id;  
  this.makeNew=id.makeNew;
  this.distribute=id.distribute;
  this.vals=this.makeNew();
  this.permanentGenerators=[];
  this.permanentValuatedGenerator=0;
  this.registeredInst=[];  // gestion des instructions intéressées par
                           // l'événement. file d'attente.
  this.m=null; // retient la machine d'exécution réactive utilisée par
               // l'événement.
  this.internalID=nextEventID++;
  };
SC_EventDistributed.prototype={
  constructor: SC_EventDistributed
, generateInput: function(m, val){
    if(this.lein!=m.instantNumber){
      this.lein=m.instantNumber;
      this.vals=this.makeNew();
      this.wakeupAll(m, true);
      if(undefined!=val){
        Object.defineProperty(m.generated_values
             , this.toString()
             , { get: function(){ return this.vals; }.bind(this) } );
        }
      }
    this.distribute(this.vals, val);
    }
, generate: function(m, flag){
    // flag indique désormais un generate valué.
    if(this.lein!=m.instantNumber){
      this.lein=m.instantNumber;
      this.vals=this.makeNew();
      this.wakeupAll(m, false);
      if(flag){
        Object.defineProperty(m.generated_values
             , this.toString()
             , { get: function(){return this.vals; }.bind(this) } );
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
/*
 *******************************************************************************
 * SENSOR AND SENSOR_ID                                                        *
 *******************************************************************************
 * Le Sensor est une variante de l'événement. La présence ou l'absence d'un
 * sensor est connue au début de l'instant car il ne peut pas être généré en
 * cours d'instant. Il est soit présent soit absent. C'est une entrée du
 * système réactif. Le Sensor étant un événement global de l'application, un
 * identifiant est utilisé pour le référencer. Il s'agit d'un objet SensorId.
 * Le SensorId est créé grâce à l'API des SugarCubes. Il définit l'événement de
 * manière globale et chaque machine d'exécution réactive peut avoir une vision
 * échantillonnée de cet événement particulier. Un sensor quand il est défini
 * l'est donc à travers la création d'un SensorId. Il est possible pour un
 * environnement javascript de produire une nouvelle valeur pour ce sensor en
 * appelant la méthode newValue(). Chaque appel à newValue() ajoute donc une
 * valeur dans la série des valeurs du sensor.
 * Chaque machine réactive du système peut s'enregistrer auprès d'un SensorId
 * pour pouvoir échantillonner ses valeurs. A chaque nouvel instant d'une
 * machine réactive, le Sensor sera présent ou non si au moins une valeur aura
 * été enregistrée avec un appel à newValue() depuis l'échantillon précédent
 * c'est à dire le début de l'instant précédent.
 */
// *** SC_Sensor
function SC_SensorId(params){
/*
Éléments d'identification interne des SensorId...
 */
  Object.defineProperty(this, "internalId"
         , { value: nextEventID++, writable: false });
  Object.defineProperty(this, "name"
         , { value: "#_"+this.internalId+"_"+params.name, writable: false });
  //this.currentVal = null;
/*
 * On va se lier à une instruction s'exécutant dans une machine spécifique.
 */
    Object.defineProperty(this, "bindTo"
           , { value: function(engine, parbranch, seq, path, cube, cinst){
/*
 * On récupère le sensor associé à cet ID.
 */
      const sens=engine.getSensor(this);
      return sens;
      }, writable: false } );
  if(params.isPower){
    if((!isNaN(params.n) || !isNaN(params.delay))){
      this.n=params.n;
      this.delay=params.delay;
      this.async=(params.async)?params.async:NO_FUN;
      if(!isNaN(params.delay)){
        if(params.delay>0){
          const handle=setInterval(function(){
            SC_Global_Manager.updateSensor(this);
            }.bind(this), params.delay);
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
               , { value: function(){
                     for(var i=0; i<this.n; i++){
                       this.async();
                       SC_Global_Manager.updateSensor(this, i);
                       }
               }, writable: false } );
        }
      }
    else{
      const b={};
      const animDetector=function(b, ts){
        SC_Global_Manager.updateSensor(this, ts);
        window.requestAnimationFrame(b.ad);
        }.bind(this, b);
      b.ad=animDetector;
      window.requestAnimationFrame(animDetector);
      }
    }
  else{
/*
Gestion des liens aux événement du DOM.
On va modifier cette gestion pour la rendre obligatoire car les Sensor sont la
transcription réactive des événements du DOM => plus de fonction newValue()...
 */
    this.dom_targets=params.dom_targets;
    const handler=SC_Global_Manager.updateSensor.bind(SC_Global_Manager, this)
    Object.defineProperty(this, "release"
           , { value: function(){
                 if(this.dom_targets){
                   for(var t of this.dom_targets){
                     if(t.evt && "string"==typeof(t.evt)){
                       t.target.removeEventListener(t.evt, handler);
                       }
                     }
                   }
           }, writable: false } );
    if(this.dom_targets){
      for(var t of this.dom_targets){
        if(t.evt && "string"==typeof(t.evt)){
          t.target.addEventListener(t.evt
             , handler);
          }
        }
      }
    }
  };
SC_SensorId.prototype={
  constructor: SC_SensorId
, isSensor: true
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
function SC_SampledId(params){
  Object.defineProperty(this, "internalId"
         , { value: nextEventID++, writable: false });
  Object.defineProperty(this, "name"
         , { value: "#_"+this.internalId+"_"+params.name, writable: false });
  Object.defineProperty(this, "bindTo"
           , { value: function(engine, parbranch, seq, path, cube, cinst){
                 const sens=engine.getSensor(this);
                 return sens;
                 }, writable: false } );
  };
SC_SampledId.prototype={
  constructor: SC_SampledId
, isSensor: true
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
//  if(
//    (undefined != params.makeNew)
//    && (undefined != params.distribute)
//    ){
//    return new SC_EntryDistributed(params);
//    }
  this.sensId=params;
  //this.name=params.name;
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
      this.lein=m.instantNumber;
      this.wakeupAll(m, flag);
      if(val){
        Object.defineProperty(m.generated_values
             , this.sensId.toString()
             , {get: function(){return [this.val]; }.bind(this)});
        }
      this.val=val;
      m.setSensors[this.sensId.name]=[this.val];
      }
    }
, unregister: SC_Event.prototype.unregister
, registerInst: SC_Event.prototype.registerInst
, getValue: function(m){
    return this.val;
    }
, getAllValues: function(m, vals){
    //vals[this.sensId]=[this.val];
    }
, toString: function(){
    return this.sensId.getName();
    }
  };
//function SC_EntryDistributed(params){
//  this.lein = -1; // numéro de la l'instant de la dernière émission
//  //this.name = params.name; // nom donné à l'événement (sert au debug)
//  this.makeNew = params.makeNew;
//  this.sensId = params;
//  this.distribute = params.distribute;
//  this.vals = this.makeNew();
//  this.permanentGenerators = [];
//  this.permanentValuatedGenerator = 0;
//  this.registeredInst = [];  // gestion des instructions intéressées par
//                             // l'événement. file d'attente.
//  this.m = null; // retient la machine d'exécution réactive utilisée par
//                 // l'événement.
//  this.internalID = nextEventID++;
//  };
//SC_EntryDistributed.prototype = {
//  constructor: SC_EntryDistributed
//, systemGen : function(val, m, flag){
//    if(this.lein != m.instantNumber){
//      this.lein = m.instantNumber;
//      this.vals = this.makeNew();
//      this.wakeupAll(m, flag);
//      if(undefined != val){
//        Object.defineProperty(m.generated_values
//             , this.toString()
//             , {get : function(){return this.vals; }.bind(this)});
//        }
//      }
//    this.distribute(this.vals, val);
//    }
//, generate : SC_EventDistributed.prototype.generate
//, generateValues :  function(m, val){
//    this.distribute(this.vals, val);
//    }
//, getValues : SC_EventDistributed.prototype.getValues
//, __proto__ : SC_Sensor.prototype
//  };
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
  , "PAUSE_N_TIMES_INIT_INLINE"
  , "PAUSE_N_TIMES_INLINE"
  , "PAUSE_N_TIMES_INIT"
  , "PAUSE_N_TIMES"
  , "PAUSE_UNTIL_INIT"
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
  , "CUBE_STOP"
  , "CUBE_TERM"
  , "CUBE_WAIT"
  , "CUBE_HALT"
  , "CUBE_BACK"
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
  , "PAR_BRANCH"
  , "LOG"
  , "RESET_ON_INIT"
  , "RESET_ON"
  , "RESET_ON_BACK"
  , "RESET_ON_OEOI"
  , "RESET_ON_WEOI"
  , "RESET_ON_WAIT"
  , "RESET_ON_P_OEOI"
  , "RESET_ON_P_WAIT"
  , "DUMP_INIT"
  , "DUMP"
  , "DUMP_BACK"
  ];
Object.freeze(SC_OpcodesNames);
const SC_Opcodes={
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
      case SC_Opcodes.RESET_ON_P_WAIT:
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
        if(this.c.isPresent(m)){
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
      default:{ throw "wakeup undefined opcode "
                     +SC_Opcodes.toString(this.oc);
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
          var b = new SC_ParBranch(pb, this, SC_Nothing);
          b.prg = p.bindTo(engine, b, null, b, this.cube, this.cinst);
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
      default: throw new Error("unregisterFromProduction undefined for opcode "
                       +SC_Opcodes.toString(this.oc));
      }
    }
, registerForProduction: function(b, perma){
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
/*
 * Cell functions
 */
, val: function(){
    return this.state;
    }
, prepare: function(m){
    var vals = {};
    for(var i in this.eventList){
      const evt = m.getEvent(this.eventList[i]);
      if(evt.isPresent(m)){
        evt.getAllValues(m, vals);
        }
      }
    this.futur = this.sideEffect(this.state, vals, m.reactInterface);
    }
, swap: function(){
    this.state=this.futur;
    }
, generateValues: function(m){
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
/*
 * access field of a cube.
 */
, its: function(nom){
    return this.o["$"+nom];
    }
/*
 * Adding a cell.
 */
, addCell: function(nom, init, el, fun){
    switch(this.oc){
      case SC_Opcodes.CUBE:{
        const tgt = this.o;
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
        Object.defineProperty(tgt, nom,{get: (function(nom){
          return tgt["$"+nom].val();
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
      case SC_Opcodes.SEQ_BACK:
      case SC_Opcodes.SEQ_INIT:
      case SC_Opcodes.SEQ:{
        var res = "[\n"+tab;
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
      case SC_Opcodes.PAUSE_N_TIMES_INLINE:{
        return "pause "+this.count+"/"+this.times+" times";
        }
      case SC_Opcodes.CELL:{
        return "compute "+this.sideEffect+" on "+this.state
               +((null == this.eventList)?"":" with "+this.eventList);
        }
      default: throw new Error("toString() : undefined opcode "
                     +SC_Opcodes.toString(this.oc));
      }
    }
  };
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
  };
SC_RelativeJump.prototype = {
  constructor: SC_RelativeJump
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.REL_JUMP);
    copy.relativeJump = parseInt(this.relativeJump);
    copy.seq = seq;
    return copy;
    }
, toString: function(){
    return "end repeat ";
    }
  };
// *** If Cond Repeat sinon quitte la boucle un peu à la manière du while...
function SC_IfRepeatPoint(cond){
  this.condition = cond; // fonction retournant une valeur booleenne
  this.end = 0;
  };
SC_IfRepeatPoint.prototype = {
  constructor: SC_IfRepeatPoint
, isAnSCProgram: true
, toString: function(){
    return "while "+this.condition+" repeat ";
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const copy = new SC_Instruction(SC_Opcodes.IF_REPEAT_INIT);
    const binder = _SC._b(cube);
    copy.condition = binder(this.condition);
    copy._condition = this.condition;
    copy.end = parseInt(this.end);
    copy.seq = seq;
    return copy;
    }
  };
// *** Repeats
function SC_RepeatPointForever(){
  };
SC_RepeatPointForever.prototype = {
  constructor: SC_RepeatPointForever
, isAnSCProgram: true
, toString: function(){
    return "repeat forever ";
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.REPEAT_FOREVER);
    copy.seq = seq;
    return copy;
    }
  };
function SC_RepeatPoint(times){
  if(times < 0){
    return new SC_RepeatPointForever();
    }
  this.count = this.it = times;
  this.stopped = true;
  this.seq = null;
  this.end = 0;
  };
SC_RepeatPoint.prototype = {
  constructor: SC_RepeatPoint
, isAnSCProgram: true
, toString: function(){
    return "repeat "
                +((this.it<0)?"forever ":this.count+"/"+this.it+" times ");
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_it = binder(this.it);      
    if(bound_it < 0){
      return new SC_RepeatPointForever()
           .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    var copy = new SC_Instruction(SC_Opcodes.REPEAT_N_TIMES_INIT);
    copy.end = parseInt(this.end);
    if("function" == typeof bound_it){
      Object.defineProperty(copy, "it",{get: bound_it});
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
    return copy;
    }
  };
/*******************************************************************************
 * SC_Await Instruction
 ******************************************************************************/
function SC_Await(aConfig){
  this.config = aConfig;
  this.path = null;
}
SC_Await.prototype = {
  constructor: SC_Await
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_config = binder(this.config);
    var zeConf = bound_config
                           .bindTo(engine, parbranch, seq, path, cube, cinst);
    var copy = new SC_Instruction(SC_Opcodes.AWAIT);
    copy.config = zeConf;
    copy._config = this.config;
    copy.path = path;
    return copy;
    }
, toString: function(){
    return "await "+this.config.toString()+" ";
    }
  };
/*******************************************************************************
 * Event Generation
 ******************************************************************************/
function SC_GenerateForeverLateEvtNoVal(evt){
  if((undefined == evt)
        ||(! (evt instanceof SC_CubeBinding))){
    throw "GenerateForEver : late binding event error :("+evt+")";
    }
  this.evt = evt;
  };
SC_GenerateForeverLateEvtNoVal.prototype = {
  constructor: SC_GenerateForeverLateEvtNoVal
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_LATE_EVT_NO_VAL);
    copy.evt = this.evt.bindTo(engine);
    copy._evt = this._evt;
    return copy;
    }
, toString: function(){
    return "generate "+this.evt.toString()+" forever ";
    }
  };
// *** SC_GenerateForever
function SC_GenerateForeverLateVal(evt, val){
  if((undefined == val|| !(val instanceof SC_CubeBinding))||(undefined == evt)){
    throw "error on evt:("+evt+") or val:("+val+")";
    }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
  };
SC_GenerateForeverLateVal.prototype = {
  constructor: SC_GenerateForeverLateVal
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
                .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      }
    copy.itsParent = parbranch;
    copy._evt = this.evt.bindTo(engine);
    copy._val = this.val;
    parbranch.declarePotential();
    return copy;
    }
, toString: function(){
    return "generate "+this.evt.toString()
           +((null != this.val)?"("+this.val.toString()+") ":"")
           +" forever ";
    }
  };
// -----
function SC_GenerateForeverNoVal(evt){
  if((undefined == evt)
        ||(! (evt instanceof SC_EventId
              || evt instanceof SC_CubeBinding
              || evt instanceof SC_SensorId))){
    throw "GenerateForEver error on evt:("+evt+")";
    }
  this.evt = evt;
  };
SC_GenerateForeverNoVal.prototype = {
  constructor: SC_GenerateForeverNoVal
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.GENERATE_FOREVER_NO_VAL_INIT);
    copy.evt = this.evt.bindTo(engine);
    copy._evt = this.evt;
    return copy;
    }
, toString: SC_GenerateForeverLateEvtNoVal.prototype.toString
  };
// --- Forever
function SC_GenerateForever(evt, val){
  if(undefined === val){
    return new SC_GenerateForeverNoVal(evt);
  }
  this.evt = evt;
  this.val = val;
  this.itsParent = null;
}
SC_GenerateForever.prototype = {
  constructor: SC_GenerateForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_evt = binder(this.evt).bindTo(engine);
    var bound_value = binder(this.val);
    var copy = null;
    if(bound_evt instanceof SC_CubeBinding){
      if(bound_value instanceof SC_CubeBinding){
        return new SC_GenerateForeverLateEvtLateVal(bound_evt, bound_value)
               .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      else{
        return new SC_GenerateForeverLateEvt(bound_evt, bound_value)
               .bindTo(engine, parbranch, seq, path, cube, cinst);
        }
      }
    else if(bound_value instanceof SC_CubeBinding){
      return new SC_GenerateForeverLateVal(bound_evt, bound_value)
               .bindTo(engine, parbranch, seq, path, cube, cinst);
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
, toString: function(){
    return "generate "+this.evt.toString()
           +this.val+" forever ";
    }
  };
// *** SC_GenerateOneNoVal
function SC_GenerateOneNoVal(evt){
  this.evt = evt;
  };
SC_GenerateOneNoVal.prototype = {
  constructor: SC_GenerateOneNoVal
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.GENERATE_ONE_NO_VAL);
    copy.evt = binder(this.evt).bindTo(engine);
    return copy;
    }
, toString: function(){
    return "generate "+this.evt.toString();
    }
  };
// *** SC_GenerateOne
function SC_GenerateOne(evt, val){
  if(undefined===val){
    return new SC_GenerateOneNoVal(evt);
    }
  this.evt=evt;
  this.val=val;
  this.itsParent=null;
  };
SC_GenerateOne.prototype={
  constructor: SC_GenerateOne
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder=_SC._b(cube);
    var copy=null;
    if(null===this.evt){
      this.evt=engine.traceEvt;
      }
    else if(SC_WRITE_ID===this.evt){
      this.evt=engine.writeEvt;
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
            && copy.val.oc==SC_Opcodes.CELL){
      copy.oc=SC_Opcodes.GENERATE_ONE_CELL;
      }
    copy.itsParent=parbranch;
    copy._evt=this.evt;
    copy._val=this.val;
    parbranch.declarePotential();
    return copy;
    }
, toString: function(){
    if(null==this.evt){
      return "tarce("+this.val.toString()+");"
      }
    return "generate "+this.evt.toString()
           +((null!=this.val)?"("+this.val.toString()+") ":"");
    }
  };
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
  };
SC_Generate.prototype = {
  constructor: SC_Generate
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
, toString: function(){
    return "generate "+this.evt.toString()+" ("
           +this.val+") for "+this.count+"/"+this.times+" times ";
    }
  };
function SC_GenerateNoVal(evt, times){
  this.evt = evt;
  this.itsParent = null;
  this.count = this.times = times;
  };
SC_GenerateNoVal.prototype = {
  constructor: SC_GenerateNoVal
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = null;
    var binder = _SC._b(cube);
    var tmp_times = binder(this.times);
    var tmp_evt = binder(this.evt).bindTo(engine);
    if(tmp_times < 0){
      return new SC_GenerateForeverNoVal(tmp_evt)
             .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(0 === tmp_times){
      return SC_nothing;
      }
    else if((undefined === tmp_times)||(1 == tmp_times)){
      return new SC_GenerateOneNoVal(tmp_evt)
             .bindTo(engine, parbranch, seq, path, cube);
      }
    copy = new SC_Instruction(SC_Opcodes.GENERATE_NO_VAL_INIT);
    copy.evt = tmp_evt
    copy.times = tmp_times;
    copy.itsParent = parbranch;
    copy._times = this.times;
    copy._evt = this.evt;
    return copy;
    }
, toString: function(){
    return "generate "+this.evt.toString()+" for "
            +this.count+"/"+this.times+" times ";
    }
  }
// *** Filters Instructions
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
  constructor: SC_FilterForeverNoSens
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_sensor = binder(this.sensor);
    var bound_fun = binder(this.filterFun);
    var bound_evt = binder(this.evt).bindTo(engine);
    bound_fun = _SC.bindIt(bound_fun);
    var copy = new SC_Instruction(SC_Opcodes.FILTER_FOREVER_NO_ABS);
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path, cube, cinst);
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
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path, cube, cinst);
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
             +" with fun{"+this.filterFun+"} generate "+this.evt+" or "+this.noSens_evt
             +" forever ";
    }
  }
// *** SC_FilterOne
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
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path, cube, cinst);
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
                    ((-1 == this.times )?" forever ":(" for "+this.count+"/"+this.times+" times ")):"");
    }
  };
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
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path, cube, cinst);
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
                    ((-1 == this.times )?" forever ":(" for "+this.count+"/"+this.times+" times ")):"");
    }
  };
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
  };
SC_FilterNoSens.prototype = {
  constructor: SC_FilterNoSens
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_sensor = binder(this.sensor);
    var bound_fun = binder(this.filterFun);
    var bound_evt = binder(this.evt);
    var bound_times = binder(this.times);
    var copy = null;
    bound_fun = _SC.bindIt(bound_fun);
    if(0 == bound_times){
      return SC_nothing;
      }
    if((undefined === bound_times) || (1 == bound_times)){
      return new SC_FilterOneNoSens(bound_sensor, bound_fun, bound_evt
                                          , bound_noSens_evt)
         .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(bound_times < 0){
      return new SC_FilterForeverNoSens(bound_sensor, bound_fun, bound_evt
                                              , bound_noSens_evt)
         .bindTo(engine, parbranch, seq, path, cube, cinst);
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
, toString: function(){
    return "filter "+this.sensor.toString()
             +" with fun{"+this.filterFun+"} generate "+this.evt+" "
             +((1 != this.times)?
                    (" for "+this.count+"/"+this.times+" times "):"");
    }
  };
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
    copy.sensor = bound_sensor.bindTo(engine, parbranch, seq, path, cube, cinst);
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
// -- SC_SendOne
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
// -- SendForever
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
/*******************************************************************************
 * Nothing Object
 ******************************************************************************/
const SC_Nothing={};//new SC_Instruction(SC_Opcodes.NOTHING);
const SC_nothing=new SC_Instruction(SC_Opcodes.NOTHING);
const SC_nothing_inlined=new SC_Instruction(SC_Opcodes.NOTHING_INLINED);
SC_Nothing.isAnSCProgram=true;
SC_Nothing.bindTo=function(){
  return SC_nothing;
  }
Object.freeze(SC_Nothing);
/*******************************************************************************
 * Next Object
 ******************************************************************************/
function SC_Next(count){
  this.count = count;
  };
SC_Next.prototype = {
  constructor: SC_Next
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);
    const count = binder(this.count);
    const copy = new SC_Instruction(('function' == typeof(count))
                                          ?SC_Opcodes.NEXT_DYN
                                          :SC_Opcodes.NEXT
                                   );
    copy.count = count;
    copy._count = this.count;
    return copy;
    }
  };
/*******************************************************************************
 * SC_Pause Instructions
 ******************************************************************************/
// *** SC_PauseForever
const SC_PauseForever=new SC_Instruction(SC_Opcodes.HALT);
const SC_PauseForEver={};
SC_PauseForEver.isAnSCProgram=true;
SC_PauseForEver.bindTo=function(engine, parbranch, seq, path, cube, cinst){
  return SC_PauseForever;
  };
Object.freeze(SC_PauseForEver);
// *** SC_PauseOne
function SC_PauseOne(){
  };
SC_PauseOne.prototype = {
  constructor: SC_PauseOne
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    return new SC_Instruction(SC_Opcodes.PAUSE);
    }
, toString: function(){
    return "pause ";
    }
  };
// *** SC_Pause
function SC_Pause(times){
  if(times < 0){
    return SC_PauseForEver;
    }
  if(0 === times){
    return SC_Nothing;
    }
  this.count = this.times = (undefined == times)?1:times;
  if(1 === this.time){
    return new SC_PauseOne();
    }
  };
SC_Pause.prototype = {
  constructor: SC_Pause
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
      return new SC_PauseOne().bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    copy = new SC_Instruction(SC_Opcodes.PAUSE_N_TIMES_INIT);
    _SC.lateBindProperty(copy, "times", bound_times);
    copy._times = this.times;
    return copy;
    }
, toString: function(){
    return "pause "+this.count+"/"+this.times+" times ";
    }
  };
// *** SC_PauseRT
function SC_PauseRT(duration){
  this.duration = duration;
  };
SC_PauseRT.prototype = {
  constructor: SC_PauseRT
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.PAUSE_RT_INIT);
    copy.duration = this.duration*1000;
    copy._duration = this.duration;
    return copy;
    }
, toString: function(){
    return "pause for "+this.duration+" ms ";
    }
  };
function SC_PauseUntil(cond){
  this.cond = cond;
  };
SC_PauseUntil.prototype = {
  constructor: SC_PauseUntil
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var bound_cond = binder(this.cond);
    var copy = null;
    if(bound_cond === true){
      return SC_PauseOne
              .bindTo(engine, parbranch, seq, path, cube, cinst);
      }
    else if(false == bound_cond){
      return SC_PauseForever;
      }
    copy = new SC_Instruction(SC_Opcodes.PAUSE_UNTIL);
    copy.cond = bound_cond;
    copy._cond = this.cond;
    return copy;
    }
, toString: function(){
    return "pause until "+this.cond;
    }
  };
/*******************************************************************************
 * SC_Step Instructions
 ******************************************************************************/
// *** SC_StepOne
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
// *** SC_Step
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
//// *** SC_PauseRT
//// à remplacer par un do HALT kill timeIsUpEvent...
//function SC_PauseRT(duration){
//  this.duration = duration;
//  };
//SC_PauseRT.prototype = {
//  constructor: SC_PauseRT
//, isAnSCProgram: true
//, bindTo: function(engine, parbranch, seq, path, cube, cinst){
//    var binder = _SC._b(cube);
//    var copy = new SC_Instruction(SC_Opcodes.PAUSE_RT_INIT);
//    copy.duration = this.duration*1000;
//    copy._duration = this.duration;
//    return copy;
//    }
//, toString: function(){
//    return "pause for "+this.duration+" ms ";
//    }
//  }
//
//function SC_PauseUntil(cond){
//  this.cond = cond;
//  };
//SC_PauseUntil.prototype = {
//  constructor: SC_PauseUntil
//, isAnSCProgram: true
//, bindTo: function(engine, parbranch, seq, path, cube, cinst){
//    var binder = _SC._b(cube);
//    var bound_cond = binder(this.cond);
//    var copy = null;
//    if(bound_cond === true){
//      return SC_PauseOne
//              .bindTo(engine, parbranch, seq, path, cube, cinst);
//      }
//    else if(false == bound_cond){
//      return SC_PauseForever;
//      }
//    copy = new SC_Instruction(SC_Opcodes.PAUSE_UNTIL);
//    copy.cond = bound_cond;
//    copy._cond = this.cond;
//    return copy;
//    }
//, toString: function(){
//    return "pause until "+this.cond;
//    }
//  };
/*******************************************************************************
 * SC_Seq Instruction
 ******************************************************************************/
function SC_Seq(seqElements){
  this.seqElements = [];
  for(var i = 0; i < seqElements.length; i++){
    const prg = seqElements[i];
    if(SC_Nothing == prg){
      continue;
      }
    if(prg instanceof SC_Seq){
      const len = prg.seqElements.length;
      for(var j = 0; j < len; j++){
        this.seqElements.push(prg.seqElements[j]);
        }
      }
    else{
      this.seqElements.push(prg);
      }
    }
  };
SC_Seq.prototype = {
  constructor: SC_Seq
, isAnSCProgram: true
, add: function(p){
    if(p){
      if(p instanceof SC_Seq){
        for(var j=0; j<p.seqElements.length; j++){
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
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
      var copy=new SC_Instruction(SC_Opcodes.SEQ_INIT);
      copy.seqElements=[];
      for(var i=0; i<this.seqElements.length; i++){
        var prg=this.seqElements[i];
        if(prg===SC_nothing){
          throw new Error("Seq binding : encountered nothing !");
          prg=SC_nothing_inlined;
          }
        if(prg instanceof SC_Seq){
          throw new Error("Seq : binding while seq is in !");
          for(var j=0; j<prg.seqElements.length; j++){
            copy.seqElements.push(prg.seqElements[j]);
            }
          }
        else{
          copy.seqElements.push(prg);
          }
        }
      copy.idx = 0;//-1;
      for(var i = 0; i < copy.seqElements.length; i++){
        copy.seqElements[i] = copy.seqElements[i].bindTo(engine, parbranch, copy
            , copy, cube, cinst);
        switch(copy.seqElements[i].oc){
          case SC_Opcodes.PAUSE:{
            copy.seqElements[i].oc = SC_Opcodes.PAUSE_INLINE;
            break;
            }
          case SC_Opcodes.PAUSE_N_TIMES_INIT: {
            copy.seqElements[i].oc = SC_Opcodes.PAUSE_N_TIMES_INIT_INLINE;
            break;
            }
          case SC_Opcodes.NEXT: {
            copy.seqElements[i].oc = SC_Opcodes.NEXT_INLINED;
            break;
            }
          case SC_Opcodes.NEXT_DYN: {
            copy.seqElements[i].oc = SC_Opcodes.NEXT_DYN_INLINED;
            break;
            }
          case SC_Opcodes.ACTION: {
            copy.seqElements[i].oc = SC_Opcodes.ACTION_INLINE;
            break;
            }
          case SC_Opcodes.ACTION_N_TIMES_INIT: {
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
          case SC_Opcodes.STEP:{
            copy.seqElements[i].oc = SC_Opcodes.STEP_INLINE;
            break;
            }
          case SC_Opcodes.STEP_N_TIMES_INIT:{
            copy.seqElements[i].oc = SC_Opcodes.STEP_N_TIMES_INIT_INLINE;
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
      }
, toString: function(){
      var res ="[";
      for(var i = 0; i < this.seqElements.length; i++){
        res += this.seqElements[i].toString();
        res += (i < this.seqElements.length-1)?";":"";
        }
      return res+"] ";
      }
  };
/*******************************************************************************
 * SC_Reset
 ******************************************************************************/
// *** SC_ResetOn
function SC_ResetOn(config, prog){
  this.config = config;
  this.prog = prog;
  };
SC_ResetOn.prototype = {
  constructor: SC_ResetOn
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.RESET_ON_INIT);
    copy.config = binder(this.config)
                .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.prog = this.prog
                .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.path = path;
    return copy;
    }
  };
/*******************************************************************************
 * SC_Action Instruction
 ******************************************************************************/
// *** SC_ActionForever
function SC_ActionForever(f){
  this.action = f;
  };
SC_ActionForever.prototype = {
  constructor: SC_ActionForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.ACTION_FOREVER_INIT);
    copy.action = binder(this.action);
    copy._action = this.action;
    copy.closure = _SC.bindIt(copy.action);
    return copy;
    }
, toString: function(){
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
// *** SC_SimpleAction
function SC_SimpleAction(f){
  if(undefined === f){
    throw "undefined action";
    }
  this.action = f;
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
// *** SC_Log
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
/*********
 * ActionOnEvent Class
 *********/
function SC_ActionOnEventForeverNoDef(c, act){
  this.evtFun={action: act, config: c};
  };
SC_ActionOnEventForeverNoDef.prototype = {
  constructor: SC_ActionOnEventForeverNoDef
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(cube);
    var copy = new SC_Instruction(SC_Opcodes.ACTION_ON_EVENT_FOREVER_NO_DEFAULT);
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
// --- 
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
// --- 
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
// --- 
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
/*********
 * SC_ParBranch Class
 *********/
function SC_ParBranch(aParent, aPar, prg){
  this.oc = SC_Opcodes.PAR_BRANCH;
  this.prev = null;
  this.next = null;
  this.prg = prg;
  this.flag = SC_Instruction_State.SUSP;
  this.itsParent = aParent;
  this.itsPar = aPar;
  //this.hasProduction = false;
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
  };
SC_ParBranch.prototype = {
  constructor: SC_ParBranch
, declarePotential: function(){
    if(this.hasPotential){
      return;
      }
    this.hasPotential = true;
    this.idxInProd = this.itsPar.registerInProdBranch(this);
    if(null != this.itsParent){
      this.itsParent.declarePotential();
      }
    }
, registerForProduction: SC_Instruction.prototype.registerForProduction
, unregisterFromProduction: SC_Instruction.prototype.unregisterFromProduction
, awake: SC_Instruction.prototype.awake
  };
/*********
 * Queues
 *********/
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
  };
SC_Par.prototype = {
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
      var b = new SC_ParBranch(parbranch, copy, SC_nothing);
      b.prg = tmp.prg.bindTo(engine, b, null, b, cube, cinst);
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
      var b = new SC_ParBranch(parbranch, copy, SC_nothing);
      b.prg = i.prg.bindTo(engine, b, null, b, cube, cinst);
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
/*********
 * And Class
 *********/
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
    throw "not enough elements to combine with And operator ("+configsArray.length+")";
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
      tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch, seq, path, cube, cinst));
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
/*********
 * Or Class
 *********/
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
    throw "not enough elements to combine with And operator ("+configsArray.length+")";
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
      tmp_configs.push(binder(this.c[i]).bindTo(engine, parbranch, seq, path, cube, cinst));
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
/*
 * Cells
 * contient son propre état...
 */
function SC_Cell(params){// {target?:(filed:) sideEffect: init?:}
  if(undefined == params){
    throw new Error("undefined params for SC_Cell");
    }
  const recell= undefined != params.target;
  if(recell && ((undefined == params.field)
    || (undefined  == params.target[params.field]))){
     throw new Error("field not specified on target ("+params.field+")");
    }
  if(undefined == params.sideEffect){
    throw new Error("undefined sideEffect !");
    }
  this.params= params;
  };
SC_Cell.prototype = {
  constructor: SC_Cell
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var tgt = cube[this.cellName];
    const params= this.params;
    const recell= undefined != params.target;
    const cell= new SC_Instruction(SC_Opcodes.CELL);
    cell.itsParent= this;
    if(recell){
      Object.defineProperty(cell, "state",{set: (function(nom, x){
          this[nom] = x;
        }).bind(params.target, params.field)
        , get: (function(nom){
          return this[nom];
        }).bind(params.target, params.field)
        });
      }
    else{
      cell.state = (params.init)?params.init:null;
      }
    if(undefined != params.sideEffect.t){ //forme : {t: , f:}
      cell.sideEffect = params.sideEffect.t[params.sideEffect.f]
                                     .bind(params.sideEffect.t);
      }
    else{
      cell.sideEffect = params.sideEffect;
      }
    cell.eventList = (undefined == params.eventList)?[]:params.eventList;
    cell.TODO =  -1;
    cell.futur = null;
    this.val= function(cell){return cell.val();}.bind(this, cell);
    this.bindTo= function(cell){return cell;}.bind(this, cell);
    return cell;
    }
  };
function SC_CubeCell(c){
  this.cellName = c;
  };
SC_CubeCell.prototype = {
  constructor: SC_CubeCell
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var tgt = cube[this.cellName];
    var copy = new SC_Instruction(SC_Opcodes.CUBE_CELL_INIT);
    if(tgt instanceof SC_Instruction
      &&(tgt.oc == SC_Opcodes.CELL)){
      return tgt.bindTo(engine, parbranch, seq, copy, cube, cinst);
      }
    copy.cellName = this.cellName;
    copy.cell=null;
    copy.cube = cube;
    copy.path = path;
    return copy;
    }
, toString: function(){
    return "activ cell "+this.cellName;
    }
  };
/*********
 * SC_Kill Class
 *********/
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
/*********
 * SC_Control Class
 *********/
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
/*********
 * When Class
 *********/
function SC_When(c){
  this.c = c;
  this.elsB = 0;
  };
SC_When.prototype = {
  constructor: SC_When
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);
    const bound_config = binder(this.c);
    const copy = new SC_Instruction(SC_Opcodes.WHEN);
    copy.c = bound_config
               .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.elsB = parseInt(this.elsB);
    copy.path = path;
    copy.seq = seq;
    return copy;
    }
, toString: function(){
    return "when "+this.c.toString()+" then ";
    }
  };
/*********
 * SC_Dump Class
 *********/
function SC_Dump(p){
  this.p = p;
  };
SC_Dump.prototype = {
  constructor:SC_Dump
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.DUMP_INIT);
    copy.p = this.p.bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.path = path;
    return copy;
    }
, toString: function(){
    return "dump "+this.p.toString()
            +" end dump ";
    }
  };
/*********
 * When Class
 *********/
function SC_When(c){
  this.c = c;
  this.elsB = 0;
  };
SC_When.prototype = {
  constructor: SC_When
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    const binder = _SC._b(cube);
    const bound_config = binder(this.c);
    const copy = new SC_Instruction(SC_Opcodes.WHEN);
    copy.c = bound_config
               .bindTo(engine, parbranch, null, copy, cube, cinst);
    copy.elsB = parseInt(this.elsB);
    copy.path = path;
    copy.seq = seq;
    return copy;
    }
, toString: function(){
    return "when "+this.c.toString()+" then ";
    }
  };
/*********
 * SC_Test Class
 *********/
function SC_Test(b){
  this.b = b;
  };
SC_Test.prototype = {
  constructor: SC_Test
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
, toString: function(){
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
  };
SC_Match.prototype = {
  constructor: SC_Match
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var copy = new SC_Instruction(SC_Opcodes.MATCH_INIT);
    copy.v = this.v;
    copy.cases = new Array(this.cases.length);
    for(var n in this.cases){
      copy.cases[n] = this.cases[n]
                       .bindTo(engine, parbranch, null, copy, cube, cinst);
    }
    copy.path = path;
    return copy;
    }
, toString: function(){
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
function SC_Cube(o, p, extension){
  this.o=o;
  if(undefined==p || !p.isAnSCProgram){
    throw new Error("program not well formed for a cube.");
    }
  this.p=p;
  this.init=NO_FUN;
  this.lastWill=NO_FUN;
  if(undefined!=extension){
    if(undefined!=extension.init){
      if(typeof(extension.init)=="function"){
        this.init=extension.init;
        }
      else{
        throw new Error("init for cube is not a function "+extension.init);
        }
      }
    if(undefined!=extension.lastWill){
      if(typeof(extension.lastWill)=="function"){
        this.lastWill=extension.lastWill;
        }
      else{
        throw new Error("lastWill for cube is not a function "
                       +extension.lastWill);
        }
      }
    if(undefined!=extension.swapList){
      this.swapList=extension.swapList;
      }
    if(undefined!=extension.cubeProto){
      this.cubeProto=extension.cubeProto;
      }
    else {
      this.cubeProto={};
      }
    }
  else{
    this.cubeProto={};
    }
  this.toAdd=[];
  };
SC_Cube.prototype = {
  constructor: SC_Cube
, isAnSCProgram: true
, addProgram: function(p){
    if((undefined == p)||!p.isAnSCProgram){
      throw new Error("undefined program to add in cube: "+p);
      }
    this.toAdd.push(p);
    }
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
    var binder = _SC._b(this);
    if(undefined !== this.o.SC_cubeAddBehaviorEvt){
      throw "warning javascript object already configured !"
                  +"Be sure that it is not used bound to another program"
                  +", especially in a different reactive machine";
      //console.trace();        
      return null;
      }
    SC_cubify.apply(this.o, this.cubeProto);
    var copy = new SC_Instruction(SC_Opcodes.CUBE_ZERO);
    copy.o = this.o;
    const Evt_kill = this.o.SC_cubeKillEvt;
    copy.killEvt = Evt_kill.bindTo(engine, parbranch
                                 , null, copy, cube, cinst);
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
    var tmp_beh=tmp_par_dyn=SC.parex(this.o.SC_cubeAddBehaviorEvt
             , this.p
               );
    for(var i=0; i<this.toAdd.length; i++){
      tmp_par_dyn.add(this.toAdd[i]);
      }
    copy.path=path;
    var swap_text="(function(state, m){";
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
                      , copy, copy.o, copy);
    copy.dynamic = tmp_par_dyn;
    copy.m = engine;
    copy.pb = parbranch;
    return copy;
    }
, toString: function(){
    return "cube "+this.o.toString()
            +" with "+this.p.toString()
            +" end cube ";
    }
  };
// *** SC_CubeActionForever
function SC_CubeActionForever(params){
  this.action = params.fun;
  this.evtList = (params.evtList)?params.evtList:[];
  };
SC_CubeActionForever.prototype = {
  constructor: SC_CubeActionForever
, isAnSCProgram: true
, bindTo: function(engine, parbranch, seq, path, cube, cinst){
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
, toString: function(){
    return "call "+((undefined == this.action.f)?" "+this.action+" "
                 :this.action.t+"."+this.action.f+"()")+" forever";
    }
  };
// *** SC_Action
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
// *** SC_SimpleAction
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
      copy.closure = copy.action.bind(cube);
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
/*********
 * SC_Machine Class
 *********/
var nextMachineID = 0;
const SC_WRITE_ID=new SC_EventId("SC_WRITE_ID");
function SC_ReactiveInterface(){
  };
SC_ReactiveInterface.prototype = {
  constructor: SC_ReactiveInterface
, sensorValueOf: function(sensorID){
    if(sensorID instanceof SC_SensorId){
      let val = this.all[sensorID.name];
      return val?val[0]:undefined;
      }
    throw new Error("ask for value of non sensor ID");
    }
  };
/*
 * Parameters :
 *  - sensorID : le sensor id propriétaire de la machine.
 *  - name : machine name
 *  - init : the initial program
 *  - fun_stdout : the function that collects stdout messages
 *  - fun_stderr : the function that collects stederr messages
 *  - chkd_prompt : booleen indiquant si le prompt est actif ou non
 *  - fun_prompt : function that compute the new updated prompt string at each
 *    instant
 */
function SC_Machine(params){
  if(undefined==performance){
    performance={ now: function(){
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
  this.toContinue = 0;
  this.startReaction = 0;
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
  this.externalPending = [];
  this.burstState = [];
  this.pendingSensors = [];
  this.pendingPrograms = [];
  this.parActions = [];
  this.setSensors= {};
  this.name = (params.name)?params.name:"machine_"+SC.count;
  SC_cubify.apply(this);
  this.prg.cube = this;
  this.setStdOut(params.fun_stdout);
  this.setStdErr(params.fun_stderr);
  this.traceEvt=new SC_Event({ name: "traceEvt" });
  this.writeEvt=new SC_Event({ name: "writeEvt" });
  if(params.init && params.init.isAnSCProgram){
    this.addProgram(params.init);
    }
  this.ips = 0;
  this.reactMeasuring = 0;
  this.environment={};
  this.reactInterface=new SC_ReactiveInterface();
  this.reactInterface.getIPS=this.getIPS.bind(this);
  this.reactInterface.writeToStdout=function(s){
    this.pending.push({ e: this.traceEvt, v: s })
    }.bind(this);
  this.reactInterface.getInstantNumber=this.getInstantNumber.bind(this);
  this.reactInterface.getTopLevelParallelBranchesNumber
                      =this.getTopLevelParallelBranchesNumber.bind(this);
  this.reactInterface.addToOwnEntry=function(evtName, value){
      if(evtName instanceof SC_EventId){
        this.addEntry(evtName, value);
        }
      else{
        throw new Error("invalid event Id : "+evtName);
        }
      }.bind(this);
  this.reactInterface.addToOwnProgram=function(prg){
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
  Object.defineProperty(this.reactInterface, "all"
           , {get: function(){
                      return this.generated_values;
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
/*
 * extern API
 */
, toString: function(){
    return this.id;
    }
, enablePrompt: function(flag){
    this.promptEnabled = flag;
    }
, setStdOut: function(stdout){
    this.stdOut = ("function" == typeof(stdout))?stdout:NO_FUN;
    }
, setStdErr: function(stderr){
    this.stdErr = ("function" == typeof(stderr))?stderr:NO_FUN;
    }
, addEntry: function(evtId, val){
    const evt=this.getEvent(evtId);
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
/*
 * intern API
 */
, collapse: function(){
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
    this.traceEvt=null;
    this.writeEvt=null;
    this.environment=null;
    if(this.timer != 0){
      clearInterval(this.timer);
      this.timer = 0;
      }
    this.addProgram = NO_FUN;
    this.addEntry = NO_FUN;
    this.getTopLevelParallelBranchesNumber = function(){ return 0; };
    }
, getEvent: function(id){
    var res = this.environment[id];
    if(undefined === res){
      this.environment[id] = res = new SC_Event(id, this);
      }
    else if(!(res instanceof SC_Event)){
      throw new Error("invalid event type");
      }
    return res;
    }
, getSensor: function(id){
    var res = this.environment[id];
    if(undefined === res){
      this.environment[id] = res = new SC_Sensor(id);
      //this.setSensors[id]= undefined;
      }
    else if(!(res instanceof SC_Sensor)){
      throw new Error("invalid sensor type");
      }
    return res;
    }
, sampleSensor: function(sensId, val){
/*
Modifier la gestion des pending sensors. La gestion des Sensors doit-être
séparée de la gestion des événements classiques.
*/
    var sensor=this.getSensor(sensId);
    sensor.sampleVal=val;
    if(!sensor.sampled){
      sensor.sampled=true;
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
    const evt = inst.evt;
    evt.permanentGenerators.push(inst);
    evt.permanentValuatedGenerator += genVal;
    const t = this.permanentGenerate.indexOf(evt);
    if(0 > t){
      this.permanentGenerate.push(evt);
      }
    }
, removeFromPermanentGenerate: function(inst, genVal){
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
, addPermanentFun: function(fun){
    this.permanentActions.push(fun);
    }
, removeFromPermanent: function(fun){
    var t = this.permanentActions.indexOf(fun);
    if(t > -1){
      this.permanentActions.splice(t,1);
      }
    }
, addPermanentActionOnOnly: function(inst){
    this.permanentActionsOnOnly.push(inst);
    }
, removeFromPermanentActionsOnOnly: function(inst){
    var t = this.permanentActionsOnOnly.indexOf(inst);
    if(t > -1){
      this.permanentActionsOnOnly.splice(t,1);
      }
    }
, addPermanentActionOn: function(inst){
    this.permanentActionsOn.push(inst);
    }
, removeFromPermanentActionsOn: function(inst){
    var t = this.permanentActionsOn.indexOf(inst);
    if(t > -1){
      this.permanentActionsOn.splice(t,1);
      }
    }
, addCubeFun: function(inst){
    this.cubeActions.push(inst);
    }
, addPermanentCubeFun: function(inst){
    this.permanentCubeActions.push(inst);
    }
, removeFromPermanentCube: function(inst){
    var t = this.permanentCubeActions.indexOf(inst);
    if(t > -1){
      this.permanentCubeActions.splice(t,1);
      }
    }
, addFun:  function(fun){
    this.actions.push(fun);
    }
, addDynPar: function(p){
    this.parActions.push(p);
    }
, react: function(){
   if(this.ended){ return !this.ended; }
/*
 * Claude : le fameux boolean...
 */
    this.generated_values = Object.assign({}, this.setSensors);
    //console.error('this.generated_values', this.generated_values);
    var res = SC_Instruction_State.STOP;
/*
Si on est en burst mode on ne fait pas d'échantillonnage...
*/
    if(0 < this.toContinue){
      this.burstMode = true;
      this.toContinue--;
      }
    else{
      this.startReaction = 0;
      //if(0 > this.toContinue){
      //  this.toContinue = 0;
      //  }
/*
On parcours la liste des sensors...
*/
      for(var sens of this.pendingSensors){
        //let v = this.pendingSensors[nm];
        //if(v.g){
          //v.g = false;
        sens.systemGen(sens.sampleVal, this, true);
        sens.sampled = false;
          //this.burstState.push({s: this.getSensor(v.s), v: v.v});
        //  }
        }
      this.pendingSensors = [];
      }
//    for(var p of this.burstState){
//      //const p = this.burstState[n];
//      const sens = p.s;
//      //if(sens){
//      sens.systemGen(p.v, this, true);
//      //}
//      }
    var tmp = this.pending;
    this.pending = [];
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
    // Phase 1 : pure reactive execution
    while(SC_Instruction_State.SUSP == (res = this.activate())){
      }
    if((SC_Instruction_State.OEOI == res)||(SC_Instruction_State.WEOI == res)){
      this.eoi();
      res = SC_Instruction_State.STOP;
      }
    this.reactInterface.getValuesOf=function(evtID){
      if(evtID instanceof SC_EventId){
        return this.all[evtID.name];
        }
      throw new Error("ask for values of non event ID");
      };
    this.reactInterface.presenceOf=function(id){
      if(id instanceof SC_EventId){
        return this.getEvent(id).isPresent(this);
        }
      else if(id instanceof SC_SensorId){
        return this.getSensor(id).isPresent(this);
        }
      }.bind(this);
    // Phase 2 : collecting event values
    this.prg.generateValues(this);
    //this.generateValues();
    // Phase 3 : atomic computations
    for(var cell in this.cells){
      this.cells[cell].prepare(this);
      }
    for(var i = 0; i < this.actionsOnEvents.length; i++){
      var act = this.actionsOnEvents[i];
      var a = act.action;
      if(null!=a.f){
        var t=a.t;
        if(null==t){
          continue;
          }
        if(undefined!==a.p){
          t[a.f].call(t, a.p, this.generated_values, this.reactInterface);
          }
        else{
          t[a.f].call(t, this.generated_values, this.reactInterface);
          }
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
        if(null!=a.f){
          var t = a.t;
          if(null==t){
            continue;
            }
          if(undefined!==a.p){
            t[a.f].call(t, a.p,this.generated_values, this.reactInterface);
            }
          else{
            t[a.f].call(t, this.generated_values, this.reactInterface);
            }
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
          if(null==t){
            continue;
            }
          if(undefined!==a.p){
            t[a.f].call(t, a.p,this.generated_values, this.reactInterface);
            }
          else{
            t[a.f].call(t, this.generated_values, this.reactInterface);
            }
          }
        else{
          a(this.generated_values, this.reactInterface);
          }
        }
      else if(SC_Opcodes.ACTION_ON_EVENT_FOREVER_HALTED == inst.oc){
        const act = inst.defaultAct;
        if(null != act.f){
          const t=act.t;
          if(null==t){
            continue;
            }
          if(undefined!==a.p){
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
        var t=act.t;
        if(null==t){
          continue;
          }
        if(undefined!==a.p){
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
    for(var i = 0; i < this.permanentActions.length; i++){
      var act = this.permanentActions[i];
      if(null!=act.f){
        var t=act.t;
        if(null==t){
          continue;
          }
        if(undefined!==a.p){
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
    // Phase 4 : swap states
    for(var cell in this.cells){
      this.cells[cell].swap();
      }
    for(var i = 0; i < this.parActions.length; i++){
      this.parActions[i].computeAndAdd(this);
      }
    // Phase 5
    for(var will of this.lastWills){
      will(this.reactInterface);
      }
    if(this.writeEvt.isPresent(this)){
      for(var msg of this.writeEvt.getValues(this)){
        this.stdOut(msg);
        }
      }
    if(this.traceEvt.isPresent(this)){
      if(this.dumpTraceFun){
        this.dumpTraceFun(this.traceEvt.getValues(this));
        }
      else{
        console.log.call(console, this.traceEvt.getValues(this));
        }
      }
    this.instantNumber++;
    /*if(this.delay > 0 && res == SC_Instruction_State.TERM && (null != this.timer)){
      clearInterval(this.timer)
    }*/
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
    this.ended=(res==SC_Instruction_State.TERM);
    if(this.ended){
      this.collapse();
      SC_Global_Manager.removeFromRegisteredMachines(this);
      }
    this.reactInterface.getValuesOf = NO_FUN;
    this.reactInterface.presenceOf = NO_FUN;
    this.burstMode = false;
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
    var st = SC_Instruction_State.SUSP;
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
          caller=seq=inst;
          //this.trace("seq -> ", inst.idx)
          inst.oc=SC_Opcodes.SEQ_BACK;
          inst=inst.seqElements[inst.idx];
          break;
          }
        case SC_Opcodes.SEQ_BACK:{
          //this.trace("seq BACK ", inst.idx, caller)
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
          st=SC_Instruction_State.TERM;
          inst=caller;
          break;
          }
        case SC_Opcodes.HALT:{
          st=SC_Instruction_State.HALT;
          inst=caller;
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
        /*case SC_Opcodes.PAUSE_UNTIL_INIT:{
          inst.oc = SC_Opcodes.PAUSE_UNTIL;
          inst.count = inst.times;
          }*/
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
          if(0 == this.startReaction){
            this.startReaction = this.instantNumber;
            }
          this.toContinue += Math.max(0, inst.count
                             -(this.instantNumber-this.startReaction));
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.NEXT:{
          if(0 == this.startReaction){
            this.startReaction = this.instantNumber;
            }
          this.toContinue += Math.max(0, inst.count
                             -(this.instantNumber-this.startReaction));
          st = SC_Instruction_State.TERM;
          inst = caller;
          break;
          }
        case SC_Opcodes.NEXT_DYN_INLINED:{
          if(0 == this.startReaction){
            this.startReaction = this.instantNumber;
            }
          this.toContinue += Math.max(0, inst.count(this.reactInterface)
                             -(this.instantNumber-this.startReaction));
          inst = seq.seqElements[++seq.idx];
          break;
          }
        case SC_Opcodes.NEXT_DYN:{
          if(0 == this.startReaction){
            this.startReaction = this.instantNumber;
            }
          this.toContinue += Math.max(0, inst.count(this.reactInterface)
                             -(this.instantNumber-this.startReaction));
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
          inst.caller=caller;
          inst.config.registerInst(this, inst);
          inst.oc=SC_Opcodes.AWAIT_REGISTRED_INLINE;
          st=SC_Instruction_State.WAIT;
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
          st=SC_Instruction_State.WAIT;
          inst=caller;
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
              caller=inst.caller;
              inst.oc=SC_Opcodes.KILL_STOP;
              st=SC_Instruction_State.WEOI;
              inst=inst.caller;
              break;
              }
            case SC_Instruction_State.WAIT:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_WAIT;
              st=(inst.c.isPresent(this))?SC_Instruction_State.WEOI
                                           :SC_Instruction_State.WAIT;
              inst = inst.caller;
              break;
              }
            case SC_Instruction_State.HALT:{
              caller = inst.caller;
              inst.oc = SC_Opcodes.KILL_HALT;
              st=(inst.c.isPresent(this))?SC_Instruction_State.WEOI
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
        case SC_Opcodes.RESET_ON_INIT:{
          inst.caller=caller;
          inst.config.registerInst(this, inst);
          //this.trace(`react reset on INIT`);
          }
        case SC_Opcodes.RESET_ON:{
          //this.trace("react reset on ON");
          caller=inst;
          inst.oc=SC_Opcodes.RESET_ON_BACK;
          inst=inst.prog;
          break;
          }
        case SC_Opcodes.RESET_ON_BACK:{
          //this.trace("react reset on BACK", st);
          switch(st){
            case SC_Instruction_State.TERM:{
              caller=inst.caller;
              inst.oc=SC_Opcodes.RESET_ON_INIT;
              inst.config.unregister(inst);
              inst=caller;
              break;// ACT ?
              }
            case SC_Instruction_State.SUSP:{
              caller=inst;
              inst=inst.prog;
              break;
              }
            case SC_Instruction_State.WEOI:{
              caller=inst.caller;
              inst.oc=SC_Opcodes.RESET_ON_WEOI;
              //this.trace("react reset on WEOI");
              inst=inst.caller;
              break;
              }
            case SC_Instruction_State.STOP:{
              caller=inst.caller;
              st=SC_Instruction_State.OEOI;
              inst.oc=SC_Opcodes.RESET_ON_P_OEOI;
              inst=inst.caller;
              break;
              }
            case SC_Instruction_State.OEOI:{
              caller=inst.caller;
              //this.trace("react reset on OEOI");
              inst.oc=SC_Opcodes.RESET_ON_OEOI;
              inst=inst.caller;
              break;
              }
            case SC_Instruction_State.HALT:{
              caller=inst.caller;
              //this.trace("react reset on HALT");
              //st=SC_Instruction_State.WAIT;
              inst.oc=SC_Opcodes.RESET_ON_P_WAIT;
              st=(inst.config.isPresent(this))?SC_Instruction_State.WEOI
                                           :SC_Instruction_State.WAIT;
              inst=inst.caller;
              break;
              }
            case SC_Instruction_State.WAIT:{
              caller=inst.caller;
              //this.trace("react reset on WAIT");
              st=(inst.config.isPresent(this))?SC_Instruction_State.WEOI
                                           :SC_Instruction_State.WAIT;
              inst.oc=SC_Opcodes.RESET_ON_WAIT;
              inst=inst.caller;
              break;
              }
            default:{
              throw "*** RESET_ON state pb !"
              }
            }
          break;
          }
        case SC_Opcodes.RESET_ON_WEOI:
        case SC_Opcodes.RESET_ON_WAIT:
        case SC_Opcodes.RESET_ON_HALT:{
          st=SC_Instruction_State.WEOI;
          inst=caller;
          break;
          }
        case SC_Opcodes.RESET_ON_OEOI:{
          st=SC_Instruction_State.OEOI;
          inst=caller;
          break;
          }
        case SC_Opcodes.CONTROL_INIT:{
          inst.caller = caller;
          inst.activ_cb = control_body;
          }
        case SC_Opcodes.CONTROL:{
          inst.c.registerInst(this, inst); // Pas obligatoire ici
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
            inst.val = inst.filterFun(inst.sensor.getValue(this)
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
          st = SC_Instruction_State.STOP;
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
          st = SC_Instruction_State.TERM;
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
          st = SC_Instruction_State.TERM;
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
          //inst.oc = SC_Opcodes.PAR_DYN_TO_REGISTER;
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
          this.reset(inst);
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
        case SC_Opcodes.PAR_DYN_FORCE: {
          this.reset(inst);
          st = SC_Instruction_State.TERM;
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
          var val = parseInt((null==inst.v.t)
                                 ?eval(inst.v.f):inst.v.t[inst.v.f]);
          inst.choice = inst.cases[val];
          if(undefined == inst.choice){
            inst.choice = SC_nothing;
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
            this.reset(inst.choice);
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
          inst.init.call(inst.o, this.reactInterface);
          if(inst.o.sc_init){
            inst.o.sc_init();
            }
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
            case SC_Instruction_State.TERM:{
              this.lastWills.push(inst.lastWill);
              this.reset(inst.p);
              inst.killEvt.unregister(inst);
              inst.oc = SC_Opcodes.CUBE_INIT;
              break;
              }
            case SC_Instruction_State.WAIT:{
              if(inst.killEvt.isPresent(this)){
                inst.oc = SC_Opcodes.CUBE_STOP;
                st = SC_Instruction_State.WEOI;
                }
              else{
                inst.oc = SC_Opcodes.CUBE_WAIT;
                }
              break;
              }
            case SC_Instruction_State.HALT:{
              if(inst.killEvt.isPresent(this)){
                inst.oc = SC_Opcodes.CUBE_STOP;
                st = SC_Instruction_State.OEOI;
                }
              else{
                inst.oc = SC_Opcodes.CUBE_WAIT;
                }
              break;
              }
            case SC_Instruction_State.OEOI:
            case SC_Instruction_State.STOP:{
              st = SC_Instruction_State.OEOI;
              }
            case SC_Instruction_State.WEOI:
            case SC_Instruction_State.SUSP:{
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
          st = SC_Instruction_State.TERM;
          caller = inst = inst.caller;
          break;
          }
        case SC_Opcodes.CELL:{
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
        case SC_Opcodes.DUMP_INIT:{
          inst.caller = caller;
          }
        case SC_Opcodes.DUMP:{
          inst.oc = SC_Opcodes.DUMP_BACK;
          console.log("DUMP before prg:", inst.p);
          caller = inst;
          inst = inst.p
          break;
          }
        case SC_Opcodes.DUMP_BACK:{
          console.log("DUMP after prg:", inst.p);
          inst.oc = SC_Opcodes.DUMP;
          inst = caller = inst.caller;
          break;
          }
        case SC_Opcodes.LOG:{
          this.stdOut(inst.msg);
          st = SC_Instruction_State.TERM;
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
//        case SC_Opcodes.ACTION_INLINE:{
//          inst=caller;
//          break;
//          }
        case SC_Opcodes.SEQ_INIT:{
          caller=inst;
          break;
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
        //case SC_Opcodes.RESET_ON:
        case SC_Opcodes.RESET_ON_WAIT:
        case SC_Opcodes.RESET_ON_OEOI:
        case SC_Opcodes.RESET_ON_WEOI:{
          inst.rstOC=inst.oc;
          inst.oc=SC_Opcodes.RESET_ON_BACK;
          caller=inst;
          inst=inst.prog;
          break;
          }
        case SC_Opcodes.RESET_ON_P_WAIT:
        case SC_Opcodes.RESET_ON_P_OEOI:
        case SC_Opcodes.RESET_ON_BACK:{
          inst.oc=SC_Opcodes.RESET_ON;
          if(inst.config.isPresent(this)){
            this.reset(inst.prog);
            }
          else if(inst.rstOC===SC_Opcodes.RESET_ON_WAIT){
            inst.oc=inst.rstOC;
            }
          inst=caller=inst.caller;
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
        case SC_Opcodes.HALT:
        case SC_Opcodes.PAUSE_N_TIMES_INLINE:{
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
        case SC_Opcodes.CUBE_STOP:
        case SC_Opcodes.CUBE_BACK:{
          if(inst.killEvt.isPresent(this)){
            this.lastWills.push(inst.lastWill);            
            inst.oc = SC_Opcodes.CUBE_TERM;
            this.reset(inst.p);
            inst.killEvt.unregister(inst);
            }
          else {
            inst.oc = SC_Opcodes.CUBE;
            }
          inst = caller = inst.caller;
          break;
          }
        case SC_Opcodes.CUBE_HALT:
        case SC_Opcodes.CUBE_WAIT:{
          if(inst.killEvt.isPresent(this)){
            this.lastWills.push(inst.lastWill);            
            this.reset(inst.p);
            inst.oc = SC_Opcodes.CUBE_TERM;
            inst.killEvt.unregister(inst);
            }
          inst = caller = inst.caller;
          break;
          }
        case SC_Opcodes.DUMP:{
          caller = inst;
          inst.oc = SC_Opcodes.DUMP_BACK;
          console.log('DUMP at EOI before', inst.p);
          inst = inst.p;
          break;
          }
        case SC_Opcodes.DUMP_BACK:{
          inst.oc = SC_Opcodes.DUMP;
          console.log('DUMP at EOI after', inst.p);
          inst = caller = inst.caller;
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
    //var oldInstOC=null;
    while(true){
RST:  switch(/*oldInstOC = */inst.oc){
        case SC_Opcodes._EXIT:{
          return;
          }
        case SC_Opcodes.REL_JUMP:
        case SC_Opcodes.REPEAT_FOREVER:{
          inst=caller;
          break;
          }
        case SC_Opcodes.REPEAT_FOREVER_TO_STOP:{
          inst.oc=SC_Opcodes.REPEAT_FOREVER;
          inst=caller;
          break;
          }
        case SC_Opcodes.REPEAT_N_TIMES_INIT:
        case SC_Opcodes.REPEAT_N_TIMES:
        case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER:
        case SC_Opcodes.REPEAT_N_TIMES_BUT_FOREVER_TO_STOP:
        case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
          inst.oc=SC_Opcodes.REPEAT_N_TIMES_INIT;
          inst=caller;
          break;
          }
        case SC_Opcodes.IF_REPEAT_INIT:{
          inst=caller;
          break;
          }
        case SC_Opcodes.IF_REPEAT_TO_STOP:
        case SC_Opcodes.IF_REPEAT:{
          inst.oc=SC_Opcodes.IF_REPEAT_INIT;
          inst=caller;
          break;
          }
        case SC_Opcodes.REPEAT_N_TIMES_TO_STOP:{
          inst.oc=SC_Opcodes.REPEAT_N_TIMES_INIT;
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
          inst=caller;
          break;
          }
        case SC_Opcodes.SEQ:{
          inst.oc=SC_Opcodes.SEQ;
          const len=inst.seqElements.length;
          for(var i=0; i<len; i++){
            this.reset(inst.seqElements[i]);
            }
          inst.idx=0;
          inst=caller;
          break;
          }
        case SC_Opcodes.PAUSE_UNTIL_DONE:{
          inst.oc = SC_Opcodes.PAUSE_UNTIL;
          }
        case SC_Opcodes.SEQ_ENDED:
        case SC_Opcodes.HALT:
        case SC_Opcodes.PAUSE_UNTIL:{
          inst=caller;
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
            inst.tmp.flag = SC_Instruction_State.SUSP;
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
        case SC_Opcodes.CUBE_HALT:
        case SC_Opcodes.CUBE_WAIT:
        case SC_Opcodes.CUBE_STOP:
        case SC_Opcodes.CUBE:{
          inst.killEvt.unregister(this);
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
        case SC_Opcodes.CUBE_TERM:
        case SC_Opcodes.CUBE_INIT:{
          inst.oc = SC_Opcodes.CUBE_INIT;
          }
        case SC_Opcodes.CUBE_ZERO:{
          inst = caller;
          break;
          }
        case SC_Opcodes.DUMP:{
          inst.resetCaller = caller;
          caller = inst;
          inst.oc = SC_Opcodes.DUMP_BACK;
          console.log('DUMP reset before', inst.p);
          inst = inst.p;
          break;
          }
        case SC_Opcodes.DUMP_BACK:{
          inst.oc = SC_Opcodes.DUMP;
          console.log('DUMP reset after', inst.p);
          inst = caller = inst.resetCaller;
          break;
          }
        case SC_Opcodes.CELL:{
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
        default:{ throw new Error("reset : undefined opcode "
                        + SC_Opcodes.toString(inst.oc));
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
GRV:  switch(inst.oc){
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
var nextID=0;
/*
 * Public API
 */
var SC={
  nop: function(){
    return this.nothing();
    }
, purge: function(prg){
    return (prg)?prg:this.nothing();
    }
, pauseRT: function(n){
    return new SC_PauseRT(_SC.b_(n));
    }
, step: function(n){
    return new SC_Step(_SC.b_(n));
    }
, pause: function(n){
    return new SC_Pause(_SC.b_(n));
    }
, pauseUntil: function(cond){
    if((undefined === cond)||(null === cond)){
      throw new Error('pauseUntil(): invalid condition: '+cond);
      }
    if(false === cond){
      console.error("pauseUntil(): pauseForever for a false const.");
      return this.pauseForever();
      }
    if(true === cond){
      console.error("pauseUntil(): single pause for a true const.");
      return this.pause();
      }
    if("function" != typeof(cond) && !(cond instanceof SC_CubeBinding)){
      throw new Error('pauseUntil(): invalid condition implementation: '+cond);
      }
    return new SC_PauseUntil(cond);
    }
, resetOn: function(config){
    var prgs=[];
    for(var i=1; i<arguments.length; i++){
      const p=arguments[i];
      if(p==SC_Nothing){ continue; }
      prgs.push(p);
      }
    const t=new SC_Seq(prgs);
    return new SC_ResetOn(config, t);
    }
, await: function(config){
    if(undefined == config){
      throw new Error("config not defined");
      }
    return new SC_Await(_SC.b_(config));
    }
, resetOnEach: function(params){
    if(undefined == params){
      throw new Error("resetOnEach(): undefined params")
      }
    return this.resetOn(params.killCond
          , this.seq(params.prg, this.pauseForever())
            );
    }
, seq: function(){
    return new SC_Seq(arguments);
    }
, action: function(fun, times){
    return new SC_Action(_SC.b_(fun), _SC.b_(times));
    }
, actionWhen: function(c, fun, deffun){
    if(undefined==c){
      throw new Error("config not defined");
      }
    return new SC_ActionOnEvent(_SC.b_(c), _SC.b_(fun), _SC.b_(deffun), this.forever);
    }
, actionOn: function(c, fun, deffun, times){
    if(undefined==c){
      throw new Error("config not defined");
      }
    return new SC_ActionOnEvent(_SC.b_(c), _SC.b_(fun), _SC.b_(deffun), _SC.b_(times));
    }
, par: function(){
    return new SC_Par(arguments, undefined);
    }
, parex: function(evt){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs.push(arguments[i]);
      }
    return new SC_Par(prgs, evt);
    }
, nextInput: function(evt, v, t){
    return new SC_Send(_SC.b_(evt), v, _SC.b_(t));
    }
, generateForever: function(evt, v){
    return new SC_GenerateForever(_SC.b_(evt), v);
    }
, generate: function(evt, v, times){
    return new SC_Generate(_SC.checkStrictEvent(evt)
                                , v, _SC.b_(times));
    }
, generateWrapped: function(evt, v, times){
    return new SC_Generate(_SC.b_(evt), _SC.b_(v), _SC.b_(times));
    }
, repeatForever: function(n){
    Array.prototype.unshift.call(arguments, this.forever);
    return this.repeat.apply(this, arguments);
    }
, repeat: function(n){
    var prgs = [];
    var jump = 1;
    prgs[0] = new SC_RepeatPoint(n);
    for(var i = 1 ; i < arguments.length; i++){
      const p = arguments[i];
      if(p == SC_Nothing){ continue; }
      prgs.push(p);
      if(p instanceof SC_Seq){
        jump += p.seqElements.length;
        }
      else{
        jump++;
        }
      }
    const end = new SC_RelativeJump(-jump);
    prgs.push(end);
    prgs[0].end = jump+1;
    var t = new SC_Seq(prgs);
    return t;
    }
, repeatIf: function(c){
    var prgs = [];
    var jump = 1;
    prgs[0] = new SC_IfRepeatPoint(c);
    for(var i = 1 ; i < arguments.length; i++){
      const p = arguments[i];
      if(p == SC_Nothing){ continue; }
      prgs.push(p);
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
    }
, and: function(){
    var tmp = [];
    for(var i in arguments){
      tmp.push(_SC.b_(arguments[i]));
      }
    return new SC_And(tmp);
    }
, or: function(){
    const tmp = [];
    for(var i in arguments){
      tmp.push(_SC.b_(arguments[i]));
      }
    return new SC_Or(tmp);
    }
, kill: function(c,p,h){
    _SC.checkConfig(c);
    var prgs = [new SC_Kill(c,p,1)];
    if(h && h != SC_Nothing){
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
    }
, control: function(c){
    _SC.checkConfig(c);
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs[i-1] = arguments[i];
      }
    return new SC_Control(c, new SC_Seq(prgs));
    }
, when: function(c,t,e){
    _SC.checkConfig(c);
    var prgs = [new SC_When(c)];    
    var elsJ = 2;
    var end = 1;
    if(t && t != SC_Nothing){
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
    else if(e && e != SC_Nothing){
      end++;
      }
    prgs.push(new SC_RelativeJump(end));
    if(e && e != SC_Nothing){
      prgs.push(e);
      }
    return new SC_Seq(prgs);
    }
, test: function(b, t, e){
    var prgs=[new SC_Test(b)];    
    var elsJ=2;
    var end=1;
    if(t && SC_Nothing!=t){
      prgs.push(t);
      if(t instanceof SC_Seq){
        elsJ+=t.seqElements.length;
        }
      else{
        elsJ++;
        }
      }
    prgs[0].elsB = elsJ;
    if(e instanceof SC_Seq){
      end += e.seqElements.length;
      }
    else if(e && e != SC_Nothing){
      end++;
      }
    prgs.push(new SC_RelativeJump(end));
    if(e && e != SC_Nothing){
      prgs.push(e);
      }
    return new SC_Seq(prgs);
    }
, match: function(val){
    var prgs = [];
    for(var i = 1 ; i < arguments.length; i++){
      prgs.push(arguments[i]);
      }
    return new SC_Match(val, prgs);
    }
, matches: function(val, branches){
    return new SC_Match(val, branches);
    }
, filter: function(s,e,f,t,n){
    return new SC_Filter(_SC.b_(s)
                       , _SC.b_(e)
                       , _SC.b_(f)
                       , _SC.b_(t)
                       , _SC.b_(n));
    }
, me: new SC_CubeExposedState()
, cubify: function(params){
    if(undefined==params){
      throw new Error("cubify no params provided");
      }
    if(undefined==params.prg){
      throw new Error("cubify no program provided");
      }
    if(undefined==params.root){
      params.root={};
      }
    const funs=params.methods;
    if(funs){
      for(var i of funs){
        if(typeof(i.name)!="string"){
          throw new Error("cubify fun name "+i.name+" not valid");
          }
        if(typeof(i.fun)!="function"){
          throw new Error("cubify fun "+i.fun+" not valid");
          }
        params.root[i.name]=i.fun;
        }
      }
    const meths=params.actions;
    if(meths && typeof(meths)=="object"){
      for(var met of Object.keys(meths)){
        if(typeof(meths[met])!="function"){
          throw new Error("cubify fun "+meths[met]+" not valid");
          }
        params.root[met]=meths[met];
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
, killSelf: function(){
    return this.generate(SC.my("SC_cubeKillEvt"))
    }
, cubeCell: function(c){
    return new SC_CubeCell(c);
    }
, cell: function(params){
    return new SC_Cell(params);
    }
, traceEvent: function(msg){
    return new SC_GenerateOne(null, msg);
    }
, trace: function(msg){
    return new SC_GenerateOne(null, msg);
    }
, write: function(msg){
    return new SC_GenerateOne(SC_WRITE_ID, msg);
    }
, log: function(msg){
    return new SC_Log(msg);
    }
, cellify: function(tgt, nom, fun, el, sub){
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
    }
, simpleCellFun: function(tgt, evt, trace){
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
    }
, addCell: function(tgt, nom, init, el, fun){
    if(tgt instanceof SC_Cube){
      tgt = tgt.o;
      }
    if(undefined !== fun){
      tgt["_"+nom] = fun;
      }
    if(undefined === tgt["_"+nom]){
      throw "no affectator for "+nom+" cell is defined";
      }
    tgt["$"+nom] = SC.cell({init:init, sideEffect: SC._(tgt,"_"+nom)
                          , eventList: el, id: nom});
    Object.defineProperty(tgt, nom,{get: (function(nom){
      return tgt["$"+nom].val();
    }).bind(tgt, nom)});
    },
  _: function(tgt, fun){
    return (tgt[fun]).bind(tgt);
    }
, _my: function(name, pt){
    if((undefined!=name)&&("string"==typeof(name))&&(""!=name)){
      try{
        if((undefined!=pt)&&("string"==typeof(pt))&&(""!=pt)){
          return new SC_CubeBinding(name, {tp: pt});
          }
        return new SC_CubeBinding(name);
        }
      catch(e){}
      }
    throw new Error("invalid object property name", name);
    }
, my: function(name, p){
    if((undefined!=name)&&("string"==typeof(name))&&(""!=name)){
      try{
        if(undefined===p){
          return new SC_CubeBinding(name);
          }
        return new SC_CubeBinding(name, {p: p});
        }
      catch(e){}
      }
    throw new Error("invalid object property name", name);
    }
, send: function(m, evt, v){
    return SC.action(function(evt, v){
      this.addToOwnEntry(evt, v);
      }.bind(m, evt, v))
    }
, next: function(count){
    if(undefined == count){
      count= 1;
      }
    const num = parseInt(count);
    if(isNaN(num)){
      if('function' == typeof(count)){
        return new SC_Next(count);
        }
      if('object' == typeof(count) && count.f && count.t){
        return new SC_Next(count);
        }
      throw new Error("count of invalid type");
      }
    if(num <= 0){
      throw new Error("count paramater must be > 0");
      }
    return new SC_Next(num);
    },
/*
 * Claude : intégration du externalEvent mais on retir deux paramètres : le sensor
 * et la machine (cela est du au nouveau status de sensor en SugarCubes).
 */
  externalEvent: function externalEvent(pElt_target, ps_DomEvt, pn_nbreFois) {
    if(undefined===pn_nbreFois){ pn_nbreFois=-1; }
    const pSensor=new SC.sensorize({
            name: ''+ Elt_target+'.'+ps_DomEvt
          , dom_targets: [{ target: pElt_target, evt: ps_DomEvt }]
          , pn_nbreFois: pn_nbreFois
          , owned: true
            });
    return pSensor
    }
  };
/*
 *** New API
Clock define a reactive logical clock, which interprets reactive programs.
It provides notion of successive instants.
Changing many things :
  - mandatory parmaters are (i) a name for the clock identifying the clock
    (should be unique in the app); (ii) a delay meaning that a clock is
    always bound to realtime clock tick generation.
  - default behavior is pauseForver() has it should not terinate. It should
    beter capture common behavior as one has often to add an init program to
    avoid instantaneous termination after the first tick.
  - the corresponding sensor is of course owned by the reactive clock we
    want to build.
 */
  Object.defineProperty(SC, "sc_build"
                          , { value: 2
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "writeInConsole"
                          , { value: console.log.bind(console)
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "newID"
                          , { enumerable: false
                            , value: function(){
                                return nextID++;
                                }
                            , writable: false
                              }
                          );
  let animator=null;
  Object.defineProperty(SC, "animSensor"
                          , { value: function(){
                                if(animator){
                                  return animator;
                                  }
                                const params={ name: "animator", isPower: true };
                                return animator=new SC_SensorId(params);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "evt"
                          , { value: function(name, params){
                                if(undefined!=name || "string"!=typeof(name)){
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
                          , { enumerable: false
                            , value: function(name, params){
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
                          , { enumerable: false
                            , value: function(name, params){
                                if(undefined!=params){
                                  params.name=name;
                                  }
                                else{
                                  throw new Error("SC.sensor(): undefined params "+params);
                                  }
                                if(undefined==params.dom_targets){
                                  throw new Error("SC.sensor(): undefined dom_targets "+params);
                                  }
                                return new SC_SensorId(params);
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
                                return new SC_SensorId(p);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "periodic"
                          , { enumerable: false
                            , value: function(p){
                                if(undefined==p || "object"!=typeof(p)){
                                  throw new Error("SC.periodic(): invalid param "
                                                 +p);
                                  }
                                if(isNaN(p.delay) || p.delay<=0){
                                  throw new Error("SC.periodic(): invalid delay "
                                                 +p.delay);
                                  }
                                p.name="periodic";
                                p.isPower=true;
                                return new SC_SensorId(p);
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "clock"
  , { 
      value: function(p){
        if(undefined==p){
          p={};
          }
        if(undefined==p.name){
          p.name=this.newID()+"_unanmed_machine"
          }
        else if("string"!=typeof(p.name)){
          throw new Error("invalid name : "+p.name);
          }
        /*if(undefined==p.init){
          p.init=this.pauseForever();
          }
        else*/ if(p.init && !p.init.isAnSCProgram){
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
        res.setStdOut=ownMachine.setStdOut.bind(ownMachine);
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
/*
Claude : partie intégrée dans la machine reactive. On distingue 2 notions :
  - Les instants classiques du réactif
  - Les réactions qui sont des burst d'instants
Je prends la liberté de renommer raf en sc_raf. Ok ?
Ici j'introduit l'équivalent de ton react multiple.
 */
    const reaction=function(){
      do{
        this.react();
        if(this.ended){
          return true;
          }
        }
      while(this.toContinue>0);
      return false;
      }.bind(ownMachine);
        var registrations={};
        res.bindTo=function(ream, registrations, sensor){
          if(registrations[sensor.toString()]){
            return;
            }
          registrations[sensor.toString()]=sensor;
          SC_Global_Manager.connect(sensor, ream);
          }.bind(res, reaction, registrations);
        res.disconnectFrom=function(ream, registrations, sensor){
          if(undefined==registrations[sensor.toString()]){
            return;
            }
          delete(registrations[sensor.toString()]);
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
  Object.defineProperty(SC, "pauseForever"
                          , { enumerable: false
                            , value: function(name, params){
                                return SC_PauseForEver;
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "nothing"
                          , { enumerable: false
                            , value: function(name, params){
                                return SC_Nothing;
                                }
                            , writable: false
                              }
                          );
  Object.defineProperty(SC, "init"
  , { 
      value: function(p){
        if(undefined==p){
          p={};
          }
        if(p.modules){
          /* chargement des modules */
          }
        }
    , writable: false
      }
    );
  Object.defineProperty(SC, "NO_ACTION"
                          , { enumerable: false
                            , value: NO_FUN
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
  }).call(this);

