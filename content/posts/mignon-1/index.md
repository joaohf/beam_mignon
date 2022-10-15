---
title: 'No Meio do Caminho tinha uma pedra'
description:
  'Pedras e problemas possuem algo em comum; se mudar a atitude, outras
  estrégias aparecem para resolver as questões.'
toc: true
date: 2019-07-21T22:43:50+02:00
tags: ['intro']
series: ['101']
featured_image: 'images/featured/1.jpg'
---

# Como conheci Erlang/OTP

Tudo começou em 2009 quando estava procurando alguma biblioteca opensource já
pronto e testado para um protocolo chamado
[MEGACO, H.248](https://en.wikipedia.org/wiki/H.248). Após algumas pesquisas
encontrei algo sobre Erlang, mas não tinha entendido nada e muito menos como
integrar com o trabalho que tinha que fazer utilizando linguagem C em uma
plataforma embarcada. Então abandonei a ideia mas mantive o nome da linguagem na
lista de coisas para estudar.

No fim de 2009 retomei os estudos depois de comprar o livro
[Erlang Programming, A Concurrent Approach to Software Development](http://shop.oreilly.com/product/9780596518189.do).
Fiquei fascinado pelo título do livro. Lembro que pensei: "programação
concorrente sem usar threads? Mas eu gosto tanto de threads, mutex, signals,
...". Mas só comecei a ler em 2010.

Após os primeiros capítulos, já estava bastante convencido que havia abordagens
melhores para construção de softwares. Então comecei a procurar mais informações
sobre o assunto. Já nessa época fiz a inscrição em uma lista de discussão
chamada [erlang questions](http://erlang.org/mailman/listinfo/erlang-questions)
para ver quais os principais assuntos e tópicos que aquela comunidade estava
envolvida.

O segundo livro que comprei foi
[Erlang and OTP in Action ](https://www.manning.com/books/erlang-and-otp-in-action).
No qual ajudou a entender como criar uma aplicação funcional e com vários
direcionamentos sobre o design e arquitetura de sistemas OTP.

Nesta época várias empresas começavam a utilizar Erlang mais intensamente, mas
nada no Brasil. Então eu continuava no meu C/C++ e tentando convencer ou ser
ouvido sobre a linguagem. A maioria das pessoas estava mais preocupado com a
sintaxe da linguagem do que os atrativos técnicos e arquitetura.

A primeira vez que tentei utilizar Erlang foi para criar uma integração entre
PHP e Erlang/OTP para um sistema de gerência de gateways
[NGN](https://en.wikipedia.org/wiki/Next-generation_network). OTP possui uma
framework para criação de agentes e gerentes SNMP v1, v2 e v3. E esse era o meu
objetivo, ou seja, integrar PHP no qual era usado para criar a aplicação web e
Erlang para gerenciar os gateways utilizando
[SNMP](https://en.wikipedia.org/wiki/Simple_Network_Management_Protocol).

Na mesma época comecei a fazer experimentos em como integrar Erlang com a
linguagem C, utilizando
[erl_interface](http://erlang.org/doc/tutorial/erl_interface.html) e
[C Nodes](http://erlang.org/doc/tutorial/cnode.html). Assim poderia resolver
problemas utilizando duas linguagens. Mas o único projeto prático que consegui
foi criar esta biblioteca [emq_posix](https://github.com/joaohf/emq_posix).

Entre 2013 e 2014 inicie um projeto aliando
[Yocto Project](https://www.yoctoproject.org/) e Erlang, criando uma layer
chamada [meta-erlang](https://github.com/joaohf/meta-erlang), atualmente a layer
também suporta Elixir. O meu objetivo era poder utilizar Erlang em qualquer
arquitetura de processador na qual o Yocto possua algum
[BSP](https://www.yoctoproject.org/docs/2.5/bsp-guide/bsp-guide.html). Ao longo
do tempo a layer foi citada algumas vezes durante alguns eventos como por
exemplo:

- Stockholm Erlang User Conference 2015:
  [Graham Crowe, Anders Danne - Embedded Erlang Development - Erlang User Conference 2015](https://youtu.be/REZ93dZZ5uA?t=1678)
- CODE BEAM San Francisco 2017:
  [Empowering devices for IoT with Erlang and FPGA](https://www.erlangelixir.com//irina-guberman.html),
  [vídeo](https://youtu.be/Peg7E-nTrOY?t=1940)

O próximo livro foi
[Programming Erlang (2nd edition)](https://pragprog.com/book/jaerlang2/programming-erlang),
alias recomendo começar os estudos por este livro. É uma ótima referencia com
vários exemplos e dicas de como pensar. A tese de doutorado do Joe Armstrong
também é uma bela leitura:
[Making reliable distributed systems in the presence of software errors](http://erlang.org/download/armstrong_thesis_2003.pdf).

Já entrei 2015 e 2016 o principal projeto utilizando Erlang foi durante as
Olimpíadas de 2016 onde criamos uma solução para analisar como estava a
perspectiva do usuário de redes 3G/4G dentro dos estádios e ginásios utilizados
nas Olimpíadas. Na ocasião utilizamos Erlang para a construção de um backend
para recepção, limpeza e armazenamento dos dados. Para receber os dados tive a
oportunidade de trabalhar com as versões betas do [EMQ](https://www.emqx.io/),
um broker [MQTT](https://en.wikipedia.org/wiki/MQTT) escrito em Erlang. Também
foi um ótimo projeto para colocar os conhecimentos adquiridos lendo
[Designing for Scalability with Erlang/OTP](https://www.oreilly.com/library/view/designing-for-scalability/9781449361556/).
O livro oferece material suficiente para a arquitetura e design das soluções.

O próximo projeto que inventei de utilizar Erlang foi uma solução para captura
de métricas de serviço e infraestrutura utilizando uma abordagem multi-protocolo
e integrado ao [riemann](http://riemann.io/) para correlacionamento de eventos e
outras funções relacionados a métricas. Ainda pretendo ressuscitar a ideia como
um projeto opensource.

Já entre 2017 e 2018, resolvi aprender Elixir. Usei o livro
[The Little Elixir & OTP Guidebook](https://www.manning.com/books/the-little-elixir-and-otp-guidebook)
para ter uma base de como fazer um comparativo entre Erlang e Elixir. O livro é
bem fundamentado e divertido de ler. Com certeza uma ótima referência e um
complemento para a documentação oficial no site da linguagem.

Um projeto bem interessante que usei Elixir foi para controlar a sincronização
de serviços [RADIUS](https://en.wikipedia.org/wiki/RADIUS), usando
[FreeRadius](https://freeradius.org/), com bases de dados locais em cada
servidor. A solução disponibilizava uma API para sincronia dos dados quando
determinado evento ocorria.

No final de 2018 resolvi aceitar uma proposta de trabalho na Suécia para
trabalhar com Elixir e finalmente ter a oportunidade de estar mais perto da
comunidade e de outros desenvolvedores. A diferença básica é que as empresas por
aqui já provaram a tecnologia e viram a efetividade. Enquanto que no Brasil
ainda estávamos na questão filosófica e com inércia de aprender outra
tecnologia.

Dois livros que terminei de ler recentemente mas que ainda falta dominar o
assunto são:
[Property-Based Testing with PropEr, Erlang, and Elixir](https://pragprog.com/book/fhproper/property-based-testing-with-proper-erlang-and-elixir)
e
[Metaprogramming Elixir](https://pragprog.com/book/cmelixir/metaprogramming-elixir),
além de ser dois assuntos nos quais dividem opiniões entre desenvolvedores.
