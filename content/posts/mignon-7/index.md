---
title: 'meta-erlang'
description: ''
toc: true
date: 2019-08-04T22:00:50+02:00
tags: ['yocto']
featured_image: 'images/featured/20190823_131050-3-2.jpg'
---

`meta-erlang` é uma layer compatível com o
[Yocto Project](https://www.yoctoproject.org/) e
[Openembedded](https://www.openembedded.org/wiki/Main_Page). A intenção é trazer
Erlang e Elixir como alternativas para o desenvolvimento de aplicações
embarcadas.

A layer oferece suporte para cross-compilação de projetos Erlang e Elixir para
qualquer BSP suportado pelo Yocto.

Também existe uma layer chamada
[meta-axon](https://layers.openembedded.org/layerindex/branch/master/layer/meta-axon/)
no qual é uma layer que faz uso da meta-erlang, como se fosse um projeto real.

Criei uma documentação oficial do projeto
[aqui](http://joaohf.github.io/meta-erlang/#/) no qual pode ser utilizada para
os primeiros passos.

**AVISO:** conhecimentos prévios de Yocto/Openembedded são necessários para o
uso desta layer

Normalmente atualizo as versões do Erlang e Elixir a cada versão major.
Atualmente este projeto não é o meu foco, mas pretendo voltar a desenvolver no
futuro.

## Ideias de como utilizar

- Imagem com ERTS (Erlang Runtime System): uma imagem com os módulos erlang
  instalados

- Imagem com uma aplicação Erlang: uma imagem contendo o mínimo necessário
  utilizando systemd ou initd e uma aplicação Erlang
- Imagem com uma aplicação Erlang utilizando
  [erlinit](https://layers.openembedded.org/layerindex/recipe/36701/): erlinit é
  um substituto do binário '/sbin/init' no qual contém já inicia uma aplicação
  erlang ou um console. Podemos usar para criar imagens realmente pequenas

## Referencias

- [Documentação meta-erlang](http://joaohf.github.io/meta-erlang/#/)
- [Repositório meta-erlang](https://github.com/joaohf/meta-erlang)
- [meta-erlang](https://layers.openembedded.org/layerindex/branch/master/layer/meta-erlang/)
- [meta-axon](https://layers.openembedded.org/layerindex/branch/master/layer/meta-axon/)
- [Repositório meta-axon](https://github.com/joaohf/meta-axon)
- Stockholm Erlang User Conference 2015:
  [Graham Crowe, Anders Danne - Embedded Erlang Development - Erlang User Conference 2015](https://youtu.be/REZ93dZZ5uA?t=1678)
- CODE BEAM San Francisco 2017:
  [Empowering devices for IoT with Erlang and FPGA](https://www.erlangelixir.com//irina-guberman.html),
  [vídeo](https://youtu.be/Peg7E-nTrOY?t=1940)
