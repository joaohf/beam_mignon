---
title: "Brincando com Erlang nodes: eclero"
description: ""
toc: true
date: 2019-12-05T22:43:50+02:00
series: ["erlang nodes"] 
tags: ["code", "failure", "eclero"]
featured_image: 'images/featured/eclero-0-0.jpg'
---

Este post faz parte de uma série de outros posts relacionados a como usar _Erlang distribution protocol_.

Vamos iniciar alguns trabalhos para explorar como desenvolver, testar e experimentar utilizando nodes Erlang e uma aplicação distribuída.

Na primeira parte dos trabalhos vou contar um pouco sobre o design, detalhes de implementação e testes. A intenção foi implementar uma aplicação simples mas que utilize diversos conceitos e recursos do ambiente podendo ser utilizada para futuras experimentações.

O objetivo da aplicação é receber um request HTTP na qual deve responder com sucesso caso todos os nós do ambiente estejam operacionais. Caso algum nó da solução esteja indisponível a aplicação deve retornar um erro com o respectivo HTTP status code.

Alguns cenários de exemplos:

{{< figuretable >}}
{{< figurecell >}}
{{< figure figcaption="1: Nós operacionais." >}}
  {{< img 20_003.png Fit "500x400" >}}
{{< /figure >}}
{{< /figurecell >}}

{{< figurecell >}}
{{< figure figcaption="2: Nós em falha." >}}
  {{< img 20_004.png Fit "500x400" >}}
{{< /figure >}}
{{< /figurecell >}}

{{< figurecell >}}
{{< figure figcaption="3: Nós em falha." >}}
  {{< img 20_005.png Fit "500x400" >}}
{{< /figure >}}
{{< /figurecell >}}
{{< /figuretable >}}

