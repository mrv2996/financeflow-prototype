import { z } from 'zod';
import { createHash } from 'node:crypto';
import { requireUser,adminClient,dbError } from '@/lib/server/supabase';
import { body,handle } from '@/lib/server/http';
export async function POST(request:Request){return handle(async()=>{const {token}=z.object({token:z.string().min(40).max(100)}).parse(await body(request));const {user}=await requireUser();const {data,error}=await adminClient().rpc('accept_invitation',{p_hash:createHash('sha256').update(token).digest('hex'),p_user:user.id,p_email:user.email});dbError(error);return {workspaceId:data};});}
