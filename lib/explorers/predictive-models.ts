import { node as n, edge as e, view as v, type ModelArchitecture } from "./schema";

export const predictiveArchitectures: readonly ModelArchitecture[] = [{
  id: "jepa-anything", title: "JEPA-Anything", family: "World modeling · predictive factors",
  article: "docs/Models/JEPA/JEPA_Anything/JEPA-Anything.md", folder: ["models", "jepa", "jepa-anything"],
  description: "Context/EMA-target encoders learn complementary predictive coordinates, then synthesize a coherent latent state.",
  scope: "Domain-agnostic predictive interface, not one universal encoder checkpoint. B=batch; d=latent width; K=factors; r=factor width with Kr=d. Domain adapters, descriptors and encoder topology depend on the experiment. The article's proposed robotic extensions are separated from the paper's established OPF mechanism.",
  sources: [
    { label: "JEPA-Anything paper", href: "https://arxiv.org/html/2609.20800v1", note: "OPF, EMA targets, orthogonality, activity regularization and deployment modes." },
    { label: "Author repository", href: "https://github.com/Gen-Verse/JEPA-Anything", note: "Shared predictive interface and task implementations." },
    { label: "Public OPF core", href: "https://github.com/Gen-Verse/JEPA-Anything/tree/main/jepa-anything-core", note: "Structural implementation; the public core example does not itself reproduce every reported experiment." },
  ], views: [
    v("model", "Model", "Context to complete predictive latent", "Factor targets define learned coordinates; synthesis maps predicted coordinates back to the latent space.", [
      n("adapter", "Domain adapter", 0, 1, "observation x from domainδ", "content tokens H / descriptors S", "(H,S) = Aδ(x)", "Vision, biology, control and physical systems retain their own observation geometry."),
      n("context", "Online context encoder", 1, 0, "context tokens / descriptors", "zc [B,d]", "zc = fθ(HC,SC)", "The trainable encoder sees available context, not the hidden requested target."),
      n("target", "EMA target encoder", 1, 2, "target observation / descriptor", "zt [B,d]", "zt = sg(fθ̄(H,S)target)", "Teacher outputs are detached; teacher parameters follow an EMA of the online encoder.", { nextView: "training" }),
      n("predict", "K factor predictors", 2, 0, "zc + target descriptor st", "ûk [B,r] for k=1…K", "ûk = qk(zc,st)", "Predictors can be independent branches or a shared trunk with factor-specific heads.", { nextView: "factors" }),
      n("analyze", "Analyze target factors", 2, 2, "detached zt / learned Pk", "uk [B,r]", "uk = Pkᵀ sg(zt)", "Pk remains trainable even though the teacher representation is detached.", { nextView: "factors" }),
      n("synthesis", "Pseudoinverse synthesis", 3, 1, "concat predicted factors û [B,d]", "predicted latent ẑ [B,d]", "ẑ = (Pᵀ)† û; P=[P1,…,PK]", "Concatenated factor coordinates are not themselves the latent world state.", { nextView: "synthesis" }),
      n("loss", "Training factor comparison", 3, 2, "predicted ûk and target uk", "factor-prediction loss", "compare ûk with Pkᵀ sg(zt)", "Targets supervise predictor learning through a loss; they are not forward inputs to the predictor.", { nextView: "training", kind: "gradient" }),
      n("readout", "Readout / world transition", 4, 1, "online zc or synthesized ẑ", "task result / next latent state", "task-specific readout or repeated latent transition", "Representation readout and operational rollout are different deployment modes.", { nextView: "deployment" }),
    ], [e("adapter", "context", "context view"), e("adapter", "target", "target view"), e("context", "predict", "zc"), e("target", "analyze", "sg(zt)"), e("analyze", "loss", "target coordinates"), e("predict", "loss", "predicted coordinates"), e("predict", "synthesis", "predicted factors"), e("synthesis", "readout", "complete latent"), e("context", "readout", "representation mode")]),
    v("factors", "OPF factors", "Learn a complete predictive coordinate system", "Orthogonality allocates complementary subspaces while activity regularization discourages unused factors.", [
      n("target", "Detached target state", 0, 1, "EMA encoder output", "zt [B,d]", "z̃t = sg(zt)", "Gradients do not flow through this teacher output to the EMA encoder."),
      n("projectors", "K learned basis blocks", 1, 2, "Pk parameters [d,r] each", "P [d,d], Kr=d", "P = [P1,…,PK]", "Factor width and count are configurable; factor identities are not predefined semantic labels."),
      n("targets", "Target coordinates", 2, 2, "z̃t and Pk", "uk [B,r]", "uk = Pkᵀ z̃t", "Gradient can update Pk through this projection even while z̃t is detached."),
      n("predictors", "Dedicated factor pathways", 2, 0, "zc,st", "ûk [B,r]", "ûk = qk(zc,st)", "Every prediction is compared with the corresponding learned coordinate block."),
      n("prediction", "Direction / magnitude learning", 3, 1, "ûk,uk", "prediction loss", "regress predicted factor to target factor", "The article discusses preserving both direction and magnitude rather than training only a normalized direction."),
      n("orthogonal", "Within / cross-factor geometry", 4, 0, "projector blocks", "orthogonality penalty", "PkᵀPk≈Ir; PkᵀPj≈0 for k≠j", "Orthogonal completeness requires the whole square analysis system to stay well-conditioned.", { evidence: "derived" }),
      n("activity", "Factor / encoder activity", 4, 2, "target coordinates / online states", "activity penalties", "maintain projected-target and encoder variance", "A nonzero mean is not proof of active variation; activity is measured across examples."),
    ], [e("target", "targets", "z̃t"), e("projectors", "targets", "Pk"), e("targets", "prediction", "uk"), e("predictors", "prediction", "ûk"), e("projectors", "orthogonal", "Gram geometry"), e("targets", "activity", "factor variation")]),
    v("synthesis", "Synthesis", "Coordinates are mapped back to world state", "The inverse map is structural; simply summing or concatenating arbitrary factor predictions is insufficient.", [
      n("factors", "Predicted coordinate blocks", 0, 1, "û1,…,ûK each[B,r]", "û [B,d]", "û = concat(û1,…,ûK)", "The concatenation follows the same factor order as P's columns."),
      n("analysis", "Complete analysis operator", 1, 2, "P1,…,PK", "A=Pᵀ [d,d]", "A maps latent state →factor coordinates", "A must preserve full latent information for complete synthesis."),
      n("inverse", "Moore–Penrose inverse", 2, 2, "A [d,d]", "A† [d,d]", "A† = pseudoinverse(A)", "A pseudoinverse is needed during imperfect orthogonality; using P is exact only in the orthogonal limit.", { cost: "A dense general pseudoinverse can cost O(d³); caching/reuse and structured parameterization change operational cost." }),
      n("state", "Synthesized latent", 3, 1, "û [B,d] + A†", "ẑ [B,d]", "ẑ = A† û", "This yields a coherent latent representation in the original encoder coordinate system.", { cost: "Dense synthesis multiplication O(Bd²)." }),
      n("limit", "Orthogonal limit", 4, 1, "PᵀP=I", "exact information-preserving synthesis", "A†=P; z = Σk Pk Pkᵀ z", "Approximate orthogonality introduces conditioning-dependent error; it does not prove exact preservation.", { evidence: "derived" }),
    ], [e("analysis", "inverse", "A"), e("factors", "state", "û"), e("inverse", "state", "A†"), e("state", "limit", "conditioning interpretation")]),
    v("training", "Training", "Online gradients and EMA teacher update", "Stop-gradient protects the teacher output while the analysis basis and predictors remain trainable.", [
      n("views", "Construct context / target views", 0, 1, "domain observation", "context,target,descriptors", "sample predictive relation Vδ(Aδ(x))", "The relation may be masked space, future time or an intervention, depending on the domain."),
      n("online", "Online encoding / prediction", 1, 0, "context, target descriptor", "zc and predicted factors", "zc=fθ(C); ûk=qk(zc,st)", "Gradients can update both encoder and predictor parameters."),
      n("teacher", "EMA target / factor analysis", 1, 2, "target observation / projectors", "uk=Pkᵀ sg(fθ̄(T))", "detach teacher state, retain Pk gradients", "Moving stop-gradient after the projector would incorrectly freeze the factor basis."),
      n("objective", "Complete OPF objective", 2, 1, "prediction / geometry / activity terms", "scalar L", "L=Lbase+Lpred+λorth Lorth+λfac Lfac+λenc Lenc", "Each domain may retain its base objective. Coefficients are experiment settings, not universal constants."),
      n("update", "Train online parameters", 3, 0, "∇L", "θ,Pk,qk updated", "OptimizerStep(θ,P,q)", "Teacher parameters are not part of this gradient optimizer group.", { kind: "gradient" }),
      n("ema", "Update teacher by EMA", 4, 1, "updated θ / previous θ̄", "new teacher θ̄", "θ̄ ← m θ̄ +(1−m)θ; 0≤m<1", "EMA occurs after the online parameter update."),
    ], [e("views", "online", "context"), e("views", "teacher", "target"), e("online", "objective", "predictions / variance"), e("teacher", "objective", "targets / factor activity"), e("objective", "update", "online gradients", "gradient"), e("update", "ema", "updated θ"), e("ema", "teacher", "next teacher", "metadata")]),
    v("deployment", "Deployment", "Representation readout or operational rollout", "The paper's shared interface admits several uses without imposing one universal robotic agent.", [
      n("observation", "New observation", 0, 1, "domain-specific input", "online latent zc", "adapter →trained online encoder", "Raw observations still pass through the domain adapter."),
      n("readout", "Representation mode", 1, 0, "zc", "classification / regression / analysis", "task head(zc)", "Ordinary readouts need not retain explicit OPF coordinates at runtime."),
      n("transition", "Operational world-model mode", 1, 2, "zc + query / intervention descriptor", "predicted factors", "qk(zc,st)", "Operational transitions retain the predictive factor pathways."),
      n("synthesis", "Synthesize next state", 2, 2, "predicted coordinate blocks", "ẑnext", "ẑnext=(Pᵀ)† concatk(qk(zc,st))", "The synthesized latent can feed a decoder, planner or next transition.", { nextView: "synthesis" }),
      n("rollout", "Repeated transition", 3, 2, "ẑnext / next query", "latent trajectory", "repeat transition on synthesized state", "Long-horizon error and conditioning must be evaluated; one-step accuracy does not prove stable rollout."),
      n("proposal", "Embodied extension in article", 4, 1, "observations + actions + goals", "proposed planning / self-learning system", "action-conditioned OPF + planner + feedback", "The article's extended robotic architecture is a proposal, not an additional released JEPA-Anything checkpoint.", { evidence: "proposal" }),
    ], [e("observation", "readout", "online state"), e("observation", "transition", "online state"), e("transition", "synthesis", "factor coordinates"), e("synthesis", "rollout", "next latent"), e("rollout", "transition", "future state", "metadata"), e("synthesis", "proposal", "possible integration")]),
  ],
}];
