# Manage Agent Context

## Session-Local State, Mounted Resources, Persistent Memory, Versioned Knowledge, and Context Consolidation

### Abstract

Managing agent context is not equivalent to enlarging a model prompt or storing a chat transcript. The runtime exposes several context substrates with fundamentally different **ownership, persistence, mutability, trust, snapshot, and lifecycle semantics**.

The correct abstraction is:

[
\boxed{
\mathcal C_S(t)=
\Big(
C_{\mathrm{session}}(t),
R_{\mathrm{file}}(t),
R_{\mathrm{repo}}(t),
R_{\mathrm{memory}}(t),
H_S(t),
X_S(t),
\Pi_C
\Big)
}
]

where

[
\begin{aligned}
C_{\mathrm{session}} &:= \text{current session/model-facing interaction context},\
R_{\mathrm{file}} &:= \text{mounted uploaded-file resources},\
R_{\mathrm{repo}} &:= \text{mounted repository working trees},\
R_{\mathrm{memory}} &:= \text{cross-session persistent memory stores},\
H_S &:= \text{session interaction/event history},\
X_S &:= \text{session-local filesystem/execution state},\
\Pi_C &:= \text{context access and mutation policy}.
\end{aligned}
]

A new session receives fresh context by default; persistent information does **not** automatically propagate from one session to another. Cross-session state must be externalized into a persistent resource such as a memory store. 

The central architectural distinction is therefore:

[
\boxed{
\text{model-resident context}
\neq
\text{filesystem-accessible context}
\neq
\text{persistent memory}
\neq
\text{repository state}.
}
]

---

# 1. Position of the Context Layer

The preceding architecture established:

[
\text{Agent Definition}
\rightarrow
\text{Environment}
\rightarrow
\text{Session}.
]

The context layer answers a different question:

[
\boxed{
\text{What information can this particular execution see, retain, mutate, and carry forward?}
}
]

Thus:

[
\mathcal A_v
+
\mathcal E
+
\mathcal S_i
+
\mathcal C_i
\rightarrow
\text{effective runtime}.
]

The agent defines behavior and capability.

The environment defines execution authority.

The session defines execution identity.

The context plane defines:

[
\boxed{
{
knowledge\ visibility,
working\ state,
external\ material,
persistent\ state,
context\ continuity
}.
}
]

---

# 2. Context Is Not a Single Buffer

The naive model:

[
C=\text{prompt tokens}
]

is architecturally insufficient.

The runtime instead exposes several context classes:

[
\boxed{
\mathcal C
==========

C_{\mathrm{resident}}
\cup
C_{\mathrm{session}}
\cup
C_{\mathrm{file}}
\cup
C_{\mathrm{repo}}
\cup
C_{\mathrm{memory}}
}
]

with different access mechanisms.

A better persistence taxonomy is:

[
\begin{array}{c|c|c|c}
\text{Context class} & \text{Lifetime} & \text{Mutable} & \text{Cross-session}\
\hline
\text{interaction history} & \text{session} & \checkmark & \times\
\text{sandbox scratch} & \text{session} & \checkmark & \times\
\text{mounted file copy} & \text{session mount} & \times & \times\
\text{repository working tree} & \text{session} & \checkmark & \text{through repo}\
\text{memory store} & \text{independent} & \checkmark & \checkmark\
\text{memory version} & \text{retained history} & \times & \checkmark\
\text{consolidated store} & \text{independent} & \checkmark & \checkmark
\end{array}
]

---

# 3. Fresh-Context Invariant

For independent sessions:

[
S_i\neq S_j,
]

there is no implicit state transfer:

[
C_{S_j}^{0}
\neq
C_{S_i}^{final}
]

by default.

The source explicitly states that each session starts fresh and that persistent memory stores are the mechanism for carrying preferences, conventions, mistakes, and domain knowledge across sessions. 

Therefore:

[
\boxed{
\text{session continuity}
\neq
\text{cross-session continuity}.
}
]

---

# 4. Context Persistence Must Be Explicit

To move information from:

[
S_t
]

to:

[
S_{t+1},
]

the information must survive through an external persistent resource:

[
C_t
\xrightarrow{\operatorname{externalize}}
M
\xrightarrow{\operatorname{attach}}
C_{t+1}.
]

Formally:

[
\boxed{
CrossSession(x)
\Rightarrow
Persist(x,R)
}
]

for some resource (R) whose lifecycle is longer than the originating session.

---

# 5. Session Context Is the Working Set

During execution, the session accumulates:

[
H_t
===

[e_1,e_2,\ldots,e_t]
]

plus:

[
X_t
===

\text{filesystem/tool execution state}.
]

The active reasoning loop therefore operates over a changing working set:

[
\boxed{
W_t
===

f(
A^{*},
H_t,
X_t,
R_t
)
}
]

rather than over one static user prompt.

---

# 6. Persistent Context Must Not Be Confused With Prompt Injection

A crucial implementation fact is that an attached memory store is mounted as a filesystem directory. The runtime automatically places **a description of the mount** into the system-level context, telling the agent its display name, location, access mode, store description, and any session-specific instructions. The actual memory documents remain path-addressed objects accessed with file tools. 

Therefore the documented model is not:

[
SystemPrompt
============

\sum_{m\in M} content(m).
]

Instead:

[
\boxed{
SystemContext
\supset
Descriptor(M)
}
]

while:

[
content(m)
\xrightarrow{\text{file read}}
Context
]

when the agent explicitly accesses it.

This is **addressable external context**, not wholesale context stuffing.

---

# 7. Context Metadata and Context Payload Are Distinct

For a mounted memory store:

[
M=
(name,description,instructions,path,access,documents).
]

The automatically exposed descriptor is approximately:

[
D_M
===

(
name,
mount_path,
access,
description,
instructions
).
]

The payload is:

[
P_M
===

{m_1,\ldots,m_n}.
]

Thus:

[
\boxed{
D_M\neq P_M.
}
]

This distinction matters for both token scalability and security.

---

# 8. Session Resources Form the External Context Interface

Resource-backed context enters through:

[
resources[]
]

during session construction.

In the supplied contracts, important resource classes include:

[
\boxed{
R=
{
file,
github_repository,
memory_store
}.
}
]

But their lifecycle semantics are deliberately different.

---

# 9. File Context: Upload Is Separate From Mount

A file first exists as an uploaded object:

[
F_{\mathrm{uploaded}}.
]

It then becomes available to a session through a resource mount:

[
F_{\mathrm{uploaded}}
\xrightarrow{mount}
F_{\mathrm{session}}.
]

