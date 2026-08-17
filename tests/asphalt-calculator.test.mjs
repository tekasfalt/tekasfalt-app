import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAsphaltRequirement,
  calculateManualAsphaltRequirement,
} from "../src/features/asphalt-calculator/domain/calculateAsphaltRequirement.js";

test("manual dimensions use zero reserve by default", () => {
  const result = calculateManualAsphaltRequirement({
    lengthCentimeters: 100,
    widthCentimeters: 100,
    averageDepthCentimeters: 15,
  });

  assert.equal(result.surfaceAreaSquareMeters, 1);
  assert.equal(result.volumeCubicMeters, 0.15);
  assert.equal(result.netKilograms, 330);
  assert.equal(result.wasteKilograms, 0);
  assert.equal(result.kilograms, 330);
  assert.equal(result.buckets, 14);
});

test("an integrated measured volume wins over rectangular dimensions", () => {
  const result = calculateAsphaltRequirement({
    lengthMeters: 2,
    widthMeters: 2,
    averageDepthMeters: 0.2,
    surfaceAreaSquareMeters: 2.4,
    volumeCubicMeters: 0.12,
  });

  assert.equal(result.surfaceAreaSquareMeters, 2.4);
  assert.equal(result.volumeCubicMeters, 0.12);
  assert.equal(result.netKilograms, 264);
  assert.equal(result.wasteKilograms, 0);
  assert.equal(result.kilograms, 264);
  assert.equal(result.buckets, 11);
});

test("an explicitly selected reserve is added before rounding bucket count", () => {
  const result = calculateManualAsphaltRequirement({
    lengthCentimeters: 100,
    widthCentimeters: 100,
    averageDepthCentimeters: 15,
    wasteFactor: 0.08,
  });

  assert.equal(result.netKilograms, 330);
  assert.equal(result.wasteKilograms, 26.4);
  assert.equal(result.kilograms, 356.4);
  assert.equal(result.buckets, 15);
});

test("invalid measurements are rejected instead of silently corrupting a quote", () => {
  assert.throws(
    () =>
      calculateAsphaltRequirement({
        lengthMeters: -1,
        widthMeters: 1,
        averageDepthMeters: 0.1,
      }),
    RangeError,
  );
});
