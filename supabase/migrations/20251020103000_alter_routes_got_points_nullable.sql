-- migration: alter_routes_got_points_nullable
-- purpose: modify the got_points column in the pathly.routes table to be nullable.
-- affected: pathly.routes table
-- special considerations: this change allows for routes to be created without an initial point value,
-- which can be assigned later.

-- alter the 'got_points' column in 'pathly.routes' to remove the not null constraint.
-- this makes the column nullable, aligning it with the updated database plan where this field is optional.
alter table pathly.routes
alter column got_points drop not null;