The source explicitly separates file upload from mounting the uploaded file into the session sandbox. 

---

# 10. File Object and Session File Instance Are Different

When an uploaded file is mounted:

[
F_u
\rightarrow
F_s,
]

the platform creates a new file identifier for the session-specific instance.

Therefore:

[
\boxed{
file_id_{\mathrm{uploaded}}
\neq
file_id_{\mathrm{session\ copy}}
}
]

in the general case.

The session copy does not count against the normal uploaded-file storage limit. 

---

# 11. Mounted Input Files Are Read-Only

The mounted file is a read-only copy.

Hence:

[
Write(F_{\mathrm{mounted}})
\rightarrow
Reject.
]

If the agent transforms the content:

[
F_{\mathrm{mounted}}
\xrightarrow{process}
F'_{\mathrm{sandbox}},
]

the transformed result must be written to a separate path.

The original uploaded file is not mutated. 

---

# 12. File Context Is Therefore Copy-on-Work, Not Shared Mutable State

For uploaded input (F):

[
\boxed{
Input(F)
========

immutable\ session\ mount.
}
]

Transformation semantics are:

[
F
\xrightarrow{read}
x
\xrightarrow{T}
x'
\xrightarrow{write}
F'.
]

This is fundamentally different from persistent memory-store mounts, where permitted filesystem writes propagate back into the persistent store.

---

# 13. File Mount-Path Translation

A declared mount path:

[
mount_path="/data.csv"
]

maps to:

[
\boxed{
/mnt/session/uploads/data.csv
}
]

inside the sandbox.

The provided path is rooted under the session upload directory rather than being used as an arbitrary host filesystem location. 

---

# 14. File Path Defaulting

If:

[
mount_path
]

is omitted:

[
Path(F)
=======

/mnt/session/uploads/<file_id>.
]

Parent directories are automatically created and supplied paths should be absolute. 

---

# 15. Human-Meaningful File Names Affect Discoverability

The `mount_path` is optional, but the documentation recommends descriptive file naming when it is omitted or when discoverability matters. 

This is operationally significant because:

[
AgentFindability(F)
===================

f(
name,
path,
task
).
]

A technically mounted but semantically opaque file can still impose search overhead on the agent.

---

# 16. File Capacity

The maximum number of mounted file resources supported per session is:

[
\boxed{
500.
}
]



This is a resource-count limit, not a claim that all 500 files are injected into the model's token context.

---

# 17. File Type Is Not Restricted to Text

The documented execution surface supports arbitrary file classes, including:

[
{
source\ code,
CSV,
JSON,
XML,
YAML,
text,
Markdown,
archives,
binary\ files
}.
]

Archive processing may use shell execution; binary interpretation depends on available tooling. 

---

# 18. File Resources Can Change Mid-Session

Unlike memory-store attachments:

[
FileResourceSet_t
]

is mutable during the session.

The resource API supports:

[
AddFile(S,F)
]

and:

[
DeleteFileResource(S,r).
]

Each session resource has its own resource identifier. 

Thus:

[
R_{\mathrm{file}}(t+1)
\neq
R_{\mathrm{file}}(t)
]

is supported.

---

# 19. Resource Identity Is Not Underlying File Identity

Deletion operates on:

[
session_resource_id,
]

not simply:

[
file_id.
]

This distinguishes:

[
\boxed{
\text{persistent file object}
}
]

from:

[
\boxed{
\text{its attachment to a specific session}.
}
]

---

# 20. Session Resource Enumeration

The session can enumerate its mounted resources through:

[
resources.list.
]

File-resource removal uses the attachment/resource ID returned from creation or enumeration. 

---

# 21. Session-Scoped File Retrieval

Files associated with a session can be retrieved through the file service using:

[
scope_id=session_id.
]

This allows the caller to enumerate and download session-scoped artifacts. 

---

# 22. File Context Lifecycle

The clean state model is:

[
\boxed{
Upload
\rightarrow
Mount
\rightarrow
Read
\rightarrow
OptionalTransform
\rightarrow
NewSandboxArtifact.
}
]

It is **not**:

[
Upload
\rightarrow
Mount
\rightarrow
MutateOriginal.
]

---

# 23. Repository Context Is a Different Resource Class

A repository resource provides a complete working tree rather than one immutable input file.

The repository is mounted into the session sandbox and can coexist with repository-oriented external tools used for remote operations such as pull requests. 

---

# 24. Repository Mount Contract

Conceptually:

[
G
=

(
url,
mount_path,
authorization_token
).
]

At session creation:

[
G
\xrightarrow{clone/mount}
X_G.
]

The repository becomes part of the session's working filesystem.

---

# 25. Repository Clone Credential Has Narrow Semantics

The repository resource's:

[
authorization_token
]

authenticates the repository clone operation and is not echoed in API responses. 

Therefore it should not be conflated with:

[
\text{external tool/MCP authentication}.
]

These are separate authorization surfaces.

---

# 26. Repository Credentials Should Follow Least Privilege

The source explicitly recommends fine-grained credentials with only the scopes required for intended operations, rather than broadly privileged account tokens. 

The general security invariant is:

[
\boxed{
Privilege(Token)
================

Minimum(Task).
}
]

---

# 27. Repository Caching Is a Startup Optimization

Repositories are cached so later sessions using the same repository can start faster. 

This statement guarantees an optimization mechanism.

It does **not** establish additional consistency or version-pinning semantics beyond what the source explicitly documents.

---

# 28. Multiple Repository Contexts Can Coexist

A session can mount several repositories:

[
R_{\mathrm{repo}}
=================

{G_1,G_2,\dots,G_n}.
]

Each has its own:

[
{
url,
mount_path,
authorization
}.
]

This supports cross-repository tasks without flattening source trees into a single namespace.

---

# 29. Repository Attachment Set Is Fixed for the Session Lifetime

After session creation:

[
R_{\mathrm{repo}}
]

cannot be arbitrarily replaced.

The source states:

[
\boxed{
\text{repositories remain attached for the lifetime of the session}.
}
]

To change which repositories are mounted:

[
\boxed{
CreateNewSession.
}
]



---

# 30. Repository Credential Rotation Is Allowed

Although the mounted-repository set is fixed, the resource authorization token may be rotated:

[
token_t
\rightarrow
token_{t+1}.
]

The repository resource is identified by its session-resource ID for that update. 

Therefore:

[
\boxed{
AttachmentTopology
\text{ fixed}
}
]

does not imply:

[
\boxed{
Credential
\text{ fixed}.
}
]

