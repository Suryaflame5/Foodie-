import { supabase } from './supabase';

export type FoodRecord = {
  id: string; title: string; category: string; donor: string; donorType: string;
  qty: number; unit: string; deadline: string; time: string; area: string; city: string;
  image: string; description: string; storage: string; diet: string; allergens?: string[]; preparedAt?: string | null;
  pickupDeadline?: string; imagePath?: string; status?: string; sample?: boolean;
};
const client = () => {
  if (!supabase) throw new Error('FOODIE is not connected to Supabase. Please try again later.');
  return supabase;
};
const deadlineLabel = (value: string) => new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const publicImage = (path: string | null) => path ? client().storage.from('food-images').getPublicUrl(path).data.publicUrl : '';
const mapListing = (row: any): FoodRecord => ({
  id: row.id, title: row.title, category: row.category, donor: row.donor_name || row.donor || 'Community donor',
  donorType: row.donor_type === 'organisation' ? 'Organisation' : row.donor_type === 'member' ? 'Individual' : row.donor_type || 'Community member', qty: Math.max(0,Number(row.available_quantity ?? (Number(row.quantity||0)-Number(row.reserved_quantity||0)-Number(row.collected_quantity||0)))),
  unit: row.unit, deadline: deadlineLabel(row.pickup_deadline), pickupDeadline: row.pickup_deadline,
  time: row.pickup_instructions || 'Coordinate collection with the donor', area: row.area, city: row.city,
  image: row.image_url || publicImage(row.image_path), imagePath: row.image_path || undefined,
  description: row.description || '', storage: row.storage_notes || '', diet: (row.dietary_tags || []).join(' · ') || 'Not specified',
  allergens: row.allergen_info || [], preparedAt: row.food_prepared_at || null, status: row.status, sample: false
});
export async function discoverFood(location: string, query = ''): Promise<FoodRecord[]> {
  const parts=location.split(',').map(x=>x.trim()).filter(Boolean);
  const knownCity=parts.find(x=>/chennai|coimbatore|madurai|tiruchirappalli|salem|tirunelveli|vellore|erode|thanjavur|hyderabad|vijayawada|visakhapatnam|warangal|bangalore|bengaluru/i.test(x));
  const city=knownCity || (parts.length>1 ? parts[parts.length-1] : 'Chennai');
  const area=parts.length>1 ? parts.find(x=>x.toLowerCase()!==city.toLowerCase()) : (city.toLowerCase()===location.toLowerCase() || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(location) ? null : location);
  const {data,error}=await client().rpc('search_food_matches',{p_city:city,p_area:area,p_query:query.trim()||null,p_limit:20});
  if(error) throw error;
  return (data||[]).map((r:any)=>mapListing(r));
}
export async function myFoodListings(): Promise<FoodRecord[]> {
  const {data:{user},error:authError}=await client().auth.getUser();
  if(authError||!user) throw new Error('Sign in to view your donations.');
  const {data,error}=await client().from('food_listings').select('*').eq('donor_id',user.id).order('created_at',{ascending:false});
  if(error) throw error;
  const {data:profile}=await client().from('profiles').select('full_name,role').eq('id',user.id).maybeSingle();
  return (data||[]).map((r:any)=>mapListing({...r,donor:profile?.full_name,donor_type:r.donor_type||profile?.role}));
}
export async function publishFood(input: {
 title:string;category:string;description:string;quantity:number;unit:string;area:string;city:string;
 deadline:string;storage:string;diet:string;donorType:string;allergenInfo:string;preparedAt:string;pickupInstructions:string;imageFile?:File|null;
}): Promise<FoodRecord> {
  const c=client();
  const {data:{user},error:authError}=await c.auth.getUser();
  if(authError||!user) throw new Error('Please sign in before publishing food.');
  let imagePath:string|null=null;
  if(input.imageFile){
    if(!['image/jpeg','image/png','image/webp'].includes(input.imageFile.type)) throw new Error('Choose a JPG, PNG or WebP photograph.');
    if(input.imageFile.size>5*1024*1024) throw new Error('Food photographs must be smaller than 5 MB.');
    const ext=input.imageFile.type==='image/png'?'png':input.imageFile.type==='image/webp'?'webp':'jpg';
    imagePath=user.id+'/'+crypto.randomUUID()+'.'+ext;
    const {error}=await c.storage.from('food-images').upload(imagePath,input.imageFile,{contentType:input.imageFile.type,upsert:false});
    if(error) throw error;
  }
  const {data,error}=await c.from('food_listings').insert({
    donor_id:user.id,title:input.title.trim(),category:input.category,description:input.description.trim(),
    quantity:input.quantity,unit:input.unit,area:input.area.trim(),city:input.city.trim(),
    pickup_deadline:input.deadline,pickup_instructions:input.pickupInstructions.trim(),donor_type:input.donorType,
    food_prepared_at:input.preparedAt||null,allergen_info:input.allergenInfo.split(',').map(x=>x.trim()).filter(Boolean),
    storage_notes:input.storage.trim(),dietary_tags:input.diet.split('·').map(x=>x.trim()).filter(Boolean),
    image_path:imagePath,safety_confirmed:true,status:'available'
  }).select('*').single();
  if(error){
    if(imagePath) await c.storage.from('food-images').remove([imagePath]);
    throw error;
  }
  const {data:profile}=await c.from('profiles').select('full_name,role').eq('id',user.id).maybeSingle();
  return mapListing({...data,donor:profile?.full_name,donor_type:data.donor_type||profile?.role});
}
export async function reserveFood(listingId:string,quantity:number,note='') {
  const {data,error}=await client().rpc('reserve_food',{p_listing_id:listingId,p_quantity:quantity,p_note:note});
  if(error) throw error;
  return data;
}
export async function getSavedIds():Promise<string[]> {
  const {data:{user}}=await client().auth.getUser();
  if(!user) return [];
  const {data,error}=await client().from('saved_listings').select('listing_id').eq('user_id',user.id);
  if(error) throw error;
  return (data||[]).map((r:any)=>r.listing_id);
}
export async function toggleSavedListing(id:string, saved:boolean) {
  const c=client(); const {data:{user}}=await c.auth.getUser();
  if(!user) throw new Error('Sign in to save food listings.');
  const result=saved
    ? await c.from('saved_listings').delete().eq('user_id',user.id).eq('listing_id',id)
    : await c.from('saved_listings').insert({user_id:user.id,listing_id:id});
  if(result.error) throw result.error;
}
async function getRequestContact(id:string):Promise<any|null>{const {data,error}=await client().rpc('get_request_contact',{p_request_id:id});if(error)return null;return data?.[0]||null;}
export async function getMyRequests():Promise<any[]> {
  const {data:{user}}=await client().auth.getUser();
  if(!user) return [];
  const {data,error}=await client().from('food_requests').select('id,listing_id,quantity,status,note,created_at,food_listings(title,unit,pickup_deadline,area,city)').eq('requester_id',user.id).order('created_at',{ascending:false});
  if(error) throw error;
  return Promise.all((data||[]).map(async(r:any)=>({id:r.id,foodId:r.listing_id,title:r.food_listings?.title||'Food listing',qty:r.quantity,unit:r.food_listings?.unit||'items',status:r.status,deadline:r.food_listings?.pickup_deadline?deadlineLabel(r.food_listings.pickup_deadline):'—',created:r.created_at,area:r.food_listings?.area||'',city:r.food_listings?.city||'',contact:r.status==='accepted'?await getRequestContact(r.id):null})));
}
export async function cancelFoodRequest(id:string) {
  const {error}=await client().from('food_requests').update({status:'cancelled'}).eq('id',id);
  if(error) throw error;
}
export async function updateProfile(name:string,language:'en'|'ta'|'te',city?:string,area?:string,phone?:string) {
  const c=client(); const {data:{user}}=await c.auth.getUser();
  if(!user) throw new Error('Sign in to update your profile.');
  const {error}=await c.from('profiles').update({full_name:name.trim(),preferred_language:language,...(city!==undefined?{city}:{}),...(area!==undefined?{area}:{}),...(phone!==undefined?{phone:phone.trim()||null}:{})}).eq('id',user.id);
  if(error) throw error;
}

