# Voxtral TTS 2603 —  Technical 

This report is specifically about **Voxtral TTS / `mistralai/Voxtral-4B-TTS-2603`**, corresponding to arXiv `2603.25551v2`. I am using only the three source classes you specified: the uploaded research paper, Mistral's released Hugging Face model repository/model card, and Mistral's official blog/documentation. I will separate **reported facts**, **release-config-verified facts**, **derived consequences**, and **undisclosed implementation details** rather than silently filling gaps.  ([Hugging Face][1])

---

# 0. First correction: Voxtral TTS is **not** an end-to-end speech-to-speech model

This is the first architectural point to get exactly right.

`Voxtral-4B-TTS-2603` itself implements:

[
\boxed{
(\text{reference speech},\ \text{target text})
\longrightarrow
\text{generated speech}
}
]

It does **not** internally contain an ASR → conversational LLM → TTS cascade.

Mistral explicitly describes the full speech-to-speech application as a composition in which Voxtral TTS works **alongside Voxtral Transcribe**, or slots into an existing **speech-to-text + LLM stack**. Therefore a real voice-agent system is closer to:

[
x^{\text{user}}*{\text{audio}}
\overset{\text{ASR}}{\longrightarrow}
T*{\text{user}}
\overset{\text{LLM/agent}}{\longrightarrow}
T_{\text{response}}
\overset{\text{Voxtral TTS}}{\longrightarrow}
\hat{x}^{\text{assistant}}_{\text{audio}}
]

The models are pipeline-coupled; they are **not reported as one jointly trained ASR+LLM+TTS neural network**. Mistral calls out Voxtral Transcribe plus Voxtral TTS specifically for full speech-to-speech workflows. ([Mistral AI][2])

This distinction matters because almost all of the interesting engineering inside this paper occurs on the **output speech generation leg**:

[
T_{\text{response}} + A_{\text{voice reference}}
\rightarrow
\hat{A}_{\text{response}}
]

---

# 1. What problem are they actually optimizing?

The naive objective

[
\hat{x}\sim p(x\mid T,A_{\mathrm{ref}})
]

hides the difficulty.

The production objective is effectively multi-dimensional:

[
\max_\Theta
\left[
Q_{\text{intelligibility}},
Q_{\text{speaker}},
Q_{\text{prosody}},
Q_{\text{naturalness}},
Q_{\text{emotion}}
\right]
]

subject to constraints on:

[
\begin{aligned}
&\text{TTFA},\
&\text{RTF},\
&\text{GPU throughput},\
&\text{streamability},\
&\text{memory},\
&\text{autoregressive critical path}.
\end{aligned}
]

The architectural question in the paper is therefore not simply:

> How do we synthesize speech?

It is:

> **Which part of speech actually needs autoregression?**

The authors start from the codec observation that speech can be decomposed into:

[
\boxed{
\text{low-rate linguistic/semantic state}
+
\text{high-information acoustic realization}
}
]

and challenge the conventional choice of generating both parts autoregressively. Their solution is:

[
\boxed{
\text{AR semantic planning}
+
\text{conditional flow acoustic rendering}
}
]

The paper explicitly motivates this against hierarchical codec models whose dense acoustic levels remain depth-wise autoregressive. 

---

# 2. The central factorization

Let the generated speech representation at codec frame (i) be

[
y_i=(s_i,a_i)
]

with

[
s_i\in\mathcal V_s,
\qquad
a_i\in{0,\ldots,20}^{36}.
]

The useful conceptual factorization is

[
p(S,A\mid T,R)
==============

\prod_i
p_\theta
\left(
s_i\mid
S_{<i},A_{<i},T,R
\right)
;
p_\phi
\left(
a_i\mid h_i
\right),
]

where:

* (R): reference voice tokens,
* (T): text tokens,
* (S): generated semantic stream,
* (A): generated acoustic stream,
* (h_i): AR backbone state at audio frame (i).

This is not an equation printed verbatim in the paper; it is the direct probabilistic decomposition of the reported architecture.

The important asymmetry is:

[
s_i:\quad\text{categorical AR prediction}
]

while

[
a_i:\quad
\text{continuous transport}
\rightarrow
\text{FSQ discretization}.
]

---

# 3. System decomposition

The released system has three major learned components:

| Component                          | Reported scale | Role                                        |
| ---------------------------------- | -------------: | ------------------------------------------- |
| Transformer decoder backbone       |           3.4B | temporal/semantic AR generation             |
| Flow-matching acoustic transformer |           390M | 36-D acoustic generation per frame          |
| Voxtral Codec                      |           300M | waveform ↔ semantic/acoustic representation |

Total is therefore approximately

[
3.4+0.390+0.300
\approx 4.09\text{B parameters},
]

which explains the **4B** product designation. This parameter breakdown is given by Mistral's official release. ([Mistral AI][2])

The Hugging Face artifact is roughly 8 GB and released in BF16; Mistral says a GPU with at least 16 GB memory can run it through the supported vLLM-Omni path. ([Hugging Face][1])

---

# 4. Released backbone configuration — what is actually in `params.json`

The released model configuration gives much more architectural detail than the paper.

### Decoder backbone

[
d_{\text{model}}=3072
]

[
L=26
]

[
d_{\text{FFN}}=9216
]

[
n_q=32,\qquad n_{kv}=8,\qquad d_h=128
]

with:

* causal attention,
* RoPE (\theta=10^6),
* RMSNorm (\epsilon=10^{-5}),
* dropout (=0),
* tied text embeddings,
* text vocabulary size (131072),
* FlashAttention 3 configured,
* `max_seq_len = 65536`,
* `max_position_embeddings = 128000`.

Because

[
n_{kv}<n_q,
]

the release configuration represents a grouped-query attention topology, with four query heads sharing each KV-head group.

I would **not** infer more exact projection layouts than this without the implementation: the configuration is authoritative for these numbers, but the three requested sources do not expose every kernel-level tensor mapping. ([Hugging Face][3])

### Text tokenizer

The repository contains a 14.9 MB `tekken.json`, while `params.json` reports

[
|\mathcal V_{\text{text}}|=131072.
]

The Voxtral TTS paper itself does **not** specify the tokenizer training corpus, merge construction, or a TTS-specific text-vocabulary training procedure. Therefore describing this here as a newly trained “Voxtral BPE vocabulary” would be unsupported. ([Hugging Face][4])

---

# 5. Why a speech codec exists at all

Direct 24 kHz generation requires reasoning over

[
24000
]

waveform samples per generated second.

Voxtral instead maps the waveform into only

[
12.5
]

speech frames/s.

Hence one TTS semantic AR step corresponds to:

[
\frac{1}{12.5}
==============

# 0.08\text{ s}

80\text{ ms}
]

of audio.

That is the first major reduction in sequential depth:

[
24000\text{ samples/s}
\quad\rightarrow\quad
12.5\text{ semantic AR states/s}.
]

This compression is performed by **Voxtral Codec**, trained separately as a speech representation bottleneck. 

---

# 6. Raw waveform → codec frames

Input:

[
x\in\mathbb R^{B\times 1\times N}
]

at

[
f_s=24,000\text{ Hz}.
]

The waveform is patchified into non-overlapping groups of 240 samples:

[
240/24000=10\text{ ms}.
]

Hence:

[
24,\text{kHz waveform}
\rightarrow
100\text{ patches/s}.
]

Conceptually:

[
x
\rightarrow
P\in\mathbb R^{B\times F_{100}\times240}.
]

Each patch is projected to a 1024-dimensional representation through a causal convolution with kernel size 7.

Then four encoder blocks process the sequence. Each block contains:

[
2\times
\text{causal self-attention transformer layer}
+
\text{causal CNN}.
]

The first three CNN stages downsample by 2:

[
100
\rightarrow
50
\rightarrow
25
\rightarrow
12.5\text{ Hz}.
]

The fourth has stride one and maps the final representation into:

[
z_i\in\mathbb R^{292}.
]

The paper gives encoder convolution kernels:

[
4,\ 4,\ 4,\ 3
]

and strides:

[
2,\ 2,\ 2,\ 1.
]



---

# 7. A subtle but important codec design: constant physical attention horizon

The sliding attention windows are:

[
16\rightarrow8\rightarrow4\rightarrow2.
]

At first this looks like the receptive field is becoming smaller.

But account for downsampling:

[
16\times10\text{ms}=160\text{ms}
]

[
8\times20\text{ms}=160\text{ms}
]

[
4\times40\text{ms}=160\text{ms}
]

[
2\times80\text{ms}=160\text{ms}.
]

So the architecture approximately maintains a **constant 160 ms physical local-attention horizon** while reducing token rate.

That is an elegant consequence of jointly halving:

[
\text{frame rate}
\quad\text{and}\quad
\text{attention window length}.
]

This interpretation is derived directly from the reported frame rates and window sizes; the authors do not explicitly state the 160 ms interpretation. 

Other codec attention details are:

* ALiBi position bias,
* QK normalization,
* QK-norm (\epsilon=10^{-6}) in the released config,
* LayerScale,
* LayerScale initialization (0.01),
* causal architecture.

The HF release configuration independently confirms the 1024-dimensional codec model width, 4096 FFN width, eight attention heads, QK norm, causality, and sliding-window configuration. ([Hugging Face][3])

---

# 8. The 292-dimensional bottleneck is intentionally asymmetric

The latent is partitioned:

[
z_i=
[
z_i^{\mathrm{sem}};
z_i^{\mathrm{aco}}
]
]

where

[
z_i^{\mathrm{sem}}\in\mathbb R^{256},
]

[
z_i^{\mathrm{aco}}\in\mathbb R^{36}.
]

These branches are not treated equivalently.

---

# 9. Semantic codebook

The 256-dimensional semantic vector is quantized through learned VQ:

[
Q_s:\mathbb R^{256}
\rightarrow
{1,\dots,8192}.
]

Therefore every 80 ms frame gets exactly:

[
\boxed{1\text{ semantic code}}
]

from a vocabulary

[
|\mathcal V_s|=8192=2^{13}.
]

During codec training, VQ is applied only with probability:

[
P(Q_s)=0.5.
]

The other 50% of samples pass through the semantic path unquantized.

This is explicitly reported; the paper does not call it a curriculum, so I would not assign that interpretation as fact. Functionally, however, it relaxes the discrete bottleneck during codec optimization. 

---

# 10. Acoustic codebooks are not 36 VQ vocabularies

The acoustic branch has:

[
z_i^{\mathrm{aco}}\in\mathbb R^{36}.
]

Each scalar receives:

[
\tanh(\cdot)
]

and is independently mapped to one of 21 uniform FSQ levels:

[
Q_a(z_{i,j})
\in
{0,\ldots,20},
\qquad j=1,\ldots,36.
]

Thus one audio frame contains:

[
\boxed{
1\times8192\text{-way semantic code}
+
36\times21\text{-way acoustic scalars}
}
]

—not a single vocabulary of (21^{36}) vectors.

The released configuration confirms:

```text
semantic_codebook_size = 8192
acoustic_codebook_size = 21
n_acoustic_codebook    = 36
num_codebooks          = 37
codebook_pattern       = parallel
```

([Hugging Face][3])

---

# 11. Acoustic FSQ training strategy

The acoustic bottleneck uses three stochastic paths:

[
50%:\quad \text{hard FSQ}
]

[
25%:\quad
z+\epsilon,\qquad
\epsilon\sim U(\cdots),\ |\epsilon|\sim1/21
]

[
25%:\quad \text{unquantized}.
]

The paper refers to this as dither-style FSQ.

