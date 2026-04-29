import React from 'react';
import {
  Briefcase,
  Bus,
  Car,
  CircleDollarSign,
  Clapperboard,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
  Wifi,
  Zap
} from 'lucide-react';

const iconMap = {
  bills: Receipt,
  briefcase: Briefcase,
  bus: Bus,
  car: Car,
  coffee: Coffee,
  education: GraduationCap,
  entertainment: Film,
  film: Film,
  fitness: Dumbbell,
  food: Utensils,
  fuel: Fuel,
  gamepad: Gamepad2,
  games: Gamepad2,
  gift: Gift,
  groceries: ShoppingCart,
  health: HeartPulse,
  home: Home,
  income: CircleDollarSign,
  investment: Landmark,
  medical: HeartPulse,
  mobile: Smartphone,
  movies: Clapperboard,
  other: MoreHorizontal,
  rent: Home,
  salary: Wallet,
  savings: PiggyBank,
  shopping: ShoppingBag,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  subscriptions: Wifi,
  tag: Tag,
  travel: Plane,
  transport: Car,
  utensils: Utensils,
  utilities: Zap,
  wallet: Wallet
};

const normalizeSlug = (slug) => String(slug || '')
  .trim()
  .toLowerCase()
  .replace(/_/g, '-');

export const getCategoryIcon = (iconSlug) => iconMap[normalizeSlug(iconSlug)] || Tag;

export function CategoryIcon({
  iconSlug,
  className = '',
  iconClassName = '',
  size = 18,
  strokeWidth = 1.7
}) {
  const Icon = getCategoryIcon(iconSlug);

  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl border border-white/10 bg-slate-950 text-slate-300 shadow-sm ${className}`}>
      <Icon size={size} strokeWidth={strokeWidth} className={iconClassName} />
    </span>
  );
}
