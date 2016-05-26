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
         , SC.repeat(2
             , SC.pause(2)
             , SC.generate(e)
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: \n3 -: e!\n4 -: \n5 -: \n6 -: e!\n7 -: \n8 -: \n9 -: \n10 -: "
  }
