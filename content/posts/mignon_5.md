---
title: "Vamos testar: exunit"
description: "Como testar, em Elixir"
toc: true
date: 2019-08-13T18:17:50+02:00
tags: ["testes"]
series: ["vamos testar"]
featured_image: 'images/featured/20190823_131050-3-3.jpg'
---

[ExUnit](https://hexdocs.pm/ex_unit/ExUnit.html) é o framework padrão quando falamos de testes em Elixir. Ele é simples e ao mesmo tempo poderoso.

Todos os testes em Elixir ficam separados da implementação, geralmente no diretório `test`. Todos os arquivos teste diretório que seguem o padrão de nome: `<nome do teste>_test.exs` são compilados e executados como testes pelo comando `mix test`.

Cada teste é implementado dentro de um módulo normal no usa as macros contidas no ExUnit.Case para definir testes.

{{< highlight elixir >}}
defmodule AssertionTest do
  # Use the module
  use ExUnit.Case, async: true

  # The "test" macro is imported by ExUnit.Case
  test "always pass" do
    assert true
  end
end
{{< / highlight >}}

A documentação do módulo [`ExUnit.Case`](https://hexdocs.pm/ex_unit/ExUnit.Case.html#content) possui bastante detalhes de como fazer uma composição de teste suites utilizando `describe`, setups e como registrar callbacks para limpeza do ambiente.

O framework traz facilidades para:

* capturar IO
* capturar Log
* diversos tipos de Asserts

Uma dica importante é que quando executamos o comando `mix test` algumas coisas acontecem por padrão:

* o projeto é compilado com a variável MIX_ENV configurada para `test`
* caso o seu projeto seja uma aplicação, ou seja, implemente o behaviour `Application` então `mix test` vai iniciar a sua aplicação e todas as dependencias que ela possui
* ExUnit apenas implementa testes em arquivos Elixir script (.exs) e presentes dentro do diretório _test_

Os seguintes projetos opensource possuem boa cobertura e técnicas de como testar em Elixir:

* https://github.com/phoenixframework/
* https://github.com/elixir-ecto/
* https://github.com/elixir-plug/
