import { z } from 'zod';
import { body,handle } from '@/lib/server/http';
import { templateSchema } from '@/lib/platform/schema';
import { createInstance } from '@/lib/platform/engine';
import { demoActor } from '@/lib/platform/seed';
export async function POST(request:Request){return handle(async()=>{const input=z.object({template:templateSchema,name:z.string().trim().min(1).max(140)}).parse(await body(request));return {instance:createInstance(input.template,demoActor(),input.name)};});}
