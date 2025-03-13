

/**
 * Pick properties from `obj` which are in `propertyKeys`.
 * @param {object} obj 
 * @param {string[]} propertyKeys 
 * @returns {object}
 */
function pickProperties(obj, propertyKeys)
{
    return Object.fromEntries(Object.entries(obj).filter(([key, _value]) => {
        return propertyKeys.includes(key);
    }));
}

module.exports = {
    pickProperties
}