import { useState } from 'react';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { formatPrice } from '@/lib/utils';
import { StockBadge } from '@/components/products/StockBadge';
import { useStore } from '@/store';

function InlineStockEditor({ productId, quantity, onUpdate }: { productId: string; quantity: number; onUpdate: (id: string, qty: number) => Promise<{ success: boolean; error?: string }> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(quantity);
  const [saving, setSaving] = useState(false);
  const addNotification = useStore((s) => s.addNotification);

  const handleSave = async (newQty: number) => {
    if (newQty < 0) return;
    setSaving(true);
    const result = await onUpdate(productId, newQty);
    setSaving(false);
    if (result.success) {
      addNotification({ type: 'success', title: 'Stock updated' });
      setEditing(false);
    } else {
      addNotification({ type: 'error', title: 'Failed to update stock', message: result.error });
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => { const n = Math.max(0, value - 1); setValue(n); handleSave(n); }}
          disabled={saving || value === 0}
          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-sm disabled:opacity-40 transition-colors"
        >−</button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          onBlur={() => handleSave(value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(value); if (e.key === 'Escape') setEditing(false); }}
          className="w-14 text-center border border-slate-300 rounded text-sm py-0.5 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
          autoFocus
        />
        <button
          onClick={() => { const n = value + 1; setValue(n); handleSave(n); }}
          disabled={saving}
          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-sm transition-colors"
        >+</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(quantity); setEditing(true); }}
      className="group flex items-center gap-1.5"
      title="Click to edit stock"
    >
      <StockBadge quantity={quantity} size="sm" />
      <svg className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}

export function AdminProducts() {
  const { products, isLoading, toggleProductStatus, deleteProduct, updateStock } = useAdminProducts();
  const addNotification = useStore((s) => s.addNotification);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      product.name_ar.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? product.is_active :
      !product.is_active;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteProduct(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (result.success) {
      addNotification({ type: 'success', title: 'Product deleted' });
    } else {
      addNotification({ type: 'error', title: 'Failed to delete product', message: result.error });
    }
  };

  const handleToggle = async (id: string, newStatus: boolean) => {
    await toggleProductStatus(id, newStatus);
    addNotification({ type: 'success', title: `Product ${newStatus ? 'activated' : 'deactivated'}` });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading products...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} total products</p>
        </div>
        <Link to="/admin/products/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-700 w-16">Image</th>
                <th className="p-4 font-semibold text-slate-700">Name</th>
                <th className="p-4 font-semibold text-slate-700">Category</th>
                <th className="p-4 font-semibold text-slate-700">Stock</th>
                <th className="p-4 font-semibold text-slate-700">Retail</th>
                <th className="p-4 font-semibold text-slate-700">Wholesale</th>
                <th className="p-4 font-semibold text-slate-700">Status</th>
                <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{product.name_fr}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{product.name_ar}</div>
                    {product.sku && <div className="text-xs text-slate-400 font-mono mt-0.5">{product.sku}</div>}
                  </td>
                  <td className="p-4 text-slate-600">{product.category?.name_fr || <span className="text-slate-400 italic text-xs">No category</span>}</td>
                  <td className="p-4">
                    <InlineStockEditor
                      productId={product.id}
                      quantity={product.quantity}
                      onUpdate={updateStock}
                    />
                  </td>
                  <td className="p-4 font-medium text-slate-900">{formatPrice(product.price, 'fr')}</td>
                  <td className="p-4 text-green-700 font-medium">
                    {product.wholesale_price ? formatPrice(product.wholesale_price, 'fr') : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(product.id, !product.is_active)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${product.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </Link>
                      {confirmDeleteId === product.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === product.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(product.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {search ? 'No products match your search.' : 'No products yet.'}
                    {!search && (
                      <div className="mt-3">
                        <Link to="/admin/products/new">
                          <Button size="sm">Add your first product</Button>
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}