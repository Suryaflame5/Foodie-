import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import FoodCompanion from './FoodCompanion';
import { AboutPage, AssistantPage, ContactPage, FoodSafetyPage, OrganizationsPage, PrivacyPage, TermsPage } from './PublicPages';
import { discoverFood, getMyRequests, getIncomingRequests, getSavedIds, myFoodListings, publishFood, reserveFood, toggleSavedListing, cancelFoodRequest, updateIncomingRequest, removeFoodListing, updateProfile } from './lib/foodie';
import { emptyShowcase, loadShowcaseData, type ShowcaseData } from './lib/showcase';
import { ArrowDown, ArrowLeft, ArrowRight, Bookmark, Check, ChefHat, Clock3, Compass, Filter, Heart, Leaf, LocateFixed, LockKeyhole, Mail, MapPin, Menu, Minus, Plus, Search, Share2, SlidersHorizontal, Soup, Sprout, Store, Utensils, UserRound, X } from 'lucide-react';

type Food = { id:string; title:string; category:string; donor:string; donorType:string; qty:number; unit:string; deadline:string; pickupDeadline?:string; time:string; area:string; city:string; image:string; description:string; storage:string; diet:string; allergens?:string[]; preparedAt?:string|null; sample?:boolean; status?:string; };
const seed:Food[] = [
 {id:'f1',title:'Freshly baked sourdough loaves',category:'Bakery',donor:'The Flour House',donorType:'Bakery',qty:8,unit:'loaves',deadline:'Today, 7:00 PM',time:'4:00–7:00 PM',area:'Alwarpet',city:'Chennai',image:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85',description:'A small batch of naturally leavened sourdough, baked this morning. Still fresh and ready to be shared.',storage:'Keep in a cool, dry place.',diet:'Vegetarian',sample:true},
 {id:'f2',title:'Seasonal vegetable boxes',category:'Vegetables',donor:'Green Basket Market',donorType:'Supermarket',qty:12,unit:'boxes',deadline:'Today, 6:30 PM',time:'3:30–6:30 PM',area:'T. Nagar',city:'Chennai',image:'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=85',description:'A mix of seasonal vegetables from today’s market selection. Produce is fresh and sorted into family-sized boxes.',storage:'Refrigerate leafy greens after collection.',diet:'Vegetarian · Vegan',sample:true},
 {id:'f3',title:'Homestyle lemon rice meals',category:'Prepared meals',donor:'Annapoorna Community Kitchen',donorType:'Community kitchen',qty:16,unit:'portions',deadline:'Today, 5:30 PM',time:'4:30–5:30 PM',area:'Mylapore',city:'Chennai',image:'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=85',description:'Freshly prepared lemon rice portions packed for collection. Please bring a reusable container if possible.',storage:'Keep refrigerated if not eating promptly. Contains mustard.',diet:'Vegetarian',sample:true},
 {id:'f4',title:'Farm-fresh fruit selection',category:'Fruit',donor:'Sunday Harvest',donorType:'Individual',qty:6,unit:'bags',deadline:'Tomorrow, 11:00 AM',time:'9:00–11:00 AM',area:'Adyar',city:'Chennai',image:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=85',description:'A few extra bags of seasonal fruit from our weekly market run. A mix of bananas, oranges and guavas.',storage:'Wash before eating.',diet:'Vegetarian · Vegan',sample:true},
 {id:'f5',title:'Assorted pastry box',category:'Bakery',donor:'Crumb & Co.',donorType:'Bakery',qty:5,unit:'boxes',deadline:'Today, 8:00 PM',time:'6:00–8:00 PM',area:'Besant Nagar',city:'Chennai',image:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=85',description:'An assortment of pastries made today. Ingredients and allergen details can be confirmed with the donor at pickup.',storage:'Keep covered; best enjoyed today.',diet:'Vegetarian',sample:true},
 {id:'f6',title:'Garden greens & herbs',category:'Vegetables',donor:'Little Patch Garden',donorType:'Individual',qty:9,unit:'bundles',deadline:'Tomorrow, 9:00 AM',time:'7:00–9:00 AM',area:'Thiruvanmiyur',city:'Chennai',image:'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=1000&q=85',description:'Freshly harvested greens and herbs from a neighbourhood garden. Shared surplus, picked this afternoon.',storage:'Refrigerate in a breathable bag.',diet:'Vegetarian · Vegan'}
];
const read = <T,>(key:string,fallback:T):T => { try { const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch { return fallback; } };
const write = (key:string,value:unknown) => localStorage.setItem(key,JSON.stringify(value));
const categories = ['All food','Prepared meals','Vegetables','Bakery','Fruit','Packaged food'];
const moneyless = (n:number,u:string) => `${n} ${u} available`;
const AUTH_CONFIRM_URL = 'https://everkindhub.netlify.app/auth/confirm';

function Header({location,user,language,onLanguage}:{location:string;user:{name:string};language:'en'|'ta'|'te';onLanguage:(v:'en'|'ta'|'te')=>void}) {
 const [open,setOpen]=useState(false);
 const route=useLocation();
 const closeMenu=()=>setOpen(false);
 useEffect(()=>{setOpen(false);},[route.pathname]);
 useEffect(()=>{
  if(!open)return;
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  window.addEventListener('keydown',onKeyDown);
  return ()=>window.removeEventListener('keydown',onKeyDown);
 },[open]);
 const labels=language==='ta'?{explore:'உணவைத் தேடு',donate:'உணவைப் பகிர',how:'எப்படி செயல்படுகிறது',org:'அமைப்புகள்',saved:'சேமித்தவை',signin:'உள்நுழை'}:language==='te'?{explore:'ఆహారం వెతుకు',donate:'ఆహారం పంచు',how:'ఎలా పనిచేస్తుంది',org:'సంస్థలు',saved:'సేవ్ చేసినవి',signin:'లాగిన్'}:{explore:'Explore food',donate:'Donate food',how:'How it works',org:'Organizations',saved:'Saved',signin:'Sign in'};
 return <header className="topbar"><Link to="/" className="brand" onClick={closeMenu}><span className="brand-mark"><img src="/everkind-mark.svg" alt="" width="30" height="30" /></span><span className="brand-word">everkind</span></Link><button type="button" className={open?"mobile-nav-scrim is-visible":"mobile-nav-scrim"} aria-label="Close navigation menu" tabIndex={open?0:-1} onClick={closeMenu} aria-hidden={!open}/><nav id="foodie-mobile-navigation" className={open?"nav-links nav-open":"nav-links"} aria-label="Main navigation" aria-hidden={!open}><NavLink to="/explore" onClick={closeMenu}>{labels.explore}</NavLink><NavLink to="/donate" onClick={closeMenu}>{labels.donate}</NavLink><NavLink to="/organizations" onClick={closeMenu}>{labels.org}</NavLink><a href="/#how" onClick={closeMenu}>{labels.how}</a><NavLink to="/saved" onClick={closeMenu}>{labels.saved}</NavLink></nav><div className="header-right"><span className="location-chip"><MapPin size={14}/>{location}</span><select className="language-switch" aria-label="App language" value={language} onChange={e=>onLanguage(e.target.value as 'en'|'ta'|'te')}><option value="ta">தமிழ்</option><option value="te">తెలుగు</option><option value="en">EN</option></select><Link className="sign-link" to={user.name==='Guest'?'/signin':'/account'}>{user.name==='Guest'?labels.signin:user.name} <ArrowRight size={14}/></Link></div><button type="button" className="icon-btn menu-toggle" onClick={()=>setOpen(value=>!value)} aria-label={open?'Close navigation menu':'Open navigation menu'} aria-expanded={open} aria-controls="foodie-mobile-navigation">{open?<X size={23}/>:<Menu size={23}/>}</button></header>;
}
function BottomNav({language}:{language:'en'|'ta'|'te'}){const labels=language==='ta'?['தேடு','சேமிப்பு','பகிர்','கோரிக்கைகள்','கணக்கு']:language==='te'?['వెతుకు','సేవ్','పంచు','అభ్యర్థనలు','ఖాతా']:['Explore','Saved','Donate','Requests','Account'];return <nav className="bottom-nav"><NavLink to="/explore"><Compass/>{labels[0]}</NavLink><NavLink to="/saved"><Bookmark/>{labels[1]}</NavLink><NavLink className="bottom-donate" to="/donate"><Plus/>{labels[2]}</NavLink><NavLink to="/requests"><Clock3/>{labels[3]}</NavLink><NavLink to="/account"><Menu/>{labels[4]}</NavLink></nav>;}
function App(){
 const [location,setLocation]=useState(()=>localStorage.getItem('foodie-location')??'Chennai');
 const [foods,setFoods]=useState<Food[]>([]);
 const [hasMoreFoods,setHasMoreFoods]=useState(false);
 const [loadingMoreFoods,setLoadingMoreFoods]=useState(false);
 const [myDonations,setMyDonations]=useState<Food[]>([]);
 const [saved,setSaved]=useState<string[]>([]);
 const [requests,setRequests]=useState<any[]>([]);
 const [incomingRequests,setIncomingRequests]=useState<any[]>([]);
 const [user,setUser]=useState<{name:string;type:string;email?:string;language?:'en'|'ta'|'te'}>({name:'Guest',type:'Individual',language:(localStorage.getItem('foodie-language') as 'en'|'ta'|'te')||'ta'});
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('All food');
 const [toast,setToast]=useState('');
 const [loadingFoods,setLoadingFoods]=useState(true);
 const [authReady,setAuthReady]=useState(false);
 const [authenticated,setAuthenticated]=useState(false);
 const [showcase,setShowcase]=useState<ShowcaseData>(emptyShowcase);
 const route=useLocation();
 const isAuthRoute=route.pathname==='/signin'||route.pathname==='/signup';
 const isPublicAuthRoute=isAuthRoute||route.pathname==='/auth/confirm';
 const isPublicHome=route.pathname==='/';
 const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),3200);};
 const chooseLocation=(value:string)=>{setLocation(value);localStorage.setItem('foodie-location',value);};
 const refreshFoods=async()=>{try{const data=await discoverFood(location,query);setFoods(data as Food[]);setHasMoreFoods(data.length===20);}catch(e){notify(e instanceof Error?e.message:'Could not load food listings.');}finally{setLoadingFoods(false);}};
 const loadMoreFoods=async()=>{
  if(loadingMoreFoods||!hasMoreFoods||foods.length===0)return;
  const last=foods[foods.length-1];
  if(!last.pickupDeadline)return;
  setLoadingMoreFoods(true);
  try{
   const next=await discoverFood(location,query,{deadline:last.pickupDeadline,id:last.id});
   setFoods(current=>[...current,...next]);
   setHasMoreFoods(next.length===20);
  }catch(e){notify(e instanceof Error?e.message:'Could not load more food listings.');}
  finally{setLoadingMoreFoods(false);}
 };
 const refreshMemberData=async()=>{
  if(!supabase)return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.user){setSaved([]);setRequests([]);setIncomingRequests([]);setMyDonations([]);return;}
  try{
   const [ids,reqs,incoming,donations]=await Promise.all([getSavedIds(),getMyRequests(),getIncomingRequests(),myFoodListings()]);
   setSaved(ids);setRequests(reqs);setIncomingRequests(incoming);setMyDonations(donations as Food[]);
  }catch(e){notify(e instanceof Error?e.message:'Could not load your Everkind activity.');}
 };
 useEffect(()=>{let active=true;loadShowcaseData().then(data=>{if(active)setShowcase(data);}).catch(()=>{});return()=>{active=false;};},[]);
 useEffect(()=>{
  if(!supabase){setUser({name:'Guest',type:'Individual',language:(localStorage.getItem('foodie-language') as 'en'|'ta'|'te')||'ta'});setAuthenticated(false);setAuthReady(true);setLoadingFoods(false);return;}
  let alive=true;
  const load=async(session:any)=>{
   if(!session?.user){if(alive){setAuthenticated(false);setAuthReady(true);setUser({name:'Guest',type:'Individual',language:'ta'});setSaved([]);setRequests([]);setIncomingRequests([]);setMyDonations([]);}return;}
   if(alive){setAuthenticated(true);setAuthReady(true);}
   const {data,error}=await supabase!.from('profiles').select('full_name,role,preferred_language').eq('id',session.user.id).maybeSingle();
   if(!alive)return;
   if(error){setUser({name:session.user.user_metadata?.full_name||session.user.email?.split('@')[0]||'Member',type:'Individual',email:session.user.email,language:'ta'});notify('Your account profile could not be loaded.');return;}
   const role=data?.role;
   setUser({name:data?.full_name||session.user.user_metadata?.full_name||session.user.email?.split('@')[0]||'Member',type:role==='organisation'?'Organisation':'Individual',email:session.user.email,language:(data?.preferred_language||'ta') as 'en'|'ta'|'te'});
   void refreshMemberData();
  };
  supabase.auth.getSession().then(({data})=>load(data.session));
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{void load(session);});
  return()=>{alive=false;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!authReady||!authenticated){setLoadingFoods(false);setFoods([]);return;}
  let active=true;
  const timer=window.setTimeout(async()=>{
   setLoadingFoods(true);
   try{
    const data=await discoverFood(location,query);
    if(active){setFoods(data as Food[]);setHasMoreFoods(data.length===20);}
   }catch(e){
    if(active)notify(e instanceof Error?e.message:'Could not load food listings.');
   }finally{
    if(active)setLoadingFoods(false);
   }
  },query.trim()?300:0);
  return()=>{active=false;window.clearTimeout(timer);};
 },[location,query,authReady,authenticated]);
 const toggleSave=async(id:string)=>{
  const wasSaved=saved.includes(id);
  if(!supabase){notify('Food saving is unavailable until the backend is configured.');return;}
  try{await toggleSavedListing(id,wasSaved);setSaved(old=>wasSaved?old.filter(x=>x!==id):[...old,id]);notify(wasSaved?'Removed from saved food.':'Saved for later.');}
  catch(e){notify(e instanceof Error?e.message:'Could not update saved food.');}
 };
 const gps=()=>{if(!navigator.geolocation){notify('Location is not supported by this browser.');return;}navigator.geolocation.getCurrentPosition(p=>{const value=`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`;chooseLocation(value);notify('GPS captured. Enter your neighbourhood name to find nearby listings.');},()=>notify('Location permission was not granted. You can type your area or city instead.'),{timeout:9000,maximumAge:60000});};
 const addRequest=async(food:Food,qty:number)=>{
  if(!supabase){notify('Food reservations are unavailable.');return;}
  try{await reserveFood(food.id,qty);notify('Your food request has been sent to the donor.');await Promise.all([refreshFoods(),refreshMemberData()]);}
  catch(e){notify(e instanceof Error?e.message:'Could not reserve this food. Please refresh and try again.');}
 };
 const addFood=async(input:any)=>{
  try{
   const parts=location.split(',').map((x:string)=>x.trim()).filter(Boolean);
   const knownCity=parts.find((x:string)=>/chennai|coimbatore|madurai|tiruchirappalli|salem|tirunelveli|vellore|erode|thanjavur|hyderabad|vijayawada|visakhapatnam|warangal|bengaluru|bangalore/i.test(x));
   const city=knownCity||'Chennai';
   await updateProfile(input.donor,user.language||'ta',city,input.area,input.contact);
   await publishFood({...input,city});
   setUser(old=>({...old,name:input.donor}));
   notify('Your food listing is now live for the community.');
   await Promise.all([refreshFoods(),refreshMemberData()]);
  }catch(e){notify(e instanceof Error?e.message:'Your food could not be published.');throw e;}
 };
 const saveProfile=async(name:string,type:string,language:'en'|'ta'|'te')=>{
  try{await updateProfile(name,language);setUser(old=>({...old,name,type,language}));notify('Your profile has been updated.');}
  catch(e){notify(e instanceof Error?e.message:'Could not update your profile.');}
 };
 const changeLanguage=async(language:'en'|'ta'|'te')=>{
  setUser(old=>({...old,language}));localStorage.setItem('foodie-language',language);
  if(user.name!=='Guest'){try{await updateProfile(user.name,language);}catch(e){notify(e instanceof Error?e.message:'Could not save language preference.');}}
 };
 const filtered=useMemo(()=>foods.filter(f=>(category==='All food'||f.category===category)&&f.qty>0),[foods,category]);
 const completeAuth=(profile:{name:string;type:string;email:string})=>{setUser({...profile,language:'ta'});notify('Welcome to Everkind. Your account is connected.');void refreshMemberData();};
 return <>{authReady&&(authenticated&&!isPublicAuthRoute||!authenticated&&isPublicHome)&&<Header location={location} user={user} language={user.language||'ta'} onLanguage={changeLanguage}/>}{!authReady?<main className="auth-loading" role="status">Checking your session…</main>:!authenticated&&!isPublicAuthRoute&&!isPublicHome?<Navigate to="/signin" replace/>:authenticated&&isAuthRoute?<Navigate to="/account" replace/>:<Routes>
 <Route path="/auth/confirm" element={<EmailConfirmationPage/>}/>
 <Route path="/signin" element={<AuthPage mode="signin" onAuth={completeAuth}/>}/>
 <Route path="/signup" element={<AuthPage mode="signup" onAuth={completeAuth}/>}/>
 <Route path="/" element={<Home language={user.language||'ta'} authenticated={authenticated} foods={filtered} all={foods} query={query} setQuery={setQuery} category={category} setCategory={setCategory} toggleSave={toggleSave} saved={saved} gps={gps} location={location} setLocation={chooseLocation} allFoods={foods} showcase={showcase}/>}/>
 <Route path="/explore" element={<Explore language={user.language||'ta'} foods={filtered} query={query} setQuery={setQuery} category={category} setCategory={setCategory} saved={saved} toggleSave={toggleSave} location={location} setLocation={chooseLocation} gps={gps} allFoods={foods} hasMore={hasMoreFoods} loadingMore={loadingMoreFoods} loadMore={loadMoreFoods}/>}/>
 <Route path="/food/:id" element={<Details foods={foods} addRequest={addRequest} saved={saved} toggleSave={toggleSave}/>}/>
 <Route path="/donate" element={<Donate language={user.language||'ta'} addFood={addFood} location={location}/>}/>
 <Route path="/saved" element={<Saved foods={foods.filter(f=>saved.includes(f.id))} toggleSave={toggleSave}/>}/>
 <Route path="/requests" element={<Requests requests={requests} onCancel={async(id:string)=>{try{await cancelFoodRequest(id);notify('Request cancelled and quantity released.');await Promise.all([refreshFoods(),refreshMemberData()]);}catch(e){notify(e instanceof Error?e.message:'Could not cancel request.');}}}/>}/>
 <Route path="/donations" element={<Donations foods={myDonations} requests={incomingRequests} refresh={refreshMemberData} notify={notify} onStatus={async(id:string,status:'accepted'|'rejected'|'collected')=>{try{await updateIncomingRequest(id,status);notify(status==='collected'?'Collection marked complete.':status==='accepted'?'Request accepted. Contact details are now shared.':'Request declined and quantity released.');await Promise.all([refreshFoods(),refreshMemberData()]);}catch(e){notify(e instanceof Error?e.message:'Could not update request.');}}}/>}/>
 <Route path="/account" element={<Account user={user} saveProfile={saveProfile} notify={notify}/>}/>
 <Route path="/how" element={<How/>}/>
 <Route path="/organizations" element={<OrganizationsPage/>}/>
 <Route path="/food-safety" element={<FoodSafetyPage/>}/>
 <Route path="/about" element={<AboutPage/>}/>
 <Route path="/contact" element={<ContactPage/>}/>
 <Route path="/privacy" element={<PrivacyPage/>}/>
 <Route path="/terms" element={<TermsPage/>}/>
 <Route path="/assistant" element={<AssistantPage location={location} userName={user.name} preferredLanguage={user.language||'ta'}/>}/>
 <Route path="*" element={<main className="page narrow"><h1>That page wandered off.</h1><Link to="/">Back to food discovery <ArrowRight size={16}/></Link></main>}/>
 </Routes>}{authReady&&authenticated&&toast&&<div className="toast" role="status"><Check size={17}/>{toast}</div>}{authReady&&authenticated&&loadingFoods&&<span className="sr-only" aria-live="polite">Loading food listings</span>}{authReady&&authenticated&&route.pathname!=='/assistant'&&<FoodCompanion location={location} userName={user.name} preferredLanguage={user.language||'ta'}/> }{authReady&&authenticated&&!isPublicAuthRoute&&<footer className="footer"><Link to="/" className="brand"><span className="brand-mark"><img src="/everkind-mark.svg" alt="" width="30" height="30" /></span><span className="brand-word">everkind</span></Link><span>Good food deserves another chance.</span><span>© 2026 Everkind · Community food sharing</span><nav className="footer-links" aria-label="Footer"><Link to="/organizations">Organizations</Link><Link to="/food-safety">Food safety</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/assistant">Food companion</Link></nav></footer>}</>;
}

