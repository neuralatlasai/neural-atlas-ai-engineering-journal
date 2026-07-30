# The Modern AI Execution System: From HBM Transactions to World-State Mutation


I use four evidence classes throughout:

* **[R] Reported** — explicitly documented by an official project/vendor.
* **[C] Code-verified** — visible in released source, configuration, or implementation artifacts.
* **[D] Derived** — an architectural consequence of reported/c([JAX Documentation][1])tify a stronger statement.

The most important result is that the modern AI stack is **not a stack** in the classical sense. It is a dependency DAG whose nodes own different classes of state and whose edges carry tensors, control decisions, artifacts, RPCs, capabilities, or physical side effects.

A useful abstraction is

[
G=(V,E),
]

with

[
E=
E_{\text{data}}
\cup
E_{\text{execution}}
\cup
E_{\text{control}}
\cup
E_{\text{state}}
\cup
E_{\text{trust}}.
]

The critical question is therefore not *“what layer is vLLM?”* but:

[
\boxed{
\text{Which state does vLLM own, and which decisions can only vLLM make?}
}
]

That question generalizes to every component in the system.

---

## 1. The architecture is a DAG, not a 15-layer cake

[D] The cleanest vendor-neutral decomposition I can defend is:

```text
                         DATA / CONTEXT PLANE
                corpus → indexes → retrieval → context
                              │
                              ▼
APPLICATION ──► EXECUTION HARNESS ──► AGENT RUNTIME
       ▲                  │                 │
       │                  │                 ├──── MCP ───► tools/resources
       │                  │                 └──── A2A ───► remote agent
       │                  │
       │                  ▼
       │             CLIENT SDK
       │                  │
       │                  ▼
       │              MODEL API
       │                  │
       │          ┌──── PROVIDER BOUNDARY ────┐
       │          │                            │
       │          ▼                            │
       │     SERVING PLANE                     │
       │          │                            │
       │          ▼                            │
       │    INFERENCE RUNTIME                  │
       │          │                            │
       │     model + scheduler + KV            │
       │          │                            │
       │          ▼                            │
       │  DISTRIBUTED MODEL EXECUTION          │
       │          │                            │
       │      FRAMEWORK                        │
       │          │                            │
       │      COMPILER                         │
       │          │                            │
       │   KERNELS / LIBRARIES                 │
       │          │                            │
       │   DEVICE RUNTIME + COLLECTIVES        │
       │          │                            │
       └──────── ACCELERATOR / FABRIC ◄────────┘

          CONTROL / SECURITY / OBSERVABILITY /
             ARTIFACT STATE cut across all nodes
```

The provider boundary is deliberately drawn as opaque. For OpenAI, Anthropic, and hosted Gemini, the exact lower path from API request to accelerator execution is not publicly specified end-to-end.

[
\boxed{\text{Hosted-provider lower execution stack: Undisclosed}}
]

That is different from NVIDIA, AMD, PyTorch, JAX, vLLM, SGLang, TensorRT-LLM, MaxText, etc., whose public software can be inspected independently.

### An ownership ledger

| Boundary            | State it must own                                        | Decision that caused it to exist                    |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| Accelerator         | HBM, registers, SRAM/shared memory, execution contexts   | Execute arithmetic/data movement                    |
| Device runtime      | allocations, streams/queues, events, executable launches | Mediate host↔accelerator execution                  |
| Collective runtime  | communicators, rank topology, transfer progress          | Move distributed tensor fragments                   |
| Kernel              | tiles, local buffers, instruction schedule               | Turn operators into efficient physical execution    |
| Compiler            | graph/IR, guards, layouts, schedules, executable cache   | Optimize across operator boundaries                 |
| Tensor framework    | tensors, autograd graph, module/function semantics       | Define numerical program                            |
| Distributed runtime | tensor placement/sharding/process groups                 | Define ownership of distributed state               |
| Training runtime    | optimizer, RNG, data cursor, checkpoints                 | Transform model parameters                          |
| Inference runtime   | request queue, KV blocks, decode scheduler               | Schedule tokens against finite memory/compute       |
| Serving plane       | workers, replicas, routes, health, topology              | Schedule requests across inference runtimes         |
| API                 | remote resource/protocol semantics                       | Stabilize provider/client contract                  |
| Client SDK          | auth, transport, retries, streaming objects              | Materialize API locally                             |
| MCP/A2A             | inter-system protocol state/capabilities                 | Decouple agent from capability/peer implementation  |
| Agent runtime       | trajectory, tools, routing, policy, session              | Turn model outputs into bounded iterative execution |
| Harness             | filesystem/process/browser/network state                 | Give agent real-world execution substrate           |
| Application         | domain state, ACLs, workflow, SLO                        | Decide what successful work means                   |

No single request is required to traverse every row.

---

# 2. Hardware determines which software architecture survives

For accelerator (h), use

[
\mathcal H_h =
(P_{\text{compute}},
M_{\text{HBM}},
BW_{\text{HBM}},
I_{\text{scale-up}},
I_{\text{scale-out}}).
]

Performance is bounded approximately by

[
P_{\text{effective}}
\le
\min
\left(
P_{\text{peak}},
BW_{\text{HBM}},
I_{\text{arith}}
\right).
]

This single inequality explains much of the architecture above it.

[R] Current NVIDIA Blackwell Ultra GB300 systems expose large HBM capacity/bandwidth together with NVLink scale-up and high-bandwidth NIC connectivity; the GB300 NVL72 rack combines 72 Blackwell Ultra GPUs with rack-level NVLink connectivity. AMD MI355X exposes 288 GB HBM3E per accelerator with 8 TB/s stated memory bandwidth and Infinity Fabric links. Google's current generally available TPU7x/Ironwood exposes 192 GiB HBM and 7.38 TB/s HBM bandwidth per chip with 1.2 TB/s bidirectional ICI per chip. Peak-format numbers are defined differently across vendors, so raw advertised FLOP values are not clean apples-to-apples metrics. ([NVIDIA][2])uences matter more.

### Prefill

For sequence length (S), prefill performs large GEMMs over many tokens:

[
X\in \mathbb{R}^{B\times S\times H}.
]

Large (M,N,K) dimensions permit enough reuse that operations frequently move toward the compute side of Roofline.

Therefore prefill tends to benefit disproportionately from:

[
P_{\text{tensor-core}},
\quad
\text{GEMM efficiency},
\quad
\text{attention IO reduction}.
]

### Decode

For autoregressive decoding, each sequence contributes roughly one new token per iteration.

The weights may have to be streamed repeatedly while the effective GEMM dimensions become much thinner. KV history also grows with (S).

Thus

[
I_{\text{decode}}
\ll
I_{\text{prefill}}
]

for many serving regimes, making HBM bandwidth, KV traffic and batching efficiency increasingly dominant.

This is why an inference runtime exists at all: **batching is partly a transformation of arithmetic intensity.**

### Attention

Naïve attention materializes excessive intermediate traffic:

[
QK^\top
\rightarrow
P
\rightarrow
PV.
]

IO-aware attention algorithms instead restructure tiling so that substantially more intermediate state remains in on-chip memory.

The optimization is not primarily:

> “use a faster softmax.”

It is:

[
\boxed{
\text{avoid HBM traffic for intermediates}
}
]

while satisfying numerical and dependency constraints.

### MoE

MoE changes the bottleneck again.

For (E) experts and top-(k) routing,

[
e_i=\operatorname{TopK}
\left(
\operatorname{softmax}(W_r x_i),k
\right).
]

Only (k\ll E) experts compute each token, reducing active expert FLOPs, but expert ownership creates network traffic:

[
x
\rightarrow
\operatorname{dispatch}
\rightarrow
f_{e}(x)
\rightarrow
\operatorname{combine}.
]

The software problem shifts from pure GEMM utilization toward:

[
\text{routing}
+
\text{AllToAll}
+
\text{load balance}
+
\text{expert locality}.
]

A faster accelerator cannot remove expert skew.

---

# 3. Runtime and communication: execution becomes physical

## CUDA, HIP and PJRT are not frameworks

[R] CUDA exposes device allocation, kernel launches, streams, events, graphs and the underlying programming/execution model for NVIDIA GPUs. CUDA Graphs separate construction of an execution graph from repeated launch, reducing host-side launch overhead for suitable stable workloads. ([NVIDIA Docs][3])the analogous C++ GPU programming/runtime surface for AMD systems: device memory management, kernel launches, streams, events, graphs and related execution APIs. HIP intentionally presents a CUDA-like programming model, but this does not make the physical implementations identical. ([Radeon Open Compute Documentation][4])ccelerator software architecture, PJRT is the framework↔accelerator execution API. A framework interacts with devices, buffers and loaded executables through PJRT while backend-specific plugins can remain opaque to the framework. ([OpenXLA Project][5])orch}
\neq
\text{CUDA}
]

because PyTorch defines tensor/autodiff/program semantics; CUDA defines NVIDIA device execution.

Likewise JAX is not the TPU runtime.

---

## Collectives emerge from tensor ownership

[R] NCCL and RCCL implement distributed collective communication for NVIDIA and AMD GPU environments respectively. NCCL exposes collectives including AllReduce, AllGather, ReduceScatter and AllToAll; RCCL provides AMD GPU multi-device/multi-node collective communication over PCIe/xGMI/network paths. ([NVIDIA Docs][6])ot arbitrary primitives added to distributed AI. Each exists because some previous operation partitioned ownership.

### AllReduce

[
y_r
===

\sum_{j=0}^{P-1}x_j,
\qquad
\forall r.
]

Typical cause:

* data-parallel gradients;
* row-parallel partial outputs.

### ReduceScatter

[
{x_r}*{r=0}^{P-1}
\rightarrow
{y_r}*{r=0}^{P-1},
]

where reduction happens but each rank retains only its shard.

Typical cause:

* FSDP gradient ownership;
* sequence-parallel/tensor-parallel transformations.

### AllGather

[
x=
\operatorname{concat}(x_0,\ldots,x_{P-1}).
]

Typical cause:

* materializing FSDP parameter shards;
* reconstructing column-sharded tensor outputs.

### AllToAll

[
x_{r\rightarrow j}
\rightarrow
x_j.
]

Typical cause:

* expert dispatch;
* some context/sequence parallel algorithms.

The communication primitive is downstream of a model-state partitioning choice.

---

# 4. Kernel layer: where tensor algebra becomes machine scheduling

A high-level

[
C=AB,
\qquad
A\in\mathbb R^{M\times K},
\quad
B\in\mathbb R^{K\times N}
]

is not executed as that mathematical statement.

A high-performance kernel resembles

[
(M,N,K)
\rightarrow
(M_b,N_b,K_b)
\rightarrow
\text{global-memory movement}
\rightarrow
\text{shared/local-memory staging}
\rightarrow
\text{register/tensor-core fragments}
\rightarrow
\text{MMA}
\rightarrow
\text{epilogue}.
]

It must simultaneously solve:

[
\max
\frac{\text{useful arithmetic}}
{\max(
T_{\text{memory}},
T_{\text{compute}},
T_{\text{sync}},
T_{\text{launch}}
)}.
]

## NVIDIA kernel ecosystem

[R] CUTLASS currently provides composable primitives and templates for GEMM and related high-performance operations, including current Blackwell low-precision paths. CuTe supplies layout/tensor abstractions underneath modern CUTLASS programming. Current CUTLASS supports FP16/BF16/FP8 and block-scaled formats including NVIDIA NVFP4 and OCP MX families. ([NVIDIA Docs][7])s a vendor-tuned dense-linear-algebra library; cuDNN's current graph API can select engines and perform supported runtime/precompiled fusion across operations such as matmul, convolution and pointwise computations. ([NVIDIA Docs][8])ngine provides transformer-specific mixed-precision execution, including FP8 and, on current Blackwell paths, MXFP8/NVFP4 support together with scaling-state handling and fused operations. ([NVIDIA Docs][9])system

[R] ROCm currently includes rocBLAS/hipBLAS/hipBLASLt, MIOpen, communication libraries and compiler/runtime components. ([GitHub][10]) inference/training operators for attention, GEMM, MoE, normalization, quantization and communications with implementations spanning assembly, Triton and AMD-specific kernel paths. Importantly, a 2026 AITER transition decoupled parts of its implementation from CK-internal primitives, so the simplistic diagram

[
\text{AITER}\rightarrow\text{CK always}
]

is no longer accurate. ([GitHub][11])rnel's standalone repository has been moved/deprecated in favor of integration into the broader ROCm libraries tree. That is a packaging/ownership change; it does not mean the underlying tiled kernel methodology disappeared. ([GitHub][12])oss-vendor kernel compiler/DSL

[C] Triton 3.7, released in May 2026, contains both NVIDIA- and AMD/HIP-specific compiler/backend work, including newer warp/pipeline and scaled-matrix functionality. It therefore should not be modeled as an NVIDIA-only kernel technology. ([GitHub][13])typically lets the programmer specify program-instance/block-level tensor work while the compiler lowers layouts, vectorization, memory operations and hardware instructions.

Thus:

[
\text{Triton}
\neq
\text{PyTorch compiler}
]

although PyTorch Inductor frequently targets Triton.

And:

[
\text{Triton}
\neq
\text{CUTLASS}.
]

Their abstraction and optimization strategies overlap, but their programming and compilation models differ.

## Google Pallas/Mosaic

[R] Pallas is the JAX custom-kernel facility for finer accelerator control than ordinary JAX composition provides. Current GPU paths use Mosaic GPU, while TPU Pallas programs lower through Mosaic/TPU-specific compilation machinery. Pallas remains explicitly lower-level than ordinary JAX tensor programming. ([JAX Documentation][14])scape hatch for the same reason Triton/CuTe/custom CUDA exist elsewhere:

[
\boxed{
\text{general graph compiler}
\not\Rightarrow
\text{globally optimal specialized kernel}
}
]

---

## Low precision: quantization is not necessarily a separate kernel

Suppose a block is represented by

[
X \approx s_X Q_X.
]

An inefficient implementation might materialize

[
\hat X=\operatorname{dequant}(Q_X,s_X)
]

into BF16 before GEMM.

Modern scaled MMA paths can instead consume quantized values and scale metadata inside the mainloop:

[
D
=

(s_A Q_A)(s_B Q_B)+C.
]

[R] CUTLASS's current block-scaled abstractions explicitly model quantized operands together with scale tensors, and hardware-supported MMA paths consume scaling information as part of the matrix operation. ([NVIDIA Docs][15])oxed{
\text{logical dequantization}
\neq
\text{necessarily materialized dequantization}
}
]

Offline weight quantization, runtime activation scaling, fused scaled MMA, higher-precision accumulation and output requantization may occur at different boundaries.

That distinction is essential for FP8/MXFP8/NVFP4 performance analysis.

---

# 5. Compiler architecture: PyTorch and JAX converge, but from opposite directions

## PyTorch: eager-first, capture-and-compile

[R] The contemporary `torch.compile` path uses TorchDynamo for Python-frame/operation capture and TorchInductor as the default compilation backend. Inductor performs graph lowering, scheduling/fusion and backend code generation, including Triton and external/native kernels. Guard failures can trigger specialization/recompilation and eventually eager fallback under configured limits. ([PyTorch Documentation][16]) is

[
\text{Python}
\rightarrow
\text{TorchDynamo}
\rightarrow
\text{FX/ATen}
\rightarrow
\text{AOTAutograd}
\rightarrow
\text{Inductor}
\rightarrow
\begin{cases}
\text{Triton}\
\text{C++}\
\text{cuBLAS/cuDNN}\
\text{native/custom kernels}
\end{cases}
]

with graph breaks giving

[
G=G_1\cup E_1\cup G_2\cup\dots
]

rather than necessarily capturing the whole application.

Current ahead-of-time PyTorch compilation can package tracing, Inductor generation, Triton compilation and autotuning into deployment artifacts. ([PyTorch Documentation][17])piler state is therefore:

[
C_{\text{torch}}
================

(
G,
\Gamma_{\text{guards}},
S_{\text{shape}},
L_{\text{layout}},
K_{\text{compiled}},
M_{\text{plan}}
).
]

Graph breaks, guard churn and shape explosion are real systems failures, not syntax inconveniences.

---

## JAX: staged transformation and compiler-first execution

[R] JAX delegates accelerator compilation/execution to XLA/PJRT. Ahead-of-time/JIT execution passes through JAX program tracing/Jaxpr, StableHLO/HLO and XLA to a target executable loaded and executed through PJRT. ([JAX Documentation][1])[
f_{\text{Python}}
\rightarrow
J_{\text{axpr}}
\rightarrow
\text{StableHLO/HLO}
\rightarrow
\text{XLA}
\rightarrow
E_{\text{target}}
\rightarrow
\text{PJRT}.
]

XLA owns transformations such as:

[
\text{fusion},
\quad
\text{layout},
\quad
\text{buffer assignment},
\quad
\text{SPMD partitioning},
\quad
\text{code generation}.
]

Pallas supplies specialized custom kernels where the normal graph compiler is not the desired execution path.

---

## The actual difference

[D] The useful distinction is not “dynamic PyTorch versus static JAX.”

Both now support substantial compilation, specialization and distributed execution.

The deeper difference is the execution ontology.

PyTorch begins with a valid eager program:

[
P_{\text{eager}}
]

and attempts to extract optimizable regions:

[
P_{\text{eager}}
\rightarrow
{G_i}.
]

JAX transformations operate on staged functional computations:

[
f
\rightarrow
\mathcal T(f)
\rightarrow
\text{compiled executable}.
]

That changes where Python behavior, mutation, shape semantics, sharding and compilation boundaries must be represented.

---

# 6. Frameworks define tensor meaning; they do not own online inference

A tensor framework owns something close to

[
\mathcal F=
(
\text{tensor semantics},
\text{autodiff},
\text{composition},
\text{optimizer abstractions},
\text{device/distribution interfaces}
).
]

PyTorch and JAX occupy this boundary.

They do **not** inherently own:

* request admission;
* KV page eviction;
* sequence scheduling;
* prefix-cache lookup;
* fleet autoscaling;
* API rate limiting;
* tool execution.

Therefore:

[
\boxed{\text{PyTorch}\neq\text{vLLM}}
]

and

[
\boxed{\text{JAX}\neq\text{serving control plane}}.
]

[R] Hugging Face Transformers is better understood as a model-definition/model-artifact interoperability layer over these execution systems: it supplies architectures/configurations/tokenizers/model implementations consumed by different training and inference runtimes. It should not be confused with an inference scheduler. ([GitHub][18])uted execution is a transformation of ownership

Let

[
X\in\mathbb R^{B\times S\times H},
]

and define

* (P_D): data-parallel degree,
* (P_T): tensor-parallel degree,
* (P_P): pipeline degree,
* (P_E): expert-parallel degree,
* (P_C): context-parallel degree.

The critical state representation is

[
T=
(
\text{shape},
\text{dtype},
\text{device},
\text{shard axis},
\text{owner},
\text{lifetime}
).
]

### Typical tensor ledger

| State             |                                Shape | Typical dtype                        | Ownership              | Lifetime        |
| ----------------- | -----------------------------------: | ------------------------------------ | ---------------------- | --------------- |
| token IDs         |                          ([B_D,S_C]) | int32/int64                          | DP/CP rank             | batch           |
| hidden activation |                      ([B_D,S_C,H_T]) | BF16/FP16/FP8-dependent              | DP×TP×CP               | layer/step      |
| weight shard      | subset of ([H_{\rm in},H_{\rm out}]) | BF16/FP8/etc.                        | TP/FSDP rank           | persistent      |
| gradient          |                     parameter-shaped | BF16/FP32-dependent                  | temporary/sharded      | optimizer step  |
| Adam (m,v)        |                     parameter-shaped | often FP32                           | optimizer/FSDP shard   | persistent      |
| Q                 |                  ([B_D,S_C,H_q,d_h]) | mixed precision                      | attention rank         | layer           |
| K,V training      |               ([B_D,S_C,H_{kv},d_h]) | mixed precision                      | CP/TP dependent        | layer           |
| inference KV      |         ([B,S,H_{kv},d_h]) logically | BF16/FP8/etc.                        | KV blocks/worker ranks | request/session |
| router logits     |                    ([N_{\rm tok},E]) | usually higher/stable precision path | router rank            | layer           |
| expert dispatch   |                 ([N_e,H]) per expert | mixed                                | EP expert owner        | MoE layer       |

Exact dtype and sharding are configuration-dependent; the table describes ownership classes, not universal configurations.

---

## Data parallelism

[
X\rightarrow X_r,
\qquad
\theta_r=\theta.
]

Each rank computes

[
g_r=\nabla_\theta\mathcal L(X_r;\theta),
]

then

[
g=
\frac{1}{P_D}
\operatorname{AllReduce}
(g_r).
]

The all-reduce is caused by replicated parameter ownership.

---

## FSDP2

[
\theta
======

\bigsqcup_{r=0}^{P_D-1}\theta_r.
]

[R] Current PyTorch FSDP2 `fully_shard` represents persistent parameter shards as DTensors. Parameters needed by an upcoming computation are all-gathered before forward/backward use and released back to sharded ownership after the relevant phase; gradients are reduce-scattered. ([PyTorch Documentation][19])is

[
\theta_r^{\text{persistent}}
\xrightarrow{\text{AllGather}}
\theta^{\text{ephemeral}}
\xrightarrow{f/b}
g
\xrightarrow{\text{ReduceScatter}}
g_r.
]

[R] DTensor and DeviceMesh provide the underlying tensor-placement/topology abstractions and communication-group organization used by current PyTorch distributed composition, including FSDP2 and tensor-parallel APIs. ([PyTorch Documentation][20])rallelism

Let

