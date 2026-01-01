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

var eJSON = require('./serialize')


//---------------------------------------------------------------------
// Test data format:
// 	[
// 		<data>,
// 		// tags (optionsal)
// 		json,				- if the data is JSON-compatible, value true|false (default: undefined)
// 		...
// 	]
//

var json = true
var ejson = false

var pre_cycle = true

// XXX test whitespace handling...
var setups = test.Setups({
	'true': function(assert){
		return ['true', json] },
	'false': function(assert){
		return ['false', json] },
	'null': function(assert){
		return ['null', json] },
	'undefined': function(assert){
		return ['undefined'] },
	'NaN': function(assert){
		return ['NaN'] },

	number: function(assert){
		return ['123', json] },
	'number-neg': function(assert){
		return ['-123', json] },
	'number-zero': function(assert){
		return ['0', json] },
	'float-a': function(assert){
		return ['0.123', json] },
	'float-b': function(assert){
		return ['1.23', json] },
	'bigint': function(assert){
		return ['999999999999999999999n'] },
	// XXX need a way to test this...
	//'float-a': function(assert){
	//	return ['.123'] },
	//'float-c': function(assert){
	//	return ['123.'] },
	// XXX also test:
	// 		hex/bin/orc/...
	Infinity: function(assert){
		return ['Infinity'] },
	nInfinity: function(assert){
		return ['-Infinity'] },

	// XXX also test diffrerent quotations...
	string: function(assert){
		return ['"string"', json] },

	'array-empty': function(assert){
		return ['[]', json] },
	'array-sparse-a': function(assert){
		return ['[<empty>]'] },
	'array-sparse-b': function(assert){
		return ['["a",<empty>]'] },
	'array-sparse-c': function(assert){
		return ['[<empty>,"a"]'] },
	'array-sparse-d': function(assert){
		return ['[<empty>,1,<empty>,<empty>,2,<empty>]'] },

	'object-empty': function(assert){
		return ['{}', json] },

	'set-empty': function(assert){
		return ['Set([])'] },

	'map-empty': function(assert){
		return ['Map([])'] },

	'function': function(assert){
		return ['<FUNCTION[14,(function(){})]>'] },

	// recursive...
	'array-recursive': function(assert){
		return ['[<RECURSIVE[]>]'] },
	'object-recursive': function(assert){
		return ['{"r":<RECURSIVE[]>}'] },
	'set-recursive': function(assert){
		return ['Set([<RECURSIVE[]>])'] },
	'map-recursive-key': function(assert){
		return ['Map([[<RECURSIVE[]>,"value"]])'] },
	'map-recursive-value': function(assert){
		return ['Map([["key",<RECURSIVE[]>]])'] },

})

test.Modifiers({
	// NOTE: we are not simply editing strings as we'll need to also 
	// 		update all the recursion paths which is not trivial...
	'array-stuffed': function(assert, [setup, json]){
		return [
			eJSON.serialize( 
				[ eJSON.deserialize(setup, true) ] ),
			json, 
		] },
	'object-stuffed': function(assert, [setup, json]){
		return [
			eJSON.serialize( 
				{ key: eJSON.deserialize(setup, true) } ),
			json, 
		] },
	// NOTE: these explicitly remove JSON compatibility regardless of input...
	'set-stuffed': function(assert, [setup]){
		return [
			eJSON.serialize( 
				new Set([ eJSON.deserialize(setup, true) ]) ),
			ejson, 
		] },
	'map-key-stuffed': function(assert, [setup]){
		return [
			eJSON.serialize( 
				new Map([[eJSON.deserialize(setup, true), "value"]]) ),
			ejson, 
		] },
	'map-value-stuffed': function(assert, [setup]){
		return [
			eJSON.serialize( 
				new Map([["key", eJSON.deserialize(setup, true)]]) ),
			ejson, 
		] },
})

test.Tests({
	'self-apply': function(assert, [setup]){
		var res
		assert(
			setup == (res = eJSON.serialize( eJSON.deserialize(setup, true) ) ), 
				'serialize(deserialize( setup )) == setup: expected:', setup, 'got:', res) },

	'json-caopatiility': function(assert, [setup, json], skipTest){
		if(!json){
			skipTest()
			return }
		var obj = eJSON.deserialize(setup, true)
		assert(
			JSON.stringify(obj) == eJSON.serialize(obj) ) },

	'deep-copy': function(assert, [setup]){
		var obj = eJSON.deserialize(setup, true)
		var copy = eJSON.deepCopy(obj, true)

		assert(eJSON.serialize(obj) == eJSON.serialize(copy))

		// XXX check if all non-atoms are distinct...
		// XXX
	},

	//* XXX ERR
	'partial-deep-copy': function(assert, [setup]){
		var obj = eJSON.deserialize(setup, true)
		var funcs = []
		var copy = eJSON.partialDeepCopy(obj, funcs)

		assert(eJSON.serialize(obj) == eJSON.serialize(copy))

		// XXX check if all non-atoms are distinct and functions are the same...
		// XXX
	},
	//*/
})

test.Cases({
	/* XXX for some magical reason hese break as soon as we add [setup] to arguments...
	'deep-copy-function': function(assert, [setup]){
		// XXX check function isolation...
	},
	//*/

	// NOTE: these syntax variants are not output by .serialize(..) this it
	// 		is less critical to test them in the main loop.
	// 		XXX though it would be nice to do so...
	tests: [
		// numbers/floats...
		['.123', '0.123'],
		['123.', '123'],

		// string quotes...
		['"abc"', "'abc'"],
		['"abc"', '`abc`'],

		// arrays...
		['[1,2,]', '[1,2]'],

		// sparse arrays...
		['[<empty>]', '[,]'],
		['[1,2,<empty>]', '[1,2,,]'],
		['[1,2,<empty>]', '[1,2,<empty>,]'],
	],
	'syntax-simplifications': function(assert){
		var aa, bb
		for(var [a, b] of this.tests){
			assert(eJSON.serialize(aa = eJSON.deserialize(a)) == eJSON.serialize(bb = eJSON.deserialize(b)),
				`"${ a }" and "${ b }" should deserialize to the samve value.`,
					'got:', aa, 'and', bb, 'resp.') } },

	'deep-copy-function': function(assert){
		// XXX check function isolation...
	},
	'partial-deep-copy-function': function(assert){
		// XXX check function isolation...
	},
})


//---------------------------------------------------------------------

typeof(__filename) != 'undefined'
	&& __filename == (require.main || {}).filename
	&& test.run()




/**********************************************************************
* vim:set ts=4 sw=4 nowrap :                        */ return module })
