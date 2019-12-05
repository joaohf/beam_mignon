---
title: "Como documentar e comunicar aplicações OTP"
description: ""
toc: true
date: 2019-11-26T22:43:50+02:00
series: ["documentation"] 
tags: ["otp", "diagram"]
featured_image: 'images/featured/20190823_131050-0-0.jpg'
---

Documentar um projeto de software com o objetivo de agilizar a comunicação durante o desenvolvimento de um projeto é fundamental para muitas equipes e pode minimizar o tempo de desenvolvimento. Um time alinhado, onde todos saibam como é a arquitetura das soluções, fortalece o senso de `ownership`.

Mas como podemos documentar a arquitetura de software quando estamos utilizando Erlang ou Elixir? Será que existe algum padrão, diagrama ou técnica?

Este post vai abordar como podemos criar uma documentação efetiva.

## Plantuml

Neste post vamos utilizar diagramas feitos usando a ferramenta [Plantuml](http://plantuml.com/) na qual é bastante fácil de utilizar e não é necessário nenhum editor especial. É como programar usando uma linguagem descritiva.

Para facilitar, criei alguns includes nos quais podem ser úteis para a escrita dos diagramas. Coloquei todos os includes no seguinte repositório: https://github.com/joaohf/OTP-PlantUML

### Diagrama de Sequencia

{{< figure src="/puml/19.2.png" >}}

E abaixo está o script que usei para contruir a imagem acima:

{{< highlight txt "linenos=inline">}}
@startuml
!include https://raw.githubusercontent.com/joaohf/OTP-PlantUML/master/OTP_Sequence.iuml

GenServer(base_server, "Base.Server")
GenServer(top_server, "Top.Server")

call(base_server, top_server, "init")
call_return(top_server, base_server, "ok")

call(base_server, top_server, "init2", "ok")

info(base_server, top_server, "test")

cast(base_server, top_server, "stop")

@enduml
{{< / highlight >}}

Usando o include [OTP_Sequence.iuml](https://raw.githubusercontent.com/joaohf/OTP-PlantUML/master/OTP_Sequence.iuml), podemos descrever o diagrama de sequencia utilizando alguns facilitadores nos quais imitam as funções exportados pelo módulo [gen_server](https://erlang.org/doc/man/gen_server.html):

* call, mensagem assíncrona tratada pela callback `Module:handle_call/3`
* cast, mensagem sincrona tratada pela callback `Module:handle_cast/2`
* info, mensagem tratada pela callback `Module:handle_info/2`

Um outro aspecto que facilita a comunicação é incluir estereótipos no diagrama. Nas linhas 4 e 5 definimos duas entidades participantes que são `GenServer` e nomeados como _Base.Server_ e _Top.Server_.

### Árvore de supervisão

Geralmente quando queremos saber o que uma aplicação escrita em Erlang ou Elixir faz, começamos entendendo a árvore de supervisão. Ou seja, quais os processos são iniciados quando a aplicação inicializa.

Documentar como os processos e quais os tipos de supervisão a aplicação utiliza fica bem fácil utilizando o include [OTP_SupervisorTree](https://raw.githubusercontent.com/joaohf/OTP-PlantUML/master/OTP_SupervisorTree.iuml).

{{< figure src="/puml/19.1.png" >}}

O seguinte código foi usado para gerar a imagem acima:

{{< highlight txt "linenos=inline">}}
@startuml
!include https://raw.githubusercontent.com/joaohf/OTP-PlantUML/master/OTP_SupervisorTree.iuml

Supervisor(base, "Base", "one_for_one")
GenServer(base_server, "Base.Server")
Agent(base_report, "Base.Report")
TaskSupervisor(base_supervisor, "Base.Supervisor")

Rel(base, base_server)
Rel(base, base_report)
Rel(base, base_supervisor)

@enduml
{{< / highlight >}}

Entre as linhas 4 e 7 definimos os tipos de processos (supervisor ou worker) bem como o tipo the _behaviour_ que eles implementam. Exemplos:

* Supervisor
* GenServer
* Agent
* TaskSupervisor

O diagrama final tem a intenção de passar o máximo de informação necessária para o entendimento inicial da aplicação.

## Conclusão

Existem várias modos de documentar uma arquitetura de software, tudo depende do nível de detalhes e quanto de esforço é necessário para criar diagramas efetivos.

Neste post apresentei duas formas de documentar usando dois aspectos, nos quais juntos, resultam em uma visão da arquitetura do software.

Acredito que diversos diagramas do UML podem ser utilizados, tais como componentes, deployment, máquina de estado. A ferramenta Plantuml possui suporte para todos eles. E caso possua algum diagrama que possa ser melhor representado, abra um _pull request_ no projeto [OTP-Plantuml](https://github.com/joaohf/OTP-PlantUML).
