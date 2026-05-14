'use client';

/**
 * /admin/_design — primitive showcase route (Phase 3 PRIM-05).
 *
 * Lives under /admin/ so it inherits the auth gate from <AdminShell> (see
 * src/components/admin/AdminShell.tsx — redirects non-admins to /admin/login).
 * The showcase renders every v3.0 primitive in every state. Treat as the
 * in-repo design reference; never link from a public surface.
 *
 * Surface override: AdminShell wraps children in a dark legacy admin panel.
 * We escape that panel with a full-bleed `bg-bg` wrapper so primitives render
 * on their native warm-bone surface — the showcase is about how they look in
 * production, not how they look against the admin's pre-v3.0 chrome.
 */

import { useState } from 'react';
import {
  // form
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  RadioGroup,
  RadioItem,
  Switch,
  // display
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Tag,
  Avatar,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Skeleton,
  // overlay
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useToast,
  // data
  Table,
} from '@/components/ui';
import {
  Search,
  Mail,
  Trash2,
  Plus,
  MoreHorizontal,
  Inbox,
  type LucideIcon,
} from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

interface Row {
  product: string;
  category: string;
  price: number;
  stock: number;
}

const sampleRows: Row[] = [
  { product: 'Khamrah', category: 'Lattafa', price: 89.0, stock: 24 },
  { product: 'Oud Maliki', category: 'Niche', price: 145.0, stock: 8 },
  { product: 'Velvet Tonka', category: 'Women', price: 110.5, stock: 16 },
  { product: 'Mukhalat Malaki', category: 'Niche', price: 198.0, stock: 4 },
  { product: 'Sheikh Al Shuyukh', category: 'Men', price: 132.0, stock: 12 },
];

