// 0. SOURCE-LOCKED EXECUTION CONTRACT — vLLM V1, source pin (v0.27.1).

[
\boxed{
\mathfrak F_{\mathrm{vLLM}}
:
{\mathrm{HTTPS}*r}*{r}
\rightarrow
{\mathrm{EngineInput}*r}*{r}
\rightarrow
{\mathrm{EngineCoreRequest}*r}*{r}
\rightarrow
(\mathcal W_k,\mathcal R_k,\mathcal K_k)
\rightarrow
\mathcal S_k
\rightarrow
\mathcal B_k
\rightarrow
M_{\Theta}
\rightarrow
\mathcal Y_k
\rightarrow
(\mathcal W_{k+1},\mathcal R_{k+1},\mathcal K_{k+1})
\rightarrow
{\mathrm{HTTP/SSE}*r}*{r}
}
]

[
\boxed{
\text{One HTTP request}\neq\text{one GPU batch},
\qquad
\mathcal B_k
============

\operatorname{Schedule}
\left(
\bigcup_r\operatorname{Request}_r
\right)
}
]

[
\boxed{
\text{API servers}=A,\qquad
\text{EngineCores}=D,\qquad
\text{GPU workers}=DPT
}
]

[
\boxed{
N_{\mathrm{proc}}
=================

A+D+DPT+\mathbf 1_{{D>1}}
}
]

// (D,T,P) denote data-, tensor-, and pipeline-parallel sizes; each GPU worker owns one accelerator. ([vLLM][1])

// 1. MODEL/PROCESS INITIALIZATION AND MODEL SHARD MATERIALIZATION.

[
\Theta
======

{\Theta_0,\Theta_1,\ldots,\Theta_{L-1},
\Theta_{\mathrm{embed}},
\Theta_{\mathrm{lmhead}}}
]

[
\mathcal G
==========

\left{
(d,p,t):
0\le d<D,;
0\le p<P,;
0\le t<T
\right}
]

[
\left|\mathcal G\right|=DPT
]

[
g=\rho(d,p,t)
]

[
\operatorname{device}(g)
========================

\operatorname{cuda}
\left[
\operatorname{visible_device}
\left(
\operatorname{local_rank}(g)
\right)
\right]
]

[
\operatorname{local_rank}
\leftarrow
\operatorname{local_rank}
+
d_{\mathrm{local}},(PT)
]

[
\mathcal C_{\mathrm{dist}}
==========================

\operatorname{InitDistributedEnvironment}
(D,T,P,\rho)
]

[
M_{\Theta}^{(d,p,t)}
====================

\operatorname{ModelLoader.load}
\left(
M,\Theta;d,p,t
\right)
]

[
\boxed{
\Theta^{(d_1,p,t)}
==================

\Theta^{(d_2,p,t)}
\qquad
\forall d_1,d_2
}
]

[
\boxed{
\Theta^{(d,p,t)}
\subseteq
\Theta
\qquad
\text{for }P>1\text{ or }T>1
}
]

// 1.1. COLUMN-PARALLEL TP PRIMITIVE.

[
W
\in
\mathbb R^{d_{\mathrm{in}}\times d_{\mathrm{out}}}
]

[
W
=

\left[
W^{(0)}
;|;
W^{(1)}
;|\cdots|;
W^{(T-1)}
\right]
]

[
W^{(t)}
\in
\mathbb R^{
d_{\mathrm{in}}
\times
\frac{d_{\mathrm{out}}}{T}
}
]

[
Y^{(t)}
=======

XW^{(t)}+b^{(t)}
]

[
Y=
\begin{cases}
\operatorname{AllGather}_{TP}
\left(
Y^{(0)},\ldots,Y^{(T-1)}
\right),
&
\mathrm{gather_output}=1,
[2mm]
Y^{(t)},
&
\mathrm{gather_output}=0.
\end{cases}
]

// 1.2. ROW-PARALLEL TP PRIMITIVE.

[
W=
\begin{bmatrix}
W^{(0)}
\
W^{(1)}
\
\vdots
\
W^{(T-1)}
\end{bmatrix},
\qquad
X=
\left[
X^{(0)}
|\cdots|
X^{(T-1)}
\right]
]

[
W^{(t)}
\in
\mathbb R^{
\frac{d_{\mathrm{in}}}{T}
\times
d_{\mathrm{out}}
}
]

[
\widetilde Y^{(t)}
==================

X^{(t)}W^{(t)}
+
\mathbf1_{{t=0}},b
]

[
Y
=

\begin{cases}
\displaystyle
\operatorname{AllReduce}_{TP}
\left(
\widetilde Y^{(t)}
\right)
=======

\sum_{t=0}^{T-1}\widetilde Y^{(t)},
&
\mathrm{reduce_results}=1,
[3mm]
\widetilde Y^{(t)},
&
\mathrm{reduce_results}=0.
\end{cases}
]

// 1.3. QKV HEAD SHARDING.

[
H_Q^{(t)}
=========

\frac{H_Q}{T}
]

[
H_{KV}^{(t)}
============

\begin{cases}
1,
&
T\ge H_{KV},
[1mm]
\dfrac{H_{KV}}{T},
&
T<H_{KV},
\end{cases}
]

[
R_{KV}
======

\begin{cases}
\dfrac{T}{H_{KV}},
&
T\ge H_{KV},
\
1,
&
T<H_{KV}.
\end{cases}
]

[
W_{QKV}^{(t)}
=============

\operatorname{Shard}_{t}
\left(
W_Q,W_K,W_V
\right)
]

// 1.4. PIPELINE PARTITION.

[
{0,\ldots,L-1}
==============

\bigsqcup_{p=0}^{P-1}\mathcal L_p
]

[
M^{(p)}
=======

\prod_{\ell\in\mathcal L_p}M_\ell
]

