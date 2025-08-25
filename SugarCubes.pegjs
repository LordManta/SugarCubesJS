/*
 * SugarCubes.pegjs
 * Authors : Jean-Ferdy Susini (MNF)
 * Created : 2/12/2014 9:23 PM
 * Part of the SugarCubes Project
 * version : 5.0.796.alpha
 * build: 796
 * Copyleft 2014-2025.
 */
start= cmt:blank def:define? cmt2:blank prg:script cmt3:blank{
  var tmp =[];
  tmp = [cmt];
  tmp.push(def);
  tmp.push(cmt2);
  tmp.push(prg);
  tmp.push(cmt3);
  return SC.lang.module.apply(SC.lang, tmp);
}
define= content:(DEFINE_START blank (event_def / cube_def)* DEFINE_END) {
  return SC.lang.define(content);
  }
event_def = zeDef:((MAP / NEW (blank RESTRICTED)?) blank (event_ids/sensor_ids) blank (signal_val_defs)? SEMI blank) {
  return SC.lang.globalDef(zeDef);
  }
signal_val_defs= ':' blank '{' blank val_def_entry+ '}' blank
val_def_entry= VAL blank value_type blank field_id blank SEMI blank
value_type = FLOAT
field_id = text:$('.'[a-zA-Z0-9_]+) { return SC.lang.fieldId(text); }
event_ids = id:(event_id / system_event_id) { return SC.lang.eventIds(id); }
cube_def = 'cube' SEMI
system_event_id = $([&][_][a-z_A-Z0-9]+)
event_id = $([&][a-z_A-Z0-9]+)
sensor_ids = id:(sensor_id / system_sensor_id) { return SC.lang.sensorIds(id); }
system_sensor_id = $([&][#][_][a-z_A-Z0-9]+)
sensor_id = $([&][#][a-z_A-Z0-9]+)
skipped = skp:(VOID_LINE / comment)
comment = cmt:$(COMMENT_START ([^\"{] / ('\"'[^}]) / ('{'[^\"]) / [\\n\\r] / comment)* COMMENT_STOP) { return SC.lang.comment(cmt); }
script= par 
par= p1:seq p2:((PAR seq)*){
  if((undefined == p2)||(0 == p2.length)){ return p1; };
  var depil = [];
  for(var i in p2){
    var tmp = p2[i];
    depil.push(tmp[0]); depil.push(tmp[1]);
    }
  return SC.lang.par(p1, depil);
  }
PAR= skp1:skipped* '||' skp2:skipped* {
  return SC.lang.parOp(SC.lang.skip(skp1), SC.lang.skip(skp2));
  }
seq= p1:inst p2:((SEQ inst)*){
  if((undefined == p2)||(0 == p2.length)){ return p1; };
  var depil = [];
  for(var i in p2){
    var tmp = p2[i];
    depil.push(tmp[0]); depil.push(tmp[1]);
    }
  return SC.lang.seq(p1, depil);
  }
SEQ= skp1:skipped* SEMI skp2:skipped* {
  return SC.lang.seqOp(SC.lang.skip(skp1), SC.lang.skip(skp2));
  }
inst= await / generate / log / pause / paren/ do_kill / repeat
paren= '{' skp1:skipped* prg:script skp2:skipped* '}'{
  return SC.lang.paren(SC.lang.skip(skp1), prg, SC.lang.skip(skp2));
  }
await= AWAIT skp:skipped* id:event_ids{
  return SC.lang.await(SC.lang.skip(skp), id);
  }
generate= GENERATE skp:blank id:event_ids{
  return SC.lang.generate(skp, id);
  }
log= 'log' skp:blank msg:$string{
  return SC.lang.log(skp, msg);
  }
repeat= rep:(REPEAT (blank times)? blank code_block_open blank script blank code_block_close) {
  return SC.lang.repeat(rep);
  }
boolean_exp= b1:boolean_or b2:(( BOOL_AND boolean_or))* {
  console.log("bool exp ", b1, b2);
}
BOOL_AND= skp1:skipped* '/\\' skp2:skipped* {
  return SC.lang.BoolAndOp(SC.lang.skip(skp1), SC.lang.skip(skp2));
  }
boolean_or = TRUE_KEY / FALSE_KEY 
do_kill= kill:(KILL blank ON blank (event_ids/sensor_ids) blank code_block_open blank script blank code_block_close){
  return SC.lang.kill(kill);
  }
blank=(skp:skipped*{return SC.lang.skip(skp);})
pause= PAUSE times:( blank (FOREVER / times))?{
  return SC.lang.pause(times);
  }
exp_b= exp_or ( blank AND_KEY blank exp_or) *
exp_or= exp_not ( blank OR_KEY blank exp_not)*
exp_not='@' / '(' blank exp_b blank ')'
string= '\"' ([^\"\\\\] / ('\\\\'[^\"]))* '\"'
times= NUMBER blank TIMES
code_block_open= txt:'{'{ return SC.lang.keyword(txt); }
code_block_close= txt:'}'{ return SC.lang.keyword(txt); }
DEFINE_START= txt:'define'{ return SC.lang.keyword(txt); }
MAP= txt:'map'{ return SC.lang.keyword(txt); }
AND_KEY= txt:'/\\'{ return SC.lang.keyword(txt); }
OR_KEY= txt:'\\/'{ return SC.lang.keyword(txt); }
FOREVER= txt:'forever'{ return SC.lang.keyword(txt); }
REPEAT= txt:'repeat'{ return SC.lang.keyword(txt); }
END_REPEAT= 'end' (VOID_LINE*) 'repeat'{ return SC.lang.keyword('end repeat'); }
DO= txt:'do'{ return SC.lang.keyword(txt); }
KILL= txt:'kill'{ return SC.lang.keyword(txt); }
ON= txt:'on'{ return SC.lang.keyword(txt); }
NEW= txt:'new'{ return SC.lang.keyword(txt); }
AWAIT= txt:'await'{ return SC.lang.keyword(txt); }
GENERATE= txt:'generate'{ return SC.lang.keyword(txt); }
VAL= txt:'val'{ return SC.lang.keyword(txt); }
TIMES= txt:'times'{ return SC.lang.keyword(txt); }
PAUSE= txt:'pause'{ return SC.lang.keyword(txt); }
FLOAT= txt:'float'{ return SC.lang.keyword(txt); }
TRUE_KEY= txt:'true'{ return SC.lang.keywordVal(txt); }
FALSE_KEY= txt:'false'{ return SC.lang.keywordVal(txt); }
SEMI= txt:';'{ return SC.lang.ponct(txt); }
NUMBER= txt:$[0-9]+{ return SC.lang.number(txt); }
RESTRICTED= txt:'restricted'{ return SC.lang.keyword(txt); }
DEFINE_END = 'end' (VOID_LINE*) 'define'{ return SC.lang.keyword('end define'); }
COMMENT_START = '{\"'
COMMENT_STOP = '\"}'
VOID_LINE = spc:[ \n\r\t] {return SC.lang.space(spc);}
