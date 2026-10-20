import { Link } from "react-router-dom";
import { ArrowRight, Instagram } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { FadeUp, MaskedLine } from "../components/Reveal";

const STORY_IMAGE =
  "https://images.pexels.com/photos/9736672/pexels-photo-9736672.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const DEFAULT_ABOUT = {
  about_heading: "A small studio with a soft spot for little things.",
  about_p1:
    "Bless to Art began with a simple belief: the objects we keep close should carry warmth. This is a creative studio page — the story here is a placeholder, ready for the owner's own words about how the brand began.",
  about_p2:
    "What never changes is the making: slow, careful, and personal. Each piece is finished by hand and packed with care before it finds its way to you.",
};

const VALUES = [
  { title: "Hand-poured & handmade", text: "Every candle, charm and print is made by hand in small batches — never mass-produced." },
  { title: "Natural materials", text: "Soy wax, real pressed flowers, archival papers and gentle, honest finishes." },
  { title: "Made for gifting", text: "Thoughtful pieces for birthdays, thank-yous and the quiet everyday moments in between." },
];

const AboutPage = () => {
  const { content } = useShop();
  const about = { ...DEFAULT_ABOUT, ...(content || {}) };

  return (
    <div className="pb-24 pt-28" data-testid="about-page">
      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">About the studio</p>
        <h1
          className="mt-4 font-serif text-4xl font-light leading-[1.12] tracking-tight text-charcoal sm:text-6xl"
          data-testid="about-heading"
        >
          <MaskedLine delay={0.1}>{about.about_heading}</MaskedLine>
        </h1>
      </div>

      <FadeUp className="mx-auto mt-14 max-w-5xl px-4 sm:px-8">
        <div className="overflow-hidden rounded-3xl">
          <img
            src={STORY_IMAGE}
            alt="An artisan crafting handmade gifts in a sunlit studio"
            className="aspect-[16/8] w-full object-cover"
          />
        </div>
      </FadeUp>

      <div className="mx-auto mt-16 grid max-w-5xl gap-12 px-4 sm:px-8 md:grid-cols-2">
        <FadeUp>
          <p className="text-base leading-relaxed text-taupe" data-testid="about-p1">
            {about.about_p1}
          </p>
          <p className="mt-5 text-base leading-relaxed text-taupe" data-testid="about-p2">
            {about.about_p2}
          </p>
        </FadeUp>
        <div className="space-y-8">
          {VALUES.map((v, i) => (
            <FadeUp key={v.title} delay={i * 0.08}>
              <div className="rounded-2xl border border-sand bg-white p-6">
                <h3 className="font-serif text-xl text-charcoal">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-taupe">{v.text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>

      <FadeUp className="mx-auto mt-20 max-w-3xl px-4 text-center sm:px-8">
        <h2 className="font-serif text-3xl tracking-tight text-charcoal">Come say hello.</h2>
        <p className="mx-auto mt-4 max-w-md text-base text-taupe">
          The studio lives on Instagram — follow along for new pieces, works in progress and the
          occasional studio mess.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://www.instagram.com/bless_to_art/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="about-instagram-button"
            className="inline-flex items-center gap-2 rounded-full bg-charcoal px-7 py-3.5 text-sm font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta"
          >
            <Instagram className="h-4 w-4" /> @bless_to_art
          </a>
          <Link
            to="/shop"
            data-testid="about-shop-link"
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal underline decoration-terracotta/50 underline-offset-8 transition-colors hover:text-terracotta"
          >
            Browse the shop <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeUp>
    </div>
  );
};

export default AboutPage;