[
H^{(0)}
=======

E(X)
]

[
H^{(p+1)}
=========

M^{(p)}
\left(
H^{(p)}
\right)
]

[
H^{(P)}
=======

M^{(P-1)}
\left(
H^{(P-1)}
\right)
]

[
\boxed{
\text{sampling/logits}
;\in;
p=P-1
}
]

// Non-last PP ranks return intermediate tensors; last PP rank produces final hidden states and sampled tokens.

// 1.5. KV-CACHE CAPACITY INITIALIZATION.

[
\mathcal S_{KV}^{(g)}
=====================

\operatorname{GetKVCacheSpec}
\left(
M^{(g)}
\right)
]

[
\mu^{(g)}_{\mathrm{avail}}
==========================

\operatorname{DetermineAvailableMemory}
\left(
M^{(g)}
\right)
]

[
\mathcal C_{KV}^{(g)}
=====================

\operatorname{GetKVCacheConfig}
\left(
\mathcal S_{KV}^{(g)},
\mu^{(g)}_{\mathrm{avail}}
\right)
]

[
N_{\mathrm{blocks}}
===================

\operatorname{KVCapacity}
\left(
{\mathcal C_{KV}^{(g)}}_{g}
\right)
]

[
\mathcal P_{\mathrm{free}}^{(0)}
================================

{0,1,\ldots,N_{\mathrm{blocks}}-1}
]

// 2. HTTPS (\rightarrow) OPENAI REQUEST OBJECT.

[
\mathcal H_r
============

\left(
\operatorname{method}_r,
\operatorname{path}_r,
\operatorname{headers}_r,
\operatorname{JSON}_r
\right)
]

[
\mathcal H_r
\xrightarrow{
\operatorname{HTTPDecode}
}
Q_r
]

[
Q_r
===

\left(
\mathcal M_r,
\Theta_r^{\mathrm{sampling}},
\mathrm{tools}_r,
\mathrm{stream}_r,
m_r^{\mathrm{req}},
\ldots
\right)
]

[
\operatorname{ValidateModel}(Q_r)=1
]

[
\operatorname{EngineAlive}=1
]

// 3. CHAT RENDERING / TOKENIZATION / PREPROCESSING.

[
\mathcal M_r
============

(m_{r,0},m_{r,1},\ldots,m_{r,J_r-1})
]

[
\Gamma_r
========

\operatorname{ChatParams}
\left(
\operatorname{template},
\operatorname{tools},
\operatorname{template_kwargs}
\right)
]

[
\Tau_r
======

\operatorname{TokenizationParams}(Q_r)
]

[
E_r
===

\begin{cases}
\operatorname{TokensInput}
\left(
x_r^{\mathrm{reuse}},
\operatorname{cache_salt}_r
\right),
&
x_r^{\mathrm{reuse}}\neq\varnothing,
[2mm]
\operatorname{RenderChatAsync}
\left(
\mathcal M_r,\Gamma_r,\Tau_r
\right),
&
\text{ordinary renderer},
[2mm]
\operatorname{TokensInput}
\left(
\operatorname{RenderForCompletion}
(
\operatorname{Harmony}(\mathcal M_r)
)
\right),
&
\text{Harmony path}.
\end{cases}
]

[
E_r
===

\left(
x_r,
e_r^{\mathrm{prompt}},
\mathcal F_r^{MM},
\operatorname{cache_salt}_r,
\ldots
\right)
]

[
x_r
===

(x_{r,0},\ldots,x_{r,N_r^{P}-1})
]

[
N_r^P
=====

|x_r|
]

// 3.1. OUTPUT-LENGTH AND SAMPLING-PARAMETER RESOLUTION.

[
m_r
===

\operatorname{GetMaxTokens}
\left(
L_M,
m_r^{\mathrm{req}},
N_r^P,
\Theta^{\mathrm{default}},
\Theta^{\mathrm{override}}
\right)
]

[
\Sigma_r
========

\operatorname{ToSamplingParams}
\left(
Q_r,
m_r,
\Theta^{\mathrm{default}}
\right)
]

[
0
<
N_r^P
\le
L_M
]

[
m_r
\le
L_M-N_r^P
]

// 4. ENGINE-CORE REQUEST CONSTRUCTION.

[
R_r^{core}
==========

\Big(
id_r,
x_r,
e_r^{prompt},
\mathcal F_r^{MM},
\Sigma_r,
t_r^{arrival},
\operatorname{LoRA}_r,
\operatorname{cacheSalt}_r,
\operatorname{priority}_r,
d_r,
\operatorname{trace}_r
\Big)
]

[
id_r^{ext}
\leftarrow
id_r
]

[
id_r^{int}
==========

id_r^{ext}
,\Vert,
"-"
,\Vert,
UUID_{8}
]

[
\operatorname{OutputProcessor.add}
\left(
R_r^{core}
\right)
]

[
R_r^{core}
\xrightarrow{\mathrm{ZMQ}}
\operatorname{EngineCore}_{d_r}
]

// API-side input processing and EngineCore-side scheduling are separate processes in online V1 serving. ([vLLM][1])

// 5. ENGINE REQUEST STATE.

[
P_r
===

x_r
]

[
O_r^{(0)}
=========

[]
]

[
D_r^{(0)}
=========

[]
]

[
A_r^{(k)}
=========

P_r
\Vert
O_r^{(k)}
]

[
N_r^{(k)}
=========

# |A_r^{(k)}|

|P_r|
+
|O_r^{(k)}|
]

[
N_{r,\mathrm{spec}}^{(k)}
=========================

N_r^{(k)}
+
|D_r^{(k)}|
]

[
C_r^{(0)}=0
]

[
F_r^{(0)}=0
]

[
H_r^{(0)}=0
]

