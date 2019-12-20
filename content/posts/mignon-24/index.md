---
title: "Brincando com Erlang nodes: cloonix"
description: ""
toc: true
date: 2019-12-21T22:45:50+02:00
series: ["erlang nodes"] 
tags: ["code", "failure", "eclero", "cloonix"]
featured_image: 'images/featured/eclero-3-0.jpg'
---

Este post faz parte de uma série de outros posts relacionados a como usar _Erlang distribution protocol_.

Na primeira parte, {{< ref "/posts/mignon-20" >}} criamos uma aplicação básica. Já na segunda parte, {{< ref "/posts/mignon-22" >}}, criamos uma imagem Linux para a aplicação e clero. Na terceira parte, {{< ref "/posts/mignon-23" >}}, apresentamos a solução para o problema do epmd. E agora vem a pergunta, como podemos simular mais nós dentro do ambiente ?

Mas antes vamos atualizar a lista dos requisitos:

1. ~~Cada nó necessita detectar e ser notificado de qualquer falha dos outros nós~~
2. O cluster de nós Erlang deve ser configurado utilizando algum tipo de configuração vinda do ambiente
3. ~~O ambiente de execução é Linux embarcado rodando em qualquer plataforma~~
4. ~~Desejável poder rodar em um ambiente embarcado com o mínimo de recursos necessários~~
5. Mínimo de 3 nós para a solução funcionar
6. Desejo inspecionar os pacotes transmitidos entre os nós do cluster

## cloonix

