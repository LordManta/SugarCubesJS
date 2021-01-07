/*
 * On règle le temps entre deux instants de la machine d'exécution sur 4s
 */
/* globales pointant sur des objets du DOM */
var workspace = document.getElementById("workspace");
var tt_video = document.getElementById("anim_vid");
var hack_btn = document.getElementById("hack");
var ttt_slider = document.getElementById("slider");
var talkMachine = SC.tools.m;//SC.reactiveMachine({init:SC.pauseForever()});
var writting = SC.evt("writting");
const zone1t = SC.evt("zone1");
const zone2t = SC.evt("zone1");
const typeEndedEvt = SC.sensor("typeEndedEvt");

/* on cache le tableau de bord */
SC.tools.addProgram(SC.action(function(){
  SC.tools.controlPanel.win.style.display='none';
  }));
/*
 * Bulle de commentaire.
 */
var bubble_view = SC.tools.makeDiv({
  cl : "JFSCSS_text_bubble"
  , inH : ""
  , beh: SC.par(
      SC.repeatForever(
        SC.kill(writting
          , SC.seq(
              SC.repeat(SC.my("textSize")
              , SC.action(SC.my("progressiveText"))
              , SC.pause(3)
                )
              , SC.action(() => {typeEndedEvt.newValue();})
              , SC.await(writting)
              )
        , SC.action(()=>{console.log("abort text type")})
          )
      , SC.action(SC.my("reset"))
        )
    , SC.actionOn(writting
      , SC.my("setNewText")
      , undefined
      , SC.forever
        )
      )
  });
console.log("console", console);
console.log("speech ?", window.speechSynthesis);
bubble_view.text = "";
bubble_view.toWriteTxt = "";
bubble_view.toWriteTxtIdx = 0;
bubble_view.textSize = function(){
  console.log("new Text Size ", this.toWriteTxt.length);
  return this.toWriteTxt.length;
  };
bubble_view.setNewText = function(val, engine){
  function _(data){
    if(typeof data == "function"){
      return data();
      }
    return data;
    }
  const vals = engine.getValuesOf(writting);
  if(vals){
    const msg = vals[0];
    console.log("setNewText ", msg, msg.txt);
    if(undefined == msg){
      return;
      }
    this.toWriteTxt = msg.txt;
    switch(msg.dir){
      case 0:{
        this.dir = 0;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble");
        this.style.bottom = "";
        this.style.right = "";
        this.style.left = msg.x;
        this.style.top = msg.y;
        break;
        }
      case 1:{
        this.dir = 1;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_1");
        this.style.bottom = "";
        this.style.right = "";
        this.style.left = msg.x;
        this.style.top = msg.y;
        break;
        }
      case 2:{
        this.dir = 2;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_2");
        this.style.bottom = "";
        this.style.right = "";
        this.style.left = msg.x;
        this.style.top = msg.y;
        break;
        }
      case 3:{
        this.dir = 3;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_3");
        this.style.top = "";
        this.style.right = "";
        this.style.left = msg.x;
        this.style.bottom = _(msg.y);
        break;
        }
      case 4:{
        this.dir = 4;
        this.classList.remove(this.classList[0]);
        this.classList.add("JFSCSS_text_bubble_4");
        this.style.top = "";
        this.style.left = "";
        this.style.right = _(msg.x);
        this.style.bottom = _(msg.y);
        break;
        }
      default: {
        this.style.top = msg.y;
        this.style.left = msg.x;
        break;
        }
      }
    }
  };
bubble_view.reset = function(){
  this.toWriteTxtIdx = 0;
  console.log("reset typping");
  };
bubble_view.progressiveText = function(){
  if(this.toWriteTxtIdx < this.toWriteTxt.length){
    if("<" == this.toWriteTxt.charAt(this.toWriteTxtIdx)){
      //console.error("***> je m'en bas lise :)", this.toWriteTxt);
      while(">" != this.toWriteTxt.charAt(this.toWriteTxtIdx++)
        && (this.toWriteTxtIdx < this.toWriteTxt.length)){}
      //console.error("***> done");
      }
    else{
      this.toWriteTxtIdx = this.toWriteTxtIdx+1;
      }
    }
  this.innerHTML = this.toWriteTxt.substring(0,this.toWriteTxtIdx);
  }
document.body.appendChild(bubble_view);
var show1 = SC.evt("show1");
var show1g = SC.evt("show1");
var show1t = SC.evt("show1");
var show2 = SC.evt("show2");
var show2g = SC.evt("show2");
var show2t = SC.evt("show2");
var show3 = SC.evt("show3");
var show3g = SC.evt("show3");
var show3t = SC.evt("show3");
var comA = SC.evt("comA");
var comB = SC.evt("comB");
var play = SC.evt("play");


