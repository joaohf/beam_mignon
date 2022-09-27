---
title: 'Barramentos'
description: 'Resumo do estado atual das bibliotecas no BEAM'
toc: true
date: 2022-09-26T21:00:00+02:00
series: ['embedded']
tags: ['code', 'libraries']
featured_image: 'images/featured/33.jpg'
---

Este post descreve alguns projetos open source onde um desenvolvedor, no qual
precisa escrever um software que faz acesso aos barramentos de comunicação entre
periféricos, poderia utilizar bibliotecas open source como uma base e evitando
gerencia o acesso por ele mesmo ou pelo menos evitar construir algum código
desde o começo.

Como um desenvolvedor começa ? Quais são os principais bibliotecas open source ?
Estas bibliotecas estão prontas para serem usadas ou precisam de ajustes ou
revitalizações ?

Estas questão são levantadas e não há uma resposta fácil principalmente em
acesso embarcados aos periféricos de comunicação pois cada projeto de hardware
pode trazer diferentes modos de acesso.

Então este post visa resumir as principais APIs.

## Tonyrog

Todos os repositórios do [tonyrog](https://github.com/tonyrog/) seguem um padrão
de implementação usando Erlang Driver, repassando dados entre Erlang VM usando
_port control_. Em alguns casos , como por exemplo recebendo um evento GPIO, o
driver envia uma mensagem para um processo específico através do port control
processo na Erlang VM. No restante, port control é usado para toda a
comunicação. Um outro ponto é que as estruturas de dados entre Erlang e C são
feitas usando bitstrings no Erlang e passados para C e os buffers são retornados
para Erlang, ou seja não há encode/decode de _Erlang terms_ usando funções da
biblioteca _ei_. A maioria da implementação é para Linux.

### GPIO

[GPIO](https://github.com/tonyrog/gpio), API
https://github.com/tonyrog/gpio/blob/master/src/gpio.erl

- init
- init_direct
- release
- set
- get
- clr
- input
- output
- set_direction
- get_direction
- set_interrupt
- get_interrupt

[GPIO Erlang Driver](https://github.com/tonyrog/gpio/blob/master/c_src/gpio_drv.c)
para Linux usando sysfs interface, bcm2835, omap24xx and omap34xx.

### I2C

[I2C](https://github.com/tonyrog/i2c), API
https://github.com/tonyrog/i2c/blob/master/src/i2c.erl

- open
- close
- set_retries
- set_timeout
- set_slave
- set_slave_force
- set_tenbit
- set_pec
- get_funcs
- rdwr
- smbus

[I2C Erlang Driver](https://github.com/tonyrog/i2c/blob/master/c_src/i2c_drv.c)
para Linux usando i2c-dev (userland access for I2C).

### SPI

[SPI](https://github.com/tonyrog/spi), API
https://github.com/tonyrog/spi/blob/master/src/spi.erl

- open
- close
- transfer
- get_mode
- get_bits_per_word
- get_speed

[SPI Erlang Driver](https://github.com/tonyrog/spi/blob/master/c_src/spi_drv.c)
para Linux usand spidev (userland access for SPI).

### PWM

[PWM](https://github.com/tonyrog/pwm), API
https://github.com/tonyrog/pwm/blob/master/src/pwm.erl

- chip_list
- number_of_pwms
- export
- unexport
- set_duty_cycle
- set_period
- set enable
- disable polarity

É um wrapper simples em Erlang para acessar a interface _/sys/class/pwm_ em
Linux.

### CAN

[CAN](https://github.com/tonyrog/can), API
https://github.com/tonyrog/can/blob/master/src/can.erl

- send_ext
- send_fd
- send
- send_from
- sync_send
- sync_send_from
- create
- icreate
- send
- pause
- resume
- ifstatus

[CAN Erlang Driver](https://github.com/tonyrog/can/blob/master/c_src/can_sock_drv.c)
para Linux CAN socket driver.

### UART

[UART](https://github.com/tonyrog/uart), API
https://github.com/tonyrog/uart/blob/master/src/uart.erl. [UART Erlang Driver]
(https://github.com/tonyrog/uart/blob/master/c_src/uart_drv.c) suporta Linux and
Windows UART.

## Erlang ALE

[erlang_ale](https://github.com/esl/erlang_ale) objectiva prover APIs para Linux
e oferece suporte para GPIO (sysfs), I2C, SPI. Todos estes acessos são feitos
usando Erlang Port e existe aplicações em C para suportar estes acessos.

O encode/decode de e para Erlang VM é feito chamando funções da bibliotera _ei_.

- GPIO: write read set_int register_int unregister_int
- I2C: write read write_read
- SPI: transfer

## Elixir ALE

[elixir_ale](https://github.com/fhunleth/elixir_ale) is igual ao erlang_ale mas
trazendo melhorias na implementaçào em C e outros ajustes gerais. Mas a API e a
estratégia para acesso os recursos do Sistema Operacional Linux são os mesmos
implementados no erlang_ale.

## Elixir Circuits

[elixir-circuits](https://github.com/elixir-circuits/) prove APIs no Linux para
os barramentos mais comuns: GPI, I2C, SPI and UART.

### GPIO

Disponível em dois modos:

Linux char device, https://github.com/elixir-circuits/circuits_cdev, API
https://github.com/elixir-circuits/circuits_cdev/blob/main/lib/chip.ex

- open
- read_value
- read_values
- request_line
- request_lines
- set_value
- set_values
- get_line_info
- listen_event

Linux sys interface, https://github.com/elixir-circuits/circuits_gpio, API
https://github.com/elixir-circuits/circuits_gpio/blob/main/lib/gpio.ex

- open
- read
- write
- set_interrupts
- set_interrupts
- set_direction
- set_pull_mode
- pin

Os dois são abstrações em torno do Linux _sysfs_ e _char devices_. A
implementação para acessar o baixo nível é feito em Erlang NIFs.

### I2C

[circuits_i2c](https://github.com/elixir-circuits/circuits_i2c), API
https://github.com/elixir-circuits/circuits_i2c/blob/main/lib/i2c.ex

- open
- read
- write
- write_read

[I2C Erlang NIF](https://github.com/elixir-circuits/circuits_i2c/blob/main/src/i2c_nif.c),
usando Linux i2c-dev para acesso userland.

### SPI

[circuits_spi](https://github.com/elixir-circuits/circuits_spi), API
https://github.com/elixir-circuits/circuits_spi/blob/main/lib/spi.ex

- open
- close
- transfer

[SPI Erlang NIF](https://github.com/elixir-circuits/circuits_spi/blob/main/src/spi_nif.c),
usando Linux spidev para acesso userland.

### UART

[circuits_uart](https://github.com/elixir-circuits/circuits_uart), API
https://github.com/elixir-circuits/circuits_uart/blob/main/lib/circuits_uart.ex

- open
- close
- configuration
- send_break
- set_break
- write
- read
- drain
- flush
- signals
- set_rts

[UART Erlang NIF](https://github.com/elixir-circuits/circuits_uart/blob/main/src/circuits_uart.c)
para controlar o acesso baixo nível.

## GRiSP

GRiSP é um projeto desenvolvido em torno de um hardware especifico e suas APIs
para acesso ao barramento são bem especificas para aquele hardware e utilizam
primitivas do Sistema Operacional escritas em C para acessar os recursos de
hardware. A implemenção usa alguns atalhos para prover uma boa abstração.
Entretando, fora do contexto GRiSP, o projecto não oferece uma camada de
abstração genérica.

### GPIO

API: https://github.com/grisp/grisp/blob/master/src/grisp_gpio.erl

- get
- set
- clear

Detalhes de implementação:

- https://github.com/grisp/grisp/blob/master/src/grisp_gpio_poller.erl
- https://github.com/grisp/grisp/blob/master/src/grisp_gpio_drv.erl
- https://github.com/grisp/grisp/blob/master/grisp/grisp_base/drivers/grisp_gpio_drv.c

### I2C

Main API: https://github.com/grisp/grisp/blob/master/src/grisp_i2c.erl

- msgs

Detalhes de implementação:

- https://github.com/grisp/grisp/blob/master/src/grisp_i2c.hrl
- https://github.com/grisp/grisp/blob/master/src/grisp_i2c_drv.erl
- https://github.com/grisp/grisp/blob/master/grisp/grisp_base/drivers/grisp_i2c_drv.c

### SPI

API: https://github.com/grisp/grisp/blob/master/src/grisp_spi.erl

- send_recv

Detalhes de implementação:

- https://github.com/grisp/grisp/blob/master/src/grisp_spi_drv.erl
- https://github.com/grisp/grisp/blob/master/grisp/grisp_base/drivers/grisp_spi_drv.c

### onewire

API: https://github.com/grisp/grisp/blob/master/src/grisp_onewire.erl

- transaction
- reset
- write_config
- detect
- bus_reset
- write_byte
- write_triplet
- read_byte
- search