[cloonix](https://clownix.net/) é um software para criar e simular redes virtuais utilizando kvm para fazer a virtualização dos hosts. Escreve um post sobre como utilizar o [cloonix com o Yocto Project](https://yocto-way.joaohf.tk/posts/way_0/) e agora vamos utilizar para simular os nós que precisamos.

{{< note >}}
É possível criar diversos tipos de ambientes com o cloonix. O software é bem simples de utilizar e possui comandos para criar scripts utilizados na configuração do ambiente.
{{< /note >}}

## Simulando o ambiente

Para isso utilizei o script abaixo no qual cria três máquinas virtuais com uma interface de rede cada uma conectadas em uma lan e um sniffer (wireshark) escutando a lan. Assim vamos conseguir inspecionar os pacotes trocados entre todos os hosts

{{< highlight bash "linenos=inline" >}}
NET=nemo
DEMOVM=cloonix-image-minimal-qemux86.wic.qcow2
CONFIGS=~/work/opensource/cloonix_eclero

cloonix_cli ${NET} kil
cloonix_net ${NET}
cloonix_gui ${NET}
cloonix_cli ${NET} add kvm bird0 ram=800 cpu=2 dpdk=0 sock=1 hwsim=0 ${DEMOVM} &
cloonix_cli ${NET} add kvm bird1 ram=800 cpu=2 dpdk=0 sock=1 hwsim=0 ${DEMOVM} &
cloonix_cli ${NET} add kvm bird2 ram=800 cpu=2 dpdk=0 sock=1 hwsim=0 ${DEMOVM} &

cloonix_ssh ${NET} bird0 "echo" 2>/dev/null
cloonix_ssh ${NET} bird1 "echo" 2>/dev/null
cloonix_ssh ${NET} bird2 "echo" 2>/dev/null

sleep 5

cloonix_cli ${NET} add lan bird0 0 lan1
cloonix_cli ${NET} add lan bird1 0 lan1
cloonix_cli ${NET} add lan bird2 0 lan1

cloonix_cli nemo add snf snf1
sleep 5
cloonix_cli nemo add lan snf1 0 lan1

sleep 5

cloonix_ssh ${NET} bird0 "hostname eclero6"
cloonix_ssh ${NET} bird1 "hostname eclero8"
cloonix_ssh ${NET} bird2 "hostname eclero10"

cloonix_ssh ${NET} bird0 "ifconfig eth0 192.168.7.6"
cloonix_ssh ${NET} bird1 "ifconfig eth0 192.168.7.8"
cloonix_ssh ${NET} bird2 "ifconfig eth0 192.168.7.10"
{{< / highlight >}}

Após a execução do script, o seguinte ambiente é criado:

{{< figure figcaption="Três instâncias do qemu, conectados em uma lan." >}}
  {{< img screenshot_cloonix_1.png Fit "640x480" >}}
{{< /figure >}}

O próximo passo é conectar em cada máquina virtual criada para inicializar a aplicação eclero. Fazemos os seguintes comandos em três terminais:

{{< highlight bash "linenos=inline" >}}
cloonix_ssh nemo bird0

/usr/lib/eclero/eclero
{{< /highlight >}}

{{< note >}}
Cada máquina virtual recebeu um nome. Exemplo bird0, bird1 e bird2.
{{< /note >}}

E em cada terminal temos uma instância do eclero rodando no qual vamos dizer para o 'epmdless' onde estão os nós e também iniciar a conexão entre eles.

* configurando o epmdless:
{{< highlight erlang "linenos=inline" >}}
Eshell V10.5.6  (abort with ^G)
(eclero@eclero6)1> epmdless_dist:add_node('eclero@eclero6', 17012).
ok                 
(eclero@eclero6)2> epmdless_dist:add_node('eclero@eclero8', 17012).
ok
(eclero@eclero6)3> epmdless_dist:add_node('eclero@eclero10', 17012).
{{< / highlight >}}
* conectando os nós:
{{< highlight erlang "linenos=inline" >}}
(eclero@eclero6)4> net_adm:ping('eclero@eclero6').
pong
(eclero@eclero6)5> net_adm:ping('eclero@eclero8').
pong
(eclero@eclero6)6> net_adm:ping('eclero@eclero10').
{{< / highlight >}}
* verificando se os nós estão conectados, `Port 192` e `Port 480` mostram duas conexões vindas de dois IPs na porta 17012. Assim confirmamos que o epmdless e os nós estão conectados corretamente
{{< highlight erlang "linenos=inline" >}}
(eclero@eclero10)21> inet:i().
Port Module   Recv   Sent   Owner     Local Address      Foreign Address   State     Type
48   inet_tcp 0      0      <0.59.0>  *:17012            *:*               ACCEPTING STREAM
112  inet_tcp 0      0      <0.133.0> *:8000             *:*               ACCEPTING STREAM
192  inet_tcp 190625 190584 <0.280.0> 192.168.7.10:50523 192.168.7.6:17012 ????      STREAM
480  inet_tcp 130962 130646 <0.431.0> 192.168.7.10:37643 192.168.7.8:17012 ????      STREAM
ok
{{< / highlight >}}
* abrindo o wireshark para checar a rede
{{< figure figcaption="Wireshark mostrando os pacotes entre cada nó." >}}
  {{< img screenshot_cloonix_2.png Fit "640x480" >}}
{{< /figure >}}

Até agora temos um ambiente simulado com três nós onde cada VM Erlang está conectada utilizando o protocolo [Erlang Distributed Protocol](http://erlang.org/doc/apps/erts/erl_dist_protocol.html).

{{< tip >}}
A ferramenta Wireshark possui um decodificador [erldp](https://www.wireshark.org/docs/dfref/e/erldp.html) para o protocolo.
{{< /tip >}}

{{< figure figcaption="Ambiente cloonix em execução" >}}
  {{< img screenshot_cloonix_3.png Fit "640x480" >}}
{{< /figure >}}

## Verificando o estado do cluster eclero

Vamos fazer duas verificações para responder duas perguntas:

1. O que acontece se todos os nós estão conectados e removemos um nó de maneira não graceful
2.  O que acontece se todos os nós estão conectados e removemos um nó de maneira graceful (utilizando por exemplo `erlang:disconnect_node/1`)

Para o primeiro caso, em qualquer um dos nós, executamos:

{{< highlight erlang "linenos=inline" >}}
(eclero@eclero6)9> eclero_decision_server:is_health().
true
{{< /highlight >}}

Então, removemos um nó do cluster (por exemplo saindo da aplicação e clero em um dos nós)

{{< highlight erlang "linenos=inline" >}}

(eclero@eclero6)10> eclero_decision_server:is_health().
false

(eclero@eclero6)15> eclero_health:get().
{ok,[{eclero@eclero10,true},
     {eclero@eclero6,true},
     {eclero@eclero8,false}]}
{{< /highlight >}}

Podemos ver que a aplicação detecta o desaparecimento do nó e coloca todo o cluster no estado não saudável (`eclero_decision_server:is_health()` é false).

Já para o segundo caso, em qualquer um dos nós, executamos:

{{< highlight erlang "linenos=inline" >}}
(eclero@eclero8)9> eclero_decision_server:is_health().
true
(eclero@eclero8)10> erlang:disconnect_node('eclero@eclero10').
true
(eclero@eclero8)11> nodes().
[eclero@eclero6]

(eclero@eclero8)12> eclero_decision_server:is_health().
false
{{< /highlight >}}

Entretanto, se checarmos o estado em outro nó temos, por exemplo 'eclero6'

{{< highlight erlang "linenos=inline" >}}
(eclero@eclero6)21> eclero_decision_server:is_health().
true
{{< /highlight >}}

Informando que o cluster está operacional.

Aparentemente este cenário pode parecer errado. Mas está correto pois a função `disconnect_node/1` força a desconexão de um determinado nó. No caso o nó 'eclero8' desconectou o nó 'eclero10'.

## Conclusão

Enfim, a intenção aqui foi escrever sobre como simular algum ambiente utilizando um simulador de rede e que uma aplicação possa ser testada de alguma forma. Com certeza a técnica pode ser utilizada para outros tipos de problemas.

Ter a possibilidade de executar simulações em um cluster Erlang pode ajudar bastante na prototipagem e testes das aplicações. Podendo até mesmo ajudar nos testes quando usamos o common_test.

Durante a execução desta série de posts, tive vários pequenos impasses:

* dependência de resolução de IP para nomes (utilizei o arquivo '/etc/hosts' com todos os hosts)
* dependência, por parte do ERTS, de um shell (bash, sh) para fazer o fork de alguns ports no qual a VM Erlang necessidade (por exemplo: inet_gethost)
* patch do erlinit para o mesmo utilizar o ERTS da aplicação e não depender dos pacotes erlang da distribuição
* entender como a aplicação epmdless funciona e propor alguma solução para auto descoberta dos nós sem precisar fazer configurações adicionais

Nos próximos posts da série vamos caminhar mais com a solução.
