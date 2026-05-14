'use client';

/**
 * /admin — dashboard (Phase 3 PRIM-05 migration).
 *
 * Presentation layer rebuilt on v3.0 primitives (@/components/ui). Data layer
 * is unchanged: same Supabase queries, same realtime subscription, same data
 * shapes. Stat color soup (blue/green/red/gold/purple) is replaced with a
 * single restrained accent treatment per DESIGN.md §2 — "one signature warm
 * gold, no third anchor".
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as Sentry from '@sentry/nextjs';
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Skeleton,
  Table,
  useToast,
} from '@/components/ui';
import type { Product, Order } from '@/lib/supabase/types';

interface Stats {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  categoryCount: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  liveVisitors: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    categoryCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    liveVisitors: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchData = async () => {
      try {
        // Consolidated queries (5 total instead of 10)
        const [
          { data: allProducts },
          { data: recentProductsData },
          { data: allOrders },
          { count: totalCustomers },
          { data: visitors },
        ] = await Promise.all([
          // Query 1: Get all products for stats aggregation
          supabase.from('products').select('in_stock, category'),
          // Query 2: Recent products for display
          supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          // Query 3: Get all orders for stats and recent orders
          supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false }),
          // Query 4: Customer count
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          // Query 5: Live visitors
          supabase
            .from('site_visitors')
            .select('id')
            .gte(
              'last_seen',
              new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            ),
        ]);

        // Derive product stats from single query
        const totalProducts = allProducts?.length || 0;
        const inStockProducts = allProducts?.filter((p) => p.in_stock).length || 0;
        const outOfStockProducts = totalProducts - inStockProducts;
        const categoryCount = new Set(allProducts?.map((p) => p.category)).size;

        // Derive order stats from single query
        const totalOrders = allOrders?.length || 0;
        const totalRevenue = (allOrders || []).reduce((sum, o) => sum + o.total, 0);
        const latestOrders = (allOrders || []).slice(0, 5);

        setStats({
          totalProducts,
          inStockProducts,
          outOfStockProducts,
          categoryCount,
          totalOrders,
          totalRevenue,
          totalCustomers: totalCustomers || 0,
          liveVisitors: visitors?.length || 0,
        });

        setRecentProducts((recentProductsData || []) as Product[]);
        setRecentOrders(latestOrders as Order[]);
      } catch (e) {
        Sentry.addBreadcrumb({
          category: 'admin-dashboard',
          message: 'Dashboard error',
          level: 'error',
          data: { error: e },
        });
        toast({
          variant: 'error',
          title: "We couldn't load the dashboard.",
          description: 'Refresh and try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime subscription for live visitors
    const channel = supabase
      .channel('site_visitors_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_visitors' },
        async () => {
          const { data } = await supabase
            .from('site_visitors')
            .select('id')
            .gte(
              'last_seen',
              new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            );
          setStats((prev) => ({ ...prev, liveVisitors: data?.length || 0 }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-fg text-[28px] font-display">Dashboard</h1>
          <p className="text-fg-muted font-body mt-1">Loading store overview.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" height={120} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-fg text-[28px] font-display">Dashboard</h1>
        <p className="text-fg-muted font-body mt-1">
          Welcome to your store admin panel.
        </p>
      </div>

      {/* Primary Stats — inline Card blocks per PRIM-05 plan template */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Total Orders
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                {stats.totalOrders}
              </p>
            </div>
            <div className="text-accent">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Revenue
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                &euro;{(stats.totalRevenue / 100).toFixed(0)}
              </p>
            </div>
            <div className="text-accent">
              <DollarSign className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Customers
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                {stats.totalCustomers}
              </p>
            </div>
            <div className="text-accent">
              <Users className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Live Visitors
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1] flex items-center gap-2">
                {stats.liveVisitors}
                {stats.liveVisitors > 0 ? (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse"
                  />
                ) : null}
              </p>
            </div>
            <div className="text-accent">
              <Eye className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Total Products
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                {stats.totalProducts}
              </p>
            </div>
            <div className="text-accent">
              <Package className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                In Stock
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                {stats.inStockProducts}
              </p>
            </div>
            <div className="text-accent">
              <ShoppingCart className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Out of Stock
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                {stats.outOfStockProducts}
              </p>
            </div>
            <div className="text-accent">
              <TrendingUp className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-micro">
                Categories
              </p>
              <p className="text-fg text-[32px] font-display mt-1 [font-feature-settings:'tnum'_1]">
                {stats.categoryCount}
              </p>
            </div>
            <div className="text-accent">
              <DollarSign className="h-6 w-6" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-0">
        <CardHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between gap-4 border-b border-border">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="text-fg-muted hover:text-fg font-micro text-[12px] uppercase tracking-[0.05em] transition-colors duration-150"
          >
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {recentOrders.length === 0 ? (
                <Table.Empty colSpan={5}>
                  <div className="flex flex-col items-center gap-3 py-8">
                    <ShoppingBag
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="h-10 w-10 text-fg-muted"
                    />
                    <div className="space-y-1 text-center">
                      <p className="font-body text-[15px] text-fg">
                        No orders yet.
                      </p>
                      <p className="font-body text-[14px] text-fg-muted">
                        Orders will appear here after customers purchase.
                      </p>
                    </div>
                  </div>
                </Table.Empty>
              ) : (
                recentOrders.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <span className="font-micro text-[12px] tracking-[0.05em] text-fg">
                        #
                        {order.stripe_session_id
                          ? order.stripe_session_id.slice(-8).toUpperCase()
                          : order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-body text-[14px] text-fg">
                        {order.customer_name || order.customer_email}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-body text-[14px] text-fg-muted">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </Table.Cell>
                    <Table.Cell align="right">
                      &euro;{(order.total / 100).toFixed(2)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={orderStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </CardContent>
      </Card>

      {/* Recent Products */}
      <Card className="p-0">
        <CardHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between gap-4 border-b border-border">
          <CardTitle>Recent Products</CardTitle>
          <Link
            href="/admin/products"
            className="text-fg-muted hover:text-fg font-micro text-[12px] uppercase tracking-[0.05em] transition-colors duration-150"
          >
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Product</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Price</Table.HeaderCell>
                <Table.HeaderCell>Stock</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {recentProducts.length === 0 ? (
                <Table.Empty colSpan={5}>
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Package
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="h-10 w-10 text-fg-muted"
                    />
                    <div className="space-y-1 text-center">
                      <p className="font-body text-[15px] text-fg">
                        No products yet.
                      </p>
                      <p className="font-body text-[14px] text-fg-muted">
                        Add a product to start filling your store.
                      </p>
                    </div>
                    <Link
                      href="/admin/products/new"
                      className="font-micro text-[12px] uppercase tracking-[0.05em] text-accent-deep hover:text-accent transition-colors duration-150"
                    >
                      Add your first product
                    </Link>
                  </div>
                </Table.Empty>
              ) : (
                recentProducts.map((product) => (
                  <Table.Row key={product.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 rounded-sm overflow-hidden bg-bg-alt">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="font-body text-[14px] text-fg truncate">
                          {product.name}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-body text-[14px] text-fg-muted capitalize">
                        {product.category.replace('-', ' ')}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-body text-[14px] text-fg-muted capitalize">
                        {product.product_type.replace('-', ' ')}
                      </span>
                    </Table.Cell>
                    <Table.Cell align="right">
                      &euro;{product.price.toFixed(2)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={product.in_stock ? 'success' : 'critical'}
                      >
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/products/new" className="block">
          <Card interactive>
            <CardContent>
              <Package
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-8 w-8 text-accent"
              />
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>Create a new product listing.</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" className="block">
          <Card interactive>
            <CardContent>
              <ShoppingBag
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-8 w-8 text-accent"
              />
              <CardTitle>Manage Orders</CardTitle>
              <CardDescription>View and update order statuses.</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <a href="/" target="_blank" rel="noopener noreferrer" className="block">
          <Card interactive>
            <CardContent>
              <TrendingUp
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-8 w-8 text-accent"
              />
              <CardTitle>View Store</CardTitle>
              <CardDescription>See your live storefront.</CardDescription>
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  );
}

/** Map order_status enum → Badge variant. Pending sits neutral; positive
 * fulfilment stages read as success; cancelled/refunded read as critical. */
function orderStatusVariant(
  status: Order['status'],
): 'neutral' | 'success' | 'critical' {
  switch (status) {
    case 'confirmed':
    case 'processing':
    case 'shipped':
    case 'delivered':
      return 'success';
    case 'cancelled':
    case 'refunded':
      return 'critical';
    case 'pending':
    default:
      return 'neutral';
  }
}

