# Nest CLI

Nest's official CLI to manage your modules

> **NOTE** `nest` is under development and non operational. Until official
> release, [eggs](https://github.com/nestdotland/eggs) is the official CLI.

## Getting started

**INSTALL**

```sh
deno install -Af https://nest.land/-/nest/nest.ts
```

**PUBLISH**

Log into your Nest account

```sh
nest login <username> <auth_token>
```

Initialize a nest module

```sh
cd <module directory>
nest init <name> # follow the prompts
```

Publish to Nest

```sh
nest publish <version>
```

## Contributing

**REQUIREMENTS**

Deno: `>=v1.7.0`

## License

The contents of this repository are licensed under [The MIT license](LICENSE).
