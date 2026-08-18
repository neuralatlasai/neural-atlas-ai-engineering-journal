# Define Your Agent  
## Control-Plane Specification for a Versioned Agent Runtime

### Abstract

An agent definition is not a prompt wrapper and not a session. It is the **versioned control-plane specification from which sessions are instantiated**.

The object determines the model execution policy, persistent system instruction, executable capability surface, external service topology, domain-specific skill resources, delegation graph, authorization defaults, descriptive metadata, and configuration version used by future sessions.

Formally:

\[
\boxed{
\mathcal A_v
=
(
I,
M,
P,
T,
R,
K,
G,
D,
\mu
)_v
}
\]

where

\[
\begin{aligned}
I &:= \text{agent identity},\\
M &:= \text{model execution configuration},\\
P &:= \text{persistent system instruction},\\
T &:= \text{tool capability specification},\\
R &:= \text{external protocol/server declarations},\\
K &:= \text{skills and procedural context},\\
G &:= \text{delegation topology},\\
D &:= \text{human-readable description},\\
\mu &:= \text{application metadata},\\
v &:= \text{immutable configuration version}.
\end{aligned}
\]

The crucial architectural distinction is:

\[
\boxed{
\text{Agent Definition}
\neq
\text{Running Agent}
}
\]

The agent definition is reusable configuration. A session is a runtime instantiation of that configuration.

\[
\mathcal A_v
\xrightarrow{\operatorname{Instantiate}}
\mathcal S_i
\]

and therefore:

\[
\mathcal A_v
\rightarrow
\{
\mathcal S_1,
\mathcal S_2,
\dots,
\mathcal S_N
\}.
\]

The source API explicitly models the agent as a reusable, versioned resource referenced by identifier across multiple sessions.

This separation is what makes configuration versioning, controlled rollout, rollback, capability auditing, infrastructure policy, session-specific overrides, and multi-session consistency possible.

---

# 1. Architectural Objective

The purpose of the agent-definition layer is to convert an otherwise loosely assembled collection of runtime parameters into a stable executable specification.

Without a persistent agent object, an application effectively constructs:

\[
C_i
=
(
M_i,
P_i,
T_i,
R_i,
K_i,
\dots
)
\]

for every execution \(i\).

This permits uncontrolled configuration drift:

\[
C_i \neq C_j
\]

even when:

\[
\operatorname{TaskClass}(i)
=
\operatorname{TaskClass}(j).
\]

A persistent agent instead establishes:

\[
\boxed{
\mathcal A_v
=
\text{canonical reusable execution policy}
}
\]

and sessions reference:

\[
\mathcal S_i
=
\operatorname{Session}
(
\mathcal A_v,
\mathcal E_j,
\Omega_i
)
\]

where:

- \(\mathcal E_j\) is the execution environment,
- \(\Omega_i\) contains permitted session-specific configuration.

This produces a clean separation:

\[
\boxed{
\underbrace{\mathcal A_v}_{\text{what should execute}}
+
\underbrace{\mathcal E}_{\text{where it can execute}}
+
\underbrace{\mathcal S_i}_{\text{one concrete execution}}
}
\]

The agent layer therefore belongs to the **control plane**, not the execution plane.

---

# 2. Canonical Agent Object

The externally visible agent schema consists of:

\[
\boxed{
\begin{aligned}
\mathcal A_v =
\{&
\texttt{name},
\texttt{model},
\texttt{system},
\texttt{tools},
\texttt{mcp\_servers},
\\
&
\texttt{skills},
\texttt{multiagent},
\texttt{description},
\texttt{metadata}
\}
\end{aligned}
}
\]

with platform-generated state:

\[
\{
\texttt{id},
\texttt{type},
\texttt{version},
\texttt{created\_at},
\texttt{updated\_at},
\texttt{archived\_at}
\}.
\]

The configuration fields and their respective responsibilities are explicitly separated by the API rather than collapsed into a single prompt.

A useful decomposition is:

\[
\mathcal A_v
=
\mathcal I
\cup
\mathcal M
\cup
\mathcal B
\cup
\mathcal C
\cup
\mathcal O
\]

where:

### Identity

\[
\mathcal I
=
\{
\texttt{id},
\texttt{name},
\texttt{description},
\texttt{metadata}
\}
\]

### Model policy

\[
\mathcal M
=
\{
\texttt{model.id},
\texttt{model.speed},
\texttt{model.effort},
\texttt{model.inference\_geo}
\}
\]

### Behavioral policy

\[
\mathcal B
=
\{
\texttt{system},
\texttt{skills}
\}
\]

### Capability policy

\[
\mathcal C
=
\{
\texttt{tools},
\texttt{mcp\_servers},
\texttt{multiagent}
\}
\]

### Operational version state

\[
\mathcal O
=
\{
\texttt{version},
\texttt{created\_at},
\texttt{updated\_at},
\texttt{archived\_at}
\}.
\]

These are semantically different dimensions. Treating them as one undifferentiated “agent prompt” destroys the architecture.

---

# 3. Agent Identity Is Separate from Agent Version

Agent identity and agent version solve different problems.

Let:

\[
a
=
\texttt{agent\_id}
\]

identify the logical resource.

The resource evolves as:

\[
\mathcal A_{a,1}
\rightarrow
\mathcal A_{a,2}
\rightarrow
\dots
\rightarrow
\mathcal A_{a,v}.
\]

Thus:

\[
\boxed{
a=\text{stable logical identity}
}
\]

while:

\[
\boxed{
v=\text{configuration snapshot}
}
\]

The initial creation begins at:

\[
v=1.
\]

A configuration-changing update produces:

\[
v_{t+1}=v_t+1.
\]

The create response explicitly materializes the identifier, version, timestamps, archive state, normalized model configuration, and effective tool defaults.

This model enables two distinct references:

\[
\operatorname{Agent}(a)
\]

and conceptually:

\[
\operatorname{Agent}(a,v).
\]

This distinction becomes critical once delegation, rollout, reproducibility, and concurrent configuration updates are introduced.

---

# 4. The Model Field Is an Execution Policy Object

The `model` field is required.

It may be represented minimally as:

\[
M=\texttt{model\_id}
\]

or through the richer form:

\[
\boxed{
M
=
(
id,
speed,
effort,
inference\_geo
)
}
\]

The richer object controls dimensions that should not be conflated.

---

# 5. Model Identity

The model identifier selects the inference model:

\[
M.id=m.
\]

This is the highest-level computational choice because all downstream reasoning occurs under:

\[
p_\theta
(
y_t
\mid
C_t,
T,
K
).
\]

