% =====================================================================
% arXiv:2606.12191 — equation-only reconstruction
% \mathsf{N}: paper-native equation ; \mathsf{D}: derived pseudo-equation
% =====================================================================
% Core POMDP/RL definitions and native equations: :chatgpt-content-reference{index="0"}

\[
\boxed{
\mathsf{N}\equiv \text{paper-native},
\qquad
\mathsf{D}\equiv \text{derived formalization}
}
\]

\[
\boxed{
\mathfrak{E}
=
\Big\{
\mathcal E,\pi,\tau,
\mathcal X_{\rm attr},
\mathcal D_{\rm env},
\mathcal G_{\rm syn},
\mathcal Q_{\rm env},
\mathcal U_{\rm agent},
\mathcal U_{\rm env}
\Big\}
}
\]

\[
\mathcal E
=
\left\langle
\mathcal S,\mathcal A,\mathcal P,\mathcal R,
\Omega,\mathcal O,\gamma
\right\rangle
\]

\[
\mathcal P:\mathcal S\times\mathcal A\rightarrow\Delta(\mathcal S),
\qquad
\mathcal R:\mathcal S\times\mathcal A\rightarrow\mathbb R
\]

\[
\mathcal O:\mathcal S\times\mathcal A\rightarrow\Delta(\Omega),
\qquad
0\le \gamma<1
\]

\[
s_{t+1}\sim\mathcal P(\cdot\mid s_t,a_t),
\qquad
o_t\sim\mathcal O(\cdot\mid s_t,a_t),
\qquad
r_t=\mathcal R(s_t,a_t)
\]

\[
\overset{\mathsf N}{h_t}
=
(o_0,a_0,r_0,\ldots,a_{t-1},r_{t-1},o_t)
\in\mathcal H
\]

\[
\overset{\mathsf N}{\pi(a_t\mid h_t)}
=
P(A_t=a_t\mid H_t=h_t)
\]

\[
\overset{\mathsf N}{J(\pi)}
=
\mathbb E_{\pi,\mathcal P,\mathcal O}
\left[
\sum_{k=0}^{\infty}\gamma^k r_{t+k}
\right]
\]

\[
\pi^\star
=
\arg\max_{\pi}J(\pi)
\]

\[
\tau
=
(s_0,o_0,a_0,r_0,s_1,o_1,a_1,r_1,\ldots,s_T,o_T)
\]

\[
p_{\pi,\mathcal E}(\tau)
=
p(s_0)\,
\prod_{t=0}^{T-1}
\pi(a_t\mid h_t)\,
\mathcal P(s_{t+1}\mid s_t,a_t)\,
\mathcal O(o_{t+1}\mid s_{t+1},a_t)
\]

\[
G_t
=
\sum_{k=0}^{T-t-1}\gamma^k r_{t+k}
\]

\[
Q^\pi(h_t,a_t)
=
\mathbb E_{\pi,\mathcal E}[G_t\mid h_t,a_t]
\]

\[
V^\pi(h_t)
=
\mathbb E_{a\sim\pi(\cdot\mid h_t)}
Q^\pi(h_t,a)
\]

\[
A^\pi(h_t,a_t)
=
Q^\pi(h_t,a_t)-V^\pi(h_t)
\]

% ---------------------------------------------------------------------
% Environment-agent alignment
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm off}
=
\{\tau_i^\star\}_{i=1}^{N},
\qquad
\tau_i^\star\sim\pi_{\rm teacher}
\]

\[
\overset{\mathsf D}{\mathcal L_{\rm SFT}(\theta)}
=
-
\mathbb E_{\tau^\star\sim\mathcal D_{\rm off}}
\left[
\sum_{t=0}^{T-1}
\log\pi_\theta(a_t^\star\mid h_t^\star)
\right]
\]

\[
\theta_{\rm SFT}
=
\arg\min_\theta\mathcal L_{\rm SFT}(\theta)
\]

\[
\theta_{\rm RL}
=
\arg\max_\theta
\mathbb E_{\tau\sim p_{\pi_\theta,\mathcal E}}
\left[
\sum_{t=0}^{T-1}\gamma^tr_t
\right]
\]

% PPO

\[
\overset{\mathsf N}{\rho_t(\theta)}
=
\frac{\pi_\theta(a_t\mid s_t)}
{\pi_{\theta_{\rm old}}(a_t\mid s_t)}
\]

\[
\overset{\mathsf N}{\mathcal L^{\rm PPO}(\theta)}
=
\mathbb E_t
\left[
\min
\left(
\rho_t(\theta)\hat A_t,
\operatorname{clip}
(\rho_t(\theta),1-\epsilon,1+\epsilon)\hat A_t
\right)
\right]
\]

\[
\overset{\mathsf N}{\delta_t}
=
r_t+\gamma V_\phi(s_{t+1})-V_\phi(s_t)
\]

\[
\overset{\mathsf N}{\hat A_t}
=
\sum_{k=0}^{\infty}
(\gamma\lambda)^k\delta_{t+k}
\]

% GRPO

\[
\{y_i\}_{i=1}^{G}
\sim
\pi_{\theta_{\rm old}}(\cdot\mid q)
\]

\[
\overset{\mathsf N}{\rho_{i,t}(\theta)}
=
\frac{
\pi_\theta(y_{i,t}\mid q,y_{i,<t})
}{
\pi_{\theta_{\rm old}}(y_{i,t}\mid q,y_{i,<t})
}
\]

\[
\overset{\mathsf N}{\mu}
=
\frac1G\sum_{j=1}^{G}r_j
\]

\[
\overset{\mathsf N}{\sigma}
=
\sqrt{
\frac1G
\sum_{j=1}^{G}(r_j-\mu)^2
}
\]

\[
\overset{\mathsf N}{\hat A_i}
=
\frac{r_i-\mu}{\sigma+\delta}
\]

\[
\overset{\mathsf N}{\mathcal L_{i,t}^{\rm CLIP}}
=
\min
\left[
\rho_{i,t}\hat A_i,
\operatorname{clip}(\rho_{i,t},1-\epsilon,1+\epsilon)\hat A_i
\right]
\]

\[
\overset{\mathsf N}{\mathcal L^{\rm GRPO}(\theta)}
=
\mathbb E_q
\left[
\frac1G
\sum_{i=1}^{G}
\frac1{|y_i|}
\sum_{t=1}^{|y_i|}
\left(
\mathcal L_{i,t}^{\rm CLIP}
-
\beta
\mathbb D_{\rm KL}
(\pi_\theta\Vert\pi_{\rm ref})
\right)
\right]
\]

% DAPO

\[
\overset{\mathsf N}{\mathcal L_{i,t}^{\rm D-CLIP}}
=
\min
\left[
\rho_{i,t}\hat A_i,
\operatorname{clip}
(
\rho_{i,t},
1-\epsilon_{\rm low},
1+\epsilon_{\rm high}
)
\hat A_i
\right]
\]

\[
\overset{\mathsf N}{\mathcal L^{\rm DAPO}(\theta)}
=
\mathbb E_q
\left[
\frac{
\displaystyle
\sum_{i=1}^{G}
\sum_{t=1}^{|y_i|}
\mathcal L_{i,t}^{\rm D-CLIP}
}{
\displaystyle
\sum_{i=1}^{G}|y_i|
}
\right]
\]

% =====================================================================
% II-B — Data engineering -> environment engineering
% :chatgpt-content-reference{index="1"}
% =====================================================================

\[
\mathcal D_{\rm static}
=
\{(x_i,y_i)\}_{i=1}^{N},
\qquad
\mathcal D_{\rm static}^{(k+1)}
=
\mathcal D_{\rm static}^{(k)}
\]

\[
\theta_{k+1}
=
\mathcal U_A
\left(
\theta_k,
\mathcal D_{\rm static}
\right)
\]

\[
d(\mathcal D_{\rm static})
\not\equiv
c(\pi_{\theta_k})
\]

\[
\overset{\mathsf D}{
\Delta_k^{\rm mismatch}}
=
\left|
d(\mathcal D_{\rm static})
-
c(\pi_{\theta_k})
\right|
\]

\[
\mathcal E_{\phi_k}
\xrightarrow{\pi_{\theta_k}}
\mathcal D_k^{\rm int}
=
\{\tau_i^{(k)}\}_{i=1}^{N_k}
\]

\[
\theta_{k+1}
=
\mathcal U_A
(
\theta_k,
\mathcal D_k^{\rm int}
)
\]

\[
\phi_{k+1}
=
\mathcal U_E
(
\phi_k,
\theta_{k+1},
\mathcal D_k^{\rm int}
)
\]

\[
\boxed{
\pi_{\theta_k}
\longrightarrow
\mathcal E_{\phi_k}
\longrightarrow
\mathcal D_k
\longrightarrow
\pi_{\theta_{k+1}}
\longrightarrow
\mathcal E_{\phi_{k+1}}
}
\]

\[
d(\mathcal E_{\phi_k})
\approx
c(\pi_{\theta_k})+\Delta_{\rm learnable}
\]

\[
0<
P_{\pi_{\theta_k}}
(\operatorname{success}\mid\mathcal E_{\phi_k})
<1
\]

\[
\overset{\mathsf D}{\phi_{k+1}}
=
\phi_k
+
\eta_E
\nabla_\phi
\mathcal I
(
\mathcal E_\phi;
\pi_{\theta_k}
)
\]

\[
\overset{\mathsf D}{\theta_{k+1}}
=
\theta_k
+
\eta_A
\nabla_\theta
J
(
\pi_\theta;
\mathcal E_{\phi_{k+1}}
)
\]

% Single-turn -> multi-turn

\[
x
\xrightarrow{\pi_\theta}
y
\]

\[
x
\rightarrow
a_0
\rightarrow
o_1
\rightarrow
a_1
\rightarrow
o_2
\rightarrow\cdots\rightarrow
a_T
\rightarrow
o_{T+1}
\]

\[
a_t
\sim
\pi_\theta
(
\cdot\mid
x,o_{\le t},a_{<t},r_{<t}
)
\]

\[
g
\mapsto
(g_1,\ldots,g_K),
\qquad
g
=
\bigwedge_{k=1}^{K}g_k
\]

% Open-loop -> closed-loop

\[
\pi_{\rm OL}(a_t\mid o_0)
\perp
o_{1:t}
\]

\[
(a_0,\ldots,a_T)
\sim
\pi_{\rm OL}(\cdot\mid o_0)
\]

\[
\pi_{\rm CL}(a_t\mid h_t),
\qquad
h_{t+1}
=
h_t\oplus(a_t,r_t,o_{t+1})
\]

\[
a_t
\rightarrow
s_{t+1}
\rightarrow
o_{t+1}
\rightarrow
a_{t+1}
\]

\[
e_t=s_t-s_t^\star
\]

\[
\overset{\mathsf D}{a_t}
=
\pi_\theta(h_t,e_t)
\]

\[
\overset{\mathsf D}{
P(\operatorname{recover}\mid e_t,\pi_{\rm CL})
}
>
P(\operatorname{recover}\mid e_t,\pi_{\rm OL})
\]

% =====================================================================
% III — Environment attribute tensor
% :chatgpt-content-reference{index="2"}
% =====================================================================

\[
\boxed{
\mathcal X_{\rm attr}
=
X_{\rm rep}
\times
X_{\rm loop}
\times
X_{\rm access}
\times
X_{\rm obs}
\times
X_{\rm dyn}
\times
X_{\rm act}
\times
X_{\rm mod}
\times
X_{\rm agent}
}
\]

\[
X_{\rm rep}
=
\{\mathrm{Symbolic},\mathrm{Neural}\}
\]

\[
X_{\rm loop}
=
\{\mathrm{Open},\mathrm{Closed}\}
\]

\[
X_{\rm access}
=
\{\mathrm{Offline},\mathrm{Online}\}
\]

\[
X_{\rm obs}
=
\{\mathrm{MDP},\mathrm{POMDP}\}
\]

\[
X_{\rm dyn}
=
\{\mathrm{Deterministic},\mathrm{Nondeterministic}\}
\]

\[
X_{\rm act}
=
\{\mathrm{Discrete},\mathrm{Continuous},\mathrm{Mixed}\}
\]

\[
X_{\rm mod}
=
\{\mathrm{Unimodal},\mathrm{Multimodal}\}
\]

\[
X_{\rm agent}
=
\{\mathrm{Single},\mathrm{Multi}\}
\]

% Symbolic

\[
\mathcal C
=
\{\mathrm{rules},\mathrm{preconditions},\mathrm{effects},
\mathrm{code},\mathrm{constraints}\}
\]

