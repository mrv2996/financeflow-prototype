import { context, adminClient, dbError } from '@/lib/server/supabase';
import { handle, body } from '@/lib/server/http';
import { templateSchema } from '@/lib/platform/schema';
import { z } from 'zod';
import { WorkflowError } from '@/lib/platform/engine';
export async function GET(request:Request){return handle(async()=>{const workspaceId=z.string().uuid().parse(new URL(request.url).searchParams.get('workspaceId'));const {client}=await context(workspaceId);const {data,error}=await client.from('workflow_templates').select('definition').eq('workspace_id',workspaceId).order('updated_at',{ascending:false});dbError(error);return {templates:(data??[]).map(r=>r.definition)};});}
export async function POST(request:Request){return handle(async()=>{const input=z.object({workspaceId:z.string().uuid(),template:templateSchema}).parse(await body(request));const {actor}=await context(input.workspaceId);if(!actor.admin)throw new WorkflowError('Only workspace administrators can edit templates.',403);const {error}=await adminClient().rpc('save_workflow_template',{p_workspace:input.workspaceId,p_user:actor.id,p_definition:input.template});dbError(error);return {template:input.template};});}
