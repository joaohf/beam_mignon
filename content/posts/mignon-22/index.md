---
title: "Brincando com Erlang nodes: embedded"
description: ""
toc: true
date: 2019-12-20T22:45:50+02:00
series: ["erlang nodes"] 
tags: ["code", "failure", "eclero", "embedded"]
featured_image: 'images/featured/eclero-1-0.jpg'
---

Este post faz parte de uma série de outros posts relacionados a como usar _Erlang distribution protocol_.

Na primeira parte, {{< ref "/posts/mignon-20" >}} criamos uma aplicação básica. O próximo passo é continuar com o desenvolvimento dos requisitos. Relembrando e incrementando os requisitos, temos:

1. ~~Cada nó necessita detectar e ser notificado de qualquer falha dos outros nós~~
2. O cluster de nós Erlang deve ser configurado utilizando algum tipo de configuração vinda do ambiente
3. O ambiente de execução é Linux embarcado rodando em qualquer plataforma
4. Desejável poder rodar em um ambiente embarcado com o mínimo de recursos necessários
5. Mínimo de 3 nós para a solução funcionar

Agora vamos abordar alguns assuntos que não são propriamente relacionados com Erlang e Elixir mas fazem parte do contexto dos requisitos.

O objetivo é responder algumas pergunta: 

1. Como criar uma solução embarcada utilizando Erlang?
2. É possível rodar Erlang em um ambiente embarcado?
3. Definir um possível caminho para uma implementação
4. Verificar se é possível rodar o 'eclero' em um ambiente virtualizado gerando imagens com o Yocto Project e meta-erlang

Erlang embarcado não é uma ideia nova e muito menos revolucionária. De fato Erlang/OTP é usado em diversos tipos de ambientes (Linux, Solaris, Windows), inclusive existe uma documentação oficial sobre o assunto [Embedded Users Guide](http://erlang.org/doc/embedded/users_guide.html).

Creio que atualmente existem diversas formas de fazer. Este post explora uma delas.

## Yocto Project

É um projeto opensource, com mais de 10 anos de vida, com o objetivo de facilitar e criar um ecosistema para aplicações embarcadas com Linux.

Utilizando o projeto podemos criar uma distribuição linux, totalmente dimensionada para os requisitos de um produto ou solução. Aqui vou deixar referências pois não é o escopo abordar Yocto Project neste blog.

* [Main documentation page](https://www.yoctoproject.org/docs/)
* [Yocto Software Overview](https://www.yoctoproject.org/software-overview/)
* [What I with I'd know](https://www.yoctoproject.org/docs/what-i-wish-id-known/)
* [Yocto Project Quick Build](https://www.yoctoproject.org/docs/2.7/brief-yoctoprojectqs/brief-yoctoprojectqs.html)

Entretanto a nossa solução vai utilizar Yocto Project para gerar as imagens embarcadas com todo o ferramental necessário. Então, como usuário vamo apenas executar os comandos:

* _bitbake_, para gerar imagens
* _runquemu_, para testar a imagem

Apenas isso.

## meta-erlang

O Yocto Project possui uma maneira de extender novas funcionalidades e aplicações, sem a necessidade de alterar o projeto. Adicionando _layers_ podemos trazer outros elementos para as imagens. Não há um limite para as layers e atualmente existe vários tipos para as mais variadas necessidades. Veja [OpenEmbedded Layer Index](https://layers.openembedded.org) para mais detalhes.

No post {{< ref "posts/mignon_7.md" >}}, abordamos sobre o assunto. Aqui vamos utilizar os conhecimentos e colocar em prática.

### Receita da aplicação eclero

Como de usual, quando estamos brincando com Yocto Project, vamos criar uma receita para encapsular a aplicação. 

{{< ghcode title="" lang="bash" owner="joaohf" repo="meta-axon" ref="master" path="recipes-extended/eclero/eclero_git.bb" star=1 end=17 highlight="linenos=inline" >}}

Para compilar a receita usamos o comando:

{{< highlight "bash" >}}
bitbake eclero
{{< /highlight >}}

### Receita da imagem embarcada eclero

O próximo passo é escrever uma receita que vai criar uma imagem linux bem pequena e a aplicação eclero.

A receita é bem simples e vai instalar todos os componentes necessários. Basicamente vamos instalar na imagem final:

* base-files, layout de arquivos e diretórios básicos
* erlinit, é um substituto do programa _/sbin/init_ no qual executa uma release Erlang/OTP. [erlinit](https://github.com/nerves-project/erlinit) é como se fosse um systemd ou initscripts mas usando uma abordagem minimalista.
* eclero

Estes componentes são o suficiente para criarmos uma imagem no qual vai executar o kernel Linux e a aplicação eclero.

{{< ghcode title="" lang="bash" owner="joaohf" repo="meta-axon" ref="master" path="recipes-extended/image/eclero-embedded-image-minimal.bb" start=1 end=15 highlight="linenos=inline" >}}

Para construir a imagem executamos:

{{< highlight "bash" >}}
bitbake eclero-embedded-image-minimal
{{< /highlight >}}

O resultado pode ser visto no diretório: _tmp/deploy_

## QEMU

Precisamos testar a imagem e a aplicação e ver se tudo está funcionando. A maneira mais rápida de fazer isso é utilizando um emulador, no caso _qemu_.

O Yocto Project já disponibiliza as ferramentas necessárias, então executando `runqemu` vamos ver um o kernel Linux inicializando e o console da aplicação:

{{< highlight "bash" >}}
runqemu qemuarm axon-embedded-image-minimal qemuparams="-serial stdio"
{{< /highlight >}}

{{< asciicast 289712 >}}

No asciinema acima podemos ver o kernel linux iniciando e já chamando o erlinit no qual se encarrega de chamar a aplicação eclero dentro de um VM Erlang.

## Testando

A melhor forma de testar é executar duas operações:

1. Dentro do qemu (guest), usando o console Erlang, chamamos alguma API do eclero para verificar o estado do cluster:
{{< highlight "bash" >}}
Erlang/OTP 22 [erts-10.5.6] [source] [smp:1:1] [ds:1:1:10] [async-threads:30]

Eshell V10.5.6  (abort with ^G)
(eclero1@eclero)1> eclero_health:get().
{ok,[{eclero1@eclero,true}]}
{{< /highlight >}}

2. No host Linux executamos o comando _curl_ passando o endpoint que queremos acessar, recebemos como resposta 200 Ok:
{{< highlight "bash" >}}
curl -v 19w.168.7.2:8000/check

*   Trying 192.168.7.2...
* TCP_NODELAY set
* Connected to 192.168.7.2 (192.168.7.2) port 8000 (#0)
> GET /check HTTP/1.1
> Host: 192.168.7.2:8000
> User-Agent: curl/7.58.0
> Accept: */*
>
< HTTP/1.1 200 OK
< content-length: 19
< content-type: text/plain
< date: Thu, 19 Dec 2019 21:28:16 GMT
< server: Cowboy
<
* Connection #0 to host 192.168.7.2 left intact
{{< /highlight >}}

Podemos ver que conseguimos obter resposta nos dois métodos testados.

## Conclusão

Aparentemente tudo está funcionando. Mas o processo de desenvolvimento não foi tranquilo. Nos próximos posts vamos abordar os problemas. Por agora o importante é as referências dos links e códigos.

Agora já podemos executar a aplicação eclero em um ambiente embarcado.

Por enquanto é um nó apenas.