export async function removeFoodListing(id:string) {
  const {error}=await client().from('food_listings').update({status:'removed'}).eq('id',id);
  if(error) throw error;
}

export async function getIncomingRequests():Promise<any[]> {
  const c=client();const {data:{user}}=await c.auth.getUser();if(!user)return [];
  const {data,error}=await c.from('food_requests').select('id,listing_id,requester_id,quantity,status,note,created_at,food_listings!inner(title,unit,pickup_deadline,area,city,donor_id)').eq('food_listings.donor_id',user.id).order('created_at',{ascending:false});
  if(error) throw error;
  return Promise.all((data||[]).map(async(r:any)=>({id:r.id,listingId:r.listing_id,requesterId:r.requester_id,title:r.food_listings?.title||'Food listing',qty:r.quantity,unit:r.food_listings?.unit||'items',status:r.status,note:r.note,created:r.created_at,deadline:r.food_listings?.pickup_deadline?deadlineLabel(r.food_listings.pickup_deadline):'—',area:r.food_listings?.area||'',city:r.food_listings?.city||'',contact:r.status==='accepted'?await getRequestContact(r.id):null})));
}
export async function updateIncomingRequest(id:string,status:'accepted'|'rejected'|'collected') {
  const {error}=await client().from('food_requests').update({status}).eq('id',id);
  if(error) throw error;
}
