import { prisma } from './prisma';
import { Cart, CartItem } from '../shopify/types';

// Helper function to calculate cart totals
function calculateCartTotals(items: any[]) {
  let subtotal = 0;
  let quantity = 0;

  items.forEach((item) => {
    const itemPrice = parseFloat(item.merchandise.priceAmount);
    subtotal += itemPrice * item.quantity;
    quantity += item.quantity;
  });

  return {
    subtotalAmount: subtotal.toFixed(2),
    totalAmount: subtotal.toFixed(2),
    totalTaxAmount: '0.00',
    totalQuantity: quantity,
  };
}

// Create a new cart
export async function createDbCart(): Promise<Cart> {
  const cart = await prisma.cart.create({
    data: {
      subtotalAmount: '0.00',
      totalAmount: '0.00',
      totalTaxAmount: '0.00',
      totalQuantity: 0,
    },
    include: {
      lines: {
        include: {
          merchandise: {
            include: {
              selectedOptions: true,
            },
          },
          product: {
            include: {
              featuredImage: true,
            },
          },
        },
      },
    },
  });

  return {
    id: cart.id,
    checkoutUrl: `/cart/${cart.id}/checkout`,
    cost: {
      subtotalAmount: {
        amount: cart.subtotalAmount,
        currencyCode: cart.subtotalCurrency,
      },
      totalAmount: {
        amount: cart.totalAmount,
        currencyCode: cart.totalCurrency,
      },
      totalTaxAmount: {
        amount: cart.totalTaxAmount,
        currencyCode: cart.totalTaxCurrency,
      },
    },
    lines: [],
    totalQuantity: cart.totalQuantity,
  };
}

// Get cart by ID
export async function getDbCart(cartId: string): Promise<Cart | null> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      lines: {
        include: {
          merchandise: {
            include: {
              selectedOptions: true,
            },
          },
          product: {
            include: {
              featuredImage: true,
            },
          },
        },
      },
    },
  });

  if (!cart) return null;

  return {
    id: cart.id,
    checkoutUrl: `/cart/${cart.id}/checkout`,
    cost: {
      subtotalAmount: {
        amount: cart.subtotalAmount,
        currencyCode: cart.subtotalCurrency,
      },
      totalAmount: {
        amount: cart.totalAmount,
        currencyCode: cart.totalCurrency,
      },
      totalTaxAmount: {
        amount: cart.totalTaxAmount,
        currencyCode: cart.totalTaxCurrency,
      },
    },
    lines: cart.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      cost: {
        totalAmount: {
          amount: line.totalAmount,
          currencyCode: line.totalCurrency,
        },
      },
      merchandise: {
        id: line.merchandiseId,
        title: line.merchandise.title,
        selectedOptions: line.merchandise.selectedOptions.map((opt) => ({
          name: opt.name,
          value: opt.value,
        })),
        product: {
          id: line.product.id,
          handle: line.product.handle,
          title: line.product.title,
          featuredImage: line.product.featuredImage
            ? {
                url: line.product.featuredImage.url,
                altText: line.product.featuredImage.altText,
                width: line.product.featuredImage.width,
                height: line.product.featuredImage.height,
              }
            : {
                url: '',
                altText: '',
                width: 0,
                height: 0,
              },
        },
      },
    })),
    totalQuantity: cart.totalQuantity,
  };
}

// Add items to cart
export async function addToDbCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  // First, get variant and product details
  for (const line of lines) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: line.merchandiseId },
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw new Error(`Variant ${line.merchandiseId} not found`);
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        merchandiseId: line.merchandiseId,
      },
    });

    const itemTotal = (parseFloat(variant.priceAmount) * line.quantity).toFixed(2);

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + line.quantity,
          totalAmount: (
            parseFloat(existingItem.totalAmount) + parseFloat(itemTotal)
          ).toFixed(2),
        },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId,
          merchandiseId: line.merchandiseId,
          productId: variant.productId,
          quantity: line.quantity,
          totalAmount: itemTotal,
          totalCurrency: variant.priceCurrency,
        },
      });
    }
  }

  // Recalculate cart totals
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      merchandise: true,
    },
  });

  const totals = calculateCartTotals(cartItems);

  await prisma.cart.update({
    where: { id: cartId },
    data: totals,
  });

  const updatedCart = await getDbCart(cartId);
  if (!updatedCart) {
    throw new Error('Cart not found after update');
  }

  return updatedCart;
}

// Remove items from cart
export async function removeFromDbCart(cartId: string, lineIds: string[]): Promise<Cart> {
  await prisma.cartItem.deleteMany({
    where: {
      cartId,
      id: { in: lineIds },
    },
  });

  // Recalculate cart totals
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      merchandise: true,
    },
  });

  const totals = calculateCartTotals(cartItems);

  await prisma.cart.update({
    where: { id: cartId },
    data: totals,
  });

  const updatedCart = await getDbCart(cartId);
  if (!updatedCart) {
    throw new Error('Cart not found after update');
  }

  return updatedCart;
}

// Update cart items
export async function updateDbCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  for (const line of lines) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: line.merchandiseId },
    });

    if (!variant) {
      throw new Error(`Variant ${line.merchandiseId} not found`);
    }

    const itemTotal = (parseFloat(variant.priceAmount) * line.quantity).toFixed(2);

    await prisma.cartItem.update({
      where: { id: line.id },
      data: {
        quantity: line.quantity,
        totalAmount: itemTotal,
      },
    });
  }

  // Recalculate cart totals
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      merchandise: true,
    },
  });

  const totals = calculateCartTotals(cartItems);

  await prisma.cart.update({
    where: { id: cartId },
    data: totals,
  });

  const updatedCart = await getDbCart(cartId);
  if (!updatedCart) {
    throw new Error('Cart not found after update');
  }

  return updatedCart;
}
