# JEPA-Anything: From Orthogonal Predictive Factors to Sequential World Models

*How orthogonal predictive factorization reorganizes latent world modeling—and what it suggests for embodied, sequential, self-improving systems.*

## Introduction

Most world models are built around a domain: video models predict video, dynamics models predict physical states, molecular models predict molecular trajectories, and control models predict consequences of actions. JEPA-Anything asks a different question: **is there a common predictive organization that can sit above these domain differences?**

Its answer is not a universal encoder, universal tokenizer, or a single model trained on every modality. Each domain keeps its own observations, structural descriptors, context–target construction, and encoder. The common component is a latent predictive interface built around **Orthogonal Predictive Factorization (OPF)**. Instead of asking one predictor to reproduce a monolithic latent target, OPF learns several complementary subspaces, assigns a prediction pathway to each, and then recomposes their outputs into a complete latent state.

This distinction matters. A world state may contain multiple entities, spatial scales, temporal frequencies, intervention responses, or dynamical modes. A single prediction channel can allocate capacity unevenly: easy or high-variance modes may dominate while weaker predictive structure receives conflicting gradients. JEPA-Anything turns that problem into an explicit geometric allocation problem.

The resulting framework was evaluated across vision, biological states, clinical trajectories, control, molecular dynamics, physical fields, and weather, including intervention prediction and long-horizon rollout.

The core idea is therefore simple to state but mathematically stronger than “use multiple prediction heads”:

$$
\boxed{
\text{learn a complete predictive coordinate system,
predict complementary coordinates separately,
then reconstruct one coherent world state.}
}
$$

---

# 1. The problem: a monolithic latent target is an implicit capacity allocation mechanism

Consider a conventional joint-embedding predictive architecture.

A context encoder observes some available state \(C\),

$$
z_c=f_\theta(C),
$$

while a slowly moving target encoder represents a requested state \(T\),

$$
z_t=f_{\bar\theta}(T).
$$

A predictor learns

$$
q(z_c)\approx z_t.
$$

This is already a significant departure from pixel-space reconstruction. The model does not need to generate every unpredictable detail of an observation. It only needs to predict the representation produced by the target encoder.

The difficulty begins when \(z_t\) itself contains heterogeneous predictable structure.

Suppose

$$
z_t=
z_t^{\text{local}}
+
z_t^{\text{global}}
+
z_t^{\text{entity}}
+
z_t^{\text{slow}}
+
z_t^{\text{fast}}
+\cdots.
$$

These components need not be additive in reality; the expression merely illustrates that a single latent vector can carry several qualitatively different predictive modes.

A single predictor is then solving several problems simultaneously:

$$
q:
z_c\rightarrow
\begin{bmatrix}
\text{local structure}\\
\text{global structure}\\
\text{entity interaction}\\
\text{slow dynamics}\\
\text{fast dynamics}
\end{bmatrix}.
$$

Nothing in the ordinary objective forces different dimensions or groups of dimensions to assume complementary roles. Two failure modes become possible.

First, several latent directions may redundantly encode approximately the same easy-to-predict information. Second, strongly predictable or high-variance modes can dominate optimization while lower-amplitude or more difficult modes receive insufficient representational capacity. This is the capacity-allocation motivation given by JEPA-Anything.

OPF makes that allocation explicit.

---

# 2. A domain-independent predictive interface

Let \(\delta\) denote a domain and

$$
x\sim\mathcal D_\delta
$$

a raw observation.

JEPA-Anything does not prescribe what \(x\) must look like. Instead, every domain supplies an adapter

$$
\mathcal A_\delta
$$

that produces content tokens

$$
H=\{h_i\}_{i\in\Omega}
$$

and optional structural descriptors

$$
S=\{s_i\}_{i\in\Omega}.
$$

A descriptor may encode a spatial coordinate, timestamp, graph location, entity identifier, or nothing at all.

The domain also supplies a view sampler

$$
\mathcal V_\delta
$$

that selects context indices \(C\) and target indices \(T\):

$$
\boxed{
x
\xrightarrow{\mathcal A_\delta}
(H,S)
\xrightarrow{\mathcal V_\delta}
(H_C,S_C,T,S_T)
}
\tag{1}
$$

The domain-specific boundary therefore ends at the question:

> Given what is currently observable, what other state of the same underlying system should be predictable?

After that boundary, the same OPF machinery can be applied. The paper explicitly allows the encoder architecture itself to remain domain specific—ViTs, Transformers, GNNs, MLPs, and other suitable encoders are all compatible with the interface.

This is the correct interpretation of “Anything.”

It means

$$
\text{common predictive abstraction},
$$

not

$$
\text{one universal neural network}.
$$

---

# 3. Online and target representations

The online encoder produces the context state

$$
z_c=f_\theta(H_C,S_C).
$$

The target encoder produces

$$
z_t=f_{\bar\theta}(H,S)_t
\in\mathbb R^d.
$$

Its parameters are not optimized directly by backpropagation. Instead,

$$
\boxed{
\bar\theta
\leftarrow
m\bar\theta+(1-m)\theta,
\qquad
0\leq m<1.
}
\tag{2}
$$

Before factorization,

$$
\widetilde z_t
=
\operatorname{sg}(z_t),
$$

where \(\operatorname{sg}\) denotes stop-gradient.

This gradient boundary is important.

The target encoder is protected:

$$
\frac{\partial\widetilde z_t}
{\partial\bar\theta}
=0.
$$

But the factor projectors introduced next are not protected. They must remain trainable.

---

# 4. Orthogonal Predictive Factorization

Let the complete target representation have dimensionality

$$
d.
$$

Choose \(K\) predictive factors, each of width \(r\), with

$$
\boxed{Kr=d.}
$$

For each factor introduce

$$
P_k\in\mathbb R^{d\times r},
\qquad
k=1,\ldots,K.
$$

The \(k\)-th target factor is

$$
\boxed{
z_t^{(k)}
=
P_k^\top\widetilde z_t.
}
\tag{3}
$$

Thus

$$
P_k^\top:
\mathbb R^d
\rightarrow
\mathbb R^r
$$

acts as an analysis operator.

Each factor receives a corresponding predictor

$$
q_k,
$$

which maps the shared context state—and, where required, the target descriptor—to that coordinate block:

$$
\boxed{
\widehat z_t^{(k)}
=
q_k(z_c,s_t).
}
\tag{4}
$$

The predictors may be independent, or may use a shared trunk followed by \(K\) factor-specific output heads.

The architectural difference from ordinary multi-head prediction is not merely the existence of several heads. The outputs are tied to a learned geometric decomposition of the target state.

---

# 5. The complete analysis operator

Define

$$
P=
[P_1,P_2,\ldots,P_K]
\in\mathbb R^{d\times d}.
$$

The complete factor coordinates of a target are

$$
u_t
=
P^\top\widetilde z_t.
$$

Equivalently,

$$
u_t=
\begin{bmatrix}
z_t^{(1)}\\
z_t^{(2)}\\
\vdots\\
z_t^{(K)}
\end{bmatrix}.
$$

Predictions are stacked in the same way:

$$
\widehat u_t
=
\begin{bmatrix}
\widehat z_t^{(1)}\\
\widehat z_t^{(2)}\\
\vdots\\
\widehat z_t^{(K)}
\end{bmatrix}
\in\mathbb R^d.
$$

This stacking operation does **not** yet produce the complete latent state.

It produces coordinates in the learned analysis system.

The latent state is recovered through

$$
\boxed{
\widehat z_t
=
(P^\top)^\dagger
\widehat u_t,
}
\tag{5}
$$

where \({}^\dagger\) denotes the Moore–Penrose pseudoinverse.

That distinction is load-bearing.

$$
\operatorname{Concat}
(\widehat z_t^{(1)},\ldots,\widehat z_t^{(K)})
\neq
\widehat z_t.
$$

Rather,

$$
\operatorname{Concat}
\rightarrow
\text{factor-coordinate state}
\rightarrow
\text{synthesis operator}
\rightarrow
\text{latent world state}.
$$

The public repository follows the same principle and describes the factors as predictive coordinates rather than predefined semantic entities. It also makes clear that the public structural example does not itself reproduce the full paper's quantitative experiments.

---

# 6. Why a pseudoinverse is required

If \(P\) were exactly orthogonal,

$$
P^\top P=I_d,
$$

then

$$
P^{-1}=P^\top
$$

and therefore

$$
(P^\top)^\dagger=P.
$$

State synthesis would reduce to

$$
\widehat z_t
=
P\widehat u_t
=
\sum_{k=1}^K
P_k\widehat z_t^{(k)}.
$$

During ordinary optimization, however, the learned projectors are only encouraged toward orthogonality. They need not satisfy the constraint exactly after every optimizer update.

Then

$$
P^\top P\neq I_d,
$$

so replacing the synthesis operator by \(P\) would silently assume a property the learned geometry may not currently possess.

For a full-rank but nonorthogonal analysis map,

$$
u=P^\top z
$$

and

$$
(P^\top)^\dagger u=z,
$$

whereas transpose synthesis produces

$$
Pu
=
PP^\top z,
$$

which generally differs from \(z\).

The pseudoinverse therefore separates two requirements:

$$
\text{invertibility/completeness}
$$

from

$$
\text{perfect orthogonality}.
$$

---

# 7. Prediction loss: preserve direction and magnitude

Each branch directly regresses its assigned target coordinates:

$$
\boxed{
\mathcal L_{\mathrm{pred}}
=
\frac{1}{K|T|r}
\sum_{t\in T}
\sum_{k=1}^{K}
\left\|
\widehat z_t^{(k)}
-z_t^{(k)}
\right\|_2^2.
}
\tag{6}
$$

Because these coordinates are later used to synthesize an actual latent state, both direction and magnitude matter.

A purely angular objective would allow

$$
\widehat z_t^{(k)}
=
\alpha z_t^{(k)}
$$

for arbitrary \(\alpha>0\), despite such scaling changing the synthesized state.

Direct regression removes that ambiguity.

---

# 8. Orthogonality is the core structural regularizer

Without an explicit constraint, two projectors could learn the same predictive directions.

Within each factor JEPA-Anything asks for approximately orthonormal coordinates:

$$
P_k^\top P_k\approx I_r.
$$

Between factors it asks for approximately orthogonal subspaces:

$$
P_i^\top P_j\approx0,
\qquad i\neq j.
$$

The resulting loss is

$$
\boxed{
\begin{aligned}
\mathcal L_{\mathrm{orth}}
={}&
\sum_{k=1}^{K}
\left\|
P_k^\top P_k-I_r
\right\|_F^2
\\
&+
\sum_{1\leq i<j\leq K}
\left\|
P_i^\top P_j
\right\|_F^2.
\end{aligned}
}
\tag{7}
$$

The first term prevents a factor from containing duplicated or degenerate basis directions.

The second prevents different factors from repeatedly occupying the same target-space directions.

This is geometric redundancy reduction.

It should not be confused with statistical decorrelation:

$$
P_i^\top P_j=0
$$

does not imply

$$
\operatorname{Cov}
(z^{(i)},z^{(j)})=0.
$$

Nor does either imply independence:

$$
I(z^{(i)};z^{(j)})=0.
$$

And none of these properties establish causality.

---

# 9. The main proof: OPF is information preserving in the orthogonal limit

The paper's first proposition provides the central mathematical guarantee.

Assume

$$
P_i^\top P_j=0,
\qquad
i\neq j,
$$

and

$$
P_k^\top P_k=I_r
\qquad
\forall k.
$$

Since

$$
P=[P_1,\ldots,P_K],
$$

the block Gram matrix is

$$
P^\top P
=
\begin{bmatrix}
P_1^\top P_1 & \cdots & P_1^\top P_K\\
\vdots & \ddots & \vdots\\
P_K^\top P_1 & \cdots & P_K^\top P_K
\end{bmatrix}.
$$

Under the assumptions,

$$
P^\top P=I_d.
$$

Because \(Kr=d\), \(P\) is square. Therefore

$$
P^{-1}=P^\top
$$

and

$$
PP^\top=I_d.
$$

For any latent state \(z\),

$$
P^\top z
=
\begin{bmatrix}
P_1^\top z\\
\vdots\\
P_K^\top z
\end{bmatrix}.
$$

Hence

$$
\begin{aligned}
\|P^\top z\|_2^2
&=
\sum_{k=1}^{K}
\|P_k^\top z\|_2^2
\\
&=
z^\top PP^\top z
\\
&=
z^\top z.
\end{aligned}
$$

Therefore

$$
\boxed{
\|z\|_2^2
=
\sum_{k=1}^{K}
\|P_k^\top z\|_2^2.
}
\tag{8a}
$$

Reconstruction follows immediately:

$$
\begin{aligned}
z
&=
PP^\top z
\\
&=
[P_1,\ldots,P_K]
\begin{bmatrix}
P_1^\top z\\
\vdots\\
P_K^\top z
\end{bmatrix}
\\
&=
\sum_{k=1}^{K}
P_kP_k^\top z.
\end{aligned}
$$

