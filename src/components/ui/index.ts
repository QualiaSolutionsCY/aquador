// src/components/ui/index.ts — v3.0 primitive barrel (Phase 3, PRIM-05).
//
// Every consumer should import primitives through this barrel:
//
//   import { Button, Card, Badge, Table, useToast } from '@/components/ui';
//
// Section ordering follows the four primitive families from .planning/phase-3-plan.md:
//   form    — inputs and triggers the user manipulates directly
//   display — surfaces and chrome that present data
//   overlay — surfaces that float above the page (modal, drawer, tooltip, popover, tabs, toast)
//   data    — tabular data composites

// form
export { Button, buttonVariants } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton';
export { Input } from './Input';
export type { InputProps } from './Input';
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';
export {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectRoot,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './Select';
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export { RadioGroup, RadioItem } from './Radio';
export type { RadioGroupProps, RadioItemProps } from './Radio';
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

// display
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export { Badge, badgeBase, badgeVariants } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';
export { Tag } from './Tag';
export type { TagProps } from './Tag';
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize, AvatarShape } from './Avatar';
export {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from './Tooltip';
export type { TooltipContentProps } from './Tooltip';
export { Skeleton } from './Skeleton';
export type { SkeletonProps, SkeletonVariant } from './Skeleton';

// overlay
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './Dialog';
export type { DialogContentProps } from './Dialog';
export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './Drawer';
export type { DrawerContentProps } from './Drawer';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { Toaster, useToast } from './Toast';
export type { ToastOptions, ToastVariant } from './Toast';
export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
} from './Popover';
export type { PopoverContentProps } from './Popover';

// data
export { Table } from './Table';
export type {
  TableRootProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
  TableCellAlign,
  TableSortHeaderProps,
  TableSortDirection,
  TableEmptyProps,
} from './Table';