function makeTalk(){
var text = [
  {
  speech : "Bonjour !"
  , txt: "<h2 style=\"text-align:center;\">Bonjour !</h2>"
  , r_delay: 1000
  , rm : talkMachine
  , dir:0
  , x: "300px"
  , y: "210px"
  }
  , {
    speech : "Cette application va nous permettre d'illustrer le"
     + " comportement d'un système, construit à l'aide de SugarCubesJS.\n"
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech :  "L'idée principale de SugarCubesJS est de faciliter la programmation d'applications conséquentes,"
     + " à la combinatoire importante, en proposant un modèle de programmation parallèle.\n"
     + "Ce modèle de programmation repose sur le paradigme réactif/synchrone proposé par Frédéric Boussinot"
     + " au début des années 90."
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech : "On propose de décomposer une application complexe, en un ensemble de composants parallèles, plus"
     + " simples à écrire, et interragissant fortement entre eux, par un mécanisme de diffusion instantannée"
     + " de messages."
    , r_delay: 200
    , rm : talkMachine
    }
  , {
    speech : "Le point important est que c'est le modèle d'exécution de ce type de programmes, qui prend"
     + " en charge, l'essentiel du travail d'ordonnancement et de synchronisation des composants, déchargeant"
     + " ainsi le programmeur de cette activité complexe."
    , r_delay: 200
    , rm : talkMachine
    }
  , {
    speech : " Cette application est prévue pour fonctionner sur une tablette tactile ou un téléphone,"
       + " permettant la détection de points de contacts multiples sur l'écran. Mais, elle doit"
       + " fonctionner partiellement sur le navigateur Web d'un ordinateur de bureau."
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech : " Pour commencer, nous allons découvrir les principaux éléments de"
       + " l'interface graphique."
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech : " Comme dans l'application Dance-Doigt, nous avons deux zones de"
       + " l'écran, indiquées par des panneaux stop, sur lesquelles, nous devons"
       + " être capable, de détecter des contacts tactiles."
    , r_delay: 500
    , rm : talkMachine
    , dir:2
    , x: "110px"
    , y: "70px"
    }
  , {
    speech : " Nous avons également, une zone centrale, indiquée par le texte « zone de jeu »,"
       + " qui jouera une animation, si les deux zones de contacts précédentes sont"
       + " activées."
    , r_delay: 500
    , rm : talkMachine
    , dir:2
    , x: "540px"
    , y: "160px"
    }
  , {
    speech : " En dessous de ces trois zones, on trace un chronogramme permettant de visualiser"
       + " les comportements parallèles des trois composants graphiques dans le temps."
    , r_delay: 500
    , rm : talkMachine
    , dir:2
    , x: "550px"
    , y: "480px"
    }
  , {
    speech : "Sur ce chronogramme on considère que le temps s'écoule de gauche à droite.\nEt les "
       + "barres verticales bleues symbolisent le début et la fin d'une itération complète "
       + "du système réactif."
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech : " La première barre verticale indique le démarrage de l'acquisition des événements"
       + " d'interaction de l'application."
    , r_delay: 500
    , rm : talkMachine
    , dir:2
    , x: "40px"
    , y: "470px"
    }
  , {
    speech : " La deuxième barre verticale indique la fin de l'itération complète."
    , r_delay: 500
    , rm : talkMachine
    , dir:2
    , x: "440px"
    , y: "470px"
    }
  , {
    speech : "Au dessus de "
       + "cette seconde barre, vous pouvez lire la durée complète de l'itération en millisecondes.\n"
       + "Au début de cette démonstration, cette durée est exagérément portée à 4 secondes, afin de laisser"
       + " suffisemment de temps, pour bien illustrer notre propos."
    , r_delay: 500
    , rm : talkMachine
    , dir:2
    , x: "480px"
    , y: "430px"
    }
  , {
    speech : "La période de temps représentée entre les deux barres verticales constitue pour l'essentiel une"
       + " phase de faible activité du système, où, celui-ci, se contente d'enregistrer les événements d'interaction.\n"
       + "On appellera cette phase, la « phase d'acquisition des entrées »."
    , r_delay: 500
    , rm : talkMachine
    , dir:3
    , x: "115px"
    , y: function(){ return (window.innerHeight-450)+"px"; }
    }
  , {
    speech : " Vous avez probablement remarqué maintenant, que la seconde barre clignote en jaune de façon\n"
       + " périodique.\nEt, pour les plus attentifs d'entre vous, vous aurez peut-être remarqué également"
       + " que la période entre deux clignotements est d'environ 4 secondes."
    , r_delay: 500
    , rm : talkMachine
    , dir:3
    , x: "390px"
    , y: function(){ return (window.innerHeight-435)+"px"; }
    }
  , {
    speech : " Ce clignotement symbolise l'exécution du programme réactif proprement dit. C'est-à-dire, le moment"
       + " où le système exécute son code, pour traiter les événements d'intéraction, enregistrés pendant la"
       + " phase d'acquisition.\nCette exécution étant très courte, au regard de la durée de 4 secondes, nous avons"
       + " décidé de l'illustrer par ce clignotement. L'exécution ayant lieu en fin de cycle, nous n'animons"
       + " que la seconde barre verticale, pour rendre compte de l'exécution réactive."
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech : " À ce stade de la démonstration, aucun composant n'est actif dans la machine d'exécution de"
       + " l'application, de sorte que, seul ce clignotement montre que le système est en train de s'exécuter."
    , r_delay: 500
    , rm : talkMachine
    }
  , {
    speech : " Toujours sur ce chhronogramme, les trois lignes horizontales en gris clair représentent donc les 3"
       + " composants principaux de l'application. À savoir, la zone stop du haut, la zone stop du bas, et enfin,"
       + " la zone de jeu. Ces composants s'exécutent en parallèle. Et ces comportements parallèles sont figurés "
       + "par des segments de droites parallèles. On verra que le temps s'écoule à l'identique pour"
       + " ces trois composants."
    , r_delay: 500
    , rm : talkMachine
    , dir:4
    , x: function(){ return (window.screen.availWidth-750)+"px"; }
    , y: function(){ return (window.innerHeight-420)+"px"; }
    }
  , {
    speech : " Ces composants étant actuellement inactifs, nous allons nous intéresser à l'interface de"
       + " contrôle de cette démonstration. Sous le chronogramme, nous trouvons un bouton, permettant d'activer la"
       + " première timeline, correspondant au composant parallèle gérant la zone Stop du haut."
    , r_delay: 500
    , rm : talkMachine
    , dir:0
    , x: "300px"
    , y: "210px"
    }
  , {
    speech : " Nous allons donc commencer par activer la zone stop du haut correspondant à la timeline numéro 1.\n"
    , r_delay: 500
    , rm : talkMachine
    }
 ];

  var res = SC.nothing();
  function _(a){
    res = {};
    res.x = a.x;
    res.y = a.y;
    res.dir = a.dir;
    res.txt = (undefined !== a.txt)?a.txt:a.speech;
    return res;
    };
  for(var i = 0 ; i < text.length; i++){
    var tmp = SC.tools.speech(text[i]);
    res = SC.seq(
         res
       , SC.next()
       , SC.pause()
       , SC.generate(tmp.sc_startSpeakEvt)
       , SC.generate(writting, _(text[i]))
       , SC.par(
           SC.await(tmp.sc_endedEvt)
         , SC.await(typeEndedEvt)
           )
         );
    }
  var req_txt = {
     speech: "Cliquez sur le bouton timeline1 pour activer la zone stop du haut !"
     , r_delay: 500
     , rm : talkMachine
     , dir:3
     , x: "20px"
     , y: function(){ return (window.innerHeight-605)+"px"; }
     , repreat:10
     };
  var request = SC.tools.speech(req_txt);
  res = SC.seq(
          res
          , SC.action(function(){
              var btn = document.getElementById("tl1_btn");
              btn.hidden = false;
              })
          , SC.generate(writting, _(req_txt))
          , SC.par(
              SC.kill(show1t
                , SC.repeat(10
                    , SC.generate(request.sc_startSpeakEvt)
                    , SC.pause()
                    , SC.par(
                        SC.await(tmp.sc_endedEvt)
                      , SC.await(typeEndedEvt)
                        )
                    , SC.log('go for it')
                    )
                )
              , SC.seq(
                  SC.await(show1t)
                  , SC.action(function(){
                        window.speechSynthesis.cancel();
                        //setTimeout(function(){
                        //     //talkMachine.newValue();
                        //     }, 1000); 
                        })
                  )
              )
          );
  const description = [{
     speech:"Voilà, désormais, ce composant est actif et la première zone d'activation devient capable de réagir"
       + " aux solicitations de l'utilisateur."
     , r_delay: 500
     , rm : talkMachine
     , dir:3
     , x: "130px"
     , y: function(){ return (window.innerHeight-475)+"px"; }
     }
     , {
       speech:"Le temps qui s'écoule est figuré par le trait épaissi en noir."
         + " Ce trait figure l'activation du composant et le temps qui s'écoule, pendant un cycle du système."
       , r_delay: 500
       , rm : talkMachine
       }
     , {
       speech:"Si vous cliquez sur la zone stop du haut, vous observerez"
       + " plusieurs choses sur le chronogramme."
       , r_delay: 500
       , rm : talkMachine
       , dir:2
       , x: "110px"
       , y: "70px"
       , sync: function(end){return SC.await(zone1t)}
       }
     , {
       speech:"Pendant le click dans la zone stop, le composant acquiert le click, et son chronogramme"
       + " est surligné en rouge. Si le click est relâché, le chronogramme reste surligné en jaune, pour noter que"
       + " que le click a bien été mémorisé par le composant parallèle, pendant tout le temps restant du cycle courrant"
       + " du système. Au cycle suivant cette information est perdue, et on repart dans un état «sans click»."
       , r_delay: 500
       , rm : talkMachine
       , dir:3
       , x: "130px"
       , y: function(){ return (window.innerHeight-475)+"px"; }
       }
       , {
       speech:"Notez enfin, qu'à la fin de l'instant, le programme réactif, gérant le composant zone1, est exécuté. Et,"
       + " celui-ci diffuse un message, si un click est mémorisé. Cette diffusion de message est symbolisée ici,"
       + " par une flèche rouge, qui est envoyée au composant « zone de jeu »,"
       + " pour le moment toujours inactif."
       , r_delay: 500
       , rm : talkMachine
       , dir:3
       , x: "390px"
       , y: function(){ return (window.innerHeight-435)+"px"; }
       , sync: function(end){return SC.par(SC.await(zone1t), SC.await(end))}
       }
     ];
  //var timeline1 = SC.tools.speech(description);
  for(var i = 0 ; i < description.length; i++){
    var tmp = SC.tools.speech(description[i]);
    var res = SC.seq(
         res
       , SC.next(1)
       , SC.pause()
       , SC.generate(tmp.sc_startSpeakEvt)
       , SC.generate(writting, _(description[i]))
       , (undefined === description[i].sync)
                 ? SC.par(
                     SC.await(tmp.sc_endedEvt)
                   , SC.await(typeEndedEvt)
                     )
                 : description[i].sync(tmp.sc_endedEvt)
         );
    }
  res = SC.seq(
          res
          , SC.action(function(){
              var btn = document.getElementById("tl2_btn");
              btn.hidden = false;
              btn = document.getElementById("tl3_btn");
              btn.hidden = false;
              })
          );
  var request2 = {
         speech : "Nous allons donc, maintenant, activer les autres composants du systèmes.\n"
       + "Cliquez sur les boutons timeline2 et timeline3 pour activer la zone stop du bas et la zone de jeu."
       , r_delay: 500
       , rm : talkMachine
       , dir:3
       , x: "70px"
       , y: function(){ return (window.innerHeight-605)+"px"; }
       }
  tmp = SC.tools.speech(request2);
  res = SC.seq(
          res
          , SC.par(
              SC.generate(tmp.sc_startSpeakEvt)
              , SC.generate(writting, _(request2))
              , SC.seq(
                  SC.par(SC.await(show2t),SC.await(show3t))
                  , SC.next(1000)
                  )
              )
          );
  var timeline23 = [{
         speech : "Tous les composants sont désormais actifs.\nVous pouvez constater que le temps s'écoule"
       + " au même rythme pour les 3 composants. Et, à la fin de l'instant, tous les composants"
       + " réagissent."
       , r_delay: 500
       , rm : talkMachine
       , dir:3
       , x: "70px"
       , y: function(){ return (window.innerHeight-475)+"px"; }
       }
       , {
         speech :"Si les zones 1 et 2 de l'application ont été cliquées pendant la phase"
       + " d'acquisition, alors les composants de la zone1 et de la zone2 vont réagir à la fin"
       + " de l'instant en émettant 2 signaux à destination du composant animation, représentés par"
       + " 2 flèches rouges."
       , r_delay: 500
       , rm : talkMachine
       , dir:2
       , x: "150px"
       , y: "80px"
       }
       , {
         speech :"Si les deux signaux, sont envoyés au cours du même cycle, le composant"
       + " animation réagit et fait progresser un petit peu l'image de l'animation. Cette progression est"
       + " représentée par la grande flèche rouge, qui partie du chronogramme du composant animation, pointe"
       + " sur la zone de jeu dessinée plus haut.\n"
       , r_delay: 500
       , rm : talkMachine
       , dir:2
       , x: "470px"
       , y: "500px"
       , sync : function(end){return SC.par(SC.await(end), SC.await(zone2t), SC.await(zone1t));}
       }
       ];
  for(var i = 0 ; i < timeline23.length; i++){
    var tmp = SC.tools.speech(timeline23[i]);
    var res = SC.seq(
       res
       , SC.next(1)
       , SC.pause()
       , SC.generate(tmp.sc_startSpeakEvt)
       , SC.generate(writting, _(timeline23[i]))
       , (undefined === timeline23[i].sync)
                 ? SC.par(
                     SC.await(tmp.sc_endedEvt)
                   , SC.await(typeEndedEvt)
                     )
                 : timeline23[i].sync(tmp.sc_endedEvt)
       //, (undefined === timeline23[i].sync)?SC.await(tmp.sc_endedEvt):timeline23[i].sync(tmp.sc_endedEvt)
       );
    }
  res = SC.seq(
          res
          , SC.action(function(){
              ttt_slider.hidden = false;
              })
          );
  var slider = [{
         speech : "Comme nous l'avons dit, plus haut, cette démonstration propose une phase d'acquisition"
         + " démeusurément grande."
       , r_delay: 500
       , rm : talkMachine
       , dir:0
       , x: "300px"
       , y: "210px"
       }
       , {
         speech :"Cette situation n'est pas raisonnable dans le cadre du développement d'un système interactif."
         + " Actuellement, en étant suffisemment rapide, il est possible, en touchant successivement la zone de stop"
         + " du haut puis la zone de stop du bas, de faire croire au système, que les deux composants sont appuyés"
         + " au même moment et donc de faire progresser la zone de jeu."
       , r_delay: 500
       , rm : talkMachine
       }
       , {
         speech :" Nous avons donc ajouté un curseur horizontal, qui nous permettra de régler la durée d'un cycle complet du système."
         + " Cette durée qui est actuellement de 4 secondes. En déplaçant le curseur vers la gauche, vous réduisez la durée"
         + " du cycle. Vous pouvez réduire cette durée à 10 milisecondes au minimum. Avec une durée aussi courte, vous"
         + " constaterez qu'il devient très difficile d'alterner les clicks entre les zones de stop pour déclencher l'animation."
         + " Dans ces conditions, seule l'utilisation de la détection de contacts multiples permettra d'activer la zone de jeux."
       , r_delay: 500
       , rm : talkMachine
       , dir:3
       , x: "450px"
       , y: function(){ return (window.innerHeight-595)+"px"; }
       }
       ];
  for(var i = 0 ; i < slider.length; i++){
    var tmp = SC.tools.speech(slider[i]);
    var res = SC.seq(
       res
       , SC.next(1)
       , SC.pause()
       , SC.generate(tmp.sc_startSpeakEvt)
       , SC.generate(writting, _(slider[i]))
       , (undefined === slider[i].sync)
                 ? SC.par(
                     SC.await(tmp.sc_endedEvt)
                   , SC.await(typeEndedEvt)
                     )
                 : slider[i].sync(tmp.sc_endedEvt)
       );
    }
  return res;
  }
