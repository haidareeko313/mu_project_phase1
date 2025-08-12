<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    public function index()
    {
        // If your MenuItem has an accessor getImageUrlAttribute(), this is fine.
        // Otherwise, your React page is already resolving the URL with /storage/.
        $menuItems = MenuItem::latest()->get();

        return Inertia::render('MenuItems/Index', [
            'menuItems' => $menuItems,
        ]);
    }

    public function create()
    {
        return Inertia::render('MenuItems/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'image'       => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Stored as "menu_images/filename.ext" on the "public" disk -> /storage/menu_images/...
            $validated['image'] = $request->file('image')->store('menu_images', 'public');
        }

        MenuItem::create($validated);

        return redirect()->route('menu-items.index')->with('success', 'Item created!');
    }

    public function edit($id)
    {
        $menuItem = MenuItem::findOrFail($id);

        return Inertia::render('MenuItems/Edit', [
            'menuItem' => $menuItem,
        ]);
    }

    public function update(Request $request, $id)
    {
        $menuItem = MenuItem::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'note'        => 'nullable|string|max:255',
            'image'       => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menu_images', 'public');
        }

        $originalStock = (int) $menuItem->stock;

        $menuItem->update($validated);

        // Log stock change if it changed
        $newStock = (int) $validated['stock'];
        $diff     = $newStock - $originalStock;

        if ($diff !== 0) {
            InventoryLog::create([
                'menu_item_id'     => $menuItem->id,
                'action'           => $diff > 0 ? 'increase' : 'decrease',
                'quantity_changed' => $diff, // negative for decrease, positive for increase
                'note'             => $validated['note'] ?? null,
            ]);
        }

        return redirect()->route('menu-items.index')->with('success', 'Menu item updated.');
    }

    public function destroy($id)
    {
        $menuItem = MenuItem::findOrFail($id);
        $menuItem->delete();

        return redirect()->route('menu-items.index')->with('success', 'Menu item deleted.');
    }
}
