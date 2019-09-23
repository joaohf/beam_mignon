---
title: "Ativando traces usando LTTng"
description: ""
toc: true
date: 2019-09-09T21:33:50+02:00
tags: ["code", "trace", "runtime_tools"]
series: ["traces"]
---

Neste post vamos descobrir como podemos instrumentar aplicações Erlang/Elixir dinamicamente.

## Trace dinâmicos

Um trace dinâmico é um conjunto de bibliotecas nas quais permitem instrumentar partes do sistema em tempo de execução, com o objetivo de extrair métricas de performance, ajudando na resolução de problemas.

Geralmente estes traces possibilitam uma visão fim-a-fim envolvendo a aplicação e chamadas de sistema.

## Trace BEAM

Existem três modos de utilizar traces dinâmicos no BEAM. Sendo dependente do Sistema Operacional:

* DTrace (NetBSD, OpenBSD, FreeBSD, Mac OSX)
* Systemtap (DTrace para Linux)
* LTTng (Linux)

Para ter acesso a traces precisamos recompilar a BEAM VM para utilizar um dos módulos de trace suportados. Toda a BEAM VM foi instrumentada usando [dyntrace](http://erlang.org/doc/man/dyntrace.html) mas esta instrumentação somente é ativada quando recompilamos utilizando o parâmetro: __--with-dynamic-trace__.

Neste post, vamos utilizar o LTTng em um Ubuntu 18.10.

## O que é LTTng?

[LTTng](https://lttng.org/) é um framework (documentação, bibliotecas, utilitáros e visualizadores) de trace para Linux. A intenção é entender a interação de diversos componentes do sistema durante uma sessão de trace.

É um projeto usado em todas as distribuições Linux e já possui vários anos de desenvolvimento e otimização.

Podemos capturar um trace de diversas formas

* localmente: escreve os traces no sistema de arquivos local
* remotamente: envia os traces para um relay
* live mode: os traces não são escritos localmente mas sim visualizados remotamente
* snapshot: os traces são escritos em arquivos locais ou enviados remotamente mediante a uma solicitação de snapshot. 

A [documentação](https://lttng.org/docs/v2.10/) explica todas as funcionalidades e modos de utilização.

## Como ativar e usar

Em [LTTng and Erlang/OTP](http://erlang.org/doc/apps/runtime_tools/LTTng.html) existe uma documentação oficial de como podemos ativar. Vamos seguir esta documentação.

Instalar as dependências:

{{< highlight bash >}}
sudo apt-get install lttng-tools liblttng-ust-dev
{{< / highlight >}}

Usando o [kerl](https://github.com/kerl/kerl) para compilar uma versão OTP com o trace habilitado.

{{< highlight bash "linenos=inline" >}}
export KERL_CONFIGURE_OPTIONS="--with-dynamic-trace=lttng"

kerl build git https://github.com/erlang/otp.git OTP-22.0.7 22.0.7-lttng

kerl install 22.0.7-lttng ~/kerl/22.0.7-lttng
{{< / highlight >}}

Na linha 1, o parâmetro necessário para a ativação dos traces é passado usando a variável de ambiente [KERL_CONFIGURE_OPTIONS](https://github.com/kerl/kerl#kerl_configure_options). O comando de build é chamado na linha 3 e para instalar a versão compilada usamos o comando na linha 5.

kerl é uma das melhores formas de compilar e testar novas versões de Erlang.

Agora já temos tudo pronto. Vamos ativar a shell com a nova versão do Erlang/OTP com suporte ao LTTng e fazer alguns testes. Em uma nova shell:

{{< highlight bash "linenos=inline" >}}
$ source  ~/kerl/22.0.7-lttng/activate
$ erl
Erlang/OTP 22 [erts-10.4.4] [source] [64-bit] [smp:4:4] [ds:4:4:10] [async-threads:1] [hipe] [lttng]

Eshell V10.4.4  (abort with ^G)
1> 
{{< / highlight >}}

Repare que ativamos o suporte ao LTTng com sucesso pois a opção _[lttng]_ apareceu na shell.

## Exemplos usando LTTng e BEAM

Todos os eventos pertencem a dois _domains_:

* [Dynamic Tracepoints](http://erlang.org/doc/apps/runtime_tools/LTTng.html#dyntrace-tracepoints): podem ser configurados e ativados ou desativados durante a execução da BEAM VM. Usamos a função [erlang:trace/3](http://erlang.org/doc/man/erlang.html#trace-3) para controlar o que iremos fazer o trace
* [BEAM Tracepoints](http://erlang.org/doc/apps/runtime_tools/LTTng.html#beam-tracepoints): não podem ser controlados. Estes eventos são emitidos independentemente.

### Exemplo básico

O melhor exemplo é o documentado aqui [Example of process tracing](http://erlang.org/doc/apps/runtime_tools/LTTng.html#example-of-process-tracing):

{{< asciicast hEw4Z25nz7vhXe30OhjWKiqq7 >}}

A visualização do trace pode ser feita usando a ferramenta [Tracecompass](https://www.eclipse.org/tracecompass/). Mas ainda não consegui criar bonitos dashboards para mostrar aqui.

## Quais os cenários que posso utilizar?

Tirando o fato que é necessário fazer a recompilação da BEAM VM, podemos ter uma versão dos pacotes compilados com a flag ativada _with-dynamic-trace_ e somente usados durante os testes de performance e carga do sistema. Caso esteja usando Linux em qualquer distribuição não é complicado criar pacotes customizados com a flag habilitada.

Durante o desenvolvimento ou investigação de algum bug bem específico os traces podem ser utilizados ao invés das técnicas convencionais (por exemplo: logs).

Creio que poucos desenvolvedores sabem que podem utilizar estes recursos. BEAM VM entrega este recurso já pronto, sem a necessidade de instrumentar a aplicação.