[
S_r^{(0)}
=========

\mathrm{WAITING}
]

[
\mathfrak R_r^{(k)}
===================

\left(
P_r,
O_r^{(k)},
D_r^{(k)},
C_r^{(k)},
F_r^{(k)},
H_r^{(k)},
S_r^{(k)},
KV_r^{(k)}
\right)
]

// 6. GLOBAL CONTINUOUS-BATCH STATE.

[
\mathcal W_k
============

{
r:S_r^{(k)}\in
[\mathrm{WAITING},\mathrm{PREEMPTED},\ldots]
}
]

[
\mathcal R_k
============

{
r:S_r^{(k)}=\mathrm{RUNNING}
}
]

[
\mathcal K_k
============

\left(
\mathcal P_{\mathrm{free}}^{(k)},
{KV_r^{(k)}}_{r}
\right)
]

[
\boxed{
\mathcal X_k
============

(\mathcal W_k,\mathcal R_k,\mathcal K_k)
}
]

[
\boxed{
\mathcal X_{k+1}
================

\Phi_{\mathrm{vLLM}}
\left(
\mathcal X_k,
\mathcal A_k,
M_\Theta
\right)
}
]

[
\mathcal A_k
============

{
r:
t_r^{arrival}\in(t_{k-1},t_k]
}
]

[
\mathcal W_k
\leftarrow
\mathcal W_k
\cup
\mathcal A_k
]

// 7. UNIFIED V1 TOKEN-DEFICIT SCHEDULER — no independent prefill/decode scheduling phases.

[
B_k^{tok}
=========

# B_{\max}

\operatorname{max_num_scheduled_tokens}
]

[
\boxed{
\Delta_r^{(k)}
==============

N_{r,\mathrm{spec}}^{(k)}
+
H_r^{(k)}
---------

C_r^{(k)}
}
]

[
\boxed{
\Delta_r^{(k)}
==============

|P_r|
+
|O_r^{(k)}|
+
|D_r^{(k)}|
+
H_r^{(k)}
---------

C_r^{(k)}
}
]

[
q_r^{(k,0)}
===========

\max(0,\Delta_r^{(k)})
]

[
q_r^{(k,1)}
===========

\min
\left(
q_r^{(k,0)},
\lambda_{\mathrm{long}}
\right),
\qquad
\lambda_{\mathrm{long}}
=======================

\begin{cases}
\mathrm{long_prefill_threshold}, & >0,\
+\infty,&=0.
\end{cases}
]

[
q_r^{(k,2)}
===========

\min
\left(
q_r^{(k,1)},
B_k^{tok}
\right)
]

[
q_r^{(k)}
=========

\min
\left(
q_r^{(k,2)},
L_M-C_r^{(k)}-n_{\mathrm{sample/step}}
\right)
]

[
B_k^{tok}
\leftarrow
B_k^{tok}-q_r^{(k)}
]

// 7.1. ANALYTICAL LABELS ONLY; THESE ARE NOT SEPARATE SCHEDULERS.

[
\mathcal P_k
============

\left{
r:
C_r^{pre}<|P_r|
\right}
]

[
\mathcal D_k
============

\left{
r:
C_r^{pre}\ge|P_r|
\right}
]

[
\mathcal P_k^{first}
====================

\left{
r:
C_r^{pre}=0
\right}
]

[
\mathcal P_k^{chunk}
====================

\left{
r:
0<C_r^{pre}<|P_r|
\right}
]

[
\boxed{
\mathcal B_k
\cap\mathcal P_k\neq\varnothing
\quad\land\quad
\mathcal B_k
\cap\mathcal D_k\neq\varnothing
}
]

// A single execution batch can simultaneously contain prefill chunks and decode queries.

// 8. PREFIX-CACHE LOOKUP FOR NEW/RESUMED REQUESTS.

[
\mathcal H_r
============

\operatorname{BlockHashSequence}
\left(
A_r
\right)
]

[
L_r^{cache,\max}
================

N_r-1
]

[
\left(
\mathcal B_r^{hit},
C_{r,\mathrm{local}}^{hit},
U_r
\right)
=======

\operatorname{FindLongestCacheHit}
\left(
\mathcal H_r,
L_r^{cache,\max}
\right)
]

[
C_{r,\mathrm{external}}^{hit}
=============================

\begin{cases}
\operatorname{KVConnectorMatch}(r),
&
\mathrm{connector}\neq\varnothing,
\
0,
&
\mathrm{connector}=\varnothing
\end{cases}
]

[
C_r^{hit}
=========

C_{r,\mathrm{local}}^{hit}
+
C_{r,\mathrm{external}}^{hit}
]

[
\boxed{
C_r^{hit}\le N_r
}
]

[
q_r^{new}
=========

N_r-C_r^{hit}
]

// Even a full prefix-cache hit recomputes at least the final position required to obtain logits.

// 9. KV-BLOCK ADMISSION / ALLOCATION.

[
KV_r
====

\left(
KV_{r,0},
KV_{r,1},
\ldots,
KV_{r,G-1}
\right)
]

[
KV_{r,g}
========

[
b_{r,g,0},
b_{r,g,1},
\ldots
]
]

[
\mathcal N_r^{alloc}
====================

\operatorname{AllocateSlots}
\left(
r,,
q_r,,
C_{r,\mathrm{local}}^{hit},,
\mathcal B_r^{hit},,
C_{r,\mathrm{external}}^{hit},,
L_r^{lookahead}
\right)
]

[
\mathcal N_r^{alloc}
====================

\varnothing
\iff
\operatorname{AvailableKVBlocks}
<
\operatorname{RequiredKVBlocks}(r,q_r,\ldots)
]

// 9.1. HOMOGENEOUS FULL-ATTENTION SPECIALIZATION.

