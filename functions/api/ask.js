const DEFAULT_MODEL='@cf/meta/llama-3.1-8b-instruct';

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    }
  });
}

function normalizePrompt(body){
  const question=String(body?.question||'').trim();
  const context=String(body?.context||'').trim();
  const system=String(body?.system||'').trim();
  if(!question)return null;
  return [
    {role:'system',content:[system,context?`用户命盘：\n${context}`:''].filter(Boolean).join('\n\n')},
    {role:'user',content:question}
  ];
}

export async function onRequest({request,env}){
  if(request.method==='OPTIONS')return json({ok:true});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!env.AI)return json({error:'Cloudflare Workers AI binding AI is not configured'},500);

  let body;
  try{body=await request.json();}
  catch(e){return json({error:'Invalid JSON body'},400);}

  const messages=normalizePrompt(body);
  if(!messages)return json({error:'Question is required'},400);

  const model=env.AI_MODEL||DEFAULT_MODEL;
  const result=await env.AI.run(model,{messages,max_tokens:700});
  const answer=result?.response||result?.answer||result?.text||'';
  return json({answer,result,model});
}
