const PHRASES = [
  "hand-poured candles",
  "pressed botanicals",
  "little things, made with love",
  "thoughtful gifting",
  "small-batch studio",
  "made slowly, made well",
];

export const Marquee = () => {
  const row = (
    <>
      {PHRASES.map((p, i) => (
        <span key={i} className="mx-6 flex items-center gap-6">
          <span className="font-serif text-lg italic text-taupe sm:text-xl">{p}</span>
          <svg viewBox="0 0 64 64" className="h-3.5 w-3.5" aria-hidden="true">
            <g fill="#B8745B" opacity="0.7">
              <circle cx="32" cy="19" r="8" />
              <circle cx="43.4" cy="27.3" r="8" />
              <circle cx="39" cy="40.7" r="8" />
              <circle cx="25" cy="40.7" r="8" />
              <circle cx="20.6" cy="27.3" r="8" />
            </g>
          </svg>
        </span>
      ))}
    </>
  );

  return (
    <div className="overflow-hidden border-y border-sand bg-cream/70 py-4" aria-hidden="true">
      <div className="animate-marquee flex w-max">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
};
