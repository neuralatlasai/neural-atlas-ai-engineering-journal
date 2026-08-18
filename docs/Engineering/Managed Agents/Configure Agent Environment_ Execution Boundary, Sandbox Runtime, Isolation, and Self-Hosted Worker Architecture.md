# Configure Agent Environment  
## Execution Boundary, Sandbox Runtime, Isolation, and Self-Hosted Worker Architecture

### Abstract

The agent environment is the **execution-boundary specification** of a managed agent system. The agent definition determines what intelligence, instructions, tools, and skills exist; the environment determines the operating system, filesystem, software runtime, network reachability, execution locality, isolation boundary, and—in self-hosted deployments—the worker architecture through which those capabilities can actually execute.

The distinction is fundamental:

\[
\boxed{
\text{Agent}
=
\text{behavior + capability specification}
}
\]

while:

\[
\boxed{
\text{Environment}
=
\text{execution substrate + authority boundary}
}
\]

and:

\[
\boxed{
\text{Session Sandbox}
=
\text{one concrete isolated execution instance}.
}
\]

An environment is reusable across many sessions, but the environment object is **not** a shared running container. In cloud execution, every session receives its own fresh isolated Linux sandbox even when multiple sessions reference the same environment configuration.

Formally:

\[
\boxed{
\mathcal E
=
(
\tau,
R,
P,
N,
F,
I,
X,
L
)
}
\]

where

\[
\begin{aligned}
\tau &:= \text{environment type},\\
R &:= \text{runtime substrate},\\
P &:= \text{package/dependency configuration},\\
N &:= \text{network authority},\\
F &:= \text{filesystem semantics},\\
I &:= \text{isolation model},\\
X &:= \text{execution ownership},\\
L &:= \text{environment lifecycle state}.
\end{aligned}
\]

The environment therefore determines the physical and security semantics of:

\[
\boxed{
\text{reasoning intent}
\rightarrow
\text{tool invocation}
\rightarrow
\text{real-world execution}.
}
\]

---

# 1. System Position of the Environment Layer

The complete runtime stack is:

\[
\boxed{
\mathcal A_v
+
\mathcal E
\rightarrow
\mathcal S_i
\rightarrow
\mathcal B_i
\rightarrow
\mathcal X_i
}
\]

where:

\[
\mathcal A_v
=
\text{versioned agent specification},
\]

\[
\mathcal E
=
\text{environment specification},
\]

\[
\mathcal S_i
=
\text{session},
\]

\[
\mathcal B_i
=
\text{session-specific sandbox},
\]

and:

\[
\mathcal X_i
=
\text{tool/process execution}.
\]

The environment exists between agent configuration and concrete execution:

\[
\boxed{
\text{Agent}
\rightarrow
\text{Environment}
\rightarrow
\text{Session}
\rightarrow
\text{Sandbox}
\rightarrow
\text{Tool Execution}.
}
\]

This means:

\[
\operatorname{Capability}(A)
\neq
\operatorname{Authority}(E).
\]

An agent may declare:

\[
bash
\]

but the process executed through `bash` can only exercise authority provided by the environment.

Similarly, a tool may know how to perform HTTP requests, but:

\[
\operatorname{Reachable}(host)
\]

is constrained independently by the environment's network policy.

---

# 2. Environment Is Configuration, Sandbox Is Runtime State

An environment is created once:

\[
\mathcal E_j
=
\operatorname{CreateEnvironment}(C_j)
\]

and referenced by identifier:

\[
environment\_id_j.
\]

Sessions then instantiate:

\[
\mathcal B_i
=
\operatorname{Provision}
(
\mathcal E_j,
\mathcal S_i
).
\]

For two sessions:

\[
\mathcal S_1,\mathcal S_2
\rightarrow
\mathcal E_j,
\]

the corresponding sandboxes satisfy:

\[
\boxed{
\mathcal B_1\neq\mathcal B_2.
}
\]

In cloud mode specifically:

\[
F_{\mathcal B_1}
\cap
F_{\mathcal B_2}
=
\varnothing
\]

from the session-filesystem perspective.

The platform explicitly states that multiple sessions may reuse the same environment while receiving separate fresh containers and without sharing filesystem state.

Therefore:

\[
\boxed{
\text{environment reuse}
\neq
\text{sandbox reuse}.
}
\]

This distinction prevents accidental assumptions of cross-session state persistence.

---

# 3. Environment Type

The top-level execution topology is:

\[
\tau
\in
\{
cloud,
self\_hosted
\}.
\]

These represent two different ownership boundaries, not two cosmetic deployment options.

---

# 4. Cloud Execution Topology

For:

\[
\tau=cloud,
\]

execution is approximately:

\[
\boxed{
\begin{array}{c}
\text{Control Plane}
\\
\downarrow
\\
\text{Session Scheduler}
\\
\downarrow
\\
\text{Managed Sandbox Provisioner}
\\
\downarrow
\\
\text{Fresh Linux Container}
\\
\downarrow
\\
\text{Tool Processes / Files / Network}
\end{array}
}
\]

The system manages:

\[
\{
\text{container provisioning},
\text{runtime image},
\text{base software},
\text{per-session isolation},
\text{sandbox lifecycle}
\}.
\]

The environment specifies configuration reused across those sandbox instances.

---

# 5. Self-Hosted Execution Topology

For:

\[
\tau=self\_hosted,
\]

orchestration remains in the managed control plane, while tool execution moves into infrastructure controlled by the operator.

The split becomes:

\[
\boxed{
\begin{array}{ccc}
\text{Managed Control Plane}
&
\longleftrightarrow
&
\text{Operator Execution Plane}
\\[4pt]
\text{model reasoning}
&&
\text{process execution}
\\
\text{session orchestration}
&&
\text{filesystem}
\\
\text{work queue}
&&
\text{network egress}
\\
\text{tool request generation}
&&
\text{tool implementation}
\end{array}
}
\]

Tool inputs and outputs still cross the control-plane boundary so that the model can observe execution results and determine subsequent actions, but processes, filesystem state, and network reachability execute on the operator-controlled host.

