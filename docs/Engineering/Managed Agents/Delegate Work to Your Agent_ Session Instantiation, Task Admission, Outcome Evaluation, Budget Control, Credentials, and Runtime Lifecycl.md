# Delegate Work to Your Agent
## Session Instantiation, Task Admission, Outcome Evaluation, Budget Control, Credentials, and Runtime Lifecycle

### Abstract

Delegating work to an agent is not equivalent to sending a prompt to a model. It is the construction and activation of a **stateful execution instance** that binds a specific agent configuration to a specific execution environment, establishes session-scoped authority and cost boundaries, accepts ordered work events, preserves history and sandbox state, and transitions through an explicit runtime state machine until the current work reaches quiescence.

The fundamental runtime object is:

\[
\boxed{
\mathcal S_i
=
(
ID_i,
A_i^{*},
E_i,
H_i,
X_i,
V_i,
B_i,
O_i,
U_i,
\sigma_i
)
}
\]

where

\[
\begin{aligned}
ID_i &:= \text{session identity},\\
A_i^{*} &:= \text{resolved agent snapshot},\\
E_i &:= \text{execution environment},\\
H_i &:= \text{persisted event/conversation history},\\
X_i &:= \text{sandbox/execution state},\\
V_i &:= \text{session-bound credential set},\\
B_i &:= \text{optional spend budget},\\
O_i &:= \text{optional outcome-evaluation state},\\
U_i &:= \text{cumulative usage state},\\
\sigma_i &:= \text{session lifecycle status}.
\end{aligned}
\]

A session is explicitly an agent instance inside an environment and maintains conversation history across multiple interactions. Creation and task execution are separable operations: create the session first, then send a user event; alternatively, provide initial events during creation and enter execution immediately.

The core transition is therefore:

\[
\boxed{
\text{Agent Configuration}
+
\text{Environment}
\rightarrow
\text{Session}
+
\text{Task Event}
\rightarrow
\text{Execution}
\rightarrow
\text{Observation}
\rightarrow
\text{Iteration}
\rightarrow
\text{Idle}.
}
\]

The most important lifecycle invariant is:

\[
\boxed{
\text{task finished}
\neq
\text{session terminated}.
}
\]

A normally completed piece of work returns the session to `idle`; `terminated` denotes an unrecoverable end or archival termination.

---

# 1. Position of the Delegation Layer

The previous layers establish:

\[
\mathcal A_v
=
\text{what the agent is}
\]

and:

\[
\mathcal E
=
\text{where actions execute}.
\]

Delegation introduces:

\[
\boxed{
\mathcal S_i
=
\operatorname{Instantiate}
(
\mathcal A_v,
\mathcal E
)
}
\]

followed by:

\[
\boxed{
e_t
=
\operatorname{DelegateWork}
(
\mathcal S_i,
Task_t
).
}
\]

Thus the architecture becomes:

\[
\boxed{
\text{Define Agent}
\rightarrow
\text{Configure Environment}
\rightarrow
\text{Instantiate Session}
\rightarrow
\text{Submit Work}
\rightarrow
\text{Observe Execution}.
}
\]

A session is therefore the **runtime binding layer** between configuration and actual work.

---

# 2. Session Is Not the Agent

An agent:

\[
\mathcal A_v
\]

is reusable configuration.

A session:

\[
\mathcal S_i
\]

is one stateful execution instance.

Therefore:

\[
\boxed{
\mathcal S_i
\neq
\mathcal A_v.
}
\]

One agent may instantiate:

\[
\mathcal A_v
\rightarrow
\{
\mathcal S_1,
\mathcal S_2,
\dots,
\mathcal S_n
\}.
\]

Each session has independent:

\[
\{
history,
sandbox,
events,
usage,
budget,
outcomes,
credentials,
status
\}.
\]

---

# 3. Session Is Not the Environment

Likewise:

\[
\mathcal S_i
\neq
\mathcal E_j.
\]

The environment specifies execution policy and substrate.

The session binds one execution to that environment:

\[
\mathcal S_i
=
Bind(
\mathcal A,
\mathcal E
).
\]

For multiple sessions:

\[
\mathcal S_1,
\mathcal S_2
\rightarrow
\mathcal E_j,
\]

the environment may be reused while session execution state remains distinct.

---

# 4. Minimum Session Construction

A session requires:

\[
\boxed{
agent
+
environment\_id.
}
\]

At its minimum:

\[
\mathcal S
=
CreateSession(
A,
E
).
\]

The agent and environment are separately created control-plane resources.

---

# 5. Agent Resolution Occurs at Session Creation

An agent reference may be supplied as a plain identifier:

\[
agent=a.
\]

If only the identifier is supplied:

\[
\boxed{
A_{\text{resolved}}
=
LatestVersion(a)
}
\]

at session-creation time.

The session therefore binds to the latest agent version available when creation resolves the reference.

This matters operationally because:

\[
CreateSession(a,t_1)
\]

and:

\[
CreateSession(a,t_2)
\]

may resolve different agent versions if the agent was updated between \(t_1\) and \(t_2\).

---

# 6. Explicit Agent-Version Pinning

For deterministic rollout:

\[
agent
=
(
id=a,
version=v
).
\]

Then:

\[
\boxed{
A_{\text{resolved}}
=
A_{a,v}.
}
\]

The session does not follow a later:

\[
A_{a,v+1}.
\]

Version pinning therefore provides:

\[
\{
reproducibility,
staged rollout,
rollback control,
A/B isolation
\}.
\]

The API explicitly supports a pinned agent object rather than only a logical agent identifier.

---

# 7. Three Agent-Binding Modes

The session `agent` input has three distinct forms:

\[
\boxed{
R_A
\in
\{
\text{ID},
\text{PinnedAgent},
\text{AgentWithOverrides}
\}.
}
\]

### Logical identifier

\[
R_A=a
\]

resolves the latest agent version.

### Version-pinned agent

\[
R_A=(a,v)
\]

resolves exactly version \(v\).

### Session override object

\[
R_A
=
(a,v?,\Delta A_s)
\]

resolves a base agent and then applies session-local configuration replacement.

The supplied session contract explicitly defines all three forms.

---

# 8. Session Override Is an Overlay on a Base Agent Identity

Let:

\[
A_v
=
\text{base agent}.
\]

Let:

\[
\Delta A_s
=
\{
model?,
system?,
tools?,
mcp\_servers?,
skills?
\}.
\]

The effective session agent is:

\[
\boxed{
A_s^{*}
=
Override(
A_v,
\Delta A_s
).
}
\]

However:

\[
Override
\neq
DeepMerge.
\]

The base agent identity and version remain visible in the resolved session object even after session-specific fields are replaced.

---

# 9. Override Rule 1 — Omission Means Inheritance

For field \(f\):

\[
f\notin\Delta A_s
\]

implies:

\[
A_s^{*}[f]
=
A_v[f].
\]

Therefore omission means:

\[
\boxed{
inherit.
}
\]

---

# 10. Override Rule 2 — Null or Empty Means Clear

For clearable field \(f\):

\[
\Delta A_s[f]=null
\]

or, for list fields:

\[
\Delta A_s[f]=[]
\]

produces:

\[
A_s^{*}[f]
=
\varnothing.
\]

This rule applies directly to:

\[
system
\]

and:

\[
skills.
\]

The source documents important exceptions.

---

# 11. Model Cannot Be Cleared

A session necessarily requires a model:

