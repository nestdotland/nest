import { assert, assertEquals } from "../test/deps.ts";
import * as diff from "./diff.ts";

const obj1 = [
  "same",
  "I am changed",
  "",
  "moved",
  "same",
  "same",
  "added",
];

const obj3 = [
  "same",
  "changed",
  "moved",
  "",
  "same",
  "removed",
  "same",
];

const obj4 = [
  "new1",
  "I am changed",
  "new3",
  "new4",
  "new5",
  "new6",
];

Deno.test({
  name: "CLI | diff | compare",
  fn() {
    assertEquals(
      diff.compare(obj1, obj3),
      [{
        type: "common",
        value: "same",
      }, {
        oldValue: "changed",
        type: "updated",
        value: "I am changed",
      }, {
        type: "removed",
        value: "moved",
      }, {
        type: "common",
        value: "",
      }, {
        type: "added",
        value: "moved",
      }, {
        type: "common",
        value: "same",
      }, {
        type: "removed",
        value: "removed",
      }, {
        type: "common",
        value: "same",
      }, {
        type: "added",
        value: "added",
      }],
    );
  },
});

Deno.test({
  name: "CLI | diff | apply",
  fn() {
    const result = diff.apply(diff.compare(obj1, obj3), obj4);

    assertEquals(result, [
      "new1",
      "I am changed",
      "new3",
      "moved",
      "new4",
      "new5",
      "added",
      "new6",
    ]);
  },
});
