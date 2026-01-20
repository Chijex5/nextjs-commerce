# Bulk Product Editor - Implementation Guide

## Overview

The Bulk Product Editor is a Shopify-style spreadsheet interface for managing multiple products efficiently. It allows admins to edit dozens of products simultaneously with inline editing, bulk operations, and smart validation.

## Access

Navigate to `/admin/products/bulk-edit` or click the "Bulk Edit" button on the main products page.

## Features

### 1. Spreadsheet Interface

- **Inline Editing**: Click any cell to edit directly
- **Keyboard Navigation**: Tab, Enter, and Escape keys for quick editing
- **Visual Feedback**: Color-coded rows
  - Green background = New product
  - Amber background = Modified product
  - Blue background = Selected row
- **Sticky Header**: Column headers stay visible when scrolling

### 2. Column Management

**Required Columns** (always visible):

- Title
- Handle
- Price (₦)
- Available (checkbox)

**Optional Columns** (toggle via dropdown):

- Collections (multi-select)
- Tags (comma-separated)
- Description (modal editor)
- SEO Title
- SEO Description

### 3. Row Operations

#### Add Row

- Click "Add Row" to create a new product
- Row appears at the top with green background
- All fields empty and ready to fill

#### Duplicate

- Select one or more products (checkboxes)
- Click "Duplicate Selected"
- Creates copies with "(Copy)" appended to title
- Handles auto-modified to avoid conflicts

#### Delete

- Select products to delete
- Click "Delete Selected"
- Rows marked for deletion (grayed out)
- Actually deleted when you click "Save All Changes"

### 4. Bulk Actions

#### Set Availability

- Select multiple products
- Click "Set Available" or "Set Unavailable"
- Updates availability for all selected products

#### Assign Collections

- Select products
- Use bulk collections modal (future enhancement)
- Apply to all selected rows

### 5. Smart Features

#### Auto-Generate Handle

- When typing a title for a new product
- Handle automatically generated from title
- Converts to lowercase, replaces spaces with hyphens
- Can be manually edited after generation

#### Modal Editors

**Description Modal**:

- Click description cell to open modal
- Larger textarea for comfortable editing
- Save or cancel changes

**Collections Modal**:

- Click collections cell to open
- Checkboxes for all available collections
- Select multiple collections per product
- Shows count of selected collections in cell

#### Input Types

- **Text**: Standard text input for titles, handles, SEO
- **Number**: Numeric input for prices
- **Checkbox**: Boolean for availability
- **Tags**: Comma-separated text input
- **Textarea**: Modal for long descriptions
- **Multi-select**: Modal for collections

### 6. Save System

#### Change Tracking

- **New products**: Green highlight
- **Modified products**: Amber highlight
- Status indicator column shows "New" or "Modified"

#### Validation

- Required fields checked before saving:
  - Title (must not be empty)
  - Handle (must not be empty)
- Shows error toast if validation fails

#### Batch Save

- "Save All Changes" button shows pending count
- Example: "5 changed, 2 to delete"
- Single click saves all changes:
  - Creates new products
  - Updates modified products
  - Deletes marked products
- Success toast confirms save
- Table refreshes with latest data

### 7. Search and Pagination

#### Search

- Search bar filters products by title, handle, or tags
- Real-time search as you type
- Resets to page 1 when searching

#### Pagination

- Shows 50 products per page
- Previous/Next buttons
- Current page indicator

## Technical Details

### Component Structure

```
app/admin/products/bulk-edit/page.tsx
  └─ BulkProductEditor.tsx (main component)
```

### State Management

- Products array with tracking flags (isNew, isModified, isDeleted)
- Selected rows (Set of product IDs)
- Visible columns (Set of column keys)
- Editing cell (current active cell)
- Modal states for description and collections

### API Integration

- **GET /api/admin/products**: Fetch products with pagination
- **GET /api/admin/collections**: Fetch all collections
- **POST /api/admin/products**: Create new product
- **PUT /api/admin/products/[id]**: Update existing product
- **DELETE /api/admin/products/[id]**: Delete product

