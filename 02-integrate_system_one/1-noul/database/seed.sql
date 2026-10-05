insert into users (id, name, email)
values
	('user-a1c92f04', 'AI Builder', 'aibuilder@codely.com'),
	('user-7e3b19a2', 'Pablo Rodríguez', 'pablo.rodriguez@codely.com'),
	('user-4d6f8c11', 'Javier Ferrer', 'javier.ferrer@codely.com'),
	('user-9b2e5a77', 'Rafa Gómez', 'rafa.gomez@codely.com');

insert into products (id, name, collection, category, description, price_amount, price_currency, badges, accent)
values
	('hexagonal-overshirt', 'Hexagonal Overshirt', 'Architecture Drop', 'Overshirts', 'Structured overshirt with a technical drape. The layer you throw on when the mid-season weather throws uncaught exceptions.', 89, 'EUR', array['Low stock'], 'green'),
	('event-storm-knit', 'Event Storm Knit', 'Architecture Drop', 'Sweatshirts', 'Compact knit with a soft feel and raised texture. To keep your cool when the event storming session gets out of hand.', 69, 'EUR', array['Limited edition'], 'violet'),
	('domain-event-tee', 'Domain Event Tee', 'Architecture Drop', 'T-shirts', 'Heavyweight cotton tee with a relaxed body. A solid staple, like a test that never fails.', 39, 'EUR', array['New'], 'green'),
	('aggregate-hoodie', 'Aggregate Hoodie', 'Architecture Drop', 'Sweatshirts', 'Hoodie with a brushed interior and a loose fit. The comfort of a deploy Friday where everything goes right.', 95, 'EUR', array[]::text[], 'violet'),
	('bounded-context-trousers', 'Bounded Context Trousers', 'Core Wardrobe', 'Trousers', 'Relaxed-fit trousers with an elastic waist. Comfortable and with well-defined boundaries, no context leaks.', 79, 'EUR', array[]::text[], 'yellow'),
	('refactor-utility-vest', 'Refactor Utility Vest', 'Core Wardrobe', 'Outerwear', 'Lightweight utility vest with modular pockets. Strip away what you do not need and keep only the essentials.', 99, 'EUR', array['New'], 'pink'),
	('value-object-shirt', 'Value Object Shirt', 'Core Wardrobe', 'Shirts', 'Poplin shirt with a clean collar and a regular fit. Immutable and reliable: it always looks good.', 59, 'EUR', array[]::text[], 'yellow'),
	('ubiquitous-chinos', 'Ubiquitous Chinos', 'Core Wardrobe', 'Trousers', 'Versatile cotton chinos with a tapered leg. The common language of your wardrobe: they work for everything.', 65, 'EUR', array['Low stock'], 'pink'),
	('observability-jacket', 'Observability Jacket', 'Signal Series', 'Outerwear', 'Water-repellent shell jacket with sealed seams. Keeps you dry even when the day goes red.', 129, 'EUR', array['Limited edition'], 'green'),
	('circuit-breaker-knit', 'Circuit Breaker Knit', 'Signal Series', 'Sweatshirts', 'Medium-weight merino-blend crewneck sweater. Breaks the cold before it propagates.', 75, 'EUR', array['New'], 'violet');