[
n_r^{blocks}(s)
===============

\left\lceil
\frac{s}{B_{KV}}
\right\rceil
]

[
\Delta n_r^{blocks}
===================

\max
\left[
0,,
\left\lceil
\frac{
C_r+q_r+L_r^{lookahead}
}{
B_{KV}
}
\right\rceil
------------

|KV_r|
\right]
]

// 9.2. PREEMPTION TRANSITION WHEN RUNNING REQUEST CANNOT OBTAIN BLOCKS.

[
r^\star
=======

\begin{cases}
\displaystyle
\arg\max_{r\in\mathcal R_k}
(\operatorname{priority}_r,t_r^{arrival}),
&
\mathrm{PRIORITY},
[3mm]
\operatorname{tail}(\mathcal R_k),
&
\mathrm{FCFS}.
\end{cases}
]

[
KV_{r^\star}
\rightarrow
\mathcal P_{\mathrm{free}}
]

[
C_{r^\star}\leftarrow0
]

[
D_{r^\star}\leftarrow[]
]

[
S_{r^\star}\leftarrow\mathrm{PREEMPTED}
]

[
\mathcal R_k
\leftarrow
\mathcal R_k
\setminus
{r^\star}
]

[
\mathcal W_k
\leftarrow
{r^\star}
\cup
\mathcal W_k
]

// 10. SCHEDULER OUTPUT.

[
\mathcal S_k
============

\Big(
\mathcal N_k^{new},
\mathcal N_k^{cached},
{q_r^{(k)}}*{r\in\mathcal B_k},
{KV_r^{new}}*{r\in\mathcal B_k},
\mathcal D_k^{spec},
\mathcal E_k^{encoder},
\mathcal F_k^{finished},
\mathcal P_k^{preempted}
\Big)
]

[
Q_k
===

\sum_{r\in\mathcal B_k}
q_r^{(k)}
]

[
Q_k
\le
B_{\max}
]

[
|\mathcal B_k|
\le
R_{\max}
]

// 10.1. OPTIMISTIC POST-SCHEDULE STATE ADVANCE.

[
\boxed{
C_r^{sched}
===========

C_r^{pre}
+
q_r
}
]

[
F_r^{sched}
===========

F_r^{pre}
+
q_r
]

[
\operatorname{isPrefillChunk}_r
===============================

\mathbf1
\left[
C_r^{sched}
<
N_r+H_r
\right]
]

[
\boxed{
C_r^{pre}
;\xrightarrow{\operatorname{schedule}};
C_r^{sched}
\quad
\text{before model output is processed}
}
]

// 11. MODELRUNNER REQUEST-STATE SYNCHRONIZATION.

[
\operatorname{FinishOldStates}
\left(
\mathcal F_k^{finished}
\right)
]

[
\operatorname{AddNewStates}
\left(
\mathcal N_k^{new}
\right)
]

[
\operatorname{UpdateExistingStates}
\left(
\mathcal N_k^{cached}
\right)
]

[
\operatorname{AppendBlockIDs}
\left(
KV_r^{new}
\right)
]

[
\operatorname{ApplyStagedBlockTableWrites}()
]

// 12. DYNAMIC CONTINUOUS-BATCH PACKING.

[
\pi_k
=====

\operatorname{SortBatchRequestIDs}
\left(
{q_r}_{r\in\mathcal B_k}
\right)
]

[
(r_0,r_1,\ldots,r_{R_k-1})
==========================

\pi_k(\mathcal B_k)
]

[
R_k
===

|\mathcal B_k|
]

[
Q_0=0
]

[
Q_{j+1}
=======

Q_j+q_{r_j}
]

[
Q_{R_k}
=======

Q_k
]

[
\boxed{
\operatorname{queryStartLoc}
============================

[Q_0,Q_1,\ldots,Q_{R_k}]
}
]

[
\operatorname{seqLen}_{r_j}
===========================

C_{r_j}^{pre}
+
q_{r_j}
]

[
\operatorname{position}
\left[
Q_j+m
\right]
=======

C_{r_j}^{pre}+m,
\qquad
0\le m<q_{r_j}
]

// 12.1. INPUT TOKEN ASSEMBLY.

[
X_k
\in
\mathbb N^{Q_k}
]

[
X_k[Q_j:Q_{j+1}]
================

\operatorname{AssembleInput}
\left(
P_{r_j},
O_{r_j},
D_{r_j};
C_{r_j}^{pre},
q_{r_j}
\right)
]

[
X_k[Q_j+m]
==========

A_{r_j}
\left[
C_{r_j}^{pre}+m
\right]
\qquad
\text{when the position already exists in }A_{r_j}
]

[
X_k[Q_j+m]
==========

\operatorname{Draft/LastSampledToken}_{r_j,m}
\qquad
\text{for decode/speculative positions}
]

// 12.2. PREFILL FLAG.

[
C_{r_j}^{P}
===========

\min
\left(
C_{r_j}^{pre},
|P_{r_j}|
\right)
]

[
\operatorname{prefilling}_{r_j}
===============================

\mathbf1
\left[
C_{r_j}^{P}
<
|P_{r_j}|
\right]
]

// 13. PHYSICAL KV BLOCK TABLE (\rightarrow) SLOT MAPPING.

[
BT_{g,r}
========

[
b_{g,r,0},
b_{g,r,1},
\ldots
]
]

[
BT_k^{(g)}
==========

\operatorname{GatherRows}
\left(
BT_g,
\pi_k
\right)
]

[
BT_k^{(g)}
\in
\mathbb Z^{
R_k^{pad}\times B_g^{max}
}
]

// 13.1. (CP=1).

[
\beta_g(p)
==========

\left\lfloor
\frac{p}{B_g}
\right\rfloor
]

