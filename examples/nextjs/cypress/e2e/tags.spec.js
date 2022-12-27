describe("Test", { tags: ["tag1", "tag2"] }, function () {
  it("run #1", function () {
    cy.wait(1000);
  });
});

describe("Test2", { tags: ["tag3"] }, function () {
  it("run #1", function () {
    cy.wait(1000);
  });
});

describe("Test3", function () {
  it("run #1", function () {
    cy.wait(1000);
  });
});
