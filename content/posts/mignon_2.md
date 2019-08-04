---
title: "Como vejo a BEAM VM"
description: ""
date: 2019-07-22T22:43:50+02:00
tags: ["intro"]
series: ["intro"]
---

# BEAM VM

BEAM VM é o nome formal da máquina virtual no qual algumas linguagens de programação
utilizam para executar as instruções de um programa.

# Erlang

É uma linguagem de programação funcional com primitivas de concorrencia integrados na linguagem.

Geralmente os programas são organizados em módulos contendo funções privadas e públicas. Eu gosto de comparar com programas escritos em linguagem C (apesar do paradigma ser bem diferente, a estrutura e organização é similar).

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

É uma outra linguagem de programação, também funcional e utiliza a BEAM VM para execução. Possui alguns sintax sugar para facilitar a vida e criar um código mais elegante. Mas a essência é a mesma. O interessante quando programamos em Elixir é que estamos programando em Erlang indiretamente.

A linguagem também possui macros de verdade no qual permite criar programas menores e com menos complexidade (ou a complexidade fica no lugar correto).

# Erlang ou Elixir ?

Os dois. Aprenda os dois. Com certeza vai acabar utilizando o conhecimento.

Os mais novatos que conheceram Elixir geralmente utilizaram outras tecnologias como `ruby` mais focados para plataformas web. Então Elixir acaba sendo um passo natural pois a sintaxe é parecida e frameworks como `phoenix` e `ecto` são bastante utilizados para a construção destas plataformas web. Depois de um certo tempo usando Elixir e os frameworks você acaba tendo que ler e entender um pouco mais sobre Elixir, BEAM e OTP.

Já quem conhece Erlang possui facilidade para aprender Elixir pois a plataforma é a mesma, mudando a sintaxe e algumas abstrações (nas quais não fogem dos conceitos do BEAM).

Existem muitas aplicações nas quais fazem parte da distribuição `Erlang/OTP' [Erlang/OTP Applications](http://erlang.org/doc/applications.html) e que são bastante úteis. Como por exemplo um framework completo para snmp, os_mon, asn, eldap, ssh, ftp, tftp, entre outros.

Também existe ferramentas de debug e desenvolvimento: debugger, dialyzer, et, observer, tools.

O conjunto de [bibliotecas padrões](http://erlang.org/doc/apps/stdlib/index.html) também são bem estruturadas e contém muitas funções que podem resolver vários problemas.

Enfim, o desenvolvedor que dedicar um tempo estudando e usando estas ferramentas com certeza vai ter um aumento de produtividade e com menos bugs, seja pelo paradigma funcional ou pelo modelo de como estruturar as aplicações.
