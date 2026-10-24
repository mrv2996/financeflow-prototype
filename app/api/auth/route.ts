import { z } from 'zod';
import { handle, body } from '@/lib/server/http';
import { userClient } from '@/lib/server/supabase';
import { WorkflowError } from '@/lib/platform/engine';
export async function POST(request:Request){return handle(async()=>{const input=z.object({action:z.enum(['signup','signin','signout']),email:z.string().email().optional(),password:z.string().min(10).max(200).optional()}).parse(await body(request));const client=await userClient();if(input.action==='signout'){const {error}=await client.auth.signOut();if(error)throw new WorkflowError('Could not sign out.');return {ok:true};}if(!input.email||!input.password)throw new WorkflowError('Email and password are required.');
 const result=input.action==='signup'?await client.auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:`${new URL(request.url).origin}/auth/confirm`}}):await client.auth.signInWithPassword({email:input.email,password:input.password});
 if(result.error)throw new WorkflowError(result.error.message,400);return {ok:true,confirmationRequired:!result.data.session};});}
