# JEPA Architecture Reconstruction

**RESEARCH · PSEUDO-ALGORITHM · SOURCE-LOCKED**

**V-JEPA 2.1 × LeWorldModel**

$$
\texttt{[SOURCE-EXPLICIT]}
\quad
\texttt{[EQUATION-EXPLICIT]}
\quad
\texttt{[EXPERIMENT-REPORTED]}
\quad
\texttt{[MATHEMATICALLY-DERIVED]}
\quad
\texttt{[ARCHITECTURAL-INFERENCE]}
\quad
\texttt{[NOT-DISCLOSED]}
$$

---

## Algorithm 1 — End-to-End JEPA Architecture, Optimization, Dynamics, and Verification

### Require

$$
\mathcal S
=
\{
\text{V-JEPA 2.1},
\text{LeWorldModel}
\}
$$

$$
\mathcal T
=
\{
\texttt{SOURCE},
\texttt{EQUATION},
\texttt{EXPERIMENT},
\texttt{DERIVATION},
\texttt{INFERENCE},
\texttt{NOT\_DISCLOSED}
\}
$$

$$
\forall q:
\quad
q\notin\operatorname{Support}(\mathcal S)
\Longrightarrow
q\leftarrow\texttt{NOT\_DISCLOSED}
$$

$$
q=\texttt{NOT\_DISCLOSED}
\Longrightarrow
\operatorname{DoNotInstantiate}(q)
$$

$$
\operatorname{Derived}(q)
\Longrightarrow
q\leftarrow\texttt{MATHEMATICALLY\!-\!DERIVED}
$$

$$
\operatorname{Plausible}(q)
\land
\neg\operatorname{Demonstrated}(q)
\Longrightarrow
q\leftarrow\texttt{ARCHITECTURAL\!-\!INFERENCE}
$$

$$
\boxed{
\text{source fidelity}
>
\text{execution order}
>
\text{architectural completeness}
>
\text{mathematical minuteness}
}
$$

// Never instantiate undocumented mechanisms.

---

### Initialize canonical JEPA state

$$
X_C
\xrightarrow{E}
Z_C
$$

$$
Z_C
\xrightarrow{P(\cdot,C)}
\widehat Z_T
$$

$$
X_T
\xrightarrow{E_T}
Z_T
$$

$$
\mathcal L_{\text{JEPA}}
=
D(
\widehat Z_T,
Z_T
)
$$

$$
D(
\widehat Z_T,
Z_T
)
\rightarrow0
$$

subject to

$$
\neg
\left[
E(X)=c,\;
\forall X
\right]
$$

// Predict learned targets without representation collapse.

$$
\boxed{
X_C
\rightarrow
Z_C
\rightarrow
\widehat Z_T
\leftrightarrow
Z_T
\leftarrow
X_T
}
$$

---

### Resolve prediction topology

$$
\operatorname{Topology}
=
\begin{cases}
\mathsf{DenseMaskedLatentCompletion},
&
\text{V-JEPA 2.1}
\\[2mm]
\mathsf{ActionConditionedLatentDynamics},
&
\text{LeWorldModel}
\end{cases}
$$

#### V-JEPA 2.1

$$
y
\rightarrow
x=\operatorname{Mask}(y)
$$

$$
Z_C
=
E_\theta(x)
$$

$$
\widehat Z
=
P_\phi(
E_\theta(x),
\Delta_M
)
$$

$$
Z_T
=
\operatorname{sg}
\left(
E_{\bar\theta}(y)
\right)
$$

// Target is clean-view latent geometry.

#### LeWorldModel

$$
(o_t,a_t,o_{t+1})
\rightarrow
(z_t,a_t,z_{t+1})
$$

$$
z_t
=
E_\theta(o_t)
$$

$$
\widehat z_{t+1}
=
P_\phi(z_t,a_t)
$$

$$
z_{t+1}
=
E_\theta(o_{t+1})
$$

// Target is next-observation latent state.

$$
\boxed{
\text{JEPA}
\neq
\text{one universal prediction topology}
}
$$

---

# Phase I — V-JEPA 2.1

### Input

$$
y
\in
\begin{cases}
\mathbb R^{B\times T\times H\times W\times3},
&
\text{video}
\\
\mathbb R^{B\times H\times W\times3},
&
\text{image}
\end{cases}
$$

$$
E_\theta
=
\text{context encoder}
$$

$$
E_{\bar\theta}
=
\text{EMA target encoder}
$$

$$
P_\phi
=
\text{latent predictor}
$$

$$
S
=
\{
\ell_1,\ell_2,\ell_3,\ell_4
\}
$$

For reported ViT-G,

$$
S
=
\{12,24,36,48\}
$$

---

### Native-modality tokenization

#### If video

$$
(\tau,p_h,p_w)
=
(2,16,16)
$$

$$
U
\leftarrow
\operatorname{Conv3D}_{2\times16\times16}(y)
$$

$$
N_T
=
\frac{T}{2}
$$

$$
N_H
=
\frac{H}{16}
$$

$$
N_W
=
\frac{W}{16}
$$

$$
N
=
N_TN_HN_W
=
\frac{T}{2}
\frac{H}{16}
\frac{W}{16}
$$

