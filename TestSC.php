<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="text/javascript" src="SugarCubes.js">
</script>
<style>
#program_source {
  /*position: absolute;
  left:0;
  top:24px;*/
  float:left;
  width: 49vw;
  margin:0;
  border:0;
  padding:0;
  unicode-bidi: embed;
  font-family: monospace;
  white-space: pre;
}
#testPanel {
  /*position: absolute;
  top:24px;
  left:50vw;*/
  width: 50vw;
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
<pre id="program_source">
</pre>
<textarea id="testPanel">
</textarea>
<script type="text/javascript">
var check_cont = document.getElementById("check_cont");
function autoContinueSetting(evt){
  if(testNum < max_test_file_num && check_cont.checked){
    window.location.search="?n="+testNum+"&continue=true";
    }
  }
var soucre = document.getElementById("program_source");
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

SC.write = function(msg){
  return SC.action(
     function(){
      testPanel.value += msg;
      }
    );
  }

var m = SC.machine();
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

if(undefined != testBehavior.init){
  testBehavior.init();
  }
var test_prg = testBehavior.prg;
if("string" == typeof(test_prg)){
  test_prg = eval(test_prg);
  }
soucre.innerHTML = testBehavior.prg;
m.addProgram(test_prg);

var maxInstants = (undefined == testBehavior.maxI)?10:testBehavior.maxI;
for(var i = 0 ; i < maxInstants; i++){
  if(undefined !== testBehavior.async){
    testBehavior.async();
    }
  m.react();
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
  testPanel.style.background="red";
  }

</script>
</body>
</html>
