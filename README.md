# SugarCubesJS
#### Author : Jean-Ferdy Susini
#### Created : 2/12/2014 9:23 PM
#### version : 5.0 alpha
#### implantation : 0.8.3
#### Copyright 2014-2015.

A Javascript implementation of the Reactive Programming SugarCubes v5 framework.
It uses Frederic Boussinot's synchronous/reactive paradigm. And alloow one to write reactive parallel/concurent programs 
on top of Javascript.

Simple start :
--------------
1. load the library SugarCubes.js by adding :
```HTML
<script type="text/javascript" src="SugarCubes.js">
</script>
```
to your HTML

2. then build a reactive engine to execute reative programs :
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

5. ajouter les programmes aux machines :
```javascript
machine.addProgram(program1);
machine.addProgram(program2);
```

6. activer la machine d'exécution :
```javascript
for(var i = 0 ; i < 100; i++){
  machine.react();
  }
```

En général il vaut mieux caler la machine d'exécution sur une horloge temps réel en utilisant le window.setInterval de Javascript :
```javascript
window.setInterval(
        function(){
          machine.react();
          }
        , 30
        );
```