---

# 31. Repository Contents Are Not Immutable

The attachment topology is session-fixed, but the working tree itself can evolve.

The documented repository workflow supports:

[
{
branch,
commit,
push
}.
]



Thus:

[
G_t
\rightarrow
G_{t+1}
]

is valid.

---

# 32. Repository Context Has Two State Planes

For repository (G):

[
\boxed{
G
=

G_{\mathrm{resource}}
+
G_{\mathrm{working-tree}}.
}
]

Where:

[
G_{\mathrm{resource}}
=====================

(url,mount,credential)
]

and:

[
G_{\mathrm{working-tree}}
=========================

(files,branch,index,commits,\ldots).
]

The first is mostly attachment configuration.

The second is executable workspace state.

---

# 33. Repository-Mounted Skills Create an Additional Context Channel

Mounting a repository also causes skills under the root:

[
.claude/skills
]

to be discovered.

They are discovered:

[
\boxed{
once\ per\ session
}
]

from the checked-out repository state at session start. 

Thus:

[
Skills(S)
=========

Discover(
RepoState_{t_0}
).
]

---

# 34. Skill Discovery and Repository Mutation Are Different Timelines

The repository can later change:

[
RepoState_{t_1}
\neq
RepoState_{t_0},
]

but the documented skill discovery occurs at:

[
t_0.
]

Therefore repository mutation does not imply continuous rediscovery of skill definitions within that session.

This is a crucial snapshot boundary.

---

# 35. Persistent Memory Solves a Different Problem

Files answer:

[
\text{“What material should this session read?”}
]

Repositories answer:

[
\text{“What project workspace should this session operate on?”}
]

Memory answers:

[
\boxed{
\text{“What state should survive across sessions?”}
}
]

---

# 36. Memory Store Object

A persistent store can be modeled as:

[
\boxed{
M=
(
id,
name,
description,
{m_i},
lifecycle
)
}
]

where each memory:

[
m_i
===

(
id,
path,
content,
content_sha256,
versions
).
]

The store is workspace-scoped and consists of path-addressed text documents. 

---

# 37. Memory Is Filesystem-Native, Not Hidden Vector State

The documented abstraction is:

[
M
=

\text{directory of text documents}.
]

The agent interacts through ordinary:

[
{
read,
write,
edit,
\dots
}
]

filesystem tools.

This makes persistent state inspectable and directly manageable through both the API and filesystem interface.

---

# 38. Memory Store Description Is Agent-Visible Metadata

When creating a store:

[
description
]

is not merely administrative metadata.

It is passed to the agent to describe what the store contains. 

Thus poor store descriptions degrade context routing.

---

# 39. Persistent Memory Is Path-Addressable

Each memory has:

[
path_i.
]

For example:

[
/preferences/formatting.md
]

or:

[
/project/decisions.md.
]

This creates a logical namespace:

[
\boxed{
M
=

{path_i\rightarrow content_i}.
}
]

---

# 40. Memory Store Can Be Pre-Seeded

A memory store may be populated before any agent session executes.

Thus:

[
M_0
\neq
\varnothing
]

is allowed.

This supports:

[
{
shared\ standards,
domain\ knowledge,
project\ conventions,
user\ preferences
}
]

as initial cross-session context. 

---

# 41. Individual Memory Size Limit

Each memory document is bounded by:

[
\boxed{
100\text{ kB}
\approx
25,000\ tokens.
}
]

The source recommends structuring persistent context as many small focused documents rather than a few huge documents. 

---

# 42. Memory Store Cardinality Limit

One memory store supports at most:

[
\boxed{
2000
}
]

memories. 

The theoretical raw payload ceiling implied by both limits should **not** be interpreted as a model context-window size because the documents are filesystem-addressable, not simultaneously injected.

---

# 43. Memory Attachment Is Creation-Time State

A memory store is attached through session:

[
resources[].
]

Unlike ordinary file resources:

[
\boxed{
memory\ store\ attachment
}
]

can only be established when the session is created.

It cannot later be added to or removed from a running session. 

---

# 44. Memory Attachment Defines Context Authority

A memory attachment is not just:

[
memory_store_id.
]

It can include:

[
\boxed{
R_M
===

(
memory_store_id,
access,
instructions
).
}
]

This creates a session-specific view of the same persistent store.

---

# 45. Access Mode

Supported access states are:

[
\boxed{
access
\in
{
read_only,
read_write
}.
}
]

Default:

[
\boxed{
read_write.
}
]



---

# 46. Session-Specific Memory Instructions

An attachment may provide:

[
instructions
]

for how this particular session should use the store.

These instructions:

* are shown to the agent,
* accompany store name and description,
* are capped at:

[
\boxed{
4096\ characters.
}
]



Thus the same persistent store can be exposed differently to different session roles without modifying the store itself.

---

# 47. Maximum Attached Memory Stores

A session may attach at most:

[
\boxed{
8
}
]

memory stores. 

This enables explicit memory partitioning instead of one unrestricted global store.

---

# 48. Recommended Memory Partitioning

The source gives three concrete partitioning motivations:

[
\boxed{
\begin{aligned}
M_{\mathrm{shared}} &:= \text{shared read-only references},\
M_{\mathrm{identity}} &:= \text{user/team/project-specific state},\
M_{\mathrm{lifecycle}} &:= \text{stores with different retention lifetimes}.
\end{aligned}
}
]



This is superior to treating all persistent state as one undifferentiated memory pool.

---

# 49. Memory Mount Location

Attached stores appear under:

[
\boxed{
/mnt/memory/
}
]

inside the sandbox. 

The store display name is sanitized into a filesystem-safe slug.

---

# 50. Never Reconstruct Memory Mount Paths Yourself

The runtime returns:

[
mount_path.
]

The source explicitly recommends reading the returned path instead of constructing it from the display name. 

Therefore:

[
\boxed{
Path(M)
=======

Resource.mount_path
}
]

not:

[
Path(M)
=======

Guess(name).
]

---

# 51. Persistent Memory Path Boundary Is Exact

If an attached store is mounted at:

[
p_M,
]

then writes under:

[
p_M
]

persist into the memory store.

Writes elsewhere under:

[
/mnt/memory/
]

are only container-local scratch state and disappear with the session. 

Thus:

[
Persist(x)
\iff
Path(x)\subseteq p_M.
]

---

# 52. `/mnt/memory/` Does Not Mean Everything There Is Persistent

This subtlety matters:

[
/mnt/memory/foo
]

outside an actual mounted store may look “memory-like” from path naming alone but is not persistent.

