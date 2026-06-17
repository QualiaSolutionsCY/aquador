import type { ProductType, ProductSize } from './product';

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  /**
   * Units available in stock for this product. When set, the cart caps the
   * line quantity here so a shopper can never hold more than what's sellable.
   * Undefined = no client-side cap known (server checkout still enforces it).
   */
  maxQuantity?: number;
  name: string;
  image: string;
  price: number;
  size: ProductSize;
  productType: ProductType;
  customPerfume?: {
    name: string;
    topNote: string;
    heartNote: string;
    baseNote: string;
    specialRequests?: string;
  };
}

export interface Cart {
  items: CartItem[];
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { variantId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { variantId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; payload: Cart };

export interface CartContextType {
  cart: Cart;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}
