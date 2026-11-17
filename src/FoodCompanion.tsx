import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mic, Send, Volume2, X, LoaderCircle, Square } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { AppLanguage } from './lib/supabase';
import { createSpeechRecognition, speakText } from './lib/voice';

type Message={role:'user'|'assistant';content:string};
export default function FoodCompanion({location,userName}:{location:string;userName:string}){
 const [open,setOpen]=useState(false);
 const [language,setLanguage]=useState<AppLanguage>(()=>(localStorage.getItem('foodie-language') as AppLanguage)||'ta');
 const [messages,setMessages]=useState<Message[]>([]);
 const [text,setText]=useState('');
 const [busy,setBusy]=useState(false);
 const [listening,setListening]=useState(false);
 const [error,setError]=useState('');
 const [conversationId,setConversationId]=useState<string|null>(null);
 const [autoSpeak,setAutoSpeak]=useState(true);
 const recognition=useRef<ReturnType<typeof createSpeechRecognition>>(null);
 const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'});},[messages,busy]);
 useEffect(()=>()=>{recognition.current?.stop();window.speechSynthesis?.cancel();},[]);
 useEffect(()=>{
  if(!open||!supabase)return;
  let active=true;
  const load=async()=>{
   const {data:{session}}=await supabase!.auth.getSession();
   if(!session){if(active){setMessages([]);setConversationId(null);}return;}
   const {data:conversations}=await supabase!.from('companion_conversations').select('id,language').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(1);
   const conversation=conversations?.[0];
   if(!conversation){if(active){setMessages([]);setConversationId(null);}return;}
   const {data:history}=await supabase!.from('companion_messages').select('role,content').eq('conversation_id',conversation.id).order('created_at',{ascending:true}).limit(40);
   if(active){setConversationId(conversation.id);setMessages((history||[]).map((m:any)=>({role:m.role,content:m.content})));setLanguage(conversation.language as AppLanguage);}
  };
  void load();
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(!session){setMessages([]);setConversationId(null);}else void load();});
  return()=>{active=false;subscription.unsubscribe();};
 },[open]);
 const changeLanguage=(v:AppLanguage)=>{setLanguage(v);localStorage.setItem('foodie-language',v);setError('');};
 const send=async(value=text)=>{
  const message=value.trim();if(!message||busy)return;
  if(!supabase){setError('FOODIE companion is not connected yet.');return;}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){setError(language==='ta'?'தொடர உள்நுழையவும்.':language==='te'?'కొనసాగించడానికి సైన్ ఇన్ చేయండి.':'Please sign in to talk to your food companion.');return;}
  setMessages(m=>[...m,{role:'user',content:message}]);setText('');setBusy(true);setError('');
  const parts=location.split(',').map(x=>x.trim()).filter(Boolean);
  const knownCity=parts.find(x=>/chennai|coimbatore|madurai|tiruchirappalli|salem|tirunelveli|vellore|erode|thanjavur|hyderabad|vijayawada|visakhapatnam|warangal|bengaluru|bangalore/i.test(x));
  const city=knownCity||(parts.length>1?parts[parts.length-1]:'Chennai');
  const area=parts.length>1?parts.find(x=>x.toLowerCase()!==city.toLowerCase()):(city.toLowerCase()===location.toLowerCase()?'':location);
  try{
   const {data,error:invokeError}=await supabase.functions.invoke('food-companion',{body:{message,language,city,area,conversationId}});
   if(invokeError||data?.error)throw new Error(data?.error||invokeError?.message||'Please try again.');
   setMessages(m=>[...m,{role:'assistant',content:data.reply}]);setConversationId(data.conversationId||null);
   if(autoSpeak)speakText(data.reply,language);
  }catch(e){setError(e instanceof Error?e.message:'The companion could not reply. Please try again.');}
  finally{setBusy(false);}
 };
 const startVoice=()=>{
  if(listening){recognition.current?.stop();setListening(false);return;}
  const r=createSpeechRecognition(language);
  if(!r){setError('Voice input is not available in this browser. Try Chrome on Android with the Tamil or Telugu speech pack installed.');return;}
  recognition.current=r;
  r.onresult=event=>{const result=event.results[event.resultIndex];if(result?.isFinal){const transcript=result[0].transcript;setText(transcript);setListening(false);void send(transcript);}};
  r.onerror=event=>{setListening(false);setError(event.error==='not-allowed'?'Allow microphone access to speak.':'Voice input could not start. Please type instead.');};
  r.onend=()=>setListening(false);
  try{r.start();setListening(true);setError('');}catch{setListening(false);setError('Voice input could not start.');}
 };
 const signedOut=userName==='Guest';
 return <div className="companion-root">
  {open&&<section className="companion-panel" aria-label="FOODIE food companion">
   <header className="companion-head"><div><span className="companion-kicker">FOODIE COMPANION</span><strong>{language==='ta'?'உணவைக் கண்டுபிடிப்போம்':language==='te'?'ఆహారం కలిసి వెతుకుదాం':'Let’s find food together.'}</strong></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close companion"><X size={20}/></button></header>
   <div className="companion-language"><span>{language==='ta'?'மொழி':language==='te'?'భాష':'Talk in'}</span><select value={language} onChange={e=>changeLanguage(e.target.value as AppLanguage)} aria-label="Choose language"><option value="ta">தமிழ் · Tamil</option><option value="te">తెలుగు · Telugu</option><option value="en">English</option></select><button type="button" className={autoSpeak?'is-listening':''} onClick={()=>setAutoSpeak(v=>!v)} aria-label={autoSpeak?'Turn off spoken replies':'Turn on spoken replies'} title={autoSpeak?'Spoken replies on':'Spoken replies off'}><Volume2 size={16}/></button></div>
   <div className="companion-messages" aria-live="polite">
    {messages.length===0&&<div className="companion-welcome"><span>வணக்கம் · నమస్కారం</span><h3>{language==='ta'?'இன்று உங்களுக்கு என்ன உணவு வேண்டும்?':language==='te'?'ఈ రోజు మీకు ఏ ఆహారం కావాలి?':'What food do you need today?'}</h3><p>{language==='ta'?'உங்கள் மொழியில் பேசுங்கள். அருகிலுள்ள உணவைத் தேடுகிறேன்.':language==='te'?'మీ భాషలో మాట్లాడండి. దగ్గరలోని ఆహారాన్ని వెతుకుతాను.':'Speak in your language. I’ll search live community food listings and help you find a collection option.'}</p><div className="companion-suggestions"><button onClick={()=>send(language==='ta'?'என் குடும்பத்திற்கு இன்று உணவு வேண்டும்':language==='te'?'ఈ రోజు నా కుటుంబానికి భోజనం కావాలి':'I need a meal for my family today')}>{language==='ta'?'உணவு வேண்டும்':language==='te'?'భోజనం కావాలి':'I need a meal'}</button><button onClick={()=>send(language==='ta'?'அருகில் காய்கறிகள் உள்ளதா?':language==='te'?'దగ్గరలో కూరగాయలు ఉన్నాయా?':'Show me available vegetables nearby')}>{language==='ta'?'காய்கறிகள்':language==='te'?'కూరగాయలు':'Find vegetables'}</button><button onClick={()=>send(language==='ta'?'என்னிடம் பகிர கூடுதல் உணவு உள்ளது':language==='te'?'నా దగ్గర పంచుకోవడానికి అదనపు ఆహారం ఉంది':'I have extra food to share')}>{language==='ta'?'உணவைப் பகிர':language==='te'?'ఆహారం పంచుకోవాలి':'Share extra food'}</button></div>{signedOut&&<p><Link to="/signin">Sign in</Link> to start a conversation.</p>}</div>}
    {messages.map((m,i)=><div className={'companion-message '+m.role} key={i}><p>{m.content}</p>{m.role==='assistant'&&<button className="companion-read" onClick={()=>speakText(m.content,language)}><Volume2 size={14}/> Listen</button>}</div>)}
    {busy&&<div className="companion-thinking"><LoaderCircle size={15}/> {language==='ta'?'உணவைத் தேடுகிறேன்…':language==='te'?'ఆహారం వెతుకుతున్నాను…':'Checking available food…'}</div>}<div ref={end}/>
   </div>
   {error&&<p className="companion-error" role="alert">{error}</p>}
   <form className="companion-compose" onSubmit={e=>{e.preventDefault();void send();}}>
    <button type="button" className={listening?'is-listening':''} onClick={startVoice} aria-label={listening?'Stop voice input':'Speak'}>{listening?<Square size={17}/>:<Mic size={19}/>}</button>
    <input value={text} onChange={e=>setText(e.target.value)} placeholder={language==='ta'?'உங்களுக்கு என்ன உணவு வேண்டும்?':language==='te'?'మీకు ఏ ఆహారం కావాలి?':'Tell me what you need…'} aria-label="Message your food companion" disabled={signedOut}/>
    <button type="submit" disabled={!text.trim()||busy||signedOut} aria-label="Send message"><Send size={18}/></button>
   </form>
   <p className="companion-footnote">{language==='ta'?'உணவு கிடைப்பது நேரடி பட்டியல்களைப் பொறுத்தது. சேகரிப்பை நன்கொடையாளருடன் உறுதி செய்யுங்கள்.':language==='te'?'ఆహారం ప్రత్యక్ష జాబితాల ఆధారంగా చూపబడుతుంది. సేకరణను దాతతో నిర్ధారించండి.':'Availability is based on live listings. Collection is coordinated with the donor.'}</p>
  </section>}
  <button type="button" className="companion-launch" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={open?'Close food companion':'Open food companion'}><MessageCircle size={21}/><span>{open?'Close':language==='ta'?'உணவு தேடு':language==='te'?'ఆహారం వెతుకు':'Find food'}</span></button>
 </div>;
}
