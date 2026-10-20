import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { useShop } from "../context/ShopContext";
import { imgSrc, inr } from "../lib/api";
import { FlowerMark } from "./Reveal";

export const CartDrawer = () => {
  const { cartOpen, setCartOpen, cartItems, setQty, removeFromCart, clearCart, subtotal, cartCount } = useShop();
  const navigate = useNavigate();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col bg-ivory p-0 sm:max-w-md" data-testid="cart-drawer">
        <div className="border-b border-sand px-6 py-5">
          <SheetTitle className="font-serif text-2xl text-charcoal">
            Your basket {cartCount > 0 && <span className="text-base text-taupe">({cartCount})</span>}
          </SheetTitle>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center" data-testid="cart-empty-state">
            <FlowerMark className="h-14 w-14 opacity-60" />
            <p className="font-serif text-2xl text-charcoal">Your basket is empty.</p>
            <p className="text-sm leading-relaxed text-taupe">
              Browse the collection and gather a few little things made with love.
            </p>
            <button
              onClick={() => {
                setCartOpen(false);
                navigate("/shop");
              }}
              data-testid="cart-start-exploring-button"
              className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta-dark"
            >
              Start exploring
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence initial={false}>
                {cartItems.map(({ product, qty }) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-4 border-b border-sand/70 py-4"
                    data-testid={`cart-item-${product.id}`}
                  >
                    <img
                      src={imgSrc(product.image_url)}
                      alt={product.name}
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
                      }}
                      className="h-20 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-charcoal">{product.name}</p>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          data-testid={`cart-remove-${product.id}`}
                          aria-label={`Remove ${product.name} from basket`}
                          className="text-taupe transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-taupe">{inr(product.price)} each</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-full border border-sand px-2 py-1">
                          <button
                            onClick={() => (qty <= 1 ? removeFromCart(product.id) : setQty(product, qty - 1))}
                            data-testid={`cart-decrease-${product.id}`}
                            aria-label={`Decrease quantity of ${product.name}`}
                            className="p-1 text-charcoal transition-colors hover:text-terracotta"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-4 text-center text-sm font-medium" data-testid={`cart-qty-${product.id}`}>
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(product, qty + 1)}
                            data-testid={`cart-increase-${product.id}`}
                            aria-label={`Increase quantity of ${product.name}`}
                            disabled={product.stock_quantity != null && qty >= product.stock_quantity}
                            className="p-1 text-charcoal transition-colors hover:text-terracotta disabled:opacity-30"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-serif text-base font-medium text-charcoal">
                          {inr(qty * product.price)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                onClick={clearCart}
                data-testid="cart-clear-button"
                className="mt-4 text-xs font-medium text-taupe underline underline-offset-4 transition-colors hover:text-destructive"
              >
                Clear basket
              </button>
            </div>

            <div className="border-t border-sand bg-cream/50 px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-taupe">Subtotal</span>
                <span className="font-serif text-2xl font-medium text-charcoal" data-testid="cart-subtotal">
                  {inr(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-taupe">Delivery charges are not included.</p>
              <button
                onClick={() => {
                  setCartOpen(false);
                  navigate("/order-summary");
                }}
                data-testid="cart-review-order-button"
                className="mt-4 w-full rounded-full bg-terracotta py-3.5 text-sm font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta-dark"
              >
                Review order enquiry
              </button>
              <button
                onClick={() => setCartOpen(false)}
                data-testid="cart-continue-shopping-button"
                className="mt-2 w-full rounded-full py-3 text-sm font-medium text-charcoal transition-colors hover:bg-cream"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