Thus

$$
\boxed{
z
=
\sum_{k=1}^{K}
P_kP_k^\top z.
}
\tag{8b}
$$

The factors therefore form an orthogonal direct sum of the entire latent state space.

No information is discarded by factorization in the zero-penalty limit; the operation becomes a change of orthogonal coordinates. This is Proposition 1 in the paper.

---

# 10. Stable synthesis is more important than factor separation alone

Suppose

$$
u=P^\top z
$$

and prediction introduces factor-coordinate error

$$
e.
$$

Then

$$
\widehat u=u+e.
$$

Under exact orthogonality,

$$
\widehat z
=
P\widehat u.
$$

Therefore

$$
\widehat z-z
=
P(u+e)-Pu
=
Pe.
$$

Because orthogonal transformations preserve Euclidean norm,

$$
\boxed{
\|\widehat z-z\|_2
=
\|e\|_2.
}
$$

Hence

$$
\kappa_2(P)=1.
$$

The learned coordinate system does not amplify prediction error.

Now remove cross-factor orthogonality.

Two factors may become nearly parallel. Then the smallest singular value can approach zero:

$$
\sigma_{\min}(P)\rightarrow0.
$$

Consequently,

$$
\kappa_2(P)
=
\frac{\sigma_{\max}(P)}
{\sigma_{\min}(P)}
\rightarrow\infty.
$$

Small errors in predicted factor coordinates may then produce large errors after synthesis.

This is the deeper reason OPF is not equivalent to splitting the output layer into several arbitrary heads. The paper's corollary explicitly connects cross-factor orthogonality to complete recovery and numerically stable synthesis.

---

# 11. Approximate orthogonality gives an explicit conditioning bound

The same argument can be extended slightly beyond the paper's exact-zero case.

Assume

$$
\|P^\top P-I\|_2\leq\epsilon<1.
$$

Then every eigenvalue of \(P^\top P\) lies within

$$
[1-\epsilon,1+\epsilon].
$$

Because

$$
\lambda_i(P^\top P)=\sigma_i(P)^2,
$$

we obtain

$$
\sqrt{1-\epsilon}
\leq
\sigma_i(P)
\leq
\sqrt{1+\epsilon}.
$$

Therefore

$$
\boxed{
\kappa_2(P)
\leq
\sqrt{
\frac{1+\epsilon}
{1-\epsilon}
}.
}
$$

If

$$
\widehat u=P^\top z+e,
$$

and \(P\) remains full rank,

$$
\widehat z-z
=
(P^\top)^{-1}e.
$$

Thus

$$
\boxed{
\|\widehat z-z\|_2
\leq
\frac{1}
{\sqrt{1-\epsilon}}
\|e\|_2.
}
$$

This derived bound exposes an experimentally measurable quantity:

$$
\|P^\top P-I\|_2.
$$

It is not merely an auxiliary training loss. It upper-bounds how badly factor prediction errors can be amplified by the learned synthesis geometry.

---

# 12. Preventing inactive factors

Orthogonality can produce perfectly separated factors that nevertheless carry no useful variation.

JEPA-Anything therefore computes, for every factor coordinate,

$$
\sigma^{\mathrm{fac}}_{k,j}
=
\sqrt{
\operatorname{Var}_{\mathcal B}
[z^{(k)}_{t,j}]
+\epsilon
}.
$$

A minimum activity threshold \(\gamma_{\mathrm{fac}}\) produces

$$
\boxed{
\mathcal L_{\mathrm{fac}}
=
\frac{1}{Kr}
\sum_{k=1}^{K}
\sum_{j=1}^{r}
\max
\left(
0,
\gamma_{\mathrm{fac}}
-
\sigma^{\mathrm{fac}}_{k,j}
\right).
}
\tag{9}
$$

The coordinate-wise form matters.

Suppose one factor has

$$
z^{(k)}
=
[z_1,z_2,\ldots,z_r].
$$

If \(z_1\) carries high variance while all other coordinates are constant, a factor-level average variance could incorrectly classify the factor as active.

The per-coordinate constraint instead requires

$$
\operatorname{Std}(z_j)
\geq
\gamma_{\mathrm{fac}}
$$

for every coordinate.

Because the target encoder state was stopped before projection,

$$
z_t^{(k)}
=
P_k^\top\operatorname{sg}(z_t),
$$

the activity loss shapes the projectors rather than the EMA encoder.

---

# 13. Preventing online encoder collapse

A different activity regularizer is applied to the online encoder representation.

For coordinate \(j\),

$$
\sigma_j^{\mathrm{enc}}
=
\sqrt{
\operatorname{Var}_{\mathcal B}[z_{c,j}]
+\epsilon
}.
$$

Then

$$
\boxed{
\mathcal L_{\mathrm{enc}}
=
\frac1d
\sum_{j=1}^{d}
\max
\left(
0,
\gamma_{\mathrm{enc}}
-
\sigma_j^{\mathrm{enc}}
\right).
}
$$

For token-valued encoders, the statistics are computed over valid context tokens.

This creates two distinct anti-collapse mechanisms:

$$
\mathcal L_{\mathrm{fac}}
\rightarrow
\text{factor-coordinate activity},
$$

$$
\mathcal L_{\mathrm{enc}}
\rightarrow
\text{online representation activity}.
$$

The separation matters because the stop-gradient boundary prevents the factor loss from supplying a direct anti-collapse gradient to the target encoder.

---

# 14. A subtle failure mode of variance regularization

Variance floors are not complete collapse-recovery mechanisms.

Consider a coordinate for which every sample is exactly equal:

$$
z_i=c.
$$

Then

$$
\operatorname{Var}(z)=0.
$$

Although its activity penalty is positive,

$$
\gamma-\sqrt{\epsilon}>0,
$$

the derivative of the variance at the exactly symmetric collapsed state is zero:

$$
\frac{\partial\operatorname{Var}(z)}
{\partial z_i}
=0.
$$

Therefore the activity penalty can itself have zero gradient at exact collapse.

The practical conclusion is:

$$
\boxed{
\text{variance regularization prevents near-collapse more reliably than it escapes exact symmetric collapse.}
}
$$

Nondegenerate initialization and predictive asymmetry remain important.

---

# 15. The complete objective

JEPA-Anything combines the four terms as

