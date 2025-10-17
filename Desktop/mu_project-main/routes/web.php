<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\OrderVerificationController;

Route::redirect('/', '/cafeteria');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria.index');

    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

    Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory.index');

    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('/payments/{order}/paid',   [PaymentController::class, 'markPaid']);
    Route::post('/payments/{order}/unpaid', [PaymentController::class, 'markUnpaid']);
    Route::post('/payments/{order}/method', [PaymentController::class, 'setMethod']);
    Route::post('/payments/qr',             [PaymentController::class, 'uploadQr']);

    Route::get('/menu', [MenuItemController::class, 'index'])->name('menu.index');

    // ---------- ADMIN: Verify pickup code ----------
    // Page to enter order-id + 4-digit code
    Route::get('/admin/verify-pickup', function () {
        // Path: resources/js/Pages/Admin/Users/VerifyPickupCode.jsx
        return Inertia::render('Admin/Users/VerifyPickupCode');
    })->name('admin.verify.pickup');

    // Endpoint that verifies the code and marks the order paid
    Route::post('/admin/orders/verify-code', [OrderVerificationController::class, 'verify'])
        ->name('admin.orders.verify-code');

    Route::get('/profile', fn () => inertia('Profile/Edit'))->name('profile.edit');
});

require __DIR__ . '/auth.php';
