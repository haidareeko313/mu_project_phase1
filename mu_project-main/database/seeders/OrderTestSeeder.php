<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\User;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        // Make sure we have at least 3 menu items
        if (MenuItem::count() < 3) {
            MenuItem::factory()->count(3)->create();
        }

        // Get a user (create if not exists)
        $user = User::first() ?? User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Create 5 orders
        for ($i = 0; $i < 5; $i++) {
            $order = Order::create([
                'user_id'        => $user->id,
                'status'         => fake()->randomElement(['pending', 'preparing', 'ready', 'picked_up']),
                'payment_method' => fake()->randomElement(['cash', 'qr']),
                'is_paid'        => fake()->boolean(),
            ]);

            // Each order will have 1–3 items
            $items = MenuItem::inRandomOrder()->take(rand(1, 3))->get();

            foreach ($items as $menuItem) {
                $quantity = rand(1, 3);

                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity'     => $quantity,
                ]);
            }
        }
    }
}