\[
model\neq\varnothing.
\]

Therefore:

\[
model=null
\]

is rejected with:

\[
400\;agent\_model\_required.
\]

This is a structural invariant, not merely a default.

---

# 12. Tools Cannot Be Cleared While Skills Require Read Access

If:

\[
skills_{\text{effective}}
\neq
\varnothing,
\]

then clearing the complete tools field is invalid because skills depend on file-read capability.

Thus:

\[
skills\neq\varnothing
\land
tools=\varnothing
\Rightarrow
400.
\]

The dependency is explicit in the session override rules.

---

# 13. External Server Configuration Has Referential Integrity

If the effective tool configuration still contains:

\[
mcp\_toolset(server=r),
\]

then:

\[
r
\]

must remain present in:

\[
mcp\_servers.
\]

Therefore:

\[
mcp\_servers=\varnothing
\]

is invalid while an effective tool still references one of those servers.

The correct transaction is:

\[
\boxed{
\text{remove referencing toolset}
+
\text{clear server declaration}
}
\]

in the same override.

---

# 14. Override Rule 3 — Values Replace, They Do Not Merge

For a supplied value:

\[
\Delta A_s[f]=x,
\]

the effective field becomes:

\[
A_s^{*}[f]=x.
\]

It does not become:

\[
merge(A_v[f],x).
\]

Therefore if the base agent has:

\[
T_v
=
\{t_1,t_2,t_3\}
\]

and session override specifies:

\[
T_s
=
\{t_4\},
\]

the effective tools are:

\[
\boxed{
T^{*}
=
\{t_4\}
}
\]

not:

\[
\{t_1,t_2,t_3,t_4\}.
\]

Overrides never merge collection fields with the agent definition.

---

# 15. Model Override Replaces the Complete Model Object

If:

\[
M_v
=
(
id,
effort,
speed,
inference\_geo
)
\]

and a session specifies:

