import React, { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';

export default function Create() {
  const { errors } = usePage().props;

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
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
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('price', form.price);
    data.append('stock', form.stock);
    if (form.image) {
      data.append('image', form.image);
    }

    router.post(route('menu-items.store'), data, { forceFormData: true });
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-mu-blue">Add New Menu Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {['name', 'description', 'price', 'stock'].map((field) => (
          <div key={field}>
            <label className="block font-medium capitalize">{field}</label>
            <input
              type={field === 'description' ? 'textarea' : field === 'price' || field === 'stock' ? 'number' : 'text'}
              name={field}
              value={form[field]}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors[field] && <div className="text-red-600">{errors[field]}</div>}
          </div>
        ))}

        <div>
          <label className="block font-medium">Upload Image (optional)</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            className="w-full border rounded p-2"
            accept="image/*"
          />
          {errors.image && <div className="text-red-600">{errors.image}</div>}
        </div>

        <div className="flex items-center space-x-4">
          <button type="submit" className="bg-mu-gold text-mu-blue px-4 py-2 rounded hover:bg-yellow-400">
            Save
          </button>
          <Link href={route('menu-items.index')} className="text-gray-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
