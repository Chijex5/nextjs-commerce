# Bulk Product Editor - Visual Guide for Variant Support

## Interface Overview

### Main View (Product Collapsed)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Bulk Product Editor                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  [+ Add Row] [Duplicate] [Delete] | Bulk: [Available] [Unavailable]        │
│  [Columns ▼]                      [0 changed, 0 to delete] [Save All]       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Search products...                                                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──┬──┬─────────────────┬─────────────┬────────┬───────────┬──────────────┬────────────┐
│☐ │▶ │ Title           │ Handle      │Price(₦)│ Available │ Status       │ Variants   │
├──┼──┼─────────────────┼─────────────┼────────┼───────────┼──────────────┼────────────┤
│☐ │▶ │ Classic T-Shirt │classic-tee  │ 5000   │    ☑      │              │[3 variants]│
│☐ │▶ │ Running Shoes   │running-shoes│ 8000   │    ☑      │ Modified     │[6 variants]│
│☐ │▶ │ Denim Jeans     │denim-jeans  │ 12000  │    ☑      │              │[4 variants]│
└──┴──┴─────────────────┴─────────────┴────────┴───────────┴──────────────┴────────────┘
```

### Expanded View (Showing Variants)

```
┌──┬──┬─────────────────┬─────────────┬────────┬───────────┬──────────────┬────────────┐
│☐ │▼ │ Classic T-Shirt │classic-tee  │ 5000   │    ☑      │              │[3 variants]│
├──┼──┼─────────────────────────────────────────────────────────────────────────────────┤
│  │↳ │ Variant Details:                                                                │
│  │  │ ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  │ │ Title: Small / Red           Price: 5000  Available: ☑  [Delete]  New  │   │
│  │  │ └──────────────────────────────────────────────────────────────────────────┘   │
│  │  │ ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  │ │ Title: Medium / Red          Price: 5000  Available: ☑  [Delete]        │   │
│  │  │ └──────────────────────────────────────────────────────────────────────────┘   │
│  │  │ ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  │ │ Title: Large / Red           Price: 6000  Available: ☑  [Delete]  Mod.  │   │
│  │  │ └──────────────────────────────────────────────────────────────────────────┘   │
│  │  │ [+ Add Variant]                                                               │
├──┼──┼─────────────────┴─────────────┴────────┴───────────┴──────────────┴────────────┤
│☐ │▶ │ Running Shoes   │running-shoes│ 8000   │    ☑      │ Modified     │[6 variants]│
└──┴──┴─────────────────┴─────────────┴────────┴───────────┴──────────────┴────────────┘
```

### Variants Modal (Detailed View)

```
┌────────────────────────────────────────────────────────────────┐
│  Manage Variants                                         [X]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Title: Small / Red                                       │ │
│  │ Price (₦): 5000                                          │ │
│  │ Available: ☑                                             │ │
│  │ [Delete]                                          New    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Title: Medium / Red                                      │ │
│  │ Price (₦): 5000                                          │ │
│  │ Available: ☑                                             │ │
│  │ [Delete]                                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Title: Large / Red                                       │ │
│  │ Price (₦): 6000                                          │ │
│  │ Available: ☑                                             │ │
│  │ [Delete]                                       Modified  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [+ Add Variant]                                              │
│                                                                │
│                                   [Cancel]  [Save]            │
└────────────────────────────────────────────────────────────────┘
```

## Key UI Elements

### 1. Expand/Collapse Arrow

- **Location**: Second column, next to checkbox
- **Symbol**: ▶ (collapsed) or ▼ (expanded)
- **Purpose**: Toggle visibility of variants
- **Behavior**: Click to expand/collapse variant list

### 2. Variant Count Button

- **Location**: Last column ("Variants")
- **Style**: Purple background, rounded
- **Format**: "X variant(s)"
- **Purpose**: Shows variant count and opens detailed modal
- **Behavior**: Click to open variants modal

### 3. Variant Rows (Inline)

- **Style**: Light gray background, left purple border
- **Indentation**: Arrow symbol (↳) to show hierarchy
- **Layout**: Horizontal form with inline inputs
- **Fields**:
  - Title (flexible width text input)
  - Price (₦) (narrow numeric input)
  - Available (checkbox)
  - Delete button (red)
  - Status label (green/amber)

### 4. Add Variant Button (Inline)

- **Location**: Below last variant in expanded view
- **Style**: Green background
- **Text**: "+ Add Variant"
- **Purpose**: Create new variant for the product

### 5. Status Indicators

#### Product Level

- **Green badge**: "New" - newly created product
- **Amber badge**: "Modified" - edited product

#### Variant Level

- **Green text**: "New" - newly created variant
- **Amber text**: "Modified" - edited variant
- No label for unchanged variants

### 6. Color Coding

- **Purple**: Variant-related elements (button, border)
- **Green**: New items, add buttons, save button
- **Amber**: Modified items, warning states
- **Red**: Delete buttons, destructive actions
- **Blue**: Selected rows, primary actions
- **Gray**: Neutral backgrounds, disabled states

## User Flows

### Flow 1: Edit Variant Price

1. Click ▶ arrow next to product
2. Product expands showing variants
3. Click in price field of target variant
4. Type new price
5. Field shows "Modified" label
6. Product row shows amber background
7. Toolbar shows "1 changed"
8. Click "Save All Changes"
9. Variants saved via API

### Flow 2: Add New Variant

1. Click ▶ to expand product
2. Scroll to bottom of variants
3. Click "+ Add Variant"
4. New variant row appears with "New" label
5. Edit title, price, availability
6. Product marked as modified
7. Save changes when ready

### Flow 3: Delete Variant

1. Expand product or open modal
2. Click "Delete" on variant
3. Variant marked with strikethrough (in some views)
4. Product marked as modified
5. On save, variant permanently deleted

### Flow 4: Manage Multiple Products

1. Expand first product
2. Edit variants
3. Collapse first product
4. Expand second product
5. Edit its variants
6. Continue for all products
7. One "Save All" applies everything

### Flow 5: Use Modal for Complex Edits

1. Click purple "X variant(s)" button
2. Modal opens with all variants
3. Edit multiple variants in comfortable view
4. Add new variants with modal button
5. Click "Save" in modal
6. Changes applied to product (in memory)
7. Click "Save All Changes" to persist

## Responsive Behavior

**Desktop Optimized** (Current Implementation)

- Full table layout with all columns visible
- Inline editing in table cells
- Modal for comfortable detailed editing
- Horizontal scrolling for wide tables

**Note**: Mobile optimization not yet implemented. This is a desktop-first admin tool.

## Accessibility

- Keyboard navigation: Tab through fields, Enter to submit
- Clear labels on all form inputs
- Status indicators with text (not color-only)
- Sufficient color contrast ratios
- Button hover states for visual feedback
- Focus states on interactive elements

## Performance Considerations

- Variants loaded with product data (single fetch)
- Expand/collapse is client-side (no additional API calls)
- Changes tracked in memory until save
- Batch save minimizes API requests
- Pagination keeps product count manageable
