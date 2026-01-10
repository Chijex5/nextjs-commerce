import { prisma } from './prisma';
import { Collection, Product } from '../shopify/types';

// Transform database collection to API format
function transformCollection(collection: any): Collection {
  return {
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    updatedAt: collection.updatedAt.toISOString(),
    seo: collection.seo
      ? {
          title: collection.seo.title,
          description: collection.seo.description,
        }
      : {
          title: collection.title,
          description: collection.description,
        },
    path: `/search/${collection.handle}`,
  };
}

// Transform database product to API format (simplified version)
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

// Get collection by handle
export async function getDbCollection(handle: string): Promise<Collection | null> {
  const collection = await prisma.collection.findUnique({
    where: { handle },
    include: {
      seo: true,
    },
  });

  if (!collection) return null;

  return transformCollection(collection);
}

// Get all collections
export async function getDbCollections(): Promise<Collection[]> {
  const collections = await prisma.collection.findMany({
    include: {
      seo: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return collections.map(transformCollection);
}

// Get products in a collection
export async function getDbCollectionProducts({
  handle,
  sortKey,
  reverse,
}: {
  handle: string;
  sortKey?: string;
  reverse?: boolean;
}): Promise<Product[]> {
  const collection = await prisma.collection.findUnique({
    where: { handle },
  });

  if (!collection) return [];

  const orderBy: any = {};
  
  if (sortKey === 'PRICE') {
    orderBy.priceRange = {
      minVariantPriceAmount: reverse ? 'desc' : 'asc',
    };
  } else if (sortKey === 'CREATED_AT' || sortKey === 'CREATED') {
    orderBy.createdAt = reverse ? 'desc' : 'asc';
  } else {
    orderBy.updatedAt = 'desc';
  }

  const collectionProducts = await prisma.collectionProduct.findMany({
    where: {
      collectionId: collection.id,
    },
    include: {
      product: {
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
      },
    },
    orderBy: {
      position: 'asc',
    },
  });

  const products = collectionProducts
    .map((cp) => cp.product)
    .filter((p) => p.availableForSale);

  return products.map(transformProduct);
}
