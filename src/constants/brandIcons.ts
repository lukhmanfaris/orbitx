import {
  Building2, Store, Briefcase, Rocket, Globe, Palette, Camera, Film,
  Music, Megaphone, ShoppingBag, Heart, Star, Zap, Crown, Diamond,
  Leaf, Coffee, Plane, Gamepad2, Shirt, Utensils, Dumbbell, BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PresetIcon {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const BRAND_ICONS: PresetIcon[] = [
  { id: 'building', name: 'Building', icon: Building2 },
  { id: 'store', name: 'Store', icon: Store },
  { id: 'briefcase', name: 'Business', icon: Briefcase },
  { id: 'rocket', name: 'Rocket', icon: Rocket },
  { id: 'globe', name: 'Globe', icon: Globe },
  { id: 'palette', name: 'Design', icon: Palette },
  { id: 'camera', name: 'Camera', icon: Camera },
  { id: 'film', name: 'Film', icon: Film },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'megaphone', name: 'Marketing', icon: Megaphone },
  { id: 'shopping-bag', name: 'Retail', icon: ShoppingBag },
  { id: 'heart', name: 'Health', icon: Heart },
  { id: 'star', name: 'Star', icon: Star },
  { id: 'zap', name: 'Energy', icon: Zap },
  { id: 'crown', name: 'Premium', icon: Crown },
  { id: 'diamond', name: 'Diamond', icon: Diamond },
  { id: 'leaf', name: 'Nature', icon: Leaf },
  { id: 'coffee', name: 'Cafe', icon: Coffee },
  { id: 'plane', name: 'Travel', icon: Plane },
  { id: 'gamepad2', name: 'Gaming', icon: Gamepad2 },
  { id: 'shirt', name: 'Fashion', icon: Shirt },
  { id: 'utensils', name: 'Food', icon: Utensils },
  { id: 'dumbbell', name: 'Fitness', icon: Dumbbell },
  { id: 'book-open', name: 'Education', icon: BookOpen },
];

export function getPresetIconById(id: string): LucideIcon | undefined {
  return BRAND_ICONS.find(item => item.id === id)?.icon;
}
