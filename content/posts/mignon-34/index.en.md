---
title: 'BEAM Tools'
description: 'Sumarizes the current state for embedded libraries on BEAM'
toc: true
date: 2022-09-27T21:00:00+02:00
series: ['beamtools']
tags: ['tools']
featured_image: 'images/featured/34.jpg'
---

This post describes open source projects where a developer, who needs to
write software which the main requirement is to access common buses (widely
used in industry like I2C, GPIO and SPI), could use open source libraries as a
base ground and avoid dealing with low level access or at least building
something from scratch.

How would that developer start ? What are the main open sources libraries ? Are they
ready to use or need some adjustments or major revitalization ?

Those questions have been raised but there is no easy answer and to get things
worse, embedded low level access may happen in a different way depending on
hardware components and board layouts.

So, this post is more like a summary describing those APIs.

## Tonyrog

All application library from [tonyrog](https://github.com/tonyrog/) follows a
pattern implementing the low level Operation System using Erlang Driver, passing
data to and from the VM using the port control. In some cases, like receiving a
GPIO event, the driver sends a message to a specific process through the port
control process in the VM. Other than that, the port control is used for all the
communications. Another point is that the data structures between Erlang and C
are done in such a way where bitstrings from Erlang are passed to C and buffers
are written back to Erlang (there is no erlang terms encode/decode involved).
The implementation is Linux specific.

### GPIO 

[GPIO](https://github.com/tonyrog/gpio), main API https://github.com/tonyrog/gpio/blob/master/src/gpio.erl

 * init
 * init_direct
 * release
 * set
 * get
 * clr
 * input
 * output
 * set_direction
 * get_direction
 * set_interrupt
 * get_interrupt
 
[GPIO Erlang Driver](https://github.com/tonyrog/gpio/blob/master/c_src/gpio_drv.c) for Linux based
sysfs interface, bcm2835, omap24xx and omap34xx.

### I2C

[I2C](https://github.com/tonyrog/i2c), main API https://github.com/tonyrog/i2c/blob/master/src/i2c.erl

 * open 
 * close
 * set_retries
 * set_timeout
 * set_slave
 * set_slave_force
 * set_tenbit
 * set_pec
 * get_funcs
 * rdwr
 * smbus

[I2C Erlang Driver](https://github.com/tonyrog/i2c/blob/master/c_src/i2c_drv.c) for Linux based
i2c-dev (userland access for I2C).

### SPI

[SPI](https://github.com/tonyrog/spi), main API https://github.com/tonyrog/spi/blob/master/src/spi.erl

 * open
 * close
 * transfer
 * get_mode
 * get_bits_per_word
 * get_speed
 
[SPI Erlang Driver](https://github.com/tonyrog/spi/blob/master/c_src/spi_drv.c) for Linux based
spidev (userland access for SPI).

### PWM

[PWM](https://github.com/tonyrog/pwm), main API https://github.com/tonyrog/pwm/blob/master/src/pwm.erl

 * chip_list
 * number_of_pwms
 * export 
 * unexport
 * set_duty_cycle
 * set_period
 * set enable
 * disable polarity

It is a simple erlang wrapper for _/sys/class/pwd_ Linux interface.

### CAN

[CAN](https://github.com/tonyrog/can), main API https://github.com/tonyrog/can/blob/master/src/can.erl

 * send_ext
 * send_fd
 * send
 * send_from
 * sync_send
 * sync_send_from
 * create
 * icreate
 * send
 * pause
 * resume
 * ifstatus

[CAN Erlang Driver](https://github.com/tonyrog/can/blob/master/c_src/can_sock_drv.c)
for Linux CAN socket driver.

### UART

[UART](https://github.com/tonyrog/uart), main API https://github.com/tonyrog/uart/blob/master/src/uart.erl. [UART Erlang Driver]
(https://github.com/tonyrog/uart/blob/master/c_src/uart_drv.c) supports Linux and
Windows UART.

## Erlang ALE

[erlang_ale](https://github.com/esl/erlang_ale) targets Linux OS and provides an
Erlang API access for GPIO (sysfs), I2C, SPI. All those accesses are done using
Erlang Port and there are external C applications for each supported bus.

The encode and decode from and to Erlang is done by calling ei interface in C
code.

 * GPIO: write read set_int register_int unregister_int
 * I2C: write read write_read
 * SPI: transfer

## Elixir ALE

[elixir_ale](https://github.com/fhunleth/elixir_ale) is pretty much erlang_ale
bringing improvements on the C side and other general fixes. But the API and
strategy to access the Linux resources are still the same implemented by
erlang_ale.

## Elixir Circuits

[elixir-circuits](https://github.com/elixir-circuits/) provides APIs and access
on Linux for the most common busses like GPI, I2C, SPI and UART.

### GPIO

Available in two flavours:

Linux char device, https://github.com/elixir-circuits/circuits_cdev, 
main API https://github.com/elixir-circuits/circuits_cdev/blob/main/lib/chip.ex

 * open
 * read_value
 * read_values
 * request_line
 * request_lines
 * set_value
 * set_values
 * get_line_info
 * listen_event

Linux sys interface, https://github.com/elixir-circuits/circuits_gpio,
main API https://github.com/elixir-circuits/circuits_gpio/blob/main/lib/gpio.ex

 * open
 * read
 * write
 * set_interrupts
 * set_interrupts
 * set_direction
 * set_pull_mode
 * pin

Both are abstractions around Linux sysfs and char devices. The low level access
is implemented using Erlang NIFs.

### I2C 

[circuits_i2c](https://github.com/elixir-circuits/circuits_i2c),
main API https://github.com/elixir-circuits/circuits_i2c/blob/main/lib/i2c.ex

 * open
 * read
 * write
 * write_read

[I2C Erlang NIF](https://github.com/elixir-circuits/circuits_i2c/blob/main/src/i2c_nif.c), using
Linux i2c-dev for userland access.

### SPI

[circuits_spi](https://github.com/elixir-circuits/circuits_spi),
main API https://github.com/elixir-circuits/circuits_spi/blob/main/lib/spi.ex

 * open
 * close
 * transfer

[SPI Erlang NIF](https://github.com/elixir-circuits/circuits_spi/blob/main/src/spi_nif.c), using
Linux spidev for userland access.

### UART

[circuits_uart](https://github.com/elixir-circuits/circuits_uart), main API
https://github.com/elixir-circuits/circuits_uart/blob/main/lib/circuits_uart.ex

 * open
 * close
 * configuration
 * send_break
 * set_break
 * write
 * read
 * drain
 * flush
 * signals
 * set_rts

[UART Erlang NIF](https://github.com/elixir-circuits/circuits_uart/blob/main/src/circuits_uart.c)
for controlling the low level OS access.

## GRiSP

As the GRiSP project is tailored around a specific hardware its API for busses
access are very specific for that hardware and uses low level Operation System
primitives written in C in order to access the hardware resource. The overall
implementation takes some shortcuts to provide a nice abstraction. However,
outside GRiSP context, it does not offer a generic hardware abstraction layer.

### GPIO

Main API: https://github.com/grisp/grisp/blob/master/src/grisp_gpio.erl

 * get
 * set
 * clear

Implementation details:

 * https://github.com/grisp/grisp/blob/master/src/grisp_gpio_poller.erl
 * https://github.com/grisp/grisp/blob/master/src/grisp_gpio_drv.erl
 * https://github.com/grisp/grisp/blob/master/grisp/grisp_base/drivers/grisp_gpio_drv.c

### I2C

Main API: https://github.com/grisp/grisp/blob/master/src/grisp_i2c.erl

 * msgs

Implementation details:

 * https://github.com/grisp/grisp/blob/master/src/grisp_i2c.hrl
 * https://github.com/grisp/grisp/blob/master/src/grisp_i2c_drv.erl
 * https://github.com/grisp/grisp/blob/master/grisp/grisp_base/drivers/grisp_i2c_drv.c

### SPI

Main API: https://github.com/grisp/grisp/blob/master/src/grisp_spi.erl

 * send_recv

Implementation details:

 * https://github.com/grisp/grisp/blob/master/src/grisp_spi_drv.erl
 * https://github.com/grisp/grisp/blob/master/grisp/grisp_base/drivers/grisp_spi_drv.c

### onewire

Main API: https://github.com/grisp/grisp/blob/master/src/grisp_onewire.erl

 * transaction
 * reset
 * write_config
 * detect
 * bus_reset
 * write_byte
 * write_triplet
 * read_byte
 * search
