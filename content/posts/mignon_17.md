---
title: "Gerenciamento out-of-band: SQL"
description: ""
toc: true
date: 2019-09-14T22:43:50+02:00
series: ["out-of-band"] 
tags: ["code", "sql", "elock"]
---

A ideia deste post é abordar algumas maneiras de fazer um gerenciamento out-of-band de uma aplicação. E a inspiração veio desta discussão [sqlapi: library to connect to your erlang server via SQL](http://erlang.org/pipermail/erlang-questions/2018-March/095064.html):

> This library can help you to make an SQL server from your existing server.

> For example you have a server and let it be ejabberd. You want to give a
list of connected users.
Of course you will start from making HTTP endpoint that will reply with
JSON with list of users.

> Then you will add some sort, filter, paging as query params and then will
write library that allows to make all this params and send them.

> Another option is to put our sqlapi library, connect it to storage of
connected users and then connect to server as if it is a SQL server.

Vou usar o termo _out-of-band_ para explorar a ideia. Entretanto este termo vai ser utilizado de forma incorreta aqui. A intenção é mostrar que podemos gerenciar uma aplicação usando diferentes protocolos nos quais oferecem mais flexibilidade.

A definição correta é esta [out-of-band management](https://en.wikipedia.org/wiki/Out-of-band_management).

## Caso de uso

Imagine que temos uma aplicação na qual controla uma fechadura virtual. Onde o usuário necessita entrar com um código para acessar algum recurso, uma sala física por exemplo.

Precisamos de um jeito onde o administrador desta fechadura virtual possa fazer alguns ajustes:

* trocar o código de acesso
* aumentar ou diminuir o timeout quando o usuário erra o código
* colocar e remover o estado de operação da fechadura: 'em manutenção' e 'funcionando'

Também o administrador precisa obter as estatísticas de utilização:

* quantidade de códigos corretamente inseridos
* quantidade de códigos errados
* timeout configurado

Quais são as opções que podemos implementar em uma aplicação em Erlang/Elixir ? Levando em consideração:

* padronização
* tempo de desenvolvimento para uma nova funcionalidade
* possibilidade de integração com tecnologias já existente

## Fechadura virtual

Neste post não estamos interessados na fechadura virtual mas sim nas interfaces de gerenciamento. Então vamos usar um exemplo de uma fechadura virtual utilizando [gen_statem](http://erlang.org/doc/design_principles/statem.html#example).

A estrutura do nosso exemplo vai ser uma aplicação Erlang/OTP contendo os seguintes módulos:

* elock_app: definição da aplicação
* elock_sup: supervisor
* elock_statem: gen_statem da fechadura virtual
* elock_oob_sup: supervisor das interfaces OOB (out-of-band)
* elock_sqlapi: implementação das callbacks necessárias para a sqlapi funcionar

Disponibilizei o código que iremos trabalhar aqui: [elock](https://github.com/joaohf/elock). E ao longo dos posts futuros vou melhorando e incrementando com novas funcionalidades.

## SQL server

A ideia é embutir uma API SQL e imitar um servidor SQL, dentro da aplicação. Isso pode ser feito a partir de uma conexão TCP na qual escuta conexões em determinada porta, usando algum protocolo no qual implemente um servidor SQL. A linguagem SQL é padronizada mas o protocolo usado pelos serviços não (exemplo: Postgresql e Mysql), mas documentados:

* https://dev.mysql.com/doc/dev/mysql-server/8.0.11/page_protocol_basics.html
* https://www.postgresql.org/docs/11/protocol.html

Podemos usar algumas bibliotecas para implementar esta idéia:

* [sqlapi](https://github.com/flussonic/sqlapi)
* [sqlparse](https://github.com/K2InformaticsGmbH/sqlparse)

Aqui vamos utilizar a biblioteca sqlapi. Entretanto não vamos utilizar a versão original em [flussonic/sqlapi](https://github.com/flussonic/sqlapi) mas o meu fork em [joaohf/sqlapi](https://github.com/joaohf/sqlapi) com algumas melhorias organizacionais mas mantendo a funcionalidade original.

Baseado nos nossos requisitos, vamos implementar as seguintes tabelas, colunas e acessos:

* statistics:
  * colunas: nok_code, ok_code
  * tipo de acesso: read
* timeout:
  * colunas: timeout
  * tipo de acesso: read, update
* access_code:
  * colunas: code
  * tipo de acesso: read, update
* service:
  * colunas: state
  * tipo de acesso: read

Para acessar a nossa API SQL, vamos utilizar um cliente mysql conectando na porta do serviço SQL:

{{< highlight bash >}}
mysql -h 127.0.0.1 -P 4406 -u elock -ppass elock
{{< / highlight >}}

Lembrando que a aplicação _elock_ não possui nenhum banco de dados.

Então, vamos poder executar consultas SQL, como se fosse uma base de dados. Exemplos:

* Obtendo as estatísticas acesso:
{{< highlight sql >}}
SELECT ok_code FROM statistics;
{{< / highlight >}}
Resultado:
{{< highlight bash >}}
+---------+
| ok_code |
+---------+
|       2 |
+---------+
1 row in set (0.00 sec)
{{< / highlight >}}

* Verificando o estado do serviço:
{{< highlight sql >}}
SELECT * FROM service;
{{< / highlight >}}
Resultado:
{{< highlight bash >}}
+-----------+
| state     |
+-----------+
| inservice |
+-----------+
1 row in set (0.00 sec)
{{< / highlight >}}

* Atualizando o tempo para a fechadura fechar:
{{< highlight sql >}}
UPDATE timeout SET timeout = 45000;
{{< / highlight >}}
Resultado:
{{< highlight bash >}}
Query OK, 1 row affected (0.00 sec)
{{< / highlight >}}

* Verificando o novo timeout configurado:
{{< highlight sql >}}
SELECT * FROM timeout;
{{< / highlight >}}
Resultado:
{{< highlight bash >}}
+---------+
| timeout |
+---------+
|   45000 |
+---------+
1 row in set (0.00 sec)
{{< / highlight >}}

Também vamos implementar alguns comandos SQL nos quais são atalhos para as consultas ou determinada ação que seja necessário exportar:

{{< highlight sql >}}
SELECT reset_code();
{{< / highlight >}}
Resultado:
{{< highlight bash >}}
Query OK, 1 row affected (0.00 sec)
{{< / highlight >}}

A implementação é bastante simples:

1. No arquivo [elock_sqlapi.erl](https://github.com/joaohf/elock/blob/mignon-17/src/elock_sqlapi.erl) implementamos todas as callback do behaviour [sqlapi.erl](https://github.com/joaohf/sqlapi/src/sqlapi.erl) necessárias
2. Quando a aplicação recebe alguma query, a biblioteca sqlapi faz o parser e chama alguma função do módulo elock_sqlapi para fazer o tratamento.
3. Em seguida a máquina de estado [elock_statem.erl](https://github.com/joaohf/elock/blob/mignon-17/src/elock_statem.erl) é chamada para retornar ou configurar os valores da query
4. O último passo é retornar as respostas para a sqlapi no qual vai fazer todo o tratamento da resposta.

Desenvolvendo mais esta ideia, podemos conectar algum framework para ORM e rapidamente ter uma interface web na qual utilize as tabelas acima citadas.

Para alguns DevOps, o uso de consultas SQL pode ser mais familiar e fácil acesso do que outras soluções.

## Conclusão

Neste post vimos que existe outras formas de disponibilizar um acesso para as APIs de operação e manutenção da aplicação. Talvez a solução mais comum hoje em dia seja expor uma API utilizando HTTP e JSON.

Entretanto a abordagem deste post é para o leitor refletir que existe outras formas de criar um acesso para manutenção. E dependendo das condições do projeto podem ser bastante utilizadas.
