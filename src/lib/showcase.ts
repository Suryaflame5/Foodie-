import { supabase } from './supabase';

export type ShowcaseOrganisation = {
  id: string;
  display_name: string;
  organization_type: 'donor' | 'recipient';
  category: string;
  area: string;
  description: string;
};

export type ShowcaseActivity = {
  id: string;
  actor_name: string;
  actor_type: 'donor' | 'recipient' | 'community';
  action_type: 'shared' | 'requested' | 'collected' | 'matched';
  item_label: string;
  area: string;
  quantity: number;
  unit: string;
  description: string;
  happened_at: string;
};

export type ShowcaseLocation = {
  id: string;
  title: string;
  area: string;
  latitude: number;
  longitude: number;
};

export type ShowcaseData = {
  donors: ShowcaseOrganisation[];
  recipients: ShowcaseOrganisation[];
  activities: ShowcaseActivity[];
  locations: ShowcaseLocation[];
};

export const emptyShowcase: ShowcaseData = {
  donors: [],
  recipients: [],
  activities: [],
  locations: []
};

export async function loadShowcaseData(city = 'Chennai'): Promise<ShowcaseData> {
  if (!supabase) return emptyShowcase;

  const [organisations, activities, locations] = await Promise.all([
    supabase.from('demo_showcase_organizations')
      .select('id,display_name,organization_type,category,area,description')
      .eq('city', city).eq('is_demo', true).order('display_name'),
    supabase.from('demo_showcase_activity')
      .select('id,actor_name,actor_type,action_type,item_label,area,quantity,unit,description,happened_at')
      .eq('city', city).eq('is_demo', true).order('happened_at', { ascending: false }).limit(5),
    supabase.from('food_listings')
      .select('id,title,area,latitude,longitude')
      .eq('city', city).eq('is_demo', true).eq('status', 'available')
      .not('latitude', 'is', null).not('longitude', 'is', null)
      .order('pickup_deadline', { ascending: true })
  ]);

  if (organisations.error) throw organisations.error;
  if (activities.error) throw activities.error;
  if (locations.error) throw locations.error;

  const orgRows = organisations.data || [];
  return {
    donors: orgRows.filter(row => row.organization_type === 'donor') as ShowcaseOrganisation[],
    recipients: orgRows.filter(row => row.organization_type === 'recipient') as ShowcaseOrganisation[],
    activities: (activities.data || []) as ShowcaseActivity[],
    locations: (locations.data || []) as ShowcaseLocation[]
  };
}
