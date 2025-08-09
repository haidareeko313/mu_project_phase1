<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;

class CafeteriaController extends Controller
{
    public function index()
    {
        return Inertia::render('Cafeteria/Index', [
            'menuItems' => MenuItem::select('id', 'name', 'price', 'stock', 'image')->get(), // has image_url
            'metrics'   => [
                'total_orders'   => Order::count(),
                'total_revenue'  => Payment::sum('amount'),
                'cash_payments'  => Payment::where('method', 'cash')->sum('amount'),
                'qr_payments'    => Payment::where('method', 'qr')->sum('amount'),
            ],
        ]);
    }
}
