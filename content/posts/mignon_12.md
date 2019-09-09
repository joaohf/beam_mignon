---
title: "Trace instrumentando o código com dbg"
description: ""
date: 2019-08-17T12:15:50+02:00
tags: ["code", "trace"]
series: ["traces"]
---

Este post é sobre como instrumentar uma aplicação e coletar traces para posterior analise. A ideia veio deste post: [Erlang trace files in Wireshark](https://www.erlang-solutions.com/blog/erlang-trace-files-in-wireshark.html) e também deste código [hackney_trace.erl](https://github.com/benoitc/hackney/blob/master/src/hackney_trace.erl).

Aqui estamos falando de como utilizar a BEAM VM para capturar traces da aplicação. Podemos usar trace nas seguintes situações:

* _low level information_ próprio para debug do software
* queremos localizar extamente o ponto que ocorre algum evento
* as informações são destinadas para o desenvolvedor
* adicionar e remover trace devem ser rápidos

Um módulo em Elixir pode ser construído para instrumentar uma aplicação com pontos de trace. Esta técnica é um dos jeitos de utilizar o módulo [dbg](http://erlang.org/doc/man/dbg.html).

O código a seguir implementa um módulo chamado `Trace`. Dividi em blocos para ficar mais fácil explicar o código.

{{< highlight elixir "linenos=table" >}}
defmodule Trace do
  @moduledoc false

  @level :max

  @trace_filename "/tmp/swixservice"
  @trace_opts_suffix '.pcap'
  @trace_opts_size 128 * 2048
  @trace_opts_wrap 8
  @trace_opts_queue_size 200

  @default_service :default

  @typedoc """
  Trace level
  """
  @type trace_level :: :max | :min | 20 | 40 | 60 | 80

  @typedoc """
  Filename to write traces
  """
  @type filename :: String.t()

{{< / highlight >}}

Apenas algumas definições de algumas constantes.

{{< highlight elixir "linenos=table" >}}
  @doc """
  Convenient function to start tracing using default level and output filename.
  """
  @spec enable() :: :ok | {:error, any()}
  def enable do
    enable(@level, :file, @trace_filename)
  end

  @doc """
  Stop tracing.
  """
  @spec disable() :: :ok
  def disable do
    :dbg.stop()
  end
{{< / highlight >}}

Funções para ativar e desativar o trace.

{{< highlight elixir "linenos=table" >}}
  @doc """
  Start tracing.

  Start tracing at level and send the results to a filename or
  opennning a tcp/ip port wich listen `dbg:trace_client/2` connections.
  """
  @spec enable(trace_level(), :file | :ip, filename()) :: :ok | {:error, any()}
  def enable(level, :file, filename) when is_binary(filename) do
    opts =
      {to_charlist(filename), :wrap, @trace_opts_suffix, @trace_opts_size,
       @trace_opts_wrap}

    fun_port = :dbg.trace_port(:file, opts)
    do_enable(level, :port, fun_port)
  end

  def enable(level, :ip, port_number) when is_integer(port_number) do
    opts = {port_number, @trace_opts_queue_size}
    fun_port = :dbg.trace_port(:ip, opts)
    do_enable(level, :port, fun_port)
  end

  defp do_enable(level, :port = type, handle_spec)
       when is_function(handle_spec) do
    case :dbg.tracer(type, handle_spec) do
      {:ok, _} ->
        :ok = set_level(level)

      error ->
        error
    end
  end
{{< / highlight >}}

A função `enable/3` pode ativar trace para arquivo ou enviar para alguma porta remota. Neste post vamos explorar a opção de envio para arquivo. A função apenas passa os parâmetros corretos para o módulo `dbg`.

{{< highlight elixir "linenos=table" >}}
  @doc """
  Change the trace level.
  """
  @spec set_level(trace_level(), atom()) :: :ok
  def set_level(level, service \\ @default_service) when is_atom(service) do
    pat = make_pattern(__MODULE__, level, service)
    change_pattern(pat)
  end
{{< / highlight >}}

Podemos mudar o level de trace durante a execução, para isso a função `set_level/2` deve ser utilizada.

{{< highlight elixir "linenos=table" >}}
  @doc """
  Report an event to trace.
  """
  @spec report_event(trace_level(), String.t(), atom(), any()) :: :traced
  def report_event(_level, label, service, _content) when is_binary(label) and is_atom(service) do
    :traced
  end

{{< / highlight >}}

`report_event/4` é a função no qual iremos observar e coletar as chamadas de função.

{{< highlight elixir "linenos=table" >}}
  defp make_pattern(mod, level, service) when is_atom(mod) do
    case level do
      :min ->
        {mod, service, []}

      :max ->
        head = [:"$1", :_, :_, :_]
        body = []
        condition = []
        {mod, service, [{head, condition, body}]}

      detail_level when is_integer(detail_level) ->
        head = [:"$1", :_, :_, :_]
        body = []
        condition = [{:"=<", :"$1", detail_level}]
        {mod, service, [{head, condition, body}]}

      _ ->
        exit({:bad_level, level})
    end
  end

  defp change_pattern({mod, service, pattern})
       when is_atom(mod) and is_atom(service) do
    mfa = {mod, :report_event, 4}

    case pattern do
      [] ->
        with {:ok, _} <- :dbg.ctp(mfa),
             {:ok, _} <- :dbg.p(:all, :clear) do
          :ok
        else
          {:error, _reason} = err ->
            err
        end

      list when is_list(list) ->
        with {:ok, _} <- :dbg.ctp(mfa),
             {:ok, _} <- :dbg.tp(mfa, pattern),
             {:ok, _} <- :dbg.p(:all, [:call, :timestamp]) do
          :ok
        else
          {:error, _reason} = err ->
            err
        end
    end
  end
end
{{< / highlight >}}

`make_pattern/3` e `change_pattern/1` servem para criar um pattern e informar o `dbg` para fazer o trace.

Agora, precisamos apenas intrumentar a aplicação, escolhendo alguns pontos estratégicos:

* processamento de alguma request
* envio de uma response
* interface com algum serviço externo
* ou chamadas por blocos funcionais

Em cada ponto que queremos instrumentar, colocamos chamadas para a função `Trace.report_event/4`:

{{< highlight elixir "hl_lines=5 16" >}}
...
  Trace.report_event(80, "ex_unit context", :swix_service, [a: 1, b: 2, c: 3])
...
{{< / highlight >}}

A função `Trace.report_event/4` apenas retorna um atom. E durante a execução da aplicação, podemos executar no console as seguintes chamadas:

{{< highlight elixir >}}
  Trace.enable(:max, :file, "/tmp/mytrace")
{{< / highlight >}}

Desta forma ativamos o `dbg` para fazer o trace das chamadas da função `Trace.report_event/4` e escrevendo o resultado em um arquivo, no formato `Erlang Terms`.

Para desativar o trace:

{{< highlight elixir >}}
  Trace.disable()
{{< / highlight >}}

## Lendo o resultado do trace

Neste post, vamos utilizar o wireshark para ler o arquivo gerado. Mas existem outras formas de ler o trace. Como por exemplo utilizando [trace_cleint](http://erlang.org/doc/man/dbg.html#trace_client-3).

A escolha do wireshark é uma alternativa bem interessante pois podemos fazer uma análise mais gráfica.

Existe um [plugin do wireshark feito em lua](https://github.com/legoscia/cautious-rotary-phone) no qual vamo utilizar. Para instalar, baixe e instale os arquivos _erlterm.lua_ e _erlang-trace.lua_ no diretório _~/.config/wireshark/plugins_. Abra o wireshark e depois o arquivo com o trace.

Pronto, podemos inspecionar o conteúdo do trace.

## Outras formas de trace

A técnica apresentada envolve instrumentação de código. Entretanto o módulo `dbg` oferece a possibilidade de não precisar instrumentar nada e apenas definir `trace calls`. Existem também wrappers feitos em Elixir e Erlang no qual facilitam o uso do `dbg`.

Referências:

* [Runtime_Tools User's Guide](http://erlang.org/doc/apps/runtime_tools/users_guide.html)
* [rexbug](https://github.com/nietaki/rexbug)
* [redbug](https://github.com/massemanet/redbug)