export default function DesignShowcasePage() {
  const { toast } = useToast();
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [checkboxState, setCheckboxState] = useState<boolean | 'indeterminate'>(
    false,
  );
  const [radioValue, setRadioValue] = useState('top');
  const [switchOn, setSwitchOn] = useState(true);
  const [tabValue, setTabValue] = useState('notes');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const cycleSort = () => {
    setSortDirection((d) =>
      d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc',
    );
  };

  const sortedRows = [...sampleRows].sort((a, b) => {
    if (sortDirection === 'asc') return a.price - b.price;
    if (sortDirection === 'desc') return b.price - a.price;
    return 0;
  });

  return (
    <div className="bg-bg text-fg -m-4 sm:-m-6 p-6 sm:p-12 min-h-screen">
      <div className="max-w-[80rem] mx-auto space-y-16">
        <header className="space-y-2">
          <p className="text-fg-muted font-micro text-[12px] uppercase tracking-[0.05em]">
            Phase 3 reference
          </p>
          <h1 className="text-fg text-[length:var(--font-h1)] font-display tracking-tight">
            Primitive showcase
          </h1>
          <p className="text-fg-muted font-body max-w-prose">
            Every v3.0 primitive in every state. The in-repo reference — visit
            after touching <code className="font-micro">src/components/ui</code>{' '}
            to verify nothing regressed.
          </p>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* Form section                                                  */}
        {/* ------------------------------------------------------------ */}
        <Section title="Form primitives" eyebrow="Inputs and triggers">
          <ShowcaseCard label="Button — variants × sizes">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Primary sm</Button>
                <Button variant="primary" size="md">Primary md</Button>
                <Button variant="primary" size="lg">Primary lg</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button isLoading>Loading</Button>
              </div>
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="IconButton — variants × sizes">
            <div className="flex flex-wrap items-center gap-3">
              <IconButton
                aria-label="Search"
                icon={<Search strokeWidth={1.5} />}
                size="sm"
                variant="ghost"
              />
              <IconButton
                aria-label="New message"
                icon={<Mail strokeWidth={1.5} />}
                size="md"
                variant="secondary"
              />
              <IconButton
                aria-label="Add item"
                icon={<Plus strokeWidth={1.5} />}
                size="lg"
                variant="primary"
              />
              <IconButton
                aria-label="Delete item"
                icon={<Trash2 strokeWidth={1.5} />}
                variant="destructive"
              />
              <IconButton
                aria-label="More options"
                icon={<MoreHorizontal strokeWidth={1.5} />}
                isLoading
              />
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Input — states">
            <div className="flex flex-col gap-4">
              <Input label="Email" placeholder="you@example.com" />
              <Input
                label="Search"
                placeholder="Find a perfume"
                leadingIcon={<Search strokeWidth={1.5} className="h-4 w-4" />}
              />
              <Input
                label="Promo code"
                placeholder="SUMMER10"
                trailingIcon={<Mail strokeWidth={1.5} className="h-4 w-4" />}
              />
              <Input label="Disabled" value="Read only" disabled readOnly />
              <Input
                label="With error"
                defaultValue="not-an-email"
                error="Enter a valid email address."
              />
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Textarea — states">
            <div className="flex flex-col gap-4">
              <Textarea label="Notes" placeholder="Add a note for the order" />
              <Textarea label="Disabled" disabled value="Locked field" />
              <Textarea
                label="With error"
                defaultValue=""
                error="Notes can't be empty."
              />
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Select">
            <Select.Root defaultValue="niche">
              <Select.Trigger aria-label="Category">
                <Select.Value placeholder="Choose category" />
              </Select.Trigger>
              <Select.Content>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="niche">Niche</SelectItem>
                <SelectItem value="lattafa">Lattafa</SelectItem>
              </Select.Content>
            </Select.Root>
          </ShowcaseCard>

          <ShowcaseCard label="Checkbox — unchecked / checked / indeterminate / disabled">
            <div className="flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 font-body text-[14px] text-fg">
                <Checkbox
                  checked={checkboxState}
                  onCheckedChange={(v) => setCheckboxState(v)}
                />
                Receive editorial updates
              </label>
              <label className="inline-flex items-center gap-2 font-body text-[14px] text-fg">
                <Checkbox checked />
                Pre-checked
              </label>
              <label className="inline-flex items-center gap-2 font-body text-[14px] text-fg">
                <Checkbox checked="indeterminate" />
                Indeterminate
              </label>
              <label className="inline-flex items-center gap-2 font-body text-[14px] text-fg-muted">
                <Checkbox disabled />
                Disabled
              </label>
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="RadioGroup — three options">
            <RadioGroup value={radioValue} onValueChange={setRadioValue}>
              {(['top', 'heart', 'base'] as const).map((id) => (
                <label
                  key={id}
                  className="inline-flex items-center gap-2 font-body text-[14px] text-fg capitalize"
                >
                  <RadioItem value={id} id={`note-${id}`} />
                  {id} note
                </label>
              ))}
            </RadioGroup>
          </ShowcaseCard>

          <ShowcaseCard label="Switch — off / on / disabled">
            <div className="flex flex-col gap-3">
              <label className="inline-flex items-center gap-3 font-body text-[14px] text-fg">
                <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
                Notifications
              </label>
              <label className="inline-flex items-center gap-3 font-body text-[14px] text-fg-muted">
                <Switch disabled />
                Beta tester (disabled)
              </label>
            </div>
          </ShowcaseCard>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* Display section                                               */}
        {/* ------------------------------------------------------------ */}
        <Section title="Display primitives" eyebrow="Surfaces and chrome">
          <ShowcaseCard label="Card — default & interactive">
            <div className="flex flex-col gap-4">
              <Card>
                <p className="font-body text-[14px] text-fg">
                  Default Card surface.
                </p>
              </Card>
              <Card interactive>
                <p className="font-body text-[14px] text-fg">
                  Interactive Card — lifts on hover.
                </p>
              </Card>
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Card — full compound">
            <Card>
              <CardHeader>
                <CardTitle>Khamrah</CardTitle>
                <CardDescription>
                  An oriental gourmand from Lattafa — sweet date and dried fruit
                  over warm spice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-fg-muted text-[14px] font-body">
                  Top: cinnamon, bergamot. Heart: dates, jasmine. Base: tonka,
                  benzoin.
                </p>
              </CardContent>
              <CardFooter>
                <span className="font-body text-[14px] text-fg [font-feature-settings:'tnum'_1]">
                  &euro;89.00
                </span>
                <Button size="sm">Add to cart</Button>
              </CardFooter>
            </Card>
          </ShowcaseCard>

          <ShowcaseCard label="Badge — five variants">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">In stock</Badge>
              <Badge variant="warning">Low stock</Badge>
              <Badge variant="critical">Out of stock</Badge>
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Tag — with and without onRemove">
            <div className="flex flex-wrap gap-2">
              <Tag label="Oud" />
              <Tag
                label="Floral"
                variant="accent"
                onRemove={() => undefined}
              />
              <Tag
                label="Sale"
                variant="critical"
                onRemove={() => undefined}
              />
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Avatar — sizes × image and fallback">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar size="sm" fallback="MA" />
              <Avatar size="md" fallback="KH" />
              <Avatar size="lg" fallback="EL" />
              <Avatar
                size="md"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120"
                alt="Maria"
                fallback="MA"
              />
              <Avatar shape="circle" size="lg" fallback="A" />
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Tooltip">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm">
                  Hover or focus
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Ships in 2&ndash;3 working days.
              </TooltipContent>
            </Tooltip>
          </ShowcaseCard>

          <ShowcaseCard label="Skeleton — three shapes">
            <div className="flex flex-col gap-3">
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="rect" width={200} height={100} />
              <Skeleton variant="circle" width={48} height={48} />
            </div>
          </ShowcaseCard>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* Overlay section                                               */}
        {/* ------------------------------------------------------------ */}
        <Section title="Overlay primitives" eyebrow="Floating surfaces">
          <ShowcaseCard label="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm removal</DialogTitle>
                  <DialogDescription>
                    Remove this item from your wishlist? You can add it back any
                    time.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive">Remove</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ShowcaseCard>

          <ShowcaseCard label="Drawer">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary">Open drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Your cart</DrawerTitle>
                  <DrawerDescription>
                    Two items, ready when you are.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 py-4 font-body text-[14px] text-fg-muted">
                  Cart contents would render here.
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="ghost">Keep browsing</Button>
                  </DrawerClose>
                  <Button>Checkout</Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </ShowcaseCard>

          <ShowcaseCard label="Tabs — three tabs (notes default)">
            <Tabs value={tabValue} onValueChange={setTabValue}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <p className="font-body text-[14px] text-fg">
                  Overview content lives here.
                </p>
              </TabsContent>
              <TabsContent value="notes">
                <p className="font-body text-[14px] text-fg">
                  Top: bergamot. Heart: jasmine. Base: oud and tonka.
                </p>
              </TabsContent>
              <TabsContent value="reviews">
                <p className="font-body text-[14px] text-fg">
                  Reviews would render here.
                </p>
              </TabsContent>
            </Tabs>
          </ShowcaseCard>

          <ShowcaseCard label="Toast — four variants">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast({
                    title: 'Saved.',
                    description: 'Your changes are in.',
                  })
                }
              >
                Default toast
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast({
                    variant: 'success',
                    title: 'Order placed.',
                    description: 'It is ours to send now.',
                  })
                }
              >
                Success toast
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast({
                    variant: 'error',
                    title: "We couldn't load the dashboard.",
                    description: 'Refresh and try again.',
                  })
                }
              >
                Error toast
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast({
                    title: 'Reminder sent.',
                    description: 'View it in your inbox to confirm.',
                  })
                }
              >
                With action description
              </Button>
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Popover">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm">
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <div className="flex flex-col gap-3">
                  <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
                    Filter by
                  </p>
                  <label className="inline-flex items-center gap-2 font-body text-[14px] text-fg">
                    <Checkbox /> In stock
                  </label>
                  <label className="inline-flex items-center gap-2 font-body text-[14px] text-fg">
                    <Checkbox /> On sale
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </ShowcaseCard>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* Data section                                                  */}
        {/* ------------------------------------------------------------ */}
        <Section title="Data primitives" eyebrow="Tabular composition">
          <ShowcaseCard label="Table — sortable, right-aligned numeric column" wide>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell>Category</Table.HeaderCell>
                  <Table.SortHeader
                    onSort={cycleSort}
                    sortDirection={sortDirection}
                  >
                    Price
                  </Table.SortHeader>
                  <Table.HeaderCell>Stock</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedRows.map((row) => (
                  <Table.Row key={row.product}>
                    <Table.Cell>{row.product}</Table.Cell>
                    <Table.Cell>{row.category}</Table.Cell>
                    <Table.Cell align="right">
                      &euro;{row.price.toFixed(2)}
                    </Table.Cell>
                    <Table.Cell align="right">{row.stock}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </ShowcaseCard>

          <ShowcaseCard label="Table — empty state" wide>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Empty colSpan={4}>
                  <EmptyState
                    icon={Inbox}
                    title="No orders yet."
                    description="Orders will appear here once a customer completes checkout."
                    action={<Button size="sm">Share your store</Button>}
                  />
                </Table.Empty>
              </Table.Body>
            </Table.Root>
          </ShowcaseCard>
        </Section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-fg-muted font-micro text-[12px] uppercase tracking-[0.05em]">
          {eyebrow}
        </p>
        <h2 className="text-fg text-[length:var(--font-h2)] font-display tracking-tight">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </section>
  );
}

function ShowcaseCard({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Card className={wide ? 'md:col-span-2' : ''}>
      <CardHeader>
        <Badge variant="neutral">{label}</Badge>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className="h-10 w-10 text-fg-muted"
      />
      <div className="space-y-1 text-center">
        <p className="font-body text-[15px] text-fg">{title}</p>
        <p className="font-body text-[14px] text-fg-muted max-w-prose">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
