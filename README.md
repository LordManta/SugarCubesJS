# SugarCubesJS
##### Author : Jean-Ferdy Susini
##### Created : 2/12/2014 9:23 PM
##### version : 5.0 alpha
##### implantation : 0.9.8
##### Copyright 2014-2020.

A Javascript implementation of the Reactive Programming Framework *SugarCubes* v5 originally designed on top of Java.
It uses Frederic Boussinot's *synchronous/reactive paradigm* proposed in the early 90's by Frédéric BOUSSINOT[Bo1], and allows one to write *reactive parallel/concurrent programs* on top of sequential Javascript.

Quick start:
------------
1. load the library SugarCubes.js by adding :
   ```HTML
   <script type="text/javascript" src="http://jeanferdysusini.free.fr/SugarCubes.js">
   </script>
   ```
   to your HTML

2. then in a script node, build a reactive execution environment to execute reactive programs :
   ```javascript
   var machine = SC.machine();
   ```

3. declare *SugarCubes* events :
   ```javascript
   var e = SC.evt("e");
   ```
4. write programs using events previously declared :
   ```javascript
   var program1 = SC.repeatForever(SC.await(e), SC.log("event &e is generated !"));
   var program2 = SC.repeatForever(SC.pause(5), SC.generate(e));
   ```

5. add each program to the execution environment (each program will be added to execute in parallel each with the others) :
   ```javascript
   machine.addToOwnProgram(program1);
   machine.addToOwnProgram(program2);
   ```

6. cyclically activate the execution environment :
   ```javascript
   for(var i = 0 ; i < 20; i++){
     machine.newValue();
     }
   ```
   
   *Note:* It is a common practice to trigger the reactions of the execution environment according to a "real time" clock. A simple way to do this is to use the `setInterval()` method :
   ```javascript
   window.setInterval(
           function(){
             machine.newValue();
             }
           , 30
           );
   ```
   But the easiest way to integrate the reactive environment is to declare it with a `delay` parameter :
   
   ```javascript
   var machine = SC.machine(30);
   ```
   where 30 is the delay (in milliseconds) between two consecutive reactions. So you don't need to deal with a loop of `react()` method calls or the `setInterval()` method in your code. The execution environment will be triggered automatically every 30ms (or more... Because only minimal delay is guarantied).

7. The result of such execution goes to the debugging console, so it doesn't provide anything observable to the user in the document page. To redirect output to the content of a *HTML* document, you can for example declare a *HTML* element in your document : for example a `PRE` element :
   ```javascript
   var output = document.createElement("pre");
   document.body.appendChild(output);
   ```
   Then set a closure to capture and redirect standard *SugarCubesJS* output :
   ```javascript
   machine.setStdOut(function(msg){
     output.innerText += msg;
     });
   ```

8. For a better understanding of what is going on you can activate a prompt indicating each new instant of the reactive execution environment :
   ```javascript
   machine.enablePrompt(true);
   ```

Look at the source of `SC_Demo0.html` *HTML* file to see the big picture of this very first example.

One word about Reactive Synchronous Programming Model « à la » Boussinot:
-------------------------------------------------------------------------

F. Boussinot reactive synchronous programming model derives from Synchronous paradigms such as the one of the Esterel programming language (G. Gontier, G. Berry[]). The execution of a whole system is split into small peaces which are executed one after the other in sequence. Such a sequence is called a clock and peaces of execution are called instants. That way the computation model defines an abstract notion of time. Programs and more precisely instructions that define programs are referring to that abstract notion of time. The reactive/synchronous paradigm mandates that an instant of execution takes no time to complete and *physical time* only flow in between to consecutive instants.

