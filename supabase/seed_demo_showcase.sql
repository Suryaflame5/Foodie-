-- Idempotent Everkind showcase inventory. All rows are explicitly demo-only.
-- No auth users, profiles, food requests, reservations, or impact totals are fabricated.
with demo_rows(
  id,title,category,description,quantity,unit,area,pickup_hours,image_url,
  dietary_tags,allergens,prepared_hours_ago,storage_notes,donor_type,donor_name,
  latitude,longitude,pickup_instructions
) as (values
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,'Freshly baked sourdough loaves','Bakery','A small batch of naturally leavened sourdough, baked this morning.',8,'loaves','Alwarpet',10,'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Wheat'],2,'Keep in a cool, dry place.','Bakery','The Flour House Bakery',13.0345,80.2562,'Collect from the bakery counter.'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,'Seasonal vegetable boxes','Vegetables','Seasonal vegetables sorted into family-sized boxes.',12,'boxes','T. Nagar',8,'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],3,'Refrigerate leafy greens after collection.','Market','Green Basket Market',13.0418,80.2372,'Ask for the community-share crate.'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,'Homestyle lemon rice meals','Prepared meals','Fresh lemon rice portions packed for collection.',16,'portions','Mylapore',5,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Mustard'],1,'Keep refrigerated if not eating promptly.','Community kitchen','Annapoorna Community Kitchen',13.0331,80.2685,'Bring a clean reusable container.'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,'Farm-fresh fruit selection','Fruit','Seasonal bananas, oranges and guavas in share bags.',6,'bags','Adyar',28,'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],4,'Wash before eating.','Co-op','Sunday Harvest Co-op',13.0064,80.2575,'Pickup from the gate.'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,'Assorted artisan pastry box','Bakery','An assortment of pastries made today.',5,'boxes','Besant Nagar',12,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Wheat','Milk','Egg'],3,'Keep covered; best enjoyed today.','Bakery','Crumb & Co. Patisserie',12.9982,80.2707,'Collect at the counter.'),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,'Garden greens & culinary herbs','Vegetables','Freshly harvested greens and herbs from a neighbourhood garden.',9,'bundles','Thiruvanmiyur',22,'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],3,'Refrigerate in a breathable bag.','Community grower','Little Patch Urban Garden',12.9830,80.2594,'Message before arriving.'),
('11111111-1111-4111-8111-111111111111'::uuid,'Idli & sambar breakfast packs','Prepared meals','Soft idlis with a separate container of sambar.',20,'portions','Anna Nagar',4,'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Mustard'],1,'Keep warm; refrigerate if delayed.','Community kitchen','Morning Table Kitchen',13.0850,80.2101,'Pickup at the kitchen window.'),
('22222222-2222-4222-8222-222222222222'::uuid,'Ripe banana crates','Fruit','Ripe bananas in small crates for family or community sharing.',3,'crates','Kodambakkam',30,'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],5,'Store in a cool, ventilated place.','Produce shop','Yellow Basket Produce',13.0524,80.2210,'Ask for the labelled share crate.'),
('33333333-3333-4333-8333-333333333333'::uuid,'Chapati & vegetable kurma meals','Prepared meals','Home-style chapatis with mild vegetable kurma.',14,'portions','Velachery',13,'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Wheat','Cashew'],1,'Refrigerate if not eating within two hours.','Home kitchen','Nila Home Kitchen',12.9750,80.2212,'Collect from the front desk.'),
('44444444-4444-4444-8444-444444444444'::uuid,'Spinach & mixed greens bundles','Vegetables','Washed spinach, amaranth and curry leaves.',10,'bundles','Nungambakkam',18,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],3,'Keep chilled in a breathable bag.','Grocery store','Green Corner Grocers',13.0569,80.2425,'Pickup beside the green awning.'),
('55555555-5555-4555-8555-555555555555'::uuid,'Fresh sandwich snack packs','Prepared meals','Individually wrapped vegetable and cheese sandwiches.',12,'packs','Royapettah',6,'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Wheat','Milk'],2,'Keep chilled until collection.','Cafe','Cornerstone Cafe',13.0552,80.2644,'Collect from the café counter.'),
('66666666-6666-4666-8666-666666666666'::uuid,'Oranges & guavas share bags','Fruit','Fresh oranges and guavas sorted into small share bags.',8,'bags','Kilpauk',32,'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],5,'Wash before eating.','Market','Kilpauk Fresh Market',13.0827,80.2410,'Pickup from the market help desk.'),
('77777777-7777-4777-8777-777777777777'::uuid,'Vegetable pulao meal boxes','Prepared meals','Mild vegetable pulao packed into individual boxes.',10,'portions','Perungudi',14,'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Cashew'],1,'Keep warm or refrigerate promptly.','Community kitchen','Shared Spoon Collective',12.9650,80.2450,'Pickup from the hall reception.'),
('88888888-8888-4888-8888-888888888888'::uuid,'Soft dinner bread rolls','Bakery','A tray of soft bread rolls left from today’s bake.',18,'pieces','Egmore',20,'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Wheat','Milk'],4,'Store in a cool, dry place.','Bakery','Little Oven Bakery',13.0732,80.2609,'Pickup from the side counter.'),
('99999999-9999-4999-8999-999999999999'::uuid,'Fresh tomatoes for cooking','Vegetables','Firm ripe tomatoes sorted into kitchen-friendly bags.',15,'kg','Saidapet',9,'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],6,'Keep dry and away from direct sunlight.','Grocery store','Saidapet Daily Needs',13.0213,80.2231,'Pickup from the produce counter.'),
('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,'Banana-leaf meal packs','Prepared meals','Vegetarian rice meal with poriyal and kootu.',8,'portions','Triplicane',7,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Mustard'],1,'Eat promptly; refrigerate if delayed.','Community kitchen','Anbu Community Kitchen',13.0580,80.2750,'Pickup from the community hall entrance.'),
('bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2'::uuid,'Millet snack assortment','Packaged food','Sealed millet snack boxes; check package labels before eating.',6,'boxes','Ashok Nagar',36,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=85',array['Vegetarian'],array['Peanuts'],8,'Keep sealed and check the best-before label.','Event organiser','Good Grain Workshop',13.0375,80.2120,'Pickup from the workshop reception.'),
('ccccccc3-cccc-4ccc-8ccc-ccccccccccc3'::uuid,'Ripe papayas for sharing','Fruit','Ripe papayas available for a neighbourhood fruit bowl.',7,'pieces','Guindy',26,'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=1200&q=85',array['Vegetarian','Vegan'],array[]::text[],4,'Store cool; refrigerate once cut.','Produce vendor','Sunrise Fruit Stall',13.0067,80.2206,'Pickup from the front produce stall.')
)
insert into public.food_listings(
  id,donor_id,title,category,description,quantity,unit,area,city,
  pickup_instructions,pickup_deadline,image_path,dietary_tags,allergen_info,
  food_prepared_at,storage_notes,status,safety_confirmed,donor_type,
  latitude,longitude,donor_name,portions,is_demo
)
select id,null,title,category,description,quantity,unit,area,'Chennai',
  pickup_instructions,now()+pickup_hours*interval '1 hour',image_url,dietary_tags,allergens,
  now()-prepared_hours_ago*interval '1 hour',storage_notes,'available',true,
  donor_type,latitude,longitude,donor_name,quantity,true
