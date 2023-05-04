# SugarCubesJS
##### Authors : Jean-Ferdy Susini, Olivier Pons, Claude Lion
##### Created : 2/12/2014 9:23 PM
##### version : 5.0 alpha
##### implantation : 0.9.9
##### Copyright 2014-2023.

A *Javascript* implementation of the reactive programming framework *SugarCubes* v5. It was originally designed on top of *Java*.
It uses Frederic Boussinot's *synchronous/reactive paradigm* proposed in the early 90's by Frédéric BOUSSINOT[Bo1], and allows one to write *reactive parallel/concurrent programs* on top of sequential *Javascript*.

Quick start:
------------
We developed SugarCubesJS first to ease the build of WebApps deployed on smartphones and tablets in a scientific study : DanceDoigt.
So the primary environment for SugarCubesJS is a Web page.

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

F. Boussinot's reactive synchronous programming model derives from reactive synchronous paradigms such as the one of the *Esterel* programming language[Es82, Es84] (G. Berry, G. Gontier, J.-P. Marmorat, J.-P. Rigault). The execution of a whole program is split into small steps which are executed one after the other in sequence. Such a sequence is then called a *logical clock* and peaces of execution are called reactions (and often instants of execution). That way the computation model defines an abstract notion of time. Here an important choice have been made in modeling such systems : synchronous/reactive models have chosen to refer to a discrete notion of time. This is an important difference compared to other reactive paradigms such as the one of function reactive programming[FRP94] (C. Elliott).

In *reactive/synchronous paradigm*, programs and more precisely instructions that define programs, are referring to that abstract notion of logical discrete time. This computational model mandates that reactions *takes virtually no time* to complete and that *physical time* (external to the system) only flow in between reactions (i.e. when no computation actually takes place). On a model point of view, execution of one instant takes no time at all. This enforces strong mathematical properties of the pure reactive/synchronous approach. Computations at one instant are considered as infinitely quick. One of the main implication of that model is that at each instant, the environment of execution of the whole system is fully determined (seems that like taking a snapshot, everything are in perfectly unique and in a stable state). Inputs, outputs and the state of the system itself are determined. One cannot talk about any beginning or duration or end of instant as all go in no time. Wired ?!

Well let's try to understand why this point can be so interesting even if it is clearly counterintuitive.

In such a model : a reaction of a program can be reduced as just a way to connect entries (informations that come from the external environment of the system) to outputs (informations that are sent back to the environment of the system) and transformation of the own program internal state. Well... Then look, that sounds like automaton!
To give an intuition of how the *reactive/synchronous model* can relate to automaton, we consider this : we will use FSM as automata to compare to, and more precisely a Mealy Machine[MeaM55].
A MM is the given of :
 - a finite set of states
 - a start state (the initial state of the system)
 - a finite set of symbols used to analyse entries of the system (entries are information provided by the external environment)
 - a finite set of symbols used to produce the outputs (output are informations sent to the external environment)
 - a transition function which compute a new state of the MM according to its current state and the entries of the system when a reaction is triggered
 - and finally an output function, which compute outputs according to the current state of the MM and the current entries when the reaction is triggered.

A reaction of a MM is just the acquisition (sampling) of the inputs, compute the transition function to get the next state of the system and compute the output function to know what is produced in response to the entries. Simple ?

Well now on the synchronous approach the idea is to add a first property which is that the input set and the output set are in fact part of the same set (an union of those two sets) called the environment set (one can also this that the internal state of the program could also be a part of this set). Hence, inputs and outputs are simultaneous. So this restrict acceptable output functions to the ones that doesn't override entries. We also introduce a second property which is that transition function and output function must be deterministic. Those restrictions on transition function and output function leads to constraints on reactive program semantics : about *causality dependences*, and *deterministic behavior*.

Therefore, *Synchronous/reactive* model defines a strong *time type system* which enforce correctness of a program in a perfectly determined execution environment modulo the entries of the system. Programs define at each instant which outputs are produced and how the system's internal state evolves.

Another important consequence of this is that, logical notion of discrete time allows us to define parallel and sequential computations. First, considering the set of every computations taking place at one instant of the clock implies that each of those computations are executing in parallel with the other ones (all computations complete at the same time). Therefore, computations that take places at different instants are considered as executing in sequence (and so we can state that one is before or after another one).

