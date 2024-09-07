var windSnd= SC.tools.audioToolbox.newAudioChunck(audioData.wind);
var voiceSnd= SC.tools.audioToolbox.newAudioChunck(audioData.voice);
SC.tools.addProgram(
   SC.repeat(SC.forever
   , SC.await(Samp_imgClick)
   , SC.generate(windSnd.Evt_play)
   , SC.log("click")
   , SC.pause()
   , SC.kill(Samp_imgClick, SC.await(windSnd.Samp_ended), SC.generate(windSnd.Evt_stop))
   )
 );
SC.tools.addProgram(
   SC.action(function(m){
     filter= SC.tools.audioToolbox.mkBQFilter({});
     }
     )
   );