1. Com todos os nós operacionais as requests HTTP são respondidas com [code status 200 OK](https://httpstatuses.com/200)
2. Caso um nó entre em falha, as requests retornam [code status 503 Service Unavailable](https://httpstatuses.com/503)
3. Mais nós em falha.

A aplicação foi nomeada de 'eclero' por falta de um nome melhor. E a implementação foi feita em Erlang/OTP. É importante ressaltar que o único motivo de utiizar Erlang neste projeto foi para usar o framework de testes chamado common_test. Poderia ter utilizado Elixir e os resultados seriam os mesmos.

Todo o código fonte foi disponibilizado aqui: [joaohf/eclero](https://www.github.com/joaohf/eclero).

Antes de desmembrar o projeto é importante definirmos alguns requisitos (funcionais e não funcionais):

1. Cada nó necessita detectar e ser notificado de qualquer falha dos outros nós
2. O cluster de nós Erlang deve ser configurado utilizando algum tipo de configuração vinda do ambiente
3. O ambiente de execução é Linux
4. Desejável poder rodar em um ambiente embarcado com o mínimo de recursos necessários
5. Mínimo de 3 nós para a solução funcionar

## Design geral

O deployment da solução vai ocorrer em um ambiente simulado contendo no mínimo 3 nós Erlang e cada nó com uma instância da aplicação eclero:

{{< figure figcaption="3 nós no ambiente." >}}
  {{< img 20_001.png Fit "500x400" >}}
{{< /figure >}}

A aplicação eclero possui as seguintes responsabilidades:

* detectar se algum nó falhou
* decidir se o cluster está em um estado consistente
* prover uma interface HTTP 

Para isso vamos dividir a aplicação nos seguintes blocos:

* `detector`, responsável por detectar se algum nó falhou
* `decision`, recebe eventos de _node up_ e _node down_ vindas do detector, e decide se o cluster está saudável (health) ou não
* `health`, cliente utilizando Erlang RPC para consultar o estado de saúde de todos os nós
* `int_http`, interface HTTP exportando alguns endpoints para consulta.

{{< figure figcaption="Blocos internos da aplicação." >}}
  {{< img 20_006.png Fit "500x400" >}}
{{< /figure >}}

O código fonte foi organizado seguindo a estrutura OTP com os seguintes módulos no diretório _src_:

* eclero_app, implementa o behaviour _application_
* eclero_sup, supervisor principal da aplicação
* eclero_decision_server: _gen\_server_ para o bloco decision
* eclero_detector_server: _gen\_server_ para receber eventos do detector de falhas (aten)
* eclero_detector: behaviour para facilitar testes e possível troca de detector
* eclero_health: cliente utilizando Erlang RPC
* eclero_http: implementa as callbacks necessárias para a interface HTTP

{{< tip >}}
Visite estes dois links para relembrar sobre o OTP:
* [What is OTP?](https://learnyousomeerlang.com/what-is-otp)
* [Open Telecom Platform](https://erlang.org/doc/design_principles/users_guide.html)
{{< /tip >}}

eclero_sup é um supervisor no qual possui dois workers sob seu comando: eclero_decision_server e eclero_detector_server.

{{< figure figcaption="Árvore de supervisao do eclero." >}}
  {{< img 20.png Fit "500x400" >}}
{{< /figure >}}

Todos os testes foram implementados utilizando common_test e estão contidos no diretório _test_.

Já para gestão de build, a ferramenta escolhida foi o rebar3 utilizando dois plugins:

* [rebar3_lint](https://github.com/project-fifo/rebar3_lint), para chamar o [elvis](https://github.com/inaka/elvis) e fazer uma checagem de melhores práticas
* [coveralls](https://github.com/markusn/coveralls-erl), para enviar o resultados de cobertura dos testes para o serviço coveralls.io

Neste projeto, rebar3 é utilizado para:

* gestão de dependências
* compilação
* execução dos testes
* geração de release

O arquivo [rebar.config](https://github.com/joaohf/eclero/blob/master/rebar.config) possui todas as configurações feitas.

{{< note >}}
Recomendo olhar a documentação oficial do rebar3 pois sempre há algum parâmetro útil.
{{< /note >}}

Também configuramos um CI (Continuous Integration) apenas para fazer uma checagem e executar os testes a cada commit. Utilizamos o serviço travis-ci integrado com o github. Toda a configuração foi feita no arquivo [travis.yml](https://github.com/joaohf/eclero/blob/master/.travis.yml).


## Implementação

{{< note >}}
Recomendo revisar os conceitos de behaviour bem como a nomemclatura utilizada. Consulte esta referência para mais detalhes:
 * [OTP design principles: Behaviours](http://erlang.org/doc/design_principles/des_princ.html#behaviours)
{{< /note >}}

### Detector de falhas

O módulo eclero_detector_server foi implementado utilizando um gen_server. Na callback de inicialização registramos os nós que temos interesse em sermos notificados quando algum evento ocorre:

{{< ghcode title="Inicialização do decision server." lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_detector_server.erl" start=23 end=35 highlight="linenos=inline" >}}

A callback `register_interest/3` é um wrapper para as funções do aten. Estamos usando uma aplicação chamada [aten](https://github.com/rabbitmq/aten) na qual implementa o algorítimo utilizado para detectar se algum nó está vivo ou não.

Um ponto interessante é que a callback `init/1` obtem as configurações do ambiente, inicializa o estado a aplicação e depois retorna uma tupla contendo o atom 'continue'. Isso vai fazer com que o gen_server execute a callback `handle_continue/2` e continue a inicialização do gen_server.

Quando há qualquer mudança no estado dos nós, aten envia uma mensagem para o processo local registrado como eclero_detector_server. Então devemos implementar a callback `handle_info/2` para tratar este tipo de mensagem. Caso contrário o server irá descartar estas mensagens importantes.

{{< ghcode title="Tratando mensagens de up e down" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_detector_server.erl" start=52 end=57 highlight="linenos=inline" >}}

Com o evento e o nome do nó, avisamos o eclero_decision_server no qual vai tomar a decisão e registrar a informação do evento.

Também implementamos a callback `terminate/2` para desregistrar o monitoramento do nó feito pelo aten.

{{< ghcode title="Tratando mensagens de up e down" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_detector_server.erl" start=59 end=61 highlight="linenos=inline" >}}

### Servidor de decisão

Já no módulo eclero_decision_server a principal responsabilidade é responder se o cluster está operacional ou não. O requisito principal é apenas responder se um cluster está operacional se todos os nós estão operacionais.

Um ponto interessante é que o record state possui a quantidade de nós em estado up e down, bem como um `set` ([sets](http://erlang.org/doc/man/sets.html)) com todos os nós que participal do cluster:

{{< ghcode title="record state" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_decision_server.erl" start=21 end=23 highlight="linenos=inline" >}}

As funções do módulo sets são chamadas na callback `handle_cast/3` para adicionar ou remover os nós:

{{< ghcode title="Adicionar e remover nós" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_decision_server.erl" start=54 end=66 highlight="linenos=inline" >}}

Algumas APIs são exportadas por este módulo para consultar o estado de saúde do cluster. Em especial, a API is_health/0 e is_health/1 mostram dois comportamentos:

{{< ghcode title="APIs para consultar o estado do cluster" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_decision_server.erl" start=34 end=38 highlight="linenos=inline" >}}

A função `is_health/1`, aceita uma lista dos nós passando para a função `gen_server:multi_call/3` na qual faz uma chamada RPC para todos os nós e aguarda o retorno dos resultados.

Já quando chamada com arity 0, ou seja `is_health/0`, o nó local responde a chamada.

### Health API

eclero utiliza uma interface HTTP para responder as requests vindas. Mas o protocolo HTTP, neste caso, é apenas uma interface para alguma API interna da aplicação. 

O módulo eclero_health exporta uma API (`get/0`) mais simples para a interface HTTP usar, coletando a resposta de todos os nós e retornando as respostas.

{{< ghcode title="Interface simplificada" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_health.erl" start=5 end=10 highlight="linenos=inline" >}}

### Interface HTTP

E finalmente temos a interface HTTP implementada no módulo eclero_http, no qual implementamos algumas callbacks necessárias para o [cowboy](https://github.com/ninenines/cowboy) funcionar.

Quando há alguma request HTTP, o primeiro passo é verificar se o cluster está operacional. cowboy disponibiliza a callback `service_available/2` na qual vamos para perguntar ao decision server se está tudo Ok.

{{< ghcode title="Verifica se o cluster está Ok" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_http.erl" start=27 end=29 highlight="linenos=inline" >}}

Caso a função `eclero_decision_server:is_health/0` retorne true, a request vai prosseguir.

O próximo passo da request é processar a request. Isso é feito na função `to_text/2`:

{{< ghcode title="Testando a conversão to_text" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_http.erl" start=36 end=38 highlight="linenos=inline" >}}

`eclero_health:get/0` vai obter e retornar a resposta de todos os nós do cluster e a função `to_text/1` transformar a resposta em texto.

Adicionei um pequeno test unitário para a função privada `to_text/1`, utilizando [eunit](http://erlang.org/doc/apps/eunit/chapter.html):

{{< ghcode title="Interface HTTP" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_http.erl" start=42 end=60 highlight="linenos=inline" >}}

Queria ter certeza que a conversão está funcionando. Desta forma, com eunit, posso testar uma função privada. 

### Aplicação e Supervisor

E por fim o módulo eclero_app com algumas callbacks necessárias pedidas pelo behaviour application.

Na função `start/2`, obtemos a configuração da porta HTTP e iniciamos a interface HTTP. Logo após iniciamos o supervisor. 

{{< ghcode title="start da aplicação" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_app.erl" start=12 end=17 highlight="linenos=inline" >}}

Já na função `stop/1`, primeiro paramos a interface HTTP (para não responder nenhuma request a mais) e retornamos.  

{{< ghcode title="stop da aplicação" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_app.erl" start=19 end=21 highlight="linenos=inline" >}}

O módulo eclero_sup contem a criação da árvore de supervisão.

{{< ghcode title="stop da aplicação" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/src/eclero_sup.erl" start=28 end=39 highlight="linenos=inline" >}}

## Testes unitários

Não optei por utilizar testes unitários para testar o código da aplicação. Apenas usei o eunit para fazer um pequeno teste em um dos módulos.

A estratégia de testes adotada é algo mais sistêmica utilizando uma abordagem mais de fora para dentro.

## Testes funcionais

Todos os testes foram implementados utilizando o framework [common test](https://erlang.org/doc/apps/common_test/introduction.html). Cada arquivo implementa uma suite de testes com uma certa organização dos casos de testes, funções de setup e teardown do ambiente.

A implementação do testes foi feita em apenas um arquivo: _apps/eclero/test/eclero_SUITE.erl_ e alguns grupos de casos de testes foram definidos:

* system: utilizando o módulo [ct_slave](https://erlang.org/doc/man/ct_slave.html) para criação de nós Erlang adicionais, podemos testar como a aplicação eclero quando há mais de um nó
* decision: queremos apenas testar o server, o resto da aplicação não é inicializada
* detector: quermoes apenas testar o server, o resto da aplicação não é inicializada

{{< ghcode title="stop da aplicação" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="apps/eclero/test/eclero_SUITE.erl" start=33 end=42 highlight="linenos=inline" >}}

Quando executamos os testes do grupo `system`, cada teste irá executar num ambiente como o descrito na figura abaixo:

{{< figure figcaption="Nó common_test e System Under Test." >}}
  {{< img 20_002.png Fit "500x400" >}}
{{< /figure >}}

O nó ct apenas estimula, ou seja, chama as funções ou faz requests para o cluster. Enquanto outros nós estão executando a aplicação eclero e todas as suas dependências.

Em geral, common test é um framework bastante poderoso e exige organização dos testes para não virar uma grande confusão. Algumas dicas:

* estruturar os testes por blocos funcionais organizando em grupos lógicos
* iniciar pelo grupo lógico no qual consiga testar o máximo de elementos com o mínimo de código
* utilizar as funções `init_per_group/1` e `end_per_group/0`, `init_per_testcase/1` e `end_per_testcase/1` para fazer o setup e teardown dos grupos e casos de teste
* não é necessário utilizar asserts para averiguar o resultado esperado. Usando apenas pattern match é possível verificar as expectativas
* caso deseje falhar algum testes, use as funções do ct. Exemplo: `ct:fail/1`
* utilize as funções de logs quando necessário. Exemplo `ct:pal/1`
* use os resultados dos relatórios de coverage e também dos logs de testes para guiar os próximos passos

Para executar os testes e também extrair as informaçoes de coverage, configuramos o rebar3 da seguinte forma:

{{< ghcode title="Configuração para habilitar o coverage automático" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="rebar.config" start=48 end=48 highlight="linenos=inline" >}}

Assim quando executamos os comando abaixo, podemos acessar os relatórios.

* `rebar3 ct`: _build/test/logs/index.html

{{< figure figcaption="Relatório do common test" >}}
  {{< img screenshot_ct.png Fit "640x480" >}}
{{< /figure >}}

* `rebar3 cover`: _build/test/cover/index.html

{{< figure figcaption="Relatório de coverage" >}}
  {{< img screenshot_cover.png Fit "640x480" >}}
{{< /figure >}}

Para facilitar, criei um alias com os seguintes comandos: 

{{< ghcode title="Configuração para habilitar o coverage automático" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="rebar.config" start=1 end=6 highlight="linenos=inline" >}}

Assim posso executar `rebar3 check` e realizar todos os testes e análises necessárias.

## Testes locais

Queremos também poder executar a aplicação localmente para algum teste específico. Utilizando rebar3 é possível configurar um shell com a aplicação inicializada para podermos exercitar alguns comandos.

Adicionamos a seguinte configuração no arquivo rebar.config para iniciar um shell configurado como um nó.

{{< ghcode title="Configuração para habilitar distribution node" lang="erlang" owner="joaohf" repo="eclero" ref="mignon-20" path="rebar.config" start=14 end=17 highlight="linenos=inline" >}}

E para executar a aplicação: `rebar3 shell`

{{< figure figcaption="Relatório de coverage" >}}
  {{< img screenshot_shell.png Fit "640x480" >}}
{{< /figure >}}

Agora é uma boa hora para chamarmos o observer e visualizar alguns outros detalhes

{{< figure figcaption="Relatório de coverage" >}}
  {{< img screenshot_observer.png Fit "640x480" >}}
{{< /figure >}}

Com a aplicação executando, podemos enviar uma request e ver o resultado:

{{< highlight bash "linenos=inline,hl_lines=5 10" >}}
$ curl -v http://localhost:8000/check
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 8000 (#0)
> GET /check HTTP/1.1
> Host: localhost:8000
> User-Agent: curl/7.58.0
> Accept: */*
>
< HTTP/1.1 200 OK
< content-length: 18
< content-type: text/plain
< date: Mon, 16 Dec 2019 20:40:37 GMT
< server: Cowboy
<
* Connection #0 to host localhost left intact
{{< /highlight >}}

## Conclusão

Neste post, analisamos alguns aspectos da implementação da aplicação eclero. Foi uma navegada rápida nos principais pontos que julguei necessários.

Nos próximos posts vamos continuar a explorar como integrar e executar o eclero em um ambiente simulado e analisar o comportamento da solução.