The reactive programming model «à la» F. Boussinot's relax the strong synchronous constraint, allowing instants of execution to last. **But** an instant shall always terminate (after a finite amount of time) ! So sequence of instants can always proceed as an instant shall terminate before the subsequent instant of execution should begin. The main implication of this here is that no instantaneous reaction to the absence of information (of *SugarCubesJS* events) can take place before the end of the instant (that was possible in pure reactive/synchronous paradigm). Doing so, reaction to the absence of information at one instant is always postponed to the next instant. The interesting point of such an approach is that it allows us to build language constructions dealing with the logical discrete time to have semantics correct by construction (syntactically correct program always have one and only one deterministic meaning). So no more complex and static time type system is needed. Every program will have a unique semantics and provides a deterministic execution. But this comes at the cost of slightly different expressiveness capabilities.

The most observable consequence of this model is that we can define modular and dynamically transformable systems, which we thought are simpler to use in the context of Web programming.

The reactive/synchronous approach «à la» Boussinot defines an environment made of events (warning : Esterel defines signals which are more or les the same king of objects that events in Boussinot's approach; while an event in Esterel defines what is called a sample of the environment in Boussinot's approach).

One word about terminology
--------------------------

This section is intend to clarify some definitions before learning mor about the *SugarCubesJS* *API* :

 - **reactive system**: a whole computational system which follow the reactive/synchronous paradigm «à la» Boussinot. It is made of an environment, a whole reactive program, a reactive machine and an execution engine. It is capable of producing reactions to external solicitations.
 - **reaction**: a step of execution of a reactive system. On a model point of view, physical (external) time elapse only between reactions. From a physical time point of view reactions are fast enough to be considered as atomic.
 - **clocks**: refers to a series of reactions and where every reactions can be uniquely tagged by a time stamp according to a *physical world clock* (real time clock).
 - **environment**: refers to an associative table of values (identified by references/identifiers) which is globally accessible by a reactive system.
 - **external environment**: is a part of the environment which refers to the information produced outside the reactive system (entries or asynchronous informations). The external environment is sampled at each reaction. One can see this as taking a snapshot of the outside world through a window before starting to compute on that.  
 - **reactive program**: defines the actions to perform during the reactions of the reactive system. The program is made of a tree of instructions defining a so called AST. The reactive program is interpreted by a reactive execution machine.
 - **reactive execution machine**: is the interpretor which traverses the AST at each reactions to execute reactive instructions for the current reaction according to their semantics.
 - **execution engine**: is responsible of making the bridge between external informations and environment and triggering reactions of the reactive system.
 - **instant [of execution]**: often synonym of reaction (one instant = one reaction), in *SuagarCubesJS*, instants can be triggered in burst mode as a finite sequence in a single reaction. Instants take no time, so consecutive execution of a finite series of instants takes no time and all are parts of the same reaction. During the whole reaction the external environment is sampled only once and doesn't evolve during the whole reaction. Hence the whole environment is static only during one instant but can evolve form one instant to the other (the external part cannot evolve but the internal part can from an instant to the next). Note that also means that output are only produced in the external environment only at the end of the whole reaction.

One word about reactive objects of the *SugarCubes* *API*
---------------------------------------------------------

In *SugarCubesJS*, there exist indeed two main category of objects provided by the *API* which are parts of the environment : *Events* and *Sensors*. This section is mostly dedicated to those two primary category of objects.
There are also *instruction* objects, which are used to build reactive programs (see next section). 
Finally, there exist a special hidden (not handled directly through the *SugarCubesJS* *API*) object which captures the notion of reactive execution context, often called reactive machines.