[
Y=XW,
\qquad
W\in\mathbb R^{K\times N}.
]

### Column partition

[
W=
[W_0;W_1;\cdots W_{P_T-1}],
]

[
Y_r=XW_r
\in
\mathbb R^{\dots\times N/P_T}.
]

No communication is necessary if the next operator accepts the same partition.

Full (Y) requires

[
Y=
\operatorname{AllGather}(Y_0,\dots,Y_{P_T-1}).
]

### Row partition

[
W=
\begin{bmatrix}
W_0\
\vdots\
W_{P_T-1}
\end{bmatrix},
\qquad
X=[X_0,\ldots,X_{P_T-1}].
]

Then

[
Y_r=X_rW_r
]

is a partial full-width output, requiring

[
Y=\operatorname{AllReduce}_r(Y_r)
]

or a ReduceScatter if downstream ownership remains partitioned.

Current PyTorch tensor-parallel APIs expose column-wise, row-wise and sequence-based placement strategies on DTensor. ([PyTorch Documentation][21])parallelism

[
f
=

f_{P_P-1}
\circ
\dots
\circ
f_1
\circ
f_0.
]

Stage (r) persistently owns

[
\theta^{(r)}
============

{\theta_l:l\in\mathcal L_r}.
]

Forward requires activation transfer

[
h_{r+1}=f_r(h_r),
]

and backward requires gradients in the reverse direction.

Pipeline efficiency is bounded by:

[
T_{\text{stage imbalance}}
+
T_{\text{bubble}}
+
T_{\text{P2P communication}}.
]

Large microbatch counts suppress bubbles but increase activation/queue complexity.

---

## Expert parallelism

[
p_i
===

\operatorname{softmax}(W_rx_i),
]

[
\mathcal E_i
============

\operatorname{TopK}(p_i,k).
]

Tokens are bucketed by expert owner:

[
X_r
\rightarrow
\operatorname{AllToAll}
\rightarrow
{X_e}
\rightarrow
f_e(X_e)
\rightarrow
\operatorname{AllToAll}
\rightarrow
Y_r.
]

The system now inherits router-dependent stochastic load:

[
n_e
===

\sum_i
\mathbf 1[e\in\mathcal E_i].
]

Even with perfect GEMMs,

[
\max_e n_e
\gg
\frac{kN}{E}
]

produces a distributed straggler.

---

## Context parallelism

[R] Megatron Core context parallelism partitions sequence-state ownership while attention still requires access to logically global K/V information; communication strategies exchange the necessary K/V state while keeping non-attention computation largely local. It supports MHA/MQA/GQA configurations. ([NVIDIA Docs][22])ition

[
X=
[X_0,\ldots,X_{P_C-1}],
]

rank (r) owns local queries (Q_r), but exact attention requires

[
Q_rK^\top
]

against globally relevant K/V.

Hence context parallelism converts memory pressure into communication:

[
M_{\text{activation/rank}}
\downarrow
\qquad
BW_{\text{network}}
\uparrow.
]

---

## Megatron, FSDP2 and Pathways occupy different architectural scopes

[R] Megatron Core composes TP, PP, DP, EP and CP together with model-specific training optimizations and distributed optimizer machinery. ([NVIDIA Docs][23])lished architecture is broader: asynchronous distributed dataflow execution, gang scheduling and distributed computation over heterogeneous accelerator resources. That public design is relevant to Google's distributed systems model, but private contemporary production modifications should not be inferred from the published paper. ([arXiv][24])rrently supports compiler-managed sharding, explicit sharding and manually specified SPMD computations through facilities such as `shard_map`; mesh topology is part of distributed execution semantics. ([JAX Documentation][25])ifecycle: the artifact is larger than the checkpoint

Represent a deployable model version as

[
M_v=
(
\theta_v,
A_v,
T_v,
C_v,
Q_v,
D_v,
E_v,
P_v
),
]

where

* (\theta): weights;
* (A): architecture;
* (T): tokenizer/templates;
* (C): execution/runtime configuration;
* (Q): quantization formats/scales/calibration;
* (D): data provenance;
* (E): evaluation evidence;
* (P): provenance/version lineage.

A training checkpoint may additionally require

[
C_{\text{resume}}
=================

(
\theta,
m,
v,
RNG,
\text{scheduler},
\text{data cursor},
\text{parallel topology}
).
]

A `.safetensors` file alone is therefore not a production model artifact.

---

## Current training ecosystems

[R] TorchTitan is currently a PyTorch-native large-model training system combining FSDP2, TP, PP, CP, `torch.compile`, checkpointing, mixed/low precision and fault-tolerance-oriented facilities. ([GitHub][26]) supplies model-scale distributed execution primitives; NeMo builds broader model training/customization workflows above NVIDIA's distributed stack. NeMo RL currently supports post-training algorithms including SFT, DPO and GRPO and can use DTensor/Megatron-based backends with rollout systems such as SGLang. ([GitHub][27])post-training algorithms including SFT, DPO and GRPO over Hugging Face/PyTorch infrastructure; DeepSpeed continues to provide distributed training/inference capabilities including ZeRO and model-parallel machinery. ([GitHub][28])itly separates RL orchestration from execution backends and currently integrates combinations of FSDP/Megatron with inference rollout engines such as vLLM/SGLang; recent rollout architecture has moved toward server-style execution appropriate to multi-turn/tool workloads. ([GitHub][29])xt is a public JAX training stack for large models across TPUs/GPUs and current pre-/post-training workflows. Tunix is Google's JAX post-training library covering SFT/RL-style workflows and integrations including MaxText, Orbax and inference rollout systems. ([GitHub][30])s checkpointable/input-pipeline infrastructure; Orbax owns persistence/checkpointing of JAX state including distributed arrays; Optax owns gradient transformation/optimizer abstractions; Flax supplies neural-network/module abstractions over JAX. ([GitHub][31])erchangeable products.

[
\text{Grain}
\neq
\text{Orbax}
\neq
\text{Optax}
\neq
\text{MaxText}.
]

Their state ownership is different.

---

# 9. Inference is an online scheduling problem

For active requests

[
R_t={r_1,\ldots,r_n},
]

the runtime attempts something closer to

[
\max_{\sigma_t}
\operatorname{TPS}(\sigma_t)
]

subject to

[
TTFT_i\le \tau_i,
]

[
TPOT_i\le\rho_i,
]

[
M_W+M_{KV}+M_{\text{workspace}}
\le M_{\text{HBM}},
]

plus fairness, graph-capture, distributed and prefix-locality constraints.

`forward()` is merely one operation inside this control system.

---

## KV state

For

* (L) transformer layers,
* batch (B),
* sequence (S),
* (H_{KV}) KV heads,
* head dimension (d_h),
* (b) bytes/value,

logical KV size is

[
\boxed{
M_{KV}
======

2LB S H_{KV}d_h b
}.
]

The factor two is K and V.

### GQA

If

[
H_{KV}<H_Q,
]

then

[
M_{KV}\propto H_{KV}
]

falls accordingly.

### MQA

[
H_{KV}=1.
]

KV memory can be dramatically lower, at the cost of a different model architecture/quality-performance tradeoff.

### Quantized KV

[
b\downarrow
]

but the runtime must now manage quantization metadata and compatible attention kernels, with numerical-quality constraints.

### Prefix reuse

Without cache:

[
T_{\text{prefill}}
\propto S_{\text{prefix}}.
]

With reusable prefix KV:

[
T_{\text{compute}}
\downarrow,
]

but the system introduces

[
\text{lookup}
+
\text{KV residency}
+
\text{eviction}
+
\text{routing/locality}.
]

Caching changes computation into state management.

---

## vLLM

[R] Current vLLM includes PagedAttention/KV block management, continuous batching, chunked prefill, prefix caching, speculative decoding, CUDA/HIP graph execution paths, numerous quantization/kernel backends, TP/PP/DP/EP/CP support and experimental prefill/decode disaggregation. ([vLLM][32])eduler treats prompt and generated tokens through a unified token-budget scheduling model. Current V1 also simplified preemption architecture, including removal of the older CPU↔GPU KV swap path. ([vLLM][33])ant conceptual correction:

[
\text{request}
\not\rightarrow
\text{one static batch}
]

but

[
R_t
\xrightarrow{\sigma_t}
B_t
\xrightarrow{\text{one model iteration}}
R_{t+1}.
]

A request can enter, progress, be paused/preempted, complete or disappear while other sequences continue.

[R] vLLM's disaggregated prefill documentation explicitly separates prefill and decode instances so TTFT and inter-token latency can be tuned independently; it does **not** claim that disaggregation inherently increases throughput. KV state is transferred using connector abstractions between the phases. ([vLLM][34])rs:

[
\boxed{
\text{P/D disaggregation}
\neq
\text{free throughput}
}
]

because KV transfer introduces another bandwidth/latency term.

---

## SGLang

[C] Current SGLang exposes online LLM serving machinery including continuous batching, paged attention, RadixAttention/prefix reuse, chunked prefill, speculative decoding, distributed TP/PP/DP/EP execution and prefill/decode disaggregation across supported accelerator ecosystems. ([GitHub][35])refix architecture makes shared-prefix structure an explicit scheduler/cache concern rather than treating every prompt as unrelated.

---

## TensorRT-LLM

[R] Current TensorRT-LLM is not merely a static TensorRT engine. Its current PyTorch backend has a top-level `LLM`, model engine, decoder, scheduler and resource managers including KV-cache management. The scheduler determines resource allocation and which requests run on each inference step. ([NVIDIA GitHub][36])[
\text{optimized model execution}
+
\text{KV/resource management}
+
\text{iteration scheduling}.
]

That overlaps substantially with responsibilities attributed to vLLM/SGLang.

---

## MIGraphX

[R] MIGraphX is currently an AMD graph compiler **and inference engine**, capable of compiling trained model graphs for AMD accelerators and integrating with PyTorch through Torch-MIGraphX. It is not AMD's equivalent of Dynamo's fleet-wide LLM serving control plane. ([Radeon Open Compute Documentation][37])ould cross architectural boundaries.

---

# 10. Serving starts where token scheduling stops

An inference engine solves:

[
\boxed{\text{Which tokens execute on this model runtime now?}}
]

A serving system additionally solves:

[
\boxed{\text{Which runtime/worker/replica should own this request?}}
]

Let worker fleet

[
W={w_1,\ldots,w_m}.
]

Serving determines

[
\phi(r_i)
\rightarrow
w_j
]

under:

[
\text{capacity},
\text{health},
\text{topology},
\text{model version},
\text{queue load},
\text{KV locality},
\text{SLO},
\text{policy}.
]

---

## NVIDIA Dynamo

[R] Current Dynamo documents separate Request, Control and Storage/Events planes. Its serving architecture can route requests across prefill/decode workers, track KV-related state/events and use NIXL-based data movement; current routers expose KV-aware routing functionality. Backends include systems such as vLLM, SGLang and TensorRT-LLM. ([NVIDIA Docs][38])nction:

[
\text{vLLM scheduler}
:
R_t\rightarrow B_t
]

versus

[
\text{Dynamo router/planner}
:
r_i\rightarrow w_j.
]

They can cooperate without being the same subsystem.

---

## NIM

[R] Current NVIDIA NIM LLM documentation describes the contemporary container as a production orchestration/package around a vLLM backend. A thin proxy provides capabilities such as readiness/liveness, routing, TLS/CORS and metrics while vLLM handles model/GPU inference. ([docs.nvidia.com][39])
\boxed{
\text{NIM}\neq\text{vLLM replacement kernel/runtime}
}
]

in this current architecture.

NIM is predominantly a **validated packaging/deployment/production-serving boundary**.

---

## Ray Serve and KServe

[R] Ray Serve LLM currently adds distributed serving, placement, replica management, horizontal scaling, OpenAI-compatible ingress and engine integration above LLM runtimes. ([Ray][40])pose Kubernetes-native model-serving lifecycle, routing and autoscaling, including autoscaling from inference-engine metrics such as waiting requests or KV utilization through integrations such as KEDA. ([KServe][41]) therefore closer to

[
\text{fleet lifecycle + traffic control}
]

than to an attention kernel.

---

## Disaggregated prefill/decode

Consider

[
r_i
\rightarrow
P_j
\rightarrow
KV_i
\rightarrow
D_k.
]

The ownership transition is the hard part.

During prefill,

[
P_j:\quad
x_i\mapsto KV_i.
]

At handoff, either:

1. (KV_i) moves directly (P_j\rightarrow D_k);
2. it moves through a shared/remote KV tier;
3. metadata points (D_k) to reusable storage/fabric state.

[D] Router state therefore needs some subset of

[
(
\text{model},
\text{prefix hash},
\text{request length},
\text{worker load},
\text{KV locality},
\text{topology},
\text{health},
\text{transfer cost},
\text{SLO}
).
]

[D] If the prefill worker dies before durable handoff, recomputation is generally required.

[D] If a decode worker dies while its KV is solely volatile local state, continuation requires KV reconstruction or another durable/replicated source.

A framework advertising P/D separation does **not** imply transparent mid-generation failover.

That property requires explicit durable state/failure semantics.

---

# 11. API boundary: semantics intentionally hide execution

A hosted API defines

[
\mathcal A:
\text{request object}
\rightarrow
\text{remote semantic operation}.
]

It intentionally does not expose

[
\text{kernel}
,\quad
\text{KV allocator}
,\quad
\text{replica placement}
,\quad
\text{TP topology}
,\quad
\text{accelerator}.
]

That opacity is part of the abstraction.

---

## OpenAI

[R] The current OpenAI Python SDK identifies Responses as the primary API while continuing to support Chat Completions; streaming is exposed through SSE and Realtime supports persistent low-latency transports including WebSocket/WebRTC depending the integration. ([GitHub][42]) carry higher-level conversation/previous-response semantics and exposes built-in/function/MCP-style tool surfaces, while Realtime defines a lower-latency multimodal interaction contract. ([OpenAI Platform][43])temporary internal path

[
\text{Responses request}
\rightarrow
\text{scheduler}
\rightarrow
\text{model runtime}
\rightarrow
\text{kernel}
\rightarrow
\text{accelerator}
]

is not publicly specified in sufficient detail.

**Undisclosed.**

---

## Anthropic

[R] Anthropic's Messages API exposes model interactions and structured tool-use semantics. In ordinary client-side tool use, Claude emits a tool request, the client/application executes the tool, and a tool result is supplied back; Anthropic also exposes server-side tool classes for provider-executed capabilities. ([Claude Platform][44])lf remains fundamentally client-history-driven rather than implying an agent execution environment. ([Claude Platform][44])omplete lower training/serving/runtime/hardware composition behind the API is **Undisclosed**.

---

## Google

[R] Google currently recommends the newer Interactions API for new Gemini application work while `generateContent` remains supported. Interactions can represent state through previous-interaction references, surface agent/model execution information and support background execution for supported workflows. ([Google AI for Developers][45])tified to infer:

[
\text{Gemini API}
\Rightarrow
\text{vLLM-TPU}
]

or

[
\text{Gemini API}
\Rightarrow
\text{MaxText serving stack}.
]

Those public projects establish available Google technologies, **not** the exact hosted Gemini production implementation.

---

# 12. Client SDKs are transport clients, not agents

The dependency direction during an ordinary call is

[
\text{application}
\rightarrow
\text{SDK}
\rightarrow
\text{remote API}.
]

The SDK may own

[
S_{\text{SDK}}
==============

(
\text{credentials},
\text{connection pool},
\text{timeouts},
\text{retry policy},
\text{serialization},
\text{stream parser}
).
]

It does not normally own the semantic task trajectory.

[R] OpenAI's current Python client supports sync/async clients, HTTP transport, typed request/response models, streaming and retry/timeout behavior. Default retry policy includes limited retries for categories including connection failures, selected timeout/conflict/rate-limit responses and server failures. ([GitHub][42])ent `google-genai` SDK similarly provides synchronous/asynchronous transport, model/API objects and support for current Interactions functionality. Custom function calls still require the application to execute the declared function and return results unless using a separately managed execution facility. ([GitHub][46])fficial SDK supplies typed/client access to Messages and related API capabilities rather than becoming the execution environment merely because tool-call objects appear in responses. ([GitHub][47]){
\text{client SDK}
\neq
\text{agent runtime}
}
]

The boundary becomes operationally important under overload. Client retries can multiply server traffic:

[
\lambda_{\text{effective}}
==========================

\lambda_{\text{logical}}
(1+\mathbb E[N_{\text{retry}}]).
]

A server near saturation can therefore be pushed further into saturation by badly bounded clients.

---

# 13. MCP and A2A solve different interoperability problems

This part changed materially this week.

## MCP as of July 28, 2026

[R] The stable MCP specification released July 28, 2026 changed the core protocol to be stateless at the protocol-session level: the previous initialization handshake and protocol session identifier were removed, and protocol version/capability metadata became request-level information. Long-running Tasks are now an official extension, as is **Skills over MCP**. ([github.com][48])

The current relationship is closer to

[
\text{host/client}
\leftrightarrow
\text{MCP server capability}.
]

[R] Core server-side capability classes include tools, resources and prompts; extensions add facilities including Tasks and Skills over MCP. ([Model Context Protocol][49])architectures containing

[
\text{MCP protocol session}
\rightarrow
\text{persistent hidden session state}
]

should be revised.

Cross-call state can still exist, but it belongs in application/server state exposed through explicit identifiers/handles rather than implicit protocol-session identity.

The trust boundary remains serious:

[
\text{tool description}
\neq
\text{authority}.
]

An MCP server can advertise a callable action, but the host must independently determine whether a principal may invoke it.

---

## A2A

[R] Current A2A 1.x represents remote-agent interoperability through Agent Cards, Tasks, Messages and Artifacts. Tasks have lifecycle states including submitted, working, completed, failed, canceled and input-required-style transitions; streaming can deliver task status/artifact updates. Agent Cards advertise capabilities/interfaces and associated security schemes. ([a2a-protocol.org][50])
[
\text{Agent}_A
\xrightarrow{\text{A2A task}}
\text{Agent}_B
]

without requiring (A) to know (B)'s internal model, tools, framework or reasoning architecture.

Contrast:

[
\text{Agent}
\xrightarrow{\text{MCP}}
\text{capability/tool/context server}.
]

Therefore:

[
\boxed{MCP\neq A2A}
]

A remote A2A agent may itself consume twenty MCP servers.

That composition is natural, not redundant.

---

# 14. Agent runtime: the model proposes; the runtime authorizes and executes

Let

[
S_t=
(C_t,M_t,H_t,T_t,E_t,P_t),
]

where, for example,

* (C_t): assembled context;
* (M_t): memory/session;
* (H_t): interaction trajectory;
* (T_t): tool registry;
* (E_t): execution/environment observation;
* (P_t): policy.

The model proposes

[
a_t\sim\pi_\theta(a\mid S_t).
]

But execution should be

[
\tilde a_t
==========

\operatorname{Policy}
(
u,
a_t,
S_t
).
]

Only then:

[
o_t=\mathcal E(\tilde a_t),
]

[
S_{t+1}=U(S_t,\tilde a_t,o_t).
]

This gives the principal-agent boundary:

[
\boxed{
\text{model intent}
\neq
\text{execution authority}
}
]

---

## OpenAI Agents SDK

[R] Current OpenAI Agents SDK centers on agents, tools, handoffs, guardrails and tracing; its runner repeatedly invokes a model, executes tool calls/handoffs, updates state and stops on final output or configured termination conditions. Responses is the default underlying model API path. ([OpenAI GitHub][51])ide client-side conversation-history state, while tracing emits spans for model generations, tools, guardrails and handoffs. ([OpenAI GitHub][52])uch more than `openai.AsyncOpenAI`.

---

## Google ADK

[R] Google ADK 2.x is a code-first agent framework supporting agent graphs, multi-agent composition, tools including MCP/OpenAPI integrations, sessions/state/events, memory, artifacts, evaluation/observability and deployment-oriented workflows. ADK 2 introduced richer graph execution including non-linear/cyclic workflows. ([GitHub][53]) role is

[
\text{agent program/runtime framework},
]

not

[
\text{TPU runtime},
]

and not

[
\text{desktop execution environment}.
]

---

## Claude Agent SDK

[R/C] Claude Agent SDK exposes programmatic agent execution based on Claude Code; the current Python package drives the Claude Code execution environment rather than merely wrapping the Messages API. ([GitHub][54])stantially different from the ordinary Anthropic client SDK.

---

## Claude Managed Agents

[R] Anthropic now also exposes Managed Agents as a beta managed harness/runtime surface. Current documentation describes agents, environments and persistent sessions with conversation/filesystem state, with Anthropic-managed cloud sandbox or self-hosted execution choices. ([Claude Platform][55])n model distinguishes provider/server-executed capabilities, MCP actions and application-executed custom tools; self-hosted execution can keep process/filesystem/network actions inside customer infrastructure while orchestration remains managed. ([Claude Platform][56])rrent Anthropic ecosystem has **two distinct architectural paths**:

[
\text{custom application}
\rightarrow
\text{Messages}
]

versus

[
\text{application}
\rightarrow
\text{Managed Agent}.
]

They should not be forced into a single serial chain.

---

## NeMo Agent Toolkit

[R] Current NeMo Agent Toolkit focuses on agent workflow integration, instrumentation, evaluation/optimization and observability across frameworks, including MCP-related workflow surfaces and integrations with NVIDIA serving/runtime infrastructure. ([GitHub][57])laps the agent-runtime/observability boundary rather than the CUDA/model-training boundary.

---

## AMD GAIA

