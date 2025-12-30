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

var setups = test.Setups({
	number: function(assert){
		return '123' },
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
	'array-sparse': function(assert){
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
	'array-stuffed': function(assert, setup){
		return `[${ setup }]` },
	'object-stuffed': function(assert, setup){
		return `{"key":${ setup }}` },
	'set-stuffed': function(assert, setup){
		return `Set([${ setup }])` },
	'map-key-stuffed': function(assert, setup){
		return `Map([[${ setup },"value"]])` },
	'map-value-stuffed': function(assert, setup){
		return `Map([["key",${ setup }]])` },
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