$$
\boxed{
\mathcal L_{\mathrm{OPF}}
=
\mathcal L_{\mathrm{pred}}
+
\lambda_{\mathrm{orth}}
\mathcal L_{\mathrm{orth}}
+
\lambda_{\mathrm{fac}}
\mathcal L_{\mathrm{fac}}
+
\lambda_{\mathrm{enc}}
\mathcal L_{\mathrm{enc}}.
}
\tag{10}
$$

A domain need not discard its original objective. If it already has

$$
\mathcal L_{\mathrm{base}}^{(\delta)},
$$

then the training objective is

$$
\boxed{
\mathcal L^{(\delta)}
=
\mathcal L_{\mathrm{base}}^{(\delta)}
+
\mathcal L_{\mathrm{OPF}}.
}
$$

This additive construction is one reason the framework can be placed across very different existing systems.

---

# 16. Replication-level training algorithm

A faithful implementation can be organized as follows.

**Inputs**

$$
\mathcal D_\delta,
\mathcal A_\delta,
\mathcal V_\delta,
f_\theta,
f_{\bar\theta},
\{P_k\}_{k=1}^K,
\{q_k\}_{k=1}^K.
$$

**Initialize**

$$
\bar\theta\leftarrow\theta.
$$

For every optimization step:

$$
\begin{aligned}
&\textbf{1. Sample observation:}
&&x\sim\mathcal D_\delta.
\\[1mm]
&\textbf{2. Construct structured state:}
&&(H,S)\leftarrow\mathcal A_\delta(x).
\\[1mm]
&\textbf{3. Select predictive relation:}
&&(H_C,S_C,T,S_T)
\leftarrow
\mathcal V_\delta(H,S).
\\[1mm]
&\textbf{4. Encode context:}
&&z_c\leftarrow f_\theta(H_C,S_C).
\\[1mm]
&\textbf{5. Encode target:}
&&z_t\leftarrow
f_{\bar\theta}(H,S)_T.
\\[1mm]
&\textbf{6. Stop teacher gradient:}
&&\widetilde z_t
\leftarrow
\operatorname{sg}(z_t).
\\[1mm]
&\textbf{7. Analyze target:}
&&z_t^{(k)}
\leftarrow
P_k^\top\widetilde z_t
\quad
\forall k.
\\[1mm]
&\textbf{8. Predict factors:}
&&\widehat z_t^{(k)}
\leftarrow
q_k(z_c,s_t)
\quad
\forall k.
\\[1mm]
&\textbf{9. Evaluate prediction:}
&&\mathcal L_{\mathrm{pred}}
\leftarrow
\operatorname{MSE}
(
\widehat z_t^{(k)},
z_t^{(k)}
).
\\[1mm]
&\textbf{10. Audit factor geometry:}
&&\mathcal L_{\mathrm{orth}}
\leftarrow
\operatorname{GramPenalty}(P_1,\ldots,P_K).
\\[1mm]
&\textbf{11. Maintain target activity:}
&&\mathcal L_{\mathrm{fac}}
\leftarrow
\operatorname{Activity}
(
\{z_t^{(k)}\}
).
\\[1mm]
&\textbf{12. Maintain encoder activity:}
&&\mathcal L_{\mathrm{enc}}
\leftarrow
\operatorname{Activity}(z_c).
\\[1mm]
&\textbf{13. Form objective:}
&&\mathcal L
\leftarrow
\mathcal L_{\mathrm{base}}
+
\mathcal L_{\mathrm{OPF}}.
\\[1mm]
&\textbf{14. Gradient update:}
&&
(\theta,P,q)
\leftarrow
\operatorname{OptimizerStep}
(\nabla\mathcal L).
\\[1mm]
&\textbf{15. Teacher update:}
&&
\bar\theta
\leftarrow
m\bar\theta+(1-m)\theta.
\end{aligned}
$$

For operational prediction,

$$
\widehat u_t
=
\operatorname{Concat}_k
\widehat z_t^{(k)}
$$

followed by

$$
\widehat z_t
=
(P^\top)^\dagger
\widehat u_t.
$$

This reproduces the paper's shared six-stage training logic: adaptation, context-target sampling, online/EMA encoding, factor prediction, online/projector/predictor optimization, and EMA update.

---

# 17. Two distinct deployment modes

The paper makes an important distinction between **representation mode** and **world-model mode**.

## Representation mode

After pretraining, the online encoder may be retained while the EMA encoder, projectors, and prediction heads are discarded.

A downstream task uses

$$
\boxed{
h_{\delta,\tau}(x)
=
R_{\delta,\tau}
\left(
f_\theta^\delta(
\mathcal A_\delta(x)
)
\right).
}
\tag{11}
$$

OPF then acts as a training-time pressure that shapes a reusable representation.

## Operational world-model mode

For planning, forecasting, intervention prediction, or rollout, retain

$$
f_\theta,\quad
P,\quad
q_1,\ldots,q_K.
$$

Then repeated synthesis defines a latent dynamical model:

$$
z_t
\rightarrow
\widehat z_{t+1}
\rightarrow
\widehat z_{t+2}
\rightarrow
\cdots.
$$

The experiments explicitly evaluate both kinds of use.

---

# 18. Extending OPF toward embodied sequential learning

Everything from this point through the end of this section is a **derived research direction**, not a claim about what the JEPA-Anything paper has already demonstrated.

The most consequential extension is an embodied agent that continuously receives observations, executes actions, and learns the predictive structure of the environment.

The natural state is no longer a static sample \(x\), but an interaction trajectory

$$
\tau=
(o_0,a_0,o_1,a_1,\ldots,o_T).
$$

For robotics, define

$$
o_t=
(
v_t,
p_t,
h_t,
\ell
),
$$

where

$$
v_t=\text{visual observation},
$$

$$
p_t=\text{proprioceptive state},
$$

$$
h_t=\text{optional force/tactile/history state},
$$

and

$$
\ell=\text{language instruction or task specification}.
$$

The executed control is

$$
a_t.
$$

A multimodal observation adapter produces tokens

$$
X_t
=
\mathcal A_{\mathrm{robot}}
(
v_t,p_t,h_t,\ell
).
$$

The encoder forms

$$
z_t=f_\theta(X_{\leq t}).
$$

Now treat action as an exogenous intervention:

$$
\xi_t=a_t.
$$

The factor predictors become

$$
\boxed{
\widehat z_{t+1}^{(k)}
=
q_k(z_t,a_t,\ell).
}
\tag{12}
$$

The next latent state is

$$
\boxed{
\widehat z_{t+1}
=
(P^\top)^\dagger
\begin{bmatrix}
\widehat z_{t+1}^{(1)}\\
\vdots\\
\widehat z_{t+1}^{(K)}
\end{bmatrix}.
}
\tag{13}
$$

