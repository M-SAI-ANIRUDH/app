import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { useShop } from "../context/ShopContext";

export const Footer = () => {
  const { sections } = useShop();
  return (
    <footer className="bg-charcoal" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-3 lg:px-16">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="bless to art. logo"
              className="h-11 w-11 rounded-full ring-1 ring-ivory/20"
            />
            <span className="font-serif text-2xl font-medium text-ivory">bless to art.</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/70">
            Little things, made with love. Thoughtfully handmade creations for your everyday
            moments.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-blush">Shop</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/shop" data-testid="footer-link-all-products" className="text-sm text-ivory/80 transition-colors hover:text-white">
                All products
              </Link>
            </li>
            {sections.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/shop?section=${s.id}`}
                  data-testid={`footer-link-section-${s.id}`}
                  className="text-sm text-ivory/80 transition-colors hover:text-white"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-blush">Connect</h3>
          <a
            href="https://www.instagram.com/bless_to_art/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-link-instagram"
            className="mt-4 inline-flex items-center gap-2 text-sm text-ivory/80 transition-colors hover:text-white"
          >
            <Instagram className="h-4 w-4" /> @bless_to_art
          </a>
          <p className="mt-3 text-sm text-ivory/60">
            For orders and enquiries, message us on Instagram — we reply personally.
          </p>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-6 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} bless to art. All pieces are handmade with care.
      </div>
    </footer>
  );
};
