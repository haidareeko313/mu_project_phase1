<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\OrderVerificationController;

// ✅ Import the middleware class directly (this bypasses the 'admin' alias completely)
use App\Http\Middleware\AdminOnly;

Route::redirect('/', '/cafeteria');

Route::middleware(['auth', 'verified'])->group(function () {
    // ---- Student-accessible pages ----
    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria.index');

    // Students must be able to place orders from the cafeteria page
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

    Route::get('/profile', fn () => inertia('Profile/Edit'))->name('profile.edit');

    // ---- Admin-only pages (using class, not alias) ----
    Route::middleware([AdminOnly::class])->group(function () {

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');

        Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory.index');

        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments/{order}/paid',   [PaymentController::class, 'markPaid']);
        Route::post('/payments/{order}/unpaid', [PaymentController::class, 'markUnpaid']);
        Route::post('/payments/{order}/method', [PaymentController::class, 'setMethod']);
        Route::post('/payments/qr',             [PaymentController::class, 'uploadQr']);

        Route::get('/menuitems', [MenuItemController::class, 'index'])->name('menuitems.index');
        Route::get('/menuitems/create', [MenuItemController::class, 'create'])->name('menuitems.create');
        Route::post('/menuitems', [MenuItemController::class, 'store'])->name('menuitems.store');
        Route::get('/menuitems/{menuitem}/edit', [MenuItemController::class, 'edit'])->name('menuitems.edit');
        Route::put('/menuitems/{menuitem}', [MenuItemController::class, 'update'])->name('menuitems.update');
        Route::delete('/menuitems/{menuitem}', [MenuItemController::class, 'destroy'])->name('menuitems.destroy');

        Route::get('/menu', [MenuItemController::class, 'index'])->name('menu.index');

        // Admin: verify cash codes
        Route::get('/admin/verify-pickup', function () {
            return Inertia::render('Admin/Users/VerifyPickupCode');
        })->name('admin.verify.pickup');

        Route::post('/admin/orders/verify-code', [OrderVerificationController::class, 'verify'])
            ->name('admin.orders.verify-code');

        // Admin: roles endpoints (used by Roles panel under Payments)
        Route::post('/admin/roles/{user}', [PaymentController::class, 'setUserRole'])
            ->name('admin.roles.set');
        Route::get('/admin/roles', [PaymentController::class, 'listUsers'])
            ->name('admin.roles.index');
    });
});

require __DIR__.'/auth.php';
