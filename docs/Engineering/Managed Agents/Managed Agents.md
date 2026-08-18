# Managed Agent Execution Systems

## Architecture, Runtime Semantics, and Operational Model

### Abstract

A managed agent execution system moves agentic inference from a stateless request-response abstraction into a **persistent execution runtime**. The primary architectural change is not the addition of tool calling; tool calling already exists in conventional model application loops. The change is the relocation of the agent control loop, execution sandbox, conversation state, built-in tool dispatch, runtime optimization, and execution lifecycle into a managed service boundary.

The resulting system separates four persistent abstractions:

[
\boxed{
\text{Agent Definition}
\rightarrow
\text{Execution Environment}
\rightarrow
\text{Session}
\leftrightarrow
\text{Event Stream}
}
]

The agent definition specifies **what intelligence and capabilities execute**. The environment specifies **where execution occurs**. The session materializes a particular task execution and owns its evolving state. Events form the bidirectional protocol through which applications inject work, receive generated outputs, observe tool execution, provide external tool results, steer active execution, and detect quiescence.

This architecture is designed primarily for long-running, stateful, tool-intensive workloads where constructing and operating a custom agent loop would otherwise require application-managed conversation reconstruction, tool dispatch, sandbox lifecycle management, persistent filesystem handling, execution recovery, scheduling, streaming, and context compaction.

---

# 1. System Objective

The system objective is to provide a reusable execution substrate for autonomous model-driven computation:

[
\boxed{
\mathcal{Q}
\rightarrow
\text{Reason}
\rightarrow
\text{Act}
\rightarrow
\text{Observe}
\rightarrow
\text{Update State}
\rightarrow
\text{Reason}
\rightarrow \cdots
\rightarrow
\mathcal{O}
}
]

where

[
\mathcal{Q}
===========

\text{task or user event}
]

and

[
\mathcal{O}
===========

\text{generated messages}
+
\text{files}
+
\text{tool side effects}
+
\text{execution artifacts}.
]

In a direct model interface, the application normally owns the iterative transition:

[
H_{t+1}
=======

H_t
\oplus
y_t
\oplus
o_t
]

where:

* (H_t) is application-maintained interaction history,
* (y_t) is the model response,
* (o_t) is an observation produced by a tool.

The application repeatedly reconstructs the model request:

[
y_t
===

M(H_t,T,P)
]

detects requested tools,

[
a_t
===

\operatorname{ParseToolCall}(y_t),
]

executes them,

[
o_t=T_{a_t}(x_t),
]

appends their results to the context, and invokes the model again.

A managed runtime moves this recursive execution mechanism behind the service boundary:

[
\boxed{
\text{Application}
\xrightarrow{\text{event}}
\text{Managed Session Runtime}
\xrightarrow{\delta^*}
\text{terminal or idle state}
}
]

The application no longer has to reconstruct and resubmit the complete conversation state after every internal action. Session history, built-in tool execution, sandbox state, and loop progression are maintained by the runtime.

This creates a fundamental architectural distinction:

| Direct Model Interface                       | Managed Agent Runtime                         |
| -------------------------------------------- | --------------------------------------------- |
| Application owns inference loop              | Runtime owns the core agent loop              |
| Application maintains transcript             | Session persists transcript                   |
| Application executes tool calls              | Built-in tools execute in the sandbox         |
| Application provisions execution environment | Runtime provisions or attaches an environment |
| Application defines loop termination         | Runtime exposes explicit lifecycle state      |
| Context reconstructed per request            | Stateful session evolves incrementally        |
| Fine-grained orchestration flexibility       | Higher-level execution abstraction            |
| Best for explicit custom control             | Best for long-running autonomous execution    |

The managed runtime therefore does not replace direct model access. It occupies a different abstraction layer.

---

# 2. Architectural Decomposition

The system can be modeled as four primary objects:

[
\boxed{
\mathcal{A},
\mathcal{E},
\mathcal{S},
\mathcal{X}
}
]

with:

[
\mathcal{A}
===========

\text{Agent Definition}
]

[
\mathcal{E}
===========

\text{Environment}
]

[
\mathcal{S}
===========

\text{Session}
]

[
\mathcal{X}
===========

\text{Event Stream}.
]

The source architecture explicitly defines these concepts as the model-plus-capabilities configuration, execution location, running task instance, and bidirectional messages respectively.

Their dependency graph is:

[
\boxed{
\mathcal{A}_v
+
\mathcal{E}
\rightarrow
\mathcal{S}_i
\leftrightarrow
{e_0,e_1,\ldots,e_t}
}
]

where (v) denotes the agent configuration version and (i) identifies a concrete execution.

This decomposition deliberately separates **configuration identity** from **execution identity**.

A single agent configuration can therefore participate in many sessions:

[
\mathcal{A}_v
\rightarrow
{
\mathcal{S}_1,
\mathcal{S}_2,
\dots,
\mathcal{S}_N
}.
]

