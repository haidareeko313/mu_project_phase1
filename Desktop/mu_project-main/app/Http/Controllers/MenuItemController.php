<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $q = MenuItem::query()
            ->when($request->search, fn ($qq) =>
                $qq->where('name', 'like', '%'.$request->search.'%'))
            ->orderBy('name');

        $items = $q->paginate(12);

        return Inertia::render('MenuItems/Index', [
            'filters' => [
                'search' => $request->search ?? '',
            ],
            'items' => $items->through(function (MenuItem $mi) {
                return [
                    'id'        => $mi->id,
                    'name'      => $mi->name,
                    'price'     => number_format($mi->price, 2),
                    'stock_qty' => (int) $mi->stock_qty,
                    'is_active' => (bool) $mi->is_active,
                    'image_url' => $mi->image ? Storage::url($mi->image) : null,
                ];
            }),
        ]);
    }

    public function create()
    {
        return Inertia::render('MenuItems/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'price'      => ['required', 'numeric', 'min:0'],
            'stock_qty'  => ['required', 'integer', 'min:0'],
            'is_active'  => ['nullable'],               // normalize below
            'image'      => ['nullable', 'image', 'max:4096'],
        ]);

        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('image')) {
            // run once: php artisan storage:link
            $validated['image'] = $request->file('image')->store('menu_images', 'public');
        }

        // create item
        $item = MenuItem::create($validated);

        $initial = (int) ($validated['stock_qty'] ?? 0);
        if ($initial !== 0) {
            InventoryLog::create([
            'menu_item_id'     => $item->id,
            'user_id'          => $request->user()->id ?? null,
            'action'           => 'adjustment',
            'quantity_changed' => $initial,          // positive add
            'stock_after'      => $initial,          // stock right after creation
    ]);
}


        return redirect()->route('menuitems.index')->with('success', 'Item created.');
    }

    public function edit(MenuItem $menuitem)
    {
        return Inertia::render('MenuItems/Edit', [
            'item' => [
                'id'        => $menuitem->id,
                'name'      => $menuitem->name,
                'price'     => (float) $menuitem->price,
                'stock_qty' => (int) $menuitem->stock_qty,
                'is_active' => (bool) $menuitem->is_active,
                'image_url' => $menuitem->image ? Storage::url($menuitem->image) : null,
            ],
        ]);
    }

    public function update(Request $request, MenuItem $menuitem)
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'price'      => ['required', 'numeric', 'min:0'],
            'stock_qty'  => ['required', 'integer', 'min:0'],
            'is_active'  => ['nullable'],
            'image'      => ['nullable', 'image', 'max:4096'],
        ]);

        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('image')) {
            if ($menuitem->image) {
                Storage::disk('public')->delete($menuitem->image);
            }
            $validated['image'] = $request->file('image')->store('menu_images', 'public');
        }

        // compute delta before update
        $old = (int) $menuitem->stock_qty;
        $menuitem->update($validated);
        $new = (int) $menuitem->stock_qty;
        $delta = $new - $old;

        // 📝 log only when stock actually changes
        if ($delta !== 0) {
            InventoryLog::create([
                'menu_item_id'     => $menuitem->id,
                'user_id'          => $request->user()->id ?? null,
                'action'           => 'adjustment',
                'quantity_changed' => $delta, // +added / -removed
                'stock_after'      => $new,
            ]);
        }

        return redirect()->route('menuitems.index')->with('success', 'Item updated.');
    }

    public function destroy(MenuItem $menuitem)
    {
        if ($menuitem->image) {
            Storage::disk('public')->delete($menuitem->image);
        }

        $menuitem->delete();

        return redirect()->route('menuitems.index')->with('success', 'Item deleted.');
    }
}