On a theoretical point of view, this logical notion of time allows us to define parallel and sequential computations. First of all one defines parallelism as the fact that every computation taking place during one instant of the clock is considered as executing in parallel with the other ones. So computations that take places in different instants are considered as executing in sequence (and so we can state that one is before or after another one). In a pure synchronous paradigm (such as in Esterel or Lustre model), time only flows in between two consecutive instants of the logical clock. Execution of one instant takes, on a model point of view, virtually no time at all. This enforces strong mathematical properties of the pure synchronous approach. One considers that computations in one instant are infinitely quick. One of the main implication of that model is that at each instant, the environment of execution of the whole system is fully determined. One cannot talk about any beginning or duration or end of instant as all go in no time. So one builds a strong *time type system* which enforce correctness of a program in a perfectly determined execution environment modulo the entries of the system (informations taken into input of the system at each instant). Programs define at each instant which outputs are produced and how the system 's internal state evolves.

The reactive programming model «à la» F. Boussinot's relax the strong synchronous constraint, allowing instants of execution to last. **But** an instant shall always terminate ! So sequence of instant can always proceed as an instant shall terminate before the subsequent instant of execution should begin. The main implication of this here is that no instantaneous reaction to the absence of information (of *SugarCubesJS* events) can take place before the end of the instant (that was possible in pure reactive/synchronous paradigm). Doing so reaction to the absence of information at one instant is always postponed to the next instant. The interesting point of such an approach is that it allows us to build language constructions dealing with the logical time to have a semantics correct by construction (syntactically correct program always have one and only one deterministic meaning). So no more time type system is needed. Every program will have a unique semantics and provides a deterministic execution. But this comes at the cost of slightly different expressiveness capabilities.

The most observable consequence of this model is that we can define modular and dynamically transformable systems, which we thought are simpler to use in the context of Web programming.

One word about reactive programs:
---------------------------------

*SugarCubes* framework provides a specific *API* to build reactive programs. To write a reactive program, a developer will nest calls of methods of the object `SC` to instantiate instructions. Doing so one builds a tree structure, which is the *AST* of the reactive program. For example :
   ```javascript
   var aProgram = SC.repeat(SC.forever
                    , SC.await(e)
                    , SC.log("message in the console")
                    );
   ```
In this example, one writes a *repeat* instruction (which is the root of the *AST* of the program). The *repeat* instruction takes a first parameter which is a number iterations (that is the number of times it will executes its body). In this example, one uses the predefined constant `SC.forever` which means an infinite number of iterations. The rest of the parameters are the instructions of the body of the *repeat* instruction put into a sequence. In this example, the body of the *repeat* instruction is made of two instructions in sequence. First the `SC.await()` is an instruction which awaits the presence of the event `&e`. And the second instruction `SC.log()` which writes a string in the *SugarCubesJS* standard output.

The *await* instruction awaits the event `&e` and at the precise instant where that event is present, the *await* instruction immediately terminates. Letting the *log* instruction be executed at very same instant of execution. As this body is in an infinite loop, this programs means that at every instant where the event `&e` is present a message is written into the *SugarCubesJS* standard output.

There is many *SugarCubesJS* instructions that can be used to build complex reactive programs. Program's *AST* can be reused in more complex structures allowing one to build complex programs incrementally.

Instructions Basics:
--------------------

In SugarCubesJS, programs are executed in reactive machine which can be seen as an interpretor of reactive instructions. A reactive machine provides the notion of logical time. It is responsible to split the execution of the system in a sequence of instant (instants are also called reactions). A reactive machine can be instantiated using the `SC.machine()` call.

Reactive programs manipulate reactive events, which are global data. At each instant, every events used by the reactive system are exclusively *present* or *absent*. Presence or absence of an event cannot evolve during the very same instant. For example, if an event is present at some point during an instant so it must be during the whole instant. So no parallel component during the very same instant can see the event present while other components of the reactive system would see it absent. An event can only be seen absent at the end of the current instant (when no one else can emit it), so reaction to the absence can only take place at the next instant.

