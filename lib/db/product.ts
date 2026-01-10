import { prisma } from './prisma';
import { Product } from '../shopify/types';

// Helper function to transform database product to API format
function transformProduct(product: any): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    availableForSale: product.availableForSale,
    tags: product.tags,
    updatedAt: product.updatedAt.toISOString(),
    featuredImage: product.featuredImage
      ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText,
          width: product.featuredImage.width,
          height: product.featuredImage.height,
        }
      : {
          url: '',
          altText: '',
          width: 0,
          height: 0,
        },
    images: product.images.map((img: any) => ({
      url: img.url,
      altText: img.altText,
      width: img.width,
      height: img.height,
    })),
    variants: product.variants.map((variant: any) => ({
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      selectedOptions: variant.selectedOptions.map((opt: any) => ({
        name: opt.name,
        value: opt.value,
      })),
      price: {
        amount: variant.priceAmount,
        currencyCode: variant.priceCurrency,
      },
    })),
    options: product.options.map((opt: any) => ({
      id: opt.id,
      name: opt.name,
      values: opt.values,
    })),
    priceRange: product.priceRange
      ? {
          maxVariantPrice: {
            amount: product.priceRange.maxVariantPriceAmount,
            currencyCode: product.priceRange.maxVariantPriceCurrency,
          },
          minVariantPrice: {
            amount: product.priceRange.minVariantPriceAmount,
            currencyCode: product.priceRange.minVariantPriceCurrency,
          },
        }
      : {
          maxVariantPrice: { amount: '0', currencyCode: 'USD' },
          minVariantPrice: { amount: '0', currencyCode: 'USD' },
        },
    seo: product.seo
      ? {
          title: product.seo.title,
          description: product.seo.description,
        }
      : {
          title: product.title,
          description: product.description,
        },
  };
}

// Get product by handle
export async function getDbProduct(handle: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { handle },
    include: {
      featuredImage: true,
      images: true,
      variants: {
        include: {
          selectedOptions: true,
        },
      },
      options: true,
      priceRange: true,
      seo: true,
    },
  });

  if (!product) return null;

  return transformProduct(product);
}

// Get products with optional filtering
export async function getDbProducts({
  query,
  sortKey,
  reverse,
}: {
  query?: string;
  sortKey?: string;
  reverse?: boolean;
}): Promise<Product[]> {
  const orderBy: any = {};
  
  if (sortKey === 'PRICE') {
    // For price sorting, we'll need to join with priceRange
    orderBy.priceRange = {
      minVariantPriceAmount: reverse ? 'desc' : 'asc',
    };
  } else if (sortKey === 'CREATED_AT' || sortKey === 'CREATED') {
    orderBy.createdAt = reverse ? 'desc' : 'asc';
  } else {
    orderBy.updatedAt = 'desc';
  }

  const where: any = {
    availableForSale: true,
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { has: query } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      featuredImage: true,
      images: true,
      variants: {
        include: {
          selectedOptions: true,
        },
      },
      options: true,
      priceRange: true,
      seo: true,
    },
    take: 100,
  });

  return products.map(transformProduct);
}

// Get product recommendations
export async function getDbProductRecommendations(productId: string): Promise<Product[]> {
  // Get the product to find related products
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      collectionProducts: {
        include: {
          collection: true,
        },
      },
    },
  });

  if (!product || !product.collectionProducts.length) {
    // Return random products if no collections found
    const products = await prisma.product.findMany({
      where: {
        id: { not: productId },
        availableForSale: true,
      },
      include: {
        featuredImage: true,
        images: true,
        variants: {
          include: {
            selectedOptions: true,
          },
        },
        options: true,
        priceRange: true,
        seo: true,
      },
      take: 4,
    });

    return products.map(transformProduct);
  }

  // Get products from the same collections
  const collectionIds = product.collectionProducts.map((cp) => cp.collectionId);

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: productId },
      availableForSale: true,
      collectionProducts: {
        some: {
          collectionId: { in: collectionIds },
        },
      },
    },
    include: {
      featuredImage: true,
      images: true,
      variants: {
        include: {
          selectedOptions: true,
        },
      },
      options: true,
      priceRange: true,
      seo: true,
    },
    take: 4,
  });

  return relatedProducts.map(transformProduct);
}