Therefore persistence is determined by:

[
\boxed{
mount\ membership
}
]

rather than filesystem prefix alone.

---

# 53. Memory Writes Synchronize Across Sharing Sessions

Writes under a valid memory mount are persisted to the backing store and remain synchronized for other sessions sharing that store. 

Thus:

[
S_1
\xrightarrow{write}
M
]

can alter what:

[
S_2
]

subsequently observes from the same persistent store.

This makes memory a true shared-state surface.

---

# 54. Read-Only Enforcement Is Filesystem-Level

For:

[
access=read_only,
]

writes to the mounted store are rejected at the filesystem boundary. 

Therefore:

[
\boxed{
ReadOnly
}
]

is not merely a prompt instruction such as “please do not edit.”

It is an execution-layer constraint.

---

# 55. Read-Write Mutations Are Attributed to the Session

For:

[
access=read_write,
]

successful writes create new memory versions attributed to the originating session. 

This provides provenance:

[
Mutation
\rightarrow
SessionID
\rightarrow
MemoryVersion.
]

---

# 56. Memory I/O Remains Observable as Tool Activity

The agent's reads and writes against the memory mount appear as ordinary tool-use/tool-result events. 

Therefore persistent-memory access is observable within the same execution event surface as ordinary filesystem operations.

---

# 57. Memory Is Both Agent-Accessible and Control-Plane Editable

Persistent memory can be changed through two paths:

[
\boxed{
\text{agent filesystem operations}
}
]

or:

[
\boxed{
\text{memory API}.
}
]

This enables:

[
{
human\ review,
correction,
seeding,
import,
export,
governance
}
]

without needing to run the agent.

---

# 58. Memory Listing Has Hierarchical Semantics

Memory listing supports:

[
path_prefix.
]

The prefix must end in:

[
/
]

and matching occurs over path segments, not arbitrary string prefixes. 

For example:

[
/notes/
]

matches:

[
/notes/todo.md
]

but not:

[
/notes-archive/todo.md.
]

---

# 59. Memory Listing Depth

Supported depth semantics are:

[
depth=0
]

or omitted:

[
\Rightarrow
\text{entire subtree},
]

while:

[
depth=1
]

returns immediate children.

Other depth values return:

[
400.
]



---

# 60. Memory Listing Order Is Stable but Server-Defined

The list order is documented as:

[
\boxed{
stable
}
]

but:

[
\boxed{
server-defined.
}
]



Clients therefore should not invent semantic ordering assumptions such as lexical path ordering unless separately established.

---

# 61. Create Does Not Overwrite

For a path:

[
p
]

already occupied by memory (m):

[
memories.create(p,c')
]

is not the update mechanism.

The source explicitly states that creation does not overwrite; modifications use `memories.update`. 

---

# 62. Update Can Change Content, Path, or Both

For memory:

[
m=(id,p,c),
]

an update may produce:

[
m'=(id,p',c),
]

or:

[
m'=(id,p,c'),
]

or:

[
m'=(id,p',c').
]

Thus renaming is modeled as mutation of the memory's path rather than creating a separate conceptual object. 

---

# 63. Shared Memory Introduces a Concurrency Problem

Because multiple sessions and external API clients can mutate the same store:

[
Writer_1
\parallel
Writer_2
]

can create lost-update races.

The system therefore exposes optimistic content concurrency through:

[
content_sha256.
]

---

# 64. Optimistic Concurrency Contract

Suppose the caller reads:

[
c_t
]

and:

[
h_t
===

SHA256(c_t).
]

Then it proposes:

[
Update(m,c_{t+1},precondition=h_t).
]

The update succeeds only if:

[
\boxed{
SHA256(c_{\mathrm{current}})
============================

h_t.
}
]

Otherwise the caller must re-read and retry against the fresh state. 

---

# 65. Correct Concurrent-Edit Loop

[
\boxed{
\begin{aligned}
&m\leftarrow Read(id)\
&h\leftarrow m.content_sha256\
&c'\leftarrow Transform(m.content)\
&r\leftarrow Update(id,c',precondition=h)\
&\textbf{if conflict:}\
&\qquad m\leftarrow Read(id)\
&\qquad retry
\end{aligned}
}
]

This is the proper control-plane mutation pattern for shared persistent memory.

---

# 66. Every Memory Mutation Produces an Immutable Version

Let:

[
m_t
]

be the live memory.

A mutation produces:

[
m_{t+1}
]

plus immutable historical record:

[
v_{t+1}.
]

The source states that every mutation creates a memory version. 

Therefore:

[
\boxed{
MutableHead
+
ImmutableHistory.
}
]

---

# 67. Memory Versions Belong to the Store

Versions are associated with the store-level history rather than being dependent on the continued existence of the current memory object.

Consequently:

[
Delete(m)
\not\Rightarrow
ImmediateDelete(V_m).
]

Versions survive deletion of their parent memory. 

---

# 68. Live Retrieval Returns the Current Head

Normal memory retrieval:

[
memories.retrieve
]

returns the latest live state.

Historical inspection requires:

[
memory_versions.*
]

rather than the ordinary memory endpoint. 

---

# 69. Version Retention Is Not Infinite

Historical versions are retained for:

[
\boxed{
30\ days
}
]

under the documented policy, while recent versions are retained regardless of age; therefore infrequently changed memories can retain some versions beyond 30 days. 

For long-term archival:

[
\boxed{
export\ versions\ externally.
}
]

---

# 70. Rollback Is a New Write

There is no dedicated “restore version” operation.

To roll back:

[
v_k
\xrightarrow{retrieve}
content_k
\xrightarrow{update}
m_{new}.
]

If the live memory no longer exists:

[
content_k
\xrightarrow{create}
m_{new}.
]



Thus rollback itself creates a new current state rather than moving a mutable pointer backward.

---

# 71. Historical Version Redaction

A retained version may be redacted:

[
Redact(v_k).
]

This removes historical content while retaining audit information about who changed what and when.

The source explicitly identifies this for:

[
{
secrets,
PII,
user\ deletion
}
]

workflows. 

---

# 72. Current Head Cannot Be Redacted

If:

[
v_k
===

Head(m)
]

for a live memory:

[
Redact(v_k)
]

is not permitted.

Required transition:

[
Head(v_k)
\rightarrow
Write(v_{k+1})
\rightarrow
Redact(v_k)
]

or delete the live memory first. 

---

# 73. Delete Memory and Redact History Are Different Operations

Deleting:

[
m
]

removes the live memory.

Redacting:

[
v
]

