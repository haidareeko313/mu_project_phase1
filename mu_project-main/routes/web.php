<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\ProfileController;

Route::redirect('/', '/cafeteria');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria');

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
});

require __DIR__.'/auth.php';
