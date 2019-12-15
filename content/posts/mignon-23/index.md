---
title: "Brincando com Erlang nodes: epmdless e node_discovery"
description: ""
draft: true
toc: true
date: 2019-12-25T22:43:50+02:00
series: ["erlang nodes"] 
tags: ["code", "failure", "eclero"]
featured_image: 'images/featured/eclero-2-0.jpg'
---

Este post faz parte de uma série de outros posts relacionados a como usar _Erlang distribution protocol_.

Temos mais um requisito não funcional para a brincadeira. Agora o desafio é enxugar mais a imagem e criar uma solução mais compacta com o mínimo necessário.

Queremos usar duas opções que não são o default Erlang/OTP mas podemos utilizar em determinados projetos:

1. uma alternativa para o processo [Erlang Port Mapper Daemon](http://erlang.org/doc/man/epmd.html)
2. um protocolo custom para realizar o node discovery dentro de um cluster

O que é epmd e node discovery
Como substituir
Exemplo
Testando com o cloonix
