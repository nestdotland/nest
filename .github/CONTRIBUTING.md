# Contributing

Contributions are welcome. Fork this repository and issue a pull request with
your changes.

### Prerequisites

You need to have [Git](https://git-scm.com/downloads) and
[deno](https://deno.land) installed on your system.

### Setting up Dev

You'll need to clone the repository and install the required packages.

```shell
git clone https://github.com/nestdotland/nest.git
cd nest
```

### Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available,
see the
[link to releases on this repository](https://github.com/nestdotland/nest/releases).

### Style Guide

```shell
deno fmt
deno --unstable lint
```

This project uses deno's integrated linter and formater. Please respect this
convention.

You can install a
[plugin](https://deno.land/manual@v1.7.2/getting_started/setup_your_environment#editors-and-ides)
for your favorite editor if you want.

- Use the latest standard modules as much as possible
- Use ASCII for stdout as much as possible
- Avoid using `--unstable` APIs
- Follow
  [Deno Style Guide](https://deno.land/manual@v1.7.2/contributing/style_guide)

### Testing

```shell
deno test -A
```

### Pull Request

Please PR to the `dev` branch! (`main` branch while no stable release is
published) Then follow on of the
[pull request templates](.github/PULL_REQUEST_TEMPLATE/).

Make sure that `deno fmt`, `deno --unstable lint`, and `deno test -A` do not
generate errors before submitting a PR.