Changing \(m\) can alter:

\[
\{
\text{reasoning capability},
\text{tool selection},
\text{latency},
\text{cost},
\text{context behavior},
\text{supported runtime features}
\}.
\]

Accordingly, a model migration is an agent configuration update rather than necessarily an application-code deployment.

---

# 6. Speed Policy

Where supported, model execution can carry a speed policy:

\[
M.speed
\in
\{
\text{standard},
\text{fast}
\}.
\]

Conceptually:

\[
M
=
(id,speed).
\]

This belongs on the persistent agent because it changes the runtime operating point of every session instantiated from that agent unless overridden.

The returned agent object normalizes omitted model settings and exposes the effective model configuration rather than only echoing the abbreviated input.

---

# 7. Effort Policy

Model effort is another independent execution control:

\[
M.effort
\in
\{
low,
medium,
high,
xhigh,
max
\}.
\]

The API accepts either a level:

\[
\texttt{"effort":"high"}
\]

or an equivalent structured representation.

The important systems interpretation is:

\[
\boxed{
\text{effort is persistent model configuration}
}
\]

rather than a property of the user message.

In abstract form:

\[
\text{compute allocation}
=
f(
M,
effort,
C_t
).
\]

It therefore belongs to the agent's model policy.

---

# 8. Inference Geography Is a Runtime Compliance Constraint

The model object may also contain:

\[
M.inference\_geo
\in
\{
us,
global
\}.
\]

If omitted:

\[
M.inference\_geo
=
\text{workspace execution default at serving time}.
\]

If explicitly pinned:

\[
M.inference\_geo=g,
\]

then the pin is checked:

\[
\boxed{
\text{when agent is saved}
}
\]

\[
\boxed{
\text{when a session is created}
}
\]

and:

\[
\boxed{
\text{on every served turn}.
}
\]

If the workspace policy changes such that:

\[
g
\notin
G_{allowed},
\]

then:

\[
\operatorname{CreateSession}(\mathcal A_v)
\rightarrow
\text{rejected}
\]

and even an existing running session may refuse further turns.

This is stronger than creation-time validation.

The effective invariant is:

\[
\boxed{
M.inference\_geo
\in
G_{allowed}(t)
\qquad
\forall \text{ served turns }t
}
\]

not merely:

\[
M.inference\_geo
\in
G_{allowed}(t_0).
\]

Unsupported geography/model combinations produce validation failure rather than silently falling back to another region.

---

# 9. Geography Consistency Under Delegation

Where delegation is configured, geography introduces a graph-wide constraint.

For coordinator \(A_c\) and delegate agents:

\[
A_1,A_2,\dots,A_n,
\]

the configuration requires either:

\[
g_c=g_1=\dots=g_n
\]

or:

\[
g_c=g_1=\dots=g_n=\varnothing.
\]

Mixed geographic policies are invalid.

This means inference geography is not purely local agent metadata once an execution graph exists.

It becomes:

\[
\boxed{
\text{a graph invariant}
}
\]

over the delegation topology.

---

# 10. System Instruction Is Persistent Behavioral State

The `system` field defines the persistent behavioral instruction of the agent.

Let:

\[
P=\texttt{system}.
\]

For session turn \(t\):

\[
C_t
=
P
\oplus
U_{\leq t}
\oplus
O_{\leq t}
\oplus
K
\oplus
R_t.
\]

The system instruction and user instruction are intentionally distinct.

\[
\boxed{
P=\text{persistent execution behavior}
}
\]

while:

\[
\boxed{
U_t=\text{task-specific work request}
}
\]

The API explicitly separates system behavior/persona from user messages describing the work to perform.

This prevents the anti-pattern:

\[
\text{redeclare full agent behavior in every user event}.
\]

The intended hierarchy is:

\[
\text{Agent Configuration}
\supset
\text{Persistent Behavior}
\]

followed by:

\[
\text{Session}
\supset
\text{Task Events}.
\]

---

# 11. Capabilities Are Not Defined by Prompt Text

The statement:

> “You can execute shell commands”

does not grant shell execution.

The actual capability set is:

\[
\boxed{
\mathcal C(\mathcal A)
=
T_{enabled}
\cup
R_{enabled}
\cup
G_{delegates}
}
\]

not whatever the system prompt claims.

Thus:

\[
P
\neq
\text{authority}.
\]

The effective execution condition for a capability \(c\) is closer to:

\[
\operatorname{Executable}(c)
=
\operatorname{Declared}(c)
\land
\operatorname{Enabled}(c)
\land
\operatorname{Authorized}(c)
\land
\operatorname{Reachable}(c).
\]

This distinction is fundamental.

---

# 12. Tool Capability Taxonomy

The agent's `tools` array may contain three fundamentally different classes:

\[
\boxed{
T
=
T_{native}
\cup
T_{custom}
\cup
T_{mcp}.
}
\]

They share the same high-level model tool-selection interface but differ substantially in execution ownership.

---

# 13. Built-In Toolset

The built-in tool surface contains:

\[
T_{native}
=
\{
bash,
read,
write,
edit,
glob,
grep,
web\_fetch,
web\_search
\}.
\]

Specifically:

\[
\begin{aligned}
bash &: \text{shell execution},\\
read &: \text{sandbox file read},\\
write &: \text{sandbox file creation},\\
edit &: \text{string replacement in files},\\
glob &: \text{filesystem pattern enumeration},\\
grep &: \text{regex text search},\\
web\_fetch &: \text{URL retrieval},\\
web\_search &: \text{web discovery}.
\end{aligned}
\]

All tools in the prebuilt set are enabled when the complete toolset is attached unless configuration narrows the set.

This means:

\[
T_{native}^{default}
=
T_{native}^{all}.
\]

That is an important security default.

---

# 14. Capability Enablement and Permission Are Orthogonal

For tool \(t\), two independent controls exist:

\[
enabled(t)
\in
\{0,1\}
\]

and:

\[
permission(t)
\in
\{
always\_allow,
always\_ask
\}.
\]

Therefore:

\[
enabled(t)=0
\]

means:

\[
t\notin\mathcal C(\mathcal A).
\]

But:

\[
enabled(t)=1,
\quad
permission(t)=always\_ask
\]

means:

\[
t\in\mathcal C(\mathcal A)
\]

while execution requires authorization.

The source API explicitly distinguishes tool removal from execution approval policy.

This gives the state matrix:

| Enabled | Permission | Result |
|---|---|---|
| 0 | any | tool unavailable |
| 1 | `always_allow` | automatic execution |
| 1 | `always_ask` | execution blocks for confirmation |

