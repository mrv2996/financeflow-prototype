import { z } from 'zod';
import { graphIssues } from './graph';

export const DEFAULT_ROLES = ['Requester', 'Finance Reviewer', 'Department Manager', 'CFO / Senior Approver', 'External Partner', 'Procurement', 'Treasury', 'Marketing'];
export const STAGE_TYPES = ['task', 'approval', 'document', 'financial_verification', 'ai_analysis', 'conditional', 'notification', 'completion'] as const;
export const MAX_MINOR = 1_000_000_000_000;
const minor = z.number().int().min(0).max(MAX_MINOR);
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const stageSchema = z.object({
  id, name: z.string().trim().min(1).max(120), description: z.string().max(1000),
  type: z.enum(STAGE_TYPES), role: z.string().trim().min(1).max(80),
  requiredDocuments: z.array(z.string().trim().min(1).max(100)).max(10),
  approvalRequired: z.boolean(), thresholdMinor: minor.nullable(), thresholdRole: z.string().max(80),
  onApprove: z.enum(['next', 'finish']), onReject: z.enum(['revise', 'cancel']),
  financialEffect: z.enum(['none', 'approve_budget', 'confirm_receipt', 'allocate', 'commit']),
  effectMinor: minor.nullable(),
}).strict();
export const graphSchema = z.object({
  nodes:z.array(z.object({id,kind:z.enum(['start','stage','end']),position:z.object({x:z.number().finite().min(-100000).max(100000),y:z.number().finite().min(-100000).max(100000)}).strict()}).strict()).min(3).max(32),
  edges:z.array(z.object({id,source:id,target:id,outcome:z.enum(['success','reject','above','below'])}).strict()).max(100),
}).strict();
export const templateSchema = z.object({
  id: z.string().uuid(), name: z.string().trim().min(1).max(140), description: z.string().max(2000),
  currency: z.enum(['USD', 'GBP', 'EUR']), amountMinor: minor, published: z.boolean(),
  stages: z.array(stageSchema).min(1).max(30), graph:graphSchema.optional(),
}).strict().superRefine((t, ctx) => {
  if(t.graph) for(const message of graphIssues(t.stages,t.graph,t.published))ctx.addIssue({code:'custom',path:['graph'],message});
  if (new Set(t.stages.map(s => s.id)).size !== t.stages.length) ctx.addIssue({code:'custom', message:'Stage IDs must be unique'});
  for (const [i, s] of t.stages.entries()) {
    if ((s.type === 'conditional' || s.thresholdMinor !== null) && !s.thresholdRole.trim()) ctx.addIssue({code:'custom', path:['stages',i,'thresholdRole'], message:'A threshold approval role is required'});
    if (s.type === 'conditional' && s.thresholdMinor === null) ctx.addIssue({code:'custom', path:['stages',i,'thresholdMinor'], message:'Conditional stages need a threshold'});
    if (s.financialEffect !== 'none' && s.type !== 'financial_verification' && s.type !== 'approval') ctx.addIssue({code:'custom', path:['stages',i], message:'Financial effects require an approval or financial verification stage'});
    if (s.financialEffect === 'confirm_receipt' && !s.requiredDocuments.includes('Funding Confirmation')) ctx.addIssue({code:'custom', path:['stages',i], message:'Receipt confirmation requires a Funding Confirmation document'});
    if (!t.graph && s.onApprove === 'finish' && t.stages.slice(i+1).some(x => x.approvalRequired || x.type === 'approval' || x.thresholdMinor !== null || x.financialEffect !== 'none')) ctx.addIssue({code:'custom', path:['stages',i,'onApprove'], message:'Cannot finish before a later financial or approval control'});
  }
});
export const extractionSchema = z.object({ documentType:z.string(), issuer:z.string().nullable(), amountMinor:minor.nullable(), currency:z.enum(['USD','GBP','EUR']).nullable(), date:z.string().nullable(), purchaseOrderNumber:z.string().nullable(), invoiceNumber:z.string().nullable(), company:z.string().nullable(), paymentTerms:z.string().nullable(), warnings:z.array(z.string()).max(20) });
export const documentSchema = z.object({
  id:z.string().uuid(), stageId:id, type:z.string().min(1).max(100), title:z.string().min(1).max(200),
  text:z.string().max(30000), verified:z.boolean(), createdAt:z.string().datetime(),
  storagePath:z.string().max(500).nullable(), mimeType:z.string().max(100),
  extraction:extractionSchema.nullable(), extractionReviewed:z.boolean(),
}).strict();
export const eventSchema = z.object({id:z.string().uuid(), at:z.string().datetime(), actorId:z.string(), actorName:z.string(), stageId:z.string().nullable(), action:z.string(), comment:z.string().max(4000), requestId:z.string().uuid()});
export const executionSchema = z.object({stageId:id, status:z.enum(['pending','active','blocked','completed','skipped']), assignedUserId:z.string().nullable(), decision:z.enum(['pending','approved','rejected','changes_requested','none']), blocker:z.string().nullable(), startedAt:z.string().datetime().nullable(), completedAt:z.string().datetime().nullable()});
export const financeSchema = z.object({requested:minor, approved:minor, received:minor, allocated:minor, committed:minor});
export const instanceSchema = z.object({
  id:z.string().uuid(), workspaceId:z.string(), name:z.string().min(1).max(140), template:templateSchema,
  status:z.enum(['active','completed','cancelled']), currentStageId:id.nullable(), version:z.number().int().min(0),
  currency:z.enum(['USD','GBP','EUR']), finance:financeSchema, executions:z.array(executionSchema).max(30),
  documents:z.array(documentSchema).max(100), history:z.array(eventSchema).max(2000),
  createdAt:z.string().datetime(), updatedAt:z.string().datetime(),
}).strict();
export const actionSchema = z.object({
  action:z.enum(['submit','approve','reject','request_changes','reassign','complete','cancel','add_document','review_document','analysis','record_followup']),
  requestId:z.string().uuid(), expectedVersion:z.number().int().min(0), stageId:id.nullable().optional(),
  comment:z.string().max(4000).default(''), assignedUserId:z.string().uuid().nullable().optional(),
  document:documentSchema.optional(), documentId:z.string().uuid().optional(),
  extraction:extractionSchema.optional(), confirmed:z.boolean().default(false),
}).strict();
export type Stage = z.infer<typeof stageSchema>;
export type Template = z.infer<typeof templateSchema>;
export type WorkflowInstance = z.infer<typeof instanceSchema>;
export type DocumentRecord = z.infer<typeof documentSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Actor = { id:string; name:string; workspaceId:string; roles:string[]; admin:boolean };
export type Member = { user_id:string; email:string; roles:string[]; is_admin:boolean };
export type Proposal = { id:string; instanceId:string; stageId:string|null; action:'submit'|'approve'|'complete'|'request_changes'|'record_followup'; description:string; comment:string; status:'pending'|'applied'; basedOnVersion:number };
export type ChatReply = { answer:string; evidence:{id:string;label:string}[]; proposal:Proposal|null; mode:'openai'|'rules'; tools:string[] };
