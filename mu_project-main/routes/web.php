<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\ProfileController;

Route::redirect('/', '/cafeteria');

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria');

    // Menu Items & Orders
    Route::resource('menu-items', MenuItemController::class)->except(['show']);
    Route::resource('orders', OrderController::class)->except(['show']);

    // Inventory logs
    Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory.index');
    Route::delete('/inventory-logs/{id}', [InventoryLogController::class, 'destroy'])->name('inventory.destroy');

    // Payments / Receipts page
    Route::get('/payments-receipts', [OrderController::class, 'receiptsAndPayments'])
        ->name('orders.receipts_payments');

    // Payment row actions
    Route::patch('/orders/{order}/payment-method', [OrderController::class, 'updatePaymentMethod'])
        ->name('orders.update_method');

    Route::patch('/orders/{order}/mark-paid', [OrderController::class, 'markPaid'])
        ->name('orders.mark_paid');

    // QR upload
    Route::post('/payments/qr-upload', [OrderController::class, 'uploadQr'])
        ->name('payments.qr_upload');

    // ✅ Profile (needed by route('profile.edit') etc.)
    Route::get('/profile',  [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Breeze/Jetstream auth scaffolding (login, register, password, etc.)
require __DIR__.'/auth.php';