Capability and authorization must never be treated as the same policy.

---

# 15. Toolset Configuration Precedence

A toolset has:

\[
T_{config}
=
(
default\_config,
configs
).
\]

The baseline is:

\[
c_t
=
default\_config.
\]

An entry in `configs` then overrides that baseline for a named tool:

\[
c_t'
=
\operatorname{Override}
(
default\_config,
configs[t]
).
\]

This provides two common strategies.

### Deny-list strategy

Start with all tools enabled:

\[
default.enabled=1
\]

then:

\[
enabled(web\_fetch)=0.
\]

### Allow-list strategy

Start with:

\[
default.enabled=0
\]

then explicitly enable:

\[
\{
bash,
read,
write
\}.
\]

The source supports both patterns through `default_config` plus per-tool `configs`.

From an audit perspective, allow-listing yields a more stable capability surface when the underlying toolset can evolve.

---

# 16. Large Tool Output Is Externalized to the Sandbox

Tool output handling itself contains a context-management policy.

For output \(o_t\):

\[
|o_t|
\leq
100{,}000\text{ characters}
\]

permits normal propagation.

For:

\[
|o_t|
>
100{,}000,
\]

the runtime performs approximately:

\[
o_t
\rightarrow
f_t
\]

where \(f_t\) is written into the sandbox.

The model receives:

\[
preview(o_t)
+
path(f_t)
\]

rather than the complete result inline.

This prevents:

\[
\text{large tool result}
\rightarrow
\text{immediate context explosion}.
\]

The model may subsequently inspect the persisted file selectively.

---

# 17. Custom Tools Are Client-Executed Contracts

A custom tool is not executable code embedded in the agent object.

It is a contract:

\[
\boxed{
T_j
=
(
name_j,
description_j,
schema_j
)
}
\]

where:

\[
schema_j
=
\text{structured input contract}.
\]

The model performs:

\[
a_t
=
T_j(x_t)
\]

only in the sense of generating a structured invocation request.

The actual execution path is:

\[
\boxed{
\text{Model}
\rightarrow
\text{Custom Tool Request}
\rightarrow
\text{Client}
\rightarrow
\text{External Operation}
\rightarrow
\text{Tool Result}
\rightarrow
\text{Session}
}
\]

The model itself does not execute the client-defined operation.

Therefore:

\[
\boxed{
\text{custom tool definition}
\neq
\text{custom tool implementation}
}
\]

This is one of the most important ownership boundaries in the entire agent schema.

---

# 18. Custom Tool Selection Is a Semantic Routing Problem

Suppose the agent has:

\[
T
=
\{T_1,T_2,\ldots,T_n\}.
\]

At reasoning step \(t\), the model effectively performs:

\[
j^*
=
\arg\max_j
P
(
T_j
\mid
C_t,
name_j,
description_j,
schema_j
).
\]

Therefore tool descriptions participate directly in tool routing.

Poor descriptions increase:

\[
P(T_j\mid C_t)
\]

for incorrect \(j\), producing:

- false-positive tool selection,
- false-negative selection,
- wrong parameter construction,
- unnecessary calls,
- routing ambiguity.

The source explicitly identifies detailed descriptions as the dominant factor in custom tool performance and recommends explaining what the tool does, when to use it, when not to use it, parameter semantics, caveats, and limitations.

---

# 19. Tool Surface Entropy

Creating too many narrowly overlapping tools increases routing entropy.

Let:

\[
H(T\mid C)
=
-\sum_j
P(T_j\mid C)
\log P(T_j\mid C).
\]

If multiple tools have nearly identical semantics:

\[
T_1\approx T_2\approx T_3,
\]

selection ambiguity increases.

A lower-entropy representation may consolidate:

\[
\{
create\_pr,
review\_pr,
merge\_pr
\}
\]

into:

\[
github\_pr(action,\dots).
\]

The source explicitly recommends fewer related capability objects rather than one nearly redundant tool per operation.

---

# 20. Tool Names Are Part of the Routing Interface

Tool naming should encode semantic namespace.

For example:

\[
db\_query
\]

versus:

\[
storage\_read.
\]

The name contributes to the model's tool-selection representation:

\[
z_j
=
f(
name_j,
description_j,
schema_j
).
\]

Ambiguous global names increase collision probability as:

\[
|T|
\uparrow.
\]

Meaningful namespacing therefore improves discriminability across large tool libraries.

---

# 21. Tool Output Should Optimize Information Density

Custom tool responses should not expose arbitrary backend payloads.

Let:

\[
I(o;D)
\]

represent information in tool output \(o\) relevant to the agent's next decision \(D\).

An effective output maximizes approximately:

\[
\frac{I(o;D)}{|o|}.
\]

The recommended design is therefore:

\[
\boxed{
\text{high-signal fields}
+
\text{stable semantic identifiers}
-
\text{irrelevant backend state}.
}
\]

Stable identifiers such as slugs and universally unique identifiers are preferable to opaque transient implementation references. Bloated output consumes context while degrading extraction quality.

---

# 22. External Protocol Servers Are Declared, Not Authenticated, at Agent Creation

External standardized tool providers introduce a deliberate two-phase configuration.

At agent-definition time:

\[
R
=
\{
(name_i,url_i)
\}.
\]

At session creation:

\[
V
=
\{
vault\_id_1,\ldots,vault\_id_k
\}.
\]

Therefore:

\[
\boxed{
\text{Agent}
=
\text{connectivity declaration}
}
\]

while:

\[
\boxed{
\text{Session}
=
\text{credential binding}
}
\]

The configuration intentionally keeps credentials outside reusable agent definitions.

This is the correct secret-management boundary:

\[
\mathcal A_v
\not\supset
secrets.
\]

---

# 23. External Server Declaration Schema

Each server declaration is:

\[
R_i
=
(
type_i,
name_i,
url_i
).
\]

Current constraints include:

\[
type_i=\texttt{"url"}
\]

\[
1
\leq
|name_i|
\leq
255
\]

and:

\[
|url_i|
\leq
2048.
\]

Within one agent:

\[
name_i\neq name_j
\qquad
\forall i\neq j.
\]

The agent may declare at most:

\[
|R|\leq20
\]

external protocol servers.

---

# 24. Server Declarations and Toolsets Form a Referential Integrity Constraint

Declaring an external server alone does not expose its tools.

For every:

\[
r_i\in mcp\_servers,
\]

there must exist:

\[
t_j\in tools
\]

such that:

\[
t_j.type=mcp\_toolset
\]

and:

\[
t_j.mcp\_server\_name=r_i.name.
\]

Conversely:

