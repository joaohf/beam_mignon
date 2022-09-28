---
title: 'BEAM Tools'
description: 'Erlang e Elixir atual, instalado e funcional em menos de 3 minutos'
toc: true
date: 2022-09-27T21:00:00+02:00
series: ['beamtools']
tags: ['tools']
featured_image: 'images/featured/34.jpg'
---

## O que é BEAM Tools ?

[beamtools](https://meta-erlang.github.io/#/guides-beamtools) é um conjunto de
software no qual instala versões de Erlang e Elixir prontas para uso. Sem a
necessidade de compilar ou instalar mais nada. Disponível para usuários Linux,
pode ser uma alternativa os métodos de instalação de Erlang e Elixir.

Atualmente, quando precisamos instalar Erlang ou Elixir vamos ter algumas
opções:

- usar os pacotes da distribuição Linux. Enquanto a instalação é bem prática e
  funcional. A versão disponibilizada pode não ser a mais recente
- compilar usando gerenciadores de versão como o
  [kerl](https://github.com/kerl/kerl). Essa é a melhor alternativa para testar
  várias versões e controlar as flags de compilação
- fazer o download e instalar os pacotes da
  [Erlang Solutions](https://www.erlang-solutions.com/downloads/). Também bem
  prático mas não existe opção de customizar
- baixar o código fonte em
  [Erlang OTP](https://github.com/erlang/otp/blob/master/HOWTO/INSTALL.md) e
  seguir o documento
  [INSTALL.md](https://github.com/erlang/otp/blob/master/HOWTO/INSTALL.md)

Todas as opções acima funcionam. Entretanto, beamtools pode ser uma alternativa
viável para a instalação de uma suite de desenvolvimento em Erlang e Elixir
contento:

- Erlang
- Elixir
- rebar3
- elvis
- erlfmt

beamtools é instalável a partir de um arquivo selfcontent e disponível aqui
[beamtools releases](https://github.com/meta-erlang/meta-erlang/releases). Cada
release é uma combinação das últimas versões de cada componente acima listado. O
requisito de instalação é estar em qualquer distribuição Linux atual.

## Instalando e usando

Baixar a versão do beamtools desejada:

```bash
$ wget https://github.com/meta-erlang/meta-erlang/releases/download/beamtools-0.4.0/x86_64-beamtools-nativesdk-standalone-4.0.1-erlang-25.0-elixir-1.13.3.sh
```

Vamos ver as opções que o script de instalação oferece:

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

Para instalar, uma opção é instalar em um diretório local e responder _yes_ para
todas as perguntas. Exemplo:

```bash
$ sh ./x86_64-beamtools-nativesdk-standalone-4.0.1-erlang-25.0-elixir-1.13.3.sh -y -d $HOME/beamtools/4.0.1-erlang-25.0-elixir-1.13.3
```

Depois, para todos os consoles onde vamos chamar `erl` ou `iex`, inicializamos
os script que configura as variáveis de ambiente. A principal variável
configurada é _PATH_ na qual aponta para o lugar correto onde erl e iex foram
instalados:

```bash
$HOME/beamtools/4.0.1-erlang-25.0-elixir-1.13.3/environment-setup-x86_64-pokysdk-linux
```

Pronto, a partir de agora, para o console corrente pode executar erl ou iex.
Inclusive a aplicação [Observer](https://www.erlang.org/doc/man/observer.html)
que precisa de algumas dependências a mais instaladas (tais como wxWdigets) vai
funcionar sem a necessidade de instalar mais nada.

Todos os softwares presentes no beamtools é construído a partir do código fonte
utilizando [Yocto Project](https://docs.yoctoproject.org/index.html) e a layer
[meta-erlang](https://github.com/meta-erlang/meta-erlang). Mais detalhes podem
ser encontrados aqui
[BEAM Tools documentação](https://meta-erlang.github.io/#/guides-beamtools).
