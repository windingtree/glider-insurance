const newman = require('newman');
const testsCollection = require('./insurance.json');

// List of tests to skip
const testsToSkip = [];

// Collection filtering method
// and apply the Glider host value
const filterCollection = (collection, skipped) => ({
  ...collection,
  ...({
    item: collection.item.filter(
      t => !skipped.some(skip => RegExp(`^${skip}`).test(t.name))
    )
  }),
  ...({
    variable: collection.variable.map(v => {
      // Manage the tests collection variables

      if (process.env.API_URL && v.key === 'API_URL') {
        v.value = process.env.API_URL;
      }

      return v;
    })
  })
});

newman
  .run({
    collection: filterCollection(testsCollection, testsToSkip),
    reporters: 'cli'
  })
  .on('start', () => {
    console.log('Running tests...');

    if (testsToSkip.length > 0) {
      console.log('Skipped tests:', testsToSkip);
    }
  })
  .on('done', (err) => {

    if (err) {
      console.log('Error(s) occurred during tests');
      throw err;
    }

    console.log('All tests are complete.');
  });
