# Inference-First Accelerator Architecture: Locality, Interactivity, and AI-Native Hardware–Software Co-Design

## 1. Objective

The central design objective is not maximum theoretical FLOP/s. It is **maximum useful inference work per unit power while satisfying user-level latency constraints**.

For an operating configuration \(x\),

$$
x^{*}\in
\operatorname{Pareto}
\left(
\frac{\mathrm{TPS}(x)}{P(x)},
\;
\mathrm{tok/s/user}(x),
\;
-L_{\mathrm{E2E}}(x)
\right)
$$

where throughput/kW measures infrastructure efficiency, tokens/s/user captures interactivity, and \(L_{\mathrm{E2E}}\) measures completion latency.

This changes the hardware problem fundamentally. Increasing batching can improve aggregate throughput while degrading per-user token rate. Conversely, optimizing exclusively for low latency can leave significant compute capacity underutilized. The architecture is therefore designed around the **throughput–interactivity Pareto frontier**, rather than one isolated peak-performance number.

---

## 2. Architectural Intuition: Minimize Waiting, Not Merely Computation

LLM inference is heterogeneous across execution phases:

$$
\text{Request}
\rightarrow
\underbrace{\text{Prefill}}_{\text{compute intensive}}
\rightarrow
\underbrace{\text{Decode}}_{\text{memory-bandwidth intensive}}
\rightarrow
\text{Response}
$$

Prefill favors arithmetic throughput. Decode repeatedly accesses model state and KV state while producing tokens sequentially, making memory bandwidth and communication latency increasingly dominant.

Consequently,

$$
T_{\mathrm{inference}}
\neq
\frac{\mathrm{FLOPs}}{\mathrm{Peak\ FLOP/s}}
$$

because realized execution also contains

$$
T_{\mathrm{memory}}
+
T_{\mathrm{communication}}
+
T_{\mathrm{synchronization}}
+
T_{\mathrm{idle}}.
$$

The architecture attacks these non-compute terms directly. Model state, including KV cache, can be **explicitly placed and retained locally**, while compute, memory, and networking resources are selected according to the current inference phase.

The governing principle is therefore:

$$
\boxed{\text{Reduce data movement} \rightarrow
\text{reduce waiting} \rightarrow
\text{increase realized utilization}}
$$

rather than simply increasing theoretical arithmetic density.

---

## 3. Locality as an Architectural Primitive

A major design decision is treating **placement** as an explicit part of execution.

Instead of relying entirely on hardware abstractions to make arbitrary tensor placement appear uniform, the programming model exposes:

* local tensors,
* explicit communication,
* predictable synchronization,
* deterministic placement,
* scheduling and coordination.

This allows model weights, activations, intermediate tensors, and KV state to remain close to the compute resources that consume them.

The important hardware/software trade is clear:

$$
\text{more explicit software control}
\quad\Longleftrightarrow\quad
\text{less implicit data movement}.
$$

The architecture therefore shifts part of the complexity traditionally hidden inside a general-purpose accelerator into the compiler, kernels, runtime, and mapping system.

That is a deliberate trade: LLM inference has sufficiently structured communication and tensor graphs that placement can be optimized ahead of execution rather than continuously rediscovered at runtime.

---

## 4. Networking Is Part of the Compute Architecture

The network is not treated as an external scale-out accessory.

Distributed inference requires frequent tensor movement between compute domains. If communication is serialized behind computation,

$$
T_{\mathrm{step}}
=
T_{\mathrm{compute}}
+
T_{\mathrm{communication}},
$$

and additional arithmetic resources cannot recover the lost latency.

The design therefore integrates networking into the execution architecture so that model state can remain within a large connected domain and communication can be coordinated with tensor placement and computation.

Conceptually:

$$
\text{Tensor placement}
\rightarrow
\text{compute placement}
\rightarrow
\text{communication schedule}
\rightarrow
\text{synchronization}
$$

must be solved jointly.

This is especially important for sparse models, tensor parallelism, expert routing, KV movement, and increasingly long agentic execution traces.

---

## 5. Why a Balanced Accelerator Matters

A narrowly decode-optimized device can perform extremely well under memory-bound generation but lose efficiency as workload composition changes.

Conversely, a compute-heavy architecture may dominate prefill while underutilizing execution resources during low-batch decode.

The reported design instead targets a **fungible accelerator** capable of shifting the balance among compute, memory, and networking as inference composition changes.

This matters for agentic systems because workload ratios are not stationary:

$$
\rho =
\frac{\text{prefill work}}
{\text{decode work}}
$$

changes with context length, reasoning length, tool responses, cached context, speculative execution, and repeated agent turns.

A balanced architecture reduces the risk that infrastructure optimized around one fixed \(\rho\) becomes inefficient when the model or serving policy changes.

