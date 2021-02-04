import { assertEquals } from "../test/deps.ts";
import { computeVersion } from "./publish.ts";

Deno.test({
  name: "CLI | publish | computeVersion",
  async fn() {
    assertEquals(
      (await computeVersion("1.2.3", "1.0.0", false)).format(),
      "1.2.3",
    );
    assertEquals(
      (await computeVersion("patch", "1.0.0", false)).format(),
      "1.0.1",
    );
    assertEquals(
      (await computeVersion("minor", "1.0.0", false)).format(),
      "1.1.0",
    );
    assertEquals(
      (await computeVersion("major", "1.0.0", false)).format(),
      "2.0.0",
    );

    assertEquals(
      (await computeVersion("1.2.3", "1.0.0", true)).format(),
      "1.2.3-0",
    );
    assertEquals(
      (await computeVersion("patch", "1.0.0", true)).format(),
      "1.0.1-0",
    );
    assertEquals(
      (await computeVersion("minor", "1.0.0", true)).format(),
      "1.1.0-0",
    );
    assertEquals(
      (await computeVersion("major", "1.0.0", true)).format(),
      "2.0.0-0",
    );

    assertEquals(
      (await computeVersion("1.2.3", "1.0.0", "beta")).format(),
      "1.2.3-beta.0",
    );
    assertEquals(
      (await computeVersion("patch", "1.0.0", "rc")).format(),
      "1.0.1-rc.0",
    );
    assertEquals(
      (await computeVersion("minor", "1.0.0", "asdf")).format(),
      "1.1.0-asdf.0",
    );
    assertEquals(
      (await computeVersion("major", "1.0.0", "pre")).format(),
      "2.0.0-pre.0",
    );
  },
});
