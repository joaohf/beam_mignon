---
title: "eclero, coletando métricas"
description: ""
toc: true
date: 2020-01-29T18:43:50+02:00
series: ["observability"] 
tags: ["code", "observable", "metrics"]
featured_image: 'images/featured/observability-1-0.jpg'
---

Nesta série de posts sobre Observability vamos instrumentar e estruturar uma aplicação com o objetivo de estudar as estratégias escolhidas.

## O que é Observability

Resumidamente, é coletar várias visões internas e externas de uma aplicação e correlacionar posteriormente em um sistema externo.

As aplicações e dependências precisam ser instrumentados para enviarem diferentes visões:

* métricas
* traces
* logs
* alertas

## Observability para BEAM

Existem várias bibliotecas e iniciativas quando usamos Elixir/Erlang. Veja uma lista neste link: https://github.com/erlef/eef-observability-wg.

Também existe a dúvida de qual utilizar. De fato um dos WG (Working Groups) chamado [Observability Working Group](https://erlef.org/wg/observability) da ERLF (Erlang Ecosystem Foundation) é para ajudar a organizar as iniciativas.

Neste post vamos utilizar o projeto `beam-telemetry`.

## beam-telemetry

É um projeto no qual possui algumas bibliotecas para organizar e estruturar o envio de métricas.

A principal biblioteca é `telemetry` no qual quando a aplicação precisa emitir uma métrica, a função `telemetry:execute/3` é chamada para realizar a operação.

Instrumentar uma aplicação para o envio de métricas deve ser uma tarefa de dois passos:

1. Definir as métricas que são importantes
2. Chamar a função telemetry:execute/3 nos pontos estratágicos

O propósito da biblioteca telemetry é implementar uma interface única para todas as aplicações que precisam enviar métricas.

{{< note >}}
O que faz bastante sentido pois em diversas bibliotecas precisamos criar algum tipo de wrapper para enviar métricas ou a própria biblioteca já impõem uma dependência externa.
{{< /note >}}

Uma vez definida a interface, é necessário definir quais os tipos de métricas queremos enviar. A biblioteca `telemetry_metrics` implementa estas definições nas quais podem ser:

* _counter_: número total da métrica
* _last\_value_: último valor da métrica
* _sum_: matem a somatória da métrica
* _summary_: calcula estatísticas da métrica
* _distribution_: constroi um histograma de acordo coms os buckets configurados

Antes de enviar a métrica para algum outro sistema externo, a decisão do que fazer e como estruturar cada métrica é responsabilidade de um tipo de aplicação chamada _reporter_. beam-telemetry traz alguns reporters oficiais:

* [prometheus](https://github.com/beam-telemetry/telemetry_metrics_prometheus)
* [statsd](https://github.com/beam-telemetry/telemetry_metrics_statsd)

E outros criados pela comunidade

* [zabbix](https://github.com/lukaszsamson/telemetry_metrics_zabbix)
* [riemann](https://github.com/joaohf/telemetry_metrics_riemann)

{{< note >}}
O reporter para riemann estou desenvolvendo e vamos utilizar neste post.
{{< /note >}}

Mas qual é a função de um reporter? Preparar e enviar a métrica para outro sistema. Por exemplo, o reporter para prometheus [TelemetryMetricsPrometheus.Core](https://github.com/beam-telemetry/telemetry_metrics_prometheus_core/tree/master/lib/core) precisa preparar os _scrapes_ para que o Prometheus colete adequadamente. Então este reporter precisa fazer agregações na aplicação para cada nova métrica emitida pelo telemetry.

Por outro lado, os reporters [TelemetryMetricsStatsd](https://github.com/beam-telemetry/telemetry_metrics_statsd), [TelemetryMetricsRiemann](https://github.com/joaohf/telemetry_metrics_riemann) apenas preparam e enviam a métrica no formato esperado pelos sistemas externos. Nenhuma operação de agregação é realizada na aplicação.

{{< tip >}}
Veja este link [Push vs Pull](https://blog.sflow.com/2012/08/push-vs-pull.html) para um entendimento melhor sobre este tipo de arquitetura.
{{< /tip >}}

Para implementar algum outro reporter o projeto beam-telemetry definiou algumas guias gerais de como fazer aqui: 
https://hexdocs.pm/telemetry_metrics/Telemetry.Metrics.html#module-reporters

## Definindo as métricas

Usando a API da biblioteca [Telemetry.Metrics](https://hexdocs.pm/telemetry_metrics/Telemetry.Metrics.html) definimos as métricas no seguinte formato:

{{< highlight erlang >}}
Telemetry.Metrics.counter("http.request.stop.duration")
{{< / highlight >}}

Onde:

* `Telemetry.Metrics.counter` é o tipo da métrica
* `"http.request.stop.duration"` é interpretado da seguinte forma:
 * `"http.request.stop"`: nome do evento (_event name_)
 * `"duration"`: medição (measurement)

A string `"http.request.stop.duration"` pode ser representada como uma lista de atoms também: `[http, request, stop, duration]`.

Cada tipo de métrica pode receber diversos parâmetros. Recomendo usar como referência a documentação https://hexdocs.pm/telemetry_metrics/Telemetry.Metrics.html#functions

{{< tip >}}
O importante é saber que uma métrica é composto por _event name_ e _measurement_. Então podemos ter vários _measurements_ dentro de um _event name_.
{{< /tip >}}

Na sessão [abaixo]({{< relref "#exemplo-eclero-com-telemetry" >}}) vamos implementar as métricas mas antes precisamos definir o que queremos contar. No momento estou interessado em saber:

| Descrição | _event name_ + _measurement_ |
| --------- | ---------------------------- |
| A quantidade de http requests no endpoint _/check_ foram feitas | `[http, request, check, done]` |
| A quantidade de nós online no cluster | `[decision, server, nodes, up]` |
| A quantidade de nós offline no cluster | `[decision, server, nodes, down]` |

## Exemplo: eclero com telemetry

Neste exemplo vamos intrumentar a aplicação eclero utilizando telemetry enviando as métricas para o reporter riemann.

O módulo _eclero\_metric.erl_ foi criado para conter toda a implementação das métricas. Durante a inicialização da aplicação eclero, a função `eclero_metric:options()` é chamada retornando a configuração necessária para o reporter `TelemetryMetricsRiemann` funcionar.

{{< ghcode title="Configuração do telemetry report" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_metric.erl" start=8 end=14 highlight="linenos=inline" >}}

Já na função `eclero_metric:metrics()` definimos todas as métricas que serão inicializadas pelo `telemetry`.

{{< ghcode title="Definição das métricas" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_metric.erl" start=17 end=28 highlight="linenos=inline" >}}

Também definimos funções nas quais preenchem com os argumentos corretos na API do `telemetry`. 

{{< tip >}}
Definindo as próprias funções é útil para fazermos manutenção, mudança de API ou algum tipo de transformação nos dados. Uma alternativa é chamar a função `telemetry:execute/3` em vários pontos do código.
{{< /tip >}}

{{< ghcode title="Acessores das métricas" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_metric.erl" start=31 end=42 highlight="linenos=inline" >}}

O próximo passo foi selecionar os pontos que queremos coletar métricas:

* A quantidade de http requests no endpoint _/check_ foram feitas:
{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_http.erl" start=36 end=41 highlight="linenos=inline" >}}
* A quantidade de nós online e offline no cluster:
{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_decision_server.erl" start=57 end=67 highlight="linenos=inline" >}}
* A quantidade de nós offline no cluster:
{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_decision_server.erl" start=69 end=79 highlight="linenos=inline" >}}

O último passo foi adicionar o processo do TelemetryReportRiemann na árvore de supervisão da aplicação:

{{< ghcode title="" lang="erlang" owner="joaohf" repo="eclero" ref="master" path="apps/eclero/src/eclero_sup.erl" start=28 end=43 highlight="linenos=inline" >}}

### riemann

Para verificar se as métricas estão sendo enviadas para o servidor, precisamos subir um [servidor riemann local](https://riemann.io/quickstart.html):

````bash
wget https://github.com/riemann/riemann/releases/download/0.3.5/riemann-0.3.5.tar.bz2
tar jxf riemann-0.3.5.tar.bz2 
cd rieamnn-0.3.5
bin/riemann start
INFO [2020-01-03 18:11:57,259] main - riemann.bin - Loading /home/joaohf/tmp/riemann-0.3.5/etc/riemann.config
INFO [2020-01-03 18:11:57,295] main - riemann.bin - PID 14129
INFO [2020-01-03 18:11:57,443] clojure-agent-send-off-pool-5 - riemann.transport.websockets - Websockets server 127.0.0.1 5556 online
INFO [2020-01-03 18:11:57,507] clojure-agent-send-off-pool-2 - riemann.transport.udp - UDP server 127.0.0.1 5555 16384 -1 online
INFO [2020-01-03 18:11:57,528] clojure-agent-send-off-pool-0 - riemann.transport.tcp - TCP server 127.0.0.1 5555 online
INFO [2020-01-03 18:11:57,530] main - riemann.core - Hyperspace core online
````

Com o servidor executando em um shell, vamos inspecionar os pacotes enviados. Pois no momento não estamos intressados em ver as métricas do lado do riemann server.

### Verificando as métricas

Utilizando a ferramenta [Wireshark](https://www.wireshark.org/), podemos inspecionar os pacotes enviados usando o [protocolo riemann](https://riemann.io/concepts.html).

* Evento quando enviamos um contador da request check;
````
Frame 1: 151 bytes on wire (1208 bits), 151 bytes captured (1208 bits) on interface 0
Ethernet II, Src: 00:00:00_00:00:00 (00:00:00:00:00:00), Dst: 00:00:00_00:00:00 (00:00:00:00:00:00)
Internet Protocol Version 4, Src: 127.0.0.1, Dst: 127.0.0.1
User Datagram Protocol, Src Port: 43788, Dst Port: 5555
Riemann
    event
        time: 1578073675
        service: eclero.http.request.check.done
        host: porco
        description: Number of received check requests
        attribute
            key: status_code
            value: 200
        metric_sint64: 1
        metric_f: 1
````

{{< warning >}}
No exemplo acima temos um payload de 151 bytes, sendo que o evento riemann ocupa 125 bytes. Podemos reduzir este payload eliminando o campo _description_.
{{< /warning >}}

* Para os eventos de node up e node down, temos:
````
Riemann
    event
        time: 1578073822
        service: eclero.decision.server.nodes.up
        host: porco
        description: Number of nodes online
        metric_sint64: 1
        metric_f: 1
    event
        time: 1578073822
        service: eclero.decision.server.nodes.down
        host: porco
        description: Number of nodes offline
        metric_sint64: 0
        metric_f: 0
````

## Erlang com Elixir, gestão de dependências

eclero utiliza rebar3 para gestão de dependências. Entretanto telemetry_metric_riemann foi implementado em Elixir, usando mix como gestão de dependência. Como foi possível usar a biblioteca?

Utilizando um plugin chamado [rebar_mix](https://github.com/Supersonido/rebar_mix) foi possivel utilizar os pacotes Elixir com rebar3.

O interessante desda abordagem é a possibilidade de utilizar várias bibliotecas desenvolvidas em Elixir a partir do Erlang. Afinal, tudo é BEAM.

Para mais detalhes vale a pena consultar três referências:

* [rebar3 plugin: Elixir Dependencies](https://www.rebar3.org/docs/using-available-plugins#section-elixir-dependencies)
* [rebar_mix](https://github.com/Supersonido/rebar_mix#use)
* [Adopting Erlang: Dependencies](https://adoptingerlang.org/docs/development/dependencies) na sessão _Using Elixir Dependencies_

## Conclusão

Instrumentar uma aplicação é simples e o tempo deve ser gasto na definição das métricas. Respondendo se determinada métrica faz sentido e ajuda na identificação de problemas relacionados as regras de negócio. Todas as métricas que ajudem durante uma análise da saúde da aplicação fazem sentido de serem implementadas.