[C] GAIA is AMD's open-source local agent framework, with current implementation exposing agent loops, tools/plugin systems and MCP integration, targeted particularly at local AMD execution. Current releases also include approval/guardrail handling around potentially sensitive shell/file actions. ([AMD Developer Portal][58])n upper-stack agent runtime/harness project, not part of ROCm itself.

---

# 15. Execution harness: where reasoning acquires side effects

Let

[
E_t=
(
F_t,
R_t,
P_t,
B_t,
N_t,
I_t,
C_t
)
]

represent:

* filesystem (F_t);
* repository/workspace (R_t);
* process/shell state (P_t);
* browser/computer surface (B_t);
* network (N_t);
* identity/credentials (I_t);
* constraints/sandbox (C_t).

The harness executes:

[
\text{observe}
\rightarrow
\text{reason}
\rightarrow
\text{edit}
\rightarrow
\text{execute}
\rightarrow
\text{test}
\rightarrow
\text{inspect}
\rightarrow
\text{repair}.
]

This loop is qualitatively different from an agent SDK whose tools may simply be Python functions.

---

## Codex

[C/R] OpenAI's public Codex tooling exposes a coding-agent execution environment capable of operating against a repository/workspace and executing development tasks; OpenAI's public harness-engineering work separately emphasizes repositories, tests, environment and guardrails as core components of successful coding-agent systems. ([GitHub][59])hony reference architecture moves one level further outward: work items and project state form a control plane that dispatches coding-agent execution through Codex App Server. ([OpenAI][60])model}
<
\text{agent loop}
<
\text{coding harness}
<
\text{work orchestration}.
]

---

## Claude Code

[R] Claude Code currently provides shell/filesystem/web/MCP execution with a permission system and sandboxing. Permission rules are evaluated through deny/ask/allow classes; Bash sandboxing constrains filesystem and network access using OS-level primitives, while tool-specific permission systems still apply outside the Bash process tree. ([Claude][61])ironment state is what makes Claude Code a harness rather than merely an Anthropic agent library.

---

## Antigravity

A major 2026 correction is necessary.

[R] Google introduced **Antigravity 2.0 in May 2026 as a standalone desktop agent application, explicitly separate from the earlier Antigravity IDE**. It preserves multi-agent/Agent Manager-style execution while no longer being merely an IDE feature. Current Antigravity tooling includes workspace execution surfaces and agent management capabilities. ([Google Antigravity][62])oxed{
\text{Google ADK}\neq\text{Antigravity}
}
]

ADK answers:

> How do I construct and orchestrate an agent program?

Antigravity answers much closer to:

> In which user-facing execution environment do autonomous coding/task agents act against real workspaces and tools?

One may use common Google model/agent services without one being a lower implementation layer of the other.

---

# 16. Application is where correctness becomes domain-specific

Define

[
A=
(
D,W,P,UI,ACL,SLO,E
).
]

A production research agent and a coding agent may share:

* the same model;
* the same Responses/Messages/Gemini endpoint;
* the same MCP protocol;
* the same agent runtime.

Their applications remain different because their state machines differ.

### Coding system

[
\text{issue}
\rightarrow
\text{repo state}
\rightarrow
\text{patch}
\rightarrow
\text{test}
\rightarrow
\text{review}.
]

### Enterprise RAG

[
\text{principal}
\rightarrow
\text{ACL-filtered retrieval}
\rightarrow
\text{answer}
\rightarrow
\text{citation/evidence validation}.
]

### Autonomous operations

[
\text{incident}
\rightarrow
\text{diagnosis}
\rightarrow
\text{proposed mutation}
\rightarrow
\text{approval}
\rightarrow
\text{execution}
\rightarrow
\text{rollback check}.
]

The model cannot own the business invariant because it does not own authoritative domain state.

---

# 17. The orthogonal planes are more important than another vertical layer

## Data / corpus / context plane

A production knowledge system looks closer to

[
D_{\rm raw}
\rightarrow
D_{\rm canonical}
\rightarrow
D_{\rm versioned}
\rightarrow
\left{
I_{\rm lexical},
I_{\rm vector},
G_{\rm knowledge}
\right}
\rightarrow
R_t
\rightarrow
C_t.
]

Ownership matters:

[
D_{\rm versioned}
\neq
I_{\rm vector}
\neq
C_t
\neq
KV_t.
]

They are four different state classes.

* versioned corpus: durable source material;
* vector/index state: retrieval acceleration structure;
* runtime context (C_t): selected semantic input;
* KV: transient numerical representation of a particular model execution.

Calling all four “memory” destroys useful systems boundaries.

---

## Control plane

Desired state:

[
S^\star.
]

Observed state:

[
S_t.
]

Reconciliation computes

[
\Delta_t
========

S^\star-S_t,
]

then

[
a_t=\pi_{\rm control}(\Delta_t).
]

Examples:

* Kubernetes decides replica placement;
* Dynamo decides serving topology/routing;
* vLLM decides token execution;
* an agent runtime decides next semantic action.

Four schedulers may exist simultaneously.

A major source of system bugs is assuming there is “the scheduler.”

---

## Observability

At serving level:

[
{
QPS,
TTFT,
TPOT,
ITL,
E2E,
TPS,
T_{\rm queue},
M_{KV}
}.
]

A better latency decomposition is

[
T_{\rm E2E}
===========

T_{\rm client}
+
T_{\rm network}
+
T_{\rm admission}
+
T_{\rm queue}
+
T_{\rm tokenize}
+
T_{\rm prefill}
+
T_{\rm decode}
+
T_{\rm tool}
+
T_{\rm verification}.
]

Throughput without (TTFT/TPOT) is insufficient because increasing batching may raise TPS while destroying interactive latency.

Agent observability requires trajectories:

[
\tau=
(S_0,a_0,o_0,\ldots,S_T).
]

Metrics should include:

[
\begin{aligned}
&\text{task success},\
&\text{tool-selection accuracy},\
&\text{tool execution success},\
&|\tau|,\
&N_{\rm model},\
&N_{\rm tokens},\
&N_{\rm retries},\
&\text{latency},\
&\text{cost},\
&\text{unsafe/denied actions},\
&\text{rollback rate}.
\end{aligned}
]

A model call can succeed while the task fails.

---

# 18. Security/trust: the tool schema is not an authorization system

The secure causal path is

[
\text{principal}
\rightarrow
\text{identity}
\rightarrow
\operatorname{AuthN}
\rightarrow
\operatorname{AuthZ}
\rightarrow
\text{capability}
\rightarrow
\text{execution}.
]

For proposed model action (a_t):

[
\operatorname{AuthZ}(u,a_t,r,S_t)
\rightarrow
{
\text{allow},
\text{deny},
\text{approval}
}.
]

A robust agent must treat:

* retrieved text;
* web pages;
* tool descriptions;
* MCP resources;
* A2A messages;
* repository files

as **data from different trust domains**, not as equivalent instructions.

The dangerous transformation is

[
\text{untrusted bytes}
\rightarrow
\text{model instruction}
\rightarrow
\text{privileged action}.
]

Prompt injection becomes a systems vulnerability when the second arrow has authority.

The fix is not purely “better prompting.”

It requires:

[
\text{capability scope}
+
\text{least privilege}
+
\text{sandbox}
+
\text{policy}
+
\text{approval for high-risk transitions}
+
\text{audit}.
]

A human approval button is also not a proof of safety. The reviewer needs enough provenance and diff/state information to understand the mutation being authorized.

---

# 19. Artifact/state plane

Represent durable state as

[
A_v=
(
id,
version,
owner,
provenance,
timestamp,
content,
policy
).
]

The same abstraction covers:

* datasets;
* checkpoints;
* optimizer shards;
* quantized deployments;
* tokenizer versions;
* deployment manifests;
* conversation sessions;
* durable memories;
* evaluation results;
* traces;
* code patches;
* tool outputs.

KV state is unusual because it is usually:

[
\text{large}
+
\text{high-churn}
+
\text{latency-sensitive}
+
\text{weakly durable}.
]

That is exactly why KV is becoming a first-class distributed systems object rather than an invisible tensor.

---

# 20. Three causal execution traces

## Path A — distributed training

Let local batch after DP partitioning be

[
X_r
\in
\mathbb N^{B_D\times S}.
]

### 1. Corpus → sample

[
D_{\rm raw}
\rightarrow
D_{\rm canonical}
\rightarrow
D_{\rm tokenized}.
]

Persistent state: storage.

### 2. Sample → host batch

A data loader produces

[
x^{CPU}_r
\in
\mathbb N^{B_D\times S}.
]

State includes shuffling/RNG/cursor needed for reproducibility.

### 3. Host → accelerator

CUDA/HIP/PJRT transfers or infeed create

[
x^{dev}_r.
]

Ownership becomes device/rank-specific.

### 4. Embedding

[
H_0
===

E[x]
\in
\mathbb R^{B_D\times S_C\times H_T}.
]

Parameter shards may first require AllGather/TP-specific computation.

### 5. Transformer layer

For layer (l),

[
Q_l=H_lW_l^Q,
\qquad
K_l=H_lW_l^K,
\qquad
V_l=H_lW_l^V.
]

Kernels become CUDA/HIP/TPU executables; TP/CP/EP collectives occur according to ownership.

### 6. Logits

[
Z=H_LW_{\rm vocab}.
]

Vocabulary may itself be TP-sharded.

### 7. Loss

[
\mathcal L
==========

-\sum_t
\log
p_\theta(x_{t+1}\mid x_{\le t}).
]

### 8. Backward

[
g_\theta
========

\nabla_\theta \mathcal L.
]

Activation checkpointing can replace stored activations with recomputation:

[
M_{\rm activation}\downarrow,
\qquad
FLOPs\uparrow.
]

### 9. Gradient ownership restoration

DP:

[
g\leftarrow\operatorname{AllReduce}(g_r).
]

FSDP:

[
g_r
\leftarrow
\operatorname{ReduceScatter}(g).
]

### 10. Update

For Adam-like optimizer:

[
m_{t+1}
=======

\beta_1m_t+(1-\beta_1)g_t,
]

[
v_{t+1}
=======

\beta_2v_t+(1-\beta_2)g_t^2,
]

[
\theta_{t+1}
============

## \theta_t

\eta
\frac{\hat m_{t+1}}
{\sqrt{\hat v_{t+1}}+\epsilon}.
]

### 11. Checkpoint

Persist:

[
(
\theta_{t+1},
m_{t+1},
v_{t+1},
RNG,
\text{data cursor},
\text{scheduler},
\text{metadata}
).
]

[R] Orbax and current PyTorch distributed-checkpointing ecosystems explicitly support distributed/sharded persistence patterns needed by this class of workflow. ([orbax.readthedocs.io][63])on:

[
\text{rank failure}
\rightarrow
\text{collective failure}
\rightarrow
\text{step incomplete}
\rightarrow
\text{job recovery/checkpoint rollback}.
]

A numerical bug may be worse:

[
\text{silent kernel error}
\rightarrow
\theta_{t+n}\text{ corrupted}
]

without infrastructure failure.

---

# 21. Path B — LLM inference

