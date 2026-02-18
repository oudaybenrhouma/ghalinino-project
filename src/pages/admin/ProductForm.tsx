import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common';
import { useCategories } from '@/hooks/useProducts';
import { useStore } from '@/store';

interface ProductFormData {
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  price: number;
  wholesale_price: number;
  wholesale_min_quantity: number;
  quantity: number;
  low_stock_threshold: number;
  category_id: string;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  is_wholesale_only: boolean;
}

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const addNotification = useStore((s) => s.addNotification);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      is_active: true,
      is_featured: false,
      is_wholesale_only: false,
      low_stock_threshold: 5,
      wholesale_min_quantity: 10,
      quantity: 0,
    }
  });

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const { data, error } = await (supabase as any).from('products').select('*').eq('id', id).single();
        if (error) {
          addNotification({ type: 'error', title: 'Failed to load product' });
          return;
        }
        if (data) {
          reset(data);
          setExistingImages((data.images as string[]) || []);
        }
      };
      fetchProduct();
    }
  }, [id, reset, addNotification]);

  useEffect(() => {
    const urls = images.map(f => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [images]);

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    setFormError(null);

    try {
      let imageUrls = [...existingImages];

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, file, { contentType: file.type });
          if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
          const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(fileName);
          imageUrls.push(publicUrl.publicUrl);
          setUploadProgress(Math.round(((i + 1) / images.length) * 100));
        }
      }

      const slug = data.name_fr
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .trim();

      const productData = {
        ...data,
        price: Number(data.price),
        wholesale_price: data.wholesale_price ? Number(data.wholesale_price) : null,
        wholesale_min_quantity: Number(data.wholesale_min_quantity) || 10,
        quantity: Number(data.quantity),
        low_stock_threshold: Number(data.low_stock_threshold) || 5,
        category_id: data.category_id || null,
        slug,
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      const db = supabase as any;
      if (id) {
        const { error } = await db.from('products').update(productData).eq('id', id);
        if (error) throw new Error(error.message);
        addNotification({ type: 'success', title: 'Product updated successfully' });
      } else {
        const { error } = await db.from('products').insert({
          ...productData,
          created_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        addNotification({ type: 'success', title: 'Product created successfully' });
      }

      navigate('/admin/products');
    } catch (error: any) {
      const msg = error?.message || 'Failed to save product. Please try again.';
      setFormError(msg);
      addNotification({ type: 'error', title: 'Failed to save product', message: msg });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{id ? 'Update product details below' : 'Fill in the details to create a new product'}</p>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium text-red-800">Error saving product</p>
            <p className="text-sm text-red-600 mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-3">Product Names</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name (French) <span className="text-red-500">*</span></label>
              <input
                {...register('name_fr', { required: 'French name is required' })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors ${errors.name_fr ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                placeholder="Nom du produit"
              />
              {errors.name_fr && <p className="text-xs text-red-500 mt-1">{errors.name_fr.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name (Arabic) <span className="text-red-500">*</span></label>
              <input
                {...register('name_ar', { required: 'Arabic name is required' })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors ${errors.name_ar ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                placeholder="اسم المنتج"
                dir="rtl"
              />
              {errors.name_ar && <p className="text-xs text-red-500 mt-1">{errors.name_ar.message}</p>}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (French)</label>
              <textarea {...register('description_fr')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors resize-none" rows={4} placeholder="Description du produit..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Arabic)</label>
              <textarea {...register('description_ar')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-right focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors resize-none" rows={4} placeholder="وصف المنتج..." dir="rtl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-3">Product Details</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select {...register('category_id')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors bg-white">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU</label>
              <input {...register('sku')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors" placeholder="e.g. PROD-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock Quantity <span className="text-red-500">*</span></label>
              <input type="number" min="0" {...register('quantity', { required: 'Quantity is required', min: { value: 0, message: 'Must be 0 or more' } })} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors ${errors.quantity ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Low Stock Alert Threshold</label>
            <input type="number" min="0" {...register('low_stock_threshold')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors" />
            <p className="text-xs text-slate-500 mt-1">Alert when stock falls below this number</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-3">Pricing (TND)</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Retail Price <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" step="0.001" min="0" {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be positive' } })} className={`w-full border rounded-lg pl-3 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors ${errors.price ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} placeholder="0.000" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">TND</span>
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Wholesale Price</label>
              <div className="relative">
                <input type="number" step="0.001" min="0" {...register('wholesale_price')} className="w-full border border-slate-300 rounded-lg pl-3 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors" placeholder="0.000" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">TND</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Min Wholesale Qty</label>
              <input type="number" min="1" {...register('wholesale_min_quantity')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-colors" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-3">Product Images</h2>
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Current Images</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {imagePreviews.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">New Images</p>
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-blue-300" />
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-slate-500">Click to select images</span>
            <span className="text-xs text-slate-400 mt-1">JPG, PNG, WebP accepted</span>
            <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files || []))} className="hidden" />
          </label>
          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Uploading images...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-red-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4">Visibility & Settings</h2>
          <div className="flex flex-wrap gap-6">
            {[
              { field: 'is_active' as const, label: 'Active', desc: 'Visible to customers', color: 'peer-checked:bg-green-500' },
              { field: 'is_featured' as const, label: 'Featured', desc: 'Show on homepage', color: 'peer-checked:bg-amber-500' },
              { field: 'is_wholesale_only' as const, label: 'Wholesale Only', desc: 'B2B customers only', color: 'peer-checked:bg-purple-500' },
            ].map(({ field, label, desc, color }) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register(field)} className="sr-only peer" />
                  <div className={`w-10 h-6 bg-slate-200 ${color} rounded-full transition-colors`} />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button type="submit" isLoading={loading}>{id ? 'Update Product' : 'Create Product'}</Button>
        </div>
      </form>
    </div>
  );
}