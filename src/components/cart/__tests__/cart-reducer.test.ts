import type { Cart, CartItem, CartAction } from '@/types/cart';
import { cartReducer } from '../cart-reducer';

const createTestItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'test-product',
  variantId: 'test-variant',
  quantity: 1,
  name: 'Test Product',
  image: '/test.jpg',
  price: 29.99,
  size: '50ml',
  productType: 'perfume',
  ...overrides,
});

describe('Cart Reducer', () => {
  const initialState: Cart = { items: [] };

  describe('ADD_ITEM', () => {
    it('should add a new item to empty cart', () => {
      const item = createTestItem();
      const action: CartAction = { type: 'ADD_ITEM', payload: item };

      const newState = cartReducer(initialState, action);

      expect(newState.items.length).toBe(1);
      expect(newState.items[0]).toEqual(item);
    });

    it('should increment quantity for existing item', () => {
      const item = createTestItem();
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = { type: 'ADD_ITEM', payload: { ...item, quantity: 2 } };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items.length).toBe(1);
      expect(newState.items[0].quantity).toBe(3);
    });

    it('should add different variants as separate items', () => {
      const item1 = createTestItem({ variantId: 'variant-1' });
      const item2 = createTestItem({ variantId: 'variant-2' });
      const stateWithItem: Cart = { items: [item1] };
      const action: CartAction = { type: 'ADD_ITEM', payload: item2 };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items.length).toBe(2);
    });
  });

  describe('REMOVE_ITEM', () => {
    it('should remove item from cart', () => {
      const item = createTestItem();
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = { type: 'REMOVE_ITEM', payload: { variantId: item.variantId } };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items.length).toBe(0);
    });

    it('should only remove specified item', () => {
      const item1 = createTestItem({ variantId: 'variant-1' });
      const item2 = createTestItem({ variantId: 'variant-2' });
      const stateWithItems: Cart = { items: [item1, item2] };
      const action: CartAction = { type: 'REMOVE_ITEM', payload: { variantId: 'variant-1' } };

      const newState = cartReducer(stateWithItems, action);

      expect(newState.items.length).toBe(1);
      expect(newState.items[0].variantId).toBe('variant-2');
    });

    it('should do nothing for non-existent item', () => {
      const item = createTestItem();
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = { type: 'REMOVE_ITEM', payload: { variantId: 'non-existent' } };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items.length).toBe(1);
    });
  });

  describe('UPDATE_QUANTITY', () => {
    it('should update quantity for existing item', () => {
      const item = createTestItem();
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = { type: 'UPDATE_QUANTITY', payload: { variantId: item.variantId, quantity: 5 } };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is zero', () => {
      const item = createTestItem();
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = { type: 'UPDATE_QUANTITY', payload: { variantId: item.variantId, quantity: 0 } };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items.length).toBe(0);
    });

    it('should remove item when quantity is negative', () => {
      const item = createTestItem();
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = { type: 'UPDATE_QUANTITY', payload: { variantId: item.variantId, quantity: -1 } };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items.length).toBe(0);
    });
  });

  describe('CLEAR_CART', () => {
    it('should remove all items from cart', () => {
      const item1 = createTestItem({ variantId: 'variant-1' });
      const item2 = createTestItem({ variantId: 'variant-2' });
      const stateWithItems: Cart = { items: [item1, item2] };
      const action: CartAction = { type: 'CLEAR_CART' };

      const newState = cartReducer(stateWithItems, action);

      expect(newState.items.length).toBe(0);
    });
  });

  describe('HYDRATE', () => {
    it('should replace cart state with hydrated data', () => {
      const item = createTestItem();
      const hydratedState: Cart = { items: [item] };
      const action: CartAction = { type: 'HYDRATE', payload: hydratedState };

      const newState = cartReducer(initialState, action);

      expect(newState).toEqual(hydratedState);
    });
  });

  describe('stock cap (maxQuantity)', () => {
    it('caps a new line at maxQuantity when adding more than is in stock', () => {
      const item = createTestItem({ quantity: 10, maxQuantity: 3 });
      const action: CartAction = { type: 'ADD_ITEM', payload: item };

      const newState = cartReducer(initialState, action);

      expect(newState.items[0].quantity).toBe(3);
    });

    it('does not let repeated adds push an existing line past maxQuantity', () => {
      const item = createTestItem({ quantity: 2, maxQuantity: 3 });
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = {
        type: 'ADD_ITEM',
        payload: { ...item, quantity: 5 },
      };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items[0].quantity).toBe(3);
    });

    it('clamps UPDATE_QUANTITY to maxQuantity', () => {
      const item = createTestItem({ quantity: 1, maxQuantity: 4 });
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = {
        type: 'UPDATE_QUANTITY',
        payload: { variantId: item.variantId, quantity: 99 },
      };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items[0].quantity).toBe(4);
    });

    it('leaves quantity unbounded when no maxQuantity is set', () => {
      const item = createTestItem({ quantity: 1 });
      const stateWithItem: Cart = { items: [item] };
      const action: CartAction = {
        type: 'UPDATE_QUANTITY',
        payload: { variantId: item.variantId, quantity: 50 },
      };

      const newState = cartReducer(stateWithItem, action);

      expect(newState.items[0].quantity).toBe(50);
    });
  });
});
