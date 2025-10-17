<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
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
                    'stock_qty' => $mi->stock_qty,
                    'is_active' => $mi->is_active,
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
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'price'      => ['required', 'numeric', 'min:0'],
            'stock_qty'  => ['required', 'integer', 'min:0'],
            'is_active'  => ['required', 'boolean'],
            'image'      => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu_images', 'public');
        }

        MenuItem::create($data);

        return redirect()->route('menuitems.index')->with('success', 'Item created.');
    }

    public function edit(MenuItem $menuitem)
    {
        return Inertia::render('MenuItems/Edit', [
            'item' => [
                'id'        => $menuitem->id,
                'name'      => $menuitem->name,
                'price'     => (float) $menuitem->price,
                'stock_qty' => $menuitem->stock_qty,
                'is_active' => (bool) $menuitem->is_active,
                'image_url' => $menuitem->image ? Storage::url($menuitem->image) : null,
            ],
        ]);
    }

    public function update(Request $request, MenuItem $menuitem)
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'price'      => ['required', 'numeric', 'min:0'],
            'stock_qty'  => ['required', 'integer', 'min:0'],
            'is_active'  => ['required', 'boolean'],
            'image'      => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            if ($menuitem->image) {
                Storage::disk('public')->delete($menuitem->image);
            }
            $data['image'] = $request->file('image')->store('menu_images', 'public');
        }

        $menuitem->update($data);

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