[
\omega_g(p)
===========

p\bmod B_g
]

[
b_g(r,p)
========

BT_{g,r}
\left[
\beta_g(p)
\right]
]

[
\boxed{
\operatorname{slot}_g(r,p)
==========================

b_g(r,p),B_g+\omega_g(p)
}
]

// 13.2. CONTEXT-PARALLEL SLOT MAPPING.

[
\beta_g(p)
==========

\left\lfloor
\frac{p}{B_gC}
\right\rfloor
]

[
\omega_g(p)
===========

p\bmod(B_gC)
]

[
\operatorname{local}_c(p)
=========================

\mathbf1
\left[
\left(
\left\lfloor
\frac{\omega_g(p)}{I_C}
\right\rfloor
\bmod C
\right)
=======

c
\right]
]

[
u_g(p)
======

\left\lfloor
\frac{\omega_g(p)}
{I_CC}
\right\rfloor I_C
+
\left(
\omega_g(p)\bmod I_C
\right)
]

[
\operatorname{slot}_{g,c}(r,p)
==============================

\begin{cases}
BT_{g,r}[\beta_g(p)],B_g+u_g(p),
&
\operatorname{local}_c(p)=1,
\
\operatorname{PAD_SLOT_ID},
&
\operatorname{local}_c(p)=0.
\end{cases}
]

// 14. EXECUTION-DESCRIPTOR / CUDA-GRAPH DISPATCH.

[
\mathfrak D_k
=============

\operatorname{DispatchAndSyncDP}
\left(
R_k,
Q_k,
q_{\max},
D,
d
\right)
]

[
Q_k^{exec}
==========

\operatorname{PadForExecution}
\left(
Q_k,\mathfrak D_k
\right)
]

[
\operatorname{mode}_k
\in
{
\mathrm{FULL},
\mathrm{PIECEWISE},
\mathrm{EAGER}
}
]

// 15. MODEL-FORWARD INPUT.

[
\mathcal I_k
============

\left(
X_k,
Pos_k,
BT_k,
Slot_k,
AttnMeta_k,
H_k^{intermediate},
E_k^{MM}
\right)
]

[
AttnMeta_k
==========

\operatorname{PrepareAttention}
\left(
Q_k,
\operatorname{seqLen}_k,
BT_k,
Slot_k
\right)
]

[
\operatorname{ForwardContext}_k
===============================

\left(
AttnMeta_k,
Slot_k,
Q_k^{exec},
\operatorname{mode}_k
\right)
]

// 15.1. KV WRITE SEMANTICS.

[
(K_{\ell,p},V_{\ell,p})
=======================

\operatorname{KVProject}*{\ell}
\left(
H*{\ell,p}
\right)
]

[
s
=

\operatorname{slot}_{g}(r,p)
]

[
KV_{\ell,g}^{K}[s]
\leftarrow
K_{\ell,p}
]

[
KV_{\ell,g}^{V}[s]
\leftarrow
V_{\ell,p}
]

[
H_{\ell+1,p}
============

M_{\ell}
\left(
H_{\ell,p};
BT_{g,r},
KV_{\ell,g},
AttnMeta_k
\right)
]

// 16. DISTRIBUTED MODEL (M) FORWARD.

[
H_k^{(0)}
=========

\operatorname{Embed}
\left(
X_k,Pos_k
\right)
]

[
\forall p\in{0,\ldots,P-1}:
\qquad
H_k^{(p+1)}
===========

M_{\Theta_p}^{TP}
\left(
H_k^{(p)};
KV_k,
AttnMeta_k
\right)
]

[
M_{\Theta_p}^{TP}
=================

\left{
M_{\Theta_{p,t}}
\right}_{t=0}^{T-1}
]

[
H_k^{(p+1)}
===========

\operatorname{TPCollectives}
\left(
\left{
M_{\Theta_{p,t}}
\left(
H_k^{(p)}
\right)
\right}_{t=0}^{T-1}
\right)
]

[
p<P-1:
\qquad
H_k^{(p+1)}
\xrightarrow{\mathrm{PP}}
H_k^{(p+1)}_{\mathrm{next\ stage}}
]

[
\boxed{
H_k
===

H_k^{(P)}
}
]

// 16.1. ACTUAL RUNNER DISPATCH.

[
H_k
===

\begin{cases}
\operatorname{CUDAFullGraphReplay}
(\mathcal I_k),
&
\operatorname{mode}_k=\mathrm{FULL},
[2mm]
\operatorname{PiecewiseGraph}
(M,\mathcal I_k),
&
\operatorname{mode}_k=\mathrm{PIECEWISE},
[2mm]
M(\mathcal I_k),
&
\operatorname{mode}_k=\mathrm{EAGER}.
\end{cases}
]

// Source runner updates request state, prepares block tables/slot mappings, runs (M), then separates execution from sampling.

// 17. LOGIT POSITION EXTRACTION.

[
\Lambda_k
=========

\operatorname{LogitsIndices}
\left(
\mathcal B_k,
Q_k,
D_k
\right)
]

[
\text{ordinary non-speculative case:}
\qquad
\Lambda_{r_j}
=============

Q_{j+1}-1
]

[
H_k^{sample}
============

H_k[\Lambda_k]
]

[
Z_k
===

M.\operatorname{compute_logits}
\left(
H_k^{sample}
\right)
]

[
Z_k
\in
\mathbb R^{N_{\mathrm{logit}}\times|\mathcal V|}
]

// 18. STRUCTURED-OUTPUT LOGIT MASK, WHEN PRESENT.

[
Z'_{r,v}
========

\begin{cases}
Z_{r,v},
&
G_{r,v}=1,
\
-\infty,
&
G_{r,v}=0.
\end{cases}
]

// 19. SOURCE-ORDERED SAMPLER TRANSFORMATION.

