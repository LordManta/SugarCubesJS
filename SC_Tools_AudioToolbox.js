/*
 * SC_AudioToolBox.js
 * Author : Jean-Ferdy Susini
 * Created : 06/11/2015 10:18
 * Part of the SugarCubes Project
 * version : 5.0 alpha
 * implantation : 0.1
 * Copyright 2014-2023.
 */

/*********************
 * Gestion audio
 *********************/

;
if(SC && SC.sc_build>1 && SC.tools){
  (function(params){
/*
Support audio.
On crée un AudioContext commun à tous les players.
*/
    function AudioResource(params){
      const url= params.src;
      const ticks= params.ticks;
      const audio= new Audio();
      const Samp_ended= SC.sampled("Samp_ended");
      this.a= audio;
      this.Samp_ended= Samp_ended;
      this.playing= false;
      this.rt= ticks;
      this.rt_count= ticks;
      this.url= url;
      this.Samp_loaded= SC.sensor("loaded", { dom_targets: [ { target: audio, evt: "loadeddata" } ] });
      const eh= function(evt){
        this.Samp_ended.newValue();
	if(this.burst){
	  this.burst.push(evt.target);
	  }
        this.rt_count= this.rt;
        this.playing= false;
        }.bind(this);
      if(params.burst){
	this.burst= [ audio ];
	this.play= function(){
	  var newSnd= this.burst.pop();
	  if(undefined==newSnd){
            newSnd= this.a.cloneNode();
            newSnd.addEventListener("ended", eh);
            }
	  newSnd.play();
	  };
        }
      audio.addEventListener("ended", eh);
      if(params.init){
        this.Evt_play= SC.evt("play");
        SC.tools.addProgram(
	  SC.cube(this
	  , SC.repeatForever(
              SC.await(this.Evt_play), SC.action("play")
              )
	    )
          );
        }
      };
    AudioResource.prototype.play=function(){
      if(this.rt<0){
        this.a.play();
        }
      else if(this.rt_count>0){
        this.rt_count--;
        }
      else if(!this.playing){
        this.playing=true;
        this.a.play();
        }
      };
    AudioResource.prototype.stop=function(){
      if(this.playing){
        this.playing=false;
        this.a.pause();
        this.a.currentTime=0;
        }
      };
/*
Jouer des sons grace aux objets AudioChunk
*/
    function AudioChunk(data){
      if(undefined===SC.tools.audioContext){
        console.error("no Web Audio API");
        return false;
        }
      this.buffer=null;
      this.source=null;
      this.idx=SC.tools.audioToolbox.sFXs.length;
      this.log="";
      this.Samp_ended=SC.sampled("Samp_ended");
      this.Samp_loaded=SC.sampled("Samp_"+this.idx+"_loaded");
      this.data=data;
      this.Evt_play=SC.evt("Evt_play");
      this.Evt_pause=SC.evt("Evt_pause");
      this.Evt_resume=SC.evt("Evt_resume");
      this.Evt_stop=SC.evt("Evt_stop");
      SC.tools.main.addProgram(
        SC.seq(
          SC.await(this.Samp_loaded)
        , SC.repeatForever(
            SC.kill(this.Evt_stop
            , SC.seq(
                SC.await(this.Evt_play)
              , SC.action({ t: this, f: "play" })
              , SC.par(
                  SC.seq(
                    SC.repeatForever(
                      SC.await(this.Evt_pause)
                    , SC.action({ t: this, f: "pause" })
                    , SC.await(this.Evt_resume)
                    , SC.action({ t: this, f: "resume" })
                      )
                    )
                , SC.seq(SC.await(this.Samp_ended), SC.generate(this.Evt_stop))
                  )
                )
            , SC.action({ t: this, f: "stop" })
              )
            )
          )
        );
      this.load();
      };
    AudioChunk.prototype.load=function(){
      const decodedStr=atob(this.data);
      const len=decodedStr.length;
      const arrayBuff=new Uint8Array(len);
      for(var n=0; n<len; n++){
        arrayBuff[n]=decodedStr.charCodeAt(n);
        }
      SC.tools.audioContext.decodeAudioData(arrayBuff.buffer
      , function(audioData){
          this.buffer=audioData;
          this.Samp_loaded.newValue();
          }.bind(this));
      };
    AudioChunk.prototype.toString=function(){
      return "AudioToolbox.AudioChunk";
      };
    AudioChunk.prototype.setDestination=function(dest){
      this.dest=dest;
      if(null!=this.source){
        this.source.disconnect();
        this.source.connect(this.dest);
        }
      };
    AudioChunk.prototype.pause=function(){
            if(null !=  this.source){
              this.source.disconnect();
              }
            }
    AudioChunk.prototype.resume=function(){
            if(null !=  this.source){
              this.source.connect((undefined !== this.dest)?this.dest
                                     :SC.tools.audioContext.destination);
              }
            }
    AudioChunk.prototype.i=function(msg){
            return this.log += msg;
            }
    AudioChunk.prototype.play=function(){
      if(null!=this.source){
        return;
        }
      this.source=SC.tools.audioContext.createBufferSource();
      this.source.buffer=this.buffer;
      if(undefined!==this.dest){
        this.source.connect(this.dest);
        }
      else{
        this.source.connect(SC.tools.audioContext.destination);
        }
      this.source.onended=function(evt){
        this.Samp_ended.newValue();
        this.stop();
        }.bind(this);
      this.source.start(0);
      };
    AudioChunk.prototype.stop=function(){
            if(null != this.source){
              this.source.stop(0);
              }
            this.source = null;
            }
    Object.defineProperty(SC.tools, 'audioToolbox', {
        value: {
          audioFormats: ["audio/mp3", "audio/mp4"]
        , Evt_audioLoaded: SC.evt("Evt_audioLoaded")
        , audioExtensions: [".mp3", ".m4a"]
        , extension: ""
        , altextension: ""
        , waittingLoad: SC.par()
        , sFXs: []
        , init: function(){
            var sharedContext=null;
            var webKitAPI=false;
            if(sc_global.AudioContext){
              sharedContext=new sc_global.AudioContext();
              }
            else if(sc_global.webkitAudioContext){
              try{
                sharedContext=new sc_global.webkitAudioContext();
                webKitAPI=true;
                }
              catch(e){
                console.error("no Web Audio API");
                }
              }
            else{
              console.error("no Web Audio API");
              }
            Object.defineProperty(SC.tools, "audioContext"
            , { value: sharedContext
              , writable: false
                }
              );
            /*
            Microphone not yet implemented
            */
            var microPhoneManager=sharedContext.createScriptProcessor(512);
            microPhoneManager.connect(sharedContext.destination);
            microPhoneManager.onaudioprocess=function(evt){};
            //microPhoneManager.clipping = false;
            //processor.lastClip = 0;
            //processor.volume = 0;
            //processor.clipLevel = clipLevel || 0.98;
            //processor.averaging = averaging || 0.95;
            //processor.clipLag = clipLag || 750;
            // this will have no effect, since we don't copy the input to the output,
            // but works around a current Chrome bug.
            //processor.checkClipping =
            //  function(){
            //    if (!this.clipping)
            //      return false;
            //    if ((this.lastClip + this.clipLag) < window.performance.now())
            //      this.clipping = false;
            //    return this.clipping;
            //  };
            //
            //processor.shutdown =
            //  function(){
            //    this.disconnect();
            //    this.onaudioprocess = null;
            //  };
            if(undefined===SC.tools.main){
              throw new Error("initialize tools first");
              }
            var dummy=new Audio();
            /*
             * détermine un format audio supporté
             */
            for(var i in this.audioFormats){
              switch(dummy.canPlayType(this.audioFormats[i])){
                case "probably":{
                  this.extension=this.audioExtensions[i];
                  break;
                  }
                case "maybe":{
                  this.altextension=this.audioExtensions[i];
                  break;
                  }
                }
              if(""!=this.extension){
                break;
                }
              }
            if((""==this.extension) && (""!=this.altextension)){
              this.extension=this.altextension;
              }
            }
        , loadAudioFile: function(url, ticks){
            var res=new AudioResource({ url: url, ticks: ticks });
            res.a.src=url;
            res.a.load();
            return res;
            }
        , addAudioFile: function(url, ticks, init){
	    var params= { src: url, ticks: ticks, init: init };
	    if("string"!=typeof(url) && 'object'==typeof(url) && 1==arguments.length){
	      params= url;
	      }
            var res= new AudioResource(params);
            this.sFXs.push(res);
            this.waittingLoad.add(SC.seq(SC.action(function(){
                                                     this.a.src=this.url;
                                                     this.a.load();
                                                     }.bind(res))
	                               , SC.await(res.Samp_loaded)));
            res.a.sc_needToLoad=true;
            return res;
            }
        , newAudioChunck: function(data){
            var res=new AudioChunk(data);
            this.sFXs.push(res);
            this.waittingLoad.add(SC.await(res.Samp_loaded));
            return res;
            }
        , mkBQFilter: function(p){
            var tmp=SC.tools.audioContext.createBiquadFilter();
            tmp.connect(SC.tools.audioContext.destination);
            tmp.type=(undefined!==p.type)?p.type:"bandpass";
            tmp.frequency.value=(undefined!==p.f)?p.f:2050;
            tmp.Q.value=(undefined!==p.Q)?p.Q:5;
            tmp.gain.value=(undefined!==p.g)?p.g:0;
            return tmp;
            }
        , loadAll: function(){
            SC.tools.main.addProgram(
              SC.seq(
                this.waittingLoad
              , SC.generate(this.Evt_audioLoaded)
                )
              );
            for(var n in this.sFXs){
              if(this.sFXs[n] instanceof(AudioChunk)){
                var audio=this.sFXs[n];
                audio.load();
                }
              else{
                var audio=this.sFXs[n].a;
                if(audio.sc_needToLoad){
                  audio.src=this.sFXs[n].src;
                  audio.load();
                  audio.sc_needToLoad=false;
                  }
                }
              }
            }
          }
      , writable: false
        });
    }).call(sc_global, p);
  }
else{
  throw new Error("SugarCubesJS must be loaded first and tools initialized");
  }
