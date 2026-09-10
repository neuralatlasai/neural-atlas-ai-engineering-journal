# AI Capabilities and Limitations in 2026: Four Properties Become Four Systems Boundaries

### A source-audited systems reconstruction of Anthropic Claude Academy's model of generative AI

Anthropic's *AI Capabilities and Limitations* course organizes generative-AI behavior around four properties: **Next Token Prediction, Knowledge, Working Memory, and Steerability**. The framework is intentionally accessible: it explains why a model can produce highly fluent output while fabricating specifics, possess broad knowledge while missing recent or niche facts, process large amounts of context while losing important information, and follow detailed instructions while still deviating from the user's actual objective.

For a 2026 AI system, however, these should not be interpreted only as properties of an isolated language model.

The deployed object is increasingly:

$$
\boxed{
\mathcal S =
(
M_\theta,
C_t,
R_t,
K_t,
T_t,
V_t,
P_t,
E_t
)
}
$$

where

$$
\begin{aligned}
M_\theta &: \text{trained model},\\
C_t &: \text{active rendered context},\\
R_t &: \text{retrieved or persistent state},\\
K_t &: \text{external knowledge sources},\\
T_t &: \text{tool and execution state},\\
V_t &: \text{verification mechanisms},\\
P_t &: \text{instruction, policy, and authorization state},\\
E_t &: \text{external environment}.
\end{aligned}
$$

The four Academy properties remain useful, but each now corresponds to a larger **systems boundary**.

---

## 1. Next-Token Prediction Is a Generation Mechanism, Not a Truth Mechanism

Anthropic identifies next-token prediction as the fundamental mechanism behind generative output and observes that fabrication is especially dangerous around precise claims such as names, dates, statistics, citations, quotations, and URLs. It recommends mechanisms including citations, constrained generation, uncertainty signalling, and generator-verifier patterns as mitigations.

For an autoregressive language model,

$$
P_\theta(y_{1:T}\mid x)
=
\prod_{t=1}^{T}
P_\theta(y_t\mid x,y_{<t}).
$$

Generation therefore selects a sequence according to a learned conditional distribution.

But

$$
\boxed{
P_\theta(y\mid x)
\neq
P(y\text{ is factually correct}\mid x)
}
$$

in general.

A high-probability continuation can be linguistically coherent without being supported by external evidence.

This distinction matters because **factual verification is not equivalent to decoding**.

A more defensible deployed pipeline is:

$$
x
\rightarrow
M_\theta
\rightarrow
y_0
\rightarrow
V(y_0,E)
\rightarrow
\begin{cases}
y_0, & V\ge\tau,\\
\text{retrieve / calculate / retry / escalate}, & V<\tau.
\end{cases}
$$

Here \(E\) is externally available evidence and \(V\) is a verifier, deterministic checker, retrieval-backed evaluator, secondary model, or another task-specific validation mechanism.

This is the important 2026 interpretation:

$$
\boxed{
\text{generation}
\neq
\text{grounding}
\neq
\text{verification}.
}
$$

Tool access does not eliminate this problem. A model can select the wrong tool, provide incorrect arguments, misread correct tool output, or synthesize evidence incorrectly. The reliability problem moves from pure generation into the entire execution graph.

---

## 2. Model Knowledge Is Only One Layer of Available Knowledge

Anthropic's second property concerns **Knowledge**. The Academy distinguishes well-represented training-distribution knowledge from rare, niche, local, contested, or post-cutoff information, and explicitly identifies web search, retrieval, RAG/MCP systems, and tool use as mechanisms for addressing those gaps.

For an isolated model, we can denote parametric knowledge as

$$
\mathcal K_\theta.
$$

But a production system may operate over a much larger information surface:

$$
\boxed{
\mathcal I_t
=
\mathcal K_\theta
\cup
\mathcal K_{\text{retrieved},t}
\cup
\mathcal K_{\text{tool},t}
\cup
\mathcal K_{\text{user},t}
\cup
\mathcal K_{\text{memory},t}.
}
$$

These sources are not equivalent.

