import { useState } from 'react';
import { homeKinds, type HomeKind } from '~/lib/moving-plan';
import { Icon } from './ui';

/*
 * Mock av boligopplysninger. I en ekte løsning ville dette komme fra et
 * boligregister (f.eks. Matrikkelen). Boligtypen settes per side i skjemaet,
 * mens øvrige eksempelopplysninger er stabile for samme adresse og boligtype.
 */

type HomeFacts = { kind: HomeKind; title: string; size: number; rooms: number; built: number; floor?: number };

const titles: Record<HomeKind, string> = { leilighet: 'Leilighet', rekkehus: 'Rekkehus', enebolig: 'Enebolig', tomannsbolig: 'Tomannsbolig' };

function hash(text: string) {
  let value = 2166136261;
  for (const char of text.toLowerCase().replace(/\s+/g, ' ').trim()) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

export function mockHome(address: string, kind: HomeKind): HomeFacts {
  const h = hash(address);
  const base = { leilighet: [38, 70], rekkehus: [85, 60], enebolig: [110, 80], tomannsbolig: [95, 70] }[kind];
  const size = base[0] + ((h >>> 3) % base[1]);
  return {
    kind,
    title: titles[kind],
    size,
    rooms: Math.max(1, Math.round(size / 28)),
    built: 1925 + ((h >>> 7) % 98),
    floor: kind === 'leilighet' ? 1 + ((h >>> 11) % 6) : undefined,
  };
}

export function homeKindLabel(address: string, kind: HomeKind) {
  return address.trim().length >= 6 ? titles[kind] : '';
}

function HomeIcon({ kind }: { kind: HomeKind }) {
  const roof = '#6A50E8';
  const wall = '#FFFFFF';
  const window = '#DCD5FF';
  return <svg viewBox="0 0 64 48" className="h-12 w-16 shrink-0" aria-hidden="true">
    <rect x="0" y="44" width="64" height="4" rx="2" fill="#C8F2DA" />
    {kind === 'leilighet' && <>
      <rect x="18" y="4" width="28" height="40" rx="2" fill={wall} stroke="#141A45" strokeWidth="1.5" />
      {[10, 18, 26].map((y) => [23, 35].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="5" rx="1" fill={window} />))}
      <rect x="29" y="35" width="6" height="9" rx="1" fill={roof} />
    </>}
    {kind === 'rekkehus' && [4, 22, 40].map((x) => <g key={x}>
      <path d={`M${x} 22 L${x + 10} 12 L${x + 20} 22`} fill={roof} />
      <rect x={x + 1} y="22" width="18" height="22" fill={wall} stroke="#141A45" strokeWidth="1.5" />
      <rect x={x + 7} y="34" width="6" height="10" rx="1" fill={window} />
    </g>)}
    {kind === 'enebolig' && <>
      <path d="M12 22 L32 6 L52 22" fill={roof} />
      <rect x="15" y="22" width="34" height="22" fill={wall} stroke="#141A45" strokeWidth="1.5" />
      <rect x="20" y="27" width="7" height="6" rx="1" fill={window} /><rect x="37" y="27" width="7" height="6" rx="1" fill={window} />
      <rect x="29" y="33" width="6" height="11" rx="1" fill={roof} />
    </>}
    {kind === 'tomannsbolig' && <>
      <path d="M6 22 L19 10 L32 22 L45 10 L58 22" fill={roof} />
      <rect x="8" y="22" width="48" height="22" fill={wall} stroke="#141A45" strokeWidth="1.5" />
      <path d="M32 22v22" stroke="#141A45" strokeWidth="1.5" />
      <rect x="15" y="33" width="6" height="11" rx="1" fill={window} /><rect x="43" y="33" width="6" height="11" rx="1" fill={window} />
    </>}
  </svg>;
}

export function HomeTypePreview({ address, kind, onChange, label }: { address: string; kind: HomeKind; onChange: (kind: HomeKind) => void; label: string }) {
  const ready = address.trim().length >= 6;
  const [editing, setEditing] = useState(false);

  if (!ready) return null;
  const home = mockHome(address, kind);
  return <div className="relative flex items-center gap-3 rounded-2xl bg-white p-3 pr-14 shadow-[0_0_0_1px_var(--color-kveld-100)]">
    <HomeIcon kind={home.kind} />
    <div className="min-w-0 flex-1">
      {editing ? <label className="block text-xs font-semibold text-kveld-500">Boligtype<select autoFocus className="text-input mt-1" value={kind} onChange={(event) => { onChange(event.target.value as HomeKind); setEditing(false); }}>{homeKinds.map((value) => <option key={value} value={value}>{titles[value]}</option>)}</select></label> : <p className="font-semibold text-kveld-900">{home.title}</p>}
      <p className="text-xs leading-5 text-kveld-500">{home.size} m² · {home.rooms} {home.rooms === 1 ? 'rom' : 'rom'}{home.floor ? ` · ${home.floor}. etasje` : ''} · bygget {home.built}</p>
    </div>
    <button type="button" className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-lg text-kveld-500 hover:bg-kveld-50" aria-label={`Endre boligtype ${label}`} aria-expanded={editing} onClick={() => setEditing(!editing)}><Icon name="edit" className="h-4 w-4" /></button>
  </div>;
}
