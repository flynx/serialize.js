#!/usr/bin/env node
/**********************************************************************
* 
*
*
**********************************************************************/
((typeof define)[0]=='u'?function(f){module.exports=f(require)}:define)
(function(require){ var module={} // make module AMD/node compatible...
/*********************************************************************/

var test = require('ig-test')

var eJSON = require('./serialize2')


//---------------------------------------------------------------------
// XXX split into pure and extended JSON...

var json = true
var ejson = false

// XXX test whitespace handling...
var setups = test.Setups({
	number: function(assert){
		return [json, '123'] },
	'number-neg': function(assert){
		return [json, '-123'] },
	'number-zero': function(assert){
		return [json, '0'] },
	'float-a': function(assert){
		return [json, '0.123'] },
	'float-b': function(assert){
		return [json, '1.23'] },
	// XXX need a way to test this...
	//'float-a': function(assert){
	//	return '.123' },
	//'float-c': function(assert){
	//	return '123.' },
	// XXX also test:
	// 		hex/bin/orc/...
	Infinity: function(assert){
		return [ejson, 'Infinity'] },
	nInfinity: function(assert){
		return [ejson, '-Infinity'] },
	// XXX also test diffrerent quotations...
	string: function(assert){
		return [json, '"string"'] },
	'true': function(assert){
		return [json, 'true'] },
	'false': function(assert){
		return [json, 'false'] },

	'null': function(assert){
		return [json, 'null'] },
	'undefined': function(assert){
		return [ejson, 'undefined'] },
	'NaN': function(assert){
		return [ejson, 'NaN'] },

	'array-empty': function(assert){
		return [json, '[]'] },
	'array-sparse-a': function(assert){
		return [ejson, '[<empty>]'] },
	'array-sparse-b': function(assert){
		return [ejson, '["a",<empty>]'] },
	'array-sparse-c': function(assert){
		return [ejson, '[<empty>,"a"]'] },
	'array-sparse-d': function(assert){
		return [ejson, '[<empty>,1,<empty>,<empty>,2,<empty>]'] },
	'array-recursive': function(assert){
		return [ejson, '[<RECURSIVE[]>]'] },

	'object-empty': function(assert){
		return [json, '{}'] },

	'set-empty': function(assert){
		return [ejson, 'Set([])'] },

	'map-empty': function(assert){
		return [ejson, 'Map([])'] },

	// XXX
})

test.Modifiers({
	// NOTE: we are not simply editing strings as we'll need to also 
	// 		update all the recursion paths which is not trivial...
	'array-stuffed': function(assert, [json, setup]){
		return [
			json, 
			eJSON.serialize( 
				[ eJSON.deserialize(setup) ] ),
		] },
	'object-stuffed': function(assert, [json, setup]){
		return [
			json, 
			eJSON.serialize( 
				{ key: eJSON.deserialize(setup) } ) 
		] },
	'set-stuffed': function(assert, [json, setup]){
		return [
			ejson, 
			eJSON.serialize( 
				new Set([ eJSON.deserialize(setup) ]) ) 
		] },
	'map-key-stuffed': function(assert, [json, setup]){
		return [
			ejson, 
			eJSON.serialize( 
				new Map([[eJSON.deserialize(setup), "value"]]) ) 
		] },
	'map-value-stuffed': function(assert, [json, setup]){
		return [
			ejson, 
			eJSON.serialize( 
				new Map([["key", eJSON.deserialize(setup)]]) ) 
		] },
})

test.Tests({
	'self-apply': function(assert, [json, setup]){
		var res
		assert(
			setup == (res = eJSON.serialize( eJSON.deserialize(setup) ) ), 
				'serialize(deserialize( setup )) == setup: expected:', setup, 'got:', res) },

	'json-caopatiility': function(assert, [json, setup]){
		if(!json){
			return }
		var obj = eJSON.deserialize(setup)
		var json, ejson
		assert((json = JSON.stringify(obj)) == (ejson = eJSON.serialize(obj)) )
	},
})


//---------------------------------------------------------------------

typeof(__filename) != 'undefined'
	&& __filename == (require.main || {}).filename
	&& test.run()




/**********************************************************************
* vim:set ts=4 sw=4 nowrap :                        */ return module })
