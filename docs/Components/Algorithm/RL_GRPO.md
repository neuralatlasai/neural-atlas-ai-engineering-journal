



# \(\mathsf{A}_0\) — SOURCE + IMPLEMENTATION AUDIT

\[
\boxed{
\mathfrak E_{\mathrm{DeepSeek}}
=
\{
\mathrm{DeepSeekMath}_{v3},
\mathrm{DeepSeek\!-\!R1}_{v2},
\mathrm{DeepSeek\!-\!Math\ GitHub},
\mathrm{DeepSeek\!-\!R1\ GitHub}
\}
}
\]

\[
\mathrm{DeepSeekMathRepo}_{\mathrm{root}}
=
\{
\texttt{evaluation},
\texttt{images},
\texttt{replicate},
\texttt{README},
\ldots
\}
\]

\[
\mathrm{replicate}
=
\{
\texttt{predict.py},
\texttt{predict\_instruct.py}
\},
\qquad
\mathrm{evaluation}
=
\{\text{evaluation/inference utilities}\}.
\]

\[
\boxed{
\mathrm{GRPOTrainerCode}
\notin
\mathrm{DeepSeekMathOfficialRepo}
}
\qquad[\mathrm{CODE\!-\!VERIFIED}]
\]

The official repository exposes checkpoints, evaluation/inference machinery, and identifies DeepSeekMath-RL as GRPO-trained, but no executable GRPO trainer. citeturn975410view0turn494378view0turn494378view1

\[
\mathrm{DeepSeekR1Repo}_{\mathrm{root}}
=
\{
\texttt{.github/workflows},
\texttt{figures},
\texttt{DeepSeek\_R1.pdf},
\texttt{LICENSE},
\texttt{README}
\}
\]

\[
\boxed{
\mathrm{GRPOTrainerCode}
\notin
\mathrm{DeepSeekR1OfficialRepo}
}
\qquad[\mathrm{CODE\!-\!VERIFIED}]
\]

\[
\boxed{
\mathrm{ExactProductionTrainer}
=
[\mathrm{UNDISCLOSED}]
}
\]

The R1 paper discloses substantial production RL infrastructure, but the corresponding trainer source is not published in the official R1 repository. citeturn975410view1turn380873view1

\[
\boxed{
\mathrm{paper\ algorithm}
\neq
\mathrm{production\ implementation}
}
\]

\[
\boxed{
\mathrm{GRPO\ training\ logic}_{[\mathrm{CODE\!-\!VERIFIED}]}
=
\varnothing
}
\]

\[
\boxed{
\operatorname{DeepSeekEvidence}
(
1982\rightarrow\mathrm{GRPO}
)
=
\varnothing
}
\]

\[
\boxed{
[\mathrm{UNSUPPORTED\ UNDER\ DEEPSEEK\!-\!ONLY\ EVIDENCE\ BOUNDARY}]
}
\]

Neither DeepSeekMath nor DeepSeek-R1 contains a \(1982\) attribution for GRPO. DeepSeekMath presents GRPO as its modification of PPO; R1 attributes GRPO to DeepSeekMath. citeturn837555view0turn837555view1turn118065view3

---

# \(\mathsf{A}_1\) — GLOBAL TRAINING STATE

\[
\boxed{
\mathcal S_{k,m,j}
=
\left(
\theta_{k,m,j},
\bar\theta_{k,m},
\theta_{\mathrm{ref},k},
\varphi_k,
\mathcal D,
G,B,
\mu,\epsilon,\beta
\right)
}
\]

\[
\begin{array}{c|c|c|c|c}
\text{state} &
\text{role} &
\nabla_\theta &
\text{mutable} &
\text{lifetime}
\\ \hline
\theta &
\text{actor/current policy} &
1 &
1 &
\text{optimization}
\\
\bar\theta &
\pi_{\rm old}\ \text{behavior snapshot} &
0 &
\text{refresh only} &
\text{rollout/inner updates}
\\
\theta_{\rm ref} &
\text{KL anchor} &
0 &
\text{refresh only} &
\text{reference interval}
\\
\varphi &
\text{reward model, when used} &
0\ \text{w.r.t. actor} &
1\ \text{in iterative RM training} &
\text{outer RL iteration}
\end{array}
\]

\[
\boxed{
\bar\theta=\operatorname{sg}(\bar\theta),
\qquad
\theta_{\mathrm{ref}}
=\operatorname{sg}(\theta_{\mathrm{ref}}),
\qquad
r_\varphi=\operatorname{sg}(r_\varphi)
\ \text{during actor backward}
}
\]

DeepSeekMath explicitly replaces the PPO value-model baseline by a same-question group baseline. citeturn380873view0

\[
\boxed{
V_\psi=\varnothing
}
\qquad[\mathrm{REPORTED}]
\]

\[
\begin{aligned}
\mathcal S_{\mathrm{PPO}}
&=
\{
\theta,\psi,
\nabla\theta,\nabla\psi,
\operatorname{OptState}_\theta,
\operatorname{OptState}_\psi,\ldots
\},
\\
\mathcal S_{\mathrm{GRPO}}
&=
\{
\theta,
\nabla\theta,
\operatorname{OptState}_\theta,\ldots
\}.
\end{aligned}
\]

\[
\boxed{
\mathcal S_{\mathrm{PPO}}
-
\mathcal S_{\mathrm{GRPO}}
\supset
\{
\psi,\nabla\psi,\operatorname{OptState}_\psi
\}
}
\qquad[\mathrm{DERIVED}]
\]

---

# \(\mathsf{A}_2\) — PROMPT SAMPLING

\[
\boxed{
q_b\sim P(Q),
\qquad
b=1,\ldots,B
}
\]

\[
\mathcal D_b
=
\{q_1,\ldots,q_B\}
\subset\mathcal D.
\]

DeepSeekMath uses approximately \(144\,000\) GSM8K/MATH CoT-format RL questions and reports training batch size \(1024\). citeturn975410view5

\[
\boxed{
|\mathcal D_{\mathrm{Math}}|
\simeq144\,000,
\qquad
B_{\mathrm{Math}}=1024
}
\qquad[\mathrm{REPORTED}]
\]

For R1-Zero:

\[
B_q^{\mathrm{step}}=32,
\qquad
G=16,
\qquad
B_{\mathrm{responses}}=32\times16=512.
\]

\[
8192
=
512_{\rm prompt\ groups}
\times16_{\rm responses/group}
\]

\[
\frac{8192}{512}=16
\quad\text{policy minibatches per rollout}.
\qquad[\mathrm{DERIVED}]
\]

DeepSeek reports \(8192\) outputs per rollout, \(16\) minibatches, and \(32\) unique questions per policy-update step. citeturn138170view1

R1-v2 additionally reports the RL prompt inventory:

\[
\begin{array}{c|c}
\text{domain}&|\mathcal D|
\\ \hline
\mathrm{Math}&26\,000\\
\mathrm{Code}&17\,000+\;8\,000_{\rm bugfix}\\
\mathrm{STEM}&22\,000\\
\mathrm{Logic}&15\,000\\
\mathrm{General/helpful}&66\,000\\
\mathrm{Safety}&12\,000
\end{array}
\]

citeturn652764view0turn652764view1

---

# \(\mathsf{A}_3\) — OLD-POLICY SNAPSHOT

DeepSeekMath Algorithm 1:

\[
\boxed{
\bar\theta_{k,m}
\leftarrow
\operatorname{sg}
\left(
\theta_{k,m,0}
\right)
}
\qquad[\mathrm{REPORTED}]
\]

\[
o_{1:G}
\sim
\pi_{\bar\theta_{k,m}}
\]

\[
\theta_{k,m,0}
\rightarrow
\theta_{k,m,1}
\rightarrow\cdots\rightarrow
\theta_{k,m,\mu}
\]

while

\[
\boxed{
\bar\theta_{k,m}
\ \text{is unchanged over these }\mu\text{ optimization iterations}.
}
\]

DeepSeekMath explicitly snapshots the old policy before rollout and then performs \(\mu\) GRPO iterations. citeturn975410view3

For the reported DeepSeekMath-RL run:

\[
\boxed{
\mu=1
}
\qquad[\mathrm{REPORTED}]
\]

because the policy receives a single update after each exploration stage. citeturn975410view5

For production R1:

\[
\boxed{
\operatorname{RefreshSchedule}(\pi_{\rm old})
=
[\mathrm{UNDISCLOSED}]
}
\]

beyond the reported old-policy sampling semantics and rollout/minibatch schedule.

---

# \(\mathsf{A}_4\) — SAME-PROMPT GROUP ROLLOUT

\[
\boxed{
o_i
\sim
\pi_{\bar\theta}(O\mid q),
\qquad
i=1,\ldots,G
}
\]

\[
o_i=(o_{i,1},\ldots,o_{i,T_i})
\]

\[
s_{i,t}
=
(q,o_{i,<t}),
\qquad
a_{i,t}=o_{i,t}.
\]

\[
\boxed{
\pi_{\bar\theta}(o_i\mid q)
=
\prod_{t=1}^{T_i}
\pi_{\bar\theta}
(
o_{i,t}\mid q,o_{i,<t}
)
}
\qquad[\mathrm{DERIVED}]
\]

\[
\mathcal G_q
=
\{
o_1,\ldots,o_G
\}.
\]

DeepSeekMath explicitly samples multiple outputs to the **same question** and computes advantages using rewards inside that group. citeturn380873view0

Prompt-conditioned nuisance decomposition:

\[
r_i
=
d(q)+\delta_i.
\]

\[
\bar r_q
=
d(q)+\frac1G\sum_j\delta_j.
\]

Hence

\[
\boxed{
r_i-\bar r_q
=
\delta_i
-
\frac1G\sum_j\delta_j
}
\qquad[\mathrm{DERIVED}]
\]

\[
\frac{\partial(r_i-\bar r_q)}{\partial d(q)}
=0.
\]

For heterogeneous prompts \(q_i\),

\[
r_i=d(q_i)+\delta_i,
\]

\[
r_i-\frac1G\sum_jr_j
=
d(q_i)-\frac1G\sum_jd(q_j)
+
\delta_i-\frac1G\sum_j\delta_j,
\]

so prompt difficulty does **not** cancel.

---

# \(\mathsf{A}_5\) — REWARD CONSTRUCTION

## DeepSeekMath

\[
\boxed{
r_i
=
r_\varphi(q,o_i)
}
\qquad[\mathrm{REPORTED}]
\]

\[
\operatorname{scale}(r_\varphi),
\operatorname{architecture}_{\rm exact},
\operatorname{aggregation}_{\rm exact}
=
[\mathrm{UNDISCLOSED}]
\]

DeepSeekMath scores sampled outputs with a reward model; the initial RM is based on DeepSeekMath-Base-7B. citeturn975410view3turn975410view5

## DeepSeek-R1-Zero

\[
\boxed{
r_i^{\rm rule}
=
r_i^{\rm acc}
+
r_i^{\rm format}
}
\qquad[\mathrm{REPORTED}]
\]

with equal weighting. citeturn710992view2

For mathematical verification:

