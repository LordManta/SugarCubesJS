  {
   prg:
       SC.par(
         SC.seq(
           SC.control(e
             , SC.repeat(0
                 , SC.write("e!")
                 )
             )
           ,SC.write("control end!")
           )
         , SC.seq(
             SC.pause()
             , SC.generate(e)
             )
         )
 , init: function(){}
 , async: function(){}
 , expected:
     "\n1 -: \n2 -: control end!"
  }
