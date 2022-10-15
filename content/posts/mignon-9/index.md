---
title: 'Vamos testar: lux'
description: 'Testando no estilo expect'
toc: true
date: 2019-08-06T21:43:50+02:00
tags: ['testes']
series: ['vamos testar']
featured_image: 'images/featured/20190823_131050-1-2.jpg'
---

[lux](https://github.com/hawk/lux) é um framework para automação de testes
utilizando o estilo Expect (https://en.wikipedia.org/wiki/Expect,
https://core.tcl-lang.org/expect/index).

A ideia básica é a definição de um script contendo os comandos usados para
testar alguma aplicação e tambem colocando algumas marcações no script que irão
controlar o `lux`.

Este framework provê mecanismos de fazer uma automação de testes, ou seja,
aqueles comandos que são utilizados para testar alguma aplicação podem ser
escritos em uma forma bem simples nos quais o `lux` vai controlar a execução.

Esta palestra é de um dos autores do `lux`:
[LUX - an expect like test tool](https://codesync.global/media/lux-an-expect-like-test-tool/),
o autor demonstra os conceitos, exemplos e como ele utiliza a ferramenta para
execução de mais de 4000 testes escritos.

Creio que esta ferramenta é muito poderosa para testes de produtos tais como:

- interfaces de console
- conexões seriais
- conexões com terminais remotos
- ou qualquer programa que precise de interação utilizando stdio e stdin