### 1. HTTP bytes

[
b_{\rm HTTP}
\rightarrow
r_i.
]

Gateway/API owns authentication, request format and rate-limit semantics.

### 2. Admission

[
r_i
\xrightarrow{
\text{quota/SLO/capacity}
}
q.
]

Rejected work should fail **before** expensive model execution where possible.

### 3. Routing

Serving plane chooses

[
w_j=\phi(r_i).
]

### 4. Tokenization

[
\text{UTF-8 bytes}
\rightarrow
x_i
===

[t_1,\ldots,t_S].
]

### 5. Runtime scheduling

[
R_t
\rightarrow
B_t
]

under token/KV constraints.

### 6. KV allocation

Logical blocks:

[
\mathcal B_i
============

{b_1,\ldots,b_m}
]

map sequence positions to physical KV locations.

### 7. Prefill

[
x_{1:S}
\rightarrow
H
\rightarrow
(KV)_{1:S}.
]

This phase executes broad token-parallel GEMMs/attention.

### 8. First token

[
z_S
\rightarrow
p(t_{S+1})
\rightarrow
t_{S+1}.
]

The client observes

[
TTFT.
]

### 9. Decode iteration

At iteration (j):

[
B_j=
{r_{i_1},\ldots,r_{i_m}},
]

[
KV_i^{(j+1)}
============

KV_i^{(j)}
\oplus
(k_{j+1},v_{j+1}).
]

Continuous batching allows membership in (B_j) to change across iterations.

### 10. Streaming

[
t_j
\rightarrow
\operatorname{detokenize}
\rightarrow
\text{SSE/WS bytes}.
]

### 11. Completion/cancellation

[
KV_i
\rightarrow
\varnothing
]

or recyclable cache state.

Request cancellation therefore needs to propagate from transport → serving → scheduler → KV owner. Otherwise the server continues wasting generation compute after the consumer disappeared.

---

# 22. Path C — agentic task

Suppose the user asks:

> Fix the failing repository test and open a patch.

### 1. Principal + application state

[
(u,D,W,ACL)
\rightarrow
\text{task}.
]

### 2. Context construction

[
C_0
===

f(
\text{task},
\text{repo},
\text{retrieval},
\text{memory},
\text{policy}
).
]

### 3. Model call

[
a_0
\sim
\pi_\theta(a\mid C_0).
]

The model proposes:

[
a_0=
\texttt{read(test_failure.log)}.
]

### 4. Policy

[
\operatorname{AuthZ}(u,a_0,r,S_0)
=================================

\text{allow}.
]

### 5. Tool invocation

Could be:

[
\text{native harness tool}
]

or

[
\text{MCP request}
]

or

[
\text{ordinary API}.
]

### 6. Environment observation

[
o_0=\text{file contents}.
]

### 7. Next action

[
a_1=\text{edit source}.
]

Mutation:

[
F_1
===

\Delta(F_0,a_1).
]

### 8. Execute tests

[
o_1=
\operatorname{shell}(\texttt{pytest ...}).
]

### 9. Verify

[
V(F_1,o_1)
\rightarrow
{\text{accept},\text{repair}}.
]

### 10. Repair loop

[
S_{t+1}
=======

U(S_t,a_t,o_t).
]

### 11. Commit/result

The application publishes an artifact only after satisfying domain policy.

Every transition has a distinct failure:

[
\begin{array}{ll}
\text{retrieval}&\rightarrow\text{prompt injection/staleness}\
\text{model}&\rightarrow\text{invalid action}\
\text{AuthZ}&\rightarrow\text{deny/approval timeout}\
\text{tool}&\rightarrow\text{timeout/partial mutation}\
\text{environment}&\rightarrow\text{divergence}\
\text{verification}&\rightarrow\text{false acceptance}\
\text{loop}&\rightarrow\text{non-termination}.
\end{array}
]

No single model benchmark measures this system.

---

# 23. NVIDIA: reconstructed vertically

The public NVIDIA ecosystem can be represented as a DAG roughly like:

[
\boxed{
\text{Blackwell/Grace}
}
]

[
\downarrow
]

[
\text{CUDA}
+
\text{NCCL}
]

[
\downarrow
]

[
{
\text{cuBLAS},
\text{cuDNN},
\text{CUTLASS/CuTe},
\text{Transformer Engine},
\text{Triton/custom CUDA}
}
]

[
\downarrow
]

[
\text{PyTorch/JAX/etc.}
]

[
\downarrow
]

[
{
\text{Megatron Core},
\text{NeMo},
\text{NeMo RL},
\text{third-party training stacks}
}
]

and independently for online inference:

[
{
\text{vLLM},
\text{SGLang},
\text{TensorRT-LLM}
}
]

[
\downarrow
]

[
{
\text{Dynamo},
\text{NIM},
\text{Kubernetes/Ray/...}
}
]

[
\downarrow
]

[
\text{agent/application systems}.
]

[R] CUDA/NCCL, CUTLASS/CuTe, Transformer Engine, Megatron/NeMo, TensorRT-LLM, Dynamo and NIM provide NVIDIA-owned vertical coverage from the device runtime into fleet serving. ([NVIDIA Docs][3])es not own the whole path. PyTorch, vLLM, SGLang and the broader Kubernetes ecosystem remain distinct projects/dependencies.

The key architectural strength is **vertical optimization opportunity**:

[
\text{hardware capability}
\rightarrow
\text{kernel}
\rightarrow
\text{framework integration}
\rightarrow
\text{runtime}
\rightarrow
\text{serving}.
]

The cost is that the most aggressive paths can become closely tied to NVIDIA-specific hardware features.

---

# 24. AMD: reconstructed vertically

Public AMD architecture is:

[
\text{Instinct/CDNA}
]

[
\downarrow
]

[
\text{ROCm/HIP}
+
\text{RCCL}
]

[
\downarrow
]

[
{
\text{rocBLAS},
\text{hipBLASLt},
\text{MIOpen},
\text{AITER},
\text{CK/ROCm libraries},
\text{Triton},
\text{assembly}
}
]

[
\downarrow
]

[
\text{PyTorch}
]

[
\downarrow
]

[
{
\text{FSDP/Megatron/DeepSpeed/...}
}
]

[
\downarrow
]

[
{
\text{vLLM},
\text{SGLang},
\text{MIGraphX}
}.
]

[R/C] AITER deliberately integrates with upstream inference runtimes including vLLM/SGLang rather than requiring an AMD-exclusive inference stack. ROCm supplies the lower execution ecosystem, while MIGraphX provides an alternative graph compilation/inference path. ([GitHub][11])VIDIA's public portfolio, AMD currently depends more heavily on upstream/shared PyTorch, Triton, vLLM and SGLang ecosystems at the upper inference/serving layers.

That is not automatically a weakness. It can reduce API/ecosystem fragmentation.

The practical question becomes whether the required model/kernel path is mature on ROCm:

[
\text{model support}
+
\text{kernel coverage}
+
\text{precision path}
+
\text{collective behavior}
]

rather than simply whether HIP can compile the code.

GAIA sits much higher:

[
\text{ROCm}
\not\rightarrow
\text{GAIA directly}.
]

It consumes the resulting model/runtime ecosystem as an agent system. ([GitHub][64]): two public stacks must not be conflated

For public JAX/TPU model development:

[
\boxed{\text{TPU}}
]

[
\downarrow
]

[
\text{PJRT/runtime}
]

[
\uparrow
]

[
\text{XLA}
]

[
\uparrow
]

[
\text{JAX}
]

with specialized path

[
\text{JAX}
\rightarrow
\text{Pallas}
\rightarrow
\text{Mosaic}
\rightarrow
\text{TPU/GPU executable}.
]

Then distributed/model-lifecycle systems include:

[
{
\text{JAX sharding},
\text{Pathways},
\text{Grain},
\text{Orbax}
}
]

feeding

[
{
\text{MaxText},
\text{Tunix}
}.
]

[R] These components and roles are publicly documented. ([JAX Documentation][1])ference, a separate vLLM project now exists:

[
\text{vLLM TPU inference}
]

with current JAX and PyTorch support. ([GitHub][65]) must be drawn separately:

[
\text{application}
\rightarrow
\text{google-genai}
\rightarrow
\text{Gemini/Interactions API}
\rightarrow
\boxed{\text{Google provider boundary}}
]

[
\downarrow
]

[
\boxed{\text{exact production execution stack: Undisclosed}}.
]

Then at the upper application side:

[
\text{ADK}
==========

\text{agent framework/runtime}
]

and

[
\text{Antigravity}
==================

\text{execution/product harness}.
]

The tempting single chain

[
\text{TPU}
\rightarrow
\text{MaxText}
\rightarrow
\text{vLLM-TPU}
\rightarrow
\text{Gemini API}
\rightarrow
\text{ADK}
\rightarrow
\text{Antigravity}
]

is **not supported by public evidence**.

It conflates a public open model stack, hosted provider implementation, agent SDK and user-facing execution environment.

---

# 26. OpenAI: stop at the provider boundary

A defensible public execution DAG is:

[
\text{Application}
]

[
\downarrow
]

[
\begin{cases}
\text{Codex/custom harness}\
\text{Agents SDK/custom agent runtime}
\end{cases}
]

[
\downarrow
]

[
\text{tools/MCP}
]

and model-call path:

[
\text{agent/application}
\rightarrow
\text{OpenAI SDK}
\rightarrow
\begin{cases}
\text{Responses}\
\text{Realtime}
\end{cases}
\rightarrow
\boxed{\text{OpenAI provider boundary}}.
]

[R] Responses, Realtime, the SDK, Agents SDK and Codex are publicly observable surfaces with distinct responsibilities. ([GitHub][42])
[
\boxed{\text{Undisclosed}}
]

for the precise contemporary:

* fleet architecture;
* inference scheduler;
* KV implementation;
* kernel stack;
* distributed inference topology;
* training framework;
* optimizer sharding implementation;
* accelerator composition of any specific API model.

Do not replace that box with vLLM merely because vLLM is open source.

Do not replace it with Triton merely because Triton originated at OpenAI.

Those would be architectural inventions.

---

# 27. Anthropic: Messages, Agent SDK and Managed Agents are different paths

Public custom application path:

[
\text{Application}
\rightarrow
\text{Anthropic SDK}
\rightarrow
\text{Messages API}
\rightarrow
\boxed{\text{provider boundary}}.
]

Agentic/harness path:

[
\text{Application}
\rightarrow
\text{Claude Agent SDK}
\rightarrow
\text{Claude Code execution machinery}.
]

Managed alternative:

[
\text{Application}
\rightarrow
\text{Managed Agents API/runtime}
\rightarrow
\begin{cases}
\text{Anthropic sandbox}\
\text{self-hosted environment}
\end{cases}.
]

MCP can enter either an agent/harness path as an external capability protocol.

[R] Current public documentation supports all three distinct surfaces. ([Claude Platform][44])l-serving/training hardware architecture below Anthropic's provider endpoint remains:

