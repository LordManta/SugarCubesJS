<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="text/javascript" src="SugarCubes.js">
</script>
<style>
#program_source {
  float:left;
  width: 45vw;
  overflow:auto;
  margin:0;
  border: 1px solid black;
  padding:0;
  unicode-bidi: embed;
  font-family: monospace;
  white-space: pre;
}
#expected_result {
  width: 45vw;
  overflow:auto;
  margin:0;
  border: 1px solid black;
  padding:0;
  unicode-bidi: embed;
  font-family: monospace;
  white-space: pre;
}
#testPanel {
  float:right;
  width: 45vw;
  height:100vh;
  margin:0;
  border:0;
  padding:0;
  unicode-bidi: embed;
  font-family: monospace;
  white-space: pre;
}
</style>
</head>
<body>
<div>
<script type="text/javascript">
<?php
  $test_files = glob("sc_test/test*.js");
  if($test_files){
    echo "var max_test_file_num = ".count($test_files).";\n";
    }
  else{
    echo "var max_test_file_num = 1;\n";
    }
?>
</script>
<button onclick="window.location.search='?n='+(Math.max(1,testNum-2))">&lt;</button>
<input type="checkbox" id="check_cont" <?php
  if(isset($_GET['continue'])
     && ("true" == $_GET['continue'])){
    echo "checked";
    }
?> onclick="autoContinueSetting()">Auto continue</input>
<button onclick="window.location.search='?n='+(Math.min(max_test_file_num,testNum))">&gt;</button>
</div>
<div id="program_source">
 
</div>
<textarea id="testPanel">
</textarea>
<div id="expected_result">
</div>
<script type="text/javascript">
var check_cont = document.getElementById("check_cont");
function autoContinueSetting(evt){
  if(testNum < max_test_file_num && check_cont.checked){
    window.location.search="?n="+testNum+"&continue=true";
    }
  }
var source = document.getElementById("program_source");
var testPanel = document.getElementById("testPanel");
var testNum = 0;
try{
  testNum = parseInt((/\?n=([^&#]*)/.exec(location.search))[1]);
  if(isNaN(testNum)||!(/^[1-9][0-9]*$/.test(""+testNum))){
    window.location.search='?n=1';
    }
  }
catch(e){
  window.location.search='?n=1';
  }
function writeInConsole(msg){
  testPanel.value += msg;
  }
SC.log = function(){return SC.nothing()};

SC.write = function(msg){
  return SC.trace(
/*     function(){
      testPanel.value += msg;
      }*/
    msg
    );
  }
SC.dump = function(msg){
  return SC.action(
     function(m){
      testPanel.value += m.msg;
      }
    );
  }

var m = SC.reactiveMachine({
  dumpTraceFun: function(msgs){
    for(var i in msgs){
      testPanel.value += msgs[i];
      }
    }
  });
m.enablePrompt(true);

var e = SC.evt("e");
var f = SC.evt("f");
var g = SC.evt("g");
var e1 = SC.evt("e1");
var e2 = SC.evt("e2");
var e3 = SC.evt("e3");
var e4 = SC.evt("e4");
var sens1 = SC.sensor("sens1");
var called1 = function(v){};
var fun1 = function(v){ return called1(v); };

var sens2 = SC.sensor("sens2");
var called2 = function(v){};
var fun2 = function(v){ return called2(v); };

m.setStdOut(writeInConsole);
<?php
  echo "testBehavior =";
  if(isset($_GET['n'])
     && ctype_digit($_GET['n'])){
    $test_nb = $_GET['n'];
    if($test_nb > 0){
      require_once("sc_test/test".$test_nb.".js");
      }
    else{
      echo "{prg:\"SC.nothing()\"}";
      }
    }
    else{
      echo "{prg:\"SC.nothing()\"}";
      }
?>

if("function" == typeof(testBehavior.init)){
  testBehavior.init();
  }

var maxInstants = (undefined == testBehavior.maxI)?10:testBehavior.maxI;

var test_prg = testBehavior.prg;
if("string" == typeof(test_prg)){
  test_prg = eval(test_prg);
  }
source.innerHTML = testBehavior.prg;
if(testBehavior.persist){
  m.addToOwnProgram(SC.pause(maxInstants));
  }
m.addToOwnProgram(test_prg);

for(var i = 0 ; i < maxInstants; i++){
  if(undefined !== testBehavior.async){
    testBehavior.async();
    }
  m.newValue();
  }

if(testPanel.value == testBehavior.expected){
  testNum++;
  if(testNum <= max_test_file_num){
    if(check_cont.checked){
      window.location.search="?n="+testNum+"&continue=true";
      }
    }
  else{
    alert("Ok");
    }
  }
else{
  document.getElementById("expected_result").innerHTML=""+testBehavior.expected;
  testPanel.style.background="red";
  }

</script>
</body>
</html>
