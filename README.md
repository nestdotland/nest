# Nest CLI

Nest's official CLI to manage your modules

## Notice

This repo is a WIP for the new CLI of nest, I'll add this on the readme to make it clearer, sorry for the confusion.
Until the stable release of nest, the current CLI is [eggs](https://github.com/nestdotland/eggs).

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
