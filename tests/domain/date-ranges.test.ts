import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rangesOverlap } from "@/lib/domain/date-ranges";

describe("date-range domain service", () => {
  it("does not overlap when one range starts exactly when another ends", () => {
    assert.equal(
      rangesOverlap(
        new Date("2026-07-14T10:00:00.000Z"),
        new Date("2026-07-16T10:00:00.000Z"),
        new Date("2026-07-16T10:00:00.000Z"),
        new Date("2026-07-17T10:00:00.000Z"),
      ),
      false,
    );
  });

  it("overlaps when ranges share any positive duration", () => {
    assert.equal(
      rangesOverlap(
        new Date("2026-07-14T10:00:00.000Z"),
        new Date("2026-07-16T10:00:00.000Z"),
        new Date("2026-07-15T10:00:00.000Z"),
        new Date("2026-07-17T10:00:00.000Z"),
      ),
      true,
    );
  });

  it("treats invalid dates as non-overlapping", () => {
    assert.equal(rangesOverlap("not-a-date", new Date(), new Date(), new Date()), false);
  });
});