scrubs retained historical content.

Because versions can survive memory deletion:

[
\boxed{
DeleteLiveMemory
\neq
EraseHistoricalContent.
}
]

This distinction is critical for compliance workflows.

---

# 74. Memory Store Lifecycle

A store supports:

[
\boxed{
create,
retrieve,
update,
list,
archive,
delete.
}
]

Archived stores are excluded from default listing unless explicitly included. 

---

# 75. Archive Is One-Way

Archiving a memory store:

[
M_{active}
\rightarrow
M_{archived}
]

makes it read-only and prevents it from being attached to new sessions.

There is:

[
\boxed{
no\ unarchive.
}
]



---

# 76. Delete Store Is Fully Destructive

Deleting the entire store removes:

[
\boxed{
{
store,
memories,
memory\ versions
}.
}
]



This differs sharply from deleting an individual memory, whose retained versions can outlive it.

---

# 77. Capacity Exhaustion Has Precise Behavior

When:

[
|M|=2000,
]

creation of additional memories fails.

This includes both:

[
memories.create
]

and agent writes that would create previously unmapped paths.

Existing memories remain:

[
\boxed{
readable
+
editable.
}
]



---

# 78. Capacity Exhaustion Does Not Freeze Existing State

The store-full condition is:

[
Reject(NewMemory)
]

not:

[
Reject(AllMutation).
]

Therefore existing memories can still be compacted, updated, or deleted to recover capacity.

---

# 79. Focused Stores Are an Architectural Requirement, Not Merely Organization

The source recommends separate stores such as:

[
M_{user},
\quad
M_{shared},
\quad
M_{project}.
]

Each receives its own capacity envelope. 

This improves:

[
{
ownership,
access\ control,
lifecycle,
capacity,
trust\ segmentation
}.
]

---

# 80. Read-Old / Write-New Migration Pattern

When a store grows beyond a useful scope:

[
M_{old}
]

can remain attached:

[
access=read_only
]

while a fresh:

[
M_{new}
]

is attached:

[
access=read_write.
]

Then:

[
Reads
=====

M_{old}\cup M_{new}
]

while:

[
Writes
\rightarrow
M_{new}.
]

This pattern is explicitly recommended by the source. 

---

# 81. Persistent Memory Is a Security Boundary

The default memory access mode is:

[
read_write.
]

This is powerful because untrusted information processed by the agent can become persistent.

The source explicitly warns that prompt injection from user input, fetched web content, or third-party tool output can write malicious state into the store, which later sessions may then consume as trusted memory. 

---

# 82. Memory Poisoning Is Cross-Session Privilege Escalation

The threat chain is:

[
UntrustedInput
\rightarrow
AgentInterpretation
\rightarrow
PersistentWrite
\rightarrow
FutureTrustedRead.
]

Formally:

[
\boxed{
U
\xrightarrow{write}
M
\xrightarrow{future\ session}
TrustedContext.
}
]

This turns a transient prompt-injection event into a persistent context-compromise mechanism.

---

# 83. Persistent Context Requires a Stronger Trust Model Than Ephemeral Context

A malicious transient input ordinarily affects:

[
S_t.
]

A malicious persistent write can affect:

[
S_t,S_{t+1},S_{t+2},\ldots
]

Therefore:

[
Risk(M_{\mathrm{write}})

>

Risk(C_{\mathrm{ephemeral}})
]

for equivalent malicious content.

---

# 84. Least-Privilege Memory Rule

The safe default architecture should be:

[
\boxed{
access=read_only
}
]

unless the task explicitly requires persistent mutation.

Use:

[
read_write
]

only where:

[
NeedPersistentWrite=1.
]

The source specifically recommends read-only access for shared reference stores and stores the agent does not need to modify. 

---

# 85. Context Stores Should Be Segmented by Trust

A robust architecture can partition:

[
\boxed{
M=
M_{\mathrm{trusted-reference}}^{RO}
\cup
M_{\mathrm{user}}^{RW}
\cup
M_{\mathrm{project}}^{RW}
}
]

rather than:

[
M_{\mathrm{everything}}^{RW}.
]

This limits blast radius.

---

# 86. Context Management Requires Provenance

For each persistent memory write, retain:

[
\boxed{
(
store,
path,
session,
version,
timestamp,
operation
).
}
]

The version system already provides the primitive needed for this audit trail.

---

# 87. Memory Header/API Boundary Is Separate From Session API Boundary

The supplied API contract has an important endpoint distinction:

Memory-store endpoints use:

[
agent-memory-2026-07-22
]

while session operations, including attaching a memory store, use:

[
managed-agents-2026-04-01.
]

Combining both headers on a memory-store request produces:

[
400.
]



This is a protocol-level boundary, not merely documentation organization.

---

# 88. Pagination State Can Be Version-Dependent

The memory-list behavior changed under the newer memory API mode, and cursors created under the earlier list behavior are not valid in the newer mode.

Therefore:

[
Cursor_{\mathrm{old-mode}}
\not\rightarrow
Request_{\mathrm{new-mode}}.
]

Pagination must restart from page one after switching behavior. 

---

# 89. Incremental Memory Naturally Degrades

Session-local writes are incremental.

Over many sessions:

[
M_t
===

M_{t-1}
+
\Delta M_t.
]

Without global maintenance:

[
M_t
]

may accumulate:

[
\boxed{
{
duplicates,
contradictions,
stale\ entries
}.
}
]

The consolidation source explicitly identifies these failure modes. 

---

# 90. Consolidation Is a Separate Compute Phase

The research-preview consolidation workflow—called a **dream** in the API—is not another live-session memory write.

It is an asynchronous transformation:

[
\boxed{
D:
(
M_{input},
S_{1:k}
)
\rightarrow
M_{output}.
}
]

The input store is not modified. 

---

# 91. Consolidation Is Copy-and-Rebuild

The operation performs:

[
M_{input}
\xrightarrow{clone}
\tilde M
\xrightarrow{synthesis}
M_{output}.
]

Its documented objectives include:

[
{
deduplicate,
resolve\ stale/contradicted\ entries,
reorganize,
surface\ new\ insights
}.
]

The original store remains untouched for review or rollback. 

---

# 92. Consolidation Inputs

A consolidation job requires:

[
\boxed{
1\ existing\ memory\ store
}
]

plus:

[
\boxed{
1\ldots100\ session\ transcripts.
}
]



If there is no pre-existing store, the documented workflow is to create an empty one first. 

---

# 93. Consolidation Output Is a New Memory Store

The result is not:

[
M_{input}\leftarrow M_{clean}.
]

Instead:

[
\boxed{
M_{output}
\neq
M_{input}.
}
]

This supports explicit human review:

[
Compare(M_{input},M_{output})
]

before any cutover.

---

# 94. Output Store Can Exist Before Consolidation Completes

Once the job enters:

[
running,
]

its output-store identifier is created shortly after the input store has been cloned.

However, there can be a brief interval where:

[
status=running
]

and:

[
outputs=[]
]

still holds. 

Consumers must not assume:

[
running\Rightarrow outputs\neq[].
]

---

# 95. Consolidation Instructions Operate at Synthesis Level

The optional instructions can guide:

[
{
what\ to\ inspect,
what\ to\ merge,
what\ to\ discard,
output\ organization
}.
]

They are not intended as deterministic line-edit commands against individual memory documents. 

For exact targeted modifications:

[
\boxed{
use\ memory\ CRUD/update.
}
]

---

# 96. Consolidation Has Its Own Lifecycle

The state machine is:

[
\boxed{
\sigma_D
\in
{
pending,
running,
completed,
failed,
canceled
}.
}
]

Meaning:

[
pending
=======

queued,
]

[
running
=======

processing,
]

[
completed
=========

new\ memory\ store\ ready,
]

[
failed
======

execution\ error,
]

[
canceled
========

explicitly\ stopped.
]



---

# 97. Failed Consolidation Does Not Automatically Delete Partial Output

On:

[
failed
]

the output memory store remains with whatever partial content had already been produced.

Similarly:

[
canceled
]

leaves the output store intact. 

Therefore:

[
\boxed{
Failure
\neq
TransactionalRollbackOfOutput.
}
]

---

# 98. Consolidation Runs Through an Underlying Session

Once running, the consolidation resource exposes:

[
session_id.
]

The underlying session event stream can be observed to inspect what the process is reading and writing. 

At terminal completion of the consolidation workflow, that internal session is archived rather than deleted, preserving its transcript.

---

# 99. Input Objects Must Remain Available Throughout Consolidation

If an input store is archived or deleted while consolidation is running, the job can fail with:

[
input_memory_store_unavailable.
]

If an input session is deleted:

[
input_session_unavailable.
]



Thus:

[
\boxed{
InputAvailability
}
]

is a runtime dependency, not merely creation-time validation.

---

# 100. Consolidation Never Mutates or Deletes Inputs

Regardless of success:

[
D
\not\rightarrow
Delete(M_{input})
]

and:

[
D
\not\rightarrow
Mutate(M_{input}).
]



Input cleanup is a separate administrative action.

---

# 101. Cancel Semantics

For:

[
\sigma_D\in{pending,running},
]

cancel produces:

[
\sigma_D\rightarrow canceled.
]

Canceling an already canceled job is idempotent.

Canceling a:

[
completed
]

or:

[
failed
]

job is rejected. 

---

# 102. Cancellation Does Not Instantly Freeze Usage Counters

After cancellation, in-flight work can wind down briefly.

Therefore:

[
usage(t_{cancel})
]

may not equal:

[
usage(final).
]

The documentation advises waiting for usage values to stabilize when final accounting is required. 

---

# 103. Consolidation Archive Is Metadata Lifecycle, Not Status Rewrite

A terminal consolidation job may be archived.

Archival:

* sets `archived_at`,
* leaves execution `status` unchanged,
* removes it from default list results,
* preserves retrievability by ID,
* is idempotent,
* cannot be undone.

A pending/running job must first leave active execution before archival. 

---

# 104. Safe Memory Consolidation Cutover

A robust replacement process is:

[
\boxed{
\begin{aligned}
&M_{old}
\
&\downarrow
\
&D(M_{old},S_{1:k})
\
&\downarrow
\
&M_{candidate}
\
&\downarrow
\
&Review(M_{candidate})
\
&\downarrow
\
&CreateNewSessions(M_{candidate})
\
&\downarrow
\
&Archive/Delete(M_{old})\ \text{only if desired}.
\end{aligned}
}
]

Because the old store is not modified, rollback is simply:

[
Attach(M_{old})
]

to future sessions again, provided its lifecycle still permits attachment.

---

# 105. Context Freshness Has Multiple Clocks

Different context substrates refresh at different moments.

### Session interaction context

[
C_{\mathrm{session}}(t)
]

evolves continuously.

### File resources

Can be attached/removed during the session.

### Repository resource set

Fixed at session creation.

### Repository working tree

Can evolve during execution.

### Repository skills

Discovered once at session start.

### Memory store contents

Can evolve persistently and can be shared across sessions.

### Memory-store attachment set

Fixed at session creation.

### Consolidated memory

Exists only as a new derived store after the asynchronous synthesis pipeline.

This mixed temporal model is one of the most important context-management facts.

---

# 106. Snapshot Boundary Matrix

[
\boxed{
\begin{array}{c|c}
\text{State} & \text{Snapshot / mutation boundary}\
\hline
Agent\ configuration & session\ creation\
Memory\ attachment\ set & session\ creation\
Memory\ attachment\ instructions & session\ creation\
Repository\ attachment\ set & session\ creation\
Repository\ skill\ discovery & session\ start\
File\ attachment\ set & dynamic\
Repository\ authorization\ token & rotatable\
Repository\ working\ tree & dynamic\
Memory\ contents & dynamic/persistent\
Session\ event\ history & dynamic\
Consolidation\ output & asynchronous
\end{array}
}
]

---

# 107. Context Mutability Matrix

[
\boxed{
\begin{array}{c|c|c}
\text{Context object} & \text{Agent-writeable} & \text{Persistent}\
\hline
Mounted\ upload & no & source\ object\ independent\
Sandbox\ scratch & yes & no\
Repository\ working\ tree & yes & via\ repository\ workflow\
Memory^{RO} & no & yes\
Memory^{RW} & yes & yes\
Memory\ version & no & retained\
Consolidation\ input & no\ by\ consolidation & yes\
Consolidation\ output & pipeline-generated & yes
\end{array}
}
]

---

# 108. Context Trust Matrix

A sensible security ordering is:

[
\boxed{
Trust(
system\ configuration
)

>

Trust(
curated\ read!-!only\ memory
)

>

Trust(
reviewed\ repository
)

>

Trust(
uploaded\ user\ files
)

>

Trust(
remote\ fetched/tool\ content
)
}
]

but the runtime does not automatically make those semantic trust judgments for the application.

The application must encode trust by:

[
{
resource\ selection,
access\ mode,
credentials,
permissions,
session\ boundaries
}.
]