[
Z_r^{(0)}
=========

Z_r
]

[
Z_r^{(1)}
=========

\operatorname{LogitBias}
\left(
Z_r^{(0)};
\Sigma_r
\right)
]

[
Z_r^{(2)}
=========

\operatorname{Penalty}
\left(
Z_r^{(1)};
P_r,O_r,\Sigma_r
\right)
]

[
Z_{r,v}^{(3)}
=============

\begin{cases}
-\infty,
&
v\in\operatorname{BadWords}*r,
\
Z*{r,v}^{(2)},
&
\text{otherwise}
\end{cases}
]

[
Z_r^{(4)}
=========

\operatorname{Temperature}
\left(
Z_r^{(3)};
T_r
\right)
]

[
Z_r^{(5)}
=========

\operatorname{MinP}
\left(
Z_r^{(4)};
p_r^{min}
\right)
]

[
Z_r^{(6)}
=========

\operatorname{TopKTopP}
\left(
Z_r^{(5)};
k_r,p_r
\right)
]

[
y_r
===

\begin{cases}
\operatorname{FlashInferSample}
\left(
Z_r^{(5)},k_r,p_r
\right),
&
\chi_r^{FI}=1,
[2mm]
\operatorname{GumbelSample}
\left(
Z_r^{(6)};
seed_r,pos_r
\right),
&
\chi_r^{FI}=0.
\end{cases}
]

// 20. PREFILL DOES NOT EMIT AN OUTPUT TOKEN UNTIL ITS FINAL PROMPT CHUNK.

[
a_r^{(k)}
=========

\mathbf1
\left[
\operatorname{seqLen}_r^{(k)}
\ge
|P_r|
\right]
]

[
n_r^{sampled}
=============

a_r^{(k)}
\qquad
\text{ordinary non-speculative generation}
]

[
Y_r^{(k)}
=========

\begin{cases}
[],
&
C_r^{sched}<|P_r|,
[1mm]
[y_r],
&
C_r^{sched}\ge|P_r|.
\end{cases}
]

[
\boxed{
\text{non-final chunked prefill}
\Longrightarrow
Y_r^{(k)}=[]
}
]

[
\boxed{
\text{final prefill chunk}
\Longrightarrow
Y_r^{(k)}=[y_r^{(1)}]
}
]

// 21. THE CRITICAL PREFILL (\rightarrow) DECODE STATE TRANSITION.

[
C_r^{(0)}=0,
\qquad
N_r^{(0)}=|P_r|
]

[
q_r^{prefill}
=============

|P_r|
\qquad
\text{if no cache hit/chunk limit}
]

[
C_r
\leftarrow
|P_r|
]

[
y_{r,1}
\sim
p_\Theta
\left(
\cdot\mid P_r
\right)
]

[
O_r
\leftarrow
[y_{r,1}]
]

[
N_r
===

|P_r|+1
]

[
\boxed{
\Delta_r
========

# N_r-C_r

# (|P_r|+1)-|P_r|

1
}
]

[
q_r^{decode}=1
]

[
\boxed{
\text{decode step }t
:
\quad
\operatorname{forward}(y_{r,t})
;\Longrightarrow;
\operatorname{sample}(y_{r,t+1})
}
]

[
KV_r
:
\quad
P_r
\rightarrow
P_r\Vert y_{r,1}
\rightarrow
P_r\Vert y_{r,1}\Vert y_{r,2}
\rightarrow\cdots
]

// 22. ORDINARY AUTOREGRESSIVE DECODE RECURRENCE.

[
O_r^{(t)}
=========

[y_{r,1},\ldots,y_{r,t}]
]

[
A_r^{(t)}
=========

P_r\Vert O_r^{(t)}
]

[
N_r^{(t)}
=========

|P_r|+t
]

[
C_r^{(t)}
=========

|P_r|+t-1
]

[
\Delta_r^{(t)}
==============

# N_r^{(t)}-C_r^{(t)}

1
]

[
q_r^{(t)}
=========

1
]

[
H_{r,t}
=======

M_\Theta
\left(
y_{r,t};
KV_r^{(t-1)}
\right)
]

[
Z_{r,t+1}
=========

M.\operatorname{compute_logits}
(H_{r,t})
]

[
y_{r,t+1}
=========

\operatorname{Sample}
\left(
Z_{r,t+1};
\Sigma_r
\right)
]

[
O_r^{(t+1)}
===========

O_r^{(t)}
\Vert
[y_{r,t+1}]
]

// 23. MODELRUNNER (\rightarrow) SCHEDULER OUTPUT TRANSFER.

[
\mathcal Y_k^{MR}
=================

\left(
{id_r},
{Y_r^{(k)}},
{\log p_r^{(k)}},
\operatorname{promptLogProbs},
\operatorname{KVConnectorOutput}
\right)
]

[
\mathcal Y_k^{MR}
\xrightarrow{\mathrm{D2H/AsyncOutput}}
\operatorname{EngineCore}
]

[
p=P-1
;\xrightarrow{\operatorname{PPBroadcast}(Y_k)}
;
p=0,\ldots,P-2
]

// Sampled tokens are broadcast from the final PP stage so non-final stages can update their request state.

// 24. SCHEDULER RECONCILIATION AFTER THE GPU STEP.

[
F_r
\leftarrow
F_r-q_r
]

[
Y_r^{(k)}
=========

[y_{r,1}^{new},\ldots,y_{r,a_r}^{new}]
]

[
O_r
\leftarrow
O_r
\Vert
Y_r^{(k)}
]

[
A_r
\leftarrow
P_r\Vert O_r
]

[
N_r
\leftarrow
|A_r|
]

// 24.1. SPECULATIVE REJECTION ROLLBACK, WHEN ENABLED.