\[
P_{\mathcal C}(s'\mid s,a)
=
\mathbf 1
[
s'=F_{\mathcal C}(s,a)
]
\]

\[
R_{\mathcal C}(s,a)
=
G_{\mathcal C}(s,a,F_{\mathcal C}(s,a))
\]

\[
\operatorname{Applicable}(a,s)
=
\prod_{c\in\operatorname{Pre}(a)}
\mathbf1[c(s)=1]
\]

\[
s'
=
\operatorname{Effect}(s,a)
\iff
\operatorname{Applicable}(a,s)=1
\]

% Neural

\[
P_\phi(s_{t+1}\mid s_t,a_t)
=
f_\phi(s_t,a_t)
\]

\[
\phi^\star
=
\arg\min_\phi
\mathbb E_{(s,a,s')\sim\mathcal D}
[-\log P_\phi(s'\mid s,a)]
\]

\[
\hat s_{t+k}
\sim
\prod_{j=0}^{k-1}
P_\phi
(
s_{t+j+1}\mid s_{t+j},a_{t+j}
)
\]

\[
\epsilon_{\rm drift}(k)
=
D
\left(
P_{\rm real}(s_{t+k}),
P_\phi(s_{t+k})
\right)
\]

% Open vs closed

\[
\pi_{\rm open}(a_t\mid o_0)
\]

\[
I(A_t;O_{1:t}\mid O_0)_{\rm open}
=
0
\]

\[
\pi_{\rm closed}(a_t\mid h_t)
\]

\[
I(A_t;O_{1:t}\mid O_0)_{\rm closed}
>
0
\]

% Online vs offline

\[
\mathcal D_{\rm offline}
=
\{
(h_t^{(i)},a_t^{\star(i)})
\}_{i,t}
\]

\[
\mathcal L_{\rm offline}
=
-
\mathbb E_{\mathcal D_{\rm offline}}
[
\log\pi_\theta(a_t^\star\mid h_t)
]
\]

\[
a_t\sim\pi_\theta(\cdot\mid h_t),
\qquad
o_{t+1}\sim\mathcal E(\cdot\mid h_t,a_t)
\]

\[
\mathcal D_{k+1}
=
\mathcal D_k
\cup
\{
\tau:\tau\sim p_{\pi_{\theta_k},\mathcal E}
\}
\]

% MDP vs POMDP

\[
\Omega=\mathcal S,
\qquad
o_t=s_t
\]

\[
\pi_{\rm MDP}(a_t\mid s_t)
\]

\[
P(s_{t+1}\mid s_{\le t},a_{\le t})
=
P(s_{t+1}\mid s_t,a_t)
\]

\[
o_t\sim\mathcal O(\cdot\mid s_t,a_{t-1})
\]

\[
b_t(s)
=
P(s_t=s\mid h_t)
\]

\[
b_{t+1}(s')
\propto
\mathcal O(o_{t+1}\mid s',a_t)
\sum_s
\mathcal P(s'\mid s,a_t)b_t(s)
\]

\[
\pi_{\rm POMDP}(a_t\mid h_t)
\equiv
\pi_{\rm POMDP}(a_t\mid b_t)
\]

% Deterministic vs nondeterministic

\[
\exists!\,s':
\mathcal P(s'\mid s,a)=1
\]

\[
H
[
\mathcal P(\cdot\mid s,a)
]
=
0
\]

\[
\mathcal P(\cdot\mid s,a)\in\Delta(\mathcal S)
\]

\[
H
[
\mathcal P(\cdot\mid s,a)
]
>
0
\]

\[
\operatorname{Var}
[
S_{t+1}\mid s_t,a_t
]
>0
\]

% Discrete vs continuous

\[
\mathcal A_{\rm discrete}
=
\{a_1,\ldots,a_n\},
\qquad
\sum_{i=1}^{n}
\pi(a_i\mid h)=1
\]

\[
\mathcal A_{\rm continuous}
\subseteq
\mathbb R^d,
\qquad
\int_{\mathcal A}
\pi(a\mid h)\,da=1
\]

\[
\mathcal A_{\rm mixed}
=
\mathcal A_d
\times
\mathcal A_c
\]

% Unimodal vs multimodal

\[
\Omega=\Omega^{(m)}
\]

\[
o_t
=
\left\langle
o_t^{\rm text},
o_t^{\rm image},
o_t^{\rm video}
\right\rangle
\]

\[
z_t^{(m)}
=
f_m(o_t^{(m)})
\]

\[
z_t
=
\operatorname{Fuse}
\left(
z_t^{(1)},\ldots,z_t^{(M)}
\right)
\]

\[
\pi(a_t\mid h_t)
=
\pi
\left(
a_t\mid
z_{\le t}^{(1:M)},a_{<t},r_{<t}
\right)
\]

% Single vs multi-agent

\[
N=1:
\qquad
\mathcal P(s_{t+1}\mid s_t,a_t)
\]

\[
N>1:
\qquad
\mathbfcal A
=
\mathcal A^1\times\cdots\times\mathcal A^N
\]

\[
\mathbf a_t
=
(a_t^1,\ldots,a_t^N)
\]

\[
\mathcal P
(
s_{t+1}\mid s_t,\mathbf a_t
)
\]

\[
a_t^i
\sim
\pi^i
(
\cdot\mid h_t^i
)
\]

\[
r_t^i
=
\mathcal R^i
(
s_t,\mathbf a_t
)
\]

\[
\mathcal R^1=\cdots=\mathcal R^N
\qquad
\Longrightarrow
\qquad
\mathrm{cooperative}
\]

\[
\sum_{i=1}^{N}\mathcal R^i=0
\qquad
\Longrightarrow
\qquad
\mathrm{zero\!-\!sum}
\]

\[
\exists\,i,j:
\mathcal R^i\neq\mathcal R^j,
\qquad
\sum_i\mathcal R^i\neq0
\qquad
\Longrightarrow
\qquad
\mathrm{general\!-\!sum}
\]

% =====================================================================
% IV — Environment domains
% :chatgpt-content-reference{index="3"}
% =====================================================================

\[
\boxed{
\mathcal D_{\rm env}
=
\{
\mathcal D_{\rm GUI},
\mathcal D_{\rm Research},
\mathcal D_{\rm Embodied},
\mathcal D_{\rm Game},
\mathcal D_{\rm Tool},
\mathcal D_{\rm Code},
\mathcal D_{\rm Domain},
\mathcal D_{\rm Cross}
\}
}
\]

% ---------------------------------------------------------------------
% GUI
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm GUI}
=
\{
\mathcal D_{\rm Desktop},
\mathcal D_{\rm Mobile},
\mathcal D_{\rm Web}
\}
\]

\[
s_t^{\rm GUI}
=
(
V_t,
\mathcal W_t,
\mathcal H_t,
\mathcal F_t,
\mathcal Z_t
)
\]

\[
V_t=\mathrm{rendered\ viewport},
\qquad
\mathcal W_t=\mathrm{widget/DOM\ structure}
\]

\[
a_t^{\rm GUI}
\in
\{
\mathrm{click},
\mathrm{type},
\mathrm{scroll},
\mathrm{drag},
\mathrm{key},
\mathrm{tap},
\mathrm{swipe},
\mathrm{tool}
\}
\]

\[
e^\star
=
\arg\max_{e\in\mathcal W_t}
P_\theta
(
e\mid
V_t,g,h_t
)
\]

\[
a_t
=
\operatorname{Ground}
(
g,h_t,e^\star
)
\]

\[
s_{t+1}
=
F_{\rm GUI}(s_t,a_t)
\]

% Desktop

\[
g
=
g^{(1)}
\land
g^{(2)}
\land\cdots\land
g^{(K)}
\]

\[
\mathcal A_{\rm desktop}
=
\bigcup_{j=1}^{M}
\mathcal A_{\rm app}^{(j)}
\]

\[
\operatorname{Cost}_{\rm desktop}
=
\lambda_H H
+
\lambda_X N_{\rm cross-app}
+
\lambda_G E_{\rm grounding}
\]

% Mobile

\[
|\operatorname{Viewport}_{\rm mobile}|
<
|\operatorname{State}_{\rm app}|
\]

\[
o_t
=
\operatorname{Crop}
(
s_t,v_t
)
\]

\[
d_{\rm page}
=
\operatorname{dist}_{G_{\rm UI}}
(
u_{\rm start},
u_{\rm goal}
)
\]

\[
a_t^{\rm mobile}
\in
\{
\mathrm{tap,type,scroll,swipe}
\}
\]

% Web

\[
s_t^{\rm web}
=
(
\mathrm{DOM}_t,
\mathrm{HTML}_t,
\mathrm{pixels}_t,
\mathrm{session}_t,
\mathrm{server}_t
)
\]

\[
a_t^{\rm web}
\in
\{
\mathrm{navigate},
\mathrm{search},
\mathrm{click},
\mathrm{fill},
\mathrm{submit},
\mathrm{scroll}
\}
\]

\[
\pi^\star
=
\arg\max_\pi
P_\pi
(
s_T\models g
)
\]

\[
\mathbb B_{\rm GUI}
=
\{
\mathrm{WebShop},
\mathrm{Mind2Web},
\mathrm{Mind2Web2},
\mathrm{WebArena},
\mathrm{VisualWebArena},
\mathrm{WebVoyager},
\mathrm{MobileEnv},
\mathrm{AitW},
\mathrm{AndroidWorld},
\mathrm{AndroidControl},
\mathrm{MobileWorld},
\mathrm{AgentStudio},
\mathrm{WorkArena},
\mathrm{OSWorld},
\mathrm{WindowsAgentArena},
\mathrm{OSWorldMCP},
\mathrm{MobileBench},
\mathrm{MTMind2Web},
\mathrm{VideoWebArena},
\mathrm{Mind2WebLive},
\mathrm{OnlineMind2Web},
\mathrm{MobileAgentBench}
\}
\]

% ---------------------------------------------------------------------
% Deep Research
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm Research}
=
\{
\mathcal D_{\rm Search},
\mathcal D_{\rm MultiSource},
\mathcal D_{\rm Report}
\}
\]

\[
q_0
=
g
\]

\[
q_t
=
Q_\theta
(
g,
E_{<t},
h_t
)
\]

\[
\mathcal C_t
=
\operatorname{Search}(q_t)
\]

\[
e_t
=
\arg\max_{d\in\mathcal C_t}
\operatorname{Rel}
(
d,g,E_{<t}
)
\]

\[
E_t
=
E_{t-1}
\cup
\{e_t\}
\]

\[
\operatorname{Coverage}(E,g)
=
\frac{
|\{c\in\mathcal C(g):\exists e\in E,\ e\models c\}|
}{
|\mathcal C(g)|
}
\]

\[
\operatorname{Redundancy}(E)
=
\frac{2}{|E|(|E|-1)}
\sum_{i<j}
\operatorname{sim}(e_i,e_j)
\]

\[
q_{t+1}
=
\arg\max_q
\Big[
\Delta\operatorname{Coverage}(E_t;q)
-
\lambda
\operatorname{Redundancy}(E_t;q)
\Big]
\]

\[
\operatorname{Stop}_t
=
\mathbf1
[
\operatorname{Coverage}(E_t,g)\ge\tau_c
\land
\Delta\operatorname{Coverage}_t\le\tau_\Delta
]
\]

% Multi-source reasoning

\[
G_E
=
(V_E,E_E),
\qquad
V_E=\{e_1,\ldots,e_n\}
\]

\[
w_{ij}
=
\operatorname{Rel}
(
e_i,e_j
)
\]

\[
c_i
=
\operatorname{Claim}(e_i)
\]

\[
\operatorname{Conflict}(c_i,c_j)
=
\mathbf1
[
c_i\Rightarrow\neg c_j
\lor
c_j\Rightarrow\neg c_i
]
\]

\[
w_i^{\rm evidence}
=
f
(
\operatorname{authority}_i,
\operatorname{recency}_i,
\operatorname{directness}_i,
\operatorname{independence}_i
)
\]

\[
P(c\mid E)
\propto
P(c)
\prod_{e_i\in E}
P(e_i\mid c)^{w_i^{\rm evidence}}
\]

% Research report

\[
R
=
\mathcal G_\theta
(
g,E,\mathcal S_{\rm report}
)
\]

\[
\operatorname{Ground}(R,E)
=
\frac{
\sum_{c\in\operatorname{Claims}(R)}
\mathbf1[\exists e\in E:e\models c]
}{
|\operatorname{Claims}(R)|
}
\]

\[
\operatorname{CitationPrecision}
=
\frac{TP_{\rm cite}}{TP_{\rm cite}+FP_{\rm cite}}
\]

\[
\operatorname{CitationRecall}
=
\frac{TP_{\rm cite}}{TP_{\rm cite}+FN_{\rm cite}}
\]

\[
Q_{\rm report}
=
\alpha C_{\rm factual}
+
\beta C_{\rm coverage}
+
\chi C_{\rm organization}
+
\delta C_{\rm citation}
-
\lambda C_{\rm redundancy}
\]

\[
\mathbb B_{\rm Research}
=
\{
\mathrm{HLE},
\mathrm{DeepResearchBench},
\mathrm{GAIA},
\mathrm{WideSearch},
\mathrm{WebWalker},
\mathrm{BrowseComp},
\mathrm{Conflicts},
\mathrm{DeepResearchGym},
\mathrm{InfoDeepSeek},
\mathrm{InfoSeek},
\mathrm{BrowseCompZH},
\mathrm{SurveyGen},
\mathrm{ReportBench},
\mathrm{LiveDRBench},
\mathrm{ScholarQABench},
\mathrm{ResearcherBench},
\mathrm{ProxyQA},
\mathrm{AIIdeaBench},
\mathrm{DeepReview},
\mathrm{PaperBench},
\mathrm{MultimodalDeepResearcher},
\mathrm{VisionDeepResearch},
\mathrm{MMDRBench},
\mathrm{OmniGAIA}
\}
\]

% ---------------------------------------------------------------------
% Embodied
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm Embodied}
=
\{
\mathcal D_{\rm Navigation},
\mathcal D_{\rm Manipulation},
\mathcal D_{\rm LongHorizon}
\}
\]

\[
s_t
=
(
x_t,
q_t,
\dot q_t,
\mathcal O_t^{\rm objects},
\mathcal M_t^{\rm map}
)
\]

\[
o_t
=
(
I_t,D_t,L_t,
\mathrm{proprioception}_t
)
\]

% Navigation

\[
x_{t+1}
=
f_{\rm nav}(x_t,a_t,\xi_t)
\]

\[
\tau_{\rm nav}
=
(x_0,a_0,x_1,\ldots,x_T)
\]

\[
L(\tau_{\rm nav})
=
\sum_{t=0}^{T-1}
\|x_{t+1}-x_t\|_2
\]

\[
\operatorname{Success}
=
\mathbf1
[
d(x_T,x_g)\le\epsilon
]
\]

\[
\operatorname{SPL}
=
\operatorname{Success}
\frac{L^\star}{
\max(L,L^\star)
}
\]

% Manipulation

\[
q_{t+1}
=
q_t+\Delta t\,\dot q_t
\]

\[
\dot q_{t+1}
=
f_{\rm dyn}
(
q_t,\dot q_t,u_t,
F_t^{\rm contact}
)
\]

\[
s_{t+1}^{\rm obj}
=
F_{\rm physics}
(
s_t^{\rm obj},
u_t,
\mathcal C_t
)
\]

\[
u_t
\in
\mathbb R^{d_u}
\]

\[
g
=
\bigwedge_{k}
\operatorname{Predicate}_k(s_T)
\]

% Long horizon

\[
g
\rightarrow
(g_1,g_2,\ldots,g_K)
\]

\[
g_k
\xrightarrow{\pi}
\tau_k
\xrightarrow{\mathcal E}
s_{k+1}
\]

\[
P(g\mid\pi)
=
\prod_{k=1}^{K}
P
(
g_k\mid
g_{<k},\pi
)
\]

\[
P_{\rm total}
\approx
\prod_{k=1}^{K}p_k
\]

\[
\log P_{\rm total}
=
\sum_{k=1}^{K}\log p_k
\]

\[
\mathbb B_{\rm Embodied}
=
\{
\mathrm{Habitat},
\mathrm{RoomToRoom},
\mathrm{RLBench},
\mathrm{ALFRED},
\mathrm{ALFWorld},
\mathrm{RoboCasa},
\mathrm{BEHAVIOR},
\mathrm{PandaGym},
\mathrm{MetaDrive},
\mathrm{ScienceWorld},
\mathrm{ETPlanBench},
\mathrm{LEGENT},
\mathrm{EmbodiedBench},
\mathrm{RoboFactory},
\mathrm{ScenarioDreamer},
\mathrm{SimuHome},
\mathrm{SariSandbox},
\mathrm{Nexus},
\mathrm{TEACh},
\mathrm{ReALFRED}
\}
\]

% ---------------------------------------------------------------------
% Game
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm Game}
=
\{
\mathcal D_{\rm OpenWorld},
\mathcal D_{\rm Puzzle},
\mathcal D_{\rm Social},
\mathcal D_{\rm Adventure},
\mathcal D_{\rm Strategy}
\}
\]

% Open world

\[
|\mathcal S|\gg1,
\qquad
\Pr(r_t\neq0)\ll1
\]

\[
J_{\rm explore}
=
J_{\rm task}
+
\beta
\sum_t
r_t^{\rm intrinsic}
\]

\[
r_t^{\rm intrinsic}
=
f
(
\operatorname{novelty}(s_t),
\operatorname{uncertainty}(s_t)
)
\]

% Puzzle

\[
\mathcal R_{\rm rules}
=
\{r_1,\ldots,r_m\}
\]

\[
s_{t+1}
=
F_{\mathcal R_t}(s_t,a_t)
\]

\[
\mathcal R_{t+1}
=
U_{\rm rule}
(
\mathcal R_t,a_t
)
\]

\[
\pi^\star
=
\arg\min_\pi
\mathbb E[T_{\rm goal}]
\]

% Social deduction

\[
z_i
\sim
P(Z_i),
\qquad
o_t^i
\subset
s_t
\]

\[
b_t^i(z_j)
=
P(z_j\mid h_t^i)
\]

\[
m_t^i
\sim
\pi_{\rm comm}^i
(
\cdot\mid
b_t^i,
g_i
)
\]

\[
a_t^i
\sim
\pi_{\rm act}^i
(
\cdot\mid
h_t^i,
m_{\le t}^{1:N}
)
\]

\[
J_i
=
\mathbb E
\left[
\sum_t\gamma^t
R_i
(
s_t,\mathbf a_t,\mathbf z
)
\right]
\]

% Adventure

\[
s_t
=
(
\mathrm{inventory}_t,
\mathrm{location}_t,
\mathrm{quests}_t,
\mathrm{clues}_t
)
\]

\[
\mathcal M_{t+1}
=
\operatorname{Update}
(
\mathcal M_t,o_{t+1}
)
\]

\[
g
=
g_1\prec g_2\prec\cdots\prec g_K
\]

% Strategy management

\[
x_{t+1}
=
x_t
+
p_t
-
c_t
+
\Delta_t^{\rm trade}
-
\Delta_t^{\rm conflict}
\]

\[
\max_\pi
\mathbb E
\left[
\sum_{t=0}^{T}
\gamma^t
U
(
x_t,
\mathbf a_t,
s_t
)
\right]
\]

\[
\sum_j
c_j(a_t)
\le
B_t
\]

\[
\mathbb B_{\rm Game}
=
\{
\mathrm{MineDojo},
\mathrm{KORGym},
\mathrm{TextArena},
\mathrm{VGameGym},
\mathrm{KorBench},
\mathrm{AIGameStore},
\mathrm{INGVP},
\mathrm{VideoGameBench},
\mathrm{GVGAILLM},
\mathrm{BALROG},
\mathrm{SmartPlay},
\mathrm{DSGBench},
\mathrm{GTBench},
\mathrm{PokeLLMon},
\mathrm{MCPlanner},
\mathrm{GameTraversalBenchmark},
\mathrm{LMRLGym},
\mathrm{Clembench},
\mathrm{BabaIsAI},
\mathrm{HLA},
\mathrm{LLMArena},
\mathrm{TextGames},
\mathrm{GameArena},
\mathrm{SPINBench},
\mathrm{GAMEBoT},
\mathrm{GameBench},
\mathrm{MineWorld},
\mathrm{AvalonBench},
\mathrm{Werewolf},
\mathrm{GameFactory},
\mathrm{GameNGen},
\mathrm{OGC},
\mathrm{MiniGrid},
\mathrm{MiniWorld}
\}
\]

% ---------------------------------------------------------------------
% Tool
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm Tool}
=
\{
\mathcal D_{\rm Conventional},
\mathcal D_{\rm UserSim},
\mathcal D_{\rm MCP}
\}
\]

