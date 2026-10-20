import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "../context/ShopContext";
import { inr } from "../lib/api";
import { FadeUp, FlowerMark } from "../components/Reveal";

const INSTAGRAM_URL = "https://www.instagram.com/bless_to_art/";

const OrderSummaryPage = () => {
  const { cartItems, subtotal, orderRef, ensureOrderRef } = useShop();
  const [copyState, setCopyState] = useState("idle");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (cartItems.length > 0) ensureOrderRef();
  }, [cartItems.length, ensureOrderRef]);

  const message = useMemo(() => {
    const lines = cartItems
      .map(
        ({ product, qty }, i) =>
          `${i + 1}. ${product.name}\n   Quantity: ${qty}\n   Unit price: ${inr(
            product.price
          )}\n   Line total: ${inr(qty * product.price)}`
      )
      .join("\n\n");
    return `Hi Bless to Art! I'd like to enquire about placing an order.

Order reference: ${orderRef}

My selected items:

${lines}

Estimated subtotal: ${inr(subtotal)}

Please confirm product availability, delivery charges, and the final order total.

Thank you!`;
  }, [cartItems, subtotal, orderRef]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("copied");
      toast.success("Order message copied — paste it into the Instagram chat.");
    } catch {
      try {
        const ta = textareaRef.current;
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        setCopyState(ok ? "copied" : "failed");
        if (ok) toast.success("Order message copied — paste it into the Instagram chat.");
        else toast.error("Could not copy automatically — please select the text and copy it manually.");
      } catch {
        setCopyState("failed");
        toast.error("Could not copy automatically — please select the text and copy it manually.");
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 pb-24 pt-40 text-center" data-testid="order-summary-empty">
        <FlowerMark className="h-14 w-14 opacity-60" />
        <p className="font-serif text-3xl text-charcoal">Your basket is empty.</p>
        <p className="text-sm text-taupe">Add a few pieces before preparing your order enquiry.</p>
        <Link
          to="/shop"
          data-testid="order-summary-start-exploring"
          className="rounded-full bg-terracotta px-7 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark"
        >
          Start exploring
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-8" data-testid="order-summary-page">
      <FadeUp>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">Order enquiry</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-charcoal sm:text-5xl">
          Your order summary.
        </h1>
        <p className="mt-3 text-sm text-taupe">
          Draft reference:{" "}
          <span className="font-mono font-semibold text-charcoal" data-testid="order-reference">
            {orderRef}
          </span>
        </p>
      </FadeUp>

      <FadeUp delay={0.1} className="mt-10 rounded-3xl border border-sand bg-white p-6 sm:p-8">
        <h2 className="font-serif text-xl text-charcoal">Selected items</h2>
        <div className="mt-4 divide-y divide-sand/70">
          {cartItems.map(({ product, qty }) => (
            <div key={product.id} className="flex items-center justify-between gap-4 py-3" data-testid={`summary-item-${product.id}`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-charcoal">{product.name}</p>
                <p className="text-xs text-taupe">
                  {qty} × {inr(product.price)}
                </p>
              </div>
              <span className="shrink-0 font-serif text-base font-medium text-charcoal">
                {inr(qty * product.price)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-sand pt-4">
          <span className="text-sm text-taupe">Estimated subtotal</span>
          <span className="font-serif text-2xl font-medium text-charcoal" data-testid="summary-subtotal">
            {inr(subtotal)}
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-taupe">
          Delivery charges are not included. This is an order enquiry, not a confirmed purchase —
          final availability and pricing are confirmed by the seller on Instagram.
        </p>
      </FadeUp>

      <FadeUp delay={0.18} className="mt-8 rounded-3xl border border-sand bg-cream/50 p-6 sm:p-8">
        <h2 className="font-serif text-xl text-charcoal">Your message, ready to send</h2>
        <p className="mt-2 text-sm text-taupe">
          Copy this message, open our Instagram, and paste it into the chat. We'll reply personally
          to confirm availability, delivery charges and the final total.
        </p>
        <textarea
          ref={textareaRef}
          readOnly
          value={message}
          aria-label="Order enquiry message"
          data-testid="order-message-textarea"
          onFocus={(e) => e.target.select()}
          className="mt-5 h-64 w-full resize-none rounded-2xl border border-sand bg-white p-5 font-mono text-xs leading-relaxed text-charcoal focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
        />
        {copyState === "failed" && (
          <p className="mt-3 text-xs font-medium text-destructive" data-testid="copy-failed-note">
            Automatic copy didn't work in this browser. Tap the message above, select all, and copy
            it manually.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={copyMessage}
            data-testid="copy-order-message-button"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
              copyState === "copied"
                ? "bg-charcoal text-ivory"
                : "bg-terracotta text-ivory hover:bg-terracotta-dark"
            }`}
          >
            {copyState === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copyState === "copied" ? "Copied to clipboard" : "Copy order message"}
          </button>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="open-instagram-button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-charcoal/20 px-7 py-3.5 text-sm font-semibold text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:border-terracotta hover:text-terracotta"
          >
            <Instagram className="h-4 w-4" /> Open Instagram
          </a>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-taupe">
          Opening Instagram takes you to @bless_to_art in a new tab — the message is not sent
          automatically. Paste the copied text into the chat and send it yourself to complete your
          enquiry.
        </p>
      </FadeUp>
    </div>
  );
};

export default OrderSummaryPage;