$$
U
\in
\mathbb R^{B\times N\times D}
$$

For primary training,

$$
(T,H,W)
=
(16,256,256)
$$

$$
N
=
8\times16\times16
=
2048
$$

For cooldown,

$$
(T,H,W)
=
(64,384,384)
$$

$$
N
=
32\times24\times24
=
18\,432
$$

// Video tokens preserve tubelet coordinates.

#### Else image

$$
U
\leftarrow
\operatorname{Conv2D}_{16\times16}(y)
$$

For primary training,

$$
(H,W)
=
(256,256)
$$

$$
N
=
16^2
=
256
$$

For cooldown,

$$
(H,W)
=
(512,512)
$$

$$
N
=
32^2
=
1024
$$

// Image tokens preserve patch coordinates.

---

### Inject modality and position information

$$
U
\leftarrow
\operatorname{ApplyModalityEmbedding}(U)
$$

$$
U
\leftarrow
\operatorname{Apply3DRoPE}(U)
$$

// Coordinates remain available to the predictor.

---

### Construct masked and visible partitions

$$
M
\sim
\mathcal D_{\text{mask}}
$$

$$
C
=
\{1,\ldots,N\}
\setminus M
$$

$$
C\cup M
=
\{1,\ldots,N\}
$$

$$
C\cap M
=
\varnothing
$$

$$
U_C
=
\{
u_i:i\in C
\}
$$

// Context encoder receives visible tokens only.

---

### Encode visible context

$$
\{
Z_C^{(\ell)}
\}_{\ell\in S}
\leftarrow
E_\theta(U_C)
$$

$$
Z_C^{(\ell)}
\in
\mathbb R^{B\times|C|\times D_\ell}
$$

---

### Fuse multi-level context representations

$$
\widetilde Z_C
=
\operatorname{Concat}_{D}
\left[
Z_C^{(\ell_1)},
Z_C^{(\ell_2)},
Z_C^{(\ell_3)},
Z_C^{(\ell_4)}
\right]
$$

$$
Z_C^{\text{fused}}
=
F_{\text{MLP}}
(
\widetilde Z_C
)
$$

// Multiple encoder depths supervise final representation geometry.

---

### Construct positional mask tokens

$$
\Delta_M
=
\{
\delta_i:i\in M
\}
$$

$$
Q
=
[
Z_C^{\text{fused}};
\Delta_M
]
$$

// Mask tokens identify missing spatial-temporal locations.

---

### Execute predictor

$$
\{
\widehat Z^{(\ell)}
\}_{\ell\in S}
\leftarrow
P_\phi(Q)
$$

Reported predictor configuration:

$$
L_P
=
24
$$

$$
D_P
=
384
$$

// Predictor emits corresponding multi-level latent targets.

---

### Execute clean target branch

$$
\{
\bar Z^{(\ell)}
\}_{\ell\in S}
\leftarrow
E_{\bar\theta}(U)
$$

$$
Z_T^{(\ell)}
=
\operatorname{sg}
\left(
\bar Z^{(\ell)}
\right)
$$

$$
\frac{
\partial Z_T^{(\ell)}
}{
\partial\bar\theta
}
\Bigg|_{\text{backprop}}
=
0
$$

// Target branch receives no loss gradient.

---

### Compute masked-location prediction loss

For every

$$
\ell\in S
$$

define

$$
r_{i,M}^{(\ell)}
=
\widehat z_i^{(\ell)}
-
\operatorname{sg}
\left(
\bar z_i^{(\ell)}
\right)
$$

for

$$
i\in M
$$

and compute

$$
\boxed{
\mathcal L_{\text{predict}}^{(\ell)}
=
\frac1{|M|}
\sum_{i\in M}
\left\|
r_{i,M}^{(\ell)}
\right\|_1
}
$$

// Hidden positions predict clean target latents.

---

### Compute distance-weighted context supervision

For every

$$
i\in C
$$

compute

$$
d_{\min}(i,M)
=
\operatorname{NearestMaskedBlockDistance}(i,M)
$$

$$
\boxed{
\lambda_i
=
\frac{\lambda}
{\sqrt{d_{\min}(i,M)}}
}
$$

with

$$
\lambda
=
\begin{cases}
0.5,
&
\text{video}
\\
0.7,
&
\text{image}
\end{cases}
$$

Define

$$
r_{i,C}^{(\ell)}
=
\widehat z_i^{(\ell)}
-
\operatorname{sg}
\left(
\bar z_i^{(\ell)}
\right)
$$

and compute

$$
\boxed{
\mathcal L_{\text{ctx}}^{(\ell)}
=
\frac1{|C|}
\sum_{i\in C}
\lambda_i
\left\|
r_{i,C}^{(\ell)}
\right\|_1
}
$$

// Visible tokens remain aligned with clean local representations.

---

### Form dense multi-level objective

For every

$$
\ell\in S
$$

$$
\mathcal L_{\text{dense}}^{(\ell)}
=
\mathcal L_{\text{predict}}^{(\ell)}
+
\mathcal L_{\text{ctx}}^{(\ell)}
$$

$$
\boxed{
\mathcal L_{\text{V-JEPA}}
=
\operatorname{Aggregate}_{\ell\in S}
\left[
\mathcal L_{\text{dense}}^{(\ell)}
\right]
}
$$

