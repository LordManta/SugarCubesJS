  {
   prg:
       SC.par(
         SC.seq(
           SC.control(e
             , SC.write("e!")
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
     "\n1 -: \n2 -: e!control end!\n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
 , persist: true
  }