---

# 109. Persistent Context Is a Data Integrity System

The persistent-memory plane is better modeled as:

[
\boxed{
\text{versioned shared document store}
}
]

than as vague “long-term AI memory.”

It has:

[
{
paths,
hashes,
CRUD,
concurrency,
versions,
redaction,
archive,
delete,
access\ policy
}.
]

Those are database/document-store semantics.

---

# 110. Context Retrieval Is an Agent Decision Surface

Because persistent content lives in filesystem-accessible resources, useful context depends on the agent choosing:

[
WhatToRead
]

and:

[
WhenToRead.
]

The runtime automatically tells the agent where a memory store is and what it contains at a high level, but it does not imply that every document is automatically loaded into every model request. 

Thus context quality depends on both:

[
StorageQuality
]

and:

[
RetrievalBehavior.
]

---

# 111. Bad Context Architecture Can Fail Even With Perfect Model Reasoning

A model cannot correctly use information that is:

[
{
not\ mounted,
misnamed,
stale,
contradictory,
permission-blocked,
poisoned,
stored\ in\ scratch,
or\ never\ read
}.
]

Therefore:

[
\boxed{
AgentQuality
\leq
f(
ModelQuality,
ContextQuality,
ContextAccessibility
).
}
]

---

# 112. Context Is an Authority Surface

Any writable context introduces authority to affect future reasoning.

For persistent store (M):

[
WriteAuthority(M)
]

is effectively:

[
\boxed{
FutureContextInfluenceAuthority.
}
]

That is why `read_write` must be treated as a security privilege.

---

# 113. Context Lifecycle Must Be Explicit

For every resource (r), production design should define:

[
\boxed{
L(r)
====

(
create,
attach,
read,
write,
version,
detach,
archive,
delete
).
}
]

If any transition is undefined, operational debt accumulates.

---

# 114. Context Reproducibility Envelope

Reproducing an agent run requires more than:

[
agent_id
+
session_id.
]

For context-sensitive reproduction:

[
\boxed{
\mathcal R_C
============

(
FileSet,
FileIDs,
FileMounts,
RepositoryURLs,
RepositoryState,
RepositoryMounts,
MemoryStoreIDs,
MemoryAccessModes,
MemoryInstructions,
MemoryVersions,
SkillSnapshot
).
}
]

Combined with the earlier session envelope:

[
\boxed{
\mathcal R_{execution}
======================

\mathcal R_{agent}
\cup
\mathcal R_{environment}
\cup
\mathcal R_{session}
\cup
\mathcal R_C.
}
]

---

# 115. Memory Version Is More Reproducible Than Memory Store ID Alone

If session (S_a) reads:

[
M@t_a
]

and session (S_b) later reads:

[
M@t_b,
]

then:

[
M@t_a
\neq
M@t_b
]

may hold even though:

[
memory_store_id
]

is identical.

Therefore store identity alone is not sufficient for exact historical reproduction.

---

# 116. Shared Memory Introduces Temporal Coupling Between Sessions

For:

[
S_1
\rightarrow M
\leftarrow S_2,
]

writes from:

[
S_1
]

may alter observations available to:

[
S_2.
]

Thus sessions that share writable memory are no longer fully isolated:

[
\boxed{
StateIsolation(S_1,S_2)=false
}
]

with respect to (M).

---

# 117. Read-Only Shared Stores Preserve Better Isolation

If:

[
Access_{S_1}(M)=RO
]

and:

[
Access_{S_2}(M)=RO,
]

then neither session can persistently alter the context source.

This provides a much stronger reproducibility boundary for shared reference material.

---

# 118. Context Failure Domains

The complete context plane exposes several failure classes:

[
\boxed{
F_C=
{
F_{mount},
F_{path},
F_{capacity},
F_{permission},
F_{concurrency},
F_{staleness},
F_{poisoning},
F_{repository},
F_{version},
F_{consolidation}
}.
}
]

Examples:

[
InvalidMount
\rightarrow
resource\ unavailable,
]

[
ReadOnlyWrite
\rightarrow
write\ rejected,
]

[
|M|=2000
\rightarrow
new\ memory\ rejected,
]

[
HashMismatch
\rightarrow
concurrent\ update\ retry,
]

[
PoisonedRWMemory
\rightarrow
cross!-!session\ contamination,
]

[
DeletedDreamInput
\rightarrow
consolidation\ failure.
]

---

# 119. Context Should Be Managed as a Data Plane

The architecture is best separated into:

### Control plane

[
{
resource\ attachment,
access\ policy,
mount\ policy,
lifecycle,
versioning
}.
]

### Data plane

[
{
reads,
writes,
edits,
repository\ operations
}.
]

### Persistence plane

[
{
memory\ stores,
memory\ versions,
repository\ remote\ state
}.
]

### Synthesis plane

[
{
memory\ consolidation
}.
]

This prevents prompt configuration, storage, execution, and persistence from collapsing into one conceptual blob.

---

# 120. Minimal-Authority Context Construction

Given task (Q), construct:

[
R^{*}
=====

\arg\min_R Authority(R)
]

subject to:

[
CanSolve(Q\mid R)=1.
]

Operationally:

[
\boxed{
\begin{aligned}
&\text{Mount only required files}\
&\text{Mount only required repositories}\
&\text{Attach only relevant memory stores}\
&\text{Prefer read-only persistent memory}\
&\text{Grant write access only where required}\
&\text{Use least-privilege repository credentials}\
&\text{Separate trusted and untrusted persistent context}
\end{aligned}
}
]

---

# 121. Complete Context Construction Algorithm

