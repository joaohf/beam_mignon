---
title: "meta-erlang com LTTng"
description: ""
toc: true
date: 2019-09-11T22:43:50+02:00
tags: ["code", "trace", "yocto", "runtime_tools"]
series: ["traces"]
---

Neste post vamos ativar o suporte LTTng na BEAM VM usando o projeto Yocto com a layer [meta-erlang](https://github.com/joaohf/meta-erlang). O objetivo é demonstrar como podemos fazer a análise de um problema utilizando esta abordagem.

Caso nunca tenha ouvido falar do projeto Yocto, tenha em mente que os conhecimentos usados aqui funcionam para qualquer distribuição Linux.

Basicamente vamos explorar quatro grandes blocos:

* BEAM VM, com suporte ao LTTng habilitado
* Yocto Project, onde vamos usar uma distro básica com Erlang
* Tracecompass, um plugin do projeto Eclipse para visualização e monitoramento de traces
* Um código de exemplo em Erlang, apresentando algum problema no qual podemos visualizar com o LTTng.

# Parte A: entendendo a infraestrutura

## Ativando LTTng na layer

Adicione a seguinte configuração no arquivo _conf/local.conf_:

{{< highlight txt >}}
PACKAGECONFIG_append_pn-erlang = " lttng"
{{< / highlight >}}

Isso vai fazer com que a receita compile a BEAM VM com suporte ao LTTng.

Também, ainda no mesmo arquivo, vamos adicionar algumas features na imagem final na qual vai conter todas as ferramentas que precisamos:

{{< highlight txt >}}
EXTRA_IMAGE_FEATURES = "debug-tweaks eclipse-debug tools-profile ssh-server-openssh"
{{< / highlight >}}

A descrição de cada feature pode ser vista aqui: [Image Features](https://www.yoctoproject.org/docs/2.7.1/ref-manual/ref-manual.html#ref-features-image)

Também vamos incluir os pacotes necessários para usar Erlang na distro, ou seja:

 * _erlang_
 * _runtime-tools_, na qual possuem ferramentas de _tracing/debugging_ apropriados para produção

{{< highlight txt >}}
IMAGE_INSTALL_append = " erlang erlang-runtime-tools"
{{< / highlight >}}

O passo final é fazer a build da imagem mínima:

{{< highlight txt >}}
bitbake core-image-minimal
{{< / highlight >}}

## Testando a distro

Todo o ambiente será emulado usando o _qemu_. Então vamos executar o qemu e testar a conectividade e ferramentas.

{{< highlight txt >}}
runqemu core-image-minimal
{{< / highlight >}}

Há instruções no manual [Yocto Project Profiling and Tracing Manual](https://yoctoproject.org/docs/2.7.1/profile-manual/profile-manual.html#lttng-linux-trace-toolkit-next-generation) no qual podemos usar para testar se o ambiente está funcionando.

O mais importante aqui é a conexão ssh funcionando.

## Conectando com o Tracecompass

A próxima etapa será instalar e configurar o Tracecompass para acessar o ambiente remoto. No manual da ferramenta há uma sessão sobre como configurar o Tracecompass com [LTTng Control](http://archive.eclipse.org/tracecompass/doc/stable/org.eclipse.tracecompass.doc.user/LTTng-Tracer-Control.html#LTTng_Tracer_Control)

Caso esteja perdido nos conceitos, recomendo a leitura do manual do LTTng e Tracecompass.

Nesta etapa o objetivo é:

* criar uma sessão de trace
* ativar dois canais (Kernel e UST)
* iniciar a sessão
* executar alguns comandos na shell Erlang
* parar a sessão
* importar o trace
* tentar analisar utilizando as visões do Tracecompass

Parece complicado mas não é.

A figura abaixo mostra uma tela do Tracecompass com um trace:

{{< figure src="/images/lttng_trace_kernel_ust_erlang_demo.png" title="Trace erlang-demo" >}}

Dica: este manual de usuário do [Renesas Integrated Development Environment](https://www.renesas.com/us/en/doc/products/tool/doc/014/r20ut4479ej0000-lttng.pdf) mostra mais detalhes de como configurar o Tracecompass. Usei o manual para entender como funcionava a ferramenta.

# Parte B: caso de uso, EMQ

Nas próximas sessões vamos analisar um caso real e juntar todas as peças.

Não temos nenhum problema em vista. Mas iremos analisar o comportamento do software [EMQ](https://www.emqx.io/) do ponto de vista do Sistema Operacional e BEAM VM. O nosso objetivo é:

* ativar os traces
* iniciar o EMQ
* interagir com o dashboard web
* desativar o trace
* analisar os dados

Lembrando que, na BEAM VM, há dois domínios de trace:

* [Dyntrace](http://erlang.org/doc/apps/runtime_tools/LTTng.html#dyntrace-tracepoints)
* [BEAM](http://erlang.org/doc/apps/runtime_tools/LTTng.html#beam-tracepoints)

Recomendo a leitura dos tópicos acima para ter um descritivo de como são estes traces.

Nesta demonstração vamos ativar os seguintes traces:

* BEAM: todos os eventos
* Dyntrace:
  * _procs_, todos os eventos que sejam relacionados a um processo
  * _call_, chamadas e retorno de funções

Para ativar os _dyntrace_ precisamos utilizar a função [erlang:trace/3](http://erlang.org/doc/man/erlang.html#trace-3):

{{< highlight bash "linenos=inline" >}}
1> erlang:trace(new,true,[procs, call, return_to, {tracer,dyntrace,[]}]).
{{< / highlight >}}

Como estamos fazendo o trace de chamadas de funções, precisamos informar quais as funções que queremos trace. Então vamos utilizar a função [erlang:trace_pattern/3](http://erlang.org/doc/man/erlang.html#trace_pattern-3) (recomendo a leitura e entendimento):

{{< highlight bash "linenos=inline" >}}
2> erlang:trace_pattern({emqx_dashboard_admin, add_user, 3}, true, [local]).
{{< / highlight >}}

Assim indicamos que iremos rastrear a função _add_user_ com três parâmetros do módulo _emqx_dashboard_admin_. Vamos ver a chamada e retorno desta função.

{{< figure src="/images/lttng_trace_emqx0.png" title="Chamada da função add_user" >}}

{{< figure src="/images/lttng_trace_emqx1.png" title="Chamada da função add_user com contexto do Kernel" >}}

{{< figure src="/images/lttng_trace_emqx2.png" title="Retorna da função add_user com contexto do Kernel" >}}

O meu objetivo aqui não é mostrar todas as análises que podemos fazer com LTTng e Tracecompass, pois são ferramentas bem interessantes de utilizar e amplas.

A intenção foi demonstrar como podemos utilizar estas ferramentas para trace e como a BEAM VM já está preparada para isso.
