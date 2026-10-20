import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, inr } from "../lib/api";

const ShopContext = createContext(null);

const loadCart = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("bta_cart"));
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
};

const newOrderRef = () => {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return "BTA-" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
};

export const ShopProvider = ({ children }) => {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderRef, setOrderRef] = useState(() => localStorage.getItem("bta_order_ref") || "");

  const refreshCatalogue = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.get("/sections"), api.get("/products")]);
      setSections(s.data);
      setProducts(p.data);
    } catch (e) {
      console.error("catalogue load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalogue();
  }, [refreshCatalogue]);

  useEffect(() => {
    localStorage.setItem("bta_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("bta_order_ref", orderRef);
  }, [orderRef]);

  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  // Drop cart lines whose product no longer exists (deleted in admin)
  useEffect(() => {
    if (loading) return;
    setCart((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => productMap[id]));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [productMap, loading]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: productMap[id], qty }))
        .filter((i) => i.product),
    [cart, productMap]
  );

  const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
  const subtotal = cartItems.reduce((a, i) => a + i.qty * i.product.price, 0);

  const ensureOrderRef = useCallback(() => {
    let ref = orderRef;
    if (!ref) {
      ref = newOrderRef();
      setOrderRef(ref);
    }
    return ref;
  }, [orderRef]);

  const addToCart = useCallback(
    (product, qty = 1) => {
      let added = false;
      let capped = false;
      setCart((prev) => {
        const current = prev[product.id] || 0;
        let nextQty = current + qty;
        if (product.stock_quantity != null && nextQty > product.stock_quantity) {
          nextQty = product.stock_quantity;
          capped = true;
        }
        if (nextQty <= current) return prev;
        added = true;
        return { ...prev, [product.id]: nextQty };
      });
      if (capped) {
        toast.info(`Only ${product.stock_quantity} of “${product.name}” available`);
      } else if (added) {
        toast.success(`Added “${product.name}” to your basket`);
      }
    },
    []
  );

  const setQty = useCallback((product, qty) => {
    setCart((prev) => {
      let next = Math.max(1, Math.floor(qty));
      if (product.stock_quantity != null) next = Math.min(next, product.stock_quantity);
      return { ...prev, [product.id]: next };
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setOrderRef(newOrderRef());
  }, []);

  const value = {
    sections,
    products,
    productMap,
    loading,
    refreshCatalogue,
    cart,
    cartItems,
    cartCount,
    subtotal,
    cartOpen,
    setCartOpen,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    orderRef,
    ensureOrderRef,
    inr,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);