[
n_r^{draft}
===========

|D_r^{scheduled}|
]

[
n_r^{accepted}
==============

\max
\left(
|Y_r|-n_{\mathrm{sample/step}},
0
\right)
]

[
n_r^{rejected}
==============

## n_r^{draft}

n_r^{accepted}
]

[
C_r
\leftarrow
C_r-n_r^{rejected}
]

[
H_r
\leftarrow
H_r-n_r^{rejected}
]

// 25. ENGINE-SIDE STOP STATE.

[
\operatorname{Stop}_r
=====================

\mathbf1
\left[
|O_r|\ge m_r^{min}
\right]
\cdot
\mathbf1
\left[
\begin{array}{l}
y_r=\operatorname{EOS}_r
\
\lor;
y_r\in\operatorname{StopTokenIDs}_r
\
\lor;
N_r\ge L_M
\
\lor;
|O_r|\ge m_r
\
\lor;
\operatorname{RepetitionDetected}(O_r)
\end{array}
\right]
]

[
y_r=\operatorname{EOS}_r
\Longrightarrow
S_r=\mathrm{FINISHED_STOPPED}
]

[
y_r\in\operatorname{StopTokenIDs}_r
\Longrightarrow
S_r=\mathrm{FINISHED_STOPPED}
]

[
N_r\ge L_M
\lor
|O_r|\ge m_r
\Longrightarrow
S_r=\mathrm{FINISHED_LENGTH_CAPPED}
]

[
\operatorname{Stop}_r=0
\Longrightarrow
S_r=\mathrm{RUNNING}
]

// 26. KV RELEASE ON FINAL COMPLETION.

[
S_r
\in
\mathcal S_{\mathrm{finished}}
\Longrightarrow
KV_r
\xrightarrow{\operatorname{free}}
\mathcal P_{\mathrm{free}}
]

[
\mathcal R_{k+1}
================

\left(
\mathcal R_k
\cup
\mathcal N_k^{admitted}
\right)
\setminus
\left(
\mathcal F_k
\cup
\mathcal P_k^{preempted}
\right)
]

[
\mathcal W_{k+1}
================

\left(
\mathcal W_k
\setminus
\mathcal N_k^{admitted}
\right)
\cup
\mathcal P_k^{preempted}
\cup
\mathcal A_{k+1}
]

// 27. CONTINUOUS BATCHING RECURRENCE.

[
\boxed{
\mathcal B_{k}
==============

\operatorname{Schedule}
\left(
\mathcal W_k,
\mathcal R_k,
\mathcal K_k;
B_{\max},
R_{\max}
\right)
}
]

[
\boxed{
\mathcal B_{k+1}
================

\operatorname{Schedule}
\left(
\mathcal W_{k+1},
\mathcal R_{k+1},
\mathcal K_{k+1};
B_{\max},
R_{\max}
\right)
}
]

[
\boxed{
\mathcal B_{k+1}
\not\equiv
\mathcal B_k
}
]

[
r_a\in\mathcal B_k,
\quad
r_a\notin\mathcal B_{k+1}
\qquad
\text{if }r_a\text{ finishes/preempts}
]

[
r_b\notin\mathcal B_k,
\quad
r_b\in\mathcal B_{k+1}
\qquad
\text{if }r_b\text{ becomes admissible}
]

[
r_c\in\mathcal B_k\cap\mathcal B_{k+1}
\qquad
\text{if }r_c\text{ remains runnable}
]

[
\boxed{
\text{continuous batching}
==========================

\text{per-step reconstruction of }\mathcal B_k
\text{ from persistent request state}
}
]

// 28. ENGINE CORE EXECUTION RECURRENCE.

[
\mathcal S_k
============

\operatorname{Scheduler.schedule}
\left(
\mathcal X_k
\right)
]

[
F_k^{exec}
==========

\operatorname{Executor.execute_model}
\left(
\mathcal S_k
\right)
]

[
G_k
===

\operatorname{Scheduler.get_grammar_bitmask}
\left(
\mathcal S_k
\right)
]

[
H_k
===

F_k^{exec}.\operatorname{result}()
]

[
\mathcal Y_k^{MR}
=================

\begin{cases}
H_k,
&
H_k\neq\varnothing,
[1mm]
\operatorname{Executor.sample_tokens}(G_k),
&
H_k=\varnothing.
\end{cases}
]

[
\mathcal Y_k^{EC}
=================

\operatorname{Scheduler.update_from_output}
\left(
\mathcal S_k,
\mathcal Y_k^{MR}
\right)
]

// 29. ENGINECOREOUTPUT (\rightarrow) DETOKENIZATION.

[
ECO_r^{(k)}
===========

\left(
id_r,
Y_r^{(k)},
\operatorname{finishReason}_r,
\operatorname{stopReason}_r,
\operatorname{logprobs}_r,
\ldots
\right)
]

[
\Delta s_r^{(k)}
================

\operatorname{IncrementalDetokenizer.update}
\left(
Y_r^{(k)}
\right)
]

[
s_r^{(k)}
=========

s_r^{(k-1)}
\Vert
\Delta s_r^{(k)}
]

[
\operatorname{StopStringDetected}
\left(
s_r^{(k)}
\right)
=1
\Longrightarrow
\operatorname{finishReason}_r
\leftarrow
\mathrm{STOP}
]

[
RO_r^{(k)}
==========

\operatorname{RequestOutput}
\left(
id_r^{ext},
\Delta s_r^{(k)},
Y_r^{(k)},
\operatorname{finishReason}_r,
\operatorname{logprobs}_r
\right)
]

[
RO_r^{(k)}
\xrightarrow{
\operatorname{RequestOutputCollector.put}
}
\mathcal Q_r^{out}
]

// 30. ASYNC GENERATE STREAM.

