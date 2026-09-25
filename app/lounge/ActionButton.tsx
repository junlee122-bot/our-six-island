'use client';
// The one contextual action button (bottom-right, beside the D-pad): its label
// and icon follow the nearest thing you can use; E always presses it.
import {
  Apple,
  Armchair,
  Bug,
  ClipboardList,
  CookingPot,
  FishingRod,
  Landmark,
  Leaf,
  Sparkles,
  ArrowUpFromLine,
  Play,
  UserPlus,
  DoorClosed,
  DoorOpen,
  Droplets,
  Eye,
  Mail,
  MessageCircle,
  Palette,
  Shirt,
  Sprout,
  Wheat,
} from 'lucide-react';
import { ACTION_LABEL, type ActionKind } from '../lounge-flow';

const ICON: Record<ActionKind, typeof DoorOpen> = {
  enter: DoorOpen,
  exit: DoorClosed,
  talk: MessageCircle,
  plant: Sprout,
  water: Droplets,
  harvest: Wheat,
  tend: Sprout,
  pick: Apple,
  mail: Mail,
  look: Eye,
  dress: Shirt,
  decorate: Palette,
  guide: Sprout,
  sit: Armchair,
  join: UserPlus,
  watch: Eye,
  resume: Play,
  stand: ArrowUpFromLine,
  fish: FishingRod,
  forage: Leaf,
  catch: Bug,
  museum: Landmark,
  board: ClipboardList,
  waterFriend: Droplets,
  cook: CookingPot,
  wish: Sparkles,
};

export function ActionButton({
  kind,
  label,
  detail,
  disabled,
  shortcut,
  onPress,
  className = '',
}: {
  kind: ActionKind | null;
  /** Overrides the default label for the kind. */
  label?: string;
  /** Screen-reader context, e.g. "회관 · 안에 2명". */
  detail?: string;
  disabled?: boolean;
  /** Key cap for the action key (E unless rebound in 설정 → 조작). */
  shortcut?: string;
  onPress: () => void;
  className?: string;
}) {
  if (!kind) return null;
  const Icon = ICON[kind];
  const text = label ?? ACTION_LABEL[kind];
  const key = shortcut ?? 'E';
  return (
    <button
      type="button"
      className={`l-action-button ${className}`}
      data-testid="action-button"
      data-action={kind}
      disabled={disabled}
      aria-label={`${text}${detail ? ` · ${detail}` : ''} (${key})`}
      aria-keyshortcuts={key}
      onClick={onPress}
    >
      <Icon size={22} aria-hidden="true" />
      <span>{text}</span>
      <kbd aria-hidden="true" className="l-action-key">
        {key}
      </kbd>
    </button>
  );
}
