---
title: "Elixir: mocks, stubs"
description: ""
toc: true
date: 2019-08-13T17:43:50+02:00
tags: ["testes"]
series: ["vamos testar"]
---

As duas abordagens abaixo servem para configurar um projeto para utilizar mocks durante os testes.

## Abordagem 1: mocks sem ajuda

O arquivo _mix.exs_ deve ser ajustado acrescentando um diretório adicional para a propriedade `elixirc_paths`:
  
{{< highlight elixir "hl_lines=5 16" >}}
def project do
    [app: :coffee_fsm,
     version: "0.1.0",
     elixir: "~> 1.4",
     elixirc_paths: elixirc_paths(Mix.env),
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps()]
  end

  def application do
    # Specify extra applications you'll use from Erlang/Elixir
    [extra_applications: [:logger]]
  end

  defp elixirc_paths(:test), do: ["lib","test/support"]
  defp elixirc_paths(_), do: ["lib"]
{{< / highlight >}}

Quando MIX_ENV for `test` a função `elixirc_paths/1` retorna uma lista com dois diretórios onde existe código Elixir para ser compilado.

O próximo passo é configurar a aplicação variando de acordo com o MIX_ENV. O arquivo _config/config.exs_ geralmente é usado para colocar todas as configurações de uma aplicação:
  
{{< highlight elixir >}}
case Mix.env do
  :test ->
    config :coffee_fsm, hw: HwMock
  _ ->
    config :coffee_fsm, hw: HwOutput
end
{{< / highlight >}}

Basicamente estamos trocando a implementação, baseado na configuração do ambiente.

Agora, implementamos um módulo encapsulando as funções que serão chamadas. No arquivo _lib/hw.ex_
definimos algumas funções nas quais irão chamar a implementação real.

{{< highlight elixir >}}
defmodule Hw do
  @hw_impl Application.fetch_env!(:coffee_fsm, :hw)

  defmodule Behaviour  do
    @callback display(f,a) :: :ok when f: String.t(), a: [any()]
    @callback return_change(n) :: :ok when n: non_neg_integer()
    @callback drop_cup() :: :ok
    @callback prepare(t) :: :ok when t: atom()
    @callback reboot() :: :ok
  end

  @spec display(s,a) :: :ok when s: String.t(), a: [any()]
  def display(str, args), do: @hw_impl.display(str, args)

  @spec return_change(n) :: :ok when n: non_neg_integer()
  def return_change(payment), do: @hw_impl.return_change(payment)
  
  @spec drop_cup :: :ok
  def drop_cup, do: @hw_impl.drop_cup()
  
  @spec return_change(b) :: :ok when b: CoffeeFsm.beverage()
  
  def prepare(type), do: @hw_impl.prepare(type)
  
  @spec reboot :: :ok
  def reboot, do: @hw_impl.reboot()
end
{{< / highlight >}}

Dependendo da configuração `@hw_impl` pode ser HwMock ou HwOutput. Mas ambos os módulos possuem o mesmo contrato pois implementam o behaviour: `Hw.Behaviour`.

A implementação do HwOutput deve ser escrita no arquivo _test/support/hw_mock.ex_:

{{< highlight elixir "hl_lines=1" >}}
defmodule HwMock do
  @behaviour Hw.Behaviour

  use GenServer

  defp forward_pending(pending, pid) when is_pid pid do
    forward_to =
      fn(request, _) ->
        Kernel.send pid, request
        :ok
      end

    pending
    |> Enum.reverse()
    |> Enum.reduce(:ok, forward_to)
  end

  def handle_cast(entry, {:none, pending}) do
    {:noreply, {:none, [entry | pending]}}
  end
  def handle_cast(entry, {pid, pending}) do
    forward_pending [entry | pending], pid

    {:noreply, {pid, []}}
  end

  def handle_call({:forward, pid}, _from, {_, pending}) when is_pid pid do
    forward_pending pending, pid

    {:reply, :ok, {pid, []} }
  end
  def handle_call({:forward, _}, _from, {_, pending}) do
    {:reply, :ok, {:none, pending} }
  end
  def handle_call(:clear, _from, {pid, _}) do
    {:reply, :ok, {pid, []} }
  end

  defp log(entry) do
    GenServer.cast __MODULE__, entry
  end

  def init(_args), do: {:ok, {:none, []}}

  # public interface
  def start_link, do: GenServer.start_link __MODULE__, [], name: __MODULE__

  def clear(pid) do
    GenServer.call __MODULE__, :clear
  end

  def forward(pid) do
    GenServer.call __MODULE__, {:forward, pid}
  end

  # implementing "Hw"" behaviour
  def display(str, args) do
    log { :display, [str, args] }
    :ok
  end

  def return_change(payment) do
    log { :return_change, [payment] }
    :ok
  end

  def drop_cup do
    log { :drop_cup, [] }
    :ok
  end

  def prepare(type) do
    log { :prepare, [type] }
    :ok
  end

  def reboot do
    log { :reboot, [] }
    :ok
  end

end
{{< / highlight >}}

Repare que todas as funções do behaviour foram implementadas utilizando um `GenServer` para simular um hardware real. Desta forma quando executármos `mix test` o módulo `HwMock` vai ser usado.

## Abordagem 2: mocks com ajuda

Existem algumas bibliotecas que ajudam na criação de mocks e stubs. Uma das mais interessantes nasceu a partir deste post: [Mocks and explicit contracts](http://blog.plataformatec.com.br/2015/10/mocks-and-explicit-contracts/) mais detalhes no [github do projeto](https://github.com/plataformatec/mox) e [documentação](https://hexdocs.pm/mox/Mox.html).

O arquivo _mix.exs_ e _config/config.exs_ deve ser configurado do mesmo modo feito na Abordagem 1.

test_helper.exs

{{< highlight elixir "hl_lines=1">}}
Mox.defmock(HwMock, for: Hw.Behaviour)
{{< / highlight >}}

`Mox.defmock/2` vai criar um mock baseado em contratos. Então precisamos informar para esta função qual vai ser o contrado que o módulo `HwMock` vai implementar.

Então durante os testes, no arquivo _test/hw_test.exs_, podemos configurar o mock com algumas funções:

{{< highlight elixir "hl_lines=9-11" >}}
use ExUnit.Case, async: true

import Mox

# Make sure mocks are verified when the test exits
setup :verify_on_exit!

test "invokes hw output" do
  HWMock
  |> expect(:drop_cup, fn -> :ok end)
  |> expect(:return_change, fn _x -> :ok end)

  assert Hw.drop_cup() == :ok
  assert Hw.return_change(4) == :ok
end

{{< / highlight >}}

Quando o código em teste chamar as funções `drop_cup/0` e `return_change/0` as funções anônimas serão executadas. E neste hora você pode fazer qualquer checagem adicionar, inclusive pattern match com alguma variável, definida fora da função anônima.

Com a biblioteca Mox, podemos criar mocks e stubs para os nossos projetos.

## Atenção

* As duas abordagens possuem o mesmo mecanismo de utilizar uma configuração para definir se a implementação é um mock ou não. Esta configuração pode ser passada utilizando a configuração da aplicação e depois chamando `Application.get_env/3` ou como parâmetro de funções.

* Utilizando um módulo, exemplo: `Hw`, como interface principal possibilita ter um melhor controle sobre o código com dependência externa. Muitas vezes esta técnica é utilizado para criar mocks de bibliotecas de comunicação e clientes http. 


