# PageLoader Component

A reusable loading spinner component for displaying loading states throughout the application.

## Features

- 🎨 Clean, animated spinner design
- 📏 Multiple size options (sm, md, lg)
- 💬 Optional loading message
- 🖥️ Full-screen or inline mode
- 🌓 Dark mode support
- 🎯 Customizable with className

## Usage

### Basic Usage

```tsx
import PageLoader from "components/page-loader";

function MyComponent() {
  return <PageLoader />;
}
```

### With Custom Message

```tsx
<PageLoader message="Loading checkout..." />
```

### Different Sizes

```tsx
<PageLoader size="sm" /> // Small spinner
<PageLoader size="md" /> // Medium (default)
<PageLoader size="lg" /> // Large
```

### Full Screen Mode

```tsx
<PageLoader fullScreen message="Processing payment..." />
```

### With Custom Styling

```tsx
<PageLoader className="my-custom-class" />
```

## Props

| Prop         | Type                   | Default        | Description                              |
| ------------ | ---------------------- | -------------- | ---------------------------------------- |
| `size`       | `"sm" \| "md" \| "lg"` | `"md"`         | Size of the spinner                      |
| `message`    | `string`               | `"Loading..."` | Message displayed below spinner          |
| `fullScreen` | `boolean`              | `false`        | Whether to display as fullscreen overlay |
| `className`  | `string`               | `undefined`    | Additional CSS classes                   |

## Examples in the App

The PageLoader is used in:

- `/checkout` - While loading checkout data
- `/account` - While loading account information
- `/account/addresses` - While loading saved addresses
- `/orders` - While loading order history

## Component Location

`components/page-loader.tsx`