from demo_rows
on conflict(id) do update set
  donor_id=null,title=excluded.title,category=excluded.category,
  description=excluded.description,quantity=excluded.quantity,unit=excluded.unit,
  reserved_quantity=0,collected_quantity=0,area=excluded.area,city=excluded.city,
  pickup_instructions=excluded.pickup_instructions,pickup_deadline=excluded.pickup_deadline,
  image_path=excluded.image_path,dietary_tags=excluded.dietary_tags,
  allergen_info=excluded.allergen_info,food_prepared_at=excluded.food_prepared_at,
  storage_notes=excluded.storage_notes,status='available',safety_confirmed=true,
  donor_type=excluded.donor_type,latitude=excluded.latitude,longitude=excluded.longitude,
  donor_name=excluded.donor_name,portions=excluded.portions,is_demo=true,updated_at=now();


-- Fictional donor and recipient cards, stored separately from Auth profiles.
insert into public.demo_showcase_organizations(id,display_name,organization_type,category,area,city,description,is_demo) values
('10111111-1111-4111-8111-111111111111','The Flour House Bakery','donor','Bakery','Alwarpet','Chennai','Fictional bakery profile for surplus bread sharing.',true),
('10222222-2222-4222-8222-222222222222','Green Basket Market','donor','Produce market','T. Nagar','Chennai','Fictional market profile for seasonal produce listings.',true),
('10333333-3333-4333-8333-333333333333','Annapoorna Community Kitchen','donor','Community kitchen','Mylapore','Chennai','Sample kitchen profile sharing freshly prepared portions.',true),
('10444444-4444-4444-8444-444444444444','Sunday Harvest Co-op','donor','Food cooperative','Adyar','Chennai','Fictional neighbourhood co-op sharing extra fruit.',true),
('10555555-5555-4555-8555-555555555555','Crumb & Co. Patisserie','donor','Bakery','Besant Nagar','Chennai','Sample bakery profile for pastry listings.',true),
('10666666-6666-4666-8666-666666666666','Little Patch Urban Garden','donor','Community garden','Thiruvanmiyur','Chennai','Fictional urban garden sharing extra greens.',true),
('10777777-7777-4777-8777-777777777777','Morning Table Kitchen','donor','Community kitchen','Anna Nagar','Chennai','Sample breakfast kitchen profile.',true),
('10888888-8888-4888-8888-888888888888','Yellow Basket Produce','donor','Produce shop','Kodambakkam','Chennai','Fictional produce shop profile.',true),
('10999999-9999-4999-8999-999999999999','Nila Home Kitchen','donor','Home kitchen','Velachery','Chennai','Sample home kitchen profile for meal sharing.',true),
('10aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Green Corner Grocers','donor','Grocery store','Nungambakkam','Chennai','Fictional neighbourhood grocer profile.',true),
('20111111-1111-4111-8111-111111111111','Mylapore Neighbourhood Pantry','recipient','Community pantry','Mylapore','Chennai','Sample community pantry coordinating local food access.',true),
('20222222-2222-4222-8222-222222222222','Anbu Community Kitchen','recipient','Community kitchen','Triplicane','Chennai','Fictional recipient kitchen for the demo flow.',true),
('20333333-3333-4333-8333-333333333333','Little Steps Childcare Centre','recipient','Childcare centre','Anna Nagar','Chennai','Sample organisation coordinating family food support.',true),
('20444444-4444-4444-8444-444444444444','Hope Circle Shelter','recipient','Community shelter','Saidapet','Chennai','Fictional shelter profile for the showcase.',true),
('20555555-5555-4555-8555-555555555555','Velachery Community Fridge','recipient','Community fridge','Velachery','Chennai','Sample neighbourhood fridge profile.',true),
('20666666-6666-4666-8666-666666666666','Adyar Senior Support Kitchen','recipient','Senior support kitchen','Adyar','Chennai','Fictional community kitchen profile.',true)
on conflict(id) do update set display_name=excluded.display_name,organization_type=excluded.organization_type,category=excluded.category,area=excluded.area,city=excluded.city,description=excluded.description,is_demo=true;

