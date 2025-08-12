<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Redirect root to /cafeteria
Route::redirect('/', '/cafeteria');

// Auth & verified area
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard (handy for Breeze redirects)
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard'); // resources/js/Pages/Dashboard.jsx
    })->name('dashboard');

    // Main POS
    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria');

    // Menu Items (no show)
    Route::resource('menu-items', MenuItemController::class)->except(['show']);

    // Orders (no show)
    Route::resource('orders', OrderController::class)->except(['show']);

    // Inventory Logs
    Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory.index');
    Route::delete('/inventory-logs/{id}', [InventoryLogController::class, 'destroy'])->name('inventory.destroy');

    // Payments / Receipts page
    Route::get('/payments-receipts', [OrderController::class, 'receiptsAndPayments'])
        ->name('orders.receipts_payments');

    // Payment actions (AJAX from table)
    Route::patch('/orders/{order}/payment-method', [OrderController::class, 'updatePaymentMethod'])
        ->name('orders.update_method');
    Route::patch('/orders/{order}/mark-paid', [OrderController::class, 'markPaid'])
        ->name('orders.mark_paid');

    // Upload QR image used for "QR" payments
    Route::post('/payments/qr-upload', [OrderController::class, 'uploadQr'])
        ->name('payments.qr_upload');

    // User profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Optional custom signout (Breeze already registers POST /logout in auth.php)
Route::post('/signout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/login');
})->name('logout.custom');

// Breeze / Fortify auth routes (login/register/logout, etc.)
require __DIR__ . '/auth.php';