[
\boxed{\text{Undisclosed}}.
]

---

# 28. What is actually comparable?

## Hardware / kernels

Useful axes:

[
(
\text{real workload throughput},
\text{HBM capacity},
\text{HBM bandwidth},
\text{scale-up},
\text{scale-out},
\text{precision support},
\text{kernel maturity}
).
]

Do not rank GB300, MI355X and TPU7x purely by advertised FLOPs; matrix format, sparsity assumptions, chip/system scope and networking architecture differ.

---

## Compiler/framework

| Axis                      | PyTorch-centric               | JAX-centric                                     |
| ------------------------- | ----------------------------- | ----------------------------------------------- |
| Base execution ontology   | eager-first                   | transformation/compiler-first                   |
| Primary capture           | TorchDynamo/FX                | Jaxpr tracing                                   |
| Compiler                  | Inductor                      | XLA                                             |
| Main portable IR boundary | ATen/FX ecosystem             | StableHLO/HLO                                   |
| Custom kernel path        | Triton/CUDA/CuTe/etc.         | Pallas/Mosaic/etc.                              |
| Distributed state         | DTensor/DeviceMesh/FSDP/etc.  | JAX sharding/mesh/XLA SPMD                      |
| Major failure mode        | graph breaks/guard recompiles | tracing/static-value/layout/compile constraints |

Neither is globally superior across all workloads.

---

## Inference

Meaningful dimensions are

[
TTFT,
TPOT,
TPS,
QPS,
M_{KV},
\text{prefix hit rate},
\text{fairness},
\text{P/D transfer cost},
\text{quantization coverage}.
]

Benchmarking only tokens/s can produce the wrong winner for latency-sensitive workloads.

---

## Agents

Meaningful dimensions are:

[
\begin{aligned}
&\text{state semantics},\
&\text{tool execution authority},\
&\text{memory},\
&\text{handoffs/routing},\
&\text{MCP/A2A support},\
&\text{sandboxing},\
&\text{human approval},\
&\text{trajectory tracing},\
&\text{verification}.
\end{aligned}
]

A library-level Agents SDK versus Antigravity is not an apples-to-apples benchmark.

Neither is vLLM versus NIM.

Neither is MIGraphX versus Dynamo.

Neither is MCP versus A2A.

---

# 29. Failure is a cross-layer propagation graph

A useful model is

[
f_i
\rightarrow
\Delta S_i
\rightarrow
f_{i+1}.
]

### Accelerator

[
\text{device reset/HBM error/OOM}
\rightarrow
\text{kernel failure}
\rightarrow
\text{worker/rank loss}.
]

### Kernel

[
\text{bad layout/dtype}
\rightarrow
\text{unsupported path}
]

or worse

[
\text{numerical bug}
\rightarrow
\text{silent wrong tensor}.
]

Performance failures include occupancy collapse, spills and synchronization overhead.

### Compiler

[
\text{graph break}
\rightarrow
\text{eager fallback}
\rightarrow
\text{launch overhead}.
]

[
\text{guard churn}
\rightarrow
\text{recompilation storm}.
]

[
\text{bad fusion/layout}
\rightarrow
\text{memory explosion or regression}.
]

### Distributed model runtime

[
\text{rank failure}
\rightarrow
\text{collective failure}
\rightarrow
\text{job/worker failure}.
]

[
\text{expert imbalance}
\rightarrow
\text{straggler}
\rightarrow
T_{\rm step}\uparrow.
]

### Inference

[
\text{KV pressure}
\rightarrow
\text{preemption}
\rightarrow
\text{recomputation}
\rightarrow
TTFT/TPOT\uparrow.
]

[
\text{prefix churn}
\rightarrow
\text{cache hit rate}\downarrow
\rightarrow
\text{prefill load}\uparrow.
]

### Serving

[
\text{hot router decision}
\rightarrow
q_j\uparrow
\rightarrow
TTFT_j\uparrow.
]

[
\text{scale lag}
\rightarrow
\text{queue growth}
\rightarrow
\text{timeout/retry}
\rightarrow
\text{more queue growth}.
]

### SDK/API

[
429/5xx
\rightarrow
\text{retry}
\rightarrow
\lambda_{\rm server}\uparrow.
]

Unbounded retries create a positive feedback loop.

### Agent

[
\text{wrong tool}
\rightarrow
\text{bad observation}
\rightarrow
\text{context drift}
\rightarrow
\text{next wrong action}.
]

### Harness

[
\text{unsafe shell command}
\rightarrow
\text{filesystem/world mutation}.
]

Unlike a hallucinated sentence, that failure may be irreversible.

---

# 30. Latency, cost and the danger of local optimization

For one model/tool request:

[
T_{\rm total}
=============

T_{\rm client}
+
T_{\rm network}
+
T_{\rm admission}
+
T_{\rm queue}
+
T_{\rm prefill}
+
T_{\rm decode}
+
T_{\rm tools}
+
T_{\rm verification}.
]

For (K) agent turns:

[
T_{\rm agent}
=============

\sum_{k=1}^{K}
\left(
T_{\rm model,k}
+
T_{\rm tool,k}
+
T_{\rm orchestration,k}
\right).
]

Cost:

[
C_{\rm agent}
=============

\sum_{k=1}^{K}
\left(
C_{\rm tokens,k}
+
C_{\rm compute,k}
+
C_{\rm tool,k}
+
C_{\rm storage,k}
\right).
]

Now consider optimizing GEMM by (2\times).

Amdahl gives

[
S=
\frac{1}
{(1-f)+f/2}.
]

If model kernels represented only (f=0.25) of agent E2E latency,

[
S\approx1.14.
]

A spectacular kernel improvement becomes a 14% task-level improvement.

Likewise:

[
\text{batch size}\uparrow
\Rightarrow
TPS\uparrow
]

but usually

[
T_{\rm queue}\uparrow.
]

P/D disaggregation can reduce interference:

[
TTFT,\ TPOT
\text{ isolation}\uparrow
]

while simultaneously creating

[
T_{\rm KV-transfer}>0.
]

The bottleneck does not disappear. It moves.

---

# 31. Reliability is compositional, and agent trajectories amplify failure

With dependent stages having approximate individual success probabilities (p_i),

[
P_{\rm task}
\approx
\prod_{i=1}^{n}p_i.
]

For ten stages each at (0.98),

[
0.98^{10}\approx0.817.
]

Twenty stages:

[
0.98^{20}\approx0.668.
]

Even that is optimistic when failures are correlated.

Agentic systems therefore require state-machine engineering, not merely better model quality:

[
\text{verification}
+
\text{idempotence}
+
\text{bounded retry}
+
\text{checkpoint}
+
\text{rollback}
+
\text{termination}.
]

A tool mutation should ideally be modeled as

[
a=
(
\text{precondition},
\text{mutation},
\text{postcondition},
\text{compensation}
).
]

Then:

[
\neg\text{precondition}
\Rightarrow
\text{do not execute},
]

and failure after mutation can potentially invoke

[
a^{-1}_{\rm compensation}.
]

Most contemporary agent frameworks are still much weaker here than mature workflow/database systems.

The real optimization target becomes

[
\boxed{
\max_{\mathcal S}
\mathbb E
\left[
R_{\rm task}
-\lambda_cC_{\rm compute}
-\lambda_lC_{\rm latency}
-\lambda_fR_{\rm failure}
-\lambda_sR_{\rm security}
\right]
}
]

rather than

[
\max Q_{\rm model}.
]

---

# 32. The next system boundaries are already visible

These are **[D] derived**, not vendor roadmaps.

### KV will become infrastructure state

Today KV spans allocator, inference runtime, cache, router and P/D transfer.

That pressure points toward:

[
\text{KV memory}
\rightarrow
\text{distributed state service/fabric}.
]

The hard problems will be consistency, locality, eviction, compression, tiering and failure semantics—not just allocation.

### Token schedulers and fleet schedulers will need joint objectives

Today:

[
\text{fleet router}
]

and

[
\text{token scheduler}
]

usually optimize different local states.

The global optimum is closer to

[
\pi^\star
=========

\arg\min
f(
TTFT,
TPOT,
TPS,
\text{network},
\text{KV locality},
\text{energy},
\text{SLO}
).
]

That requires information crossing today's serving/runtime boundary.

### Agent actions need transactional semantics

Current agent frameworks are good at:

[
\text{call tool}
\rightarrow
\text{observe result}.
]

Production autonomous systems need:

[
\text{plan}
\rightarrow
\text{authorize}
\rightarrow
\text{prepare}
\rightarrow
\text{commit}
\rightarrow
\text{verify}
\rightarrow
\text{compensate}.
]

Agent execution will increasingly resemble distributed workflow engines.

### Security needs capability provenance across MCP and A2A

As capability discovery becomes dynamic:

[
\text{agent}
\rightarrow
\text{A2A agent}
\rightarrow
\text{MCP server}
\rightarrow
\text{tool}
]

authority must remain attributable across delegation.

The relevant future object is not merely a bearer credential but something closer to

[
C=
(
\text{principal},
\text{delegate},
\text{resource},
\text{actions},
\text{constraints},
\text{expiry},
\text{provenance}
).
]

### Observability must cross abstraction boundaries

Today we can often inspect either

[
\text{kernel/server metrics}
]

or

[
\text{agent traces}.
]

The real question is:

> Why did trajectory step 13 take 17 seconds?

Answering it requires correlation:

[
\tau_k
\rightarrow
\text{API request}
\rightarrow
\text{router}
\rightarrow
\text{queue}
\rightarrow
\text{worker}
\rightarrow
\text{KV}
\rightarrow
\text{kernel}.
]

Privacy and provider boundaries make this difficult.

### Online training and inference continue to converge

Current RL stacks already couple training workers with high-throughput rollout engines. NeMo RL, verl and Tunix all show forms of this convergence in public contemporary systems. ([GitHub][66])ure

[
\text{train}
\rightarrow
\text{export}
\rightarrow
\text{serve}
]

is insufficient for agentic RL systems where

[
\text{rollout}
\rightarrow
\text{evaluate}
\rightarrow
\text{update}
\rightarrow
\text{rollout}
]

is itself the training loop.

---

# Final causal model

The architecture can now be compressed without losing the important boundaries:

[
\boxed{
D_{\rm raw}
\rightarrow
\text{tokens}
\rightarrow
\text{distributed tensors}
\rightarrow
\text{compiled kernels}
\rightarrow
\text{accelerator execution}
\rightarrow
\theta
}
]

for learning,

[
\boxed{
\text{request bytes}
\rightarrow
\text{token IDs}
\rightarrow
\text{scheduled prefill}
\rightarrow
KV
\rightarrow
\text{scheduled decode}
\rightarrow
\text{tokens}
}
]

for inference, and

[
\boxed{
\text{user intent}
\rightarrow
\text{application state}
\rightarrow
\text{context}
\rightarrow
\text{model proposal}
\rightarrow
\text{policy}
\rightarrow
\text{authorized capability}
\rightarrow
\text{environment mutation}
\rightarrow
\text{verified world state}
}
]

