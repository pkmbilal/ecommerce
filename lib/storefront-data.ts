export type Product = {
  id: string;
  title: string;
  category: string;
  categorySlug?: string;
  rating: number;
  reviews: number;
  priceHalalas: number;
  compareAtPriceHalalas?: number;
  imageUrl: string;
  imageAlt: string;
  badge?: string;
};

export type CategoryTile = {
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
};

export const navItems = ["New Arrivals", "Best Sellers", "Abayas", "Accessories"];

export const brandStrip = ["NOIR", "DUNE", "SAFFRON", "MODA", "RIYADH"];

export const heroImages = {
  main:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1100&q=85",
  secondary:
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
};

export const products: Product[] = [
  {
    id: "linen-abaya-black",
    title: "Linen Blend Everyday Abaya",
    category: "Abayas",
    rating: 4.8,
    reviews: 128,
    priceHalalas: 24900,
    compareAtPriceHalalas: 31900,
    badge: "New",
    imageUrl:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Black modest outerwear styled on a neutral fashion set",
  },
  {
    id: "woven-tote-sand",
    title: "Structured Woven Tote",
    category: "Bags",
    rating: 4.7,
    reviews: 74,
    priceHalalas: 17900,
    imageUrl:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Structured neutral handbag on a clean studio background",
  },
  {
    id: "cotton-shirt-ivory",
    title: "Relaxed Cotton Poplin Shirt",
    category: "Tops",
    rating: 4.6,
    reviews: 96,
    priceHalalas: 13900,
    compareAtPriceHalalas: 16900,
    imageUrl:
      "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Ivory cotton shirt styled with minimal accessories",
  },
  {
    id: "satin-scarf-olive",
    title: "Soft Satin Square Scarf",
    category: "Scarves",
    rating: 4.9,
    reviews: 211,
    priceHalalas: 6900,
    badge: "Best seller",
    imageUrl:
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Folded satin scarf with a refined olive finish",
  },
  {
    id: "pleated-set-charcoal",
    title: "Pleated Travel Co-ord Set",
    category: "Sets",
    rating: 4.8,
    reviews: 142,
    priceHalalas: 28900,
    compareAtPriceHalalas: 34900,
    imageUrl:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Charcoal co-ord outfit arranged for a fashion catalog",
  },
  {
    id: "leather-sandals-tan",
    title: "Minimal Leather Sandals",
    category: "Footwear",
    rating: 4.5,
    reviews: 58,
    priceHalalas: 15900,
    imageUrl:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Tan leather sandals photographed on a light surface",
  },
];

export const categories: CategoryTile[] = [
  {
    name: "Modest Essentials",
    slug: "abayas",
    description: "Modest layers and everyday abayas.",
    imageUrl:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Workwear",
    slug: "tops",
    description: "Clean shirts and breathable tops.",
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Weekend Edits",
    slug: "sets",
    description: "Coordinated pieces for travel and weekends.",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
  },
];

export const reviews = [
  {
    name: "Aisha M.",
    city: "Riyadh",
    quote:
      "The fit was easy to trust online, and the delivery updates were clear.",
  },
  {
    name: "Noura A.",
    city: "Jeddah",
    quote:
      "Polished pieces that work for office mornings and family evenings.",
  },
  {
    name: "Reem K.",
    city: "Dammam",
    quote: "Cash on delivery made the first order simple. Packaging felt premium.",
  },
];