insert into product_variants (id, product_id, color, color_hex, size, online_stock, chest, length)
values
	('hexagonal-overshirt-ink-s', 'hexagonal-overshirt', 'Moss', '#6d7a4f', 'S', 3, 108, 71),
	('hexagonal-overshirt-ink-m', 'hexagonal-overshirt', 'Moss', '#6d7a4f', 'M', 2, 112, 73),
	('hexagonal-overshirt-ink-l', 'hexagonal-overshirt', 'Moss', '#6d7a4f', 'L', 0, 116, 75),
	('hexagonal-overshirt-moss-s', 'hexagonal-overshirt', 'Indigo', '#35415c', 'S', 4, 108, 71),
	('hexagonal-overshirt-moss-m', 'hexagonal-overshirt', 'Indigo', '#35415c', 'M', 1, 112, 73),
	('event-storm-knit-black-s', 'event-storm-knit', 'Black', '#1a1a1a', 'S', 7, 96, 62),
	('event-storm-knit-black-m', 'event-storm-knit', 'Black', '#1a1a1a', 'M', 4, 100, 64),
	('event-storm-knit-black-l', 'event-storm-knit', 'Black', '#1a1a1a', 'L', 0, 104, 66),
	('event-storm-knit-ecru-s', 'event-storm-knit', 'Ecru', '#e7dfc9', 'S', 2, 96, 62),
	('event-storm-knit-ecru-m', 'event-storm-knit', 'Ecru', '#e7dfc9', 'M', 2, 100, 64),
	('domain-event-tee-white-s', 'domain-event-tee', 'White', '#f4f3ee', 'S', 12, 100, 68),
	('domain-event-tee-white-m', 'domain-event-tee', 'White', '#f4f3ee', 'M', 10, 104, 70),
	('domain-event-tee-white-l', 'domain-event-tee', 'White', '#f4f3ee', 'L', 6, 108, 72),
	('domain-event-tee-navy-m', 'domain-event-tee', 'Navy', '#26364f', 'M', 8, 104, 70),
	('domain-event-tee-navy-l', 'domain-event-tee', 'Navy', '#26364f', 'L', 4, 108, 72),
	('aggregate-hoodie-graphite-s', 'aggregate-hoodie', 'Camel', '#c19a6b', 'S', 5, 112, 68),
	('aggregate-hoodie-graphite-m', 'aggregate-hoodie', 'Camel', '#c19a6b', 'M', 3, 116, 70),
	('aggregate-hoodie-graphite-l', 'aggregate-hoodie', 'Camel', '#c19a6b', 'L', 2, 120, 72),
	('aggregate-hoodie-sand-m', 'aggregate-hoodie', 'Stone', '#b7ae9e', 'M', 4, 116, 70),
	('bounded-context-trousers-navy-s', 'bounded-context-trousers', 'Khaki', '#7f7448', 'S', 6, 78, 102),
	('bounded-context-trousers-navy-m', 'bounded-context-trousers', 'Khaki', '#7f7448', 'M', 6, 82, 104),
	('bounded-context-trousers-navy-l', 'bounded-context-trousers', 'Khaki', '#7f7448', 'L', 3, 86, 106),
	('bounded-context-trousers-stone-m', 'bounded-context-trousers', 'Stone', '#b7ae9e', 'M', 5, 82, 104),
	('refactor-utility-vest-graphite-s', 'refactor-utility-vest', 'Camel', '#c19a6b', 'S', 5, 104, 64),
	('refactor-utility-vest-graphite-m', 'refactor-utility-vest', 'Camel', '#c19a6b', 'M', 3, 108, 66),
	('refactor-utility-vest-sand-m', 'refactor-utility-vest', 'Stone', '#b7ae9e', 'M', 2, 108, 66),
	('value-object-shirt-white-s', 'value-object-shirt', 'Chambray', '#6f8bad', 'S', 8, 100, 74),
	('value-object-shirt-white-m', 'value-object-shirt', 'Chambray', '#6f8bad', 'M', 6, 104, 76),
	('value-object-shirt-white-l', 'value-object-shirt', 'Chambray', '#6f8bad', 'L', 4, 108, 78),
	('value-object-shirt-blue-m', 'value-object-shirt', 'Sky', '#bcd6e8', 'M', 5, 104, 76),
	('ubiquitous-chinos-olive-s', 'ubiquitous-chinos', 'Salmon', '#d98f7a', 'S', 2, 80, 102),
	('ubiquitous-chinos-olive-m', 'ubiquitous-chinos', 'Salmon', '#d98f7a', 'M', 1, 84, 104),
	('ubiquitous-chinos-sand-m', 'ubiquitous-chinos', 'Sand', '#cbb693', 'M', 3, 84, 104),
	('ubiquitous-chinos-sand-l', 'ubiquitous-chinos', 'Sand', '#cbb693', 'L', 0, 88, 106),
	('observability-jacket-black-m', 'observability-jacket', 'Black', '#1a1a1a', 'M', 3, 114, 72),
	('observability-jacket-black-l', 'observability-jacket', 'Black', '#1a1a1a', 'L', 2, 118, 74),
	('observability-jacket-olive-m', 'observability-jacket', 'Olive', '#6f6a3a', 'M', 2, 114, 72),
	('circuit-breaker-knit-charcoal-s', 'circuit-breaker-knit', 'Black', '#1a1a1a', 'S', 6, 98, 66),
	('circuit-breaker-knit-charcoal-m', 'circuit-breaker-knit', 'Black', '#1a1a1a', 'M', 5, 102, 68),
	('circuit-breaker-knit-rust-m', 'circuit-breaker-knit', 'Rust', '#9c4a2d', 'M', 3, 102, 68),
	('circuit-breaker-knit-rust-l', 'circuit-breaker-knit', 'Rust', '#9c4a2d', 'L', 2, 106, 70);

