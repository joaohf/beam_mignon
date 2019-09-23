---
title: "Melhores práticas para começar um projeto"
description: "Quais são as melhores práticas para iniciar um projeto?"
toc: true
date: 2019-08-05T22:00:50+02:00
tags: ["tools"]
---

Algumas dicas e guias gerais para começar um projeto.

## Defina um repositório git

`git init` já no começo do projeto ajuda a manter o histórico das mudanças de forma consistente.

## Crie o arquivo _.gitignore_

No arquivo _.gitignore_, colocamos todos os arquivos temporários do projeto e também resultados de compilação.

## Utilize `editorconfig`

[editorconfig](https://editorconfig.org/) é uma forma de padronizar o estilo de código para alguns tipos de arquivos. A maioria dos editores suporta, usando plugins ou nativamente. 

## Atualize o _README.md_

Um bom arquivo README serve como documentação de alto nível para os novatos no projeto bem como para os mais experientes. Geralmente uma boa estrutura contém seções sobre: compilação, testes, comandos, design, itens pendentes e questões comuns.

## Atualize o _CHANGELOG.md_

Criar e manter um changelog envolve muita disciplina dos desenvolvedores. Existe recomendações de como criar e manter um em [keepachangelog](https://keepachangelog.com/). 

## Escolha do editor ou IDE

vi, emacs, visual studio code, eclipse, intelliJ IDEA; todos possuem suporte para Elixir e Erlang.

Escolha algum editor ou IDE que tenha um bom suporte e integração com build tool e dialyzer.

Atualmente eu prefiro o visual studio code para Elixir e Erlang.

## Build tool

Elixir possui uma ferramenta padrão chamada `mix` na qual possui todos os comandos que você precisa para criar projetos em Elixir. Além de poder extender a funcionalidade da ferramenta criando [novas tasks](https://hexdocs.pm/mix/Mix.Task.html#content).

Erlang possui várias abordagens as mais comuns são:

* [rebar3](https://www.rebar3.org/)
* [erlang.mk](https://erlang.mk/)
* Makefile tradicionais. Exemplo: https://github.com/erlang/otp
* [Erlang make](http://erlang.org/doc/man/make.html)

Creio que atualmente a ferramenta mais interessante é o `rebar3`.

É recomendável gastar um bom tempo estudando os comandos e features da build tool.

## Template para código inicial

### Elixir

* Utilize `mix new`, https://hexdocs.pm/mix/Mix.Tasks.New.html, para criar um template básico do projeto.

### Erlang

* Utilize `rebar3 new`, https://www.rebar3.org/docs/commands#section-new, para criar um template básico do projeto

## Utilize analisadores de boas práticas

Geralmente estas ferramentas oferecem suporte para a definição de regras em um arquivo de configuração e possuem integração com as ferramentas de build.

### Elixir

* Adote o [credo](https://github.com/rrrene/credo)

### Erlang

* Adote o [elvis](https://github.com/inaka/elvis)

## Use `xref`

xref faz checagens de referências a módulos e funções não existentes ou com parâmetros diferentes.

### Elixir

* [mix xref](https://hexdocs.pm/mix/Mix.Tasks.Xref.html#content)
  
### Erlang

* [rebar3 xref](https://www.rebar3.org/docs/commands#section-xref)

## Use `dialyzer`

Durante o desenvolvimento, é recomendado enriquecer a documentação de funções, tipos de dados, macros, guards com os famosos `type specs` ([elixir type specs](https://elixir-lang.org/getting-started/typespecs-and-behaviours.html) e [erlang type specs](http://erlang.org/doc/reference_manual/typespec.html)). Lembrando que tanto Elixir e Erlang são linguagens dinamicamente tipadas.

`dialyzer` (http://erlang.org/doc/man/dialyzer.html) é uma ferramenta no qual utiliza os `type specs` para fazer uma análise estática no código e descobrir eventuais problemas.

O esforço de documentar e configurar vale a pena.

### Elixir

* Existem três projetos nos quais adiciona uma nova task ao mix: [dialyxir](https://hex.pm/packages/dialyxir), [dialyze](https://hex.pm/packages/dialyze), [dialyzex](https://hex.pm/packages/dialyzex)
* O uso do `dialyxir` parece ser uma boa opção
* O motivo de haver muitas opções talvez esteja na forma de interpretar os resultados do comando dialyzer.

### Erlang

* [rebar3 dialyzer](https://www.rebar3.org/docs/commands#section-dialyzer)

## Crie um _Makefile_ para encapsular os comandos repetitivos

* Caso tenha muitos comandos para realizar determinada ação, é bom criar um Makefile para conter estes comandos repetitivos
* Geralmente as regras acabam sendo um wrapper para `mix` ou `rebar3`

Caso não goste de Makefiles, há opção de compor as tasks e comandos: [mix do](https://hexdocs.pm/mix/Mix.Tasks.Do.html#content) e [rebar3 do](https://www.rebar3.org/docs/commands#section-do)

## Formate o código com alguma ferramenta automática de formatação

### Elixir

* [mix format](https://hexdocs.pm/mix/Mix.Tasks.Format.html#content) ajuda a manter o padrão de código. Assim o desenvolvedor não perde tempo arrumando o código

### Erlang

* Não há uma ferramenta padrão. Geralmente é delegado para as IDE e editores. E aí cabe para o desenvolvedor definir um padrão
* O que mais se aproxima a uma ferramenta padrão é [Erlang Mode for Emacs](http://erlang.org/doc/apps/tools/erlang_mode_chapter.html). Existe alguns scripts que chamam Emacs para formatar o código fonte.

## Documentação de código

## Elixir

* Utilize o [ex_doc](https://hexdocs.pm/ex_doc/readme.html) no qual vai criar uma documentação html bem eficiente e visualmente elegante.
* Mas antes, entenda como criar documentação de módulos e funções aqui: [Writing Documentation](https://hexdocs.pm/elixir/writing-documentation.html)
* Para gerar documentação: mix docs

## Erlang

* Utilize o [edoc](http://erlang.org/doc/apps/edoc/chapter.html)
* Para gerar documentação: [rebar3 edoc](https://www.rebar3.org/docs/commands#section-edoc)

## Execução dos testes

## Elixir

* [mix test](https://hexdocs.pm/mix/Mix.Tasks.Test.html) é a principal interface para execução dos testes
* [excoveralls](https://github.com/parroty/excoveralls) adiciona algumas tasks extras para criação de relatórios mostrando a cobertura dos testes. Basicamente é um wrapper do `mix test --cover`

## Erlang

* [rebar3 eunit](https://www.rebar3.org/docs/commands#section-eunit) para executação dos testes unitários
* [rebar3 ct](https://www.rebar3.org/docs/commands#section-ct) para execução dos testes funcionais ou sistêmicos

