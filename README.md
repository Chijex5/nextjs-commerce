# Politician Portfolio Website

A professional, responsive portfolio website for public office holders built with Next.js, React, and Tailwind CSS.

## Overview

This website provides a centralized, well-structured digital platform where the public can easily access accurate and up-to-date information about a politician's work, background, and official activities.

## Features

- **About/Biography**: Comprehensive background, education, and career information
- **Achievements & Initiatives**: Showcase of key accomplishments and ongoing projects
- **News & Updates**: Latest announcements and press releases
- **Media Gallery**: Photos and videos from public events
- **Contact**: Official contact information and office details

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS 4
- **Typography**: Geist Sans font
- **Performance**: Server-side rendering, React Server Components
- **Styling**: Tailwind CSS with dark mode support

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Chijex5/nextjs-commerce.git
cd nextjs-commerce
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── about/          # Biography page
│   ├── achievements/   # Achievements & initiatives
│   ├── news/          # News & updates
│   ├── media/         # Media gallery
│   ├── contact/       # Contact information
│   └── page.tsx       # Homepage
├── components/
│   └── layout/        # Navigation and footer
└── lib/               # Utilities and helpers
```

## Customization

To customize the website content:

1. Update placeholder text in each page component
2. Replace `[Politician Name]` with the actual name
3. Add actual contact information in the contact page
4. Update social media links in the footer
5. Replace logo in `/components/logo-square.tsx`

## Content Guidelines

Based on the PRD.md:

- Content must be factual and verifiable
- No defamatory or misleading claims
- Dates and achievements must be sourced
- Images must be optimized for web performance

## Performance Goals

- First contentful paint < 2 seconds
- Fully responsive on mobile and desktop
- Accessibility score ≥ WCAG AA compliance
- SEO-optimized with proper metadata

## Build & Deploy

Build the production version:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

### Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FChijex5%2Fnextjs-commerce)

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm prettier` - Format code
- `pnpm prettier:check` - Check code formatting

## License

See [license.md](license.md) for details.

## Support

For technical issues or questions, please open an issue on GitHub.