Again, the central purpose is to train a high-quality decoder while exposing it to the discrete bottleneck it must eventually operate through. The exact rationale for the 50/25/25 split is not theoretically derived in the paper. 

---

# 12. Bit allocation tells us why the two branches should not use the same generator

Semantic bitrate:

[
12.5 \log_2(8192)
=================

# 12.5\times13

162.5\text{ bps}.
]

Acoustic bitrate:

[
12.5\times36\times\log_2(21)
\approx
1976.5\text{ bps}.
]

Total:

[
\approx2139\text{ bps}
======================

2.14\text{ kbps}.
]

So approximately:

[
7.6%
]

of the codec information budget is semantic, while:

[
92.4%
]

is in the acoustic scalar stream.

That asymmetry is critical.

The semantic trajectory is **low-bandwidth but sequentially consequential**.

The acoustic representation is **high-bandwidth but structurally local and continuously parameterizable**.

Therefore applying an identical AR mechanism to both is computationally unattractive.

This bitrate calculation is derived from the codec parameters reported in the paper. 

---

# 13. “Semantic token” does not emerge automatically from reconstruction

This is one of the most important methodological components.

If we optimize only:

[
x
\rightarrow
z
\rightarrow
\hat{x}
]

for waveform reconstruction, nothing guarantees that the 256-D branch becomes linguistic.

It could encode:

* pitch,
* timbre,
* local phonetics,
* speaker identity,
* spectral texture,

or arbitrary entangled information.

Voxtral therefore imposes an auxiliary **ASR teacher objective** on the semantic bottleneck. 

---

# 14. ASR-distilled semantic representation

A frozen Whisper model receives the original speech.

Its decoder runs autoregressively and exposes:

[
h_l^{W}
]

from the final decoder layer, along with cross-attention between decoder token (l) and speech encoder frames.

Meanwhile Voxtral semantic embeddings are:

[
z_f^s.
]

The problem is that these live at different temporal granularities:

[
\text{Whisper decoder tokens}: l=1,\dots,L
]

versus:

[
\text{codec frames}: f=1,\dots,F.
]

So Mistral constructs:

[
A\in\mathbb R^{L\times F},
]

a **soft alignment**.

---

# 15. How the soft alignment is constructed

The reported pipeline is unusually specific:

1. Run frozen Whisper autoregressively.
2. Extract cross-attention heads.
3. Identify a subset of heads whose attention best correlates with word-level timestamps.
4. Use DTW for the correlation/alignment selection.
5. Normalize their cross-attention weights across decoder-token dimension.
6. Median filter those attention weights.
7. Average selected heads.
8. Linearly interpolate along the Whisper encoder-frame axis to the codec's:
   [
   12.5\text{ Hz}
   ]
   temporal grid.
9. Obtain (A_{l,f}).

Then:

[
\tilde z_l
==========

\sum_{f=1}^{F}
A_{l,f}z_f^s.
]

This gives a codec-side representation aligned to Whisper token (l).



---

# 16. Semantic distillation objective

The aligned codec vector is trained toward the frozen Whisper decoder state through cosine distance:

[
\mathcal L_{\mathrm{ASR}}
=========================

1-
\frac1L
\sum_{l=1}^L
\frac{
\tilde z_l^\top h_l^W
}{
|\tilde z_l|
|h_l^W|
}.
]

This creates a semantic bottleneck supervised by **continuous ASR decoder states**, not transcript class labels.

That distinction is useful: the teacher target can carry uncertainty and phonetic/lexical similarity information not represented by a one-hot transcript target.

Also, this codec-learning stage does not require a separate forced aligner: the alignment is recovered from Whisper cross-attention. 

### Brutal truth

Calling this “semantic understanding” should not be stretched too far.

The evidence supports:

[
\boxed{\text{ASR-aligned linguistic representation}}
]

not:

[
\boxed{\text{general semantic reasoning representation}}.
]

The paper does not establish that the code is fully disentangled from speaker identity, prosody, or phonetics either.

---

# 17. Codec decoder

The decoder mirrors the encoder.

Starting from:

[
z_i\in\mathbb R^{292},
]

a causal CNN projects back to:

[
1024.
]

Four decoder stages then perform transposed convolutional upsampling and causal transformer processing:

[
12.5
\rightarrow
25
\rightarrow
50
\rightarrow
100\text{ Hz}.
]

A final causal convolution:

[
1024\rightarrow240
]

reconstructs each waveform patch, followed by unpatching into a 24 kHz waveform.

The paper says **unpatch**, not “overlap-add.” Since the input patches are described as non-overlapping 240-sample patches, we should not invent overlap-add at this stage. 

---

# 18. Codec optimization is multi-objective

The complete reported generator objective is:

[
\boxed{
\mathcal L_{\mathrm{codec}}
===========================

\alpha\mathcal L_{\mathrm{feature}}
+
\beta\mathcal L_{\mathrm{ASR}}
+
\gamma_t\mathcal L_{L1}
+
\gamma_t\mathcal L_{\mathrm{STFT}}
+
\delta\mathcal L_{\mathrm{commit}}
}
]

with:

[
\alpha=1,
\qquad
\beta=1,
\qquad
\delta=0.1,
]

[
\gamma_t=0.9999^t.
]

So waveform reconstruction terms decay exponentially as training proceeds. 

### Waveform loss

[
\mathcal L_{L1}
===============

|x-\hat x|_1.
]

### Spectral reconstruction

[
\mathcal L_{\mathrm{STFT}}
==========================

\left|
|\operatorname{STFT}(x)|
------------------------

|\operatorname{STFT}(\hat x)|
\right|_1.
]

### VQ commitment

[
\mathcal L_{\mathrm{commit}}
============================

|z_e-\operatorname{sg}(z_q)|_2^2.
]

---

# 19. Adversarial supervision: exact STFT resolutions

The discriminator bank uses eight reported STFT sizes:

[
\boxed{
2296,\ 1418,\ 876,\ 542,\ 334,\ 206,\ 126,\ 76
}
]

—not the common power-of-two sequence (256,512,\dots).

Each discriminator distinguishes:

[
x
\quad\text{vs}\quad
\hat{x}
]

using hinge classification loss.

The TTS codec generator uses discriminator **feature matching**:

[
\mathcal L_{\mathrm{feature}}
=============================

\frac1{MN}
\sum_{m=1}^{M}
\sum_{n=1}^{N}
|
D_n^m(x)-D_n^m(\hat x)
|_1.
]

The stated reason is that evolving discriminator features provide an increasingly discriminative reconstruction signal. 

---

# 20. What happens after the codec is trained?

Now the generation problem becomes:

[
(A_1,T_2)
\rightarrow
A_2.
]

Training examples are tuples:

[
\boxed{
(A_1,T_2,A_2)
}
]

where:

* (A_1): reference voice speech,
* (T_2): transcript corresponding to target (A_2),
* (A_2): target speech.

(A_1) and (A_2) are:

* single-speaker segments,
* from the same speaker,
* not required to be temporally adjacent.

That last point is important.

The task is not simply:

[
\text{continue this waveform}.
]

It requires:

[
\text{infer speaker/style from one segment}
+
\text{speak unrelated target text}.
]

That is what creates the zero-shot voice-cloning learning signal. 

---

# 21. Training sequence serialization

The causal sequence is:

[
[A_1]
;
\langle\text{next}\rangle
;
[T_2]
;
\langle\text{repeat}\rangle
;
[A_2].
]

Only the (A_2) region contributes generation loss.

So the causal conditioning graph is:

[
\underbrace{A_1}*{\text{voice/style evidence}}
\rightarrow
\underbrace{T_2}*{\text{what to say}}
\rightarrow
\underbrace{A_2}_{\text{how that speaker says it}}.
]

The paper allows (A_1,A_2) up to 180 seconds during training; (A_1\ge1) second, while it reports best behavior for reference prompts in roughly the 3–25 s range. 

Product-facing sources describe slightly different operating ranges: the docs advertise cloning from about 2–3 s, the blog says custom adaptation from as little as 3 s, while its architecture paragraph mentions 5–25 s prompts. These are best interpreted as minimum supported/adverted lengths versus preferred operating range, not one universally fixed training constraint. ([Mistral AI Documentation][5])

---

# 22. How 37 audio codebooks become **one AR timestep**

A reference audio frame contains:

[
s_i
]

and

[
(a_{i,1},\ldots,a_{i,36}).
]

The backbone does **not** expand that into 37 sequential positions.

Each codebook has its own embedding table.

Semantic:

[
E_s\in\mathbb R^{8192\times3072}.
]

Acoustic:

[
E_{a,j}\in\mathbb R^{21\times3072},
\quad j=1,\dots,36.
]

Then the frame representation is formed by summation:

[
e_i
===

E_s[s_i]
+
\sum_{j=1}^{36}
E_{a,j}[a_{i,j}].
]

The paper states that codebook embeddings are summed; the released config independently specifies:

```text
input_embedding_concat_type = "sum"
codebook_pattern             = "parallel"
```

This is a major systems decision: 37 discrete values become **one temporal transformer position**.  ([Hugging Face][3])

---

# 23. Why speaker cloning works without a dedicated speaker encoder

The paper does not introduce a standalone ECAPA-style speaker encoder for generation.

Instead:

[
A_{\mathrm{ref}}
\rightarrow
{s_i,a_{i,1:36}}
\rightarrow
e_i
]

forms the prefix consumed directly by the transformer.

Thus voice identity, accent, local rhythm and other reference information can be extracted through attention over the **entire codec representation of the voice prompt**.

The acoustic codes provide high-information speaker/style evidence; the semantic codes provide linguistic context.

The model then conditions target generation on those prefix states.

That is materially different from:

[
A_{\mathrm{ref}}
\rightarrow
\text{single speaker vector}
\rightarrow
\text{TTS}.
]

The paper's architecture is prompt-token conditioning. 

---

# 24. Preset voices in the released repository

The HF model contains 20 voice artifacts, including:

* casual female/male,
* cheerful female,
* neutral female/male,
* Portuguese female/male,
* Dutch female/male,
* Italian female/male,
* French female/male,
* Spanish female/male,
* German female/male,
* Arabic male,
* Hindi female/male.

The release config assigns IDs (0\ldots19), and the repository includes serialized files in `voice_embedding/`. ([Hugging Face][3])

However, the permitted sources do **not** document the exact internal tensor schema of those `.pt` files. Therefore I would not describe them as a single (3072)-D speaker vector, cached codec sequence, or KV cache without inspecting code/artifacts beyond the requested source boundary.

---

# 25. Semantic AR generation

At target frame (i), the decoder produces:

[
h_i\in\mathbb R^{3072}.
]

A linear semantic head maps:

[
h_i
\rightarrow
\ell_i
]

with vocabulary:

[
8192+\langle\mathrm{EOA}\rangle.
]

Then:

[
p(s_i)
======

\operatorname{softmax}(\ell_i).
]

Training uses ordinary semantic-token cross entropy:

[
\mathcal L_{\mathrm{semantic}}
==============================

-\sum_i
\log p_\theta(s_i^\star\mid \text{prefix},y_{<i}).
]

Generation terminates when:

[
s_i=\langle\mathrm{EOA}\rangle.
]



At only 12.5 audio frames/s, the semantic AR critical path is:

[
\boxed{12.5\text{ AR decisions per generated second}}
]

rather than 450 acoustic codebook decisions/s.

---

# 26. Why not autoregress over the 36 acoustic tokens?

A depth-autoregressive design would require:

[
36\text{ sequential decisions/frame}.
]

At 12.5 frames/s:

[
36\times12.5
============

450
]

depth-AR acoustic decisions per output second.

That is in addition to the temporal semantic AR trajectory.

