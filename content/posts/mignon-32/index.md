---
title: 'Simuladores em Erlang'
description: ''
toc: true
date: 2022-01-30T21:46:00+02:00
series: ['simulation']
tags: ['code', 'simulation']
featured_image: 'images/featured/32.jpg'
---

# Simuladores em Erlang, ideia geral

Camadas em software podem ser implementadas para flexibilizar e melhorar o
feedback loop durante o desenvolvimento de sistemas que interagem com hardware.
Estas camadas podem ser simuladores nos quais, quando ativados, interceptam as
chamadas de determinada camada roteando para as APIs simuladas.

O seguinte paper apresenta a ideia geral e motivos do uso de simuladores para
desenvolvimento de projetos que interagem com hardware:
[Erlang Embedded Simulation Thesis Report](https://www.scribd.com/document/55697604/Erlang-Embedded-Simulation-Thesis-Report),
segue o _abstract_ do paper:

> The goal of this thesis is to develop simulators for device drivers and to
> create and describe a work flow for developing on Erlang Embedded using
> simulators. The motivation is that frequently testing code on hardware is
> inconvenient, takes time and only is possible if you have access to the
> hardware. By simulating simple device drivers like serial ports, buttons and
> led, this thesis aims to prove that a better development environment can be
> created. A development work flow describes how the current work flow with
> Erlang Embedded can be improved by using simulators. The idea is that you
> should be able to switch between real hardware and simulated mode by just
> changing an environment variable and providing necessary configuration files.
> No changes in code are required. A recorder tool was developed to support
> simulation of devices that generate data such as sensors. The recorder can
> also be used to quickly create a simulator replaying data traffic that have
> been recorded from an application previously. Taking advantage of dbg module,
> the recorder captures messages that a process receives or sends off without
> any modification to the source code. Using the recorder tool, no API or
> application logic is needed to simulation a sensor. The thesis was conducted
> at Chalmers University of Technology under supervision of Erlang Solutions
> Ltd. Erlang Embedded Simulation is available at Github
> (https://github.com/EmbeddedErlang/Embedded-Erlang-Simulation) and is licensed
> under: Apache License Version 2.0, January 2004
> (http://www.apache.org/licenses/LICENSE-2.0.html).

Segue video de uma palestra sobre o tema apresentado pelos autores da tese:

{{< youtube YQei41wTFGk >}}
