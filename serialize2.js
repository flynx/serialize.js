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

//
// 	serialize(obj[, indent[, depth]])
// 		-> str
//
// 	indent can be:
// 		number	- number of spaces to use for indent
// 		string	- string to use for indenting
//
//
// 	serialize(obj, path, seen, indent, depth)
// 		-> str
//
//
// XXX add function support...
// XXX need to destinguish between map key and value in path...
// XXX BUG: using non-whitespace as indent breaks the depth of the first 
// 		or last elements in sequences
// 		...breaks .trim*() in Map/Set/Object...
var serialize = 
module.serialize = 
function(obj, path=[], seen=new Map(), indent, depth=0){
	// args...
	var args = [...arguments].slice(1)
	if(typeof(args[0]) == 'number' 
			|| typeof(args[0]) == 'string'){
		indent = args.shift() }
	indent = 
		typeof(indent) == 'number' ?
			' '.repeat(indent)
			: indent
	if(typeof(args[0]) == 'number'){
		depth = args.shift() }
	;[path, seen] = args
	path ??= []
	seen ??= new Map()


	// recursive...
	var p = seen.get(obj)
	if(p != null){
		// NOTE: serialize(..) is always printed flat here, regardless of indent/depth...
		return RECURSIVE.replace('%', serialize(p)) }

	// XXX functions...
	// XXX

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
					serialize(obj[i], [...path, i], seen, indent, depth+1)
					: EMPTY) }
	} else if(obj instanceof Map){
		pre = 'Map(['
		post = '])'
		elems = [
			serialize([...obj], path, seen, indent, depth)
				.slice(1, -1)
				.trim() ]
	} else if(obj instanceof Set){
		pre = 'Set(['
		post = '])'
		elems = [
			serialize([...obj], path, seen, indent, depth)
				.slice(1, -1)
				.trim() ]
	} else {
		pre = '{'
		post = '}'
		for(var [k, v] of Object.entries(obj)){
			elems.push(`${ 
					JSON.stringify(k) 
				}:${ indent != null ? ' ' : '' }${ 
					serialize(v, [...path, k], seen, indent, depth+1)
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



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// XXX better error handling...
// XXX add function support...
// XXX try and make this single stage (see notes for : .recursive(..))
// XXX BUG: deserialize('Set([1,2,3])') -> Set([3])
// XXX BUG: deserialize('Map([[1,2],[3,4]])')) -> err
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
	// XXX TEST count \\n
	string: function(state, path, match, str, i, line){
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
		this.error('Unexpected end of input wile looking for "'+ end +'".', str, i, line) },

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
					this.error('Expected ":", got "'+ str[i] +'".', str, i, line) }
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
			this.error('Expected ")", got "'+ str[i] +'".', str, i, line) }
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
			this.error('Expected ")", got "'+ str[i] +'".', str, i, line) }
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
	// 		...need to use serialized paths as keys...
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
			this.error(`Unexpected: ${ str[i] }`, str, i, line) }

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
