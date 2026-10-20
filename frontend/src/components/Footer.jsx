import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { FlowerMark } from "./Reveal";

export const Footer = () => {
  const { sections } = useShop();
  return (
    <footer className="border-t border-sand bg-cream/60" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-3 lg:px-16">
        <div>
          <div className="flex items-center gap-2.5">
            <FlowerMark className="h-10 w-10" />
            <span className="font-serif text-2xl font-medium text-charcoal">bless to art.</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-taupe">
            Little things, made with love. Thoughtfully handmade creations for your everyday
            moments.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">Shop</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/shop" data-testid="footer-link-all-products" className="text-sm text-charcoal transition-colors hover:text-terracotta">
                All products
              </Link>
            </li>
            {sections.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/shop?section=${s.id}`}
                  data-testid={`footer-link-section-${s.id}`}
                  className="text-sm text-charcoal transition-colors hover:text-terracotta"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">Connect</h3>
          <a
            href="https://www.instagram.com/bless_to_art/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-link-instagram"
            className="mt-4 inline-flex items-center gap-2 text-sm text-charcoal transition-colors hover:text-terracotta"
          >
            <Instagram className="h-4 w-4" /> @bless_to_art
          </a>
          <p className="mt-3 text-sm text-taupe">
            For orders and enquiries, message us on Instagram — we reply personally.
          </p>
        </div>
      </div>
      <div className="border-t border-sand/70 py-6 text-center text-xs text-taupe">
        © {new Date().getFullYear()} bless to art. All pieces are handmade with care.
      </div>
    </footer>
  );
};