This yields an action-conditioned latent simulator.

---

# 19. Why this is potentially useful for VLA systems

A conventional vision-language-action system often solves a direct mapping of the form

$$
(v_{\leq t},p_{\leq t},\ell)
\rightarrow
a_t.
$$

Such a policy can become very capable without explicitly representing the consequences of alternative actions.

An OPF-style world-model layer changes the computational graph:

$$
\text{observation}
\rightarrow
z_t
$$

$$
(z_t,a_t)
\rightarrow
\widehat z_{t+1}
$$

$$
(\widehat z_{t+1},\ell)
\rightarrow
\text{utility / action selection}.
$$

Instead of asking only

$$
\text{“what action should I emit?”}
$$

the system can ask

$$
\boxed{
\text{“what state would each candidate action produce?”}
}
$$

before committing to control.

For a horizon \(H\),

$$
\widehat z_{t+h+1}
=
F_{\mathrm{OPF}}
(
\widehat z_{t+h},
a_{t+h}
),
$$

where

$$
F_{\mathrm{OPF}}
=
(P^\top)^\dagger
\circ
Q.
$$

Candidate action sequences

$$
A=
(a_t,\ldots,a_{t+H-1})
$$

can be evaluated with

$$
J(A)
=
\sum_{h=1}^{H}
R_\phi(
\widehat z_{t+h},
\ell
).
$$

Planning then becomes

$$
\boxed{
A^\star
=
\arg\max_A J(A).
}
$$

This converts the predictive representation into an internal latent simulator.

---

# 20. A practical robotic architecture

A principled embodied implementation can be decomposed into six modules.

### Observation adapter

$$
\mathcal A:
(v_t,p_t,h_t,\ell)
\rightarrow
X_t.
$$

Its job is modality normalization, spatial/temporal indexing, and sensor validity handling.

### Context encoder

$$
f_\theta:
X_{\leq t}
\rightarrow
z_t.
$$

For long trajectories, this should usually operate on bounded memory rather than the entire raw history.

### OPF analysis

$$
u_t=P^\top z_t.
$$

This creates

$$
u_t=
(u_t^{(1)},\ldots,u_t^{(K)}).
$$

### Action-conditioned factor dynamics

$$
\widehat u_{t+1}^{(k)}
=
q_k(
z_t,a_t,\ell
).
$$

### Synthesis

$$
\widehat z_{t+1}
=
(P^\top)^\dagger
\widehat u_{t+1}.
$$

### Action policy or planner

$$
\pi:
(z_t,\ell,\widehat{\mathcal T})
\rightarrow
a_t,
$$

where \(\widehat{\mathcal T}\) denotes imagined trajectories generated by the learned world model.

The crucial design choice is to keep

$$
\text{world prediction}
$$

separate from

$$
\text{task utility}.
$$

The world model learns what actions do.

The policy or reward model determines which consequences are desirable.

---

# 21. Sequential self-learning requires more than one-step prediction

A robot operating continuously should not optimize only

$$
\widehat z_{t+1}\approx z_{t+1}.
$$

One-step error can remain small while autoregressive rollouts drift rapidly.

A stronger sequential objective uses multiple horizons:

$$
\widehat z_{t+h}
=
F_{\mathrm{OPF}}^{(h)}
(
z_t,
a_{t:t+h-1}
).
$$

Define

$$
\mathcal L_{\mathrm{multi}}
=
\sum_{h=1}^{H}
w_h
\left\|
\widehat z_{t+h}
-
\operatorname{sg}
(z_{t+h})
\right\|_2^2.
$$

More faithfully to OPF, perform this in factor coordinates:

$$
\boxed{
\mathcal L_{\mathrm{multi}}
=
\sum_{h=1}^{H}
w_h
\sum_{k=1}^{K}
\left\|
\widehat z_{t+h}^{(k)}
-
P_k^\top
\operatorname{sg}(z_{t+h})
\right\|_2^2.
}
\tag{14}
$$

This directly trains the model against compounding rollout error.

---

# 22. Learning the world continuously

For lifelong embodied learning, interaction produces an online stream

$$
\mathcal S
=
\{
(o_t,a_t,o_{t+1})
\}_{t=0}^\infty.
$$

Naively updating on only the most recent transition creates catastrophic forgetting.

A practical system therefore requires a memory distribution

$$
\mathcal M_t
$$

containing selected past transitions or compressed episodes.

Training samples from a mixture

$$
\mathcal B_t
\sim
\alpha
\mathcal D_{\mathrm{recent}}
+
(1-\alpha)
\mathcal M_t.
$$

The OPF update becomes

$$
\theta_{t+1},P_{t+1},Q_{t+1}
=
\operatorname{Update}
(
\theta_t,P_t,Q_t;
\mathcal B_t
).
$$

For a genuinely continual system, memory selection should prioritize at least four classes:

$$
\text{novel states},
$$

$$
\text{high prediction-error transitions},
$$

$$
\text{rare interventions},
$$

$$
\text{historically important states susceptible to forgetting}.
$$

This is where OPF becomes particularly interesting.

Prediction error can be measured factor-wise:

$$
e_t^{(k)}
=
\|
\widehat z_{t+1}^{(k)}
-
z_{t+1}^{(k)}
\|_2^2.
$$

Thus the system can identify **which predictive component failed**, rather than only knowing that a total state prediction was wrong.

---

# 23. Surprise as a learning signal

Define factor-wise predictive surprise

$$
s_t^{(k)}
=
\left\|
\widehat z_{t+1}^{(k)}
-
z_{t+1}^{(k)}
\right\|_2^2.
$$

Aggregate surprise may be

$$
S_t
=
\sum_{k=1}^{K}
\alpha_k s_t^{(k)}.
$$

Transitions with

$$
S_t>\tau
$$

can be given higher replay priority.

But the factor structure enables a more informative policy.

Suppose

$$
s_t^{(3)}
\gg
s_t^{(1)},s_t^{(2)},s_t^{(4)}.
$$

The environment may not be globally unfamiliar. Instead, a specific predictive subspace has encountered a regime not represented by the current model.

This can drive targeted exploration.

Choose actions according to

$$
a_t^\star
=
\arg\max_a
\left[
R(z_t,a)
+
\beta
U(z_t,a)
\right],
$$

where \(U\) measures expected learning value.

One possible OPF-based uncertainty term is

$$
U(z_t,a)
=
\sum_k
\operatorname{Var}_{m\in\mathcal E}
\left[
q_{k,m}(z_t,a)
\right],
$$

