/* Shared controls adapted from the authored Transformer explorer; its original remains intact. */
(function(){
  'use strict';
  const root=document.getElementById('model-atlas');
  const el={tabs:document.getElementById('atlas-tabs'),board:document.getElementById('atlas-stage'),viewTitle:document.getElementById('atlas-view-title'),description:document.getElementById('atlas-view-description'),breadcrumb:document.getElementById('atlas-breadcrumb'),mode:document.getElementById('atlas-mode'),modeLabel:document.getElementById('atlas-mode-label'),previous:document.getElementById('atlas-previous'),play:document.getElementById('atlas-play'),next:document.getElementById('atlas-next'),count:document.getElementById('atlas-stage-count'),showAll:document.getElementById('atlas-show-all'),stepDetail:document.getElementById('atlas-step-detail'),inspector:document.getElementById('atlas-inspector'),export:document.getElementById('atlas-export'),scope:document.getElementById('atlas-scope'),viewScope:document.getElementById('atlas-view-scope'),announcement:document.getElementById('atlas-announcement')};
  const engine=window.ModelAtlas;
  if(!engine||typeof engine.render!=='function'){
    el.stepDetail.textContent='The static model overview is available. The interactive diagram engine has not been embedded.';
    [el.previous,el.play,el.next,el.export,el.mode].forEach(x=>x.disabled=true);
    return;
  }
  const views=Array.isArray(engine.views)?engine.views:[];
  const state={view:'model',mode:'inference',graph:null,stage:-1,selection:null,playing:false,timer:null,width:0};
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt=value=>Array.isArray(value)?value.join(' × '):String(value==null?'':value);
  const label=view=>view?String(view.label||view.title||view.id).replace(/^\d{2}\s+/,''):'';
  const byView=id=>views.find(v=>v.id===id);
  const byNode=id=>state.graph&&state.graph.nodes.find(n=>n.id===id);
  const byEdge=id=>state.graph&&state.graph.edges.find(e=>e.id===id);
  const portName=port=>typeof port==='object'&&port!==null?(port.name||port.id||fmt(port)):fmt(port);
  const endpointTitle=endpoint=>{const n=byNode(endpoint.node);return n?n.title:endpoint.node;};
  const endpointLabel=endpoint=>endpointTitle(endpoint)+' · '+portName(endpoint.port);
  const modeForView=view=>view==='training'?'training':view==='inference'?'inference':state.mode;

  function announce(text){el.announcement.textContent=text;}
  function stopPlay(){if(state.timer)clearTimeout(state.timer);state.timer=null;state.playing=false;updateControls();}
  function updateHash(){try{history.replaceState(null,'','#'+encodeURIComponent(state.view));}catch(_){}}
  function buildTabs(){
    el.tabs.innerHTML=views.map((view,i)=>'<button type="button" class="atlas-tab" data-view="'+esc(view.id)+'" aria-controls="atlas-stage"'+(view.id===state.view?' aria-current="page"':'')+'><span class="atlas-tab-number">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(label(view))+'</span></button>').join('');
  }
  function updateHeading(){
    const g=state.graph,v=byView(state.view)||{};
    el.viewTitle.textContent=g.title||v.title||label(v);
    el.description.textContent=g.subtitle||v.description||'';
    const parentId=g.parent||v.parent;
    const parent=byView(typeof parentId==='object'&&parentId?parentId.id:parentId);
    el.breadcrumb.innerHTML=(parent?'<button type="button" class="atlas-link-button" data-view="'+esc(parent.id)+'">← '+esc(label(parent))+'</button><span aria-hidden="true">/</span>':'<span>Architecture</span><span aria-hidden="true">/</span>')+'<span>'+esc(label(v))+'</span>';
    el.modeLabel.hidden=!['model','attention'].includes(state.view);
    el.mode.value=modeForView(state.view);
    el.viewScope.textContent=state.view==='inference'?'Inference / generation':state.view==='training'?'Training / parameter update':state.view==='attention'?'Attention / '+modeForView(state.view):'Layer '+String(views.findIndex(vw=>vw.id===state.view)+1).padStart(2,'0')+' of '+String(views.length).padStart(2,'0');
    if(g.scope)el.scope.textContent=fmt(g.scope);
    buildTabs();
  }
  function decorateSvg(){
    const svg=el.board.querySelector('svg');
    if(!svg)return;
    svg.setAttribute('role','group');
    svg.setAttribute('aria-label',(state.graph.title||'Model architecture')+'. Select a component or connection to inspect it.');
    svg.querySelectorAll('[data-node-id]').forEach(item=>{
      const node=byNode(item.getAttribute('data-node-id'));
      item.setAttribute('tabindex','0');item.setAttribute('role','button');
      if(node)item.setAttribute('aria-label',node.title+'. Inspect inputs, outputs, and connections.');
    });
    svg.querySelectorAll('[data-edge-id]').forEach(item=>{
      const edge=byEdge(item.getAttribute('data-edge-id'));
      item.setAttribute('tabindex','0');item.setAttribute('role','button');
      if(edge)item.setAttribute('aria-label',endpointLabel(edge.from)+' to '+endpointLabel(edge.to)+'. '+(edge.label||'')+'. Inspect connection.');
    });
    svg.querySelectorAll('[data-open-view]').forEach(item=>{
      item.setAttribute('tabindex','0');item.setAttribute('role','button');
      item.setAttribute('aria-label','Open '+label(byView(item.getAttribute('data-open-view')))+' detail.');
    });
  }
  function renderBoard(force){
    const width=Math.max(280,Math.floor(el.board.clientWidth||680));
    if(!force&&width===state.width)return;
    let next;
    try{next=engine.render(state.view,modeForView(state.view),width);}catch(error){
      el.stepDetail.textContent='This layer could not be rendered: '+error.message;
      stopPlay();return;
    }
    if(!next||typeof next.svg!=='string')return;
    next.nodes=Array.isArray(next.nodes)?next.nodes:[];next.edges=Array.isArray(next.edges)?next.edges:[];next.steps=Array.isArray(next.steps)?next.steps:[];
    state.graph=next;state.width=width;
    if(state.stage>=next.steps.length)state.stage=next.steps.length-1;
    if(state.selection&&!(state.selection.type==='node'?byNode(state.selection.id):byEdge(state.selection.id)))state.selection=null;
    el.board.innerHTML=next.svg;
    updateHeading();decorateSvg();updateControls();updateHighlight();renderInspector();
  }
  function openView(id){
    if(!byView(id))return;
    stopPlay();state.view=id;state.stage=-1;state.selection=null;
    if(id==='training'||id==='inference')state.mode=id;
    renderBoard(true);updateHash();
    el.tabs.scrollIntoView({block:'start',behavior:'auto'});
    const activeTab=el.tabs.querySelector('[aria-current="page"]');if(activeTab)activeTab.focus({preventScroll:true});
    announce((state.graph&&state.graph.title||label(byView(id)))+' opened.');
  }
  function updateControls(){
    const steps=state.graph?state.graph.steps:[],n=steps.length;
    el.previous.disabled=!n||state.stage<=0;
    el.next.disabled=!n||state.stage>=n-1;
    el.play.disabled=!n;
    el.play.textContent=state.playing?'Ⅱ Pause':state.stage===n-1&&n?'↻ Replay':'▷ Play';
    el.play.setAttribute('aria-pressed',String(state.playing));
    el.play.setAttribute('aria-label',state.playing?'Pause computation stages':'Play computation stages');
    el.count.textContent=state.stage<0?'All '+n+' stages':'Stage '+(state.stage+1)+' of '+n;
    if(state.stage>=0&&steps[state.stage]){
      const step=steps[state.stage];el.stepDetail.innerHTML='<strong>'+esc(step.title)+'</strong>'+(step.detail?' · '+esc(step.detail):'');
    }else if(state.selection){
      const item=state.selection.type==='node'?byNode(state.selection.id):byEdge(state.selection.id);
      el.stepDetail.innerHTML='<span>'+esc((state.selection.type==='node'?'Component: ':'Connection: ')+(item?(item.title||item.label||item.id):''))+'</span><button type="button" class="atlas-link-button atlas-details-link" data-action="view-details">View selected details ↓</button>';
    }else el.stepDetail.textContent='All connections are visible. Select a module or line, or use Next to follow the computation in order.';
  }
  function updateHighlight(){
    if(!state.graph)return;
    const nodeIds=new Set(),edgeIds=new Set();
    let active=false;
    if(state.selection){
      active=true;
      if(state.selection.type==='node'){
        nodeIds.add(state.selection.id);
        state.graph.edges.forEach(edge=>{if(edge.from.node===state.selection.id||edge.to.node===state.selection.id){edgeIds.add(edge.id);nodeIds.add(edge.from.node);nodeIds.add(edge.to.node);}});
      }else{
        const edge=byEdge(state.selection.id);if(edge){edgeIds.add(edge.id);nodeIds.add(edge.from.node);nodeIds.add(edge.to.node);}
      }
    }else if(state.stage>=0&&state.graph.steps[state.stage]){
      active=true;const step=state.graph.steps[state.stage];(step.nodes||[]).forEach(id=>nodeIds.add(id));(step.edges||[]).forEach(id=>edgeIds.add(id));
      state.graph.edges.forEach(edge=>{if(edgeIds.has(edge.id)){nodeIds.add(edge.from.node);nodeIds.add(edge.to.node);}});
    }
    el.board.querySelectorAll('[data-node-id]').forEach(item=>{
      const id=item.getAttribute('data-node-id'),on=nodeIds.has(id);
      item.classList.toggle('atlas-active',active&&on);item.classList.toggle('atlas-inactive',active&&!on);item.classList.toggle('atlas-selected',!!state.selection&&state.selection.type==='node'&&state.selection.id===id);
      item.setAttribute('aria-pressed',String(!!state.selection&&state.selection.type==='node'&&state.selection.id===id));
    });
    el.board.querySelectorAll('[data-edge-id]').forEach(item=>{
      const id=item.getAttribute('data-edge-id'),on=edgeIds.has(id);
      item.classList.toggle('atlas-active',active&&on);item.classList.toggle('atlas-inactive',active&&!on);item.classList.toggle('atlas-selected',!!state.selection&&state.selection.type==='edge'&&state.selection.id===id);
      item.setAttribute('aria-pressed',String(!!state.selection&&state.selection.type==='edge'&&state.selection.id===id));
    });
  }
  function tensorTable(items,empty){
    if(!Array.isArray(items)||!items.length)return '<p class="atlas-inline-empty">'+esc(empty)+'</p>';
    return '<table class="atlas-tensors"><tbody>'+items.map(item=>'<tr><th scope="row">'+esc(item.name||'Tensor')+'</th><td><span class="atlas-tensor-shape">'+esc(fmt(item.shape))+'</span>'+(item.detail?'<span class="atlas-tensor-detail">'+esc(item.detail)+'</span>':'')+'</td></tr>').join('')+'</tbody></table>';
  }
  function connectionList(edges,incoming){
    if(!edges.length)return '<p class="atlas-inline-empty">'+(incoming?'Entry to this layer.':'Exit from this layer.')+'</p>';
    return '<ul class="atlas-connections">'+edges.map(edge=>{
      const neighbor=incoming?edge.from:edge.to;
      return '<li class="atlas-connection"><button type="button" class="atlas-link-button atlas-neighbor" data-node="'+esc(neighbor.node)+'">'+(incoming?'← ':'→ ')+esc(endpointTitle(neighbor))+'</button><span class="atlas-ports">'+esc(endpointLabel(edge.from))+' → '+esc(endpointLabel(edge.to))+'</span><button type="button" class="atlas-link-button atlas-edge-link" data-edge="'+esc(edge.id)+'">'+esc(edge.label||'Inspect connection')+'</button></li>';
    }).join('')+'</ul>';
  }
  function inspectorHeading(overline,title,action){
    const returnAction=state.selection?'<button type="button" class="atlas-link-button atlas-return-selection" data-action="return-selection">Return to selected '+(state.selection.type==='edge'?'connection':'component')+' ↑</button>':'';
    return '<div class="atlas-inspector-heading"><div><div class="atlas-overline">'+esc(overline)+'</div><h2 class="atlas-inspector-title" id="atlas-inspector-title" tabindex="-1">'+esc(title)+'</h2></div>'+((returnAction||action)?'<div class="atlas-inspector-actions">'+returnAction+(action||'')+'</div>':'')+'</div>';
  }
  function renderInspector(){
    if(!state.graph)return;
    if(state.selection&&state.selection.type==='node'){
      const n=byNode(state.selection.id);if(!n)return;
      const incoming=state.graph.edges.filter(e=>e.to.node===n.id),outgoing=state.graph.edges.filter(e=>e.from.node===n.id);
      const expand=n.nextView&&byView(n.nextView)?'<button type="button" class="atlas-control" data-view="'+esc(n.nextView)+'">Open '+esc(label(byView(n.nextView)))+' ↗</button>':'';
      const evidenceNames={code:'Code / configuration verified',reported:'Source reported',derived:'Mathematically derived',undisclosed:'Undisclosed / unresolved',proposal:'Article proposal'};
      const references=(n.references||[]).map(index=>{const source=(state.graph.sources||[])[index];return source?'<li><a href="'+esc(source.href)+'" target="_blank" rel="noopener noreferrer">['+(index+1)+'] '+esc(source.label)+'</a></li>':'';}).join('');
      const evidence=n.evidence?'<div class="atlas-evidence"><h3 class="atlas-section-title">Evidence</h3><p>'+esc(evidenceNames[n.evidence]||n.evidence)+'</p><ul>'+references+'</ul></div>':'';
      const cost=n.cost?'<div class="atlas-cost"><h3 class="atlas-section-title">Computation / memory</h3><p>'+esc(n.cost)+'</p></div>':'';
      el.inspector.innerHTML=inspectorHeading('COMPONENT / '+state.view,n.title,expand)+(n.description?'<p class="atlas-inspector-description">'+esc(n.description)+'</p>':'')+(n.operation?'<code class="atlas-equation">'+esc(fmt(n.operation))+'</code>':'')+evidence+cost+'<div class="atlas-inspector-columns"><div><h3 class="atlas-section-title">Inputs</h3>'+tensorTable(n.inputs,'No input tensor is specified for this entry.')+'<h3 class="atlas-section-title">Incoming connections</h3>'+connectionList(incoming,true)+'</div><div><h3 class="atlas-section-title">Outputs</h3>'+tensorTable(n.outputs,'No output tensor is specified for this endpoint.')+'<h3 class="atlas-section-title">Outgoing connections</h3>'+connectionList(outgoing,false)+'</div></div>';
    }else if(state.selection&&state.selection.type==='edge'){
      const e=byEdge(state.selection.id);if(!e)return;
      el.inspector.innerHTML=inspectorHeading('CONNECTION / '+(e.kind||'forward'),e.label||'Tensor connection')+(e.detail?'<p class="atlas-inspector-description">'+esc(e.detail)+'</p>':'')+'<code class="atlas-equation">'+esc(endpointLabel(e.from))+'\n    → '+esc(endpointLabel(e.to))+'</code><div class="atlas-inspector-columns"><div class="atlas-endpoint"><h3 class="atlas-section-title">Origin</h3><button type="button" class="atlas-link-button atlas-neighbor" data-node="'+esc(e.from.node)+'">'+esc(endpointTitle(e.from))+'</button><span class="atlas-endpoint-port">Output port: '+esc(portName(e.from.port))+'</span></div><div class="atlas-endpoint"><h3 class="atlas-section-title">Destination</h3><button type="button" class="atlas-link-button atlas-neighbor" data-node="'+esc(e.to.node)+'">'+esc(endpointTitle(e.to))+'</button><span class="atlas-endpoint-port">Input port: '+esc(portName(e.to.port))+'</span></div></div>';
    }else if(state.stage>=0&&state.graph.steps[state.stage]){
      const step=state.graph.steps[state.stage];
      el.inspector.innerHTML=inspectorHeading('COMPUTATION / STAGE '+(state.stage+1)+' OF '+state.graph.steps.length,step.title)+(step.detail?'<p class="atlas-inspector-description">'+esc(step.detail)+'</p>':'')+'<div class="atlas-step-nodes">'+(step.nodes||[]).map(id=>{const node=byNode(id);return node?'<button type="button" class="atlas-control" data-node="'+esc(id)+'">Inspect '+esc(node.title)+'</button>':'';}).join('')+'</div>';
    }else{
      el.inspector.innerHTML=inspectorHeading('INSPECT / TENSORS & CONNECTIONS','Inspect the computation')+'<p class="atlas-inspector-empty">Select a module for its equation, tensor shapes, and connected operations. Select a connection to inspect its source and destination ports.</p>';
    }
  }
  function select(type,id){
    if(!(type==='node'?byNode(id):byEdge(id)))return;
    const focusWasInInspector=el.inspector.contains(document.activeElement);
    stopPlay();state.stage=-1;state.selection={type,id};updateControls();updateHighlight();renderInspector();
    if(focusWasInInspector){const title=document.getElementById('atlas-inspector-title');if(title)title.focus({preventScroll:true});}
    const selected=type==='node'?byNode(id):byEdge(id);announce((selected.title||selected.label||'Connection')+' selected. Details are below the diagram.');
  }
  function showAll(){stopPlay();state.stage=-1;state.selection=null;updateControls();updateHighlight();renderInspector();}
  function setStage(index){
    if(!state.graph||!state.graph.steps.length)return;
    state.stage=Math.max(0,Math.min(index,state.graph.steps.length-1));state.selection=null;updateControls();updateHighlight();renderInspector();
  }
  function advancePlay(){
    if(!state.playing)return;
    if(state.stage>=state.graph.steps.length-1){stopPlay();return;}
    setStage(state.stage+1);state.timer=setTimeout(advancePlay,2600);
  }
  function togglePlay(){
    if(state.playing){stopPlay();return;}
    if(!state.graph||!state.graph.steps.length)return;
    state.playing=true;state.selection=null;
    if(state.stage<0||state.stage>=state.graph.steps.length-1)setStage(0);else updateControls();
    state.timer=setTimeout(advancePlay,2600);
  }
  function downloadSvg(){
    if(!state.graph)return;
    const blob=new Blob([state.graph.svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='model-architecture-'+state.view+'-'+modeForView(state.view)+'.svg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    announce('SVG exported for '+(state.graph.title||state.view)+'.');
  }
  function viewDetails(){
    if(!state.selection)return;
    el.inspector.scrollIntoView({block:'start',behavior:'auto'});
    const title=document.getElementById('atlas-inspector-title');if(title)title.focus({preventScroll:true});
  }
  function returnToSelection(){
    if(!state.selection)return;
    const attribute=state.selection.type==='node'?'data-node-id':'data-edge-id';
    const selected=Array.from(el.board.querySelectorAll('['+attribute+']')).find(item=>item.getAttribute(attribute)===state.selection.id);
    if(!selected)return;
    selected.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});
    if(typeof selected.focus==='function')selected.focus({preventScroll:true});
    else el.board.focus({preventScroll:true});
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button[data-view],button[data-node],button[data-edge],button[data-action]');
    if(!target||!root.contains(target))return;
    if(target.dataset.action==='view-details')viewDetails();
    else if(target.dataset.action==='return-selection')returnToSelection();
    else if(target.dataset.view)openView(target.dataset.view);
    else if(target.dataset.node)select('node',target.dataset.node);
    else if(target.dataset.edge)select('edge',target.dataset.edge);
  });
  el.board.addEventListener('click',event=>{
    const expansion=event.target.closest('[data-open-view]');
    if(expansion){openView(expansion.getAttribute('data-open-view'));return;}
    const node=event.target.closest('[data-node-id]'),edge=event.target.closest('[data-edge-id]');
    if(node)select('node',node.getAttribute('data-node-id'));else if(edge)select('edge',edge.getAttribute('data-edge-id'));
  });
  el.board.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      const expansion=event.target.closest('[data-open-view]');
      if(expansion){event.preventDefault();openView(expansion.getAttribute('data-open-view'));return;}
      const node=event.target.closest('[data-node-id]'),edge=event.target.closest('[data-edge-id]');
      if(node||edge){event.preventDefault();select(node?'node':'edge',(node||edge).getAttribute(node?'data-node-id':'data-edge-id'));}
    }else if(event.key==='ArrowRight'){event.preventDefault();stopPlay();setStage(state.stage+1);}
    else if(event.key==='ArrowLeft'){event.preventDefault();stopPlay();if(state.stage>0)setStage(state.stage-1);}
    else if(event.key==='Escape'){event.preventDefault();showAll();}
  });
  el.previous.addEventListener('click',()=>{stopPlay();setStage(state.stage-1);});
  el.next.addEventListener('click',()=>{stopPlay();setStage(state.stage+1);});
  el.play.addEventListener('click',togglePlay);el.showAll.addEventListener('click',showAll);el.export.addEventListener('click',downloadSvg);
  document.getElementById('atlas-back-controls').addEventListener('click',()=>{el.tabs.scrollIntoView({block:'start',behavior:'auto'});const active=el.tabs.querySelector('[aria-current="page"]');if(active)active.focus({preventScroll:true});});
  el.mode.addEventListener('change',()=>{stopPlay();state.mode=el.mode.value;state.stage=-1;state.selection=null;renderBoard(true);});
  window.addEventListener('hashchange',()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return;}if(byView(id)&&id!==state.view)openView(id);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing)stopPlay();});
  let resizeTimer;
  const resized=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>renderBoard(false),120);};
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(resized);observer.observe(el.board);}else window.addEventListener('resize',resized);
  try{const initial=decodeURIComponent(location.hash.slice(1));if(byView(initial))state.view=initial;}catch(_){}
  if(state.view==='training'||state.view==='inference')state.mode=state.view;
  renderBoard(true);
})();
