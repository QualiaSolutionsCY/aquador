'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import type { Customer, Order } from '@/lib/supabase/types';

interface ShippingAddress {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const [customerRes, ordersRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', id).single(),
        supabase
          .from('orders')
          .select('*')
          .eq('customer_email', '') // placeholder — will be set after customer loads
          .order('created_at', { ascending: false }),
      ]);

      if (customerRes.data) {
        setCustomer(customerRes.data as Customer);
        // Now fetch orders by email
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', customerRes.data.email)
          .order('created_at', { ascending: false });
        setOrders((orderData || []) as Order[]);
      }

      // suppress unused var
      void ordersRes;

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rect" width="12rem" height="2rem" />
        <Skeleton variant="rect" width="100%" height="12rem" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-fg-muted text-lg">Customer not found</p>
        <Link
          href="/admin/customers"
          className="text-accent-deep hover:text-accent mt-4 inline-block underline-offset-4 hover:underline"
        >
          Back to customers
        </Link>
      </div>
    );
  }

  const addresses = Array.isArray(customer.shipping_addresses)
    ? (customer.shipping_addresses as ShippingAddress[])
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{customer.name || 'Unnamed Customer'}</h1>
          <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3.5 w-3.5" />
            {customer.email}
          </p>
          {customer.phone && (
            <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
              <Phone className="h-3.5 w-3.5" />
              {customer.phone}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-gray-400 text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-white mt-1">{customer.total_orders}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-gray-400 text-sm">Total Spent</p>
          <p className="text-2xl font-bold text-gold mt-1">&euro;{(customer.total_spent / 100).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-gray-400 text-sm">Customer Since</p>
          <p className="text-2xl font-bold text-white mt-1">
            {customer.first_order_at
              ? new Date(customer.first_order_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
              : '-'}
          </p>
        </div>
      </div>

      {/* Shipping Addresses */}
      {addresses.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              Shipping Addresses
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {addresses.map((addr, i) => (
              <div key={i} className="px-6 py-4">
                <p className="text-white text-sm">{addr.name}</p>
                {addr.address && (
                  <p className="text-gray-400 text-sm mt-1">
                    {[addr.address.line1, addr.address.line2, addr.address.city, addr.address.postal_code, addr.address.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order History */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Order History</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No orders found</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orders.map((order) => {
              const items = Array.isArray(order.items)
                ? (order.items as Array<{ name?: string; quantity?: number }>)
                : [];
              return (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-mono">
                      #{order.stripe_session_id ? order.stripe_session_id.slice(-8).toUpperCase() : order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' \u00B7 '}
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">&euro;{(order.total / 100).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{order.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
