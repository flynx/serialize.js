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

var FUNCTION = '<FUNCTION[%]>'



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

module.DEBUG = false

var DEBUG_PREFIX = '---'

var debug = {
	context: 16,

	log: function(...args){
		if(!module.DEBUG){
			return }
		return console.log(DEBUG_PREFIX, ...arguments) },
	lex: function(name, str, i, line){
		return this.log(name +':', str.slice(i, i+this.context) +'...') },
}


//---------------------------------------------------------------------

//
// 	serialize(obj[, indent[, depth]])
// 		-> str
//
// 	indent can be:
// 		number	- number of spaces to use for indent
// 		string	- string to use for indenting
//
//
// 	_serialize(obj, base_path, seen, indent, depth, functions)
// 		-> str
//
//
// Paths
// 	A path is a chain of indexes/keys leading to a specific object in 
// 	tree.
//
// 	the root object is referenced by an empty path array.
//
// 	For sets, positional indexes are used, i.e. a set is treated like 
// 	an array ov values.
//
// 	For maps a two number index is used with the first being the position
// 	of the item and the second indicated if the target is the key or the 
// 	value. i.e. a map is treated like an array of key value pairs.
//
//
// 	Examples:
// 		Object						   paths
// 		---------------------------------------------------------------
// 		obj = [						<- []
// 			null,					<- [0]
// 			[
// 				'a', 
// 				'b', 				<- [1, 1]
// 				'c',
// 			],
// 			Set([ 
// 				1, 
// 				2, 
// 				3,					<- [2, 2]
// 			]),
// 			Map([i					<- [3]   +----- index of elemnt in map
// 				[							/  +--- 0 means key
// 					'key',			<- [3, 0, 0]
// 					'value'			<- [3, 0, 1]
// 				],                             +--- 1 means value
// 				[
// 					[
// 						123			<- [3, 1, 0, 0]
// 					],
// 					'got tired of thinking up names',
// 				],
// 			]),
// 		]
//
//
// XXX BUG: using non-whitespace as indent breaks the depth of the first 
// 		or last elements in sequences
// 		...breaks .trim*() in Map/Set/Object...
var _serialize = 
module._serialize = 
function(obj, path=[], seen=new Map(), indent, depth=0, functions){
	// recursive...
	var p = seen.get(obj)
	if(p != null){
		// NOTE: _serialize(..) is always printed flat here, regardless of indent/depth...
		return RECURSIVE.replace('%', _serialize(p)) }

	// functions...
	// NOTE: we are storing function length to avoid parsing the function...
	// NOTE: storing length is a potential attack vector...
	if(typeof(obj) == 'function'){
		seen.set(obj, path)
		// if functions array is given add function to it and store its
		// index in the serialized data...
		if(functions != null){
			functions.push(obj) 
			obj = functions.length-1 }
		var s = '('+ obj.toString() +')'
		return FUNCTION
			.replace('%', s.length +','+ s) }

	// atomics...
	if(obj === null){
		return NULL }
	if(typeof(obj) != 'object'){
		return typeof(obj) == 'number' 
					&& isNaN(obj) ?
				NAN
			: obj === undefined ?
				UNDEFINED
			: obj === Infinity ?
				INFINITY
			: obj === -Infinity ?
				NEG_INFINITY
			: JSON.stringify(obj, null, indent) } 

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
					_serialize(obj[i], [...path, i], seen, indent, depth+1, functions)
					: EMPTY) }
	} else if(obj instanceof Map){
		pre = 'Map(['
		post = '])'
		elems = [
			_serialize([...obj], path, seen, indent, depth, functions)
				.slice(1, -1)
				.trim() ]
	} else if(obj instanceof Set){
		pre = 'Set(['
		post = '])'
		elems = [
			_serialize([...obj], path, seen, indent, depth, functions)
				.slice(1, -1)
				.trim() ]
	} else {
		pre = '{'
		post = '}'
		for(var [k, v] of Object.entries(obj)){
			elems.push(`${ 
					JSON.stringify(k) 
				}:${ indent != null ? ' ' : '' }${ 
					_serialize(v, [...path, k], seen, indent, depth+1, functions)
						// relevant for pretty-printing only...
						.trimLeft()
				}`) } }

	// handle indent...
	if(indent != null){
		i = indent.repeat(depth)
		s = i + indent
		if(elems.length > 0){
			pre = pre + '\n' + s
			post = '\n' + i + post
			// XXX set limit for number of elements to keep horizontal...
			// 		...also account for element length...
			join = join + '\n' + s } }

	return pre+ elems.join(join) +post }

