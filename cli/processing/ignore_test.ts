import { assertEquals, projectRoot, resolve } from "../test/deps.ts";
import { Ignore } from "./ignore.ts";

Deno.test({
  name: "CLI | ignore | parseLine",
  fn() {
    const src = [
      "@extends .gitignore",
      "@extends ./dir/*",
      ".git/*",
      "test/*",
      "foo",
      "   foo",
      "   f o o",
      "   f\\ o\\  o",
      "./foo",
      "foo/",
      "foo/bar",
      "!test/should_keep_this.ts",
      "\\!test/should_ignore_this.ts",
      "# this is a comment",
      "    # this is a comment, just a bit indented",
    ];

    const parsed = src.map((line) => Ignore.parseLine(line));
    const denied = parsed.filter((result) => result?.status === "denies").map((
      result,
    ) => result?.value) as RegExp[];
    const accepted = parsed.filter((result) => result?.status === "accepts")
      .map((result) => result?.value) as RegExp[];
    const extended = parsed.filter((result) => result?.status === "extends")
      .map((result) => result?.value) as string[];

    if (Deno.build.os === "windows") {
      assertEquals(denied, [
        /^(?:\\|\/)+\.git(?:\\|\/)+[^\\/]*(?:\\|\/)*$|^(?:\\|\/)+\.git(?:\\|\/)+[^\\/]*(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:\\|\/)+test(?:\\|\/)+[^\\/]*(?:\\|\/)*$|^(?:\\|\/)+test(?:\\|\/)+[^\\/]*(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*f o o(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*f o o(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:\\|\/)+\.(?:\\|\/)+foo(?:\\|\/)*$|^(?:\\|\/)+\.(?:\\|\/)+foo(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*foo(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:\\|\/)+foo(?:\\|\/)+bar(?:\\|\/)*$|^(?:\\|\/)+foo(?:\\|\/)+bar(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:\\|\/)+\!test(?:\\|\/)+should_ignore_this\.ts(?:\\|\/)*$|^(?:\\|\/)+\!test(?:\\|\/)+should_ignore_this\.ts(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
      ]);
      assertEquals(accepted, [
        /^(?:\\|\/)+test(?:\\|\/)+should_keep_this\.ts(?:\\|\/)*$|^(?:\\|\/)+test(?:\\|\/)+should_keep_this\.ts(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        ,
      ]);
    } else {
      assertEquals(denied, [
        /^\/+\.git\/+[^/]*\/*$|^\/+\.git\/+[^/]*\/+(?:[^/]*(?:\/|$)+)*$/,
        /^\/+test\/+[^/]*\/*$|^\/+test\/+[^/]*\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*foo\/*$|^(?:[^/]*(?:\/|$)+)*foo\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*foo\/*$|^(?:[^/]*(?:\/|$)+)*foo\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*foo\/*$|^(?:[^/]*(?:\/|$)+)*foo\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*f o o\/*$|^(?:[^/]*(?:\/|$)+)*f o o\/+(?:[^/]*(?:\/|$)+)*$/,
        /^\/+\.\/+foo\/*$|^\/+\.\/+foo\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*foo\/+(?:[^/]*(?:\/|$)+)*$/,
        /^\/+foo\/+bar\/*$|^\/+foo\/+bar\/+(?:[^/]*(?:\/|$)+)*$/,
        /^\/+\!test\/+should_ignore_this\.ts\/*$|^\/+\!test\/+should_ignore_this\.ts\/+(?:[^/]*(?:\/|$)+)*$/,
      ]);
      assertEquals(accepted, [
        /^\/+test\/+should_keep_this\.ts\/*$|^\/+test\/+should_keep_this\.ts\/+(?:[^/]*(?:\/|$)+)*$/,
      ]);
    }
    assertEquals(extended, ["**/.gitignore", "/./dir/*"]);
  },
});

Deno.test({
  name: "CLI | ignore | parse",
  async fn() {
    const wd = resolve(projectRoot, "./test/ignore/");

    const ignore = new Ignore("parse", wd);

    await ignore.parsingProcess;

    if (Deno.build.os === "windows") {
      assertEquals(ignore.denied, [
        /^(?:[^\\/]*(?:\\|\/|$)+)*bar(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*bar(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*bar2(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*bar2(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
        /^(?:[^\\/]*(?:\\|\/|$)+)*bar1(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*bar1(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
      ]);
      assertEquals(ignore.accepted, [
        /^(?:[^\\/]*(?:\\|\/|$)+)*bar3(?:\\|\/)*$|^(?:[^\\/]*(?:\\|\/|$)+)*bar3(?:\\|\/)+(?:[^\\/]*(?:\\|\/|$)+)*$/,
      ]);
    } else {
      assertEquals(ignore.denied, [
        /^(?:[^/]*(?:\/|$)+)*bar\/*$|^(?:[^/]*(?:\/|$)+)*bar\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*bar1\/*$|^(?:[^/]*(?:\/|$)+)*bar1\/+(?:[^/]*(?:\/|$)+)*$/,
        /^(?:[^/]*(?:\/|$)+)*bar2\/*$|^(?:[^/]*(?:\/|$)+)*bar2\/+(?:[^/]*(?:\/|$)+)*$/,
      ]);
      assertEquals(ignore.accepted, [
        /^(?:[^/]*(?:\/|$)+)*bar3\/*$|^(?:[^/]*(?:\/|$)+)*bar3\/+(?:[^/]*(?:\/|$)+)*$/,
      ]);
    }
  },
});

Deno.test({
  name: "CLI | ignore | matchFiles",
  async fn() {
    const wd = resolve(projectRoot, "./test/ignore/");

    const ignore = new Ignore("matchFiles", wd);

    const files = await ignore.matchFiles();

    assertEquals(files, [
      "/dir/foo",
      "/files/2",
      "/files/4",
      "/files/5",
      "/matchFiles",
    ]);
  },
});