-- Simulated activity is intentionally separate from public.food_requests.
insert into public.demo_showcase_activity(id,actor_name,actor_type,action_type,item_label,area,city,quantity,unit,description,happened_at,is_demo) values
('30111111-1111-4111-8111-111111111111','Morning Table Kitchen','donor','shared','Idli & sambar breakfast packs','Anna Nagar','Chennai',20,'portions','Illustrative listing created in the demo environment.',now()-interval '18 minutes',true),
('30222222-2222-4222-8222-222222222222','Green Basket Market','donor','shared','Seasonal vegetable boxes','T. Nagar','Chennai',12,'boxes','Illustrative surplus produce listing.',now()-interval '42 minutes',true),
('30333333-3333-4333-8333-333333333333','Mylapore Neighbourhood Pantry','recipient','requested','Freshly baked sourdough loaves','Mylapore','Chennai',4,'loaves','Simulated request event; no food request was created.',now()-interval '75 minutes',true),
('30444444-4444-4444-8444-444444444444','Anbu Community Kitchen','recipient','matched','Homestyle lemon rice meals','Triplicane','Chennai',8,'portions','Illustrative match event for the product walkthrough.',now()-interval '2 hours',true),
('30555555-5555-4555-8555-555555555555','Hope Circle Shelter','recipient','collected','Farm-fresh fruit selection','Saidapet','Chennai',3,'bags','Simulated collection event; no real collection was recorded.',now()-interval '3 hours',true)
on conflict(id) do update set actor_name=excluded.actor_name,actor_type=excluded.actor_type,action_type=excluded.action_type,item_label=excluded.item_label,area=excluded.area,city=excluded.city,quantity=excluded.quantity,unit=excluded.unit,description=excluded.description,happened_at=excluded.happened_at,is_demo=true;