\[
\forall t_j\in T_{mcp},
\exists r_i\in R:
t_j.server=r_i.name.
\]

Thus:

\[
\boxed{
R
\leftrightarrow
T_{mcp}
}
\]

has bidirectional referential integrity.

Unreferenced server declarations and dangling toolsets are rejected.

---

# 25. External Tool Exposure Is Independently Filterable

An external server may expose:

\[
T_r
=
\{
t_1,t_2,\ldots,t_n
\}.
\]

The agent need not expose all of them.

Using:

\[
default.enabled=0
\]

and:

\[
configs
=
\{
t_2:1,
t_5:1,
t_9:1
\},
\]

the effective tool set becomes:

\[
T_r^{effective}
=
\{
t_2,t_5,t_9
\}.
\]

This is particularly important when the external server can independently add capabilities over time.

If all newly added tools were automatically usable:

\[
T_r(t+1)
\supset
T_r(t)
\]

could silently expand agent authority.

Allow-list configuration stabilizes the effective surface:

\[
T_r^{effective}(t+1)
=
T_r^{effective}(t)
\]

until explicitly reviewed. The source explicitly presents this as a reason to default-disable external tools and opt specific operations in.

---

# 26. External Tool Authentication Matching

At session creation:

\[
vault\_ids
=
[v_1,\ldots,v_n]
\]

supply credential collections.

Credentials are matched to server declarations by normalized URL.

Normalization includes:

\[
scheme\rightarrow lowercase
\]

\[
host\rightarrow lowercase
\]

\[
default\ port\rightarrow removed
\]

\[
trailing\ slash\rightarrow removed.
\]

Therefore:

\[
https://EXAMPLE.com:443/
\]

can match:

\[
https://example.com.
\]

But changes to:

\[
path,
subdomain,
nondefault\ port
\]

are semantically distinct for matching.

If no credential matches:

\[
\boxed{
\text{connection is attempted unauthenticated}
}
\]

rather than session creation necessarily failing.

---

# 27. Session Creation Does Not Guarantee External Tool Availability

This is a major runtime invariant.

\[
\operatorname{CreateSession}=success
\]

does **not** imply:

\[
\operatorname{ExternalServerConnected}=true.
\]

Connectivity and authentication are not fully validated synchronously during session creation.

If the server is unreachable or rejects credentials:

\[
\mathcal S
\]

may still exist and remain interactive.

Instead, the runtime emits an asynchronous error event such as:

\[
mcp\_connection\_failed\_error
\]

or:

\[
mcp\_authentication\_failed\_error.
\]

The error includes the affected server identity and retry state.

Therefore a production client must not infer:

\[
session\ created
\Rightarrow
all\ capabilities\ healthy.
\]

The correct invariant is:

\[
\boxed{
\text{session health}
\neq
\text{external capability health}
}
\]

---

# 28. External Connectivity Recovery

A failed external connection does not necessarily permanently remove the capability for the lifetime of the session.

The runtime retries connectivity when the session transitions:

\[
status\_idle
\rightarrow
status\_running.
\]

Thus external connectivity follows a recoverable partial-failure model.

The application may choose to:

\[
\{
\text{continue degraded},
\text{block workflow},
\text{rotate credentials},
\text{retry later}
\}.
\]

This decision belongs above the agent definition.

---

# 29. Permission Policy Is an Execution Gate

Server-executed tools support:

\[
\Pi
=
\{
always\_allow,
always\_ask
\}.
\]

For:

\[
\pi(t)=always\_allow
\]

the transition is:

\[
\text{tool request}
\rightarrow
\text{execution}.
\]

For:

\[
\pi(t)=always\_ask
\]

the transition becomes:

\[
\text{tool request}
\rightarrow
\text{blocked state}
\rightarrow
\text{authorization}
\rightarrow
\text{execution or denial}.
\]

Native tools default to:

\[
always\_allow.
\]

External protocol toolsets default to:

\[
always\_ask.
\]

These defaults are intentionally different.

---

# 30. Permission Policy Snapshot Semantics

Permission policy is part of the agent configuration used when the session starts.

Suppose:

\[
\mathcal S_i
=
\operatorname{Instantiate}(\mathcal A_v).
\]

Then changing the agent later:

\[
\mathcal A_v
\rightarrow
\mathcal A_{v+1}
\]

does not mutate the running session's tool policy:

\[
Policy(\mathcal S_i)
=
Policy(\mathcal A_v).
\]

Updates apply to newly created sessions.

This is a snapshot invariant:

\[
\boxed{
\text{running session configuration is not a live pointer to mutable agent state}
}
\]

for these tool settings.

---

# 31. Human Authorization Is a Runtime State Transition

When an `always_ask` tool is selected, the execution sequence is:

\[
\boxed{
\begin{aligned}
&
\text{tool selected}
\\
&\downarrow\\
&
agent.tool\_use
\;\text{or}\;
agent.mcp\_tool\_use
\\
&\downarrow\\
&
session.status\_idle
\\
&
stop\_reason.type=requires\_action
\\
&\downarrow\\
&
user.tool\_confirmation
\\
&\downarrow\\
&
allow\;|\;deny
\\
&\downarrow\\
&
session.status\_running
\end{aligned}
}
\]

The idle event carries:

\[
stop\_reason.event\_ids
\]

for the blocked tool calls.

The runtime waits indefinitely until every blocking action has a corresponding confirmation.

This is not a UI convention.

It is part of the session state machine.

---

# 32. Multiple Blocking Tool Calls

Suppose the model requests:

\[
A
=
\{a_1,a_2,\ldots,a_k\}
\]

and each requires confirmation.

The session can expose:

\[
E_{blocked}
=
\{
e_1,e_2,\ldots,e_k
\}.
\]

The caller must resolve:

\[
\forall e_j\in E_{blocked}.
\]

Several confirmations may be transmitted in one event request.

Only once:

\[
\operatorname{Resolved}(E_{blocked})=1
\]

can the runtime return to:

\[
status=running.
\]

---

# 33. Denial Is an Observation, Not Silent Cancellation

For:

\[
result=deny,
\]

the tool does not execute.

However, the agent receives a tool result indicating that the operation was rejected, including the optional denial explanation.

Thus:

\[
\text{deny}
\rightarrow
o_t^{denied}
\]

and reasoning may continue:

\[
C_{t+1}
=
C_t
\oplus
o_t^{denied}.
\]

This permits recovery behavior such as:

\[
\text{propose safer alternative}
\]

rather than abruptly terminating the task.

---

# 34. Custom Tools Are Outside Managed Permission Policies

