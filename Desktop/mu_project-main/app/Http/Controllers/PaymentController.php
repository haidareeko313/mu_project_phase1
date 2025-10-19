<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $q     = $request->string('q')->toString();
        $paid  = $request->string('paid')->toString();   // 'any'|'yes'|'no'
        $stat  = $request->string('status')->toString(); // 'any'|'pending'|'completed'
        $meth  = $request->string('method')->toString(); // 'any'|'CASH'|'QR'
        $from  = $request->string('from')->toString();
        $to    = $request->string('to')->toString();

        $builder = Order::query()->with('user');

        if ($q !== '') {
            $builder->where(function ($b) use ($q) {
                $b->where('id', $q)
                  ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%$q%"));
            });
        }

        if ($stat && $stat !== 'any') {
            $builder->where('status', $stat);
        }

        if ($meth && $meth !== 'any') {
            $builder->where('method', $meth);
        }

        if ($from) $builder->where('created_at', '>=', $from.' 00:00:00');
        if ($to)   $builder->where('created_at', '<=', $to.' 23:59:59');

        // "Paid" is derived from "status"
        if ($paid === 'yes') $builder->where('status', 'completed');
        if ($paid === 'no')  $builder->where('status', '!=', 'completed');

        $orders = $builder->latest()->paginate(25)->appends($request->query());

        // Current QR with cache-buster
        $qrUrl = null;
        $disk = Storage::disk('public');
        if ($disk->exists('payments/qr.png')) {
            $version = $disk->lastModified('payments/qr.png');
            $qrUrl = asset('storage/payments/qr.png') . '?v=' . $version;
        }

        // Map to a simple DTO including cash_code
        $rows = $orders->getCollection()->map(function (Order $o) {
            return [
                'id'        => $o->id,
                'user'      => optional($o->user)->email ?? '—',
                'status'    => $o->status,
                'paid'      => $o->status === 'completed' ? 'Yes' : 'No',
                'method'    => $o->method,
                'cash_code' => $o->cash_code ?? null,   // <—— MAKE SURE THIS GOES OUT
                'total'     => (float)($o->total ?? 0),
                'created'   => optional($o->created_at)->format('Y-m-d H:i:s'),
            ];
        });

        // swap the paginated collection with our mapped rows
        $orders->setCollection($rows);

        return Inertia::render('Payments/Index', [
            'orders'  => $orders,
            'filters' => [
                'q'      => $q, 'paid' => $paid ?: 'any',
                'status' => $stat ?: 'any', 'method' => $meth ?: 'any',
                'from'   => $from, 'to' => $to,
            ],
            'qrUrl'   => $qrUrl,
        ]);
    }

    public function markPaid(Order $order)
    {
        // Flip both together as requested (DB might not have a 'paid' column, so we use only status)
        $order->status = 'completed';
        $order->save();

        return back()->with('success', "Order #{$order->id} marked paid.");
    }

    public function markUnpaid(Order $order)
    {
        $order->status = 'pending';
        $order->save();

        return back()->with('success', "Order #{$order->id} marked unpaid.");
    }

    public function setMethod(Order $order, Request $request)
    {
        $request->validate(['method' => ['required', 'in:CASH,QR']]);

        $order->method = $request->method;

        // If switching to CASH and no code exists yet, issue a code
        if ($order->method === 'CASH' && empty($order->cash_code)) {
            $order->cash_code = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        }

        $order->save();

        return back()->with('success', "Order #{$order->id} method updated.");
    }

    public function uploadQr(Request $request)
    {
        $request->validate(['qr' => ['required','image','mimes:png,jpg,jpeg','max:4096']]);

        $path = $request->file('qr')->storeAs('payments', 'qr.png', 'public');

        return back()->with('success', 'QR updated.');
    }
}