\[
M_s
=
(id'),
\]

then:

\[
\boxed{
M^{*}=M_s
}
\]

rather than:

\[
merge(M_v,M_s).
\]

This has consequences for every omitted model-level property.

---

# 16. Per-Session Effort Override Has Special Semantics

The supplied session contract explicitly states that an `effort` level inside the per-session model override is not applied.

Because the model object itself is replaced:

\[
M^{*}
=
M_{\text{override}},
\]

the base agent's effort is also not inherited.

The resulting session executes at:

\[
\boxed{
effort
=
model\ default
}
\]

when the model field is overridden.

To preserve a specific effort setting, it must remain on the base agent while avoiding a per-session model override.

---

# 17. Model Override Also Controls Inference Geography

Because the entire model object is replaced:

\[
M^{*}
=
M_{\text{override}},
\]

including:

\[
inference\_geo=g
\]

pins session model requests to \(g\).

Omitting:

\[
inference\_geo
\]

from the model override clears the agent's prior pin for that session, causing the session to follow the workspace execution default.

The requested geography is validated at session creation against the allowed geography set.

---

# 18. Session Overrides Do Not Mutate the Agent Resource

For:

\[
S_i
=
Create(A_v,\Delta A_i),
\]

the underlying agent remains:

\[
A_v.
\]

No new:

\[
A_{v+1}
\]

is produced.

Thus:

\[
\boxed{
\Delta A_i
\text{ is session-local}.
}
\]

Other sessions referencing the same agent are unaffected.

---

# 19. Session Creation and Task Start Are Separate

Creating:

\[
S_i
\]

without initial work events does not start agent execution.

Instead:

\[
CreateSession
\rightarrow
status=idle.
\]

However, sandbox provisioning begins immediately after creation, reducing first-tool-call startup latency.

The two-step form is:

\[
\boxed{
CreateSession
\rightarrow
SendUserEvent.
}
\]

---

# 20. Delegating Work Is an Event Operation

The actual task enters the runtime through an event:

\[
e_t
\in
E_{user}.
\]

A normal conversational task is:

\[
\boxed{
e_t
=
user.message(content).
}
\]

Processing that event drives:

\[
idle
\rightarrow
running.
\]

The session—not the HTTP request—is the persistent state carrier.

---

# 21. Two Primary Work-Delegation Semantics

The supplied sources expose two fundamentally different delegation modes.

### Instruction-driven work

\[
user.message
\]

means:

\[
\boxed{
\text{perform this requested turn}.
}
\]

### Outcome-driven work

\[
user.define\_outcome
\]

means:

\[
\boxed{
\text{continue iterating until this measurable target is satisfied or the iteration policy stops}.
}
\]

The latter introduces an independent grader and evaluation loop.

---

# 22. Create-and-Start Atomic Form

`initial_events` allows:

\[
CreateSession
+
SubmitInitialWork
\]

in one request.

For:

\[
I
=
[e_1,\dots,e_k],
\]

events are processed in order.

If:

\[
|I|>0,
\]

the session is created directly as:

\[
\boxed{
status=running.
}
\]

The initial event array supports a maximum of:

\[
\boxed{
50\ events.
}
\]



---

# 23. Initial Event Type Set Is Deliberately Restricted

At session creation:

\[
E_{initial}
=
\{
user.message,
user.define\_outcome
\}.
\]

The following do not make semantic sense before an agent turn exists and are therefore rejected:

\[
user.tool\_confirmation
\]

\[
user.tool\_result
\]

\[
user.custom\_tool\_result
\]

\[
user.interrupt.
\]

`system.message` is also not accepted in session `initial_events`.

---

# 24. Initial Events Are Persisted Before Creation Returns

For:

\[
I=[e_1,\ldots,e_n],
\]

each event is:

\[
validated
\rightarrow
assigned\ server\ ID
\rightarrow
persisted
\]

in list order before the session-create call returns.

Thus the operation behaves transactionally:

\[
\boxed{
Create(S,I)
=
\begin{cases}
S + persist(I), & \forall e_i\ valid\\
reject, & \exists e_i\ invalid.
\end{cases}
}
\]

There is no partially created session with only a valid prefix of the initial event list.

---

# 25. Initial-Event Validation Is All-or-Nothing

If:

\[
\exists e_j:
Validate(e_j)=false,
\]

then:

\[
\boxed{
SessionCreated=0.
}
\]

This is stronger than per-event partial acceptance.

---

# 26. Empty Initial Event List Means No Initial Work

\[
initial\_events=[]
\]

is semantically equivalent to omitting the field.

Thus:

\[
status_{create}=idle.
\]

---

# 27. Initial Events Are Not Echoed in the Create Response

Although initial events are persisted before creation returns, they are not echoed in the session-create response.

To inspect them:

\[
\boxed{
ListSessionEvents(session\_id).
}
\]

This means session creation acknowledgment and event-history retrieval are intentionally separate read surfaces.

---

# 28. Initial Outcome Constraints

Within `initial_events`:

\[
\#(user.define\_outcome)
\leq
1.
\]

More than one produces:

\[
400.
\]

An outcome without a rubric also produces:

\[
400.
\]

The complete initial-event request additionally rejects:

\[
>100
\]

file-sourced document content blocks and a request body larger than:

\[
32\text{ MB}
\]

with the latter returning:

\[
413.
\]



---

# 29. Session State Machine

The externally defined top-level statuses are:

\[
\boxed{
\sigma
\in
\{
idle,
running,
rescheduling,
terminated
\}.
}
\]

Their semantics are:

\[
idle
=
\text{waiting for input/action},
\]

\[
running
=
\text{actively executing},
\]

\[
rescheduling
=
\text{transient failure with automatic retry},
\]

\[
terminated
=
\text{unrecoverable or archived terminal state}.
\]



---

# 30. Normal Completion Returns to Idle

The normal cycle is:

\[
idle
\rightarrow
running
\rightarrow
idle.
\]

It is not:

\[
idle
\rightarrow
running
\rightarrow
terminated.
\]

Therefore:

\[
\boxed{
idle
}
\]

is a quiescent but reusable state.

The session may receive additional future work.

---

# 31. Idle Has Multiple Causes

`idle` does not uniquely mean “success.”

It can mean:

\[
\{
\text{turn finished},
\text{waiting for new task},
\text{waiting for tool confirmation},
\text{budget reached},
\text{outcome satisfied},
\text{outcome failed},
\dots
\}.
\]

The associated stop reason is therefore essential when interpreting why the session stopped executing.

---

# 32. Rescheduling Is Recoverable Runtime Failure

If a transient execution error occurs:

\[
running
\rightarrow
rescheduling.
\]

The runtime then attempts recovery automatically.

Thus:

\[
\boxed{
rescheduling
\neq
terminated.
}
\]

It represents retry orchestration rather than task completion.

---

# 33. Session Credential Binding Is Per Execution

Credential vault references are session parameters:

\[
V_i
=
[v_1,\ldots,v_k].
\]

This means the same reusable agent can execute on behalf of different users:

\[
A
+
V_{\text{user 1}}
\rightarrow
S_1
\]

\[
A
+
V_{\text{user 2}}
\rightarrow
S_2.
\]

The credential model explicitly separates reusable agent-resource granularity from per-session user authorization.

---

# 34. Vaults Are Workspace-Scoped Security Objects

Vaults and their credentials are scoped to the workspace.

Therefore anyone possessing a sufficiently authorized API credential for that workspace can reference those vaults when creating sessions.

Revocation requires removing the credential or vault.

The security implication is:

\[
\boxed{
workspace\ credential\ boundary
\supseteq
vault\ reference\ authority.
}
\]

---

# 35. Two Credential Families

The supplied credential system supports:

\[
\boxed{
C
=
C_{\text{MCP}}
\cup
C_{\text{env}}.
}
\]

### External protocol credentials

\[
C_{\text{MCP}}
=
\{
mcp\_oauth,
static\_bearer
\}.
\]

### Environment-variable credentials

\[
C_{\text{env}}
=
\{
environment\_variable
\}.
\]



---

# 36. External Protocol Credential Matching

An external protocol credential is keyed by:

\[
mcp\_server\_url.
\]

At runtime:

\[
ServerURL
\rightarrow
CredentialMatch(ServerURL)
\rightarrow
TokenInjection.
\]

If OAuth refresh information is provided, access-token refresh can be performed automatically on expiry.

---

# 37. Static Bearer Credential

For static bearer authentication:

\[
C
=
(
mcp\_server\_url,
token
).
\]

The token is inserted for the matching configured server.

This avoids putting long-lived secrets directly into:

\[
\mathcal A_v
\]

or each individual tool invocation.

---

# 38. No Credential Match Does Not Prevent Connection Attempt

If:

\[
CredentialMatch(url)=\varnothing,
\]

the connection attempt proceeds unauthenticated.

If the remote server requires authentication:

\[
Connection
\rightarrow
AuthFailure.
\]

There is no implicit “credential missing means skip server entirely” rule.

---

# 39. Multiple Matching Vaults Use Ordered Precedence

For:

\[
vault\_ids
=
[v_1,v_2,\dots,v_n],
\]

if multiple vaults provide a matching credential:

\[
\boxed{
Credential
=
FirstMatch(v_1,\ldots,v_n).
}
\]

Vault order is therefore semantically significant.

---

# 40. Multi-Thread Sessions Share Session Vaults

In sessions containing multiple execution threads:

\[
V_i
\]

applies across all threads.

Each thread whose own agent configuration declares a matching external server may authenticate from the session's vault set.

---

# 41. Environment-Variable Credential Uses Secret Indirection

For an environment-variable credential:

\[
C
=
(
secret\_name,
secret\_value,
network\_policy,
injection\_location
).
\]

The sandbox does not receive the clear-text value as ordinary model-visible context.

Instead:

\[
env[secret\_name]
=
opaque\ placeholder.
\]

When an eligible outbound request occurs:

\[
placeholder
\xrightarrow{egress}
secret\_value.
\]

The agent never receives the actual secret value. Sensitive credential fields are write-only and not returned through normal API responses.

---

# 42. Environment-Variable Credentials Are Not Available in Self-Hosted Sandboxes

The supplied contract explicitly excludes:

\[
environment\_variable
\]

credential injection from self-hosted sandbox execution.

Therefore:

\[
\boxed{
C_{\text{env}}
\notin
SelfHostedCredentialCapabilities.
}
\]



---

# 43. Secret Substitution Has Its Own Host Policy

A vault environment credential has:

\[
networking.allowed\_hosts.
\]

This does **not** govern sandbox reachability.

It governs:

\[
\boxed{
\text{which destinations are eligible for secret substitution}.
}
\]

Actual outbound connectivity remains controlled by the environment network policy.

Therefore a secret-bearing call succeeds only if:

\[
Host
\in
CredentialAllowedHosts
\]

and:

\[
Host
\in
EnvironmentReachableHosts.
\]

Both controls must permit the host.

---

# 44. Secret Exposure Location Is Independently Scoped

The optional:

\[
injection\_location
=
(
header,
body
)
\]

controls where placeholder replacement may occur.

Thus:

\[
CredentialHostPolicy
\perp
CredentialLocationPolicy.
\]

A safer common configuration is:

\[
header=true,
\quad
body=false
\]

when the external client supports header authentication, because arbitrary request bodies frequently contain model-produced or user-provided content.

---

# 45. Injection-Location Creation Semantics

At credential creation, if the object is supplied:

\[
injection\_location
=
\{header:true\},
\]

then omitted fields default to false:

\[
body=false.
\]

If the entire object is omitted:

\[
header=true,
\quad
body=true.
\]



---

# 46. Injection-Location Update Semantics

During update, fields merge individually.

For example:

\[
\Delta=
\{body:false\}
\]

changes:

\[
body\rightarrow false
\]

while preserving the current:

\[
header.
\]

This differs from the replacement semantics used by many agent/session fields.

---

# 47. At Least One Injection Location Must Remain Enabled

A credential configuration satisfying:

\[
header=false
\land
body=false
\]

is invalid.

An explicit null for the object or its Boolean fields is also rejected.

Therefore:

\[
\boxed{
header\lor body=1.
}
\]

The response returns both resolved Boolean values.

---

# 48. Disabled Secret Location Leaves the Placeholder Literal

If an opaque placeholder appears in a request location where substitution is disabled:

\[
placeholder
\not\rightarrow
secret.
\]

The request is transmitted containing the literal placeholder.

The same symptom can occur when the destination host is outside the credential's allowed-host set.

This is an important debugging signal.

---

# 49. Session Budget Is a Hard New-Work Admission Boundary

A session may be created with:

\[
B
=
(
type=limit,
max\_list\_cost
).
\]

The platform continuously computes:

\[
C_t
=
\text{session list cost}.
\]

Before issuing another model request:

\[
\boxed{
C_t
\geq
B
\Rightarrow
\text{no new model request admitted}.
}
\]

The in-flight request that crosses the boundary is not aborted.

---

# 50. Budget Is Creation-Time State

A session budget may be attached only when creating the session.

Thus:

\[
B_{initial}=\varnothing
\]

means a budget cannot later be added.

A session created with a budget may subsequently have its cap modified or removed.

---

# 51. Budget Amount Encoding

The budget object uses:

\[
type=limit.
\]

The cap amount is:

\[
\boxed{
\text{whole US cents encoded as a string}.
}
\]

Examples:

\[
"125"
=
\$1.25
\]

\[
"50"
=
\$0.50.
\]

Constraints include:

\[
amount>0,
\]

no leading zeros, and no decimal representation such as:

\[
"25.00".
\]

`USD` is the only supported currency in the supplied contract.

The string representation deliberately eliminates floating-point rounding ambiguity.

---

# 52. List Cost Is Not Contracted Invoice Cost

The budget is evaluated against:

\[
\boxed{
ListCost
}
\]

computed from public list pricing.

It is not necessarily:

\[
ActualInvoiceCost.
\]

Therefore negotiated pricing does not change when the budget threshold is reached.

---

# 53. List-Cost Components

In the supplied budget contract:

\[
\boxed{
C
=
C_{\text{model}}
+
C_{\text{search}}
+
C_{\text{runtime}}.
}
\]

The specified components are:

\[
C_{\text{model}}
=
\text{tokens priced at each served model's list rate},
\]

\[
C_{\text{search}}
=
\$10/1000\ \text{web searches},
\]

\[
C_{\text{runtime}}
=
\$0.08/\text{hour}.
\]



---

# 54. Budget Enforcement Uses Exact Cost

Internally:

\[
C^{exact}
\]

is used for threshold enforcement.

Externally reported:

\[
usage.list\_cost
\]

is rounded to whole cents.

Therefore:

\[
C^{reported}
\neq
C^{exact}
\]

within approximately half a cent of rounding.

This distinction becomes important when increasing a budget after it has been reached.

---

# 55. Budget Check Occurs Between Model Requests

The runtime does not enforce:

\[
B
\]

inside an already admitted model request.

Instead:

\[
\boxed{
CheckBudget
\rightarrow
AdmitModelRequest
\rightarrow
RequestCompletes
\rightarrow
CheckBudgetAgain.
}
\]

Therefore a session may finish with:

\[
C>B.
\]



---

# 56. Overshoot Is Bounded by In-Flight Requests

For a single thread, overshoot is bounded by the cost of the request admitted while:

\[
C<B.
\]

For concurrent multi-thread execution, each thread may already have an in-flight request.

Thus:

\[
\boxed{
Overshoot
\leq
\sum_{\text{in-flight threads}}
Cost(last\ admitted\ request).
}
\]

The source explicitly describes this as at most one crossing request per thread.

The budget is therefore:

\[
\boxed{
\text{a bound on admission of additional work}
}
\]

rather than an exact transactional stop value.

---

# 57. Budget Reached Produces Idle, Not Terminated

When:

\[
C\geq B,
\]

the session transitions to:

\[
status=idle
\]

with:

\[
stop\_reason=budget\_reached.
\]

The session history and sandbox remain preserved.

---

# 58. Budget-Reached Event Ordering

When a thread reaches the budget boundary, the event sequence is explicitly:

\[
\boxed{
session.thread\_status\_idle
}
\]

followed by:

\[
\boxed{
session.usage
}
\]

followed by:

\[
\boxed{
session.status\_idle.
}
\]

The session-level idle stop reason is:

\[
budget\_reached.
\]

The usage event immediately precedes the session-level idle event.

---

# 59. Thread Completion Does Not Override Session-Level Budget State

A thread may simultaneously:

\[
finish\ its\ turn
\]

and:

\[
cross\ the\ budget.
\]

That thread may report:

\[
end\_turn
\]

while the session reports:

\[
budget\_reached.
\]

Therefore:

\[
\boxed{
session\ stop\ reason
}
\]

is the authoritative signal for whether the session paused because of budget exhaustion.

---

# 60. Events Accepted While at the Budget

At or above the budget, only work-settlement events are accepted:

\[
\boxed{
E_{cap}
=
\{
user.tool\_confirmation,
user.tool\_result,
user.custom\_tool\_result,
user.interrupt
\}.
}
\]

A new:

\[
user.message
\]

is rejected with:

\[
400.
\]

Settlement events are persisted without starting another model request.

---

# 61. Interrupt at a Fully Budget-Paused Session Is a No-Op

When every thread is already paused at the cap:

\[
user.interrupt
\]

is accepted but ignored.

It does not appear in the event history and does not modify session state.

The budget must be changed or removed to continue.

---

# 62. Changing the Budget Automatically Resumes Work

A budgeted session may update:

\[
B\rightarrow B'.
\]

If accepted:

\[
\boxed{
resume
}
\]

is automatic.

The caller does not need to send an additional task event merely to restart already paused work.

---

# 63. Replacement Budget Can Be Lower Than the Previous Cap

The replacement value need not satisfy:

\[
B'>B.
\]

It may be higher or lower than the current configured cap.

The actual condition is:

\[
\boxed{
B'
>
C^{exact}_{consumed}.
}
\]

If not:

\[
400.
\]

Because reported cost is rounded, a safe update should be above the reported value rather than equal to it.

---

# 64. Removing a Budget Is Irreversible

Setting:

\[
budget=null
\]

removes the cap.

After:

\[
B\rightarrow\varnothing,
\]

the session cannot later receive:

\[
B'\neq\varnothing.
\]

Thus:

\[
\boxed{
budget\ removal
}
\]

is a one-way session-lifecycle transition.

---

# 65. Usage State

A session carries cumulative usage state:

\[
U
=
(
tokens,
list\_cost,
active\_seconds,
server\_tool\_use
).
\]

The `session.usage` event is a point-in-time cumulative snapshot.

It is emitted immediately before the session goes idle regardless of the stop reason.

---

# 66. Session Active Time and Concurrent Threads

At session level:

\[
active\_seconds
\]

counts overlapping activity from concurrent threads once.

Thus if two threads are simultaneously active for 10 seconds:

\[
active\_seconds_{\text{session}}
\neq
20.
\]

The wall-clock active interval is counted once for runtime pricing.

---

# 67. Thread Usage Does Not Sum Exactly to Session Usage

Per-thread cost statistics:

- are independently rounded,
- are computed from each thread,
- exclude the session-level running-time charge.

Therefore:

\[
\sum_i
C_{\text{thread}_i}
\neq
C_{\text{session}}
\]

in general.

The session-level figure is the value used for budget enforcement.

---

# 68. Multi-Thread Sessions Share One Budget

A multi-thread session has:

\[
\boxed{
1\ session\ budget.
}
\]

There are no independent per-thread caps.

Thus:

\[
B_{\text{thread}_i}
\]

does not exist as a separate limit.

Every thread contributes to:

\[
C_{\text{session}}.
\]

Advisor/consultation model usage also contributes to the same session budget according to the served model's price.

---

# 69. Action Requests Have Higher Session-Level Stop Priority Than Budget

Consider:

\[
Thread_1
\rightarrow
requires\_action
\]

and:

\[
Thread_2
\rightarrow
budget\_reached.
\]

The session-level state reports:

\[
\boxed{
requires\_action.
}
\]

The pending authorization still requires a response, and that response is classified as settlement rather than new work, so the budget does not block it.

---

# 70. Outcome Delegation Changes the Execution Objective

A normal user message specifies work.

An outcome additionally specifies:

\[
\boxed{
\text{what satisfactory completion means}.
}
\]

Formally:

\[
O
=
(
D,
R,
K
)
\]

where:

\[
D=\text{outcome description},
\]

\[
R=\text{rubric},
\]

\[
K=\text{maximum iteration count}.
\]

The runtime then performs:

\[
\boxed{
Produce
\rightarrow
Evaluate
\rightarrow
Revise
\rightarrow
Evaluate
\rightarrow
\dots
}
\]

until a terminal outcome-evaluation result occurs.

---

# 71. Outcome Evaluation Uses a Separate Grader Context

Defining an outcome automatically introduces a grader.

Let:

\[
C_A
=
\text{main agent context}
\]

and:

\[
C_G
=
\text{grader context}.
\]

The architecture deliberately uses:

\[
\boxed{
C_A\neq C_G.
}
\]

The grader receives a separate context window rather than inheriting the implementation trajectory of the producing agent.

Its result is returned to the agent as evaluation feedback for subsequent revision.

---

# 72. Rubric Is Mandatory

Outcome delegation requires:

\[
R\neq\varnothing.
\]

The rubric is a Markdown document containing explicit criterion-level evaluation requirements.

Without a rubric:

\[
user.define\_outcome
\rightarrow
reject.
\]



---

# 73. Rubric Criteria Should Be Independently Gradeable

A criterion such as:

\[
\text{“output looks good”}
\]

does not provide a deterministic decision boundary.

A criterion such as:

\[
\text{“CSV contains a numeric price column”}
\]

does.

Each criterion is evaluated independently, so ambiguity directly increases grading noise.

---

# 74. Rubric Transport Forms

The rubric may be supplied as:

\[
R_{\text{text}}
\]

inline with:

\[
user.define\_outcome,
\]

or:

\[
R_{\text{file}}
\]

referencing an uploaded reusable file.

Thus:

\[
\boxed{
R
\in
\{
text,
file
\}.
}
\]



---

# 75. Outcome Iteration Budget

The outcome event supports:

\[
max\_iterations=K.
\]

The supplied execution contract states:

\[
K_{default}=3
\]

and:

\[
K_{max}=20.
\]



---

# 76. Outcome May Be the Initial Delegated Work

Instead of:

\[
CreateSession
\rightarrow
user.define\_outcome,
\]

the caller may provide the outcome directly inside:

\[
initial\_events.
\]

Then:

\[
CreateSession
+
DefineOutcome
\rightarrow
running.
\]



---

# 77. Outcome-Oriented Execution Does Not Require Continuous User Messages

Once:

\[
user.define\_outcome
\]

has been accepted, the agent autonomously iterates toward the target.

Additional:

\[
user.message
\]

events may steer the work but are not required for each iteration.

---

# 78. Only One Outcome Is Active at a Time

For session \(S\):

\[
\boxed{
|\mathcal O_{active}|\leq1.
}
\]

A subsequent outcome may begin only after the previous outcome produces its terminal:

\[
span.outcome\_evaluation\_end.
\]

Outcomes may therefore be chained sequentially, not executed as overlapping active goal evaluators.

---

# 79. Outcome Identity Is Persisted

The accepted:

\[
user.define\_outcome
\]

event is echoed with:

\[
processed\_at
\]

and:

\[
outcome\_id.
\]

Therefore every outcome forms a separately identifiable evaluation trajectory within the session.

---

# 80. Evaluation Iteration Is Zero-Indexed

For outcome \(o\):

\[
iteration=0
\]

means the first evaluation.

If revision is requested:

\[
iteration=1
\]

means evaluation after the first revision.

Thus:

\[
\boxed{
iteration=k
}
\]

represents the \(k\)-th revision index rather than a one-indexed attempt count.

---

# 81. Evaluation Start Event

When the grader begins evaluation:

\[
\boxed{
span.outcome\_evaluation\_start
}
\]

is emitted.

It contains:

\[
\{
outcome\_id,
iteration,
processed\_at
\}.
\]

This marks the start of one evaluator pass.

---

# 82. Grader Heartbeat Does Not Reveal Internal Reasoning

While evaluation continues:

\[
span.outcome\_evaluation\_ongoing
\]

may be emitted.

This indicates:

\[
grader\ active=1
\]

without exposing the grader's internal reasoning process.

---

# 83. Outcome Evaluation Terminal/Branch Results

At the end of one evaluation pass:

\[
r
\in
\{
satisfied,
needs\_revision,
max\_iterations\_reached,
failed,
interrupted
\}.
\]

The transition table is:

\[
\boxed{
\begin{array}{c|c}
r & \text{next state}\\
\hline
satisfied & idle\\
needs\_revision & new\ iteration\\
max\_iterations\_reached & final\ acknowledgment\ then\ idle\\
failed & idle\\
interrupted & outcome\ interrupted
\end{array}
}
\]



---

# 84. Satisfied

For:

\[
r=satisfied,
\]

the grader determines that the deliverable satisfies the rubric.

The session transitions to:

\[
idle.
\]

This is outcome success.

---

# 85. Needs Revision

For:

\[
r=needs\_revision,
\]

the grader's explanation is returned to the agent.

Then:

\[
Artifact_k
+
Feedback_k
\rightarrow
Artifact_{k+1}.
\]

The agent automatically enters another production/revision cycle.

---

# 86. Maximum Iterations Reached

For:

\[
r=max\_iterations\_reached,
\]

no additional grader evaluation is performed.

One final acknowledgment turn follows, then:

\[
status=idle.
\]

Thus:

\[
\boxed{
max\_iterations
}
\]

is a loop bound, not a statement that the rubric was satisfied.

---

# 87. Failed Outcome

For:

\[
r=failed,
\]

the runtime transitions to idle.

This result can occur when the rubric is structurally inapplicable to the produced deliverable—for example, when the requested outcome and rubric contradict each other.

This is distinct from:

\[
needs\_revision.
\]

---

# 88. Interrupted Outcome

A:

\[
user.interrupt
\]

while an outcome is active produces:

\[
r=interrupted.
\]

If grading had not yet started:

\[
outcome\_evaluation\_start\_id
=
"".
\]

The session may subsequently begin another outcome.

---

# 89. Outcome History Is Retained

After an outcome ends, the session can continue as an ordinary conversational session.

Alternatively:

\[
O_1
\rightarrow
O_2
\rightarrow
O_3
\]

may be run sequentially.

Prior outcome history remains part of the session.

---

# 90. Outcome Status Is Available Through the Session Object

Outcome status can be observed through the event stream or by retrieving the session.

Before a terminal evaluation, the stored result may report:

\[
\{
pending,
running,
evaluating
\}.
\]

The session exposes:

\[
outcome\_evaluations[].
\]



---

# 91. Outcome Deliverables Are Session-Scoped

In managed cloud sandbox execution, generated deliverables are written under:

\[
/mnt/session/outputs/.
\]

Once the session becomes idle, the caller can enumerate session-produced files by filtering the file service using:

\[
scope\_id=session\_id.
\]



Self-hosted environments retain the different output-path semantics defined by the environment layer; this managed output path must not be assumed for arbitrary self-hosted runtimes.

---

# 92. Mid-Session Agent Mutation Is Intentionally Narrow

After session creation, only:

\[
\boxed{
tools
}
\]

and:

\[
\boxed{
mcp\_servers
}
\]

may be changed inside the session's agent snapshot.

This includes permission-policy modifications.

The changes are:

\[
session\text{-local}
\]

and do not modify the underlying agent resource or create a new agent version.

---

# 93. Model, System, and Skills Are Creation-Time Effective State

After session creation:

\[
model
\]

\[
system
\]

\[
skills
\]

cannot be replaced through session-agent updates.

If alternate values are required, they must be established through session creation overrides.

The configured system field itself remains fixed for the session lifetime, although models supporting system-level guidance may accept additional `system.message` events without mutating that stored field.

---

# 94. Mid-Session Tools Update Uses Full Replacement

If:

\[
T_{old}
=
\{t_1,t_2,t_3\}
\]

and session update provides:

\[
T_{new}
=
\{t_4\},
\]

then:

\[
T^{*}
=
\{t_4\}.
\]

It does not append.

The same full-replacement semantics apply to:

\[
mcp\_servers.
\]

To preserve entries:

\[
GET\ current\ session
\rightarrow
modify\ complete\ array
\rightarrow
POST\ replacement.
\]



---

# 95. Session Must Be Idle Before Agent-Configuration Update

For:

\[
\sigma=running,
\]

attempting to update the session agent's tools/server configuration is invalid.

The required sequence is:

\[
running
\rightarrow
interrupt
\rightarrow
idle
\rightarrow
update.
\]



---

# 96. Retrieving the Session Is the Canonical State Read

A session can be explicitly retrieved to inspect current:

\[
\{
status,
effective\ agent,
budget,
usage,
outcome\ state,
\dots
\}.
\]

This is especially important when asynchronous notifications are merely hints rather than the canonical complete resource representation.

---

# 97. Session Listing Uses Cursor Pagination

Session listing returns:

\[
next\_page
\]

and:

\[
prev\_page.
\]

The first page has:

\[
prev\_page=null.
\]

The terminal page has:

\[
next\_page=null.
\]

Pagination may move in either direction.

---

# 98. Session Cursor Encodes Sort Order

The cursor is opaque and encodes the request's ordering.

Ordering is:

\[
order
\in
\{
asc,
desc
\}
\]

by creation time, with:

\[
default=desc.
\]

Reusing a cursor with a different `order` produces:

\[
400.
\]

Changing the creation-time filter so that the cursor position is excluded also produces:

\[
400.
\]

Other filters and page `limit` may change between requests.

---

# 99. Archiving Preserves History but Stops Future Events

Archiving:

\[
Archive(S)
\]

means:

\[
\boxed{
\text{prevent future event submission}
+
\text{preserve history}.
}
\]

A running session cannot be archived directly.

Required sequence:

\[
running
\rightarrow
interrupt
\rightarrow
idle
\rightarrow
archive.
\]



---

# 100. Deletion Is Destructive

Deleting:

\[
Delete(S)
\]

permanently removes:

\[
\boxed{
\{
session\ record,
events,
associated\ sandbox
\}.
}
\]

A running session must first be interrupted.

---

# 101. Session Deletion Does Not Cascade to Independent Resources

Deleting a session does not delete:

\[
\{
agent,
environment,
skills,
vaults,
memory\ stores
\}.
\]

Likewise, files uploaded independently through the general file service are unaffected.

These resources have independent lifecycles.

---

# 102. Session-Produced Files Do Cascade with Session Deletion

Files generated by the session itself are session-scoped.

Therefore:

\[
Delete(S)
\Rightarrow
Delete(F_{\text{session-generated}}).
\]

Anything requiring retention must be downloaded or copied before deleting the session.

---

# 103. Real-Time Stream and Webhook Have Different Roles

For an actively observed interaction:

\[
\boxed{
SSE
=
\text{fine-grained real-time event stream}.
}
\]

For asynchronous major-state notification:

\[
\boxed{
Webhook
=
\text{state-change notification}.
}
\]

The webhook source explicitly distinguishes long-running session notifications from the real-time SSE interaction channel.

---

# 104. Webhook Is a Pointer, Not the Full Resource

A webhook carries:

\[
\{
event\ type,
resource\ id
\}
\]

rather than the complete session object.

The correct consumption model is:

\[
\boxed{
Webhook
\rightarrow
ExtractID
\rightarrow
GET\ canonical\ resource.
}
\]

This avoids making decisions from potentially stale duplicated delivery payloads.

---

# 105. Session Webhook Event Surface

Major session notifications include:

\[
\{
session.status\_run\_started,
session.status\_idled,
session.budget\_reached,
session.status\_rescheduled,
session.status\_terminated,
\]

\[
session.thread\_created,
session.thread\_idled,
session.thread\_terminated,
session.outcome\_evaluation\_ended,
session.updated,
session.deleted
\}.
\]



---

# 106. `status_run_started` Fires on Every Transition to Running

The notification is not limited to initial session start.

Every:

\[
\sigma
\rightarrow
running
\]

transition can trigger:

\[
session.status\_run\_started.
\]

This includes resumed execution after prior idle states.

---

# 107. Budget-Reached Webhook Is Armed Per Budget Value

The:

\[
session.budget\_reached
\]

notification fires at most once for each configured budget value.

Changing the budget arms the notification again.

---

# 108. Child Thread Completion Is Also Idle-Oriented

For coordinator-spawned child work, ordinary completion surfaces as thread idle rather than thread termination.

Thread termination denotes archival or retry exhaustion; advisor consultation has distinct termination semantics after consultation completion.

This mirrors the top-level principle:

\[
\boxed{
successful completion
\neq
termination.
}
\]

---

# 109. Webhook Endpoint Requirements

A webhook endpoint requires:

\[
HTTPS
\]

on:

\[
port\ 443
\]

with a publicly resolvable hostname.

It also has:

\[
EventTypeSubscription
\]

and a generated:

\[
32\text{-byte signing secret}.
\]

The secret is shown once and must be retained securely.

---

# 110. Webhook Signature Verification

Each delivery carries:

\[
webhook-id,
\]

\[
webhook-timestamp,
\]

\[
webhook-signature.
\]

Signature verification is performed against the original request bytes.

The supplied verification helper rejects invalid signatures and payloads whose delivery timestamp is more than approximately:

\[
5\text{ minutes}
\]

old.

---

# 111. Raw Payload Integrity Matters

Because the signature covers the original webhook body:

\[
Verify(Parse(body))
\]

is unsafe if parsing modifies bytes before verification.

Correct order:

\[
\boxed{
ReceiveRawBytes
\rightarrow
VerifySignature
\rightarrow
ParseEvent.
}
\]

This is why middleware that automatically rewrites the body before verification must be avoided.

---

# 112. Webhook Acknowledgment

Any:

\[
2xx
\]

response acknowledges delivery.

Other responses are failures, subject to special redirect behavior.



---

# 113. Redirects Are Not Followed

A:

\[
3xx
\]

response is not followed.

It immediately disables the endpoint.

Therefore a webhook endpoint migration requires explicit URL reconfiguration rather than HTTP redirect chaining.

---

# 114. Webhook Event ID Is the Deduplication Key

The top-level webhook event has:

\[
event.id.
\]

The same event delivered multiple times retains the same ID.

Therefore:

\[
\boxed{
if\ event.id\in ProcessedIDs:
discard\ duplicate.
}
\]



---

# 115. Webhooks Do Not Backfill Missed Subscription Windows

An event is delivered only if the endpoint is subscribed to its event type when that event occurs.

If:

\[
subscription(t_e)=0,
\]

then subscribing later does not replay:

\[
e.
\]



Thus subscription configuration must exist before the transition being observed.

---

# 116. Webhook Ordering Is Not Guaranteed

Suppose canonical event order is:

\[
e_1
\rightarrow
e_2.
\]

Delivery may be:

\[
e_2
\rightarrow
e_1.
\]

For example, an idle notification may be delivered before the outcome-evaluation notification that logically preceded it.

Therefore:

\[
\boxed{
WebhookArrivalOrder
\neq
CanonicalStateOrder.
}
\]

Applications should fetch the resource and derive current state from it rather than replaying webhook arrival order as a state machine.

---

# 117. Webhook Retries Are Finite

For each endpoint-event pair, delivery is attempted up to:

\[
\boxed{
3\ times.
}
\]

Retry delay uses jittered exponential backoff between approximately:

\[
5
\]

and:

\[
120\text{ seconds}.
\]

After final failure:

\[
\boxed{
event\ dropped.
}
\]

There is no durable replay queue exposed through the webhook mechanism.

---

# 118. Webhook Is Not an Audit Log

Because:

\[
\{
duplicates,
missing subscriptions,
reordering,
finite retries,
drop-after-failure
\}
\]

are all allowed,

\[
\boxed{
Webhooks
\neq
DurableEventLog.
}
\]

If exact state reconciliation is required:

\[
\boxed{
fetch/list\ canonical\ resources.
}
\]

---

# 119. Webhook Timestamp and Event Time Are Different

`webhook-timestamp` represents the delivery attempt's signing time.

It is regenerated on retry.

The event's:

\[
created\_at
\]

represents when the logical event occurred.

Therefore:

\[
\boxed{
t_{delivery}
\neq
t_{event}.
}
\]



---

# 120. Automatic Webhook Disable Conditions

The endpoint can be automatically disabled when:

\[
\boxed{
\text{HTTP redirect}
}
\]

or:

\[
\boxed{
\text{endpoint resolves to a non-public IP}
}
\]

or:

\[
\boxed{
\text{sustained continuous delivery failures}.
}
\]

A successful:

\[
2xx
\]

resets the sustained-failure window.

Events emitted while an endpoint is disabled are not replayed later.

---

# 121. Complete Delegation State Machine

The normal conversational execution can be represented as:

\[
\boxed{
\begin{aligned}
&
A_v + E
\\
&\downarrow\\
&
CreateSession
\\
&\downarrow\\
&
\sigma=idle
\\
&\downarrow\quad user.message
\\
&
\sigma=running
\\
&\downarrow\\
&
ModelStep
\\
&\downarrow\\
&
\begin{cases}
message\\
tool\ request\\
external\ action\\
grader\ evaluation\\
retry\\
\end{cases}
\\
&\downarrow\\
&
Observation
\\
&\downarrow\\
&
Continue?
\\
&\begin{cases}
yes \rightarrow running\\
requires\ action \rightarrow idle\\
budget\ reached \rightarrow idle\\
turn\ complete \rightarrow idle\\
unrecoverable \rightarrow terminated
\end{cases}
\end{aligned}
}
\]

---

# 122. Complete Outcome-Driven State Machine

\[
\boxed{
\begin{aligned}
&
user.define\_outcome
\\
&\downarrow\\
&
Produce\ Artifact_0
\\
&\downarrow\\
&
EvaluationStart(iteration=0)
\\
&\downarrow\\
&
Grader(Artifact_0,R)
\\
&\downarrow\\
&
r_0
\\[4pt]
&
r_0=satisfied
\Rightarrow
idle
\\[4pt]
&
r_0=needs\_revision
\Rightarrow
Feedback_0
\rightarrow
Artifact_1
\\
&\qquad\qquad\downarrow
\\
&\qquad\qquad
EvaluationStart(iteration=1)
\\[4pt]
&
r_k=max\_iterations\_reached
\Rightarrow
final\ acknowledgment
\rightarrow
idle
\\[4pt]
&
r_k=failed
\Rightarrow
idle
\\[4pt]
&
user.interrupt
\Rightarrow
r=interrupted.
\end{aligned}
}
\]

---

# 123. Complete Session Cost-Control Loop

\[
\boxed{
\begin{aligned}
&
C_t
=
Cost(Session_{\leq t})
\\
&
\textbf{before model request }q_t:
\\
&
\textbf{if }
C_t < B:
\\
&
\qquad Admit(q_t)
\\
&
\qquad Execute(q_t)
\\
&
\qquad C_{t+1}
\leftarrow
C_t + Cost(q_t)
\\
&
\textbf{else:}
\\
&
\qquad RejectNewModelWork
\\
&
\qquad status\leftarrow idle
\\
&
\qquad stop\_reason\leftarrow budget\_reached.
\end{aligned}
}
\]

The boundary is checked before admission, not during execution.

---

# 124. Complete Credential Injection Loop

For environment-variable credentials:

\[
\boxed{
\begin{aligned}
&
env[k]
\leftarrow
placeholder_c
\\
&
Request
\leftarrow
BuildOutboundRequest()
\\
&
\textbf{if }
Host(Request)\in H_c
\\
&
\land
Location(placeholder_c)\in L_c
\\
&
\land
Host(Request)\in H_E:
\\
&
\qquad
placeholder_c
\rightarrow
secret_c
\\
&
\qquad
Transmit(Request)
\\
&
\textbf{else:}
\\
&
\qquad
TransmitLiteralPlaceholder
\quad
\text{or network policy denies request}.
\end{aligned}
}
\]

This separates:

\[
\boxed{
secret eligibility
}
\]

from:

\[
\boxed{
network reachability.
}
\]

---

# 125. Complete Webhook Consumption Algorithm

\[
\boxed{
\begin{aligned}
&
Receive(rawBody,headers)
\\
&
VerifySignature(rawBody,headers)
\\
&
\textbf{if invalid:}
\quad Reject
\\
&
event\leftarrow Parse(rawBody)
\\
&
\textbf{if }event.id\in Seen:
\quad Ack2xx
\\
&
Seen\leftarrow Seen\cup\{event.id\}
\\
&
(type,id)\leftarrow event.data
\\
&
resource
\leftarrow
GET(id)
\\
&
ReconcileLocalState(resource)
\\
&
Ack2xx.
\end{aligned}
}
\]

Do not derive authoritative state solely from webhook arrival order.

---

# 126. Delegation Reproducibility Envelope

A reproducible delegated execution requires more than:

\[
session\_id.
\]

The effective execution identity is approximately:

\[
\boxed{
\mathcal R_S
=
(
agent\_id,
agent\_version,
session\_overrides,
environment\_id,
vault\_ids,
budget,
initial\_events,
outcome\ rubric,
max\_iterations
).
}
\]

For stronger forensic reproducibility, combine this with the environment fingerprint developed in the previous layer:

\[
\mathcal R
=
\mathcal R_S
\cup
\mathcal R_E.
\]

---

# 127. Delegation Failure Classes

The runtime contract exposes several distinct failure domains:

\[
\boxed{
F=
\{
F_{creation},
F_{agent-resolution},
F_{override},
F_{event-validation},
F_{credential},
F_{tool},
F_{budget},
F_{grader},
F_{runtime},
F_{notification}
\}.
}
\]

Examples include:

\[
model=null
\rightarrow
creation\ rejection,
\]

\[
invalid\ initial\ event
\rightarrow
no\ session,
\]

\[
missing\ external\ credential
\rightarrow
unauthenticated\ attempt,
\]

\[
budget\ reached
\rightarrow
idle,
\]

\[
transient\ runtime\ failure
\rightarrow
rescheduling,
\]

\[
rubric\ contradiction
\rightarrow
outcome\ failed,
\]

\[
webhook\ final\ retry\ exhausted
\rightarrow
notification\ dropped.
\]

These outcomes must not be collapsed into one generic “agent failed” state.

---

# 128. Operational Completion Predicate

A production caller should not use:

\[
status=idle
\]

alone as:

\[
TaskSuccess=1.
\]

Instead evaluate:

\[
\boxed{
Completion
=
f(
status,
stop\_reason,
outcome\ result,
pending\ actions,
budget,
artifact\ state
).
}
\]

For an outcome-driven workload:

\[
TaskSuccess
\iff
outcome.result=satisfied.
\]

For conversational work:

\[
TaskQuiescent
\iff
status=idle,
\]

but semantic success still depends on the produced events/artifacts.

---

# 129. Task Delegation Is an Admission-Control Problem

At a systems level, delegating work is the composition of several independent gates:

\[
\boxed{
Admit(Task)
=
AgentValid
\land
EnvironmentValid
\land
EventValid
\land
CredentialValidEnough
\land
BudgetAllowsNewWork
\land
SessionStateAllowsInput.
}
\]

Execution then adds:

\[
ToolPermission
\]

\[
NetworkAuthority
\]

\[
RuntimeAvailability.
\]

Therefore:

\[
\boxed{
\text{accepted user intent}
\neq
\text{guaranteed executable side effect}.
}
\]

---

# 130. Final End-to-End Delegation Procedure

\[
\boxed{
\begin{aligned}
&
\textbf{Input:}
\\
&
Agent\ A,
Environment\ E,
Task\ Q,
UserAuthority\ V,
CostPolicy\ B,
QualityTarget\ O
\\[5pt]
&
\textbf{1. Resolve agent reference}
\\
&
A^{base}
\leftarrow
\begin{cases}
Latest(A.id),\\
A_{id,v}
\end{cases}
\\[5pt]
&
\textbf{2. Apply creation-time session overrides}
\\
&
A^{*}
\leftarrow
Override(
A^{base},
model?,
system?,
tools?,
mcp\_servers?,
skills?
)
\\[5pt]
&
\textbf{3. Validate override invariants}
\\
&
model\neq\varnothing
\\
&
skills\neq\varnothing
\Rightarrow
required\ tools\ available
\\
&
mcp\ toolset
\Rightarrow
matching\ server\ declaration
\\[5pt]
&
\textbf{4. Bind execution environment}
\\
&
S.environment
\leftarrow
E.id
\\[5pt]
&
\textbf{5. Bind per-session credentials}
\\
&
S.vaults
\leftarrow
V
\\[5pt]
&
\textbf{6. Attach budget if required}
\\
&
S.budget
\leftarrow
B
\\[5pt]
&
\textbf{7A. Conversational delegation}
\\
&
e_0
\leftarrow
user.message(Q)
\\[5pt]
&
\textbf{7B. Outcome delegation}
\\
&
e_0
\leftarrow
user.define\_outcome(
description,
rubric,
max\_iterations
)
\\[5pt]
&
\textbf{8. Create}
\\
&
S
\leftarrow
CreateSession(
A^{*},
E,
V,
B,
initial\_events?
)
\\[5pt]
&
\textbf{9. If no initial event}
\\
&
status(S)
=
idle
\\
&
Send(e_0)
\\[5pt]
&
\textbf{10. Enter execution}
\\
&
status(S)
\leftarrow
running
\\[5pt]
&
\textbf{11. Iterate}
\\
&
\textbf{while }
status(S)=running:
\\
&
\qquad
CheckBudget()
\\
&
\qquad
ModelStep()
\\
&
\qquad
ExecuteTools()
\\
&
\qquad
PersistEvents()
\\
&
\qquad
UpdateUsage()
\\
&
\qquad
\textbf{if outcome active:}
\\
&
\qquad\qquad
EvaluateArtifact()
\\
&
\qquad\qquad
\textbf{if needs\_revision:}
\\
&
\qquad\qquad\qquad
FeedBackToAgent()
\\
&
\qquad\qquad\qquad
Continue()
\\[5pt]
&
\textbf{12. Quiescence}
\\
&
status(S)
\leftarrow
idle
\\
[5pt]
&
\textbf{13. Determine cause}
\\
&
reason
\leftarrow
\{
end\_turn,
requires\_action,
budget\_reached,
outcome\ terminal,
\dots
\}
\\[5pt]
&
\textbf{14. Retrieve artifacts and canonical state}
\\
&
Artifacts
\leftarrow
ListFiles(scope=S.id)
\\
&
State
\leftarrow
RetrieveSession(S.id)
\\[5pt]
&
\textbf{15. Continue, archive, or delete}
\\
&
\begin{cases}
SendNewWork(S),\\
Archive(S),\\
Delete(S).
\end{cases}
\end{aligned}
}
\]

---

# 131. Final Architectural Interpretation

The phrase **“delegate work to your agent”** refers to a much larger operation than sending an instruction.

It is:

\[
\boxed{
\text{Configuration Resolution}
+
\text{Execution Binding}
+
\text{Task Admission}
+
\text{Identity Binding}
+
\text{Cost Admission}
+
\text{Stateful Iteration}
+
\text{Quality Evaluation}
+
\text{Lifecycle Management}.
}
\]

The resulting execution path is:

\[
\boxed{
\begin{array}{c}
\text{Versioned Agent}
\\
+
\\
\text{Execution Environment}
\\
\downarrow
\\
\text{Session Creation}
\\
\downarrow
\\
\text{Resolved Agent Snapshot}
\\
\downarrow
\\
\text{Session Credentials + Budget}
\\
\downarrow
\\
\text{User Message / Defined Outcome}
\\
\downarrow
\\
\text{Running}
\\
\downarrow
\\
\text{Reasoning}
\\
\downarrow
\\
\text{Tool Execution}
\\
\downarrow
\\
\text{Observations}
\\
\downarrow
\\
\text{Usage + Budget Accounting}
\\
\downarrow
\\
\text{Optional Grader}
\\
\downarrow
\\
\text{Revision Loop}
\\
\downarrow
\\
\text{Idle}
\\
\downarrow
\\
\text{Continue / Archive / Delete}
\end{array}
}
\]

The decisive architectural invariant is:

\[
\boxed{
\textbf{
a session is the unit of delegated autonomous work.
}
}
\]

The agent defines **capability**.

The environment defines **execution authority**.

The session defines **the concrete execution identity, history, user authority, budget, objective, usage, and lifecycle**.

The work event defines **what must happen now**.

An outcome additionally defines:

\[
\boxed{
\textbf{
how the system determines whether the work is actually good enough to stop.
}
}
\]

Consequently the full delegation boundary is:

\[
\boxed{
\text{Agent}
\cap
\text{Environment}
\cap
\text{Session Snapshot}
\cap
\text{Credential Scope}
\cap
\text{Budget}
\cap
\text{Task Event}
\cap
\text{Outcome Criterion}.
}
\]

Only after all of these are resolved does an abstract autonomous capability become a controlled, attributable, measurable, stateful unit of work.