**Parametric knowledge** is encoded implicitly in model parameters and cannot generally provide reliable source provenance.

**Retrieved knowledge** comes from explicitly selected documents, indexes, databases, or search systems.

**Tool knowledge** is generated at runtime through APIs, databases, code execution, browsers, or external computational systems.

**Persistent memory** may survive across sessions but exists outside the model and becomes useful only when appropriately retrieved.

The engineering problem has therefore shifted from:

$$
\text{Does the model know }z?
$$

to:

$$
\boxed{
\text{Can the system acquire, rank, contextualize, verify, and preserve the evidence required for }z?
}
$$

Anthropic's current platform documentation makes this distinction operational: tools are intended for fresh or external data, side-effecting actions, structured interfaces, and access to systems unavailable from text generation alone. The model requests tool execution; the runtime executes it and returns the resulting evidence.

This produces a critical architectural separation:

$$
\boxed{
\text{model intelligence}
\neq
\text{enterprise knowledge}.
}
$$

The model supplies inference over evidence. The knowledge infrastructure determines which evidence becomes available.

---

## 3. Context Is an Active Working Set, Not Persistent Memory

Claude Academy describes Working Memory through the context window: information available to the model during the current inference process is bounded, long conversations can exceed that boundary, and important information can be degraded or lost as context grows.

The 2026 systems interpretation is stricter:

$$
\boxed{
\text{context window}
\neq
\text{memory architecture}.
}
$$

Let the rendered context for inference step \(t\) be

$$
C_t
=
\operatorname{Render}
(
S,
H_t,
D_t,
R_t,
O_t,
M_t
),
$$

where \(S\) contains system-level instructions, \(H_t\) conversation history, \(D_t\) retrieved documents, \(R_t\) relevant persistent state, \(O_t\) tool observations, and \(M_t\) selected memory.

The model operates subject to

$$
|C_t| \le L_{\max}.
$$

But staying below \(L_{\max}\) is not sufficient.

Anthropic's current documentation explicitly states that additional context is **not automatically better**: accuracy and recall may degrade as context grows, even before the hard window is exhausted. Current Claude systems therefore expose context-management mechanisms such as compaction, context editing, tool-result clearing, and lazy tool discovery.

For a long-running agent,

$$
C_t=C_{t-1}\Vert \Delta C_t
$$

produces approximately

$$
|C_t|=O(t)
$$

without explicit state management.

A compaction operator attempts

$$
C_{0:t}
\xrightarrow{\mathcal C}
\widetilde C_t,
\qquad
|\widetilde C_t|
\ll
|C_{0:t}|.
$$

The optimization target is not simply minimum context size. It is closer to

$$
\min |\widetilde C_t|
$$

subject to retaining information required by future decisions.

The difficulty is that future relevance is unknown at compaction time.

Therefore,

$$
\boxed{
\text{compaction}
=
\text{compression under future-task uncertainty}.
}
$$

Anthropic now documents server-side compaction specifically for long-running conversations and agentic workflows, while its memory tooling persists information outside the active context and retrieves it when needed.

This leads to a more precise architecture:

$$
\text{persistent state}
\xrightarrow{\text{retrieval}}
\text{active context}
\xrightarrow{M_\theta}
\text{decision}.
$$

Persistent storage may be large.

Active context should remain **decision relevant**.

---

## 4. Steerability Is Becoming Control-Plane Engineering

Anthropic defines steerability as the degree to which instructions determine model behavior. The Academy reports stronger reliability for short, concrete, verifiable constraints and weaker reliability for ambiguous instructions, long dependent reasoning chains, and tasks requiring exact logical or numerical behavior. It identifies reasoning drift and literal-but-misaligned instruction following as characteristic failures.

At the model level, instruction following remains probabilistic.

For an intended behavioral constraint set

$$
\Omega=\{c_1,c_2,\ldots,c_n\},
$$

reliable execution requires

$$
y\in\bigcap_{i=1}^{n}c_i.
$$

But there is no general guarantee that

$$
P_\theta
\left(
y\in\bigcap_i c_i
\mid C_t
\right)
=1.
$$