The permission layer described above applies to server-executed tools.

It does not govern custom client tools.

For a custom invocation:

\[
agent.custom\_tool\_use
\rightarrow
\text{client}
\]

and the client owns:

\[
\operatorname{Authorize}
\]

\[
\operatorname{Execute}
\]

\[
\operatorname{ReturnResult}.
\]

The application may therefore implement any policy it requires before sending:

\[
user.custom\_tool\_result.
\]

The source explicitly places custom-tool authorization under application control rather than managed permission policies.

---

# 35. Skills Are Procedural Context, Not Tools

A skill is a filesystem-backed package containing specialized instructions and supporting resources.

Conceptually:

\[
K_i
=
(
instruction_i,
metadata_i,
files_i,
scripts_i
).
\]

Skills contribute:

\[
\text{workflow knowledge}
+
\text{domain context}
+
\text{best practices}
\]

but are semantically different from executable tools.

A skill can teach:

\[
\text{how to perform task }q
\]

while a tool supplies:

\[
\text{an operation available during task }q.
\]

Thus:

\[
\boxed{
K\neq T.
}
\]

Skills are selectively invoked when relevant and add instructions and metadata to the session context.

---

# 36. Skills Have a Context Cost

Every attached skill introduces some session-context overhead.

If the agent has:

\[
K=
\{K_1,\ldots,K_n\},
\]

then:

\[
L_{context}
=
L_{base}
+
\sum_{i=1}^{n}
\Delta L(K_i)
+
L_{runtime}.
\]

Therefore:

\[
n\uparrow
\not\Rightarrow
\text{strictly better agent}.
\]

More skills increase:

\[
\{
\text{context cost},
\text{sandbox startup cost},
\text{selection surface}
\}.
\]

The platform explicitly warns that attaching more skills increases sandbox startup time.

---

# 37. Skill Representation

An attached skill reference is:

\[
K_i
=
(
type_i,
skill\_id_i,
version_i
).
\]

where:

\[
type_i
\in
\{
prebuilt,
custom
\}.
\]

`version` may be:

\[
v_i=\text{specific version}
\]

or:

\[
v_i=latest.
\]

If omitted:

\[
v_i=latest.
\]

The session supports up to:

\[
500
\]

skills across the deduplicated set of agents participating in the session.

---

# 38. Fixed Skill Version vs Latest

The distinction:

\[
version=v_k
\]

versus:

\[
version=latest
\]

is operationally substantial.

A fixed version produces:

\[
K_i(t)
=
K_{i,v_k}
\]

for new instantiations unless the agent definition changes.

Using latest creates an indirect mutable dependency:

\[
K_i(t)
=
K_{i,\max v(t)}.
\]

Therefore:

\[
\boxed{
\text{agent version pinning alone does not imply total behavioral immutability if dependencies use latest}
}
\]

because skill content can evolve outside the agent object.

For reproducible production execution:

\[
\mathcal A_v
\]

should be considered together with dependency versions:

\[
\boxed{
ExecutionSpec
=
(
\mathcal A_v,
K_{1,v_1},
\dots,
K_{n,v_n}
).
}
\]

---

# 39. Custom Skill Packaging

A custom skill consists of a directory whose required entrypoint is:

\[
SKILL.md
\]

plus optional supporting resources:

\[
\{
scripts,
templates,
reference\ files,
other\ assets
\}.
\]

Creation produces:

\[
skill\_*
\]

identifier state, which can then be attached to the agent.

Skill bundles are managed through the skill subsystem rather than the generic file-upload subsystem.

---

# 40. Repository-Discovered Skills Form a Second Skill Plane

Skills do not have to be declared statically on the agent.

A session can mount a repository containing:

\[
.claude/skills/<skill-name>/SKILL.md.
\]

At session startup, that exact repository-root path is scanned.

Discovered skills then become available without appearing in:

\[
\mathcal A.skills.
\]

Thus the effective skill set is:

\[
\boxed{
K_{effective}
=
K_{attached}
\cup
K_{repository}
}
\]

rather than merely:

\[
K_{effective}=K_{attached}.
\]

Repository discovery also requires the file-reading capability; disabling the required read tool prevents that discovery path.

---

# 41. Repository Skill Discovery Is Path-Sensitive

Discovery recognizes:

\[
.claude/skills/X/SKILL.md
\]

at exactly one skill-directory level.

The following are not equivalent:

\[
.claude/skills/SKILL.md
\]

\[
.claude/skills/tools/X/SKILL.md
\]

\[
skills/X/SKILL.md.
\]

Only the canonical root layout is announced automatically at session startup.

This is not recursive arbitrary repository discovery.

It is a deliberately constrained filesystem convention.

---

# 42. Repository Skill Discovery Is a Session-Start Snapshot

Repository skills are discovered once:

\[
t=t_{session-start}.
\]

If a commit arrives at:

\[
t>t_{session-start},
\]

the running session does not automatically ingest it.

Therefore:

\[
K_{repo}^{session}
=
K_{repo}
(
checkout_{t_0}
).
\]

To observe newer repository skills:

\[
\operatorname{CreateNewSession}
\]

is required.

This avoids live mutation of the skill instruction set during an active execution.

---

# 43. Repository Skills Expand the Trust Boundary

A repository skill is executable agent instruction.

Therefore:

\[
\boxed{
\text{repository mount}
\neq
\text{passive data mount}.
}
\]

If a contributor modifies:

\[
.claude/skills/X/SKILL.md,
\]

that contributor can alter future agent behavior.

When the agent also possesses:

\[
bash,
web\_fetch,
write,
\ldots
\]

those instructions can influence real side effects.

The source explicitly states that mounted repository skill instructions are part of the agent trust boundary and are loaded without an intermediate manual review step at session start.

Thus the security chain is:

\[
\boxed{
\text{Repository Write Authority}
\rightarrow
\text{Skill Instruction Authority}
\rightarrow
\text{Agent Behavioral Influence}
\rightarrow
\text{Tool Side Effects}
}
\]

This is a supply-chain concern, not merely a prompt-engineering concern.

---

# 44. Skill Name Collision Does Not Imply Override

If:

\[
K_a.name
=
K_b.name
\]

for skills originating from different locations, the runtime does not necessarily collapse them into one winner.

Attached skills and repository-discovered skills with the same name may coexist, with their locations separately exposed.

Therefore:

\[
name
\]

is not a globally unique skill identity across all loading mechanisms.

---

# 45. Delegation Is Part of the Agent Definition

The `multiagent` field represents coordinator-level delegation configuration.

Conceptually:

\[
G_c
=
\{
A_1^{v_1},
A_2^{v_2},
\dots,
A_n^{v_n}
\}.
\]

The coordinator may delegate work only into its declared roster.

This converts a single agent specification into an execution graph:

\[
A_c
\rightarrow
\{
A_1,
A_2,
\dots,A_n
\}.
\]

The detailed orchestration protocol is outside the supplied material, but several agent-definition invariants are explicit:

1. `multiagent` is a first-class agent field.
2. Geography configuration must be consistent across the coordinator and roster.
3. Updating a delegate does not automatically update coordinator roster references.
4. Replacing `multiagent` replaces the complete coordinator declaration, including its roster.

These facts make delegation topology part of configuration versioning.

---

# 46. Delegate Updates Do Not Propagate Transitively

Suppose coordinator:

\[
A_c^{v_c}
\]

references:

\[
A_d^{v_3}.
\]

If the delegate becomes:

\[
A_d^{v_3}
\rightarrow
A_d^{v_4},
\]

then:

\[
A_c^{v_c}
\not\Rightarrow
A_d^{v_4}.
\]

The coordinator retains its prior pinned roster reference until the coordinator itself is updated.

Thus:

\[
\boxed{
\text{agent dependency updates are non-transitive}
}
\]

and rollout across a delegation graph must be explicit.

---

# 47. Description and Metadata Are Operationally Different

The agent provides both:

\[
description
\]

and:

\[
metadata.
\]

`description` is human-readable agent semantics.

`metadata` is arbitrary application-owned key-value state.

These should not be conflated.

A useful interpretation is:

\[
description
=
\text{semantic purpose}
\]

while:

\[
metadata
=
\{
owner,
service,
environment,
release,
cost\_center,
experiment,
\dots
\}.
\]

Metadata is application tracking state, not reasoning context unless separately injected into the session.

---

# 48. Agent Creation Normalizes Defaults

Creation is not merely:

\[
request
\rightarrow
echo(request).
\]

The platform constructs:

\[
\boxed{
\mathcal A_1
=
\operatorname{Normalize}
(
A_{request},
Defaults
)
}
\]

and returns the effective configuration.

For example, omitted model fields can be populated with runtime defaults, and attached built-in toolsets expose their effective default permission policy.

Therefore the create response is the canonical representation to record for audit purposes, not necessarily the abbreviated creation payload.

---

# 49. Session Overrides Create an Overlay Boundary

Certain fields may be overridden for one session without modifying the persisted agent:

\[
O_s
\subseteq
\{
model,
system,
tools,
mcp\_servers,
skills
\}.
\]

Thus:

\[
\mathcal A_{effective}^{(s)}
=
\operatorname{SessionOverride}
(
\mathcal A_v,
O_s
).
\]

But override semantics are not generic recursive merging.

This matters particularly for `model`.

---

# 50. Model Session Override Replaces the Model Object

If an agent stores:

\[
M_A
=
\{
id:m,
effort:high,
speed:standard
\}
\]

and the session supplies a model override:

\[
M_S
=
\{
id:m
\},
\]

the session model object is replaced rather than merged.

Therefore:

\[
M_{effective}
=
M_S,
\]

not:

\[
M_A\cup M_S.
\]

Consequently, the persisted agent effort does not survive that model override; the session uses the model's default effort.

This is an easy source of production configuration error.

---

# 51. Persisted Agent Update Semantics Are Field-Type Dependent

Updating an agent does not use one universal merge rule.

The actual semantics differ by field class.

Let:

\[
\Delta
\]

be the update payload.

Then:

\[
\mathcal A_{v+1}
=
U(\mathcal A_v,\Delta)
\]

where \(U\) is field-sensitive.

The source defines the behavior explicitly.

---

# 52. Omitted Top-Level Fields Are Preserved

If:

\[
f\notin\Delta,
\]

then:

\[
A_{v+1}[f]
=
A_v[f].
\]

Therefore an update can be sparse.

This is different from session model override semantics.

---

# 53. Scalar Fields Are Replaced

For:

\[
f
\in
\{
model,
system,
name,
description
\},
\]

supplying \(f\) generally replaces its value.

`system` and `description` may be cleared using:

\[
null.
\]

`name` and `model` are mandatory and cannot be cleared.

---

# 54. Model Update Has One Explicit Exception

Within an updated `model` object, `effort` receives special treatment.

If:

\[
id_{new}=id_{old}
\]

and the update omits `effort`, then:

\[
effort_{new}=effort_{old}.
\]

But if:

\[
id_{new}\neq id_{old}
\]

and `effort` is omitted:

\[
effort_{new}
=
default(id_{new}).
\]

Other model-object fields do not receive this preservation behavior.

For example, supplying a model object without `inference_geo` clears the previous geography pin.

This means the model object update rule is:

\[
\boxed{
\text{replace object}
+
\text{special-case effort preservation}
}
\]

not generic deep merge.

---

# 55. Array Fields Are Fully Replaced

For:

\[
f
\in
\{
tools,
mcp\_servers,
skills
\},
\]

supplying a new array means:

\[
A_{v+1}[f]
=
\Delta[f].
\]

It does **not** append to:

\[
A_v[f].
\]

To clear:

\[
\Delta[f]=[]
\]

or:

\[
\Delta[f]=null.
\]

This is particularly dangerous for partial infrastructure updates.

For example, updating one tool requires resupplying the entire desired tools array.

Otherwise the omitted existing tools from that array are removed.

---

# 56. `multiagent` Is Replaced as One Object

The delegation specification has:

\[
multiagent_{new}
=
\Delta.multiagent.
\]

Its internal roster is not incrementally patched.

Passing:

\[
null
\]

clears the delegation configuration.

---

# 57. Metadata Uses Key-Level Merge

Metadata follows different semantics.

For:

\[
\mu_v
=
\{
k_1:v_1,
k_2:v_2
\}
\]

and:

\[
\Delta\mu
=
\{
k_2:v_2',
k_3:v_3
\},
\]

the result is:

\[
\mu_{v+1}
=
\{
k_1:v_1,
k_2:v_2',
k_3:v_3
\}.
\]

Deleting a metadata key requires:

\[
\Delta\mu[k]=null.
\]

Thus:

\[
metadata
\]

is the only documented top-level map using explicit key-level merge semantics.

---

# 58. Updates Support Optimistic Concurrency

Suppose two control-plane writers read:

\[
\mathcal A_v.
\]

Writer \(W_1\) updates first:

\[
\mathcal A_v
\rightarrow
\mathcal A_{v+1}.
\]

Writer \(W_2\) still sends:

\[
expected\_version=v.
\]

The platform returns:

\[
409
\]

instead of silently applying the stale update.

Formally:

\[
U(A,\Delta,v_{expected})
=
\begin{cases}
A' & v_{expected}=v_{current}\\
409 & v_{expected}\neq v_{current}.
\end{cases}
\]

This is compare-and-swap semantics at the configuration level.

---

# 59. Omitting Version Enables Last-Write-Wins

If the update does not provide:

\[
expected\_version,
\]

then:

\[
U(A,\Delta)
\]

is unconditional.

Concurrent updates may therefore produce:

\[
W_1
\rightarrow
A'
\]

followed by:

\[
W_2
\rightarrow
A'',
\]

with the later update silently winning.

This is appropriate for a declarative reconciliation controller that intentionally owns the complete desired state, but dangerous for interactive concurrent editing.

---

# 60. No-Op Updates Do Not Create Artificial Versions

If:

\[
U(A_v,\Delta)=A_v,
\]

then:

\[
v_{new}=v.
\]

No new configuration version is created merely because an update request was issued.

Thus versions correspond to actual state changes:

\[
\boxed{
\Delta State\neq0
\Rightarrow
\Delta Version=1.
}
\]

---

# 61. Agent Lifecycle

The persistent agent supports three principal lifecycle operations:

\[
\boxed{
\text{Update}
\rightarrow
\text{Version History}
\rightarrow
\text{Archive}.
}
\]

### Update

\[
\mathcal A_v
\rightarrow
\mathcal A_{v+1}
\]

when state changes.

### List versions

Returns:

\[
\{
\mathcal A_1,
\mathcal A_2,
\dots,
\mathcal A_v
\}
\]

for historical inspection.

### Archive

Transitions the logical agent into a terminal administrative state:

\[
state(\mathcal A)=archived.
\]

The documented lifecycle explicitly preserves existing sessions while preventing new session references after archival.

---

# 62. Archive Is Not Delete

Archiving does not destroy existing running session state.

Instead:

\[
\operatorname{Archive}(A)
\Rightarrow
\begin{cases}
\text{new sessions forbidden}\\
\text{agent updates forbidden}\\
\text{existing sessions continue}
\end{cases}
\]

and the operation cannot be undone.

Therefore:

\[
\boxed{
archive
\neq
delete
}
\]

and:

\[
\boxed{
archive
\neq
terminate existing sessions.
}
\]

---

# 63. Agent Definition as a Capability Graph

The complete object is best understood not as a flat JSON document but as a graph:

\[
\boxed{
\mathcal G_A
=
(
V_A,E_A
)
}
\]

with nodes:

\[
V_A
=
\{
Model,
System,
NativeTools,
CustomTools,
ExternalServers,
ExternalTools,
Skills,
Delegates
\}.
\]

Representative edges include:

\[
Agent
\rightarrow
Model
\]

\[
Agent
\rightarrow
System
\]

\[
Agent
\rightarrow
Toolset
\]

\[
ExternalToolset
\rightarrow
ExternalServer
\]

\[
Agent
\rightarrow
SkillVersion
\]

\[
Coordinator
\rightarrow
DelegateVersion.
\]

Configuration validity requires graph invariants such as:

\[
\forall T_{mcp},
\exists R
\]

and geography consistency across delegation nodes.

The result is an **executable capability graph**, not a prompt template.

---

# 64. Effective Agent State at Session Creation

The final session-visible configuration can be expressed as:

\[
\boxed{
A_{session}
=
Instantiate
(
A_v,
O_s,
R_s,
V_s,
K_{repo}
)
}
\]

where:

- \(A_v\): persisted versioned agent,
- \(O_s\): permitted session overrides,
- \(R_s\): session resources,
- \(V_s\): session credentials,
- \(K_{repo}\): repository-discovered skills.

This distinction matters because:

\[
\boxed{
A_v
\neq
A_{session}
}
\]

whenever session-scoped overlays or dynamically mounted resources are used.

For strict reproducibility, the full runtime specification must include all of these inputs.

---

# 65. Reproducibility Envelope

A genuinely reproducible execution identity is therefore closer to:

\[
\boxed{
\mathcal R
=
(
agent\_id,
agent\_version,
model\_policy,
skill\_versions,
delegate\_versions,
session\_overrides,
repository\_checkout,
environment,
credential\_set
).
}
\]

Persisting only:

\[
agent\_id
\]

is insufficient.

Persisting only:

\[
(agent\_id,agent\_version)
\]

may still be insufficient if:

\[
skill.version=latest
\]

or repository-discovered skills depend on a mutable branch.

This is the configuration analogue of dependency pinning in conventional software systems.

---

# 66. Control-Plane Failure Modes

The primary failure classes follow directly from the configuration semantics.

### Capability overexposure

\[
T_{enabled}
\supset
T_{required}
\]

increases unnecessary authority.

### Permission misconfiguration

\[
always\_allow
\]

on side-effecting operations permits autonomous execution without intervention.

### Session override drift

\[
A_{session}\neq A_v
\]

can make production behavior differ from the reviewed agent object.

### Array replacement loss

Updating:

\[
tools,
skills,
mcp\_servers
\]

with an incomplete array silently removes omitted entries.

### Stale concurrent update

Omitting optimistic version checks permits last-write-wins overwrites.

### Unpinned skill dependency

\[
version=latest
\]

can change behavior without changing the agent version.

### Repository instruction supply-chain attack

An untrusted repository contributor can influence agent instructions through repository-discovered skills.

### External capability partial failure

\[
SessionCreated=1
\]

while:

\[
MCPHealthy=0.
\]

### Credential mismatch

URL differences in path, subdomain, or non-default port can prevent credential matching.

### Delegation version drift

Updating a delegate does not update the coordinator's pinned roster.

### Geography-policy drift

A workspace allowlist can invalidate previously valid agents or halt subsequent turns in existing sessions.

These are not hypothetical abstractions; they fall directly out of the documented object and runtime semantics. 
---

# 67. Minimal-Authority Agent Construction

A production agent should normally be constructed from:

\[
C_{required}
=
\operatorname{MinimumCapabilities}
(
TaskClass
).
\]

Then enforce:

\[
T_{enabled}
=
T_{required}
\]

rather than:

\[
T_{enabled}
=
T_{available}.
\]

Similarly:

\[
R_{enabled}
=
R_{required}
\]

and:

\[
K_{attached}
=
K_{required}.
\]

This minimizes:

\[
\text{tool-selection entropy}
+
\text{authorization surface}
+
\text{context overhead}
+
\text{sandbox startup overhead}
+
\text{external dependency surface}.
\]

