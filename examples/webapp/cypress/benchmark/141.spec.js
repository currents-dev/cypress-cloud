const { getWaitValue } = require("./random");

describe("Wikipedia", function () {
  it(
    "Runs a test",
    {
      retries: 3,
    },
    function () {
      const waitValue = getWaitValue();
      console.log({ waitValue });
      cy.wait(waitValue);
      if (waitValue < 2000) {
        expect(true).to.eq(false);
      }
    }
  );
});