$$
\{
\alpha_\ell
\}_{\ell\in S}
=
\texttt{[NOT-DISCLOSED]}
$$

// Never invent independent inter-level coefficients.

---

### Propagate gradients

$$
\frac{
\partial\mathcal L_{\text{V-JEPA}}
}{
\partial\phi
}
\neq0
$$

$$
\frac{
\partial\mathcal L_{\text{V-JEPA}}
}{
\partial\theta
}
\neq0
$$

$$
\left.
\frac{
\partial\mathcal L_{\text{V-JEPA}}
}{
\partial\bar\theta
}
\right|_{\text{backprop}}
=
0
$$

$$
g_\theta
=
\nabla_\theta
\mathcal L_{\text{V-JEPA}}
$$

$$
g_\phi
=
\nabla_\phi
\mathcal L_{\text{V-JEPA}}
$$

// Context and predictor branches learn directly.

---

### Update trainable branch

$$
(\theta,\phi)
\leftarrow
\operatorname{OptimizerStep}
(
\theta,\phi;
g_\theta,g_\phi
)
$$

---

### Update target branch

$$
\bar\theta
\leftarrow
m\bar\theta
+
(1-m)\theta
$$

with

$$
m
=
0.99925
$$

// EMA produces slower target evolution.

Thus

$$
\boxed{
\text{fast context/predictor adaptation}
\parallel
\text{slow target evolution}
}
$$

---

### Repeat V-JEPA optimization

$$
k
=
1,\ldots,135\,000
$$

for primary training.

Then

$$
k
=
1,\ldots,12\,000
$$

for high-resolution cooldown.

// Training schedule changes resolution after primary optimization.

---

### Verify dense supervision topology

Masked locations satisfy

$$
i\in M
\Longrightarrow
\widehat z_i^{(\ell)}
\approx
\bar z_i^{(\ell)}
$$

Visible locations satisfy

$$
i\in C
\Longrightarrow
\widehat z_i^{(\ell)}
\approx
\bar z_i^{(\ell)}
$$

Therefore

$$
\boxed{
\forall i\in M\cup C:
\quad
\widehat z_i^{(\ell)}
\approx
\bar z_i^{(\ell)}
}
$$

and

$$
\lambda_i
\propto
\frac1{\sqrt{d_{\min}(i,M)}}
$$

implies

$$
\boxed{
\text{masked regions}
\leftrightarrow
\text{nearby visible regions}
}
$$

// Dense supervision constrains spatial-temporal token identity.

---

### Record controlled V-JEPA ablation trajectory

Define

$$
m
=
(
\text{IN1K},
\text{SSv2},
\text{NYU-RMSE},
\text{ADE20K-mIoU}
)
$$

Baseline:

$$
m_0
=
(
82.2,
72.8,
0.682,
22.2
)
$$

Add context loss:

$$
m_1
=
(
72.6,
62.5,
0.474,
33.8
)
$$

Add multi-level prediction:

$$
m_2
=
(
80.8,
72.1,
0.463,
38.6
)
$$

Add VisionMix:

$$
m_3
=
(
81.6,
72.6,
0.418,
40.8
)
$$

Add multimodal tokenizer:

$$
m_4
=
(
81.6,
72.6,
0.415,
41.4
)
$$

Scale model:

$$
m_5
=
(
84.8,
76.1,
0.365,
47.1
)
$$

Apply cooldown:

$$
m_6
=
(
85.5,
77.7,
0.307,
47.9
)
$$

Infer only

$$
\mathcal L_{\text{ctx}}
\Longrightarrow
\text{large dense-task improvement}
$$

and initially

$$
\mathcal L_{\text{ctx}}
\Longrightarrow
\text{global-semantic degradation}
$$

then

$$
\text{multi-level prediction}
\Longrightarrow
\text{semantic recovery}
+
\text{further dense improvement}
$$

// Ablations isolate supervision-topology effects.

---

### Record V-JEPA finite-range scaling

$$
300\text{M}
\rightarrow
2\text{B}
$$

produces improvements on tested

$$
\{
\text{SSv2},
\text{ImageNet},
\text{ADE20K},
\text{NYUv2}
\}
$$

VisionMix163M produces additional tested gains.

High-resolution cooldown produces additional tested gains.

Reject

$$
L(N,D,C)
=
aN^{-\alpha}
+
bD^{-\beta}
+\cdots
$$

as established source law.

$$
\boxed{
\text{positive finite-range scaling}
\neq
\text{asymptotic scaling law}
}
$$

// Tested scaling does not establish universal scaling behavior.

---

### Emit V-JEPA representation

$$
E_\theta^\star
\leftarrow
E_\theta
$$

// Pixel reconstruction never defines the primary objective.

---

# Phase II — LeWorldModel

### Input

$$
\mathcal D
=
\{
(o_t,a_t,o_{t+1})
\}
$$

$$
o_t
\in
\mathbb R^{224\times224\times3}
$$

$$
E_\theta:
\mathcal O
\rightarrow
\mathcal Z
$$

$$
P_\phi:
\mathcal Z\times\mathcal A
\rightarrow
\mathcal Z
$$

---

### Initialize encoder

Set patch size

$$
p
=
14
$$

