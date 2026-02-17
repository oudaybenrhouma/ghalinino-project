import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common';
import { useCategories } from '@/hooks/useProducts';

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
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const { register, handleSubmit, reset } = useForm<ProductFormData>();

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if (data) {
          reset(data as any);
          setExistingImages(data.images || []);
        }
      };
      fetchProduct();
    }
  }, [id, reset]);

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      let imageUrls = [...existingImages];

      // Upload new images
      for (const file of images) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(fileName);
        imageUrls.push(publicUrl.publicUrl);
      }

      const productData = {
        ...data,
        slug: data.name_fr.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        await supabase.from('products').update(productData as any).eq('id', id);
      } else {
        await supabase.from('products').insert(productData as any);
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{id ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name (FR)</label>
              <input {...register('name_fr')} className="w-full border rounded p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name (AR)</label>
              <input {...register('name_ar')} className="w-full border rounded p-2 text-right" required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Description (FR)</label>
              <textarea {...register('description_fr')} className="w-full border rounded p-2 h-32" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (AR)</label>
              <textarea {...register('description_ar')} className="w-full border rounded p-2 h-32 text-right" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select {...register('category_id')} className="w-full border rounded p-2">
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_fr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input {...register('sku')} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input type="number" {...register('quantity')} className="w-full border rounded p-2" required />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-slate-700">Pricing</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Retail Price (TND)</label>
                <input type="number" step="0.001" {...register('price')} className="w-full border rounded p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wholesale Price (TND)</label>
                <input type="number" step="0.001" {...register('wholesale_price')} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Wholesale Qty</label>
                <input type="number" {...register('wholesale_min_quantity')} className="w-full border rounded p-2" defaultValue={10} />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('is_active')} />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('is_featured')} />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('is_wholesale_only')} />
              <span>Wholesale Only</span>
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-2">Images</label>
            <input 
              type="file" 
              multiple 
              onChange={e => setImages(Array.from(e.target.files || []))}
              className="w-full border rounded p-2"
            />
            {existingImages.length > 0 && (
              <div className="flex gap-2 mt-2">
                {existingImages.map((src, i) => (
                  <img key={i} src={src} className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Save Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
