# Product-to-Collection Assignment Guide

## Overview

The product-to-collection assignment functionality allows you to organize products into collections (categories). This is a many-to-many relationship, meaning:

- One product can belong to multiple collections
- One collection can contain multiple products

## Database Structure

The relationship uses the `ProductCollection` junction table that already exists in your schema:

```prisma
model ProductCollection {
  id           String   @id @default(uuid())
  productId    String   @map("product_id")
  collectionId String   @map("collection_id")
  position     Int      @default(0)
  createdAt    DateTime @default(now()) @map("created_at")

  product    Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
}
```

## How to Assign Products to Collections

### When Creating a New Product

1. Navigate to `/admin/products`
2. Click "Add Product"
3. Fill in product details (title, description, pricing, etc.)
4. Scroll to the **Collections** section
5. Check the boxes for collections you want to assign
6. Save the product

### When Editing an Existing Product

1. Navigate to `/admin/products`
2. Click "Edit" on any product
3. Scroll to the **Collections** section
4. Check or uncheck collections as needed
5. Save the product

### Visual Indicators

- **Products List**: Each product shows purple collection badges indicating which collections it belongs to
- **Desktop View**: Collections column shows up to 2 collections with "+X more" indicator
- **Mobile View**: Collection badges appear below the product status

## API Endpoints

### Create Product with Collections

```typescript
POST /api/admin/products
{
  "title": "Product Name",
  "handle": "product-name",
  "description": "Product description",
  "collectionIds": ["collection-id-1", "collection-id-2"],
  // ... other fields
}
```

### Update Product Collections

```typescript
PUT /api/admin/products/[id]
{
  "title": "Updated Product Name",
  "collectionIds": ["collection-id-1", "collection-id-3"], // Replaces existing assignments
  // ... other fields
}
```

## Implementation Details

### Frontend (ProductForm.tsx)

- Added `selectedCollections` state to track selected collection IDs
- Displays checkboxes for all available collections
- Pre-selects collections when editing existing products
- Includes selected collection IDs in form submission

### Backend (API Routes)

**POST /api/admin/products/route.ts**

- Creates ProductCollection entries after product creation
- Links product to selected collections

**PUT /api/admin/products/[id]/route.ts**

- Deletes existing ProductCollection entries
- Creates new entries based on updated selection
- Handles empty selection (removes all associations)

### Display (ProductsTable.tsx)

- Shows collection badges in desktop table view
- Shows collection badges in mobile card view
- Limits display to 2 badges with overflow indicator
- Purple styling to match collections theme

## Important Notes

1. **No Schema Changes Needed**: The ProductCollection table already existed in your schema, so no migration is required.

2. **Cascading Deletes**: When a product or collection is deleted, the ProductCollection entries are automatically removed due to `onDelete: Cascade`.

3. **Optional Assignment**: Products don't need to be in any collection. The collectionIds array can be empty.

4. **Position Field**: The position field allows ordering products within a collection. Currently set to index order, but can be customized for manual sorting.

5. **Validation**: The handle field in products and collections must be unique to prevent conflicts.

## Testing the Feature

1. **Create a Collection**: Go to `/admin/collections` and create a test collection (e.g., "Summer Sale")
2. **Create a Product**: Go to `/admin/products/new` and create a product
3. **Assign to Collection**: Check the "Summer Sale" collection checkbox
4. **Verify**: The product should show a purple "Summer Sale" badge in the products list
5. **Edit Assignment**: Edit the product and change collection assignments
6. **Verify Again**: The badges should update to reflect the new assignments

## Future Enhancements

Potential improvements for the future:

1. **Manual Sorting**: Drag-and-drop reordering of products within collections
2. **Bulk Assignment**: Select multiple products and assign to collections at once
3. **Collection Filtering**: Filter products list by collection
4. **Product Count**: Show number of products in each collection on collections page
5. **Collection Preview**: Click collection badge to view all products in that collection

## Troubleshooting

**Collections not showing**: Make sure you've created collections first at `/admin/collections`

**Changes not saving**: Check browser console for API errors. Ensure you have admin authentication.

**Badges not appearing**: Verify the productCollections relation is included in the Prisma query for the products list.

**Duplicate handle errors**: Each product's handle must be unique. The form auto-generates handles from titles.
