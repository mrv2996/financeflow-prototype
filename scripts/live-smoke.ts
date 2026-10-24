/** Explicit opt-in cloud smoke test. Creates and removes only its own synthetic records. */
import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {marketingTemplate,blankStage} from '../lib/platform/seed';
import {sequentialGraph} from '../lib/platform/graph';
import {type WorkflowInstance} from '../lib/platform/schema';
const origin=process.env.SMOKE_ORIGIN||'http://localhost:3000';
const admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
const users:string[]=[],workspaces:string[]=[],files:string[]=[];const results:string[]=[];
function ok(label:string){results.push(label);console.log('PASS',label);}
class Session {
 cookies=new Map<string,string>();
 async request(path:string,data?:unknown,method=data?'POST':'GET'){
  const headers:Record<string,string>={origin,cookie:[...this.cookies].map(([k,v])=>`${k}=${v}`).join('; ')};
  if(data&&!(data instanceof FormData))headers['content-type']='application/json';
  const r=await fetch(origin+path,{method,headers,body:data instanceof FormData?data:data?JSON.stringify(data):undefined,redirect:'manual'});
  for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');this.cookies.set(pair.slice(0,i),pair.slice(i+1));}
  const text=await r.text();let body;try{body=JSON.parse(text);}catch{body={};}return {status:r.status,body,location:r.headers.get('location')};
 }
 async post(path:string,data:unknown){const r=await this.request(path,data);assert.equal(r.status,200,`${path}: ${JSON.stringify(r.body)}`);return r.body;}
}
async function main(){
try{
 const sessions:Session[]=[];const clients:(typeof admin)[]=[];
 for(const suffix of ['a','b']){
  const email=`financeflow-smoke-${randomUUID()}-${suffix}@example.com`,password=`Ff!${randomUUID()}a9`;
  // Generate a real signup token without delivering email to a synthetic address.
  const {data,error}=await admin.auth.admin.generateLink({type:'signup',email,password});assert.equal(error,null,'Auth signup link generation');users.push(data.user!.id);
  const s=new Session();const confirm=await s.request(`/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`);assert.equal(confirm.status,307);assert.match(confirm.location??'',/workspace=1/);
  await s.post('/api/auth',{action:'signout'});await s.post('/api/auth',{action:'signin',email,password});
  const boot=await s.request('/api/bootstrap');assert.equal(boot.body.user.id,data.user!.id);sessions.push(s);
  const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});assert.equal((await client.auth.signInWithPassword({email,password})).error,null);clients.push(client);
  const ws=await s.post('/api/bootstrap',{name:`FinanceFlow smoke ${suffix}`});workspaces.push(ws.id);
 }
 ok('Two real accounts: signup-token confirmation, password login, server sessions and separate workspaces');
 const [a,b]=sessions,[wa,wb]=workspaces;
 const template={...marketingTemplate(),id:randomUUID(),name:'Graph persistence smoke',amountMinor:10000,stages:[{...blankStage(),id:'review',name:'Finance review',type:'approval' as const,role:'Finance Reviewer'},{...blankStage(),id:'evidence',name:'Evidence',type:'document' as const,requiredDocuments:['Invoice']}]};
 const graph=sequentialGraph(template.stages);graph.nodes[1].position={x:420,y:180};
 await a.post('/api/templates',{workspaceId:wa,template:{...template,graph}});
 const saved=await a.request(`/api/templates?workspaceId=${wa}`);assert.deepEqual(saved.body.templates[0].graph,graph);
 let w:WorkflowInstance=(await a.post('/api/instances',{workspaceId:wa,templateId:template.id,name:'Live graph smoke',requestId:randomUUID()})).instance;
 ok('Workflow graph, node coordinates and instance persisted in PostgreSQL');
 const reject={mode:'workspace',workspaceId:wa,instanceId:w.id,action:{action:'reject',expectedVersion:w.version,requestId:randomUUID(),comment:'Revise test request',confirmed:true}};
 w=(await a.post('/api/transition',reject)).instance;assert.equal(w.currentStageId,'review');
 const failed=await a.request('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action:{action:'approve',expectedVersion:w.version,requestId:randomUUID(),confirmed:true}});assert.equal(failed.status,409);
 const perform=async(action:string)=>{w=(await a.post('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action:{action,expectedVersion:w.version,requestId:randomUUID(),comment:'Live test',confirmed:true}})).instance;};
 await perform('submit');const action={action:'approve',expectedVersion:w.version,requestId:randomUUID(),comment:'Approved test request',confirmed:true};
 w=(await a.post('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action})).instance;assert.equal(w.currentStageId,'evidence');
 const retry=await a.post('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action});assert.equal(retry.instance.version,w.version);
 assert.equal((await a.request('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action:{action:'complete',expectedVersion:0,requestId:randomUUID(),confirmed:true}})).status,409);
 ok('Live graph transitions, rejection/resubmission, idempotent retry and stale-version protection');
 const form=new FormData();for(const [k,v] of Object.entries({workspaceId:wa,instanceId:w.id,stageId:'evidence',type:'Invoice',requestId:randomUUID(),expectedVersion:String(w.version)}))form.set(k,v);form.set('file',new Blob(['description,amount\nSynthetic test invoice,100\n'],{type:'text/csv'}),'smoke.csv');
 w=(await a.post('/api/documents',form)).instance;const doc=w.documents[0];files.push(doc.storagePath!);
 const path=`/api/documents?workspaceId=${wa}&instanceId=${w.id}&documentId=${doc.id}`;const signed=await a.request(path);assert.equal(signed.status,200);assert.equal((await fetch(signed.body.url)).status,200);
 assert.notEqual((await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/public/financeflow-documents/${doc.storagePath}`)).status,200);
 ok('Private upload, authorized signed download and denied public access');
 for(const p of [`/api/templates?workspaceId=${wa}`,`/api/instances?workspaceId=${wa}`,path])assert.equal((await b.request(p)).status,403);
 assert.equal((await b.request('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action:{action:'complete',expectedVersion:w.version,requestId:randomUUID(),confirmed:true}})).status,403);
 for(const table of ['workflow_instances','workflow_templates','documents','activity_logs','approvals']){const r=await clients[1].from(table).select('*').eq('workspace_id',wa);assert.equal(r.error,null,table);assert.equal(r.data.length,0,table);}
 assert.ok((await clients[1].from('workflow_templates').insert({id:randomUUID(),workspace_id:wb,definition:template,created_by:users[1]})).error);
 assert.ok((await clients[1].rpc('persist_workflow',{p_state:w,p_expected:w.version,p_actor:users[1],p_request:randomUUID()})).error);
 assert.ok((await clients[1].storage.from('financeflow-documents').download(doc.storagePath!)).error);
 ok('Cross-account API, database RLS, private files, direct writes and mutation RPCs denied');
 await admin.from('workspace_members').insert({workspace_id:wa,user_id:users[1],email:'smoke@example.com',roles:['Requester'],is_admin:false});
 assert.equal((await b.request('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w.id,action:{action:'review_document',documentId:doc.id,expectedVersion:w.version,requestId:randomUUID(),confirmed:true}})).status,200); // Evidence role is Requester.
 w=(await a.request(`/api/instances?workspaceId=${wa}`)).body.instances[0];
 const approveOnly={...template,id:randomUUID(),stages:[template.stages[0]],graph:sequentialGraph([template.stages[0]])};await a.post('/api/templates',{workspaceId:wa,template:approveOnly});const w2=(await a.post('/api/instances',{workspaceId:wa,templateId:approveOnly.id,name:'Role isolation',requestId:randomUUID()})).instance;
 assert.equal((await b.request('/api/transition',{mode:'workspace',workspaceId:wa,instanceId:w2.id,action:{action:'approve',expectedVersion:0,requestId:randomUUID(),confirmed:true}})).status,403);
 const reopened=await a.request(`/api/instances?workspaceId=${wa}`);assert.equal(reopened.body.instances.length,2);assert.deepEqual(reopened.body.instances.find((r:WorkflowInstance)=>r.id===w.id).template.graph,graph);
 ok('Requester cannot approve finance stage; persisted graph survives fresh reads');
 console.log('LIVE_SMOKE_SUCCESS',JSON.stringify({origin,checks:results.length,emailDelivery:'Not tested; signup tokens generated without sending mail'}));
} finally {
 if(files.length){const r=await admin.storage.from('financeflow-documents').remove(files);if(r.error)console.error('Test file cleanup failed');}
 for(const ws of workspaces){for(const table of ['ai_action_proposals','ai_messages','approvals','documents','stage_executions','activity_logs','workflow_instances','workflow_stages','workflow_templates','workspace_invitations','workspace_members']){const r=await admin.from(table).delete().eq('workspace_id',ws);if(r.error)console.error('Cleanup failed for',table);}const r=await admin.from('workspaces').delete().eq('id',ws);if(r.error)console.error('Workspace cleanup failed');}
 for(const id of users){const r=await admin.auth.admin.deleteUser(id);if(r.error)console.error('Synthetic account cleanup failed');}
 console.log('Synthetic test records cleaned up.');
}

}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
