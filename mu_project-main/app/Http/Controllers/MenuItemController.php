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
        $menuItems = MenuItem::latest()->get(); // each has image_url accessor

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
            'image'       => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // store to /storage/app/public/menu_images/...
            $validated['image'] = $request->file('image')->store('menu_images', 'public');
        }

        MenuItem::create($validated);

        return redirect()->route('menu-items.index')->with('success', 'Item created!');
    }

    public function edit($id)
    {
        $menuItem = MenuItem::findOrFail($id); // has image_url

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
            'image'       => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menu_images', 'public');
        }

        $originalStock = $menuItem->stock;

        $menuItem->update($validated);

        $diff = $validated['stock'] - $originalStock;
        if ($diff !== 0) {
            InventoryLog::create([
                'menu_item_id'     => $menuItem->id,
                'action'           => $stockDiff > 0 ? 'increase' : 'decrease',
                'quantity_changed' => $stockDiff,   // negative for decrease
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