---

## 6. Agentic Inference Makes Latency Compounding More Important

For a sequential agent performing \(N\) model invocations,

$$
L_{\mathrm{agent}}
\approx
\sum_{i=1}^{N}
\left(
L_{\mathrm{prefill},i}
+
N_{\mathrm{out},i}\cdot TBT_i
+
L_{\mathrm{tool},i}
+
L_{\mathrm{comm},i}
\right).
$$

A 20-ms improvement in an isolated request may appear minor; multiplied across tens or hundreds of dependent inference steps, it becomes architectural.

Therefore **time-between-tokens, end-to-end latency, communication latency, and tokens/user** become system-level agent metrics rather than microbenchmark details.

This is why the reported results emphasize interactive operating points rather than peak batch throughput alone.

---

## 7. Measured Result

Under the disclosed nominal **8K-input / 1K-output, single-token-prediction** benchmark configuration, performance was measured across three public model scales. Power-efficiency comparisons use published package power ratings.

| Model regime          | Peak mixed TPS/kW | E2E latency reduction | Minimum TBT reduction | Throughput at previous-best TBT |
| --------------------- | ----------------: | --------------------: | --------------------: | ------------------------------: |
| ~120B sparse model    |          **1.9×** |              **1.7×** |              **2.7×** |                       **53.7×** |
| ~670B reasoning model |          **1.7×** |              **3.6×** |              **4.1×** |                      **104.3×** |
| ~1T sparse model      |          **1.5×** |              **3.4×** |              **3.8×** |                       **56.1×** |

Across these workloads, the disclosed accelerator is therefore positioned on a better throughput/kW–latency frontier rather than merely achieving a larger absolute throughput number.

The package is rated at **700 W**, while measured sustained accelerator power remained at or below **550 W** for the tested workloads; the published comparisons nevertheless normalize using the 700-W rating.

---

## 8. AI-Native Hardware Development Is the Second Important Result

The second architectural contribution is methodological.

The hardware was intentionally constructed as a predictable programming target. Given local tensors, explicit communication, and predictable synchronization, an AI system can search over:

$$
\mathcal{S}
=
\{
\text{mapping},
\text{placement},
\text{scheduling},
\text{communication},
\text{kernel implementation}
\}.
$$

This converts accelerator programming into a comparatively structured optimization problem.

The same approach was reportedly used during silicon development to shorten implementation, measurement, optimization, and verification loops, contributing to a nine-month path to tapeout.

For three model families not originally targeted by the production plan, model-specific kernels and optimizations reached high performance within approximately two months. For selected attention and mixture-of-experts blocks, AI-generated implementations were reported at **1.5–1.8× the performance of prior human-expert implementations**. This number applies to selected kernels, **not end-to-end model execution**.

The resulting loop is:

$$
\boxed{
\text{Workload}
\rightarrow
\text{AI-generated mapping/kernel}
\rightarrow
\text{hardware measurement}
\rightarrow
\text{verification}
\rightarrow
\text{optimization}
\rightarrow
\text{new implementation}
}
$$

Hardware becomes both **AI-designed and increasingly AI-programmed**.

---

## 9. The Deeper Systems Idea

The important abstraction shift is:

$$
\text{Accelerator}
\neq
\text{matrix engine}
$$

but

$$
\boxed{
\text{Accelerator}
=
\text{compute}
+
\text{memory locality}
+
\text{KV placement}
+
\text{network}
+
\text{compiler}
+
\text{runtime}
+
\text{serving policy}
}
$$

optimized against an application-level objective.

The architecture does not primarily attempt to make individual arithmetic operations dramatically faster. It attempts to ensure that **the expensive arithmetic hardware spends less time waiting for operands, communication, synchronization, or state movement**.

That distinction explains why comparatively moderate peak-compute specifications can coexist with substantial gains in realized interactive inference performance.

---

## 10. Source Boundary

The measurements establish a strong result for the disclosed benchmark operating points, but they do **not** establish universal accelerator superiority.

The published results are concentrated on three model families, an 8K/1K workload, single-token prediction, and package-power normalization. The result page does not provide comprehensive long-context scaling, multi-turn agent traces, facility-level power, full TCO, reliability/yield statistics, numerical error bars, or exhaustive model-quality comparisons.

The public benchmark itself explicitly describes inference performance as a moving throughput–interactivity frontier and acknowledges that benchmark coverage and methodology continue to evolve.

Thus the technically defensible conclusion is narrower:

$$
\boxed{
\textbf{Inference-first co-design around locality and communication can move the}
\\
\textbf{latency–throughput–power Pareto frontier substantially.}
}
$$

The larger research implication is that future inference systems may increasingly optimize **data motion, placement, synchronization, and programmability** as aggressively as arithmetic throughput itself.
