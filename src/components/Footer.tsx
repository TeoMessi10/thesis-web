const ML = "font-mono text-[11px] font-medium uppercase tracking-[.2em]";

export default function Footer() {
  return (
    <footer className="border-t border-hair bg-ink-2 py-[46px]">
      <div className="mx-auto flex max-w-wrap flex-wrap items-center justify-between gap-6 px-12 max-[1100px]:px-8 max-[640px]:px-5">
        <div className="flex items-center gap-[11px]">
          <span className="h-[11px] w-[11px] rotate-45 bg-verm shadow-[0_0_18px_rgba(255,79,46,.45)]" />
          <span className={`${ML} text-ivory-2`}>Thesis&nbsp;&nbsp;·&nbsp;&nbsp;Stockholm&nbsp;&nbsp;·&nbsp;&nbsp;Est. 2026</span>
        </div>
        <span className={`${ML} text-mute`}>Allt innehåll är information — inte investeringsrådgivning</span>
      </div>
    </footer>
  );
}
