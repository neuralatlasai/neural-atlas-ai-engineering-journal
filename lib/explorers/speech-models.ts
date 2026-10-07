import { node as n, edge as e, view as v, type ModelArchitecture } from "./schema";

const folder = ["models", "voxtral"];
const realtime: ModelArchitecture = {
  id: "voxtral-realtime", title: "Voxtral Realtime", family: "Speech · streaming recognition", article: "docs/Models/Voxtral/Voxtral_realtime.md", folder,
  description: "Continuous audio becomes an 80 ms text stream through a causal encoder, temporal adapter and additive fusion.",
  scope: "Speech-to-text architecture from the paper and released implementation. B=batch; F=10 ms Mel frames; S=80 ms stream positions. No acoustic codebook, TTS decoder or encoder–decoder cross-attention is present in this model.",
  sources: [
    { label: "Voxtral Realtime · paper v3", href: "https://arxiv.org/html/2602.11298v3", note: "April 6, 2026 paper revision used by the source article." },
    { label: "Released model configuration", href: "https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602/blob/main/config.json", note: "Encoder/decoder projection widths, head counts and context windows." },
    { label: "Transformers implementation", href: "https://github.com/huggingface/transformers/blob/main/src/transformers/models/voxtral_realtime/modeling_voxtral_realtime.py", note: "Causal convolutions, projector and inputs_embeds += audio_embeds." },
    { label: "Streaming feature extractor", href: "https://github.com/huggingface/transformers/blob/main/src/transformers/models/voxtral_realtime/feature_extraction_voxtral_realtime.py", note: "16 kHz waveform, 128 Mel bins and streaming boundary state." },
  ], views: [
    v("model", "Model", "Waveform to synchronous transcript", "Audio and previous text embeddings are added before the language decoder.", [
      n("wave", "16 kHz waveform", 0, 1, "[B,Nsamples]", "[B,128,F] log-Mel", "STFT400; hop160; 128 Mel channels", "The input remains continuous; the 131072 vocabulary belongs to text.", { evidence: "code", references: [3], nextView: "audio" }),
      n("encoder", "32-layer causal audio encoder", 1, 1, "[B,128,F]", "[B,F/2,1280]", "causal conv stem → audio Transformer", "One acoustic state represents 20 ms; encoder attention has a 750-frame left window.", { nextView: "audio" }),
      n("adapter", "4× temporal adapter", 2, 1, "[B,F/2,1280]", "[B,S,3072]; S≈F/8", "concat 4 neighboring states →5120 →MLP →3072", "The adapter creates one language-side audio embedding per 80 ms.", { nextView: "fusion" }),
      n("text", "Previous text token", 2, 0, "[B,S] previous IDs", "[B,S,3072]", "eₖ₋₁ = Etext(yₖ₋₁)", "Previous output includes lexical tokens or synchronization markers."),
      n("fusion", "Add audio and text", 3, 1, "audio aₖ / text eₖ₋₁", "[B,S,3072]", "uₖ = aₖ + eₖ₋₁", "No separate cross-attention source is created.", { evidence: "code", references: [2], nextView: "fusion" }),
      n("decoder", "26-layer language decoder", 4, 1, "[B,S,3072] + delay", "[B,S,3072]", "GQA + RoPE + SwiGLU; delay-conditioned AdaRMSNorm", "32 query heads, eight KV heads and head width128; decoder window8192 stream positions.", { nextView: "streaming" }),
      n("head", "Text / synchronization logits", 5, 1, "[B,S,3072]", "[B,S,131072]", "LM head → one token per 80 ms", "The endpoint is a transcript stream; speech synthesis requires another model."),
    ], [e("wave", "encoder", "Mel frames"), e("encoder", "adapter", "20 ms states"), e("adapter", "fusion", "80 ms audio"), e("text", "fusion", "previous text"), e("fusion", "decoder", "fused state"), e("decoder", "head", "decoder hidden")]),
    v("audio", "Audio encoder", "Causal audio frontend and encoder block", "Projection width is independent of residual width: 32×64=2048, not 1280.", [
      n("mel", "Streaming log-Mel", 0, 1, "16 kHz waveform", "[B,128,F]", "400-sample Hann window; 160-sample hop", "The feature extractor preserves boundary state so chunked processing matches the causal stream.", { evidence: "code", references: [3] }),
      n("conv", "Two causal kernel-3 convs", 1, 1, "[B,128,F]", "[B,F/2,1280]", "causal convolutional stem; total stride2", "The implementation retains four input-frame convolution history across streaming chunks."),
      n("norm", "RMSNorm / QKV", 2, 1, "[B,F/2,1280]", "Q,K,V [B,32,F/2,64]", "1280 →3×2048 projection values", "Head projections are wider than the residual state. Values return through the output projection."),
      n("attention", "Causal sliding attention", 3, 1, "positioned Q,K + V", "[B,F/2,2048]", "RoPE; attend to ≤750 previous/current acoustic frames", "At 20 ms per state the window spans 15 seconds; no future audio enters this attention.", { cost: "Attention work per query is bounded by the 750-frame window, excluding projection and FFN work." }),
      n("residual", "Output + two residuals", 4, 1, "attention output + input", "[B,F/2,1280]", "u=x+Wo(Attn); y=u+SwiGLU(RMSNorm(u))", "The FFN intermediate width is5120. This block repeats32 times."),
    ], [e("mel", "conv", "causal features"), e("conv", "norm", "20 ms states"), e("norm", "attention", "Q / K / V"), e("attention", "residual", "head output"), e("conv", "residual", "residual state")]),
    v("fusion", "Adapter / fusion", "80 ms additive conditioning", "The adapter reduces time resolution; delay conditioning changes normalization rather than adding a new attention modality.", [
      n("acoustic", "Four acoustic states", 0, 1, "[B,F/2,1280]", "[B,S,5120]", "group four adjacent1280-wide states", "Four20 ms encoder states form one80 ms synchronous frame."),
      n("adapter", "Temporal MLP", 1, 1, "[B,S,5120]", "[B,S,3072]", "5120 → learned nonlinear projection →3072", "The adapter is trained with the recognition model; it is not an external ASR service."),
      n("text", "Previous-token embedding", 1, 0, "yₖ₋₁ text ID", "[B,S,3072]", "Etext[yₖ₋₁]", "Teacher forcing supplies previous targets during training; decoding supplies previous predictions."),
      n("add", "Sum in residual input", 2, 1, "aₖ and eₖ₋₁", "[B,S,3072]", "uₖ = aₖ + eₖ₋₁", "The dimensions agree before addition.", { evidence: "code", references: [2] }),
      n("delay", "Delay-conditioning vector", 2, 2, "requested latency τ", "AdaRMSNorm conditioning", "τ sampled in80 ms units during training", "The paper samples30 delays from80 to2400 ms; latency is a model conditioning variable."),
      n("decoder", "Delay-conditioned decoder", 3, 1, "fused stream + delay", "[B,S,3072]", "AdaRMSNorm → causal decoder blocks", "The delay-dependent normalization is distinct from audio/text addition."),
    ], [e("acoustic", "adapter", "grouped states"), e("adapter", "add", "aₖ"), e("text", "add", "eₖ₋₁"), e("add", "decoder", "fused stream"), e("delay", "decoder", "normalization condition", "metadata")]),
    v("streaming", "Streaming", "Persistent state and transcript synchronization", "The model advances on fixed audio time steps, including positions with no lexical output.", [
      n("chunk", "Next audio chunk", 0, 1, "waveform samples", "new Mel frames", "append causal feature state", "Chunk boundaries must retain waveform/STFT and convolution context."),
      n("audio", "Acoustic cache", 1, 0, "new acoustic positions", "≤750 states per encoder layer", "causal ring-window update", "Encoder history is bounded to15 seconds.", { kind: "kv-state" }),
      n("text", "Language cache", 1, 2, "previous fused stream", "≤8192 stream positions per decoder layer", "GQA KV append / eviction", "At80 ms per stream position,8192 positions span about655.36 s.", { evidence: "derived", kind: "kv-state" }),
      n("step", "One synchronous step", 2, 1, "80 ms audio embedding + previous ID", "[B,131072] logits", "fuse → decoder → head", "Delay selects when speech evidence can become eligible for lexical emission."),
      n("token", "Lexical / pad / boundary ID", 3, 1, "text distribution", "one stream token", "sample or choose yₖ", "Exactly one target token is assigned per80 ms frame. The transcript renderer removes synchronization markers."),
      n("transcript", "Transcript update", 4, 1, "lexical token stream", "readable text", "decode lexical subwords", "Output text can feed an external agent or TTS model, but neither is part of Voxtral Realtime."),
    ], [e("chunk", "audio", "audio features"), e("audio", "step", "acoustic state", "kv-state"), e("text", "step", "language state", "kv-state"), e("step", "token", "logits"), e("token", "transcript", "lexical output"), e("token", "text", "previous ID / cache", "kv-state")]),
    v("training", "Training", "Timestamp-aligned recognition learning", "The audio/text synchronization protocol is part of the objective's target construction.", [
      n("data", "Audio + timestamped text", 0, 1, "waveform / transcript / timestamps", "aligned80 ms target stream", "insert pad / boundary / lexical tokens", "The exact timestamp rounding algorithm remains undisclosed in the paper."),
      n("delay", "Sample training delay", 1, 2, "uniform delay choice", "τ∈{80,…,2400} ms", "condition AdaRMSNorm on τ", "Variable delay trains the same model for different latency settings."),
      n("model", "Teacher-forced forward", 2, 1, "audio + previous target IDs + τ", "text logits", "continuous audio encoder → additive fusion → decoder", "All learned macro-blocks belong to one end-to-end model.", { nextView: "model" }),
      n("loss", "Cross-entropy + z-loss", 3, 1, "logits / aligned targets", "scalar objective", "L = CE + λz (log Σᵥ exp Zᵥ)²", "z-loss regularizes logit normalization; the coefficient and marker loss weights remain undisclosed."),
      n("update", "Joint parameter update", 4, 1, "objective gradients", "encoder / adapter / decoder parameters", "AdamW training; exact full recipe not supplied", "Optimizer hyperparameters, hardware and complete data mixture cannot be inferred from the architecture alone.", { kind: "gradient" }),
    ], [e("data", "model", "audio / shifted targets"), e("delay", "model", "τ", "metadata"), e("model", "loss", "logits"), e("data", "loss", "aligned labels"), e("loss", "update", "gradients", "gradient")]),
  ],
};

