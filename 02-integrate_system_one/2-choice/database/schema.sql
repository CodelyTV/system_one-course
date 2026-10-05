drop table if exists product_reviews;
drop table if exists order_lines;
drop table if exists orders;
drop table if exists checkout_lines;
drop table if exists checkouts;
drop table if exists product_variants;
drop table if exists products;
drop table if exists users;

create table users (
	id text primary key,
	name text not null,
	email text not null unique
);

create table products (
	id text primary key,
	name text not null,
	collection text not null,
	category text not null,
	description text not null,
	price_amount integer not null,
	price_currency text not null default 'EUR',
	badges text[] not null default '{}',
	accent text not null
);

create table product_variants (
	id text primary key,
	product_id text not null references products(id) on delete cascade,
	color text not null,
	color_hex text not null,
	size text not null,
	online_stock integer not null,
	chest integer not null,
	length integer not null
);

create table checkouts (
	id text primary key,
	delivery_method text not null default 'home-delivery',
	status text not null default 'draft'
);

create table checkout_lines (
	checkout_id text not null references checkouts(id) on delete cascade,
	product_id text not null references products(id) on delete cascade,
	variant_id text not null references product_variants(id) on delete cascade,
	quantity integer not null,
	primary key (checkout_id, variant_id)
);

create table orders (
	id text primary key,
	user_id text not null references users(id),
	delivery_method text not null default 'home-delivery',
	subtotal_amount integer not null,
	currency text not null default 'EUR',
	status text not null default 'confirmed',
	created_at timestamptz not null default now()
);

create table order_lines (
	order_id text not null references orders(id) on delete cascade,
	product_id text not null references products(id) on delete cascade,
	variant_id text not null references product_variants(id) on delete cascade,
	quantity integer not null,
	unit_price_amount integer not null,
	primary key (order_id, variant_id)
);

create table product_reviews (
	id text primary key,
	product_id text not null references products(id) on delete cascade,
	user_id text not null references users(id),
	rating integer not null check (rating between 1 and 5),
	comment text,
	status text not null check (status in ('pending-validation', 'published', 'spam')),
	label text check (label in ('product', 'shipping', 'packaging', 'customer-service', 'price', 'other')),
	created_at timestamptz not null default now()
);
