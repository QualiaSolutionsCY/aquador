```markdown
# aquador Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns and workflows for the `aquador` repository, a TypeScript and Next.js codebase. It covers coding conventions, file organization, commit practices, and the main workflows for developing features, APIs, admin dashboards, database migrations, storefront optimizations, and project tracking. It is intended to help contributors quickly understand how to work effectively in this project.

## Coding Conventions

- **File Naming:** Use `camelCase` for file names.
  - Example: `productService.ts`, `adminSidebar.tsx`
- **Import Style:** Use alias imports (e.g., `import { foo } from '@/lib/bar'`).
  - Example:
    ```typescript
    import { getProduct } from '@/lib/productService'
    ```
- **Export Style:** Mixed (both named and default exports are used).
  - Example:
    ```typescript
    // Named export
    export function fetchData() { ... }
    
    // Default export
    export default function AdminSidebar() { ... }
    ```
- **Commit Messages:** Follow conventional commit style.
  - Prefixes: `fix`, `perf`, `docs`, `chore`, `report`
  - Example: `fix: correct product filter logic`
- **Directory Structure:**
  - Application pages: `src/app/`
  - Components: `src/components/`
  - Shared logic and types: `src/lib/`
  - Database migrations: `supabase/migrations/`
  - Planning and reports: `.planning/`

## Workflows

### Admin Feature Development
**Trigger:** When adding a new admin dashboard or feature (e.g., perfume intelligence desk, product filters).  
**Command:** `/new-admin-feature`

1. Create or update the admin page component under `src/app/admin/...`
2. Implement or update client logic in `src/app/admin/...` or `src/components/admin/...`
3. Add or update the API route under `src/app/api/admin/...`
4. Update shared types or logic in `src/lib/...`
5. Update or create Supabase migration(s) in `supabase/migrations/`
6. Optionally update sidebar/navigation in `src/components/admin/AdminSidebar.tsx`

**Example:**
```typescript
// src/app/admin/perfume-intelligence/page.tsx
import PerfumeDesk from '@/components/admin/PerfumeDesk'
export default function PerfumeIntelligencePage() {
  return <PerfumeDesk />
}
```

---

### API Implementation and Hardening
**Trigger:** When adding or improving an API endpoint, especially for admin or business logic.  
**Command:** `/new-api-endpoint`

1. Create or update the API route under `src/app/api/...`
2. Improve parsing, validation, or error handling in the route file
3. Add or update related logic in `src/lib/...`
4. Add or update tests in `src/lib/*/__tests__/*.test.ts`
5. Optionally update types in `src/lib/*/types.ts`

**Example:**
```typescript
// src/app/api/admin/products/route.ts
import { getProducts } from '@/lib/productService'
export async function GET(req: Request) {
  try {
    const products = await getProducts()
    return Response.json(products)
  } catch (e) {
    return new Response('Error fetching products', { status: 500 })
  }
}
```

---

### Database Migration and Service Update
**Trigger:** When changing the database schema or adding new backend logic.  
**Command:** `/new-migration`

1. Create or update migration file in `supabase/migrations/`
2. Update or add service logic in `src/lib/supabase/*.ts`
3. Update types in `src/lib/supabase/types.ts`
4. Optionally update related admin or API files

**Example:**
```sql
-- supabase/migrations/20240601_add_perfume_table.sql
CREATE TABLE perfumes (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  brand text
);
```
```typescript
// src/lib/supabase/perfumeService.ts
export async function getPerfumes() { ... }
```

---

### Feature Implementation with Tests and Docs
**Trigger:** When adding a new feature or fix with proper test and documentation coverage.  
**Command:** `/new-feature`

1. Implement or fix the feature in `src/app/...`, `src/components/...`, or `src/lib/...`
2. Add or update unit/integration tests in `src/lib/*/__tests__/*.test.ts` or `src/app/api/*/__tests__/*.test.ts`
3. Update documentation in `.planning/HANDOFF.md` or related docs

**Example:**
```typescript
// src/lib/productUtils.ts
export function filterByBrand(products, brand) {
  return products.filter(p => p.brand === brand)
}

// src/lib/__tests__/productUtils.test.ts
import { filterByBrand } from '../productUtils'
test('filters products by brand', () => {
  // ...
})
```

---

### Project State and Report Tracking
**Trigger:** When recording project progress, handoff, or session reports.  
**Command:** `/update-project-state`

1. Update `.planning/STATE.md`
2. Update `.planning/qualia/state.jsonl`
3. Update `.planning/tracking.json`
4. Add or update report files in `.planning/reports/`

**Example:**
```markdown
<!-- .planning/STATE.md -->
## 2024-06-01
- Perfume Intelligence Desk: In progress
- Product filter API: Completed
```

---

### Storefront Optimization and UI Adjustment
**Trigger:** When improving storefront performance or adjusting product/shop UI.  
**Command:** `/optimize-storefront`

1. Update storefront page(s) in `src/app/shop/...`, `src/app/products/...`
2. Update related components in `src/components/storefront/...`
3. Update or optimize service logic in `src/lib/supabase/product-service.ts`
4. Optionally update planning/optimization report in `.planning/reports/optimize/OPTIMIZE.md`

**Example:**
```typescript
// src/components/storefront/ProductGrid.tsx
import { memo } from 'react'
export default memo(function ProductGrid({ products }) { ... })
```

---

## Testing Patterns

- **Framework:** Jest
- **Test File Pattern:** `*.test.ts`
- **Location:** Place tests in `__tests__` subfolders within `src/lib/` or `src/app/api/`
- **Example:**
  ```typescript
  // src/lib/__tests__/utils.test.ts
  import { sum } from '../utils'
  test('adds numbers', () => {
    expect(sum(1, 2)).toBe(3)
  })
  ```

## Commands

| Command               | Purpose                                                    |
|-----------------------|------------------------------------------------------------|
| /new-admin-feature    | Start a new admin dashboard or feature workflow            |
| /new-api-endpoint     | Add or improve an API endpoint                             |
| /new-migration        | Add or update a database migration and related services    |
| /new-feature          | Implement a new feature or fix with tests and docs         |
| /update-project-state | Update project state, tracking, or reports                 |
| /optimize-storefront  | Optimize storefront performance or adjust UI               |
```
