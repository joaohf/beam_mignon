---
title: 'Gamepad'
description: 'Criando um controle virtual'
toc: true
date: 2020-08-28T22:43:50+02:00
series: ['servers']
tags: ['code', 'driver', 'port']
featured_image: 'images/featured/29.jpg'
---

Recentemente comprei uma
[raspberry pi 4](https://www.raspberrypi.org/products/raspberry-pi-4-model-b/)
com o propósito de usar o projeto [retropie](https://retropie.org.uk/) para
jogar video game do século passado. Depois que comprei, lembrei que precisava
também comprar controles (gamepads).

Pesquisando na documentação do retropie, verifiquei que existe opções de usar um
`virtual gamepad` e as duas soluções mais usadas são
[Mobile-Gamepad](https://retropie.org.uk/docs/Mobile-Gamepad/) e
[Virtual-Gamepad](https://retropie.org.uk/docs/Virtual-Gamepad/).

Ambas as soluções funcionam do mesmo jeito sendo compostas por:

- frontend em javascript simulando um controle e enviando eventos dos botões e
  direcionais para
- backend nodejs usando [socket.io](https://socket.io/) para receber os eventos
  e escrever no dispositivo _/dev/uinput_.

[uinput](https://www.kernel.org/doc/html/v4.12/input/uinput.html) é um módulo do
kernel linux no qual emula inputs de uma aplicação para serem entregues e
manipulados por outros processos em
{{< glossary_tooltip text="userland" term_id="userland" >}} ou
{{< glossary_tooltip text="in-kernel" term_id="in-kernel" >}}.

Bom, para resolver o meu problema dos controles, bastaria usar uma solução já
pronta. Mas resolvi reimplementar utilizando Elixir e o framework Phoenix. O
nome deste projeto é [epad](https://www.github.com/joaohf/epad) e o objetivo é
criar um controle virtual onde posso usar um celular conectado via websocket e
enviando eventos a partir de uma aplicação web em javascript.

{{< figure figcaption="Interface web do controle virtual" >}}
{{< img epad_client.png Fit "500x400" >}} {{< /figure >}}

Então, neste post vamos falar sobre:

- Elixir
- [Phoenix Framework](https://www.phoenixframework.org/)
- Driver em Erlang
- Release com
  {{< glossary_tooltip text="cross compile" term_id="crosscompile" >}}

## Arquitetura

`epad` é composto de três principais blocos:

- epad_web, abre e gerencia websockets entre o servidor e o cliente web
- epad, faz a gestão entre usuários (players) e o driver que controla o device
  uinput
- driver, recebe eventos de um processo e escreve no respectivo descritor do
  device uinput utilizando {{< man7 ioctl >}} e {{< man7 write >}}

epad_web e epad foram escritos em Elixir. Já o driver (epad_driver) foi escrito
em C.

Erlang/OTP oferece alguns modos quando precisamos interfacear com APIs do
sistema operacional ou outras bibliotecas feitas em C/C++. Para este projeto
escolhi utilizar driver.

Outro ponto foi a escolha do Phoenix no qual possui uma gestão dos websockets e
com uma abstração na qual cada cliente tenha um processo representando um
usuário. Tudo passa a ser uma questão de envio e recebimento de mensagens.

A figura abaixo mostra os principais blocos da solução:

{{< asciiart caption="Visão geral" >}} +------+ +----+ +--------+ |epad
+----http----->+epad| |retropie| |client| +--+-+ +-----^--+ +------+ | | | | | |
| | +--v----------+--+ |uinput input| | | | Linux | +----------------+
{{< /asciiart >}}

Sobre a árvore de supervisão, para este projeto escolhi criar algo usando
{{< exm DynamicSupervisor >}} pois, dependendo do jogo, podemos ter vários
players conectados.

{{< figure figcaption="Árvore de supervisão" >}}
{{< img epad_supervisor.png Fit "500x400" >}} {{< /figure >}}

## Detalhes do driver epad

epad acompanha um driver Erlang implementado em C, responsável por receber um
evento, decodificar e chamar as funções nativas do Sistema Operacional para
interfacear com o Kernel Linux.

Sempre quando quisermos integrar códigos externos vamos precisar usar uma das
opções baixo:

- NIFs
- Port Drivers
- Ports
- Erl Interface
- C Nodes

A melhor documentação para iniciar neste contexto é o manual
[Interoperability Tutorial User's Guide](http://erlang.org/doc/tutorial/users_guide.html).

Cada opção serve para determinado caso de uso. Para a aplicação epad, uma boa
opção é utilizar um `Port Driver`.

A implementação foi feita no arquivo:
[src/epad_driver.c](https://github.com/joaohf/epad/blob/master/src/epad_driver.c).

Os detalhes de como escrever drivers merecem um post separado. Neste post vou
apenas comentar os pontos principais.

{{< opinion >}} Com grandes poderes vem grandes poderes. Não perca a força mas
sim o medo. Leia a documentação e faça os seus próprios testes. {{< /opinion >}}

Todo driver começa com uma declaração das callbacks que serão implementadas bem
como as features que o driver vai suportar usando o tipo de dado
[ErlDrvEntry](https://erlang.org/doc/man/driver_entry.html):

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="src/epad_driver.c" start=392 end=406 highlight="linenos=inline" >}}

_epad_driver_ é um driver muito simples. Não vamos precisar implementar todas as
callbacks (veja aqui a lista completa
[driver_entry](https://erlang.org/doc/man/driver_entry.html)) e a única callback
que vamos implementar é a
[.control](https://erlang.org/doc/man/driver_entry.html#control):

{{< ghcode title="" lang="c" owner="joaohf" repo="epad" ref="0.0.1" path="src/epad_driver.c" start=166 end=210 highlight="linenos=inline" >}}

O detalhe desta função está relacionado com o modo como os eventos são enviados
do ERTS para o driver pelo processo que faz a interface com o port driver:

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="lib/epad/devices/device.ex" start=58 end=62 highlight="linenos=inline" >}}

No código acima a função `event_port_control/3` vai chamar a função
{{< erlmfa "erlang:port_call/3" >}} na qual vai passar uma string contendo o
tipo do evento, código, e valor. Quando este valor for passado (sincronamente)
pela função erlang:port*call/3. Já a função epad_drv_control() vai receber a
string e parsear, obtendo os valores necessários para chamar o restante das
funções e finalmente comunicar com o device \_uinput* aberto.

{{< tip >}} Esta técnica tem a vantagem de ser mais rápida do que outras opções.
E pode ser utilizada quando precisamos passar algum tipo de flags de controle
nos quais caso haja falhas os erros devem ser tratados imediatamente.
{{< /tip >}}

Um outro aspecto importante: reparem que a função `epad_drv_control()` recebe
_char \*buf_ e _ErlDrvSizeT buf_len_, no caso do epad_driver o valor vai ser uma
string em C. Mas podem haver casos em que seja necessário passar um
{{< glossary_tooltip text="Erlang term" term_id="erlang_term" >}}, aí vamos
precisar utilizar uma biblioteca chamada
[Erlang_Interface](https://erlang.org/doc/apps/erl_interface/ei_users_guide.html)
para converter para estruturas em C e obter os valores corretos.

Enfim, falar de driver é sempre um assunto denso. Existem muitos exemplos de
como fazer e com suporte da documentação oficial fica menos complicado mas ainda
sim é necessário avaliar se não existe algum modo de implementar determinada
feature sem utilizar C/C++ fora do contexto do ERTS.

## Phoenix channels

[Phoenix Channels](https://hexdocs.pm/phoenix/channels.html) implementa uma
abstração em cima de mensagens [websocket](https://tools.ietf.org/html/rfc6455)
nas quais permitem extender o modelo de atores para interfaces e clientes. De
fato não é uma novidade pois o assunto já é antigo e bem estabelecido exemplos:

Vi a ideia pela primeira vez neste post:
[Comet is dead long live websockets ](http://armstrongonsoftware.blogspot.com/2009/12/comet-is-dead-long-live-websockets.html)
e depois projetos como [NitrogenProject](http://nitrogenproject.com/),
[N2O](https://github.com/synrc/n2o) e
[Cowboy](https://ninenines.eu/docs/en/cowboy/2.6/guide/ws_handlers/) começaram a
implementar APIs e infraestrutura necessária.

Mas com Elixir e Phoenix, ficou bem interessante pois o conceito e utilização
estão bem mais flexíveis e fáceis de usar.

Quando o channel é criado (ou seja, um usuário acessou a interface web) a
callback `join/3` é chamada para criar uma processo no qual representa uma
instância do driver epad.

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="lib/epad_web/channels/gamepad_channel.ex" start=8 end=11 highlight="linenos=inline" >}}

Após a inicialização, o channel aguarda eventos vindos do cliente web, chamando
a callback `handle_in/3` para tratar os eventos:

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="lib/epad_web/channels/gamepad_channel.ex" start=28 end=31 highlight="linenos=inline" >}}

Repare que a função sempre recebe o estado do socket que está na variável
`socket`. Assim sabemos exatamente qual usuário estamos tratando.

Quando o usuário sair da interface web, a callback `terminate/2` é chamada para
finalizar o usuário criado:

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="lib/epad_web/channels/gamepad_channel.ex" start=33 end=35 highlight="linenos=inline" >}}

## Client javascript e interface web

A parte web foi implementada em javascript. Claro que usei como base o projeto
{{< gh "sbidolach/mobile-gamepad" >}} e fiz algumas adaptações principalmente
removendo o suporte ao socket.io e usando phoenix channels.

Como não sou especialista em interfaces web, fiz o mínimo necessário para poder
apertar um botão e o evento ser enviado para o backend epad.

Seguem alguns detalhes interessantes.

Todos os artefatos web estão no diretório _assets_. Por padrão Phoenix Framework
cria uma estrutura de projeto baseada no [webpack](https://webpack.js.org/). Em
projetos puramente web, essa estrutura é bem conhecida e creio que facilita o
uso.

O arquivo package.json está preparado para importar duas dependências instaladas
pelo Phoenix:

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="assets/package.json" start=9 end=14 highlight="linenos=inline" >}}

[phoenix](https://hexdocs.pm/phoenix/js/#phoenix) é uma pequena biblioteca em
javascript no qual abstrai e exporta uma API para envio e recebimento de
mensagens websocket.

A implementação do cliente gamepad foi feita no arquivo
[assets/js/gamepad.js](https://github.com/joaohf/epad/blob/master/assets/js/gamepad.js)
com ajuda da biblioteca [jquery](https://jquery.com/) e também da biblioteca
{{< gh "yoannmoinet/nipplejs" >}}, responsável por criar os botões e joystick na
tela.

Basicamente quando o usuário aperta algum botão dois eventos são capturados:
`touchstart` e `touchend` sendo que para cada evento uma mensagem é enviada para
o backend com o código do evento:

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="assets/js/gamepad.js" start=57 end=75 highlight="linenos=inline" >}}

Desta forma podemos criar qualquer tipo de botão, enviar os eventos e o backend
faz a conversão para o device uinput do Linux.

O resto da implementação são funções e tratamentos da interface web.

## Release e instalação

### Sobre compilar drivers em C/C++

Já sabemos que a aplicação epad utiliza um driver Erlang para acessar o device
uinput. Drivers podem ser escritos em C ou C++ e geralmente precisam de um
arquivo [Makefile](https://github.com/joaohf/epad/blob/master/Makefile) com as
regras de compilação, flags, includes e bibliotecas adicionais.

No caso do epad, o Makefile é simples, bastando criar uma
{{< glossary_tooltip text="shared library" term_id="shared_library" >}}. Mas
podem haver casos mais complicados e é por isso que usar a dependência
{{< hex package=elixir_make >}} faz sentido:

Includindo a dependência aqui:

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="mix.exs" start=67 end=67 highlight="linenos=inline" >}}

E chamando durante o comando de compilação (`mix compile`)

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="mix.exs" start=13 end=13 highlight="linenos=inline" >}}

Então o [Makefile](https://github.com/joaohf/epad/blob/master/Makefile)
customizado para as necessidades do epad vai ser chamado.

Lembrando que precisamos ter a opção de fazer cross compile pois vamos instalr o
epad em um hardware especifico. No Makefile, coloquei algumas redefinições para
obter o compilador usando variáveis do ambiente.

{{< ghcode title="Arquivo Makefile" lang="make" owner="joaohf" repo="epad" ref="0.0.1" path="Makefile" start=20 end=24 highlight="linenos=inline" >}}

Usando esta técnica posso configurar qualquer
{{< glossary_tooltip text="toolchain" term_id="toolchain" >}} necessária.

{{< note >}} Caso esteja compilando para RaspberryPi, o projeto
[abhiTronix/raspberry-pi-cross-compilers](https://www.github.com/abhiTronix/raspberry-pi-cross-compilers)
pode ser utilizado para obter o toolchain. {{< /note >}}

### Geração da release

O processo de geração da release é muito simples. Quando usamos Elixir, e a
partir da versão 1.9.x, a ferramenta mix já provê mecanismos para geração da
release. Bastando adicionar pequenas configurações. Exemplo;

{{< ghcode title="" lang="elixir" owner="joaohf" repo="epad" ref="0.0.1" path="mix.exs" start=19 end=30 highlight="linenos=inline" >}}

Preste atenção que não queremos incluir o ERTS na release gerada. Por dois
motivos:

1. se incluirmos o ERTS, este provavelmente não vai executar em outra
   arquitetura
2. iremos instalar um ERTS nativo no hardware alvo

Enfim, o processo de geração de release foi documentado aqui
https://github.com/joaohf/epad#development

### Erlang no hardware alvo

Estou usando uma raspberrypi4 com a distro retropie. A distro possui um
gerenciador de pacotes funcional no qual podemos instalar o compilador gcc,
baixar as fontes do Erlang/OTP e proceder com a instalação. Esse link descreve
todo o processo [https://elinux.org/Erlang](https://elinux.org/Erlang).

{{< opinion >}} Existem outras formas de instalar Erlang/OTP. Uma delas é baixar
algum pacote já pronto. Mas pode não ser seguro ou a versão pode estar
desatualizada.

Enfim, para a minha finalidade funcionou. Mas não creio que seja a melhor opção.
{{< /opinion >}}

## Verificando o funcionamento

Após instalar a aplicação epad e fazer as configurações documentadas aqui:
https://github.com/joaohf/epad#installing-and-configuring-epad-on-retropie,
podemos instalar
[algumas ferramentas](https://github.com/joaohf/epad#debugging-uinput-events) e
verificar se o Linux está recebendo os eventos quando pressionamos algum botão
no controle virtual:

- Usar o navegador do celular e acessar o endereço `http://IP:4000'
- Acessar via ssh e listar os input devices, deve haver apenas um device:

```
sudo lsinput
```

- Executar a ferramenta input-events:

```
sudo input-events 0
```

- No celular, pressionando o botão 'A' na interface web o evento vai ser
  recebido pela ferramenta input-events

Pronto está funcionando. O Linux recebeu o evento com sucesso.

## Conclusão

Bom, economizei algum dinheiro implementando o controle virtual. Agora só falta
chegar no final do _Super Mario_ e salvar a princesa.