**First, the Events**:
A reactive event is a global object bound to a unique reactive execution environment. At each instant of a reactive environment, an event is said to be present or absent. As instant's execution should ideally take no time, presence of an event cannot change (from present to absent or the reverse) during the very same instant. As a consequence of this, an event is always seen with the same state during one instant by all reactive programs executed in parallel in the same reactive execution environment.
In the reactive paradigm «à la» Boussinot, presence of an event at each instant is unknown until it has been generated at this very same instant. Conversely, it is known to be absent when the instant is over and the event has not been generated. Obviously then, any reaction of a program to the state of an event is executed instantly if the event is present or postponed at the next instant if the event was absent.
A generation of an event ca be done, for example, by a generate instruction. And this generation is often called an *occurrence of the event* at this instant. This occurrence set the state of the generated event to present for the very instant where the generation occurs. Events can be generated but there is no mean to set an event absent. So it is only possible while executing an instant to change the state of an event from unknown to present. Absence is only set when the instant is over and state of the event is still unknown. Therefore, reaction to the absence of an event can only take place at the next instant.
Generations of an event can associate a value at each occurrence during the same instant. Those values makes a list associated to the presence of the of the event. So if an event is present, a reactive program can access to this list of associated values. Doing so *SugarCubes* events can be seen as a communication channel like in event buses. Programs emit values through an event and don't need to know who is listening the channel (no means to handle references to other programs and so on). Similarly, programs listening to an event don't need to know who is emitting values. This leading to a loosely coupled communication mechanism between program components.
Indeed, in *SugarCubesJS* events are unique identifiers which reference an event object. Even if the identifier uniquely references an event; however, it can be used in several different reactive execution contexts and in each of these contexts it will reference a separate event (since each event is linked to a single reactive execution context).
At each instant:
 - events can be present at the beginning of the instant, if emitted by the execution environment of the system (the event is then an input of the reactive system).
 - if not an input, an event is first seen as in *unknown* state at the beginning of an instant. If it is generated by a reactive program, it becomes *present*. And all parallel components of the reactive system will see it as present. Every component seeing it in the *unknown* state cannot progress and so when the event is generated those components are notified that finally this event is present. This enforce coherence and determinism.
 - as event cannot be generated as absent, absence of an event is only decided at the end of the current instant, when nobody can generate it. So by the end of the instant an event still in *unknown* state will be decided as present. Every parallel components interested by that event will be notified of that absence, but can only react at the next instant.

After this end of instant no events in *unknown* state can remain.

Reactive events are declared using the `SC.evt()` call.


**Second, the Sensors**:
Reactive sensors are special type of *SugarCubesJS* objects which are global to the whole *Javascript* environment. They can be manipulated as event by reactive programs.
As for a *SugarCubesJS* event, a sensor is built by the *SugarCubes* *API* has a unique identifier which points to a value (and not an event as for *SugarCubesJS* event identifier). But on the program point of vue, sensors are seen as event.
A sensor has a `newValue()` method which allows one to replace the current value pointed by the sensor by a new one.
The main idea here is to consider that `newValue()` call is atomic and so each call follows or precedes others so we can state a sequence of `newValue()` call as a flow of values.
In reactive execution environments, sensor appear to be like events but with two main restrictions :
 - sensor cannot be generated during an instant. They are seen has being generated outside of the reactive world (in between two consecutive reaction of the reactive execution context). Therefore, presence of sensor is known before an instant begins, leading to the possibility to instantly react to the absence of such kind of events without compromising correct by construction semantics of reactive programs.
 - sensor are seen as a sampling of the external environment, so sensors have only one value associated to it if it is present at one instant (a sensor has at most one associated value). A sensor is present if it has got a `newValue()` since the last reaction of the current reactive execution context. The value associated to the sensor is last value gotten by the sensor at the precise moment where reaction of the reactive execution context has started.

**Reactive machines**:
Reactive machines are no more objects directly proposed by *SugarCubesJS* *API*. But, in this new model, a sensor can have its own reactive execution context associated with. Therefore, every call to `newValue()` on such sensor will make the associated reactive machine to react. All sensors doesn't necessarily have their own reactive machine (only some them have, and so, sensors built using the `SC.machine()` call, have), but if a sensor has one, every new value placed on this sensor produce reactions of the associated reactive machine. So, one can consider that the succession of values of the sensor along the time, defines the clock of the associated reactive machine.

In *SugarCubesJS*, programs are executed in reactive machine which can be seen as an interpretor of reactive instructions. But in *SugarCubesJS* model, machines are no more first class objects of the API. This means that when one call `SC.machine()`, indeed it doesn't build the reactive machine itself but a reactive sensor with an associated reactive machine. 

One word about reactive programs:
---------------------------------

The main goal of the *SugarCubesJS* *API* is to provide support to build reactive programs to implements reactive systems following the reactive paradigm «à la» Boussinot.
To do so, *SugarCubes* framework provides a specific *API* to build reactive programs and then provides means to execute those programs according to the Boussinot's reactive programming.
To write a reactive program, a developer will nest calls of methods of the object `SC` to instantiate instructions. Doing so one builds a tree structure, which is the *AST* of the reactive program. For example :
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

In *SugarCubesJS*, programs are executed in a reactive machine which can be seen as an interpretor of reactive instructions.
Reactive programs manipulate reactive events. They are built as tree structure using nested calls of methods instantiating various reactive instruction :

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
