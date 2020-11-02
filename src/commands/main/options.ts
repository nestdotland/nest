import type { Option } from "../../utilities/types.ts";

export const mainOptions: Option[] = [
  {
    flag: "-h, --help",
    description: "Show this help",
  },
  {
    flag: "-V, --version",
    description: "Display version number",
  },
  {
    flag: "-L, --log-level",
    argument: "<level>",
    description: "Set log level",
  },
  {
    flag: "-l, --log",
    argument: "<path>",
    description: "Specify filepath to output logs",
  },
  {
    flag: "-G, --gui",
    description: "Perform the task in the gui",
  },
];
