// Get value by path from the object
// Usage: const value = getDeepValue(obj, 'path.to.variable');
module.exports.getDeepValue = (obj, path) => path
  .split('.')
  .reduce(
    (res, prop) => res ? res[prop] : undefined,
    obj
  );

// Converts DID resolver result in a convenient form
module.exports.toChecksObject = checks => checks
  .reduce(
    (a, {
      type,
      passed,
      errors = [],
      warnings = []
    }) => ({
      ...a,
      [type]: {
        passed,
        errors,
        warnings
      }
    }),
    {}
  );
