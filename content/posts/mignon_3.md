---
title: "Vamos testar: eunit"
description: "Como testar código unitariamente, em Erlang"
date: 2019-08-06T21:00:50+02:00
tags: ["testes"]
series: ["vamos testar"]
---

`eunit` é um framework para testes leves e parte da distribuição Erlang/OTP padrão. 

Os testes podem ser definidos dentro de cada módulo, dentro de blocos

{{< highlight erlang >}}
-ifdef(EUNIT).
    % test code here
    ...
-endif.
{{< / highlight >}}

Ou em arquivos separados, geralmente dentro do diretório _test_, em uma base de código.

A filosofia do framework segue a linha [XUnit](https://en.wikipedia.org/wiki/XUnit), mas adaptado para o conceito funcional.

Vejo duas principais vantagens para definir os testes dentro de módulos:

* Possibilidade de testar funções privadas
* O teste acompanham o código

Alguns projetos adotam esta abordagem, outros fazem a separação.

As duas melhores documentações sobre `eunit` são:

* Documentação oficial do [eunit](http://erlang.org/doc/apps/eunit/chapter.html)
* [EUnited Nations Council](https://learnyousomeerlang.com/eunit)

Costumo utilizar o `eunit` para uma abordagem mais _unit test_, onde o módulo é a minha unidade que estou testando.

O tópico mais complicado de utilizar o `eunit` é quando surgir a necessidade definir [Test representation](http://erlang.org/doc/apps/eunit/chapter.html#eunit-test-representation). Após a definição, os testes passam a ficar mais rápidos e bem organizados.