### Data Flow

1. Fetch products and collections on load
2. User edits cells (updates local state)
3. Changes tracked with flags
4. Save validates and sends batch requests
5. Refresh table after successful save

## Usage Workflow

### Creating New Products

1. Click "Add Row"
2. Type product title (handle auto-generates)
3. Enter price
4. Toggle availability if needed
5. Click collections cell to assign
6. Add tags if desired
7. Click "Save All Changes"

### Editing Existing Products

1. Search or navigate to products
2. Click cells to edit values
3. Product row highlights in amber
4. Status shows "Modified"
5. Click "Save All Changes" when done

### Bulk Editing

1. Select multiple products (checkboxes)
2. Use bulk actions toolbar:
   - Set availability
   - Assign collections
3. Or edit individual cells
4. Save when complete

### Duplicating Products

1. Select products to duplicate
2. Click "Duplicate Selected"
3. Copies appear at top in green
4. Edit titles and handles to customize
5. Save when ready

## Best Practices

### Column Selection

- Hide optional columns you don't need
- Keeps table width manageable
- Focus on fields you're editing

### Batch Operations

- Select multiple products for efficiency
- Use bulk actions for common changes
- Edit one field across many products

### Validation

- Fill title and handle for all new products
- Use unique handles to avoid conflicts
- Check price values before saving

### Performance

- 50 products per page keeps it responsive
- Use search to find specific products
- Save frequently to avoid losing work

## Desktop-Optimized

This interface is specifically designed for desktop use:

- Wide table layout utilizes full screen width
- No mobile responsiveness
- Optimized for keyboard and mouse interaction
- Professional spreadsheet-like experience

## Relationship with CSV Import

The bulk editor **complements** the existing CSV bulk import:

- **CSV Import**: Best for initial catalog import from external sources
- **Bulk Editor**: Best for ongoing maintenance and updates
- Both methods available from main products page

Use whichever method fits your workflow!

## Future Enhancements (Potential)

- Auto-save drafts to prevent data loss
- Undo/redo functionality
- Copy-paste between cells
- Excel/CSV export of current view
- ~~Variant editing within bulk editor~~ ✅ **IMPLEMENTED**
- Image URL assignment
- Bulk price adjustments (% increase/decrease)
- Filter by collection or availability

## New: Variant Management ✨

The bulk editor now supports full variant management! See [VARIANT_SUPPORT_IMPLEMENTATION.md](VARIANT_SUPPORT_IMPLEMENTATION.md) for complete details.

### Quick Overview

- **Expandable rows**: Click arrow (▶) to show/hide variants
- **Inline editing**: Edit variant title, price, availability directly
- **Variants modal**: Click "X variant(s)" button for detailed view
- **Add/Delete**: Create new variants or remove existing ones
- **Change tracking**: Visual indicators for new/modified variants
- **Batch save**: All variant changes saved with "Save All Changes"

### Use Cases

- Products with size variations (S, M, L, XL)
- Products with color options at different prices
- Size + Color combinations
- Seasonal price adjustments per variant

## Troubleshooting

**Changes not saving?**

- Check for validation errors (empty title/handle)
- Ensure you clicked "Save All Changes"
- Look for error toasts
- Check variant prices are valid numbers

**Can't see all columns?**

- Use column selector dropdown
- Toggle optional columns on/off

**Products not loading?**

- Check your network connection
- Refresh the page
- Check browser console for errors

**Handle conflicts?**

- Ensure handles are unique
- Check for duplicate handle errors
- Modify handle to be unique

**Variant issues?**

- Ensure variant prices are valid numbers (>= 0)
- Check that variants have titles
- Expand row to see all variants
- Use variants modal for complex edits

## Summary

The Bulk Product Editor provides a powerful, efficient way to manage large product catalogs. With its spreadsheet-style interface, inline editing, bulk operations, and **now variant management**, it makes catalog management fast and intuitive. Perfect for desktop workflows where you need to update multiple products and their price variations quickly!