\[
\mathcal T
=
\{T_1,\ldots,T_K\}
\]

\[
T_k
=
(
n_k,
d_k,
\Sigma_k^{\rm in},
\Sigma_k^{\rm out},
C_k
)
\]

\[
k_t^\star
=
\arg\max_{k}
P_\theta
(
T_k\mid g,h_t,\mathcal T
)
\]

\[
x_t^\star
=
\arg\max_x
P_\theta
(
x\mid
T_{k_t^\star},
g,h_t
)
\]

\[
o_{t+1}
=
T_{k_t^\star}(x_t^\star)
\]

\[
V_{\rm schema}
=
\mathbf1
[
x_t^\star\models\Sigma_{k_t^\star}^{\rm in}
]
\]

\[
V_{\rm tool}
=
V_{\rm select}
V_{\rm schema}
V_{\rm execution}
V_{\rm outcome}
\]

% User simulation

\[
u_t
=
(
I_t,
P_t,
C_t,
H_t^{\rm dialogue}
)
\]

\[
u_{t+1}
\sim
P_U
(
\cdot\mid
u_t,a_t,o_{t+1}
)
\]

\[
I_{t+1}
=
\operatorname{RefineIntent}
(
I_t,m_t^{\rm user}
)
\]

\[
a_t^{\rm agent},
a_t^{\rm user}
\longrightarrow
s_{t+1}
\]

% MCP

\[
\mathcal M
=
\{M_1,\ldots,M_J\},
\qquad
M_j=\{T_{j1},\ldots,T_{jK_j}\}
\]

\[
\mathcal T_g
=
\operatorname{RetrieveTopK}
(
g,\mathcal M
)
\]

\[
g
\rightarrow
(g_1,\ldots,g_L)
\]

\[
T_\ell^\star
=
\arg\max_{T\in\mathcal T_g}
P
(
T\mid g_\ell,h_\ell
)
\]

\[
G_{\rm tool}
=
(V_{\rm tool},E_{\rm dep})
\]

\[
T_i\rightarrow T_j
\iff
\Sigma_i^{\rm out}
\cap
\Sigma_j^{\rm in}
\neq\varnothing
\]

\[
\mathbb B_{\rm Tool}
=
\{
\mathrm{APIBank},
\mathrm{ToolBench},
\mathrm{ToolEyes},
\mathrm{AppWorld},
\tau\mathrm{Bench},
\mathrm{ACEBench},
\mathrm{FlowBench},
\mathrm{TRAJECTBench},
\mathrm{ETAPP},
\mathrm{BFCL},
\mathrm{UserBench},
\tau^2\mathrm{Bench},
\mathrm{MCPVerse},
\mathrm{MCPToolBench++},
\mathrm{MCPUniverse},
\mathrm{MCPBench},
\mathrm{MCPMark},
M^3\mathrm{Bench}
\}
\]

% ---------------------------------------------------------------------
% Code
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm Code}
=
\{
\mathcal D_{\rm Gen},
\mathcal D_{\rm Understand},
\mathcal D_{\rm Verify},
\mathcal D_{\rm Debug}
\}
\]

\[
p_\theta
=
\operatorname{Generate}
(
r,\mathcal C_{\rm repo}
)
\]

\[
\mathcal C_{\rm repo}
=
(
F,
G_{\rm import},
G_{\rm call},
G_{\rm symbol},
D_{\rm docs},
T_{\rm tests}
)
\]

\[
G_{\rm repo}
=
(V_F,E_{\rm dep})
\]

\[
F^\star
=
\operatorname{Retrieve}
(
r,G_{\rm repo},D_{\rm docs}
)
\]

\[
\operatorname{Verify}(p)
=
\mathbf1[\operatorname{compile}(p)]
\prod_{j=1}^{M}
\mathbf1[T_j(p)=1]
\]

\[
Q_{\rm kernel}(p)
=
\operatorname{Correct}(p)
\cdot
\frac{
\operatorname{Perf}(p)
}{
\operatorname{Perf}(p_{\rm baseline})
}
\]

\[
e_t
=
\operatorname{Execute}
(
p_t,T
)
\]

\[
\ell_t
=
\operatorname{Localize}
(
p_t,e_t,G_{\rm repo}
)
\]

\[
\Delta p_t
=
\operatorname{Patch}
(
p_t,\ell_t,e_t
)
\]

\[
p_{t+1}
=
p_t\oplus\Delta p_t
\]

\[
p^\star
=
p_T:
\operatorname{Verify}(p_T)=1
\]

\[
\mathbb B_{\rm Code}
=
\{
\mathrm{SWEBench},
\mathrm{InterCode},
\mathrm{CodeAgent},
\mathrm{BigCodeBench},
\mathrm{CodeElo},
\mathrm{LiveCodeBench},
\mathrm{CSRBench},
\mathrm{SWEBenchPro},
\mathrm{TerminalBench},
\mathrm{SWEBenchMultimodal},
\mathrm{KernelBench},
\mathrm{IDEBench},
\mathrm{MBPP},
\mathrm{CRUXEval},
\mathrm{DebugBench},
\mathrm{CodeRAGBench},
\mathrm{SWTBench},
\mathrm{FEABench},
\mathrm{MultiSWEBench},
\mathrm{NL2RepoBench}
\}
\]

% ---------------------------------------------------------------------
% Domain-specific
% ---------------------------------------------------------------------

\[
\mathcal D_{\rm Domain}
=
\{
\mathcal D_{\rm BioMed},
\mathcal D_{\rm Science},
\mathcal D_{\rm Finance}
\}
\]

\[
\pi_d
:
\mathcal H_d
\rightarrow
\Delta(\mathcal A_d)
\]

\[
\mathcal C_d
=
\{
c_1^{(d)},\ldots,c_m^{(d)}
\}
\]

\[
a_t\in\mathcal A_d^{\rm valid}
\iff
\forall c\in\mathcal C_d:
c(s_t,a_t)=1
\]

% Biomedical

\[
s_t^{\rm med}
=
(
EHR_t,
L_t,
M_t,
G_t,
W_t
)
\]

\[
a_t^{\rm med}
\in
\mathcal A_{\rm clinical}
\cup
\mathcal A_{\rm bioinformatics}
\]

\[
U_{\rm med}
=
R_{\rm task}
-
\lambda_{\rm risk}
R_{\rm clinical-risk}
\]

% Science

\[
H_0
\xrightarrow{\operatorname{design}}
e_1
\xrightarrow{\operatorname{execute}}
y_1
\xrightarrow{\operatorname{update}}
H_1
\xrightarrow{}
\cdots
\xrightarrow{}
H_T
\]

\[
P(H_{t+1}\mid y_{\le t})
\propto
P(y_t\mid H_{t+1})P(H_t)
\]

% Finance

\[
s_t^{\rm fin}
=
(
x_t^{\rm market},
x_t^{\rm news},
x_t^{\rm fundamentals},
x_t^{\rm portfolio}
)
\]

\[
\max_{\pi}
\mathbb E[R_T]
-
\lambda
\operatorname{Risk}(R_T)
\]

\[
\operatorname{Risk}
\in
\{
\operatorname{Var},
\operatorname{CVaR},
\operatorname{Drawdown}
\}
\]

\[
\mathbb B_{\rm Domain}
=
\{
\mathrm{BioCoder},
\mathrm{TravelPlanner},
\mathrm{DSEval},
\mathrm{NaturalPlan},
\mathrm{ScienceAgentBench},
\mathrm{DSBench},
\mathrm{MLEBench},
\mathrm{DiscoveryWorld},
\mathrm{MedAgentBench},
\mathrm{StockBench},
\mathrm{MLEDojo},
\mathrm{FinDeepResearch},
\mathrm{PaperArena},
\mathrm{BixBench},
\mathrm{CRMArenaPro},
\mathrm{MedAgentGym},
\mathrm{FinanceAgentBenchmark},
\mathrm{EcomBench},
\mathrm{MedAgentBenchV2},
\mathrm{MedMCPCalc},
\mathrm{ESG},
\mathrm{BioAgentBench},
\mathrm{WoWBench},
\mathrm{EnterpriseOpsGym},
\mathrm{MetaClaw},
\mathrm{ClawEval},
\mathrm{ClawArena}
\}
\]

