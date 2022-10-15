---
title: 'mermaid com edoc ou ex_docs'
description: 'Documente melhor com diagramas baseados em texto'
toc: true
date: 2020-11-02T19:30:00+02:00
series: ['101']
tags: ['intro']
featured_image: 'images/featured/30.jpg'
---

Documentar o código é parte do processo de design e implementação de um
software. Ajuda a clarear a mente, ordenar conceitos e passos. Além de induzir
os questionamento e também simplificação de código.

Em muitos projetos e times, documentar é preciso pois não se sabe como vai ser a
configuração do time ao médio e longo prazo. Pode ser que novos integrantes
entrem e os mais antigos sejam deslocados para outras funções e com eles boa
parte do conhecimento.

Uma documentação viva e focada em comunicar tecnicamente o que determinada
função, subsistema ou biblioteca está fazendo é fundamental para o sucesso de um
time.

O desenvolvedor que não gosta de documentar vai achar muitos motivos para não
fazer. E se o mesmo desenvolvedor precisa representar uma ideia ou arquitetura
geral de um software, pode ser que ele nunca irá fazer.

Mas talvez ele goste de criar diagramas baseados em texto. Pode ser que ele se
interesse mais em documentar a arquitetura pois não precisa gastar tempo
alinhando caixinhas em alguma outra ferramenta que não seja o seu editor
preferido.

Então por que não aproximar as ferramentas de diagrama baseado em texto dos
nossos projetos em Erlang e Elixir ?

Uma das abordagens é usar o [mermaid](https://mermaid-js.github.io/mermaid/):

> Mermaid simplifies complex diagrams. It is a Javascript based diagramming and
> charting tool that renders Markdown-inspired text definitions to create and
> modify diagrams dynamically. The main purpose of Mermaid is to help
> Documentation catch up with Development.

A intenção é embutir diagramas em texto dentro das documentações. Assim mermaid
vai criar os diagramas em tempo de exibição da documentação. Sem a necessidade
de utilizar nenhuma ferramenta extra ou precisar de algum servidor ou serviço
especial.

## erlang: edoc

Em Erlang, usamos a ferramenta
[edoc](http://erlang.org/doc/apps/edoc/chapter.html) para gerar a documentação
baseada em marcações no código fonte. É bem prática mas utiliza uma mistura de
XHTML com wiki.

edoc processa tags para criar arquivos html. O processo de geração destes
arquivos podem ser customizado implementando algumas callbacks. Usando o projeto
{{< hex package=edocmermaid >}} nas quais implementa estas callbacks, e com
algumas configurações na ferramenta de build _rebar3_ podemos gerar a
documentação html com suporte aos diagramas.

A [documentação online do edocmermaid](https://hexdocs.pm/edocmermaid/) possui
todos os detalhes para configuração e uso, bem como exemplos.

## elixir: ex_docs

Já em Elixir, temos algo parecido mas melhorado. Não precisamos de nenhuma
biblioteca adicional, apenas configurando o {{< hex package=ex_doc >}}
adequadamente usando os parâmetros: _assets_ e _before_closing_body_tag_ (mais
detalhes dos parâmetros podem ser vistos
[aqui](https://hexdocs.pm/ex_doc/Mix.Tasks.Docs.html#content)). Segue um exemplo
de um arquivo mix.exs configurado:

{{< gist joaohf a71f5682469ba6c8303b491087a3f057 >}}

Na linha _12_, a função _mermaid_assets/0_ deve retornar o diretório relativo
contendo uma cópia do _mermaid.min.js_. Caso não queira usar um arquivo local,
então não configure a opção _assets_.

Já na linha 13, a funcão _mermaid_snippet/1_ retorna a tag html necessária para
carregar e inicializar a biblioteca mermaid, em tempo de visualização. A função
mermaid_snippet/1 aceita um parâmetros sendo:

- _:file_, caso o arquivo mermaid.min.js seja utilizado. Ou
- _url_, uma string contendo a URL apontando para mermaid. Exemplo:
  "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"

## Outras opções

mermaid é uma das opções. Gostei da abordagem por ser simples e flexível e traz
a maioria dos diagramas necessários.

Como alternativa, caso precise algo mais elaborado, existe também o
[plantuml](https://plantuml.com). Um pouco mais complicado para criar os
diagramas e mostrar na mesma página da documentação. Pois é necessário
transformar os diagramas em formatos de imagem tais como png, svg e exibir na
documentação com as respectivas tags.