using an ensemble of predictive heads or world models.

The agent then actively visits regions in which its world model is uncertain.

That turns OPF into part of an active system-identification loop:

$$
\boxed{
\text{observe}
\rightarrow
\text{predict}
\rightarrow
\text{act}
\rightarrow
\text{measure surprise}
\rightarrow
\text{update}
\rightarrow
\text{explore}.
}
$$

---

# 24. From a world model to a real-time simulator

A learned simulator does not necessarily need to reconstruct RGB frames.

If planning can operate in latent space, simulation becomes

$$
(z_t,a_t)
\rightarrow
\widehat z_{t+1}.
$$

Repeated application gives

$$
\widehat{\tau}_z
=
(
z_t,
\widehat z_{t+1},
\ldots,
\widehat z_{t+H}
).
$$

This avoids expensive high-dimensional rendering during every planning step.

A decoder

$$
D:
z_t\rightarrow\widehat o_t
$$

is required only if humans, perception modules, or auxiliary losses need observable-space reconstruction.

The core simulator can remain latent:

$$
\boxed{
\text{sensor space}
\rightarrow
\text{predictive latent space}
\rightarrow
\text{internal rollout}
\rightarrow
\text{action}.
}
$$

For robotics this can reduce the simulation state from millions of visual values to a much smaller world-state representation.

The main risk is predictive insufficiency: information irrelevant to the JEPA loss but crucial to control may disappear. That must be evaluated task by task.

---

# 25. Multi-timescale OPF for embodied systems

Real environments contain dynamics at very different timescales.

A robotic manipulation episode may simultaneously involve

$$
\text{millisecond contact dynamics},
$$

$$
\text{arm motion},
$$

$$
\text{object configuration},
$$

$$
\text{task-stage progression},
$$

$$
\text{long-term goal state}.
$$

Flat OPF does not explicitly assign timescales.

A natural extension is hierarchical factorization:

$$
\mathbb R^d
=
\mathcal U_{\mathrm{fast}}
\oplus
\mathcal U_{\mathrm{medium}}
\oplus
\mathcal U_{\mathrm{slow}}.
$$

Then each high-level subspace may itself be decomposed:

$$
\mathcal U_{\mathrm{slow}}
=
\mathcal U_{\mathrm{task}}
\oplus
\mathcal U_{\mathrm{object}}
\oplus
\mathcal U_{\mathrm{environment}}.
$$

Predictor horizons can be factor dependent:

$$
q_k:
(z_t,a_{t:t+h_k})
\rightarrow
z_{t+h_k}^{(k)}.
$$

The hypothesis would be that different factors specialize according to predictive timescale without imposing semantic labels beforehand.

That hypothesis would require empirical validation; orthogonality alone does not guarantee such specialization.

---

# 26. Language should condition prediction, not replace world structure

For a VLA system, language \(\ell\) introduces another issue.

A command such as

> place the red component into the left fixture

changes which future states matter, but it does not change the underlying physical dynamics.

A clean decomposition is therefore

$$
F_{\mathrm{world}}
(z_t,a_t)
\rightarrow
z_{t+1},
$$

while language conditions action selection or goal evaluation:

$$
R_\phi(z,\ell).
$$

Some tasks do require language-conditioned state interpretation, so a more general predictor can use

$$
q_k(z_t,a_t,\ell).
$$

But mixing task semantics directly into every physical transition creates a risk:

$$
\text{world dynamics}
\approx
\text{instruction-conditioned shortcut}.
$$

For general robotic intelligence, the preferred inductive bias is often:

$$
\boxed{
\text{model the world as task-independently as possible;
condition planning on the task.}
}
$$

---

# 27. Physical interpretation

OPF has a useful analogy to modal analysis.

A physical state may be expanded as

$$
x=
\sum_i
a_i\phi_i,
$$

where \(\phi_i\) are basis modes.

OPF similarly writes

$$
z
=
\sum_k
P_kP_k^\top z
$$

under exact orthogonality.

The difference is fundamental.

Physical modes are often derived from governing equations, eigenvalue problems, symmetries, or measured system responses.

OPF modes are learned because they improve predictive learning.

Therefore

$$
\boxed{
\text{OPF factor}
\not\equiv
\text{physical eigenmode}.
}
$$

The correct statement is weaker:

$$
\text{OPF constructs a learned predictive coordinate basis that can sometimes align with physical structure.}
$$

The orbital experiment is particularly interesting because learned factor coordinates recover a scaling exponent close to the Keplerian law, with a reported fitted slope of \(-1.4991\). That is evidence that useful physical regularities can become accessible through the factor interface, not proof that every OPF factor corresponds to a fundamental physical variable.

---

# 28. A Parseval-like view of predictive state

Exact orthogonality gives

$$
\|z\|_2^2
=
\sum_k
\|P_k^\top z\|_2^2.
$$

This resembles Parseval's identity.

Define

$$
E_z=\|z\|_2^2
$$

and

$$
E_k=
\|P_k^\top z\|_2^2.
$$

Then

$$
E_z=\sum_kE_k.
$$

This provides a clean intuition:

> latent magnitude is partitioned across mutually orthogonal predictive subspaces.

But \(E_z\) is not automatically mechanical or thermodynamic energy.

The analogy is geometric, not physical.

---

# 29. Cognitive interpretation

A useful cognitive interpretation is predictive decomposition.

The online encoder constructs an internal representation of the current situation:

$$
f_\theta
\rightarrow
\text{current internal state}.
$$

The EMA encoder provides a slowly evolving representational target:

$$
f_{\bar\theta}
\rightarrow
\text{stable reference state}.
$$

OPF decomposes a future or hidden state into several complementary predictive coordinates:

$$
P_k^\top
\rightarrow
\text{predictive decomposition}.
$$

Dedicated predictors infer those consequences:

$$
q_k
\rightarrow
\text{parallel predictive processes}.
$$

Synthesis binds them back into one state:

$$
(P^\top)^\dagger
\rightarrow
\text{integration}.
$$

The computational loop resembles

$$
\boxed{
\text{perceive}
\rightarrow
\text{form state}
\rightarrow
\text{anticipate complementary consequences}
\rightarrow
\text{integrate}.
}
$$

This is a useful systems analogy.

It is not evidence that the architecture reproduces biological cognition.

---

# 30. What the method teaches about representation learning

Several broader observations follow.

## Prediction can define the coordinate system

Traditional representation learning often first constructs a representation and then learns how to predict with it.

OPF couples the two:

$$
\text{representation geometry}
\leftrightarrow
\text{predictive objective}.
$$

