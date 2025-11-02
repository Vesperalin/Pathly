# Database Schema for Pathly

This document outlines the comprehensive PostgreSQL database schema for the Pathly application, designed to be used with Supabase.

## 1. Tables

All application-specific tables are located within the `pathly` schema to keep them separate from Supabase's internal schemas (e.g., `auth`).

### Custom Types

```sql
CREATE TYPE pathly.language_enum AS ENUM ('pl', 'en');
CREATE TYPE pathly.theme_enum AS ENUM ('light', 'dark', 'system');
CREATE TYPE pathly.analytics_event_type_enum AS ENUM (
  'account_created', 'route_added', 'catalog_created', 'route_assigned_to_catalog'
);
```

---

### Table: `pathly.profiles`

| Column Name  | Data Type              | Constraints                                              |
| ------------ | ---------------------- | -------------------------------------------------------- |
| `id`         | `uuid`                 | `PRIMARY KEY`, `REFERENCES auth.users ON DELETE CASCADE` |
| `language`   | `pathly.language_enum` | `NOT NULL`, `DEFAULT 'pl'`                               |
| `theme`      | `pathly.theme_enum`    | `NOT NULL`, `DEFAULT 'system'`                           |
| `created_at` | `timestamptz`          | `NOT NULL`, `DEFAULT now()`                              |

---

### Table: `pathly.catalogs`

| Column Name     | Data Type      | Constraints                                           |
| --------------- | -------------- | ----------------------------------------------------- |
| `id`            | `uuid`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`            |
| `user_id`       | `uuid`         | `NOT NULL`, `REFERENCES auth.users ON DELETE CASCADE` |
| `name`          | `varchar(255)` | `NOT NULL`                                            |
| `is_predefined` | `boolean`      | `NOT NULL`, `DEFAULT false`                           |
| `created_at`    | `timestamptz`  | `NOT NULL`, `DEFAULT now()`                           |
| `updated_at`    | `timestamptz`  | `NOT NULL`, `DEFAULT now()`                           |

**Note on User Point Summaries**: The summary of a user's earned points for any given catalog is a dynamic value. It will be calculated in real-time by summing the `got_points` from all routes associated with that catalog. This approach ensures data integrity and avoids the complexity of keeping a stored sum synchronized. Static information, like the points required to earn a badge, is managed by the frontend application.

---

### Table: `pathly.routes`

| Column Name     | Data Type       | Constraints                                           |
| --------------- | --------------- | ----------------------------------------------------- |
| `id`            | `uuid`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`            |
| `user_id`       | `uuid`          | `NOT NULL`, `REFERENCES auth.users ON DELETE CASCADE` |
| `name`          | `varchar(255)`  | `NOT NULL`                                            |
| `route_date`    | `date`          | `NOT NULL`                                            |
| `got_points`    | `smallint`      | `CHECK (got_points >= 0)`                             |
| `distance`      | `numeric(7, 2)` | `NOT NULL`, `CHECK (distance >= 0)`                   |
| `total_ascent`  | `numeric(6, 2)` | `NOT NULL`, `CHECK (total_ascent >= 0)`               |
| `total_descent` | `numeric(6, 2)` | `NOT NULL`, `CHECK (total_descent >= 0)`              |
| `duration`      | `integer`       | `NOT NULL`, `CHECK (duration >= 0)`                   |
| `notes`         | `text`          | `NULL`                                                |
| `created_at`    | `timestamptz`   | `NOT NULL`, `DEFAULT now()`                           |
| `updated_at`    | `timestamptz`   | `NOT NULL`, `DEFAULT now()`                           |

---

### Table: `pathly.mountain_groups`

| Column Name | Data Type      | Constraints                                |
| ----------- | -------------- | ------------------------------------------ |
| `id`        | `uuid`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` |
| `name`      | `varchar(255)` | `NOT NULL`                                 |
| `symbol`    | `varchar(40)`  | `NOT NULL`                                 |

---

### Table: `pathly.route_catalogs`

| Column Name  | Data Type     | Constraints                                                   |
| ------------ | ------------- | ------------------------------------------------------------- |
| `route_id`   | `uuid`        | `PRIMARY KEY`, `REFERENCES pathly.routes ON DELETE CASCADE`   |
| `catalog_id` | `uuid`        | `PRIMARY KEY`, `REFERENCES pathly.catalogs ON DELETE CASCADE` |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                   |

---

### Table: `pathly.route_mountain_groups`

| Column Name         | Data Type     | Constraints                                                           |
| ------------------- | ------------- | --------------------------------------------------------------------- |
| `route_id`          | `uuid`        | `PRIMARY KEY`, `REFERENCES pathly.routes ON DELETE CASCADE`           |
| `mountain_group_id` | `uuid`        | `PRIMARY KEY`, `REFERENCES pathly.mountain_groups ON DELETE RESTRICT` |
| `created_at`        | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           |

---

### Table: `pathly.analytics_events`

| Column Name  | Data Type                          | Constraints                                           |
| ------------ | ---------------------------------- | ----------------------------------------------------- |
| `id`         | `uuid`                             | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`            |
| `user_id`    | `uuid`                             | `NOT NULL`, `REFERENCES auth.users ON DELETE CASCADE` |
| `event_type` | `pathly.analytics_event_type_enum` | `NOT NULL`                                            |
| `created_at` | `timestamptz`                      | `NOT NULL`, `DEFAULT now()`                           |

---

### Table for users

This table is managed by Supabase Auth

## 2. Relationships

- `auth.users` 1-to-1 `pathly.profiles`
- `auth.users` 1-to-Many `pathly.catalogs`
- `auth.users` 1-to-Many `pathly.routes`
- `pathly.routes` Many-to-Many `pathly.catalogs` (via `pathly.route_catalogs`)
- `pathly.routes` Many-to-Many `pathly.mountain_groups` (via `pathly.route_mountain_groups`)

## 3. Indexes

- **Primary & Foreign Keys**: Indexes are automatically created.
- **Custom Indexes**:
  - Unique partial index on `pathly.catalogs(user_id, name)` where `is_predefined = false`.
  - Unique composite index on `pathly.routes(user_id, name)`.

## 4. Row-Level Security (RLS)

- **`pathly.profiles`**: Users can `SELECT` and `UPDATE` their own profile.
- **`pathly.catalogs`**: Users can `SELECT` own/predefined, `INSERT` own, and `UPDATE`/`DELETE` own custom catalogs.
- **`pathly.routes`**: Full `CRUD` on own routes.
- **`pathly.mountain_groups`**: Authenticated users can `SELECT`.
- **`pathly.analytics_events`**: Users can `INSERT` own events; `SELECT` restricted.
