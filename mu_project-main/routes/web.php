<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\ProfileController;

// Redirect root to /cafeteria
Route::redirect('/', '/cafeteria');

// Auth & verified area
Route::middleware(['auth', 'verified'])->group(function () {

    // ✅ Add a real, named dashboard route so Breeze can redirect correctly
    Route::get('/dashboard', function () {
        // If you have a React/Vue inertia page at resources/js/Pages/Dashboard.(jsx|vue)
        return Inertia::render('Dashboard');
        // If you use Blade instead, swap with: return view('dashboard');
    })->name('dashboard');

    // Main POS
    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria');

    // POS resources
    Route::resource('menu-items', MenuItemController::class)->except(['show']);
    Route::resource('orders', OrderController::class)->except(['show']);

    // Inventory
    Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory.index');
    Route::delete('/inventory-logs/{id}', [InventoryLogController::class, 'destroy'])->name('inventory.destroy');

    // Payments / Receipts
    Route::get('/payments-receipts', [OrderController::class, 'receiptsAndPayments'])
        ->name('orders.receipts_payments');

    // User profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    // Payments / Receipts
Route::get('/payments-receipts', [OrderController::class, 'receiptsAndPayments'])
    ->name('orders.receipts_payments');

// Payment actions
Route::patch('/orders/{order}/payment-method', [OrderController::class, 'updatePaymentMethod'])
    ->name('orders.update_method');

Route::patch('/orders/{order}/mark-paid', [OrderController::class, 'markPaid'])
    ->name('orders.mark_paid');

// QR upload
Route::post('/payments/qr-upload', [OrderController::class, 'uploadQr'])
    ->name('payments.qr_upload');

});

// ✅ Keep your custom logout logic but avoid clashing with Breeze’s POST /logout
// Breeze already registers POST /logout in routes/auth.php.
// I’m renaming yours so both can live together.
Route::post('/signout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/login');
})->name('logout.custom');

// Breeze auth routes (login, register, POST /logout, etc.)
require __DIR__ . '/auth.php';
