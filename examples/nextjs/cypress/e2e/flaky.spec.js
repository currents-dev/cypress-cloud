let i = 3;
describe('Retries', function () {
  it(
    'Runs a test with retries',
    {
      retries: 3,
    },
    function () {
      if (i > 1) {
        i--;
		throw new Error('oh!');
      }
      return;
    }
  );
});
