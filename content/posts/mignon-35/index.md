---
title: 'Criando parser para arquivos texto'
description:
  'Como criar um parser de arquivos texto em Erlang. Nesse post veremos algumas
  sugestões.'
toc: true
date: 2023-01-14T21:00:00+02:00
series: ['101']
tags: ['code', 'parser', 'parse_tools']
featured_image: 'images/featured/35.jpg'
---

## Parseando

Imagine a situação na qual o seu programa precisa ler arquivos texto no qual o
conteúdo está em um formato adhoc ou muito criativo e você não tem ideia de como
implementar o parser do arquivo. Muitas vezes até sabemos como implementar mas é
uma tarefa tediosa. Outras vezes tentamos fugir da implementação.

A verdade é que precisamos conhecer as ferramentas para melhor sair das
situações. Nesse post vamos percorrer alguns possíveis caminhos para implementar
alguns parses de arquivos.

Vamos implementar parsers para dois arquivos com formatos adhoc. O objetivo é
implementar um códigos em Erlang para ler as informações dos arquivos e
apresentar os dados em Erlang Terms.

Todo o código dos exemplos foi disponibilizado no repositório
[eparser](https://www.github.com/joaohf/eparser).

O primeiro formato é o seguinte:

{{< ghcode title="Comandos de configuração" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE_data/zl30702.txt" start=29 end=43 highlight="linenos=inline" >}}

Isso representa uma determinada configuração e o objetivo do código que vai ler
este arquivo é extrair uma sequencia de tuplas com os comandos de `write` e
`wait`. Algo como abaixo representado:

{{< ghcode title="Comandos de configuração" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE.erl" start=82 end=118 highlight="linenos=inline" >}}

Já o segundo formato é mais complicado:

{{< ghcode title="Configurações de devices" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE_data/devices.cfg" start=1 end=22 highlight="linenos=inline" >}}

O formato deste arquivo parece bem comum e até mesmo a implementação é sugestiva
(veja o
[arquivo completo antes](https://github.com/joaohf/eparser/blob/main/test/eparser_SUITE_data/devices.cfg)
de tomar uma decisão). Os dados representam configurações e o objetivo é
apresentar os dados em tuplas e property lists. Como abaixo:

{{< ghcode title="Comandos de configuração após o parser" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE.erl" start=144 end=160 highlight="linenos=inline" >}}

Como implementar ? O que usar ? é o que vamos ver a seguir.

## Exemplos

Antes de solucionar os dois exemplos propostos, podemos tentar implementar um
parser usando algumas abordagens. Mas qual a ideia de um _parser de arquivos_ ?
A ideia geral é abstração, ou seja, quem vai usar os dados do arquivo não
precisa saber qual é o formato que foi lido.

Normalmente há uma implementação que sabe como abrir o arquivo, extrair as
linhas, dividir os dados para compor as informações. Somente depois disso os
dados estão prontos para uso.

Essa separação facilita na manutenção do código e reusabilidade do parser
criado.

### O básico e simples mas complicado de manter

Em Erlang/Elixir, se você tiver uma situação onde tem o controle do arquivo
destino uma saída é usar a função {{< erlmfa "file:consult/1" >}} para ler o
conteúdo de um arquivo contento Erlang Terms. Suponha o seguintes termos estão
em um determinado arquivo:

{{< ghcode title="Erlang terms" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE_data/basic_erlang_like.conf" start=1 end=1 highlight="linenos=inline" >}}

Para ler chamamos `file:consult/1`:

{{< ghcode title="Exemplo simples" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE.erl" start=132 end=139 highlight="linenos=inline" >}}

Simples, certo ? Sim, bastante. Mas isso funciona bem quando você tem o controle
do arquivo destino. E em muitas situações é o bastante.

### adhoc na unha

Ok, agora suponha que você não é o dono do arquivo e precisa implementar um
código para ler os exemplos 1 e 2 apresentados acima. Como você faria ? Talvez
algo na seguinte linha:

```
- abrir o arquivo
 - ler cada linha
  - para cada linha:
   - usar Erlang regexp ou string split
   - criar algumas funções para fazer pattern match de listas
   - guardar o resultado de cada quebra em um acumulador
   - quando ler todas as linhas, retornar o acumulador
```

É mais ou menos a ideia geral, não é mesmo ? Mas a implementação vai ser bem
complicada de entender e de dar manutenção. E de fato, tentei cria um exemplo
aqui:
[device_adhoc.erl](https://github.com/joaohf/eparser/blob/main/src/device_adhoc.erl).

Vejamos uma outra forma de implementar parser de arquivos...

## parse tools

[Parse Tools](https://erlang.org/doc/apps/parsetools/index.html). São um
conjunto de ferramentas para trabalhar com parser de arquivos. As duas
ferramentas principais são:

- [yecc](https://www.erlang.org/doc/man/yecc.html), no qual gera um parser
  LALR-1 usando uma gramática BNF (parser)
- [leex](https://www.erlang.org/doc/man/leex.html), um tokenizador baseado em
  expressões regulares (lexer)

A ideia central é essa:

1. Primeiro definimos um tokenizador (lexer) usando expressões regulares. A
   intenção é quebrar cada linha em tokens indivisíveis; depois
2. criamos uma gramática (parser) para juntar estes tokens. Isso alimenta o
   parser no qual vai tentar ler a gramática baseada na regra implementada

A implementação do passo `1` é feita em arquivos com a extensão `.xrl`. E a
implementação do passo `2` em arquivos `.yrl`. Nos exemplos que estamos
seguindo:

- device_parse_tools_lexer.xrl
- device_parse_tools_parser.yrl
- zl30702_lexer.xrl
- zl30702_parser.yrl

A partir destes arquivos código Erlang é gerado com a implementação dos
respectivos parsers e e tokenizados.

Vamos ver como isso funciona.

### Organizando o código

Uma sugestão para organizar a estrutura da implementação para trabalhar com
parse tools é criar primeiro um módulo para implementar uma API na qual o seu
código vai chamar toda vez que precisar ler o conteúdo de algum arquivo:

```
src/device_parse_tools.erl
```

`device_parse_tools` vai ser a API principal. Depois criamos dois arquivos para
implementar o parser e o tokenizador:

```
src/device_parse_tools_lexer.xrl
src/device_parse_tools_parser.yrl
```

A estratégia é deixar isso claro no nome do arquivo, para não confundir. Quando
compilamos o projeto usando `rebar3` ou `mix`, estas ferramentas cuidam de fazer
a compilação do .xrl e .yrl, gerando os arquivos:

```
src/device_parse_tools_lexer.erl
src/device_parse_tools_parser.erl
```

_device_parse_tools_lexer.erl_ e _device_parse_tools_parser.erl_ são autogeradas
baseados nas regras definidas. Vamos ver mais sobre isso agora.

### Facilitando com parse tools, exemplo 1

A implementação de parsers é um exercício dividido em três partes:

- Escrever o tokenizador
- Escrever o parser
- Escrever um módulo para carregar o arquivo e chamar o parser escrito

Visualizando o arquivo que precisamos parser,
[exemplo 1](https://github.com/joaohf/eparser/blob/main/test/eparser_SUITE_data/zl30702.txt),
vamos pensar em como quebrar em tokens cada parte do arquivo. A ideia principal
é pensar em expressões regulares para casar com cada pedaço do arquivo no qual
signifique algo. O resultado do tokenizador (zl30702_lexer.xrl) fica como
abaixo:

{{< ghcode title="Erlang terms" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/zl30702_lexer.xrl" start=1 end=30 highlight="linenos=inline" >}}

Arquivos .xrl são divididos em seções:

- Definitions: definição de expressões regulares
- Rules: quando o tokenizador encontrar uma expressão regular que case, o que
  ele deve fazer
- Erlang code: funções em Erlang para auxiliar na ação do tokenizador

O segundo passo é darmos significado aos tokens gerado. Para isso implementamos
as regras do parser (zl30702_parser.yrl) como abaixo:

{{< ghcode title="Erlang terms" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/zl30702_parser.yrl" start=1 end=27 highlight="linenos=inline" >}}

Arquivos .yrl também são divididos em seções:

- Nonterminals: símbolos que podem gerar outros símbolos e por isso são não
  terminais
- Terminals: o menor símbolo na qual não pode ser composta por outros símbolos
- Rootsymbol: qual é o símbolo inicial para iniciar o processamento
- Header: geralmente documentção no formato edoc ou comentários gerias
- Erlang code: qualquer código extra (funções locais) para ajudar na extração de
  dados

O parser é onde dizemos como interpretar, baseado na ordem dos tokens, e
transformar em outras estruturas de dados. Novamente é um exercício de olhar
para o arquivo original e tentar entender como as informações fazem sentido.

O último passo é onde vamos carregar o arquivo de origem, tokenizar e parsear.

Para carregar o arquivo, a estratégia usada é ler linha a linha:

{{< ghcode title="Carregando o arquivo de entrada" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/zl30702.erl" start=28 end=36 highlight="linenos=inline" >}}

Depois para cada linha do arquivo chamamos o tokenizaodr:

{{< ghcode title="Chamando o tokenizador" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/zl30702.erl" start=43 end=48 highlight="linenos=inline" >}}

E para cada conjunto de tokens, chamamos o parser para retornar uma tupla na
qual vamos acumulando com o restante do processamento:

{{< ghcode title="Chamando o parser" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/zl30702.erl" start=60 end=62 highlight="linenos=inline" >}}

Veja a implementação completa em
[zl30702.erl](https://github.com/joaohf/eparser/blob/main/src/zl30702.erl).

Finalmente um teste unitário demonstrando a chamada do parser:

{{< ghcode title="Testando o parser" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE.erl" start=79 end=120 highlight="linenos=inline" >}}

### Facilitando com parse tools, exemplo 2

Até aqui vimos que a criação de parsers é um exercício de introspecção em como
definir as expressões regulares e também a criação de uma gramática que use os
tokens definidos.

O segundo exemplo segue a mesma filosofia do primeiro mas apresenta algumas
diferenças.

A primeira delas é no carregamento do arquivo. Aqui queremos carregar o arquivo
inteiro:

{{< ghcode title="Carregando o arquivo de entrada" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/device_parse_tools.erl" start=50 end=56 highlight="linenos=inline" >}}

E chamar o tokenizador de uma vez só, retornando uma lista de tokens:

{{< ghcode title="Quebrando em tokens" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/device_parse_tools.erl" start=58 end=60 highlight="linenos=inline" >}}

Com todos os tokens, chamamos o parser:

{{< ghcode title="Parseando os tokens" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="src/device_parse_tools.erl" start=64 end=66 highlight="linenos=inline" >}}

Esta estratégia foi necessária pois a gramática precisa conhecer todos os tokens
para extrair um contexto que faça sentida. Isso é de acordo com a natureza do
arquivo de entrada.

Um teste unitário chamando o parser:

{{< ghcode title="Erlang terms" lang="erlang" owner="joaohf" repo="eparser" ref="main" path="test/eparser_SUITE.erl" start=141 end=210 highlight="linenos=inline" >}}

## Mais sobre parse tools

A documentação oficial do
[parse tools](https://www.erlang.org/doc/apps/parsetools/index.html) é a melhor
referência. Mas um pouco complicada se você nunca teve contato com outras
ferrametas de parser e tokenization.

A seguir preparei uma lista de alguns sites que apresentam o mesmo tema mas com
outras abordagens:

- [Tokenizing and parsing in Elixir with yecc and leex](https://andrealeopardi.com/posts/tokenizing-and-parsing-in-elixir-using-leex-and-yecc/)
- [Internationalization and localization support for Elixir](https://github.com/elixir-gettext/gettext/blob/e2e3d42edd2a8fa5aa2deada2e5779f122594e71/src/gettext_po_parser.yrl)
- [Leex And Yecc](http://web.archive.org/web/20170921125618/http://relops.com/blog/2014/01/13/leex_and_yecc/)
- [A simple example of how to use Leex and Yecc](https://github.com/relops/leex_yecc_example)
- [HTML parsing in Elixir with leex and yecc](https://notes.eellson.com/2017/01/22/html-parsing-in-elixir-with-leex-and-yecc/)
- [How to use leex and yecc in Elixir](https://cameronp.svbtle.com/how-to-use-leex-and-yecc)
- [Writing a lexer and parser](https://arjanvandergaag.nl/blog/write-your-own-parser.html)
- [Parsing with leex and yecc](http://raol.io/post/parsing-with-leex-and-yecc/)
- [Simple project to play with leex and yecc.](https://github.com/raol/ecalculator)
