---
title: 'Brincando com Erlang nodes: epmd'
description: ''
toc: true
date: 2019-12-21T22:45:50+02:00
series: ['erlang nodes']
tags: ['code', 'failure', 'eclero', 'epmd']
featured_image: 'images/featured/eclero-2-0.jpg'
---

Este post faz parte de uma série de outros posts relacionados a como usar
_Erlang distribution protocol_.

Na primeira parte, {{< ref "/posts/mignon-20" >}}, criamos uma aplicação básica.
Já na segunda parte, {{< ref "/posts/mignon-22" >}}, colocamos a aplicação em
uma imagem Linux. Agora, o próximo passo é falar sobre o _epmd_.

Mas antes vamos atualizar a lista dos requisitos:

1. ~~Cada nó necessita detectar e ser notificado de qualquer falha dos outros
   nós~~
2. O cluster de nós Erlang deve ser configurado utilizando algum tipo de
   configuração vinda do ambiente
3. ~~O ambiente de execução é Linux embarcado rodando em qualquer plataforma~~
4. ~~Desejável poder rodar em um ambiente embarcado com o mínimo de recursos
   necessários~~
5. Mínimo de 3 nós para a solução funcionar

## epmd

[epmd: Erlang Portmap Daemon](http://www1.erlang.org/doc/man/epmd.html) é um
daemon no qual conhece o endereço e nomes de todos os nós Erlang de dentro de um
cluster. Geralmente é inicializado junto com o nó ou quando executamos o comando
`erl`. Mas pode ser configurado para inicilizar independente se a VM Erlang foi
iniciada ou não. Vale mencionar que o epmd possui integração com systemd e os
logs podem ser enviados para o syslog.

## O problema

No caso eclero embedded, o daemon epmd não é inicializado quando o nó erlang é
ativado. Por dois motivos:

1. Falta de suporte por parte da distribuição Linux que fizemos (não instalei os
   pacotes necessários)
2. erlinit utiliza uma outra estratégia para iniciar o nó erlang, fazendo com
   que o epmd não seja inicializado adequadamente pela VM Erlang.

Mas, será que realmente o epmd é necessário ? Dependendo do contexto, não.

Para resolver o problema, poderia:

1. utilizar a opção descrita aqui:
   [Support launching epmd -daemon](https://github.com/nerves-project/erlinit/issues/8)
2. seguir esta documentação (na qual parece obsoleta, mas iria funcionar)
   [Add an Erlang distribution how-to](https://github.com/nerves-project/nerves/pull/30/files)
3. instalar os pacotes principais do Erlang e também mais pacotes bases para a
   distribuição ter um melhor suporte e por fim executar o epmd
4. abandonar o erlinit, desistir de fazer com que a aplicação execute em um
   ambiente embarcado e restritivo

Entretanto a opção escolhida foi não utilizar o epmd.

## A solução

Na [release 19 do Erlang](http://erlang.org/download/otp_src_19.0.readme), foi
adicionado suporte para desativar o epmd ou substituir por outra implementação.
Então ao longo do tempo foi surgindo diversas alternativas:

- [Erlang Port Mapper Daemon](https://github.com/erlang/epmd) escrito em Erlang
- [Erlang (and Elixir) distribution without epmd, aka EPMDLESS](https://github.com/oltarasenko/epmdless)

{{< note >}} O epmd original foi escrito em C,
[epmd.c](https://github.com/erlang/otp/blob/master/erts/epmd/src/epmd.c). E
oficialmente suportado. {{< /note >}}

Também foi documentado como escrever um epmd alternativo:

- http://erlang.org/doc/man/erl_epmd.html
- http://erlang.org/doc/apps/erts/alt_disco.html

Bem como opções de linha de comando para executarmos a Erlang VM sem epmd:

- http://erlang.org/doc/man/erl.html
- `-start_epmd true | false`
- `-epmd_module Module (init flag)`
- `-proto_dist Proto`

A alternativa mais viável foi utilizar a biblioteca epmdless. Sendo assim, na
aplicação eclero foi necessário duas alterações:

- incluir epmdless como dependência no arquivo rebar.config

{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="rebar.config" highlight="linenos=inline" start=9 end=13 >}}

- criar uma configuração mínima para o nó ser inicializado com as opções
  corretas da VM Erlang, no arquivo vm.config

{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="config/vm.args" highlight="linenos=inline" start=8 end=12 >}}

- adicionar a configuração necessária para a aplicação epmdless no arquivo
  sys.config

{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="config/sys.config" highlight="linenos=inline" start=4 end=7 >}}

Feito isso, fazendo os procedimentos de build e testes, podemos verificar que o
ambiente está operacional e usando a biblioteca epmdless:

- checando se os argumentos foram passados corretamente para a VM:
  {{< highlight erlang "linenos=inline" >}} (eclero1@eclero)1>
  init:get_argument(start_epmd). {ok,[["false"]]} (eclero1@eclero)2>
  init:get_argument(proto_dist). {ok,[["epmdless_proto"]]} (eclero1@eclero)3>
  init:get_argument(epmd_module). {ok,[["epmdless_client"]]} {{< / highlight >}}

- verificando se a VM está usando um epmd alternativo:
  {{< highlight erlang "linenos=inline" >}} (eclero1@eclero)4>
  net_kernel:epmd_module(). epmdless_client (eclero1@eclero)5>

(eclero1@eclero)6> net_adm:ping(node()). pong

(eclero1@eclero)7> erlang:node(). eclero1@eclero {{< / highlight >}}

## Conclusão

Como vimos, existem motivos e alternativas para utilizar outra implementação do
epmd. Dependendo do seu projeto isso pode ser bastante útil. Como por exemplo
descobrir outros nós em um cluster de forma determinística, no qual vamos
abordar no próximo post {{< ref "/posts/mignon-24" >}}
