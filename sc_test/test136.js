  {
   prg:
       SC.par(
         SC.control(e
           , SC.write("e!")
           )
         , SC.seq(
             SC.pause()
             , SC.generate(e)
             )
         )
 , init: function(){}
 , async: function(){}
 , expected:
     "\n1 -: \n2 -: e!"
  }