transformer depth

$$
L_E
=
12
$$

attention heads

$$
H_E
=
3
$$

hidden dimension

$$
D_E
=
192
$$

parameter count

$$
|\theta|
\approx
5\text{M}
$$

Compute

$$
h_{\text{CLS}}
=
E_\theta^{\text{ViT}}(o)
$$

then

$$
z
=
\operatorname{BN}
\left(
W_Eh_{\text{CLS}}
+
b_E
\right)
$$

// Final CLS representation becomes global latent state.

---

### Initialize action-conditioned predictor

Set

$$
L_P
=
6
$$

$$
H_P
=
16
$$

$$
p_{\text{drop}}
=
0.1
$$

$$
|\phi|
\approx
10\text{M}
$$

Hence

$$
|\theta|+|\phi|
\approx
15\text{M}
$$

For every predictor layer

$$
l
=
1,\ldots,6
$$

apply action conditioning

$$
h^{(l+1)}
=
\operatorname{TransformerBlock}
\left(
h^{(l)};
\operatorname{AdaLN}(a_t)
\right)
$$

Initialize action-conditioning parameters

$$
\theta_{\text{AdaLN}}
\leftarrow
0
$$

Apply causal mask over latent history.

// Actions modulate every predictor layer.

---

### Configure trajectory training

$$
\text{frame-skip}
=
5
$$

$$
B
=
128
$$

$$
N_{\text{subtrajectory}}
=
4
$$

Predictor history:

$$
H_{\text{hist}}
=
\begin{cases}
3,
&
\text{PushT}
\\
3,
&
\text{OGBench-Cube}
\\
1,
&
\text{TwoRoom}
\end{cases}
$$

// Training uses offline observation-action trajectories.

---

### Sample training subtrajectory

$$
\mathcal B
\sim
\mathcal D
$$

$$
\mathcal B
=
\{
(o_t,a_t)
\}_{t=1}^{N}
$$

---

### Encode observations jointly

For every valid \(t\),

$$
z_t
=
E_\theta(o_t)
$$

$$
z_{t+1}
=
E_\theta(o_{t+1})
$$

Set

$$
E_{\text{EMA}}
=
\varnothing
$$

Set

$$
\operatorname{sg}
=
\varnothing
$$

// Current and future latent geometries remain trainable.

---

### Predict next latent state

$$
\boxed{
\widehat z_{t+1}
=
P_\phi(
z_{\leq t},
a_{\leq t}
)
}
$$

with minimal transition notation

$$
\boxed{
\widehat z_{t+1}
=
P_\phi(
z_t,
a_t
)
}
$$

Define

$$
r_t
=
\widehat z_{t+1}
-
z_{t+1}
$$

Compute

$$
\boxed{
\mathcal L_{\text{pred}}
=
\sum_t
\left\|
r_t
\right\|_2^2
}
$$

// Teacher forcing uses actual encoded future observations.

---

### Detect prediction-only collapse

Assume

$$
E_\theta(o)
=
c,
\qquad
\forall o
$$

and

$$
P_\phi(c,a)
=
c,
\qquad
\forall a
$$

Then

$$
z_t
=
z_{t+1}
=
\widehat z_{t+1}
=
c
$$

and

$$
\mathcal L_{\text{pred}}
=
0
$$

Therefore

$$
\boxed{
\mathcal L_{\text{pred}}
\text{ admits constant collapse}
}
$$

// Prediction loss alone permits a degenerate optimum.

---

### Construct latent tensor

$$
Z
=
\operatorname{Stack}
\left(
\{z_t\}
\right)
$$

$$
Z
\in
\mathbb R^{N\times B\times d}
$$

Define flattened sample matrix when required:

$$
Z'
\in
\mathbb R^{NB\times d}
$$

---

### Initialize SIGReg

Set

$$
M
=
1024
$$

$$
\lambda
=
0.1
$$

For

$$
m
=
1,\ldots,M
$$

sample

$$
u^{(m)}
\sim
\operatorname{Uniform}
(
S^{d-1}
)
$$

subject to

$$
\left\|
u^{(m)}
\right\|_2
=
1
$$

Project

$$
h^{(m)}
=
Z'u^{(m)}
$$

// Random projections expose one-dimensional latent marginals.

---

### Compute Epps-Pulley projection statistic

For projection