The coordinate system itself is optimized according to what can be predicted.

This suggests a more general principle:

$$
\boxed{
\text{the useful basis of a world state may be defined by predictive structure rather than by reconstruction fidelity.}
}
$$

## Completeness and specialization need not be opposites

Factorized representations often risk losing information.

OPF avoids this in its idealized geometry because

$$
Kr=d
$$

and

$$
P
$$

forms a full orthogonal basis.

The system can therefore have both

$$
\text{specialized prediction pathways}
$$

and

$$
\text{complete state reconstruction}.
$$

## Structured diversity is stronger than head multiplicity

Having \(K\) heads does not imply \(K\) different functions.

Without constraints,

$$
q_1,\ldots,q_K
$$

can converge toward redundant representations.

OPF imposes diversity at the level of the target subspaces themselves.

---

# 31. What it does not solve

Several claims should not be inferred from the architecture.

Orthogonality does not imply semantic disentanglement:

$$
P_i^\top P_j=0
\not\Rightarrow
\text{factor }i
\text{ has a unique human-interpretable meaning}.
$$

Orthogonality does not imply statistical independence:

$$
P_i^\top P_j=0
\not\Rightarrow
I(z^{(i)};z^{(j)})=0.
$$

It does not establish causal factors.

It does not eliminate shared-backbone gradient conflict.

It does not guarantee that the target encoder preserves every variable required by every future task.

And it does not make domain-specific observation design disappear.

The repository explicitly emphasizes that factor meaning must be established experimentally rather than inferred from the factor index.

---

# 32. Scaling limitations

The complete learned analysis matrix is

$$
P\in\mathbb R^{d\times d}.
$$

Its parameter count is therefore

$$
\boxed{d^2.}
$$

Factor analysis using a dense matrix is also approximately

$$
O(d^2)
$$

per state.

Generic pseudoinverse computation is substantially more expensive and, if repeatedly recomputed naively, can approach

$$
O(d^3).
$$

This is manageable for the latent widths explored in the paper, such as configurations including \(128;4\times32\), \(160;5\times32\), \(384;4\times96\), \(512;4\times128\), and \(768;4\times192\).

It becomes less attractive if applied directly to hidden states of tens of thousands of dimensions.

A scalable large-model variant should therefore probably use a compact predictive bottleneck:

$$
h_t\in\mathbb R^D,
$$

$$
z_t=W_{\mathrm{down}}h_t,
\qquad
z_t\in\mathbb R^{d_w},
$$

with

$$
d_w\ll D.
$$

Run OPF in \(d_w\)-space, then map back if required:

$$
\widehat h_t
=
W_{\mathrm{up}}\widehat z_t.
$$

The factorization then scales with

$$
d_w^2
$$

rather than

$$
D^2.
$$

---

# 33. Structured orthogonal parameterization is an obvious next systems problem

If exact orthogonality were maintained structurally,

$$
P^\top P=I,
$$

then synthesis becomes simply

$$
(P^\top)^\dagger=P.
$$

The generic pseudoinverse disappears.

One possible research direction is to represent \(P\) through products of orthogonal transformations, for example Householder or Givens transformations:

$$
P=
\prod_{\ell=1}^{L}
H_\ell
$$

or

$$
P=
\prod_{\ell=1}^{L}
G_\ell.
$$

Alternatively one could optimize directly on an orthogonal/Stiefel manifold.

The public implementation already exposes QR-based geometry mechanisms, but scalable structured parameterization is a further architectural question rather than a result demonstrated by the paper. The repository's public scope is primarily the reusable core, design tooling, diagnostics, and structural example.

---

# 34. A principled research standard for extending JEPA-Anything

A new implementation should not be evaluated only by downstream accuracy.

At minimum, measure five layers.

### Representation activity

$$
\min_j
\operatorname{Std}(z_{c,j})
$$

and

$$
\min_{k,j}
\operatorname{Std}(z_{t,j}^{(k)}).
$$

### Geometry

Measure

$$
\|P^\top P-I\|_F,
$$

$$
\sigma_{\min}(P),
$$

and

$$
\kappa_2(P).
$$

### Predictive quality

Evaluate

$$
\mathcal L_{\mathrm{pred}}
$$

per factor, not only globally.

### Operational stability

For a rollout horizon \(H\),

$$
E(H)
=
\|
\widehat z_{t+H}
-z_{t+H}
\|.
$$

Evaluate error-growth curves rather than a single horizon.

### Semantic or scientific interpretation

A factor interpretation should survive intervention.

If factor \(k\) is claimed to represent property \(c\), perturbing \(c\) should systematically alter that factor under controlled experiments.

Representation visualization is insufficient.

---

# 35. Required ablations for a serious OPF study

A strong experimental protocol should compare:

$$
\text{standard JEPA},
$$

$$
\text{capacity-matched unconstrained multi-head JEPA},
$$

and

$$
\text{OPF}.
$$

Then remove each structural component:

$$
\lambda_{\mathrm{orth}}=0,
$$

$$
\lambda_{\mathrm{fac}}=0,
$$

$$
\lambda_{\mathrm{enc}}=0.
$$

Sweep

$$
K\in\{1,2,4,8,\ldots\}
$$

while keeping

$$
Kr=d.
$$

For sequential tasks measure at least

$$
H=1,\ 5,\ 10,\ 20,\ 50,\ldots
$$

rather than reporting only one-step prediction.

For robotics additionally test:

$$
\text{ID dynamics},
$$

$$
\text{OOD objects},
$$

$$
\text{OOD action sequences},
$$

$$
\text{new intervention combinations},
$$

$$
\text{new goals},
$$

and

$$
\text{sensor corruption}.
$$

---

# 36. Falsification is as important as confirmation

The hypothesis is not

$$
\text{orthogonality is aesthetically desirable}.
$$

The hypothesis is that organizing predictive capacity into complementary, well-conditioned subspaces improves useful learning.

Therefore a meaningful falsification condition is:

$$
\|P^\top P-I\|\downarrow,
$$

$$
\kappa(P)\rightarrow1,
$$

while

$$
\text{OOD accuracy},
$$

$$
\text{rollout stability},
$$

$$
\text{sample efficiency},
$$

and

$$
\text{transfer}
$$

remain unchanged relative to a matched unconstrained multi-head model.

Such a result would mean that good geometry by itself is insufficient.

Similarly, if increasing \(K\) improves orthogonality but degrades predictive performance, the environment may not support the imposed decomposition at that granularity.

This is the correct scientific standard for interpreting the architecture.

---

# 37. Advantages