talkMachine.addToOwnProgram(
  makeTalk()
  );
function hack_ios(){
  talkMachine.newValue();
  }

SC.tools.addProgram(
  SC.click(hack_btn)
  );
/* Altération du comportement dans le workspace : desactivation des gestes
 * systèmes
 */
workspace.addEventListener("touchstart", function(evt){evt.preventDefault()});
/*
 * creation d'une seconde horloge pour afficher le graphe.
 * callage sur 10ms.
 */
var graphMachine = SC.machine(4000,{init:SC.pauseForever()});
graphMachine.addToOwnProgram(
  SC.action(function(m){
      //m.setRunningDelay(4000);
      SC.tools.generateEvent(newAcquisitionTime, 400);
      }
    )
  );

/*
 * génère un reset() dans la machine graphMachine
 */
graphMachine.addToOwnProgram(
  SC.repeat(SC.forever
    , SC.action(function(m){
        SC.tools.generateEvent(graph_reset, m.getInstantNumber());
        })
    )
  );

//function changeRTClock(v){
//  console.log("change RT to "+v);
//  SC.tools.generateEvent(graph_reset, SC.tools.m.getInstantNumber());
//  graphMachine.setRunningDelay(parseInt(v)*10);
//  SC.tools.generateEvent(newAcquisitionTime, v);
//  }

