import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { imgSrc, inr } from "../lib/api";
import { FadeUp } from "../components/Reveal";

const ProductPage = () => {
  const { id } = useParams();
  const { productMap, sections, loading, addToCart, setCartOpen } = useShop();
  const [qty, setQtyLocal] = useState(1);

  const product = productMap[id];
  const section = product && sections.find((s) => s.id === product.section_id);
  const unavailable = product && (!product.is_available || product.stock_quantity === 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-8">
        <div className="grid animate-pulse gap-10 md:grid-cols-2">
          <div className="aspect-[4/5] rounded-3xl bg-cream" />
          <div className="space-y-4 pt-8">
            <div className="h-8 w-2/3 rounded bg-cream" />
            <div className="h-5 w-1/4 rounded bg-cream" />
            <div className="h-20 rounded bg-cream" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 pb-24 pt-40 text-center" data-testid="product-not-found">
        <p className="font-serif text-3xl text-charcoal">This piece is no longer here.</p>
        <p className="text-sm text-taupe">It may have been removed from the collection.</p>
        <Link
          to="/shop"
          data-testid="product-not-found-back"
          className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-8 lg:px-16" data-testid="product-detail-page">
      <Link
        to="/shop"
        data-testid="product-back-to-shop"
        className="inline-flex items-center gap-2 text-sm font-medium text-taupe transition-colors hover:text-terracotta"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
        <FadeUp>
          <div className="overflow-hidden rounded-3xl bg-cream shadow-[0_25px_50px_-25px_rgba(57,46,40,0.25)]">
            <img
              src={imgSrc(product.image_url)}
              alt={product.name}
              onError={(e) => {
                if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
              }}
              className="aspect-[4/5] w-full object-cover"
              data-testid="product-detail-image"
            />
          </div>
        </FadeUp>

        <FadeUp delay={0.12}>
          {section && (
            <Link
              to={`/shop?section=${section.id}`}
              data-testid="product-section-link"
              className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta hover:text-terracotta-dark"
            >
              {section.name}
            </Link>
          )}
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-charcoal sm:text-5xl" data-testid="product-detail-name">
            {product.name}
          </h1>
          <p className="mt-4 font-serif text-3xl font-medium text-charcoal" data-testid="product-detail-price">
            {inr(product.price)}
          </p>

          <p className="mt-6 text-base leading-relaxed text-taupe" data-testid="product-detail-description">
            {product.description}
          </p>

          <div className="mt-6" data-testid="product-detail-availability">
            {unavailable ? (
              <span className="inline-flex rounded-full bg-charcoal/80 px-4 py-1.5 text-xs font-medium text-ivory">
                Currently unavailable
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-blush/60 px-4 py-1.5 text-xs font-medium text-charcoal">
                <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                {product.stock_quantity != null
                  ? `Available — ${product.stock_quantity} in the studio`
                  : "Available"}
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 rounded-full border border-sand bg-white px-3 py-2">
              <button
                onClick={() => setQtyLocal((q) => Math.max(1, q - 1))}
                data-testid="product-qty-decrease"
                aria-label="Decrease quantity"
                className="p-1 text-charcoal transition-colors hover:text-terracotta"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center font-medium" data-testid="product-qty-value">
                {qty}
              </span>
              <button
                onClick={() =>
                  setQtyLocal((q) =>
                    product.stock_quantity != null ? Math.min(q + 1, product.stock_quantity) : q + 1
                  )
                }
                data-testid="product-qty-increase"
                aria-label="Increase quantity"
                className="p-1 text-charcoal transition-colors hover:text-terracotta"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                addToCart(product, qty);
                setCartOpen(true);
              }}
              disabled={unavailable}
              data-testid="product-add-to-cart"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-terracotta px-8 py-3.5 text-sm font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
            >
              <ShoppingBag className="h-4 w-4" /> Add to basket
            </button>
          </div>

          <p className="mt-8 border-t border-sand pt-6 text-xs leading-relaxed text-taupe">
            Every piece is handmade, so small variations are part of its charm. Orders are confirmed
            personally over Instagram — delivery charges are shared there.
          </p>
        </FadeUp>
      </div>
    </div>
  );
};

export default ProductPage;
