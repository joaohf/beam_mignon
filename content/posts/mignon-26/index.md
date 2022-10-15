---
title: 'riemann echo'
description: 'Detalhes sobre a implementação de um servidor riemann'
toc: true
date: 2020-07-26T22:43:50+02:00
series: ['servers']
tags: ['code', 'parser', 'tcp', 'udp', 'gen_statem']
featured_image: 'images/featured/26.jpg'
---

Vamos detalhar algumas características bem interessante utilizadas na
implementação de um servidor riemann chamado katja_echo.

## riemann.io

[riemann.io](http://riemann.io/) é um servidor para processamento de stream de
eventos, capaz de aplicar funções específicas para cada evento recebido e
agregar ou gerar outros eventos para sistemas externos, escrito em Clojure e
roda usando a JVM.

riemann pode ser utilizado para processar métricas onde aplicações
instrumentadas enviam para um servidor central métricas relacionadas com algo
importante ocorrido. Este modelo se chama `push metrics`.

Atualmente pode não ser a solução de métricas mais conhecida no momento mas é
uma opção a ser considerada dependendo dos casos de uso. Veja mais informações
no site do projeto.

Existem algumas bibliotecas cliente para Elixir e Erlang:

- [riemannx](https://hex.pm/packages/riemannx)
- [katja](https://hex.pm/packages/katja)

Bem como plugin para o framework [telemetry](https://hex.pm/packages/telemetry),
[telemetry_metrics_riemann](https://hex.pm/packages/telemetry_metrics_riemann).

No entanto, nosso foco é no seguinte cenário:

> Imagine que temos uma aplicação instrumentada para enviar métricas para um
> servidor riemann usando conexão TCP ou UDP. E durante os testes unitários e
> integração a nossa aplicação tenta fazer uma conexão com o servidor riemann
> para enviar as métricas. No entanto como não temos um servidor iniciado a
> aplicação falha em tentar fazer a conexão e enviar as métricas.

Claro que o cenário acima é hipotético e pode ser resolvido de outras formas
como por exemplo utilizando o _telemetry_ ou configurando a aplicação para não
enviar métricas durante testes ou implementando algum servidor no qual imita o
comportamento de um servidor real riemann.

Já trabalhei em alguns projetos nos quais havia um _docker compose_ apenas para
subir a infraestrutura local (contento JVM e riemann) quando executávamos testes
unitários. Os testes eram executados e no final destruíamos todo o ambiente do
_docker compose_.

Recentemente criei uma aplicação chamada
[katja_echo](https://github.com/katja-beam/katja_echo) justamente para
implementar uma imitação de um servidor riemann no qual recebe eventos
utilizando TCP ou UDP, armazena cada evento e responde alguma eventual consulta
dos eventos armazenados.

Neste pull request
[Introduce katja_echo when running integration tests](https://github.com/katja-beam/katja_vmstats/pull/6)
podemos ver uma aplicação mais prática.
[katja_vmstats](https://github.com/katja-beam/katja_vmstats) é uma aplicação
Erlang no qual faz uma leitura de várias estatísticas da BEAM VM e envia para um
servidor riemann. Os testes de integração do projeto precisava de um servidor
riemann ativo. Utilizando a aplicação _katja_echo_ durante os testes não é mais
necessário conviver com o overhead de instanciar uma JVM e riemann.

Então este artigo vai discutir alguns detalhes de implementação do projeto
katja_echo nos quais foram bastante interessantes do ponto de vista dos recursos
utilizados do OTP.

## O protocolo riemann

Vamos começar pelo [protocolo riemann](http://riemann.io/concepts.html), no qual
é muito simples. Basicamente cada evento é um conjunto de campos obrigatórios e
opcionais:

- host: "api1"
- service: "HTTP reqs/sec"
- state: "ok"
- time: in unix epoch
- description
- tags: ["rate", "xyz"]
- metric: numero
- ttl: valor indicando quando este evento deve ser considerado expirado

Estes campos são serializados utilizando
[Google Protocol Buffers](https://developers.google.com/protocol-buffers) e
especificados no arquivo
[proto.proto](https://github.com/riemann/riemann-java-client/blob/master/riemann-java-client/src/main/proto/riemann/proto.proto)
no é gerado código para criar as funções de encode e decode.

Sendo que uma mensagem no formato riemann é descrita assim:

{{< ghcode title="Protocolo riemann" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="proto/katja_echo.proto" start=41 end=47 highlight="linenos=inline" >}}

Podendo conter um `Event`, `Query`, `State`.

Projetos em Erlang/Elixir possuem suporte para criar encoders e decoders para
protocol buffers. Exemplo: utilizando o plugin
{{< hex package=rebar3_gpb_plugin >}} e adicionando a dependência
{{< hex package=gpb >}} as funcões de encode e decode são criadas
automaticamente:

{{< ghcode title="Encoder/Decoder" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_pb.erl" start=1 end=21 highlight="linenos=inline" >}}

O plugin rebar3*gpb_plugin suporta algumas configurações definidas no arquivo
\_rebar.config*. Dependendo do caso, pode ser necessário alterar:

{{< ghcode title="Encoder/Decoder" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="rebar.config" start=12 end=19 highlight="linenos=inline" >}}

Bom, estas funções possibilitam serializar mensagens no formato correto. Agora
precisamos implementar alguns servidores (gen_statem e gen_server) para receber
e enviar estas mensagens.

katja_echo suporta receber mensagens via TCP e/ou UDP.

## Servidor UDP

O servidor UDP,
[katja_echo_udp.erl](https://github.com/katja-beam/katja_echo/blob/0.1.1/src/katja_echo_udp.erl),
foi implementado utilizando um gen_server.

{{< ghcode title="gen_server init callback" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_udp.erl" start=72 end=78 highlight="linenos=inline" >}}

A função {{< erlmfa "gen_udp:open/2" >}} faz a criação do socket UDP na porta
especificada. Já o segundo parâmetro especifica como queremos receber as
mensagens. Escolhemos o modo ativo no qual vamos precisar implementar a callback
handle_info/2 para receber os pacotes UDP.

Depois armazenamos o socket no estado do gen_server.

Usando o modo ativo, significa que o processo katja_echo_udp irá receber uma
mensagem toda vez que haja um pacote recebido pelo gen_udp.

{{< ghcode title="gen_server init callback" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_udp.erl" start=117 end=118 highlight="linenos=inline" >}}

O formato da mensagem é _{udp, Socket, IP, InPort, Packet}_. Neste caso estamos
interessados no quinto elemento da tupla (Packet) pois a seguinte função vai
tentar decodificar o pacote recebido:

{{< ghcode title="handle_info packet" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_udp.erl" start=120 end=132 highlight="linenos=inline" >}}

Neste caso estamos delegando para outra função {{< mfa "katja_echo:decode/2" >}}
no qual faz a diferenciação entre 'udp' e 'tcp':

{{< ghcode title="decode udp" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo.erl" start=198 end=205 highlight="linenos=inline" >}}

Isso é necessário pois um pacote UDP (User Datagram Packet) deve conter uma
mensagem riemann completa, ou seja, o decoder de proto buffer para termos Erlang
deve decodificar uma mensagem ou falhar.

## Servidor TCP

Também temos um servidor TCP implementado usando gen_statem. Não é muito comum
pelo fato de que gen_statem é mais complexo que gen_server. Entretanto
complexidade não é o caso aqui.

{{< tip >}} Leia mais sobre gen_statem na documentação oficial
[statem](https://erlang.org/doc/design_principles/statem.html) e logo depois o
artigo
[Persistent connections with gen_statem](https://andrealeopardi.com/posts/connection-managers-with-gen_statem/)
para um caso prático.

Em muitos casos usar implementar um gen_server fica mais completo do que
utilizar gen_statem com uma máquina de estado definida. {{< /tip >}}

No caso TCP, quando recebemos um novo cliente, criamos um socket chamando a
função {{< erlmfa "gen_tcp:accept/1" >}} e seguimos para o próximo estado
definido chamado: connected.

{{< ghcode title="tcp connection" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_tcp.erl" start=88 end=93 highlight="linenos=inline" >}}

Quando no estado 'connected' podemos receber mensagens enviadas pelo gen*tcp
quando há alguma mensagem recebida pelo socket (exemplo: *{tcp, Socket,
Packet}\_).

{{< ghcode title="connected state" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_tcp.erl" start=101 end=113 highlight="linenos=inline" >}}

A função {{< mfa "process_packet/2" >}} é onde fazemos a decodificação do pacote
recebido:

{{< ghcode title="connected state" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_tcp.erl" start=118 end=121 highlight="linenos=inline" >}}

O importante desta função é que precisamos decodificar um pacote contendo o
payload atual e também qualquer buffer armazenado do payload anterior ao atual.
Como o protocolo TCP é um stream (não tem início e fim) temos que identificar
quantos bytes irão formar uma mensagem riemann possível de ser decodificada. E o
restante dos bytes, se houver, precisam ser bufferizados para concatenar com
próximo pacote recebido.

Seguindo no detalhe da função {{< mfa "process_packet/2" >}}:

{{< ghcode title="connected state" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_tcp.erl" start=121 end=142 highlight="linenos=inline" >}}

Caso ocorra algum erro na decodificação, devemos armazenar o _BinMsg2_ no
estado. Pois a próxima vez que recebermos um novo pacote TCP, iremos fazer um
append desta forma: _BinMsg2 = <<Acc/binary, Packet/binary>>,_ e tentar
decodificar novamente a mensagem.

Os outros branches do _case_ acima fazem o tratamento quando a mensagem riemann
é um evento ou uma query.

Para decodificar um pacote TCP recebido com sucesso, primeiro temos que
verificar se o pacote se parece com uma mensagem riemann aplicando um functional
pattern match no segundo parâmetro:

{{< ghcode title="decode udp" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo.erl" start=210 end=217 highlight="linenos=inline" >}}

_<<MsgSize:32/integer-big, Msg/binary>_ é um binary pattern match no qual diz
que qualquer pacote que inicie com um inteiro de tamanho 32 bits (integer-big)
seguido por um restante binary pode ser interpretado como uma mensagem riemann.
Entretanto, apenas chamando a função
{{< mfa "katja_echo_pb:decode_riemannpb_msg/1" >}} vamos ter certeza se Msg
contém ou não uma mensagem riemann.

Repare também que _MsgSize_ serve para especificar o tamanho da variável _Msg2_.
Isso é muito importante pois precisamos passar o tamanho correto da mensagem
riemann.

Quando um cliente riemann envia um pacote TCP para o servidor,
[o mesmo coloca um valor int32 como sendo o tamanho da mensagem riemann](https://github.com/riemann/riemann-nodejs-client/blob/master/riemann/socket.js#L99).
Logo depois vem a mensagem riemann.

## Events riemann

Relembrando, quando recebemos uma mensagem riemann do tipo Event, chamamos a
função:

{{< ghcode title="events" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_tcp.erl" start=133 end=133 highlight="linenos=inline" >}}

Com o argumento Events contento uma representação em termos Erlang de uma lista
de eventos riemann.

No caso do katja_echo vamos armazenar todos os eventos em uma tabela
[ETS](https://erlang.org/doc/man/ets.html) para posterior consulta:

{{< ghcode title="decode udp" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo.erl" start=132 end=141 highlight="linenos=inline" >}}

A chave de cada linha na tabela vai ser uma tupla contento o nome do Host e o
nome do Service: _#riemannpb_event{host = H, service = S}_ e o valor é o evento
integral.

Desta forma podemos fazer consultas via host e/ou service bem como aplicar
[match specification](https://erlang.org/doc/apps/erts/match_spec.html) para
buscar eventos específicos.

## Query riemann

Todos os eventos armazenados podem ser consultados usando simples queries.
Exemplos:

- _state = "ok"_
- _metric_f > 2.0 and not host = nil_
- _tagged "product"_

Geralmente cliente riemann possui uma API para fazer as consultas. Os dados
retornados são todos os eventos riemann selecionados pela consulta.

O servidor riemann oficial implementa uma
[gramática e parser para interpretar uma query](https://github.com/riemann/riemann/blob/master/resources/query.g4),
katja_echo implementa uma gramática e parser baseados na implementação oficial
mas usando uma aplicação disponível no OTP chamada
[Parse Tools](https://erlang.org/doc/apps/parsetools/index.html).

Parse Tools possui duas ferramentas:

- yecc, no qual gera um parser LALR-1 usando uma gramática BNF
- leex, um tokenizador baseado em expressões regulares

{{< tip >}} Alguns links e tutoriais caso precise implementar algo similar:

- [Tokenizing and parsing in Elixir with yecc and leex](https://andrealeopardi.com/posts/tokenizing-and-parsing-in-elixir-using-leex-and-yecc/)
- [Internationalization and localization support for Elixir](https://github.com/elixir-gettext/gettext/blob/e2e3d42edd2a8fa5aa2deada2e5779f122594e71/src/gettext_po_parser.yrl)
- [Leex And Yecc](http://web.archive.org/web/20170921125618/http://relops.com/blog/2014/01/13/leex_and_yecc/)
- [A simple example of how to use Leex and Yecc](https://github.com/relops/leex_yecc_example)
- [HTML parsing in Elixir with leex and yecc](https://notes.eellson.com/2017/01/22/html-parsing-in-elixir-with-leex-and-yecc/)
- [How to use leex and yecc in Elixir](https://cameronp.svbtle.com/how-to-use-leex-and-yecc)
- [Writing a lexer and parser](https://arjanvandergaag.nl/blog/write-your-own-parser.html)
- [Parsing with leex and yecc](http://raol.io/post/parsing-with-leex-and-yecc/)
- [Simple project to play with leex and yecc.](https://github.com/raol/ecalculator)
  {{< /tip >}}

Dependendo do caso podemos usar outro tipo de tokenizador, não necessariamente
precisamos usar o leex. Mas por conveniência iniciamos com a criação das regras
do token como definido no arquivo
[katja_echo_query_lexer.xr](https://github.com/katja-beam/katja_echo/blob/0.1.1/src/katja_echo_query_lexer.xrl).

Logo em seguida definimos as regras gramaticais
[katja_echo_query_grammar.yrl](https://github.com/katja-beam/katja_echo/blob/0.1.1/src/katja_echo_query_grammar.yrl).

Com o tokenizer e a gramática, definimos um modulo e criamos algumas funções nas
quais recebem uma string chamando o lexer e grammar para analisar:

{{< ghcode title="parse" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_query.erl" start=17 end=22 highlight="linenos=inline" >}}

Expondo uma API para receber uma query, fazer a análise e baseado em uma árvore
parseada realizar as operações da query recebida:

{{< ghcode title="calling parse tree" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo.erl" start=176 end=183 highlight="linenos=inline" >}}

_ParseTree_ contém termos Erlang nas quais outras funções irão processar e
retornar os eventos:

{{< ghcode title="getting data" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_query.erl" start=35 end=54 highlight="linenos=inline" >}}

Acima usamos pattern match e processamento com listas. Não existe uma forma
padronizada de implementar tal código. O segredo é encontrar a melhor estrutura
de dados que case com a necessidade.

Após todo o processamento da query, chega o momento de consultar a tabela ETS e
obter os eventos. Fazemos isso usando uma feature do OTP chamada
[match specification](https://erlang.org/doc/apps/erts/match_spec.html).

{{< tip >}} match specification pode assustar mas é muito poderosa e usado em
várias partes do OTP. Recomendo sempre lembrar que existe antes de criar
qualquer coisa semelhante. {{< /tip >}}

No nosso caso, com o resultado do parser da query apenas precisamos criar a
parte chamada MatchConditions e enviar chamar a função
{{< erlmfa "ets:select/2" >}}.

{{< ghcode title="getting data" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="src/katja_echo_query.erl" start=30 end=32 highlight="linenos=inline" >}}

A intenção de implementar uma interface para queries riemann foi justamente
poder consultar os dados da tabela ETS sem precisar criar queries manuais, ou
seja, match specifications são criados a partir da query recebida.

Um último ponto sobre este assunto é que a ferramenta rebar3 possui suporte para
geração de código a partir dos arquivos yrl e xrl:

{{< ghcode title="rebar yrl e xrl" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="rebar.config" start=49 end=51 highlight="linenos=inline" >}}

## Testes

A estratégia de testes segue duas linhas principais sendo testes unitários e
testes de integração.

[katja_echo_SUITE.erl](https://github.com/katja-beam/katja_echo/blob/master/test/katja_echo_SUITE.erl),
usando o framework Common Test e iniciando a aplicação katja_echo de forma
controlada.

O importante é levar em conta a testabilidade durante o design da aplicação. Um
exemplo clássico é utilizar callbacks nas quais podemos trocar quando em testes.
Isso facilita verificar se o caso de teste está atingindo os postos necessários.
Exemplo:

{{< ghcode title="Changing callback" lang="erlang" owner="katja-beam" repo="katja_echo" ref="0.1.1" path="test/katja_echo_SUITE.erl" start=137 end=155 highlight="linenos=inline" >}}

Repare que a função {{< mfa "reply_events()" >}} retorna uma tuple onde o
terceiro elemento é uma função anônima na qual vai ser usada para configurar a
callback.

Quando a callback for executada, dentro da aplicação katja_echo, podemos
verificar chamando a função {{< mfa "check_event/2" >}}.

[katja_echo_query_tests](https://github.com/katja-beam/katja_echo/blob/master/test/katja_echo_query_tests.erl),
usando o framework eunit e seguindo uma abordagem mais teste unitário onde
definimos um
[gerador automático dos casos de teste](http://erlang.org/doc/apps/eunit/chapter.html#Writing_test_generating_functions)
baseados em uma lista de queries. É um uso mais avançado do eunit e traz grande
economia de tempo na escrita dos testes.

## Conclusão

As ideias e técnicas apresentadas neste artigo podem servir como inspiração para
aqueles que precisam criar alguma solução similar. Principalmente para isolarem
algum subsistema utilizado para testes. Ou reimplementarem algum outro protocolo
ou servidor utilizando Erlang ou Elixir.
