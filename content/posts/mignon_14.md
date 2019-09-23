---
title: "Opções para repositório de pacotes hex.pm"
description: ""
toc: true
date: 2019-08-30T22:43:50+02:00
tags: ["intro"]
series: ["101"]
---

Quando desenvolvemos em Elixir ou Erlang, de forma open source, geralmente publicamos o código em um repositório de código público e também divulgamos no [hex.pm](https://hex.pm) para que outros usuários possam encontrar e usar. 

Mas como podemos tornar o processo de publicação eficiente dentro de uma empresa ? A seguir, algumas formas de resolver.

Em diversas empresas, após construir alguns códigos, isolar em funcionalidades específicas e transformar em bibliotecas Elixir ou Erlang. Surge a seguinte questão:

> Onde vamos guardar e compartilhar as versões dos artefatos ?

Opcoes:

1. Repositório git: simples e eficiente. Tanto rebar3 quanto mix possuem suporte para usar tags, branches e sha1 como referências

2. Verificar se existe algum suporte no Artifactory ou Nexus: no qual podem, talvez, implementar o protocolo usado pelo serviço hex.pm

3. Utilizar o serviço [hex.pm com repositórios privados](https://hex.pm/pricing). É uma boa alternativa, caso não esteja fazendo algo ultra secreto ou com NDAs.

4. Alocar um servidor na sua rede corporativa para instalar o [minirepo](https://github.com/wojtekmach/mini_repo). Talvez o código não possa ser hospedado na internet e seja necessario hospedar internamente, então o minirepo é uma ótima alternativa.

