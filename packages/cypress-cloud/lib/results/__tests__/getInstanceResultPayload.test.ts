import { getInstanceResultPayload } from "../results";
import afterSpecResult from "./fixtures/after:spec.result.json";
import uploadInstancePayload from "./fixtures/uploadInstancePayload.json";

describe("getInstanceResultPayload", () => {
  it("should return the correct payload for a after:spec result", () => {
    expect(getInstanceResultPayload(afterSpecResult)).toEqual(
      uploadInstancePayload
    );
  });
});
