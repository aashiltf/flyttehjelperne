import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './ui';

type Props = {
  number: number;
  title: string;
  summary: ReactNode;
  complete: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Et felt som utvider seg når man klikker inni det, og lukker seg når man klikker
 * (eller tabber) utenfor. Lukket viser det et sammendrag av det som er fylt inn.
 */
export function ExpandableField({ number, title, summary, complete, open, onOpen, onClose, children }: Props) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Lukk ved klikk utenfor. Lukker først på «click» (ikke ved museknapp ned),
    // slik at feltet ikke krymper og flytter det man faktisk prøver å klikke på.
    let pointerDown = false;
    const isOutside = (target: EventTarget | null) => Boolean(root.current && target instanceof Node && target.isConnected && !root.current.contains(target));
    const down = () => { pointerDown = true; };
    const click = (event: MouseEvent) => { pointerDown = false; if (isOutside(event.target)) onClose(); };
    // Tastatur: lukk når fokus tabbes ut av feltet.
    const focus = (event: FocusEvent) => { if (!pointerDown && isOutside(event.target)) onClose(); };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('click', click);
    document.addEventListener('focusin', focus);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('click', click);
      document.removeEventListener('focusin', focus);
    };
  }, [open, onClose]);

  return <section
    ref={root}
    aria-labelledby={`${id}-title`}
    onClick={() => { if (!open) onOpen(); }}
    onKeyDown={(event) => { if (open && event.key === 'Escape' && !event.defaultPrevented) { onClose(); toggle.current?.focus(); } }}
    className={`rounded-3xl bg-white transition-shadow ${open ? 'shadow-[0_0_0_2px_var(--color-syrin-500),0_24px_60px_-30px_rgba(20,26,69,0.35)]' : 'cursor-pointer shadow-[0_0_0_1px_var(--color-kveld-100)] hover:shadow-[0_0_0_1px_var(--color-syrin-300),0_10px_30px_-20px_rgba(20,26,69,0.3)]'}`}
  >
    <h2 id={`${id}-title`}>
      <button ref={toggle} type="button" aria-expanded={open} aria-controls={`${id}-panel`}
        onClick={(event) => { event.stopPropagation(); if (open) onClose(); else onOpen(); }}
        className="flex w-full items-start gap-4 rounded-3xl p-5 text-left sm:p-6">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${complete ? 'bg-ok-100 text-ok-500' : open ? 'bg-syrin-500 text-white' : 'bg-kveld-100 text-kveld-700'}`}>
          {complete && !open ? <Icon name="check" className="h-4 w-4" /> : number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold tracking-tight text-kveld-900">{title}</span>
          {!open && <span className="mt-1 block text-sm leading-6 text-kveld-500">{summary}</span>}
        </span>
        <span className="mt-1.5 text-xs font-semibold text-syrin-600">{open ? <Icon name="chevron" className="h-4 w-4 -rotate-90" /> : complete ? 'Endre' : <Icon name="chevron" className="h-4 w-4 rotate-90" />}</span>
      </button>
    </h2>
    {open && <div id={`${id}-panel`} className="px-5 pb-6 sm:px-6">{children}</div>}
  </section>;
}