Thus self-hosting changes:

\[
\boxed{
\text{where actions execute}
}
\]

not:

\[
\boxed{
\text{where model reasoning executes}.
}
\]

---

# 6. Model Selection Does Not Belong to the Environment

The environment does not select the language model.

Formally:

\[
M
\in
\mathcal A
\]

rather than:

\[
M
\in
\mathcal E.
\]

This matters because:

\[
\boxed{
\text{intelligence configuration}
\perp
\text{execution substrate}.
}
\]

The same agent model can execute tools through different environment topologies without changing the model field itself.

---

# 7. Cloud Sandbox Base Runtime

The managed cloud sandbox is an isolated Linux container with approximately the following base specification:

\[
OS
=
Ubuntu\ 22.04\ LTS
\]

\[
Architecture
=
x86\_64
\]

\[
Memory
\leq
8\ \text{GB}
\]

\[
Disk
\leq
10\ \text{GB}.
\]

These are execution limits of the sandbox substrate and therefore constrain tool workloads.

For example:

\[
MemoryWorkingSet(task)
>
8\text{ GB}
\]

cannot be assumed to succeed merely because the reasoning model can plan the operation.

Similarly:

\[
ArtifactSize
+
Dependencies
+
TemporaryFiles
>
10\text{ GB}
\]

creates a disk-capacity failure domain.

---

# 8. Preinstalled Language Runtimes

The cloud image provides several language toolchains without runtime installation:

| Runtime | Baseline |
|---|---:|
| Python | 3.12+ |
| Node.js | 20+ |
| Go | 1.22+ |
| Rust | 1.77+ |
| Java | 21+ |
| Ruby | 3.3+ |
| PHP | 8.3+ |
| C/C++ | GCC 13+ |

Associated package ecosystems include:

\[
\{
pip,
uv,
npm,
yarn,
pnpm,
go\ modules,
cargo,
maven,
gradle,
bundler,
gem,
composer,
make,
cmake
\}.
\]

This means a large subset of software-development tasks begin from:

\[
\text{ready runtime}
\]

rather than:

\[
\text{bootstrap compiler/interpreter}.
\]

However:

\[
\boxed{
\text{preinstalled runtime}
\neq
\text{fully pinned reproducible dependency environment}.
}
\]

Application-specific dependency pinning remains a separate requirement.

---

# 9. Database Surface

The sandbox includes:

\[
SQLite
\]

for local database execution.

It additionally includes clients such as:

\[
psql
\]

and:

\[
redis-cli
\]

for external services.

The distinction is:

\[
\boxed{
SQLite
=
\text{local database engine}
}
\]

while:

\[
\boxed{
PostgreSQL/Redis utilities
=
\text{clients only}.
}
\]

Therefore:

\[
psql\in\mathcal B
\]

does not imply:

\[
PostgreSQLServer\in\mathcal B.
\]

External server reachability still depends on:

\[
N(\mathcal E).
\]

---

# 10. System Utility Surface

The sandbox also exposes a broad utility substrate:

\[
\{
git,
curl,
wget,
jq,
tar,
zip,
unzip,
ssh,
scp,
tmux,
screen
\}
\]

together with development utilities such as:

\[
\{
make,
cmake,
docker,
rg,
tree,
htop
\}
\]

and text-processing utilities:

\[
\{
sed,
awk,
grep,
vim,
nano,
diff,
patch
\}.
\]

The presence of an executable does not imply unconstrained operation.

For example:

\[
ssh\ installed
\not\Rightarrow
ssh\ destination\ reachable.
\]

Network policy still dominates:

\[
\operatorname{Execute}(ssh,h)
\Rightarrow
h\in N_{reachable}.
\]

---

# 11. Package Layer

Cloud environments support an explicit package specification:

\[
P
=
\{
P_{apt},
P_{cargo},
P_{gem},
P_{go},
P_{npm},
P_{pip}
\}.
\]

Supported managers include:

| Field | Dependency ecosystem |
|---|---|
| `apt` | operating-system packages |
| `cargo` | Rust |
| `gem` | Ruby |
| `go` | Go modules |
| `npm` | Node.js |
| `pip` | Python |

Packages are installed before agent execution begins and cached across sessions that reference the same environment.

This produces:

\[
\boxed{
\text{environment package cache}
\neq
\text{session filesystem state}.
}
\]

The package installation result may be reused operationally even though individual session workspaces remain isolated.

---

# 12. Package Installation Ordering

When multiple package managers are configured, installation order is deterministic:

\[
apt
\rightarrow
cargo
\rightarrow
gem
\rightarrow
go
\rightarrow
npm
\rightarrow
pip.
\]

That is:

\[
P_1,\dots,P_n
=
sort_{\text{lexical manager}}
(P).
\]

This matters when dependencies across package ecosystems have implicit installation-order assumptions.

The source explicitly defines both cross-session package caching and manager execution order.

---

# 13. Dependency Version Pinning

A package may be specified as:

\[
p
\]

or:

\[
p@v
\]

depending on package-manager syntax.

If unpinned:

\[
version(p,t)
=
latest(t).
\]

Therefore:

\[
EnvironmentConfig_{t_1}
=
EnvironmentConfig_{t_2}
\]

does **not** necessarily imply:

\[
InstalledDependencyGraph_{t_1}
=
InstalledDependencyGraph_{t_2}.
\]

For reproducibility:

\[
\boxed{
\forall p\in P:
version(p)=v_p
}
\]

should be preferred where the package ecosystem permits it.

Otherwise an environment identifier may instantiate a different software graph at different times.

---

# 14. Environment Reproducibility Is Weaker Than Agent Reproducibility

Agent configurations are versioned.

Cloud environments are explicitly **not versioned**.

Therefore:

\[
\boxed{
\mathcal A_v
\text{ has native revision identity}
}
\]

while:

\[
\boxed{
\mathcal E
\text{ does not expose an equivalent version history}.
}
\]

This creates an important audit gap.

If:

\[
\mathcal E(t_1)
\neq
\mathcal E(t_2),
\]

the same:

\[
environment\_id
\]

does not itself provide a historical snapshot identifier.

For reproducible deployment, operators therefore need an external representation:

\[
\boxed{
ERevision
=
Hash(
type,
packages,
networking,
runtime assumptions
).
}
\]

Persist this revision with session metadata or deployment records.

---

# 15. Network Policy Is a Separate Authority Plane

The environment network field governs outbound access from the sandbox:

\[
N
=
\operatorname{NetworkPolicy}().
\]

Current cloud modes are:

\[
N.type
\in
\{
unrestricted,
limited
\}.
\]

---

# 16. Unrestricted Networking

Under:

\[
N.type=unrestricted,
\]

the sandbox receives broad outbound connectivity, subject to a general safety blocklist.

This is the API default.

Therefore an environment with omitted restrictive network policy effectively has:

\[
ReachableHosts
\approx
Internet
-
Blocklist.
\]

For an autonomous tool-execution system, this is a large authority surface.

---

# 17. Limited Networking

Under:

\[
N.type=limited,
\]

sandbox egress becomes:

\[
ReachableHosts
=
H_{allowed}
\cup
H_{package}
\cup
H_{mcp},
\]

where the latter two components exist only if explicitly enabled.

The configuration contains:

\[
N=
(
allowed\_hosts,
allow\_package\_managers,
allow\_mcp\_servers
).
\]

Production guidance in the source explicitly recommends limited networking with a narrowly defined host allow-list.

---

# 18. Allowed-Host Semantics

Entries in:

\[
allowed\_hosts
\]

are hostnames rather than URLs.

Valid conceptual forms include:

\[
api.example.com
\]

or wildcard domains:

\[
*.example.com.
\]

The configuration does not accept the host as:

\[
https://api.example.com:443/v1.
\]

That is, the allow-list representation excludes:

\[
\{
scheme,
port,
path
\}.
\]

The policy is hostname-oriented.

---

# 19. Package Registry Egress Is Explicitly Separable

For limited networking:

\[
allow\_package\_managers
=
false
\]

by default.

If:

\[
allow\_package\_managers=true,
\]

the sandbox may contact supported public package registries outside the explicit host allow-list.

Therefore:

\[
\boxed{
\text{dependency-install egress}
}
\]

is an independent permission dimension.

This is operationally useful because build-time registry access and runtime service access have different trust characteristics.

---

# 20. External Tool Server Egress Is Also Separable

Likewise:

\[
allow\_mcp\_servers=false
\]

by default under limited networking.

When enabled:

\[
ReachableHosts
\supseteq
ConfiguredExternalToolServers.
\]

This creates a connection between two different control-plane objects:

\[
\boxed{
Agent.external\_servers
\longrightarrow
Environment.networking
}
\]

because the agent may declare a server that the environment would otherwise block.

---

# 21. Sandbox Networking Does Not Govern Web Tools

A critical boundary is:

\[
\boxed{
Environment.networking
\neq
WebToolDomainPolicy.
}
\]

The environment network setting governs outbound networking from sandbox processes.

It does **not** determine the domains allowed by managed `web_search` or `web_fetch` tool implementations.

Therefore:

\[
N.type=limited
\]

does not by itself imply:

\[
web\_fetch
\]

is restricted to:

\[
allowed\_hosts.
\]

This is a separate capability/policy plane.

---

# 22. Network Authority Must Be Evaluated Per Execution Path

A request to obtain remote data may execute through multiple routes:

\[
\boxed{
\begin{aligned}
&\text{shell HTTP client}
&&\rightarrow
N(\mathcal E)
\\
&\text{custom tool}
&&\rightarrow
N(\text{custom-tool host})
\\
&\text{external protocol tool}
&&\rightarrow
N_{mcp}
\\
&\text{managed web tool}
&&\rightarrow
N_{web-tool}.
\end{aligned}
}
\]

Therefore a security audit must ask:

\[
\boxed{
\text{Which execution path reaches the resource?}
}
\]

not merely:

\[
\boxed{
\text{Is networking limited?}
}
\]

---

# 23. Cloud Sandbox Isolation

For cloud sessions:

\[
\mathcal S_i
\rightarrow
\mathcal B_i
\]

with:

\[
\mathcal B_i
=
\text{fresh isolated Linux container}.
\]

This gives:

\[
ProcessNamespace_i
\neq
ProcessNamespace_j
\]

and logically:

\[
Filesystem_i
\neq
Filesystem_j.
\]

The source explicitly states that sessions referencing the same environment do not share filesystem state.

Environment configuration reuse therefore occurs above the sandbox-state layer.

---

# 24. Environment Lifecycle

Cloud environments persist until:

\[
archive
\]

or:

\[
delete.
\]

The lifecycle is:

\[
\boxed{
active
\rightarrow
archived
}
\]

or:

\[
\boxed{
active
\rightarrow
deleted
}
\]

subject to reference constraints.

Archiving makes the environment read-only for new usage while allowing existing associated execution to continue.

Deletion requires that no session reference the environment.

Thus:

\[
\boxed{
archive
\neq
delete.
}
\]

---

# 25. Cloud Environment Configuration Summary

A useful formalization is:

\[
\boxed{
\mathcal E_{cloud}
=
(
name,
type=cloud,
packages,
networking
).
}
\]

At session creation:

\[
\boxed{
\mathcal B_i
=
ProvisionCloudSandbox(
\mathcal E_{cloud},
\mathcal S_i
).
}
\]

The provisioned sandbox inherits:

\[
\{
BaseImage,
ConfiguredPackages,
NetworkPolicy
\}
\]

but begins with session-isolated runtime state.

---

# 26. Self-Hosted Environment Is a Queue Binding

A self-hosted environment is not itself a machine.

It acts as a control-plane queue abstraction:

\[
\boxed{
\mathcal E_{self}
\approx
\text{work queue + worker authorization boundary}.
}
\]

When session:

\[
\mathcal S_i
\]

targets:

\[
\mathcal E_{self},
\]

the control plane creates:

\[
w_i
=
\operatorname{Enqueue}(\mathcal S_i).
\]

