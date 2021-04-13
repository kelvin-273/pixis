
var nWise = (n, array) => {
    let iterators = Array(n).fill().map(() => array[Symbol.iterator]());
    iterators.forEach((it, index) => Array(index).fill().forEach(() => it.next()));
    return Array(array.length - n + 1).fill().map(() => (iterators.map(it => it.next().value)));
};

var pairWise = (array) => nWise(2, array);

var sum = (arr) => arr.reduce((a,b)=>a+b);

var range = n => [...Array(n).keys()];

var rand = (min, max) => Math.random() * (max - min) + min;

Array.prototype.last = function() { return this[this.length - 1]; };
var lastAnon = (array) => array[array.length - 1];

var flatten = (array) => array.reduce((flat, toFlatten) => (flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)), []);

export { nWise, pairWise, sum, range, rand, lastAnon, flatten };
