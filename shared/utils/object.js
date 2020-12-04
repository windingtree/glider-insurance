// Get value by path from the object
// Usage: const value = getDeepValue(obj, 'path.to.variable');
module.exports.getDeepValue = (obj, path) => path
  .split('.')
  .reduce(
    (res, prop) => res ? res[prop] : undefined,
    obj
  );
