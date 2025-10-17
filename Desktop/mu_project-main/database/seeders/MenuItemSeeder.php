<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $table = 'menu_items';
        if (!Schema::hasTable($table)) {
            return; // no menu_items table, nothing to seed
        }

        $columns = Schema::getColumnListing($table);
        $now = now();

        // Try to detect ENUM options for the "type" column (if present)
        $typeEnum = $this->getEnumOptions($table, 'type'); // returns array of allowed values (lowercase), or null

        // Helper: map a friendly label to the exact allowed enum value (case-insensitive)
        $mapType = function (?string $label) use ($typeEnum) {
            if (!$label || !$typeEnum) return null;
            $want = strtolower(trim($label));
            // common normalizations
            $aliases = [
                'food'  => ['food','foods','meal','meals','snack','snacks'],
                'drink' => ['drink','drinks','beverage','beverages','juice','coffee','tea','water','soda'],
            ];
            foreach ($aliases as $canonical => $syns) {
                if (in_array($want, $syns, true)) {
                    $want = $canonical;
                    break;
                }
            }
            // only return if it's actually allowed by the enum
            return in_array($want, $typeEnum, true) ? $want : null;
        };

        // Example items (edit as you like)
        $items = [
            ['name' => 'Cheese Sandwich', 'price' => 3.50, 'type' => 'Food',  'is_active' => true, 'stock' => 100, 'image' => null],
            ['name' => 'Chicken Wrap',    'price' => 4.75, 'type' => 'Food',  'is_active' => true, 'stock' => 100, 'image' => null],
            ['name' => 'Green Salad',     'price' => 3.20, 'type' => 'Food',  'is_active' => true, 'stock' => 100, 'image' => null],
            ['name' => 'Orange Juice',    'price' => 1.80, 'type' => 'Drink', 'is_active' => true, 'stock' => 200, 'image' => null],
            ['name' => 'Coffee',          'price' => 1.50, 'type' => 'Drink', 'is_active' => true, 'stock' => 200, 'image' => null],
        ];

        foreach ($items as $i) {
            $row = [];

            // Always map the easy ones if they exist:
            foreach (['name','price','is_active','stock','image'] as $col) {
                if (in_array($col, $columns, true) && array_key_exists($col, $i)) {
                    $row[$col] = $i[$col];
                }
            }

            // Handle "type" vs "category" smartly:
            if (array_key_exists('type', $i)) {
                if (in_array('type', $columns, true)) {
                    // If type is enum, only set when allowed, else leave unset
                    $mapped = $mapType($i['type']);
                    if ($mapped !== null) {
                        $row['type'] = $mapped;
                    }
                } elseif (in_array('category', $columns, true)) {
                    // No "type" col but there is "category"
                    $row['category'] = $i['type'];
                }
            }

            // Timestamps if present
            if (in_array('created_at', $columns, true)) $row['created_at'] = $now;
            if (in_array('updated_at', $columns, true)) $row['updated_at'] = $now;

            // Upsert by unique name (change this if name isn't unique in your schema)
            DB::table($table)->updateOrInsert(
                ['name' => $i['name']],
                $row
            );
        }
    }

    /**
     * Return ENUM options for a given table/column as a lowercased array,
     * or null if the column isn't enum.
     */
    private function getEnumOptions(string $table, string $column): ?array
    {
        if (!Schema::hasColumn($table, $column)) {
            return null;
        }
        // SHOW COLUMNS FROM returns an object with a "Type" (mysql) or "type" (mariadb) property
        $col = DB::selectOne("SHOW COLUMNS FROM `{$table}` WHERE Field = ?", [$column]);
        if (!$col) return null;

        // Property name may be Type or type depending on driver/version
        $type = $col->Type ?? $col->type ?? null;
        if (!$type || stripos($type, 'enum(') !== 0) {
            return null;
        }

        // Parse enum('a','b','c')
        $inside = trim(substr($type, 5), "()");
        // Split respecting quotes
        $raw = preg_split("/,(?=(?:[^']*'[^']*')*[^']*$)/", $inside);
        $vals = [];
        foreach ($raw as $v) {
            $v = trim($v, " '");
            if ($v !== '') $vals[] = strtolower($v);
        }
        return $vals ?: null;
    }
}
