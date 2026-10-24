import { DOCUMENTS } from '../workflow';
import { DEFAULT_ROLES, Template, Stage, WorkflowInstance, Actor } from './schema';
import { createInstance, transition, formatMoney } from './engine';
export const DEMO_WORKSPACE='demo-workspace';
export function demoActor(role='Workspace Administrator'):Actor {return {id:'demo-user',name:`Demo ${role}`,workspaceId:DEMO_WORKSPACE,roles:role==='Workspace Administrator'?DEFAULT_ROLES:[role],admin:role==='Workspace Administrator'};}
export function blankStage():Stage {return {id:crypto.randomUUID(),name:'New stage',description:'',type:'task',role:'Requester',requiredDocuments:[],approvalRequired:false,thresholdMinor:null,thresholdRole:'CFO / Senior Approver',onApprove:'next',onReject:'revise',financialEffect:'none',effectMinor:null};}
function stage(id:string,name:string,type:Stage['type'],role:string,documents:string[]=[],effect:Stage['financialEffect']='none'):Stage{return {...blankStage(),id,name,type,role,requiredDocuments:documents,financialEffect:effect};}
export function marketingTemplate():Template {return {id:'10000000-0000-4000-8000-000000000001',name:'Marketing Funding Approval',description:'Northstar Cloud · $100,000 US Growth Summit 2026. Hypothetical partner funding process.',currency:'USD',amountMinor:10000000,published:true,stages:[
 stage('request','Funding request','document','Requester',['Funding Request']),
 stage('plan','Plan & budget','document','Marketing',['Marketing Budget','Marketing Plan']),
 {...stage('finance','Finance review','approval','Finance Reviewer'),thresholdMinor:7500000,thresholdRole:'CFO / Senior Approver'},
 stage('management','Management approval','approval','Department Manager',[],'approve_budget'),
 stage('external_request','Partner funding request','notification','External Partner'),
 stage('po','Verify purchase order','financial_verification','Procurement',['Purchase Order']),
 stage('invoice','Invoice verification','financial_verification','Finance Reviewer',['Invoice']),
 stage('partner','Partner approval','approval','External Partner',['External Partner Approval']),
 stage('funding','Funding confirmation','financial_verification','Treasury',['Funding Confirmation'],'confirm_receipt'),
 stage('handoff','Marketing handoff','financial_verification','Marketing',[],'allocate'),
]};}
export function vendorTemplate():Template {return {id:'10000000-0000-4000-8000-000000000002',name:'Vendor Payment Preparation',description:'Review an invoice, match a PO, and approve payment preparation. No payment is executed.',currency:'USD',amountMinor:1250000,published:true,stages:[stage('invoice','Vendor invoice','document','Requester',['Invoice']),stage('match','PO matching','financial_verification','Procurement',['Purchase Order']),stage('validation','Finance validation','approval','Finance Reviewer'),stage('manager','Manager approval','approval','Department Manager',[],'approve_budget'),stage('prepare','Payment preparation','task','Finance Reviewer'),stage('done','Completion','completion','Requester')]};}
export function sampleDocument(type:string,stageId:string,amountMinor=10000000,currency='USD') {
 const mapping:Record<string,string>={'Funding Request':'request','Marketing Budget':'budget','Marketing Plan':'plan','Purchase Order':'po','Invoice':'invoice','External Partner Approval':'partner','Funding Confirmation':'confirmation'};
 const source=DOCUMENTS.find(d=>d.id===mapping[type]);
 return {id:crypto.randomUUID(),stageId,type,title:`${type} (fictional sample)`,text:source?`${source.summary}\n${source.fields.map(([k,v])=>`${k}: ${v.replaceAll('$100,000',formatMoney(amountMinor,currency)).replace('Pending partner review','Approved in this fictional sample')}`).join('\n')}\nSIMULATED EVIDENCE — no real funds moved.`:`Fictional ${type} for Northstar Cloud. Amount: ${formatMoney(amountMinor,currency)}. Demo evidence only.`,verified:false,createdAt:new Date().toISOString(),storagePath:null,mimeType:'text/plain',extraction:null,extractionReviewed:false};
}
export function seededDemo():WorkflowInstance {
 const actor=demoActor();let w=createInstance(marketingTemplate(),actor,'US Growth Summit 2026');
 const act=(action:Parameters<typeof transition>[1]['action'],extra:Partial<Parameters<typeof transition>[1]>={})=>{w=transition(w,{action,requestId:crypto.randomUUID(),expectedVersion:w.version,stageId:w.currentStageId,comment:'Seeded fictional campaign history.',confirmed:true,...extra},actor);};
 for(let i=0;i<5;i++){const s=w.template.stages[i];for(const type of s.requiredDocuments){const document=sampleDocument(type,s.id);act('add_document',{document});act('review_document',{documentId:document.id});}act(s.type==='approval'?'approve':'complete');}
 // An actual missing-evidence blocker at the current stage, with internal funding already approved.
 act('complete');
 w.history.unshift({id:crypto.randomUUID(),at:w.createdAt,actorId:'demo-policy',actorName:'Finance policy',stageId:null,action:'policy',comment:'Northstar policy: requests above $75,000 require CFO review. Approvals are not receipts. Verify partner PO before invoice processing. All records are fictional.',requestId:crypto.randomUUID()});
 return w;
}
