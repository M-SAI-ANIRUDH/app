import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useShop } from "../context/ShopContext";
import { ProductCard } from "../components/ProductCard";
import { FadeUp } from "../components/Reveal";

const ShopPage = () => {
  const { sections, products, loading } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const activeSection = searchParams.get("section") || "all";

  const visible = useMemo(() => {
    const activeIds = new Set(sections.map((s) => s.id));
    let list = products.filter((p) => activeIds.has(p.section_id));
    if (activeSection !== "all") list = list.filter((p) => p.section_id === activeSection);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.display_order - b.display_order);
    return sorted;
  }, [products, sections, activeSection, search, sort]);

  const chip = (id, label, testid) => (
    <button
      key={id}
      onClick={() => setSearchParams(id === "all" ? {} : { section: id })}
      data-testid={testid}
      aria-pressed={activeSection === id}
      className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
        activeSection === id
          ? "bg-terracotta text-ivory shadow-[0_8px_20px_-8px_rgba(184,116,91,0.6)]"
          : "border border-sand bg-white text-taupe hover:border-terracotta hover:text-terracotta"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-8 lg:px-16" data-testid="shop-page">
      <FadeUp>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-terracotta">The shop</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-charcoal sm:text-5xl">
          Shop the collection.
        </h1>
      </FadeUp>

      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candles, keychains, prints…"
            aria-label="Search products"
            data-testid="shop-search-input"
            className="w-full rounded-full border border-sand bg-white py-3 pl-11 pr-4 text-sm text-charcoal placeholder:text-taupe/70 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full rounded-full border-sand bg-white lg:w-56" data-testid="shop-sort-select" aria-label="Sort products">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured" data-testid="sort-featured">Featured first</SelectItem>
            <SelectItem value="price-asc" data-testid="sort-price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc" data-testid="sort-price-desc">Price: high to low</SelectItem>
            <SelectItem value="name" data-testid="sort-name">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="scrollbar-none -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" data-testid="shop-section-chips">
        <div className="flex gap-2.5 pb-1">
          {chip("all", "All Products", "shop-chip-all")}
          {sections.map((s) => chip(s.id, s.name, `shop-chip-${s.id}`))}
        </div>
      </div>

      {loading ? (
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-cream" />
              <div className="mt-4 h-4 w-2/3 rounded bg-cream" />
              <div className="mt-2 h-3 w-1/3 rounded bg-cream" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-4 text-center" data-testid="shop-empty-state">
          <p className="font-serif text-2xl text-charcoal">Nothing found here yet.</p>
          <p className="max-w-sm text-sm text-taupe">
            Try a different search or collection — new handmade pieces are added often.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSearchParams({});
            }}
            data-testid="shop-clear-filters-button"
            className="rounded-full border border-terracotta px-6 py-2.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-ivory"
          >
            Clear search & filters
          </button>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="shop-product-grid">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopPage;
