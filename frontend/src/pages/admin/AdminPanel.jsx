import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink, ImagePlus, LogOut, Pencil, Plus, Search, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { api, formatApiError, imgSrc, inr } from "../../lib/api";
import { FlowerMark } from "../../components/Reveal";

const emptySectionForm = { name: "", description: "", display_order: 0, is_active: true };
const emptyProductForm = {
  name: "", description: "", price: "", section_id: "", image_url: "",
  is_available: true, stock_quantity: "", is_featured: false, display_order: 0,
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold uppercase tracking-wider text-taupe">{label}</label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const inputCls =
  "w-full rounded-xl border border-sand bg-ivory px-4 py-2.5 text-sm text-charcoal focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20";

const AdminPanel = ({ onLogout }) => {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState("all");

  const [sectionDialog, setSectionDialog] = useState(null); // {mode:'add'|'edit', form, id}
  const [productDialog, setProductDialog] = useState(null); // {mode, form, id}
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleteSection, setDeleteSection] = useState(null); // {section, mode, targetId}
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [contentDialog, setContentDialog] = useState(null);

  const openContent = async () => {
    try {
      const { data } = await api.get("/content");
      setContentDialog(data);
    } catch (e) {
      toast.error("Could not load story copy.");
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      await api.put("/admin/content", {
        story_heading: contentDialog.story_heading,
        story_p1: contentDialog.story_p1,
        story_p2: contentDialog.story_p2,
        about_heading: contentDialog.about_heading,
        about_p1: contentDialog.about_p1,
        about_p2: contentDialog.about_p2,
      });
      toast.success("Story copy updated — it now shows on the homepage.");
      setContentDialog(null);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const refresh = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.get("/admin/sections"), api.get("/products")]);
      setSections(s.data);
      setProducts(p.data);
      setSelectedId((prev) => (prev && s.data.some((x) => x.id === prev) ? prev : s.data[0]?.id || null));
    } catch (e) {
      toast.error(formatApiError(e, "Could not load admin data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedSection = sections.find((s) => s.id === selectedId) || null;

  const sectionProducts = useMemo(() => {
    let list = products.filter((p) => p.section_id === selectedId);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
    if (availFilter === "available") list = list.filter((p) => p.is_available);
    if (availFilter === "unavailable") list = list.filter((p) => !p.is_available);
    return list;
  }, [products, selectedId, search, availFilter]);

  const logout = async () => {
    try {
      await api.post("/admin/logout");
    } catch {}
    sessionStorage.removeItem("bta_admin_token");
    onLogout();
  };

  // ---- Section CRUD ----
  const saveSection = async () => {
    const { mode, form, id } = sectionDialog;
    if (!form.name.trim()) {
      toast.error("Section name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), display_order: Number(form.display_order) || 0 };
      if (mode === "add") await api.post("/sections", payload);
      else await api.put(`/sections/${id}`, payload);
      toast.success(mode === "add" ? `Section “${payload.name}” created.` : "Section updated.");
      setSectionDialog(null);
      await refresh();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteSection = async () => {
    const { section, mode, targetId } = deleteSection;
    setSaving(true);
    try {
      const params = {};
      if (section.product_count > 0) {
        params.mode = mode;
        if (mode === "move") params.target_section_id = targetId;
      }
      await api.delete(`/sections/${section.id}`, { params });
      toast.success(`Section “${section.name}” deleted.`);
      setDeleteSection(null);
      await refresh();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ---- Product CRUD ----
  const saveProduct = async () => {
    const { mode, form, id } = productDialog;
    if (!form.name.trim()) return toast.error("Product name is required.");
    if (form.price === "" || Number(form.price) < 0) return toast.error("Enter a valid price (₹0 or more).");
    if (!form.section_id) return toast.error("Choose a section for this product.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        price: Number(form.price),
        stock_quantity: form.stock_quantity === "" ? null : Math.max(0, Math.floor(Number(form.stock_quantity))),
        display_order: Number(form.display_order) || 0,
      };
      if (mode === "add") await api.post("/products", payload);
      else await api.put(`/products/${id}`, payload);
      toast.success(mode === "add" ? `“${payload.name}” added to the collection.` : "Product updated.");
      setProductDialog(null);
      await refresh();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = async () => {
    setSaving(true);
    try {
      await api.delete(`/products/${deleteProduct.id}`);
      toast.success(`“${deleteProduct.name}” removed.`);
      setDeleteProduct(null);
      await refresh();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProductDialog((prev) => ({ ...prev, form: { ...prev.form, image_url: data.url } }));
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(formatApiError(e, "Upload failed — the image was not saved. Please try again."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const otherSections = deleteSection ? sections.filter((s) => s.id !== deleteSection.section.id) : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="text-sm text-taupe">Loading your studio…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory" data-testid="admin-dashboard">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-sand bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <FlowerMark className="h-9 w-9" />
            <span className="font-serif text-xl font-medium text-charcoal">bless to art.</span>
            <span className="rounded-full bg-blush/60 px-3 py-1 text-xs font-medium text-charcoal">Studio admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              data-testid="admin-view-store-link"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-taupe transition-colors hover:text-terracotta"
            >
              <ExternalLink className="h-4 w-4" /> View store
            </Link>
            <button
              onClick={openContent}
              data-testid="admin-edit-story-button"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-taupe transition-colors hover:text-terracotta"
            >
              <Pencil className="h-4 w-4" /> Story copy
            </button>
            <button
              onClick={logout}
              data-testid="admin-logout-button"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-taupe transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 sm:px-8 lg:grid-cols-12">
        {/* Sections panel */}
        <aside className="lg:col-span-3">
          <div className="rounded-3xl border border-sand bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-charcoal">Collections</h2>
              <span className="text-xs text-taupe">{sections.length}</span>
            </div>

            {/* Mobile selector */}
            <div className="mt-4 lg:hidden">
              <Select value={selectedId || ""} onValueChange={setSelectedId}>
                <SelectTrigger className="rounded-xl border-sand bg-ivory" data-testid="admin-section-select-mobile" aria-label="Select collection">
                  <SelectValue placeholder="Choose a collection" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.product_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop list */}
            <ul className="mt-4 hidden space-y-1.5 lg:block" data-testid="admin-section-list">
              {sections.map((s) => (
                <li key={s.id}>
                  <div
                    className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                      selectedId === s.id ? "bg-terracotta/10 ring-1 ring-terracotta/40" : "hover:bg-cream"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(s.id)}
                      data-testid={`admin-section-${s.id}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                    >
                      <span className={`truncate text-sm font-medium ${selectedId === s.id ? "text-terracotta" : "text-charcoal"}`}>
                        {s.name}
                        {!s.is_active && <span className="ml-2 text-[10px] uppercase tracking-wide text-taupe">hidden</span>}
                      </span>
                      <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-[11px] text-taupe">
                        {s.product_count}
                      </span>
                    </button>
                    <button
                      onClick={() => setSectionDialog({ mode: "edit", id: s.id, form: { name: s.name, description: s.description, display_order: s.display_order, is_active: s.is_active } })}
                      data-testid={`admin-section-edit-${s.id}`}
                      aria-label={`Edit section ${s.name}`}
                      className="rounded-lg p-1.5 text-taupe opacity-0 transition-opacity hover:text-terracotta group-hover:opacity-100 focus:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteSection({ section: s, mode: "move", targetId: "" })}
                      data-testid={`admin-section-delete-${s.id}`}
                      aria-label={`Delete section ${s.name}`}
                      className="rounded-lg p-1.5 text-taupe opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setSectionDialog({ mode: "add", form: { ...emptySectionForm } })}
              data-testid="admin-add-section-button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-terracotta/50 py-2.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-ivory"
            >
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </div>
        </aside>

        {/* Products panel */}
        <main className="lg:col-span-9">
          {selectedSection ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl tracking-tight text-charcoal" data-testid="admin-section-title">
                    {selectedSection.name}
                  </h1>
                  <p className="mt-1 text-sm text-taupe">
                    {selectedSection.product_count} {selectedSection.product_count === 1 ? "product" : "products"}
                    {selectedSection.description ? ` · ${selectedSection.description}` : ""}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setProductDialog({
                      mode: "add",
                      form: { ...emptyProductForm, section_id: selectedId },
                    })
                  }
                  data-testid="admin-add-product-button"
                  className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta-dark"
                >
                  <Plus className="h-4 w-4" /> Add Product
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products in this collection…"
                    aria-label="Search products"
                    data-testid="admin-product-search"
                    className={`${inputCls} rounded-full pl-11`}
                  />
                </div>
                <Select value={availFilter} onValueChange={setAvailFilter}>
                  <SelectTrigger className="w-full rounded-full border-sand bg-white sm:w-48" data-testid="admin-availability-filter" aria-label="Filter by availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sectionProducts.length === 0 ? (
                <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-sand bg-white/60 px-8 py-16 text-center" data-testid="admin-products-empty">
                  <FlowerMark className="h-12 w-12 opacity-50" />
                  <p className="font-serif text-xl text-charcoal">
                    {search || availFilter !== "all" ? "No products match these filters." : "This collection is empty."}
                  </p>
                  {!search && availFilter === "all" && (
                    <button
                      onClick={() =>
                        setProductDialog({ mode: "add", form: { ...emptyProductForm, section_id: selectedId } })
                      }
                      data-testid="admin-add-first-product-button"
                      className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark"
                    >
                      Add your first product
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" data-testid="admin-product-grid">
                  {sectionProducts.map((p) => (
                    <div key={p.id} className="group overflow-hidden rounded-2xl border border-sand bg-white" data-testid={`admin-product-card-${p.id}`}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                        <img
                          src={imgSrc(p.image_url)}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
                          }}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            onClick={() =>
                              setProductDialog({
                                mode: "edit",
                                id: p.id,
                                form: {
                                  name: p.name, description: p.description, price: String(p.price),
                                  section_id: p.section_id, image_url: p.image_url,
                                  is_available: p.is_available,
                                  stock_quantity: p.stock_quantity == null ? "" : String(p.stock_quantity),
                                  is_featured: p.is_featured, display_order: p.display_order,
                                },
                              })
                            }
                            data-testid={`admin-product-edit-${p.id}`}
                            aria-label={`Edit ${p.name}`}
                            className="rounded-full bg-white/95 p-2 text-charcoal shadow-sm transition-colors hover:text-terracotta"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteProduct(p)}
                            data-testid={`admin-product-delete-${p.id}`}
                            aria-label={`Delete ${p.name}`}
                            className="rounded-full bg-white/95 p-2 text-charcoal shadow-sm transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-charcoal">{p.name}</h3>
                          <span className="shrink-0 font-serif text-base text-charcoal">{inr(p.price)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-taupe">{p.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${p.is_available ? "bg-blush/60 text-charcoal" : "bg-charcoal/80 text-ivory"}`}>
                            {p.is_available ? "Available" : "Unavailable"}
                          </span>
                          {p.is_featured && (
                            <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-taupe">Featured</span>
                          )}
                          {p.stock_quantity != null && (
                            <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-taupe">
                              Stock: {p.stock_quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-sand bg-white/60 px-8 py-24 text-center" data-testid="admin-no-sections">
              <FlowerMark className="h-12 w-12 opacity-50" />
              <p className="font-serif text-2xl text-charcoal">Create your first collection.</p>
              <p className="max-w-sm text-sm text-taupe">
                Collections group your products — for example “Candles” or “Keychains”. They appear
                on the storefront automatically.
              </p>
              <button
                onClick={() => setSectionDialog({ mode: "add", form: { ...emptySectionForm } })}
                data-testid="admin-add-section-empty-button"
                className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark"
              >
                Add Section
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Section dialog */}
      <Dialog open={!!sectionDialog} onOpenChange={(o) => !o && setSectionDialog(null)}>
        <DialogContent className="bg-ivory sm:max-w-md" data-testid="admin-section-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-charcoal">
              {sectionDialog?.mode === "add" ? "Add a collection" : "Edit collection"}
            </DialogTitle>
          </DialogHeader>
          {sectionDialog && (
            <div className="space-y-4">
              <Field label="Name *">
                <input
                  value={sectionDialog.form.name}
                  onChange={(e) => setSectionDialog((p) => ({ ...p, form: { ...p.form, name: e.target.value } }))}
                  data-testid="section-form-name"
                  className={inputCls}
                  placeholder="e.g. Candles"
                  aria-label="Section name"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={sectionDialog.form.description}
                  onChange={(e) => setSectionDialog((p) => ({ ...p, form: { ...p.form, description: e.target.value } }))}
                  data-testid="section-form-description"
                  className={`${inputCls} h-20 resize-none`}
                  placeholder="A short line about this collection"
                  aria-label="Section description"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Display order">
                  <input
                    type="number"
                    value={sectionDialog.form.display_order}
                    onChange={(e) => setSectionDialog((p) => ({ ...p, form: { ...p.form, display_order: e.target.value } }))}
                    data-testid="section-form-order"
                    className={inputCls}
                    aria-label="Display order"
                  />
                </Field>
                <Field label="Visible in store">
                  <div className="flex h-10 items-center gap-3">
                    <Switch
                      checked={sectionDialog.form.is_active}
                      onCheckedChange={(v) => setSectionDialog((p) => ({ ...p, form: { ...p.form, is_active: v } }))}
                      data-testid="section-form-active"
                      aria-label="Section visible in store"
                    />
                    <span className="text-sm text-taupe">{sectionDialog.form.is_active ? "Visible" : "Hidden"}</span>
                  </div>
                </Field>
              </div>
              <button
                onClick={saveSection}
                disabled={saving}
                data-testid="section-form-save"
                className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : sectionDialog.mode === "add" ? "Create collection" : "Save changes"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product dialog */}
      <Dialog open={!!productDialog} onOpenChange={(o) => !o && setProductDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-ivory sm:max-w-lg" data-testid="admin-product-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-charcoal">
              {productDialog?.mode === "add" ? "Add a product" : "Edit product"}
            </DialogTitle>
          </DialogHeader>
          {productDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name *">
                  <input
                    value={productDialog.form.name}
                    onChange={(e) => setProductDialog((p) => ({ ...p, form: { ...p.form, name: e.target.value } }))}
                    data-testid="product-form-name"
                    className={inputCls}
                    placeholder="e.g. Vanilla Glow Candle"
                    aria-label="Product name"
                  />
                </Field>
                <Field label="Price (₹) *">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productDialog.form.price}
                    onChange={(e) => setProductDialog((p) => ({ ...p, form: { ...p.form, price: e.target.value } }))}
                    data-testid="product-form-price"
                    className={inputCls}
                    placeholder="499"
                    aria-label="Product price in rupees"
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={productDialog.form.description}
                  onChange={(e) => setProductDialog((p) => ({ ...p, form: { ...p.form, description: e.target.value } }))}
                  data-testid="product-form-description"
                  className={`${inputCls} h-20 resize-none`}
                  placeholder="A short, warm description"
                  aria-label="Product description"
                />
              </Field>
              <Field label="Collection *">
                <Select
                  value={productDialog.form.section_id}
                  onValueChange={(v) => setProductDialog((p) => ({ ...p, form: { ...p.form, section_id: v } }))}
                >
                  <SelectTrigger className="rounded-xl border-sand bg-ivory" data-testid="product-form-section" aria-label="Product collection">
                    <SelectValue placeholder="Choose a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id} data-testid={`product-form-section-${s.id}`}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Product image">
                <div className="rounded-2xl border border-dashed border-sand bg-white p-4">
                  {productDialog.form.image_url ? (
                    <div className="flex items-start gap-4">
                      <img
                        src={imgSrc(productDialog.form.image_url)}
                        alt="Product preview"
                        data-testid="product-form-image-preview"
                        onError={(e) => {
                          if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
                        }}
                        className="h-24 w-20 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-taupe">Current image</p>
                        <button
                          onClick={() => fileRef.current?.click()}
                          data-testid="product-form-replace-image"
                          className="mt-2 text-xs font-medium text-terracotta underline underline-offset-4"
                        >
                          Replace image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      data-testid="product-form-upload-button"
                      className="flex w-full flex-col items-center gap-2 rounded-xl py-6 text-taupe transition-colors hover:text-terracotta"
                    >
                      <ImagePlus className="h-7 w-7" />
                      <span className="text-sm">{uploading ? "Uploading…" : "Upload a photo from your device"}</span>
                      <span className="text-[11px]">JPG, PNG or WebP · up to 8 MB</span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="product-form-file-input"
                    onChange={(e) => uploadImage(e.target.files?.[0])}
                  />
                  <div className="mt-3 border-t border-sand/70 pt-3">
                    <input
                      value={productDialog.form.image_url}
                      onChange={(e) => setProductDialog((p) => ({ ...p, form: { ...p.form, image_url: e.target.value } }))}
                      data-testid="product-form-image-url"
                      className={inputCls}
                      placeholder="…or paste an image URL"
                      aria-label="Product image URL"
                    />
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock (optional)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productDialog.form.stock_quantity}
                    onChange={(e) => setProductDialog((p) => ({ ...p, form: { ...p.form, stock_quantity: e.target.value } }))}
                    data-testid="product-form-stock"
                    className={inputCls}
                    placeholder="Leave blank if untracked"
                    aria-label="Stock quantity"
                  />
                </Field>
                <Field label="Display order">
                  <input
                    type="number"
                    value={productDialog.form.display_order}
                    onChange={(e) => setProductDialog((p) => ({ ...p, form: { ...p.form, display_order: e.target.value } }))}
                    data-testid="product-form-order"
                    className={inputCls}
                    aria-label="Display order"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={productDialog.form.is_available}
                    onCheckedChange={(v) => setProductDialog((p) => ({ ...p, form: { ...p.form, is_available: v } }))}
                    data-testid="product-form-available"
                    aria-label="Product available"
                  />
                  <span className="text-sm text-charcoal">Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={productDialog.form.is_featured}
                    onCheckedChange={(v) => setProductDialog((p) => ({ ...p, form: { ...p.form, is_featured: v } }))}
                    data-testid="product-form-featured"
                    aria-label="Featured product"
                  />
                  <span className="text-sm text-charcoal">Featured</span>
                </div>
              </div>
              <button
                onClick={saveProduct}
                disabled={saving || uploading}
                data-testid="product-form-save"
                className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : productDialog.mode === "add" ? "Add product" : "Save changes"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Story copy dialog */}
      <Dialog open={!!contentDialog} onOpenChange={(o) => !o && setContentDialog(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto bg-ivory sm:max-w-lg" data-testid="admin-story-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-charcoal">Store story copy</DialogTitle>
          </DialogHeader>
          {contentDialog && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-taupe">
                The first group appears in the “Our story” section on the homepage; the second group
                is the About page. Changes appear in the store as soon as you save.
              </p>
              <Field label="Heading">
                <input
                  value={contentDialog.story_heading}
                  onChange={(e) => setContentDialog((p) => ({ ...p, story_heading: e.target.value }))}
                  data-testid="story-form-heading"
                  className={inputCls}
                  aria-label="Story heading"
                />
              </Field>
              <Field label="Paragraph 1">
                <textarea
                  value={contentDialog.story_p1}
                  onChange={(e) => setContentDialog((p) => ({ ...p, story_p1: e.target.value }))}
                  data-testid="story-form-p1"
                  className={`${inputCls} h-24 resize-none`}
                  aria-label="Story paragraph one"
                />
              </Field>
              <Field label="Paragraph 2">
                <textarea
                  value={contentDialog.story_p2}
                  onChange={(e) => setContentDialog((p) => ({ ...p, story_p2: e.target.value }))}
                  data-testid="story-form-p2"
                  className={`${inputCls} h-24 resize-none`}
                  aria-label="Story paragraph two"
                />
              </Field>
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                About page
              </p>
              <Field label="About heading">
                <input
                  value={contentDialog.about_heading || ""}
                  onChange={(e) => setContentDialog((p) => ({ ...p, about_heading: e.target.value }))}
                  data-testid="story-form-about-heading"
                  className={inputCls}
                  aria-label="About page heading"
                />
              </Field>
              <Field label="About paragraph 1">
                <textarea
                  value={contentDialog.about_p1 || ""}
                  onChange={(e) => setContentDialog((p) => ({ ...p, about_p1: e.target.value }))}
                  data-testid="story-form-about-p1"
                  className={`${inputCls} h-24 resize-none`}
                  aria-label="About page paragraph one"
                />
              </Field>
              <Field label="About paragraph 2">
                <textarea
                  value={contentDialog.about_p2 || ""}
                  onChange={(e) => setContentDialog((p) => ({ ...p, about_p2: e.target.value }))}
                  data-testid="story-form-about-p2"
                  className={`${inputCls} h-24 resize-none`}
                  aria-label="About page paragraph two"
                />
              </Field>
              <button
                onClick={saveContent}
                disabled={saving}
                data-testid="story-form-save"
                className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-ivory transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save story copy"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete product dialog */}
      <Dialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <DialogContent className="bg-ivory sm:max-w-sm" data-testid="admin-delete-product-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-charcoal">Remove this product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-taupe">
            “{deleteProduct?.name}” will be permanently removed from the storefront and admin. If a
            customer already has it in their basket, it will quietly disappear from there too.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setDeleteProduct(null)}
              data-testid="delete-product-cancel"
              className="flex-1 rounded-full border border-sand py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-cream"
            >
              Keep it
            </button>
            <button
              onClick={confirmDeleteProduct}
              disabled={saving}
              data-testid="delete-product-confirm"
              className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Removing…" : "Yes, remove"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete section dialog */}
      <Dialog open={!!deleteSection} onOpenChange={(o) => !o && setDeleteSection(null)}>
        <DialogContent className="bg-ivory sm:max-w-md" data-testid="admin-delete-section-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-charcoal">Delete “{deleteSection?.section.name}”?</DialogTitle>
          </DialogHeader>
          {deleteSection && deleteSection.section.product_count > 0 ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-taupe">
                This collection contains{" "}
                <strong className="text-charcoal">{deleteSection.section.product_count} product(s)</strong>.
                Choose what should happen to them before deleting:
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand bg-white p-4">
                <input
                  type="radio"
                  name="delete-section-mode"
                  checked={deleteSection.mode === "move"}
                  onChange={() => setDeleteSection((p) => ({ ...p, mode: "move" }))}
                  data-testid="delete-section-mode-move"
                  className="mt-1 accent-[#B8745B]"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-charcoal">Move products to another collection</span>
                  <Select
                    value={deleteSection.targetId}
                    onValueChange={(v) => setDeleteSection((p) => ({ ...p, targetId: v, mode: "move" }))}
                  >
                    <SelectTrigger className="mt-2 rounded-xl border-sand bg-ivory" data-testid="delete-section-target" aria-label="Destination collection">
                      <SelectValue placeholder="Choose destination…" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherSections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand bg-white p-4">
                <input
                  type="radio"
                  name="delete-section-mode"
                  checked={deleteSection.mode === "delete_products"}
                  onChange={() => setDeleteSection((p) => ({ ...p, mode: "delete_products" }))}
                  data-testid="delete-section-mode-delete"
                  className="mt-1 accent-[#B8745B]"
                />
                <span>
                  <span className="block text-sm font-semibold text-destructive">
                    Delete the collection and all {deleteSection.section.product_count} product(s)
                  </span>
                  <span className="mt-1 block text-xs text-taupe">
                    This cannot be undone. Products are removed from the storefront immediately.
                  </span>
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteSection(null)}
                  data-testid="delete-section-cancel"
                  className="flex-1 rounded-full border border-sand py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSection}
                  disabled={saving || (deleteSection.mode === "move" && !deleteSection.targetId)}
                  data-testid="delete-section-confirm"
                  className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-taupe">
                This collection is empty, so it can be removed safely. It will disappear from the
                storefront immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteSection(null)}
                  data-testid="delete-section-cancel"
                  className="flex-1 rounded-full border border-sand py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSection}
                  disabled={saving}
                  data-testid="delete-section-confirm"
                  className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
