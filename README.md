# serilize.js: Extended JSON serilization

This extends the default JSON serialization adding the following:
- Recursive data structure serialization
- `undefined`/`NaN` serialization
- `Set`/`Map` serialization
- Function serialization (off by default)
- Deep and partial-deep cleen object copy



## Motivation

This was originally built as a companion to a testing module for a 
programming class, illustrating several concepts, including: guaranteed 
clean isolation of data structures via serialization, instrumenting code 
and tooling design, basic parsing, among others.



## Installation


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


## Format

The output of `.serialize(..)` is a strict superset of standard JSON, 
while the input format is a bit more relaxed than in several details.

Extensions to JSON:
- Recursion
- null types
- BigInt
- Map / Set
- Function

### Structural paths

### Recursion

### null types

### BigInt

### Map / Set

### Functions