[
G_r
===

\operatorname{EngineClient.generate}
\left(
E_r,
\Sigma_r,
id_r
\right)
]

[
G_r
===

\left{
RO_r^{(1)},
RO_r^{(2)},
\ldots,
RO_r^{(T_r)}
\right}_{async}
]

[
RO_r^{(k)}
==========

\operatorname{await}
\left(
\mathcal Q_r^{out}
\right)
]

// 31. OPENAI-COMPATIBLE STREAMING RESPONSE.

[
C_r^{(k)}
=========

\operatorname{ChatCompletionStreamResponse}
\left(
id_r^{ext},
\Delta s_r^{(k)},
\operatorname{finishReason}_r,
\ldots
\right)
]

[
J_r^{(k)}
=========

\operatorname{JSONSerialize}
\left(
C_r^{(k)}
\right)
]

[
\boxed{
\operatorname{SSE}_r^{(k)}
==========================

\texttt{"data: "}
\Vert
J_r^{(k)}
\Vert
\texttt{"\textbackslash n\textbackslash n"}
}
]

[
\operatorname{stream}=1
\Longrightarrow
\operatorname{HTTPSBody}_r
==========================

\operatorname{SSE}_r^{(1)}
\Vert
\cdots
\Vert
\operatorname{SSE}_r^{(T_r)}
\Vert
\texttt{"data: [DONE]\textbackslash n\textbackslash n"}
]

// 32. NON-STREAMING RESPONSE.

[
\operatorname{stream}=0
\Longrightarrow
\mathcal O_r
============

\operatorname*{Aggregate}_{k=1}^{T_r}
RO_r^{(k)}
]

[
C_r
===

\operatorname{ChatCompletionResponse}
\left(
id_r^{ext},
s_r^{final},
O_r^{final},
\operatorname{finishReason}_r,
\operatorname{usage}_r
\right)
]

[
\boxed{
\mathrm{HTTPS}_r^{response}
===========================

\operatorname{HTTPSerialize}
\left(
C_r
\right)
}
]

// 33. COMPLETE SOURCE-EQUIVALENT STATE TRANSITION.

[
\boxed{
\begin{aligned}
&
{\mathrm{HTTPS}*r}
\
&\xrightarrow{\operatorname{validate/render/tokenize}}
{E_r}
\
&\xrightarrow{\operatorname{processInputs}}
{R_r^{core}}
\
&\xrightarrow{\operatorname{ZMQ}}
\mathcal W_0
\
&\xrightarrow{\operatorname{prefixCacheLookup}}
{C_r^{hit},KV_r^{hit}}
\
&\xrightarrow{\operatorname{Scheduler.schedule}}
\mathcal S_k
\
&\xrightarrow{\operatorname{KVAllocate}}
{KV_r^{new}}
\
&\xrightarrow{\operatorname{continuousPack}}
(X_k,Pos_k,BT_k,Slot_k)
\
&\xrightarrow{\operatorname{TP/PP/DP\ dispatch}}
M*{\Theta}
\
&\xrightarrow{\operatorname{forward}}
H_k
\
&\xrightarrow{M.\operatorname{compute_logits}}
Z_k
\
&\xrightarrow{\operatorname{grammar/bias/penalty/badword/temp/minp/topk/topp}}
\widetilde Z_k
\
&\xrightarrow{\operatorname{sample}}
Y_k
\
&\xrightarrow{\operatorname{Scheduler.updateFromOutput}}
(\mathcal W_{k+1},\mathcal R_{k+1},\mathcal K_{k+1})
\
&\xrightarrow{\operatorname{OutputProcessor}}
RO_k
\
&\xrightarrow{\operatorname{incrementalDetokenize}}
\Delta s_k
\
&\xrightarrow{\operatorname{OpenAIResponseSerialize}}
{\mathrm{SSE/HTTPS}_r}.
\end{aligned}
}
]

// 34. THE ENTIRE INFERENCE LOOP AS ONE RECURRENCE.

[
\boxed{
\begin{aligned}
\mathcal X_0
&=
\operatorname{Ingress}
\left(
{\mathrm{HTTPS}*r}
\right),
[1mm]
\mathcal S_k
&=
\operatorname{Schedule}
\left(
\mathcal X_k
\right),
[1mm]
\mathcal B_k
&=
\operatorname{Pack}
\left(
\mathcal S_k
\right),
[1mm]
(H_k,KV*{k+1})
&=
M_{\Theta}^{D\times P\times T}
\left(
\mathcal B_k,KV_k
\right),
[1mm]
Y_k
&=
\operatorname{Sample}
\left(
M.\operatorname{compute_logits}(H_k)
\right),
[1mm]
\mathcal X_{k+1}
&=
\operatorname{Reconcile}
\left(
\mathcal X_k,\mathcal S_k,Y_k,KV_{k+1}
\right),
[1mm]
\Delta O_k
&=
\operatorname{Emit}
\left(
\mathcal X_{k+1},Y_k
\right),
[1mm]
k
&\leftarrow k+1,
[1mm]
&
\qquad
\text{while }
\mathcal W_k\cup\mathcal R_k\neq\varnothing.
\end{aligned}
}
]

[
\boxed{
\operatorname{vLLMInference}
============================

\operatorname*{Fixpoint}*{k}
\left[
\operatorname{Ingress}
\rightarrow
\operatorname{Schedule}
\rightarrow
\operatorname{KVAllocate}
\rightarrow
\operatorname{Pack}
\rightarrow
M*{\Theta}
\rightarrow
\operatorname{Sample}
\rightarrow
\operatorname{Reconcile}
\rightarrow
\operatorname{Emit}
\right]
}
]

[1]: https://docs.vllm.ai/en/latest/design/arch_overview.html?utm_source=chatgpt.com "Architecture Overview - vLLM"