Likewise, an environment can support repeated sessions without embedding task-specific logic inside the environment definition.

---

# 3. Control Plane and Execution Plane

A useful systems interpretation separates the platform into a control plane and an execution plane.

## 3.1 Control Plane

The control plane manages reusable configuration:

[
\mathcal{C}
===========

{
\mathcal{A},
\mathcal{E},
V,
P,
C,
D
}
]

where:

* (V): configuration versions,
* (P): tool permission policies,
* (C): credentials and external integrations,
* (D): scheduled deployment configuration.

Typical control-plane operations include:

[
\operatorname{CreateAgent}()
]

[
\operatorname{UpdateAgent}()
]

[
\operatorname{CreateEnvironment}()
]

[
\operatorname{ConfigurePermissions}()
]

[
\operatorname{ConfigureExternalTools}()
]

[
\operatorname{CreateSchedule}().
]

## 3.2 Execution Plane

The execution plane owns per-task computation:

[
\mathcal{R}_i
=============

{
\mathcal{S}_i,
H_i,
F_i,
O_i,
Q_i,
\sigma_i
}
]

where:

* (H_i): persistent session event/transcript history,
* (F_i): sandbox filesystem state,
* (O_i): generated outputs,
* (Q_i): outstanding execution/tool actions,
* (\sigma_i): lifecycle state.

Execution consists of transitions:

[
(\mathcal{S}*t,e_t)
\xrightarrow{\delta}
(\mathcal{S}*{t+1},E_{t+1}).
]

The front end or calling application therefore interacts primarily with an **event protocol**, not with the individual internal model invocations that implement the reasoning loop.

---

# 4. Agent Definition

An agent is a persistent, reusable specification of model behavior and capability.

Formally:

[
\boxed{
\mathcal{A}_v
=============

(M,P,T,R,K,V)_v
}
]

where:

* (M): model configuration,
* (P): system-level behavioral instruction,
* (T): native and custom tool declarations,
* (R): external protocol/tool-server configuration,
* (K): attached skills or reusable procedural knowledge,
* (V): configuration version.

The fundamental property is that the agent is **not recreated for every request**.

Instead:

[
\operatorname{CreateAgent}()
\rightarrow
(\text{agent_id},v)
]

followed by:

[
\operatorname{CreateSession}
(
\text{agent_id},
v,
\text{environment_id}
).
]

The reference implementation returns both a persistent agent identifier and configuration version.

This enables deployment semantics analogous to immutable service configuration:

[
\mathcal{A}*{v_1}
\rightarrow
\mathcal{A}*{v_2}
\rightarrow
\mathcal{A}_{v_3}.
]

Sessions may be associated with a concrete version:

[
\mathcal{S}*i
\mapsto
\mathcal{A}*{v_k}.
]

Consequently, configuration promotion and rollback can occur independently of client deployment.

A model migration becomes primarily:

[
M_{\text{old}}
\rightarrow
M_{\text{new}}
]

inside the agent definition, with the new configuration affecting subsequent sessions. The source architecture explicitly treats model-version migration as an agent-definition update rather than a complete client-runtime migration.

---

# 5. Environment Model

The environment defines the computational boundary in which the session executes.

[
\boxed{
\mathcal{E}
===========

(R,F,N,I)
}
]

where:

* (R): runtime configuration,
* (F): filesystem and workspace semantics,
* (N): network policy,
* (I): isolation boundary.

Two principal deployment modes exist:

[
\mathcal{E}
\in
{
\mathcal{E}*{cloud},
\mathcal{E}*{self-hosted}
}.
]

The reference architecture explicitly supports both managed cloud sandboxes and execution on infrastructure controlled by the application operator.

A typical managed environment can define networking independently from the agent:

[
N
=

\operatorname{NetworkPolicy}(\text{restricted/unrestricted/...}).
]

This is architecturally important. Model capability is therefore separated from execution privilege:

[
\boxed{
\text{Agent capability}
\neq
\text{Environment authority}
}
]

An agent may possess a web or command-execution tool declaration while the environment controls whether the corresponding network or system operation can actually succeed.

The execution sandbox becomes the locality for:

[
{
\text{shell processes},
\text{file operations},
\text{code execution},
\text{temporary artifacts},
\text{tool-mediated state}
}.
]

The runtime sequence explicitly provisions the sandbox before executing the agent loop and executes shell and file operations inside that sandbox.

---

# 6. Session as the Fundamental Runtime Object

The session is the central stateful object.

A useful formalization is:

[
\boxed{
\mathcal{S}_t
=============

(
\mathcal{A}_v,
\mathcal{E},
H_t,
F_t,
O_t,
C_t,
\sigma_t
)
}
]

where:

* (\mathcal{A}_v): pinned agent definition,
* (\mathcal{E}): selected environment,
* (H_t): persisted interaction and execution history,
* (F_t): sandbox/filesystem state,
* (O_t): generated outputs,
* (C_t): effective runtime context,
* (\sigma_t): execution status.

Unlike a stateless completion request:

[
R_t=f(P_t),
]

the managed session behaves as:

[
(\mathcal{S}*{t+1},E*{out})
===========================

\delta(\mathcal{S}*t,E*{in}).
]

Therefore the session itself acts as the durable container of execution continuity.

The operational lifecycle becomes:

[
\boxed{
\text{Create Agent}
\rightarrow
\text{Create Environment}
\rightarrow
\text{Create Session}
\rightarrow
\text{Open Event Stream}
\rightarrow
\text{Send Event}
\rightarrow
\text{Autonomous Execution}
\rightarrow
\text{Idle}
}
]

The agent and environment are reusable; sessions represent individual executions.

---

# 7. Event-Driven Runtime Protocol

The session interface is event-oriented.

Let:

[
E^{in}
======

{
e_1^{user},
e_2^{tool-result},
e_3^{steer},
e_4^{confirmation},
\ldots
}
]

and

[
E^{out}
=======

{
e_1^{message},
e_2^{tool-use},
e_3^{status},
e_4^{output},
\ldots
}.
]

The canonical interaction is:

[
\operatorname{OpenStream}(\mathcal{S})
]

then

[
\operatorname{Send}
(
\mathcal{S},
e^{user}
)
]

followed by

[
\operatorname{ConsumeStream}(\mathcal{S}).
]

The documented execution order explicitly opens the stream before sending the user event.

Representative event classes include:

[
\texttt{user.message}
]

[
\texttt{agent.message}
]

[
\texttt{agent.tool_use}
]

[
\texttt{agent.custom_tool_use}
]

[
\texttt{user.custom_tool_result}
]

[
\texttt{user.tool_confirmation}
]

[
\texttt{session.status_idle}.
]

The stream is delivered incrementally through server-sent events, allowing the client to observe model output, tool activity, state transitions, and completion without polling the entire task.

---

# 8. Runtime State Machine

The execution semantics can be represented as:

[
\sigma_t
\in
{
\text{idle},
\text{reasoning},
\text{tool-wait},
\text{executing},
\text{streaming},
\text{interrupted}
}.
]

Given a user event:

[
e_t
===

\texttt{user.message}(q),
]

the runtime transitions:

[
\text{idle}
\rightarrow
\text{reasoning}.
]

The model evaluates:

[
(M_t,A_t)
=========

\operatorname{ModelStep}
(
C_t,
\mathcal{A}_v
).
]

Three major outcomes exist.

### Direct response

[
A_t=\varnothing
]

[
\Rightarrow
e_{t+1}
=======

\texttt{agent.message}(M_t).
]

### Built-in tool invocation

[
A_t
===

T_{native}(x_t)
]

[
\Rightarrow
o_t
===

\operatorname{SandboxExecute}
(
T_{native},
x_t
).
]

Then:

[
C_{t+1}
=======

\operatorname{UpdateContext}
(
C_t,A_t,o_t
)
]

and another reasoning step occurs.

### Custom tool invocation

[
A_t
===

T_{custom}(x_t)
]

cannot necessarily execute inside the managed runtime.

Instead:

[
\text{runtime}
\rightarrow
\texttt{agent.custom_tool_use}
\rightarrow
\text{client}
]

followed by:

[
o_t
===

T_{custom}^{client}(x_t)
]

and:

[
\text{client}
\rightarrow
\texttt{user.custom_tool_result}(o_t)
\rightarrow
\text{runtime}.
]

The runtime subsequently resumes reasoning.

The source architecture preserves exactly this boundary: native tools execute within the managed session, while externally implemented custom tools are dispatched through the client-side event loop.

Execution continues until the runtime has no immediately executable work:

[
A_t=\varnothing
\land
Q_t=\varnothing
]

yielding:

[
e_{t+1}
=======

\texttt{session.status_idle}.
]

The idle event is therefore a **runtime lifecycle signal**, not merely generated text.

---

# 9. Tool Execution Architecture

The tool system spans three execution domains:

[
\boxed{
T
=

T_{sandbox}
\cup
T_{external}
\cup
T_{protocol}
}
]

## 9.1 Sandbox-Native Tools

The managed toolset includes operations such as:

[
T_{sandbox}
===========

{
\text{shell},
\text{read},
\text{write},
\text{edit},
\text{glob},
\text{grep},
\text{web-search},
\text{web-fetch}
}.
]

These tools execute inside the session environment.

The execution path is:

[
\text{Model}
\rightarrow
\text{Tool Request}
\rightarrow
\text{Runtime Dispatcher}
\rightarrow
\text{Sandbox Tool}
\rightarrow
\text{Observation}
\rightarrow
\text{Model}.
]