At each instant:
 - events can be present at the beginning of the instant, if emitted by the execution environment of the system (the event is then an input of the reactive system).
 - if not an input, an event is first seen as in *unknown* state at the beginning of an instant. If it is generated by a reactive program, it becomes *present*. And all parallel components of the reactive system will see it as present. Every component seeing it in the *unknown* state cannot progress and so when the event is generated those components are notified that finally this event is present. This enforce coherence and determinism.
 - as event cannot be generated as absent, absence of an event is only decided at the end of the current instant, when nobody can generate it. So by the end of the instant an event still in *unknown* state will be decided as present. Every parallel components interested by that event will be notified of that absence, but can only react at the next instant.

After this end of instant no events in *unknown* state can remain.

Reactive events are declared using the `SC.evt()` call.

Reactive programs are built as tree structure using nested calls of methods instantiating various reactive instruction :

* `SC.nothing()` : is an instruction which does nothing and immediately terminates (during the very same instant where it starts).
* `SC.generate()` is an instruction which takes at least one parameter which is a SuagarCubes event. The instruction makes the event present at the very instant it is executed. The instruction terminates immediately like the `SC.nothing` instruction do. It can also get an optional parameter which is a value added to a list of values associated to the event when it is generated. List of values associated to an event is cleared at the very beginning of each instant.
* `SC.await()` is an instruction which awaits for an event (given as a mandatory parameter) to be present. That instruction pauses a sequential execution until the instant where the event is present. It can also awaits for a conjunction of events or a disjunction or even any combination of those operators and events. But unlike SugarCubes v4, SugarCubesJS doesn't allow  a «not» operator which considers absence of an event rather than presence. Usually boolean functions made of conjunction, disjunction and event presences are called configurations.
* `SC.seq(...)` : This instruction takes a list of parameters which should be all SugarCubes instructions. The `SC.seq` instruction puts parameters in sequence (But be careful, the exact meaning could somewhat differ from what you would expect in v5, see note below). Example : `SC.seq(SC.await(e), SC.generate(f))` will await for event e and at the very same instant e is present it will generate the event f.
* `SC.repeat(n, ...)` : is an instruction which repeats a program for n consecutive iterations. Each time an iteration ends the repeat construct pauses the execution for one instant before beginning the new iteration. This is a slight difference in comparison to SugarCubes in Java. If n is a negative number or the constant `SC.forever`, the loop never ends by itself.
* `SC.pause()` : denotes a point of synchronisation. In a sequence `a;pause;b`. It ends the current instant and so pause the sequence, which will resume after the pause at the next instant of execution. The `SC.pause` instruction can get an optional parameter which is an integer. Positive value indicates how many instants the pause will last : `SC.pause(2)` pauses for 2 consecutive instants and is equivalent to `SC.seq(SC.pause(), SC.pause())`. You can also use the SugarCubes constant `SC.forever` to indicate a nether ending pause.
* `SC.pauseForever()` is a shortcut to `SC.pause(SC.forever)`
* `SC.par(...)` : is an instruction to place instructions to be executed in parallel. For example `SC.par(p1,p2,p3)`, will place p1, p2 and p3 in parallel. This instruction terminates if p1, p2 and p3 are all terminated. At each instant p1, p2 and p3 get a chance to be activated and so they can all execute a part of their code corresponding to the instant.
* `SC.cell()` construct a memory cell allocated in central memory. This object is new to SugarCubes v5 and gives a rather different way to understand atomic actions. A celle acts like a variable or field. You can read its value using the `getVal()`


The Seq instruction links causally instructions that it takes in parameters in the same order as the parameter list. For example `Seq(a,b,c)` links `a`, `b`, and `c` in that way that `b` is only executed if `a` has terminated, and `c` is executed only if both `b` and `a` have been completed. `SC.seq` instruction is often called sequence, but it is probably not exactly what you would expect : if `a` and `b` are instantaneous actions you are not guarantied that `a` will be executed «before» `b` during the instant. All actions during the same instant should be considered as parallel even if causally dependant. That means that you should not rely on immediate state transition if an instruction `a` does a side effect on a variable `v`, you should not rely on it during the same instant in an instruction `b`.
