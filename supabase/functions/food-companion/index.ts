import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const allowedOrigins=(Deno.env.get("APP_ORIGINS")??Deno.env.get("APP_ORIGIN")??"https://foodie-liart-one.vercel.app").split(",").map(v=>v.trim()).filter(Boolean);
const corsFor=(origin:string)=>({"Access-Control-Allow-Origin":allowedOrigins.includes(origin)?origin:allowedOrigins[0],"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"});
const json=(body:unknown,status=200,origin="")=>new Response(JSON.stringify(body),{status,headers:{...corsFor(origin),"Content-Type":"application/json"}});
const langs={en:"English",ta:"Tamil (தமிழ்)",te:"Telugu (తెలుగు)"} as const;
Deno.serve(async req=>{
 const origin=req.headers.get("Origin")??"";
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsFor(origin)});
 if(req.method!=="POST")return json({error:"Method not allowed"},405,origin);
 const auth=req.headers.get("Authorization");
 if(!auth?.startsWith("Bearer "))return json({error:"Sign in to use your food companion."},401,origin);
 const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return json({error:"Your session expired. Please sign in again."},401,origin);
 const apiKey=Deno.env.get("AI_API_KEY");
 if(!apiKey)return json({error:"The food companion is not configured yet."},503,origin);
 try{
  const body=await req.json();
  const message=String(body.message??"").trim().slice(0,3000);
  const language=(["en","ta","te"].includes(body.language)?body.language:"en") as keyof typeof langs;
  const city=String(body.city??"").trim().slice(0,80),area=String(body.area??"").trim().slice(0,80);
  if(!message)return json({error:"Tell me what food you need."},400,origin);
  if(!city)return json({error:"Share your city or area so I can find available food."},400,origin);
  const {data:matches,error:matchError}=await supabase.rpc("search_food_matches",{p_city:city,p_area:area||null,p_query:null,p_limit:8});
  if(matchError)throw matchError;
  let conversationId=body.conversationId?String(body.conversationId):null;
  if(conversationId){
   const {data}=await supabase.from("companion_conversations").select("id").eq("id",conversationId).eq("user_id",user.id).maybeSingle();
   if(!data)conversationId=null;
  }
  if(!conversationId){
   const {data,error}=await supabase.from("companion_conversations").insert({user_id:user.id,language,title:message.slice(0,64)}).select("id").single();
   if(error)throw error; conversationId=data.id;
  }
  const {error:conversationUpdateError}=await supabase.from("companion_conversations").update({language,updated_at:new Date().toISOString()}).eq("id",conversationId).eq("user_id",user.id);
  if(conversationUpdateError)throw conversationUpdateError;
  const {error:userMessageError}=await supabase.from("companion_messages").insert({conversation_id:conversationId,user_id:user.id,role:"user",content:message,language});
  if(userMessageError)throw userMessageError;
  const {data:history,error:historyError}=await supabase.from("companion_messages").select("role,content").eq("conversation_id",conversationId).eq("user_id",user.id).order("created_at",{ascending:true}).limit(12);
  if(historyError)throw historyError;
  const grounded=(matches??[]).map((m:any)=>({id:m.id,food:m.title,category:m.category,quantity:m.available_quantity,unit:m.unit,area:m.area,city:m.city,pickup_before:m.pickup_deadline,donor:m.donor_name,dietary_tags:m.dietary_tags}));
  const system="You are FOODIE's warm practical food-sharing companion. Reply only in "+langs[language]+". Use short simple spoken sentences suitable for people with low literacy. Never shame anyone. Only describe listings in the supplied live data; never invent availability, distance or directions. If there are no matches, ask one simple question about food, quantity or area. Tell users to coordinate collection with donors. If someone has surplus food to share, guide them to the Share Food action in the app; never claim you published a listing. Do not guarantee food safety; encourage checking preparation time, allergens, packaging and condition.";
  const conversationMessages=(history??[]).map((m:any)=>({role:m.role,content:m.content}));
  const base=(Deno.env.get("AI_BASE_URL")??"https://api.openai.com/v1").replace(/\/$/,"");
  const ai=await fetch(base+"/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},signal:AbortSignal.timeout(20000),body:JSON.stringify({model:Deno.env.get("AI_MODEL")??"gpt-4o-mini",temperature:0.35,max_tokens:420,messages:[{role:"system",content:system+"\nCurrent location: "+area+", "+city+". Current live listings (the only food availability source): "+JSON.stringify(grounded)},{role:"system",content:"If the conversation mentions earlier food needs, use the prior messages below, but always check only the current live listings."},...conversationMessages]})});
  if(!ai.ok){console.error("AI provider failed",ai.status,(await ai.text()).slice(0,400));return json({error:"I could not reach the companion. Please try again."},502,origin);}
  const result=await ai.json(),reply=String(result.choices?.[0]?.message?.content??"").trim();
  if(!reply)return json({error:"I could not form a reply. Please try again."},502,origin);
  const {error:assistantMessageError}=await supabase.from("companion_messages").insert({conversation_id:conversationId,user_id:user.id,role:"assistant",content:reply,language});
  if(assistantMessageError)throw assistantMessageError;
  return json({reply,language,conversationId,matches:grounded},200,origin);
 }catch(error){console.error("food companion error",error);return json({error:"Something went wrong. Please try again."},500,origin);}
});
