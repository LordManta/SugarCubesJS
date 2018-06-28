# SugarCubesJS
##### Author : Jean-Ferdy Susini
##### Created : 2/12/2014 9:23 PM
##### version : 5.0 alpha
##### implantation : 0.9.1
##### Copyright 2014-2018.

A Javascript implementation of the Reactive Programming SugarCubes v5 framework.
It uses Frederic Boussinot's synchronous/reactive paradigm. And allow one to write reactive parallel/concurrent programs 
on top of Javascript.

Quick start :
--------------
1. load the library SugarCubes.js by adding :
   ```HTML
   <script type="text/javascript" src="http://jeanferdysusini.free.fr/SugarCubes.js">
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

5. add programs to the execution machine (each program will be added to execute in parallel with the others) :
   ```javascript
   machine.addProgram(program1);
   machine.addProgram(program2);
   ```

6. cyclically activate the execution machine :
   ```javascript
   for(var i = 0 ; i < 100; i++){
     machine.react();
     }
   ```
   
   It is a common practice to trigger the reactions of the execution machine according to a «real time» clock to preserve standard javascript's behavior according to the code :
   ```javascript
   window.setInterval(
           function(){
             machine.react();
             }
           , 30
           );
   ```
   But the easiest way to integrate the reactive machine is to declare it with a delay parameter :
   
   ```javascript
   var machine = SC.machine(30);
   ```
   where 30 is the delay (in milliseconds) between to consecutive reactions. So you don't need to deal with a loop of react() method calls or the setInterval() method in your code. The execution machine will be triggered automatically every 30ms (or more delay, only minimal delay is guarantied).
   
Instructions :
---------------

* `SC.nothing()` : is an instruction which does nothing and immediately terminates (during the very same instant where it starts).
* `SC.generate()` is an instruction which takes at least one parameter which is a SuagarCubes event. The instruction makes the event present at the very instant it is executed. The instruction terminates immediately like the `SC.nothing` instruction do. It can also get an optional parameter which is a value added to a list of values associated to the event when it is generated. List of values associated to an event is cleared at the very beginning of each instant.
* `SC.await()` is an instruction which awaits for an event (given as a mandatory parameter) to be present. That instruction pauses a sequential execution until the instant where the event is present. It can also awaits for a conjunction of events or a disjunction or even any combination of those operators and events. But unlike SugarCubes v4, SugarCubesJS doesn't allow  a «not» operator which considers absence of an event rather than presence. Usually boolean functions made of conjunction, disjunction and event presences are called configurations.
* `SC.seq(...)` : This instruction takes a list of parameters which should be all SugarCubes instructions. The `SC.seq` instruction puts parameters in sequence (But be careful, the exact meaning could somewhat differ from what you would expect in v5, see note below). Example : `SC.seq(SC.await(e), SC.generate(f))` will await for event e and at the very same instant e is present it will generate the event f.
* `SC.repeat(n, ...)` : is an instruction which repeats a program for n consecutive iterations. Each time an iteration ends the repeat construct pauses the execution for one instant before beginning the new iteration. This is a slight difference in comparison to SugarCubes in Java. If n is a negative number or the constant `SC.forever`, the loop never ends by itself.
* `SC.pause()` : denotes a point of synchronisation. In a sequence a;pause;b. It ends the current instant and so pause the sequence, which will resume after the pause at the next instant of execution. The `SC.pause` instruction can get an optional parameter which is an integer. Positive value indicates how many instants the pause will last : `SC.pause(2)` pauses for 2 consecutive instants and is equivalent to `SC.seq(SC.pause(), SC.pause())`. You can also use the SugarCubes constant `SC.forever` to indicate a nether ending pause.
* `SC.pauseForever()` is a shortcut to `SC.pause(SC.forever)`
* `SC.par(...)` : is an instruction to place instructions to be executed in parallel. For example `SC.par(p1,p2,p3)`, will place p1, p2 and p3 in parallel. This instruction terminates if p1, p2 and p3 are all terminated. At each instant p1, p2 and p3 get a chance to be activated and so they can all execute a part of their code corresponding to the instant.
* `SC.cell()` construct a memory cell allocated in central memory. This object is new to SugarCubes v5 and gives a rather different way to understand atomic actions. A celle acts like a variable or field. You can read its value using the `getVal()`


The Seq instruction links causally instructions that it takes in parameters in the same order as the parameter list. For example Seq(a,b,c) links a, b, and c in that way that b is only executed if a has terminated, and c is executed only if b and a have been completed. It is called sequence, but it is probably not exactly what you'd expect : if a and b are instantaneous actions you are not guarantied that a will be executed «before» b during the instant. All action during the same instant should be considered as parallel even if causally dependant. That means that you should not rely on immediate state transition if an instruction `a` does a side effect on a variable , you should not relay on it during the same instant in an instruction `b`.