A worker then performs:

\[
w_i
=
\operatorname{Claim}().
\]

The source describes this architecture directly: sessions become work items; workers claim them, construct an execution context, download skills, execute tools, and return results.

---

# 27. Self-Hosted Runtime Flow

The full transition is:

\[
\boxed{
\begin{aligned}
&
\text{Session requests execution}
\\
&\downarrow\\
&
\text{Control plane creates work item}
\\
&\downarrow\\
&
\text{Environment queue}
\\
&\downarrow\\
&
\text{Worker claims work}
\\
&\downarrow\\
&
\text{Worker constructs execution context}
\\
&\downarrow\\
&
\text{Skills synchronized}
\\
&\downarrow\\
&
\text{Tool invocation received}
\\
&\downarrow\\
&
\text{Local tool process executes}
\\
&\downarrow\\
&
\text{Result posted to control plane}
\\
&\downarrow\\
&
\text{Model observes result}
\\
&\downarrow\\
&
\text{next reasoning step}.
\end{aligned}
}
\]

This is a distributed executor architecture.

---

# 28. Worker Deployment Modes

Two principal worker activation models exist:

\[
\boxed{
\text{always-on polling}
}
\]

and:

\[
\boxed{
\text{webhook-triggered polling}.
}
\]

### Always-on

A long-running worker repeatedly requests:

\[
work
=
Poll(Q_E).
\]

Operationally:

\[
worker\ state
=
running
\]

even when:

\[
queue\_depth=0.
\]

### Webhook-triggered

A control-plane notification:

\[
session.status\_run\_started
\]

causes a handler to wake and begin queue polling.

This eliminates the continuously idle polling process but requires a reachable and authenticated webhook endpoint.

The source explicitly describes both models.

---

# 29. Worker Credential Separation

Self-hosted operation uses two distinct credential authorities.

Conceptually:

\[
K_E
=
\text{environment worker key}
\]

and:

\[
K_A
=
\text{application API credential}.
\]

Their responsibilities differ:

\[
K_E
\rightarrow
\{
\text{poll queue},
\text{claim work},
\text{return tool results}
\}
\]

while:

\[
K_A
\rightarrow
\{
\text{create sessions},
\text{administrative API operations},
\text{read queue statistics}
\}.
\]

The source explicitly separates these credentials.

Therefore:

\[
\boxed{
K_A
\notin
\text{worker runtime}
}
\]

should be preferred.

---

# 30. Environment Key Scope

The environment worker key is scoped to the associated environment's work queue.

Thus:

\[
K_E
\rightarrow
Q_E
\]

rather than:

\[
K_E
\rightarrow
\text{all workspace capabilities}.
\]

This is an important blast-radius boundary.

However:

\[
\boxed{
\text{environment key compromise}
}
\]

still compromises the worker authorization domain for that environment.

Consequently the key must be treated as a service credential, not ordinary process configuration.

---

# 31. Environment-Key Storage

For self-hosted deployments:

\[
K_E
\]

should reside in:

\[
SecretsManager
\]

or an equivalent protected credential store.

It should not be baked into:

\[
\{
container\ image,
repository,
plain\ environment\ file
\}.
\]

If exposure is suspected:

\[
\operatorname{Revoke}(K_E)
\]

followed by:

\[
K_E'
=
\operatorname{GenerateReplacement}().
\]

Revocation is checked on requests, so the old key ceases to authorize subsequent worker interactions after revocation propagation.

---

# 32. Worker Host Requirements

The self-hosted worker assumes a Linux execution host.

A particularly strict dependency is:

\[
/bin/bash.
\]

The shell tool invokes that exact executable path rather than resolving `bash` through:

\[
PATH.
\]

Therefore:

\[
\boxed{
/bin/bash\ must\ exist.
}
\]

Additional host requirements depend on worker implementation language, but the source distinguishes these implementation-specific dependencies from the base Linux shell contract.

---

# 33. Working Directory Contract

The canonical self-hosted working directory is:

\[
/workspace.
\]

Tool execution occurs relative to:

\[
workdir.
\]

Skills are materialized under:

\[
<workdir>/skills/<skill-name>/.
\]

Thus with the canonical configuration:

\[
/workspace/skills/<skill-name>/.
\]

If:

\[
workdir
\neq
/workspace,
\]

the persistent agent instruction must account for that location if it needs to refer explicitly to skill paths.

---

# 34. Output Location Differs by Environment Topology

In the managed cloud execution model, the runtime can provide a designated output convention.

In self-hosted execution, final deliverables are written wherever the agent's tool actions place them, normally beneath the chosen work directory.

Therefore:

\[
OutputPath_{cloud}
\neq
OutputPath_{self}.
\]

This affects:

\[
\{
artifact collection,
upload pipelines,
cleanup,
retention,
audit logging
\}.
\]

A self-hosted implementation must explicitly own the output persistence path.

---

# 35. In-Process Worker Model

The simplest self-hosted topology is:

\[
\boxed{
\text{one long-running worker process}
\rightarrow
\text{execute claimed sessions in its working environment}.
}
\]

The worker:

\[
\operatorname{Poll}
\rightarrow
\operatorname{Claim}
\rightarrow
\operatorname{Setup}
\rightarrow
\operatorname{ExecuteTools}
\rightarrow
\operatorname{ReturnResult}.
\]

This minimizes infrastructure complexity.

But its isolation boundary is only as strong as the worker host/process design.

---

# 36. Per-Session Sandbox Model

For stronger isolation:

\[
\boxed{
\forall \mathcal S_i:
\exists \mathcal B_i
}
\]

where each claimed work item launches a fresh sandbox or container.

The worker becomes a supervisor:

\[
\boxed{
Poller
\rightarrow
Spawner
\rightarrow
PerSessionSandbox.
}
\]

This permits independent:

\[
\{
filesystem,
CPU/memory limits,
network policy,
process namespace,
mounts,
lifecycle
\}.
\]

The source explicitly recommends a separate sandbox per session when fresh filesystem state, resource limits, or per-session network controls are required.

---