insert into checkouts (id, delivery_method, status)
values ('checkout-user-a1c92f04', 'home-delivery', 'draft');

insert into checkout_lines (checkout_id, product_id, variant_id, quantity)
values ('checkout-user-a1c92f04', 'hexagonal-overshirt', 'hexagonal-overshirt-ink-m', 1);

insert into products (id, name, collection, category, description, price_amount, price_currency, badges, accent)
values
	('pure-function-tee', 'Pure Function Tee', 'Core Wardrobe', 'T-shirts', 'Combed cotton tee with a clean drape. No side effects: put it on, it fits well, and always returns the same result.', 39, 'EUR', array['New'], 'violet'),
	('null-pointer-tee', 'Null Pointer Tee', 'Signal Series', 'T-shirts', 'Soft knit tee with a reinforced collar. The staple you can always point to without fear.', 35, 'EUR', array[]::text[], 'pink'),
	('idempotent-shirt', 'Idempotent Shirt', 'Architecture Drop', 'Shirts', 'Regular-fit poplin shirt. No matter how many times you put it on, the result is the same: impeccable.', 59, 'EUR', array['New'], 'yellow'),
	('merge-conflict-jeans', 'Merge Conflict Jeans', 'Signal Series', 'Trousers', 'Sturdy denim jeans with a straight cut. They resolve any conflict between comfort and style.', 85, 'EUR', array[]::text[], 'green'),
	('facade-overshirt', 'Facade Overshirt', 'Core Wardrobe', 'Overshirts', 'Lightweight overshirt that works as a mid-layer. A simple interface on the outside, cozy warmth on the inside.', 89, 'EUR', array['Limited edition'], 'pink');

insert into product_variants (id, product_id, color, color_hex, size, online_stock, chest, length)
values
	('pure-function-tee-black-s', 'pure-function-tee', 'Black', '#1a1a1a', 'S', 14, 102, 68),
	('pure-function-tee-black-m', 'pure-function-tee', 'Black', '#1a1a1a', 'M', 12, 106, 70),
	('pure-function-tee-black-l', 'pure-function-tee', 'Black', '#1a1a1a', 'L', 8, 110, 72),
	('pure-function-tee-white-m', 'pure-function-tee', 'White', '#f4f3ee', 'M', 9, 106, 70),
	('null-pointer-tee-black-s', 'null-pointer-tee', 'Black', '#1a1a1a', 'S', 11, 102, 68),
	('null-pointer-tee-black-m', 'null-pointer-tee', 'Black', '#1a1a1a', 'M', 9, 106, 70),
	('null-pointer-tee-black-l', 'null-pointer-tee', 'Black', '#1a1a1a', 'L', 5, 110, 72),
	('null-pointer-tee-navy-m', 'null-pointer-tee', 'Navy', '#26364f', 'M', 7, 106, 70),
	('idempotent-shirt-navy-s', 'idempotent-shirt', 'Navy', '#26364f', 'S', 7, 102, 74),
	('idempotent-shirt-navy-m', 'idempotent-shirt', 'Navy', '#26364f', 'M', 6, 106, 76),
	('idempotent-shirt-navy-l', 'idempotent-shirt', 'Navy', '#26364f', 'L', 3, 110, 78),
	('idempotent-shirt-white-m', 'idempotent-shirt', 'White', '#f4f3ee', 'M', 5, 106, 76),
	('merge-conflict-jeans-indigo-s', 'merge-conflict-jeans', 'Indigo', '#2f3b52', 'S', 6, 80, 102),
	('merge-conflict-jeans-indigo-m', 'merge-conflict-jeans', 'Indigo', '#2f3b52', 'M', 6, 84, 104),
	('merge-conflict-jeans-indigo-l', 'merge-conflict-jeans', 'Indigo', '#2f3b52', 'L', 4, 88, 106),
	('merge-conflict-jeans-black-m', 'merge-conflict-jeans', 'Black', '#1a1a1a', 'M', 5, 84, 104),
	('facade-overshirt-teal-s', 'facade-overshirt', 'Teal', '#4f8a8b', 'S', 5, 108, 71),
	('facade-overshirt-teal-m', 'facade-overshirt', 'Teal', '#4f8a8b', 'M', 4, 112, 73),
	('facade-overshirt-teal-l', 'facade-overshirt', 'Teal', '#4f8a8b', 'L', 2, 116, 75),
	('facade-overshirt-sand-m', 'facade-overshirt', 'Sand', '#cbb693', 'M', 3, 112, 73);

insert into orders (id, user_id, delivery_method, subtotal_amount, currency, status, created_at)
select 'order-' || substr(md5(g::text || 'codely-atelier'), 1, 8),
	(array['user-a1c92f04', 'user-7e3b19a2', 'user-4d6f8c11', 'user-9b2e5a77'])[1 + (g % 4)],
	'home-delivery', 0, 'EUR', 'confirmed',
	now() - ((g * 2) || ' days')::interval - ((g % 24) || ' hours')::interval
from generate_series(1, 28) g;

with orders_seq as (
	select g, 'order-' || substr(md5(g::text || 'codely-atelier'), 1, 8) as order_id
	from generate_series(1, 28) g
),
variants_numbered as (
	select v.id as variant_id, v.product_id, p.price_amount,
		row_number() over (order by v.id) as rn, count(*) over () as total
	from product_variants v
	join products p on p.id = v.product_id
)
insert into order_lines (order_id, product_id, variant_id, quantity, unit_price_amount)
select o.order_id, vn.product_id, vn.variant_id, 1 + (o.g % 2), vn.price_amount
from orders_seq o
join variants_numbered vn on vn.rn = ((o.g * 7) % vn.total) + 1;

with orders_seq as (
	select g, 'order-' || substr(md5(g::text || 'codely-atelier'), 1, 8) as order_id
	from generate_series(1, 28) g
),
variants_numbered as (
	select v.id as variant_id, v.product_id, p.price_amount,
		row_number() over (order by v.id) as rn, count(*) over () as total
	from product_variants v
	join products p on p.id = v.product_id
)
insert into order_lines (order_id, product_id, variant_id, quantity, unit_price_amount)
select o.order_id, vn.product_id, vn.variant_id, 1, vn.price_amount
from orders_seq o
join variants_numbered vn on vn.rn = ((o.g * 13 + 5) % vn.total) + 1
where o.g % 2 = 0
on conflict (order_id, variant_id) do nothing;

update orders o
set subtotal_amount = coalesce((select sum(ol.quantity * ol.unit_price_amount) from order_lines ol where ol.order_id = o.id), 0)
where o.id like 'order-%';

with purchases as (
	select distinct o.user_id, ol.product_id, min(o.created_at) over (partition by o.user_id, ol.product_id) as purchased_at
	from orders o
	join order_lines ol on ol.order_id = o.id
	where o.user_id <> 'user-a1c92f04'
),
numbered as (
	select user_id, product_id, purchased_at,
		abs(hashtext(user_id || product_id)) as rn
	from purchases
)
insert into product_reviews (id, product_id, user_id, rating, comment, status, created_at)
select 'review-' || substr(md5(user_id || product_id), 1, 8),
	product_id,
	user_id,
	(array[5, 4, 5, 3, 4, 5, 2, 4])[1 + (rn % 8)],
	(array[
		'Great fit and the fabric feels premium.',
		'Runs a bit large, size down if you are between sizes.',
		'My new favourite piece. Wearing it every week.',
		'Nice design, but the colour is darker than in the photos.',
		null,
		'Super comfortable and survived the washing machine perfectly.',
		'Expected better stitching for the price.',
		'Got compliments the first day I wore it.'
	])[1 + (rn % 8)],
	'published',
	purchased_at + interval '3 days'
from numbered
on conflict (id) do nothing;