\[
\boxed{
r_i^{\rm acc}
=
\begin{cases}
1,&\operatorname{AnswerMatch}(o_i,y_q)=1,\\
0,&\text{otherwise}
\end{cases}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn652764view0

\[
r^{\rm format}
\Longleftarrow
\text{required reasoning/answer format}.
\]

\[
\boxed{
\operatorname{exact\ numeric\ map}
(r^{\rm format})
=
[\mathrm{UNDISCLOSED}]
}
\]

R1-Zero explicitly abstains from neural outcome/process reward models for reasoning RL. citeturn710992view2

## DeepSeek-R1 first reasoning RL

\[
\boxed{
r^{(1)}
=
r^{\rm rule}
+
r^{\rm language}
}
\qquad[\mathrm{REPORTED}]
\]

\[
\boxed{
r^{\rm language}
=
\frac{
N_{\rm target\ language\ words}
}{
N_{\rm words}
}
}
\]

and DeepSeek states that this term is added directly to the final reward. citeturn138170view2

## DeepSeek-R1 second RL

\[
\boxed{
r
=
r_{\rm reasoning}
+
r_{\rm general}
+
r_{\rm language}
}
\]

\[
\boxed{
r_{\rm reasoning}
=
r_{\rm rule}
}
\]

\[
\boxed{
r_{\rm general}
=
r_{\rm reward\ model}
+
r_{\rm format}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn380873view3

For general prompts:

\[
r_{\rm reward\ model}(q,o)
=
\begin{cases}
r_{\rm helpful}(q,o),
&
q\in\mathcal D_{\rm helpful},
\\[1mm]
r_{\rm safety}(q,o),
&
q\in\mathcal D_{\rm safety}.
\end{cases}
\]

\[
r_{\rm helpful}
=
RM_{\rm helpful}(\cdot),
\qquad
r_{\rm safety}
=
RM_{\rm safety}(\cdot).
\]

DeepSeek reports \(66\,000\) helpfulness preference pairs and \(106\,000\) safety-RM training prompts; a general RL instance is associated with the corresponding RM. citeturn380873view2

\[
\boxed{
\text{additional hidden scalar weights}
=
[\mathrm{UNDISCLOSED}]
}
\]

No extra weights beyond the reported additive equations should be manufactured.

---

# \(\mathsf{A}_6\) — GROUP MEAN BASELINE

\[
\mathbf r
=
(r_1,\ldots,r_G)
\]

\[
\boxed{
\bar r
=
\frac1G
\sum_{j=1}^G r_j
}
\]

\[
V_\psi
\quad\longrightarrow\quad
\widehat b(q;\mathbf r)=\bar r.
\]

\[
\boxed{
\mathrm{PPO}:
A_t\sim r-V_\psi(s_t)
}
\]

\[
\boxed{
\mathrm{GRPO}:
A_i\sim r_i-\frac1G\sum_jr_j
}
\]

The empirical average of same-question rewards is the baseline explicitly introduced by DeepSeekMath. citeturn380873view0

---

# \(\mathsf{A}_7\) — GROUP STANDARD DEVIATION

DeepSeek defines

\[
\boxed{
s_r
=
\operatorname{std}
(r_1,\ldots,r_G)
}
\qquad[\mathrm{REPORTED}]
\]

without disclosing whether

\[
s_r^2
=
\frac1G
\sum_i(r_i-\bar r)^2
\]

or

\[
s_r^2
=
\frac1{G-1}
\sum_i(r_i-\bar r)^2.
\]

\[
\boxed{
\text{population-vs-sample denominator}
=
[\mathrm{UNDISCLOSED}]
}
\]

\[
\boxed{
\varepsilon_{\rm std}
=
[\mathrm{UNDISCLOSED}]
}
\]

DeepSeekMath and R1 both state mean/std normalization but do not define the denominator or a stabilizing constant. citeturn118065view1turn118065view3

If

\[
r_1=\cdots=r_G=c,
\]

then

\[
\bar r=c,
\qquad
s_r=0,
\]

hence

\[
\boxed{
\hat A_i=\frac{0}{0}
\quad\text{undefined under the disclosed equation.}
}
\qquad[\mathrm{DERIVED}]
\]

\[
\operatorname{ProductionFix}(s_r=0)
=
[\mathrm{UNDISCLOSED}].
\]

---

# \(\mathsf{A}_8\) — GROUP-RELATIVE ADVANTAGE

\[
\boxed{
\hat A_i
=
\frac{r_i-\bar r}{s_r}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn118065view1turn118065view3

For \(s_r>0\),

\[
\sum_{i=1}^G\hat A_i
=
\frac1{s_r}
\left(
\sum_i r_i-G\bar r
\right)
\]

\[
=
\frac1{s_r}
\left(
\sum_i r_i-
G\frac1G\sum_jr_j
\right)
=0.
\]

\[
\boxed{
\sum_i\hat A_i=0
}
\qquad[\mathrm{DERIVED}]
\]

\[
r_i>\bar r
\Longrightarrow
\hat A_i>0,
\qquad
r_i<\bar r
\Longrightarrow
\hat A_i<0.
\]

Pairwise form:

\[
r_i-\bar r
=
r_i-\frac1G\sum_jr_j
\]

\[
=
\frac1G
\left(
Gr_i-\sum_jr_j
\right)
\]

\[
=
\boxed{
\frac1G
\sum_{j=1}^G
(r_i-r_j)
}
\]

therefore

\[
\boxed{
\hat A_i
=
\frac1{Gs_r}
\sum_{j=1}^G
(r_i-r_j)
}
\qquad[\mathrm{DERIVED}]
\]

\[
\text{// ``group-relative'' = aggregate pairwise superiority within one prompt.}
\]

---

# \(\mathsf{A}_9\) — LOCATION + SCALE INVARIANCE

Let

\[
r_i'=r_i+c.
\]

Then

\[
\bar r'
=
\bar r+c,
\qquad
s_r'=s_r,
\]

and

\[
\boxed{
\hat A_i'
=
\frac{r_i+c-(\bar r+c)}{s_r}
=
\hat A_i.
}
\]

For

\[
r_i'=ar_i+b,
\qquad a>0,
\]

\[
\bar r'=a\bar r+b,
\qquad
s_r'=a s_r,
\]

so

\[
\boxed{
\hat A_i'
=
\frac{a(r_i-\bar r)}{a s_r}
=
\hat A_i.
}
\]

Thus for prompt-specific positive affine transforms

\[
r_{q,i}'
=
a_qr_{q,i}+b_q,
\qquad
a_q>0,
\]

\[
\boxed{
\hat A'_{q,i}
=
\hat A_{q,i}
}
\qquad[\mathrm{DERIVED}]
\]

provided \(s_{r,q}>0\).

---

# \(\mathsf{A}_{10}\) — GROUP SIZE \(G\)

Assume

\[
\boxed{
r_i
\overset{\rm iid}{\sim}
R(\cdot\mid q),
\quad
\mathbb E[r_i\mid q]=\mu_q,
\quad
\operatorname{Var}(r_i\mid q)=\sigma_q^2
}
\qquad[\mathrm{DERIVED\ assumption}]
\]

Then

\[
\mathbb E[\bar r\mid q]
=
\frac1G
\sum_i
\mathbb E[r_i\mid q]
=
\boxed{\mu_q}.
\]

\[
\operatorname{Var}(\bar r\mid q)
=
\operatorname{Var}
\left(
\frac1G\sum_i r_i
\right)
\]

\[
=
\frac1{G^2}
\sum_i
\operatorname{Var}(r_i\mid q)
\]

\[
=
\boxed{
\frac{\sigma_q^2}{G}
}.
\]

\[
\boxed{
\operatorname{SE}(\bar r\mid q)
=
\frac{\sigma_q}{\sqrt G}
}
\]

\[
G=1
\Longrightarrow
\bar r=r_1,\quad
s_r=0
\Longrightarrow
\hat A_1\ \text{undefined}.
\]

If \(\sigma_q^2<\infty\),

\[
G\rightarrow\infty
\Longrightarrow
\bar r
\xrightarrow{p}\mu_q.
\]

Reported values:

\[
\boxed{
G_{\mathrm{DeepSeekMath}}=64
}
\]

citeturn975410view5

\[
\boxed{
G_{\mathrm{R1-Zero}}=16,
\qquad
G_{\mathrm{R1-firstRL}}=16
}
\]

citeturn138170view1turn380873view2

---

# \(\mathsf{A}_{11}\) — CENTERED-REWARD VARIANCE + COVARIANCE

Under the \(\mathrm{iid}\mid q\) assumption:

\[
\operatorname{Cov}(r_i,\bar r\mid q)
=
\frac{\sigma_q^2}{G}.
\]

Thus

\[
\begin{aligned}
\operatorname{Var}(r_i-\bar r\mid q)
&=
\operatorname{Var}(r_i)
+
\operatorname{Var}(\bar r)
-
2\operatorname{Cov}(r_i,\bar r)
\\
&=
\sigma_q^2
+
\frac{\sigma_q^2}{G}
-
2\frac{\sigma_q^2}{G}
\\
&=
\boxed{
\left(1-\frac1G\right)\sigma_q^2
}.
\end{aligned}
\]

For \(i\neq j\),

\[
\begin{aligned}
&
\operatorname{Cov}
(r_i-\bar r,r_j-\bar r\mid q)
\\
&=
\operatorname{Cov}(r_i,r_j)
-\operatorname{Cov}(r_i,\bar r)
-\operatorname{Cov}(\bar r,r_j)
+\operatorname{Var}(\bar r)
\\
&=
0-\frac{\sigma_q^2}{G}
-\frac{\sigma_q^2}{G}
+\frac{\sigma_q^2}{G}
\\
&=
\boxed{
-\frac{\sigma_q^2}{G}
}.
\end{aligned}
\]

\[
\boxed{
\sum_i(r_i-\bar r)=0
\Longrightarrow
\text{group members are negatively coupled.}
}
\]

\[
\operatorname{Var}(\bar r)
\downarrow G^{-1}
\]

does **not** imply

\[
\operatorname{Var}
\left(
\sum_i z_i\hat A_i
\right)
\downarrow G^{-1}
\]

without additional assumptions on \(z_i,r_i,s_r\).

---

# \(\mathsf{A}_{12}\) — FINITE-GROUP BASELINE BIAS

Define on-policy conditional score

\[
z_i
=
\nabla_\theta
\log\pi_\theta(o_i\mid q).
\]

Assume

\[
o_i\overset{\rm iid}{\sim}\pi_\theta(\cdot\mid q),
\qquad
r_i=r(q,o_i),
\]

\[
\mathbb E[z_i\mid q]
=
\nabla_\theta
\sum_o\pi_\theta(o\mid q)
=
0,
\]

and for \(j\neq i\),

\[
(z_i,r_i)\perp r_j\mid q.
\]

Then

\[
\begin{aligned}
\mathbb E[z_i(r_i-\bar r)\mid q]
&=
\mathbb E[z_ir_i]
-
\frac1G
\sum_j
\mathbb E[z_ir_j]
\\
&=
\mathbb E[z_ir_i]
-
\frac1G\mathbb E[z_ir_i]
-
\frac1G
\sum_{j\neq i}
\mathbb E[z_i]\mathbb E[r_j]
\\
&=
\boxed{
\left(1-\frac1G\right)
\mathbb E[z_ir_i\mid q]
}.
\end{aligned}
\]

Therefore

\[
\boxed{
g_{\rm centered}^{(G)}
=
\left(1-\frac1G\right)
g_{\rm uncentered}
}
\]

under these assumptions.

\[
\boxed{
\text{inclusive empirical baseline}
\Rightarrow
\text{finite-}G\text{ shrinkage bias}.
}
\]

For the leave-one-out counterfactual

\[
b_{-i}
=
\frac1{G-1}
\sum_{j\neq i}r_j,
\]

\[
\mathbb E[z_i b_{-i}]
=
\mathbb E[z_i]\mathbb E[b_{-i}]
=0,
\]

hence the particular \(1-\frac1G\) factor disappears.

\[
\boxed{
\text{finite-group policy-gradient bias}
\neq
\text{KL-estimator unbiasedness}.
}
\]

---

# \(\mathsf{A}_{13}\) — RANDOM STANDARDIZATION

Let

\[
X_i
=
z_i(r_i-\bar r),
\qquad
S=s_r(r_{1:G}).
\]

Then

\[
\mathbb E
\left[
z_i
\frac{r_i-\bar r}{s_r}
\right]
=
\mathbb E
\left[
\frac{X_i}{S}
\right].
\]

But generally

\[
\boxed{
\mathbb E
\left[
\frac{X_i}{S}
\right]
\neq
\frac{\mathbb E[X_i]}{\mathbb E[S]}.
}
\]

Indeed

\[
\mathbb E[X_iS^{-1}]
=
\mathbb E[X_i]\mathbb E[S^{-1}]
+
\operatorname{Cov}(X_i,S^{-1}),
\]

while

\[
\mathbb E[S^{-1}]
\neq
\frac1{\mathbb E[S]}
\]

in general.

Hence

\[
\boxed{
\mathbb E[z_i\hat A_i]
=
\left(1-\frac1G\right)
\mathbb E[z_ir_i]
\times(\text{constant})
}
\]

is **not** generally valid.

\[
\boxed{
\text{DeepSeek GRPO advantage standardization}
\not\Rightarrow
\text{exact unbiased policy-gradient estimator}.
}
\]

For the population-std convention only,

\[
s_G^2=\frac1G\sum_i(r_i-\bar r)^2
\]

implies

\[
\frac1G\sum_i\hat A_i^2=1.
\]

For sample std,

\[
s_{G-1}^2
=
\frac1{G-1}\sum_i(r_i-\bar r)^2
\]

implies

\[
\sum_i\hat A_i^2=G-1.
\]

DeepSeek does not identify which convention is used.

---

# \(\mathsf{A}_{14}\) — OUTCOME-SUPERVISION ADVANTAGE

DeepSeekMath:

\[
\boxed{
\hat A_{i,t}
=
\widetilde r_i
=
\frac{
r_i-\operatorname{mean}(\mathbf r)
}{
\operatorname{std}(\mathbf r)
},
\qquad
t=1,\ldots,T_i
}
\qquad[\mathrm{REPORTED}]
\]

citeturn118065view1

Therefore

\[
\boxed{
\hat A_{i,1}
=
\hat A_{i,2}
=
\cdots
=
\hat A_{i,T_i}.
}
\]

Ignoring clipping/KL momentarily,

\[
\nabla_\theta J_i
\propto
\frac{\hat A_i}{T_i}
\sum_{t=1}^{T_i}
\nabla_\theta
\log
\pi_\theta(o_{i,t}\mid q,o_{i,<t}).
\]

Using

\[
\log\pi_\theta(o_i\mid q)
=
\sum_t
\log\pi_\theta(o_{i,t}\mid q,o_{i,<t}),
\]

\[
\boxed{
\nabla_\theta J_i
\propto
\frac{\hat A_i}{T_i}
\nabla_\theta
\log\pi_\theta(o_i\mid q).
}
\qquad[\mathrm{DERIVED}]
\]

\[
\text{// one sequence-level outcome score broadcasts across all response tokens.}
\]

---

# \(\mathsf{A}_{15}\) — PROCESS-SUPERVISION GRPO

DeepSeekMath defines

\[
\mathbf R
=
\left\{
\left\{
r_i^{\operatorname{index}(j)}
\right\}_{j=1}^{K_i}
\right\}_{i=1}^{G}.
\]

\[
\boxed{
\widetilde r_i^{\operatorname{index}(j)}
=
\frac{
r_i^{\operatorname{index}(j)}
-
\operatorname{mean}(\mathbf R)
}{
\operatorname{std}(\mathbf R)
}
}
\]

and

\[
\boxed{
\hat A_{i,t}
=
\sum_{\operatorname{index}(j)\ge t}
\widetilde r_i^{\operatorname{index}(j)}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn118065view1turn975410view7

For adjacent tokens spanning a process-reward boundary,

\[
\hat A_{i,t}
-
\hat A_{i,t+1}
=
\begin{cases}
\widetilde r_i^{t},
&
t=\operatorname{index}(j),
\\
0,&\text{otherwise}.
\end{cases}
\]

Thus

\[
\boxed{
V_\psi=\varnothing
}
\]

while

\[
\boxed{
\hat A_{i,t}
\text{ becomes token-position dependent.}
}
\]

---

# \(\mathsf{A}_{16}\) — OLD-POLICY IMPORTANCE RATIO

DeepSeekMath:

\[
\boxed{
\rho_{i,t}(\theta)
=
\frac{
\pi_\theta(o_{i,t}\mid q,o_{i,<t})
}{
\pi_{\rm old}(o_{i,t}\mid q,o_{i,<t})
}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn380873view0

Define

\[
\ell_{i,t}^{\rm new}
=
\log\pi_\theta(o_{i,t}\mid s_{i,t}),
\]

\[
\ell_{i,t}^{\rm old}
=
\operatorname{sg}
[
\log\pi_{\rm old}(o_{i,t}\mid s_{i,t})
].
\]

Then

\[
\boxed{
\rho_{i,t}
=
\exp
\left(
\ell_{i,t}^{\rm new}
-
\ell_{i,t}^{\rm old}
\right)
}
\qquad[\mathrm{DERIVED}]
\]

and

\[
\nabla_\theta\rho_{i,t}
=
\rho_{i,t}
\nabla_\theta
\ell_{i,t}^{\rm new}.
\]

\[
\boxed{
\nabla_\theta\rho_{i,t}
=
\rho_{i,t}
\nabla_\theta
\log\pi_\theta(o_{i,t}\mid s_{i,t})
}
\]

---

# \(\mathsf{A}_{17}\) — DEEPSEEKMATH VS R1 RATIO GRANULARITY

DeepSeekMath:

\[
\boxed{
\rho_{i,t}^{\rm Math}
=
\frac{\pi_\theta(o_{i,t}\mid s_{i,t})}
{\pi_{\rm old}(o_{i,t}\mid s_{i,t})}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn380873view0

DeepSeek-R1-v2 writes:

\[
\boxed{
\rho_i^{\rm R1}
=
\frac{
\pi_\theta(o_i\mid q)
}{
\pi_{\rm old}(o_i\mid q)
}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn118065view3turn138170view6

If this is interpreted literally as autoregressive sequence probability,

\[
\pi_\theta(o_i\mid q)
=
\prod_t\pi_\theta(o_{i,t}\mid s_{i,t}),
\]

therefore

\[
\boxed{
\rho_i
=
\prod_{t=1}^{T_i}
\rho_{i,t}
}
\qquad[\mathrm{DERIVED}]
\]

or

\[
\log\rho_i
=
\sum_t
\left(
\ell_{i,t}^{\rm new}
-
\ell_{i,t}^{\rm old}
\right).
\]

But:

\[
\boxed{
\mathrm{production\ ratio\ granularity}_{\rm R1}
=
[\mathrm{UNDISCLOSED}]
}
\]

because the official R1 repository does not publish the trainer implementation. citeturn975410view1

---

# \(\mathsf{A}_{18}\) — PPO-STYLE CLIPPING

\[
\boxed{
L_{i,t}^{\rm clip}
=
\min
\left[
\rho_{i,t}\hat A_{i,t},
\operatorname{clip}
(\rho_{i,t},1-\epsilon,1+\epsilon)
\hat A_{i,t}
\right]
}
\]

DeepSeekMath Eq. (3). citeturn380873view0

For \(A>0\),

\[
L^{\rm clip}
=
\begin{cases}
\rho A,
&
\rho\le1+\epsilon,
\\
(1+\epsilon)A,
&
\rho>1+\epsilon.
\end{cases}
\]

For \(A<0\),

\[
L^{\rm clip}
=
\begin{cases}
(1-\epsilon)A,
&
\rho<1-\epsilon,
\\
\rho A,
&
\rho\ge1-\epsilon.
\end{cases}
\]

Away from boundaries define

\[
I^\epsilon(\rho,A)
=
\mathbf1[A>0,\rho<1+\epsilon]
+
\mathbf1[A<0,\rho>1-\epsilon].
\]

Then

\[
\boxed{
\nabla_\theta
L^{\rm clip}
=
I^\epsilon
\rho A
\nabla_\theta\log\pi_\theta.
}
\qquad[\mathrm{DERIVED}]
\]

R1 first RL stage reports

\[
\boxed{
\epsilon=10
}
\qquad[\mathrm{REPORTED}]
\]

citeturn781449view0

Hence

\[
1-\epsilon=-9,
\qquad
1+\epsilon=11.
\]

Because

\[
\rho>0,
\]

\[
\rho<1-\epsilon=-9
\]

is impossible.

Thus, for the reported first R1 RL stage,

\[
\boxed{
A<0
\Longrightarrow
I^\epsilon=1
\quad\forall\rho>0
}
\qquad[\mathrm{DERIVED}]
\]

while positive-advantage clipping activates only when

\[
\rho>11.
\]

\[
\epsilon_{\rm R1-Zero}
=
[\mathrm{UNDISCLOSED}].
\]

---

# \(\mathsf{A}_{19}\) — CLIPPING BIAS

Unclipped:

\[
L^{\rm unclip}=\rho A,
\]

\[
\nabla L^{\rm unclip}
=
\rho A z,
\qquad
z=\nabla\log\pi_\theta.
\]

Clipped:

\[
\nabla L^{\rm clip}
=
I^\epsilon\rho A z.
\]

Therefore

\[
\begin{aligned}
&
\mathbb E[\nabla L^{\rm clip}]
-
\mathbb E[\nabla L^{\rm unclip}]
\\
&=
-\mathbb E
\left[
\mathbf1(A>0,\rho>1+\epsilon)
\rho A z
\right]
\\
&\quad
-\mathbb E
\left[
\mathbf1(A<0,\rho<1-\epsilon)
\rho A z
\right].
\end{aligned}
\]

Hence generally

\[
\boxed{
\mathbb E[\nabla L^{\rm clip}]
\neq
\mathbb E[\nabla L^{\rm unclip}].
}
\]

\[
\epsilon\downarrow
\Longrightarrow
P(I^\epsilon=0)\uparrow
\Longrightarrow
\text{greater clipping-induced bias}.
\]

\[
\epsilon\uparrow\infty
\Longrightarrow
I^\epsilon\rightarrow1
\Longrightarrow
\nabla L^{\rm clip}\rightarrow\nabla L^{\rm unclip}.
\]

DeepSeek-R1 explicitly reports the empirical tradeoff

\[
\epsilon\downarrow
\Rightarrow
\text{more gradient truncation},
\qquad
\epsilon\uparrow
\Rightarrow
\text{greater instability risk}.
\]

citeturn138170view0

---

# \(\mathsf{A}_{20}\) — REFERENCE POLICY

\[
\boxed{
\pi_{\rm old}
\neq
\pi_{\rm ref}
}
\]

\[
\boxed{
\pi_{\rm old}
:
\text{behavior/proximal importance anchor}
}
\]

\[
\boxed{
\pi_{\rm ref}
:
\text{KL regularization anchor}
}
\]

DeepSeekMath Algorithm 1:

\[
\boxed{
\theta_{\rm ref,k}
\leftarrow
\operatorname{sg}(\theta_{k,0,0})
}
\]

once at the beginning of each outer iterative-GRPO iteration, while

\[
\bar\theta_{k,m}
\leftarrow
\operatorname{sg}(\theta_{k,m,0})
\]

before each new rollout/exploration step. citeturn975410view3

R1-Zero:

\[
\boxed{
\theta_{\rm ref}
\leftarrow
\operatorname{sg}(\theta_{\rm current})
\quad
\text{every 400 policy-update steps}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn138170view1

R1 first RL:

\[
\boxed{
\text{same reported 400-step reference refresh}
}
\]

citeturn380873view2

R1 second RL:

\[
\boxed{
\text{exact reference-refresh subset inherited from stage 1}
=
[\mathrm{UNDISCLOSED}]
}
\]

because DeepSeek states only that “most” stage-one parameters are retained. citeturn380873view3

---

# \(\mathsf{A}_{21}\) — EXACT CATEGORICAL KL

At token state \(s\),

\[
\boxed{
D_{\rm KL}
(
\pi_\theta(\cdot\mid s)
\Vert
\pi_{\rm ref}(\cdot\mid s)
)
=
\sum_{a\in\mathcal V}
\pi_\theta(a\mid s)
\log
\frac{\pi_\theta(a\mid s)}
{\pi_{\rm ref}(a\mid s)}
}
\]

\[
\operatorname{Cost}_{\rm direct}
\propto
|\mathcal V|
\]

per optimized token state.

\[
\boxed{
\text{exact KL}
\Rightarrow
\text{vocabulary-wide weighted reduction}.
}
\qquad[\mathrm{DERIVED}]
\]

---

# \(\mathsf{A}_{22}\) — DEEPSEEK SAMPLED KL ESTIMATOR

DeepSeekMath defines

\[
u
=
\frac{
\pi_{\rm ref}(a\mid s)
}{
\pi_\theta(a\mid s)
}.
\]

Then

\[
\boxed{
\widehat D_{\rm KL}
=
u-\log u-1
}
\qquad[\mathrm{REPORTED}]
\]

or explicitly

\[
\boxed{
\widehat D_{\rm KL}
=
\frac{\pi_{\rm ref}(a\mid s)}
{\pi_\theta(a\mid s)}
-
\log
\frac{\pi_{\rm ref}(a\mid s)}
{\pi_\theta(a\mid s)}
-1
}
\]

citeturn975410view3turn380873view0

DeepSeek reports it as positive and unbiased. citeturn975410view3

Computationally,

\[
\widehat D_{\rm KL}
=
F
\left(
\pi_\theta(a\mid s),
\pi_{\rm ref}(a\mid s)
\right)
\]

uses the sampled-action probabilities rather than an explicit categorical weighted sum:

\[
\sum_{v=1}^{|\mathcal V|}
\pi_\theta(v\mid s)
\log
\frac{\pi_\theta(v\mid s)}
{\pi_{\rm ref}(v\mid s)}.
\]

\[
[\mathrm{DERIVED}]
\quad
\text{// computational consequence; DeepSeek does not state this as its motivation.}
\]

---

# \(\mathsf{A}_{23}\) — UNBIASEDNESS PROOF

Require

\[
a\sim\pi_\theta(\cdot\mid s).
\]

Then

\[
\begin{aligned}
\mathbb E_{\pi_\theta}
[\widehat D_{\rm KL}]
&=
\sum_a
\pi_\theta(a)
\left[
\frac{\pi_{\rm ref}(a)}{\pi_\theta(a)}
-
\log
\frac{\pi_{\rm ref}(a)}{\pi_\theta(a)}
-1
\right]
\\
&=
\underbrace{
\sum_a\pi_{\rm ref}(a)
}_{=1}
+
\sum_a
\pi_\theta(a)
\log
\frac{\pi_\theta(a)}{\pi_{\rm ref}(a)}
-
\underbrace{
\sum_a\pi_\theta(a)
}_{=1}
\\
&=
\boxed{
D_{\rm KL}
(
\pi_\theta
\Vert
\pi_{\rm ref}
)
}.
\end{aligned}
\]

Thus

\[
\boxed{
\widehat D_{\rm KL}
\neq
D_{\rm KL}
\quad\text{per sample}
}
\]

but

\[
\boxed{
a\sim\pi_\theta
\Longrightarrow
\mathbb E[\widehat D_{\rm KL}]
=
D_{\rm KL}.
}
\qquad[\mathrm{DERIVED}]
\]

Critical sampling-law boundary:

if instead

\[
a\sim\pi_{\rm old},
\qquad
\pi_{\rm old}\neq\pi_\theta,
\]

then

\[
\mathbb E_{\pi_{\rm old}}
[\widehat D_{\rm KL}]
=
\sum_a
\pi_{\rm old}(a)
\left[
u_a-\log u_a-1
\right]
\]

and generally

\[
\boxed{
\mathbb E_{\pi_{\rm old}}
[\widehat D_{\rm KL}]
\neq
D_{\rm KL}(\pi_\theta\Vert\pi_{\rm ref}).
}
\qquad[\mathrm{DERIVED}]
\]

An importance-corrected identity would be

\[
\mathbb E_{\pi_{\rm old}}
\left[
\frac{\pi_\theta(a)}
{\pi_{\rm old}(a)}
\widehat D_{\rm KL}(a)
\right]
=
D_{\rm KL}(\pi_\theta\Vert\pi_{\rm ref}),
\]

but that factor is **not** part of DeepSeekMath Eq. (4).

DeepSeekMath's reported main run has one policy update after each exploration stage, and its appendix explicitly analyzes the case

\[
\pi_{\rm old}=\pi_\theta.
\]

citeturn975410view5turn975410view6

\[
\boxed{
\text{DeepSeek KL-estimator unbiasedness}
\neq
\text{GRPO advantage-estimator unbiasedness}.
}
\]

---

# \(\mathsf{A}_{24}\) — NON-NEGATIVITY

\[
f(u)
=
u-\log u-1,
\qquad
u>0.
\]

\[
f'(u)
=
1-\frac1u
=
\frac{u-1}{u}.
\]

\[
f''(u)
=
\frac1{u^2}
>0.
\]

Thus \(f\) is strictly convex and

\[
f'(u)=0
\iff
u=1.
\]

\[
f(1)=0.
\]

Therefore

\[
\boxed{
u-\log u-1\ge0,
\qquad
\forall u>0,
}
\]

with equality iff

\[
u=1.
\]

This proves DeepSeekMath's stated positivity property. citeturn975410view3

---

# \(\mathsf{A}_{25}\) — LOCAL KL GEOMETRY

Define

\[
\Delta
=
\log
\frac{\pi_\theta(a\mid s)}
{\pi_{\rm ref}(a\mid s)}.
\]

Then

\[
u
=
e^{-\Delta}.
\]

Therefore

\[
\widehat D_{\rm KL}
=
e^{-\Delta}
+\Delta-1.
\]

Taylor expansion:

\[
e^{-\Delta}
=
1-\Delta
+\frac{\Delta^2}{2}
-\frac{\Delta^3}{6}
+\frac{\Delta^4}{24}
+\mathcal O(\Delta^5).
\]

Hence

\[
\boxed{
\widehat D_{\rm KL}
=
\frac12\Delta^2
-\frac16\Delta^3
+\frac1{24}\Delta^4
+\mathcal O(\Delta^5)
}
\]

and locally

\[
\boxed{
\widehat D_{\rm KL}
=
\frac12
\left(
\log\frac{\pi_\theta}{\pi_{\rm ref}}
\right)^2
+
\mathcal O(\Delta^3).
}
\]

---

# \(\mathsf{A}_{26}\) — KL GRADIENT

\[
u
=
\frac{\pi_{\rm ref}}{\pi_\theta}.
\]

Reference frozen:

\[
\nabla_\theta\pi_{\rm ref}=0.
\]

Thus

\[
\nabla_\theta u
=
-\frac{\pi_{\rm ref}}{\pi_\theta}
\nabla_\theta\log\pi_\theta
=
-u\nabla_\theta\log\pi_\theta.
\]

Also

\[
\nabla_\theta[-\log u]
=
+\nabla_\theta\log\pi_\theta.
\]

Therefore

\[
\boxed{
\nabla_\theta
\widehat D_{\rm KL}
=
(1-u)
\nabla_\theta\log\pi_\theta
}
\]

\[
=
\boxed{
\left(
1-
\frac{\pi_{\rm ref}}{\pi_\theta}
\right)
\nabla_\theta\log\pi_\theta.
}
\]

For the maximized GRPO term

\[
-\beta\widehat D_{\rm KL},
\]

\[
\boxed{
\nabla_\theta
[-\beta\widehat D_{\rm KL}]
=
\beta
\left(
\frac{\pi_{\rm ref}}{\pi_\theta}-1
\right)
\nabla_\theta\log\pi_\theta.
}
\]

DeepSeekMath Appendix Eq. (20–21) reports exactly this KL contribution to the gradient coefficient. citeturn118065view2

---

# \(\mathsf{A}_{27}\) — WHY KL IS OUTSIDE GROUP NORMALIZATION

Counterfactual:

\[
r_i'
=
r_i-\beta K_i.
\]

Then

\[
\bar r'
=
\bar r
-
\beta\bar K.
\]

Hence

\[
r_i'-\bar r'
=
(r_i-\bar r)
-
\beta(K_i-\bar K).
\]

For population group variance,

\[
\begin{aligned}
(s_r')^2
&=
\operatorname{Var}_G(r-\beta K)
\\
&=
\operatorname{Var}_G(r)
+
\beta^2\operatorname{Var}_G(K)
-
2\beta\operatorname{Cov}_G(r,K).
\end{aligned}
\]

Thus

\[
\boxed{
A_i'
=
\frac{
(r_i-\bar r)-\beta(K_i-\bar K)
}{
\sqrt{
\operatorname{Var}_G(r)
+
\beta^2\operatorname{Var}_G(K)
-
2\beta\operatorname{Cov}_G(r,K)
}
}
}
\]

so KL modifies

\[
\boxed{
\text{center}
+
\text{scale}
+
\text{relative ranking magnitude}.
}
\]

DeepSeek GRPO instead uses

\[
\boxed{
A_i
=
\operatorname{NormGroup}(r_i)
}
\]

and separately

\[
\boxed{
J
=
J_{\rm relative}
-
\beta J_{\rm KL}.
}
\]

DeepSeekMath explicitly states that KL is added directly to the loss rather than reward to avoid complicating the advantage calculation. citeturn975410view3turn380873view0

---

# \(\mathsf{A}_{28}\) — EXACT DEEPSEEKMATH GRPO OBJECTIVE

\[
\boxed{
\begin{aligned}
\mathcal J_{\rm GRPO}(\theta)
&=
\mathbb E_{
\substack{
q\sim P(Q),\\
\{o_i\}_{i=1}^{G}
\sim
\pi_{\theta_{\rm old}}(O\mid q)
}}
\Bigg[
\frac1G
\sum_{i=1}^{G}
\frac1{|o_i|}
\sum_{t=1}^{|o_i|}
\Bigg\{
\\[-1mm]
&\qquad
\min
\left[
\frac{
\pi_\theta(o_{i,t}\mid q,o_{i,<t})
}{
\pi_{\theta_{\rm old}}(o_{i,t}\mid q,o_{i,<t})
}
\hat A_{i,t},
\right.
\\
&\qquad\qquad\left.
\operatorname{clip}
\left(
\frac{
\pi_\theta(o_{i,t}\mid q,o_{i,<t})
}{
\pi_{\theta_{\rm old}}(o_{i,t}\mid q,o_{i,<t})
},
1-\epsilon,
1+\epsilon
\right)
\hat A_{i,t}
\right]
\\
&\qquad
-
\beta
\left[
\frac{
\pi_{\rm ref}(o_{i,t}\mid q,o_{i,<t})
}{
\pi_\theta(o_{i,t}\mid q,o_{i,<t})
}
-
\log
\frac{
\pi_{\rm ref}(o_{i,t}\mid q,o_{i,<t})
}{
\pi_\theta(o_{i,t}\mid q,o_{i,<t})
}
-1
\right]
\Bigg\}
\Bigg].
\end{aligned}
}
\]

\[
[\mathrm{REPORTED}]
\]

DeepSeekMath Eq. (3–4). citeturn380873view0

Outcome-supervision specialization:

\[
\boxed{
\hat A_{i,t}
=
\frac{
r_i-\frac1G\sum_jr_j
}{
\operatorname{std}(r_{1:G})
}
}
\]

for all \(t\). citeturn118065view1

---

# \(\mathsf{A}_{29}\) — COMPLETE GRADIENT COEFFICIENT

Define

\[
u_{i,t}
=
\frac{
\pi_{\rm ref}(o_{i,t}\mid s_{i,t})
}{
\pi_\theta(o_{i,t}\mid s_{i,t})
}.
\]

For non-boundary clipping states:

\[
\boxed{
GC_{i,t}
=
I^\epsilon_{i,t}
\rho_{i,t}
\hat A_{i,t}
+
\beta(u_{i,t}-1)
}
\qquad[\mathrm{DERIVED}]
\]

and

\[
\boxed{
\nabla_\theta J
=
\mathbb E
\left[
\frac1G
\sum_i
\frac1{T_i}
\sum_t
GC_{i,t}
\nabla_\theta
\log\pi_\theta(o_{i,t}\mid s_{i,t})
\right].
}
\]

DeepSeekMath appendix imposes

\[
\pi_{\rm old}=\pi_\theta
\Longrightarrow
\rho=1
\]

and removes min/clip, yielding

\[
\boxed{
GC_{i,t}^{\rm DS\ Appendix}
=
\hat A_{i,t}
+
\beta
\left(
\frac{\pi_{\rm ref}}{\pi_\theta}
-1
\right)
}
\qquad[\mathrm{REPORTED}]
\]

citeturn118065view2

which is exactly the specialization

\[
GC_{i,t}
\xrightarrow[\rho=1]{I^\epsilon=1}
\hat A_{i,t}
+\beta(u_{i,t}-1).
\]

---

# \(\mathsf{A}_{30}\) — FULL ACTOR BACKWARD PASS

Define

\[
g_{i,t}
=
\frac{\partial J}
{\partial\log\pi_\theta(a_{i,t}\mid s_{i,t})}
=
\frac1{GT_i}
GC_{i,t}.
\]

\[
\ell_{i,t}
=
\log\operatorname{softmax}(z_{i,t})_{a_{i,t}}.
\]

For vocabulary logit \(z_{i,t,v}\),

\[
\boxed{
\frac{\partial\ell_{i,t}}
{\partial z_{i,t,v}}
=
\mathbf1[v=a_{i,t}]
-
\pi_\theta(v\mid s_{i,t})
}
\]

so

\[
\boxed{
\frac{\partial J}
{\partial z_{i,t,v}}
=
g_{i,t}
\left[
\mathbf1[v=a_{i,t}]
-
\pi_\theta(v\mid s_{i,t})
\right].
}
\]

For generic LM head

\[
z_{i,t}=W_{\rm LM}h_{i,t}+b,
\]

\[
\frac{\partial J}{\partial h_{i,t}}
=
W_{\rm LM}^{\top}
\frac{\partial J}{\partial z_{i,t}}.
\]

Then

\[
\boxed{
\nabla_\theta J
=
\sum_{i,t}
\left(
\frac{\partial h_{i,t}}
{\partial\theta}
\right)^{\!\top}
\frac{\partial J}{\partial h_{i,t}}
+
\nabla_\theta^{W_{\rm LM}}J.
}
\]

\[
[\mathrm{DERIVED}]
\]

\[
\text{// generic autoregressive backpropagation; not a DeepSeek-disclosed GRPO kernel implementation.}
\]

Stop-gradient boundaries:

\[
\boxed{
\nabla_\theta
\{
q,o,\bar\theta,\theta_{\rm ref},
r,\bar r,s_r,\hat A,
\ell^{\rm old}
\}
=0
}
\]

during an actor update.

\[
\nabla_\theta
\ell^{\rm new}\neq0.
\]

---

# \(\mathsf{A}_{31}\) — PARAMETER UPDATE

\[
\mathcal L_{\rm actor}
=
-\mathcal J_{\rm GRPO}.
\]

\[
\boxed{
\theta_{j+1}
=
\operatorname{Optimizer}
\left(
\theta_j,
\nabla_\theta\mathcal L_{\rm actor};
\eta
\right)
}
\]

\[
\boxed{
\mathrm{OptimizerFamily}_{\rm GRPO}
=
[\mathrm{UNDISCLOSED}]
}
\]

No DeepSeek source located here specifies Adam/AdamW plus optimizer-state hyperparameters specifically for the reported GRPO actor runs.

Reported learning rates:

\[
\boxed{
\eta_{\rm DeepSeekMath}=10^{-6}
}
\]

citeturn975410view5

\[
\boxed{
\eta_{\rm R1-Zero}=3\times10^{-6}
}
\]

citeturn138170view1

\[
\boxed{
\eta_{\rm R1-firstRL}=3\times10^{-6}
}
\]

citeturn380873view2

\[
\{\beta_1,\beta_2,
\lambda_{\rm wd},
\|\nabla\|_{\max},
\text{actor precision}\}
=
[\mathrm{UNDISCLOSED}]
\]

for these GRPO stages.

---

# \(\mathsf{A}_{32}\) — DEEPSEEKMATH OUTER EXPLORATION LOOP

DeepSeekMath Algorithm 1: citeturn975410view3

\[
\boxed{
\begin{aligned}
&\textbf{Initialize:}
&&\theta^{(0)}
\leftarrow
\theta_{\rm init}
\\[1mm]
&\textbf{for }k=0,\ldots,I-1:
&&
\theta_{\rm ref}^{(k)}
\leftarrow
\operatorname{sg}(\theta^{(k)})
\\
&\qquad
\textbf{for }m=1,\ldots,M:
&&
\mathcal D_b
\sim\mathcal D
\\
&&&
\bar\theta^{(k,m)}
\leftarrow
\operatorname{sg}(\theta^{(k,m,0)})
\\
&&&
o_{q,1:G}
\sim
\pi_{\bar\theta^{(k,m)}}(\cdot\mid q)
\\
&&&
r_{q,i}
\leftarrow
r_{\varphi_k}(q,o_{q,i})
\\
&&&
\hat A_{q,i,t}
\leftarrow
\operatorname{GroupRelativeAdvantage}
(r_{q,1:G})
\\
&&&
\textbf{for }j=0,\ldots,\mu-1:
\\
&&&
\theta^{(k,m,j+1)}
\leftarrow
\operatorname{Update}_{J_{\rm GRPO}}
(
\theta^{(k,m,j)}
)
\\[1mm]
&\qquad
\varphi_{k+1}
&&\leftarrow
\operatorname{RMTrain}
(
\varphi_k,
\mathcal D_{\rm newly\ sampled},
\mathcal D_{\rm replay}
)
\\
&\textbf{next }k:
&&
\theta_{\rm ref}^{(k+1)}
\leftarrow
\operatorname{sg}(\theta^{(k+1)}).
\end{aligned}
}
\]

DeepSeekMath reports two iterative-RL rounds in the corresponding experiment. citeturn754039view3

---

# \(\mathsf{A}_{33}\) — INNER UPDATE LOOP

DeepSeekMath main run:

\[
\boxed{
\mu_{\rm Math}=1
}
\]

citeturn975410view5

Therefore

\[
\text{rollout}
\rightarrow
\text{one actor update}
\rightarrow
\text{new exploration}.
\]

DeepSeek-R1-Zero:

\[
N_{\rm rollout}=8192\ \text{responses},
\]

\[
N_{\rm mini}=16,
\]

\[
N_{\rm response/mini}
=
8192/16
=
512,
\]

\[
N_{\rm q/mini}
=
512/G
=
32.
\]

\[
\boxed{
N_{\rm policy\ updates/rollout}
=
16
}
\qquad[\mathrm{DERIVED}]
\]

because DeepSeek defines one training step as one policy update. citeturn710992view2

Yet

\[
\boxed{
N_{\rm inner\ epochs/rollout}=1
}
\qquad[\mathrm{REPORTED}]
\]

citeturn138170view1

Thus

\[
\boxed{
\text{rollout reuse epoch}
\neq
\text{policy update}
\neq
\text{dataset epoch}.
}
\]

For R1-Zero:

\[
N_{\rm policy\ steps}=10\,400,
\qquad
N_{\rm dataset\ epochs}=1.6.
\]

citeturn138170view1

---

# \(\mathsf{A}_{34}\) — DEEPSEEKMATH REWARD-MODEL ITERATION

\[
\varphi_k
\rightarrow
\mathcal D_{\rm new}^{(k)}
\rightarrow
\varphi_{k+1}.
\]

DeepSeek reports:

\[
\boxed{
\mathcal D_{\rm RM}^{(k+1)}
=
\mathcal D_{\rm new}^{(k)}
\oplus
\operatorname{Replay}_{10\%\ {\rm historical}}
(
\mathcal D_{\rm hist}
)
}
\qquad[\mathrm{REPORTED}]
\]

citeturn975410view5turn975410view7

\[
\boxed{
\text{exact ``10\%'' sampling denominator/mixing implementation}
=
[\mathrm{UNDISCLOSED}]
}
\]

Then

\[
\boxed{
\theta_{\rm ref}^{(k+1)}
\leftarrow
\theta^{(k+1)}
}
\]

before continuing actor training with the updated RM. citeturn975410view5

This mechanism is distinct from R1-Zero:

\[
\boxed{
\mathrm{R1ZeroReasoningRewardModel}
=
\varnothing.
}
\]

citeturn710992view2

---

# \(\mathsf{A}_{35}\) — DEEPSEEKMATH HYPERPARAMETER AUDIT

\[
\begin{array}{c|c}
\text{quantity}&\mathrm{DeepSeekMath\ GRPO}
\\ \hline
|\mathcal D|&\approx144\,000\ [\mathrm{REPORTED}]
\\
G&64\ [\mathrm{REPORTED}]
\\
B&1024\ [\mathrm{REPORTED}]
\\
T_{\max}&1024\ [\mathrm{REPORTED}]
\\
\eta_{\rm actor}&10^{-6}\ [\mathrm{REPORTED}]
\\
\eta_{\rm initialRM}&2\times10^{-5}\ [\mathrm{REPORTED}]
\\
\beta&0.04\ [\mathrm{REPORTED}]
\\
\mu_{\rm main}&1\ [\mathrm{REPORTED}]
\\
I_{\rm iterative\ experiment}&2\ {\rm rounds}\ [\mathrm{REPORTED}]
\\
\epsilon&[\mathrm{UNDISCLOSED}]
\\
\operatorname{std\ denominator}&[\mathrm{UNDISCLOSED}]
\\
\epsilon_{\rm std}&[\mathrm{UNDISCLOSED}]
\\
\operatorname{optimizer}&[\mathrm{UNDISCLOSED}]
\\
\operatorname{gradient\ clipping}&[\mathrm{UNDISCLOSED}]
\\
\operatorname{precision}&[\mathrm{UNDISCLOSED}]
\\
\operatorname{distributed\ strategy}&[\mathrm{UNDISCLOSED}]
\\
\operatorname{rollout\ nucleus\ parameters}&[\mathrm{UNDISCLOSED}]
\end{array}
\]

Hyperparameters: citeturn975410view5

DeepSeekMath states that rollout exploration uses naive nucleus sampling, but does not publish its decoding parameters there. citeturn754039view2

---

# \(\mathsf{A}_{36}\) — DEEPSEEK-R1-ZERO COMPLETE LOOP

\[
\boxed{
\theta_0
=
\theta_{\rm DeepSeek\!-\!V3\!-\!Base}
}
\qquad[\mathrm{REPORTED}]
\]

citeturn710992view2

For step \(k\):

\[
q_b\sim\mathcal D_{\rm reasoning}
\]

\[
o_{b,i}
\sim
\pi_{\rm old}(\cdot\mid q_b;\tau=1),
\qquad
i=1,\ldots,16.
\]

\[
r_{b,i}
=
r_{b,i}^{\rm acc}
+
r_{b,i}^{\rm format}.
\]

\[
\hat A_{b,i}
=
\frac{
r_{b,i}-\frac1{16}\sum_jr_{b,j}
}{
\operatorname{std}(r_{b,1:16})
}.
\]

R1-v2 objective notation:

\[
J
=
\frac1{16}
\sum_i
\left\{
\min[
\rho_i A_i,
\operatorname{clip}(\rho_i,1-\epsilon,1+\epsilon)A_i
]
-
0.001\,\widehat D_{{\rm KL},i}
\right\}
\]

with

\[
\rho_i
=
\frac{\pi_\theta(o_i\mid q)}
{\pi_{\rm old}(o_i\mid q)}
\]

and

\[
\widehat D_{{\rm KL},i}
=
\frac{\pi_{\rm ref}(o_i\mid q)}
{\pi_\theta(o_i\mid q)}
-
\log
\frac{\pi_{\rm ref}(o_i\mid q)}
{\pi_\theta(o_i\mid q)}
-1.
\]

\[
\boxed{
\epsilon_{\rm R1Zero}
=
[\mathrm{UNDISCLOSED}]
}
\]

The sequence-level notation is exactly what R1-v2 prints; production granularity remains undisclosed. citeturn118065view3

Reported schedule:

\[
\boxed{
\begin{aligned}
G&=16,\\
\eta&=3\times10^{-6},\\
\beta&=10^{-3},\\
\tau&=1,\\
T_{\max}&=
\begin{cases}
32768,&k<8200,\\
65536,&k\ge8200,
\end{cases}
\\
N_{\rm steps}&=10400,\\
N_{\rm epochs}&=1.6,\\
B_q^{\rm step}&=32,\\
B_{\rm response}^{\rm step}&=512,\\
N_{\rm refrefresh}&=400\ {\rm steps}.
\end{aligned}
}
\]

citeturn138170view1

---

# \(\mathsf{A}_{37}\) — REPORTED R1-ZERO TRAINING EVOLUTION

\[
\theta_0
\xrightarrow{\rm GRPO}
\theta_1
\xrightarrow{\rm GRPO}
\cdots
\xrightarrow{\rm GRPO}
\theta_{10400}.
\]

Reported AIME-2024 trajectory:

\[
\boxed{
\operatorname{Pass@1}:
15.6\%
\longrightarrow
77.9\%
}
\]

\[
\boxed{
\operatorname{ConsistentDecode}:
86.7\%
}
\]

citeturn109421view0

Response-length trajectory:

\[
\mathbb E[T(o)]_{k}
\uparrow
\quad\text{over RL training}.
\]

DeepSeek reports a discontinuity around

\[
k=8200
\]

coincident with

\[
T_{\max}:32768\rightarrow65536.
\]

citeturn138170view1

MATH difficulty strata:

\[
\begin{array}{c|c}
\text{level}&\text{reported accuracy trajectory}\\ \hline
1\!-\!3&\approx0.90\!-\!0.95\ \text{early/stable}\\
4&\approx0.78\rightarrow0.95\\
5&\approx0.55\rightarrow0.90
\end{array}
\]

citeturn380873view6

\[
\boxed{
\text{observed trajectory}
\not\Rightarrow
\text{identified causal mechanism}.
}
\]

---

# \(\mathsf{A}_{38}\) — R1 COLD START \(\rightarrow\) REASONING RL

\[
\boxed{
\theta_{\rm V3Base}
\xrightarrow{
\operatorname{SFT}(\mathcal D_{\rm cold})
}
\theta_{\rm cold}
}
\]

DeepSeek reports “thousands” of cold-start examples, not an exact total. citeturn138170view4turn109421view1

\[
|\mathcal D_{\rm cold}|
=
[\mathrm{UNDISCLOSED\ exact}]
\]

R1-v2 reports SFT configuration:

\[
\boxed{
\begin{aligned}
E_{\rm SFT}&=2\!-\!3,\\
\eta_{\rm SFT}&:
5\times10^{-5}
\rightarrow
5\times10^{-6}
\quad(\text{cosine}),\\
T_{\max}&=32768,\\
B&=128.
\end{aligned}
}
\]

citeturn975410view10

Then

\[
\boxed{
\theta_{\rm cold}
\xrightarrow{
\mathrm{GRPO}
}
\theta_{\rm reasoning}
}
\]

with

\[
r
=
r_{\rm rule}
+
r_{\rm language}.
\]

First-stage reported RL configuration:

\[
\boxed{
\eta=3\times10^{-6},
\quad
\beta=0.001,
\quad
\epsilon=10,
\quad
\tau=1,
\quad
G=16,
\quad
T_{\max}=32768.
}
\]

\[
B_q=32,
\qquad
B_{\rm response}=512,
\]

\[
\theta_{\rm ref}
\leftarrow\theta
\quad\text{every }400\text{ updates},
\]

\[
8192\text{ responses/rollout}
\rightarrow
16\text{ minibatches}
\rightarrow
1\text{ inner epoch}.
\]

citeturn380873view2turn781449view0

\[
N_{\rm firstRL\ total\ steps}
=
[\mathrm{UNDISCLOSED}].
\]

---

# \(\mathsf{A}_{39}\) — REJECTION SAMPLING + SECOND SFT

Generation path:

\[
\boxed{
\theta_{\rm reasoning}
\rightarrow
\mathcal D_{\rm sampled}
\rightarrow
\operatorname{FilterCorrect}
\rightarrow
\mathcal D_{\rm reasoning}
}
\]

DeepSeek reports multiple responses per prompt, correctness filtering, additional generative judging for some data, and filtering of mixed-language/long-paragraph/code-block CoTs. citeturn975410view9

\[
|\mathcal D_{\rm reasoning}|
\approx600\,000
\]

\[
|\mathcal D_{\rm nonreasoning}|
\approx200\,000.
\]

citeturn975410view9turn118065view7

Exact published SFT table:

\[
\begin{array}{c|r}
\mathrm{Math}&395285\\
\mathrm{Code}&211129\\
\mathrm{STEM}&10124\\
\mathrm{Logic}&10395\\
\mathrm{General}&177812\\ \hline
\mathrm{Total}&804745
\end{array}
\]

citeturn118065view8

Important state transition:

\[
\theta_{\rm reasoning}
\longrightarrow
\mathcal D_{\rm RS},
\]

but the second SFT is reported as fine-tuning **DeepSeek-V3-Base**:

\[
\boxed{
\theta_{\rm V3Base}
\xrightarrow{
\operatorname{SFT}
(
\mathcal D_{\rm reasoning}
\cup
\mathcal D_{\rm general}
)
}
\theta_{\rm SFT2}.
}
\]

\[
\boxed{
E_{\rm SFT2}=2\!-\!3
}
\]

citeturn975410view10

Therefore

\[
\boxed{
\theta_{\rm reasoning}
\not\xrightarrow{\rm direct\ SFT}
\theta_{\rm SFT2}
}
\]

in the reported pipeline; the reasoning checkpoint supplies training trajectories, while V3-Base is the SFT initialization.

---

# \(\mathsf{A}_{40}\) — SECOND R1 RL STAGE

\[
\boxed{
\theta_{\rm SFT2}
\xrightarrow{\rm GRPO}
\theta_{\rm R1}
}
\]

Reward:

\[
\boxed{
r
=
r_{\rm reasoning}
+
r_{\rm general}
+
r_{\rm language}
}
\]

\[
r_{\rm reasoning}
=
r_{\rm rule}
\]

\[
r_{\rm general}
=
r_{\rm reward\ model}
+
r_{\rm format}.
\]

citeturn380873view3

Domain gating:

\[
r_{\rm reward\ model}
=
\begin{cases}
RM_{\rm helpful},&q\in\mathcal D_{\rm helpful},\\
RM_{\rm safety},&q\in\mathcal D_{\rm safety}.
\end{cases}
\]

citeturn380873view2

Reported:

\[
\boxed{
\tau_{\rm second}=0.7,
\qquad
N_{\rm second}=1700\ \text{policy steps}.
}
\]

General instruction data + preference-RM reward:

\[
\boxed{
k\in\{1301,\ldots,1700\}
}
\]

only, i.e.

\[
400\text{ final steps}.
\]

citeturn380873view3

DeepSeek says this stage retains “most” first-stage parameters, but does not enumerate the exact inherited subset:

\[
\boxed{
\{
\eta,\beta,\epsilon,G,B,
T_{\max},
\operatorname{refrefresh},\ldots
\}_{\rm second,\ exact}
=
[\mathrm{UNDISCLOSED}]
}
\]

except where explicitly restated.

---

# \(\mathsf{A}_{41}\) — GRPO MEMORY/COMPUTE STATE REDUCTION

Let critic parameter memory be

\[
M_{\rm critic}
=
N_\psi b_\psi.
\]

Gradient state:

\[
M_{\nabla\rm critic}
=
N_\psi b_{\nabla\psi}.
\]

Optimizer state:

\[
M_{\rm opt,critic}
=
N_\psi
\sum_{\ell=1}^{n_{\rm opt}}
b_\ell.
\]

Activation state:

\[
M_{\rm act,critic}
=
\sum_{\ell}
M_{\rm activation}^{(\ell)}.
\]

Then critic elimination yields

\[
\boxed{
\Delta M
=
M_{\rm critic}
+
M_{\nabla\rm critic}
+
M_{\rm opt,critic}
+
M_{\rm act,critic}.
}
\]

Potential extra compute removed:

\[
\Delta C
=
C_{\rm critic,fwd}
+
C_{\rm critic,bwd}
+
C_{\rm critic,opt}.
\]

\[
[\mathrm{DERIVED}]
\]

DeepSeekMath explicitly states that PPO's value model is typically comparable in size to the policy and that GRPO removes that additional model. citeturn380873view0

R1-v2 infrastructure makes the critic conditional:

\[
\boxed{
\mathrm{TrainingModule}
=
\mathrm{Actor}
+
\mathrm{Critic}_{\rm if\ required}
}
\]

and separately supports GRPO. citeturn380873view1turn138170view7

\[
\boxed{
\Delta M_{\rm bytes,\ DeepSeekR1}
=
[\mathrm{UNDISCLOSED}]
}
\]

because the required optimizer/precision/activation-state details are not fully disclosed.

---

# \(\mathsf{A}_{42}\) — MATHEMATICALLY IMPLIED FAILURE MODES

### \(G=1\)

\[
\bar r=r_1,
\qquad
s_r=0,
\]

\[
\boxed{
\hat A_1=0/0.
}
\]

### \(\sigma_r=0\)

\[
r_1=\cdots=r_G
\Longrightarrow
s_r=0
\Longrightarrow
\boxed{
\hat A_i\ \text{undefined}.
}
\]

### Sparse success probability

Assume binary correctness

\[
r_i\sim\operatorname{Bernoulli}(p).
\]

All-zero probability:

\[
P(K=0)
=
(1-p)^G.
\]

All-one probability:

\[
P(K=G)=p^G.
\]

Informative mixed group:

\[
\boxed{
P(0<K<G)
=
1-(1-p)^G-p^G.
}
\]

For \(Gp\ll1\),

\[
(1-p)^G
=
1-Gp+\mathcal O((Gp)^2),
\]

hence

\[
P(0<K<G)
\approx
Gp.
\]

Thus

\[
\boxed{
G\ll\frac1p
\Longrightarrow
\text{most groups provide no correctness contrast.}
}
\]

### Large positive-policy ratio

For

\[
A>0,
\qquad
\rho\gg1+\epsilon,
\]

\[
L^{\rm clip}=(1+\epsilon)A,
\]

\[
\boxed{
\nabla_\theta L^{\rm clip}=0.
}
\]

For

\[
A<0,
\qquad
\rho\gg1+\epsilon,
\]

\[
L^{\rm clip}=\rho A,
\]

\[
\boxed{
\nabla_\theta L^{\rm clip}
=
\rho A\nabla\log\pi_\theta.
}
\]

### Small ratio

For

\[
A<0,\quad
\rho\ll1-\epsilon,
\]

\[
L^{\rm clip}=(1-\epsilon)A,
\qquad
\nabla L=0.
\]

For

\[
A>0,\quad
\rho\ll1-\epsilon,
\]

\[
L^{\rm clip}=\rho A,
\qquad
\nabla L=\rho A\nabla\log\pi_\theta.
\]

### Current policy \(\gg\) reference on sampled action

\[
\pi_\theta\gg\pi_{\rm ref}
\Longrightarrow
u\rightarrow0.
\]

\[
\widehat D_{\rm KL}
=
u-\log u-1
\rightarrow\infty.
\]

KL contribution:

\[
GC_{\rm KL}
=
\beta(u-1)
\rightarrow-\beta.
\]

### Current policy \(\ll\) reference

\[
u\rightarrow\infty,
\]

\[
\widehat D_{\rm KL}
\sim u,
\]

\[
\boxed{
GC_{\rm KL}
=
\beta(u-1)
\rightarrow+\infty.
}
\]

### Very long response

DeepSeekMath weighting:

\[
J_i
=
\frac1{T_i}
\sum_{t=1}^{T_i}L_{i,t}.
\]

Thus individual token weight:

\[
w_{i,t}
=
\frac1{T_i}.
\]

If

\[
T_i\gg T_j,
\]

then

\[
\boxed{
w_{i,t}\ll w_{j,t'}.
}
\]

---

# \(\mathsf{A}_{43}\) — BINARY-REWARD GROUP GEOMETRY

Let

\[
r_i\in\{0,1\},
\qquad
K=\sum_i r_i=k,
\qquad
p_G=\frac{k}{G}.
\]

R1-v2 explicitly reports binary \(0/1\) mathematical correctness rewards; this analysis applies to that component, not necessarily the combined accuracy+format reward. citeturn652764view0

\[
\bar r
=
\boxed{
\frac{k}{G}
}.
\]

Under the population-std convention:

\[
s_{\rm pop}^2
=
\frac1G
\left[
k(1-p_G)^2
+
(G-k)p_G^2
\right].
\]

Expanding,

\[
s_{\rm pop}^2
=
p_G(1-p_G).
\]

Hence

\[
\boxed{
s_{\rm pop}
=
\frac{\sqrt{k(G-k)}}{G}
}.
\]

For a correct response:

\[
A_1
=
\frac{1-k/G}
{\sqrt{(k/G)(1-k/G)}}
\]

\[
\boxed{
A_{\rm correct}
=
\sqrt{
\frac{G-k}{k}
}.
}
\]

For incorrect:

\[
A_0
=
-\frac{k/G}
{\sqrt{(k/G)(1-k/G)}}
\]

\[
\boxed{
A_{\rm incorrect}
=
-
\sqrt{
\frac{k}{G-k}
}.
}
\]

Special cases:

\[
k=1:
\qquad
A_{\rm correct}
=
\sqrt{G-1},
\]

\[
A_{\rm incorrect}
=
-\frac1{\sqrt{G-1}}.
\]

\[
k=G-1:
\qquad
A_{\rm correct}
=
\frac1{\sqrt{G-1}},
\]

\[
A_{\rm incorrect}
=
-\sqrt{G-1}.
\]

\[
k=0
\quad\text{or}\quad
k=G
\Longrightarrow
s=0
\Longrightarrow
\boxed{
A\ \text{undefined}.
}
\]

If DeepSeek's implementation uses sample std instead,

\[
s_{\rm sample}
=
\sqrt{\frac{G}{G-1}}
\,s_{\rm pop},
\]

therefore

\[
\boxed{
A^{\rm sample}
=
\sqrt{\frac{G-1}{G}}
A^{\rm pop}.
}
\]

DeepSeek does not disclose which convention is used.

---

# \(\mathsf{A}_{44}\) — LENGTH NORMALIZATION

DeepSeekMath:

\[
J_i^{\rm avg}
=
\frac1{T_i}
\sum_{t=1}^{T_i}L_{i,t}.
\]

Without normalization:

\[
J_i^{\rm sum}
=
\sum_{t=1}^{T_i}L_{i,t}.
\]

If

\[
L_{i,t}=c
\quad\forall t,
\]

then

\[
J_i^{\rm avg}=c,
\]

whereas

\[
J_i^{\rm sum}=T_i c.
\]

Thus

\[
\boxed{
J_i^{\rm avg}
\text{ weights responses by mean token objective,}
}
\]

while

\[
\boxed{
J_i^{\rm sum}
\text{ scales linearly with response length under constant token signal.}
}
\]

DeepSeekMath explicitly contains the \(1/|o_i|\) factor. citeturn380873view0

R1-v2's displayed GRPO equation uses sequence-level notation and contains no explicit token-level \(1/T_i\) factor. citeturn118065view3

\[
\boxed{
\mathrm{R1\ production\ length\ normalization}
=
[\mathrm{UNDISCLOSED}]
}
\]

---

# \(\mathsf{A}_{45}\) — CRITIC ADVANTAGE VS GROUP ADVANTAGE

\[
\begin{array}{c|c|c}
&
A_t^{\rm critic}
&
A_i^{\rm GRPO}
\\ \hline
\text{form}
&
Q^\pi(s_t,a_t)-V_\psi(s_t)
&
\dfrac{r_i-\bar r_q}{s_{r,q}}
\\[4mm]
\text{conditioning}
&
s_t
&
q,\{o_j,r_j\}_{j=1}^G
\\[2mm]
\text{learned baseline}
&
V_\psi
&
\varnothing
\\
\text{baseline source}
&
\psi
&
\frac1G\sum_jr_j
\\
\text{token dependence}
&
t
&
\text{constant in OS};
\ t\text{-dependent in PS}
\\
\text{finite-group effect}
&
\varnothing\ \text{of this form}
&
1-\frac1G\ \text{self-baseline shrinkage}
\\
\text{normalization coupling}
&
\text{method-dependent}
&
s_r(r_{1:G})
\\
\text{cross-sample covariance}
&
\text{not implied}
&
-\sigma_q^2/G
\end{array}
\]

\[
[\mathrm{DERIVED}]
\]

---

# \(\mathsf{A}_{46}\) — TWO-RATIO INVARIANT

\[
\boxed{
\rho_{i,t}
=
\frac{
\pi_\theta(o_{i,t}\mid s_{i,t})
}{
\pi_{\rm old}(o_{i,t}\mid s_{i,t})
}
}
\]

\[
\boxed{
u_{i,t}
=
\frac{
\pi_{\rm ref}(o_{i,t}\mid s_{i,t})
}{
\pi_\theta(o_{i,t}\mid s_{i,t})
}
}
\]

\[
\boxed{
\rho_{i,t}\neq u_{i,t}.
}
\]

\[
\boxed{
\begin{aligned}
\rho
&\longrightarrow
\text{importance/proximal clipping},
\\
u
&\longrightarrow
\text{sampled KL regularization}.
\end{aligned}
}
\]

\[
\rho=1
\iff
\pi_\theta=\pi_{\rm old}
\quad\text{on sampled action},
\]

whereas

\[
u=1
\iff
\pi_\theta=\pi_{\rm ref}
\quad\text{on sampled action}.
\]

Conflating them would replace two distinct anchors by one:

\[
\boxed{
\pi_{\rm old}
\stackrel{\text{behavior}}{\longleftrightarrow}
\pi_\theta
\stackrel{\text{regularization}}{\longleftrightarrow}
\pi_{\rm ref}.
}
\]

---

# \(\mathsf{A}_{47}\) — COMPLETE FORWARD GRAPH

\[
\boxed{
\begin{array}{ccccccc}
q
&\longrightarrow&
\pi_{\rm old}
&\longrightarrow&
o_{1:G}
&\longrightarrow&
r_{1:G}
\\
&&&&&&\downarrow
\\
&&&&&
(\bar r,s_r)
&\longrightarrow
\hat A_{1:G}
\\
&&&&&&\downarrow
\\
\pi_\theta
&\longrightarrow&
\rho=\pi_\theta/\pi_{\rm old}
&\longrightarrow&
\operatorname{clip}(\rho)
&\longrightarrow&
J_{\rm relative}
\\
\pi_{\rm ref}
&\longrightarrow&
u=\pi_{\rm ref}/\pi_\theta
&\longrightarrow&
u-\log u-1
&\longrightarrow&
J_{\rm KL}
\\
&&&&&
J_{\rm relative}
-\beta J_{\rm KL}
&\longrightarrow
J_{\rm GRPO}
\end{array}
}
\]

\[
\bar\theta,\theta_{\rm ref},
r_{1:G},
\bar r,s_r,\hat A
\quad
\xrightarrow{\operatorname{sg}}
\quad
\text{actor backward constants}.
\]

---

# \(\mathsf{A}_{48}\) — COMPLETE BACKWARD GRAPH

Relative branch:

\[
J_{\rm relative}
\rightarrow
\frac{\partial J}{\partial\rho}
\rightarrow
\frac{\partial\rho}
{\partial\ell^{\rm new}}
=
I^\epsilon\rho\hat A.
\]

KL branch:

\[
J_{\rm KL}
\rightarrow
\frac{\partial[-\beta\widehat D_{\rm KL}]}
{\partial\ell^{\rm new}}
=
\beta(u-1).
\]

Merge:

\[
\boxed{
\frac{\partial J}
{\partial\ell^{\rm new}_{i,t}}
=
I^\epsilon_{i,t}
\rho_{i,t}\hat A_{i,t}
+
\beta(u_{i,t}-1)
}
\]

\[
\rightarrow
\frac{\partial\log\pi_\theta}{\partial z}
=
e_{a}-\pi_\theta(\cdot\mid s)
\]

\[
\rightarrow
\frac{\partial z}{\partial h}
\rightarrow
\frac{\partial h}{\partial\theta}
\rightarrow
\boxed{\nabla_\theta J}.
\]

Stop gradients:

\[
\boxed{
\begin{aligned}
\frac{\partial\ell^{\rm old}}{\partial\theta}&=0,\\
\frac{\partial\pi_{\rm ref}}{\partial\theta}&=0,\\
\frac{\partial r_i}{\partial\theta}&=0,\\
\frac{\partial\bar r}{\partial\theta}&=0,\\
\frac{\partial s_r}{\partial\theta}&=0,\\
\frac{\partial\hat A}{\partial\theta}&=0
\end{aligned}
}
\]

for the sampled actor optimization problem.

---

# \(\mathsf{A}_{49}\) — COMPLETE EXECUTABLE MATHEMATICAL PSEUDO-ALGORITHM

\[
\boxed{
\begin{aligned}
&\textbf{INITIALIZE}
\\[-1mm]
&\qquad
\theta^{(0)}
\leftarrow
\theta_{\rm actor,init},
\qquad
\varphi^{(0)}
\leftarrow
\varphi_{\rm RM}
\\[2mm]
%
&\textbf{OUTER-RL-ITERATION}\quad k=0,\ldots,K-1
\\
&\qquad
\theta_{\rm ref}^{(k)}
\leftarrow
\operatorname{sg}(\theta^{(k)})
\qquad
\text{// DeepSeekMath outer refresh}
\\[2mm]
%
&\textbf{PROMPT-BATCH}
\\
&\qquad
\mathcal D_b
=
\{q_b\}_{b=1}^{B},
\qquad
q_b\sim P(Q)
\\[2mm]
%
&\textbf{OLD-POLICY}
\\
&\qquad
\bar\theta
\leftarrow
\operatorname{sg}(\theta)
\\[2mm]
%
&\textbf{GROUP-ROLLOUT}
\\
&\qquad
o_{b,i}
=
(o_{b,i,1},\ldots,o_{b,i,T_{b,i}})
\\
&\qquad
o_{b,i}
\sim
\prod_{t=1}^{T_{b,i}}
\pi_{\bar\theta}
(
o_{b,i,t}\mid q_b,o_{b,i,<t}
),
\qquad
i=1,\ldots,G
\\[2mm]
%
&\textbf{REWARD}
\\
&\qquad
r_{b,i}
\leftarrow
\begin{cases}
r_{\varphi}(q_b,o_{b,i}),
&\mathrm{DeepSeekMath},
\\
r^{\rm acc}_{b,i}+r^{\rm format}_{b,i},
&\mathrm{R1Zero},
\\
r^{\rm rule}_{b,i}+r^{\rm language}_{b,i},
&\mathrm{R1FirstRL},
\\
r^{\rm reasoning}_{b,i}
+r^{\rm general}_{b,i}
+r^{\rm language}_{b,i},
&\mathrm{R1SecondRL}
\end{cases}
\\[3mm]
%
&\textbf{GROUP-STATISTICS}
\\
&\qquad
\bar r_b
=
\frac1G
\sum_{j=1}^{G}r_{b,j}
\\
&\qquad
s_b
=
\operatorname{std}(r_{b,1:G})
\\[2mm]
%
&\textbf{ADVANTAGE}
\\
&\qquad
\hat A_{b,i,t}
=
\frac{r_{b,i}-\bar r_b}{s_b}
\quad
\text{for outcome supervision}
\\[2mm]
%
&\textbf{OLD-POLICY-LOGPROB}
\\
&\qquad
\ell^{\rm old}_{b,i,t}
=
\operatorname{sg}
[
\log\pi_{\bar\theta}
(o_{b,i,t}\mid q_b,o_{b,i,<t})
]
\\[2mm]
%
&\textbf{REFERENCE-LOGPROB}
\\
&\qquad
\ell^{\rm ref}_{b,i,t}
=
\operatorname{sg}
[
\log\pi_{\theta_{\rm ref}}
(o_{b,i,t}\mid q_b,o_{b,i,<t})
]
\\[2mm]
%
&\textbf{INNER-OPTIMIZATION}\quad
j=0,\ldots,\mu-1
\\
&\qquad
\ell^{\rm new}_{b,i,t}
=
\log\pi_{\theta_j}
(o_{b,i,t}\mid q_b,o_{b,i,<t})
\\
&\qquad
\rho_{b,i,t}
=
\exp(
\ell^{\rm new}_{b,i,t}
-
\ell^{\rm old}_{b,i,t}
)
\\
&\qquad
\widetilde\rho_{b,i,t}
=
\operatorname{clip}
(
\rho_{b,i,t},1-\epsilon,1+\epsilon
)
\\
&\qquad
u_{b,i,t}
=
\exp(
\ell^{\rm ref}_{b,i,t}
-
\ell^{\rm new}_{b,i,t}
)
\\
&\qquad
K_{b,i,t}
=
u_{b,i,t}
-
\log u_{b,i,t}
-1
\\
&\qquad
J_j
=
\frac1B
\sum_b
\frac1G
\sum_i
\frac1{T_{b,i}}
\sum_t
\left[
\min(
\rho_{b,i,t}\hat A_{b,i,t},
\widetilde\rho_{b,i,t}\hat A_{b,i,t}
)
-
\beta K_{b,i,t}
\right]
\\[2mm]
%
&\textbf{BACKWARD}
\\
&\qquad
GC_{b,i,t}
=
I^\epsilon_{b,i,t}
\rho_{b,i,t}\hat A_{b,i,t}
+
\beta(u_{b,i,t}-1)
\\
&\qquad
\nabla_{\theta_j}J_j
=
\frac1B
\sum_b
\frac1G
\sum_i
\frac1{T_{b,i}}
\sum_t
GC_{b,i,t}
\nabla_{\theta_j}
\log\pi_{\theta_j}(o_{b,i,t}\mid s_{b,i,t})
\\[2mm]
%
&\textbf{UPDATE}
\\
&\qquad
\theta_{j+1}
=
\operatorname{Optimizer}_{[\mathrm{UNDISCLOSED}]}
(
\theta_j,-\nabla_{\theta_j}J_j
)
\\[2mm]
%
&\textbf{REFERENCE/OLD-POLICY-REFRESH}
\\
&\qquad
\bar\theta
\leftarrow
\operatorname{sg}(\theta)
\quad\text{before next rollout}
\\
&\qquad
\theta_{\rm ref}
\leftarrow
\begin{cases}
\operatorname{sg}(\theta),
&\text{next DeepSeekMath outer iteration},
\\
\operatorname{sg}(\theta),
&\text{every 400 R1-Zero / R1-first steps},
\\
[\mathrm{UNDISCLOSED}],
&\text{R1 second-stage exact schedule}
\end{cases}
\\[2mm]
%
&\textbf{REWARD-MODEL-ITERATION}
\\
&\qquad
\varphi_{k+1}
\leftarrow
\operatorname{RMTrain}
(
\varphi_k,
\mathcal D_{\rm new}
\oplus
\operatorname{Replay}_{10\%}(\mathcal D_{\rm hist})
)
\quad
\text{DeepSeekMath iterative GRPO only}
\\[2mm]
%
&\textbf{NEXT-ROLLOUT}
\\
&\qquad
\theta^{(k+1)}
\leftarrow
\theta_{\rm final\ inner}
\\[2mm]
%
&\textbf{OUTPUT}
\\
&\qquad
\boxed{\pi_{\theta^{(K)}}}.
\end{aligned}
}
\]

DeepSeekMath algorithm/reward/advantage semantics: citeturn975410view3turn118065view1  
R1-Zero and R1 stage semantics: citeturn710992view2turn380873view2turn380873view3

---

# \(\mathsf{A}_{50}\) — FINAL CANONICAL GRPO STATE-TRANSITION EQUATION

\[
\boxed{
\begin{aligned}
\theta_{k+1}
=
\theta_k
+
\eta_k
\nabla_{\theta}
\;
\mathbb E_{
\substack{
q\sim P(Q),\\[-1mm]
o_i=(o_{i,1:T_i})\sim
\prod_{t=1}^{T_i}
\pi_{\bar\theta_k}
(o_{i,t}\mid q,o_{i,<t}),
\ i=1:G
}}
\Bigg[
\frac1G
\sum_{i=1}^{G}
\frac1{T_i}
\sum_{t=1}^{T_i}
\Bigg\{
\min
\Bigg[
&
\exp
\Big(
\log\pi_{\theta}(o_{i,t}\mid q,o_{i,<t})
-
\operatorname{sg}
[
\log\pi_{\bar\theta_k}(o_{i,t}\mid q,o_{i,<t})
]
\Big)
\\[-1mm]
&\cdot
\frac{
r(q,o_i)
-
\frac1G\sum_{j=1}^{G}r(q,o_j)
}{
\operatorname{std}
(
r(q,o_1),\ldots,r(q,o_G)
)
},
\\
&
\operatorname{clip}
\Bigg(
\exp
\Big(
\log\pi_{\theta}(o_{i,t}\mid q,o_{i,<t})
-
\operatorname{sg}
[
\log\pi_{\bar\theta_k}(o_{i,t}\mid q,o_{i,<t})
]
\Big),
1-\epsilon,
1+\epsilon
\Bigg)
\\[-1mm]
&\cdot
\frac{
r(q,o_i)
-
\frac1G\sum_{j=1}^{G}r(q,o_j)
}{
\operatorname{std}
(
r(q,o_1),\ldots,r(q,o_G)
)
}
\Bigg]
\\[1mm]
-
\beta
\Bigg[
&
\exp
\Big(
\operatorname{sg}
[
\log\pi_{\theta_{\rm ref,k}}
(o_{i,t}\mid q,o_{i,<t})
]
-
\log\pi_{\theta}
(o_{i,t}\mid q,o_{i,<t})
\Big)
\\
&-
\Big(
\operatorname{sg}
[
\log\pi_{\theta_{\rm ref,k}}
(o_{i,t}\mid q,o_{i,<t})
]
-
\log\pi_{\theta}
(o_{i,t}\mid q,o_{i,<t})
\Big)
-1
\Bigg]
\Bigg\}
\Bigg]
\Bigg|_{\theta=\theta_k}.
\end{aligned}
}
\]

\[
\boxed{
\begin{gathered}
\bar\theta_k
=
\operatorname{sg}(\theta_{\rm behavior}),
\qquad
\theta_{\rm ref,k}
=
\operatorname{sg}(\theta_{\rm reference}),
\\
r,\bar r,\operatorname{std}(r),\hat A
=
\operatorname{sg}(\cdot)
\quad\text{during actor backward},
\\
\operatorname{std\ convention}
=
[\mathrm{UNDISCLOSED}],
\qquad
\operatorname{Optimizer}
=
[\mathrm{UNDISCLOSED}].
\end{gathered}
}
\]

This is the token-granular DeepSeekMath specification; R1-v2's published equation compresses the policy ratios and KL to response-level notation, while its exact production ratio/length-normalization implementation remains undisclosed. citeturn380873view0turn118065view3turn975410view1

\[
\boxed{
\text{DeepSeek-reported GRPO}
+
\text{DeepSeek-code-verified behavior}
+
\text{mathematically derived consequences}
+
\text{explicit undisclosed boundaries}
}
\]