As constraints become numerous, ambiguous, conflicting, temporally separated, or dependent on intermediate reasoning, adherence becomes a systems problem rather than merely a prompting problem.

This changes the engineering strategy.

Instead of encoding every requirement into natural language:

$$
\text{Prompt}
\rightarrow
\text{Hope for compliance},
$$

a production architecture externalizes enforceable constraints:

$$
\boxed{
\text{intent}
\rightarrow
\text{policy}
\rightarrow
\text{schema}
\rightarrow
\text{execution}
\rightarrow
\text{validation}.
}
$$

Examples include:

* typed tool schemas,
* structured outputs,
* deterministic validators,
* programmatic calculations,
* permission boundaries,
* sandboxed execution,
* explicit state machines,
* confirmation gates,
* retry and escalation policies.

Anthropic's current Structured Outputs interface, for example, constrains generated responses or tool inputs against explicit schemas instead of requiring downstream systems to recover structure from unconstrained prose.

Thus the frontier interpretation of steerability is:

$$
\boxed{
\text{prompt engineering}
\subset
\text{control engineering}.
}
$$

Prompts communicate intent.

The runtime should enforce invariants that cannot safely remain probabilistic.

---

## 5. The Four Boundaries Interact

The strongest aspect of Anthropic's framework is its claim that failures rarely belong to only one property. Real tasks combine generation, knowledge, context, and instruction-following constraints.

Consider a long-horizon enterprise research agent.

The model must:

$$
\text{understand request}
\rightarrow
\text{retrieve evidence}
\rightarrow
\text{plan}
\rightarrow
\text{invoke tools}
\rightarrow
\text{maintain state}
\rightarrow
\text{reason}
\rightarrow
\text{verify}
\rightarrow
\text{synthesize}.
$$

A failure at the end may originate anywhere upstream.

An apparently fabricated conclusion may result from:

$$
\begin{aligned}
&\text{generation error},\\
&\text{missing retrieval},\\
&\text{incorrect retrieval ranking},\\
&\text{stale evidence},\\
&\text{context eviction},\\
&\text{incorrect tool selection},\\
&\text{incorrect tool arguments},\\
&\text{reasoning drift},\\
&\text{instruction conflict},\\
&\text{verification failure}.
\end{aligned}
$$

Final-answer accuracy alone therefore provides poor failure localization.

A useful evaluation vector is closer to

$$
\boxed{
\mathbf E=
[
Q_{\text{retrieval}},
Q_{\text{evidence}},
Q_{\text{planning}},
Q_{\text{tool}},
Q_{\text{state}},
Q_{\text{reasoning}},
Q_{\text{instruction}},
Q_{\text{verification}},
Q_{\text{final}}
].
}
$$

The correct object of evaluation is increasingly the **system trajectory**, not only the final generated string.

---

## 6. Translating the Claude Academy Framework Into a 2026 Architecture

The four properties map naturally onto four runtime subsystems:

| Academy property      | Model-level limitation                                      | 2026 system response                                                            |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Next Token Prediction | Plausibility is not factuality                              | Grounding, citations, deterministic checks, generator-verifier loops            |
| Knowledge             | Parametric knowledge is incomplete and stale                | Search, RAG, MCP, APIs, databases, tool execution                               |
| Working Memory        | Active inference context is finite and degrades with growth | Retrieval, compaction, persistent memory, context editing, state lifecycle      |
| Steerability          | Natural-language compliance is probabilistic                | Schemas, policies, validators, checkpoints, authorization, structured execution |

This gives the runtime:

$$
\boxed{
\text{Request}
\rightarrow
\text{Context construction}
\rightarrow
\text{Knowledge acquisition}
\rightarrow
\text{Reasoning / generation}
\rightarrow
\text{Tool execution}
\rightarrow
\text{Verification}
\rightarrow
\text{Response / action}
}
$$

with persistent control planes for:

$$
\begin{aligned}
&\text{memory},\\
&\text{authorization},\\
&\text{context lifecycle},\\
&\text{telemetry},\\
&\text{cost / latency budgets},\\
&\text{failure recovery}.
\end{aligned}
$$

The deployed system therefore obeys

$$
\boxed{
Q_{\text{system}}
\neq
Q(M_\theta)
}
$$

in general.

A stronger model can improve the system, but system quality also depends on evidence quality, active context, tool reliability, state consistency, orchestration, verification, and external controls.

---

## 7. What the Four-Property Model Does Not Fully Capture

Anthropic's framework is useful as a mental model, but it should not be mistaken for a complete taxonomy of frontier-agent reliability.

By 2026, additional variables have become first-class:

### Reasoning compute

Models may allocate different amounts of test-time computation to different tasks.

$$
Q=Q(M,e)
$$

where \(e\) is reasoning effort.

More reasoning is not universally equivalent to more correctness.

### Tool reliability

External capability introduces new failure modes:

$$
Q_{\text{tool}}
=
Q_{\text{selection}}
\cdot
Q_{\text{arguments}}
\cdot
Q_{\text{execution}}
\cdot
Q_{\text{interpretation}}.
$$

Each term can fail independently.

### Persistent state

Multi-session agents require explicit decisions about:

$$
\text{write}
\rightarrow
\text{retain}
\rightarrow
\text{retrieve}
\rightarrow
\text{update}
\rightarrow
\text{invalidate}.
$$

Memory accumulation without lifecycle management creates stale-state and contamination problems.

### Side effects

Generating a wrong sentence and executing a wrong database mutation are not equivalent failures.

Agent evaluation therefore requires separate measurement of

$$
Q_{\text{answer}}
\quad\text{and}\quad
Q_{\text{side-effect}}.
$$

### Authorization

A capable system should not automatically possess permission to exercise every capability.

$$
\boxed{
\text{capability}
\neq
\text{authority}.
}
$$

These dimensions sit outside the Academy's four-property teaching framework but become mandatory when the model participates in autonomous or semi-autonomous execution.

---

## 8. What the Evidence Rejects

Several common simplifications should therefore be rejected.

### Fluent generation is not evidence of factual grounding

$$
\text{fluency}
\nRightarrow
\text{factuality}.
$$

### Larger context is not persistent memory

$$
\text{long context}
\neq
\text{memory}.
$$

### Retrieval does not guarantee correctness

$$
\text{retrieved evidence}
\nRightarrow
\text{correct synthesis}.
$$

### Tool access does not remove hallucination

Tool selection, arguments, observations, and interpretation remain probabilistic surfaces.

### Better prompting cannot enforce every invariant

Natural-language steering should not replace deterministic validation where correctness is mechanically testable.

### Model capability is not system reliability

$$
Q(M_\theta)\uparrow
\nRightarrow
P_{\text{system failure}}\downarrow
$$

without assumptions about the surrounding harness.

---

## 9. Final Synthesis

Anthropic's four-property model remains useful because it identifies four fundamental boundaries of generative systems:

$$
\boxed{
\begin{aligned}
\text{Next-token prediction} &\rightarrow \text{generation uncertainty},\\
\text{Knowledge} &\rightarrow \text{information availability},\\
\text{Working memory} &\rightarrow \text{active-state capacity},\\
\text{Steerability} &\rightarrow \text{behavioral control}.
\end{aligned}
}
$$

The 2026 transition is that engineering no longer attempts to solve these boundaries exclusively inside the model.

Instead:

$$
\boxed{
\text{Model limitation}
\rightarrow
\text{System mechanism}.
}
$$

Fabrication motivates grounding and verification.

Knowledge gaps motivate retrieval and tools.

Finite context motivates context construction, compaction, and persistent memory.

Imperfect steerability motivates schemas, execution controls, validators, and authorization boundaries.

The central engineering lesson is therefore not simply to understand what an LLM can and cannot do.

It is to determine **which uncertainties should remain probabilistic inside the model and which must be externalized into retrieval, state, computation, verification, and control infrastructure**.

That boundary increasingly defines the architecture of reliable AI systems.
