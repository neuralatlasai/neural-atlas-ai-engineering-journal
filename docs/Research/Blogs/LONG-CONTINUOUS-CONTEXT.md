\[
\boxed{
\mathfrak{C}_{\text{continuous}}
=
\mathfrak{C}_{\text{model}}
\oplus
\mathfrak{C}_{\text{position}}
\oplus
\mathfrak{C}_{\text{training}}
\oplus
\mathfrak{C}_{\text{compression}}
\oplus
\mathfrak{C}_{\text{selection}}
\oplus
\mathfrak{C}_{\text{persistent-memory}}
\oplus
\mathfrak{C}_{KV}
\oplus
\mathfrak{C}_{\text{serving}}
\oplus
\mathfrak{C}_{\text{evaluation}}
}
\]

\[
\text{// All equations below are either [PRIMARY-EVIDENCE], [MATHEMATICALLY-DERIVED],}
\]

\[
\text{// or explicitly marked NOT-DISCLOSED where the primary source does not specify the operator.}
\]

---

\[
\boxed{\mathcal A_0:\;\text{LONG-CONTEXT STATE SPACE}}
\]

\[
X_{1:L}
=
(x_1,x_2,\ldots,x_L)
\]

\[
H^{(0)}
=
E(X_{1:L})
\in
\mathbb R^{L\times d}
\]

\[
\mathcal S_t
=
\left(
H_t,
KV_t,
C_t,
M_t,
\Pi_t,
\Sigma_t
\right)
\]

\[
\begin{aligned}
H_t &:= \text{active neural hidden state},\\
KV_t &:= \text{attention inference state},\\
C_t &:= \text{currently materialized context},\\
M_t &:= \text{persistent/external memory},\\
\Pi_t &:= \text{physical placement of state},\\
\Sigma_t &:= \text{serving/scheduling state}.
\end{aligned}
\]

\[
C_{\mathrm{nominal}}
=
\sup\{L:\mathcal M(X_{1:L})\text{ executes}\}
\]

\[
C_{\mathrm{effective}}(\mathcal T,\tau)
=
\sup
\left\{
L:
Q_{\mathcal T}(L)\ge\tau
\right\}
\]

\[
C_{\mathrm{economic}}
=
\sup
\left\{
L:
\begin{array}{l}
M_{\mathrm{HBM}}(L)\le B_M\\
TTFT(L)\le B_{\mathrm{TTFT}}\\
TPOT(L)\le B_{\mathrm{TPOT}}\\
\mathrm{Cost}(L)\le B_{\$}
\end{array}
\right\}
\]

\[
C_{\mathrm{persistent}}
=
\sup
\left\{
\Delta t:
\Pr[
\operatorname{Recover}(z_{t-\Delta t})
=
z_{t-\Delta t}
]
\ge\tau_p
\right\}
\]

\[
C_{\mathrm{continuous}}
=
\sup
\left\{
T:
\begin{array}{l}
\operatorname{Available}(z_{1:T})\\
\land\operatorname{SelectCorrectly}(z_{1:T})\\
\land\operatorname{UseCorrectly}(z_{1:T})\\
\land\operatorname{ResourceFeasible}(T)
\end{array}
\right\}.
\]

\[
\boxed{
C_{\mathrm{nominal}}
\not\Rightarrow
C_{\mathrm{effective}}
\not\Rightarrow
C_{\mathrm{continuous}}
}
\]

\[
\boxed{
C_{\mathrm{continuous}}
\Rightarrow
\{\text{retention}+\text{selection}+\text{reasoning}+\text{economics}\}
}
\]

\[
\text{// [CROSS-SOURCE-SYNTHESIS] RULER/HELMET/NoLiMa/Lost-in-the-Middle motivate the separations above.}
\]

---

# \(\boxed{\mathcal A_1:\text{ DENSE SELF-ATTENTION BASELINE}}\)

\[
Q^{(\ell)}=H^{(\ell)}W_Q^{(\ell)},\qquad
K^{(\ell)}=H^{(\ell)}W_K^{(\ell)},\qquad
V^{(\ell)}=H^{(\ell)}W_V^{(\ell)}
\]

\[
S^{(\ell)}
=
\frac{Q^{(\ell)}K^{(\ell)\top}}{\sqrt{d_h}}
+
M_{\mathrm{causal}}
\]

\[
A^{(\ell)}
=
\operatorname{softmax}(S^{(\ell)})
\]

\[
O^{(\ell)}
=
A^{(\ell)}V^{(\ell)}
\]

\[
H^{(\ell+1)}
=
\operatorname{FFN}
\left(
H^{(\ell)}
+
O^{(\ell)}
\right)
\]

\[
\boxed{
\mathcal C_{\mathrm{attn,prefill}}
=
\Theta(L^2d)
}
\]

\[
\boxed{
\mathcal M_{\mathrm{attention-matrix}}
=
\Theta(L^2)
}
\]

\[
\boxed{
\mathcal C_{\mathrm{decode}}(t)
=
\Theta(td_hh_q)
}
\]

\[
KV_t^{(\ell,h)}
=
\{
(k_1,v_1),\ldots,(k_t,v_t)
\}
\]

\[
M_{KV}
\simeq
2\,B\,L\,N_\ell\,h_{kv}\,d_h\,b.
\]

\[
\frac{\partial M_{KV}}{\partial L}
=
2BN_\ell h_{kv}d_hb
\]

\[
\boxed{
M_{KV}
=
\Theta(L)
,\qquad
\operatorname{HBMBytesRead}_{\mathrm{decode}}
=
\Theta(L)
}
\]

\[
\text{// FlashAttention changes memory materialization/I/O behavior; it does not change dense-attention's}
\]

\[
\text{// mathematical }QK^\top\text{ dependency from }L^2\text{ to subquadratic.}
\]

---

# \(\boxed{\mathcal A_2:\text{ POSITIONAL CONTEXT EXTENSION}}\)

\[
\theta_i
=
\beta^{-2i/d}
\]

\[
R(p,\theta_i)
=
\begin{bmatrix}
\cos(p\theta_i)&-\sin(p\theta_i)\\
\sin(p\theta_i)&\cos(p\theta_i)
\end{bmatrix}
\]

\[
q_{p,i}^{\mathrm{rope}}
=
R(p,\theta_i)q_{p,i}
\]

\[
k_{p,i}^{\mathrm{rope}}
=
R(p,\theta_i)k_{p,i}
\]

\[
\langle
q_{p,i}^{\mathrm{rope}},
k_{q,i}^{\mathrm{rope}}
\rangle
=
q_{p,i}^{\top}
R((q-p)\theta_i)
k_{q,i}
\]

\[
\boxed{
\theta_i
\mapsto
\theta'_i
=
\theta_i/\lambda_i
}
\]

\[
\Lambda
=
(\lambda_1,\lambda_2,\ldots,\lambda_{d/2})
\]

\[
\Lambda^\star
=
\arg\min_{\Lambda\in\mathcal P}
\mathcal F_{\mathrm{needle\text{-}PPL}}
(\Lambda;\mathcal D_{\mathrm{search}})
\]

\[
\mathcal P_{g+1}
=
\operatorname{Select}
\Big(
\mathcal P_g
\cup
\operatorname{Mutation}(\mathcal P_g)
\cup
\operatorname{Crossover}(\mathcal P_g)
\Big)
\]

\[
\theta'
=
\operatorname{RoPE}(\Lambda^\star).
\]

\[
\text{// [PRIMARY-EVIDENCE: LongRoPE2] evolutionary search is guided by needle-driven perplexity;}
\]

\[
\text{// exact search implementation/hyperparameters are configuration-dependent rather than a universal formula.}
\]

\[
\mathcal D_{\mathrm{mix}}
=
\alpha\mathcal D_{\mathrm{short}}
+
(1-\alpha)\mathcal D_{\mathrm{long}}
\]

\[
\mathcal L_{\mathrm{LongRoPE2}}
=
\alpha
\mathbb E_{X\sim\mathcal D_{\mathrm{short}}}
[-\log P_\theta(X;\operatorname{RoPE})]
+
(1-\alpha)
\mathbb E_{X\sim\mathcal D_{\mathrm{long}}}
[-\log P_\theta(X;\operatorname{RoPE}_{\Lambda^\star})].
\]

\[
\boxed{
\theta^\star
=
\arg\min_\theta\mathcal L_{\mathrm{LongRoPE2}}
}
\]

\[
\boxed{
\text{position extension}
\;\not\Rightarrow\;
\text{attention-compute reduction}
}
\]

\[
\boxed{
C_{\mathrm{nominal}}\uparrow,\;
C_{\mathrm{effective}}\uparrow
\quad\not\Rightarrow\quad
M_{KV}\downarrow
}
\] :chatgpt-content-reference{index="0"}


---

# \(\boxed{\mathcal A_3:\text{ EXPLICIT MILLION-TOKEN TRAINING}}\)

\[
\theta_0
=
\theta_{\mathrm{aligned},128K}
\]

\[
L_0=128K
\]

\[
L_1=1M,\qquad
L_2=2M,\qquad
L_3=4M
\]

\[
\theta_{j+1}
=
\arg\min_\theta
\mathbb E_{
X\sim
\mathcal D^{(j)}_{\mathrm{long}}
}
\left[
-\sum_{t=1}^{|X|}
\log
P_\theta(x_t|x_{<t})
\right]
\]

\[
|X|
\lesssim
L_{j+1}
\]

\[
\theta_{\mathrm{LC}}
=
\theta_3.
\]

\[
\mathcal L_{\mathrm{instruction}}
=
-
\mathbb E_{(X,Y)\sim\mathcal D_{\mathrm{IT}}}
\sum_{t=1}^{|Y|}
\log
P_{\theta_{\mathrm{LC}}}
(y_t|X,y_{<t})
\]

\[
\theta_{\mathrm{UltraLong}}
=
\arg\min_\theta
\mathcal L_{\mathrm{instruction}}.
\]

\[
\boxed{
128K
\rightarrow
1M
\rightarrow
2M
\rightarrow
4M
}
\]

\[
\text{// [PRIMARY-EVIDENCE: UltraLong-8B] continued pretraining + long-context data composition}
\]

\[
\text{// + instruction tuning preserves short-context capability.}
\]

\[
\boxed{
L_{\mathrm{train}}\uparrow
\Rightarrow
C_{\mathrm{effective}}\uparrow
\quad\text{but}\quad
\mathcal C_{\mathrm{dense}}\sim L^2,\;
M_{KV}\sim L
}
\] :chatgpt-content-reference{index="1"}


---

# \(\boxed{\mathcal A_4:\text{ NATIVE SPARSE ATTENTION — NSA}}\)

\[
X=(x_1,\ldots,x_L)
\]

\[
Q=XW_Q,\qquad
K=XW_K,\qquad
V=XW_V
\]

\[
\boxed{
O_t^{NSA}
=
g_t^{cmp}\odot O_t^{cmp}
+
g_t^{slc}\odot O_t^{slc}
+
g_t^{swa}\odot O_t^{swa}
}
\]

\[
g_t^{(\cdot)}
=
\sigma(W_g^{(\cdot)}x_t)
\]

## \(\mathcal A_{4.1}\) Compression branch

\[
B_j
=
\{j\delta,\ldots,j\delta+l-1\}
\]

\[
\tilde k_j,\tilde v_j
=
\operatorname{Compress}_\phi
\left(
\{
(k_i,v_i,p_i):i\in B_j
\}
\right)
\]

\[
\tilde K
=
(\tilde k_1,\ldots,\tilde k_m)
\]

\[
\tilde V
=
(\tilde v_1,\ldots,\tilde v_m)
\]

\[
m
\simeq
L/\delta
\]

\[
A_t^{cmp}
=
\operatorname{softmax}
\left(
\frac{q_t\tilde K^\top}{\sqrt{d_h}}
+
M_t^{cmp}
\right)
\]

\[
O_t^{cmp}
=
A_t^{cmp}\tilde V.
\]

## \(\mathcal A_{4.2}\) Fine-grained selection branch

\[
r_{t,j}
=
\operatorname{Aggregate}
\left(
A_t^{cmp},
B_j
\right)
\]

\[
\mathcal J_t
=
\operatorname{TopK}
\left(
\{r_{t,j}\}_{j=1}^{m},
K
\right)
\]

\[
\Omega_t
=
\bigcup_{j\in\mathcal J_t}B_j
\]

\[
A_{t,i}^{slc}
=
\frac{
\exp(q_t^\top k_i/\sqrt{d_h})
}{
\sum_{u\in\Omega_t}
\exp(q_t^\top k_u/\sqrt{d_h})
},
\qquad
i\in\Omega_t
\]

\[
O_t^{slc}
=
\sum_{i\in\Omega_t}
A_{t,i}^{slc}v_i.
\]

## \(\mathcal A_{4.3}\) Sliding-window branch

\[
\mathcal W_t
=
\{\max(1,t-W+1),\ldots,t\}
\]

\[
O_t^{swa}
=
\operatorname{Attention}
(q_t,K_{\mathcal W_t},V_{\mathcal W_t}).
\]

## \(\mathcal A_{4.4}\) Effective active set

\[
L_{\mathrm{active}}
\approx
|\Omega_t|
+
W
\]

\[
|\Omega_t|
\simeq
K\,l
\]

\[
\mathcal C_{\mathrm{sparse\;attention}}
\approx
O
\left(
L(Kl+W)
\right)
+
\mathcal C_{\mathrm{selection}}.
\]

\[
\boxed{
\mathcal C_{\mathrm{selection}}
\neq0
}
\]

\[
\boxed{
\text{sparse mathematical graph}
\not\Rightarrow
\text{sparse wall-clock execution}
}
\]

\[
\text{// [PRIMARY-EVIDENCE] NSA explicitly combines compressed global context, selected fine context,}
\]

\[
\text{// and local sliding attention and trains the architecture natively rather than post-hoc sparsifying it.}
\] :chatgpt-content-reference{index="2"}


---

# \(\boxed{\mathcal A_5:\text{ HIERARCHICAL SPARSE ATTENTION — HSA}}\)

\[
H
=
(h_1,\ldots,h_n)
\in
\mathbb R^{n\times d}
\]

\[
S
=
\text{chunk size}
\]

\[
H_{[i]}
=
H_{iS:(i+1)S}
\in
\mathbb R^{S\times d}
\]

\[
K_{[i]},V_{[i]}
\in
\mathbb R^{S\times h\times d_h}
\]

\[
L_i\in\mathbb R^d
\]

\[
Q^{slc}
=
W^{slc}H
\]

\[
Q^{attn}
=
W^{attn}H.
\]

## \(\mathcal A_{5.1}\) Learnable chunk retrieval

\[
s_{t,i}
=
\begin{cases}
\frac{
(Q_t^{slc})^\top L_i
}{
\sqrt d
},
&
i\le
\left\lfloor t/S\right\rfloor
\\[4pt]
-\infty,
&
i>
\left\lfloor t/S\right\rfloor.
\end{cases}
\]

\[
\mathcal I_t
=
\left\{
i:
\operatorname{rank}_{\downarrow}(s_{t,i})<K
\right\}.
\]

## \(\mathcal A_{5.2}\) Separate intra-chunk attention

\[
\bar O_{t,i}
=
\operatorname{softmax}
\left(
\frac{
\operatorname{norm}(Q_t^{attn})
\operatorname{norm}(K_{[i]}^\top)
}{
\sqrt{d_h}
}
\right)
V_{[i]}
\]

\[
i\in\mathcal I_t.
\]

## \(\mathcal A_{5.3}\) Retrieval-weighted fusion

\[
w_{t,i}
=
\frac{
e^{s_{t,i}}
}{
\sum_{k\in\mathcal I_t}e^{s_{t,k}}
}
\]

\[
\boxed{
O_t^{HSA}
=
\sum_{k\in\mathcal I_t}
w_{t,k}
\bar O_{t,k}
}
\]

\[
\frac{\partial\mathcal L}{\partial s_{t,k}}
\neq0
\]

\[
\boxed{
\text{retrieval score}
\longleftrightarrow
\text{next-token loss}
}
\]

\[
\text{// Exact source equations (1)-(2): chunk retrieval is trained through retrieval-score-weighted fusion.}
\] :chatgpt-content-reference{index="3"}


## \(\mathcal A_{5.4}\) HSA-UltraLong local/global decomposition

\[
H^{0}
\overset{\mathrm{SWA}}{\longrightarrow}
H^{1}
\overset{\mathrm{SWA}}{\longrightarrow}
\cdots
\overset{\mathrm{HSA+SWA}}{\longrightarrow}
H^{L}
\]

\[
\operatorname{PosEncoding}_{local}
=
\operatorname{RoPE}
\]

\[
\operatorname{PosEncoding}_{HSA}
=
\operatorname{NoPE}.
\]

\[
\boxed{
\text{local access}
=
\mathrm{SWA}
}
\]

\[
\boxed{
\text{global access}
=
\mathrm{HSA}
}
\]

\[
\boxed{
\text{length generalization}
\approx
\mathrm{chunkwise\ attention}
+
\mathrm{retrieval\ score\ fusion}
+
\mathrm{NoPE}
}
\]

\[
\text{// [PRIMARY-EVIDENCE] Authors report all three components as necessary in their ablations.}
\]

\[
\boxed{
L_{\mathrm{pretrain}}\approx8K,
\quad
L_{\mathrm{midtrain}}\approx32K,
\quad
L_{\mathrm{evaluation}}\le16M
}
\]

\[
\text{// 16M evidence is primarily retrieval-style; this equation MUST NOT be interpreted as 16M general reasoning.}
\] :chatgpt-content-reference{index="4"}


---

# \(\boxed{\mathcal A_6:\text{ ELASTIC THRESHOLD ATTENTION — ETA}}\)

\[
q_t^{(\ell,h)}
\in
\mathbb R^{d_h}
\]

\[
\tau_t^{(\ell,h)}
=
f_\phi^{(\ell,h)}
\left(
q_t^{(\ell,h)}
\right)
\]

\[
s_{t,j}^{(\ell,h)}
=
\frac{
q_t^{(\ell,h)\top}k_j^{(\ell,h)}
}{
\sqrt{d_h}
}.
\]

## Training

\[
\tilde s_{t,j}
=
\mathcal G
\left(
s_{t,j},
\tau_t
\right)
\]

\[
\mathcal G(s,\tau)
\approx
\begin{cases}
s,&s\gtrsim\tau\\
\text{multiplicatively suppressed toward uniform-attention floor},
&s<\tau
\end{cases}
\]

\[
\text{// Exact smooth suppression function: NOT-DISCLOSED in the primary abstract retrieved here;}
\]

\[
\text{// do not replace it with an invented sigmoid formula.}
\]

\[
A_{t,j}
=
\operatorname{softmax}_j(\tilde s_{t,j})
\]

\[
\mathcal L
=
-\sum_t\log P_\theta(x_t|x_{<t}).
\]

## Inference

For KV block \(B_j\):

\[
U(q_t,B_j)
\ge
\max_{i\in B_j}
q_t^\top k_i
\]

\[
\mathcal B_t
=
\left\{
B_j:
U(q_t,B_j)\ge\tau_t
\right\}
\]

\[
O_t
=
\operatorname{Attention}
\left(
q_t,
K_{\cup\mathcal B_t},
V_{\cup\mathcal B_t}
\right).
\]

\[
\boxed{
U(q,B)<\tau
\Rightarrow
B\;\text{is safely screened from the ETA sparse-kernel candidate set}
}
\]

\[
\mathcal C_{\mathrm{screen}}
=
O(1)
\quad
\text{per cached block-bound test, as reported by the authors.}
\]

\[
\text{// [PRIMARY-EVIDENCE] reported training sparsity }\approx85\%
\]

\[
\text{// reported active decode density }\approx38\%
\]

\[
\text{// evaluated through 512K sequences; custom Triton sparse-decode kernel.}
\] :chatgpt-content-reference{index="5"}


---

# \(\boxed{\mathcal A_7:\text{ GENERIC CONTEXT COMPRESSION}}\)

\[
C_t
=
(x_1,\ldots,x_t)
\]

\[
\mathcal C_\phi:
X_{a:b}
\mapsto
Z_{a:b}
\]

\[
|Z_{a:b}|
<
|X_{a:b}|
\]

\[
\rho_{\mathrm{comp}}
=
\frac{|Z_{a:b}|}{|X_{a:b}|}
\]

\[
\mathrm{CR}
=
\frac{|X_{a:b}|}{|Z_{a:b}|}.
\]

\[
\mathcal I_{\mathrm{lost}}
=
I(X_{a:b};Y_{\mathrm{future}})
-
I(Z_{a:b};Y_{\mathrm{future}})
\]

\[
\boxed{
\mathcal I_{\mathrm{lost}}
\ge0
}
\]

\[
\boxed{
\mathcal I_{\mathrm{lost}}=0
\quad\text{must not be assumed}
}
\]

\[
\text{// No finite semantic compressor is demonstrated as universally lossless for arbitrary future queries.}
\]

---

# \(\boxed{\mathcal A_8:\text{ QUERY-CONDITIONED COMPRESSION}}\)

\[
r_i(q)
=
\operatorname{Rel}(x_i,q)
\]

\[
\mathcal H_{\mathrm{high}}
=
\{i:r_i(q)\ge\tau_h\}
\]

\[
\mathcal H_{\mathrm{mid}}
=
\{i:\tau_l<r_i(q)<\tau_h\}
\]

\[
\mathcal H_{\mathrm{low}}
=
\{i:r_i(q)\le\tau_l\}.
\]

\[
C'
=
X_{\mathcal H_{\mathrm{high}}}
\oplus
\operatorname{Compress}_{m}
(X_{\mathcal H_{\mathrm{mid}}})
\oplus
\operatorname{Compress}_{a}
(X_{\mathcal H_{\mathrm{low}}})
\]

\[
m<a
\quad\text{in compression aggressiveness.}
\]

\[
\boxed{
r_i\uparrow
\Rightarrow
\text{retention fidelity}_i\uparrow
}
\]

\[
\text{// Research-family equation: relevance-adaptive/context-aware compression.}
\]

---

# \(\boxed{\mathcal A_9:\text{ MEMENTO SELF-COMPRESSION}}\)

\[
R
=
P
\oplus
T_1
\oplus
M_1
\oplus
T_2
\oplus
M_2
\oplus\cdots
\oplus
T_n
\oplus
M_n
\oplus
A
\]

where

\[
T_i
=
\text{reasoning/thinking block}
\]

\[
M_i
=
\operatorname{Memento}_\theta(T_i).
\]

## \(\mathcal A_{9.1}\) Stage-1 attention

\[
\mathcal V_j^{(1)}
=
\{1,\ldots,j\}
\]

\[
A_{ji}^{(1)}
=
0
\iff
i>j.
\]

\[
\mathcal L_{\mathrm{SFT},1}
=
-\sum_{j\in\mathrm{completion}}
\log P_\theta(x_j|x_{<j}).
\]

## \(\mathcal A_{9.2}\) Memento masking

For a completed pair \((T_i,M_i)\):

\[
j>\operatorname{end}(M_i)
\Rightarrow
T_i\notin\mathcal V_j
\]

while

\[
M_i\in\mathcal V_j.
\]

Thus

\[
\boxed{
\mathcal V_j
=
P
\cup
\left(
\bigcup_{r<i}M_r
\right)
\cup
T_i
\cup
M_i
\quad
\text{while }M_i\text{ is being generated}
}
\]

and after completion,

\[
\boxed{
\mathcal V_j
=
P
\cup
\left(
\bigcup_{r\le i}M_r
\right)
\cup
T_{i+1:\mathrm{current}}
}
\]

\[
T_{1:i}
\notin
\mathcal V_j.
\]

\[
\mathcal L_{\mathrm{SFT},2}
=
-\sum_j
\log
P_\theta
\left(
x_j|
X_{\mathcal V_j}
\right).
\]

\[
\text{// Stage 1 learns block→memento format under full attention.}
\]

\[
\text{// Stage 2 uses the same token-level training objective but changes the attention mask.}
\] :chatgpt-content-reference{index="6"}


## \(\mathcal A_{9.3}\) Dual information channel

During generation of \(M_i\):

\[
KV(M_i)
=
F_\theta
\left(
P,M_{<i},T_i,M_i
\right).
\]

After \(T_i\) is masked:

\[
\boxed{
\text{future information}
=
I(M_i^{text})
+
I(KV(M_i);T_i)
}
\]

Restart ablation:

\[
KV_{\mathrm{restart}}(M_i)
=
F_\theta
(P,M_{\le i})
\]

\[
I(KV_{\mathrm{restart}}(M_i);T_i)
<
I(KV_{\mathrm{normal}}(M_i);T_i).
\]

Reported ablation:

\[
66.1\%-50.8\%
=
15.3\;\mathrm{percentage\ points}.
\]

\[
\boxed{
M_i^{text}
\not\equiv
KV(M_i)
}
\]

\[
\boxed{
\text{semantic summary}
\neq
\text{complete hidden-state replacement}
}
\] :chatgpt-content-reference{index="7"}


---

# \(\boxed{\mathcal A_{10}:\text{ RETRIEVAL / CONTEXT SELECTION}}\)

\[
M
=
\{m_1,\ldots,m_N\}
\]

\[
e_q
=
f_q(q)
\]

\[
e_i
=
f_m(m_i)
\]

\[
s_i
=
\operatorname{sim}(e_q,e_i).
\]

\[
\mathcal R_K(q)
=
\operatorname{TopK}_{m_i\in M}
s_i
\]

\[
C_q
=
C_{\mathrm{working}}
\oplus
\mathcal R_K(q).
\]

Three non-equivalent events:

\[
A
=
\{
m^\star\in M
\}
\]

\[
S
=
\{
m^\star\in\mathcal R_K(q)
\}
\]

\[
U
=
\{
\mathcal M
\text{ correctly uses }m^\star
\}.
\]

\[
\boxed{
P(U)
=
P(A)\,
P(S|A)\,
P(U|S,A)
}
\]

\[
\boxed{
A\not\Rightarrow S
}
\]

\[
\boxed{
S\not\Rightarrow U
}
\]

\[
\boxed{
\text{storage}
\neq
\text{retrieval}
\neq
\text{reasoning/use}
}
\]

---

# \(\boxed{\mathcal A_{11}:\text{ MEMORY-R1}}\)

## Memory state

\[
M_t
=
\{m_1,\ldots,m_{N_t}\}
\]

\[
x_t
=
\text{new extracted information}
\]

\[
o_t
\in
\{
\mathrm{ADD},
\mathrm{UPDATE},
\mathrm{DELETE},
\mathrm{NOOP}
\}.
\]

\[
\boxed{
(o_t,m'_t)
\sim
\pi_\theta
(
\cdot|x_t,M_t
)
}
\]

\[
M_{t+1}
=
\Phi(M_t,o_t,m'_t).
\] :chatgpt-content-reference{index="8"}


## Memory-manager PPO

\[
\rho_\theta
=
\frac{
\pi_\theta(o,m'|x,M_{\mathrm{old}})
}{
\pi_{\mathrm{old}}(o,m'|x,M_{\mathrm{old}})
}
\]

\[
\boxed{
J_{\mathrm{PPO}}(\theta)
=
\mathbb E
\left[
\min
\left(
\rho_\theta A,
\operatorname{clip}
(
\rho_\theta,
1-\epsilon,
1+\epsilon
)
A
\right)
\right]
}
\]

\[
R_{\mathrm{answer}}
=
EM(y_{\mathrm{pred}},y_{\mathrm{gold}}).
\]

## Memory-manager GRPO

For

\[
\{(o_i,m_i')\}_{i=1}^{G}
\sim
\pi_\theta(\cdot|s)
\]

and rewards

\[
r=(r_1,\ldots,r_G)
\]

\[
A_i
=
\frac{
r_i-\operatorname{mean}(r)
}{
\operatorname{std}(r)
}.
\]

\[
\boxed{
J_{\mathrm{GRPO}}
=
\mathbb E
\left[
\frac1G
\sum_{i=1}^{G}
\rho_\theta^{(i)}A_i
-
\beta
D_{KL}
(\pi_\theta\Vert\pi_{\mathrm{ref}})
\right]
}
\] :chatgpt-content-reference{index="9"}


## Answer agent

\[
M_{\mathrm{ret}}
=
\operatorname{Retrieve}_{K}(q,M)
\]

\[
\tilde M_{\mathrm{ret}}
=
\operatorname{Distill}_\psi
(q,M_{\mathrm{ret}})
\]

\[
y
\sim
\pi_\phi
(
\cdot|
q,\tilde M_{\mathrm{ret}}
).
\]

\[
\rho_\phi
=
\frac{
\pi_\phi(y|q,M_{\mathrm{ret}})
}{
\pi_{\mathrm{old}}(y|q,M_{\mathrm{ret}})
}
\]

\[
R
=
EM(y,y_{\mathrm{gold}}).
\]

\[
\boxed{
\text{memory-manager quality}
\rightarrow
\text{retrieved-memory quality}
\rightarrow
\text{answer-agent quality}
}
\] :chatgpt-content-reference{index="10"}


---

# \(\boxed{\mathcal A_{12}:\text{ AGEMEM — UNIFIED STM/LTM CONTROL}}\)

\[
s_t
=
(C_t,M_t,\mathcal T)
\]

\[
\mathcal T
=
(q,I_q,A_q)
\quad
\text{during training}
\]

\[
a_t
\sim
\pi_\theta(a_t|s_t).
\]

Action space:

\[
\mathcal A
=
\mathcal A_{\mathrm{language}}
\cup
\mathcal A_{\mathrm{LTM}}
\cup
\mathcal A_{\mathrm{STM}}
\]

\[
\mathcal A_{\mathrm{LTM}}
=
\{
ADD,UPDATE,DELETE
\}
\]

\[
\mathcal A_{\mathrm{STM}}
=
\{
RETRIEVE,SUMMARY,FILTER
\}.
\] :chatgpt-content-reference{index="11"}


## Long-term state transitions

\[
M_{t+1}
=
\begin{cases}
M_t\cup\{m\},
&a_t=ADD\\
(M_t\setminus\{m_i\})\cup\{m_i'\},
&a_t=UPDATE\\
M_t\setminus\{m_i\},
&a_t=DELETE\\
M_t,
&\text{otherwise}.
\end{cases}
\]

## Short-term state transitions

\[
C_{t+1}
=
\begin{cases}
C_t\oplus
\operatorname{TopKRetrieve}(q,M_t),
&a_t=RETRIEVE\\[3pt]
(C_t\setminus S)
\oplus
\operatorname{Summary}(S),
&a_t=SUMMARY\\[3pt]
\{c_i\in C_t:\operatorname{Rel}(c_i,q)\ge\theta_f\},
&a_t=FILTER.
\end{cases}
\]

## Unified trajectory

\[
\tau
=
(s_1,a_1,\ldots,s_T,a_T)
\]

\[
R(\tau)
=
\sum_iw_iR_i(\tau)
+
P_{\mathrm{penalty}}(\tau).
\]

\[
\boxed{
\theta^\star
=
\arg\max_\theta
\mathbb E_{\tau\sim\pi_\theta}[R(\tau)]
}
\] :chatgpt-content-reference{index="12"}


## Three-stage trajectory

\[
\tau_k^{(q)}
=
\left(
\tau_k^{(1)},
\tau_k^{(2)},
\tau_k^{(3)}
\right)
\]

\[
T=T_1+T_2+T_3.
\]

\[
\boxed{
\tau^{(1)}
=
\text{information acquisition + LTM construction}
}
\]

\[
\boxed{
C_{T_1}
\rightarrow
\varnothing,
\qquad
M_{T_1}
\rightarrow
M_{T_1}
}
\]

\[
\boxed{
\tau^{(2)}
=
\text{STM control under distractors}
}
\]

\[
\boxed{
\tau^{(3)}
=
\text{task execution + memory coordination}
}
\] :chatgpt-content-reference{index="13"}


## Step-wise GRPO credit propagation

For task \(q\),

\[
G_q
=
\{
\tau_1^{(q)},
\dots,
\tau_K^{(q)}
\}
\]

\[
r_T^{(k,q)}
=
R
\left(
\tau_k^{(q)}
\right)
\]

\[
A_T^{(k,q)}
=
\frac{
r_T^{(k,q)}
-
\mu_{G_q}
}{
\sigma_{G_q}+\epsilon
}.
\]

\[
\boxed{
A_t^{(k,q)}
=
A_T^{(k,q)},
\quad
\forall t\in[1,T]
}
\]

\[
\rho_t^{(k,q)}
=
\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
}.
\]

\[
\boxed{
J(\theta)
=
\frac1{|\mathcal E|}
\sum_{q,k,t}
\left[
\rho_t^{(k,q)}
A_t^{(k,q)}
-
\beta
D_{KL}^{(k,q)}
\right]
}
\]

\[
R(\tau)
=
w_{\mathrm{task}}R_{\mathrm{task}}
+
w_{\mathrm{context}}R_{\mathrm{context}}
+
w_{\mathrm{memory}}R_{\mathrm{memory}}
+
P_{\mathrm{penalty}}.
\]

\[
\boxed{
\text{early memory decision}
\xleftarrow{\;\text{credit}\;}
\text{late task outcome}
}
\] :chatgpt-content-reference{index="14"}


---

# \(\boxed{\mathcal A_{13}:\text{ STATE-CONDITIONED COMPRESSION — STATECOMP}}\)

Historical interactions:

\[
H_k
=
(S_1,\ldots,S_{N_k})
\]

Current state:

\[
q_k
\]

Reference label:

\[
y_{i,k}
\in
\{0,1\}
=
\{\mathrm{KEEP},\mathrm{READY}\}.
\]

## \(\mathcal A_{13.1}\) Annotation boundary

\[
e_{i,k}
=
\mathbb I[
\text{supporting prefix evidence exists}
]
\]

\[
v_{i,k}
=
\mathbb I[
\text{future dependency veto exists}
]
\]

\[
\boxed{
b_{i,k}=1
\Rightarrow
e_{i,k}=1
\land
v_{i,k}=0
}
\]

\[
t_i^\star
=
\min
\{
k:
b_{i,k}=1
\text{ and boundary survives review}
\}.
\]

\[
y_{i,k}
=
\mathbb I[k\ge t_i^\star]
\]

\[
t_i^\star
\in
\{i+1,\ldots,T\}
\cup
\{\infty\}.
\] :chatgpt-content-reference{index="15"}


## \(\mathcal A_{13.2}\) Bounded representation

\[
V_{i,k}
=
\mathcal B_M
(S_i,H_k;K_{\mathrm{ctx}})
\]

\[
|V_{i,k}|
\le M
\]

\[
\tilde h_{i,k}
=
F_\phi(V_{i,k})_{|V_{i,k}|}.
\]

Reported bounded configuration:

\[
M
=
4096+1024
=
5120.
\]

\[
z_{i,k}
=
g_\theta
(
\tilde h_{i,k},
q_k,
r_{i,k}
)
\]

\[
p_{i,k}
=
\sigma(z_{i,k}).
\]

\[
\hat y_{i,k}
=
\mathbb I[p_{i,k}\ge\tau].
\] :chatgpt-content-reference{index="16"}


## Computational distinction

\[
C_{\mathrm{full}}(k)
=
F(L_k)
+
O(N_kc_g)
\]

\[
C_{\mathrm{bounded}}(k)
\le
N_kF(M)
+
O(N_kc_g).
\]

For dense representation model:

\[
F(n)
=
O
\left(
L_{\mathrm{layers}}
(nd^2+n^2d)
\right).
\]

\[
C_{\mathrm{trajectory}}
\le
\sum_k
N_kF(M)
+
\sum_kO(N_kc_g).
\]

\[
\boxed{
|V_{i,k}|=O(1)
\not\Rightarrow
C_{\mathrm{checkpoint}}=O(1)
}
\]

\[
\text{// Every surviving target may still require evaluation.}
\] :chatgpt-content-reference{index="17"}


## \(\mathcal A_{13.3}\) Span formation

\[
\mathcal R_k
=
\{
i:p_{i,k}\ge\tau
\}.
\]

\[
\mathcal B_k
=
\operatorname{MaximalContiguousSpans}
(\mathcal R_k).
\]

For candidate span

\[
B=[s,e]:
\]

\[
\boxed{
\min_{i\in B}p_{i,k}\ge\tau
}
\]

\[
\boxed{
|B|>\kappa
}
\]

\[
\boxed{
\operatorname{Tokens}(B)\ge B_{\min}
}
\]

Reported operating values:

\[
\tau=0.60,\qquad
\kappa=3,\qquad
B_{\min}=1000.
\]

\[
S_B
=
\operatorname{Summarize}(H_k[B]).
\]

Commit:

\[
H_{k+1}
=
\begin{cases}
H_k[<s]
\oplus S_B\oplus
H_k[>e],
&
|S_B|<|H_k[B]|
\\
H_k,
&\text{otherwise}.
\end{cases}
\]

\[
\boxed{
H_{k+1}
\neq H_k
\Rightarrow
\{p_{i,k+1}\}
\text{ are recomputed}
}
\]

\[
\boxed{
\text{compression}
=
\text{closed-loop state transition}
}
\] :chatgpt-content-reference{index="18"}


---

# \(\boxed{\mathcal A_{14}:\text{ KV QUANTIZATION}}\)

For tensor \(X\):

\[
x_{\min}
=
\min_i x_i,\qquad
x_{\max}
=
\max_i x_i
\]

\[
s
=
\frac{x_{\max}-x_{\min}}
{2^b-1}
\]

\[
z
=
\operatorname{round}
\left(
-\frac{x_{\min}}s
\right)
\]

\[
q_i
=
\operatorname{clip}
\left(
\operatorname{round}
(x_i/s)+z,
0,
2^b-1
\right)
\]

\[
\hat x_i
=
s(q_i-z).
\]

Hence

\[
KV^{FP}
\mapsto
Q_b(KV)
\]

\[
M_{KV}^{(b)}
\approx
\frac{b}{b_{\mathrm{FP}}}
M_{KV}^{FP}.
\]

\[
\Delta_{\mathrm{quant}}
=
\|KV-\widehat{KV}\|.
\]

\[
\boxed{
b\downarrow
\Rightarrow
M_{KV}\downarrow
\quad\land\quad
\Delta_{\mathrm{quant}}\;\text{generally}\uparrow
}
\]

\[
\text{// Generic quantization-family mathematical form; exact KIVI/KVQuant granularity differs by method.}
\]

---

# \(\boxed{\mathcal A_{15}:\text{ STATIC KV EVICTION}}\)

Attention mass accumulated by historical token \(i\):

\[
u_i^{(t)}
=
\sum_{\tau=i}^{t}
A_{\tau,i}.
\]

Retention:

\[
\mathcal K_t
=
\operatorname{TopK}
(
\{u_i^{(t)}\}
)
\cup
\mathcal R_t
\cup
\mathcal S.
\]

where

\[
\mathcal R_t
=
\text{recent tokens}
\]

\[
\mathcal S
=
\text{special/sink tokens}.
\]

Eviction:

\[
KV_t'
=
\{
KV_i:i\in\mathcal K_t
\}.
\]

\[
\boxed{
i\notin\mathcal K_t
\Rightarrow
KV_i
\text{ permanently unavailable}
}
\]

for irreversible eviction.

\[
\boxed{
\text{importance at }t
\not\Rightarrow
\text{importance at }t+\Delta
}
\]

\[
\text{// This is the failure condition motivating dynamic retrieval/offload designs.}
\] :chatgpt-content-reference{index="19"}


---

# \(\boxed{\mathcal A_{16}:\text{ FLEXICACHE}}\)

For layer \(\ell\), KV head \(h\), step \(s\):

\[
S_{\ell,h}^{(s)}
=
\operatorname{TopKPages}
(
\ell,h,s
)
\]

\[
|S_{\ell,h}^{(s)}|
=
K.
\]

## Random-corrected overlap

\[
\boxed{
RCO_{\ell,h}(s,t)
=
\max
\left[
0,
\frac{
\frac{
|S_{\ell,h}^{(s)}
\cap
S_{\ell,h}^{(t)}|
}{K}
-
\frac{K}{N_t}
}{
1-\frac{K}{N_t}
}
\right]
}
\]

\[
TS_{\ell,h}(s)
=
\frac1{W-1}
\sum_{t=s+1}^{s+W-1}
RCO_{\ell,h}(s,t).
\]

\[
h\in\mathcal H_{\mathrm{unstable}}
\iff
h\in
\operatorname{BottomQuartile}
(TS)
\]

\[
\mathcal H_{\mathrm{stable}}
=
\mathcal H
\setminus
\mathcal H_{\mathrm{unstable}}.
\] :chatgpt-content-reference{index="20"}


## Page score

For page \(p\),

\[
k_{p,j}^{\min}
=
\min_{i\in p}k_{i,j}
\]

\[
k_{p,j}^{\max}
=
\max_{i\in p}k_{i,j}.
\]

\[
\boxed{
s_p(q)
=
\sum_j
\max
\left(
q_jk_{p,j}^{\min},
q_jk_{p,j}^{\max}
\right)
}
\]

\[
\mathcal P_{h,t}
=
\operatorname{TopK}_{p}
s_p(q_t).
\] :chatgpt-content-reference{index="21"}


## Placement rule

\[
h\in\mathcal H_{\mathrm{unstable}}
\Rightarrow
KV_h^{GPU}
=
KV_h^{full}.
\]

\[
h\in\mathcal H_{\mathrm{stable}}
\Rightarrow
\begin{cases}
KV_h^{GPU}
=
KV_h[\mathcal P_{h,t}]\\
KV_h^{host}
=
KV_h^{full}.
\end{cases}
\]

Reranking:

\[
f_h
=
\begin{cases}
1,
&h\in\mathcal H_{\mathrm{unstable}}\\
16,
&h\in\mathcal H_{\mathrm{stable}}
\quad\text{in reported implementation}.
\end{cases}
\]

Newly promoted pages:

\[
\Delta\mathcal P_t^+
=
\mathcal P_t
\setminus
\mathcal P_{t-f_h}.
\]

\[
\operatorname{H2DTransfer}_t
=
KV[
\Delta\mathcal P_t^+
].
\]

\[
\boxed{
\text{full historical KV remains recoverable from host memory for stable heads}
}
\]

\[
\boxed{
\text{GPU resident KV}
\neq
\text{total retained KV}
}
\] :chatgpt-content-reference{index="22"}


---

# \(\boxed{\mathcal A_{17}:\text{ HETEROCACHE}}\)

Top-\(k\) attention indices:

\[
K(X)
=
\operatorname{TopKIndices}(X,k).
\]

Overlap coefficient:

\[
\boxed{
O(K(X),K(Y))
=
\frac{
|K(X)\cap K(Y)|
}{
\min(|K(X)|,|K(Y)|)
}
}
\] :chatgpt-content-reference{index="23"}


## Stability score

\[
S_{\mathrm{stable}}^{(h)}
=
\operatorname{Median}_{t=1:T}
O
\left(
K_t^{(h)},
K_{\mathrm{prefill}}^{(h)}
\right).
\]

## Similarity score

\[
\boxed{
S_{\mathrm{sim}}^{(h)}
=
\operatorname{Median}_{t=1:T}
\left[
\max_{h'\in\ell,\;h'\neq h}
O
\left(
K_t^{(h)},
K_t^{(h')}
\right)
\right]
}
\] :chatgpt-content-reference{index="24"}


## Functional taxonomy

\[
\mathcal H_{\mathrm{unique}}
=
\{
h:
S_{\mathrm{sim}}^{(h)}
<
\tau_{\mathrm{sim}}
\}
\]

\[
\mathcal H_{\mathrm{similar}}
=
\{
h:
S_{\mathrm{sim}}^{(h)}
\ge
\tau_{\mathrm{sim}}
\}.
\]

\[
\mathcal H_{\mathrm{anchor}}
=
\{
h\in\mathcal H_{\mathrm{unique}}:
S_{\mathrm{stable}}^{(h)}
\ge\tau_{\mathrm{stable}}
\}
\]

\[
\mathcal H_{\mathrm{volatile}}
=
\{
h\in\mathcal H_{\mathrm{unique}}:
S_{\mathrm{stable}}^{(h)}
<\tau_{\mathrm{stable}}
\}.
\]

For similarity clusters

\[
\mathcal C
=
\{C_1,\ldots,C_m\}
=
\operatorname{GreedyStarCluster}
(\mathcal H_{\mathrm{similar}})
\]

\[
h_{\mathrm{pivot}}^{(j)}
=
\arg\max_{h\in C_j}
\operatorname{Centrality}(h,C_j)
\]

\[
\mathcal H_{\mathrm{satellite}}
=
\bigcup_j
\left(
C_j
\setminus
\{h_{\mathrm{pivot}}^{(j)}\}
\right).
\]

\[
\mathcal H_{\mathrm{comp}}
=
\mathcal H_{\mathrm{anchor}}
\cup
\mathcal H_{\mathrm{satellite}}.
\] :chatgpt-content-reference{index="25"}


## Stability-conditioned cache budget

Let

\[
\rho
=
\text{global KV budget ratio}
\]

\[
N
=
|\mathcal H|
\]

\[
N_{\mathrm{full}}
=
|\mathcal H_{\mathrm{volatile}}
\cup
\mathcal H_{\mathrm{pivot}}|
\]

\[
N_{\mathrm{comp}}
=
|\mathcal H_{\mathrm{comp}}|.
\]

\[
\boxed{
L_{\mathrm{base}}
=
\frac{
(\rho N-N_{\mathrm{full}})L
}{
N_{\mathrm{comp}}
}
}
\]

\[
w_i
=
\frac1{
S_{\mathrm{stable}}^{(i)}
}
\]

\[
\boxed{
l_i
=
N_{\mathrm{comp}}L_{\mathrm{base}}
\frac{
w_i
}{
\sum_{h_j\in\mathcal H_{\mathrm{comp}}}w_j
}
}
\]

\[
S_{\mathrm{stable}}\downarrow
\Rightarrow
w_i\uparrow
\Rightarrow
l_i\uparrow.
\] :chatgpt-content-reference{index="26"}


## Hierarchical placement

\[
h
\in
\mathcal H_{\mathrm{volatile}}
\cup
\mathcal H_{\mathrm{pivot}}
\Rightarrow
KV_h^{GPU}=KV_h^{full}.
\]

\[
h\in\mathcal H_{\mathrm{comp}}
\Rightarrow
\begin{cases}
|KV_h^{GPU}|=l_h\\
KV_h^{CPU}=KV_h^{full}.
\end{cases}
\]

## Dynamic drift detection

Baseline:

\[
\mathcal K_{\mathrm{base}}
=
\operatorname{Top}_{L_{\mathrm{base}}}
(A_{\mathrm{prefill}}).
\]

At decode step \(t\):

\[
o_t
=
O(\mathcal K_t,\mathcal K_{\mathrm{base}})
=
\frac{
|\mathcal K_t\cap\mathcal K_{\mathrm{base}}|
}{
L_{\mathrm{base}}
}.
\]

\[
r_t
=
\mathbb I
\left[
\operatorname{Median}
\{o_i\}_{i=t-W+1}^{t}
<
\tau_{\mathrm{drift}}
\right].
\]

\[
r_t=1
\Rightarrow
\operatorname{AsyncRetrieve}
\left(
CPU\rightarrow GPU,
\operatorname{Top}_{l_i}(\mathcal K_t)
\right).
\]

\[
\boxed{
\text{pivot attention shift}
\rightarrow
\text{satellite state refresh}
}
\] :chatgpt-content-reference{index="27"}


---

# \(\boxed{\mathcal A_{18}:\text{ LOSSLESS-OUTPUT KV THROUGH VERIFICATION — VERICACHE}}\)

Full KV:

\[
K_t^{F},V_t^{F}
\]

Compressed KV:

\[
K_t^{C},V_t^{C}
=
\mathcal C
(K_t^{F},V_t^{F}).
\]

Draft horizon:

\[
\hat y_{t:t+m-1}
\sim
P_{\theta,C}
(
\cdot|x_{\le t}
).
\]

Simultaneously:

\[
KV_{\mathrm{full}}
:
\mathrm{host/remote}
\rightarrow
GPU.
\]

Verification:

\[
y_{t:t+m-1}^{F}
=
\operatorname{DecodeFullKV}
(
x_{\le t},
\hat y_{t:t+m-1}
).
\]

Longest accepted prefix:

\[
a
=
\max
\left\{
j:
\hat y_{t:t+j-1}
=
y_{t:t+j-1}^{F}
\right\}.
\]

\[
Y
\leftarrow
Y
\oplus
\hat y_{t:t+a-1}.
\]

On mismatch:

\[
y_{t+a}
\leftarrow
y_{t+a}^{F}.
\]

\[
\boxed{
Y_{\mathrm{VeriCache}}
=
Y_{\mathrm{FullKV}}
}
\]

under the deterministic verification assumptions used by the system.

\[
\boxed{
M_{\mathrm{HBM}}\downarrow
\quad\text{but}\quad
M_{\mathrm{total\ retained\ state}}
\not\downarrow\text{ to compressed size}
}
\]

\[
\boxed{
\text{lossy draft}
+
\text{exact verification}
\rightarrow
\text{lossless final output}
}
\] :chatgpt-content-reference{index="28"}


---

# \(\boxed{\mathcal A_{19}:\text{ HIERARCHICAL KV RETRIEVAL / OFFLOAD}}\)

\[
KV
=
KV^{HBM}
\cup
KV^{CPU}
\cup
KV^{SSD}
\cup
KV^{remote}.
\]

\[
r_g+r_c+r_s+r_n=1.
\]

\[
M_{HBM}
=
r_gM_{KV}.
\]

For query \(q_t\):

\[
\mathcal B_t^\star
=
\operatorname{PredictRelevantBlocks}
(q_t).
\]

\[
KV_t^{needed}
=
\bigcup_{B\in\mathcal B_t^\star}
KV_B.
\]

\[
T_{\mathrm{step}}
\approx
T_{\mathrm{compute}}
+
\max
\left[
0,
T_{\mathrm{state\ movement}}
-
T_{\mathrm{overlap}}
\right].
\]

\[
T_{\mathrm{movement}}
=
\sum_{m\rightarrow n}
\left(
\frac{
Bytes_{m\rightarrow n}
}{
BW_{m\rightarrow n}
}
+
Latency_{m\rightarrow n}
\right).
\]

\[
\boxed{
\text{capacity bottleneck}
\rightarrow
\text{movement bottleneck}
}
\]

\[
\boxed{
\text{offload usefulness}
\iff
T_{\mathrm{movement}}
\lesssim
T_{\mathrm{hidden\ compute}}
}
\]

---

# \(\boxed{\mathcal A_{20}:\text{ PAGED KV STATE}}\)

Logical KV sequence:

\[
KV_{1:L}
\]

Partition:

\[
P_i
=
KV_{(i-1)B+1:iB}
\]

\[
N_P
=
\left\lceil
\frac LB
\right\rceil.
\]

Logical→physical mapping:

\[
\phi_r:
i
\mapsto
p_i^{physical}.
\]

\[
\operatorname{BlockTable}_r
=
[
\phi_r(1),
\ldots,
\phi_r(N_P)
].
\]

\[
KV_r
=
\bigsqcup_{i=1}^{N_P}
P_{\phi_r(i)}.
\]

Shared prefix:

\[
X_a[1:m]
=
X_b[1:m]
\]

\[
\Rightarrow
\phi_a(i)
=
\phi_b(i),
\quad
i\le
\left\lceil m/B\right\rceil.
\]

\[
\boxed{
\text{logical contiguity}
\not\Rightarrow
\text{physical contiguity}
}
\]

\[
\boxed{
\text{prefix identity}
\Rightarrow
\text{KV physical-page sharing}
}
\]

---

# \(\boxed{\mathcal A_{21}:\text{ PREFIX REUSE / RADIX-STYLE CONTEXT CACHE}}\)

Token sequence:

\[
X_r
=
B_{r,1}\oplus\cdots\oplus B_{r,n}.
\]

Cached prefixes:

\[
\mathcal P
=
\{P_1,\ldots,P_M\}.
\]

Longest prefix match:

\[
P_r^\star
=
\arg\max_{P\in\mathcal P}
\operatorname{LCP}(P,X_r).
\]

\[
\ell_r^\star
=
|\operatorname{LCP}(P_r^\star,X_r)|.
\]

\[
KV_{1:\ell_r^\star}
=
KV_{\mathrm{cache}}(P_r^\star).
\]

\[
\operatorname{PrefillTokens}_r
=
|X_r|-\ell_r^\star.
\]

\[
TTFT
\simeq
T_{\mathrm{lookup}}
+
T_{\mathrm{load}}
+
T_{\mathrm{prefill}}
(
|X_r|-\ell_r^\star
).
\]

---

# \(\boxed{\mathcal A_{22}:\text{ CONTEXTPILOT — ORDER/DEDUPLICATION REUSE}}\)

Original request:

\[
X
=
B_{\pi(1)}
\oplus
B_{\pi(2)}
\oplus
\cdots
\oplus
B_{\pi(n)}.
\]

Context index:

\[
\mathcal I
=
\{
\operatorname{hash}(B_i)
\mapsto
\operatorname{CachedPrefixLocation}(B_i)
\}.
\]

Overlap:

\[
\mathcal O(X,\mathcal I)
=
\{
B_i:
\operatorname{hash}(B_i)\in\mathcal I
\}.
\]

Alignment transform:

\[
X'
=
\operatorname{Align}
(
X;
\mathcal I
)
\]

such that

\[
\operatorname{PrefixReuse}(X')
\ge
\operatorname{PrefixReuse}(X).
\]

Duplicate set:

\[
\mathcal D
=
\{
(i,j):
B_i\equiv B_j,\ i<j
\}.
\]

\[
X''
=
\operatorname{Dedup}
(X').
\]

\[
B_j,\;(i,j)\in\mathcal D
\mapsto
R(B_i)
\]

where \(R(B_i)\) is a succinct reference/annotation rather than full duplication.

Objective:

\[
\boxed{
X^\star
=
\arg\max_{\tilde X\in\mathcal E(X)}
\operatorname{ReusableKV}(\tilde X)
}
\]

subject to

\[
Q_{\mathrm{reasoning}}(\tilde X)
\ge
Q_{\mathrm{reasoning}}(X)-\epsilon.
\]

\[
\boxed{
\text{semantic content reuse}
\not\Rightarrow
\text{prefix-cache reuse}
}
\]

\[
\boxed{
\text{reordering/alignment}
\rightarrow
\text{prefix-compatible reuse}
}
\] :chatgpt-content-reference{index="29"}


---

# \(\boxed{\mathcal A_{23}:\text{ CHUNKED PREFILL}}\)

Prompt:

\[
X
=
X^{(1)}
\oplus
X^{(2)}
\oplus
\cdots
\oplus
X^{(m)}
\]

\[
|X^{(j)}|
=
c
\]

except final chunk.

Iteration \(r\):

\[
\mathcal B_r
=
\mathcal D_r
\cup
\mathcal P_r(c)
\]

where

\[
\mathcal D_r
=
\text{decode tokens}
\]

\[
\mathcal P_r(c)
=
\text{at most }c\text{ prefill tokens}.
\]

\[
T_r
=
F
(
|\mathcal D_r|,
|\mathcal P_r|
).
\]

\[
c\downarrow
\Rightarrow
\begin{cases}
\text{decode interference}\downarrow\\
\text{launch/scheduling overhead}\uparrow
\end{cases}
\]

\[
c\uparrow
\Rightarrow
\begin{cases}
\text{prefill efficiency}\uparrow\\
\text{decode stall risk}\uparrow.
\end{cases}
\]

---

# \(\boxed{\mathcal A_{24}:\text{ SLOWEAVE DEADLINE-AWARE CHUNKING}}\)

Active decode set:

\[
\mathcal D_t
=
\{r_1,\ldots,r_n\}.
\]

Deadline:

\[
d_i
=
t_i^{last}+SLO_i^{TPOT}.
\]

Earliest deadline:

\[
d_{\min}
=
\min_i d_i.
\]

Predicted iteration duration:

\[
\widehat T(c;\mathcal B_t).
\]

Feasible chunk set:

\[
\mathcal C_{\mathrm{safe}}
=
\left\{
c:
t_{\mathrm{now}}
+
\widehat T(c;\mathcal B_t)
\le
d_{\min}
\right\}.
\]

\[
\boxed{
c_t^\star
=
\max
\mathcal C_{\mathrm{safe}}
}
\]

with monotone cost model:

\[
c_1<c_2
\Rightarrow
\widehat T(c_1)
\le
\widehat T(c_2).
\]

Hence:

\[
c_t^\star
=
\operatorname{BinarySearch}
\left[
\widehat T(c)
\le
d_{\min}-t_{\mathrm{now}}
\right].
\]

Optimality under stated assumptions:

\[
\boxed{
c_t^\star
=
\arg\max_c
\{
\text{immediate prefill progress}
:
\text{active next-token deadlines preserved}
\}
}
\]

provided

\[
\text{decode-only iteration feasible}
\land
\widehat T=T.
\] :chatgpt-content-reference{index="30"}


---

# \(\boxed{\mathcal A_{25}:\text{ PREFILL/DECODE DISAGGREGATION}}\)

Request \(r\):

\[
X_r
\xrightarrow{\mathrm{prefill\ worker}}
KV_r
\]

\[
KV_r
\xrightarrow{\mathrm{network}}
\mathrm{decode\ worker}
\]

\[
KV_r,Y_{r,<t}
\xrightarrow{\mathrm{decode}}
y_{r,t}.
\]

Latency:

\[
TTFT_r
=
T_{\mathrm{queue,P}}
+
T_{\mathrm{prefill}}
+
T_{KV-transfer}
+
T_{\mathrm{queue,D}}
+
T_{\mathrm{first-decode}}.
\]

\[
T_{KV-transfer}
=
\frac{
|KV_r|
}{
BW_{P\rightarrow D}
}
+
RTT_{P\rightarrow D}.
\]

\[
\boxed{
|KV_r|\propto L_r
}
\]

\[
\boxed{
L_r\uparrow
\Rightarrow
T_{KV-transfer}\uparrow
}
\]

unless compression/reduction is applied.

---

# \(\boxed{\mathcal A_{26}:\text{ KVSERVE}}\)

Compression profile:

\[
p
=
(
m,
b,
\rho,
g,\ldots
)
\in\mathcal P
\]

where components denote method/bit-width/retention ratio/granularity/etc.

Offline measurements:

\[
\mathbf y(p)
=
\left[
Q(p),
T_{\mathrm{comp}}(p),
Bytes(p)
\right].
\]

Bayesian profile search:

\[
p_{n+1}
=
\arg\max_{p\in\mathcal P}
\operatorname{Acquisition}
\left(
p|
\mathcal D_n
\right).
\]

3-D candidate frontier:

\[
\mathcal F
=
\left\{
p:
\nexists p'
\text{ s.t. }
\begin{array}{l}
Q(p')\ge Q(p)\\
Bytes(p')\le Bytes(p)\\
T_{\mathrm{comp}}(p')\le T_{\mathrm{comp}}(p)
\end{array}
\text{ with one strict}
\right\}.
\]

Online latency model:

\[
\widehat T(p,t)
=
T_{\mathrm{compress}}(p)
+
\frac{
Bytes(p)
}{
BW_t
}
+
T_{\mathrm{decompress}}(p)
+
T_{\mathrm{service}}(p).
\]

Feasibility:

\[
\mathcal F_t^{SLO}
=
\left\{
p\in\mathcal F:
Q(p)\ge Q_{\min}
\land
\widehat T(p,t)\le SLO_t
\right\}.
\]

Online selection:

\[
\boxed{
p_t^\star
=
\operatorname{Controller}
\left(
\mathcal F_t^{SLO},
BW_t,
W_t,
SLO_t,
\hat\Delta_{\mathrm{offline\rightarrow online}}
\right)
}
\]

\[
\boxed{
\text{fixed compression profile}
\not\equiv
\text{service-optimal profile}
}
\]

\[
\boxed{
T_{\mathrm{compression}}
>
T_{\mathrm{bytes\ saved}}
\Rightarrow
\text{compression may increase latency}
}
\] :chatgpt-content-reference{index="31"}


---

# \(\boxed{\mathcal A_{27}:\text{ STRATA HIERARCHICAL CONTEXT CACHE}}\)

\[
\mathcal H
=
\{
HBM,\ DRAM,\ SSD
\}.
\]

State location:

\[
\pi(KV_i)
\in
\mathcal H.
\]

For request \(r\):

\[
KV_r^{missing}
=
KV_r
\setminus
KV_r^{HBM}.
\]

Naïve loading:

\[
T_{\mathrm{load}}^{naive}
=
\sum_{b\in KV_r^{missing}}
\left[
T_{\mathrm{launch}}
+
\frac{|b|}{BW_{\pi(b)\rightarrow HBM}}
\right].
\]

Large-transfer coalescing:

\[
G_j
=
\bigcup_{b\in\mathcal G_j}b
\]

\[
|G_j|
\gg
|b|.
\]

\[
T_{\mathrm{load}}^{Strata}
\simeq
\sum_j
\left[
T_{\mathrm{launch}}
+
\frac{|G_j|}{BW}
\right].
\]

\[
\boxed{
\#\mathrm{transfers}\downarrow
,\qquad
\mathrm{transfer\ size}\uparrow
}
\]

Delay-hit condition:

\[
r_a,r_b
\rightarrow
KV_z
\]

\[
r_a\text{ initiates load of }KV_z
\]

\[
r_b\text{ arrives before completion}.
\]

\[
\boxed{
\text{cache hit}
\not\Rightarrow
\text{cache ready}
}
\]

Scheduler objective:

\[
\Sigma^\star
=
\arg\max_\Sigma
\left[
\operatorname{Throughput}(\Sigma)
-
\lambda
\operatorname{CacheLoadStall}(\Sigma)
-
\mu
\operatorname{DelayHitPenalty}(\Sigma)
\right].
\]

Complementary overlap:

\[
T_{\mathrm{visible\ load}}
=
\max
(
0,
T_{\mathrm{load}}
-
T_{\mathrm{other\ useful\ compute}}
).
\] :chatgpt-content-reference{index="32"}


---

# \(\boxed{\mathcal A_{28}:\text{ CONTEXT PARALLELISM}}\)

For CP degree \(p\):

\[
X
=
X^{(1)}
\cup\cdots\cup
X^{(p)}
\]

\[
|X^{(i)}|
\simeq
L/p.
\]

Each worker:

\[
Q_i,K_i,V_i
=
F_\theta(X^{(i)}).
\]

Attention requires distributed statistics:

\[
m_i
=
\max_j S_{ij}
\]

\[
l_i
=
\sum_j
e^{S_{ij}-m_i}
\]

\[
o_i
=
\sum_j
e^{S_{ij}-m_i}V_j.
\]

Distributed merge:

\[
m
=
\max_r m^{(r)}
\]

\[
l
=
\sum_r
e^{m^{(r)}-m}
l^{(r)}
\]

\[
o
=
\frac{
\sum_r
e^{m^{(r)}-m}
l^{(r)}o^{(r)}
}{
l
}.
\]

Thus:

\[
T_{\mathrm{CP}}(p,L)
=
T_{\mathrm{compute}}(L/p)
+
T_{\mathrm{communication}}(p,L).
\]

\[
\boxed{
p\uparrow
\Rightarrow
T_{\mathrm{compute}}\downarrow
\quad\land\quad
T_{\mathrm{communication}}\uparrow
}
\]

---

# \(\boxed{\mathcal A_{29}:\text{ VERTUMNUS ADAPTIVE CONTEXT PARALLELISM}}\)

Worker groups:

\[
\mathcal W
=
\bigcup_{p\in\mathcal P}
\mathcal W_p
\]

where

\[
p
=
\text{CP degree}.
\]

Request \(r\) placement cost:

\[
\boxed{
J(r,w)
=
\alpha
\widehat T_{\mathrm{queue}}(r,w)
+
\beta
\widehat T_{\mathrm{prefill}}(r,w,\mathrm{cache})
+
\gamma
\widehat C_{\mathrm{GPU}}(r,w)
}
\]

\[
w_r^\star
=
\arg\min_{w\in\mathcal W}
J(r,w).
\]

Cluster composition:

\[
n_p(t)
=
|\mathcal W_p(t)|.
\]

\[
\sum_p
p\,n_p(t)
=
G_{\mathrm{total}}.
\]

Adaptation:

\[
\mathbf n(t+1)
=
\operatorname{SplitMerge}
\left(
\mathbf n(t),
\lambda_t(L),
Q_t,
Cache_t
\right).
\]

Global prefix replication:

\[
\operatorname{Replicas}(P)
=
\mathcal R_P
\subseteq
\mathcal W.
\]

\[
\mathcal R_P^\star
=
\arg\min_{\mathcal R_P}
\left[
T_{\mathrm{miss}}
+
C_{\mathrm{replication}}
+
C_{\mathrm{capacity}}
\right].
\]

\[
\boxed{
\text{optimal CP degree}
=
f(
L,
queue,
GPU\ cost,
prefix\ locality,
load
)
}
\]

\[
\boxed{
p^\star\neq\mathrm{constant}
}
\] :chatgpt-content-reference{index="33"}


---

# \(\boxed{\mathcal A_{30}:\text{ KV FAULT TOLERANCE — GHOSTSERVE}}\)

Partition distributed KV:

\[
KV
\rightarrow
D_1,\ldots,D_k.
\]

Erasure coding:

\[
P_j
=
\sum_{i=1}^{k}
a_{ji}D_i,
\qquad
j=1,\ldots,m
\]

over appropriate finite-field arithmetic.

\[
\mathbf P
=
A\mathbf D.
\]

Store:

\[
\{D_i\}
\rightarrow
\text{accelerator devices}
\]

\[
\{P_j\}
\rightarrow
\text{host-memory shadow state}.
\]

Failure:

\[
D_f
\rightarrow
\varnothing.
\]

Select sufficient available shards:

\[
\tilde{\mathbf D}
=
A_S^{-1}
\tilde{\mathbf P}_S.
\]

Recover:

\[
D_f
=
\operatorname{DecodeErasure}
(
\{D_i:i\neq f\},
\{P_j\}
).
\]

\[
\boxed{
T_{\mathrm{recovery}}
\ll
T_{\mathrm{full\ prefix\ recomputation}}
}
\]

when coding/reconstruction conditions hold.

\[
\boxed{
C_{\mathrm{continuous}}
\uparrow
\Rightarrow
\text{value of preserving inference state}\uparrow
}
\] :chatgpt-content-reference{index="34"}


---

# \(\boxed{\mathcal A_{31}:\text{ EFFECTIVE-CONTEXT EVALUATION}}\)

Let relevant evidence lie at normalized position

\[
p
\in
[0,1].
\]

Let context length be

\[
L.
\]

Let distractor count be

\[
D.
\]

Let number of independently required evidence items be

\[
K.
\]

Let reasoning depth be

\[
R.
\]

Define

\[
Q
=
Q(L,p,D,K,R,\delta)
\]

where

\[
\delta
=
\text{lexical/semantic distance between query and evidence}.
\]

Single-needle score:

\[
Q_{\mathrm{needle}}
=
Q(L,p,D,1,0,\delta_{\mathrm{small}}).
\]

Multi-evidence reasoning:

\[
Q_{\mathrm{reason}}
=
Q(L,p,D,K>1,R>0,\delta).
\]

\[
\boxed{
Q_{\mathrm{needle}}\approx1
\not\Rightarrow
Q_{\mathrm{reason}}\approx1
}
\]

Position sensitivity:

\[
\Delta_{\mathrm{pos}}(L)
=
\max_pQ(L,p,\ldots)
-
\min_pQ(L,p,\ldots).
\]

\[
\Delta_{\mathrm{pos}}>0
\Rightarrow
\text{position-sensitive effective context}.
\]

Length degradation:

\[
D_L
=
-
\frac{\partial Q}{\partial\log L}.
\]

\[
D_L>0
\Rightarrow
\text{quality degrades with increasing context}.
\]

Distractor sensitivity:

\[
D_D
=
-
\frac{\partial Q}{\partial D}.
\]

\[
D_D>0
\Rightarrow
\text{information availability does not imply robust selection}.
\]

---

# \(\boxed{\mathcal A_{32}:\text{ NOMINAL-vs-EFFECTIVE LENGTH ESTIMATOR}}\)

For task family \(\mathcal T\):

\[
Q_{\mathcal T}(L)
=
\mathbb E_{
p,D,K,R,\delta\sim\mathcal T
}
[
Q(L,p,D,K,R,\delta)
].
\]

\[
\boxed{
C_{\mathrm{effective}}(\mathcal T,\tau)
=
\max
\{
L:
\inf_{\ell\le L}
Q_{\mathcal T}(\ell)\ge\tau
\}
}
\]

Conservative position-aware definition:

\[
\boxed{
C_{\mathrm{effective}}^{worst}
=
\max
\left\{
L:
\min_{p\in[0,1]}
Q(L,p,\ldots)\ge\tau
\right\}
}
\]

Multi-source definition:

\[
C_{\mathrm{effective}}^{multi}
=
\max
\left\{
L:
Q(L,\cdot,D,K>1,R>0,\delta)
\ge\tau
\right\}.
\]

\[
\boxed{
C_{\mathrm{effective}}^{multi}
\le
C_{\mathrm{effective}}^{needle}
\quad
\text{need not be equality}
}
\]

---

# \(\boxed{\mathcal A_{33}:\text{ INFORMATION-THEORETIC MEMORY BOUNDARY}}\)

History:

\[
H_t
=
(x_1,\ldots,x_t).
\]

Finite memory representation:

\[
z_t
=
f(H_t)
\]

\[
z_t
\in
\{0,1\}^B.
\]

Number of possible internal states:

\[
|\mathcal Z|
\le
2^B.
\]

For sufficiently large history space:

\[
|\mathcal H_t|
>
2^B.
\]

By pigeonhole principle:

\[
\exists
H_t^{(1)}
\neq
H_t^{(2)}
:
f(H_t^{(1)})
=
f(H_t^{(2)}).
\]

If a future query \(q\) distinguishes these histories:

\[
A(q,H_t^{(1)})
\neq
A(q,H_t^{(2)})
\]

but

\[
z_t^{(1)}
=
z_t^{(2)},
\]

then

\[
\operatorname{Answer}(q,z_t)
\]

cannot exactly recover both.

Therefore:

\[
\boxed{
\text{unbounded arbitrary exact recall}
+
\text{bounded finite state}
\;\text{is impossible}
}
\]

and continuous systems require at least one:

\[
\boxed{
\mathrm{discard}
\;\lor\;
\mathrm{lossy\ compress}
\;\lor\;
\mathrm{externalize}
\;\lor\;
\mathrm{grow\ state}.
}
\]

---

# \(\boxed{\mathcal A_{34}:\text{ MULTI-TIER CONTINUOUS MEMORY}}\)

Raw historical event:

\[
e_t.
\]

Immediate working state:

\[
W_t.
\]

Compressed episodic state:

\[
E_t.
\]

Persistent exact archive:

\[
A_t.
\]

Inference KV:

\[
K_t.
\]

State evolution:

\[
(e_t,W_t,E_t,A_t,K_t)
\mapsto
(W_{t+1},E_{t+1},A_{t+1},K_{t+1}).
\]

Write decision:

\[
w_t
=
P(
\text{future usefulness of }e_t
|
s_t
).
\]

\[
w_t\ge\tau_w
\Rightarrow
A_{t+1}
=
A_t\cup\{e_t\}.
\]

Compression-safety probability:

\[
c_{i,t}
=
P(
e_i\text{ replaceable}
|
s_t
).
\]

\[
c_{i,t}\ge\tau_c
\Rightarrow
e_i
\mapsto
z_i=\mathcal C(e_i).
\]

Retrieval probability:

\[
r_{i,t}
=
P(
e_i\text{ required by current objective}
|
q_t,s_t
).
\]

\[
\mathcal R_t
=
\operatorname{TopK}_i
r_{i,t}.
\]

Active context:

\[
C_t
=
W_t
\oplus
E_t^{selected}
\oplus
A_t^{retrieved}.
\]

Sparse model state:

\[
O_t
=
\operatorname{SparseAttention}
(
q_t,C_t
).
\]

KV residency:

\[
\Pi_t
:
KV_t
\mapsto
\{HBM,CPU,SSD,remote\}.
\]

Serving decision:

\[
\Sigma_t
=
\arg\min_\Sigma
\left[
\lambda_1TTFT
+
\lambda_2TPOT
+
\lambda_3Cost
+
\lambda_4QualityLoss
\right].
\]

---

# \(\boxed{\mathcal A_{35}:\text{ CONTINUOUS-CONTEXT CONTROL OBJECTIVE}}\)

Decision variables:

\[
\mathcal D_t
=
\{
a_t^{retain},
a_t^{compress},
a_t^{retrieve},
a_t^{evict},
a_t^{offload},
a_t^{prefetch},
a_t^{route},
a_t^{schedule}
\}.
\]

Quality:

\[
Q_t
=
Q(
\mathcal S_t,\mathcal D_t
).
\]

HBM:

\[
M_t
=
M(
\mathcal S_t,\mathcal D_t
).
\]

Compute:

\[
F_t
=
F(
\mathcal S_t,\mathcal D_t
).
\]

Network:

\[
N_t
=
N(
\mathcal S_t,\mathcal D_t
).
\]

Latency:

\[
T_t
=
T(
\mathcal S_t,\mathcal D_t
).
\]

Information-loss risk:

\[
R_t^{loss}
=
R_{\mathrm{loss}}
(
\mathcal S_t,\mathcal D_t
).
\]

Optimization:

\[
\boxed{
\mathcal D_t^\star
=
\arg\min_{\mathcal D_t}
\left[
\lambda_M M_t
+
\lambda_F F_t
+
\lambda_N N_t
+
\lambda_T T_t
+
\lambda_R R_t^{loss}
\right]
}
\]

subject to

\[
Q_t\ge Q_{\min}
\]

\[
TTFT_t\le SLO_{\mathrm{TTFT}}
\]

\[
TPOT_t\le SLO_{\mathrm{TPOT}}
\]

\[
M_t\le M_{\mathrm{HBM,max}}
\]

\[
N_t\le BW_{\mathrm{network}}
\]

\[
P(
\text{critical-information loss}
)
\le\epsilon.
\]

---

# \(\boxed{\mathcal A_{36}:\text{ REQUIRED END-TO-END CONTINUOUS-CONTEXT RESEARCH SYSTEM}}\)

\[
e_t
\xrightarrow{
\mathcal W
}
M_t^{persistent}
\]

\[
M_t^{persistent}
\xrightarrow{
\mathcal R(q_t,s_t)
}
M_t^{selected}
\]

\[
M_t^{selected}
\xrightarrow{
\mathcal C(s_t)
}
M_t^{compressed}
\]

\[
M_t^{compressed}
\oplus
W_t
\xrightarrow{
\mathcal A_{\mathrm{sparse}}
}
H_t
\]

\[
H_t
\xrightarrow{
W_K,W_V
}
KV_t
\]

\[
KV_t
\xrightarrow{
\mathcal P
}
\{
KV_t^{HBM},
KV_t^{CPU},
KV_t^{SSD},
KV_t^{remote}
\}
\]

\[
\{
KV_t^{(\cdot)}
\}
\xrightarrow{
\mathcal S_{\mathrm{runtime}}
}
y_t.
\]

State feedback:

\[
y_t,a_t,o_t
\rightarrow
s_{t+1}
\]

\[
s_{t+1}
\rightarrow
\{
\mathcal W,
\mathcal R,
\mathcal C,
\mathcal A_{\mathrm{sparse}},
\mathcal P,
\mathcal S_{\mathrm{runtime}}
\}_{t+1}.
\]

\[
\boxed{
\text{ContinuousContext}_{t+1}
=
F
\left(
\text{ContinuousContext}_t,
\text{new observation}_t,
\text{task state}_t,
\text{resource state}_t
\right)
}
\]

---

# \(\boxed{\mathcal A_{37}:\text{ CONVERGING FRONTIER}}\)

\[
\boxed{
\text{Finite dense window}
\rightarrow
\text{larger trained window}
\rightarrow
\text{sparse random access}
\rightarrow
\text{adaptive selection}
\rightarrow
\text{adaptive compression}
\rightarrow
\text{persistent external memory}
}
\]

\[
\boxed{
\phantom{\text{Finite dense window}}
\rightarrow
\text{adaptive KV residency}
\rightarrow
\text{hierarchical storage}
\rightarrow
\text{adaptive state transfer}
\rightarrow
\text{adaptive scheduling}
}
\]

\[
\boxed{
\mathfrak C_{\mathrm{future}}
\neq
\text{``one infinitely large prompt''}
}
\]

\[
\boxed{
\mathfrak C_{\mathrm{future}}
\approx
\left[
\begin{array}{c}
\text{sparse/random-access neural context}\\
+\\
\text{bounded active working state}\\
+\\
\text{learned state-conditioned compression}\\
+\\
\text{persistent recoverable historical store}\\
+\\
\text{query-conditioned retrieval}\\
+\\
\text{hierarchical KV state}\\
+\\
\text{adaptive heterogeneous-memory placement}\\
+\\
\text{cache-aware/disaggregated serving}\\
+\\
\text{deadline-aware scheduling}\\
+\\
\text{continuous-context evaluation}
\end{array}
\right]
}
\]

\[
\boxed{
\text{WHAT IS DEMONSTRATED}
=
\left\{
\begin{array}{l}
\text{million-token explicit training}\\
\text{extreme sparse retrieval extrapolation}\\
\text{learned sparse attention}\\
\text{self-compressed reasoning}\\
\text{RL-controlled external memory}\\
\text{dynamic KV selection}\\
\text{host/HBM hierarchical KV}\\
\text{lossy-draft + exact-KV verification}\\
\text{prefix/context reuse}\\
\text{adaptive prefill scheduling}\\
\text{adaptive CP}\\
\text{state fault tolerance}
\end{array}
\right\}
}
\]

\[
\boxed{
\text{WHAT REMAINS UNSOLVED}
=
\left\{
\begin{array}{l}
\text{arbitrarily long exact recall under bounded state}\\
\text{robust reasoning across arbitrarily distant evidence}\\
\text{perfect prediction of future relevance}\\
\text{provably safe irreversible compression}\\
\text{long-term conflict/staleness resolution}\\
\text{memory}\rightarrow\text{correct action guarantees}\\
\text{simultaneous exactness + bounded HBM + bounded communication}\\
\text{high-throughput continuous context under heterogeneous workloads}
\end{array}
\right\}
}
\]

\[
\boxed{
\therefore\quad
\text{LONG CONTEXT}
\neq
\text{LONG CONTINUOUS CONTEXT}
}
\]

\[
\boxed{
\text{LONG CONTINUOUS CONTEXT}
=
\text{STATE MANAGEMENT PROBLEM}
+
\text{MODEL PROBLEM}
+
\text{INFORMATION PROBLEM}
+
\text{SYSTEMS PROBLEM}
}
\]