% ---------------------------------------------------------------------
% Cross-domain
% ---------------------------------------------------------------------

\[
d
\sim
p_{\rm env}(d)
\]

\[
\mathcal E_d
\sim
p(\mathcal E\mid d)
\]

\[
J_{\rm cross}(\pi)
=
\mathbb E_{d\sim p(d)}
\mathbb E_{\mathcal E_d}
[
J(\pi;\mathcal E_d)
]
\]

\[
J_{\rm worst}(\pi)
=
\min_{d\in\mathcal D}
J(\pi;\mathcal E_d)
\]

\[
\operatorname{Transfer}(d_i\rightarrow d_j)
=
J_{d_j}(\pi_{d_i})
-
J_{d_j}(\pi_0)
\]

\[
\operatorname{GeneralizationGap}
=
J_{\rm train-env}
-
J_{\rm unseen-env}
\]

\[
\mathbb B_{\rm Cross}
=
\{
\mathrm{OpenAIGym},
\mathrm{HuggingGPT},
\mathrm{AgentBench},
\mathrm{TaskLAMA},
\mathrm{TaskBench},
\mathrm{AgentBoard},
\mathrm{AgentGym},
\mathrm{WorfBench},
\mathrm{GEM},
\mathrm{MLGym},
\mathrm{MedBrowseComp},
\mathrm{WebMMU},
\mathrm{TPSBench},
\mathrm{AutoEnv},
\mathrm{AgencyBench},
\mathrm{AgentVista}
\}
\]

% =====================================================================
% V — Environment synthesis
% :chatgpt-content-reference{index="4"}
% =====================================================================

\[
\boxed{
\mathcal G_{\rm syn}
=
\{
\mathcal G_{\rm symbolic},
\mathcal G_{\rm neural}
\}
}
\]

% ---------------------------------------------------------------------
% Symbolic synthesis
% ---------------------------------------------------------------------

\[
\mathcal E_{\mathcal C}
=
\langle
\mathcal S,\mathcal A,
\mathcal P_{\mathcal C},
\mathcal R_{\mathcal C}
\rangle
\]

\[
\mathcal P_{\mathcal C}
:
\mathcal S\times\mathcal A
\rightarrow
\mathcal S
\]

\[
\mathcal E
=
\operatorname{Compile}
(
\mathcal C
)
\]

\[
\mathcal G_{\rm symbolic}
=
\{
\mathcal G_{\rm task},
\mathcal G_{\rm real},
\mathcal G_{\rm denovo}
\}
\]

% Task-driven

\[
x_i
\in
\mathcal D_{\rm static}
\]

\[
x_i
\xrightarrow{\mathcal G_{\rm task}}
(
\mathcal C_i,
s_{0,i},
g_i,
V_i
)
\]

\[
\mathcal E_i
=
\operatorname{Package}
(
\mathcal C_i,
s_{0,i},
g_i,V_i
)
\]

\[
\tau_i^\star
=
\operatorname{Execute}
(
\pi_{\rm expert},
\mathcal E_i,
g_i
)
\]

\[
\operatorname{Accept}(\mathcal E_i)
=
V_i(\tau_i^\star)
\cdot
\mathbf1[
\operatorname{RuntimeError}(\mathcal E_i)=0
]
\]

% Multi-agent environment construction

\[
\mathcal E_i^{(0)}
=
G_{\rm builder}(x_i)
\]

\[
T_i
=
G_{\rm test}
(
x_i,\mathcal E_i^{(0)}
)
\]

\[
q_i
=
G_{\rm problem}
(
x_i,\mathcal E_i^{(0)},T_i
)
\]

\[
\mathcal E_i
=
(
\mathcal E_i^{(0)},
T_i,q_i
)
\]

\[
\operatorname{Accept}(\mathcal E_i)
=
\prod_j
\mathbf1
[
T_{ij}(\mathcal E_i)=1
]
\]

% Environment reuse

\[
\mathcal I_{\rm base}
+
\Delta_i
\rightarrow
\mathcal E_i
\]

\[
C_{\rm build}
=
C_{\rm base}
+
\sum_iC(\Delta_i)
\ll
\sum_i C(\mathcal E_i)
\]

% Environment inversion

\[
\mathcal E_{\rm valid}
\xrightarrow{\delta_{\rm break}}
\mathcal E_{\rm broken}
\]

\[
e
=
\operatorname{Execute}
(
\mathcal E_{\rm broken}
)
\]

\[
(\mathcal E_{\rm broken},e,\delta_{\rm repair})
\in
\mathcal D_{\rm repair}
\]

% Real-world-driven

\[
\Pi:
\mathcal E_{\rm real}
\rightarrow
\widetilde{\mathcal E}
\]

\[
\widetilde{\mathcal E}
=
\Pi
(
\mathcal E_{\rm real};
\phi
)
\]

\[
\phi^\star
=
\arg\min_{\phi}
D
(
P_{\widetilde{\mathcal E}_\phi},
P_{\mathcal E_{\rm real}}
)
+
\lambda
C(\widetilde{\mathcal E}_\phi)
\]

\[
\operatorname{Fidelity}
\uparrow
\iff
D
(
P_{\widetilde{\mathcal E}},
P_{\mathcal E_{\rm real}}
)
\downarrow
\]

\[
\mathcal T_{\rm complex}
=
g_1\circ g_2\circ\cdots\circ g_K
\]

\[
\mathcal G_{\rm real}
:
\mathcal E_{\rm real}
\mapsto
\{
\widetilde{\mathcal E},
\mathcal T,
\mathcal V
\}
\]

% De novo

\[
z
\sim
p(z)
\]

\[
\mathcal L
=
G_{\rm logic}(z)
\]

\[
G_{\rm dep}
=
G_{\rm structure}(\mathcal L)
\]

\[
\mathcal C
=
G_{\rm code}
(
\mathcal L,G_{\rm dep}
)
\]

\[
\mathcal V
=
G_{\rm verifier}
(
\mathcal L,\mathcal C
)
\]

\[
\mathcal E
=
\operatorname{Compile}
(
\mathcal L,G_{\rm dep},\mathcal C,\mathcal V
)
\]

\[
\mathcal E\sim
p_\psi
(
\mathcal E\mid z
)
\]

\[
\mathcal E^\star
\in
\left\{
\mathcal E:
C_{\rm corr}\ge\tau_c,\;
D_{\rm div}\ge\tau_d,\;
F_{\rm fid}\ge\tau_f
\right\}
\]

\[
\deg(\mathcal G_{\rm freedom})
:
\mathcal G_{\rm task}
<
\mathcal G_{\rm real}
<
\mathcal G_{\rm denovo}
\]

\[
\deg(\mathcal V_{\rm required})
:
\mathcal G_{\rm task}
<
\mathcal G_{\rm real}
<
\mathcal G_{\rm denovo}
\]

% ---------------------------------------------------------------------
% Neural synthesis
% ---------------------------------------------------------------------

\[
\mathcal G_{\rm neural}
=
\{
\mathcal G_{\rm pixel},
\mathcal G_{\rm word},
\mathcal G_{\rm latent}
\}
\]

% Pixel level

\[
z_t
=
E_\phi(o_t)
\]

\[
q_\phi(z_t\mid o_t)
\]

\[
p_\psi(o_t\mid z_t)
\]

\[
\mathcal L_{\rm VAE}
=
\mathbb E_{q_\phi(z\mid o)}
[-\log p_\psi(o\mid z)]
+
\beta
D_{\rm KL}
[
q_\phi(z\mid o)
\Vert
p(z)
]
\]

\[
p_\theta(z_{t+1}\mid z_{\le t},a_{\le t})
\]

\[
\hat o_{t+1}
\sim
p_\psi
(
\cdot\mid
z_{t+1}
)
\]

\[
p_\Theta
(
o_{1:T}\mid
o_0,a_{0:T-1}
)
=
\prod_{t=0}^{T-1}
p_\Theta
(
o_{t+1}\mid
o_{\le t},a_{\le t}
)
\]

\[
\hat o_{t+1}
=
G_\Theta
(
o_{\le t},a_{\le t},
\xi_t
)
\]

\[
\epsilon_{\rm roll}(T)
=
D
\left(
p_{\rm real}(o_T),
p_\Theta(o_T\mid\hat o_{<T},a_{<T})
\right)
\]

\[
\epsilon_{\rm roll}(T+1)
\ge
\epsilon_{\rm roll}(T)
\quad
\text{under accumulated model error}
\]

% Diffusion-style pixel world model

\[
x_\tau
=
\sqrt{\bar\alpha_\tau}x_0
+
\sqrt{1-\bar\alpha_\tau}\epsilon
\]

\[
\mathcal L_{\rm diff}
=
\mathbb E_
{x_0,\epsilon,\tau,c}
\left[
\left\|
\epsilon-
\epsilon_\theta(x_\tau,\tau,c)
\right\|_2^2
\right]
\]

\[
c
=
(
o_{\le t},a_{\le t},g
)
\]

% Word level

\[
x_t
=
\operatorname{Serialize}(s_t)
\]

\[
p_\theta
(
x_{t+1},r_t
\mid
x_{\le t},a_{\le t},K_t
)
\]

\[
K_t^{\rm task}
=
\operatorname{Retrieve}
(
q_{\rm task}(g),
\mathcal M
)
\]

\[
K_t^{\rm state}
=
\operatorname{Summarize}
(
h_t
)
\]

\[
K_t
=
K_t^{\rm task}
\cup
K_t^{\rm state}
\]

\[
\hat s_{t+1}^{(j)}
\sim
P_\theta
(
\cdot\mid
s_t,a_t^{(j)},K_t
)
\]

\[
a_t^\star
=
\arg\max_{a^{(j)}}
\left[
\hat r_t^{(j)}
+
\gamma
\hat V
(
\hat s_{t+1}^{(j)}
)
\right]
\]

% Imagination tree

\[
\mathcal T_t
=
(V_t,E_t)
\]

\[
v_{d+1}
\sim
P_\theta
(
s'\mid v_d,a_d
)
\]

\[
Q(v,a)
\leftarrow
Q(v,a)
+
\frac{
R_{\rm rollout}-Q(v,a)
}{
N(v,a)
}
\]

\[
a^\star
=
\arg\max_a
\left[
Q(v,a)
+
c
\sqrt{
\frac{\log N(v)}{N(v,a)}
}
\right]
\]

% Latent level

\[
z_t
=
f_\phi(o_t)
\]

\[
\hat z_{t+k}
=
g_\theta
(
z_{\le t},
a_{t:t+k-1}
)
\]

\[
z_{t+k}^{\rm target}
=
f_{\bar\phi}
(
o_{t+k}
)
\]

\[
\mathcal L_{\rm JEPA}
=
\left\|
\hat z_{t+k}
-
\operatorname{sg}
(
z_{t+k}^{\rm target}
)
\right\|_2^2
\]

\[
z_t
=
z_t^{\rm inv}
\oplus
z_t^{\rm eq}
\]

\[
z^{\rm inv}(T_g o)
\approx
z^{\rm inv}(o)
\]

\[
z^{\rm eq}(T_g o)
\approx
\rho(g)
z^{\rm eq}(o)
\]

\[
f_{\rm frozen}(o)
=
z,
\qquad
\nabla f_{\rm frozen}=0
\]

\[
\theta^\star
=
\arg\min_\theta
\sum_t
\left\|
g_\theta
(
z_t,a_t
)
-
z_{t+1}
\right\|^2
\]

\[
C_{\rm pixel}
>
C_{\rm word}
>
C_{\rm latent}
\]

\[
F_{\rm perceptual}^{\rm pixel}
>
F_{\rm perceptual}^{\rm word}
\]

\[
A_{\rm abstraction}^{\rm latent}
>
A_{\rm abstraction}^{\rm pixel}
\]

% =====================================================================
% V-C — Environment quality
% :chatgpt-content-reference{index="5"}
% =====================================================================

\[
\boxed{
\mathcal Q_{\rm env}
=
(
Q_{\rm corr},
Q_{\rm div},
Q_{\rm comp},
Q_{\rm fid}
)
}
\]

% ---------------------------------------------------------------------
% Correctness
% ---------------------------------------------------------------------

\[
Q_{\rm corr}
=
f
(
C_{\rm executable},
C_{\rm transition},
C_{\rm solvable},
C_{\rm verifier}
)
\]

\[
C_{\rm executable}
=
\frac1N
\sum_{i=1}^{N}
\mathbf1
[
\operatorname{run}(\mathcal E_i)=1
]
\]

