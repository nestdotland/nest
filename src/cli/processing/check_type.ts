import { blue, bold, underline } from "../deps.ts";
import { log } from "../utils/log.ts";

export type TypeOf = "boolean" | "string" | "number" | "object" | "array";

interface CheckType {
  checkType(
    name: string,
    value: unknown,
    type: ["boolean"],
    required?: boolean,
  ): value is boolean;
  checkType(
    name: string,
    value: unknown,
    type: ["string"],
    required?: boolean,
  ): value is string;
  checkType(
    name: string,
    value: unknown,
    type: ["number"],
    required?: boolean,
  ): value is number;
  checkType(
    name: string,
    value: unknown,
    type: ["object"],
    required?: boolean,
  ): value is Record<string, unknown>;
  checkType(
    name: string,
    value: unknown,
    type: ["array"],
    required?: boolean,
  ): value is unknown[];
  checkType(
    name: string,
    value: unknown,
    type: TypeOf[],
    required?: boolean,
  ): boolean;
  typeError(): boolean;
}

// TODO(oganexon): refactor this function (hard to understand)
export function setupCheckType(file = ""): CheckType {
  file = file ? bold(file) : "";
  let wrongType = false;
  return {
    checkType: function (
      name: string,
      value: unknown,
      type: TypeOf[],
      required = false,
    ): boolean {
      if (value === undefined) {
        if (required) {
          log.error(
            `${file ? `${file}: ` : ""}${underline(name)} is required.`,
          );
          wrongType = true;
        }
        return false;
      }
      if (
        !type.reduce(
          (previous: boolean, current: TypeOf) =>
            previous ||
            (current === "array" ? Array.isArray(value) : (current === "object"
              ? typeof value === "object" && value !== null &&
                !Array.isArray(value)
              : typeof value === current)),
          false,
        )
      ) {
        log.error(
          `${file ? `${file}: ` : ""}${underline(name)} should be of type ${
            blue(type.join(" or "))
          }. Received`,
          value,
        );
        wrongType = true;
        return false;
      }
      return true;
    } as CheckType["checkType"],
    typeError() {
      return wrongType;
    },
  };
}