The configuration mechanisms explicitly support this narrow allow-list design for both built-in and external toolsets. 
---

# 68. End-to-End Agent Definition Procedure

The complete control-plane construction can be written as:

\[
\boxed{
\begin{aligned}
&
\textbf{Input:}
\\
&
TaskDomain\;\mathcal D,
SecurityPolicy\;\Pi,
RuntimeConstraints\;\Gamma
\\[4pt]
&
\textbf{1. Select model identity}
\\
&
m
\leftarrow
SelectModel(\mathcal D,\Gamma)
\\[4pt]
&
\textbf{2. Select model operating point}
\\
&
M
\leftarrow
(
m,
speed,
effort,
inference\_geo
)
\\[4pt]
&
\textbf{3. Define persistent behavior}
\\
&
P
\leftarrow
SystemPolicy(
\mathcal D,\Pi
)
\\[4pt]
&
\textbf{4. Derive minimum native capability set}
\\
&
T_{native}
\leftarrow
MinimumNativeTools(\mathcal D)
\\[4pt]
&
\textbf{5. Configure native execution policy}
\\
&
\forall t\in T_{native}:
\\
&
(enabled_t,permission_t)
\leftarrow
Policy(t,\Pi)
\\[4pt]
&
\textbf{6. Define custom application contracts}
\\
&
T_{custom}
=
\{
(name_i,description_i,schema_i)
\}
\\[4pt]
&
\textbf{7. Declare required external servers}
\\
&
R
=
\{
(type_i,name_i,url_i)
\}
\\[4pt]
&
\textbf{8. Validate server/toolset referential integrity}
\\
&
\forall r_i\in R:
\exists t_j\in T_{mcp}
:
t_j.server=r_i.name
\\[4pt]
&
\textbf{9. Restrict exposed external tools}
\\
&
T_{mcp}^{effective}
\leftarrow
AllowList(\mathcal D)
\\[4pt]
&
\textbf{10. Attach procedural skills}
\\
&
K
=
\{
(type_i,skill\_id_i,version_i)
\}
\\[4pt]
&
\textbf{11. Pin skill versions where reproducibility is required}
\\
&
version_i
\leftarrow
v_i
\\[4pt]
&
\textbf{12. Configure delegation topology if required}
\\
&
G
=
\{
A_1^{v_1},
\dots,
A_n^{v_n}
\}
\\[4pt]
&
\textbf{13. Validate graph-wide geography constraint}
\\
&
g_c=g_1=\dots=g_n
\quad
\lor
\quad
\forall g=\varnothing
\\[4pt]
&
\textbf{14. Attach description and operational metadata}
\\
&
(D,\mu)
\leftarrow
OperationalIdentity(\mathcal D)
\\[4pt]
&
\textbf{15. Create versioned agent}
\\
&
A_1
\leftarrow
Create(
name,
M,
P,
T,
R,
K,
G,
D,
\mu
)
\\[4pt]
&
\textbf{16. Read normalized response}
\\
&
A_1^{effective}
\leftarrow
NormalizeDefaults(A_1)
\\[4pt]
&
\textbf{17. Persist}
\\
&
(
agent\_id,
version,
A_1^{effective}
)
\\[4pt]
&
\textbf{Output:}
\\
&
\boxed{
\text{versioned reusable agent specification}
}
\end{aligned}
}
\]

---

# 69. Update Procedure

Agent mutation should be treated as configuration deployment.

\[
\boxed{
\begin{aligned}
&
A_v
\leftarrow
ReadAgent(agent\_id)
\\
&
\Delta
\leftarrow
DesiredChange
\\
&
ValidateFieldSemantics(\Delta)
\\
&
A'
\leftarrow
Update(
agent\_id,
expected\_version=v,
\Delta
)
\\
&
\textbf{if }409:
\\
&
\qquad
A_{latest}
\leftarrow
ReadAgent(agent\_id)
\\
&
\qquad
Reconcile(
A_{latest},
\Delta
)
\\
&
\textbf{else:}
\\
&
\qquad
Persist(
A'.version,
A'
)
\end{aligned}
}
\]

For declarative configuration controllers that intentionally own the entire desired state:

\[
expected\_version
\]

may be omitted, producing last-write-wins behavior.

---

# 70. Final Architectural Interpretation

The agent definition is best understood as:

\[
\boxed{
\textbf{a versioned executable policy object}
}
\]

with five major responsibilities:

\[
\boxed{
\begin{array}{c}
\text{Intelligence Policy}
\\
\downarrow
\\
Model + Effort + Speed + Geography
\\[6pt]
\text{Behavior Policy}
\\
\downarrow
\\
System Instruction + Skills
\\[6pt]
\text{Capability Policy}
\\
\downarrow
\\
Native Tools + Custom Tools + External Tools
\\[6pt]
\text{Authority Policy}
\\
\downarrow
\\
Enablement + Permission + Client Authorization
\\[6pt]
\text{Topology Policy}
\\
\downarrow
\\
External Servers + Delegate Agents
\end{array}
}
\]

combined with:

\[
\boxed{
\text{versioned lifecycle state}
}
\]

for reproducibility and deployment management.

The final object can therefore be represented as:

\[
\boxed{
\mathcal A_v
=
\left[
\begin{array}{l}
\text{Identity}
\\
\text{Model Execution Policy}
\\
\text{Persistent System Behavior}
\\
\text{Native Capability Surface}
\\
\text{Custom Capability Contracts}
\\
\text{External Service Topology}
\\
\text{Permission Defaults}
\\
\text{Skill Dependencies}
\\
\text{Delegation Dependencies}
\\
\text{Operational Metadata}
\\
\text{Version State}
\end{array}
\right]_v
}
\]

and session construction becomes:

\[
\boxed{
\mathcal S_i
=
Instantiate
\left(
\mathcal A_v,
\mathcal E,
Credentials_i,
Resources_i,
Overrides_i
\right).
}
\]

The key systems property is that **agent behavior is not determined by one prompt**.

It is determined by the composition:

\[
\boxed{
\text{Model}
+
\text{System Policy}
+
\text{Tool Surface}
+
\text{Tool Semantics}
+
\text{Permissions}
+
\text{External Services}
+
\text{Skills}
+
\text{Delegation Graph}
+
\text{Versioned Configuration}
}
\]

and the effective runtime behavior emerges only after this control-plane specification is instantiated inside a session.

That is the precise role of **Define Your Agent** in a managed agent architecture: it establishes the immutable, reusable, auditable configuration boundary from which stateful autonomous execution is allowed to begin.