$$
h
=
\{h_n\}_{n=1}^{N'}
$$

define empirical characteristic function

$$
\phi_N(t;h)
=
\frac1{N'}
\sum_{n=1}^{N'}
e^{ith_n}
$$

Let

$$
\phi_0(t)
$$

denote the characteristic function of

$$
\mathcal N(0,1)
$$

Compute

$$
\boxed{
T(h)
=
\int_{-\infty}^{\infty}
w(t)
\left|
\phi_N(t;h)
-
\phi_0(t)
\right|^2dt
}
$$

For each sampled direction,

$$
T^{(m)}
=
T(
h^{(m)}
)
$$

// Each projection is compared against standard Gaussianity.

---

### Aggregate SIGReg

$$
\boxed{
\operatorname{SIGReg}(Z)
=
\frac1M
\sum_{m=1}^{M}
T^{(m)}
}
$$

In the asymptotic all-projection limit,

$$
\boxed{
\operatorname{SIGReg}(Z)
\rightarrow0
\iff
P_Z
\rightarrow
\mathcal N(0,I)
}
$$

// Finite training remains a stochastic approximation.

---

### Verify constant-collapse rejection

Under

$$
z_n
=
c,
\qquad
\forall n
$$

every projected sample satisfies

$$
h_n
=
c^\top u
$$

Thus

$$
P_h
=
\delta_{c^\top u}
$$

while

$$
\delta_{c^\top u}
\neq
\mathcal N(0,1)
$$

Therefore

$$
T(h)
>
0
$$

and

$$
\operatorname{SIGReg}(Z)
>
0
$$

Hence

$$
\boxed{
\mathcal L_{\text{pred}}=0
\not\Rightarrow
\mathcal L_{\text{LeWM}}=0
}
$$

// SIGReg rejects the trivial constant representation.

---

### Form complete LeWorldModel objective

$$
\boxed{
\mathcal L_{\text{LeWM}}
=
\mathcal L_{\text{pred}}
+
0.1\operatorname{SIGReg}(Z)
}
$$

// Predictability and non-degeneracy optimize simultaneously.

---

### Derive predictor gradient

For

$$
r_t
=
P_\phi(z_t,a_t)
-
E_\theta(o_{t+1})
$$

$$
\mathcal L_{\text{pred}}
=
r_t^\top r_t
$$

define

$$
J_{P,\phi}
=
\frac{
\partial P_\phi
}{
\partial\phi
}
$$

Then

$$
\boxed{
\nabla_\phi
\mathcal L_{\text{pred}}
=
2
J_{P,\phi}^{\top}
r_t
}
$$

// Predictor follows latent-transition residuals.

---

### Derive encoder gradient

Define

$$
J_{E_t}
=
\frac{
\partial E_\theta(o_t)
}{
\partial\theta
}
$$

$$
J_{E_{t+1}}
=
\frac{
\partial E_\theta(o_{t+1})
}{
\partial\theta
}
$$

$$
J_{P,z}
=
\frac{
\partial P_\phi(z_t,a_t)
}{
\partial z_t
}
$$

Then

$$
\boxed{
\nabla_\theta
\mathcal L_{\text{pred}}
=
2
\left[
J_{E_t}^{\top}
J_{P,z}^{\top}
-
J_{E_{t+1}}^{\top}
\right]
r_t
}
$$

and

$$
\boxed{
\nabla_\theta
\mathcal L_{\text{LeWM}}
=
\nabla_\theta
\mathcal L_{\text{pred}}
+
0.1
\nabla_\theta
\operatorname{SIGReg}(Z)
}
$$

// Present-state and target-state geometries co-evolve.

---

### Jointly update encoder and predictor

$$
g_\theta
=
\nabla_\theta
\mathcal L_{\text{LeWM}}
$$

$$
g_\phi
=
\nabla_\phi
\mathcal L_{\text{LeWM}}
$$

$$
(\theta,\phi)
\leftarrow
\operatorname{OptimizerStep}
(
\theta,\phi;
g_\theta,g_\phi
)
$$

with

$$
\operatorname{sg}
=
\varnothing
$$

and

$$
E_{\text{EMA}}
=
\varnothing
$$

Therefore

$$
\boxed{
\text{prediction geometry}
+
\text{target geometry}
\rightarrow
\text{joint co-evolution}
}
$$

// No slowly-moving target encoder exists.

---

### Repeat LeWorldModel optimization

For every optimization step,

$$
\mathcal B
\rightarrow
\{z_t\}
\rightarrow
\{\widehat z_{t+1}\}
\rightarrow
\mathcal L_{\text{pred}}
\rightarrow
Z
\rightarrow
\operatorname{SIGReg}(Z)
$$

$$
\rightarrow
\mathcal L_{\text{LeWM}}
\rightarrow
\nabla_{\theta,\phi}
\rightarrow
(\theta,\phi)
$$

// Entire world model trains directly from pixels.

---

### Emit trained latent dynamics model

$$
E_\theta^\star
\leftarrow
E_\theta
$$

$$
P_\phi^\star
\leftarrow
P_\phi
$$

$$
\boxed{
(o_t,a_t)
\rightarrow
z_t
\rightarrow
\widehat z_{t+1}
}
$$

// Pixel decoder is absent from primary training.

---

# Phase III — Representation Verification

### Diagnostic reconstruction

Freeze

$$
E_\theta^\star
$$

Compute

$$
z_t
=
E_\theta^\star(o_t)
$$

Train diagnostic decoder

$$
D_\psi:
\mathcal Z
\rightarrow
\mathcal O
$$

separately.

Require

$$
D_\psi
\notin
\mathcal L_{\text{LeWM}}
$$

during world-model optimization.

Therefore

$$
\boxed{
\operatorname{Recoverable}(o\mid z)
\neq
\operatorname{ReconstructionObjective}(z)
}
$$

// Post-hoc decoding does not redefine training.

---

### Probe physical-state accessibility

For physical quantity

$$
q
$$

evaluate linear probe

$$
\widehat q_{\text{linear}}
=
Wz+b
$$

with

$$
(W^\star,b^\star)
=
\arg\min_{W,b}
D(
Wz+b,
q
)
$$

Evaluate nonlinear probe

$$
\widehat q_{\text{MLP}}
=
g_\omega(z)
$$

with

$$
\omega^\star
=
\arg\min_\omega
D(
g_\omega(z),
q
)
$$

If

$$
D(
\widehat q,
q
)
$$

is sufficiently low, infer only

$$
\boxed{
q
\text{ is recoverable from }z
}
$$

Reject

$$
z=q
$$

Reject

$$
E_\theta
\text{ explicitly computes physical equations}
$$

// Decodability does not establish causal physical variables.

---

### Measure latent temporal geometry

For latent trajectory

$$
z_1,\ldots,z_T
$$

define

$$
v_t
=
z_{t+1}
-
z_t
$$

Compute

$$
\boxed{
c_t
=
\frac{
v_t^\top v_{t+1}
}{
\|v_t\|_2
\|v_{t+1}\|_2
}
}
$$

Aggregate

$$
C
=
\frac1{T-2}
\sum_t
c_t
$$

If

$$
C\uparrow
$$

infer only

$$
\text{locally straighter latent trajectories}
$$

Reject

$$
C\uparrow
\Longrightarrow
\text{globally linear physical dynamics}
$$

// Local geometry does not prove linear physics.

---

### Evaluate violation of expectation

Given valid trajectory

$$
\tau
=
(o_1,a_1,\ldots,o_T)
$$

construct

$$
\tilde\tau_{\text{visual}}
=
\operatorname{AbruptColorPerturbation}(\tau)
$$

and

$$
\tilde\tau_{\text{physical}}
=
\operatorname{TeleportationPerturbation}(\tau)
$$

For each transition,

$$
\widehat z_{t+1}
=
P_\phi^\star(z_t,a_t)
$$

$$
z_{t+1}
=
E_\theta^\star(o_{t+1})
$$

compute surprise

$$
S_t
=
D(
\widehat z_{t+1},
z_{t+1}
)
$$

Compare

$$
S_{\text{perturbed}}
\quad\text{against}\quad
S_{\text{unperturbed}}
$$

Reported physical teleportation produces

$$
S_{\text{physical}}
\uparrow
$$

across all three tested environments.

Infer

$$
\boxed{
\text{learned trajectory-continuity expectation}
}
$$

Reject

$$
\boxed{
\text{general theory of physical possibility}
}
$$

// Surprise measures prediction violation, not universal physics.

---

# Phase IV — Latent Planning

### Freeze trained model

$$
\nabla_{\theta,\phi}
=
0
$$

during planning.

// Planning optimizes actions, never model weights.

---

### Encode current and goal observations

$$
z_1
=
E_\theta^\star(o_1)
$$

$$
z_g
=
E_\theta^\star(o_g)
$$

---

### Define candidate action sequence

$$
a_{1:H}^{(n)}
=
(
a_1^{(n)},
\ldots,
a_H^{(n)}
)
$$

Initialize

$$
\widehat z_1^{(n)}
=
z_1
$$

---

### Autoregressively roll out latent future

For

$$
t
=
1,\ldots,H
$$

compute

$$
\boxed{
\widehat z_{t+1}^{(n)}
=
P_\phi^\star
(
\widehat z_t^{(n)},
a_t^{(n)}
)
}
$$

// Predictions become model-conditioned after the initial state.

---

### Compute terminal goal cost

$$
\boxed{
J_n
=
\left\|
\widehat z_H^{(n)}
-
z_g
\right\|_2^2
}
$$

Define planning objective

$$
\boxed{
a_{1:H}^{\star}
=
\arg\min_{a_{1:H}}
\left\|
\widehat z_H
-
z_g
\right\|_2^2
}
$$

// Goal matching occurs entirely in latent space.

---

### Initialize CEM

$$
\mu_0
$$

$$
\Sigma_0
$$

For PushT,

$$
N_{\text{candidate}}
=
300
$$

$$
N_{\text{elite}}
=
30
$$

$$
H
=
5
$$

$$
J_{\text{CEM}}
\le
30
$$

---

### Execute CEM iteration

For

$$
j
=
0,\ldots,J_{\text{CEM}}-1
$$

sample

$$
a_{1:H}^{(n)}
\sim
\mathcal N(
\mu_j,
\Sigma_j
)
$$

for

$$
n
=
1,\ldots,N_{\text{candidate}}
$$

roll out

$$
a_{1:H}^{(n)}
\xrightarrow{P_\phi^\star}
\widehat z_H^{(n)}
$$

compute

$$
J_n
=
\|
\widehat z_H^{(n)}
-
z_g
\|_2^2
$$

select

$$
\mathcal E_j
=
\operatorname{LowestCost}
(
\{J_n\},
N_{\text{elite}}
)
$$

update

$$
\boxed{
\mu_{j+1}
=
\frac1{|\mathcal E_j|}
\sum_{n\in\mathcal E_j}
a_{1:H}^{(n)}
}
$$

update

$$
\boxed{
\Sigma_{j+1}
=
\operatorname{Var}_{n\in\mathcal E_j}
\left(
a_{1:H}^{(n)}
\right)
}
$$

// CEM progressively concentrates probability around elite action sequences.

---

### Return approximate latent-control solution

$$
a_{1:H}^{\star}
\approx
\operatorname{CEM}
(
z_1,
z_g,
P_\phi^\star
)
$$

// Finite CEM provides no global-optimum guarantee.

---

### Track rollout error propagation

Define

$$
\epsilon_{t+1}
=
\widehat z_{t+1}
-
z_{t+1}
$$

Then

$$
\widehat z_{t+1}
=
z_{t+1}
+
\epsilon_{t+1}
$$

and

$$
\widehat z_{t+2}
=
P_\phi^\star
(
z_{t+1}
+
\epsilon_{t+1},
a_{t+1}
)
$$

Therefore

$$
\epsilon_{t+2}
=
P_\phi^\star
(
z_{t+1}
+
\epsilon_{t+1},
a_{t+1}
)
-
z_{t+2}
$$

Hence

$$
\boxed{
\epsilon_{t+1}
\rightarrow
\epsilon_{t+2}
\rightarrow
\cdots
\rightarrow
\epsilon_{t+H}
}
$$

// Autoregressive latent error can compound with horizon.

---

# Phase V — Physical-Dynamics Interpretation Gate

Assume latent-independent physical state

$$
s_t
$$

with transition

$$
s_{t+1}
=
T(s_t,a_t)
$$

observation mapping

$$
o_t
=
G(s_t)
$$

and learned representation

$$
z_t
=
E_\theta(G(s_t))
$$

LeWorldModel training requires only

$$
\boxed{
P_\phi
(
E_\theta(G(s_t)),
a_t
)
\approx
E_\theta
\left(
G(
T(s_t,a_t)
)
\right)
}
$$

Therefore

$$
P_\phi
\neq
T
$$

remains admissible.

Interpret

$$
P_\phi
$$

as

$$
\boxed{
\text{transition operator in learned latent coordinates}
}
$$

Reject

$$
P_\phi
=
T_{\text{physical}}
$$

// Learned latent dynamics need not equal physical equations.

---

# Phase VI — Information Retention Gate

Let observations satisfy conceptual factorization

$$
o
=
G(s,\eta)
$$

where

$$
s
=
\text{predictively relevant state}
$$

and

$$
\eta
=
\text{appearance or sensor variation}
$$

Encode

$$
z
=
E(o)
$$

For V-JEPA 2.1 require

$$
z_{t,h,w}
$$

to retain information sufficient for

$$
\widehat z_{t,h,w}
\approx
\bar z_{t,h,w}
$$

over

$$
M\cup C
$$

For LeWorldModel require

$$
(z_t,a_t)
$$

to retain information sufficient for

$$
\widehat z_{t+1}
\approx
z_{t+1}
$$

Allow information outside predictive constraints to disappear.

$$
\boxed{
\text{JEPA representation}
=
\text{predictively constrained information bottleneck}
}
$$

// Predictive pressure determines which information remains accessible.

---

# Phase VII — Observation-Space Versus Latent-Space Prediction

For observation-space prediction,

$$
\widehat x_T
=
F(x_C)
$$

$$
\mathcal L_{\text{obs}}
=
D(
\widehat x_T,
x_T
)
$$

For JEPA,

$$
z_T
=
E(x_T)
$$

$$
\widehat z_T
=
P(E(x_C))
$$

$$
\mathcal L_{\text{latent}}
=
D(
\widehat z_T,
z_T
)
$$

If

$$
x^{(1)}
\neq
x^{(2)}
$$

while

$$
E(x^{(1)})
\approx
E(x^{(2)})
$$

then

$$
P
$$

need not distinguish these observation differences.

Therefore

$$
\boxed{
\widehat z_T
\approx
z_T
\not\Rightarrow
\widehat x_T
\approx
x_T
}
$$

// Learned targets permit observation-level invariance.

---

# Phase VIII — Cross-Architecture Anti-Collapse Resolution

For V-JEPA 2.1,

$$
Z_T
=
\operatorname{sg}
(
E_{\bar\theta}(y)
)
$$

$$
\bar\theta
\leftarrow
\operatorname{EMA}
(
\bar\theta,
\theta
)
$$

$$
\nabla_{\bar\theta}^{\text{backprop}}
=
0
$$

For LeWorldModel,

$$
z_t
=
E_\theta(o_t)
$$

$$
z_{t+1}
=
E_\theta(o_{t+1})
$$

$$
\nabla_\theta
$$

propagates through both representations.

Additionally,

$$
\operatorname{SIGReg}(Z)
$$

constrains latent distribution.

Therefore

$$
\boxed{
\text{V-JEPA 2.1}
=
\text{asymmetric target dynamics}
}
$$

$$
\boxed{
\text{LeWorldModel}
=
\text{joint target dynamics}
+
\text{distributional regularization}
}
$$

// Anti-collapse topology is architecture-specific.

---

# Phase IX — Cross-Architecture Prediction Resolution

Autoregressive observable model:

$$
x_{\le t}
\rightarrow
\widehat x_{t+1}
$$

V-JEPA 2.1:

$$
U_C
\rightarrow
\widehat Z_{M\cup C}
$$

with target

$$
E_{\bar\theta}(U)_{M\cup C}
$$

LeWorldModel:

$$
(z_t,a_t)
\rightarrow
\widehat z_{t+1}
$$

with target

$$
E_\theta(o_{t+1})
$$

Therefore

$$
\boxed{
\text{observable prediction}
\neq
\text{masked latent completion}
\neq
\text{action-conditioned latent transition}
}
$$

// “Predicting embeddings” is not a sufficient architectural description.

---

# Phase X — Empirical Scaling Guard

For V-JEPA 2.1,

$$
300\text{M}
\rightarrow
2\text{B}
$$

shows positive finite-range improvements.

For LeWorldModel,

$$
d_{\text{latent}}
\lesssim184
$$

shows reported degradation,

while performance approximately saturates beyond the reported threshold.

Reported

$$
\lambda
\in
[0.01,0.2]
$$

retains

$$
>80\%
$$

PushT success.

Reported SIGReg projection-count sensitivity is limited.

Reported ViT-S predictor outperforms tested tiny and base alternatives.

Conclude only

$$
\boxed{
\text{tested finite-regime sensitivity}
}
$$

Reject

$$
\boxed{
\text{general JEPA scaling law}
}
$$

// Neither source establishes asymptotic JEPA scaling.

---

# Phase XI — Scientific Claim Verification

For

$$
q_1:
\quad
\text{JEPA}
\Rightarrow
\text{general intelligence}
$$

return

$$
\texttt{NOT\_ESTABLISHED}
$$

For

$$
q_2:
\quad
\text{JEPA}
\Rightarrow
\text{complete physical simulator}
$$

return

$$
\texttt{NOT\_ESTABLISHED}
$$

For

$$
q_3:
\quad
\text{latent decodability}
\Rightarrow
\text{causal physical understanding}
$$

return

$$
\texttt{NOT\_ESTABLISHED}
$$

For

$$
q_4:
\quad
\text{short-horizon control}
\Rightarrow
\text{long-horizon world modeling}
$$

return

$$
\texttt{NOT\_ESTABLISHED}
$$

For

$$
q_5:
\quad
300\text{M}\rightarrow2\text{B}
\Rightarrow
\text{unbounded scaling}
$$

return

$$
\texttt{NOT\_ESTABLISHED}
$$

For

$$
q_6:
\quad
\text{JEPA replaces autoregressive language modeling}
$$

return

$$
\texttt{NOT\_ESTABLISHED}
$$

// Evidence boundaries override architectural extrapolation.

---

# Phase XII — Evidence-Supported JEPA Invariant

Compute

$$
\mathcal I
=
\operatorname{Intersection}
\left(
\text{V-JEPA 2.1},
\text{LeWorldModel}
\right)
$$

Retain

$$
X
\xrightarrow{E}
Z
$$

$$
Z_C
\xrightarrow{P}
\widehat Z_T
$$

$$
X_T
\xrightarrow{E_T}
Z_T
$$

$$
\widehat Z_T
\leftrightarrow
Z_T
$$

$$
D(
\widehat Z_T,
Z_T
)
\rightarrow0
$$

subject to

$$
\operatorname{NonCollapse}(Z)
$$

Therefore

$$
\boxed{
\operatorname{JEPA}
=
\operatorname{LearnRepresentation}
+
\operatorname{PredictLearnedRepresentation}
+
\operatorname{PreventCollapse}
}
$$

// Remaining mechanisms are implementation-dependent.

---

# Phase XIII — Unified State Transition

$$
\boxed{
\begin{aligned}
X
&\rightarrow
\operatorname{ConstructPredictiveContext}
\\
&\rightarrow
X_C
\\
&\rightarrow
E
\\
&\rightarrow
Z_C
\\
&\rightarrow
P
\\
&\rightarrow
\widehat Z_T
\\
X_T
&\rightarrow
E_T
\\
&\rightarrow
Z_T
\\
(\widehat Z_T,Z_T)
&\rightarrow
D(
\widehat Z_T,Z_T
)
\\
&\rightarrow
\mathcal L_{\text{latent}}
\\
&\rightarrow
\operatorname{AntiCollapse}
\\
&\rightarrow
\operatorname{Optimization}
\\
&\rightarrow
E^\star,P^\star
\end{aligned}
}
$$

with

$$
\operatorname{AntiCollapse}
=
\begin{cases}
\operatorname{StopGradient}
+
\operatorname{EMA},
&
\text{V-JEPA 2.1}
\\[2mm]
\operatorname{SIGReg},
&
\text{LeWorldModel}
\end{cases}
$$

and

$$
\operatorname{PredictionTopology}
=
\begin{cases}
\operatorname{DenseSpatiotemporalCompletion},
&
\text{V-JEPA 2.1}
\\[2mm]
\operatorname{ActionConditionedTransition},
&
\text{LeWorldModel}
\end{cases}
$$

---

### Output

$$
\boxed{
\begin{gathered}
\text{learned representation}\\
+
\text{predictable latent geometry}\\
+
\text{architecture-specific anti-collapse}\\
+
\text{experimentally tested downstream utility}
\end{gathered}
}
$$

subject to

$$
\boxed{
\text{predictive latent structure}
\neq
\text{general world model established}
}
$$

and

$$
\boxed{
\text{promising evidence}
\neq
\text{scientifically completed theory}
}
$$

// Terminate exactly at the evidence boundary.