The application does not manually perform the tool-result reinjection loop.

The quickstart implementation explicitly enables shell, file, web, and related built-in operations through one managed toolset configuration.

---

## 9.2 Application-Implemented Custom Tools

Custom tools maintain a different trust and execution boundary.

A tool is declared through a structured input schema:

[
T_j
===

(
n_j,
d_j,
\mathcal{J}_j
)
]

where:

* (n_j): tool name,
* (d_j): semantic description,
* (\mathcal{J}_j): JSON input schema.

When selected:

[
M
\rightarrow
\texttt{agent.custom_tool_use}
\rightarrow
\text{Application}.
]

The application executes the underlying operation and returns:

[
\texttt{user.custom_tool_result}.
]

Consequently:

[
\boxed{
\text{Managed reasoning loop}
\neq
\text{complete ownership of every side effect}
}
]

External business logic can remain inside the application security boundary.

---

## 9.3 External Tool Servers

External tool providers can be connected using the Model Context Protocol.

Conceptually:

[
\text{Agent}
\rightarrow
\text{Protocol Client}
\rightarrow
\text{Remote Tool Server}
\rightarrow
\text{External System}.
]

This decouples agent configuration from specific application process implementations and allows external services to expose:

[
{
\text{tools},
\text{resources},
\text{structured capabilities}
}
]

through a common interface.

Authentication material should remain distinct from reusable agent configuration. The migration architecture therefore separates server declaration from per-session credential provisioning.

---

# 10. Permission and Human-Control Boundary

Autonomous execution must be separable from execution authority.

For each tool (T_j), define:

[
\pi(T_j)
\in
{
\text{allow},
\text{deny},
\text{always-ask}
}.
]

For:

[
\pi(T_j)=\text{always-ask},
]

the runtime emits a pending action and requires a user-side confirmation event before execution.

Thus:

[
\text{Intent}
\not\Rightarrow
\text{Execution}
]

unless authorization succeeds:

[
\operatorname{Authorized}
(
T_j,x_j,\pi_j
)=1.
]

This creates a useful control hierarchy:

[
\boxed{
\text{Model proposes}
\rightarrow
\text{Policy evaluates}
\rightarrow
\text{Human/client optionally authorizes}
\rightarrow
\text{Runtime executes}
}
]

The migration model explicitly replaces broad process-level permission hooks with per-tool permission policies and confirmation events.

---

# 11. Persistent Context and Filesystem State

A stateful session maintains more than conversational messages.

Its effective state can be represented as:

[
\mathcal{S}_t
=============

(
H_t,F_t,O_t,R_t
).
]

### Conversation state

[
H_t
===

[e_0,e_1,\dots,e_t].
]

The event history is persisted server-side rather than reconstructed and resent by the application after every iteration.

### Filesystem state

[
F_t
===

{
f_1^{(t)},
f_2^{(t)},
\dots
}.
]

Generated code, intermediate analysis, downloaded data, reports, caches, and artifacts may therefore survive across multiple reasoning steps inside the session.

### Mounted resources

External files required by the task can be uploaded or attached as session resources:

[
R
=

{
r_1,r_2,\ldots,r_k
}.
]

This replaces assumptions that an agent can access arbitrary local application paths. Migration from process-local execution requires local file dependencies to be converted into explicit session resources.

This produces a cleaner execution invariant:

[
\boxed{
\text{Agent-visible data}
=========================

\text{session resources}
+
\text{sandbox state}
+
\text{authorized external tools}
}
]

rather than implicit access to the host application's filesystem.

---

# 12. Context Scaling: Caching and Compaction

Long-running agent sessions create a context-growth problem.

If every interaction and observation were retained verbatim:

[
L_t
===

L_0
+
\sum_{i=1}^{t}
(
L_i^{message}
+
L_i^{tool}
+
L_i^{observation}
).
]

Eventually:

[
L_t

>

L_{\max}.
]

A production agent runtime therefore requires context-management mechanisms such as prompt caching and compaction.

Conceptually:

[
C_t
===

\operatorname{Compact}
(
H_{\leq t},
F_t,
R_t
)
]

subject to:

[
|C_t|
\leq
L_{\max}.
]

The compaction problem is not arbitrary summarization. It must preserve execution-relevant invariants:

[
\mathcal{I}
===========

{
\text{task objectives},
\text{decisions},
\text{constraints},
\text{tool outputs},
\text{artifact locations},
\text{unresolved subproblems}
}.
]

Ideally:

[
\operatorname{Semantics}(C_t)
\approx
\operatorname{SemanticsRelevant}(H_{\leq t})
]

while:

[
|C_t|
\ll
|H_{\leq t}|.
]

Caching then avoids repeatedly recomputing stable prefixes:

[
C_t
===

C_{\text{stable}}
\oplus
C_{\text{dynamic},t}.
]