/* Définitions des principaux evenements utilisé dans la démo. */
var e = SC.evt("e");
var evt_global_kill = SC.evt("evt_global_kill");
var requestDisplay = SC.evt("requestDisplay");
var requestDisplayC2 = SC.evt("requestDisplayC2");
var zone1 = SC.evt("zone1");
var zone2 = SC.evt("zone2");
var zone1C2 = SC.evt("zone1C2");
var zone2C2 = SC.evt("zone2C2");
var newAcquisitionTime = SC.evt("newAcquisitionTime");
var zeConfig = SC.and(zone1, zone2)
/* Enregistrement des événements système. Les événements systèmes sont
 * drectements liés à la machine d'exécution réactive. Il s'agit d'événemnts
 * particuliers appelé sensor que l'on ne peut générer dans un programme et
 * quie l'on peut filtrer en événements standards grace à l'instruction
 * filter.
 */
SC_evt_mouse_click = SC.sensorize({name:"SC_evt_mouse_click"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"click"
                               }
                                       ]
                         });
SC_evt_mouse_down = SC.sensorize({name:"SC_evt_mouse_down"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"mousedown"
                               }
                                       ]
                         });
SC_evt_mouse_up = SC.sensorize({name:"SC_evt_mouse_up"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"mouseup"
                               }
                                       ]
                         });
