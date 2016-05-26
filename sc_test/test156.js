  {
   prg:
       SC.par(
         SC.seq(
           SC.control(e
             , SC.repeat(2
                 ,SC.await(f)
                 , SC.write("e!")
                 )
             )
           ,SC.write("control end!")
           )
         , SC.repeat(5
             , SC.pause(1)
             , SC.generate(e)
             )
         , SC.seq(
             SC.pause(2)
             , SC.generate(f)
             )
         )
   , init: function(){}
   , async: function(){}
   , expected :
       "\n1 -: \n2 -: \n3 -: \n4 -: \n5 -: \n6 -: \n7 -: \n8 -: \n9 -: \n10 -: "
  }