The strongest advantage is the separation between domain geometry and predictive organization.

A vision system, physical simulator, biological state model, or robot can retain its own encoder while sharing the same factorized world-state abstraction. The paper evaluates that proposition across seven domains and reports improvements over matched JEPA baselines on all ten dynamics tasks considered, a 34.8% reduction in single-intervention error on Interventional Pong, and the lowest compared one-step and 100-step molecular errors across four molecular systems.

Second, OPF provides a mathematical completeness guarantee in the exact orthogonal limit.

Third, its conditioning argument gives a concrete reason for factor diversity beyond interpretability.

Fourth, the explicit factor interface enables diagnostics and controlled scientific analysis that are difficult to perform on a monolithic representation.

Fifth, the synthesized state is operational: it can be passed to a decoder, planner, or another transition step rather than being limited to a representation-learning objective.

---

# 38. Limitations

The factor semantics are not identifiable from geometry alone.

The requirement

$$
Kr=d
$$

imposes a complete fixed-width partition; this may not be optimal for systems whose predictive complexity is highly nonuniform.

Dense OPF has

$$
O(d^2)
$$

storage and analysis cost.

Generic synthesis can become expensive at large \(d\).

Factor and encoder variance penalties cannot, by themselves, reliably escape exact symmetric collapse.

Orthogonality does not remove all optimization interference because predictors may still share an encoder and trunk.

The target representation remains determined by the encoder. If the encoder discards task-critical state, OPF cannot reconstruct information that never entered \(z_t\).

For lifelong agents, OPF supplies no intrinsic solution to catastrophic forgetting, memory management, nonstationary data, safety constraints, or continual model validation. Those systems must be added.

Finally, the currently public repository does not provide the complete domain datasets and trained models needed to reproduce every quantitative result in the paper; it provides the core OPF implementation, design infrastructure, diagnostics, and a structural example.

---

# 39. Observation: the deeper architectural idea is predictive coordinate discovery

The most important conceptual observation is not that JEPA-Anything uses several predictors.

It is that **the coordinate system itself becomes part of the predictive optimization problem**.

Standard world modeling often assumes that the encoder should first produce a useful state and that dynamics should subsequently operate on that state.

OPF instead couples

$$
\text{state geometry},
$$

$$
\text{predictability},
$$

and

$$
\text{synthesis stability}.
$$

The representation is asked not only to be useful, but to admit a decomposition into complementary predictive directions that can be independently estimated and exactly recombined in the ideal limit.

This suggests a broader systems principle:

$$
\boxed{
\text{intelligence may benefit from learning not only what state to represent,
but in which coordinates future consequences become simplest to predict.}
}
$$

That idea is relevant well beyond the specific implementation.

---

# 40. Observation: the architecture resembles learned system identification

From a physical-systems perspective, OPF can be interpreted as searching for a coordinate transformation

$$
u=P^\top z
$$

in which predictive dynamics become easier to distribute across submodels.

Classical system identification often searches for state variables, modes, or transformations that make dynamics easier to characterize.

JEPA-Anything replaces explicit governing equations with predictive learning.

The object being optimized is therefore close in spirit to

$$
\boxed{
\text{a learned coordinate chart for predictive dynamics}.
}
$$

That makes the orbital result particularly meaningful: it tests whether regularities that exist in the physical system become visible in the learned factor coordinates.

---

# 41. Observation: this is compatible with, but not sufficient for, self-learning agents

For a continuously learning robot or autonomous agent, the desirable loop is

$$
\text{observe world}
\rightarrow
\text{construct state}
\rightarrow
\text{predict consequences}
\rightarrow
\text{act}
\rightarrow
\text{compare prediction with reality}
\rightarrow
\text{update world model}.
$$

JEPA-Anything directly addresses the middle of that loop:

$$
\text{construct predictive state}
\rightarrow
\text{factorize predictive capacity}
\rightarrow
\text{predict consequences}.
$$

It does not by itself solve:

$$
\text{exploration},
$$

$$
\text{memory},
$$

$$
\text{continual learning},
$$

$$
\text{policy optimization},
$$

$$
\text{task decomposition},
$$

or

$$
\text{safety}.
$$

Those are complementary mechanisms.

This distinction is important because a powerful world representation is not equivalent to a complete autonomous intelligence architecture.

---

# Conclusion

JEPA-Anything is best understood as a proposal about **how predictive state should be organized**.

The framework does not attempt to make images, molecules, clinical histories, weather fields, or robotic states look identical. It leaves the observation geometry where it belongs—in the domain adapter and encoder—and introduces a common latent requirement:

$$
\boxed{
\text{the future or hidden world state should be expressible as a complete set of complementary predictive factors.}
}
$$

Mathematically, the method learns

$$
P_1,\ldots,P_K
$$

such that

$$
P_k^\top P_k\approx I,
\qquad
P_i^\top P_j\approx0,
$$

projects the stopped target state into those coordinates,

$$
z_t^{(k)}
=
P_k^\top\operatorname{sg}(z_t),
$$

predicts each coordinate block,

$$
\widehat z_t^{(k)}
=
q_k(z_c,s_t),
$$

and synthesizes the state through

$$
\widehat z_t
=
(P^\top)^\dagger
\operatorname{Concat}_k
\widehat z_t^{(k)}.
$$

In the exact orthogonal limit the decomposition is complete, norm preserving, exactly invertible, and optimally conditioned:

$$
\|P^\top z\|_2=\|z\|_2,
$$

$$
z=\sum_kP_kP_k^\top z,
$$

$$
\kappa_2(P)=1.
$$

That is the real intellectual contribution.

For embodied AI, the architecture suggests a concrete next step: turn the factor predictors into action-conditioned transition operators and use their synthesized outputs as an internal simulator,

$$
(z_t,a_t)
\rightarrow
\widehat z_{t+1}
\rightarrow
\widehat z_{t+2}
\rightarrow\cdots.
$$

Combine that simulator with multimodal state estimation, language-conditioned goals, continual replay, uncertainty-driven exploration, multi-horizon prediction, and a planner, and OPF becomes one plausible component of a sequential learning architecture that learns the structure of its environment through interaction.

The stronger claim—that such factorized predictive state is a foundation for substantially more general intelligence—remains unproven.

The productive research question is narrower and experimentally decidable:

$$
\boxed{
\text{Can a learned, complete, well-conditioned predictive coordinate system
make continual world modeling more compositional,
more stable under rollout,
more transferable,
and easier to interrogate?}
}
$$

JEPA-Anything provides enough evidence to make that question worth testing, and enough mathematical structure to test it rigorously.
