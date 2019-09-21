---
title: "Como vejo a BEAM VM"
description: ""
date: 2019-07-22T22:43:50+02:00
tags: ["intro"]
series: ["101"]
---

# BEAM VM

BEAM VM é o nome formal da máquina virtual no qual algumas linguagens de programação
utilizam para executar as instruções de um programa.

As principais linguagens são: Erlang e Elixir. Mas [existem outras](https://github.com/llaisdy/beam_languages):

* [luerl](https://github.com/rvirding/luerl)
* [efene](http://efene.org/)
* [clojerl](https://github.com/clojerl/clojerl)

# Erlang

* [Erlang github](https://github.com/erlang)
* [https://www.erlang.org/](https://www.erlang.org/)
* [Jira](https://bugs.erlang.org/secure/Dashboard.jspa)

É uma linguagem de programação funcional com primitivas de concorrência integrados na linguagem.

Geralmente os programas são organizados em módulos contendo funções privadas e públicas. Eu gosto de comparar com programas escritos em linguagem C (apesar do paradigma ser bem diferente, a estrutura e organização é similar, ou seja, funções e módulos).

Na linguagem há várias estrutura de controle por exemplo: `if` e `case`; acho que não precisa de mais nenhuma. Usamos recursividade (`tail recursion`) e `pattern match` para organizar a lógica dos programas.

Há variáveis mas elas não variam, uma vez `bounded` não há como redefinir uma variável. Também temos vários tipos de dados:

* listas:
{{< highlight erlang >}}
[]
{{< / highlight >}}
* mapas:
{{< highlight erlang >}}
#{}
{{< / highlight >}}
* atoms:
{{< highlight erlang >}}
isto_é_um_atom
{{< / highlight >}}
* inteiros, float, double
{{< highlight erlang >}}
A = 1.2, B = 1
{{< / highlight >}}
* bit string (``)
{{< highlight erlang >}}
A = <<"super migon">>
{{< / highlight >}}

Existem outras estruturas e features. Vale a pena dar uma lida aqui [Erlang Reference Manual User's Guide](http://erlang.org/doc/reference_manual/users_guide.html)

# Elixir

* [Elixir github](https://github.com/elixir-lang)
* [https://elixir-lang.org/](https://elixir-lang.org/)

É uma outra linguagem de programação, também funcional e utiliza a BEAM VM para execução. Possui alguns sintaxe sugar para facilitar a vida e criar um código mais elegante. Mas a essência é a mesma. O interessante quando programamos em Elixir é que estamos programando em Erlang indiretamente.

A linguagem também possui macros de verdade no qual permite criar programas menores e com menos complexidade (ou a complexidade fica no lugar correto).

Elixir é incrivelmente macro friendly, na realidade a maioria das construções são macros. Por exemplos:

* `unless`, `if`: [kernel.ex](https://github.com/elixir-lang/elixir/blob/master/lib/elixir/lib/kernel.ex)
* `cond`, `case`: [special_forms.ex](https://github.com/elixir-lang/elixir/blob/master/lib/elixir/lib/kernel/special_forms.ex)

O restante são wrappers para algumas bibliotecas padrões do Erlang utilizando uma abordagem Elixir ou bibliotecas padrões do Elixir.

Um ponto bastante interessante é que Elixir e Erlang são compatíveis. Dentro de um programa Elixir posso chamar qualquer módulo e função definido em Erlang. Então quando programamos em Elixir temos a chance de utilizar as bibliotecas já escritas em Erlang.


# Erlang ou Elixir ?

Na minha opinião, aprenda os dois. Com certeza vai acabar utilizando o conhecimento.

Os mais novatos que conheceram Elixir provavelmente utilizaram outras tecnologias como `ruby` mais focados para plataformas web. Então Elixir acaba sendo um passo natural pois a sintaxe é parecida e frameworks como [`plug`](https://hexdocs.pm/plug/readme.html), [`phoenix`](https://phoenixframework.org/) e [`ecto`](https://hexdocs.pm/ecto/Ecto.html) são bastante utilizados para a construção destas plataformas web. Depois de um certo tempo usando Elixir e os frameworks você acaba tendo que ler e entender um pouco mais sobre Elixir, BEAM e OTP.

Já quem conhece Erlang possui facilidade para aprender Elixir pois a plataforma é a mesma, mudando a sintaxe e algumas abstrações (nas quais não fogem dos conceitos do BEAM e linguagem funcional).

Um ponto de decisão pode ser a sintaxe da linguagem. Alguns times podem preferir uma sintaxe mais moderna, enquanto outros podem preferir algo mais formal.

Você pode acabar em um projeto utilizando as duas linguagens como por exemplo [beam-telemetry]( https://github.com/beam-telemetry), tendo uma base em Erlang com wrappers e outros adicionais em Elixir.

Caso o projeto seja para criar um sistema web com interfaces html e API http json, então provavelmente Elixir é um bom caminho.

Agora, caso esteja desenvolvendo um backend para um determinado protocolo de comunicação, uma base de dados ou um aplicação para controle de hardware, e precisa de alguma atenção especial para testes bem como na geração da release então Erlang pode ser interessante.

Pessoalmente acho que esta decisão precisa ser do time de desenvolvimento. O time precisa testar as duas abordagens em um projeto pequeno e avaliar os resultados.

## Erlang/OTP

Existem muitas aplicações nas quais fazem parte da distribuição `Erlang/OTP' [Erlang/OTP Applications](http://erlang.org/doc/applications.html) e que são bastante úteis. Como por exemplo um framework completo para snmp, os_mon, asn, eldap, ssh, ftp, tftp, entre outros.

Também existe ferramentas de debug e desenvolvimento: debugger, dialyzer, et, observer, tools.

O conjunto de [bibliotecas padrões](http://erlang.org/doc/apps/stdlib/index.html) também são bem estruturadas e contém muitas funções que podem resolver vários problemas.

Enfim, o desenvolvedor que dedicar um tempo estudando e usando estas ferramentas com certeza vai ter um aumento de produtividade e com menos bugs, seja pelo paradigma funcional ou pelo modelo de como estruturar as aplicações.
