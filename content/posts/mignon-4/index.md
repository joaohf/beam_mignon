---
title: 'Vamos testar: common_test'
description: 'Testes funcionais e de integração, em Erlang'
toc: true
date: 2019-08-06T21:30:50+02:00
tags: ['testes']
series: ['vamos testar']
featured_image: 'images/featured/4.jpg'
---

`common_test` é uma das aplicações mais interessantes que acompanha a
distribuição Erlang/OTP. Digo isso pois os casos de uso que a ferramenta resolve
são baseados em casos reais da indústria. Podemos realizar vários tipos de
testes, por exemplo:

- black-box, utilizando algum protocolo de comunicação: ssh, netconf, telnet,
  ftp
- white-box, para testar aplicações escritas em Erlang ou Elixir, fazendo
  chamadas reais
- unit tests, há vários projetos que utilizam somente o `common_test` para
  implementar todos os testes necessários

É possível criar _suites_ de testes com várias formas de execução dos testes e
organização. Por exemplo: grupos, subgrupos; execução serial, paralela ou
definida por cada grupo.

`common_test` não possui nenhum suporte para asserts dos valores dentro de um
teste, não é como `eunit`. Então para verificar os valores, acabamos utilizando
_pattern matching_. Mas nada impede de utilizar as macros do `eunit`, caso
deseje uma abordagem mais xunit.

Os principais pontos que acho importante são:

- possuei um suporte para carregar configurações dos testes
- relatórios de execução e histórico de execução de cada teste
- suporte para alguns utilitários tais como: ssh, ftp, rpc, cliente netconf,
  snmp, telnet
- suporte para testes distribuídos em um cluster Erlang ou não

Duas principais documentações de referência:

- Documentação oficial:
  [common_test](http://erlang.org/doc/apps/common_test/basics_chapter.html)
- [Common Test for Uncommon Tests](https://learnyousomeerlang.com/common-test-for-uncommon-tests)

É importante ler a documentação pois oferece dicas de como escrever e organizar
os testes.
