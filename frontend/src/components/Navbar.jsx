import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Instagram, Menu, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { useShop } from "../context/ShopContext";
import { FlowerMark } from "./Reveal";

const NAV_LINKS = [
  { to: "/", label: "Home", testid: "nav-link-home" },
  { to: "/shop", label: "Shop", testid: "nav-link-shop" },
  { to: "/about", label: "About", testid: "nav-link-about" },
];

export const Navbar = () => {
  const { cartCount, setCartOpen } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-sand/60 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-16">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5">
          <FlowerMark className="h-7 w-7" />
          <span className="font-serif text-2xl font-medium tracking-tight text-charcoal">
            bless to art.
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.testid}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-300 hover:text-terracotta ${
                  isActive ? "text-terracotta" : "text-taupe"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a
            href="https://www.instagram.com/bless_to_art/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="nav-link-instagram"
            aria-label="Bless to Art on Instagram"
            className="text-taupe transition-colors duration-300 hover:text-terracotta"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <button
            onClick={() => setCartOpen(true)}
            data-testid="cart-drawer-trigger"
            aria-label={`Open basket, ${cartCount} items`}
            className="relative rounded-full p-2 text-charcoal transition-colors duration-300 hover:bg-cream"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                data-testid="cart-count-badge"
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-semibold text-ivory"
              >
                {cartCount}
              </span>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            data-testid="cart-drawer-trigger-mobile"
            aria-label={`Open basket, ${cartCount} items`}
            className="relative rounded-full p-2 text-charcoal"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-semibold text-ivory">
                {cartCount}
              </span>
            )}
          </button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button data-testid="mobile-menu-trigger" aria-label="Open menu" className="rounded-full p-2 text-charcoal">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-ivory">
              <SheetTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
                <FlowerMark className="h-6 w-6" /> bless to art.
              </SheetTitle>
              <nav className="mt-10 flex flex-col gap-2" aria-label="Mobile navigation">
                {NAV_LINKS.map((l) => (
                  <button
                    key={l.to}
                    data-testid={`mobile-${l.testid}`}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(l.to);
                    }}
                    className="rounded-xl px-4 py-3 text-left font-serif text-2xl text-charcoal transition-colors hover:bg-cream"
                  >
                    {l.label}
                  </button>
                ))}
                <a
                  href="https://www.instagram.com/bless_to_art/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="mobile-nav-link-instagram"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-serif text-2xl text-charcoal transition-colors hover:bg-cream"
                >
                  <Instagram className="h-5 w-5 text-terracotta" /> Instagram
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
