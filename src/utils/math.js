

// straight outta Mozilla docs
function randInt(min, max)
{
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function argSort(array, compareFn)
{
    const idxArray = array.map((val, idx) => [val, idx]);
    idxArray.sort((a,b) => compareFn(a[0], b[0]));
    return idxArray.map(val => val[1]);
}

module.exports = {
    randInt,
    argSort
}