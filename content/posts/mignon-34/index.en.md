---
title: 'BEAM Tools'
description:
  'Erlang and Elixir updated, installed and working in less than 3 minutes'
toc: true
date: 2022-09-27T21:00:00+02:00
series: ['beamtools']
tags: ['tools']
featured_image: 'images/featured/34.jpg'
---

## What is BEAM Tools ?

[beamtools](https://meta-erlang.github.io/#/guides-beamtools) is a set of
software which install Erlang and Elixir version ready to use. Without waste
time compiling the most up-to-date versions. It is available for Linux users and
is an alternative for the Erlang and Elixir installation methods.

Currently, when we want to install Erlang and Elixir we have a few choices:

- delegates to Linux distribution packages. While the install process is easy
  and usual, The available versions could not be the latest one
- build using version management tool like
  [kerl][kerl](https://github.com/kerl/kerl). That is a better approach to get
  the most recent version and the user wants to control build flags
- download and install a ready package from
  [Erlang Solutions](https://www.erlang-solutions.com/downloads/). That is a
  feasible approach too, but is not possible to customize the build process
- get Erlang source code and follow the
  [Erlang OTP](https://github.com/erlang/otp/blob/master/HOWTO/INSTALL.md)
  install procedures

All of the above options work. However, beamtools could be an option to install
a BEAM development suite delivering:

- Erlang
- Elixir
- rebar3
- elvis
- erlfmt

beamtools is installed from a selfcontent file and available at
[beamtools releases](https://github.com/meta-erlang/meta-erlang/releases) pages.
Each release is a set of latest versions from the above listed softwares. And
the minimal requirement is a modern Linux distribution.

## Install and use

Get the beamtool:

```bash
$ wget https://github.com/meta-erlang/meta-erlang/releases/download/beamtools-0.4.0/x86_64-beamtools-nativesdk-standalone-4.0.1-erlang-25.0-elixir-1.13.3.sh
```

Let's check which options the selfcontent installation script provides:

```bash
$ sh ./x86_64-beamtools-nativesdk-standalone-4.0.1-erlang-25.0-elixir-1.13.3.sh --help
Usage: x86_64-beamtools-nativesdk-standalone-4.0.1-erlang-25.0-elixir-1.13.3.sh [-y] [-d <dir>]
  -y         Automatic yes to all prompts
  -d <dir>   Install the SDK to <dir>
======== Extensible SDK only options ============
  -n         Do not prepare the build system
  -p         Publish mode (implies -n)
======== Advanced DEBUGGING ONLY OPTIONS ========
  -S         Save relocation scripts
  -R         Do not relocate executables
  -D         use set -x to see what is going on
  -l         list files that will be extracted
```

To install it, the best options is to install into a local folder and saying
_yes_ for all questions. Like this:

```bash
$ sh ./x86_64-beamtools-nativesdk-standalone-4.0.1-erlang-25.0-elixir-1.13.3.sh -y -d $HOME/beamtools/4.0.1-erlang-25.0-elixir-1.13.3
```

After that, for all shells where we want to call _erl_ or _iex_, we just have to
initialize a script which configures the current shell variables. The most
important variable is _PATH_ which points to the right places where erl and iex
were installed:

```bash
$HOME/beamtools/4.0.1-erlang-25.0-elixir-1.13.3/environment-setup-x86_64-pokysdk-linux
```

That's all, from now and beyond, for the current shell just calling erl or iex.
Also the [Observer](https://www.erlang.org/doc/man/observer.html) application is
also available without installing anything more (like wxWidgets).

All softwares delivered by beamtools are built from source code using
[Yocto Project](https://docs.yoctoproject.org/index.html) and the
[meta-erlang](https://github.com/meta-erlang/meta-erlang). More details could be
find at
[BEAM Tools documentação](https://meta-erlang.github.io/#/guides-beamtools).
