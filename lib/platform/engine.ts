import { graphTarget } from './graph';
import { Action, Actor, Stage, Template, WorkflowInstance, templateSchema } from './schema';
export class WorkflowError extends Error { constructor(message:string, public status=400) { super(message); } }
export function assertTenant(actor:Actor, workspaceId:string) { if(actor.workspaceId !== workspaceId) throw new WorkflowError('This record belongs to another workspace.',403); }
export function requiredRole(stage:Stage, amount:number) { return stage.thresholdMinor !== null && amount > stage.thresholdMinor ? stage.thresholdRole : stage.role; }
export function requiresApproval(stage:Stage, amount:number) { return stage.type === 'approval' || stage.approvalRequired || (stage.thresholdMinor !== null && amount > stage.thresholdMinor); }
export function canAct(actor:Actor, instance:WorkflowInstance, stage:Stage) { const execution=instance.executions.find(e=>e.stageId===stage.id); return actor.workspaceId === instance.workspaceId && actor.roles.includes(requiredRole(stage,instance.finance.requested)) && (!execution?.assignedUserId || execution.assignedUserId === actor.id); }
export function financialSummary(f:WorkflowInstance['finance']) { return {...f, available:f.received-f.committed, unallocated:f.received-f.allocated}; }
export function parseMoney(value:string):number { if(!/^\d{1,10}(\.\d{1,2})?$/.test(value.trim())) throw new WorkflowError('Use a positive amount with at most two decimal places.'); const [whole,frac='']=value.trim().split('.'); const n=Number(whole)*100+Number(frac.padEnd(2,'0')); if(!Number.isSafeInteger(n)||n>1_000_000_000_000) throw new WorkflowError('Amount is too large.'); return n; }
export function formatMoney(n:number,currency='USD') { return new Intl.NumberFormat('en-US',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100); }
export function stageBlockers(instance:WorkflowInstance, stage:Stage):string[] {
 const missing=stage.requiredDocuments.filter(type=>!instance.documents.some(d=>d.stageId===stage.id && d.type===type && d.verified && (!d.extraction || d.extractionReviewed)));
 const blockers=missing.map(d=>`A reviewed ${d} document is required.`);
 if(stage.type==='ai_analysis' && !instance.history.some(e=>e.stageId===stage.id && e.action==='analysis')) blockers.push('Run AI analysis for this stage before completion.');
 for(const d of instance.documents.filter(d=>d.stageId===stage.id && d.verified && d.extractionReviewed && d.extraction)) {
  if(d.extraction!.currency && d.extraction!.currency !== instance.currency) blockers.push(`${d.title}: currency differs from this workflow. No exchange rate is configured.`);
  if(d.extraction!.amountMinor !== null && ['Purchase Order','Invoice','Funding Confirmation'].includes(d.type) && d.extraction!.amountMinor !== (stage.effectMinor ?? instance.finance.requested)) blockers.push(`${d.title}: extracted amount differs from the expected amount. Replace or correct the source evidence.`);
 }
 return blockers;
}
export function createInstance(template:Template, actor:Actor, name=template.name, at=new Date().toISOString()):WorkflowInstance {
 template=templateSchema.parse(template); if(!template.published) throw new WorkflowError('Publish the template before starting an instance.');
 const requestId=crypto.randomUUID();
 const startId=template.graph?graphTarget(template,template.graph.nodes.find(n=>n.kind==='start')!.id,'success'):template.stages[0].id;
 if(!startId || !template.stages.some(s=>s.id===startId))throw new WorkflowError('Start must connect to an executable stage.');
 return {id:crypto.randomUUID(),workspaceId:actor.workspaceId,name,template:structuredClone(template),status:'active',currentStageId:startId,version:0,currency:template.currency,finance:{requested:template.amountMinor,approved:0,received:0,allocated:0,committed:0},executions:template.stages.map((s,i)=>({stageId:s.id,status:s.id===startId?'active':'pending',assignedUserId:null,decision:requiresApproval(s,template.amountMinor)?'pending':'none',blocker:null,startedAt:s.id===startId?at:null,completedAt:null})),documents:[],history:[{id:crypto.randomUUID(),at,actorId:actor.id,actorName:actor.name,stageId:null,action:'start',comment:'Workflow started from a published template.',requestId}],createdAt:at,updatedAt:at};
}
export function transition(input:WorkflowInstance, action:Action, actor:Actor, at=new Date().toISOString()):WorkflowInstance {
 assertTenant(actor,input.workspaceId);
 if(input.history.some(e=>e.requestId===action.requestId)) return input;
 if(input.version!==action.expectedVersion) throw new WorkflowError('This workflow changed. Refresh and review the latest version.',409);
 if(input.status!=='active') throw new WorkflowError('This workflow is no longer active.',409);
 const stage=input.template.stages.find(s=>s.id===(action.stageId ?? input.currentStageId));
 if(!stage) throw new WorkflowError('Stage not found.',404);
 if(stage.id!==input.currentStageId) throw new WorkflowError('Only the current stage can change.',409);
 const next=structuredClone(input); const execution=next.executions.find(e=>e.stageId===stage.id)!;
 const allowed=canAct(actor,input,stage);
 const requester=actor.roles.includes('Requester');
 if(action.action==='cancel' || action.action==='reassign') {
  if(!actor.admin) throw new WorkflowError('Only a workspace administrator can cancel or reassign.',403);
 } else if(action.action==='add_document' || action.action==='submit' || action.action==='record_followup') {
  if(!allowed && !requester) throw new WorkflowError('The assigned role or a Requester must perform this action.',403);
 } else if(!allowed) throw new WorkflowError(`This stage requires ${requiredRole(stage,input.finance.requested)}${execution.assignedUserId?' and the assigned user':''}.`,403);
 if(['approve','reject','request_changes','cancel'].includes(action.action) && !action.confirmed) throw new WorkflowError('Explicit human confirmation is required.');
 if(['reject','request_changes','record_followup'].includes(action.action) && !action.comment.trim()) throw new WorkflowError('Add a reason or message before continuing.');
 if(action.action==='reassign') { execution.assignedUserId=action.assignedUserId ?? null; }
 else if(action.action==='cancel') {next.status='cancelled'; execution.blocker='Cancelled by administrator.';}
 else if(action.action==='add_document') {
  if(!action.document || action.document.stageId!==stage.id || action.document.verified) throw new WorkflowError('Attach an unverified document to the active stage.');
  if(next.documents.length>=100) throw new WorkflowError('Document limit reached.');
  for(const previous of next.documents) if(previous.stageId===stage.id && previous.type===action.document.type) previous.verified=false;
  next.documents.push(action.document);
 } else if(action.action==='review_document') {
  if(!action.confirmed) throw new WorkflowError('Confirm that you reviewed the document.');
  const doc=next.documents.find(d=>d.id===action.documentId && d.stageId===stage.id);
  if(!doc) throw new WorkflowError('Document not found.',404);
  doc.verified=true; doc.extractionReviewed=Boolean(doc.extraction);
  const blockers=stageBlockers(next,stage); if(blockers.length) {execution.status='blocked';execution.blocker=blockers.join(' ');} else if(execution.decision!=='rejected' && execution.decision!=='changes_requested') {execution.status='active';execution.blocker=null;}
 } else if(action.action==='analysis') {
  if(action.documentId) {const doc=next.documents.find(d=>d.id===action.documentId && d.stageId===stage.id); if(!doc || !action.extraction) throw new WorkflowError('Document or extraction missing.'); doc.extraction=action.extraction;doc.extractionReviewed=false;doc.verified=false;}
 } else if(action.action==='record_followup') {
  // Draft accepted into the audit trail; never sends a message or changes funding.
 } else if(action.action==='submit') {
  if(execution.status!=='blocked' && execution.decision!=='rejected' && execution.decision!=='changes_requested') throw new WorkflowError('This stage is already open for review.');
  execution.decision=requiresApproval(stage,input.finance.requested)?'pending':'none'; execution.blocker=null; execution.status='active';
 } else if(action.action==='reject' || action.action==='request_changes') {
  if(!requiresApproval(stage,input.finance.requested)) throw new WorkflowError('This stage is not an approval.');
  execution.status='blocked'; execution.decision=action.action==='reject'?'rejected':'changes_requested';execution.blocker=action.comment;
  if(action.action==='reject') {
   const target=graphTarget(next.template,stage.id,'reject');
   if(target && target!==stage.id){
    if(next.template.graph?.nodes.find(n=>n.id===target)?.kind==='end')next.status='cancelled';
    else {next.currentStageId=target;const e=next.executions.find(e=>e.stageId===target)!;e.status='active';e.completedAt=null;e.startedAt=at;e.blocker=null;e.decision=requiresApproval(next.template.stages.find(s=>s.id===target)!,next.finance.requested)?'pending':'none';}
   } else if(!target && stage.onReject==='cancel')next.status='cancelled';
  }
 } else {
  if(execution.decision==='rejected'||execution.decision==='changes_requested') throw new WorkflowError('Resubmit the revised stage before approval.',409);
  const approval=requiresApproval(stage,input.finance.requested);
  if(approval && action.action!=='approve') throw new WorkflowError('This stage requires explicit approval.');
  if(!approval && action.action==='approve') throw new WorkflowError('Use Complete for this stage.');
  const blockers=stageBlockers(next,stage);
  if(blockers.length) {execution.status='blocked';execution.blocker=blockers.join(' ');}
  else {
   const amount=stage.effectMinor ?? next.finance.requested;
   if(stage.financialEffect!=='none' && !action.confirmed) throw new WorkflowError('Confirm this financial record change explicitly.');
   if(stage.financialEffect==='approve_budget') {if(amount<Math.max(next.finance.received,next.finance.allocated,next.finance.committed)) throw new WorkflowError('Approved funding cannot be reduced below recorded funding or commitments.');next.finance.approved=amount;}
   if(stage.financialEffect==='confirm_receipt') { if(amount>next.finance.approved) throw new WorkflowError('Receipt exceeds approved funding.'); if(amount<Math.max(next.finance.allocated,next.finance.committed)) throw new WorkflowError('Received funding cannot be reduced below allocations or commitments.');next.finance.received=amount; }
   if(stage.financialEffect==='allocate') {if(amount<next.finance.committed) throw new WorkflowError('Allocation cannot be reduced below commitments.');if(amount>next.finance.received || amount>next.finance.approved) throw new WorkflowError('Allocation exceeds received or approved funding.'); next.finance.allocated=amount;}
   if(stage.financialEffect==='commit') { if(next.finance.committed+amount>next.finance.allocated || next.finance.committed+amount>next.finance.received) throw new WorkflowError('Commitment exceeds allocated or received funding.'); next.finance.committed+=amount; }
   execution.status='completed';execution.decision=approval?'approved':'none';execution.blocker=null;execution.completedAt=at;
   const index=next.template.stages.findIndex(s=>s.id===stage.id);
   const outcome=stage.type==='conditional'?(next.finance.requested>stage.thresholdMinor!?'above':'below'):'success';
   const target=graphTarget(next.template,stage.id,outcome);
   const following=next.template.graph?next.template.stages.find(s=>s.id===target):next.template.stages[index+1];
   if(!following || (!next.template.graph && stage.onApprove==='finish')) {next.status='completed'; next.currentStageId=null; for(const e of next.executions) if(e.status==='pending') e.status='skipped';}
   else {next.currentStageId=following.id;const e=next.executions.find(e=>e.stageId===following.id)!;e.status=e.decision==='rejected'||e.decision==='changes_requested'?'blocked':'active';e.startedAt=at;e.completedAt=null;}
  }
 }
 next.version++;next.updatedAt=at;
 next.history.push({id:crypto.randomUUID(),at,actorId:actor.id,actorName:actor.name,stageId:stage.id,action:execution.blocker && ['complete','approve'].includes(action.action)?'blocked':action.action,comment:execution.blocker && ['complete','approve'].includes(action.action)?execution.blocker:action.comment || `${stage.name}: ${action.action.replaceAll('_',' ')}`,requestId:action.requestId});
 return next;
}