SC_evt_mouse_move = SC.sensorize({name:"SC_evt_mouse_move"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"mousemove"
                               }
                                       ]
                         });
SC_evt_touch_start = SC.sensorize({name:"SC_evt_touch_start"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"touchstart"
                               }
                                       ]
                         });
SC_evt_touch_end = SC.sensorize({name:"SC_evt_touch_end"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"touchend"
                               }
                                       ]
                         });
SC_evt_touch_cancel = SC.sensorize({name:"SC_evt_touch_cancel"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"touchcancel"
                               }
                                       ]
                         });
SC_evt_touch_move = SC.sensorize({name:"SC_evt_touch_move"
                         , dom_targets:[
                               {
                                 target:workspace
                               , evt:"touchmove"
                               }
                                       ]
                         });
graph_mouse_click = SC_evt_mouse_click;
graph_mouse_down = SC_evt_mouse_down;
graph_mouse_up = SC_evt_mouse_up;
graph_mouse_move = SC_evt_mouse_move;
graph_touch_start = SC_evt_touch_start;
graph_touch_end = SC_evt_touch_end;
graph_touch_cancel = SC_evt_touch_cancel;
graph_touch_move = SC_evt_touch_move;
graph_reset = SC.evt('reset');
workspace.lvl1=[];
workspace.lvl2=[];
workspace.dropFrame = false;
workspace.dropFrame2 = false;
/*
 * mise à jour de l'affichage
 */
SC.tools.addProgram(
  SC.actionOn(requestDisplay
    , function(all){
        if(workspace.dropFrame){
          return;
        }
        workspace.dropFrame = true;
        workspace.lvl1 = all[requestDisplay];
        window.requestAnimationFrame(
          function(){
            workspace.frameNumber++;
            var ctx = workspace.getContext("2d");
            ctx.clearRect(0, 0, workspace.width, workspace.height);
            for(var i in workspace.lvl2){
              var obj = workspace.lvl2[i];
              if("function" == typeof obj){ obj(ctx); }
              else{obj.draw(ctx);}
              }
            for(var i in workspace.lvl1){
              var obj = workspace.lvl1[i];
              if("function" == typeof obj){ obj(ctx); }
              else{obj.draw(ctx);}
              }
            if(0 == workspace.frameNumber%256){
              if(0 != workspace.fpsMeasuring){
                workspace.fps = Math.floor(workspace.frameNumber*10000
                     /(window.performance.now()-workspace.fpsMeasuring))/10;
              }
              else{
                workspace.fpsMeasuring = window.performance.now();
                }
              }
            workspace.dropFrame = false;
          })
        }, undefined, SC.forever)
  );
graphMachine.addToOwnProgram(
  SC.actionOn(requestDisplayC2
    , function(all){
        if(workspace.dropFrame2){
          return;
        }
        workspace.dropFrame2 = true;
        workspace.lvl2 = all[requestDisplayC2];
        window.requestAnimationFrame(
          function(){
            workspace.frameNumber++;
            var ctx = workspace.getContext("2d");
            ctx.clearRect(0, 0, workspace.width, workspace.height);
            for(var i in workspace.lvl1){
              var obj = workspace.lvl1[i];
              if("function" == typeof obj){ obj(ctx); }
              else{obj.draw(ctx);}
              }
            for(var i in workspace.lvl2){
              var obj = workspace.lvl2[i];
              if("function" == typeof obj){ obj(ctx); }
              else{obj.draw(ctx);}
              }
            workspace.dropFrame2 = false;
          })
        }, undefined, SC.forever)
  );

/*******
 * Classe Buble
 *******/
function Buble(x,y,r, clr, startEvt){
  this.x = x;
  this.y = y;
  this.r = r;
  this.bgcolor = clr;
  this.label = "Zone de jeu ";
  this.text = "";
  this.started = false;
  graphMachine.addToOwnProgram(
    SC.par(
      SC.repeat(SC.forever, SC.generate(requestDisplayC2, this))
      , SC.seq(
          SC.await(startEvt)
          , SC.action({t:this, f:"start"})
          , SC.repeat(SC.forever
              , SC.action({t:this, f:"chooseText"})
              )
          )
      )
    );
}
Buble.prototype ={
  draw : function(ctx){
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.font = "30px Times";
    ctx.fillText(this.label+this.text, this.x-30, this.y-100);
    ctx.closePath();
    if(this.started){
      ctx.drawImage(tt_video, this.x-160, this.y-100, 320,200);
      }
    ctx.restore();
    }
  , start:function(){
    this.started = true;
    }
  , chooseText: function(m){
    if(zeConfig.isPresent(m)){
      if(!zone1.isPresent(m)||!zone2.isPresent(m)){
        throw "buh !!!";
        }
      }
    this.text = (zeConfig.isPresent(m))?"active":"non active";
    if(zeConfig.isPresent(m)){
      var toto = tt_video.currentTime+0.033;
      tt_video.currentTime = toto;
      SC.tools.generateEvent(play);
      }
    }
}
/*******
 * Classe Buble
 *******/
