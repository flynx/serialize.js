# serilize.js: Extended JSON serilization

This extends the default JSON serialization adding the following:
- Recursive data structure serialization
- `undefined`/`NaN` serialization
- `Set`/`Map` serialization
- Function serialization (off by default)
- Deep and partial-deep cleen object copy

Possible differences to JSON output:
- Repeating long strings and BigInts can be referenced instead of 
  reincluded in the output.


## Motivation

This was originally built as a companion to a testing module for a 
programming class, illustrating several concepts, including: guaranteed 
clean isolation of data structures via serialization, instrumenting code 
and tooling design, basic parsing, among others.



## Installation

```shell
$ npm install ig-serilaize
```

Or just download and drop [serialize.js](serialize.js) into your code.



## Introduction


### Serializing functions

Due to how JavaScript is designed it is not possible to trivially and 
fully clone a function with all of it's references, `.serilaize(..)` will
not attempt to clone any state a function may have, this will lead to 
loosing:

- Function closure
- Attributes set on the function or any of it's prototypes, including the
  `.__proto__` value if it was changed.
 
Thus, care must be taken when serializing structures containing function.



## API

### `serialize(..)` / `eJSON.stringify(..)`

### `deserialize(..)` / 'eJSON.parse(..)'

### `deepCopy(..)`

### `partialDeepCopy(..)`


### `MIN_LENGTH_REF` / `<options>.min_length_ref` 

Defines the default minimum length of repeating string or bin-int to 
include as a reference in the output.

If set to `0`, referencing will be disabled.

Default: 96  


### `DEBUG`



## Format

The output of `.serialize(..)` is a strict superset of [standard JSON](https://www.json.org/json-en.html), 
while the input format is a bit more relaxed than in several details.

Extensions to JSON:
- Recursion
- undefined / NaN
- BigInt
- Map / Set
- Function

### Structural paths

### Recursion

If an object is encountered 

### null types

### BigInt

### Map / Set

### Functions







