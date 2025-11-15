<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\OrderVerificationController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AnalyticsController;


use App\Http\Middleware\AdminOnly;

Route::redirect('/', '/cafeteria');

Route::middleware(['auth', 'verified'])->group(function () {
    // Student-accessible
    Route::get('/cafeteria', [CafeteriaController::class, 'index'])->name('cafeteria.index');
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

    Route::get('/profile', fn () => inertia('Profile/Edit'))->name('profile.edit');

    // Admin-only
    Route::middleware([AdminOnly::class])->group(function () {
        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');

        Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory.index');

        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments/{order}/paid',   [PaymentController::class, 'markPaid'])->name('payments.paid');
        Route::post('/payments/{order}/unpaid', [PaymentController::class, 'markUnpaid'])->name('payments.unpaid');
        Route::post('/payments/{order}/method', [PaymentController::class, 'setMethod'])->name('payments.method');
        Route::post('/payments/qr',             [PaymentController::class, 'uploadQr'])->name('payments.qr');

        
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
        Route::post('/analytics/chat', [AnalyticsController::class, 'chat'])->name('analytics.chat');


        Route::get('/menuitems', [MenuItemController::class, 'index'])->name('menuitems.index');
        Route::get('/menuitems/create', [MenuItemController::class, 'create'])->name('menuitems.create');
        Route::post('/menuitems', [MenuItemController::class, 'store'])->name('menuitems.store');
        Route::get('/menuitems/{menuitem}/edit', [MenuItemController::class, 'edit'])->name('menuitems.edit');
        Route::put('/menuitems/{menuitem}', [MenuItemController::class, 'update'])->name('menuitems.update');
        Route::delete('/menuitems/{menuitem}', [MenuItemController::class, 'destroy'])->name('menuitems.destroy');
        Route::get('/menu', [MenuItemController::class, 'index'])->name('menu.index');

        Route::get('/admin/verify-pickup', function () {
            return Inertia::render('Admin/Users/VerifyPickupCode');
        })->name('admin.verify.pickup');

        Route::post('/admin/orders/verify-code', [OrderVerificationController::class, 'verify'])
            ->name('admin.orders.verify-code');

        Route::get('/admin/roles', [UsersController::class, 'index'])->name('admin.roles.index');
        Route::post('/admin/roles/{user}/role', [UsersController::class, 'setUserRole'])->name('admin.roles.set');
    });
});

require __DIR__.'/auth.php';
