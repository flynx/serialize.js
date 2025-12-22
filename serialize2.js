/**********************************************************************
* 
*
*
**********************************************************************/
((typeof define)[0]=='u'?function(f){module.exports=f(require)}:define)
(function(require){ var module={} // make module AMD/node compatible...
/*********************************************************************/


var EMPTY = '<empty>'
var NULL = 'null'
var UNDEFINED = 'undefined'
var NAN = 'NaN'
var INFINITY = 'Infinity'
var NEG_INFINITY = '-Infinity'

var RECURSIVE = '<RECURSIVE%>'



//---------------------------------------------------------------------

// XXX add support for pretty printing...
// XXX need to destinguish between map key and value in path...
var serialize = 
module.serialize = 
function(obj, path=[], seen=new Map()){
	// recursive...
	var p = seen.get(obj)
	if(p != null){
		return RECURSIVE.replace('%', serialize(p)) }

	// XXX functions...
	// XXX

	// atomics...
	if(obj === null){
		return NULL }
	if(typeof(obj) != 'object'){
		return obj === undefined ?
				UNDEFINED
			: isNaN(obj) ?
				NAN
			: obj === Infinity ?
				INFINITY
			: obj === -Infinity ?
				NEG_INFINITY
			: JSON.stringify(obj) } 

	// objects...
	seen.set(obj, path)
	
	var elems = []
	var pre = ''
	var join = ','
	var post = ''
	if(obj instanceof Array){
		pre = '['
		post = ']'
		for(var i=0; i < obj.length; i++){
			elems.push(
				i in obj ?
					serialize(obj[i], [...path, i], seen)
					: EMPTY) }

	} else if(obj instanceof Map){
		pre = 'Map('
		post = ')'
		elems = [serialize([...obj], path, seen)]

	} else if(obj instanceof Set){
		pre = 'Set('
		post = ')'
		elems = [serialize([...obj], path, seen)]

	} else {
		pre = '{'
		post = '}'
		for(var [k, v] of Object.entries(obj)){
			elems.push(`${ 
					JSON.stringify(k) 
				}:${ 
					serialize(v, [...path, k], seen) 
				}`) } }

	return pre+ elems.join(join) +post }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// XXX add function support...
var eJSON = 
module.eJSON = {
	chars: {
		'"': 'string', "'": 'string',

		0: 'number', 1: 'number', 2: 'number', 3: 'number', 4: 'number',
		5: 'number', 6: 'number', 7: 'number', 8: 'number', 9: 'number',
		'.': 'number', '-': 'number',

		'[': 'array',
		'{': 'object',
	},
	words: {
		Infinity: 'number',
		
		'Set(': 'set',
		'Map(': 'map',

		null: null,
		undefined: undefined,
		NaN: NaN,

		'<empty>': 'empty',
		'<RECURSIVE': 'recursive',
	},
	

	// generic helpers...
	//
	getItem: function(obj, path){
		for(var k of path){
			obj = obj instanceof Set ?
					[...obj][k]
				: obj instanceof Map ?
					obj.get(k)
				: obj[k] }
		return obj },
	// NOTE: this behaves in a similar way to normal key value assignment,
	// 		i.e. replacing items if they exist, this is not a problem here 
	// 		as in the general case we are assigning over a placeholder 
	// 		object...
	// NOTE: as a side-effect this maintains element oreder even in object
	// 		with no direct concept of element order, like objects, sets and
	// 		maps.
	setItem: function(obj, path, value){
		var parent = this.getItem(obj, path.slice(0, -1))
		var k = path.at(-1)
		if(obj instanceof Set){
			var elems = [...parent]
			elems[k] = obj
			for(var e of elems){
				parent.add(e) }
		} else if(obj instanceof Map){
			parent.set(k, value)
		} else {
			parent[k] = value }
		return value },



	WHITESPACE: ' \t\n',
	skipWhitespace: function(str, i, line){
		while(i < str.length 
				&& this.WHITESPACE.includes(str[i])){
			if(str[i] == '\n'){
				line++ }
			i++ }
		return [i, line] },

	//
	//	.handler(match, str, i, line)
	//		-> [value, i, line]
	//
	number: function(state, path, match, str, i, line){
		// special cases..,
		if(match == 'Infinity'){
			return [Infinity, i, line] }
		if(match == '-' 
				&& str.slice(i, 'Infinity'.length) == 'Infinity'){
			return [-Infinity, i+'Infinity'.length, line] }
		// numbers...
		var j = i+1
		while(j < str.length
				&& (str[j] == '.'
					|| (str[j] >= '0'
						&& str[j] <= '9'))){
			j++ }
		return [ str.slice(i, j)*1, j, line ] },
	// XXX count \\n
	// XXX handle \\<match>
	string: function(state, path, match, str, i, line){
		var j = i+1
		while(j < str.length 
				&& str[j] != match){
			// XXX handle '\\n'.,.
			if(str[j] == '\n'){
				line++ }
			j++ }
		if(j == str.length 
				&& str[j-1] != match){
			throw new SyntaxError('Unexpected end of input wile looking fot "'+ match +'".') }
		return [ str.slice(i+1, j), j+1, line ] },
	identifier: function(state, path, match, str, i, line){
		// XXX
	},

	// XXX method or func???
	// XXX interface???
	//
	//	handler(res, index, str, i, line)
	//		-> [res, i, line]
	//
	sequence: function(state, path, str, i, line, end, handler, initial=[]){
		var index = 0
		while(i < str.length){
			;[i, line] = this.skipWhitespace(str, i, line)

			// done...
			if(str.slice(i, i+end.length) == end){
				return [initial, i+end.length, line] }

			// empty...
			if(str[i] == ','){
				index++
				i++
				// XXX this feels hackish -- can this be deligated to the handler???
				initial instanceof Array
					&& initial.length++
				continue }
			if(str.slice(i, EMPTY.length) == EMPTY){
				i += EMPTY.length
				// XXX this feels hackish -- can this be deligated to the handler???
				initial instanceof Array
					&& initial.length++
				continue }

			// end of input...
			if(i >= str.length-1){
				break }

			// value...
			;[initial, i, line] = handler.call(this, initial, index, str, i, line)

			;[i, line] = this.skipWhitespace(str, i, line)
			if(str[i] == ','){
				i++ }
			index++ }

		// XXX better message -- show starting seq...
		throw new SyntaxError('Unexpected end of input wile looking for "'+ end +'".') },

	array: function(state, path, match, str, i, line){
		return this.sequence(
			state, path, str, i+1, line, 
			']',
			function(res, index, str, i, line){
				var obj
				;[obj, i, line] = this.value(state, [...path, index], str, i, line)
				res[index] = obj
				return [res, i, line] }) },
	object: function(state, path, match, str, i, line){
		return this.sequence(
			state, path, str, i+1, line, 
			'}',
			function(res, index, str, i, line){
				var obj, key
				// key...
				;[key, i, line] = '\'"`'.includes(str[i]) ?
					this.string(state, path, str[i], str, i, line)
					: this.identifier(state, path, str[i], str, i, line)

				// ':'...
				;[i, line] = this.skipWhitespace(str, i, line)
				if(str[i] != ':'){
					// XXX
					throw new SyntaxError('Expected ":", got "'+ str[i] +'".') }
				i++
				;[i, line] = this.skipWhitespace(str, i, line)

				// value...
				;[obj, i, line] = this.value(state, [...path, key], str, i, line)
				res[key] = obj
				return [res, i, line] }, 
			{}) },

	set: function(state, path, match, str, i, line){
		i += match.length
		;[res, i, line] = this.sequence(
			state, path, 
			str, i+1, line, 
			']',
			function(res, index, str, i, line){
				var obj
				;[obj, i, line] = this.value(
					state, 
					[...path, index], 
					str, i+match.length, line)
				res.add(obj)
				return [res, i, line] },
			new Set()) 
		if(str[i] != ')'){
			throw new SyntaxError('Expected ")", got "'+ str[i] +'".') }
		return [res, i, line] },
	// XXX need to destinguish between key and value in path...
	map: function(state, path, match, str, i, line){
		i += match.length
		;[res, i, line] = this.sequence(
			state, path, 
			str, i+1, line, 
			']',
			function(res, index, str, i, line){
				var obj
				;[[key, value], i, line] = this.value(
					state, 
					// XXX need a way to index path or value...
					[...path, index], 
					str, i+match.length, line)
				res.set(key, value)
				return [res, i, line] },
			new Set()) 
		if(str[i] != ')'){
			throw new SyntaxError('Expected ")", got "'+ str[i] +'".') }
		return [res, i, line] },

	// XXX should this be done inline or on a separate stage?
	// 		for inline we need these:
	// 			- all containers must be placed as soon as they are created
	// 				"return" before the items are processed...
	// 			- containers must be "filled" as the items are parsed
	// 				like .array(..) and .object(..) but not like .map(..) and .set(..)
	// 			- thread the root object...
	// 		alternatively, for a two stage process we need to:
	// 			- have a mechanism to write placeholders
	// 			- remember their positions (paths)
	// 			- build/get said path
	// XXX another strategy would be to have an path-object map and 
	// 		directly reference that -- this would eliminate the need for 
	// 		stage two... (XXX TEST)
	recursive: function(state, path, match, str, i, line){
		return this.sequence(
			state, path, str, i+match.length, line, 
			'>',
			function(res, index, str, i, line){
				var obj
				;[obj, i, line] = this.array(state, [...path, index], '[', str, i, line)
				var rec = state.recursive ??= []
				rec.push([path, obj])
				return [{}, i, line] }) },

	func: function(state, path, match, str, i, line){
		// XXX
	},

	value: function(state, path, str, i=0, line=0){

		;[i, line] = this.skipWhitespace(str, i, line)

		// get handler...	
		var NONE = {}
		var handler = NONE
		var match = str[i]
		if(match in this.chars){
			handler = this.chars[match]
		} else {
			for(match in this.words){
				if(match == str.slice(i, i+match.length)){
					handler = this.words[match]
					break } } }

		// syntax error...
		if(handler === NONE){
			var context = 8
			var pre = Math.max(i-context, 0)
			var post = Math.min(i+context, str.length)
			throw new SyntaxError(`Unexpected: ${ str[i] } at:\n`
				+`    ${line}: ..${ str.slice(pre, post) }..\n`
				+`    ${ ' '.repeat( pre + ((line + ': ..').length) ) }^`) }

		// value...
		if(typeof(handler) != 'string'){
			return [handler, i+match.length, line] }
		// func...
		return this[handler](state, path, match, str, i, line) },


	parse: function(str){

		// stage 1: build the object...
		var state = {}
		var res = this.value(state, [], str)[0] 

		// stage 2: link the recursive structures...
		for(var [a, b] of state.recursive ?? []){
			this.setItem(res, a, this.getItem(res, b)) }

		return res },
}


var deserialize =
module.deserialize =
function(str){
	return eJSON.parse(str) }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// utils...
// XXX see ./serialize.js

var deepCopy =
module.deepCopy =
function(obj){
	return deserialize(
		serialize(obj)) }




/**********************************************************************
* vim:set ts=4 sw=4 nowrap :                        */ return module })
