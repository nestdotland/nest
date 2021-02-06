import { assertEquals } from "../test/deps.ts";
import { setupCheckType, TypeOf } from "./check_type.ts";

type Arguments = [value: unknown, type: TypeOf[], required: boolean];

// TODO(oganexon): clearer test
const units: [args: Arguments, result: boolean, wrongType: boolean][] = [
  // not required, undefined
  [[undefined, ["boolean"], false], false, false],
  [[undefined, ["string"], false], false, false],
  [[undefined, ["number"], false], false, false],
  [[undefined, ["object"], false], false, false],
  [[undefined, ["array"], false], false, false],
  // required, undefined
  [[undefined, ["boolean"], true], false, true],
  [[undefined, ["string"], true], false, true],
  [[undefined, ["number"], true], false, true],
  [[undefined, ["object"], true], false, true],
  [[undefined, ["array"], true], false, true],
  // not required, right type
  [[true, ["boolean"], false], true, false],
  [["", ["string"], false], true, false],
  [[0, ["number"], false], true, false],
  [[{}, ["object"], false], true, false],
  [[[], ["array"], false], true, false],
  // not required, boolean, wrong type
  [["", ["boolean"], false], false, true],
  [[0, ["boolean"], false], false, true],
  [[{}, ["boolean"], false], false, true],
  [[[], ["boolean"], false], false, true],
  [[Symbol, ["boolean"], false], false, true],
  // not required, string, wrong type
  [[true, ["string"], false], false, true],
  [[0, ["string"], false], false, true],
  [[{}, ["string"], false], false, true],
  [[[], ["string"], false], false, true],
  [[Symbol, ["string"], false], false, true],
  // not required, number, wrong type
  [[true, ["number"], false], false, true],
  [["", ["number"], false], false, true],
  [[{}, ["number"], false], false, true],
  [[[], ["number"], false], false, true],
  [[Symbol, ["number"], false], false, true],
  // not required, object, wrong type
  [[true, ["object"], false], false, true],
  [["", ["object"], false], false, true],
  [[0, ["object"], false], false, true],
  [[[], ["object"], false], false, true],
  [[Symbol, ["object"], false], false, true],
  // not required, array, wrong type
  [[true, ["array"], false], false, true],
  [["", ["array"], false], false, true],
  [[0, ["array"], false], false, true],
  [[{}, ["array"], false], false, true],
  [[Symbol, ["array"], false], false, true],
  // not required, multiple types, right types
  [["", ["string", "number"], false], true, false],
  [[0, ["string", "number"], false], true, false],
  [[true, ["boolean", "string"], false], true, false],
  [["", ["boolean", "string"], false], true, false],
  // not required, multiple types, wrong types
  [[[], ["string", "number"], false], false, true],
  [[{}, ["string", "number"], false], false, true],
  [[0, ["boolean", "string"], false], false, true],
  [[[], ["boolean", "string"], false], false, true],
];

Deno.test({
  name: "CLI | check_type | checkType",
  fn() {
    for (const [args, result, wrongType] of units) {
      const { checkType, typeError } = setupCheckType();
      const actual = [checkType("", ...args), typeError()];
      assertEquals(
        actual,
        [result, wrongType],
        `${Deno.inspect([args, result, wrongType], { colors: true })} != ${
          Deno.inspect(actual, { colors: true })
        }`,
      );
    }
  },
});
