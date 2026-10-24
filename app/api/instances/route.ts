import { context, dbError } from '@/lib/server/supabase';
import { handle, body } from '@/lib/server/http';
import { createInstance, WorkflowError } from '@/lib/platform/engine';
import { persist } from '@/lib/server/repository';
import { templateSchema } from '@/lib/platform/schema';
import { z } from 'zod';
export async function GET(request:Request){return handle(async()=>{const workspaceId=z.string().uuid().parse(new URL(request.url).searchParams.get('workspaceId'));const {client}=await context(workspaceId);const {data,error}=await client.from('workflow_instances').select('state').eq('workspace_id',workspaceId).order('updated_at',{ascending:false}).limit(100);dbError(error);return {instances:(data??[]).map(r=>r.state)};});}
export async function POST(request:Request){return handle(async()=>{const input=z.object({workspaceId:z.string().uuid(),templateId:z.string().uuid(),name:z.string().trim().min(1).max(140),requestId:z.string().uuid()}).parse(await body(request));const {client,actor}=await context(input.workspaceId);const {data,error}=await client.from('workflow_templates').select('definition').eq('id',input.templateId).eq('workspace_id',input.workspaceId).single();if(error||!data)throw new WorkflowError('Template not found.',404);const instance=createInstance(templateSchema.parse(data.definition),actor,input.name);instance.id=input.requestId;return {instance:await persist(instance,-1,actor.id,instance.history[0].requestId)};});}
