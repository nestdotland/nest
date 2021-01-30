import { assert, assertEquals } from "../test/deps.ts";
import { Json } from "../utilities/types.ts";
import { applyJsonDiff, compareJson, isJsonUnchanged } from "./json_diff.ts";

const obj1: Json = {
  a: "i am unchanged",
  c: "i am created",
  e: {
    a: "1",
    b: "",
    d: "created",
  },
  f: [
    {
      a: "same",
      b: [{
        a: "same",
      }, {
        c: "create",
      }],
    },
    0,
    1,
    "a",
    "b",
    2,
    3,
    5,
  ],
};

const obj2: Json = {
  a: "i am unchanged",
  c: "i am created",
  e: {
    a: "1",
    b: "",
    d: "created",
  },
  f: [
    {
      a: "same",
      b: [{
        a: "same",
      }, {
        c: "create",
      }],
    },
    0,
    1,
    "a",
    "b",
    2,
    3,
    5,
  ],
};

const obj3: Json = {
  a: "i am unchanged",
  b: "i am deleted",
  e: {
    a: 1,
    b: false,
    c: null,
  },
  f: [
    1,
    {
      a: "same",
      b: [{
        a: "same",
      }, {
        d: "delete",
      }],
    },
    "d",
    "c",
    2,
    3,
    4,
  ],
};

const obj4: Json = {
  a: "new_a",
  b: "new_b",
  c: "new_c",
  d: "new_d",
  e: {
    a: "new_a",
    b: "new_b",
    c: "new_c",
  },
  f: [
    "new_1",
    {
      a: "new_a",
      b: [{
        a: "new_a",
      }, {
        d: "new_d",
      }],
    },
    "new_2",
    "new_3",
    "new_4",
  ],
};

Deno.test({
  name: "CLI | json_diff | compareJson",
  fn() {
    assertEquals(
      compareJson(obj1, obj3),
      new Map<string, unknown>([
        ["a", {
          type: "common",
          value: "i am unchanged",
        }],
        ["b", {
          type: "removed",
          value: "i am deleted",
        }],
        ["c", {
          type: "added",
          value: "i am created",
        }],
        [
          "e",
          new Map([
            ["a", {
              type: "updated",
              value: "1",
              oldValue: 1,
            }],
            ["b", {
              type: "updated",
              value: "",
              oldValue: false,
            }],
            ["c", {
              type: "removed",
              value: null,
            }],
            ["d", {
              type: "added",
              value: "created",
            }],
          ]),
        ],
        ["f", [
          {
            type: "added",
            value: {
              a: "same",
              b: [
                {
                  a: "same",
                },
                {
                  c: "create",
                },
              ],
            },
          },
          {
            type: "added",
            value: 0,
          },
          {
            type: "common",
            value: 1,
          },
          {
            type: "updated",
            value: "a",
            oldValue: {
              a: "same",
              b: [
                {
                  a: "same",
                },
                {
                  d: "delete",
                },
              ],
            },
          },
          {
            type: "updated",
            value: "b",
            oldValue: "d",
          },
          {
            type: "removed",
            value: "c",
          },
          {
            type: "common",
            value: 2,
          },
          {
            type: "common",
            value: 3,
          },
          {
            type: "updated",
            value: 5,
            oldValue: 4,
          },
        ]],
      ]),
    );
  },
});

Deno.test({
  name: "CLI | json_diff | isJsonUnchanged",
  fn() {
    const diff1 = compareJson(obj1, obj1);
    const diff2 = compareJson(obj1, obj2);
    const diff3 = compareJson(obj2, obj3);

    assert(isJsonUnchanged(diff1), "obj1 vs obj1");
    assert(isJsonUnchanged(diff2), "obj1 vs obj2");
    assert(!isJsonUnchanged(diff3), "obj2 vs obj3");
  },
});

Deno.test({
  name: "CLI | json_diff | applyJsonDiff",
  fn() {
    const diff = compareJson(obj1, obj3);

    const result = applyJsonDiff(diff, obj4);

    assertEquals(result, {
      a: "new_a",
      c: "i am created",
      d: "new_d",
      e: {
        a: "1",
        b: "",
        d: "created",
      },
      f: [
        {
          a: "same",
          b: [{
            a: "same",
          }, {
            c: "create",
          }],
        },
        0,
        "new_1",
        {
          a: "new_a",
          b: [
            {
              a: "new_a",
            },
            {
              d: "new_d",
            },
          ],
        },
        "a",
        "new_2",
        "b",
        "new_3",
        "new_4",
        5,
      ],
    });
  },
});