// user interface...
var serialize = 
module.serialize = 
function(obj, indent, depth=0, functions){
	return _serialize(obj, [], new Map(), indent, depth, functions) }


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// XXX better error handling...
// XXX try and make this single stage (see notes for : .recursive(..))
var eJSON = 
module.eJSON = {
	chars: {
		'"': 'string', "'": 'string', '`': 'string', 

		0: 'number', 1: 'number', 2: 'number', 3: 'number', 4: 'number',
		5: 'number', 6: 'number', 7: 'number', 8: 'number', 9: 'number',
		'.': 'number', '-': 'number',

		'[': 'array',
		'{': 'object',
	},
	words: {
		true: true,
		false: false,

		Infinity: 'number',
		
		'Set(': 'set',
		'Map(': 'map',

		null: null,
		undefined: undefined,
		NaN: NaN,

		'<empty>': 'empty',
		'<RECURSIVE': 'recursive',

		'<FUNCTION[': 'func',
	},
	

	// generic helpers...
	//
	// XXX need to keep the context constrained to one line...
	context_size: 16,
	error: function(msg, str, i, line){
		var pre = i
		var post = i
		while(pre > 0 
				&& i - pre <= this.context_size
				&& str[pre] != '\n'){
			pre-- }
		while(post < str.length 
				&& post - i <= this.context_size
				&& str[post] != '\n'){
			post++ }
		throw new SyntaxError(`${ msg }\n`
			+`    ${line}: ${ str.slice(pre, post) }\n`
			+`    ${ ' '.repeat( i - pre + ((line + ': ').length) ) }^`) },

	//
	// 	._getItem(obj, path)
	// 		-> [path, obj]
	//
	// NOTE: we are returning path here because we need to distinguish 
	// 		incomplete paths that we can infer the container from and 
	// 		complete paths, e.g:
	// 			For
	// 				m = [new Map([[1,2], [2,3]])]
	// 			Both of the below will return the map and the correct path ([0]):
	// 				eJSON._getItem(m, [0, 1])
	// 				eJSON._getItem(m, [0])
	// 			But we need to destinguish between the two cases when 
	// 			writing to a map (see: .setItem(..))
	_getItem: function(obj, path){
		for(var i=0; i<path.length; i++){
			var k = path[i]
			// speacial case: incomplete map index...
			if( obj instanceof Map 
					&& i == path.length-1){
				return [path.slice(0, -1), obj] }

			obj = obj instanceof Set ?
					[...obj][k]
				: obj instanceof Map ?
					[...obj][k][path[++i]]
				: obj[k] }
		return [path, obj] },
	//
	// 	.getItem(obj, path)
	// 		-> obj
	//
	// NOTE: this is a POLS wrapper of ._getItem(..)
	getItem: function(obj, path){
		return this._getItem(...arguments)[1] },
	// NOTE: this behaves in a similar way to normal key value assignment,
	// 		i.e. replacing items if they exist, this is not a problem here 
	// 		as in the general case we are assigning over a placeholder 
	// 		object...
	// NOTE: as a side-effect this maintains element oreder even in object
	// 		with no direct concept of element order, like objects, sets and
	// 		maps.
	// NOTE: some operations envolve rewriting the container elements so 
	// 		are not as fast, namely writing set elements and map keys.
	setItem: function(obj, path, value){
		var [p, parent] = this._getItem(obj, path.slice(0, -1))
		var k = path.at(-1)
		if(parent instanceof Set){
			var elems = [...parent]
			elems[k] = value
			// we cant to keep the order...
			parent.clear()
			for(var e of elems){
				parent.add(e) }
		} else if(parent instanceof Map){
			if(path.length-2 !== p.length){
				throw new Error('.setItem(..): incomplete path.') }
			var i = path.at(-2)
			// replace the index...
			if(k == 0){
				var elems = [...parent]
				elems[i][0] = value
				parent.clear()
				for(var e of elems){
					parent.set(...e) }
			// set the value...
			} else {
				parent.set([...parent][i][0], value) }
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
		debug.lex('number', str, i, line)
		// special cases..,
		if(match == 'Infinity'){
			return [Infinity, i+'Infinity'.length, line] }
		if(match == '-' 
				&& str.slice(i, i+'-Infinity'.length) == '-Infinity'){
			return [-Infinity, i+'-Infinity'.length, line] }
		// numbers...
		var j = i+1
		while(j < str.length
				&& (str[j] == '.'
					|| (str[j] >= '0'
						&& str[j] <= '9'))){
			j++ }
		return [ str.slice(i, j)*1, j, line ] },
	// XXX TEST count \\n
	string: function(state, path, match, str, i, line){
		debug.lex('string', str, i, line)
		var j = i+1
		while(j < str.length 
				&& str[j] != match){
			// newlines...
			if(str[j] == '\n'){
				line++ }
			// escaped newlines...
			if(str[j] == '\\' 
					&& j+1 < str.length 
					&& str[j+1] == 'n'){
				line++ }
			// skip escaped quotes...
			if(str[j] == '\\' 
					&& j+1 < str.length 
					&& str[j+1] == match){
				j++ }
			j++ }
		if(j == str.length 
				&& str[j-1] != match){
			this.error('Unexpected end of input wile looking fot "'+ match +'".', str, i, line) }
		return [ str.slice(i+1, j), j+1, line ] },
	identifier: function(state, path, match, str, i, line){
		debug.lex('identifier', str, i, line)
		if(!/[a-zA-Z_]/.test(str[i])){
			this.error('Not an identifier: "'+ str[i] +'"', str, i, line) }
		var j = i+1
		while(j < str.length 
				&& /[a-zA-Z0-9_]/.test(str[j])){
			j++ }
		return [ str.slice(i, j), j, line ] },

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
			if(str.slice(i, i+EMPTY.length) == EMPTY){
				index++
				i += EMPTY.length
				if(str[i] == ','){
					i++ }
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
		this.error('Unexpected end of input wile looking for "'+ end +'".', str, i, line) },

	array: function(state, path, match, str, i, line){
		debug.lex('array', str, i, line)
		return this.sequence(
			state, path, str, i+1, line, 
			']',
			function(res, index, str, i, line){
				var obj
				;[obj, i, line] = this.value(state, [...path, index], str, i, line)
				res[index] = obj
				return [res, i, line] }) },
	object: function(state, path, match, str, i, line){
		debug.lex('object', str, i, line)
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
					this.error('Expected ":", got "'+ str[i] +'".', str, i, line) }
				i++
				;[i, line] = this.skipWhitespace(str, i, line)

				// value...
				;[obj, i, line] = this.value(state, [...path, key], str, i, line)
				res[key] = obj
				return [res, i, line] }, 
			{}) },

	set: function(state, path, match, str, i, line){
		debug.lex('set', str, i, line)
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
					str, i, line)
				res.add(obj)
				return [res, i, line] },
			new Set()) 
		if(str[i] != ')'){
			this.error('Expected ")", got "'+ str[i] +'".', str, i, line) }
		return [res, i+1, line] },
	map: function(state, path, match, str, i, line){
		debug.lex('map', str, i, line)
		i += match.length
		;[res, i, line] = this.sequence(
			state, path, 
			str, i+1, line, 
			']',
			function(res, index, str, i, line){
				debug.lex('    map-content', str, i, line)
				var obj
				;[[key, value], i, line] = this.value(
					state, 
					[...path, index], 
					str, i, line)
				res.set(key, value)
				return [res, i, line] },
			new Map()) 
		if(str[i] != ')'){
			this.error('Expected ")", got "'+ str[i] +'".', str, i, line) }
		return [res, i+1, line] },

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
	// 		...need to use serialized paths as keys...
	recursive: function(state, path, match, str, i, line){
		debug.lex('recursive', str, i, line)
		return this.sequence(
			state, path, str, i+match.length, line, 
			'>',
			function(res, index, str, i, line){
				var obj
				;[obj, i, line] = this.array(state, [...path, index], '[', str, i, line)
				var rec = state.recursive ??= []
				rec.push([path, obj])
				return [{}, i, line] }) },

	// NOTE: this uses eval(..) so care must be taken when enabling this...
	func: function(state, path, match, str, i, line){
		if(state.functions == null){
			this.error('Deserializing functions disabled.', str, i, line) }

		debug.lex('function', str, i, line)
		var res
		// length...
		i += match.length
		var [l, i, line] = this.number(state, path, str[i], str, i, line)
		if(str[i] != ','){
			this.error('Expected "," got "'+ str[i] +'"', str, i, line) }
		i++

		// func ref...
		if(state.functions instanceof Array){
			var [n, i, line] = this.number(state, path, str[i+1], str, i+1, line)
			res = state.functions[n]
		// func code...
		} else {
			var code = str.slice(i, i+l)
			i += l
			line += code.split(/\n/g).length
			if(str.slice(i, i+2) == ']>'){
				res = eval?.(code) } }

		if(str.slice(i, i+2) != ']>'){
			this.error('Expected "]>" got "'+ str.slice(i, i+2) +'"', str, i, line) }
		return [res, i+2, line] },

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
			this.error(`Unexpected: ${ str.slice(i, i+10) }`, str, i, line) }

		// value...
		if(typeof(handler) != 'string'){
			return [handler, i+match.length, line] }
		// func...
		return this[handler](state, path, match, str, i, line) },


	parse: function(str, functions){

		// stage 1: build the object...
		var state = {functions}
		var res = this.value(state, [], str)[0] 

		// stage 2: link the recursive structures...
		for(var [a, b] of state.recursive ?? []){
			this.setItem(res, a, this.getItem(res, b)) }

		return res },
}


var deserialize =
module.deserialize =
function(str, functions){
	return eJSON.parse(str, functions) }



//---------------------------------------------------------------------
// utils...

var deepCopy =
module.deepCopy =
function(obj){
	return deserialize(
		serialize(obj)) }


var semiDeepCopy =
module.semiDeepCopy =
function(obj){
	var funcs = []
	return deserialize(
		serialize(obj, null, 0, funcs), 
		funcs) }



/**********************************************************************
* vim:set ts=4 sw=4 nowrap :                        */ return module })
