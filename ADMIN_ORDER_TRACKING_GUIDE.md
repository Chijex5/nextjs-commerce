# Order Delivery Tracking System - Admin Dashboard Guide

## Overview

This document outlines the order delivery tracking system that has been implemented in the customer-facing side of the application. This guide will help you understand how to build the admin dashboard to manage order delivery statuses.

## Database Schema Changes

### Order Model Updates

The `Order` model in `prisma/schema.prisma` has been enhanced with the following fields:

```prisma
model Order {
  // ... existing fields ...
  
  // NEW FIELDS for delivery tracking
  deliveryStatus      String    @default("production") @map("delivery_status") @db.VarChar(50)
  estimatedArrival    DateTime? @map("estimated_arrival")
  
  // ... rest of fields ...
  
  @@index([deliveryStatus], name: "orders_delivery_status_idx")
}
```

### Delivery Status Values

The `deliveryStatus` field can have the following values:

1. **`production`** - Order is being manufactured/prepared in the production house
2. **`sorting`** - Order is being sorted and packaged for delivery
3. **`dispatch`** - Order is out for delivery
4. **`paused`** - Order processing is temporarily paused
5. **`completed`** - Order has been delivered
6. **`cancelled`** - Order has been cancelled

## Delivery Time Calculation Logic

The system automatically calculates estimated delivery dates based on:
- Current delivery status
- Customer's shipping location (state)
- Order date

### Calculation Rules

#### For Lagos State:
- **Production**: 7 days from order date
- **Sorting**: 3 days from order date  
- **Dispatch**: 1 day (24 hours) from order date

#### For Other States:
- **Production**: 7 days from order date
- **Sorting**: 5 days from order date
- **Dispatch**: 2 days from order date

#### Special Cases:
- **Paused**: No estimated arrival date
- **Completed**: Shows actual delivery date
- **Cancelled**: No estimated arrival date

## Admin Dashboard Requirements

### 1. Order Management Interface

The admin dashboard should provide:

#### Order List View
- Display all orders with filters for:
  - Order status (pending, processing, completed, cancelled)
  - Delivery status (production, sorting, dispatch, paused, completed, cancelled)
  - Date range
  - Customer name/email
  - Order number search

#### Order Detail View
- Show full order information
- Display current delivery status
- Show estimated arrival date
- Allow status updates

### 2. Delivery Status Management

#### Status Update Interface

Create a UI to update order delivery status:

```typescript
// Example API endpoint structure
POST /api/admin/orders/:orderId/delivery-status

Body:
{
  deliveryStatus: "production" | "sorting" | "dispatch" | "paused" | "completed" | "cancelled",
  notes?: string // Optional admin notes
}
```

#### Automatic Estimated Arrival Calculation

When updating delivery status, the system should:
1. Get the order's shipping address
2. Determine if it's Lagos or another state
3. Calculate estimated arrival based on the new status
4. Update the `estimatedArrival` field

Use the utility function from `lib/order-utils/delivery-tracking.ts`:

```typescript
import { calculateEstimatedArrival } from 'lib/order-utils/delivery-tracking';

// Example usage in admin API
const estimatedArrival = calculateEstimatedArrival(
  order.createdAt,
  newDeliveryStatus,
  order.shippingAddress
);

await prisma.order.update({
  where: { id: orderId },
  data: {
    deliveryStatus: newDeliveryStatus,
    estimatedArrival: estimatedArrival,
  }
});
```

### 3. Bulk Status Updates

For efficiency, implement bulk status updates:

```typescript
// Example: Update multiple orders to "sorting" status
POST /api/admin/orders/bulk-update

Body:
{
  orderIds: ["order-id-1", "order-id-2", ...],
  deliveryStatus: "sorting"
}
```

### 4. Status History Tracking (Optional Enhancement)

Consider adding a status history table to track all status changes:

```prisma
model OrderStatusHistory {
  id              String   @id @default(uuid())
  orderId         String   @map("order_id")
  previousStatus  String?  @map("previous_status")
  newStatus       String   @map("new_status")
  changedBy       String   @map("changed_by") // Admin user ID
  notes           String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@index([orderId])
  @@map("order_status_history")
}
```

