import { useEffect } from "react";
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "./components/ui/sonner";
import { ShopProvider, useShop } from "./context/ShopContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import OrderSummaryPage from "./pages/OrderSummaryPage";
import AboutPage from "./pages/AboutPage";
import AdminGate from "./pages/admin/AdminGate";

const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    const loop = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const StorefrontLayout = () => {
  const { refreshCatalogue } = useShop();
  // Refetch whenever the storefront mounts, so admin edits show up without a reload
  useEffect(() => {
    refreshCatalogue();
  }, [refreshCatalogue]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

const NotFound = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 pt-16 text-center" data-testid="not-found-page">
    <p className="font-serif text-5xl text-charcoal">Lost in the studio.</p>
    <p className="text-sm text-taupe">This page doesn't exist — but the collection does.</p>
    <Link
      to="/"
      data-testid="not-found-home-link"
      className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark"
    >
      Back home
    </Link>
  </div>
);

function App() {
  useSmoothScroll();

  return (
    <ShopProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/order-summary" element={<OrderSummaryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/admin" element={<AdminGate />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{ style: { background: "#392E28", color: "#FBF7F0", border: "none" } }} />
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;