For multi-minute or multi-hour agents, these mechanisms become part of the execution architecture rather than optional token optimizations.

---

# 13. Steering and Interruption

Persistent execution introduces a capability absent from ordinary single-response inference: **mid-execution intervention**.

Suppose:

[
\mathcal{S}_t
=============

\text{actively executing task } q.
]

The application may inject:

[
e_{steer}
=========

\texttt{user.message}(q')
]

while the session remains active.

The runtime must integrate the new instruction into subsequent reasoning:

[
C_{t+1}
=======

\operatorname{Merge}
(
C_t,
q'
).
]

Thus the session behaves less like:

[
q
\rightarrow
f(q)
]

and more like a continuously steerable process:

[
q_0
\rightarrow
s_1
\rightarrow
s_2
\xrightarrow{q_1}
s_3
\rightarrow
s_4.
]

Interruption similarly creates an external control edge capable of modifying the current trajectory rather than requiring the original task to run to completion.

For long-duration autonomous computation, this distinction is operationally significant.

---

# 14. Scheduled Execution

The architecture also supports recurring agent execution through scheduled deployments.

Given an agent configuration (\mathcal{A}), environment (\mathcal{E}), and schedule (C):

[
D
=

(
\mathcal{A},
\mathcal{E},
C,
Q
)
]

where (Q) is the scheduled task.

For cron-like trigger times:

[
\tau_k
\in
C,
]

the platform performs:

[
\tau_k
\Rightarrow
\operatorname{CreateSession}
(
\mathcal{A},
\mathcal{E}
)
\rightarrow
\operatorname{Execute}(Q).
]

This extends the runtime from interactive agents into autonomous operational workers capable of:

[
{
\text{periodic analysis},
\text{repository maintenance},
\text{data processing},
\text{report generation},
\text{monitoring},
\text{scheduled research}
}.
]

Scheduled execution is therefore a lifecycle primitive rather than an application-maintained cron wrapper around repeated stateless model calls. The quickstart architecture exposes recurring scheduled deployments as a first-class next-stage capability.

---

# 15. Client/Application Boundary

Moving the central agent loop into managed infrastructure does **not** make the client trivial.

The resulting division of responsibility is:

| Runtime Responsibility       | Client Responsibility                      |
| ---------------------------- | ------------------------------------------ |
| Persistent transcript        | Product/UI state                           |
| Built-in tool execution      | Application-specific tool implementations  |
| Sandbox provisioning         | External business logic                    |
| Internal reasoning/tool loop | Tool-result handling for client-side tools |
| Event persistence            | Presentation/reduction of events           |
| Runtime lifecycle            | Application-level limits                   |
| Context compaction           | Product-specific transformations           |
| Built-in tool policies       | Additional authorization                   |
| Session execution            | Multi-session workflow composition         |

Several capabilities remain explicitly client-side:

### Turn budgets

If:

[
N_{turn}
\leq
N_{\max}
]

is required, the application counts and enforces this constraint.

### Planning workflows

A two-stage architecture may implement:

[
\mathcal{S}*{plan}
\rightarrow
P
\rightarrow
\mathcal{S}*{execute}.
]

Planning and execution can therefore be deliberately separated into distinct sessions.

### Output transformations

Client-side output styles or command abstractions operate before the user event is emitted or after the agent message is received.

### Custom tool hooks

Pre- and post-execution business logic is naturally implemented around custom-tool event handling.

These responsibilities are explicitly retained or moved into the client-side orchestration layer.

---

# 16. Front-End Integration Pattern

The session abstraction maps naturally to conversational application architecture.

A common mapping is:

[
\boxed{
\text{UI Thread}
\leftrightarrow
\text{Persistent Session}
}
]

The backend handler does not need to own the complete agent loop. Instead:

[
\text{Frontend}
\rightarrow
\text{Backend Adapter}
\rightarrow
\text{Session Events}.
]

Streaming events can then be reduced into interface state:

[
U_t
===

\operatorname{Reduce}
(
U_{t-1},
e_t
).
]

For example:

[
\texttt{agent.message}
\rightarrow
\text{message component},
]

[
\texttt{agent.tool_use}
\rightarrow
\text{tool activity component},
]

[
\texttt{tool confirmation}
\rightarrow
\text{authorization component},
]

[
\texttt{structured custom output}
\rightarrow
\text{interactive visualization}.
]

The supplied application examples use exactly this separation: the frontend renders the chat surface while the persistent server-side session stores the transcript, executes tools, and streams state changes back to the interface.

---

# 17. Visual Configuration and Development Workflow

A production-oriented agent platform benefits from separating **configuration iteration** from application implementation.

The development path is:

[
\boxed{
\text{Configure}
\rightarrow
\text{Test}
\rightarrow
\text{Observe Events}
\rightarrow
\text{Iterate}
\rightarrow
\text{Freeze Agent Version}
\rightarrow
\text{Reference from Application}
}
]

The visual configuration layer exposes:

[
{
\text{model},
\text{system prompt},
\text{external tool servers},
\text{native tools},
\text{skills}
}.
]

The important architectural property is parity between the visual configuration and API representation:

[
\text{Visual Agent Definition}
\equiv
\text{API Agent Definition}.
]

Configuration experimentation therefore does not create a second execution model.

Once validated:

[
(\text{agent_id},\text{environment_id})
]

become stable application dependencies.

An inline session runner further allows the actual event stream and tool behavior to be validated before production traffic reaches that configuration.

---

# 18. Operational Bootstrap

A minimal deployment requires three classes of prerequisites:

[
\boxed{
\text{Authentication}
+
\text{Client Runtime}
+
\text{Feature-Version Contract}
}
]

SDK support spans the major production implementation languages, including Python, TypeScript, Java, Go, C#, Ruby, and PHP, with an equivalent command-line interface for direct control-plane interaction.

Preview-stage API access requires an endpoint-specific version header:

[
\texttt{managed-agents-2026-04-01}
]

while the memory-store subsystem uses a distinct contract:

[
\texttt{agent-memory-2026-07-22}.
]

SDK clients insert the corresponding feature header automatically.

The distinction is technically relevant because the agent/session API surface and memory subsystem evolve independently.

---

# 19. Memory and Extended Stateful Capabilities

Persistent session state and reusable memory are distinct concepts.

Session state is scoped approximately as:

[
M_{session}
===========

f(\mathcal{S}_i).
]

Reusable memory can instead be treated as:

[
M_{persistent}
==============

f(\text{agent/user/application scope}).
]

A later session can therefore obtain:

[
C_0^{(j)}
=========

P
\oplus
R_j
\oplus
M_{persistent}
]

without requiring the complete history of an earlier session.

The architecture exposes the memory subsystem through a separately versioned API contract, indicating that durable reusable memory is treated as an independently evolving state layer rather than merely the transcript of a persistent conversation.

Experimental extensions such as persistent autonomous offline processing and tunneled external connectivity occupy a narrower research-preview boundary and should be treated separately from the stable agent/session execution core.

---

# 20. Migration from a Hand-Written Agent Loop

Consider the conventional implementation:

[
H_0=[q]
]

and:

[
\textbf{while } \neg done:
]

[
y_t=M(H_t,T)
]

[
H_t
\leftarrow
H_t\oplus y_t
]

[
\textbf{if }y_t\text{ requests }T_j:
]

[
o_t=T_j(x_t)
]

[
H_{t+1}
=======

H_t
\oplus
o_t.
]

The application explicitly owns:

[
{
\text{history},
\text{model invocation},
\text{tool dispatch},
\text{tool-result reinsertion},
\text{sandbox},
\text{termination}
}.
]

After migration:

[
\operatorname{CreateSession}
(
\mathcal{A}_v,
\mathcal{E}
)
]

[
\operatorname{OpenEventStream}()
]

[
\operatorname{Send}
(
\texttt{user.message}(q)
)
]

[
\textbf{until }\texttt{session.status_idle}:
\quad
\operatorname{ConsumeEvent}().
]

The principal ownership changes are:

[
\boxed{
\begin{aligned}
\text{conversation history}
&:
\text{client}
\rightarrow
\text{session}
\
\text{native tool dispatch}
&:
\text{client}
\rightarrow
\text{runtime}
\
\text{sandbox lifecycle}
&:
\text{client}
\rightarrow
\text{environment/session}
\
\text{loop termination}
&:
\text{client condition}
\rightarrow
\text{runtime lifecycle event}.
\end{aligned}
}
]

These are the central migration semantics documented by the source system.

---

# 21. Migration from a Process-Local Agent SDK

Migration from an existing process-local agent framework is subtler because many conceptual abstractions already exist.

The principal transformation is:

[
\boxed{
\text{Local Agent Runtime}
\rightarrow
\text{Remote Persistent Agent Runtime}
}
]

The mapping is approximately:

| Process-Local Agent Runtime                         | Managed Runtime                                    |
| --------------------------------------------------- | -------------------------------------------------- |
| Agent options constructed per execution             | Persistent versioned agent definition              |
| SDK process owns runtime                            | Session owns runtime                               |
| Decorated tools dispatched locally                  | Custom tool events dispatched to client            |
| Native tools operate on local filesystem            | Native tools operate in sandbox workspace          |
| Local working directories                           | Explicit mounted resources                         |
| Local instruction hierarchy                         | Versioned agent system instruction                 |
| External tool configuration + credentials colocated | Tool declaration and session credentials separated |
| Process permission callbacks                        | Per-tool policies + confirmation events            |

The source specifies the same transformation, including persistent agent versions, mounted resources, sandbox workspace execution, separate credential handling, and policy-driven confirmation.

This has a significant production implication:

[
\boxed{
\text{Execution topology becomes remotely addressable and versioned}
}
]

rather than existing only for the lifetime of the application process.

---

# 22. Versioning, Promotion, and Rollback

Persistent agent configuration enables explicit release semantics.

Let:

[
\mathcal{A}_{v_1}
]

be the current production agent.

A configuration change produces:

[
\mathcal{A}*{v_1}
\xrightarrow{\Delta}
\mathcal{A}*{v_2}.
]

New sessions can then be created against (v_2):

[
\mathcal{S}*{new}
\mapsto
\mathcal{A}*{v_2},
]

while rollback consists of repinning to:

[
\mathcal{A}_{v_1}.
]

This avoids requiring an application binary deployment solely to change model, prompt, tool, or agent configuration.

The migration model specifically notes that versioned agent definitions can be pinned for promotion or rollback independently of application deployment.

Some model-level request mechanics are also absorbed by the runtime. Parameters that traditionally belonged directly to individual generation calls may no longer be exposed at the agent-definition layer, because the runtime mediates model-specific differences.

---

# 23. Deployment Suitability

The architecture is particularly appropriate when task execution satisfies one or more of:

[
T_{execution}
\gg
T_{single-inference}
]

[
N_{tools}
\gg
1
]

[
|F_{state}|

>

0
]

[
N_{turns}
\gg
1
]

or when:

[
\text{task}
===========

\text{scheduled autonomous computation}.
]

Representative requirements include:

* multi-minute or multi-hour tasks,
* repeated shell or code execution,
* persistent intermediate files,
* iterative web research,
* external tool-server integration,
* long-lived session history,
* scheduled execution,
* self-hosted execution for infrastructure-control requirements,
* applications where implementing a separate sandbox and tool-execution layer is undesirable.

Conversely, direct model interfaces remain preferable when the application requires complete control over:

[
{
\text{model-call boundaries},
\text{context construction},
\text{tool scheduler},
\text{reasoning loop},
\text{termination},
\text{latency-critical request execution}
}.
]

The choice is therefore not:

[
\text{simple API}
<
\text{managed agent},
]

but rather:

[
\boxed{
\text{custom orchestration}
\quad\text{versus}\quad
\text{managed orchestration}
}
]

under different control, state, infrastructure, and latency requirements.

---

# 24. Data Retention and Compliance Boundary

The system is stateful by construction.

Its utility depends on persistence of:

[
{
H_t,
F_t,
O_t,
\text{session metadata}
}.
]

That design has direct compliance consequences.

A zero-retention execution mode is incompatible with a runtime whose fundamental abstraction requires server-side preservation of conversation state and sandbox outputs across execution pauses.

Similarly, stateful session storage may place the managed runtime outside compliance programs that are available to stateless inference endpoints.

Data lifecycle therefore becomes an architectural dimension:

[
\boxed{
\text{Execution Persistence}
\leftrightarrow
\text{Retention/Compliance Constraint}
}
]

rather than an incidental API setting.

The runtime exposes explicit deletion operations for sessions and separately uploaded files, so state destruction must account for both:

[
D
=

D_{session}
\cup
D_{uploaded-files}.
]

A production deployment should therefore define:

[
\text{RetentionPolicy}
======================

(
TTL_{session},
TTL_{file},
DeletionWorkflow,
AuditPolicy
).
]

Rate limits and product-level branding constraints constitute additional operational contracts and must be treated as deployment constraints rather than agent reasoning behavior.

---

# 25. Preview-Stage Operational Boundary

The agent execution API is currently exposed through a versioned preview contract rather than an immutable generally available interface.

Consequently:

[
\mathcal{B}*{t+1}
\neq
\mathcal{B}*{t}
]

is possible for:

* endpoint behavior,
* session semantics,
* event definitions,
* runtime optimizations,
* tool behavior,
* experimental subsystems.

Production systems should therefore pin:

[
V_{API}
]

and explicitly validate:

[
\mathcal{A}*{v}
\times
\mathcal{E}*{v}
\times
V_{API}
]

before promoting agent configurations.

More experimental subsystems—including tunneled protocol connectivity and autonomous offline state-development mechanisms—belong to a narrower research-preview surface and should not be conflated with the core session execution contract.

---

# 26. Complete End-to-End Execution Flow

The complete system can be represented as:

[
\boxed{
\begin{aligned}
&
\textbf{1. Define Agent}
\
&
\mathcal{A}_v
=============

(
M,
P,
T,
R,
K
)
[4pt]
&
\downarrow
\
&
\textbf{2. Define Execution Environment}
\
&
\mathcal{E}
===========

(
Runtime,
Filesystem,
Network,
Isolation
)
[4pt]
&
\downarrow
\
&
\textbf{3. Create Session}
\
&
\mathcal{S}_0
=============

\operatorname{Instantiate}
(
\mathcal{A}_v,
\mathcal{E},
Resources,
Credentials
)
[4pt]
&
\downarrow
\
&
\textbf{4. Open Persistent Event Stream}
\
&
X
=

\operatorname{Stream}
(
\mathcal{S}_0
)
[4pt]
&
\downarrow
\
&
\textbf{5. Inject User Event}
\
&
e_0
===

\texttt{user.message}(q)
[4pt]
&
\downarrow
\
&
\textbf{6. Build Effective Runtime Context}
\
&
C_0
===

P
\oplus
H_0
\oplus
Resources
\oplus
Skills
\oplus
Memory
[4pt]
&
\downarrow
\
&
\textbf{7. Model Reasoning Step}
\
&
(y_t,a_t)
=========

M(C_t)
[4pt]
&
\downarrow
\
&
\begin{cases}
a_t=\varnothing
&
\rightarrow
\texttt{agent.message}
\
a_t\in T_{sandbox}
&
\rightarrow
\text{sandbox execution}
\
a_t\in T_{external}
&
\rightarrow
\text{external protocol execution}
\
a_t\in T_{custom}
&
\rightarrow
\texttt{agent.custom_tool_use}
\end{cases}
[6pt]
&
\downarrow
\
&
\textbf{8. Acquire Observation}
\
&
o_t
===

\operatorname{Execute}
(
a_t
)
[4pt]
&
\downarrow
\
&
\textbf{9. Persist State}
\
&
H_{t+1}
=======

H_t
\oplus
a_t
\oplus
o_t
\
&
F_{t+1}
=======

\operatorname{UpdateFilesystem}
(
F_t,a_t
)
[4pt]
&
\downarrow
\
&
\textbf{10. Context Optimization}
\
&
C_{t+1}
=======

\operatorname{CacheCompact}
(
H_{t+1},
F_{t+1}
)
[4pt]
&
\downarrow
\
&
\textbf{11. Continue Autonomous Loop}
\
&
(y_{t+1},a_{t+1})
=================

M(C_{t+1})
[4pt]
&
\downarrow
\
&
\textbf{12. Optional Steering / Confirmation / Interruption}
\
&
e_{control}
\rightarrow
\mathcal{S}*{t+1}
[4pt]
&
\downarrow
\
&
\textbf{13. Quiescence}
\
&
Q_t=\varnothing
\Rightarrow
\texttt{session.status_idle}
[4pt]
&
\downarrow
\
&
\textbf{14. Persisted Session}
\
&
\mathcal{S}*{final}
===================

(
H,
F,
O,
Status
).
\end{aligned}
}
]

The implementation-level quickstart reduces this same execution into five runtime operations: provision sandbox, run the agent loop, execute tools, stream events, and emit an idle lifecycle state.

---

# 27. Architectural Interpretation

The central architectural transition is:

[
\boxed{
\text{Model-as-an-API}
\rightarrow
\text{Agent-as-a-Persistent-Execution-Process}
}
]

A conventional model request primarily provides:

[
f:
\text{context}
\rightarrow
\text{output}.
]

A managed agent runtime instead approximates:

[
F:
(
\text{task},
\text{state},
\text{tools},
\text{environment},
\text{events}
)
\rightarrow
(
\text{evolving state},
\text{actions},
\text{artifacts},
\text{outputs}
).
]

The important system primitive is therefore no longer the individual inference call.

It is:

[
\boxed{
\textbf{the session}
}
]

because the session binds:

[
\text{Agent Configuration}
+
\text{Runtime Environment}
+
\text{Execution State}
+
\text{Filesystem}
+
\text{Tool Loop}
+
\text{Event History}
+
\text{Outputs}
+
\text{Lifecycle}.
]

This design converts agent construction from repeated application-side orchestration into a reusable execution substrate while preserving explicit boundaries for custom business logic, external tools, authorization, client-side workflow composition, and environment control.

At the systems level, the resulting stack is:

[
\boxed{
\begin{array}{c}
\text{Application / User Interface}
\
\updownarrow
\
\text{Event Protocol}
\
\updownarrow
\
\text{Persistent Session Runtime}
\
\updownarrow
\
\text{Agent Reasoning + Context Management}
\
\updownarrow
\
\text{Tool Dispatcher}
\
\swarrow\qquad\downarrow\qquad\searrow
\
\text{Sandbox Tools}
\quad
\text{External Tool Servers}
\quad
\text{Client Tools}
\
\downarrow
\
\text{Execution Environment + Persistent State}
\end{array}
}
]

That is the essential architecture of a modern managed agent execution system: **a versioned intelligence configuration executed inside a controlled environment, instantiated as a persistent session, driven and observed through an event protocol, and capable of autonomously iterating across model reasoning, tool execution, persistent state, and external intervention until the runtime reaches quiescence.**
