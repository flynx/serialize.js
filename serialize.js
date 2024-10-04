/**********************************************************************
* 
* XXX the structure of this will change!!
*
* XXX merge serialize(..) and stringify(..) -> pre-parse theinput string
* 		in deserialize(..) to replace undefined, NaN and <empty> with 
* 		appropriate placeholders...
* 		There should be two formats:
* 			- pretty
* 			- fast -- w/o pre-processing...
*
**********************************************************************/
((typeof define)[0]=='u'?function(f){module.exports=f(require)}:define)
(function(require){ var module={} // make module AMD/node compatible...
/*********************************************************************/




/*********************************************************************/

//
// This extends JSON.stringify(..) adding suppoort for:
// 		- empty
// 		- NaN
// 		- undefined
//
var EMPTY = '<< EMPTY >>'
var UNDEFINED = '<< UNDEFINED >>'
var NAN = '<< NAN >>'

// XXX unify the output format...
// XXX handle formatting -- pass to JSON.stringify(..)...
var serialize = 
module.serialize =
function(value, raw=true){
	var replacer = function(k, v){
		// undefined...
		if(v === undefined){
			return UNDEFINED
		// NaN...
		} else if(typeof(v) == 'number' 
				&& isNaN(v)){
			return NAN
		// <empty>...
		} else if(v instanceof Array){
			copy = [...v]
			for(var i=0; i < v.length; i++){
				if(! (i in v)){
					copy[i] = EMPTY } }
			v = copy }
		return v }

	return raw ?
		JSON.stringify(value, replacer)
		: JSON.stringify(value, replacer)
			// cleanup placeholders...	
			.replace(new RegExp('"'+ EMPTY +'"', 'g'), '<empty>')
			.replace(new RegExp('"'+ UNDEFINED +'"', 'g'), 'undefined')
			.replace(new RegExp('"'+ NAN +'"', 'g'), 'NaN') }


var stringify = 
module.stringify =
function(value){
	return serialize(value, false) }


// XXX this should pre-parse te string -- need to handle strings correctly...
var deserialize = 
module.deserialize =
function(str){
	var PLACEHOLDER = {}
	var reviver = function(key, value, context){
		if(value == UNDEFINED){
			return PLACEHOLDER }
		return value == NAN ?
				NaN
			: value === EMPTY ?
				undefined
			: value }
	// NOTE: this is needed as we returning undefined from reviver(..)
	// 		will leave the value empty.
	var cleanup = function(obj){
		if(typeof(obj) == 'object'){
			for(var key in obj){
				if(obj[key] === PLACEHOLDER){
					obj[key] = undefined 
				} else {
					cleanup(obj[key]) } } } 
		return obj }

	var res = JSON.parse(str, reviver)

	return cleanup(res) }




/**********************************************************************
* vim:set ts=4 sw=4 :                               */ return module })
