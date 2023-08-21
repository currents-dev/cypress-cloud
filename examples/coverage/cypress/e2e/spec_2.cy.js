// enables intelligent code completion for Cypress commands
// https://on.cypress.io/intelligent-code-completion
/// <reference types="Cypress" />

import { add } from "../../unit";

context("Unit tests", () => {
  it("adds numbers", () => {
    expect(add(2, 3)).to.equal(5);
  });

  it("concatenates strings", () => {
    expect(add("foo", "Bar")).to.equal("fooBar");
  });
});
