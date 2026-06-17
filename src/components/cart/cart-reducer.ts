/**
 * Pure cart reducer + initial state.
 *
 * Extracted from CartProvider so the quantity rules can be unit-tested against
 * the real implementation (the provider just wires this into useReducer).
 *
 * Stock cap: when a line carries `maxQuantity` (the product's in-stock count),
 * neither ADD_ITEM nor UPDATE_QUANTITY can push the line above it. This is the
 * client-side guard; the server checkout (`lib/validation/cart.ts`) is the
 * authoritative gate that rejects an over-stock or out-of-stock order.
 */

import type { Cart, CartItem, CartAction } from '@/types/cart';

export const initialCart: Cart = {
  items: [],
};

/** Clamp a desired quantity to [1, max] when a max is known. */
function clampQuantity(quantity: number, max: number | undefined): number {
  if (max === undefined || max === null) return quantity;
  return Math.min(quantity, Math.max(0, max));
}

export function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.variantId === action.payload.variantId
      );

      if (existingIndex >= 0) {
        const existing = state.items[existingIndex];
        // Prefer the freshest stock figure the caller supplied, fall back to
        // whatever the line already carried.
        const max = action.payload.maxQuantity ?? existing.maxQuantity;
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...existing,
          maxQuantity: max,
          quantity: clampQuantity(existing.quantity + action.payload.quantity, max),
        };
        return { ...state, items: newItems };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            ...action.payload,
            quantity: clampQuantity(action.payload.quantity, action.payload.maxQuantity),
          },
        ],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.variantId !== action.payload.variantId),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.variantId !== action.payload.variantId),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.variantId === action.payload.variantId
            ? { ...item, quantity: clampQuantity(action.payload.quantity, item.maxQuantity) }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return initialCart;

    case 'HYDRATE':
      return action.payload;

    default:
      return state;
  }
}
