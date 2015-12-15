# SugarCubesJS
##### Author : Jean-Ferdy Susini
##### Created : 2/12/2014 9:23 PM
##### version : 5.0 alpha
##### implantation : 0.8.3
##### Copyright 2014-2015.

A Javascript implementation of the Reactive Programming SugarCubes v5 framework.
It uses Frederic Boussinot's synchronous/reactive paradigm. And allow one to write reactive parallel/concurrent programs 
on top of Javascript.

Quick start :
--------------
1. load the library SugarCubes.js by adding :
   ```HTML
   <script type="text/javascript" src="SugarCubes.js">
   </script>
   ```
   to your HTML

2. then build a reactive engine to execute reactive programs :
   ```javascript
   var machine = SC.machine();
   ```
   
3. declare events :
   ```javascript
   var e = SC.evt("e");
   ```
4. write programs :
   ```javascript
   var program1 = SC.repeatForever(SC.await(e), SC.log("event &e is generated !"));
   var program2 = SC.repeatForever(SC.pause(10), SC.generate(e));
   ```

5. add programs to the execution machine (each program will be put in parallel with the others) :
   ```javascript
   machine.addProgram(program1);
   machine.addProgram(program2);
   ```

6. activate the execution machine :
   ```javascript
   for(var i = 0 ; i < 100; i++){
     machine.react();
     }
   ```
   
   It is a common practice to trigger the reactions of the execution machine according to a «real time» clock to preserve standard javascript's behavior :
   ```javascript
   window.setInterval(
           function(){
             machine.react();
             }
           , 30
           );
   ```
   The easiest way to integrate the reactive machine is to declare it with a delay parameter :
   
   ```javascript
   var machine = SC.machine(30);
   ```
   where 30 is the delay (in milliseconds) between to consecutive reactions. So you don't need to deal with a loop of react() method calls or the setInterval() method in your code. The execution machine will be triggered automatically every 30ms (or more delay, only minimal delay is guarantied).

Commands
--------

* `SC.nothing()` : Instruction which does nothing and immediately terminates (during the very same instant where it starts).
* `SC.seq(...)` : This instruction takes a list of parameters which should be all SugarCubes instructions. This instruction link causally instructions in parameters in the same order as the list is built. 
