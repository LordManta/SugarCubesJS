/*
 * SC_Tools.js
 * Author : Jean-Ferdy Susini (MNF)
 * Created : 20/12/2014 18:46
 * Part of the SugarCubes Project
 * version : 5.0.1072.alpha
 * build: 1072
 * Copyleft 2014-2025.
 */
;
if(SC && SC.sc_build>1 && undefined===SC.tools){
  Object.defineProperty(SC, "tools"
                          , { value: (function(params){
    var main=params.tools.main;
    var periodic=null;
    const SC_ClientTools={
      crc32_bin: function(bytes){
        const crc=new Uint32Array(3);
        crc[0]=0xFFFFFFFF;
        const n=input.length;
        for(var i=0; i<n; i++){
          crc[1]=(bytes[i]&0xFF);
          for(var j=0; j<8; j++){
            crc[2]=((crc[1]>>j)^crc[0])&0x1;      
            crc[0]>>>= 1;
            if(crc[2]){
              crc[0]^=0xEDB88320;
              }
            }
          }
        crc[0]=~crc[0];
        return crc[0];
        }
    , convertB2C_64: function(n){
          var code= 0;
          if(n<25){
            code= 65+n;
            }
          else if(n<51){
            code= 97+n;
            }
          else if(52==n){
            code= 95;
            }
          else{
            code= 45;
            }
          return String.fromCharCode(code);
          }
    , signal_ft: function(signal, params={}){ 
        const N=signal.length;
        const threshold=(params.threshold)?params.threshold:1e-8;
        const DE_PI_N=2*Math.PI/N;
        const ft=params.provided?params.provided:new Float32Array(2*N);
        for(var f=0; f<N; f++){
          var freq_re=0, freq_im=0;
          for(var t=0; t<N; t++){
            const amp=signal[t];
            const alpha=-DE_PI_N*f*t;
            const part_re=amp*Math.cos(alpha), part_im=amp*Math.sin(alpha);
            freq_re+=part_re;
            freq_im+=part_im;
          }
          freq_re/=N/2;
          freq_im/=N/2;
          ft[2*f]=(Math.abs(freq_re)<threshold)?0:freq_re;
          ft[2*f+1]=(Math.abs(freq_im)<threshold)?0:freq_im;
          }
        return ft;
        }
    , spectrum_ft: function(spectrum, params={}){
        const N=spectrum.length; 
        const hN=N/2; 
        const threshold=(params.threshold)?params.threshold:1e-8;
        const DE_PI_N=Math.PI/N;
        const s=params.provided?params.provided:new Float32Array(hN);
        for(var t=0; t<hN; t++){
          var sig_re=0, sig_im=0;
          for(var f=0; f<hN; f++){
            const sf_re=spectrum[2*f], sf_im=spectrum[2*f+1];
            const alpha=DE_PI_N*f*t;
            const part_re=Math.cos(alpha), pert_im=Math.sin(alpha);
            sig.re+=part_re*sf_re-part_im*sf_im;
            sig.im+=part_re*sf_im+part_im*sf_re;
            }
          sig_re/=hN;
          sig_im/=hN;
          s[2*t]=(Math.abs(sig_re) < threshold)?0:sig_re;
          s[2*t+1]=(Math.abs(sig_im) < threshold)?0:sig_im;
          }
        return s;
        }
    , getUnSymNormsOf: function(complex, p={}){
        if(0!=(complex.length%2)){
          throw new Error("not valid spec");
          }
        const N= (complex.length-(complex.length%4))/2;
        const N2= N/2;
        const mu=(p.mul)?p.mul:1;
        const norms= p.provided?p.provided:new Float32Array(N);
        for(var i=0; i<N; i++){
          const re=complex[2*i];
          const im=complex[2*i+1];
          if(p.disp0 || 0!=i){
            norms[i<=N2?(N2+i):(i-N2)]=mu*Math.sqrt(re*re+im*im);
            }
          else{
            norms[0]=0;
            }
          }
        return norms;
        }
    , heaviside: function(z){
          return z>=0?1:0;
          }
    , sigmoid: function(z){
          return 1/(1+Math.exp(-z));
          }
    , relu: function(z){
          return z<0?0:z;
          }
    , id: function(z){
          return z;
          }
    , near: function(z){
          return 2/(1+Math.exp(Math.abs(z/10)))-0.5;
          }
    , softmax: function(z){
          const res=[];
          var st= 0;
          if(!Array.isArray(z)){
            z= [ z ];
            }
          const zl= z.lentgh;
          for(var i= 0; i<zl; i++){
            st+= Math.exp(z[i]);
            }
          for(var i=0; i<zl; i++){
            res.push(z[i]/st);
            }
          return res;
          }
    , getRealParts: function(complex,  p={}){
        if(0!=(complex.length%2)){
          throw new Error("not valid spec");
          }
        const N=complex.length/2;
        const mu=(p.mul)?p.mul:1;
        const norms=p.provided?p.provided:new Float32Array(N);
        for(var i=0; i<N; i++){
          norms[i]=complex[2*i]*mu;
          }
        return norms;
        }
    , getNormsOf: function(complex,  p={}){
        if(0!=(complex.length%2)){
          throw new Error("not valid spec");
          }
        const N=complex.length/2;
        const mu=(p.mul)?p.mul:1;
        const norms=p.provided?p.provided:new Float32Array(N);
        for(var i=0; i<N; i++){
          const c_re=complex[2*i];
          const c_im=complex[2*i+1];
          norms[i]=mu*Math.sqrt(c_re*c_re+c_im*c_im);
          }
        return norms;
        }
    , applyFilter: function(complex, filter,  p={}){
        if(0!=(complex.length%2)){
          throw new Error("not valid spec");
          }
        const N= complex.length;
        const res= p.provided?p.provided:new Float32Array(N);
        for(var i= 0; i<N; i++){
          const i2= 2*i;
          const filtered= filter(i, complex[i2], complex[i2+1]);
          res[i2]= filtered[0];
          res[i2+1]= filtered[1];
          }
        return res;
        }
    , applyAttenuation: function(complex, filter,  p={}){
        if(0!=(complex.length%2)){
          throw new Error("not valid spec");
          }
        const N=complex.length;
        const norms=p.provided?p.provided:new Float32Array(N);
        for(var i=0; i<N; i++){
          norms[2*i]=complex[2*i]*filter(i);
          norms[2*i+1]=complex[2*i+1]*filter(i);
          }
        return norms;
        }
    , ranRange: function(max, min){
        min=(undefined===min)?0:min;
        const range = max-min;
        return Math.random()*range+min;
        }
    , ranRange_i: function(max, min){
        return parseInt(this.ranRange(parseInt(max), parseInt(min)));
        }
    , ran: function(amplitude, base){
        return Math.random()*amplitude+(base?base:0);
        }
    , dice: function(face=6){
        return parseInt(Math.random()*face)+1;
        }
    , gauss: function gaussianRandom(mean=0, stdev=1) {
          var u= 0.0, v= 0.0;
          while(0===u){
            u= 1-Math.random();
            }
          while(0===v){
            v= Math.random();
            }
          const num=Math.sqrt(-2.0*Math.log(u))*Math.cos(2.0*Math.PI*v);
          return num*stdev+mean;
          }
    , gaussmm: function(min, max, skew){
        let u= 0.0, v= 0.0;
        while(0===u){
          u= 1-Math.random();
          }
        while(0===v){
          v= Math.random();
          }
        var num= Math.sqrt(-2.0*Math.log(u))*Math.cos(2.0*Math.PI*v);
        num= num/10.0+0.5;
        if(num>1 || num<0){ 
          num= this.gauss(min, max, skew);
          }
        num= Math.pow(num, skew);
        num*= max-min;
        num+= min;
        return num;
        }
    , gaussi: function(min=0, max=1, skew=0.5){
        return parseInt(this.gauss(parseInt(min), parseInt(max), skew));
        }
    , tick: function(){
        return performance.now();
       }
      };
    if(undefined==performance){
      performance={ now: function(){
                   return new Date().getTime();
                   }
                 };
      }
    Object.defineProperty(SC_ClientTools, "loadData"
    , { value: function(url, resEvt, engine){
          if(!(resEvt instanceof SC_SampledId)){
            resEvt=SC.sampled("loadingData("+url+")");
            }
          const xmlHttpReq=new XMLHttpRequest();
          xmlHttpReq.open("GET", url, true);
          xmlHttpReq.onload=(function(sampled){
              if(200==this.status || 0==this.status){
                sampled.newValue(this.responseText);
                }
              }).bind(xmlHttpReq, resEvt);
          xmlHttpReq.send(null);
          return resEvt;
          }
      , writable: false
        }
      );
    Object.defineProperty(SC_ClientTools, "loadDataSync"
    , { value: function(url){
          const xmlHttpReq=new XMLHttpRequest();
          xmlHttpReq.open("GET", url, false);
          xmlHttpReq.send(null);
          if(200==xmlHttpReq.status || 0==xmlHttpReq.status){
            return xmlHttpReq.responseText;
            }
          throw new Error("Can't load");
          }
      , writable: false
        }
      );
    if(SC.tools){
      console.log("seem to be already initialized...", SC.tools);
      return;
      }
    if(undefined==main || !main.isSCClock){
      var cfg= {};
      if(params.tools.mainConfig){
        cfg= params.tools.mainConfig;
        }
      main= SC.clock(cfg);
      if(cfg && "function"==typeof(cfg.stdout)){
        main.setStdOut(cfg.stdout);
        }
      if(cfg && !isNaN(cfg.delay) && 0<cfg.delay){
        periodic= SC.periodic({ delay: cfg.delay });
        main.bindTo(periodic);
        }
      }
    Object.defineProperty(SC_ClientTools, "main"
    , { get: function(){ return main; } }
      );
    Object.defineProperty(SC_ClientTools, "periodic"
    , { get: function(){ return periodic; } }
      );
    Object.defineProperty(SC_ClientTools, "pauseMain"
    , { value: function(){
          if(this.periodic){
            this.main.disconnectFrom(this.periodic);
            }
          }
      , writable: false
        }
      );
    Object.defineProperty(SC_ClientTools, "resumeMain"
    , { value: function(){
          if(this.periodic){
            this.main.bindTo(this.periodic);
            }
          }
      , writable: false
        }
      );
    Object.defineProperty(SC, "globals"
    , { value: {}
      , writable: false
        }
      );
    Object.defineProperty(SC.globals, "Evt_appStarted"
    , { value: SC.evt("appStarted")
      , writable: false
        }
      );
    SC_ClientTools.addProgram=main.addProgram.bind(main);
    SC_ClientTools.generateEvent=main.addEntry.bind(main);
    return SC_ClientTools;
    }).call(sc_global, p)
                            , writable: false
                              }
                          );
  }
else{
  throw new Error("SugarCubesJS must be loaded first");
  }