function FoodImage({src,alt,category,className}:{src:string;alt:string;category:string;className?:string}){
 const fallbacks:Record<string,string[]>={
  'Bakery':['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=85','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85'],
  'Vegetables':['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=85','https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=1000&q=85'],
  'Prepared meals':['https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85','https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=85'],
  'Fruit':['https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1000&q=85','https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=85'],
  'Packaged food':['https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1000&q=85','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85']
 };
 return <img className={className||''} src={src} alt={alt} loading="lazy" onError={e=>{const img=e.currentTarget;const attempts=fallbacks[category]||fallbacks['Prepared meals'];const index=Number(img.dataset.fallback||'0');if(index<attempts.length){img.dataset.fallback=String(index+1);img.src=attempts[index];}else{img.style.opacity='0';}}}/>;
}

function EmailConfirmationPage(){
 const navigate=useNavigate();const confirmationPromise=useRef<Promise<string>|null>(null);
 const [status,setStatus]=useState<'checking'|'success'|'error'>('checking');
 const [message,setMessage]=useState('Confirming your Everkind account…');
 useEffect(()=>{
  let active=true;
  const complete=async():Promise<string>=>{
   if(!supabase)throw new Error('Everkind authentication is temporarily unavailable.');
   const url=new URL(window.location.href),params=url.searchParams,hashParams=new URLSearchParams(url.hash.replace(/^#/,''));
   const callbackError=params.get('error_description')||hashParams.get('error_description')||params.get('error')||hashParams.get('error');
   if(callbackError)throw new Error(callbackError.replace(/\+/g,' '));
   const code=params.get('code'),tokenHash=params.get('token_hash'),type=params.get('type');
   if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error)throw error;}
   else if(tokenHash&&(type==='email'||type==='signup')){const {error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type:type as 'email'|'signup'});if(error)throw error;}
   // The default Supabase ConfirmationURL verifies first and returns session
   // tokens in the URL fragment; detectSessionInUrl processes that callback.
   const {data:{session},error:sessionError}=await supabase.auth.getSession();
   if(sessionError)throw sessionError;
   if(!session)throw new Error('The link returned without a verified session. Open the newest confirmation email on this device, or request a fresh link.');
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!user?.email_confirmed_at)throw new Error('Supabase has not marked this email address as confirmed yet. Please use the newest confirmation email.');
   return 'Your email is confirmed. Welcome to Everkind!';
  };
  if(!confirmationPromise.current)confirmationPromise.current=complete();
  confirmationPromise.current.then(successMessage=>{if(active){setStatus('success');setMessage(successMessage);window.setTimeout(()=>navigate('/account',{replace:true}),1200);}})
   .catch(err=>{if(active){setStatus('error');setMessage(err instanceof Error?err.message:'We could not complete email confirmation. Please request a new link.');}});
  return()=>{active=false;};
 },[navigate]);
 return <main className="page page-content narrow" style={{minHeight:'65vh',display:'grid',placeItems:'center',textAlign:'center'}}><section style={{maxWidth:520}}>
  <div className="eyebrow">EVERKIND · ACCOUNT CONFIRMATION</div>
  <h1>{status==='success'?'You’re all set.':status==='error'?'We couldn’t confirm your email.':'Confirming your email…'}</h1><p className="page-intro">{message}</p>
  {status==='success'&&<p>Your email address is verified. You can now use your Everkind account.</p>}
  {status==='error'&&<div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}><Link className="btn btn-dark" to="/signin">Go to sign in <ArrowRight size={16}/></Link><Link className="btn btn-outline" to="/signup">Back to sign up</Link></div>}
  {status==='checking'&&<p>Please keep this page open for a moment.</p>}
 </section></main>;
}
function AuthPage({mode,onAuth}:{mode:'signin'|'signup';onAuth:(profile:{name:string;type:string;email:string})=>void}){
 const navigate=useNavigate();const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [type,setType]=useState('Individual');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [pendingConfirmation,setPendingConfirmation]=useState(false);const signup=mode==='signup';
 const submit=async(e:any)=>{e.preventDefault();setError('');if(!supabase){setError('Everkind authentication is not configured. Please try again later.');return;}if(signup&&!name.trim()){setError('Please enter your name.');return;}if(password.length<8){setError('Use at least 8 characters.');return;}setBusy(true);
  try{const cleanEmail=email.trim().toLowerCase();const result=signup
   ? await supabase.auth.signUp({email:cleanEmail,password,options:{emailRedirectTo:AUTH_CONFIRM_URL,data:{full_name:name.trim(),preferred_language:'ta',account_type:type==='Organisation'?'organisation':'individual'}}})
   : await supabase.auth.signInWithPassword({email:cleanEmail,password});
   if(result.error){const authError=result.error as Error&{status?:number;code?:string};if(signup&&(authError.code==='over_email_send_rate_limit'||authError.status===429||authError.message.toLowerCase().includes('email rate limit'))){setPendingConfirmation(true);setError('Supabase’s built-in email sender has reached its project-wide limit (2 emails per hour). No confirmation email was sent. Please wait for the limit to reset, then try this same email again. To accept signups reliably, the project needs an SMTP email provider.');return;}throw result.error;}
   if(signup&&!result.data.session){setPendingConfirmation(true);setError('We sent a fresh confirmation email. Open it to finish creating your account.');return;}
   const profile={name:signup?name.trim():(result.data.user?.user_metadata?.full_name||cleanEmail.split('@')[0]),type,email:cleanEmail};onAuth(profile);navigate('/account');
  }catch(err){setError(err instanceof Error?err.message:'Authentication failed. Please try again.');}finally{setBusy(false);}
 };
 const resendConfirmation=async()=>{
  if(!supabase||!email.trim())return;
  setBusy(true);setError('');
  try{
   const {error}=await supabase.auth.resend({type:'signup',email:email.trim().toLowerCase(),options:{emailRedirectTo:AUTH_CONFIRM_URL}});
   if(error){const authError=error as Error&{status?:number;code?:string};if(authError.code==='over_email_send_rate_limit'||authError.status===429||authError.message.toLowerCase().includes('email rate limit'))throw new Error('Email sending is temporarily rate-limited by Supabase (2 emails per hour project-wide). Wait for the limit to reset; repeated resend attempts will not help.');throw error;}
   setError('A new confirmation email has been sent. Check your inbox and spam folder.');
  }catch(err){setError(err instanceof Error?err.message:'Could not resend the confirmation email. Please wait a moment and try again.');}
  finally{setBusy(false);}
 };
 return <main className="auth-shell page"><section className="auth-art"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="A freshly prepared meal made to be shared"/><div className="auth-art-shade"/><Link to="/" className="auth-art-brand"><span className="brand-mark"><img src="/everkind-mark.svg" alt="" width="30" height="30" /></span><span className="brand-word">everkind</span></Link><div className="auth-art-copy"><span className="auth-kicker">A NEIGHBOURHOOD PANTRY</span><h2>Good food<br/><em>brings us</em><br/>closer.</h2><p>Find your people. Share what you can. Give good food another chance.</p><div className="auth-art-foot"><span>SHARE MORE. WASTE LESS.</span><span>01 / COMMUNITY</span></div></div></section>
 <section className="auth-side"><div className="auth-topline"><span>COMMUNITY, ONE MEAL AT A TIME</span><Link to="/">Back to home <ArrowRight size={14}/></Link></div><div className="auth-card"><div className="eyebrow"><span className="eyebrow-line"/>{signup?'YOUR PLACE AT THE TABLE':'WELCOME BACK'}</div><h1>{signup?<>Make room for <em>good.</em></>:<>Good to have you <em>back.</em></>}</h1><p className="auth-intro">{signup?'Create your Everkind profile and join a neighbourhood sharing something better.':'Sign in to keep your saved food, requests and community activity together.'}</p>
 <form className="auth-form" onSubmit={submit}>{signup&&<label>Your name<div className="auth-input"><UserRound size={17}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="How should we call you?" autoComplete="name" required/></div></label>}<label>Email address<div className="auth-input"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label><label>Password<div className="auth-input"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={signup?'new-password':'current-password'} minLength={8} required/></div></label>{signup&&<label>I’m joining as<select className="auth-role" value={type} onChange={e=>setType(e.target.value)}><option>Individual</option><option>Organisation</option></select></label>}{error&&<p className="auth-error" role="alert">{error}</p>}{pendingConfirmation&&signup&&<button type="button" className="text-link" onClick={()=>void resendConfirmation()} disabled={busy}>{busy?'Sending…':'Resend confirmation email'}</button>}<button className="btn btn-dark full-btn auth-submit" type="submit" disabled={busy}>{busy?'Please wait…':signup?'Create account':'Sign in'} <ArrowRight size={16}/></button></form><div className="auth-switch">{signup?'Already part of Everkind?':'New to Everkind?'} <Link to={signup?'/signin':'/signup'}>{signup?'Sign in':'Create an account'} <ArrowRight size={14}/></Link></div><p className="auth-disclaimer">Your account is secured by Supabase Auth. Everkind never stores your password in the app.</p></div><div className="auth-side-foot"><span>GOOD FOOD DESERVES ANOTHER CHANCE.</span><span>Everkind © 2026</span></div></section></main>;
}
function LocationPicker({location,setLocation,gps,foods}:{location:string;setLocation:(s:string)=>void;gps:()=>void;foods:Food[]}){
 const options=Array.from(new Set(foods.flatMap(f=>[f.area,f.city,f.area+', '+f.city]))).sort();
 return <div className="location-control"><MapPin size={16}/><input aria-label="Search by area or city" list="foodie-location-options" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Enter area, city or postcode"/><datalist id="foodie-location-options">{options.map(option=><option key={option} value={option}/>)}</datalist>{location&&<button type="button" onClick={()=>setLocation('')} title="Clear location" aria-label="Clear location"><X size={15}/></button>}<button type="button" onClick={gps} title="Use my current GPS location" aria-label="Use my current location"><LocateFixed size={16}/></button></div>;
}
function CategoryBar({category,setCategory}:{category:string;setCategory:(s:string)=>void}){return <div className="category-row" aria-label="Food categories">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={category===c?'category active':'category'}>{c}</button>)}</div>;}
function FoodCard({food,saved,toggleSave}:{food:Food;saved:boolean;toggleSave:(id:string)=>void}){
 return <article className="food-card"><Link to={`/food/${food.id}`} className="food-image-wrap"><FoodImage src={food.image} alt={food.title} category={food.category}/><span className="image-category">{food.category}</span>{food.sample&&<span className="demo-chip">DEMO</span>}</Link><button className={saved?'save-btn saved':'save-btn'} aria-label={saved?'Remove saved listing':'Save listing'} onClick={()=>toggleSave(food.id)}><Bookmark size={17} fill={saved?'currentColor':'none'}/></button><div className="food-card-body"><div className="food-card-title"><Link to={`/food/${food.id}`}>{food.title}</Link><span className="qty">{food.qty} {food.unit}</span></div><div className="donor-line"><span className="donor-dot"><Store size={13}/></span>{food.donor}<span className="donor-type">{food.donorType}</span></div><div className="food-meta"><span><MapPin size={13}/>{food.area}</span><span><Clock3 size={13}/>{food.deadline}</span></div><Link to={`/food/${food.id}`} className="card-action">View food <ArrowUpRightIcon/></Link></div></article>;
}
function ArrowUpRightIcon(){return <ArrowRight size={16}/>;}
function ShowcaseSection({data}:{data:ShowcaseData}){
 if(!data||(!data.locations.length&&!data.donors.length&&!data.recipients.length))return null;
 const mealPortions=data.locations.filter(item=>item.unit==='portions').reduce((total,item)=>total+Number(item.quantity||0),0);
 const metrics=[
  {value:data.locations.length,label:'demo food listings'},
  {value:mealPortions,label:'meal portions listed'},
  {value:data.donors.length,label:'sample donors'},
  {value:data.recipients.length,label:'recipient groups'}
 ];
 const points=data.locations.map(point=>({
  ...point,
  x:36+((point.longitude-80.20)/(80.29-80.20))*520,
  y:28+((13.09-point.latitude)/(13.09-12.95))*270
 }));
 const actionLabel:Record<string,string>={shared:'SHARED',requested:'SAMPLE REQUEST',matched:'SAMPLE MATCH',collected:'SIMULATED PICKUP'};
 return <section className="showcase page">
  <div className="showcase-heading">
   <div><div className="eyebrow"><span className="eyebrow-line"/> THE COMMUNITY, IN ONE VIEW</div><h2>A neighbourhood <em>in motion.</em></h2><p>Explore how surplus food could move between local donors and community groups.</p></div>
   <span className="showcase-stamp">DEMO ENVIRONMENT · CHENNAI</span>
  </div>
  <div className="showcase-metrics">{metrics.map(metric=><div className="showcase-metric" key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>
  <div className="showcase-grid">
   <section className="showcase-panel showcase-map-panel">
    <div className="showcase-panel-head"><div><span className="showcase-kicker">01 / PICKUP AREAS</span><h3>Chennai, at a glance</h3></div><span className="showcase-mini-tag">SCHEMATIC MAP</span></div>
    <div className="showcase-map">
     <svg viewBox="0 0 600 330" role="img" aria-label="Illustrative map of sample Everkind pickup areas in Chennai">
      <path className="map-road map-road-major" d="M18 250 C110 190 130 150 210 165 S345 240 410 170 S520 80 585 92"/>
      <path className="map-road" d="M40 40 C100 90 145 80 190 110 S260 200 315 190 S420 115 560 140"/>
      <path className="map-road" d="M70 310 C110 250 180 250 220 215 S320 130 350 70"/>
      <path className="map-road" d="M150 15 C180 85 250 90 280 145 S340 255 390 315"/>
      <path className="map-road" d="M450 12 C420 80 470 130 455 190 S500 260 570 300"/>
      <path className="map-road" d="M15 130 C130 120 180 135 260 115 S420 35 585 42"/>
      <path className="map-road" d="M30 290 C180 275 250 295 350 265 S475 220 580 240"/>
      {points.map(point=><g key={point.id} className="map-point"><circle cx={point.x} cy={point.y} r="12"/><circle cx={point.x} cy={point.y} r="4"/><title>{point.area}: {point.title}</title></g>)}
      <text x="24" y="22" className="map-water-label">CHENNAI · SHOWCASE LOCATIONS</text>
      <text x="410" y="316" className="map-water-label">ILLUSTRATIVE ONLY</text>
     </svg>
    </div>
    <p className="showcase-footnote">Pins use sample listing coordinates. This is a visual demo map, not live navigation or distance routing.</p>
   </section>

  </div>
  <div className="showcase-community">
   <div className="showcase-community-column"><div className="showcase-panel-head"><div><span className="showcase-kicker">03 / FOOD DONORS</span><h3>People sharing surplus</h3></div><span className="showcase-mini-tag">SAMPLE PROFILES</span></div>
    <div className="showcase-org-list">{data.donors.slice(0,5).map(org=><article className="showcase-org" key={org.id}><span className="showcase-org-mark"><Store size={16}/></span><div><strong>{org.display_name}</strong><small>{org.category} · {org.area}</small></div></article>)}</div>
   </div>
   <div className="showcase-community-column"><div className="showcase-panel-head"><div><span className="showcase-kicker">04 / RECIPIENT GROUPS</span><h3>Community connections</h3></div><span className="showcase-mini-tag">SAMPLE PROFILES</span></div>
    <div className="showcase-org-list">{data.recipients.slice(0,5).map(org=><article className="showcase-org" key={org.id}><span className="showcase-org-mark recipient"><Heart size={16}/></span><div><strong>{org.display_name}</strong><small>{org.category} · {org.area}</small></div></article>)}</div>
   </div>
  </div>
  <div className="showcase-disclaimer">All names, profiles and map pins shown here are illustrative demo data—not verified partners or real requests.</div>
 </section>;
}
function Home({language,authenticated,foods,all,query,setQuery,category,setCategory,toggleSave,saved,gps,location,setLocation,showcase}:any){
 return <main><section className="hero page"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> A LITTLE LESS WASTE. A LOT MORE GOOD.</div><h1>{language==='ta'?<>நல்ல உணவுக்கு<br/><em>இன்னொரு வாய்ப்பு.</em></>:language==='te'?<>మంచి ఆహారానికి<br/><em>మరో అవకాశం.</em></>:<>Good food deserves<br/><em>another chance.</em></>}</h1><p className="hero-description">{language==='ta'?'உங்கள் பகுதியில் பகிரப்படும் கூடுதல் உணவைக் கண்டறியுங்கள். உணவு வீணாகாமல் பெறுங்கள்.':language==='te'?'మీ పరిసరాల్లో పంచుకునే అదనపు ఆహారాన్ని కనుగొనండి. ఆహారం వృథా కాకుండా పొందండి.':'Discover surplus food shared by people and places around your neighbourhood. Rescue something lovely before it goes to waste.'}</p><div className="hero-actions"><Link to="/explore" className="btn btn-dark">{language==='ta'?'அருகில் உணவு தேடு':language==='te'?'దగ్గరలో ఆహారం వెతుకు':'Find food nearby'} <ArrowRight size={17}/></Link><Link to="/donate" className="text-link">{language==='ta'?'என்னிடம் பகிர உணவு உள்ளது':language==='te'?'నా దగ్గర పంచుకునే ఆహారం ఉంది':'I have food to share'} <ArrowRight size={15}/></Link><Link to="/organizations" className="text-link">{language==='ta'?'நாங்கள் ஒரு அமைப்பு':language==='te'?'మేము ఒక సంస్థ':'Join as an organisation'} <ArrowRight size={15}/></Link>{!authenticated&&<Link to="/signin" className="btn btn-outline hero-signin">{language==='ta'?'உள்நுழை':language==='te'?'లాగిన్':'Sign in'} <ArrowRight size={16}/></Link>}</div><div className="hero-note"><span className="note-icon"><Heart size={15}/></span> A neighbourhood effort, one good meal at a time.</div></div><div className="hero-visual"><img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=90" alt="A colourful table of fresh vegetables and wholesome food"/><div className="image-caption"><span>GOOD FOOD, SHARED WELL</span><span>01 / COMMUNITY</span></div><div className="hero-stamp"><Sprout size={23}/><span>Share<br/>the good.</span></div></div></section>
 <section className="discovery page"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> THE GOOD STUFF, CLOSE BY</div><h2>Available near you<span className="green-period">.</span></h2><p>Find something worth rescuing in your corner of the city.</p></div><Link to="/explore" className="text-link desktop-link">Explore all food <ArrowRight size={16}/></Link></div>
 <div className="discovery-tools"><div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search food, category or donor…"/></div><LocationPicker location={location} setLocation={setLocation} gps={gps} foods={all}/></div>
 <CategoryBar category={category} setCategory={setCategory}/><div className="food-grid">{foods.slice(0,4).map((f:Food)=><FoodCard key={f.id} food={f} saved={saved.includes(f.id)} toggleSave={toggleSave}/>)}</div>{foods.length===0&&<Empty title="Nothing on the table just yet" body="Try another category or search. New surplus food can appear at any time."/>}<div className="mobile-see-all"><Link to="/explore" className="btn btn-outline">See all available food <ArrowRight size={16}/></Link></div></section>
 <section className="share-strip page" id="how"><div className="share-mark"><Sprout size={28}/></div><div><div className="eyebrow">GOOD FOOD SHOULD GO SOMEWHERE GOOD</div><h2>Have a little extra?<br/><em>Pass it on.</em></h2><p>From a few garden tomatoes to a tray of untouched meals, your surplus can make someone's day.</p><Link to="/donate" className="btn btn-light">Share surplus food <ArrowRight size={16}/></Link></div><div className="share-image"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85" alt="Freshly prepared shared food"/></div></section>
 <ShowcaseSection data={showcase}/><How compact/></main>;
}
function Explore({language,foods,query,setQuery,category,setCategory,saved,toggleSave,location,setLocation,gps,allFoods,hasMore,loadingMore,loadMore}:any){const [sort,setSort]=useState('deadline');const [layout,setLayout]=useState('grid');const [onlyVeg,setOnlyVeg]=useState(false);const [showFilters,setShowFilters]=useState(false);const visible=[...foods].filter((f:Food)=>!onlyVeg||f.diet.toLowerCase().includes('vegetarian')).sort((a:Food,b:Food)=>sort==='quantity'?b.qty-a.qty:a.deadline.localeCompare(b.deadline));return <main className="page page-content"><div className="eyebrow"><span className="eyebrow-line"/> THE NEIGHBOURHOOD PANTRY</div><div className="page-title-row"><div><h1>{language==='ta'?<>உணவை <em>தேடுங்கள்.</em></>:language==='te'?<>ఆహారాన్ని <em>వెతకండి.</em></>:<>Explore <em>food.</em></>}</h1><p>{language==='ta'?'உங்கள் அருகில் பகிரப்படும் உணவைக் கண்டறியுங்கள்.':language==='te'?'మీ దగ్గర పంచుకునే ఆహారాన్ని కనుగొనండి.':'Good things are being shared around you.'}</p></div><span className="result-count">{visible.length} listings</span></div><div className="explore-toolbar"><div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Food, category or donor"/></div><LocationPicker location={location} setLocation={setLocation} gps={gps} foods={allFoods}/><button className="btn btn-outline filter-toggle" onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={16}/> Filters</button><select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}><option value="deadline">Sort: pickup deadline</option><option value="quantity">Sort: quantity</option></select><div className="view-toggle"><button onClick={()=>setLayout('grid')} className={layout==='grid'?'chosen':''}>Grid</button><button onClick={()=>setLayout('list')} className={layout==='list'?'chosen':''}>List</button></div></div><div className="explore-layout"><aside className={showFilters?'filter-panel filter-open':'filter-panel'}><div className="filter-heading">Refine your search <button className="icon-btn" onClick={()=>setShowFilters(false)}><X size={17}/></button></div><p className="filter-label">CATEGORY</p><CategoryBar category={category} setCategory={setCategory}/><p className="filter-label">PREFERENCES</p><label className="check-row"><input type="checkbox" checked={onlyVeg} onChange={e=>setOnlyVeg(e.target.checked)}/> Vegetarian options</label><p className="filter-note">Listings are filtered by the area and city you enter. GPS coordinates can be detected, but automatic place-name lookup and live distance calculation are not connected.</p><button className="text-link" onClick={()=>{setCategory('All food');setOnlyVeg(false);setQuery('');}}>Clear filters</button></aside><div className={layout==='grid'?'food-grid explore-grid':'food-grid list-layout'}>{visible.map((f:Food)=><FoodCard key={f.id} food={f} saved={saved.includes(f.id)} toggleSave={toggleSave}/>)}</div></div>{visible.length===0&&<Empty title="No matches this time" body="Try clearing a filter or searching for something else."/>}{hasMore&&<div className="mobile-see-all"><button className="btn btn-outline" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore?'Loading…':'Load more listings'} <ArrowDown size={16}/></button></div>}</main>;}
function Details({foods,addRequest,saved,toggleSave}:any){
 const {id}=useParams();const food=foods.find((f:Food)=>f.id===id);const [qty,setQty]=useState(1);const [confirm,setConfirm]=useState(false);const [busy,setBusy]=useState(false);
 if(!food)return <main className="page page-content"><Empty title="This food has found another home" body="The listing may have been removed or collected."/><Link to="/explore" className="text-link">Back to explore</Link></main>;
 return <main className="page page-content"><Link to="/explore" className="back-link"><ArrowLeft size={16}/> Back to explore</Link><div className="detail-layout"><div className="detail-photo"><FoodImage src={food.image} alt={food.title} category={food.category}/><span className="image-category">{food.category}</span></div><div className="detail-copy"><div className="eyebrow">A NEIGHBOURHOOD SHARE · {food.sample?"SHOWCASE LISTING":"LIVE LISTING"}</div><h1>{food.title}</h1><p className="detail-donor">Shared by <strong>{food.donor}</strong> · {food.donorType}</p><p className="detail-description">{food.description}</p><div className="detail-facts"><div><span>AVAILABLE</span><strong>{moneyless(food.qty,food.unit)}</strong></div><div><span>COLLECT BY</span><strong>{food.deadline}</strong></div><div><span>COLLECTION WINDOW</span><strong>{food.time}</strong></div><div><span>AREA</span><strong>{food.area}, {food.city}</strong></div><div><span>FOOD NOTES</span><strong>{food.storage||'Ask the donor'}</strong></div><div><span>DIETARY</span><strong>{food.diet}</strong></div><div><span>KNOWN ALLERGENS</span><strong>{food.allergens?.length?food.allergens.join(', '):'Not specified — ask donor'}</strong></div>{food.preparedAt&&<div><span>PREPARED</span><strong>{new Date(food.preparedAt).toLocaleString()}</strong></div>}</div><div className="claim-box"><div><strong>How much would you like?</strong><span>{food.qty} {food.unit} currently available</span></div><div className="quantity-control"><button onClick={()=>setQty(Math.max(1,qty-1))} aria-label="Decrease quantity"><Minus size={16}/></button><strong>{qty}</strong><button onClick={()=>setQty(Math.min(food.qty,qty+1))} aria-label="Increase quantity" disabled={qty>=food.qty}><Plus size={16}/></button></div><button className="btn btn-dark full-btn" disabled={food.sample} onClick={()=>setConfirm(true)}>{food.sample?"Showcase only · requests disabled":"Request this food"} {!food.sample&&<ArrowRight size={16}/>}</button>{food.sample&&<p className="demo-notice">This is illustrative showcase data, not a verified live offer. Reservations are disabled for demo listings.</p>}<button className="save-inline" onClick={()=>toggleSave(food.id)}><Bookmark size={16} fill={saved.includes(food.id)?'currentColor':'none'}/>{saved.includes(food.id)?'Saved for later':'Save for later'}</button><p className="demo-notice">Your request reserves the selected quantity. The donor can accept or reject it; arrange a safe collection directly.</p></div></div></div>
 {confirm&&<div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={()=>setConfirm(false)}><X/></button><div className="modal-icon"><Check/></div><h2>Send this food request?</h2><p>You're requesting {qty} {food.unit} of {food.title}.</p><p className="demo-notice">The quantity will be reserved while the donor responds.</p><button className="btn btn-dark full-btn" disabled={busy} onClick={async()=>{setBusy(true);await addRequest(food,qty);setBusy(false);setConfirm(false);}}>{busy?'Sending…':'Confirm request'} <ArrowRight size={16}/></button><button className="text-link modal-cancel" onClick={()=>setConfirm(false)}>Not yet</button></div></div>}</main>;
}
function Donate({addFood,location,language}:any){
 const [imageFile,setImageFile]=useState<File|null>(null);const [imagePreview,setImagePreview]=useState('');const [busy,setBusy]=useState(false);
 const [form,setForm]=useState({title:'',category:'Prepared meals',description:'',qty:'',unit:'portions',donor:'',donorType:'Individual',area:'',deadline:'',preparedAt:'',pickupInstructions:'',storage:'',diet:'Vegetarian',allergenInfo:'',contact:'',safe:false});
 const [errors,setErrors]=useState<string[]>([]);const update=(k:string,v:any)=>setForm(f=>({...f,[k]:v}));
 const submit=async(e:any)=>{e.preventDefault();const err:string[]=[];if(!form.title.trim())err.push('Add a food name.');if(!form.qty||Number(form.qty)<1)err.push('Enter a quantity greater than zero.');if(!form.donor.trim())err.push('Add your name or organisation.');if(!form.area.trim())err.push('Add a collection area.');if(!form.deadline||new Date(form.deadline)<=new Date())err.push('Choose a future collection deadline.');if(!form.contact.trim())err.push('Add contact information for your account.');if(!form.safe)err.push('Confirm the food safety declaration.');setErrors(err);if(err.length)return;setBusy(true);
 try{await addFood({title:form.title,category:form.category,description:form.description,quantity:Number(form.qty),unit:form.unit,area:form.area,deadline:new Date(form.deadline).toISOString(),preparedAt:form.preparedAt?new Date(form.preparedAt).toISOString():'',pickupInstructions:form.pickupInstructions||'Contact donor to arrange collection',storage:form.storage,diet:form.diet,donorType:form.donorType,allergenInfo:form.allergenInfo,imageFile,donor:form.donor,contact:form.contact});setForm({title:'',category:'Prepared meals',description:'',qty:'',unit:'portions',donor:'',donorType:'Individual',area:'',deadline:'',preparedAt:'',pickupInstructions:'',storage:'',diet:'Vegetarian',allergenInfo:'',contact:'',safe:false});setImageFile(null);setImagePreview('');setErrors([]);}
 catch(e){setErrors([e instanceof Error?e.message:'Could not publish your listing.']);}finally{setBusy(false);}
 };
 return <main className="page page-content"><div className="eyebrow"><span className="eyebrow-line"/> MAKE ROOM FOR GOOD</div><div className="page-title-row"><div><h1>{language==='ta'?<>உங்களிடம் உள்ளதை <em>பகிருங்கள்.</em></>:language==='te'?<>మీ దగ్గర ఉన్నది <em>పంచండి.</em></>:<>Share what you <em>have.</em></>}</h1><p>{language==='ta'?'சிறிதளவு கூடுதல் உணவும் ஒருவருக்கு உதவும்.':language==='te'?'కొంచెం అదనపు ఆహారం కూడా ఎవరికో ఉపయోగపడుతుంది.':'A little extra food can go a long way.'}</p></div></div><form className="donate-layout" onSubmit={submit}><div className="form-main">
 <section className="form-section"><h2>Tell us about the food</h2><p>Give your listing a clear, useful description.</p><label>Food name *<input value={form.title} onChange={e=>update('title',e.target.value)} placeholder="e.g. Fresh vegetable lunch boxes" required/></label><div className="form-two"><label>Category *<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>Dietary type<select value={form.diet} onChange={e=>update('diet',e.target.value)}><option>Vegetarian</option><option>Vegetarian · Vegan</option><option>Non-vegetarian</option><option>Not specified</option></select></label></div><label>Description<textarea rows={4} value={form.description} onChange={e=>update('description',e.target.value)} placeholder="What is it? When was it prepared? Anything people should know?"/></label><label>Known allergens / ingredients<input value={form.allergenInfo} onChange={e=>update('allergenInfo',e.target.value)} placeholder="Comma-separated, e.g. peanuts, milk, wheat"/></label><div className="upload-area"><label className="upload-label"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file){setImageFile(file);setImagePreview(URL.createObjectURL(file));}}}/><span className="upload-icon">＋</span><strong>Add a food photograph</strong><small>JPG, PNG or WebP · up to 5 MB</small></label>{imagePreview&&<img className="upload-preview" src={imagePreview} alt="Food preview"/>}</div></section>
 <section className="form-section"><h2>Quantity & collection</h2><p>Be clear about how much is available and when it can be collected.</p><div className="form-two"><label>Quantity *<input type="number" min="1" max="100000" value={form.qty} onChange={e=>update('qty',e.target.value)} placeholder="e.g. 12" required/></label><label>Unit<select value={form.unit} onChange={e=>update('unit',e.target.value)}><option>portions</option><option>boxes</option><option>bags</option><option>loaves</option><option>kg</option><option>items</option></select></label></div><label>Prepared on<input type="datetime-local" value={form.preparedAt} onChange={e=>update('preparedAt',e.target.value)}/></label><label>Collection deadline *<input type="datetime-local" min={new Date(Date.now()+60000).toISOString().slice(0,16)} value={form.deadline} onChange={e=>update('deadline',e.target.value)} required/></label><label>Collection window / pickup instructions *<input value={form.pickupInstructions} onChange={e=>update('pickupInstructions',e.target.value)} placeholder="e.g. Today, 4–6 PM · Call on arrival" required/></label><label>Collection area / neighbourhood *<input value={form.area} onChange={e=>update('area',e.target.value)} placeholder="e.g. Alwarpet" required/></label><label>Storage instructions<input value={form.storage} onChange={e=>update('storage',e.target.value)} placeholder="e.g. Keep refrigerated"/></label></section>
 <section className="form-section"><h2>About you</h2><div className="form-two"><label>Your name / organisation *<input value={form.donor} onChange={e=>update('donor',e.target.value)} placeholder="Name people will see" required/></label><label>Donor type<select value={form.donorType} onChange={e=>update('donorType',e.target.value)}>{['Individual','Restaurant','Bakery','Hotel','Supermarket','NGO','Community kitchen','Event organiser','Other organisation'].map(x=><option key={x}>{x}</option>)}</select></label></div><label>Private contact information *<input value={form.contact} onChange={e=>update('contact',e.target.value)} placeholder="Phone or email for collection coordination" required/></label><label className="safety-check"><input type="checkbox" checked={form.safe} onChange={e=>update('safe',e.target.checked)}/><span><strong>Food safety declaration *</strong><small>I confirm this food is safe to share, has been handled and stored appropriately, and is not expired or known to be unsafe. I will communicate ingredients, allergens and relevant preparation details honestly.</small></span></label></section>
 {errors.length>0&&<div className="error-box" role="alert">{errors.map(x=><p key={x}>{x}</p>)}</div>}<button className="btn btn-dark full-btn" type="submit" disabled={busy}>{busy?(language==='ta'?'வெளியிடுகிறது…':language==='te'?'ప్రచురిస్తోంది…':'Publishing…'):(language==='ta'?'உணவைப் பகிர வெளியிடு':language==='te'?'ఆహార జాబితా ప్రచురించు':'Publish food listing')} <ArrowRight size={17}/></button><p className="demo-notice">Your listing becomes visible to people searching in its city and neighbourhood. Your contact detail is stored privately in your profile.</p></div>
 <aside className="donate-aside"><div className="aside-note"><Sprout size={25}/><h3>Good food has a next chapter.</h3><p>Clear details help neighbours decide what they can safely collect.</p></div><div className="aside-tip"><strong>A quick reminder</strong><p>Only share food you know has been safely prepared, stored and handled. When in doubt, don't donate it.</p></div></aside></form></main>;
}
function Saved({foods,toggleSave}:any){return <main className="page page-content"><div className="eyebrow">YOUR LITTLE SHORTLIST</div><h1>Saved <em>food.</em></h1><p className="page-intro">Keep the good finds close.</p>{foods.length?<div className="food-grid">{foods.map((f:Food)=><FoodCard key={f.id} food={f} saved toggleSave={toggleSave}/>)}</div>:<Empty title="Nothing saved just yet" body="When something catches your eye, tap the bookmark and find it here." action="/explore"/>}</main>;}
function Requests({requests,onCancel}:any){return <main className="page page-content"><div className="eyebrow">YOUR FOOD JOURNEY</div><h1>My <em>requests.</em></h1><p className="page-intro">Track food you've requested from the community.</p>{requests.length?<div className="request-list">{requests.map((r:any)=><article className="request-item" key={r.id}><div className="request-symbol"><Soup/></div><div className="request-main"><strong>{r.title}</strong><span>{r.qty} {r.unit} requested · {r.deadline}</span><small>{r.area}{r.city?', '+r.city:''}</small>{r.contact?.phone&&<small>Donor contact: {r.contact.contact_name} · {r.contact.phone}</small>}</div><span className="status">{r.status}</span>{r.status==='pending'&&<button className="text-link" onClick={()=>onCancel(r.id)}>Cancel</button>}</article>)}</div>:<Empty title="No requests yet" body="When you request a food listing, its status will appear here." action="/explore"/>}</main>;}
function Donations({foods,requests,refresh,notify,onStatus}:any){return <main className="page page-content"><div className="eyebrow">WHAT YOU'VE SHARED</div><h1>My <em>donations.</em></h1><p className="page-intro">Manage your live listings and coordinate incoming food requests.</p>
 {requests.length>0&&<section className="request-list"><h2>Requests from the community</h2>{requests.map((r:any)=><article className="request-item" key={r.id}><div className="request-symbol"><Soup/></div><div className="request-main"><strong>{r.title}</strong><span>{r.qty} {r.unit} requested · {r.deadline}</span><small>{r.note||'No note provided'} · {r.area}</small>{r.contact?.phone&&<small>Requester contact: {r.contact.contact_name} · {r.contact.phone}</small>}</div><span className="status">{r.status}</span>{r.status==='pending'&&<><button className="text-link" onClick={()=>onStatus(r.id,'accepted')}>Accept</button><button className="text-link" onClick={()=>onStatus(r.id,'rejected')}>Decline</button></>}{r.status==='accepted'&&<button className="text-link" onClick={()=>onStatus(r.id,'collected')}>Mark collected</button>}</article>)}</section>}
 <h2>Your food listings</h2>{foods.length?<div className="own-list">{foods.map((f:Food)=><article className="own-item" key={f.id}><FoodImage src={f.image} alt={f.title} category={f.category}/><div><strong>{f.title}</strong><span>{f.qty} {f.unit} · {f.area}</span><small>{f.status||'available'}</small></div>{f.status==='available'&&<button className="text-link" onClick={async()=>{try{await removeFoodListing(f.id);notify('Listing deactivated.');await refresh();}catch(e){notify(e instanceof Error?e.message:'Could not deactivate listing.');}}}>Deactivate</button>}</article>)}</div>:<Empty title="No donations published" body="Have something extra? Create your first listing and share it with your neighbourhood." action="/donate"/>}</main>;}
function Account({user,saveProfile,notify}:any){const [name,setName]=useState(user.name);const [language,setLanguage]=useState(user.language||'ta');useEffect(()=>{setName(user.name);setLanguage(user.language||'ta');},[user.name,user.language]);return <main className="page page-content account-page"><div className="eyebrow">YOUR Everkind SPACE</div><h1>Make yourself <em>at home.</em></h1><p className="page-intro">A shared space for everyone who wants good food to go further.</p>{user.name==='Guest'?<div className="account-auth-actions"><div><strong>Your community starts here.</strong><span>Sign in or create an account to personalise this space.</span></div><Link className="btn btn-dark" to="/signin">Sign in <ArrowRight size={15}/></Link><Link className="btn btn-outline" to="/signup">Create an account <ArrowRight size={15}/></Link></div>:<p className="account-welcome">Signed in as <strong>{user.email||user.name}</strong> · Secure account</p>}<div className="account-layout"><section className="account-form"><h2>Your profile</h2><label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><p className="account-welcome">Account type: <strong>{user.type}</strong></p><label>Preferred language<select value={language} onChange={e=>setLanguage(e.target.value as 'en'|'ta'|'te')}><option value="ta">தமிழ் · Tamil</option><option value="te">తెలుగు · Telugu</option><option value="en">English</option></select></label><button className="btn btn-dark" onClick={()=>saveProfile(name,user.type,language)}>Save profile <Check size={16}/></button>{user.name!=='Guest'&&<button className="btn btn-outline account-signout" onClick={async()=>{await supabase?.auth.signOut();notify('You have been signed out.');}}>Sign out</button>}<p className="demo-notice">Your account uses Supabase Auth. Profile details are private to your account.</p></section><section className="account-links"><Link to="/requests"><Clock3/>My requests <ArrowRight/></Link><Link to="/donations"><Store/>My donations <ArrowRight/></Link><Link to="/saved"><Bookmark/>Saved food <ArrowRight/></Link><Link to="/how"><Leaf/>How Everkind works <ArrowRight/></Link></section></div></main>;}
function How({compact=false}:{compact?:boolean}){return <section className={compact?'how-compact page':'page page-content'}><div className="eyebrow"><span className="eyebrow-line"/> SIMPLE BY DESIGN</div><h2>{compact?'A good thing is easy to share.':'Good food finds its way.'}</h2><div className="how-columns"><div><span>01 / FIND</span><h3>Discover nearby</h3><p>Explore surplus food shared by neighbours, kitchens and local businesses.</p></div><div><span>02 / REQUEST</span><h3>Choose what you need</h3><p>Check the quantity, collection window and food details before you request.</p></div><div><span>03 / COLLECT</span><h3>Give it a new home</h3><p>Coordinate directly with the donor and collect within the agreed window.</p></div></div><div className="how-bottom share-invite"><div className="share-invite-copy"><span className="share-invite-kicker">FOR DONORS & LOCAL BUSINESSES</span><h3>Have surplus food to share?</h3><p>Post what you have, add a collection area and deadline, and let nearby people know it is available.</p></div><Link to="/donate" className="btn btn-dark">Create a food listing <ArrowRight size={16}/></Link></div></section>;}
function Empty({title,body,action='/explore'}:{title:string;body:string;action?:string}){return <div className="empty-state"><div className="empty-icon"><Sprout size={25}/></div><h2>{title}</h2><p>{body}</p><Link to={action} className="btn btn-outline">Explore food <ArrowRight size={16}/></Link></div>;}
export default App;