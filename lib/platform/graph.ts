import type { Stage, Template } from './schema';

export type GraphNode = { id:string; kind:'start'|'stage'|'end'; position:{x:number;y:number} };
export type GraphEdge = { id:string; source:string; target:string; outcome:'success'|'reject'|'above'|'below' };
export type WorkflowGraph = { nodes:GraphNode[]; edges:GraphEdge[] };
export const START='flow_start', END='flow_end';
export function layoutPosition(index:number){const row=Math.floor(index/4),column=row%2?3-index%4:index%4;return {x:column*340,y:row*230};}
export function outcomes(stage?:Stage):GraphEdge['outcome'][] {
 if(!stage)return ['success'];
 const success:GraphEdge['outcome'][]=stage.type==='conditional'?['above','below']:['success'];
 return stage.type==='approval'||stage.approvalRequired||stage.thresholdMinor!==null?[...success,'reject']:success;
}
export function sequentialGraph(stages:Stage[]):WorkflowGraph {
 const nodes:GraphNode[]=[{id:START,kind:'start',position:layoutPosition(0)},...stages.map((s,i)=>({id:s.id,kind:'stage' as const,position:layoutPosition(i+1)})),{id:END,kind:'end',position:layoutPosition(stages.length+1)}];
 const edges:GraphEdge[]=[{id:'start',source:START,target:stages[0]?.id??END,outcome:'success'}];
 stages.forEach((s,i)=>outcomes(s).forEach(outcome=>edges.push({id:`${s.id}-${outcome}`,source:s.id,target:outcome==='reject'?(s.onReject==='cancel'?END:s.id):(s.onApprove==='finish'?END:stages[i+1]?.id??END),outcome})));
 return {nodes,edges};
}
export function graphTarget(template:Template, source:string, outcome:GraphEdge['outcome']) {
 return template.graph?.edges.find(e=>e.source===source && e.outcome===outcome)?.target;
}
/** Validate executable paths, including control dominance and bounded revision loops. */
export function graphIssues(stages:Stage[],graph:WorkflowGraph,published:boolean):string[] {
 const errors:string[]=[];const nodes=new Map(graph.nodes.map(n=>[n.id,n]));const stageMap=new Map(stages.map(s=>[s.id,s]));
 const starts=graph.nodes.filter(n=>n.kind==='start'), ends=graph.nodes.filter(n=>n.kind==='end');
 if(nodes.size!==graph.nodes.length||new Set(graph.edges.map(e=>e.id)).size!==graph.edges.length)errors.push('Node and connection IDs must be unique.');
 if(starts.length!==1||ends.length!==1)errors.push('Use exactly one Start and one End node.');
 if(graph.nodes.filter(n=>n.kind==='stage').length!==stages.length||stages.some(s=>nodes.get(s.id)?.kind!=='stage')||graph.nodes.some(n=>n.kind==='stage'&&!stageMap.has(n.id)))errors.push('Every stage must have exactly one matching canvas node.');
 const slots=new Set<string>();
 for(const e of graph.edges){
  const source=nodes.get(e.source),target=nodes.get(e.target);const slot=`${e.source}:${e.outcome}`;
  if(!source||!target||source.kind==='end'||target.kind==='start')errors.push('Connections must link existing nodes, from Start toward End.');
  if(source && !outcomes(stageMap.get(source.id)).includes(e.outcome))errors.push('This outcome is not available on the source node.');
  if(slots.has(slot))errors.push('Each output can have only one connection.');slots.add(slot);
 }
 if(errors.length||!published)return [...new Set(errors)];
 for(const node of graph.nodes.filter(n=>n.kind!=='end'))for(const outcome of outcomes(stageMap.get(node.id)).filter(o=>o!=='reject'))if(!slots.has(`${node.id}:${outcome}`))errors.push(`Connect ${stageMap.get(node.id)?.name??'Start'}: ${outcome}.`);
 const forward=(id:string)=>graph.edges.filter(e=>e.source===id&&e.outcome!=='reject').map(e=>e.target);
 const visited=new Set<string>(),active=new Set<string>();
 function visit(id:string){if(active.has(id)){errors.push('Forward connections cannot form a cycle. Use a rejection branch for revisions.');return;}if(visited.has(id))return;visited.add(id);active.add(id);forward(id).forEach(visit);active.delete(id);}
 graph.nodes.forEach(n=>visit(n.id));
 if(errors.length)return [...new Set(errors)];
 const reachable=new Set<string>();function reach(id:string){if(reachable.has(id))return;reachable.add(id);graph.edges.filter(e=>e.source===id).forEach(e=>reach(e.target));}reach(starts[0].id);
 if(graph.nodes.some(n=>!reachable.has(n.id)))errors.push('Connect every node to the workflow or delete unused nodes.');
 // A successful path must not silently bypass a declared approval, evidence, AI or financial control.
 function canFinish(id:string,avoid:string,seen=new Set<string>()):boolean{if(id===avoid||seen.has(id))return false;if(id===ends[0].id)return true;seen.add(id);return forward(id).some(target=>canFinish(target,avoid,seen));}
 for(const s of stages){if((s.type==='approval'||s.approvalRequired||s.thresholdMinor!==null||s.financialEffect!=='none'||s.requiredDocuments.length>0||s.type==='ai_analysis')&&canFinish(starts[0].id,s.id))errors.push(`A successful path bypasses the required control “${s.name}”.`);}
 for(const e of graph.edges.filter(e=>e.outcome==='reject')){
  if(e.target===ends[0].id||e.target===e.source)continue;
  const seen=new Set<string>();let invalid=false;
  function revision(id:string){if(id===e.source)return;if(seen.has(id))return;seen.add(id);if(id===ends[0].id||stageMap.get(id)?.financialEffect!=='none'){invalid=true;return;}forward(id).forEach(revision);}
  revision(e.target);if(invalid)errors.push('A rejection branch must return to its approval before End, without repeating financial effects.');
 }
 return [...new Set(errors)];
}