Voxtral instead generates the 36-dimensional acoustic state **jointly through continuous flow**.

This is the second major reduction of sequential dependency.

---

# 27. Acoustic flow transformer — release configuration

The flow-matching network is:

* bidirectional,
* 3 transformer layers,
* width (3072),
* FFN hidden width (9216),
* 32 attention heads,
* 8 KV heads,
* head dimension 128,
* RoPE (\theta=10^4).

The paper reports approximately:

[
390\text{M parameters}.
]

HF config additionally exposes:

[
\sigma=10^{-5},\qquad
\sigma_{\max}=1.
]

([Hugging Face][3])

---

# 28. What does the flow model actually receive?

At a generated audio frame:

[
h_i\in\mathbb R^{3072}
]

comes from the backbone.

The flow state is:

[
x_\tau\in\mathbb R^{36}.
]

Flow time:

[
\tau\in[0,1].
]

The FM transformer therefore operates on:

[
(h_i,\tau,x_\tau).
]

The paper uses separate projections for each because their activation distributions differ.

It explicitly reports that DiT-style AdaLN conditioning was tested and found inferior to this input-projection design. 

---

# 29. Flow matching objective

The paper writes:

[
\mathcal L_{\mathrm{acoustic}}
==============================

\mathbb E
\left[
\left|
v_\phi(x_\tau,\tau)
-------------------

u_\tau(x_\tau\mid x_1,x_0)
\right|_2^2
\right]
]

with target:

[
u_\tau=x_1-x_0.
]

The intention is to learn a velocity vector field that maps between a Gaussian endpoint and the true acoustic embedding.

### Important source-level inconsistency

Section 2.3 describes the direction as:

[
x_0=\text{Gaussian noise}
\rightarrow
x_1=\text{acoustic embedding},
]

whereas Eq. 6's accompanying notation states:

[
x_0\sim\mathcal D,
\qquad
x_1\sim\mathcal N(0,1).
]

These two descriptions reverse the endpoint labels.

That is a notation inconsistency in the paper itself.

I would not silently “repair” it.

Operationally, the inference description establishes the required behavior: initialize from Gaussian noise and integrate toward an acoustic state that is subsequently quantized. 

---

# 30. TTS pretraining objective

Generation pretraining has two terms:

[
\boxed{
\mathcal L_{\mathrm{TTS}}
=========================

\mathcal L_{\mathrm{semantic}}
+
\mathcal L_{\mathrm{acoustic}}
}
]

where:

* semantic stream: categorical CE,
* acoustic stream: flow velocity regression.

The paper does **not** publish an additional relative scalar coefficient between those two terms.

Therefore an implementation claiming, for example,

[
\lambda_{\mathrm{flow}}=0.5
]

from this paper would be inventing a value.

---

# 31. Model initialization

The AR backbone is initialized from **Ministral 3B**.

Newly introduced modules are randomly initialized:

* acoustic flow transformer,
* audio codebook embeddings,
* audio output projections.

The text embedding table is frozen during TTS training.

The paper gives a specific reason: robustness to text tokens that are rare in pseudo-transcripts produced by Voxtral Mini Transcribe. 

This is a good example of preserving the pretrained text manifold while adapting higher layers to a new audio-generation task.

---

# 32. Transcript source and data construction

Training transcripts are pseudo-labelled with:

[
\text{Voxtral Mini Transcribe}.
]

So:

[
A_2
\overset{\text{ASR}}{\longrightarrow}
T_2
]

during data preparation.

This ASR model is **not part of TTS inference**.

It is a data-generation component.

That distinction matters:

[
\boxed{\text{ASR used for dataset labeling}}
\neq
\boxed{\text{ASR embedded inside Voxtral TTS runtime}}.
]



---

# 33. Silence is explicitly controlled during training

Conversational speech has a long-tailed silence distribution.

If every codec frame receives identical weight, long silence regions can contribute a disproportionately large number of easy targets.

Voxtral uses VAD to identify no-speech frames.

Reported behavior:

[
\text{silence}
\rightarrow
\text{lower loss weight}
]

and extremely long silences:

[
w_i=0.
]

The paper states this is done to avoid overfitting to silence. 

---

# 34. Text normalization robustness

Pseudo-transcripts and user text need not share the same surface representation.

Example from the paper:

[
\texttt{"5 - 4"}
]

versus

[
\texttt{"five minus four"}.
]

They apply simple LLM-based transcript rewrites to introduce robustness to normalized and un-normalized forms.

Again, the LLM used for these rewrites is **training-data tooling**; it is not reported as a component of the Voxtral TTS inference graph. 

The current product documentation still recommends verbalizable text, spelling out ambiguous numbers and abbreviations, and avoiding rich formatting because those inputs can hurt synthesis quality. ([Mistral AI Documentation][6])

---

# 35. Classifier-free guidance training

For the acoustic model, the decoder conditioning (h_i) is dropped with probability:

[
0.1
]

during training.

That gives the model both:

[
v_\phi(x_\tau,\tau,h_i)
]

and an unconditional behavior:

[
v_\phi(x_\tau,\tau,\varnothing).
]

At inference these become the two CFG branches. 

The released `params.json` has `p_uncond: 0.0`; that should not be used to contradict the paper's training statement. It is a released inference/config artifact, not necessarily the original training hyperparameter dump. ([Hugging Face][3])

---

# 36. Exact per-frame inference path

Suppose reference speech has already been codec-encoded and target text tokenized.

Context:

[
C_0=
[
R,\langle next\rangle,T,\langle repeat\rangle
].
]

For generated frame (i):

### Step A — temporal backbone

[
h_i
===

F_\theta(C_{<i})
]

### Step B — semantic decision

[
s_i
===

\operatorname{Decode}
\left(
W_s h_i
\right).
]

If:

[
s_i=\langle EOA\rangle,
]

generation terminates.

### Step C — acoustic initialization

[
x_0\sim\mathcal N(0,I_{36}).
]

### Step D — conditional + unconditional flow

At solver stage (k):

[
v_c
===

v_\phi(x_k,t_k,h_i)
]

[
v_u
===

v_\phi(x_k,t_k,\varnothing).
]

CFG:

[
v_k
===

\alpha v_c
+
(1-\alpha)v_u.
]

With:

[
\alpha=1.2.
]

Equivalent form:

[
v_k
===

v_u
+
1.2(v_c-v_u).
]

### Step E — Euler integration

For eight solver stages:

[
\Delta t=\frac18
]

[
x_{k+1}
=======

x_k
+
\Delta t,v_k.
]

### Step F — FSQ

After integration:

[
x_8\in\mathbb R^{36}
]

is snapped to the 21 allowed scalar values:

[
a_i=Q_{\mathrm{FSQ}}(x_8).
]

### Step G — feed generated frame back into AR context

[
e_i=
E_s[s_i]
+
\sum_jE_{a,j}[a_{i,j}]
]

is appended for the next backbone step.

This last operation is extremely important: the FM submodel may operate continuously internally, but **the persistent AR state boundary remains discrete**. 

---

# 37. 8 NFEs or 16 NFEs? Both sources appear to say different things

The paper says:

[
N=8
]

Euler function-evaluation stages.

But CFG requires:

[
v_c
\quad\text{and}\quad
v_u
]

at each stage.

Therefore:

[
2\times8
========

16
]

FM transformer forward evaluations per generated audio frame.

Section 6.1 explicitly says a frame requires:

[
2N
]

forward passes with CFG.

The official blog describes the acoustic transformer as running **16 function evaluations** per audio frame. The cleanest reconciliation is therefore:

[
\boxed{
8\text{ ODE solver stages}
\times
2\text{ CFG branches}
=====================

16\text{ FM forward evaluations}
}
]

This final equality is a derived interpretation that resolves the terminology difference between the two official sources.  ([Mistral AI][2])

---

# 38. Why flow matching rather than a depth transformer

The paper tested alternatives.

### Depth Transformer

It would require:

[
36
]

sequential acoustic decoding operations per frame.

### MaskGIT-style

The paper reports a per-frame sequence length of approximately:

[
38
]

because all 36 acoustic codebook positions plus conditioning positions must participate in the masked sequence.

### Flow transformer

Per function evaluation, its conceptual sequence consists only of:

[
(h_i,t,x_t),
]

reported as sequence length 3.

Then only 8 solver stages are sequential.

The authors report that FM was superior in human evaluations, particularly for expressivity, while also offering the best compute/latency profile among those alternatives. 

---

# 39. One generated second: the actual sequential workload

Because:

[
f_{\mathrm{codec}}=12.5\text{ Hz},
]

one output second requires:

[
12.5
]

backbone AR iterations.

Within each audio frame:

[
8
]

ODE solver stages.

With CFG:

[
16
]

FM forwards.

Thus approximately:

[
12.5\times16
============

200
]

FM forward invocations occur per generated audio second per request.

That immediately explains why a 3-layer FM transformer can become the **serving bottleneck**, even though the main backbone has 26 layers.

The paper explicitly identifies the flow transformer as the generation-stage bottleneck. 

---

# 40. Why the FM model is shallow

This is an architecture-level consequence.

The 26-layer backbone handles:

[
\text{reference voice}
+
\text{text}
+
\text{long temporal output history}.
]

Its job includes long-range sequence state.

The 3-layer bidirectional FM network sees only one frame's conditioning state and evolving 36-D acoustic sample.

Conceptually:

[
\text{Backbone}
===============

\text{global temporal planner}
]

while:

[
\text{FM transformer}
=====================

\text{conditional local renderer}.
]

The paper never uses precisely those labels, but this division is the clearest mechanistic interpretation of the disclosed computation graph.

---

# 41. DPO has to optimize **two different probability mechanisms**

After pretraining, Voxtral performs preference optimization.

The semantic branch is categorical, so the paper uses standard DPO.

The acoustic branch is not a categorical policy:

[
\pi(a_i\mid h_i)
]

with explicit logits.

It is represented by a flow vector field.

Therefore Mistral adapts preference optimization to compare **flow prediction error**.



---

# 42. Acoustic Flow-DPO

For preferred (x^w) and rejected (x^l):

[
\Delta_\theta
=============

## |v_\theta(x_t^w,t)-u_t^w|_2^2

|v_\theta(x_t^l,t)-u_t^l|_2^2.
]

Preference loss:

[
\mathcal L_{\mathrm{FDPO}}
==========================

-\mathbb E
\log
\sigma
\left[
-\beta
\left(
\Delta_\theta
-------------

\Delta_{\theta_{\mathrm{ref}}}
\right)
\right].
]

For the AR sequence, each speech frame receives its own sampled flow time:

[
t_i.
]

Thus:

[
\Delta_\theta
=============

\sum_{i=1}^{N_w}
\ell_\theta^w(i,t_i)
--------------------

\sum_{i=1}^{N_l}
\ell_\theta^l(i,t_i).
]



---

# 43. Noise coupling between policy and reference is deliberate

For each position, the paper keeps the sampled:

[
t_i
]

and

[
x_0
]

identical between:

[
\theta
]

and

[
\theta_{\mathrm{ref}}.
]

That is necessary for a lower-variance comparison: otherwise preference signal would contain noise from using different flow perturbations.

They further report that normalizing by winner sequence length destabilized training, so length normalization was **not** used. 

Hyperparameters:

[
\beta_{\mathrm{semantic}}=0.1
]

[
\beta_{\mathrm{acoustic}}=0.5
]

[
\eta=8\times10^{-8}.
]

The authors explicitly say flow-DPO training is sensitive.

---

# 44. How the preference dataset is constructed

This is not conventional large-scale human RLHF.

Pipeline:

[
\text{held-out speakers}
\rightarrow
\text{text generation}
\rightarrow
\text{multiple TTS candidates}
\rightarrow
\text{automatic ranking}
\rightarrow
(w,l).
]

Specifically:

1. Start from held-out single-speaker voice samples.
2. Take the transcript of the reference voice.
3. Supply it and randomly chosen personas to **Mistral Small Creative**.
4. Generate texts that continue or respond to the conversational situation.
5. Pretrained Voxtral TTS generates multiple speech candidates.
6. Candidates are scored using:

   * WER,
   * speaker similarity,
   * loudness consistency,
   * UTMOS-v2,
   * other LM-judge metrics.
7. Winner/loser pairs are produced.



---

# 45. Preference post-training is regularized with real high-quality speech

They do not train exclusively on those synthetic preference pairs.

The DPO objective is mixed with the original pretraining objective on high-quality speech.

Training runs for only:

[
1\text{ epoch}.
]

The paper's reported failure mode is important:

[
\text{longer synthetic preference training}
\rightarrow
\text{more robotic speech}.
]

This is exactly the sort of metric-overoptimization failure one expects from synthetic reward proxies: preference objectives may increase regularity or judge scores while degrading natural micro-variation.

The final sentence is interpretation; the observed robotic degradation itself is reported. 

---

# 46. What DPO actually changes

The paper reports:

* lower hallucination rate,
* fewer skipped words,
* reduced tendency for volume to fade across long generated segments,
* better aggregate WER,
* slightly improved UTMOS.

But speaker similarity stays roughly:

[
\pm0.01
]

around the pretraining checkpoint.

So DPO is primarily correcting:

[
\text{text fidelity}
+
\text{generation pathologies}
+
\text{perceptual stability},
]

rather than being the mechanism that learns speaker identity.



There is also a non-trivial regression: Hindi WER moves from:

[
3.39%
\rightarrow
4.99%.
]

So post-training does not dominate the pretraining checkpoint on every language/metric.

---

# 47. Real-time generation is not achieved only by making the model smaller

The real-time system is a **pipeline architecture**:

[
\boxed{
\text{Stage 1: semantic AR + acoustic FM}
}
]

followed by

[
\boxed{
\text{Stage 2: codec waveform decoder}
}
]

These stages run in separate scheduling loops.

That means:

[
\text{generate tokens}_{i:i+k}
]

does not need to wait for:

[
\text{codec decode of all preceding speech}
]

to finish.

Generation and waveform synthesis overlap in time. 

---

# 48. Asynchronous chunked streaming

After each generation step:

[
(s_i,a_i)
]

is placed into a **per-request token buffer**.

When the buffer reaches a predefined threshold:

[
B_{\text{token}}
\ge C,
]

a chunk is emitted to the codec stage.

Crucially, the chunk is not only new frames.

It includes:

[
\boxed{
\text{previous overlap frames}
+
\text{new frames}
}
]

because the codec decoder has causal sliding-window attention.

The previous frames restore the temporal context required around each chunk boundary.

Therefore:

[
\text{token chunk}_k
\rightarrow
\text{waveform chunk}_k
]

can proceed asynchronously while subsequent token generation continues. 

### What is undisclosed

The paper does **not** state:

* exact chunk frame count (C),
* exact overlap frame count,
* exact shared-memory buffer capacity,
* client playback watermark,
* codec-stage microbatch policy.

Those cannot be reconstructed from the three requested sources.

---

# 49. Why the decoder can stream

The codec itself is causal.

That matters end-to-end.

A non-causal codec decoder could require future acoustic tokens:

[
y_{i+1:i+k}
]

before synthesizing waveform around frame (i).

Instead Voxtral's codec uses:

* causal convolutions,
* causal attention,
* finite sliding windows.

That architecture allows partial token prefixes to produce partial waveform prefixes.

So causal modeling is used at **three levels**:

[
\boxed{
\text{codec encoder}
}
]

[
\boxed{
\text{AR TTS backbone}
}
]

[
\boxed{
\text{codec decoder}
}
]

while the small **intra-frame** flow transformer itself is bidirectional.

This is an important separation:

[
\text{bidirectional within current acoustic vector}
\neq
\text{future waveform dependency}.
]

---

# 50. CUDA Graphs target the correct bottleneck

Recall:

[
16\text{ FM forwards/frame}
]

and

[
12.5\text{ frames/s}.
]

These are many relatively repetitive GPU launches.

The paper therefore captures the entire flow ODE solver into CUDA Graphs.

Initialization:

[
\text{bucket}
\rightarrow
\text{eager warmup}
\rightarrow
\text{CUDA graph capture}.
]

At runtime, for actual batch (B):

[
B
\rightarrow
B_{\mathrm{bucket}}\ge B.
]

Zero padding fills:

[
B_{\mathrm{bucket}}-B
]

slots.

Then:

[
\text{graph replay}
\rightarrow
\text{slice first }B\text{ outputs}.
]

If:

[
B>B_{\max,\mathrm{captured}},
]

execution falls back to eager mode. 

---

# 51. CUDA Graph result

For:

* single H200,
* concurrency (1),
* 500-character target,
* 10-second reference,

the paper reports:

| FM execution | Latency | standard RTF |
| ------------ | ------: | -----------: |
| eager        |  133 ms |        0.258 |
| CUDA Graph   |   70 ms |        0.103 |

Thus:

[
\text{latency reduction}
\approx47%
]

and:

[
0.258/0.103
\approx2.5\times
]

RTF improvement.



---

# 52. Do not confuse **70 ms model latency** with API time-to-first-audio

This is an important correction to simplified descriptions.

The H200 benchmark reports:

[
70\text{ ms latency}
]

for its controlled serving configuration.

Mistral's blog calls this approximately **70 ms model latency** for the 500-character/10-second-reference benchmark. ([Mistral AI][2])

But current Mistral product docs separately report approximately:

[
\sim90\text{ ms model processing latency}
]

and end-to-end API TTFA around:

[
\sim0.8\text{ s}
]

for PCM, versus approximately:

[
\sim3\text{ s}
]

for MP3.

So:

[
\boxed{
70\text{ ms local/model benchmark}
\neq
0.8\text{ s API TTFA}
}
]

because end-to-end streaming includes system/API/serialization/format overhead. ([Mistral AI Documentation][5])

---

# 53. PCM is the lowest-latency product path

The official speech-generation docs describe:

* `wav`: uncompressed PCM container,
* `pcm`: raw float32 little-endian samples,
* `flac`: lossless compression,
* `mp3`: compressed,
* `opus`: low bitrate and streaming-friendly.

For minimum streaming latency, the docs specifically recommend:

[
\boxed{\texttt{pcm}}
]

because it avoids an additional compressed-audio encoding stage. ([Mistral AI Documentation][6])

The HF model card additionally lists AAC among supported formats. ([Hugging Face][1])

---

# 54. Concurrency scaling

Paper/model-card benchmark:

| Concurrency | Latency |   RTF |         Throughput |
| ----------: | ------: | ----: | -----------------: |
|           1 |   70 ms | 0.103 |  119.14 char/s/GPU |
|          16 |  331 ms | 0.237 |  879.11 char/s/GPU |
|          32 |  552 ms | 0.302 | 1430.78 char/s/GPU |

The paper additionally reports:

[
\text{wait rate}=0%
]

at those tested concurrency levels.

The throughput gain from concurrency 1→32 is approximately:

[
1430.78/119.14\approx12.0\times,
]

rather than 32×, showing the usual saturation as batching improves GPU occupancy but per-request work remains.  ([Hugging Face][1])

---

# 55. RTF terminology is another source of confusion

Standard real-time factor:

[
RTF=
\frac{T_{\mathrm{compute}}}
{T_{\mathrm{audio}}}.
]

Therefore:

[
RTF<1
]

means faster than real-time.

At:

[
RTF=0.103,
]

generation speed is approximately:

[
1/0.103\approx9.71\times
]

real-time.

That is why the official blog describes the result as roughly:

[
9.7\times.
]

The current Hugging Face model card explicitly warns that the benchmark script used an inverted convention and converts its displayed table back to standard lower-is-better RTF. ([Hugging Face][1])

---

# 56. Why eight solver steps?

The paper ablates:

[
NFE\in{2,4,8,16}.
]

Results averaged over the benchmark suite:

### WER

[
30.1
\rightarrow
6.5
\rightarrow
6.7
\rightarrow
7.0.
]

### UTMOS

[
1.44
\rightarrow
2.58
\rightarrow
3.48
\rightarrow
3.48.
]

### Speaker similarity

[
0.421
\rightarrow
0.656
\rightarrow
0.732
\rightarrow
0.735.
]

The large quality improvement occurs before:

[
NFE=8.
]

Going:

[
8\rightarrow16
]

gives only (+0.003) speaker similarity, no UTMOS gain, and slightly worse WER.

Hence:

[
\boxed{8\text{ solver steps}}
]

is a quality/latency knee rather than an arbitrary constant. 

---

# 57. Why CFG (=1.2)?

They test:

[
\alpha=1.0,\dots,1.4.
]

Increasing (\alpha) generally improves:

* WER,
* speaker similarity,

while UTMOS peaks around the middle/high region.

But internal human evaluation finds a failure mode:

[
\alpha\uparrow
\Rightarrow
\text{over-adherence to reference voice}
]

and therefore weaker ability to adapt emotion from the target text.

So there is a real competing objective:

[
\boxed{
\text{speaker/reference adherence}
\leftrightarrow
\text{text-driven expressive adaptation}
}
]

The chosen:

[
\alpha=1.2
]

is not simply the automatic-metric optimum. 

---

# 58. Voice prompt functions as an instruction channel

Mistral's current documentation calls this **voice-as-an-instruction**.

Reference audio can condition:

* speaker identity,
* accent,
* intonation,
* rhythm,
* emotional rendering,
* speaking style.

No explicit:

```text
<angry>
<happy>
<slow>
```

prosody tags are required in the supported product behavior. ([Mistral AI Documentation][5])

That aligns with the architecture: reference audio is not collapsed into a speaker ID; its codec sequence becomes part of transformer context.

---

# 59. Where does text-implied emotion come from?

There is no separate emotion classifier described in the paper.

Likewise, there is no reported explicit:

[
\text{text}\rightarrow\text{emotion label}
]

module.

Instead, target text is consumed by the pretrained Ministral-derived decoder, and its hidden state:

[
h_i
]

conditions both:

[
s_i
]

and the acoustic flow:

[
v_\phi(x,t,h_i).
]

Therefore textual punctuation, lexical content, context, etc. can alter the latent trajectory that drives acoustic realization.

The official blog describes the system as able to infer contextual speaking style and emotion from text, but the sources do **not** support calling this a distinct “reasoning module.” ([Mistral AI][2])

---

# 60. Cross-lingual voice transfer

Supported languages:

[
{
\text{English},
\text{French},
\text{Spanish},
\text{German},
\text{Italian},
\text{Portuguese},
\text{Dutch},
\text{Arabic},
\text{Hindi}
}.
]

Mistral reports zero-shot cross-lingual adaptation even though the model was not explicitly trained for that behavior.

Example:

[
\text{French reference voice}
+
\text{English target text}
]

can produce:

[
\text{English speech with French-accent characteristics}.
]

This is explicitly reported as emergent rather than a specifically trained objective. ([Mistral AI][2])

---

# 61. Codec benchmark — what “better” really means

At approximately equal bitrate:

### Mimi 16 codebooks

[
2.2\text{ kbps}
]

vs.

### Voxtral Codec

[
2.1\text{ kbps},
]

Voxtral wins all reported objective codec metrics:

* Mel distance,
* STFT distance,
* PESQ,
* ESTOI,
* ASR-WER,
* speaker similarity.