# 37. Per-Session Sandbox Input Contract

A spawned execution context must receive identifiers sufficient to bind it to the claimed work item.

Conceptually:

\[
X_i
=
(
session\_id,
work\_id,
environment\_id,
environment\_key
).
\]

These values bind:

\[
\mathcal B_i
\leftrightarrow
w_i
\leftrightarrow
\mathcal S_i.
\]

The environment key—not the broader application credential—should be supplied to the sandbox process.

---

# 38. Graceful Worker Shutdown

A worker receiving:

\[
SIGTERM
\]

or:

\[
SIGINT
\]

does not simply abandon active work.

The documented worker behavior performs:

\[
\boxed{
\begin{aligned}
&
\text{cancel in-flight tool call}
\\
&
\rightarrow
\text{return error result}
\\
&
\rightarrow
\text{release work item}
\\
&
\rightarrow
\text{exit}.
\end{aligned}
}
\]

This avoids leaving the control plane indefinitely believing that an abandoned work item remains active.

---

# 39. Queue Availability Semantics

A session targeting a self-hosted environment is not rejected solely because no worker is online.

Instead:

\[
workers\_polling=0
\]

can produce:

\[
state(\mathcal S)
=
queued.
\]

The session remains waiting until a worker claims its work item.

Thus:

\[
\boxed{
\text{session accepted}
\neq
\text{execution capacity available}.
}
\]

This is analogous to a durable distributed job queue.

---

# 40. Worker Availability Metric

A primary liveness signal is:

\[
workers\_polling.
\]

Expected healthy state:

\[
workers\_polling\geq1
\]

for an environment intended to execute immediately.

If:

\[
workers\_polling=0,
\]

candidate causes include:

\[
\{
\text{worker stopped},
\text{credential failure},
\text{environment-ID mismatch},
\text{network failure}
\}.
\]

The source specifically exposes queue statistics for this purpose.

---

# 41. Poller Control Surface

Lower-level work polling exposes several queue-execution parameters:

\[
Poller
=
(
drain,
block\_ms,
reclaim\_older\_than\_ms,
auto\_stop
).
\]

The source documents these as independent worker-control parameters.

---

# 42. Blocking Interval

\[
block\_ms
\]

controls how long an individual poll waits for available work.

The supported finite range is:

\[
1
\leq
block\_ms
\leq
999.
\]

A null-like value creates a non-blocking check, while omission selects the default long-poll behavior.

This is not the maximum duration of the worker.

It controls the per-request queue wait.

---

# 43. Reclaiming Abandoned Work

Distributed workers require recovery from:

\[
\text{claim}
\rightarrow
\text{worker failure}
\]

without acknowledgement.

The poller exposes:

\[
reclaim\_older\_than\_ms.
\]

For work \(w\):

\[
t_{now}-t_{claim}
>
T_{reclaim}
\]

and:

\[
ack(w)=0,
\]

the work may be reclaimed.

This creates a lease-like recovery mechanism:

\[
\boxed{
\text{claimed}
\not\Rightarrow
\text{permanently owned}.
}
\]

---

# 44. Automatic Stop Semantics

`auto_stop` controls whether work completion from the polling loop automatically emits the corresponding stop transition.

Therefore supervisory architectures launching detached per-session processes may require:

\[
auto\_stop=false
\]

because the spawned runtime, not the poll loop, owns work completion.

This is an important orchestration boundary:

\[
\boxed{
\text{claim ownership}
\neq
\text{execution lifetime ownership}
}
\]

in custom worker topologies.

---

# 45. Worker Abstraction Layers

The self-hosted execution stack exposes at least three levels of orchestration.

### Full worker

\[
EnvironmentWorker
\]

owns:

\[
\{
polling,
setup,
skill download,
tool execution,
result posting
\}.
\]

### Queue poller

\[
work.poller()
\]

owns:

\[
\{
queue interaction,
claiming,
reclaim control
\}
\]

while the application owns execution topology.

### Tool runner

\[
tool\_runner()
\]

executes tools for an already selected session.

This decomposition allows operators to choose:

\[
\boxed{
\text{managed worker}
\rightarrow
\text{custom supervisor}
\rightarrow
\text{custom execution engine}.
}
\]



---

# 46. Tool Context

At the execution layer, a tool context binds:

\[
\boxed{
ToolContext
=
(
workdir,
session,
path-policy,
skills
).
}
\]

The standard self-hosted tool implementations then execute against this context.

Thus:

\[
bash
\]

is not an abstract system-wide shell operation.

It is:

\[
bash(ToolContext_i).
\]

Likewise:

\[
read,
write,
edit,
glob,
grep
\]

operate against the filesystem boundary defined by that context.

---

# 47. Self-Hosted File Staging Is Operator-Owned

The self-hosted mode does not automatically mount session resource objects or repository resources.

The source explicitly states that resource entries are unsupported for self-hosted sessions.

Therefore:

\[
resources
\notin
\mathcal S_{self}.
\]

Session-specific data must instead be staged by the operator.

A common pattern is:

\[
Session.metadata
=
\{
input\_reference
\}
\]

followed by:

\[
worker
\rightarrow
RetrieveSessionMetadata
\rightarrow
FetchData
\rightarrow
StageInto(workdir).
\]

---

# 48. File Reference and File Content Are Distinct

For self-hosted execution, the control plane can carry:

\[
metadata:
\text{reference to data}
\]

rather than necessarily transporting:

\[
\text{data bytes}.
\]

For example:

\[
input\_file
=
object\_store://bucket/object.
\]

Then:

\[
Worker
\rightarrow
ObjectStore
\rightarrow
/workspace/input.
\]

This is architecturally cleaner for private data because the worker fetch path can remain inside the operator's network boundary.

---

# 49. Custom Tools Inside the Self-Hosted Boundary

A custom tool may execute directly through the worker.

Then:

\[
\boxed{
\text{model requests tool}
\rightarrow
\text{worker implementation}
\rightarrow
\text{internal service}.
}
\]

The custom tool can reach only what the worker sandbox can reach:

\[
Reach(T_{custom})
\subseteq
Reach(\mathcal B_i).
\]

The worker environment credential can authorize returning tool results without requiring the broader application API credential on the worker host.

---

# 50. Execution Locality and External Tool Connectivity Are Orthogonal

Self-hosting controls:

\[
\boxed{
\text{where agent code/tools execute}.
}
\]

Private external-tool connectivity controls:

\[
\boxed{
\text{how the control plane reaches private tool servers}.
}
\]

These are independent architectural dimensions.

Therefore four configurations are possible:

\[
\begin{array}{c|c}
\text{execution location} & \text{external tool connectivity}\\
\hline
cloud & public\\
cloud & private tunnel\\
self-hosted & public\\
self-hosted & private/internal
\end{array}
\]

Self-hosting does not intrinsically imply private-protocol tunneling.

---

# 51. Security Boundary in Cloud Mode

In cloud execution, the platform owns the isolation substrate:

\[
\{
container lifecycle,
multitenant boundary,
base image,
sandbox provisioning
\}.
\]

The application still owns capability policy such as:

\[
\{
tool enablement,
permission policy,
network configuration,
external credentials
\}.
\]

This is a managed execution security model.

---

# 52. Security Boundary in Self-Hosted Mode

Self-hosting shifts substantial responsibility to the operator.

The operator becomes responsible for:

\[
\boxed{
\begin{aligned}
&
\text{sandbox image integrity}
\\
&
\text{runtime hardening}
\\
&
\text{network egress controls}
\\
&
\text{worker key storage}
\\
&
\text{trust-domain isolation}
\\
&
\text{process privileges}
\\
&
\text{filesystem mounts}
\\
&
\text{tool blast radius}
\\
&
\text{log retention}
\\
&
\text{local data deletion}.
\end{aligned}
}
\]

The managed control plane cannot enforce these properties inside an arbitrary operator-provided runtime.

---

# 53. Sandbox Image Hardening

A self-hosted image should minimize:

\[
Privileges(\mathcal B).
\]

The source explicitly identifies hardening techniques such as:

\[
\boxed{
\text{drop unnecessary Linux capabilities}
}
\]

\[
\boxed{
\text{run as non-root}
}
\]

and:

\[
\boxed{
\text{prefer a read-only root filesystem}.
}
\]

The effective security objective is:

\[
\min
\left(
Capabilities
+
WritableSurface
+
PrivilegeLevel
\right).
\]

---

# 54. Least-Privilege Tool Process

Tools execute with whatever authority the worker process possesses.

Therefore:

\[
Authority(tool)
\leq
Authority(worker).
\]

If:

\[
worker=user=root,
\]

then an agent-controlled tool potentially executes with root-level authority inside that runtime.

The correct configuration is:

\[
\boxed{
Authority(worker)
=
MinimumAuthorityRequired.
}
\]

Only required directories should be mounted.

---

# 55. Network Egress as a Primary Blast-Radius Control

In self-hosted execution:

\[
Reach(\mathcal B)
=
Policy(VPC,Firewall,Routing).
\]

If no egress restriction exists:

\[
Reach(\mathcal B)
\approx
Reach(Network).
\]

Thus compromised or adversarial tool execution can potentially connect to arbitrary reachable external or internal hosts.

The recommended invariant is:

\[
\boxed{
Reach(\mathcal B)
=
EndpointsRequiredByTools.
}
\]

not:

\[
Reach(\mathcal B)
=
AllNetworkEndpoints.
\]

---

# 56. Trust-Boundary Partitioning

Because a single environment worker key is scoped to one work queue, environments can be used as security domains.

Suppose:

\[
U_1,U_2
\]

represent workloads with different trust levels.

Instead of:

\[
U_1,U_2
\rightarrow
E_{shared},
\]

a stronger design is:

\[
U_1
\rightarrow
E_1
\]

\[
U_2
\rightarrow
E_2.
\]

Then:

\[
Key(E_1)\neq Key(E_2)
\]

and:

\[
Runtime(E_1)\neq Runtime(E_2).
\]

This reduces cross-workload blast radius.

---

# 57. Worker Image Supply Chain Is Outside Control-Plane Verification

A self-hosted runtime image may contain:

\[
\{
malicious\ binary,
compromised\ dependency,
tampered\ shell,
credential\ exfiltration\ logic
\}.
\]

The external control plane cannot reliably inspect or attest an arbitrary worker image.

Therefore:

\[
\boxed{
ImageIntegrity
}
\]

is an operator-owned supply-chain problem.

A production implementation should independently establish:

\[
\{
image\ digest\ pinning,
SBOM,
signature\ verification,
dependency\ scanning,
provenance
\}.
\]

---

# 58. Tool-to-Tool Isolation Is Also Operator-Owned

The platform boundary ends at the self-hosted sandbox.

It does not automatically create:

\[
T_i
\perp
T_j
\]

inside that sandbox.

If stronger isolation is required between:

\[
bash,
custom\ tool,
compiler,
external\ process,
\]

the operator must implement additional boundaries such as:

\[
\{
subprocess\ sandbox,
seccomp,
namespace,
microVM,
container,
policy\ engine
\}.
\]

---

# 59. Session Content Data Flow

Self-hosting does **not** mean all information remains exclusively inside the self-hosted infrastructure.

The execution model is:

\[
\boxed{
\text{model/control plane}
\leftrightarrow
\text{tool inputs/outputs}
\leftrightarrow
\text{self-hosted worker}.
}
\]

Filesystem and network activity execute locally, but tool observations must return to the reasoning system for the model to decide what to do next.

This is an essential architectural distinction.

---

# 60. Local Data Retention Becomes Operator-Owned

Once session content reaches the self-hosted worker, the operator controls:

\[
\{
logs,
temporary files,
tool output,
process stdout/stderr,
artifacts,
caches
\}.
\]

Therefore:

\[
Retention_{local}
\]

must be explicitly designed.

A production policy should define:

\[
\boxed{
RetentionPolicy
=
(
log\_TTL,
artifact\_TTL,
redaction,
encryption,
deletion,
audit
).
}
\]

