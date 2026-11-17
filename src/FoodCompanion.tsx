import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Mic, Send, Volume2, X, LoaderCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { AppLanguage } from './lib/supabase';
import { createSpeechRecognition, speakText } from './lib/voice';

type Message={role:'user'|'assistant';content:string};
export default function FoodCompanion({location,userName}:{location:string;userName:string}){
 const [open,setOpen]=useState(false),[language,setLanguage]=useState<AppLanguage>(()=>(localStorage.getItem('foodie-language') as AppLanguage)||'ta');
 const [messages,setMessages]=useState<Message[]>([]),[text,setText]=useState(''),[busy,setBusy]=useState(false),[listening,setListening]=useState(false),[error,setError]=useState('');
 const [conversationId,setConversationId]=useState<string|null>(null);
 const recognition=useRef<ReturnType<typeof createSpeechRecognition>>(null);
 const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'});},[messages,busy]);
 useEffect(()=>()=>{recognition.current?.stop();window.speechSynthesis?.cancel();},[]);
 const changeLanguage=(v:AppLanguage)=>{setLanguage(v);localStorage.setItem('foodie-language',v);setError('');};
 const send=async(value=text)=>{
  const message=value.trim();if(!message||busy)return;
  if(!supabase){setError('FOODIE companion needs the Supabase connection first.');return;}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){setError('Please create an account or sign in to talk to your food companion.');return;}
  setMessages(m=>[...m,{role:'user',content:message}]);setText('');setBusy(true);setError('');
  const pieces=location.split(',').map(x=>x.trim()).filter(Boolean);
  const city=pieces.find(x=>/chennai/i.test(x))||'Chennai';
  const area=location.toLowerCase()===city.toLowerCase()?'':pieces[0]||'';
  const {data,error:invokeError}=await supabase.functions.invoke('food-companion',{body:{message,language,city,area,conversationId}});
  if(invokeError||data?.error){setError(data?.error||invokeError?.message||'Please try again.');}
  else{setMessages(m=>[...m,{role:'assistant',content:data.reply}]);setConversationId(data.conversationId||null);}
  setBusy(false);
 };
 const startVoice=()=>{
  if(listening){recognition.current?.stop();setListening(false);return;}
  const r=createSpeechRecognition(language);
  if(!r){setError('Voice input is not available in this browser. You can type instead.');return;}
  recognition.current=r;r.onresult=event=>{const result=event.results[event.resultIndex];if(result?.isFinal){setText(result[0].transcript);setListening(false);}};
  r.onerror=event=>{setListening(false);setError(event.error==='not-allowed'?'Allow microphone access to speak.':'Voice input could not start. Please type instead.');};
  r.onend=()=>setListening(false);
  try{r.start();setListening(true);setError('');}catch{setListening(false);setError('Voice input could not start.');}
 };
 return <div className="companion-root">
  {open&&<section className="companion-panel" aria-label="FOODIE food companion">
   <header className="companion-head"><div><span className="companion-kicker">FOODIE COMPANION</span><strong>Let’s find food together.</strong></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close companion"><X size={20}/></button></header>
   <div className="companion-language"><span>Talk in</span><select value={language} onChange={e=>changeLanguage(e.target.value as AppLanguage)} aria-label="Choose language"><option value="ta">தமிழ் · Tamil</option><option value="te">తెలుగు · Telugu</option><option value="en">English</option></select></div>
   <div className="companion-messages" aria-live="polite">
    {messages.length===0&&<div className="companion-welcome"><span>வணக்கம் · నమస్కారం</span><h3>What food do you need today?</h3><p>Tell me in your language. I’ll look through community food listings and help you find a collection option.</p><div className="companion-suggestions"><button onClick={()=>send('I need a meal for my family today')}>I need a meal</button><button onClick={()=>send('Show me available vegetables nearby')}>Find vegetables</button><button onClick={()=>send('I have extra food to share')}>I have extra food</button></div></div>}
    {messages.map((m,i)=><div className={'companion-message '+m.role} key={i}><p>{m.content}</p>{m.role==='assistant'&&<button className="companion-read" onClick={()=>speakText(m.content,language)}><Volume2 size={14}/> Listen</button>}</div>)}
    {busy&&<div className="companion-thinking"><LoaderCircle size={15}/> Checking available food…</div>}<div ref={end}/>
   </div>
   {error&&<p className="companion-error" role="alert">{error}</p>}
   <form className="companion-compose" onSubmit={e=>{e.preventDefault();void send();}}>
    <button type="button" className={listening?'is-listening':''} onClick={startVoice} aria-label={listening?'Stop voice input':'Speak'}><Mic size={19}/></button>
    <input value={text} onChange={e=>setText(e.target.value)} placeholder={language==='ta'?'உங்களுக்கு என்ன உணவு வேண்டும்?':language==='te'?'మీకు ఏ ఆహారం కావాలి?':'Tell me what you need…'} aria-label="Message your food companion"/>
    <button type="submit" disabled={!text.trim()||busy} aria-label="Send message"><Send size={18}/></button>
   </form>
   <p className="companion-footnote">Availability is based on live listings. Collection is coordinated with the donor.</p>
  </section>}
  <button type="button" className="companion-launch" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={open?'Close food companion':'Open food companion'}><MessageCircle size={21}/><span>{open?'Close':'Find food'}</span></button>
 </div>;
}
