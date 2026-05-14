'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useCart } from '@/components/cart';
import { hoverVariants, tapVariants, loadingVariants } from '@/lib/animations/micro-interactions';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Product } from '@/types';
import type { CartItem } from '@/types/cart';
import type { ProductType, ProductSize } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const reducedMotion = useReducedMotion();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  const handleAddToCart = async () => {
    setIsLoading(true);

    // Simulate brief loading for better UX (feel instant but show feedback)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Use sale price if available, otherwise original price
    const effectivePrice = product.sale_price && product.sale_price < product.price
      ? product.sale_price
      : product.price;

    const cartItem: CartItem = {
      productId: product.id,
      variantId: `${product.id}-${product.product_type}-${product.size}`,
      quantity,
      name: product.name,
      image: product.image,
      price: effectivePrice,
      size: product.size as ProductSize,
      productType: product.product_type as ProductType,
    };

    addItem(cartItem);
    setIsLoading(false);
    setIsAdded(true);
    setQuantity(1);

    // Track add to cart event
    track('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: effectivePrice,
      quantity,
    });

    // Reset added state after 2 seconds (with cleanup)
    if (addedTimeoutRef.current) {
      clearTimeout(addedTimeoutRef.current);
    }
    addedTimeoutRef.current = setTimeout(() => setIsAdded(false), 2000);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const inStock = product.in_stock ?? true;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="w-12 h-12 rounded-full bg-gray-100 border border-gold-500/20 flex items-center justify-center text-gray-600 hover:text-gold hover:border-gold-500/40 hover:bg-gold-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-black font-semibold">{quantity}</span>
          <button
            onClick={increaseQuantity}
            className="w-12 h-12 rounded-full bg-gray-100 border border-gold-500/20 flex items-center justify-center text-gray-600 hover:text-gold hover:border-gold-500/40 hover:bg-gold-500/10 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <motion.button
        onClick={handleAddToCart}
        disabled={!inStock || isAdded || isLoading}
        whileHover={
          inStock && !isAdded && !isLoading && !reducedMotion
            ? hoverVariants.glow
            : undefined
        }
        whileTap={
          inStock && !isAdded && !isLoading && !reducedMotion
            ? tapVariants.shrink
            : undefined
        }
        animate={isAdded && !reducedMotion ? tapVariants.pulse : undefined}
        transition={{ duration: 0.15 }}
        className={`w-full py-4 min-h-[44px] rounded-xl font-medium tracking-[0.05em] flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
          isAdded
            ? 'bg-emerald-500/90 text-white'
            : inStock
              ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-black hover:from-gold-600 hover:to-gold-700 shadow-lg shadow-gold-500/20'
              : 'bg-neutral-800 text-gray-400 border border-neutral-700 cursor-not-allowed'
        }`}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={!reducedMotion ? loadingVariants.spin : undefined}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
              />
              Adding...
            </motion.span>
          ) : isAdded ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Added to Cart!
            </motion.span>
          ) : inStock ? (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Add to Cart
            </motion.span>
          ) : (
            <motion.span
              key="out-of-stock"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Coming Soon
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
