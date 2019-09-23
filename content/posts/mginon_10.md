---
title: "Erlang: bad parts"
description: ""
toc: true
date: 2019-08-11T21:43:50+02:00
tags: ["intro"]
series: ["101"]
---

Alguns comentários sobre as questões contidas nesta apresentação [On Network Configuration, Distributed and Concurrent Programming with Erlang Chalmers](http://www.cse.chalmers.se/edu/year/2015/course/TDA383_LP3/assets/gl/Cons_2016-02-15.pdf) sobre o tema "Erlang bad parts":


> The syntax

Pessoalmente, eu acho a sintaxe da linguagem (tanto Erlang quanto Elixir) bem prática. Mas ao mesmo tempo, se você comparar com qualquer outra linguagem (exemplo: C ou Javascript) vai notar algumas construções esquisitas.

Mas, depois de um tempo tudo fica confortável e prático. A dica aqui é não focar na sintaxe, busque entender o paradigma funcional e como a sintaxe ajuda nisso.

> No real strings

Verdade.

Em Erlang não existe strings:

{{< highlight erlang >}}
<<"Isto é uma string?">>
{{< / highlight >}}

O que existe é o tipo de dado _binary_ no qual pode ser qualquer tipo de dado, inclusive representações de string.

Geralmente temos lista de inteiros representando strings, exemplo:

{{< highlight erlang >}}
"Isto é uma lista de inteiros"
{{< / highlight >}}

Já em Elixir, é a mesma coisa. O compilador faz o trabalho de transformar uma _string_ em binary

{{< highlight elixir >}}
"Isto é um binary"
{{< / highlight >}}

Após inspecionar o código compilado, veremos um _binary_.

_binary_ possibilita fazer [_pattern match_](http://erlang.org/doc/programming_examples/bit_syntax.html) e também oferece uma boa performance se comparado com listas.

> The broken if..

Raramente utilizado, mas pode ser usado. Acho que usei 4 vezes em 10 anos. Entretanto lendo o código Erlang/OTP você vai ver vários casos de como utilizar.

> No scoping rules or actually just one - the whole clause! 

Sim, é verdade. Por isso é importante não criar funções gigantes.

> Being a dynamically typed language, static type checking is a very difficult problem

Este é um ponto bem sério. Muitas vezes o desenvolvedor apenas quer escrever código com um pouco de documentação e quando estamos em uma linguagem dinamicamente tipada precisamos nos preocupar em como descrever o tipo de dado de cada função. Exemplo [Erlang User defined types](https://medium.com/@gwelr/erlang-user-defined-types-8c4f0e041bcd):

{{< highlight erlang >}}
-type suite() :: spades | clubs | hearts | diamonds.
-type value() :: 1..10 | j | q | k.
-type card() :: {suite(), value()}.

-spec kind(card()) -> face | number.

kind({_, A}) when A >= 1, A =< 10 -> number;
kind(_) -> face.
{{< / highlight >}}

_-spec_ é utilizado para marcar funções ajudando na análise estática (utilizando a ferramenta 
_dialyzer_) e também na documentação do código.

_dialyzer_ pode ajudar bastante detectando erros como por exemplo: chamando uma função com tipos de parâmetros errados. Introduzir _dialyzer_ já no começo do projeto reduz a quantidade de bugs no código.

Algumas vezes o _dialyzer_ não vai ajudar. Como por exemplo utilizar chamadas dinâmicas usando _MFA_ (Module, Function, Arity), e aí você só vai descobrir erros durante a execução da aplicação.

Acho que a dica para evitar situações é escrever anotações specs, investir em documentação e testes.

> libraries are inconsistent - evolution vs design.. 

Esta palestra [Security versus interoperability](https://codesync.global/media/security-versus-interoperability/) ajuda a responder essa questão. Pois muitas vezes a evolução está presa com determinados aspectos que não podem ser mudados facilmente.

Há uma outra palestra no qual podemos entender um pouco mais a questão ["The Mess We're In" by Joe Armstrong](https://www.youtube.com/watch?v=lKXe3HUG2l4).

Acho que o ponto central é como manter a BEAM VM evoluindo e ao mesmo tempo ter estabilidade e segurança no design das aplicações.

> No obvious support for abstraction, with some support bolted on afterwards, e.g., records 

`records` em Erlang e `defstruct` em Elixir servem para definir abstrações. Entretanto, dentro do paradigma funcional, precisamos definir as nossas funções dentro de módulos. 

Na maior parte do tempo usamos mapas, listas, _proper lists_, records e structs para definir as abstrações de dados. Vale os princípios gerais de [SOLID](https://en.wikipedia.org/wiki/SOLID).

Alias o livro [Programming Erlang (2nd edition)](https://pragprog.com/book/jaerlang2/programming-erlang), no capítulo 4 Modules and Functions; o autor implementa um pequeno código demonstrando esta questão de abstrações entre linguagem C, Java e Erlang.

Em Erlang, não temos o conceito de _namespace_, então o nome dos módulos pode colidir com algum outro módulo existente. Por isso, geralmente definimos o nomes dos módulos prefixando algum nome que faz sentido. Exemplo: _poli\_server.erl_, _poli\_metric.erl_.

Já em Elixir, os módulos são nomeados utilizando `defmodule`. Podendo ter vários defmodule dentro de um mesmo arquivo. Durante a compilação os módulos são extraídos e compilados em arquivos separados. Isso evita colisão com algum projeto já existente.

Elixir provê suporte para polimorfismo, utilizando [Protocols](https://elixir-lang.org/getting-started/protocols.html).

> “too easy” to build complex applications fast; 
> technical debt might build fast by using libraries causing too tight coupling;
> causes large problems later;
> normal software engineering principles still apply;

Sim, é verdade. Depois de um ciclo de desenvolvimento você vai ter a primeira versão da aplicação pronta para produção. Mas não significa que o trabalho acabou.

Creio que a questão seja mais relacionada com o seguinte modelo mental, usado quando criamos as aplicações:

* paradigma usando funcional
* _sharing nothing_ 
* trocas de mensagens entre processos para comunicação
* _fail fast_, alguma outra parte do sistema vai cuidar da falha
* menos programação defensiva, mais _happy path_

Após a primeira versão, pode ser o momento de isolar partes da aplicação, extrair bibliotecas, fazer um profile dos principais blocos e otimizar os que forem necessários.


Enfim, como recomendação de leitura, segue alguns links:

* [Stuff Goes Bad: Erlang in Anger](https://www.erlang-in-anger.com/)
* [Adopting Erlang](https://adoptingerlang.org/)
* [Adopting Elixir: From Concept to Production](https://pragprog.com/book/tvmelixir/adopting-elixir)
* [GOTO 2018 • The Do's and Don'ts of Error Handling • Joe Armstrong](https://www.youtube.com/watch?v=TTM_b7EJg5E)
