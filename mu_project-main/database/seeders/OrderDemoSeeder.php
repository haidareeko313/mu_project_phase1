<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryLog;

class OrderDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure a user exists
        $user = User::first() ?? User::create([
            'name'              => 'Test User',
            'email'             => 'test@example.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Ensure some menu items exist
        if (MenuItem::count() < 3) {
            MenuItem::insert([
                [
                    'name'       => 'Chicken Burger',
                    'price'      => 7.50,
                    'stock'      => 50,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name'       => 'Beef Wrap',
                    'price'      => 8.00,
                    'stock'      => 40,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name'       => 'Iced Tea',
                    'price'      => 2.00,
                    'stock'      => 120,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        $items = MenuItem::select('id', 'name', 'price', 'stock')->get();

        // Make 5 demo orders
        for ($i = 1; $i <= 5; $i++) {
            $payment = Arr::random(['cash', 'qr']);
            $status  = Arr::random(['pending', 'preparing', 'ready', 'picked_up']);

            $order = Order::create([
                'user_id'        => $user->id,
                'status'         => $status,
                'payment_method' => $payment,
                'is_paid'        => $payment === 'cash',
            ]);

            foreach ($items->random(min(3, $items->count())) as $menuItem) {
                $qty = rand(1, 3);

                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity'     => $qty,
                ]);

                // Decrement stock & log
                $menuItem->decrement('stock', $qty);

                InventoryLog::create([
                    'menu_item_id'     => $menuItem->id,
                    'action'           => 'order',
                    'quantity_changed' => -$qty,
                    'note'             => 'Seeded order',
                ]);
            }
        }

        $this->command->info('Demo orders seeded ✔');
    }
}
