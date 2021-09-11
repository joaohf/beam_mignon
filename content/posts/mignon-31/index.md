---
title: 'Aplicações distribuídas com OTP'
description: 'Simples aplicação demonstrando conceitos de takeover e failover'
toc: true
date: 2021-10-03T21:46:00+02:00
series: ['101']
tags: ['code', 'toliman']
featured_image: 'images/featured/31.jpg'
---

# Distributed applications

O conceito de
[_distributed applications_](https://erlang.org/doc/design_principles/distributed_applications.html)
em Erlang/OTP segue a ideia de que determinada aplicação executa em um
determinado nó de um cluster. Se a aplicação parar por alguma falha, então a
aplicação vai ser iniciada em outro nó.

Isso não quer dizer que a aplicação vai estar rodando em todos os nós ao mesmo
tempo. Mas sim em apenas um determinado nó (de maior prioridade configurada).

O que vai estar rodando e ativamente controlando a aplicação é o
[\_distributed application controller](https://github.com/erlang/otp/blob/master/lib/kernel/src/dist_ac.erl).
Que é o que realmente faz o controle de onde e quando uma aplicação distribuída
vai ser executada.

## Principal caso de uso

O melhor caso de uso é quando temos uma aplicação na qual apenas uma instância
dela é necessária. E mesmo que haja uma falha, a mesma aplicação vai ser
iniciada em outro nó do cluster Erlang.

Distributed applications não é usado ou indicado para cenários onde a mesma
aplicação deve rodar em todos os nós.

## Conceitos importantes

Os três conceitos mais importantes para usar distributed applications são:

1. A aplicação é iniciada chamando {{< erlmfa "application:start/1" >}} em todos
   os nós. Mas somente em um nó a aplicação vai ser executada
2. failover: se a aplicação falhar no nó que ela esta rodando, então, a mesma
   será executada no próximo nó listado nos parâmetros de configuração
3. takeover: se um nó é iniciado e o mesmo tem uma prioridade maior de acordo
   com a configuração, então a aplicação é reiniciada no novo nó e parada no nó
   antigo.

## Exemplo: toliman

[toliman](https://github.com/joaohf/toliman) é uma aplicação Erlang/OTP na qual
implementa um exemplo usando distributed applications.

A ideia básica é ter em um cluster com N nós duas aplicações:

- proxima: uma instância apenas, usando distributed application
- centauri: iniciada e executando em todos os nós

De acordo com a interação dos nós, proxima pode fazer takeover e failover.

O test case abaixo testa um cenário básico de failover e takeover:

{{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="apps/centauri/src/centauri_app.erl" start=14 end=23 highlight="linenos=inline" >}}

### Iniciando a aplicação em todos os nós

O código abaixo mostra a chamada {{< erlmfa "application:start/1" >}} no qual
inicia a aplicação _proxima_ no nó. Entretanto, proxima só será realmente
iniciada caso o _dist_ac_ deixar (de acordo com as configurações).

{{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="test/toliman_SUITE.erl" start=74 end=114 highlight="linenos=inline" >}}

Em todo caso, se houver um failover, a aplicação será efetivamente iniciada.

### Como coordenar a transição durante um failover ou takeover

Bom, quando há um failover (o nó que está rodando a aplicação morre ou a
aplicação morre), não há o que fazer (caso os dados não estejam persistidos)
haverá perca de dados ou estado. Este é o cenário do failover, então uma nova
instância irá ser executada no próximo nó disponível.

Já para o caso do takeover, é uma operação mais controlada no qual a instância
antiga continua sendo executada no nó antigo enquanto a instância nova é inicia
no nó novo. Nestas condições podemos transferir o estado da aplicação antiga
para a nova.

Uma das soluções é usar
[_start phases_](https://erlang.org/doc/design_principles/included_applications.html#synchronizing-processes-during-startup)
e em cada fase temos a chance de fazer determinada operação para sincronizar o
estado remoto. Exemplo:

Os trechos abaixo mostram o que acontece em cada faze. Sendo:

- init: qualquer código de inicialização pode ser colocado nesta faze:
  {{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="apps/proxima/src/proxima_app.erl" start=37 end=40 highlight="linenos=inline" >}}

- takeover: caso haja um takeover forçado
  {{< erlmfa "application:takeover/1" >}} podemos atuar nesta faze. Por exemplo
  fazer alguma operação para desabilitar algo:
  {{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="apps/proxima/src/proxima_app.erl" start=41 end=47 highlight="linenos=inline" >}}

- go: a aplicação já foi iniciada está pronta. Neste passo podemos sincronizar o
  estado com a antiga instância:
  {{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="apps/proxima/src/proxima_app.erl" start=48 end=49 highlight="linenos=inline" >}}
  A função _profima:fetch_state/2_ transfere o estado:
  {{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="apps/proxima/src/proxima_app.erl" start=60 end=64 highlight="linenos=inline" >}}

### global e register

A aplicação _proxima_ é distribuída, rodando em qualquer nó do cluster. Para que
outras aplicações no cluster possam encontrar os processos e mandar mensagem,
uma das técnicas é registrar os processos locais como globais:

{{< ghcode title="" lang="erlang" owner="joaohf" repo="toliman" ref="beam-31" path="apps/proxima/src/proxima_app.erl" start=49 end=57 highlight="linenos=inline" >}}

O código acima faz o seguinte:

- Encontra qual é o PID que responde pelo nome _proxima_
- Registra o PID com um nome global onde todos os nós podem encontrar o PID

O módulo (https://erlang.org/doc/man/global.html) cuida de registrar um PID
globalmente.

## Conclusão

distributed application é algo funcional mas que demanda um certo entendimento e
cenários específicos. Além de orientar o design da aplicação pensando em
failover e takeover. Muitos podem desaconselhar mas aí cabe o entendimento da
feature e avaliar o seu uso.

A realidade é que implementar algo similar é bem mais complicado, e dependendo
do cenário, distributed application é algo factível.

Segue algumas referências externas para continuar os estudos:

- [9 Distributed Applications](https://erlang.org/doc/design_principles/distributed_applications.html)
- [Distribunomicon](https://learnyousomeerlang.com/distribunomicon)
- [erlang-questions Re: Distributed application takeover](http://erlang.org/pipermail/erlang-questions/2011-March/057323.html)
- [kernel application common test](https://github.com/erlang/otp/blob/master/lib/kernel/test/application_SUITE.erl)
