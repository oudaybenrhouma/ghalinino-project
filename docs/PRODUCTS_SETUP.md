# 🛍️ Product Browsing System

## Ghalinino - Tunisia E-commerce

This guide covers the complete product browsing system including listing, filtering, detail pages, and real-time stock updates.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Components](#components)
4. [Hooks](#hooks)
5. [Real-time Updates](#real-time-updates)
6. [Price Display Logic](#price-display-logic)
7. [Supabase Queries](#supabase-queries)
8. [Usage Examples](#usage-examples)

---

## 🎯 Overview

The product browsing system provides:

- **Product Listing**: Grid layout with filtering, sorting, and pagination
- **Product Detail**: Full product information with image gallery
- **Real-time Stock**: Live updates when stock changes
- **Dual Pricing**: Retail vs wholesale price display based on user account

---

## ✨ Features

### Product Listing (`/products`)

| Feature | Description |
|---------|-------------|
| **Responsive Grid** | 1-4 columns based on screen size |
| **Category Filter** | Dropdown or radio button selection |
| **Price Range** | Min/max price inputs |
| **In-Stock Toggle** | Show only available products |
| **Search** | Text search across Arabic/French names |
| **Sort Options** | Featured, Newest, Price (asc/desc), Name |
| **Load More** | Infinite scroll pagination |

### Product Detail (`/product/:slug`)

| Feature | Description |
|---------|-------------|
| **Image Gallery** | Main image + thumbnails, lightbox modal |
| **Stock Badge** | Color-coded (green >10, yellow 1-10, red 0) |
| **Quantity Selector** | Constrained to available stock |
| **Dual Pricing** | Shows correct price based on user type |
| **Tabs** | Description, Shipping info |
| **Related Products** | Products from same category |
| **Real-time Stock** | Live updates via Supabase subscriptions |

---

## 🧩 Components

### ProductCard

Individual product display for grid layouts.

```tsx
import { ProductCard } from '@/components/products';

<ProductCard product={product} className="..." />
```

**Features:**
- Image with hover zoom effect
- Featured/Discount/Wholesale-only badges
- Stock badge
- Quick "Add to Cart" button (appears on hover)
- Localized name and price

### ProductCardSkeleton

Loading placeholder for product cards.

```tsx
import { ProductCardSkeleton } from '@/components/products';

<ProductCardSkeleton />
```

### ProductGrid

Complete product grid with filters.

```tsx
import { ProductGrid } from '@/components/products';

// Basic usage
<ProductGrid />

// With category filter
<ProductGrid categorySlug="electronics" />

// Featured products only
<ProductGrid featured title="Featured Products" />

// Custom columns
<ProductGrid columns={3} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `categorySlug` | `string` | - | Pre-filter by category |
| `showFilters` | `boolean` | `true` | Show filter sidebar |
| `columns` | `2 \| 3 \| 4` | `4` | Grid columns |
| `title` | `string` | - | Page title |
| `featured` | `boolean` | `false` | Only featured products |

### ImageGallery

Product image viewer with lightbox.

```tsx
import { ImageGallery } from '@/components/products';

<ImageGallery
  images={['url1.jpg', 'url2.jpg']}
  productName="Product Name"
/>
```

**Features:**
- Main image with hover zoom
- Thumbnail navigation
- Lightbox modal (click to enlarge)
- Keyboard navigation (arrows, ESC)
- Graceful fallback for missing images

### StockBadge

Color-coded stock indicator.

```tsx
import { StockBadge, StockIndicator } from '@/components/products';

// Full badge with background
<StockBadge quantity={5} showQuantity size="md" />

// Simple inline text
<StockIndicator quantity={5} />
```

**Color Coding:**
| Quantity | Color | Display |
|----------|-------|---------|
| > 10 | Green | "En stock" / "متوفر" |
| 1-10 | Yellow (pulsing) | "Stock limité" / "كمية محدودة" |
| 0 | Red | "Rupture de stock" / "نفذ المخزون" |

---

## 🎣 Hooks

### useProducts

Fetch products with filters, sorting, and pagination.

```tsx
import { useProducts } from '@/hooks';

const {
  products,      // ProductWithCategory[]
  isLoading,     // boolean
  error,         // string | null
  totalCount,    // number
  totalPages,    // number
  hasMore,       // boolean
  refetch,       // () => Promise<void>
  loadMore,      // () => Promise<void>
} = useProducts({
  filters: {
    categorySlug: 'electronics',
    minPrice: 50,
    maxPrice: 200,
    inStock: true,
    search: 'phone',
  },
  sort: 'price_asc',
  page: 1,
  limit: 12,
});
```

**Filter Options:**
| Filter | Type | Description |
|--------|------|-------------|
| `categoryId` | `string` | Filter by category UUID |
| `categorySlug` | `string` | Filter by category slug |
| `minPrice` | `number` | Minimum price (TND) |
| `maxPrice` | `number` | Maximum price (TND) |
| `inStock` | `boolean` | Only products with quantity > 0 |
| `isFeatured` | `boolean` | Only featured products |
| `search` | `string` | Search in name_ar and name_fr |

**Sort Options:**
- `featured` - Featured first, then newest
- `newest` - Most recent first
- `price_asc` - Price low to high
- `price_desc` - Price high to low
- `name_asc` - Name A-Z (French)
- `name_desc` - Name Z-A (French)

### useProductDetail

Fetch single product with real-time stock updates.

```tsx
import { useProductDetail } from '@/hooks';

const {
  product,           // ProductDetail | null
  isLoading,         // boolean
  error,             // string | null
  stockChanged,      // boolean - true when stock updated
  previousStock,     // number | null - stock before update
  clearStockChanged, // () => void
  refetch,           // () => Promise<void>
} = useProductDetail({
  productSlug: 'wireless-earbuds',
  realtime: true, // Enable real-time updates
});
```

### useCategories

Fetch all active categories.

```tsx
import { useCategories } from '@/hooks';

const { categories, isLoading, error } = useCategories();
```

### useRelatedProducts

Fetch products from the same category.

```tsx
import { useRelatedProducts } from '@/hooks';

const { products, isLoading } = useRelatedProducts(
  categoryId,      // Category to match
  currentProductId, // Exclude this product
  4                 // Limit
);
```

---

## ⚡ Real-time Updates

The product detail page subscribes to stock changes using Supabase Realtime.

### How it works:

1. When viewing a product, a channel subscription is created
2. Listens for `UPDATE` events on the `products` table
3. Filters for the specific product ID
4. When stock changes:
   - UI updates immediately
   - Yellow alert banner appears
   - Toast notification shown
   - `stockChanged` flag set to true

### Configuration:

```typescript
// In useProductDetail.ts
const channel = supabase
  .channel(`product-stock-${productId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',
      filter: `id=eq.${productId}`,
    },
    (payload) => {
      // Handle update
    }
  )
  .subscribe();
```

### Enable in Supabase:

1. Go to **Database → Replication**
2. Enable replication for `products` table
3. Or run:
   ```sql
   ALTER TABLE products REPLICA IDENTITY FULL;
   ```

---

## 💰 Price Display Logic

### For Retail Customers

Shows `price` field only.

```tsx
// Display: 89.900 TND
formatPrice(product.price * 1000, language)
```

### For Approved Wholesale Users

Shows `wholesale_price` with `price` struck through.

```tsx
// Display: 65.000 TND (was 89.900 TND)
{showWholesalePrice && (
  <>
    <span className="text-green-600">{formatPrice(wholesale * 1000)}</span>
    <span className="line-through">{formatPrice(retail * 1000)}</span>
  </>
)}
```

### For Pending Wholesale Users

Shows retail price with info message.

```tsx
{isPendingWholesale && product.wholesale_price && (
  <p className="text-amber-600">
    Prix gros disponibles après approbation
  </p>
)}
```

### Discount Display

If `compare_at_price` is set and higher than `price`:

```tsx
{hasDiscount && (
  <span className="bg-green-600 text-white">-{percentage}%</span>
)}
```

---

## 🔍 Supabase Queries

### Products with Category

```typescript
const { data } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(*)
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .range(0, 11);
```

### Search Query

```typescript
const searchTerm = `%${query}%`;
const { data } = await supabase
  .from('products')
  .select('*')
  .or(`name_fr.ilike.${searchTerm},name_ar.ilike.${searchTerm}`);
```

### Price Range Filter

```typescript
query = query
  .gte('price', minPrice)
  .lte('price', maxPrice);
```

### In-Stock Filter

```typescript
query = query.gt('quantity', 0);
```

### Category Filter by Slug

```typescript
// First get category ID
const { data: cat } = await supabase
  .from('categories')
  .select('id')
  .eq('slug', categorySlug)
  .single();

// Then filter products
query = query.eq('category_id', cat.id);
```

---

## 💡 Usage Examples

### Products Page

```tsx
// src/pages/ProductsPage.tsx
import { ProductGrid } from '@/components/products';

export function ProductsPage() {
  const { categorySlug } = useParams();
  
  return (
    <ProductGrid
      categorySlug={categorySlug}
      showFilters={true}
      columns={4}
    />
  );
}
```

### Featured Products Section

```tsx
// On homepage
<ProductGrid
  featured
  title="Featured Products"
  showFilters={false}
  columns={4}
/>
```

### Product Quick View Modal

```tsx
import { useProductDetail } from '@/hooks';
import { ImageGallery, StockBadge } from '@/components/products';

function QuickView({ slug, onClose }) {
  const { product, isLoading } = useProductDetail({
    productSlug: slug,
    realtime: false, // Disable for modal
  });
  
  if (isLoading) return <Spinner />;
  
  return (
    <Modal onClose={onClose}>
      <ImageGallery images={product.images} />
      <h2>{product.name_fr}</h2>
      <StockBadge quantity={product.quantity} />
      {/* ... */}
    </Modal>
  );
}
```

---

## 📁 Files Reference

```
src/
├── hooks/
│   ├── useProducts.ts       # Product list hook with filters
│   └── useProductDetail.ts  # Single product with realtime
├── components/
│   └── products/
│       ├── ProductCard.tsx    # Grid item card
│       ├── ProductGrid.tsx    # Grid with filters
│       ├── ImageGallery.tsx   # Image viewer
│       ├── StockBadge.tsx     # Stock indicator
│       └── index.ts
└── pages/
    ├── ProductsPage.tsx       # /products listing
    └── ProductDetailPage.tsx  # /product/:slug detail
```

---

## 🔗 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/products` | ProductsPage | All products |
| `/products/:categorySlug` | ProductsPage | Products by category |
| `/product/:slug` | ProductDetailPage | Single product |

---

Built with ❤️ for Tunisia 🇹🇳