\[
C_{\rm transition}
=
\frac{
\sum_{(s,a,s')}
\mathbf1
[
s'\in\operatorname{ValidNext}(s,a)
]
}{
N_{\rm trans}
}
\]

\[
C_{\rm solvable}
=
\frac1N
\sum_i
\mathbf1
[
\exists\tau_i:
s_{T_i}\models g_i
]
\]

\[
C_{\rm verifier}
=
1-
P
[
V(\tau)\neq Y^\star(\tau)
]
\]

\[
\operatorname{Agreement}(V,Y^\star)
=
\frac1N
\sum_i
\mathbf1
[
V(\tau_i)=Y_i^\star
]
\]

\[
C_{\rm semantic}
=
\frac1N
\sum_i
\operatorname{sim}
(
f(o_i^{\rm gen}),
f(o_i^{\rm target})
)
\]

\[
\operatorname{Acc}_{\rm IDM}
=
\frac1T
\sum_{t=1}^{T}
\mathbf1
[
\hat a_t^{\rm IDM}=a_t
]
\]

\[
d_H(A,B)
=
\max
\left\{
\sup_{a\in A}\inf_{b\in B}\|a-b\|,
\sup_{b\in B}\inf_{a\in A}\|b-a\|
\right\}
\]

\[
\operatorname{NDTW}
=
\exp
\left[
-\frac{
\operatorname{DTW}(\tau,\tau^\star)
}{
\eta|\tau^\star|
}
\right]
\]

\[
\operatorname{IoU}
(
B,\hat B
)
=
\frac{|B\cap\hat B|}{|B\cup\hat B|}
\]

\[
\operatorname{mIoU}
=
\frac1N
\sum_i
\operatorname{IoU}
(
B_i,\hat B_i
)
\]

% ---------------------------------------------------------------------
% Diversity
% ---------------------------------------------------------------------

\[
Q_{\rm div}
=
f
(
D_{\rm task},
D_{\rm state},
D_{\rm tool},
D_{\rm language},
D_{\rm output}
)
\]

\[
D_{\rm pair}
=
\frac{2}{N(N-1)}
\sum_{i<j}
\left[
1-
\cos(e_i,e_j)
\right]
\]

\[
D_{\rm coverage}
=
\frac{
|\cup_{i=1}^{N}\mathcal C(\mathcal E_i)|
}{
|\mathcal C_{\rm universe}|
}
\]

\[
D_{\rm tool}
=
\frac{
|\cup_i\mathcal T_i|
}{
|\mathcal T_{\rm available}|
}
\]

\[
D_{\rm path}
=
H
[
p(\tau\mid g)
]
\]

\[
D_{\rm output}(x)
=
H
[
p_\theta(y\mid x)
]
\]

\[
D_{\rm conditional}
=
\mathbb E_x
\left[
\frac{2}{K(K-1)}
\sum_{i<j}
d
(
y_i^{(x)},
y_j^{(x)}
)
\right]
\]

\[
y_i^{(x)}
\sim
p_\theta(\cdot\mid x)
\]

\[
D_{\rm action/context}
=
\mathbb E_a
\mathbb E_{c_i\neq c_j}
d
\left(
G(a,c_i),
G(a,c_j)
\right)
\]

% ---------------------------------------------------------------------
% Complexity
% ---------------------------------------------------------------------

\[
Q_{\rm comp}
=
f
(
H,
N_{\rm tools},
N_{\rm calls},
N_{\rm entities},
N_{\rm conditions},
L_{\rm code},
D_{\rm graph},
B_{\rm graph},
L^\star
)
\]

\[
C_{\rm structural}
=
\alpha_HH
+
\alpha_TN_{\rm tools}
+
\alpha_AN_{\rm calls}
+
\alpha_EN_{\rm entities}
+
\alpha_CN_{\rm conditions}
+
\alpha_LL_{\rm code}
\]

\[
C_{\rm graph}
=
\alpha_d
\operatorname{depth}(G)
+
\alpha_b
\operatorname{branch}(G)
+
\alpha_e|E(G)|
\]

\[
C_{\rm planning}
=
L^\star
=
\min_{\tau:s_T\models g}
|\tau|
\]

\[
C_{\rm neural}
=
\alpha_HH_{\rm rollout}
+
\alpha_BB_{\rm candidates}
+
\alpha_II_{\rm search}
\]

\[
p_{\rm success}(c,\pi)
=
P
(
s_T\models g
\mid
C(\mathcal E)=c,\pi
)
\]

\[
c^\star
=
\arg\max_c
\mathcal I
(
\operatorname{Outcome};
\operatorname{Ability}
\mid C=c
)
\]

\[
c^\star
\approx
\left\{
c:
0<
p_{\rm success}(c,\pi)
<1
\right\}
\]

\[
D_{\rm discrim}(e)
=
\operatorname{Var}_{\pi\in\Pi}
[
J(\pi;e)
]
\]

\[
e^\star
=
\arg\max_e
D_{\rm discrim}(e)
\quad
\text{s.t.}
\quad
\operatorname{Solvable}(e)=1
\]

% ---------------------------------------------------------------------
% Fidelity
% ---------------------------------------------------------------------

\[
Q_{\rm fid}
=
1-
D
(
P_{\rm synth},
P_{\rm real}
)
\]

\[
F_{\rm symbolic}
=
1-
\frac{
\operatorname{EditDistance}
(
\mathcal C_{\rm synth},
\mathcal C_{\rm ref}
)
}{
Z
}
\]

\[
\operatorname{FID}
=
\|\mu_r-\mu_g\|_2^2
+
\operatorname{Tr}
\left(
\Sigma_r+\Sigma_g
-
2
(\Sigma_r\Sigma_g)^{1/2}
\right)
\]

\[
\operatorname{FVD}
=
\|\mu_r^{(v)}-\mu_g^{(v)}\|_2^2
+
\operatorname{Tr}
\left(
\Sigma_r^{(v)}+\Sigma_g^{(v)}
-
2
(
\Sigma_r^{(v)}
\Sigma_g^{(v)}
)^{1/2}
\right)
\]

\[
\operatorname{LPIPS}(x,\hat x)
=
\sum_l
\frac1{H_lW_l}
\sum_{h,w}
\left\|
w_l\odot
(
\hat y_{hw}^{\,l}
-
y_{hw}^{\,l}
)
\right\|_2^2
\]

\[
\epsilon_{\rm physics}
=
\sum_t
\left[
\lambda_1
\|x_{t+1}-F_{\rm rigid}(x_t,a_t)\|
+
\lambda_2
\epsilon_{\rm collision}
+
\lambda_3
\epsilon_{\rm gravity}
+
\lambda_4
\epsilon_{\rm contact}
\right]
\]

\[
A_{\rm disc}
=
P
[
D_\psi(\mathcal E)=
\operatorname{real/synthetic\ label}
]
\]

\[
F_{\rm Turing}
=
1-
2
\left|
A_{\rm disc}-\frac12
\right|
\]

\[
\operatorname{FVMD}
=
D_{\rm Fr\acute echet}
(
\phi_{\rm motion}(V_{\rm real}),
\phi_{\rm motion}(V_{\rm synth})
)
\]

% =====================================================================
% VI — Agent evolution
% Four paths: memory, workflow, offline trajectories, online exploration
% :chatgpt-content-reference{index="6"}
% =====================================================================

\[
\boxed{
\mathcal U_{\rm agent}
=
\{
\mathcal U_{\rm memory},
\mathcal U_{\rm workflow},
\mathcal U_{\rm offline},
\mathcal U_{\rm online}
\}
}
\]

% ---------------------------------------------------------------------
% VI-A Memory-centric experience evolution
% ---------------------------------------------------------------------

\[
\mathcal M_t
=
\{
m_1,\ldots,m_{N_t}
\}
\]

\[
m_i
=
(
k_i,v_i,e_i,q_i,t_i
)
\]

\[
q_t^{\rm mem}
=
f_q(h_t,g)
\]

\[
m_t^\star
=
\operatorname{TopK}_{m\in\mathcal M_t}
\operatorname{sim}
(
q_t^{\rm mem},
k_m
)
\]

\[
a_t
\sim
\pi_\theta
(
\cdot
\mid
h_t,m_t^\star
)
\]

\[
\mathcal M_{t+1}
=
\operatorname{Maintain}
\left(
\mathcal M_t
\cup
\operatorname{Extract}(\tau_t)
\right)
\]

\[
\mathcal M
=
\mathcal M_{\rm trajectory}
\cup
\mathcal M_{\rm script}
\cup
\mathcal M_{\rm skill}
\]

% Instance trajectory experience

\[
m_i^{\rm traj}
=
\tau_i
=
(o_0,a_0,r_0,\ldots,o_T)
\]

\[
R_{\rm traj}(q,\tau_i)
=
\operatorname{sim}
(
f(q),
f(\tau_i)
)
\]

\[
\tau^\star
=
\arg\max_{\tau_i\in\mathcal M_{\rm trajectory}}
R_{\rm traj}(q,\tau_i)
\]

\[
\pi(a_t\mid h_t)
\rightarrow
\pi
(
a_t\mid
h_t,\tau^\star
)
\]

% Abstract scripts

\[
\mathcal T_c
=
\{
\tau_i:
c(\tau_i)=c
\}
\]

\[
z_c
=
\operatorname{Abstract}
(
\mathcal T_c
)
\]

\[
z_c
=
(
g_c,
p_{c,1},\ldots,p_{c,K},
\mathcal C_c
)
\]

\[
z^\star
=
\arg\max_{z\in\mathcal M_{\rm script}}
\operatorname{sim}
(
f(g),f(z)
)
\]

\[
\pi(a_t\mid h_t,z^\star)
\]

\[
\mathcal M_{\rm abstract}
=
\{
\mathcal M_{\rm persona},
\mathcal M_{\rm working},
\mathcal M_{\rm episodic},
\mathcal M_{\rm procedural}
\}
\]

% Structured skills

\[
\sigma_k
=
(
\operatorname{pre}_k,
\pi_k,
\operatorname{term}_k,
V_k
)
\]

\[
\sigma_k
\text{ applicable}
\iff
\operatorname{pre}_k(s_t)=1
\]

\[
\sigma^\star
=
\arg\max_{\sigma_k}
Q_{\rm skill}
(
h_t,g,\sigma_k
)
\]

\[
a_{t:t+\Delta}
\sim
\pi_{\sigma^\star}
(
\cdot\mid
h_t
)
\]

\[
\operatorname{term}_{\sigma^\star}
(
s_{t+\Delta}
)
=1
\]

\[
\mathcal M_{\rm skill}^{(k+1)}
=
\operatorname{Distill}
\left(
\mathcal M_{\rm skill}^{(k)}
\cup
\{\tau^{(k)}\}
\right)
\]

\[
r_t^{\rm total}
=
r_t^{\rm env}
+
\lambda_{\rm skill}
r_t^{\rm skill}
\]

% ---------------------------------------------------------------------
% VI-B Workflow evolution
% ---------------------------------------------------------------------

\[
W
=
(V_W,E_W)
\]

\[
V_W
=
V_{\rm LLM}
\cup
V_{\rm tools}
\cup
V_{\rm agents}
\cup
V_{\rm functions}
\]

\[
e_{ij}
=
(
v_i\rightarrow v_j,
c_{ij}
)
\]

\[
W
\in
\{
W_{\rm fixed},
W_{\rm automated},
W_{\rm evolving}
\}
\]

% Fixed

\[
W_{\rm fixed}^{(k+1)}
=
W_{\rm fixed}^{(k)}
=
W_0
\]

\[
v_1\rightarrow v_2\rightarrow\cdots\rightarrow v_K
\]

\[
v_i
\xrightarrow{c_i(h)=1}
v_j
\]

\[
v_i
\xrightarrow{\operatorname{failure}}
v_i
\]

\[
v_i
\xrightarrow{\operatorname{success}}
v_{i+1}
\]

\[
\pi_i:
x_i\mapsto y_i
\]

% Automated

\[
g
\xrightarrow{\pi_{\rm planner}}
\{g_1,\ldots,g_K\}
\]

\[
W_g
=
G_{\rm orch}
(
g,
\mathcal A_{\rm workers},
\mathcal T
)
\]

\[
w_k^\star
=
\arg\max_{w\in\mathcal A_{\rm workers}}
P
(
w\mid
g_k,h_k
)
\]

\[
y_k
=
w_k^\star(g_k)
\]

\[
W_{t+1}
=
\operatorname{Adjust}
(
W_t,
o_{t+1},
r_t
)
\]

\[
\boxed{
\mathrm{Planner}
\rightarrow
\mathrm{Coordinator}
\rightarrow
\{\mathrm{Workers}\}
\rightarrow
\mathrm{Feedback}
\rightarrow
\mathrm{Coordinator}
}
\]

% Evolving

\[
W_{k+1}
=
\mathcal U_W
(
W_k,
\tau_k,
r_k,
c_k
)
\]

\[
V_{W_{k+1}}
=
V_{W_k}
\cup
V_{\rm new\ tools}
\cup
V_{\rm new\ roles}
\]

\[
E_{W_{k+1}}
=
\operatorname{Rewrite}
(
E_{W_k},
\operatorname{Reflect}(\tau_k)
)
\]

\[
\Delta W_k
=
W_{k+1}-W_k
\neq0
\]

\[
\Delta W_k
\xrightarrow{\operatorname{persist}}
\Delta W_{k+1}
\]

\[
W^\star
=
\arg\max_W
\mathbb E_{\mathcal E\sim p(\mathcal E)}
J
(
\pi_{\theta,W};
\mathcal E
)
\]

\[
W
\xrightarrow{\operatorname{distill}}
\pi_{\theta'}
\]

% ---------------------------------------------------------------------
% VI-C Trajectory-centric offline evolution
% ---------------------------------------------------------------------

\[
\boxed{
\mathcal D_{\rm SFT}
=
\operatorname{Refine}
\circ
\operatorname{TrajectorySynthesis}
\circ
\operatorname{TaskSynthesis}
}
\]

\[
\mathcal Q
=
G_{\rm task}
(
\mathcal R_{\rm source},
\mathcal E
)
\]

\[
\tau
=
G_{\rm traj}
(
q,\mathcal E,\pi_{\rm teacher}
)
\]

\[
\tilde\tau
=
G_{\rm refine}
(
\tau,V,C
)
\]

\[
\mathcal D^\star
=
\{
(q,\tilde\tau):
V(\tilde\tau)=1
\}
\]

\[
\theta^\star
=
\arg\min_\theta
-
\sum_{(q,\tau)\in\mathcal D^\star}
\sum_t
w_{t,\tau}
\log
\pi_\theta(a_t\mid h_t)
\]

% Task synthesis: resource transformation

\[
q'
=
T_{\rm resource}
(
q,y,\mathcal A_{\rm tools}
)
\]

\[
T_{\rm resource}
\in
\{
T_{\rm annotation},
T_{\rm masking},
T_{\rm entity\ replacement},
T_{\rm seed\ expansion}
\}
\]

% Reverse synthesis

\[
\tau
\sim
\operatorname{Explore}
(
\pi,\mathcal E
)
\]

\[
q
=
G_{\rm instruction}
(
\tau
)
\]

\[
V_q
=
V
(
q,\tau
)
\]

\[
q^\star
=
q:
V_q=1
\]

\[
P(q\mid\tau)
\propto
\exp
[
\beta
H_{\rm interaction}(\tau)
]
\]

% Structure-based synthesis

\[
\mathcal G
\in
\{
G_{\rm API},
G_{\rm knowledge},
G_{\rm database},
G_{\rm AST},
G_{\rm DAG},
G_{\rm tree}
\}
\]

\[
v_0
\rightarrow
v_1
\rightarrow\cdots\rightarrow
v_L
\sim
\operatorname{Walk}(\mathcal G)
\]

\[
q
=
G_{\rm question}
(
v_{0:L},
x_{v_{0:L}}
)
\]

\[
C(q)
\uparrow
\Longleftrightarrow
L\uparrow
\lor
|\operatorname{Dependencies}(q)|\uparrow
\]

% Trajectory augmentation

\[
\tau'
=
T_{\rm aug}(\tau)
\]

\[
T_{\rm aug}
\in
\{
T_{\rm rewrite},
T_{\rm enrich},
T_{\rm expand}
\}
\]

\[
\tau'
=
\tau
\oplus
r_{1:T}^{\rm reasoning}
\]

\[
\{\tau'_j\}_{j=1}^{K}
=
\operatorname{ExpandPaths}
(
\tau
)
\]

% Sequential interaction

\[
h_{t+1}
=
h_t
\oplus
\operatorname{Thought}_t
\oplus
a_t
\oplus
o_{t+1}
\]

\[
a_t
=
\operatorname{Act}
(
\operatorname{Reason}(h_t)
)
\]

\[
\tau
=
\prod_{t=0}^{T-1}
[
\operatorname{Reason}
\rightarrow
\operatorname{Act}
\rightarrow
\operatorname{Observe}
]
\]

% Context folding

\[
m_t^{\rm local}
=
C_{\rm local}
(
o_{t-k:t},a_{t-k:t}
)
\]

\[
m_t^{\rm global}
=
C_{\rm deep}
(
m_{t-1}^{\rm global},
m_t^{\rm local}
)
\]

\[
h_t'
=
(
g,
m_t^{\rm global},
m_t^{\rm local}
)
\]

% Tree search

\[
\mathcal T
=
(V,E)
\]

\[
v_{k+1}
=
F(v_k,a_k)
\]

\[
\tau^\star
=
\arg\max_{\tau\in\operatorname{Paths}(\mathcal T)}
V(\tau)
\]

\[
a^\star
=
\arg\max_a
\left[
Q(s,a)
+
c
\sqrt{
\frac{\ln N(s)}{N(s,a)}
}
\right]
\]

% Model simulation

\[
u_t
\sim
P_{\rm user}
(
\cdot\mid h_t
)
\]

\[
o_{t+1}^{\rm tool}
\sim
P_{\rm tool}
(
\cdot\mid a_t
)
\]

\[
s_{t+1}
\sim
P_{\rm world}
(
\cdot\mid s_t,a_t
)
\]

\[
\tau_{\rm synth}
\sim
P_{\rm user}
P_{\rm agent}
P_{\rm tool}
P_{\rm world}
\]

% Refinement: filtering

\[
q_{\rm quality}(\tau)
=
\alpha_1V_{\rm outcome}
+
\alpha_2V_{\rm step}
+
\alpha_3V_{\rm structure}
+
\alpha_4V_{\rm judge}
+
\alpha_5V_{\rm self}
\]

\[
\operatorname{Keep}(\tau)
=
\mathbf1
[
q_{\rm quality}(\tau)\ge\tau_q
]
\]

% Correction

\[
t^\star
=
\min
\{
t:
V_t(\tau)=0
\}
\]

\[
\tau'
=
\tau_{<t^\star}
\oplus
a_{t^\star:T}^{\rm corrected}
\]

\[
a_{t^\star:T}^{\rm corrected}
=
G_{\rm correction}
(
\tau,
t^\star,
V
)
\]

\[
T_{\rm edit}
\in
\{
\operatorname{Remove},
\operatorname{Reorder},
\operatorname{Drop},
\operatorname{Keep}
\}
\]

\[
\tau'
=
T_{\rm edit}(\tau)
\]

% Rollback correction

\[
v_f
=
\operatorname{FailedNode}(\tau)
\]

\[
v_c
=
\operatorname{LCA}
(
v_f,v_{\rm valid}
)
\]

\[
\tau'
=
\tau_{0:v_c}
\oplus
a_{\rm rollback}
\oplus
\tau_{\rm corrected}
\]

% Iterative refinement

\[
\mathcal D_k
=
\operatorname{Collect}
(
\pi_{\theta_k},
\mathcal E_k
)
\]

\[
\widetilde{\mathcal D}_k
=
\operatorname{Refine}
(
\mathcal D_k
)
\]

\[
\theta_{k+1}
=
\operatorname{Train}
(
\theta_k,
\widetilde{\mathcal D}_k
)
\]

\[
\mathcal D_{k+1}
=
\operatorname{Collect}
(
\pi_{\theta_{k+1}},
\mathcal E_{k+1}
)
\]

\[
\boxed{
\pi_k
\rightarrow
\mathcal D_k
\rightarrow
\operatorname{Filter/Correct}
\rightarrow
\operatorname{SFT}
\rightarrow
\pi_{k+1}
}
\]

% Zone of proximal development

\[
d(q)
\in
[
c(\pi_k)-\epsilon_-,
c(\pi_k)+\epsilon_+
]
\]

\[
\mathcal Q_k^{\rm ZPD}
=
\{
q:
\tau_l
\le
P_{\pi_k}(\operatorname{success}\mid q)
\le
\tau_u
\}
\]

\[
c(\pi_{k+1})>c(\pi_k)
\Longrightarrow
d(\mathcal Q_{k+1}^{\rm ZPD})
>
d(\mathcal Q_k^{\rm ZPD})
\]

% ---------------------------------------------------------------------
% VI-D Exploration-centric online evolution
% ---------------------------------------------------------------------

\[
\mathcal U_{\rm online}
=
\{
\mathcal U_{\rm reasoning},
\mathcal U_{\rm reward},
\mathcal U_{\rm algorithm}
\}
\]

% Reasoning structure

\[
z_t
\in
\{
\langle\mathrm{think}\rangle,
\langle\mathrm{search}\rangle,
\langle\mathrm{feedback}\rangle,
\langle\mathrm{refine}\rangle,
\langle\mathrm{answer}\rangle
\}
\]

\[
P_\theta
(
z_t,a_t
\mid h_t
)
\]

\[
\operatorname{FormatValid}
(
z_{0:T}
)
=
\prod_t
\mathbf1[
z_t\in\mathcal Z_{\rm valid}
]
\]

\[
E_t
=
\operatorname{Retrieve}
(
q_t
)
\]

\[
\tilde E_t
=
\operatorname{RefineEvidence}
(
E_t,h_t
)
\]

\[
d_t
=
\begin{cases}
\mathrm{search},
&
U(\tilde E_t)>\tau_U
\\
\mathrm{answer},
&
U(\tilde E_t)\le\tau_U
\end{cases}
\]

% Reward design

\[
r
=
r_{\rm outcome}
+
r_{\rm process}
+
r_{\rm format}
+
r_{\rm efficiency}
+
r_{\rm exploration}
\]

\[
r_{\rm efficiency}
=
-\lambda_{\rm call}N_{\rm calls}
-\lambda_{\rm token}N_{\rm tokens}
-\lambda_{\rm path}T
\]

\[
r_{\rm sparse}
=
\mathbf1[s_T\models g]
\]

\[
r_{\rm dense}
=
\sum_{t=0}^{T}
r_t^{\rm process}
+
r_T^{\rm outcome}
\]

\[
r_{\rm intent}
=
\alpha r_{\rm answer}
+
\beta r_{\rm format}
-
\chi r_{\rm repetition}
\]

\[
\tilde r_j
=
\frac{
r_j-\mu_j
}{
\sigma_j+\epsilon
}
\]

\[
r_{\rm decoupled}
=
\sum_j
w_j\tilde r_j
\]

% Shapley credit

\[
\phi_i
=
\sum_{S\subseteq N\setminus\{i\}}
\frac{
|S|!(|N|-|S|-1)!
}{
|N|!
}
\left[
v(S\cup\{i\})-v(S)
\right]
\]

\[
r_i^{\rm credit}
=
\phi_i
\]

% Conditional reward release

\[
r_{\rm final}^{\rm released}
=
r_{\rm final}
\mathbf1
[
m_{\rm intermediate}\ge\tau
]
\]

\[
r_{\rm process}^{\rm released}
=
r_{\rm process}
\mathbf1
[
V_{\rm final}=1
]
\]

% Visual milestone process reward

\[
r_t^{\rm milestone}
=
\sum_{k}
w_k
\mathbf1
[
m_k(o_t)=1
\land
m_k(o_{t-1})=0
]
\]

% Credit allocation

\[
\mathcal G(s)
=
\{
(s,a_j,r_j,s_j')\}_{j=1}^{K}
\]

\[
\hat A(s,a_j)
=
r_j
+
\gamma V(s_j')
-
\frac1K
\sum_{k=1}^{K}
\left[
r_k+\gamma V(s_k')
\right]
\]

\[
A_t^{\rm micro}
=
w_t
A_{\rm episode}^{\rm macro}
\]

\[
\sum_{t=0}^{T}
w_t=1
\]

% Entropy preservation

\[
\mathcal H_t
=
-
\sum_a
\pi_\theta(a\mid h_t)
\log\pi_\theta(a\mid h_t)
\]

\[
\mathcal L
=
\mathcal L_{\rm PG}
+
\beta_H
\mathcal H
\]

\[
\mathcal H_t\rightarrow0
\quad\Longrightarrow\quad
\mathrm{exploration\ collapse}
\]

% Variance-aware trajectory selection

\[
V(\tau)
=
\operatorname{Var}
[
R(\tau^{(1)}),\ldots,R(\tau^{(K)})
]
\]

\[
P_{\rm retain}(\tau)
\propto
V(\tau)
\]

% Cross-policy sampling

\[
\tau
\sim
\sum_{j=1}^{M}
\alpha_j
p_{\pi_j,\mathcal E}(\tau)
\]

\[
\sum_j\alpha_j=1
\]

% Alternating RL-SFT

\[
\theta_{2k+1}
=
\theta_{2k}
+
\eta_{\rm RL}
\nabla_\theta
J_{\rm RL}(\theta_{2k})
\]

\[
\theta_{2k+2}
=
\theta_{2k+1}
-
\eta_{\rm SFT}
\nabla_\theta
\mathcal L_{\rm success}
(
\theta_{2k+1}
)
\]

\[
\boxed{
\mathrm{RL}
\rightleftarrows
\mathrm{SFT}_{\rm successful\ trajectories}
}
\]

% =====================================================================
% VII — Environment evolution
% :chatgpt-content-reference{index="7"}
% =====================================================================

\[
\boxed{
\mathcal U_{\rm env}
=
\{
\mathcal U_{\rm neural},
\mathcal U_{\rm difficulty},
\mathcal U_{\rm scaling}
\}
}
\]

% ---------------------------------------------------------------------
% Neural-driven evolution
% ---------------------------------------------------------------------

\[
\mathcal U_{\rm neural}
=
\{
\mathcal U_{\rm selfplay},
\mathcal U_{\rm worldmodel}
\}
\]

% Self-play

\[
q_k
\sim
G_{\phi_k}
(
q\mid\pi_{\theta_k}
)
\]

\[
\tau_k
\sim
p_{\pi_{\theta_k},\mathcal E(q_k)}
\]

\[
r_k
=
V(q_k,\tau_k)
\]

\[
\theta_{k+1}
=
\theta_k
+
\eta_A
\nabla_\theta
J
(
\pi_\theta;q_k
)
\]

\[
\phi_{k+1}
=
\phi_k
+
\eta_E
\nabla_\phi
U_E
(
q;\pi_{\theta_{k+1}}
)
\]

\[
U_E(q;\pi)
=
\operatorname{LearningProgress}(q,\pi)
-
\lambda
\operatorname{Unsolvable}(q,\pi)
-
\beta
\operatorname{Redundant}(q)
\]

\[
LP_k(q)
=
J_{k+1}(q)-J_k(q)
\]

\[
q_k^\star
=
\arg\max_q
LP_k(q)
\]

% Proposer-solver

\[
q
\sim
\pi_\theta^{\rm proposer}
\]

\[
y
\sim
\pi_\theta^{\rm solver}
(
\cdot\mid q
)
\]

\[
r_{\rm proposer}
=
f
(
V(q,y),
\Delta J_{\rm solver}
)
\]

\[
r_{\rm solver}
=
V(q,y)
\]

% Bug injector-fixer

\[
p_{\rm valid}
\xrightarrow{\pi_{\rm inject}}
p_{\rm bug}
\]

\[
p_{\rm bug}
\xrightarrow{\pi_{\rm fix}}
\hat p_{\rm valid}
\]

\[
r_{\rm inject}
=
\mathbf1[
\operatorname{nontrivial}(p_{\rm bug})
]
\mathbf1[
\operatorname{verifiable}(p_{\rm bug})
]
\]

\[
r_{\rm fix}
=
\mathbf1[
T(\hat p_{\rm valid})=1
]
\]

% Multi-role self-play

\[
\Pi
=
\{
\pi_{\rm Searcher},
\pi_{\rm Questioner},
\pi_{\rm Solver}
\}
\]

\[
x
\xrightarrow{\pi_{\rm Searcher}}
e
\xrightarrow{\pi_{\rm Questioner}}
q
\xrightarrow{\pi_{\rm Solver}}
y
\]

\[
\Delta\Pi_k
\neq0,
\qquad
\Delta\mathcal E_k\neq0
\]

% World model

\[
\mathcal D_{\rm int}
=
\{
(s_t,a_t,s_{t+1})
\}
\]

\[
\phi^\star
=
\arg\min_\phi
-
\sum_{(s,a,s')}
\log
P_\phi(s'\mid s,a)
\]

\[
\hat s_{t+1}
\sim
P_\phi
(
\cdot\mid s_t,a_t
)
\]

\[
\hat\tau^{(a)}
=
\operatorname{Rollout}
(
P_\phi,
s_t,
a
)
\]

\[
a_t^\star
=
\arg\max_a
\hat J
(
\hat\tau^{(a)}
)
\]

% Joint world-model/policy evolution

\[
\phi_{k+1}
=
\phi_k
-
\eta_E
\nabla_\phi
\mathcal L_{\rm WM}
(
\phi_k;\mathcal D_k
)
\]

\[
\theta_{k+1}
=
\theta_k
+
\eta_A
\nabla_\theta
J
(
\theta_k;\mathcal E_{\phi_{k+1}}
)
\]

\[
\boxed{
\mathcal E_{\phi_k}
\rightarrow
\pi_{\theta_k}
\rightarrow
\mathcal D_k
\rightarrow
\mathcal E_{\phi_{k+1}}
\rightarrow
\pi_{\theta_{k+1}}
}
\]

% ---------------------------------------------------------------------
% Difficulty-driven evolution
% ---------------------------------------------------------------------

\[
\mathcal U_{\rm difficulty}
=
\{
\mathcal U_{\rm explicit},
\mathcal U_{\rm implicit}
\}
\]

\[
d_k
=
d(\mathcal E_k)
\]

\[
p_k
=
P_{\pi_k}
(
\operatorname{success}\mid d_k
)
\]

% Forward evolution

\[
d_{k+1}
=
\begin{cases}
d_k+\Delta d,
&
p_k>\tau_{\rm high}
\\
d_k,
&
\tau_{\rm low}\le p_k\le\tau_{\rm high}
\\
d_k-\Delta d,
&
p_k<\tau_{\rm low}
\end{cases}
\]

% Target-band controller

\[
e_k
=
p_k-p^\star
\]

\[
d_{k+1}
=
d_k+\eta_d e_k
\]

\[
r_{\rm curriculum}
=
-
\left|
p_k-p^\star
\right|
\]

\[
r_{\alpha{\rm -curr}}
=
\exp
\left[
-\alpha
|p_k-p^\star|
\right]
\]

% Weakness targeting

\[
w_j
=
1-\operatorname{SuccessRate}_{\pi}(c_j)
\]

\[
P(c_j)
=
\frac{
\exp(\beta w_j)
}{
\sum_l\exp(\beta w_l)
}
\]

% Regret-based environment design

\[
R_{\rm protagonist}(e)
=
J
(
\pi_P;e
)
\]

\[
R_{\rm antagonist}(e)
=
J
(
\pi_A;e
)
\]

\[
\operatorname{Regret}(e)
=
R_{\rm antagonist}(e)
-
R_{\rm protagonist}(e)
\]

\[
e^\star
=
\arg\max_e
\operatorname{Regret}(e)
\]

\[
\phi_{k+1}
=
\phi_k
+
\eta
\nabla_\phi
\mathbb E_{e\sim G_\phi}
[
\operatorname{Regret}(e)
]
\]

% Replay/evolution

\[
\mathcal B_{k+1}
=
\operatorname{TopK}_{e\in
\mathcal B_k\cup\operatorname{Mutate}(\mathcal B_k)}
\operatorname{Regret}(e)
\]

% Student-feedback curriculum

\[
F_k
=
\operatorname{Errors}
(
\pi_k,\mathcal E_k
)
\]

\[
\mathcal E_{k+1}
=
G_{\rm teacher}
(
F_k
)
\]

% Curiosity

\[
r_t^{\rm curiosity}
=
\|
f_\phi(s_t,a_t)-s_{t+1}
\|^2
\]

\[
q^\star
=
\arg\max_q
\mathbb E[
r^{\rm curiosity}(q)
]
\]

% Implicit curriculum / mutation-transfer

\[
e'
\sim
\operatorname{Mutate}(e)
\]

\[
\operatorname{MC}(e')
=
\mathbf1
[
\tau_l
<
J(\pi;e')
<
\tau_u
]
\]

\[
\mathcal E_{k+1}
=
\{
e':
e'\sim\operatorname{Mutate}(\mathcal E_k),
\operatorname{MC}(e')=1
\}
\]

\[
\pi_j
\xrightarrow[\text{}]{e_i}
\pi_j'
\]

\[
\operatorname{TransferGain}_{ij}
=
J(\pi_j';e_i)-J(\pi_j;e_i)
\]

\[
(i^\star,j^\star)
=
\arg\max_{i,j}
\operatorname{TransferGain}_{ij}
\]

% Reward entropy curriculum

\[
H_R(q)
=
-
\sum_r
p(r\mid q)
\log p(r\mid q)
\]

\[
P(q)
\propto
\exp
[
\beta H_R(q)
]
\]

% ---------------------------------------------------------------------
% Scaling-driven evolution
% ---------------------------------------------------------------------

\[
\mathcal U_{\rm scaling}
=
\{
\mathcal U_{\rm scenario},
\mathcal U_{\rm environment}
\}
\]

% Scenario-level

\[
\mathcal E
=
\{
\xi_1,\ldots,\xi_N
\}
\]

\[
N_{k+1}>N_k
\]

\[
\xi_i
=
(
s_{0,i},
g_i,
\mathcal T_i,
\mathcal R_i,
V_i
)
\]

\[
G_{\rm dep}
=
(V_T,E_T)
\]

\[
\tau_i
\sim
\operatorname{Walk}
(
G_{\rm dep}
)
\]

\[
|\mathcal T|
\uparrow
\Rightarrow
|\operatorname{Paths}(G_{\rm dep})|
\uparrow
\]

% Read/write abstraction

\[
a
=
(
\operatorname{op},
\operatorname{table},
\operatorname{key},
\operatorname{value}
)
\]

\[
\operatorname{op}
\in
\{\operatorname{read},\operatorname{write}\}
\]

\[
|\mathcal X_{\rm scenario}|
\propto
|\mathcal T|
\times
|\mathcal I_{\rm user}|
\times
|\operatorname{Paths}(G_{\rm dep})|
\]

% Website FSM

\[
\mathcal W
=
(
S_{\rm web},
A_{\rm web},
\delta,
s_0,F
)
\]

\[
\delta:
S_{\rm web}\times A_{\rm web}
\rightarrow
S_{\rm web}
\]

\[
\operatorname{Paths}_{\le H}
=
\{
(a_0,\ldots,a_T):
T\le H
\}
\]

\[
\forall\tau\in\operatorname{Paths}_{\le H}:
V(\tau)\in\{0,1\}
\]

% Environment-level scaling

\[
p(\mathcal E)
=
p
(
\mathcal P,
\mathcal O,
\mathcal R,
\mathcal S,
\mathcal A,
\mathcal C
)
\]

\[
p(\mathcal E)
=
\prod_j
p(z_j)
\]

\[
z_j
\in
\{
z_{\rm domain},
z_P,
z_O,
z_R,
z_A,
z_{\rm modality},
z_{\rm topology}
\}
\]

\[
\mathcal E_i
\sim
p(\mathcal E)
\]

\[
|\operatorname{support}p_{k+1}(\mathcal E)|
>
|\operatorname{support}p_k(\mathcal E)|
\]

\[
J_{\rm scale}(\pi)
=
\mathbb E_{\mathcal E\sim p(\mathcal E)}
J(\pi;\mathcal E)
\]

% =====================================================================
% VIII-A — Environment-as-a-Service
% :chatgpt-content-reference{index="8"}
% =====================================================================

\[
\mathfrak I_{\rm EaaS}
=
\{
\mathsf{Reset},
\mathsf{Step},
\mathsf{Observe},
\mathsf{Reward},
\mathsf{Verify},
\mathsf{Snapshot},
\mathsf{Restore}
\}
\]

\[
\mathsf{Reset}:
\mathcal Z\rightarrow\Omega
\]

\[
\mathsf{Step}:
\mathcal A
\rightarrow
\Omega\times\mathbb R\times\{0,1\}
\]

\[
\mathsf{Verify}:
\mathcal H
\rightarrow
[0,1]
\]

\[
\mathsf{Snapshot}:
\mathcal S\rightarrow\mathcal B
\]

\[
\mathsf{Restore}:
\mathcal B\rightarrow\mathcal S
\]

\[
\forall
\mathcal E_i,\mathcal E_j:
\operatorname{Interface}(\mathcal E_i)
=
\operatorname{Interface}(\mathcal E_j)
=
\mathfrak I_{\rm EaaS}
\]

\[
\pi
\circ
\mathfrak I_{\rm EaaS}
\circ
\mathcal E_i
\qquad
\forall i
\]

\[
C_{\rm adaptation}
=
\sum_i
D
[
\operatorname{Interface}(\mathcal E_i),
\mathfrak I
]
\rightarrow0
\]

\[
C_{\rm deployment}
=
C_{\rm env-runtime}
+
C_{\rm dependency}
+
C_{\rm orchestration}
\]

\[
C_{\rm agent}^{\rm EaaS}
\perp
C_{\rm env-runtime}
\]

% =====================================================================
% VIII-B — Evolution of environment properties
% :chatgpt-content-reference{index="9"}
% =====================================================================

\[
\mathbf p_{\mathcal E}
=
(
p_{\rm dynamic},
p_{\rm horizon},
p_{\rm open},
p_{\rm modality},
p_{\rm agent}
)
\]

\[
\mathbf p_{\rm current}
\approx
(
0,
\mathrm{short},
0,
1,
1
)
\]

\[
\mathbf p_{\rm future}
\rightarrow
(
1,
\mathrm{long},
1,
M,
N
)
\]

\[
P_{t+1}
\neq
P_t
\]

\[
\mathcal S_{t+1}
\supseteq
\mathcal S_t
\]

\[
\mathcal A_{t+1}
\supseteq
\mathcal A_t
\]

\[
\mathcal G_{t+1}
\not\subseteq
\mathcal G_t
\]

\[
T\rightarrow\infty
\]

\[
\frac{\partial s_{t+k}}{\partial a_t}
\neq0,
\qquad
k\gg1
\]

\[
\Omega
=
\prod_{m=1}^{M}
\Omega_m
\]

\[
M
\rightarrow
\{
\mathrm{text,image,video,audio,sensor}
\}
\]

% =====================================================================
% VIII-C — Single-agent -> multi-agent
% :chatgpt-content-reference{index="10"}
% =====================================================================

\[
\mathbf a_t
=
(a_t^1,\ldots,a_t^N)
\]

\[
s_{t+1}
\sim
P
(
\cdot\mid
s_t,\mathbf a_t
)
\]

\[
\pi_t^i
=
\pi^i
(
a_t^i\mid
h_t^i,
\pi_{-i,t}
)
\]

\[
P_{t+1}^i
\neq
P_t^i
\quad
\because
\quad
\pi_{-i,t+1}\neq\pi_{-i,t}
\]

\[
\operatorname{NonStationarity}_i
=
D
\left(
P_{t+1}^i(s'\mid s,a_i),
P_t^i(s'\mid s,a_i)
\right)
\]

\[
Q_{\rm tot}
(
s,\mathbf a
)
=
f_{\rm mix}
(
Q_1,\ldots,Q_N
)
\]

\[
r_i
\rightsquigarrow
\phi_i
\quad
\text{with}
\quad
\sum_i\phi_i=v(N)
\]

\[
\mathcal G_{\rm comm}
=
(V_{\rm agents},E_{\rm messages})
\]

\[
m_t^{i\rightarrow j}
\sim
P
(
m\mid
h_t^i,
j
)
\]

\[
a_t^j
\sim
\pi^j
(
\cdot\mid
h_t^j,
m_{\le t}^{\cdot\rightarrow j}
)
\]

\[
\operatorname{Emergence}
=
I
(
B_{\rm collective};
\mathbf\Pi
\mid
B_{\rm individual}
)
\]

% =====================================================================
% VIII-D — Neural-symbolic environments
% :chatgpt-content-reference{index="11"}
% =====================================================================

\[
\mathcal E_{\rm hybrid}
=
(
\mathcal E_{\rm neural},
\mathcal E_{\rm symbolic}
)
\]

\[
g_t
=
\sigma
(
f_\eta(s_t,a_t)
)
\]

\[
P_{\rm hybrid}
=
g_tP_\theta^{\rm neural}
+
(1-g_t)
P_{\mathcal C}^{\rm symbolic}
\]

\[
\tilde s_{t+1}
\sim
P_\theta^{\rm neural}
(
\cdot\mid s_t,a_t
)
\]

\[
s_{t+1}
=
\Pi_{\mathcal C}
(
\tilde s_{t+1}
)
\]

\[
\Pi_{\mathcal C}(x)
=
\arg\min_{y}
\|x-y\|^2
\quad
\mathrm{s.t.}
\quad
c_j(y)=1,\;\forall j
\]

\[
\mathcal L_{\rm hybrid}
=
\mathcal L_{\rm neural}
+
\lambda_C
\sum_j
\max
(
0,
-c_j(\hat s)
)
\]

\[
\operatorname{Expressivity}
(
\mathcal E_{\rm hybrid}
)
\ge
\operatorname{Expressivity}
(
\mathcal E_{\rm symbolic}
)
\]

\[
\operatorname{Verifiability}
(
\mathcal E_{\rm hybrid}
)
\ge
\operatorname{Verifiability}
(
\mathcal E_{\rm neural}
)
\]

% =====================================================================
% VIII-E — Sim-to-real
% :chatgpt-content-reference{index="12"}
% =====================================================================

\[
\Delta_{\rm S2R}
=
D
(
P_{\rm sim},
P_{\rm real}
)
\]

\[
\Delta_{\rm S2R}
=
\lambda_c\Delta_{\rm correctness}
+
\lambda_d\Delta_{\rm difficulty}
+
\lambda_v\Delta_{\rm diversity}
+
\lambda_f\Delta_{\rm fidelity}
\]

\[
\pi_{\rm sim}^\star
=
\arg\max_\pi
J_{\rm sim}(\pi)
\]

\[
\operatorname{Gap}_{\rm policy}
=
J_{\rm sim}
(
\pi_{\rm sim}^\star
)
-
J_{\rm real}
(
\pi_{\rm sim}^\star
)
\]

\[
\phi
\sim
p(\phi)
\]

\[
\pi^\star
=
\arg\max_\pi
\mathbb E_{\phi\sim p(\phi)}
J
(
\pi;\mathcal E_\phi
)
\]

\[
p^\star(\phi)
=
\arg\min_{p(\phi)}
D
\left(
\int
P_{\mathcal E_\phi}
p(\phi)d\phi,
P_{\rm real}
\right)
\]

\[
\min_{\mathcal E_{\rm synth}}
D
(
P_{\rm synth},
P_{\rm real}
)
\quad
\mathrm{s.t.}
\quad
C_{\rm synthesis}
\le B
\]

\[
\mathcal L_{\rm S2R}
=
\mathcal L_{\rm dynamics}
+
\lambda_{\rm latency}
\mathcal L_{\rm latency}
+
\lambda_{\rm behavior}
\mathcal L_{\rm user}
+
\lambda_{\rm interface}
\mathcal L_{\rm UI}
\]

% =====================================================================
% VIII-F — Co-evolution of agents and environments
% :chatgpt-content-reference{index="13"}
% =====================================================================

\[
\theta_{k+1}
=
\theta_k
+
\eta_A
\nabla_\theta
J_A
(
\theta_k,\phi_k
)
\]

\[
\phi_{k+1}
=
\phi_k
+
\eta_E
\nabla_\phi
J_E
(
\phi_k,\theta_{k+1}
)
\]

\[
\boxed{
(\theta_k,\phi_k)
\rightarrow
(\theta_{k+1},\phi_{k+1})
}
\]

\[
J_E
=
\alpha
\operatorname{LearningProgress}
+
\beta
\operatorname{WeaknessCoverage}
+
\chi
\operatorname{Novelty}
-
\delta
\operatorname{Unsolvability}
\]

\[
\mathcal E_{k+1}
=
G_{\phi_k}
\left(
\operatorname{Weakness}
(
\pi_{\theta_k}
)
\right)
\]

\[
\operatorname{Weakness}_j(\pi)
=
1-
J_j(\pi)
\]

\[
P_k(q_j)
\propto
\exp
[
\beta
\operatorname{Weakness}_j(\pi_k)
]
\]

\[
c(\pi_{k+1})>c(\pi_k)
\Longrightarrow
\left\{
\begin{array}{l}
H(\mathcal E_{k+1})\ge H(\mathcal E_k)
\\
D(\mathcal E_{k+1})\ge D(\mathcal E_k)
\\
C(\mathcal E_{k+1})\ge C(\mathcal E_k)
\end{array}
\right.
\]

\[
(\theta^\star,\phi^\star)
=
\operatorname{FixPoint}
\left[
\mathcal U_A,
\mathcal U_E
\right]
\]

\[
\theta^\star
=
\mathcal U_A
(
\theta^\star,\phi^\star
),
\qquad
\phi^\star
=
\mathcal U_E
(
\phi^\star,\theta^\star
)
\]

% =====================================================================
% VIII-G — Unified offline-online learning
% :chatgpt-content-reference{index="14"}
% =====================================================================

\[
\mathcal D_{\rm off}
=
\{
\tau_i^\star
\}_{i=1}^{N}
\]

\[
\mathcal D_{\rm on}^{(k)}
=
\{
\tau_i:
\tau_i\sim
p_{\pi_{\theta_k},\mathcal E}
\}
\]

\[
\mathcal D_k
=
\mathcal D_{\rm off}
\cup
\mathcal D_{\rm on}^{(k)}
\]

\[
\mathcal L_{\rm unified}
=
\lambda_{\rm off}
\mathcal L_{\rm BC/SFT}
-
\lambda_{\rm on}
J_{\rm RL}
\]

\[
\theta_{k+1}
=
\theta_k
-
\eta
\nabla_\theta
\left[
\lambda_k
\mathcal L_{\rm off}
-
(1-\lambda_k)
J_{\rm on}
\right]
\]

\[
\lambda_{k+1}
\le
\lambda_k
\]

% On-policy distillation

\[
\tau_k
\sim
p_{\pi_{\theta_k},\mathcal E}
\]

\[
a_{t}^{T}
\sim
\pi_T
(
\cdot\mid
h_t^{\pi_{\theta_k}}
)
\]

\[
\mathcal L_{\rm OPD}
=
-
\mathbb E_
{\tau\sim\pi_{\theta}}
\sum_t
\log
\pi_\theta
(
a_t^T\mid h_t^\pi
)
\]

\[
\theta_{k+1}
=
\theta_k
-
\eta
\nabla_\theta
\mathcal L_{\rm OPD}
\]

\[
s_{t+1}^{\pi}
=
F
(
s_t^\pi,
a_t^\pi
)
\]

\[
a_t^\pi\neq a_t^T
\Longrightarrow
s_{t+1}^{\pi}
\neq
s_{t+1}^{T}
\]

\[
D_{t+1}
=
D
(
P(s_{t+1}^{\pi}),
P(s_{t+1}^{T})
)
\]

\[
D_{t+k}
\ge
D_{t+1}
\quad
\text{under unrecovered trajectory divergence}
\]

\[
\mathcal L_{\rm teacher+env}
=
\sum_t
\left[
\lambda_T
D_{\rm KL}
(
\pi_T(\cdot\mid h_t)
\Vert
\pi_\theta(\cdot\mid h_t)
)
-
\lambda_E
r_t^{\rm env}
\right]
\]

% =====================================================================
% VIII-H — Science of environment engineering
% :chatgpt-content-reference{index="15"}
% =====================================================================

\[
\boxed{
\operatorname{Capability}
=
F
(
N_{\mathcal E},
D_{\mathcal E},
H_{\mathcal E},
C_{\mathcal E},
F_{\mathcal E},
Q_{\mathcal E}
)
}
\]

\[
N_{\mathcal E}
=
|\{\mathcal E_i\}|
\]

\[
D_{\mathcal E}
=
\operatorname{Diversity}
(
\{\mathcal E_i\}
)
\]

\[
H_{\mathcal E}
=
\mathbb E_i[T_i]
\]

\[
C_{\mathcal E}
=
\mathbb E_i[C(\mathcal E_i)]
\]

\[
F_{\mathcal E}
=
\mathbb E_i[Q_{\rm fidelity}(\mathcal E_i)]
\]

% Scaling-law hypothesis

\[
L(N_{\mathcal E})
=
L_\infty
+
A
N_{\mathcal E}^{-\alpha}
\]

\[
L(D_{\mathcal E})
=
L_\infty
+
B
D_{\mathcal E}^{-\beta}
\]

\[
L(C_{\mathcal E})
=
L_\infty
+
C
C_{\mathcal E}^{-\chi}
\]

\[
L
=
L_\infty
+
A
N_{\mathcal E}^{-\alpha}
+
B
D_{\mathcal E}^{-\beta}
+
C
H_{\mathcal E}^{-\eta}
+
D
C_{\mathcal E}^{-\chi}
\]

\[
\frac{\partial\operatorname{Capability}}
{\partial\log N_{\mathcal E}}
,\quad
\frac{\partial\operatorname{Capability}}
{\partial D_{\mathcal E}}
,\quad
\frac{\partial\operatorname{Capability}}
{\partial H_{\mathcal E}}
,\quad
\frac{\partial\operatorname{Capability}}
{\partial C_{\mathcal E}}
\]

% Environment learnability

\[
\mathfrak L(\mathcal E,\pi)
=
f
(
\rho_R,
|\mathcal S|,
|\mathcal A|,
H,
\operatorname{SNR}_R,
C_{\rm credit},
C_{\rm exploration}
)
\]

\[
\rho_R
=
P(r_t\neq0)
\]

\[
\operatorname{SNR}_R
=
\frac{
|\mathbb E[R]|
}{
\sqrt{\operatorname{Var}(R)}
}
\]

\[
\mathfrak L
\downarrow
\quad\text{as}\quad
\rho_R\downarrow,
\;
|\mathcal S|\uparrow,
\;
H\uparrow,
\;
C_{\rm credit}\uparrow
\]

\[
\mathcal E^\star
=
\arg\max_{\mathcal E}
\frac{
\Delta J(\pi;\mathcal E)
}{
C_{\rm interaction}(\mathcal E)
}
\]

% Environment-capability matrix

\[
\mathcal C
=
\{
c_{\rm memory},
c_{\rm decomposition},
c_{\rm worldmodel},
c_{\rm planning},
c_{\rm tool},
c_{\rm grounding},
c_{\rm recovery},
c_{\rm coordination}
\}
\]

\[
M_{ij}
=
\frac{
\partial
\operatorname{Capability}_j
}{
\partial
\operatorname{Exposure}(\mathcal E_i)
}
\]

\[
\mathbf c_{k+1}
=
\mathbf c_k
+
M^\top
\mathbf x_k
\]

\[
\mathbf x^\star
=
\arg\min_{\mathbf x\ge0}
\left\|
\mathbf c_{\rm target}
-
(
\mathbf c_0+M^\top\mathbf x
)
\right\|_2^2
\]

\[
\mathrm{s.t.}
\qquad
\mathbf 1^\top\mathbf x
\le
B
\]

\[
\mathcal E^\star(c_j)
=
\arg\max_{\mathcal E}
\frac{
\partial c_j
}{
\partial\operatorname{Exposure}(\mathcal E)
}
\]

% =====================================================================
% Unified agent-environment engineering system
% =====================================================================

\[
\boxed{
\mathcal E_k
\xrightarrow{\pi_{\theta_k}}
\tau_k
\xrightarrow{\mathcal M_k}
\widetilde h_k
\xrightarrow{W_k}
a_k
\xrightarrow{\mathcal E_k}
(o_{k+1},r_k)
}
\]

\[
\boxed{
\tau_k
\rightarrow
\begin{cases}
\mathcal M_{k+1}
\\
W_{k+1}
\\
\mathcal D_{k+1}^{\rm offline}
\\
\nabla_\theta J_{\rm online}
\\
\mathcal E_{k+1}
\end{cases}
}
\]

\[
\theta_{k+1}
=
\mathcal U_A
(
\theta_k,
\mathcal M_k,
W_k,
\mathcal D_k,
\mathcal E_k
)
\]

\[
\phi_{k+1}
=
\mathcal U_E
(
\phi_k,
\theta_{k+1},
Q_{\rm corr},
Q_{\rm div},
Q_{\rm comp},
Q_{\rm fid}
)
\]

\[
\mathcal M_{k+1}
=
\mathcal U_M
(
\mathcal M_k,
\tau_k
)
\]

\[
W_{k+1}
=
\mathcal U_W
(
W_k,
\tau_k,r_k
)
\]

\[
\boxed{
\begin{aligned}
\pi_k
&\rightarrow
\mathcal E_k
\rightarrow
\tau_k
\\
&\rightarrow
\{
\mathcal M_{k+1},
W_{k+1},
\mathcal D_{k+1},
\nabla_\theta J
\}
\\
&\rightarrow
\pi_{k+1}
\rightarrow
\mathcal E_{k+1}
\rightarrow\cdots
\end{aligned}
}
\]

\[
\boxed{
\max_{
\theta,\phi,\mathcal M,W
}
\;
\mathbb E_{\mathcal E_\phi}
\left[
J
(
\pi_{\theta,\mathcal M,W};
\mathcal E_\phi
)
\right]
}
\]

\[
\mathrm{s.t.}
\qquad
Q_{\rm corr}(\mathcal E_\phi)\ge\tau_{\rm corr}
\]

\[
Q_{\rm div}(\mathcal E_\phi)\ge\tau_{\rm div}
\]

\[
Q_{\rm fid}(\mathcal E_\phi)\ge\tau_{\rm fid}
\]

\[
C_{\min}
\le
Q_{\rm comp}(\mathcal E_\phi)
\le
C_{\max}
\]

\[
C_{\rm compute}
+
C_{\rm interaction}
+
C_{\rm synthesis}
\le
B
\]

\[
\boxed{
\mathfrak{AE}^{\star}
=
\arg\max_{\mathfrak{AE}}
\left[
\operatorname{CapabilityGain}
+
\lambda_G\operatorname{Generalization}
+
\lambda_R\operatorname{Robustness}
+
\lambda_A\operatorname{Adaptation}
-
\lambda_C\operatorname{Cost}
-
\lambda_S\operatorname{SimRealGap}
\right]
}
\]

\[
\boxed{
\mathfrak{AE}
=
\left(
\mathcal E,
\pi,
\mathcal M,
W,
\mathcal D,
\mathcal V,
\mathcal U_A,
\mathcal U_E
\right)
}
\]

\[
\boxed{
\mathcal E
\rightleftarrows
\pi
\rightleftarrows
\mathcal M
\rightleftarrows
W
\rightleftarrows
\mathcal D
\rightleftarrows
\mathcal V
}
\]

\[
\boxed{
\lim_{k\rightarrow\infty}
\left\|
\theta_{k+1}-\theta_k
\right\|
\rightarrow0,
\qquad
\lim_{k\rightarrow\infty}
\left\|
\phi_{k+1}-\phi_k
\right\|
\rightarrow0
}
\]

\[
\boxed{
(\theta^\star,\phi^\star)
=
\arg\operatorname{stable}
\left[
\mathcal U_A(\theta,\phi),
\mathcal U_E(\phi,\theta)
\right]
}
\]