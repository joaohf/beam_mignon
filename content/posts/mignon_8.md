---
title: "Polibot"
description: "Um robô para testes"
date: 2019-08-24T18:00:50+02:00
tags: ["projeto", "testes"]
---

`polibot` é um pequeno projeto demonstrando como testar um equipamento fictício utilizando Erlang e o framework `common_test`.

Durante este post, vamos exercitar um cenário e construir uma solução para testes sistêmicos.

O código do projeto foi disponibilizado aqui: [polibot](https://github.com/joaohf/polibot)

# Geometric Box System

1. O nome do equipamento é _Geometric Box System_ (GBS) e possui três principais tipos de hardwares, onde cada hardware é composto por uma placa processadora e alguns devices para realizar determinadas operações. Todos os hardwares utilizam sistema operacional Linux e podem ser acessados normalmente utilizando conexão SSH. Os tipos de hardware são:
  1. _Square Board_ (SB), é o principal hardware da solução e faz o controle de todos os outros hardwares
  2. _Circle Board_ (CB), apenas um hardware deste tipo por equipamento. A principal função é sincronia de tempo
  3. _Triangle Board_ (TB), cada equipamento pode possuir um ou mais hardwares deste tipo e é onde o processamento ocorre.

2. Cada tipo de hardware possue 4 LEDs nos quais podemos configurar a cor e intensidade

O objetivo é criar uma infraestrutura no qual possa realizar uma bateria de testes utilizando o cenário e o equipamento acima. E é desejado que a solução possa:

* Executar comandos em qualquer hardware
* Obter um relatório final para o testes executados
* Mudar a configuração de acesso deve ser uma operação trivial
* Desejável que todas as operações possam ser realizadas via SSH

O cenário acima é fictício e para a criar um ambiente simulado iremos utilizar containers docker conectados em uma rede interna. Assim, podemos conectar e executar os comandos utilizando conexões SSH.

# Mas qual é o objetivo mesmo?

A ideia é representar um conjunto de SUTs (System Under Test) usando processos Erlang. Desta forma, podemos enviar mensagens para o processo executar determinada operação e a cada resposta checamos o resultado.

Este conceito lembra algo sobre [Digital Twin](https://en.wikipedia.org/wiki/Digital_twin) mas aplicado para testar condições em sistemas externos. Um processo representa o estado atual que estamos testando.

Neste exercício vamos ver os seguintes tópicos:

* como criar os testes utilizando o framework _common\_test_
* implementar módulos auxiliares para ajudar durante os testes
* explorar os relatórios do _common\_test_

Será que vamos conseguir testar alguma coisa?

# Construção da solução

Por falta de imaginação os casos de testes são simples demais, mas a intenção é mostrar como tudo poderia funcionar em um projeto real.

## Plano de testes

Vamos dividir os testes em um _test suite_ possuindo um conjunto de casos de teste e dividido em grupos:

* _test/gbs\_SUITE.erl_
  * bringup
    * conectar e desconectar utilizando protocolo SSH
  * board_init
    * inicializar board  
    * finalizar board
  * leds: testes dos leds de cada board
    * enviar comando para ascender e apagar led
    * enviar comando para ascender e apagar led com um range de luminosidade

## docker, docker-compose, hosts

Para simular o ambiente vamos utilizar `docker-compose` para criar um conjunto de hosts em uma rede interna. O importante aqui é que cada host tenha um serviço SSH habilitado para receber conexões sem solicitar senha.

A implementação do docker-compose pode ser vista aqui: [docker-compose.yml](https://github.com/joaohf/polibot/blob/master/docker/docker-compose.yml) e é bastante simples.

O importante é que todos os hosts estejam na mesma rede e acessíveis utilizando nomes. Exemplo: square0, square1, circle0, triangle0.

Um outro detalhe é que vamos rodar os testes dentro de um container docker para poder acessar a rede criada pelo docker-compose.

Para criar o ambiente fazemos:

{{< highlight bash >}}
make up
{{< / highlight >}}

E para remover os containers:

{{< highlight bash >}}
make down
{{< / highlight >}}

Durante o desenvolvimento vamos deixar um terminal aberto com o seguinte comando para iniciar o docker-compose e conectar um container com uma imagem Erlang na rede criada pelo docker-compose:

{{< highlight bash >}}
make shell
{{< / highlight >}}

Para esta solução funcionar, precisamos criar chaves ssh para que o processo de autenticação ocorra sem a necessidade de usuário e senha. Para criar um par de chaves públicas e privadas fazemos:

{{< highlight bash >}}
make ssh-keygen
{{< / highlight >}}


## Obter um relatório final para o testes executados

Dentro do _make shell_, executamos o seguinte comando para invocar o common_test:

{{< highlight bash >}}
rebar3 ct --spec test/gbs.spec
{{< / highlight >}}

Usamos um comando do `rebar3` para chamar o common_test. A opção `--spec` serve para passarmos configurações adicionais para o framework. Como por exemplo:

* arquivo contendo as configurações de ssh, _test/sshconfig.cfg_
* arquivo contendo as configurações de comandos usados durante o teste, _test/gbs.cfg_

Mais detalhes dos argumentos e funcionalidades em [rebar3 ct](https://www.rebar3.org/docs/commands#section-ct) e [Running Tests and Analyzing Results](http://erlang.org/doc/apps/common_test/run_test_chapter.html).

A cada execução dos testes um relatório é gerado onde podemos acompanhar os resultados. Eu gosto bastante dos relatórios pois são simples e com alguns detalhes importantes como tempo de execução e configuração do ambiente.

{{< figure src="/images/polibot_results_1.png" title="Página inicial do relatório de testes" >}}


{{< figure src="/images/polibot_results_2.png" title="Overview dos resultados dos testes" >}}

## Mudar as configuração dos testes deve ser trivial

Caso seja necessário mudar as configurações de acesso e também os comandos deve ser uma operação trivial sem a necessidade de alterar código. As alterações devem ser feitas nos arquivos de configuração:

* _test/sshconfig.cfg_
* _test/gbs.cfg_

As configurações utilizam _Erlang Terms_ e são simples arquivos textos. A ideia é que a partir dos arquivos os testes possam ser configurados facilmente.
  
## Desejável que todas as operações possam ser realizadas via SSH

O módulos _src/board.erl_ exporta algumas funções para conexão e envio de comandos usando trocas de mensagens entre o _test case_ e o módulo board. As mensagens são processadas e enviadas para o host utilizando um cliente SSH ([ct_ssh](http://erlang.org/doc/man/ct_ssh.html)).

Uma necessidade deste projeto é que não queremos utilizar nenhuma ferramenta extra do host. E também queremos total controle da conexão SSH, inclusive verificando o _know\_hosts_, fingerprints e chaves privdas ssh. Para isso implementamos uma callback do módulo [ssh](http://erlang.org/doc/apps/ssh/index.html) no qual possibilita o controle destas operações. Veja a implementação no arquivo _src/board\_ssh\_key\_cb.erl_.

Imagine em um produto real onde podemos ter o controle das operações feitas por SSH. Com certeza economizando tempo e criando versatilidade.

# Conclusão

O código fonte está disponível aqui: https://github.com/joaohf/polibot.

Não é complicado utilizar o framework common_test para criar testes sistêmicos. É uma outra abordagem de como realizar testes e as questões precisam ser elaboradas de forma a pensar como um usuário da solução.

Existem outros clientes para diversos tipos de protocolos tais como: ftp, netconf, rpc, snmp, telnet. E também a possibilidade de implementar um novo cliente usando os hooks do common_test. Isso é bastante útil pois durante os testes, geralmente, não estamos interessados no meio de comunicação entre dois serviços. Exemplo: verificar se determinado arquivo está presente no host remoto.