[
\boxed{
\begin{aligned}
&\textbf{Input:}\
&Agent\ A,\ Task\ Q,\ Files\ F,\ Repositories\ G,\ Memories\ M
[4pt]
&\textbf{1. Start from fresh session context}\
&C_0\leftarrow\varnothing
[4pt]
&\textbf{2. Select required uploaded files}\
&F^{*}\leftarrow SelectFiles(Q,F)
\
&\forall f\in F^{*}:\
&\qquad Upload(f)\
&\qquad DefineMountPath(f)
[4pt]
&\textbf{3. Select repositories}\
&G^{*}\leftarrow SelectRepositories(Q,G)
\
&\forall g\in G^{*}:\
&\qquad ValidateCredentialScope(g)\
&\qquad DefineMountPath(g)
[4pt]
&\textbf{4. Select persistent stores}\
&M^{*}\leftarrow SelectMemories(Q,M)
\
&\forall m\in M^{*}:\
&\qquad access(m)\leftarrow
\begin{cases}
RO,&persistent\ write\ unnecessary\
RW,&persistent\ write\ explicitly\ required
\end{cases}
\
&\qquad instructions(m)\leftarrow UsagePolicy(Q,m)
[4pt]
&\textbf{5. Create session}\
&S\leftarrow CreateSession(
A,
resources=
F^{*}\cup G^{*}\cup M^{*}
)
[4pt]
&\textbf{6. Resolve actual mounts}\
&Paths\leftarrow ResourcesList(S)
\
&\text{Use returned mount paths; do not infer them}
[4pt]
&\textbf{7. Runtime context access}\
&\textbf{while }S\text{ active:}\
&\qquad q_t\leftarrow current\ task\ state\
&\qquad r_t\leftarrow choose\ relevant\ resource\
&\qquad x_t\leftarrow Read(r_t)\
&\qquad C_t\leftarrow C_t\cup x_t
[4pt]
&\textbf{8. Writable persistent update}\
&\textbf{if }NeedPersistentWrite(x):\
&\qquad assert\ access(M)=RW\
&\qquad m\leftarrow ReadMemory(path)\
&\qquad h\leftarrow m.content_sha256\
&\qquad m'\leftarrow Transform(m)\
&\qquad Update(m',precondition=h)
\
&\qquad\textbf{if conflict: re-read and retry}
[4pt]
&\textbf{9. Preserve provenance}\
&Record(
session,
resource,
memory\ version,
operation
)
[4pt]
&\textbf{10. Periodic maintenance}\
&\textbf{if }MemoryQualityDegrades(M):\
&\qquad D\leftarrow Consolidate(
M,
RelevantSessions
)
\
&\qquad WaitUntilTerminal(D)
\
&\qquad M_{candidate}\leftarrow D.output
\
&\qquad Review(M_{candidate})
\
&\qquad\textbf{if approved:}\
&\qquad\qquad FutureSessions\leftarrow M_{candidate}
\end{aligned}
}
]

---

# 122. Complete Context Mutation State Machine

For one persistent memory:

[
\boxed{
\begin{aligned}
&m_0
\
&\downarrow create
\
&v_0
\
&\downarrow update
\
&m_1+v_1
\
&\downarrow update
\
&m_2+v_2
\
&\downarrow delete\ live\ memory
\
&\varnothing_{\text{live}}
+
{v_0,v_1,v_2}_{\text{retained}}
\
&\downarrow optional\ redact
\
&{v'_0,v'_1,v'_2}
\end{aligned}
}
]

Store deletion is a different transition:

[
\boxed{
Delete(Store)
\Rightarrow
Delete(
LiveMemories
+
Versions
).
}
]

---

# 123. Complete Cross-Session Memory Loop

[
\boxed{
\begin{aligned}
&S_1\
&\downarrow Read(M)\
&\downarrow PerformTask\
&\downarrow Write(M)\
&M_{v+1}\
&\downarrow\
&S_2\text{ created with same store}\
&\downarrow\
&Descriptor(M)\rightarrow SystemContext_{S_2}\
&\downarrow\
&Read(M_{v+1})\
&\downarrow\
&ContinueWithPersistentKnowledge
\end{aligned}
}
]

This is the actual persistence mechanism.

It is not model-weight adaptation.

It is not invisible hidden state.

It is not automatic transcript carryover.

It is a **versioned shared filesystem-backed knowledge plane**.

---

# 124. Complete Context Consolidation Loop

[
\boxed{
\begin{aligned}
&M_t
+
{S_{t-k},\ldots,S_t}
\
&\downarrow
\
&ConsolidationJob
\
&\downarrow
\
&Clone(M_t)
\
&\downarrow
\
&ReadPastSessions
\
&\downarrow
\
&DetectDuplicates
\
&\downarrow
\
&DetectContradictions/Staleness
\
&\downarrow
\
&Merge/Reorganize/Synthesize
\
&\downarrow
\
&M_{t+1}^{candidate}
\
&\downarrow
\
&Review
\
&\begin{cases}
Adopt\ for\ future\ sessions\
Discard\
Archive
\end{cases}
\end{aligned}
}
]

The input store remains unchanged throughout this process. 

---

# 125. Final Architectural Interpretation

**Manage agent context** is not a prompt-engineering feature.

It is a complete data-and-state architecture:

[
\boxed{
\text{Session Context}
+
\text{Filesystem Resources}
+
\text{Repository Workspace}
+
\text{Persistent Memory}
+
\text{Version History}
+
\text{Trust Policy}
+
\text{Consolidation}.
}
]

The full topology is:

[
\boxed{
\begin{array}{ccccccc}
&& \text{Agent Definition} &&\
&& \downarrow &&\
\text{Uploaded Files}
&\rightarrow&
\text{Session}
&\leftarrow&
\text{Repositories}
\
&& \updownarrow &&\
&& \text{Interaction History} &&\
&& \updownarrow &&\
&& \text{Sandbox Working State} &&\
&& \updownarrow &&\
&& \text{Persistent Memory Stores} &&\
&& \downarrow &&\
&& \text{Immutable Memory Versions} &&\
&& \downarrow &&\
&& \text{Cross-Session Continuity} &&\
&& \downarrow &&\
&& \text{Periodic Consolidation} &&\
&& \downarrow &&\
&& \text{Curated Successor Store}
\end{array}
}
]

The central invariants are:

[
\boxed{
\textbf{Fresh session by default}
}
]

[
\boxed{
\textbf{Persistence must be explicit}
}
]

[
\boxed{
\textbf{Mounted context is not automatically prompt-resident context}
}
]

[
\boxed{
\textbf{Uploaded files are read-only session copies}
}
]

[
\boxed{
\textbf{Repository attachment is session-fixed while its working tree may evolve}
}
]

[
\boxed{
\textbf{Memory stores are persistent, path-addressed, versioned shared state}
}
]

[
\boxed{
\textbf{Read-write memory is future-context authority}
}
]

[
\boxed{
\textbf{Every persistent mutation requires provenance and concurrency discipline}
}
]

[
\boxed{
\textbf{Consolidation creates a successor store; it does not silently rewrite the source}
}
]

The deepest architectural point is:

[
\boxed{
\textbf{
Context management is the control of what information becomes available to reasoning,
where that information lives,
who may mutate it,
how long it survives,
and which future executions can inherit its effects.
}
}
]

Once agents operate across long-lived projects and users, **context ceases to be a token-window problem and becomes a distributed state, storage, provenance, concurrency, and security problem.**