const tts: ModelArchitecture = {
  id: "voxtral-tts", title: "Voxtral TTS 2603", family: "Speech · conditional synthesis", article: "docs/Models/Voxtral/Vortral.md", folder,
  description: "Reference-voice codec tokens condition an autoregressive semantic planner and a 36-dimensional acoustic flow renderer.",
  scope: "Text + reference speech →24 kHz speech. F=12.5 Hz codec frames; each frame contains one8192-way semantic ID and36 scalar FSQ values with21 levels. The TTS model does not contain an ASR→LLM conversation pipeline.",
  sources: [
    { label: "Voxtral TTS · paper v2", href: "https://arxiv.org/html/2603.25551v2", note: "Codec, semantic autoregression, acoustic flow and training decomposition." },
    { label: "Official model release", href: "https://huggingface.co/mistralai/Voxtral-4B-TTS-2603", note: "Released checkpoint and model-card evidence." },
    { label: "Released params.json", href: "https://huggingface.co/mistralai/Voxtral-4B-TTS-2603/blob/main/params.json", note: "Codebook counts, parallel pattern and embedding summation." },
    { label: "Official TTS release article", href: "https://mistral.ai/news/voxtral-tts/", note: "3.4B backbone,390M acoustic flow,300M codec." },
  ], views: [
    v("model", "Model", "Semantic planning and acoustic rendering", "Only the semantic trajectory is generated autoregressively across speech frames.", [
      n("reference", "Reference voice audio", 0, 0, "24 kHz waveform", "semantic / acoustic codec frames", "Voxtral Codec.encode(reference)", "The reference prefix supplies voice/style information; no dedicated single-vector speaker encoder is introduced.", { nextView: "codec" }),
      n("text", "Target text", 0, 2, "text string", "text token embeddings", "tokenize / embed target text", "Target text specifies what the reference voice should say."),
      n("prefix", "Serialized prefix", 1, 1, "reference frames + target text", "[B,Tprefix,3072]", "[reference] <next> [text] <repeat>", "Audio codebook embeddings are summed into one temporal position per frame.", { nextView: "planner" }),
      n("planner", "Autoregressive backbone", 2, 1, "prefix + previous audio frames", "hᵢ [B,3072]", "3.4B decoder backbone", "A hidden state conditions both semantic selection and acoustic generation.", { nextView: "planner" }),
      n("semantic", "Semantic token head", 3, 0, "hᵢ", "semantic ID sᵢ", "8192 semantic IDs + end-of-audio", "The discrete semantic planner advances at12.5 frames per second."),
      n("acoustic", "Acoustic flow transformer", 3, 2, "noise + hᵢ", "36 acoustic FSQ values", "conditional36-D flow →21-level scalar quantization", "The390M renderer generates all36 acoustic coordinates jointly, not36 depth-autoregressive tokens.", { nextView: "flow" }),
      n("decode", "Codec decoder", 4, 1, "semantic + acoustic frame", "24 kHz waveform patches", "dequantize →292-D latent →causal codec decoder", "One codec frame represents80 ms of speech.", { nextView: "codec" }),
    ], [e("reference", "prefix", "voice frames"), e("text", "prefix", "text tokens"), e("prefix", "planner", "conditioning prefix"), e("planner", "semantic", "semantic logits"), e("planner", "acoustic", "flow condition"), e("semantic", "decode", "semantic code"), e("acoustic", "decode", "acoustic scalars"), e("semantic", "planner", "previous semantic ID", "metadata"), e("acoustic", "planner", "previous acoustic IDs", "metadata")]),
    v("codec", "Codec", "A292-dimensional asymmetric bottleneck", "The semantic branch uses learned VQ; the acoustic branch uses independent scalar FSQ.", [
      n("wave", "24 kHz speech patches", 0, 1, "[B,1,Nsamples]", "[B,F100,240]", "non-overlapping240-sample patches =10 ms", "Patch projection maps to1024 channels through a causal convolution."),
      n("encoder", "Four causal codec stages", 1, 1, "100 Hz patch states", "12.5 Hz292-wide states", "100→50→25→12.5 Hz; final stride1", "Each stage includes two causal Transformer layers and a CNN. Encoder CNN strides2,2,2,1."),
      n("semantic", "256-D semantic VQ", 2, 0, "[B,F,256]", "[B,F] semantic IDs", "VQ codebook size8192", "During codec training, semantic VQ is applied with probability0.5; the other path remains continuous."),
      n("acoustic", "36-D acoustic FSQ", 2, 2, "[B,F,36]", "[B,F,36] scalar levels", "tanh →21 uniform levels per coordinate", "This is36 scalar quantizers, not36 learned8192-entry vocabularies.", { evidence: "code", references: [2] }),
      n("latent", "Dequantized frame", 3, 1, "semantic ID +36 FSQ values", "[B,F,292]", "concat(semantic vector256, acoustic vector36)", "Frame embeddings for the AR backbone are separately constructed by summing codebook lookups."),
      n("decoder", "Causal codec upsampler", 4, 1, "12.5 Hz292-D latents", "100 Hz240-sample patches", "292→1024;12.5→25→50→100 Hz;1024→240", "The codec decoder mirrors the temporal reduction; it does not generate one waveform sample per AR step."),
      n("unpatch", "Unpatch to waveform", 5, 1, "[B,F100,240]", "24 kHz audio", "concatenate non-overlapping waveform patches", "The source says unpatching; an overlap-add stage is not invented."),
    ], [e("wave", "encoder", "projected patches"), e("encoder", "semantic", "semantic partition"), e("encoder", "acoustic", "acoustic partition"), e("semantic", "latent", "dequantized semantic"), e("acoustic", "latent", "dequantized acoustic"), e("latent", "decoder", "frame latent"), e("decoder", "unpatch", "waveform patches")]),
    v("planner", "Semantic planner", "One audio frame, one AR position", "37 codec values form a single temporal embedding by summation.", [
      n("semantic", "Semantic lookup", 0, 0, "sᵢ∈{0,…,8191}", "[B,F,3072]", "Es[sᵢ]", "Semantic table size8192×3072."),
      n("acoustic", "36 acoustic lookups", 0, 2, "aᵢ,ⱼ∈{0,…,20}", "[B,F,3072] after sum", "Σⱼ₌₁³⁶ Ea,ⱼ[aᵢ,ⱼ]", "Each scalar codebook has its own21×3072 embedding table."),
      n("sum", "Sum frame embedding", 1, 1, "semantic + acoustic lookups", "[B,F,3072]", "eᵢ = Es[sᵢ] + Σⱼ Ea,ⱼ[aᵢ,ⱼ]", "The release specifies input_embedding_concat_type=sum and codebook_pattern=parallel.", { evidence: "code", references: [2] }),
      n("context", "Voice + text + past frames", 2, 1, "prefix / e<ᵢ", "causal3072-wide sequence", "attention over serialized prefix and audio history", "A reference codec sequence preserves richer voice/style evidence than a presumed single speaker vector."),
      n("backbone", "Decoder backbone", 3, 1, "causal sequence", "hᵢ∈ℝ³⁰⁷²", "causal temporal semantic planning", "The backbone contributes approximately3.4B parameters; released configuration is the authority for exact internal layer settings."),
      n("head", "Semantic distribution", 4, 1, "hᵢ", "8192-way code + end marker", "p(sᵢ | reference,text,past frames)", "Sampling determines the next semantic code; acoustic realization is handled by a separate conditioned flow.", { nextView: "flow" }),
    ], [e("semantic", "sum", "semantic vector"), e("acoustic", "sum", "acoustic sum"), e("sum", "context", "past-frame embeddings"), e("context", "backbone", "causal input"), e("backbone", "head", "hᵢ")]),
    v("flow", "Acoustic flow", "Conditional transport in36 dimensions", "Noise becomes a continuous acoustic vector before discretization.", [
      n("noise", "Gaussian acoustic noise", 0, 0, "ε∼N(0,I36)", "[B,36]", "a₀ = ε", "One acoustic vector is generated per codec frame."),
      n("condition", "Backbone condition", 0, 2, "hᵢ [B,3072]", "flow conditioning state", "condition acoustic network on hᵢ", "This is the current semantic-planning state, not an external speech-recognition output."),
      n("field", "390M acoustic transformer", 1, 1, "aₜ, t, hᵢ", "velocity [B,36]", "daₜ/dt = vφ(aₜ,t | hᵢ)", "The network predicts all acoustic coordinates together."),
      n("solver", "Integrate acoustic ODE", 2, 1, "noise / conditional velocity", "continuous acoustic vector [B,36]", "a₁ = ODESolve(vφ,a₀,0→1)", "Solver steps belong to the rendering configuration. No universal fixed count is invented.", { cost: "Acoustic rendering uses M field evaluations per frame: O(M × acoustic-network forward cost)." }),
      n("fsq", "21-level scalar quantization", 3, 1, "continuous36-D vector", "36 scalar acoustic IDs", "FSQ(a₁)∈{0,…,20}³⁶", "Quantization is after continuous transport; it is not36 sequential AR predictions."),
      n("semantic", "Selected semantic ID", 3, 0, "AR semantic-head logits", "one8192-way semantic ID", "sᵢ ∼ pθ(sᵢ | prefix,frames<ᵢ)", "The associated semantic code comes from the autoregressive head, not from the acoustic flow."),
      n("codec", "Join semantic / acoustic codes", 4, 1, "sᵢ + acoustic IDs", "codec frame → speech", "dequantize → codec decoder", "The semantic code and acoustic codes jointly determine the generated waveform.", { nextView: "codec" }),
    ], [e("noise", "field", "a₀"), e("condition", "field", "hᵢ"), e("field", "solver", "velocity"), e("solver", "field", "next aₜ / t", "metadata"), e("solver", "fsq", "a₁"), e("fsq", "codec", "acoustic codes"), e("semantic", "codec", "associated semantic ID")]),
    v("training", "Training", "Codec learning and conditional generation", "Codec optimization and TTS generation objectives are separate training stages.", [
      n("codecdata", "Speech codec batch", 0, 0, "speech waveform", "codec reconstruction / semantic state", "encoder →VQ/FSQ →decoder", "The codec learns an acoustic bottleneck before the TTS generator.", { nextView: "codec" }),
      n("teacher", "Frozen Whisper teacher", 0, 2, "speech waveform", "aligned continuous ASR features", "cross-attention alignment →cosine targets", "The teacher supervises codec semantic states during training; it is not inside TTS generation."),
      n("codecloss", "Codec objectives", 1, 1, "reconstruction / teacher / discriminator features", "scalar codec loss", "Lfeature + LASR + γₜ(LL1+LSTFT) +0.1 Lcommit", "The article reports γₜ=0.9999ᵗ; semantic and acoustic stochastic bottleneck paths differ."),
      n("pair", "Same-speaker TTS pair", 2, 1, "reference A1 / target text T2 / target A2", "serialized generation batch", "[A1] <next> [T2] <repeat> [A2]", "Only the target A2 region contributes generation loss."),
      n("semantic", "Semantic next-code loss", 3, 0, "teacher-forced target frames", "semantic CE", "Lsem = −Σᵢ log pθ(sᵢ | prefix,frames<ᵢ)", "Autoregressive prediction handles semantic temporal dependence."),
      n("flow", "Conditional acoustic regression", 3, 2, "target acoustic vectors / noise / hᵢ", "flow-matching loss", "regress conditional path velocity", "Acoustic rendering learns a continuous transport objective rather than acoustic-token CE.", { nextView: "flow" }),
      n("update", "Generation-model updates", 4, 1, "semantic + acoustic gradients", "backbone / acoustic-flow parameters", "optimize generation losses", "Codec and generation training settings must remain separated; exact undocumented coefficients are not fabricated.", { kind: "gradient" }),
    ], [e("codecdata", "codecloss", "codec outputs"), e("teacher", "codecloss", "detached targets", "gradient"), e("codecloss", "pair", "trained codec tokenizer"), e("pair", "semantic", "semantic targets"), e("pair", "flow", "acoustic targets"), e("semantic", "update", "semantic gradient", "gradient"), e("flow", "update", "flow gradient", "gradient")]),
  ],
};

export const speechArchitectures: readonly ModelArchitecture[] = [realtime, tts];
