'use client';
// The game's icon set under the names the code used to import from
// lucide-react, each drawn by <Glyph> (one hand-drawn family). New code should
// use <Glyph name="…"> directly; lucide-react is a lint error (.oxlintrc.json).
import type { ComponentType, CSSProperties } from 'react';
import { Glyph, type GlyphName } from './Glyph';

export type IconProps = {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  /** Accessible name when the icon stands alone; otherwise it is decorative. */
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  /** Accepted for compatibility; glyphs keep their own stroke. */
  strokeWidth?: number;
  /** Heart only: a filled or an empty heart. */
  fill?: string;
  /** Tints line glyphs (currentColor). */
  color?: string;
};
export type IconComponent = ComponentType<IconProps>;

function icon(name: GlyphName): IconComponent {
  const Icon = ({ size = 24, className, style, color, 'aria-label': label }: IconProps) => (
    <Glyph name={name} size={size} className={className} title={label} style={color ? { ...style, color } : style} />
  );
  Icon.displayName = `Icon(${name})`;
  return Icon;
}

export const Anvil = icon('anvil');
export const Apple = icon('apple');
export const Armchair = icon('armchair');
export const ArrowLeft = icon('arrow-left');
export const ArrowRight = icon('arrow');
export const ArrowUpFromLine = icon('stand');
export const ArrowUpRight = icon('arrow-up-right');
export const Award = icon('award');
export const Axe = icon('axe');
export const Backpack = icon('bag');
export const BellRing = icon('bell');
export const BookOpen = icon('book');
export const Bookmark = icon('bookmark');
export const Bot = icon('bot');
export const Bug = icon('bug');
export const CalendarClock = icon('calendar');
export const CalendarDays = icon('calendar');
export const CalendarHeart = icon('calendar');
export const Camera = icon('camera');
export const Check = icon('check');
export const ChefHat = icon('chef');
export const ChevronDown = icon('chevron-down');
export const ChevronUp = icon('chevron-up');
export const ChevronsUp = icon('chevrons-up');
export const Circle = icon('circle');
export const CircleAlert = icon('alert');
export const ClipboardList = icon('clipboard');
export const Cloud = icon('cloud');
export const CloudCheck = icon('cloud-check');
export const CloudLightning = icon('storm');
export const CloudOff = icon('cloud-off');
export const CloudRain = icon('rain');
export const CloudUpload = icon('cloud-up');
export const Coins = icon('coin');
export const Compass = icon('compass');
export const Construction = icon('construction');
export const CookingPot = icon('pot');
export const Copy = icon('copy');
export const Crown = icon('crown');
export const Dices = icon('dice');
export const DoorClosed = icon('door-closed');
export const DoorOpen = icon('door');
export const Download = icon('download');
export const Droplets = icon('drop');
export const Expand = icon('expand');
export const Eye = icon('eye');
export const EyeOff = icon('eye-off');
export const Feather = icon('feather');
export const Fish = icon('fish');
export const FishingRod = icon('rod');
export const FlaskConical = icon('flask');
export const Flame = icon('flame');
export const FlipHorizontal2 = icon('flip');
export const Flower2 = icon('flower');
export const Footprints = icon('footprints');
export const Ghost = icon('ghost');
export const Gift = icon('gift');
export const GraduationCap = icon('cap');
export const Hammer = icon('hammer');
export const Hand = icon('hand');
export const Handshake = icon('handshake');
export const House = icon('house');
export const Info = icon('info');
export const KeyRound = icon('key');
export const Keyboard = icon('keyboard');
export const Landmark = icon('landmark');
export const Layers = icon('layers');
export const LayoutGrid = icon('grid');
export const Leaf = icon('leaf');
export const Lightbulb = icon('bulb');
export const Link = icon('link');
export const ListChecks = icon('checklist');
export const LoaderCircle = icon('loader');
export const LocateFixed = icon('locate');
export const Lock = icon('lock');
export const LogOut = icon('door');
export const Mail = icon('letter');
export const MailOpen = icon('letter-open');
export const Map = icon('map');
export const MapIcon = icon('map');
export const MapPin = icon('pin');
export const Maximize = icon('maximize');
export const Menu = icon('menu');
export const MessageCircle = icon('chat');
export const MessageSquareQuote = icon('quote');
export const Minimize = icon('minimize');
export const Minus = icon('minus');
export const Monitor = icon('monitor');
export const Moon = icon('moon');
export const MoreHorizontal = icon('more');
export const Newspaper = icon('news');
export const Palette = icon('palette');
export const PartyPopper = icon('party');
export const PenLine = icon('pen');
export const Pickaxe = icon('pickaxe');
export const Play = icon('play');
export const Plus = icon('plus');
export const Power = icon('power');
export const RefreshCw = icon('refresh');
export const Reply = icon('reply');
export const RotateCcw = icon('undo');
export const RotateCw = icon('redo');
export const Send = icon('send');
export const Settings = icon('gear');
export const Shirt = icon('shirt');
export const ShieldCheck = icon('shield');
export const Skull = icon('skull');
export const Smile = icon('sticker');
export const Snowflake = icon('snow');
export const Sofa = icon('armchair');
export const Soup = icon('pot');
export const Spade = icon('spade');
export const Sparkles = icon('spark');
export const Sprout = icon('sprout');
export const Store = icon('store');
export const Sun = icon('sun');
export const Sunrise = icon('sunrise');
export const Sunset = icon('sunset');
export const Timer = icon('timer');
export const Trash2 = icon('trash');
export const Trees = icon('tree');
export const TriangleAlert = icon('warn');
export const Trophy = icon('trophy');
export const UserPlus = icon('user-plus');
export const UserRound = icon('user');
export const Users = icon('people');
export const VenetianMask = icon('mask');
export const Volume2 = icon('volume');
export const VolumeX = icon('volume-off');
export const Vote = icon('vote');
export const Wheat = icon('wheat');
export const Wine = icon('wine');
export const X = icon('close');

/** Filled heart (fill ≠ 'none') or an empty outline heart in `color`. */
export function Heart({ size = 24, className, style, color, fill, 'aria-label': label }: IconProps) {
  const filled = fill !== 'none';
  return (
    <Glyph
      name={filled ? 'heart' : 'heart-line'}
      size={size}
      className={className}
      title={label}
      style={!filled && color ? { ...style, color } : style}
    />
  );
}
