import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function Edit({ menuItem }) {
  const { errors } = usePage().props;

  if (!menuItem) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  const [form, setForm] = useState({
    name: menuItem.name || '',
    description: menuItem.description || '',
    price: menuItem.price || '',
    stock: menuItem.stock || '',
    note: '',
    image: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('_method', 'put');

    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    router.post(route('menu-items.update', menuItem.id), data, {
      forceFormData: true,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-mu-blue">Edit Menu Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {['name', 'description', 'price', 'stock', 'note'].map((field) => (
          <div key={field}>
            <label className="block font-medium capitalize">{field}</label>
            <input
              type={field === 'price' || field === 'stock' ? 'number' : 'text'}
              name={field}
              value={form[field]}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder={field === 'note' ? 'Optional note' : ''}
            />
            {errors[field] && <div className="text-red-600">{errors[field]}</div>}
          </div>
        ))}

        <div>
          <label className="block font-medium">Upload Image</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
          {errors.image && <div className="text-red-600">{errors.image}</div>}
        </div>

        <div className="flex items-center space-x-4">
          <button type="submit" className="bg-mu-gold text-mu-blue px-4 py-2 rounded hover:bg-yellow-400">
            Update
          </button>
          <Link href={route('menu-items.index')} className="text-gray-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
