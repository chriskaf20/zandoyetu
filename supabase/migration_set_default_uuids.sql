-- Migration: Set default UUID generator on tables missing it
-- Fixes "null value in column 'id' of relation 'products' violates not-null constraint"

ALTER TABLE public.products 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.orders 
ALTER COLUMN id SET DEFAULT gen_random_uuid();
