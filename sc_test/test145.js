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
         , SC.seq(
             SC.pause(3)
             , SC.generate(e)
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: e!\n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
