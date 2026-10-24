import { handle, body } from '@/lib/server/http';
import { actionSchema, instanceSchema } from '@/lib/platform/schema';
import { z } from 'zod';
import { transition, WorkflowError } from '@/lib/platform/engine';
import { demoActor, DEMO_WORKSPACE } from '@/lib/platform/seed';
import { perform } from '@/lib/server/repository';
const inputSchema=z.discriminatedUnion('mode',[z.object({mode:z.literal('demo'),instance:instanceSchema,role:z.string().max(80),action:actionSchema}),z.object({mode:z.literal('workspace'),workspaceId:z.string().uuid(),instanceId:z.string().uuid(),action:actionSchema})]);
export async function POST(request:Request){return handle(async()=>{const input=inputSchema.parse(await body(request));if(input.mode==='demo'){if(input.instance.workspaceId!==DEMO_WORKSPACE)throw new WorkflowError('Invalid demo workspace.');if(input.action.action==='analysis')throw new WorkflowError('Use the assistant or extraction endpoint.');return {instance:transition(input.instance,input.action,demoActor(input.role))};}if(['add_document','analysis'].includes(input.action.action))throw new WorkflowError('Use the private document or AI endpoint.');return {instance:await perform(input.workspaceId,input.instanceId,input.action)};});}
