import { useState } from 'react';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { formatPrice } from '@/lib/utils';
import { StockBadge } from '@/components/products/StockBadge';

export function AdminProducts() {
  const { products, isLoading, toggleProductStatus } = useAdminProducts();
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(product => 
    product.name_fr.toLowerCase().includes(search.toLowerCase()) ||
    product.name_ar.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link to="/admin/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700 w-16">Image</th>
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Category</th>
              <th className="p-4 font-semibold text-slate-700">Stock</th>
              <th className="p-4 font-semibold text-slate-700">Retail Price</th>
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
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-900">{product.name_fr}</div>
                  <div className="text-xs text-slate-500">{product.name_ar}</div>
                </td>
                <td className="p-4 text-slate-600">{product.category?.name_fr || '-'}</td>
                <td className="p-4">
                  <StockBadge quantity={product.quantity} size="sm" />
                </td>
                <td className="p-4 font-medium">{formatPrice(product.price, 'fr')}</td>
                <td className="p-4 text-green-700 font-medium">
                  {product.wholesale_price ? formatPrice(product.wholesale_price, 'fr') : '-'}
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleProductStatus(product.id, !product.is_active)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <Link to={`/admin/products/${product.id}/edit`}>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
