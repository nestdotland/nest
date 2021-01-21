import { assert, assertEquals } from "../../test/deps.ts";
import { Json } from "../utilities/types.ts";
import { applyJsonDiff, compareJson, isJsonUnchanged } from "./json.ts";

const obj1: Json = {
  a: "i am unchanged",
  c: "i am created",
  e: {
    a: "1",
    b: "",
    d: "created",
  },
  f: [{
    a: "same",
    b: [{
      a: "same",
    }, {
      c: "create",
    }],
  }, 1],
};

const obj2: Json = {
  a: "i am unchanged",
  c: "i am created",
  e: {
    a: "1",
    b: "",
    d: "created",
  },
  f: [{
    a: "same",
    b: [{
      a: "same",
    }, {
      c: "create",
    }],
  }, 1],
};

const obj3: Json = {
  a: "i am unchanged",
  b: "i am deleted",
  e: {
    a: 1,
    b: false,
    c: null,
  },
  f: [1, {
    a: "same",
    b: [{
      a: "same",
    }, {
      d: "delete",
    }],
  }],
};
const obj4: Json = {
  a: "new",
  b: "new",
  c: "new",
  d: "new",
  e: {
    a: "new",
    b: "new",
    c: "new",
  },
  f: ["new", {
    a: "new",
    b: [{
      a: "new",
    }, {
      d: "new",
    }],
  }],
};

Deno.test({
  name: "CLI | json | compareJson",
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
            }],
            ["b", {
              type: "updated",
              value: "",
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
            type: "updated",
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
            type: "updated",
            value: 1,
          },
        ]],
      ]),
    );
  },
});

Deno.test({
  name: "CLI | json | isJsonUnchanged",
  fn() {
    const diff1 = compareJson(obj1, obj1);
    const diff2 = compareJson(obj1, obj2);
    const diff3 = compareJson(obj2, obj3);

    assert(isJsonUnchanged(diff1));
    assert(isJsonUnchanged(diff2));
    assert(!isJsonUnchanged(diff3));
  },
});

Deno.test({
  name: "CLI | json | applyJsonDiff",
  fn() {
    const diff = compareJson(obj1, obj3);

    const result = applyJsonDiff(diff, obj4);

    assertEquals(result, {
      a: "new",
      c: "i am created",
      d: "new",
      e: {
        a: "1",
        b: "",
        d: "created",
      },
      f: [{
        a: "same",
        b: [{
          a: "same",
        }, {
          c: "create",
        }],
      }, 1],
    });
  },
});