The external control plane cannot enforce deletion of copies retained independently by the worker.

---

# 61. Cloud vs Self-Hosted Responsibility Matrix

| Dimension | Cloud sandbox | Self-hosted sandbox |
|---|---|---|
| Session scheduling | managed | managed |
| Agent reasoning | managed | managed |
| Sandbox host | managed | operator |
| Container/process runtime | managed | operator |
| Base image | managed | operator |
| Tool execution | managed sandbox | operator runtime |
| Filesystem | managed sandbox | operator |
| Network policy | environment configuration | VPC/firewall/runtime policy |
| Worker lifecycle | managed | operator |
| Tool process privilege | managed boundary | operator |
| Session data inside execution runtime | managed | operator |
| File staging | managed resources | operator |
| Output persistence | managed convention | operator |
| Environment service key | not required | required |
| Worker monitoring | managed | operator |
| Supply-chain integrity | platform-owned runtime | operator-owned runtime |

---

# 62. Cloud vs Self-Hosted Isolation Semantics

Cloud mode guarantees the high-level relationship:

\[
\forall \mathcal S_i:
\mathcal B_i
=
fresh\ managed\ container.
\]

Self-hosted mode guarantees only:

\[
\mathcal S_i
\rightarrow
work\ item.
\]

The operator decides whether execution is:

\[
\boxed{
\text{shared process}
}
\]

or:

\[
\boxed{
\text{fresh sandbox per session}.
}
\]

Thus:

\[
\boxed{
SelfHosted
\not\Rightarrow
PerSessionIsolation.
}
\]

Per-session isolation must be explicitly implemented.

---

# 63. Environment Failure Domains

The environment layer introduces multiple independent failure classes.

### Provisioning failure

\[
Provision(\mathcal B_i)=failure.
\]

### Dependency installation failure

\[
Install(P)=failure.
\]

### Dependency drift

\[
Unpinned(P,t_1)
\neq
Unpinned(P,t_2).
\]

### Disk exhaustion

\[
UsedDisk>D_{max}.
\]

### Memory exhaustion

\[
RSS>M_{max}.
\]

### Network policy denial

\[
host\notin ReachableHosts.
\]

### Worker absence

\[
workers\_polling=0.
\]

### Worker crash

\[
claimed
\rightarrow
no\ acknowledgement.
\]

### Credential failure

\[
Auth(K_E)=0.
\]

### Input staging failure

\[
Fetch(metadata.reference)=failure.
\]

### Tool-runtime failure

\[
Execute(tool)=error.
\]

### Local persistence failure

\[
WriteArtifact(path)=failure.
\]

A production system must monitor each separately.

---

# 64. Environment Observability

A useful environment monitoring vector is:

\[
\boxed{
O_E
=
(
Q,
W,
T_q,
T_{claim},
T_{exec},
F_{fail},
M,
D,
N
)
}
\]

where:

\[
Q=\text{queue depth},
\]

\[
W=\text{active polling workers},
\]

\[
T_q=\text{queue wait time},
\]

\[
T_{claim}=\text{claim latency},
\]

\[
T_{exec}=\text{tool execution latency},
\]

\[
F_{fail}=\text{execution failure rate},
\]

\[
M=\text{memory utilization},
\]

\[
D=\text{disk utilization},
\]

\[
N=\text{network-denial/error metrics}.
\]

The source directly exposes worker polling and queue-state visibility for self-hosted operation.

---

# 65. Environment Is an Authority Boundary, Not Merely Infrastructure

A useful final capability equation is:

\[
\boxed{
EffectiveAction
=
Intent
\cap
ToolCapability
\cap
Permission
\cap
EnvironmentAuthority.
}
\]

For action \(a\):

\[
Executable(a)
=
I(a)
\land
T(a)
\land
P(a)
\land
E(a).
\]

Even if:

\[
I(a)=T(a)=P(a)=1,
\]

the action fails if:

\[
E(a)=0.
\]

Examples:

\[
bash\ exists
\land
file\ not\ writable
\Rightarrow
write\ fails.
\]

\[
curl\ exists
\land
host\ blocked
\Rightarrow
network\ call\ fails.
\]

\[
custom\ tool\ exists
\land
internal\ service\ unreachable
\Rightarrow
tool\ fails.
\]

The environment is therefore the final enforcement boundary between planned action and executable action.

---

# 66. Production Cloud Environment Pattern

A production cloud configuration should approximately minimize authority:

\[
\boxed{
\begin{aligned}
&
type=cloud
\\
&
packages=P_{pinned}
\\
&
networking.type=limited
\\
&
allowed\_hosts=H_{minimal}
\\
&
allow\_package\_managers
=
\text{only when runtime install is required}
\\
&
allow\_mcp\_servers
=
\text{only when required}.
\end{aligned}
}
\]

This is preferable to:

\[
type=cloud
+
unrestricted
+
unpinned\ dependencies.
\]

---

# 67. Production Self-Hosted Pattern

A stronger self-hosted production topology is:

\[
\boxed{
\begin{aligned}
&
\text{dedicated environment per trust boundary}
\\
&
\downarrow
\\
&
\text{queue poller}
\\
&
\downarrow
\\
&
\text{fresh sandbox per session}
\\
&
\downarrow
\\
&
\text{non-root worker}
\\
&
\downarrow
\\
&
\text{minimal Linux capabilities}
\\
&
\downarrow
\\
&
\text{read-only root filesystem}
\\
&
\downarrow
\\
&
\text{explicit writable workspace}
\\
&
\downarrow
\\
&
\text{restricted egress}
\\
&
\downarrow
\\
&
\text{short-lived artifact retention}.
\end{aligned}
}
\]

The environment service credential should be injected at runtime from a protected secret store.

---

# 68. Reproducibility Envelope

Because the environment itself is not natively versioned, a reproducible execution needs more than:

\[
environment\_id.
\]

A stronger execution fingerprint is:

\[
\boxed{
\mathcal R_E
=
(
environment\_id,
environment\_config\_hash,
base\_runtime,
package\_lock,
network\_policy,
sandbox\_image\_digest,
worker\_version
).
}
\]

