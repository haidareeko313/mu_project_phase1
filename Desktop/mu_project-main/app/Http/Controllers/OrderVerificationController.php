<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Order;
use Carbon\Carbon;

class OrderVerificationController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string',        // the 4-digit code the customer shows
            'order_id' => 'nullable|integer',   // optional but recommended
        ]);

        $code = $request->code;
        $orderId = $request->order_id;

        // Prefer exact order match when order_id provided
        if ($orderId) {
            $order = Order::where('id', $orderId)
                          ->where('payment_status', 'pending')
                          ->first();
            if (! $order) {
                return back()->with('error', 'Order not found or already paid.');
            }
            // check expiry
            if ($order->pickup_code_expires_at && $order->pickup_code_expires_at->isPast()) {
                return back()->with('error', 'Pickup code expired.');
            }
            if (! $order->pickup_code_hash || ! Hash::check($code, $order->pickup_code_hash)) {
                return back()->with('error', 'Invalid pickup code.');
            }
            // Mark as paid
            $order->payment_status = 'paid';
            $order->paid_at = Carbon::now();
            $order->paid_by = auth()->id();
            $order->save();

            // optional: clear pickup code so it cannot be reused
            $order->pickup_code_hash = null;
            $order->save();

            // possibly dispatch job/notification
            return back()->with('success', "Order #{$order->id} marked as paid.");
        }

        // If no order_id: try to find pending orders with matching hash (WARNING: collisions possible)
        // We'll search for pending orders that are not expired and compare hashes;
        // limit to recent window to reduce cost.
        $candidates = Order::where('payment_status', 'pending')
            ->where(function ($q) {
                // only last X hours to limit workload
                $q->where('created_at', '>=', now()->subHours(24));
            })
            ->whereNull('paid_at')
            ->get();

        foreach ($candidates as $order) {
            if ($order->pickup_code_hash && Hash::check($code, $order->pickup_code_hash)) {
                // found match
                $order->payment_status = 'paid';
                $order->paid_at = Carbon::now();
                $order->paid_by = auth()->id();
                $order->pickup_code_hash = null;
                $order->save();
                return back()->with('success', "Order #{$order->id} marked as paid.");
            }
        }

        return back()->with('error', 'No matching pending order found for that code.');
    }
}