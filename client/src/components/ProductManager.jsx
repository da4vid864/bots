import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ProductManager = ({ botId }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    currency: 'MXN',
    image_url: '',
    tags: '',
    stock_status: 'in_stock',
  });

  useEffect(() => {
    if (botId) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${botId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: '',
      currency: 'MXN',
      image_url: '',
      tags: '',
      stock_status: 'in_stock',
    });
    setEditingProduct(null);
    setShowForm(false);
    setImageFile(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      currency: product.currency || 'MXN',
      image_url: product.image_url || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
      stock_status: product.stock_status || 'in_stock',
    });
    setImageFile(null);
    setShowForm(true);
  };

  const uploadProductImage = async (productId, file) => {
    const fd = new FormData();
    fd.append('image', file);

    setImageUploading(true);
    try {
      const res = await fetch(`/api/products/${productId}/image`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      return await res.json();
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : `/api/products/${botId}`;
      const method = editingProduct ? 'PUT' : 'POST';

      // tags: string -> array
      const processedData = {
        ...formData,
        tags:
          typeof formData.tags === 'string'
            ? formData.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : formData.tags,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(processedData),
      });

      if (!response.ok) throw new Error('Failed to save product');

      let savedProduct = await response.json();

      // ✅ Si eligió archivo, subir a R2 y actualizar producto
      if (imageFile) {
        savedProduct = await uploadProductImage(savedProduct.id, imageFile);
      }

      if (editingProduct) {
        setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
      } else {
        setProducts((prev) => [savedProduct, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      alert('Error saving product: ' + err.message);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(t('products.confirm_delete', 'Are you sure you want to delete this product?')))
      return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert('Error deleting product: ' + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-600">{t('common.loading', 'Loading...')}</div>;

  // ✅ Clases para inputs con contraste correcto
  const inputClass =
    'w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 ' +
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  const selectClass = inputClass;
  const textareaClass = inputClass;

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('products.title', 'Product Catalog')}</h2>
        <button
          onClick={() => {
            if (showForm) resetForm();
            else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? t('common.cancel', 'Cancel') : t('products.add_product', 'Add Product')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingProduct ? t('products.edit_product', 'Edit Product') : t('products.new_product', 'New Product')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.sku', 'SKU')}
              </label>
              <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.name', 'Product Name')}
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.description', 'Description')}
              </label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className={textareaClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.price', 'Price')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  className={'w-full pl-8 ' + inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.currency', 'Currency')}
              </label>
              <select name="currency" value={formData.currency} onChange={handleInputChange} className={selectClass}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* ✅ Subir imagen */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Subir imagen (desde tu PC)
              </label>
              <input
                type="file"
                accept="image/*"
                className={inputClass}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Se sube a Cloudflare R2 al guardar el producto.
              </p>
              {imageUploading && <p className="text-xs text-blue-600 mt-1">Subiendo imagen...</p>}
            </div>

            {/* Mantener URL manual opcional */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.image_url', 'Image URL')}
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.tags', 'Tags (comma separated)')}
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="electronics, sale, new"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('products.stock_status', 'Stock Status')}
              </label>
              <select name="stock_status" value={formData.stock_status} onChange={handleInputChange} className={selectClass}>
                <option value="in_stock">{t('products.status.in_stock', 'In Stock')}</option>
                <option value="out_of_stock">{t('products.status.out_of_stock', 'Out of Stock')}</option>
                <option value="pre_order">{t('products.status.pre_order', 'Pre Order')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-100 font-medium transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={imageUploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {editingProduct ? t('common.save_changes', 'Save Changes') : t('products.create', 'Create Product')}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600 text-lg">{t('products.no_products', 'No products found.')}</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
              {t('products.add_first', 'Add your first product')}
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="h-48 bg-gray-100 relative overflow-hidden group">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      product.stock_status === 'in_stock'
                        ? 'bg-green-100 text-green-800'
                        : product.stock_status === 'out_of_stock'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {t(`products.status.${product.stock_status}`, product.stock_status)}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1" title={product.name}>
                    {product.name}
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    ${parseFloat(product.price).toFixed(2)} {product.currency}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1 font-mono">SKU: {product.sku}</p>

                <p className="text-gray-700 text-sm mb-4 line-clamp-2 flex-grow" title={product.description}>
                  {product.description || t('products.no_description', 'No description available')}
                </p>

                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductManager;