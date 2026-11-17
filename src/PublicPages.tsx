import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, CircleHelp, HeartHandshake, Leaf, MapPin, ShieldCheck, Sprout, Users, Utensils } from 'lucide-react';
import FoodCompanion from './FoodCompanion';

function Eyebrow({children}:{children:string}) {
  return <div className="eyebrow"><span className="eyebrow-line" />{children}</div>;
}
function PublicHero({eyebrow,title,description,action,actionLabel}:{eyebrow:string;title:React.ReactNode;description:string;action?:string;actionLabel?:string}) {
  return <section className="public-hero">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h1>{title}</h1>
    <p>{description}</p>
    {action&&actionLabel&&<Link className="btn btn-dark" to={action}>{actionLabel}<ArrowRight size={16}/></Link>}
  </section>;
}
function ValueRow({icon,title,body}:{icon:React.ReactNode;title:string;body:string}) {
  return <article className="public-value"><span className="public-value-icon">{icon}</span><div><h2>{title}</h2><p>{body}</p></div></article>;
}
export function OrganizationsPage() {
  return <main className="page page-content public-page">
    <PublicHero eyebrow="FOR COMMUNITY ORGANISATIONS" title={<>Good work deserves<br/><em>good connections.</em></>} description="Everkind helps community groups, NGOs and charitable organisations discover surplus food shared by nearby people and local businesses." action="/signup" actionLabel="Join Everkind"/>
    <section className="public-intro-grid">
      <div><Eyebrow>HOW ORGANISATIONS PARTICIPATE</Eyebrow><h2>Make collection<br/>more coordinated.</h2></div>
      <div className="public-copy"><p>Organisations can create an account, describe the communities they serve and use food listings to coordinate requests and collection with donors.</p><p>Everkind is a connection platform. It does not allocate food automatically, certify organisations or guarantee a donation.</p></div>
    </section>
    <section className="public-values">
      <ValueRow icon={<Users/>} title="Community groups" body="Find nearby surplus that may support families, neighbours and community programmes."/>
      <ValueRow icon={<HeartHandshake/>} title="NGOs and charities" body="Coordinate collection with donors and communicate your actual needs clearly."/>
      <ValueRow icon={<Utensils/>} title="Food providers" body="Share safe surplus from restaurants, hotels, bakeries, caterers and events."/>
    </section>
    <section className="public-callout"><div><span>START WITH A COMMUNITY ACCOUNT</span><h2>Bring your work<br/>to the table.</h2><p>Choose Organisation when creating your account. Keep your profile and collection details accurate; organisation verification and capacity tools will be introduced as the platform's organisation records are completed.</p></div><Link className="btn btn-light" to="/signup">Create an account <ArrowRight size={16}/></Link></section>
  </main>;
}
export function FoodSafetyPage() {
  const points=[
    ['Share only what you know is safe','Do not list food that is expired, spoiled, contaminated or has been stored outside safe conditions. When in doubt, do not share it.'],
    ['Be precise about preparation','Include when the food was prepared, how it has been stored and any handling details that matter for collection.'],
    ['Disclose known allergens','List known ingredients and allergens honestly. If you are unsure, say so rather than guessing.'],
    ['Respect the collection deadline','Set a realistic pickup window and keep the listing updated if the food is no longer available.'],
    ['Check before consuming','Receivers should inspect packaging and food condition, ask the donor questions and decline anything that seems unsafe.']
  ];
  return <main className="page page-content public-page">
    <PublicHero eyebrow="A SHARED RESPONSIBILITY" title={<>Care comes<br/><em>before collection.</em></>} description="Food sharing works best when donors communicate clearly and receivers make informed decisions. These practical principles help everyone understand their role."/>
    <section className="safety-note"><ShieldCheck size={24}/><p><strong>Important:</strong> Everkind does not inspect, test or certify food. A listing or safety declaration is not a guarantee that food is safe to eat.</p></section>
    <section className="public-step-list">{points.map(([title,body],i)=><article className="public-step" key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</section>
    <section className="public-callout"><div><span>HAVE SURPLUS TO SHARE?</span><h2>Give good food<br/>another chance.</h2><p>Describe the food honestly and include collection and storage information.</p></div><Link className="btn btn-light" to="/donate">Share food <ArrowRight size={16}/></Link></section>
  </main>;
}
export function AboutPage() {
  return <main className="page page-content public-page">
    <PublicHero eyebrow="ABOUT EVERKIND" title={<>A better route<br/><em>for good food.</em></>} description="Everkind is a community food-sharing platform built to help surplus edible food find people and organisations who can use it." action="/explore" actionLabel="Explore available food"/>
    <section className="public-intro-grid"><div><Eyebrow>OUR POINT OF VIEW</Eyebrow><h2>Sharing should<br/>feel simple.</h2></div><div className="public-copy"><p>Good food can be left over for many ordinary reasons: a kitchen prepared more than it needed, an event ended with untouched portions, a household bought extra produce or a shop has items it cannot sell in time.</p><p>Everkind gives donors and receivers a place to find each other, share clear information and coordinate collection. It is not a delivery service or a commercial food marketplace.</p></div></section>
    <section className="public-values"><ValueRow icon={<Sprout/>} title="Make better use of surplus" body="Help edible food reach people instead of being forgotten or discarded."/><ValueRow icon={<HeartHandshake/>} title="Keep it community-led" body="People and organisations coordinate directly, with clear expectations and shared responsibility."/><ValueRow icon={<Leaf/>} title="Be honest and practical" body="Real listings, accurate quantities and clear pickup details matter more than big promises."/></section>
    <section className="public-inline-links"><Link to="/how">How it works <ArrowRight size={15}/></Link><Link to="/organizations">For organisations <ArrowRight size={15}/></Link><Link to="/food-safety">Food safety <ArrowRight size={15}/></Link></section>
  </main>;
}
export function ContactPage() {
  return <main className="page page-content public-page">
    <PublicHero eyebrow="CONTACT & HELP" title={<>A good conversation<br/><em>starts here.</em></>} description="Need help finding food, sharing a listing or understanding how collection works? Start with the right place below."/>
    <section className="contact-options">
      <article><MessageIcon/><h2>Find food or ask a question</h2><p>Use the Everkind assistant for help searching current listings in English, Tamil or Telugu. It can only describe food returned by the live listings.</p><Link to="/assistant">Open the assistant <ArrowRight size={15}/></Link></article>
      <article><MapPin/><h2>Coordinate a collection</h2><p>For a specific donation, send a request from its listing. Donor contact details are shared through the existing request flow when the donor accepts.</p><Link to="/explore">Browse food listings <ArrowRight size={15}/></Link></article>
      <article><CircleHelp/><h2>Account and listing support</h2><p>A public support email or ticket channel has not been configured yet. We will publish one here when it is connected and monitored.</p><Link to="/how">Read how Everkind works <ArrowRight size={15}/></Link></article>
    </section>
  </main>;
}
function MessageIcon(){return <HeartHandshake size={23}/>;}
function MapPin(){return <MapPinIcon/>;}
function MapPinIcon(){return <MapPin size={23}/>;}
export function PrivacyPage() {
  return <main className="page page-content public-page legal-page">
    <PublicHero eyebrow="PRIVACY" title={<>Your information<br/><em>deserves care.</em></>} description="This plain-language overview describes the information the current Everkind experience uses. It is a product summary, not a substitute for a complete legal privacy notice."/>
    <p className="legal-updated">Last reviewed: 17 November 2026 · Legal review required before broad public launch.</p>
    <section className="legal-section"><h2>Information used by Everkind</h2><p>Depending on the features you use, the platform may process account details such as your name, email, phone number, preferred language, area and city; food listing details and photographs; reservation and collection status; saved listings; and messages sent to the food companion.</p></section>
    <section className="legal-section"><h2>How it is used</h2><p>This information supports sign-in, food discovery, donation publishing, reservation coordination, saved listings, language preferences and the companion experience. Food listings are intended to be visible to people using discovery features. Private contact details should only be shared through the authorised request workflow.</p></section>
    <section className="legal-section"><h2>Service providers and storage</h2><p>The current web implementation uses Supabase for authentication, database operations, file storage and the food-companion function. AI requests may be sent to the configured model provider by that backend function. Provider configuration and retention settings must be confirmed in the deployed environment.</p></section>
    <section className="legal-section"><h2>Your choices</h2><p>Keep your profile accurate, avoid placing sensitive personal information in public listing descriptions or chat messages, and sign out on shared devices. Account deletion and data-retention request handling need a published support process before this notice can be considered complete.</p></section>
  </main>;
}
export function TermsPage() {
  return <main className="page page-content public-page legal-page">
    <PublicHero eyebrow="TERMS OF USE" title={<>Share with care.<br/><em>Use with respect.</em></>} description="These preliminary platform rules explain the intended use of Everkind. They require legal review and do not replace final terms of service."/>
    <p className="legal-updated">Last reviewed: 17 November 2026 · Draft for legal review.</p>
    <section className="legal-section"><h2>What Everkind is</h2><p>Everkind connects people and organisations sharing surplus food with people and groups who may need it. It is a community coordination platform, not a commercial food delivery marketplace, retailer or food-safety certifier.</p></section>
    <section className="legal-section"><h2>Donor responsibilities</h2><p>Donors must only list food they believe is safe to share, provide accurate quantities and pickup deadlines, disclose known allergens and relevant preparation or storage information, and promptly update or remove unavailable listings.</p></section>
    <section className="legal-section"><h2>Receiver responsibilities</h2><p>Receivers should review listing details, ask questions when information is unclear, coordinate collection with the donor and inspect food before accepting or consuming it. Do not collect or consume food that appears unsafe.</p></section>
    <section className="legal-section"><h2>Availability and reservations</h2><p>Listings can become unavailable. A request is subject to the backend reservation status and donor coordination. Everkind does not guarantee that a listing will remain available or that collection will occur.</p></section>
    <section className="legal-section"><h2>Respectful use</h2><p>Do not publish misleading listings, misuse another person's contact details, harass users, attempt unauthorised access or use the platform for unlawful activity.</p></section>
  </main>;
}
export function AssistantPage({location,userName,preferredLanguage}:{location:string;userName:string;preferredLanguage:'en'|'ta'|'te'}) {
  return <main className="page page-content public-page assistant-page">
    <PublicHero eyebrow="EVERKIND COMPANION" title={<>Tell us what you need.<br/><em>Let’s find a way.</em></>} description="Ask for nearby food in English, Tamil or Telugu. The companion searches the same live community listings used by food discovery."/>
    <FoodCompanion location={location} userName={userName} preferredLanguage={preferredLanguage} initialOpen embedded/>
    <p className="assistant-disclaimer">The companion can help explain listings, but it cannot guarantee availability, food safety or a successful collection. Confirm details with the donor.</p>
  </main>;
}