for agentic execution.

The ownership transitions are:

[
\boxed{
\begin{array}{rcl}
\text{accelerator} &:& \text{physical arithmetic + memory}\
\text{runtime} &:& \text{device execution}\
\text{kernel} &:& \text{local data movement + instruction schedule}\
\text{compiler} &:& \text{program transformation}\
\text{framework} &:& \text{tensor semantics}\
\text{distributed runtime} &:& \text{tensor ownership}\
\text{training runtime} &:& \text{parameter evolution}\
\text{inference runtime} &:& \text{token/KV scheduling}\
\text{serving plane} &:& \text{worker/request placement}\
\text{API} &:& \text{remote semantic contract}\
\text{SDK} &:& \text{client transport contract}\
\text{MCP} &:& \text{capability/context interoperability}\
\text{A2A} &:& \text{opaque-agent interoperability}\
\text{agent runtime} &:& \text{trajectory/control logic}\
\text{harness} &:& \text{mutable execution environment}\
\text{application} &:& \text{domain truth and success}.
\end{array}
}
]

The modern AI system therefore does not end at

[
p_\theta(y\mid x).
]

The complete causal system is:

[
\boxed{
\text{bytes}
\rightarrow
\text{tensors}
\rightarrow
\text{kernels}
\rightarrow
\text{distributed computation}
\rightarrow
\text{model state}
\rightarrow
\text{tokens}
\rightarrow
\text{context}
\rightarrow
\text{decisions}
\rightarrow
\text{capabilities}
\rightarrow
\text{authorized actions}
\rightarrow
\text{world state}
}
]

and the engineering problem is no longer to maximize one component in that chain.

It is to make the **composition** satisfy correctness, latency, throughput, cost, recoverability and authority constraints simultaneously.

[1]: https://docs.jax.dev/en/latest/about.html "https://docs.jax.dev/en/latest/about.html"
[2]: https://www.nvidia.com/en-us/data-center/gb300-nvl72/ "https://www.nvidia.com/en-us/data-center/gb300-nvl72/"
[3]: https://docs.nvidia.com/cuda/cuda-programming-guide/index.html?utm_source=chatgpt.com "CUDA Programming Guide — CUDA Programming Guide"
[4]: https://rocm.docs.amd.com/projects/HIP/en/latest/ "https://rocm.docs.amd.com/projects/HIP/en/latest/"
[5]: https://openxla.org/xla/pjrt?authuser=0 "https://openxla.org/xla/pjrt?authuser=0"
[6]: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html"
[7]: https://docs.nvidia.com/cutlass/latest/index.html "https://docs.nvidia.com/cutlass/latest/index.html"
[8]: https://docs.nvidia.com/deeplearning/cudnn/latest/developer/graph-api.html "https://docs.nvidia.com/deeplearning/cudnn/latest/developer/graph-api.html"
[9]: https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/ "https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/"
[10]: https://github.com/ROCm/rocm?utm_source=chatgpt.com "GitHub - ROCm/ROCm: AMD ROCm™ Software - GitHub Home · GitHub"
[11]: https://github.com/ROCm/aiter?utm_source=chatgpt.com "GitHub - ROCm/aiter: AI Tensor Engine for ROCm · GitHub"
[12]: https://github.com/rocm?utm_source=chatgpt.com "AMD ROCm™ Software · GitHub"
[13]: https://github.com/triton-lang/triton/releases?utm_source=chatgpt.com "Releases · triton-lang/triton · GitHub"
[14]: https://docs.jax.dev/en/latest/pallas/index.html "https://docs.jax.dev/en/latest/pallas/index.html"
[15]: https://docs.nvidia.com/cutlass/4.6.0/media/docs/operators/api_reference/arguments.html "https://docs.nvidia.com/cutlass/4.6.0/media/docs/operators/api_reference/arguments.html"
[16]: https://docs.pytorch.org/docs/stable/generated/torch.compile.html?utm_source=chatgpt.com "torch.compile — PyTorch 2.13 documentation"
[17]: https://docs.pytorch.org/docs/main/user_guide/torch_compiler/torch.compiler_aot_compile.html?utm_source=chatgpt.com "Ahead-of-Time Compilation with torch.compile — PyTorch main documentation"
[18]: https://github.com/huggingface/transformers "https://github.com/huggingface/transformers"
[19]: https://docs.pytorch.org/docs/main/distributed.fsdp.fully_shard.html "https://docs.pytorch.org/docs/main/distributed.fsdp.fully_shard.html"
[20]: https://docs.pytorch.org/docs/stable/distributed.tensor.html "https://docs.pytorch.org/docs/stable/distributed.tensor.html"
[21]: https://docs.pytorch.org/docs/stable/distributed.tensor.parallel.html "https://docs.pytorch.org/docs/stable/distributed.tensor.parallel.html"
[22]: https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/context_parallel.html?utm_source=chatgpt.com "Context Parallel Package — Megatron Core"
[23]: https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/parallelism-guide.html?utm_source=chatgpt.com "Parallelism Strategies Guide — Megatron Core"
[24]: https://arxiv.org/abs/2203.12533 "https://arxiv.org/abs/2203.12533"
[25]: https://docs.jax.dev/en/latest/notebooks/explicit-sharding.html "https://docs.jax.dev/en/latest/notebooks/explicit-sharding.html"
[26]: https://github.com/pytorch/torchtitan "https://github.com/pytorch/torchtitan"
[27]: https://github.com/NVIDIA-NeMo/NeMo "https://github.com/NVIDIA-NeMo/NeMo"
[28]: https://github.com/huggingface/trl "https://github.com/huggingface/trl"
[29]: https://github.com/volcengine/verl?ref=www.awesomepython.org "https://github.com/volcengine/verl?ref=www.awesomepython.org"
[30]: https://github.com/AI-Hypercomputer/maxtext "https://github.com/AI-Hypercomputer/maxtext"
[31]: https://github.com/google/grain/releases "https://github.com/google/grain/releases"
[32]: https://docs.vllm.ai/en/stable/?utm_source=chatgpt.com "vLLM"
[33]: https://docs.vllm.ai/en/stable/usage/v1_guide/?utm_source=chatgpt.com "vLLM V1 - vLLM"
[34]: https://docs.vllm.ai/en/stable/features/disagg_prefill/?utm_source=chatgpt.com "Disaggregated Prefilling (experimental) - vLLM"
[35]: https://github.com/sgl-project/sglang/blob/main/README.md?utm_source=chatgpt.com "sglang/README.md at main · sgl-project/sglang · GitHub"
[36]: https://nvidia.github.io/TensorRT-LLM/latest/torch/arch_overview.html?utm_source=chatgpt.com "Architecture Overview — TensorRT LLM"
[37]: https://rocm.docs.amd.com/projects/AMDMIGraphX/en/develop/ "https://rocm.docs.amd.com/projects/AMDMIGraphX/en/develop/"
[38]: https://docs.nvidia.com/dynamo/design-docs/overall-architecture "https://docs.nvidia.com/dynamo/design-docs/overall-architecture"
[39]: https://docs.nvidia.com/nim/large-language-models/latest/reference/architecture.html?utm_source=chatgpt.com "Architecture — NVIDIA NIM for Large Language Models"
[40]: https://docs.ray.io/en/latest/serve/llm/architecture/overview.html "https://docs.ray.io/en/latest/serve/llm/architecture/overview.html"
[41]: https://kserve.github.io/website/docs/model-serving/generative-inference/autoscaling "https://kserve.github.io/website/docs/model-serving/generative-inference/autoscaling"
[42]: https://github.com/openai/openai-python "https://github.com/openai/openai-python"
[43]: https://platform.openai.com/docs/api-reference/responses-streaming/response/code_interpreter_call_code/delta "https://platform.openai.com/docs/api-reference/responses-streaming/response/code_interpreter_call_code/delta"
[44]: https://platform.claude.com/docs/en/build-with-claude/working-with-messages "https://platform.claude.com/docs/en/build-with-claude/working-with-messages"
[45]: https://ai.google.dev/gemini-api/docs/interactions-overview?authuser=9 "https://ai.google.dev/gemini-api/docs/interactions-overview?authuser=9"
[46]: https://github.com/googleapis/python-genai "https://github.com/googleapis/python-genai"
[47]: https://github.com/anthropics/anthropic-sdk-python "https://github.com/anthropics/anthropic-sdk-python"
[48]: https://github.com/modelcontextprotocol/modelcontextprotocol/releases "Releases · modelcontextprotocol/modelcontextprotocol · GitHub"
[49]: https://modelcontextprotocol.io/specification/2026-07-28 "https://modelcontextprotocol.io/specification/2026-07-28"
[50]: https://a2a-protocol.org/latest/specification/ "https://a2a-protocol.org/latest/specification/"
[51]: https://openai.github.io/openai-agents-python/ "https://openai.github.io/openai-agents-python/"
[52]: https://openai.github.io/openai-agents-python/sessions/ "https://openai.github.io/openai-agents-python/sessions/"
[53]: https://github.com/google/adk-python/releases "https://github.com/google/adk-python/releases"
[54]: https://github.com/anthropics/claude-agent-sdk-python "https://github.com/anthropics/claude-agent-sdk-python"
[55]: https://platform.claude.com/docs/en/managed-agents/overview?ct=9564 "https://platform.claude.com/docs/en/managed-agents/overview?ct=9564"
[56]: https://platform.claude.com/docs/en/managed-agents/permission-policies "https://platform.claude.com/docs/en/managed-agents/permission-policies"
[57]: https://github.com/NVIDIA/NeMo-Agent-Toolkit "https://github.com/NVIDIA/NeMo-Agent-Toolkit"
[58]: https://developer.amd.com/playbooks/gaia-agents/?utm_source=chatgpt.com "Building Your First Agent with GAIA | AMD AI Playbooks"
[59]: https://github.com/openai/codex "https://github.com/openai/codex"
[60]: https://openai.com/index/open-source-codex-orchestration-symphony/ "https://openai.com/index/open-source-codex-orchestration-symphony/"
[61]: https://code.claude.com/docs/en/sandboxing "https://code.claude.com/docs/en/sandboxing"
[62]: https://antigravity.google/blog/introducing-google-antigravity-2?hl=en "https://antigravity.google/blog/introducing-google-antigravity-2?hl=en"
[63]: https://orbax.readthedocs.io/en/stable/guides/checkpoint/orbax_checkpoint_101.html "https://orbax.readthedocs.io/en/stable/guides/checkpoint/orbax_checkpoint_101.html"
[64]: https://github.com/amd/gaia?utm_source=chatgpt.com "GitHub - amd/gaia: Build AI agents for your PC · GitHub"
[65]: https://github.com/vllm-project/tpu-inference "https://github.com/vllm-project/tpu-inference"
[66]: https://github.com/NVIDIA-NeMo/RL "https://github.com/NVIDIA-NeMo/RL"