## API Endpoints to Implement

### 1. Get Orders (Admin)
```typescript
GET /api/admin/orders
Query params:
  - page: number
  - limit: number
  - deliveryStatus?: string
  - status?: string
  - searchQuery?: string
```

### 2. Update Delivery Status
```typescript
PUT /api/admin/orders/:orderId/delivery-status
Body:
{
  deliveryStatus: string,
  notes?: string
}
```

### 3. Get Order Statistics
```typescript
GET /api/admin/orders/stats
Response:
{
  totalOrders: number,
  byDeliveryStatus: {
    production: number,
    sorting: number,
    dispatch: number,
    paused: number,
    completed: number,
    cancelled: number
  }
}
```

## UI Components Needed

### 1. Status Dropdown/Select
```tsx
<select value={deliveryStatus} onChange={handleStatusChange}>
  <option value="production">Production</option>
  <option value="sorting">Sorting & Packaging</option>
  <option value="dispatch">Out for Delivery</option>
  <option value="paused">Paused</option>
  <option value="completed">Completed</option>
  <option value="cancelled">Cancelled</option>
</select>
```

### 2. Status Badge Component
Reuse the utility functions from `lib/order-utils/delivery-tracking.ts`:
- `getDeliveryStatusColor()` - Get color classes
- `getDeliveryStatusDescription()` - Get user-friendly description
- `getDeliveryProgress()` - Get progress percentage

### 3. Delivery Timeline Visualization
Show visual progress of order through stages:
Production → Sorting → Dispatch → Delivered

## Customer Notifications (Future Enhancement)

When delivery status is updated in admin dashboard, consider:
1. Email notifications to customers
2. SMS notifications (if phone number provided)
3. In-app notifications (if implemented)

## Security Considerations

1. **Authentication**: Ensure only authenticated admin users can update order status
2. **Authorization**: Verify admin has proper permissions
3. **Audit Trail**: Log all status changes with admin user ID and timestamp
4. **Validation**: Validate delivery status values on server-side
5. **Rate Limiting**: Implement rate limiting on status update endpoints

## Testing Checklist

When building the admin dashboard, test:

- [ ] Can view all orders with their delivery status
- [ ] Can filter orders by delivery status
- [ ] Can update delivery status for single order
- [ ] Estimated arrival date updates correctly when status changes
- [ ] Lagos vs other states have different delivery times
- [ ] Bulk status updates work correctly
- [ ] Status changes are reflected in customer view immediately
- [ ] Invalid status values are rejected
- [ ] Only admin users can update statuses
- [ ] Status history is tracked (if implemented)

## Utility Functions Reference

All delivery tracking utilities are in `lib/order-utils/delivery-tracking.ts`:

```typescript
// Calculate estimated arrival date
calculateEstimatedArrival(orderDate, deliveryStatus, shippingAddress)

// Get human-readable status description
getDeliveryStatusDescription(status)

// Get CSS classes for status badge
getDeliveryStatusColor(status)

// Format date for display
formatEstimatedArrival(date)

// Get progress percentage (0-100)
getDeliveryProgress(status)
```

## Migration Steps

If you already have existing orders in the database:

1. Run the database migration to add new fields
2. Set default `deliveryStatus` to "production" for all existing orders
3. Calculate and set `estimatedArrival` for all active orders

```typescript
// Example migration script
const orders = await prisma.order.findMany({
  where: {
    status: { not: 'completed' }
  }
});

for (const order of orders) {
  const estimatedArrival = calculateEstimatedArrival(
    order.createdAt,
    'production',
    order.shippingAddress
  );
  
  await prisma.order.update({
    where: { id: order.id },
    data: {
      deliveryStatus: 'production',
      estimatedArrival
    }
  });
}
```

## Support

For questions or issues with the delivery tracking system:
1. Review this documentation
2. Check the utility functions in `lib/order-utils/delivery-tracking.ts`
3. Review the customer-facing implementation in `app/orders/page.tsx`
4. Check the API endpoints in `app/api/orders/`
