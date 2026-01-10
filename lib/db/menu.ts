import { prisma } from './prisma';
import { Menu, Page } from '../shopify/types';

// Get menu by handle
export async function getDbMenu(handle: string): Promise<Menu[]> {
  const menu = await prisma.menu.findUnique({
    where: { handle },
    include: {
      items: true,
    },
  });

  if (!menu) return [];

  return menu.items.map((item) => ({
    title: item.title,
    path: item.url,
  }));
}

// Get page by handle
export async function getDbPage(handle: string): Promise<Page | null> {
  const page = await prisma.page.findUnique({
    where: { handle },
    include: {
      seo: true,
    },
  });

  if (!page) return null;

  return {
    id: page.id,
    handle: page.handle,
    title: page.title,
    body: page.body,
    bodySummary: page.bodySummary,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    seo: page.seo
      ? {
          title: page.seo.title,
          description: page.seo.description,
        }
      : undefined,
  };
}

// Get all pages
export async function getDbPages(): Promise<Page[]> {
  const pages = await prisma.page.findMany({
    include: {
      seo: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return pages.map((page) => ({
    id: page.id,
    handle: page.handle,
    title: page.title,
    body: page.body,
    bodySummary: page.bodySummary,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    seo: page.seo
      ? {
          title: page.seo.title,
          description: page.seo.description,
        }
      : undefined,
  }));
}
