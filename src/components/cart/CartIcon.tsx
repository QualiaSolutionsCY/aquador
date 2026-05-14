'use client';

import { motion } from 'framer-motion';
import { useCart } from './CartProvider';

export default function CartIcon({ className }: { className?: string }) {
  const { itemCount, openCart } = useCart();

  return (
    <motion.button
      onClick={openCart}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-gold transition-colors duration-300 ${className || 'text-black/80'}`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[22px] h-[22px]"
      >
        {/* Perfume bottle body */}
        <rect x="7" y="10" width="10" height="11" rx="1" />
        {/* Neck */}
        <rect x="9.5" y="7" width="5" height="3" />
        {/* Cap */}
        <rect x="9" y="4.5" width="6" height="2.5" rx="0.5" />
        {/* Spray nozzle */}
        <line x1="12" y1="4.5" x2="12" y2="3" />
        <line x1="10.5" y1="3" x2="13.5" y2="3" />
        {/* Decorative line on bottle */}
        <line x1="8.5" y1="14" x2="15.5" y2="14" />
      </svg>
      {itemCount > 0 && (
        <motion.span
          key={itemCount}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1 right-0 min-w-4 h-4 px-1 bg-gold text-black text-[9px] rounded-full flex items-center justify-center font-medium leading-none"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </motion.span>
      )}
    </motion.button>
  );
}
