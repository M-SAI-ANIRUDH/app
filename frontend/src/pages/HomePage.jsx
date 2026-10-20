import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Instagram } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { imgSrc } from "../lib/api";
import { FadeUp, MaskedLine } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";
import { Marquee } from "../components/Marquee";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1603905179139-db12ab535ca9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMHNveSUyMGNhbmRsZSUyMGFlc3RoZXRpYyUyMG5hdHVyYWwlMjBsaWdodCUyMHN0dWRpb3xlbnwwfHx8fDE3OTI1MTkyNDJ8MA&ixlib=rb-4.1.0&q=85";
const STORY_IMAGE =
  "https://images.pexels.com/photos/9736672/pexels-photo-9736672.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const DEFAULT_STORY = {
  story_heading: "The joy of small things, made slowly.",
  story_p1:
    "Bless to Art is a small creative studio celebrating handmade craft — the quiet pleasure of a candle lit at dusk, a keepsake carried every day, a print that makes a wall feel like home.",
  story_p2:
    "Every piece is made in small batches with natural materials and thoughtful details, created to be gifted, kept, and loved for a long time.",
};

const HomePage = () => {
  const { sections, products, content } = useShop();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const featured = products.filter((p) => p.is_featured && p.is_available).slice(0, 6);
  const story = { ...DEFAULT_STORY, ...(content || {}) };

  const sectionImage = (section) => {
    const p = products.find((pr) => pr.section_id === section.id && pr.image_url);
    return p ? imgSrc(p.image_url) : "/placeholder.svg";
  };

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-20 pt-12 sm:px-8 md:grid-cols-12 lg:gap-14 lg:px-16 lg:pt-20">
          <div className="md:col-span-6">
            <FadeUp delay={0.1}>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">
                A handmade studio
              </p>
            </FadeUp>
            <h1 className="mt-6 font-serif text-5xl font-light leading-[1.08] tracking-tight text-charcoal sm:text-6xl lg:text-7xl">
              <MaskedLine delay={0.2}>Little things,</MaskedLine>
              <MaskedLine delay={0.35}>
                made <em className="text-terracotta">with love.</em>
              </MaskedLine>
            </h1>
            <FadeUp delay={0.55}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-taupe sm:text-lg">
                Thoughtfully made creations for your everyday moments — candles, keepsakes and
                small works of art, crafted one at a time.
              </p>
            </FadeUp>
            <FadeUp delay={0.7} className="mt-9 flex flex-wrap items-center gap-5">
              <button
                onClick={() => navigate("/shop")}
                data-testid="hero-explore-button"
                className="group inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-sm font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta-dark hover:shadow-[0_16px_30px_-12px_rgba(184,116,91,0.55)]"
              >
                Explore the collection
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <Link
                to="/about"
                data-testid="hero-story-link"
                className="text-sm font-medium text-charcoal underline decoration-terracotta/50 underline-offset-8 transition-colors hover:text-terracotta"
              >
                Our story
              </Link>
            </FadeUp>
          </div>

          <div className="relative md:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl shadow-[0_30px_60px_-25px_rgba(57,46,40,0.25)]"
            >
              <motion.img
                src={HERO_IMAGE}
                alt="Hand-poured soy candles on a warm studio table in natural light"
                style={{ y: imageY, scale: 1.12 }}
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/5]"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="absolute -bottom-6 -left-4 rounded-2xl border border-sand/70 bg-ivory/90 px-5 py-4 shadow-[0_16px_35px_-18px_rgba(57,46,40,0.3)] backdrop-blur-md sm:-left-8"
            >
              <p className="font-serif text-lg italic text-charcoal">hand-poured, small-batch</p>
              <p className="text-xs uppercase tracking-[0.18em] text-terracotta">every single piece</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:px-16 lg:py-28" data-testid="collections-section">
        <FadeUp>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">Collections</p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-charcoal sm:text-4xl lg:text-5xl">
                Explore our collections.
              </h2>
            </div>
            <Link to="/shop" className="text-sm font-medium text-terracotta underline underline-offset-8 hover:text-terracotta-dark" data-testid="collections-view-all-link">
              View everything
            </Link>
          </div>
        </FadeUp>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section, i) => (
            <FadeUp key={section.id} delay={i * 0.08}>
              <Link
                to={`/shop?section=${section.id}`}
                data-testid={`collection-card-${section.id}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
                  <img
                    src={sectionImage(section)}
                    alt={`${section.name} collection`}
                    loading="lazy"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-serif text-2xl text-ivory">{section.name}</h3>
                    <p className="mt-1 text-xs text-ivory/85">
                      {section.product_count} {section.product_count === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-taupe">{section.description}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta">
                  Explore collection
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-cream/50 py-20 lg:py-28" data-testid="featured-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
          <FadeUp>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">Featured</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-charcoal sm:text-4xl lg:text-5xl">
              Pieces we keep coming back to.
            </h2>
          </FadeUp>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand story — copy is editable from the admin dashboard */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-8 md:grid-cols-2 lg:px-16 lg:py-32" data-testid="brand-story-section">
        <FadeUp className="order-2 md:order-1">
          <div className="overflow-hidden rounded-3xl">
            <img
              src={STORY_IMAGE}
              alt="An artisan at work in a warm, sunlit studio"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>
        </FadeUp>
        <div className="order-1 md:order-2">
          <FadeUp>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">Our story</p>
            <h2 className="mt-3 font-serif text-3xl leading-snug tracking-tight text-charcoal sm:text-4xl" data-testid="brand-story-heading">
              {story.story_heading}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-taupe" data-testid="brand-story-p1">
              {story.story_p1}
            </p>
            <p className="mt-4 text-base leading-relaxed text-taupe" data-testid="brand-story-p2">
              {story.story_p2}
            </p>
            <Link
              to="/about"
              data-testid="brand-story-link"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-charcoal/20 px-6 py-3 text-sm font-medium text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:border-terracotta hover:text-terracotta"
            >
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* Instagram */}
      <section className="bg-blush/40 py-20 lg:py-24" data-testid="instagram-section">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-8">
          <FadeUp>
            <img
              src="/logo_charcoal.png"
              alt="bless to art. monogram"
              className="mx-auto h-20 w-20 rounded-full shadow-[0_14px_30px_-12px_rgba(57,46,40,0.4)]"
              data-testid="instagram-section-logo"
            />
            <h2 className="mt-6 font-serif text-3xl tracking-tight text-charcoal sm:text-4xl">
              Follow the studio on Instagram.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-taupe">
              New pieces, works in progress and behind-the-scenes moments — come say hello at
              @bless_to_art.
            </p>
            <a
              href="https://www.instagram.com/bless_to_art/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="instagram-follow-button"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal px-7 py-3.5 text-sm font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta"
            >
              <Instagram className="h-4 w-4" /> @bless_to_art
            </a>
          </FadeUp>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
