-- An order can take several payments (custom deposit + balance), so order_id
-- is indexed but no longer unique. payment_transactions_order_id_idx stays.
DROP INDEX IF EXISTS "payment_transactions_order_id_unique";