function Zone(x, y , r, zoneEvt, zc2, startEvt, clr, img){
  this.x = x;
  this.y = y;
  this.r = r;
  this.bgcolor = clr;
  this.id = null;
  this.id2 = null;
  var localKill = SC.evt("localKill");
  this.hidden = false;
  this.zoneVisible = false;
  this.img = img;
  this.img_zoom = 1;
  this.rotateImg = 0;
  graphMachine.addToOwnProgram(
      SC.par(
          SC.generate(requestDisplayC2, this, SC.forever)
          , SC.seq( SC.await(startEvt), SC.filter(graph_mouse_down, zoneEvt, {t:this,f:"filterStartMouse"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_mouse_move, zoneEvt, {t:this,f:"filterStartMouse2"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_mouse_move, localKill, {t:this,f:"filterMoveMouse"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_mouse_up, localKill, {t:this,f:"filterEndMouse"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_touch_start, zoneEvt, {t:this,f:"filterStart"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_touch_move, zoneEvt, {t:this,f:"filterStart"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_touch_move, localKill, {t:this,f:"filterMove"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_touch_end, localKill, {t:this,f:"filterEnd"}, SC.forever))
          , SC.seq( SC.await(startEvt), SC.filter(graph_touch_cancel, localKill, {t:this,f:"filterEnd"}, SC.forever))
          , SC.repeat(SC.forever
               , SC.await(zoneEvt)
               , SC.kill(localKill
                   , SC.generate(zoneEvt, undefined, SC.forever)
                   )
               )
        )
    );
  var lk = SC.evt("localKill");
  SC.tools.addProgram(
      SC.par(
        SC.filter(SC_evt_mouse_down, zc2, {t:this,f:"filterStartMouse"}, SC.forever)
        , SC.filter(SC_evt_mouse_move, zc2, {t:this,f:"filterStartMouse2"}, SC.forever)
        , SC.filter(SC_evt_mouse_move, lk, {t:this,f:"filterMoveMouse"}, SC.forever)
        , SC.filter(SC_evt_mouse_up, lk, {t:this,f:"filterEndMouse"}, SC.forever)
        , SC.filter(SC_evt_touch_start, zc2, {t:this,f:"filterStartC2"}, SC.forever)
        , SC.filter(SC_evt_touch_move, zc2, {t:this,f:"filterStartC2"}, SC.forever)
        , SC.filter(SC_evt_touch_move, lk, {t:this,f:"filterMoveC2"}, SC.forever)
        , SC.filter(SC_evt_touch_end, lk, {t:this,f:"filterEndC2"}, SC.forever)
        , SC.filter(SC_evt_touch_cancel, lk, {t:this,f:"filterEndC2"}, SC.forever)
        , SC.repeat(SC.forever
            , SC.await(zc2) 
            , SC.kill(lk
                , SC.generate(zc2, undefined, SC.forever)
                )
            )
        )
    );
}
Zone.prototype = {
  constructor : Zone
, filterStartBase : function(t){
    for(var n in t){
      var touch = t[n];
      var rx = this.x - touch.x;
      var ry = this.y - touch.y;
      var r = Math.sqrt(rx*rx + ry*ry);
      if(r < this.r){
        return touch;
        }
      }
    return;
    }
  , filterStartMouse : function(t){
      var res = this.filterStartBase(t);
      if(null != res){
        this.click = true;
        }
      return res;
      }
  , filterStartMouse2 : function(t){
      var res = this.filterStartBase(t);
      if(! this.click){
        return;
        }
      return res;
      }
  , filterEndMouse : function(t){
      this.click = false;
      return "exit";
      }
  , filterMoveMouse : function(t){
      for(var n in t){
        var touch = t[n];
        if(0 >= touch.btn){
          return null;
          }
        var rx = this.x - touch.x;
        var ry = this.y - touch.y;
        var r = Math.sqrt(rx*rx + ry*ry);
        if(r > this.r){
          return "exit";
          }
        }
        return;
      }
};
Zone.prototype.filterStart= function(t){
  var res = this.filterStartBase(t);
  if(null != res){
    this.id = res.id;
    //console.log("id "+this.id );
  }
  return res;
  }
Zone.prototype.filterStartC2= function(t){
  var res = this.filterStartBase(t);
  if(null != res){
    this.id2 = res.id;
    //console.log("id "+this.id2 );
  }
  return res;
  }
Zone.prototype.filterMove= function(t){
  for(var n in t){
    var touch = t[n];
    if( this.id != touch.id ){
      continue;
    }
    var rx = this.x - touch.x;
    var ry = this.y - touch.y;
    var r = Math.sqrt(rx*rx + ry*ry);
    if(r > this.r){
      return "exit";
    }
  }
}
Zone.prototype.filterMoveC2= function(t){
  for(var n in t){
    var touch = t[n];
    if( this.id2 != touch.id ){
      continue;
    }
    var rx = this.x - touch.x;
    var ry = this.y - touch.y;
    var r = Math.sqrt(rx*rx + ry*ry);
    if(r > this.r){
      return "exit";
    }
  }
}
Zone.prototype.filterEndC2= function(t){
  for(var n in t){
    if(t[n].id == this.id2){
      return "zone1";
    }
  }
}
Zone.prototype.filterEnd= function(t){
  for(var n in t){
    if(t[n].id == this.id){
      return "zone1";
    }
  }
}
Zone.prototype.draw = function(ctx){
  if(this.hidden){
    return;
  }
  ctx.save();
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
  ctx.restore();
}

var stopImage = new Image(225,225);
stopImage.src = "images/png/stop.png";

new Zone(60,100,40, zone1, zone1C2, show1g, "yellow", stopImage);
new Zone(60,400,40, zone2, zone2C2, show2g, "red", stopImage);
buble = new Buble(400,300, 60, "green", show3g);

graphMachine.addToOwnProgram(
  SC.repeat(SC.forever
    , SC.await(zone1)
    , SC.action(function(){
        SC.tools.generateEvent(comA)
        })
    )
);
graphMachine.addToOwnProgram(
  SC.repeat(SC.forever
    , SC.await(zone2)
    , SC.action(function(){
        SC.tools.generateEvent(comB)
        })
    )
);

function InstantFrontier(params){
  this.x = params.x;
  this.y = 580;
  this.flag = (undefined !== params.flag)?params.flag:false;
  this.actionWidth = 0;
  this.radiusA = 0;
  this.radiusB = 0;
  this.playGame = 0;
}
InstantFrontier.prototype = {
  draw : function(ctx){
    const arc = 1.4*Math.PI/4;
    const r1 = 30;
    const r2 = 15;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,0,0.7)";
    ctx.lineWidth=this.actionWidth;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y-100);
    ctx.stroke(); 
    ctx.closePath();
    if(this.radiusA>0){
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y-80, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill(); 
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(this.x, this.y-50, r1, -arc, arc);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.translate(this.x+r1*Math.cos(arc)
                   , this.y-50+r1*Math.sin(arc)
                   );
      ctx.rotate(1.3*arc+Math.PI/2);
      ctx.moveTo(-6,-6);
      ctx.lineTo(0,6);    
      ctx.lineTo(6,-6);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.closePath();
      ctx.restore();
      }
    if(this.radiusB>0){
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y-50, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(this.x, this.y-35, r2, -arc, arc);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.translate(this.x+r2*Math.cos(arc)
                   , this.y-35+r2*Math.sin(arc)
                   );
      ctx.rotate(1.4*arc+Math.PI/2);
      ctx.moveTo(-6,-6);
      ctx.lineTo(0,6);    
      ctx.lineTo(6,-6);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.closePath();
      ctx.restore();
      }
    if(this.playGame>0){
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y-20, this.radiusA, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(500, this.y-160, 140, -1.2*arc, 1.2*arc);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.translate(500+134*Math.cos(-1.2*arc)
                   , this.y-160+140*Math.sin(-1.2*arc)
                   );
      ctx.rotate(1.2*arc+3*Math.PI/2);
      ctx.moveTo(-6,-6);
      ctx.lineTo(0,6);    
      ctx.lineTo(6,-6);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.closePath();
      ctx.restore();
      }
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.lineWidth=4;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y-100);
    ctx.stroke();
    ctx.closePath();
    if(this.flag){
      ctx.fillText(((this.x-20)*10)+" ms", this.x, this.y-120);
      }
    ctx.restore();
    }
  , self : function(m){
    return this;
    }
  , update : function(vals){
    var v = parseInt(vals[newAcquisitionTime][0]);
    this.x = v+20;
    }
  , pulse : function(){
    this.actionWidth = (this.actionWidth+4)%32;
    }
  , emitA : function(){
    this.radiusA = (this.radiusA+0.5)%16;
    }
  , emitB : function(){
    this.radiusB = (this.radiusB+0.5)%16;
    }
  , play : function(){
    this.playGame = (this.playGame+1)%32;
    }
}
SC.tools.addProgram(
  SC.cube(
    new InstantFrontier({x:20})
    , SC.generate(requestDisplay, SC.my("self"), SC.forever)
    )
  );
SC.tools.addProgram(
  SC.cube(
    new InstantFrontier({x:420, flag:true})
    , SC.par(
        SC.generate(requestDisplay, SC.my("self"), SC.forever)
        , SC.actionOn(newAcquisitionTime
            , SC.my("update")
            , undefined
            , SC.forever)
        , SC.repeat(SC. forever, SC.await(graph_reset), SC.action(SC.my("pulse"),32))
        , SC.repeat(SC. forever, SC.await(comA), SC.action(SC.my("emitA"),32))
        , SC.repeat(SC. forever, SC.await(comB), SC.action(SC.my("emitB"),32))
        , SC.repeat(SC. forever, SC.await(play), SC.action(SC.my("play"),32))
        )
    )
  );

function ProgramChrono(params){
  this.x0 = params.x;
  this.y0 = params.y;
  this.cpt = 0;
  this.signals = [];
  this.newSignal = null;  
  this.text = params.text;
  this.showEvt = params.showEvt;
  this.visible = false;
  this.x1 = (undefined === params.x1)?params.x:params.x1;
  this.y1 = (undefined === params.y1)?params.y:params.y1;
  this.startedTime = window.performance.now();
}
ProgramChrono.prototype = {
  draw : function(ctx){
    ctx.save();
    ctx.strokeStyle = "grey";
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(this.x0, this.y0);
    ctx.lineTo(this.x1, this.y1);
    ctx.stroke();
    ctx.closePath();
    if(this.visible){
      ctx.strokeStyle = "black";
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(20, this.y0);
      ctx.lineTo(20+this.cpt, this.y1);
      ctx.stroke();
      ctx.closePath();
      if(this.signals.length > 0){
        ctx.strokeStyle = "rgba(255,255,0,0.5)";
        ctx.lineWidth=9;
        ctx.beginPath();
        var sx = (this.signals[0].start) + 20;
        ctx.moveTo(sx, this.y0);
        ctx.lineTo(this.cpt+20, this.y1);
        ctx.stroke();
        ctx.closePath();
        for(var sig = 0; sig < this.signals.length; sig++){
          var si = this.signals[sig];
          ctx.strokeStyle = "rgba(255,0,0,0.7)";
          ctx.lineWidth=9;
          ctx.beginPath();
          ctx.moveTo(si.start+20, this.y0);
          ctx.lineTo(si.stop+20, this.y1);
          ctx.stroke();
          ctx.closePath();
          }
        }
      if(null !== this.newSignal){
        ctx.strokeStyle = "rgba(255,0,0,0.7)";
        ctx.lineWidth=9;
        ctx.beginPath();
        ctx.moveTo(this.newSignal.start+20, this.y0);
        ctx.lineTo(this.cpt+20, this.y1);
        ctx.stroke();
        ctx.closePath();
        }
      }
    if(undefined != this.text){
      ctx.fillText(this.text, 700, this.y0-4);
      }
    ctx.restore();
    }
  , self : function(m){
    return this;
    }
  , acquire : function(v, m){
    //console.log("acquire "+m.getInstantNumber());
    if(null == this.newSignal){
      this.newSignal = {start:this.cpt};
      }
    }
  , stopAcquire : function(m){
    //console.log("stop_acquire "+m.getInstantNumber());
    if(null === this.newSignal){return;}
    this.newSignal.stop = this.cpt;
    this.signals.push(this.newSignal);
    this.newSignal = null;
    }
  , resetAcquire : function(){
    //console.log("cpt = "+this.cpt);
    this.cpt = 0;
    this.signals=[];
    this.newSignal = null;
    this.startedTime = window.performance.now();
    }
  , step : function(){
    this.cpt=((window.performance.now()-this.startedTime)/10);
    }
  , setVisible : function(b){
    this.visible = b;
    }
  , actVisible : function(vals){
    var b = vals[this.showEvt][0];
    this.setVisible(b);
    }
}
SC.tools.addProgram(
  SC.cube(
    new ProgramChrono({x:0, y:500, x1: 800, text:"zone1", showEvt: show1})
    , SC.par(
        SC.generate(requestDisplay, SC.my("self"), SC.forever)
        , SC.repeat(SC.forever, SC.action(SC.my('step')))
        , SC.actionOn(show1, SC.my("actVisible"), undefined, SC.forever)
        , SC.repeat(SC.forever, SC.await(zone1C2), SC.action(function(){
            talkMachine.addToOwnEntry(zone1t, null);
            //talkMachine.react();
            }))
        , SC.repeat(SC.forever
            , SC.kill(graph_reset
                , SC.actionOn(zone1C2, SC.my("acquire"), SC.my("stopAcquire"), SC.forever)
                )
            , SC.action(SC.my("resetAcquire"))
            )
        )
    )
  );
SC.tools.addProgram(
  SC.cube(
    new ProgramChrono({x:0, y:530, x1: 800, text:"zone2", showEvt: show2})
    , SC.par(
        SC.generate(requestDisplay, SC.my("self"), SC.forever)
        , SC.repeat(SC.forever, SC.action(SC.my('step')))
        , SC.actionOn(show2, SC.my("actVisible"), undefined, SC.forever)
        , SC.repeat(SC.forever, SC.await(zone2C2), SC.action(function(){
            talkMachine.addToOwnEntry(zone2t, null);
            //talkMachine.react();
            }))
        , SC.repeat(SC.forever
            , SC.kill(graph_reset
                , SC.actionOn(zone2C2, SC.my("acquire"), SC.my("stopAcquire"), SC.forever)
                )
            , SC.action(SC.my("resetAcquire"))
            )
        )
    )
  );
SC.tools.addProgram(
  SC.cube(
    new ProgramChrono({x:0, y:560, x1: 800, text:"zone de jeu", showEvt: show3})
    , SC.par(
        SC.generate(requestDisplay, SC.my("self"), SC.forever)
        , SC.repeat(SC.forever, SC.action(SC.my('step')))
        , SC.actionOn(show3, SC.my("actVisible"), undefined, SC.forever)
        , SC.repeat(SC.forever
            , SC.kill(graph_reset
                , SC.pause(SC.forever)
                )
            , SC.action(SC.my("resetAcquire"))
            )
        )
    )
  );

function z1(){
  SC.tools.generateEvent(show1,true);
  graphMachine.addToOwnEntry(show1g,true);
  talkMachine.addToOwnEntry(show1t,true);
  //talkMachine.react();
  }
function z2(){
  SC.tools.generateEvent(show2,true);
  graphMachine.addToOwnEntry(show2g,true);
  talkMachine.addToOwnEntry(show2t,true);
  //talkMachine.react();
  }
function z3(){
  SC.tools.generateEvent(show3,true);
  graphMachine.addToOwnEntry(show3g,true);
  talkMachine.addToOwnEntry(show3t,true);
  //talkMachine.react();
  tt_video.load();
  //video.play();
  //video.pause();
  //video.currentTime = 0;

  }
var h1 = SC.tools.makeDiv({
  id:"button1"
  , inH:"zone 1"
})
//style:"position:fixed; top:50px; left:20px; width:150px; height:150px;background:pink;display:none;">
//zone1
//</div>
var h2 = SC.tools.makeDiv({
  id : "button2"
  , inH:"zone 2"
});
//style="position:fixed; top:450px; left:20px; width:150px; height:150px;background:pink;display:none;">
//zone2
//</div>

var h3 = document.getElementById("timelines");
var h4 = document.getElementById("jeu");
SC.tools.initTouchTracker();