For cloud execution, some base-runtime details are platform-managed.

For self-hosted execution, the operator can additionally pin:

\[
image\_digest,
kernel/runtime,
worker\ binary,
sandbox\ policy.
\]

---

# 69. Complete Environment Construction Procedure

\[
\boxed{
\begin{aligned}
&
\textbf{Input:}
\\
&
Agent\ A_v,
Workload\ W,
SecurityPolicy\ \Pi,
DataBoundary\ D
\\[5pt]
&
\textbf{1. Select execution locality}
\\
&
\tau
\leftarrow
SelectEnvironmentType(W,D,\Pi)
\\
&
\tau\in\{cloud,self\_hosted\}
\\[5pt]
&
\textbf{2. Determine runtime requirements}
\\
&
R
\leftarrow
RuntimeRequirements(W)
\\[5pt]
&
\textbf{3. Derive dependency graph}
\\
&
P
\leftarrow
Dependencies(W)
\\[5pt]
&
\textbf{4. Pin dependency versions}
\\
&
P'
\leftarrow
Pin(P)
\\[5pt]
&
\textbf{5. Derive network requirement}
\\
&
H
\leftarrow
RequiredHosts(W,A_v)
\\[5pt]
&
\textbf{6. Construct least-privilege network policy}
\\
&
N
\leftarrow
LimitedNetwork(H)
\\[5pt]
&
\textbf{7. Create reusable environment}
\\
&
E
\leftarrow
CreateEnvironment(
\tau,
P',
N
)
\\[5pt]
&
\textbf{8A. Cloud path}
\\
&
\textbf{if }\tau=cloud:
\\
&
\qquad
S_i
\leftarrow
CreateSession(A_v,E)
\\
&
\qquad
B_i
\leftarrow
ProvisionFreshSandbox(E,S_i)
\\
[5pt]
&
\textbf{8B. Self-hosted path}
\\
&
\textbf{if }\tau=self\_hosted:
\\
&
\qquad
K_E
\leftarrow
ProvisionEnvironmentCredential(E)
\\
&
\qquad
Worker
\leftarrow
StartWorker(E,K_E)
\\
&
\qquad
S_i
\leftarrow
CreateSession(A_v,E)
\\
&
\qquad
w_i
\leftarrow
Enqueue(S_i)
\\
&
\qquad
w_i
\leftarrow
Claim(Worker)
\\
&
\qquad
B_i
\leftarrow
SpawnExecutionContext(w_i)
\\[5pt]
&
\textbf{9. Stage skills and session inputs}
\\
&
F_i
\leftarrow
PrepareWorkspace(B_i)
\\[5pt]
&
\textbf{10. Execute tool requests}
\\
&
o_t
\leftarrow
Execute(
tool_t,
B_i,
N
)
\\[5pt]
&
\textbf{11. Return observations}
\\
&
ControlPlane
\leftarrow
o_t
\\[5pt]
&
\textbf{12. Continue session}
\\
&
C_{t+1}
\leftarrow
C_t\oplus o_t
\\[5pt]
&
\textbf{13. Finalize outputs}
\\
&
Artifacts
\leftarrow
Persist(
F_i,
RetentionPolicy
)
\\[5pt]
&
\textbf{14. Teardown sandbox}
\\
&
Destroy(B_i)
\\[5pt]
&
\textbf{Output:}
\\
&
\boxed{
\text{isolated executable agent runtime}
}
\end{aligned}
}
\]

---

# 70. Complete Runtime Architecture

The entire environment layer can be represented as:

\[
\boxed{
\begin{array}{c}
\text{Versioned Agent Specification}
\\
\downarrow
\\
\text{Environment Selection}
\\
\downarrow
\\
\begin{array}{cc}
\text{Cloud} & \text{Self-Hosted}\\
\downarrow & \downarrow\\
\text{Managed Provisioner} & \text{Environment Queue}\\
\downarrow & \downarrow\\
\text{Fresh Container} & \text{Worker Claim}\\
 & \downarrow\\
 & \text{Execution Context / Sandbox}
\end{array}
\\
\downarrow
\\
\text{Runtime + Dependencies}
\\
\downarrow
\\
\text{Filesystem Boundary}
\\
\downarrow
\\
\text{Network Boundary}
\\
\downarrow
\\
\text{Tool Process}
\\
\downarrow
\\
\text{Observation}
\\
\downarrow
\\
\text{Session Event / Next Reasoning Step}
\end{array}
}
\]

---

# 71. Final Architectural Interpretation

The environment is not simply “where code runs.”

It is the composition:

\[
\boxed{
\mathcal E
=
\text{Execution Locality}
+
\text{Runtime Image}
+
\text{Dependencies}
+
\text{Filesystem Semantics}
+
\text{Network Authority}
+
\text{Isolation Model}
+
\text{Worker Topology}
+
\text{Credential Boundary}
+
\text{Lifecycle Policy}.
}
\]

The agent layer answers:

\[
\boxed{
\text{What may the autonomous system attempt?}
}
\]

The environment layer answers:

\[
\boxed{
\text{Under what computational and security authority can that attempt become real execution?}
}
\]

The session then binds both:

\[
\boxed{
\mathcal S_i
=
Instantiate(
\mathcal A_v,
\mathcal E
)
}
\]

and receives a concrete execution context:

\[
\boxed{
\mathcal B_i
=
(
Processes_i,
Filesystem_i,
Network_i,
Runtime_i,
Credentials_i
).
}
\]

The essential systems invariant is therefore:

\[
\boxed{
\textbf{
agent capability is declarative;
environment authority is executable.
}
}
\]

A production managed-agent architecture is secure and reproducible only when both are controlled together:

\[
\boxed{
\text{Agent Policy}
\cap
\text{Tool Policy}
\cap
\text{Environment Policy}
\cap
\text{Isolation Policy}
}
\]

because autonomous reasoning becomes operationally meaningful only at the point where the environment converts a proposed action into an actual process, filesystem mutation, network request, or external side effect.
}