That is a strong result. 

But compare against Mimi **full 32-codebook** at:

[
4.4\text{ kbps}.
]

Mimi full is better on:

* PESQ:
  [
  3.18>3.05,
  ]
* ESTOI:
  [
  0.910>0.882,
  ]
* ASR-WER:
  [
  10.25<10.66,
  ]
* speaker similarity:
  [
  0.902>0.843.
  ]

Voxtral remains better on Mel and STFT distance.

So the justified conclusion is:

[
\boxed{
\text{excellent quality at approximately half Mimi-full bitrate}
}
]

—not “the codec dominates every baseline on every metric.”

---

# 62. TTS automated evaluation is also not universally dominant

The paper evaluates:

* WER,
* UTMOS-v2,
* ECAPA-TDNN speaker similarity.

Voxtral's strongest consistent axis is **speaker similarity**.

ElevenLabs models can beat it on WER or UTMOS for individual languages.

The authors themselves warn that UTMOS is only weakly calibrated across languages and that automatic metrics do not capture naturalness/emotional expressivity reliably. 

So “state-of-the-art” must always specify an evaluation axis.

---

# 63. Zero-shot voice cloning is where Voxtral's strongest result appears

Human zero-shot voice-cloning evaluation against ElevenLabs Flash v2.5 gives:

[
\boxed{68.4%}
]

Voxtral preference after ties are excluded.

The official blog describes the evaluation using native-dialect voices and annotators considering:

* naturalness,
* accent adherence,
* acoustic similarity.

([Mistral AI][2])

The per-language paper results include:

* Arabic: (72.9%),
* Dutch: (49.4%),
* English: (60.8%),
* French: (54.4%),
* German: (72.0%),
* Hindi: (79.8%),
* Italian: (57.1%),
* Portuguese: (74.4%),
* Spanish: (87.8%).

So Dutch is effectively parity/slightly below (50%), despite the overall 68.4% micro-average. 

---

# 64. Emotion-steering results are more nuanced than the headline

In flagship voice evaluation:

### Explicit steering

Voxtral vs ElevenLabs v3:

[
51.0%.
]

Voxtral vs Gemini 2.5 Flash:

[
35.4%.
]

### Implicit text-driven steering

Voxtral vs ElevenLabs Flash:

[
58.3%.
]

vs ElevenLabs v3:

[
55.4%.
]

vs Gemini 2.5 Flash:

[
37.1%.
]

So Gemini is clearly stronger in that reported evaluation.

The “state-of-the-art” claim is therefore strongest around:

[
\text{zero-shot multilingual voice cloning}
+
\text{speaker fidelity}
+
\text{latency/quality operating point},
]

not every speech-generation benchmark. 

---

# 65. Full real-time speech-to-speech agent: the correct graph

Now connect Voxtral into the system you were describing.

## Incoming path

Raw user microphone stream:

[
x^{u}_{0:t}.
]

Then an external transcription model such as Voxtral Transcribe:

[
x^u
\rightarrow
T^u.
]

Then an external LLM/agent:

[
T^u + H_{\text{conversation}}
\rightarrow
T^a.
]

Then Voxtral TTS:

[
(T^a,A_{\mathrm{voice}})
\rightarrow
\hat{x}^a.
]

Officially:

[
\boxed{
\text{Transcribe}
\rightarrow
\text{LLM/agent}
\rightarrow
\text{Voxtral TTS}
}
]

is the full voice-system composition. ([Mistral AI][2])

The publication does **not** disclose a fused latent interface such as:

[
h_{\mathrm{ASR}}
\rightarrow
h_{\mathrm{LLM}}
\rightarrow
h_{\mathrm{TTS}}
]

without text materialization.

Therefore claiming a fully latent speech-to-speech path would be unsupported.

---

# 66. This has an important latency consequence

For a cascaded conversational agent:

[
T_{\mathrm{response}}
=====================

T_{\mathrm{ASR}}
+
T_{\mathrm{LLM}}
+
T_{\mathrm{TTS}}
+
T_{\mathrm{network}}
+
T_{\mathrm{playout}}
--------------------

T_{\mathrm{overlap}}.
]

Voxtral TTS primarily attacks:

[
T_{\mathrm{TTS}}
]

and makes its output streamable.

It does **not** remove ASR latency or LLM first-token latency.

An application can overlap those stages, but exact upstream streaming synchronization is outside this TTS paper.

---

# 67. Why this architecture reaches its operating point

The result is not attributable to one trick.

It is the composition of five decisions:

[
\boxed{
\textbf{1. aggressive but structured 12.5-Hz codec}
}
]

reducing temporal AR rate.

[
\boxed{
\textbf{2. supervised ASR distillation}
}
]

making the low-rate token useful for linguistic generation.

[
\boxed{
\textbf{3. AR only over the semantic temporal state}
}
]

preserving long-range consistency.

[
\boxed{
\textbf{4. flow matching over 36 acoustic variables}
}
]

avoiding depth-wise acoustic autoregression.

[
\boxed{
\textbf{5. serving architecture built around that decomposition}
}
]

with asynchronous codec decoding and CUDA-graph-captured flow integration.

Remove any one of these and the production tradeoff changes substantially.

---

# 68. End-to-end tensor state machine

A compact reconstruction is:

[
\boxed{
x_{\mathrm{ref}}
\in\mathbb R^{1\times24000T}
}
]

[
\downarrow\ \text{patch }240
]

[
P
\in
\mathbb R^{F_{100}\times240}
]

[
\downarrow\ \text{causal encoder}
]

[
Z
\in
\mathbb R^{F_{12.5}\times292}
]

[
\downarrow
]

[
Z_s
\in
\mathbb R^{F\times256},
\qquad
Z_a
\in
\mathbb R^{F\times36}
]

[
\downarrow\ \mathrm{VQ/FSQ}
]

[
S_{\mathrm{ref}}
\in
{0,\ldots,8191}^{F}
]

[
A_{\mathrm{ref}}
\in
{0,\ldots,20}^{F\times36}.
]

Then:

[
(S_{\mathrm{ref}},A_{\mathrm{ref}})
\overset{\mathrm{embed+sum}}{\longrightarrow}
E_{\mathrm{ref}}
\in
\mathbb R^{F\times3072}.
]

Add target text:

[
[E_{\mathrm{ref}},
T]
\rightarrow
F_\theta.
]

For target frame (i):

[
h_i\in\mathbb R^{3072}
]

[
h_i\rightarrow8193
]

semantic logits,

while:

[
(h_i,t,x_t)
\rightarrow
v_t\in\mathbb R^{36}.
]

After eight integration stages:

[
x_1
\rightarrow
Q_{\mathrm{FSQ}}
\rightarrow
A_i\in{0,\ldots,20}^{36}.
]

Then:

[
(s_i,A_i)
]

becomes the next AR frame and simultaneously enters the streaming token buffer.

Once a chunk is ready:

[
{s_i,A_i}*{i=k}^{k+C}
\rightarrow
D*{\mathrm{codec}}
\rightarrow
\hat{x}_{k:k+C}.
]

That is the actual Voxtral TTS computation graph.

---

# 69. What the paper/release still does **not** tell us

For a true reproduction effort, these remain undisclosed from the three permitted sources:

| Missing information                                | Consequence                                       |
| -------------------------------------------------- | ------------------------------------------------- |
| pretraining speech hours                           | scale cannot be reconstructed                     |
| source dataset mixture                             | data quality/domain balance unknown               |
| language sampling weights                          | multilingual curriculum unknown                   |
| speaker-count distribution                         | cloning diversity unknown                         |
| optimizer for main TTS pretraining                 | exact reproduction impossible                     |
| pretraining LR / warmup / schedule                 | optimization trajectory unknown                   |
| global batch size                                  | compute budget unknown                            |
| number of pretraining steps                        | compute budget unknown                            |
| exact semantic/acoustic loss weighting if non-unit | not reported                                      |
| codec optimizer/batch schedule                     | codec reproduction incomplete                     |
| FM optimizer details before DPO                    | incomplete                                        |
| exact streaming chunk size                         | runtime reproduction incomplete                   |
| overlap length                                     | runtime reproduction incomplete                   |
| vLLM scheduler configuration                       | benchmark replication incomplete                  |
| sampling strategy for semantic tokens              | not fully specified in paper                      |
| semantic temperature/top-p defaults                | not reported                                      |
| full voice-embedding artifact format               | not documented                                    |
| DPO metric aggregation weights                     | rejection ranking cannot be exactly reconstructed |
| architecture-specific safety classifier            | not described                                     |

The official docs add service-level moderation and explicit voice-cloning consent restrictions, but they do not expose the internal moderation architecture. ([Mistral AI Documentation][6])

---

# 70. The model in one sentence

The accurate mechanistic description is:

[
\boxed{
\text{Voxtral TTS is a causally streamable 24-kHz TTS system that compresses speech into a 12.5-Hz 1+36 semantic/acoustic representation, autoregressively predicts only the ASR-distilled semantic trajectory with a Ministral-derived 3.4B decoder, reconstructs each frame's dense acoustic state with a 390M conditional flow transformer, requantizes that state into a discrete FSQ interface for the next AR step, and asynchronously decodes overlapping token chunks with a causal 300M codec.}
}
]

That—not a monolithic ASR+LLM+TTS model—is the engineering core of Voxtral TTS. Its strongest contribution is the **alignment between representation design, generation algorithm, and serving architecture**: the codec determines what is sequential, the hybrid generator limits the sequential critical path, and the runtime exploits exactly that factorization.  ([Hugging Face][3])

[1]: https://huggingface.co/mistralai/Voxtral-4B-TTS-2603 "mistralai/Voxtral-4B-TTS-2603 · Hugging Face"
[2]: https://mistral.ai/news/voxtral-tts/ "Speaking of Voxtral | Mistral AI"
[3]: https://huggingface.co/mistralai/Voxtral-4B-TTS-2603/blob/main/params.json "params.json · mistralai/Voxtral-4B-TTS-2603 at main"
[4]: https://huggingface.co/mistralai/Voxtral-4B-TTS-2603/blob/main/tekken.json "tekken.json · mistralai/Voxtral-4B-TTS-2603 at main"
[5]: https://docs.mistral.ai/capabilities/audio/text_to_speech "Text to Speech | Mistral Docs"
[6]: https://docs.mistral.ai/studio-api/audio/text_to_speech/speech "Speech Generation | Mistral Docs"


# Voxtral_TTS

[
\boxed{
\begin{array}{ll}
\textbf{Algorithm 1:} &
\mathcal{X}^{\mathrm{usr}}*{\mathrm{audio}}
\rightarrow
\mathcal{T}^{\mathrm{usr}}
\rightarrow
\mathcal{T}^{\mathrm{rsp}}
\rightarrow
\widehat{\mathcal{X}}^{\mathrm{rsp}}*{\mathrm{audio}}
[1mm]
\textbf{Input:} &
x^{u}\in\mathbb{R}^{N_u},;
T^{\mathrm{rsp}}=(\tau_1,\ldots,\tau_M),;
R_{\mathrm{voice}}
\
\textbf{Output:} &
\hat{x}\in\mathbb{R}^{N_o},\quad f_s=24,000~\mathrm{Hz}
\end{array}}
\tag{1}
]

[
x^{u}*{0:t}
\xrightarrow{\mathcal A*{\psi}}
T^{u}*{1:m}
\xrightarrow{\mathcal L*{\omega}}
T^{\mathrm{rsp}}_{1:M}
\qquad
\text{// ASR + LLM are external to Voxtral-TTS}
\tag{2}
]

[
\boxed{
\Theta_{\mathrm{Voxtral}}
=========================

{
\Theta_{\mathrm{LM}},
\Theta_{\mathrm{FM}},
\Theta_{\mathrm{Codec}}
}
}
\tag{3}
]

[
\mathcal M_{\mathrm{paper}}
:
(R_{\mathrm{wave}},T)
\xrightarrow{\mathcal E_{\mathrm{codec}}}
(Q^{R}*{s},Q^{R}*{a})
\xrightarrow{\mathcal G_{\mathrm{AR+FM}}}
(Q^{Y}*{s},Q^{Y}*{a})
\xrightarrow{\mathcal D_{\mathrm{codec}}}
\hat x
\tag{4}
]

[
\mathcal M_{\mathrm{OSS}}
:
(E^{(v)}*{\mathrm{voice}},T)
\xrightarrow{\mathcal G*{\mathrm{AR+FM}}}
(Q^{Y}*{s},Q^{Y}*{a})
\xrightarrow{\mathcal D_{\mathrm{codec}}}
\hat x
\qquad
\text{// released checkpoint: raw-audio codec encoder weights unavailable}
\tag{5}
]

---

[
f_s=24000,\qquad
P=240,\qquad
\Delta P=\frac{240}{24000}=10~\mathrm{ms},
\qquad
f_P=100~\mathrm{Hz}
\tag{6}
]

[
N'
==

240\left\lceil\frac{N}{240}\right\rceil,
\qquad
T_0=\frac{N'}{240}
\tag{7}
]

[
x
\in
\mathbb{R}^{B\times1\times N'}
\tag{8}
]

[
X^{(0)}
=======

\operatorname{reshape}_{240}(x)
\in
\mathbb{R}^{B\times240\times T_0}
\qquad
\text{// waveform patchification}
\tag{9}
]

[
X_0
===

\operatorname{CConv1D}^{k=7,s=1}_{240\rightarrow1024}
(X^{(0)})
\in
\mathbb{R}^{B\times1024\times T_0}
\tag{10}
]

[
K_{\mathrm{eff}}
================

(k-1)d+1=7,
\qquad
P_{\mathrm{causal}}
===================

K_{\mathrm{eff}}-s=6
\tag{11}
]

---

[
D_C=1024,\qquad
D_{C,\mathrm{FFN}}=4096,\qquad
H_C=H_{KV,C}=8,\qquad
d_{h,C}=128
\tag{12}
]

[
Q=XW_Q,\qquad
K=XW_K,\qquad
V=XW_V
\tag{13}
]

[
W_Q,W_K,W_V
\in
\mathbb{R}^{1024\times1024}
\tag{14}
]

[
Q,K,V
\in
\mathbb{R}^{B\times T\times8\times128}
\tag{15}
]

[
\bar Q
======

\operatorname{RMSNorm}_{10^{-6}}(Q),
\qquad
\bar K
======

\operatorname{RMSNorm}_{10^{-6}}(K)
\tag{16}
]

[
m_h
===

2^{-h},
\qquad
h\in{0,\ldots,7}
\qquad
\text{// ALiBi slopes}
\tag{17}
]

[
B_{hij}
=======

m_h(j-i)
\tag{18}
]

[
M^{(w)}_{ij}
============

\begin{cases}
0,& i-w\le j\le i,\
-\infty,&\text{otherwise}
\end{cases}
\tag{19}
]

[
A_h
===

\operatorname{Softmax}
\left(
\frac{\bar Q_h\bar K_h^\top}{\sqrt{128}}
+
B_h+
M^{(w)}
\right)
\tag{20}
]

[
O_h=A_hV_h
\tag{21}
]

[
O
=

\operatorname{Concat}_{h=1}^{8}(O_h)W_O
\in
\mathbb{R}^{B\times T\times1024}
\tag{22}
]

---

[
U
=

\operatorname{RMSNorm}_{10^{-2}}(X)
\tag{23}
]

[
R_A
===

\operatorname{Attn}(U)
\tag{24}
]

[
H
=

X+\gamma_A\odot R_A,
\qquad
\gamma_A\in\mathbb{R}^{1024},
\qquad
\gamma_A^{(0)}=0.01\mathbf1
\tag{25}
]

[
U_F
===

\operatorname{RMSNorm}_{10^{-2}}(H)
\tag{26}
]

[
G=W_1U_F,\qquad
V_F=W_3U_F
\tag{27}
]

[
W_1,W_3
:
1024\rightarrow4096
\tag{28}
]

[
S
=

\operatorname{SiLU}(G)\odot V_F
\in
\mathbb{R}^{B\times T\times4096}
\tag{29}
]

[
R_F=W_2S,
\qquad
W_2:4096\rightarrow1024
\tag{30}
]

[
\boxed{
X'
==

H+\gamma_F\odot R_F
}
\tag{31}
]

[
\gamma_F^{(0)}
==============

0.01\mathbf1_{1024}
\tag{32}
]

---

[
(n_r)=(2,2,2,2)
\tag{33}
]

[
(w_r)=(16,8,4,2)
\tag{34}
]

[
(k_r)=(4,4,4,3)
\tag{35}
]

[
(s_r)=(2,2,2,1)
\tag{36}
]

[
X_1
===

\operatorname{CConv}^{4,2}*{1024\rightarrow1024}
\left(
\mathcal T*{16}^{(2)}(X_0)
\right)
\tag{37}
]

[
X_1
\in
\mathbb{R}^{B\times1024\times\lceil T_0/2\rceil}
\tag{38}
]

[
X_2
===

\operatorname{CConv}^{4,2}*{1024\rightarrow1024}
\left(
\mathcal T*{8}^{(2)}(X_1)
\right)
\tag{39}
]

[
X_3
===

\operatorname{CConv}^{4,2}*{1024\rightarrow1024}
\left(
\mathcal T*{4}^{(2)}(X_2)
\right)
\tag{40}
]

[
Z
=

\operatorname{CConv}^{3,1}*{1024\rightarrow292}
\left(
\mathcal T*{2}^{(2)}(X_3)
\right)
\tag{41}
]

[
\boxed{
Z\in
\mathbb{R}^{B\times292\times T_C}
}
\tag{42}
]

[
T_C
\simeq
\left\lceil\frac{T_0}{8}\right\rceil,
\qquad
f_C
===

# \frac{100}{8}

12.5~\mathrm{Hz}
\tag{43}
]

[
\boxed{
\Delta t_C
==========

80~\mathrm{ms}
}
\tag{44}
]

---

[
Z
=

[Z_s;Z_a]
\tag{45}
]

[
Z_s
\in
\mathbb{R}^{B\times256\times T_C},
\qquad
Z_a
\in
\mathbb{R}^{B\times36\times T_C}
\tag{46}
]

[
292=256+36
\tag{47}
]

---

[
C_k
===

\frac{
S_k
}{
\max(U_k,10^{-5})
},
\qquad
C
\in
\mathbb{R}^{8192\times256}
\tag{48}
]

[
\widetilde Z_s
==============

\operatorname{reshape}(Z_s)
\in
\mathbb{R}^{BT_C\times256}
\tag{49}
]

[
D_{ik}
======

|\widetilde Z_{s,i}-C_k|_2
\tag{50}
]

[
D
\in
\mathbb{R}^{BT_C\times8192}
\tag{51}
]

[
q^s_i
=====

\underset{k\in[0,8191]}{\arg\min}
D_{ik}
\tag{52}
]

[
Q_s
\in
{0,\ldots,8191}^{B\times1\times T_C}
\tag{53}
]

---

[
\widetilde Z_a
==============

\tanh Z_a
\tag{54}
]

[
U_a
===

# \frac{\widetilde Z_a+1}{2}(21-1)

10(\widetilde Z_a+1)
\tag{55}
]

[
Q_a
===

\operatorname{round}(U_a)
\in
{0,\ldots,20}^{B\times36\times T_C}
\tag{56}
]

[
\boxed{
Q
=

[Q_s;Q_a]
\in
\mathbb Z^{B\times37\times T_C}
}
\tag{57}
]

[
\hat Z_a
========

# \frac{2Q_a}{20}-1

\frac{Q_a}{10}-1
\tag{58}
]

---

[
q_{\emptyset}=0,
\qquad
q_{\mathrm{EOA}}=1
\tag{59}
]

[
q_s^{\mathrm{runtime}}
======================

q_s+2
\in
{2,\ldots,8193}
\tag{60}
]

[
q_{a,j}^{\mathrm{runtime}}
==========================

q_{a,j}+2
\in
{2,\ldots,22}
\tag{61}
]

---

[
V_0=8192+2=8194
\tag{62}
]

[
V_j=21+2=23,
\qquad j=1,\ldots,36
\tag{63}
]

[
V_A
===

# 8194+36(23)

9022
\tag{64}
]

[
V_A^{\mathrm{pad}}
==================

128
\left\lceil
\frac{9022}{128}
\right\rceil
============

9088
\tag{65}
]

[
\boxed{
W_A
\in
\mathbb{R}^{9088\times3072}
}
\tag{66}
]

[
o_0=0
\tag{67}
]

[
o_j
===

8194+23(j-1),
\qquad
j=1,\ldots,36
\tag{68}
]

[
I_{bjt}
=======

Q_{bjt}+o_j
\tag{69}
]

[
E^{CB}
======

W_A[I]
\in
\mathbb{R}^{B\times37\times T\times3072}
\tag{70}
]

[
\boxed{
E^A_{b,t,:}
===========

\sum_{j=0}^{36}
E^{CB}_{b,j,t,:}
}
\tag{71}
]

[
E^A
\in
\mathbb{R}^{B\times T\times3072}
\tag{72}
]

---

[
i_{\mathrm{audio}}=24,
\qquad
i_{\mathrm{begin-audio}}=25
\tag{73}
]

[
W_T
\in
\mathbb{R}^{131072\times3072}
\tag{74}
]

[
e_n^T
=====

W_T[i_n]
\tag{75}
]

[
M_n
===

\mathbf1[i_n=24]
\tag{76}
]

[
e_n
===

\begin{cases}
E_{\mathrm{voice},k}^{(v)},&M_n=1\
e_n^T,&M_n=0
\end{cases}
\qquad
\text{// preset voice embedding substitution during prefill}
\tag{77}
]

---

[
D_{\mathrm{LM}}=3072,
\qquad
L_{\mathrm{LM}}=26,
\qquad
D_{\mathrm{FFN}}=9216
\tag{78}
]

[
H_Q=32,
\qquad
H_{KV}=8,
\qquad
d_h=128
\tag{79}
]

[
D_Q
===

# 32(128)

4096
\tag{80}
]

[
D_K=D_V
=======

# 8(128)

1024
\tag{81}
]

---

[
P_{\mathrm{TP}}
===============

P
\tag{82}
]

[
H_Q^{(r)}
=========

\frac{32}{P}
\tag{83}
]

[
H_{KV}^{(r)}
============

\max
\left(
1,\frac8P
\right)
\tag{84}
]

[
D_Q^{(r)}
=========

128\frac{32}{P}
\tag{85}
]

[
D_{KV}^{(r)}
============

128
\max
\left(
1,\frac8P
\right)
\tag{86}
]

[
P\le8
\Rightarrow
\text{// KV heads partitioned}
\tag{87}
]

[
P>8
\Rightarrow
\text{// KV heads replicated}
\tag{88}
]

---

[
H_\ell
\in
\mathbb{BF16}^{N\times3072}
\tag{89}
]

[
\bar H_\ell
===========

\operatorname{RMSNorm}*{10^{-5}}(H*\ell)
\tag{90}
]

[
[Q_\ell,K_\ell,V_\ell]
======================

\bar H_\ell
W_{\mathrm{QKV},\ell}
\tag{91}
]

[
Q_\ell
\in
\mathbb R^{N\times H_Q\times128}
\tag{92}
]

[
K_\ell,V_\ell
\in
\mathbb R^{N\times H_{KV}\times128}
\tag{93}
]

[
\widetilde Q_\ell
=================

R_{\theta=10^6}(p)Q_\ell
\tag{94}
]

[
\widetilde K_\ell
=================

R_{\theta=10^6}(p)K_\ell
\tag{95}
]

[
(\mathcal K_\ell,\mathcal V_\ell)
\leftarrow
(\mathcal K_\ell,\mathcal V_\ell)
\oplus
(\widetilde K_\ell,V_\ell)
\qquad
\text{// persistent vLLM KV-cache state}
\tag{96}
]

[
O_\ell
======

\operatorname{CausalAttention}
\left(
\widetilde Q_\ell,
\mathcal K_\ell,
\mathcal V_\ell
\right)
\tag{97}
]

[
R_\ell
======

H_\ell+W_OO_\ell
\tag{98}
]

---

[
U_\ell
======

\operatorname{RMSNorm}*{10^{-5}}(R*\ell)
\tag{99}
]

[
[G_\ell,V_\ell^{FF}]
====================

W_{\mathrm{gate+up},\ell}U_\ell
\tag{100}
]

[
G_\ell,V_\ell^{FF}
\in
\mathbb R^{N\times9216}
\tag{101}
]

[
F_\ell
======

\operatorname{SiLU}(G_\ell)
\odot
V_\ell^{FF}
\tag{102}
]

[
Y_\ell
======

R_\ell+
W_{\mathrm{down},\ell}F_\ell
\tag{103}
]

[
H_{\ell+1}=Y_\ell,
\qquad
\ell=0,\ldots,25
\tag{104}
]

---

[
h_i
===

F_{\mathrm{LM}}
\left(
e_i,\mathcal K_{<i},\mathcal V_{<i}
\right)
\in
\mathbb{BF16}^{B\times3072}
\tag{105}
]

[
\text{// ordinary }131072\text{-way LM head bypassed}
\tag{106}
]

---

[
V_s^{\mathrm{raw}}
==================

# 8192+2

8194
\tag{107}
]

[
V_s^{\mathrm{pad}}
==================

128
\left\lceil
\frac{8194}{128}
\right\rceil
============

8320
\tag{108}
]

[
W_s
\in
\mathbb R^{8320\times3072}
\tag{109}
]

[
L_i^s
=====

W_sh_i
\in
\mathbb{FP32}^{B\times8320}
\tag{110}
]

[
L_i^s[:,0]
==========

-\infty
\tag{111}
]

[
L_i^s[:,8194:8320]
==================

-\infty
\tag{112}
]

[
\boxed{
s_i
===

\underset{k\in{1,\ldots,8193}}{\arg\max}
L_{i,k}^{s}
}
\tag{113}
]

[
s_i=1
\iff
[\mathrm{END_AUDIO}]
\tag{114}
]

[
s_i\in{2,\ldots,8193}
\iff
q_s=s_i-2\in{0,\ldots,8191}
\tag{115}
]

---

[
D_F=3072,
\qquad
L_F=3,
\qquad
D_{F,\mathrm{FFN}}=9216
\tag{116}
]

[
H_Q^F=32,
\qquad
H_{KV}^F=8,
\qquad
d_h^F=128
\tag{117}
]

[
\boxed{
M_{\mathrm{causal}}^{F}=0
}
\qquad
\text{// FM transformer is bidirectional}
\tag{118}
]

[
\boxed{
R_{\mathrm{RoPE}}^{F}=I
}
\qquad
\text{// current FM implementation has no RoPE in attention}
\tag{119}
]

---

[
\omega_j
========

\exp
\left(
-\ln(10^4)
\frac{j}{1536}
\right),
\qquad
j=0,\ldots,1535
\tag{120}
]

[
\phi(t)
=======

[
\cos(t\omega_0),\ldots,\cos(t\omega_{1535}),
\sin(t\omega_0),\ldots,\sin(t\omega_{1535})
]
\tag{121}
]

[
\phi(t)
\in
\mathbb R^{3072}
\tag{122}
]

---

[
x_t
\in
\mathbb R^{B\times36}
\tag{123}
]

[
z_x
===

W_xx_t
\in
\mathbb R^{B\times3072},
\qquad
W_x\in\mathbb R^{3072\times36}
\tag{124}
]

[
z_t
===

W_t\phi(t)
\in
\mathbb R^{B\times3072}
\tag{125}
]

[
z_h
===

W_hh_i
\in
\mathbb R^{B\times3072}
\tag{126}
]

[
\boxed{
Z_F^{(0)}
=========

[z_x;z_t;z_h]
\in
\mathbb R^{B\times3\times3072}
}
\tag{127}
]

---

[
Q_F
===

Z_FW_Q^F
\in
\mathbb R^{B\times3\times4096}
\tag{128}
]

[
K_F,V_F
\in
\mathbb R^{B\times3\times1024}
\tag{129}
]

[
Q_F
\rightarrow
\mathbb R^{B\times3\times32\times128}
\tag{130}
]

[
K_F,V_F
\rightarrow
\mathbb R^{B\times3\times8\times128}
\tag{131}
]

[
r_{GQA}
=======

# \frac{32}{8}

4
\tag{132}
]

[
\widetilde K_F
==============

\operatorname{Repeat}_{4}(K_F),
\qquad
\widetilde V_F
==============

\operatorname{Repeat}_{4}(V_F)
\tag{133}
]

[
S_F
===

\frac{
Q_F\widetilde K_F^\top
}{
\sqrt{128}
}
\in
\mathbb R^{B\times32\times3\times3}
\tag{134}
]

[
A_F
===

\operatorname{Softmax}(S_F)
\tag{135}
]

[
O_F
===

A_F\widetilde V_F
\tag{136}
]

[
O_F
\in
\mathbb R^{B\times3\times32\times128}
\tag{137}
]

[
O_F
\rightarrow
\mathbb R^{B\times3\times4096}
\xrightarrow{W_O^F}
\mathbb R^{B\times3\times3072}
\tag{138}
]

---

[
R_F^{(l)}
=========

Z_F^{(l)}
+
\operatorname{BiAttn}
\left(
\operatorname{RMSNorm}_{10^{-5}}
(Z_F^{(l)})
\right)
\tag{139}
]

[
G_F
===

W_1^F
\operatorname{RMSNorm}_{10^{-5}}
(R_F^{(l)})
\tag{140}
]

[
U_F
===

W_3^F
\operatorname{RMSNorm}_{10^{-5}}
(R_F^{(l)})
\tag{141}
]

[
G_F,U_F
\in
\mathbb R^{B\times3\times9216}
\tag{142}
]

[
F_F
===

\operatorname{SiLU}(G_F)
\odot
U_F
\tag{143}
]

[
Z_F^{(l+1)}
===========

R_F^{(l)}
+
W_2^FF_F
\tag{144}
]

[
l=0,1,2
\tag{145}
]

---

[
\bar Z_F
========

\operatorname{RMSNorm}_{10^{-5}}
(Z_F^{(3)})
\tag{146}
]

[
u_F
===

\bar Z_F[:,0,:]
\in
\mathbb R^{B\times3072}
\qquad
\text{// output taken only from acoustic-state position}
\tag{147}
]

[
W_v
\in
\mathbb R^{36\times3072}
\tag{148}
]

[
\boxed{
v_\theta(x_t,t,h)
=================

W_vu_F
\in
\mathbb R^{B\times36}
}
\tag{149}
]

---

[
N_{\mathrm{Euler}}^{\mathrm{paper}}
===================================

8
\tag{150}
]

[
N_{\mathrm{Euler}}^{\mathrm{OSS}}
=================================

7
\qquad
\text{// current parser fallback when n_decoding_steps absent}
\tag{151}
]



[
K
=

# N_{\mathrm{Euler}}^{\mathrm{OSS}}

7
\tag{152}
]

[
t_k
===

\frac{k}{K},
\qquad
k=0,\ldots,K
\tag{153}
]

[
\Delta t_k
==========

# t_{k+1}-t_k

\frac17
\tag{154}
]

---

[
x_{i,0}
\sim
\mathcal N(0,I_{36})
\tag{155}
]

[
x_{i,0}
\in
\mathbb{BF16}^{B\times36}
\tag{156}
]

[
h_i^{u}
=======

0
\in
\mathbb{BF16}^{B\times3072}
\tag{157}
]

[
X_k^{2B}
========

\begin{bmatrix}
x_{i,k}\
x_{i,k}
\end{bmatrix}
\in
\mathbb R^{2B\times36}
\tag{158}
]

[
H_i^{2B}
========

\begin{bmatrix}
h_i\
0
\end{bmatrix}
\in
\mathbb R^{2B\times3072}
\tag{159}
]

[
T_k^{2B}
========

\begin{bmatrix}
\phi(t_k)\
\phi(t_k)
\end{bmatrix}
\in
\mathbb R^{2B\times3072}
\tag{160}
]

[
V_k^{2B}
========

\mathcal F_\theta
(X_k^{2B},T_k^{2B},H_i^{2B})
\in
\mathbb R^{2B\times36}
\tag{161}
]

[
V_k^{2B}
========

\begin{bmatrix}
v_{i,k}^{c}\
v_{i,k}^{u}
\end{bmatrix}
\tag{162}
]

[
\alpha_i
========

1.2
\qquad
\text{// default; per-request override supported}
\tag{163}
]

[
v_{i,k}
=======

\alpha_i v_{i,k}^{c}
+
(1-\alpha_i)v_{i,k}^{u}
\tag{164}
]

[
\boxed{
x_{i,k+1}
=========

x_{i,k}
+
\frac17v_{i,k}
}
\tag{165}
]

[
k=0,\ldots,6
\tag{166}
]

---

[
\bar x_i
========

\operatorname{clip}(x_{i,7},-1,1)
\tag{167}
]

[
u_i
===

10(\bar x_i+1)
\tag{168}
]

[
q_i^a
=====

\operatorname{round}(u_i)
\in
{0,\ldots,20}^{B\times36}
\tag{169}
]

[
a_i
===

q_i^a+2
\in
{2,\ldots,22}^{B\times36}
\tag{170}
]

[
s_i=1
\Rightarrow
q_i^a=0
\tag{171}
]

[
\boxed{
C_i
===

[
s_i,a_{i,1},\ldots,a_{i,36}
]
\in
\mathbb Z^{B\times37}
}
\tag{172}
]

---

[
L_i^{\mathrm{outer}}
\in
\mathbb R^{B\times131072}
\tag{173}
]

[
L_{i,j}^{\mathrm{outer}}
========================

-\infty,
\qquad
\forall j
\tag{174}
]

[
s_i\neq1
\Rightarrow
L_{i,24}^{\mathrm{outer}}
=========================

1
\tag{175}
]

[
s_i=1
\Rightarrow
L_{i,\mathrm{EOS}}^{\mathrm{outer}}
===================================

1
\tag{176}
]

[
\boxed{
y_i^{\mathrm{outer}}
====================

\begin{cases}
24,&s_i\neq1\
\mathrm{EOS},&s_i=1
\end{cases}
}
\tag{177}
]

---

[
C_i
\in
\mathbb Z^{B\times1\times37}
\tag{178}
]

[
C_i
\rightarrow
C_i^\top
\in
\mathbb Z^{B\times37\times1}
\tag{179}
]

[
E_i^{CB}
========

W_A[C_i+o]
\in
\mathbb R^{B\times37\times1\times3072}
\tag{180}
]

[
\boxed{
e_i^{A}
=======

\sum_{c=0}^{36}
E_{i,c}^{CB}
\in
\mathbb R^{B\times1\times3072}
}
\tag{181}
]

[
E_{\mathrm{text}}[24]
\leftarrow
e_i^{A}
\tag{182}
]

[
\boxed{
h_i
\rightarrow
C_i
\rightarrow
e_i^{A}
\rightarrow
h_{i+1}
}
\tag{183}
]

---

[
\mathcal S_i
============

{
\mathcal K_i,
\mathcal V_i,
C_{<i},
e_i^{A},
h_i
}
\tag{184}
]

[
\boxed{
\mathcal S_{i+1}
================

\Phi
\left(
\mathcal S_i,
\mathcal F_{\mathrm{LM}},
\mathcal F_{\mathrm{FM}}
\right)
}
\tag{185}
]

[
\Phi:
\quad
h_i
\overset{W_s}{\longrightarrow}
s_i
\overset{\mathrm{FM}}{\longrightarrow}
a_i
\overset{\mathrm{embed}}{\longrightarrow}
e_i^A
\overset{\mathrm{LM}}{\longrightarrow}
h_{i+1}
\tag{186}
]

---

[
C_{\mathrm{begin}}
==================

5
\tag{187}
]

[
C_{\mathrm{steady}}
===================

25
\tag{188}
]

[
C_{\mathrm{left}}
=================

25
\tag{189}
]

[
5(80~\mathrm{ms})
=================

400~\mathrm{ms}
\tag{190}
]

[
25(80~\mathrm{ms})
==================

2~\mathrm{s}
\tag{191}
]

[
\mathcal B_q^{(L)}
==================

[C_1,\ldots,C_L]
\tag{192}
]

[
c(L)
====

\begin{cases}
5,&L\le25\
25,&L>25
\end{cases}
\tag{193}
]

[
L\bmod c(L)\neq0
\land
\neg\mathrm{finished}
\Rightarrow
\varnothing
\tag{194}
]

[
r=L\bmod c(L)
\tag{195}
]

[
C_{\mathrm{new}}
================

\begin{cases}
r,&r\neq0\
c(L),&r=0
\end{cases}
\tag{196}
]

[
E
=

\min
\left(
L,
25+C_{\mathrm{new}}
\right)
\tag{197}
]

[
C_{\mathrm{ctx}}
================

E-C_{\mathrm{new}}
\tag{198}
]

[
W_L
===

[C_{L-E+1},\ldots,C_L]
\in
\mathbb Z^{E\times37}
\tag{199}
]

[
p_L
===

[
C_{\mathrm{ctx}},
C_{\mathrm{new}},
\operatorname{vec}(W_L)
]
\tag{200}
]

[
p_L
\in
\mathbb Z^{2+37E}
\tag{201}
]

---

[
p_L
\rightarrow
Q^{R}
\in
\mathbb Z^{E\times37}
\tag{202}
]

[
j^\star
=======

\min
{
j:
Q^{R}_{j,0}=1
}
\tag{203}
]

[
Q^{R}
\leftarrow
Q^{R}_{0:j^\star,:}
\qquad
\text{// remove EOA frame and suffix}
\tag{204}
]

[
\boxed{
Q^{C}
=====

Q^{R}-2
}
\tag{205}
]

---

[
F_{\mathrm{decoder,max}}
========================

375
\tag{206}
]

[
\frac{375}{12.5}
================

30~\mathrm{s}
\tag{207}
]

[
Q_B
\in
\mathbb Z^{B_c\times F_{\max}\times37}
\tag{208}
]

[
Q_B^{\top}
\in
\mathbb Z^{B_c\times37\times F_{\max}}
\tag{209}
]

---

[
Q_s
===

Q_B[:,0:1,:]
\tag{210}
]

[
Q_a
===

Q_B[:,1:37,:]
\tag{211}
]

[
Z_s
===

C[Q_s]
\in
\mathbb R^{B_c\times256\times F}
\tag{212}
]

[
Z_a
===

\frac{Q_a}{10}-1
\in
\mathbb R^{B_c\times36\times F}
\tag{213}
]

[
\boxed{
Z_D
===

[Z_s;Z_a]
\in
\mathbb{BF16}^{B_c\times292\times F}
}
\tag{214}
]

---

[
X_D^{(0)}
=========

\operatorname{CConv}^{3,1}_{292\rightarrow1024}
(Z_D)
\tag{215}
]

[
X_D^{(1)}
=========

\operatorname{CConvT}^{4,2}*{1024\rightarrow1024}
\left(
\mathcal T*{2}^{(2)}
(X_D^{(0)})
\right)
\tag{216}
]

[
X_D^{(1)}
\in
\mathbb R^{B_c\times1024\times2F}
\tag{217}
]

[
X_D^{(2)}
=========

\operatorname{CConvT}^{4,2}
\left(
\mathcal T_{4}^{(2)}
(X_D^{(1)})
\right)
\tag{218}
]

[
X_D^{(2)}
\in
\mathbb R^{B_c\times1024\times4F}
\tag{219}
]

[
X_D^{(3)}
=========

\operatorname{CConvT}^{4,2}
\left(
\mathcal T_{8}^{(2)}
(X_D^{(2)})
\right)
\tag{220}
]

[
X_D^{(3)}
\in
\mathbb R^{B_c\times1024\times8F}
\tag{221}
]

[
X_D^{(4)}
=========

\mathcal T_{16}^{(2)}
(X_D^{(3)})
\tag{222}
]

[
P_D
===

\operatorname{CConv}^{7,1}_{1024\rightarrow240}
(X_D^{(4)})
\tag{223}
]

[
P_D
\in
\mathbb R^{B_c\times240\times8F}
\tag{224}
]

[
\boxed{
\hat x_D
========

\operatorname{reshape}(P_D)
\in
\mathbb R^{B_c\times1\times1920F}
}
\tag{225}
]

[
1920
====

24000/12.5
\tag{226}
]

---

[
P_T=k-s
\tag{227}
]

[
\rho_{\mathrm{trim}}=1
\tag{228}
]

[
P_R
===

\lceil
(k-s)\rho_{\mathrm{trim}}
\rceil
======

k-s
\tag{229}
]

[
P_L=0
\tag{230}
]

[
\boxed{
\operatorname{CConvT}(X)
========================

\operatorname{ConvT}(X)
[
:,;:,;0:N_{\mathrm{raw}}-(k-s)
]
}
\tag{231}
]

---

[
N_{\mathrm{ctx}}
================

1920C_{\mathrm{ctx}}
\tag{232}
]

[
\boxed{
\hat x_{\mathrm{emit}}
======================

\hat x_D
[
1920C_{\mathrm{ctx}}:
]
}
\tag{233}
]

[
\text{// left context is re-decoded, then its waveform samples are discarded}
\tag{234}
]

---

[
\mathcal B_{\mathrm{CG}}
========================

{1,2,4,8,16,32}
\tag{235}
]

[
b^\star
=======

\min
{
b\in\mathcal B_{\mathrm{CG}}
:
b\ge B
}
\tag{236}
]

[
H^{\star}
\in
\mathbb{BF16}^{b^\star\times3072}
\tag{237}
]

[
\Xi^{\star}
\in
\mathbb{BF16}^{b^\star\times36}
\tag{238}
]

[
\Alpha^\star
\in
\mathbb{BF16}^{b^\star\times1}
\tag{239}
]

[
H^\star_{0:B}
\leftarrow
H_B
\tag{240}
]

[
H^\star_{B:b^\star}
\leftarrow
0
\tag{241}
]

[
\Alpha^\star
\leftarrow
1.2
\tag{242}
]

[
\Alpha^\star_{0:B}
\leftarrow
\alpha_{1:B}
\tag{243}
]

[
\Xi^\star
\sim
\mathcal N(0,I)
\qquad
\text{// fresh noise before each CUDA-Graph replay}
\tag{244}
]

[
Y^\star
=======

\operatorname{Replay}
\left(
\mathcal G_{b^\star};
H^\star,\Xi^\star,\Alpha^\star
\right)
\tag{245}
]

[
Y_B
===

Y^\star_{0:B}
\tag{246}
]

[
B>32
\Rightarrow
Y_B
===

\mathcal G_{\mathrm{eager}}(H_B)
\tag{247}
]

---

[
\boxed{
\begin{aligned}
x_{\mathrm{user}}
&\xrightarrow{\mathcal A_{\psi}}
T_{\mathrm{user}}
\
T_{\mathrm{user}}
&\xrightarrow{\mathcal L_{\omega}}
T_{\mathrm{response}}
\
(T_{\mathrm{response}},E_{\mathrm{voice}})
&\xrightarrow{\mathcal E_{\mathrm{text/voice}}}
H_0
\
H_i
&\xrightarrow{3072\rightarrow8320}
L_i^s
\
L_i^s
&\xrightarrow{\arg\max}
s_i
\
(h_i,\xi_i)
&\xrightarrow{
\substack{
7\times\mathrm{Euler}\
\mathrm{CFG},;2B
}}
x_i^{36}
\
x_i^{36}
&\xrightarrow{
\mathrm{clip}
\rightarrow
\mathrm{scale}
\rightarrow
\mathrm{round}
}
q_i^{36}
\
(s_i,q_i^{36}+2)
&\rightarrow
C_i\in\mathbb Z^{37}
\
C_i
&\xrightarrow{
W_A\in\mathbb R^{9088\times3072}
}
e_i^A
\
e_i^A
&\xrightarrow{
F_{\mathrm{LM}}+
KV_i
}
h_{i+1}
\
{C_i}*{i=1}^{L}
&\xrightarrow{
\substack{
5~\mathrm{frames~initial}\
25~\mathrm{frames~steady}\
25~\mathrm{frames~left\ context}
}}
Q*{\mathrm{chunk}}
\
Q_{\mathrm{chunk}}
&\xrightarrow{
Q-2
}
Q_{\mathrm{codec}}
\
Q_{\mathrm{codec}}
&\xrightarrow{
\mathcal D_{\mathrm{codec}}
}
\hat x_{\mathrm{ctx+new}}
\
\hat x_{\mathrm{ctx+new}}
&\xrightarrow{
-1920C_{\mathrm{ctx}}
}
\hat x_{\mathrm{new}}
\
\hat x_{\mathrm{new}}^{(1)}
\oplus
\hat x_{\mathrm{new}}^{(2)}
\oplus\cdots
&=
\boxed{
\hat x_{\mathrm{stream}}
\in
\mathbb R^{24,000T}
}.
\end{aligned}
}
\tag{248}
]

[
\boxed{
\underbrace{
24,000~\mathrm{samples/s}
}*{\text{// waveform}}
\rightarrow
\underbrace{
100~\mathrm{patches/s}
}*{\text{// 240 samples}}
\rightarrow
\underbrace{
12.5~\mathrm{frames/s}
}*{\text{// 80 ms}}
\rightarrow
\underbrace{
1+36~\mathrm{codes/frame}
}*{\text{// semantic + acoustic}}
\rightarrow
\underbrace{
3072~\mathrm{D~AR~state}
}*{\text{// temporal planner}}
\rightarrow
\underbrace{
36~\mathrm{D~flow~state}
}*{\text{// acoustic renderer}}
\rightarrow
\underbrace{
37~\mathrm{discrete~codes/frame}
}*{\text{// AR feedback boundary}}
\rightarrow
\underbrace{
1920~\mathrm{samples/frame}
}*{\text{// causal codec decode}}
\rightarrow
24,000~\mathrm{Hz}
}
\tag{249}
]
