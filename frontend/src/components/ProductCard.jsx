import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { imgSrc, inr } from "../lib/api";
import { FadeUp } from "./Reveal";

const handleImgError = (e) => {
  if (!e.currentTarget.src.endsWith("/placeholder.svg")) {
    e.currentTarget.src = "/placeholder.svg";
  }
};

export const ProductCard = ({ product, index = 0 }) => {
  const { addToCart, setCartOpen } = useShop();
  const unavailable = !product.is_available || product.stock_quantity === 0;

  return (
    <FadeUp delay={(index % 4) * 0.07} className="h-full">
      <div className="group flex h-full flex-col" data-testid={`product-card-${product.id}`}>
        <Link to={`/product/${product.id}`} className="block" aria-label={`View ${product.name}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream shadow-[0_10px_30px_-15px_rgba(57,46,40,0.08)]">
            <img
              src={imgSrc(product.image_url)}
              alt={product.name}
              loading="lazy"
              onError={handleImgError}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            {unavailable && (
              <span
                data-testid={`product-unavailable-badge-${product.id}`}
                className="absolute left-3 top-3 rounded-full bg-charcoal/80 px-3 py-1 text-xs font-medium text-ivory backdrop-blur-sm"
              >
                Currently unavailable
              </span>
            )}
            {product.is_featured && !unavailable && (
              <span className="absolute left-3 top-3 rounded-full bg-blush/90 px-3 py-1 text-xs font-medium text-charcoal">
                Featured
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-1 flex-col pt-4">
          <div className="flex items-start justify-between gap-3">
            <Link to={`/product/${product.id}`} className="min-w-0">
              <h3 className="truncate font-sans text-base font-semibold text-charcoal transition-colors group-hover:text-terracotta">
                {product.name}
              </h3>
            </Link>
            <span className="shrink-0 font-serif text-lg font-medium text-charcoal">{inr(product.price)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-taupe">{product.description}</p>
          <button
            onClick={() => {
              addToCart(product, 1);
              setCartOpen(true);
            }}
            disabled={unavailable}
            data-testid={`add-to-cart-${product.id}`}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-medium text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:border-terracotta hover:bg-terracotta hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-charcoal/15 disabled:hover:bg-white disabled:hover:text-charcoal"
          >
            <ShoppingBag className="h-4 w-4" />
            {unavailable ? "Unavailable" : "Add to basket"}
          </button>
        </div>
      </div>
    </FadeUp>
  );
};

export { handleImgError };
