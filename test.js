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

// XXX test whitespace handling...
var setups = test.Setups({
	number: function(assert){
		return '123' },
	'float-a': function(assert){
		return '0.123' },
	'float-b': function(assert){
		return '1.23' },
	// XXX need a way to test this...
	//'float-a': function(assert){
	//	return '.123' },
	//'float-c': function(assert){
	//	return '123.' },
	// XXX also test:
	// 		hex/bin/orc/...
	Infinity: function(assert){
		return 'Infinity' },
	nInfinity: function(assert){
		return '-Infinity' },
	// XXX also test diffrerent quotations...
	string: function(assert){
		return '"string"' },
	'true': function(assert){
		return 'true' },
	'false': function(assert){
		return 'false' },

	'null': function(assert){
		return 'null' },
	'undefined': function(assert){
		return 'undefined' },
	'NaN': function(assert){
		return 'NaN' },

	'array-empty': function(assert){
		return '[]' },
	'array-sparse-a': function(assert){
		return '[<empty>]' },
	'array-sparse-b': function(assert){
		return '["a",<empty>]' },
	'array-sparse-c': function(assert){
		return '[<empty>,"a"]' },
	'array-sparse-d': function(assert){
		return '[<empty>,1,<empty>,<empty>,2,<empty>]' },
	'array-recursive': function(assert){
		return '[<RECURSIVE[]>]' },

	'object-empty': function(assert){
		return '{}' },

	'set-empty': function(assert){
		return 'Set([])' },

	'map-empty': function(assert){
		return 'Map([])' },

	// XXX
})

test.Modifiers({
	// NOTE: we are not simply editing strings as we'll need to also 
	// 		update all the recursion paths which is not trivial...
	'array-stuffed': function(assert, setup){
		return eJSON.serialize( 
			[ eJSON.deserialize(setup) ] ) },
	'object-stuffed': function(assert, setup){
		return eJSON.serialize( 
			{ key: eJSON.deserialize(setup) } ) },
	'set-stuffed': function(assert, setup){
		return eJSON.serialize( 
			new Set([ eJSON.deserialize(setup) ]) ) },
	'map-key-stuffed': function(assert, setup){
		return eJSON.serialize( 
			new Map([[eJSON.deserialize(setup), "value"]]) ) },
	'map-value-stuffed': function(assert, setup){
		return eJSON.serialize( 
			new Map([["key", eJSON.deserialize(setup)]]) ) },
})

test.Tests({
	'self-apply': function(assert, setup){
		var res
		assert(
			setup == (res = eJSON.serialize(eJSON.deserialize(setup))), 
				'serialize(deserialize( setup )) == setup: expected:', setup, 'got:', res) },

})


//---------------------------------------------------------------------

typeof(__filename) != 'undefined'
	&& __filename == (require.main || {}).filename
	&& test.run()




/**********************************************************************
* vim:set ts=4 sw=4 nowrap :                        */ return module })
