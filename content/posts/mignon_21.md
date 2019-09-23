---
title: "Gerenciamento out-of-band: SSH"
description: ""
date: 2019-09-21T22:43:50+02:00
series: ["out-of-band"] 
tags: ["code", "ssh"]
---

No primeiro artigo [Gerenciamento out-of-band: SQL]({{< ref "/posts/mignon_17.md" >}}), introduzimos a ideia geral do out-of-band. Neste post vamos continuar e implementar uma outra forma de acesso. Desta vez utilizando um servidor SSH embutido na aplicação.

Geralmente quando precisamos acessar alguma aplicação remotamente, utilizamos o SSH para conectar no servidor e depois podemos utilizar alguma interface de linha de comando no qual conversa com a aplicação ou fazer um 'attach' no node e executar qualquer comando.

A abordagem deste post é prover uma forma de criar uma CLI (interface de linha de comando) para alguma aplicação onde não seja necessário expor todo o acesso ao servidor via SSH.

### SSH server

O que você acha de implementar um servidor SSH dentro de uma aplicação? E poder acessar um shell remoto (que na realidade é a aplicação) e executar comandos e funções?

Bom isso é possível e com certeza existe algum caso de uso para esta opção.

A ideia veio deste post [Secure Shell for Your Erlang Node](https://www.erlang-solutions.com/blog/secure-shell-for-your-erlang-node.html) e utiliza a aplicação [ssh](http://erlang.org/doc/apps/ssh/index.html) para ativar um servidor SSH. O autor também disponibilizou este repositório [erl_sshd](https://github.com/ivanos/erl_sshd) com a implementação funcionando e uma abordagem usando chaves públicas e passwords.

Algumas premissas para utilizar este recurso são:

* um módulo customizado para manipular as chaves ssh será escrito, para evitar qualquer consulta dos arquivos padrões no host (vamos interagir um pouco mais com a aplicação SSH aqui). No post [Polibot]({{< ref "/posts/mignon_8.md" >}}) fizemos algo parecido mas para um cliente SSH.
* neste exemplo vamos restringir apenas a autenticação usando usuário e senha
* desejável restringir quais funções podem ser executados dentro da sessão SSH. Para o nosso exemplo, vamos exportar as mesmas funções descritas no post [Gerenciamento out-of-band: SQL]({{< ref "/posts/mignon_17.md" >}}).

Ainda utilizando a aplicação _elock_, vamos expandir a implementação para suportar os nossos requisitos.

A implementação foi dividida nos sequintes módulos:

* [src/elock_ssh_oob.erl](https://github.com/joaohf/elock/blob/mignon-21/src/elock_ssh_oob.erl), é um gen_server no qual faz a configuração do [ssh:daemon/2](http://erlang.org/doc/man/ssh.html#daemon-2). Estamos usando a opção [ ssh_cli_daemon_option](http://erlang.org/doc/man/ssh.html#type-ssh_cli_daemon_option) para utilizar o módulo [src/elock_ssh_cli.erl](https://github.com/joaohf/elock/blob/mignon-21/src/elock_ssh_cli.erl) no qual implementamos a nossa interface com os comandos da aplicação elock
* [src/elock_ssh_server_key_api.erl](https://github.com/joaohf/elock/blob/mignon-21/src/elock_ssh_server_key_api.erl), neste módulo implementamos as callbacks necessárias para o behaviour [ssh_server_key_api](http://erlang.org/doc/man/ssh_server_key_api.html). Para o nosso exemplo, estamos gerando uma chave do servidor ssh e também desabilitamos a autenticação baseada em chaves públicas. 
* [src/elock_ssh_cli.erl](https://github.com/joaohf/elock/blob/mignon-21/src/elock_ssh_cli.erl) é o módulo responsável por receber um comando, verificar na lista de comandos e executar. Podemos implementar qualquer comando necessário e formatar o resultado do jeito que precisamos. Basicamente é onde o usuário vai interagir com o sistema.

{{< asciicast kxxlsKs20Gyuj1Vece5y2I7Z1 >}}


## Conclusão

Abordamos neste post uma forma diferente de prover acesso via SSH conectado direto na aplicação. Dependemos de uma aplicação do OTP no qual já foi bem testada e utilizada amplamente com bastante features e altamente configurável. O uso de conexões SSH, utilizando qualquer cliente SSH é universal. Com certeza é uma alternativa bastante segura para a implementação.
