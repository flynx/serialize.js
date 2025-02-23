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
* XXX should this be part of types.js???
* 		...extend JSON or a separate object? (leaning towards the later)
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
var INFINITY = '<< INFINITY >>'
var NEG_INFINITY = '<< NEG_INFINITY >>'

var FUNCTION = '<< FUNCTION >>'
var FUNC_SEP = '\n---\n'
var FUNCTION_PLACEHOLDER = '<< FUNCTION PLACEHOLDER >>'


// XXX unify the output format... (???)
// XXX handle formatting -- pass to JSON.stringify(..)...
// XXX this does not support functions...
var serialize = 
module.serialize =
function(value, raw=true){
	var replacer = function(k, v){
		// undefined...
		if(v === undefined){
			return UNDEFINED
		// Infinity...
		} else if(typeof(v) == 'number' 
				&& v === Infinity){
			return INFINITY
		// -Infinity...
		} else if(typeof(v) == 'number' 
				&& v === -Infinity){
			return NEG_INFINITY
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
			v = copy 
		// function...
		} else if(typeof(v) == 'function'){
			if(raw instanceof Array){
				raw.push(v)
				return FUNCTION_PLACEHOLDER }
			return raw ?
				FUNCTION
					+ '\n'
					+ v.toString()
					+ FUNC_SEP
					+ serialize(
						Object.fromEntries(
							Object.entries(v)), 
						raw) 
				: v.name != '' ?
					FUNCTION 
						+ v.name
						+ FUNCTION
				: FUNCTION 
					+ v.toString()
	   				+ FUNCTION }
		return v }

	return raw ?
		JSON.stringify(value, replacer)
		: JSON.stringify(value, replacer)
			// cleanup placeholders...	
			.replace(new RegExp('"'+ FUNCTION +'(.*)'+ FUNCTION +'"', 'g'), '$1')
			.replace(new RegExp('"'+ EMPTY +'"', 'g'), '<empty>')
			.replace(new RegExp('"'+ EMPTY +'"', 'g'), '<empty>')
			.replace(new RegExp('"'+ UNDEFINED +'"', 'g'), 'undefined')
			.replace(new RegExp('"'+ INFINITY +'"', 'g'), 'Infinity')
			.replace(new RegExp('"'+ NEG_INFINITY +'"', 'g'), '-Infinity')
			.replace(new RegExp('"'+ NAN +'"', 'g'), 'NaN') }


var stringify = 
module.stringify =
function(value){
	return serialize(value, false) }


// XXX this should pre-parse te string -- need to handle strings correctly...
var deserialize = 
module.deserialize =
function(str, funcs){
	var PLACEHOLDER = {}
	var parseFunction = function(code){
		var [code, attrs] = code.split(FUNC_SEP)
		// XXX this is not safe...
		// 		...need to parse function code into args and code...
		var func = Function('return '+ code)()
		attrs.trim() != '{}'
			&& Object.assign(func, deserialize(attrs))
		return func }
	var reviver = function(key, value, context){
		if(value == UNDEFINED){
			return PLACEHOLDER }
		return typeof(value) == 'string'
					&& value.startsWith(FUNCTION) ?
				parseFunction(value
					.slice(FUNCTION.length)
					.trim())
			: (value == FUNCTION_PLACEHOLDER 
					&& funcs) ?
				funcs.shift()
			: value == INFINITY ?
				Infinity
			: value == NEG_INFINITY ?
				-Infinity
			: value == NAN ?
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



//---------------------------------------------------------------------
// copying/colning...

// Deep copy an object tree...
//
// This is similar to JSON.parse(JSON.stringify(..)) but uses deserialize 
// and serialize.
//
// NOTE: this will try and reconstruct functions from the input tree, 
// 		this will work fine for simple functions but more complex cases
// 		may yield unexpected results -- this is not done to full depth, 
// 		as we only handle: 
// 			- function code (as returned by .toString())
// 			- attributes set on the function directly
// 		if a function has a custom .__proto__ and/or data in its 
// 		inheritance tree, such data is ignored.
var deepCopy =
module.deepCopy =
function(obj){
	return deserialize(
		serialize(obj)) }


// This is the same as semiDeepCopy(..) but instead of recreating 
// functions, it will simply rereference them from the input...
var semiDeepCopy =
module.semiDeepCopy =
function(obj){
	var funcs = []
	return deserialize(
		serialize(obji, funcs), 
		funcs) }




/**********************************************************************
* vim:set ts=4 sw=4 :                               */ return module })
