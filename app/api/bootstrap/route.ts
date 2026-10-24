import { configuration, requireUser, adminClient, dbError } from '@/lib/server/supabase';
import { handle, body } from '@/lib/server/http';
import { DEFAULT_ROLES } from '@/lib/platform/schema';
import { z } from 'zod';
export async function GET(){return handle(async()=>{const config=configuration();if(!config.workspace)return {config,user:null,workspaces:[]};try{const {client,user}=await requireUser();const {data,error}=await client.from('workspaces').select('*').order('created_at');dbError(error);return {config,user:{id:user.id,email:user.email},workspaces:data};}catch(e){if(e && typeof e==='object' && 'status' in e && e.status===401)return {config,user:null,workspaces:[]};throw e;}});}
export async function POST(request:Request){return handle(async()=>{const {name}=z.object({name:z.string().trim().min(1).max(100)}).parse(await body(request));const {user}=await requireUser();const {data,error}=await adminClient().rpc('create_workspace',{p_name:name,p_user:user.id,p_email:user.email,p_roles:DEFAULT_ROLES});dbError(error);return {id:data,name};});}
