  {
   prg:
       SC.par(
         SC.seq(
           SC.control(e
             , SC.repeat(5
                 , SC.write("e!")
                 )
             )
           ,SC.write("control end!")
           )
         , SC.repeat(5
             , SC.pause(1)
             , SC.generate(e)
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: e!\n3 -: \n4 -: e!\n5 -: \n6 -: e!\n7 -: \n8 -: e!\n9 -: \n10 -: e!control end!"
  }
