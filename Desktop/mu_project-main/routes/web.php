<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\CafeteriaController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\PaymentController;

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

    Route::get('/menuitems', [MenuItemController::class, 'index'])->name('menuitems.index');
    Route::get('/menuitems/create', [MenuItemController::class, 'create'])->name('menuitems.create');
    Route::post('/menuitems', [MenuItemController::class, 'store'])->name('menuitems.store');
    Route::get('/menuitems/{menuitem}/edit', [MenuItemController::class, 'edit'])->name('menuitems.edit');
    Route::put('/menuitems/{menuitem}', [MenuItemController::class, 'update'])->name('menuitems.update');
    Route::delete('/menuitems/{menuitem}', [MenuItemController::class, 'destroy'])->name('menuitems.destroy');

    Route::get('/menu', [MenuItemController::class, 'index'])->name('menu.index');

    Route::get('/profile', fn () => inertia('Profile/Edit'))->name('profile.edit');
});

require __DIR__.'/auth.php';
