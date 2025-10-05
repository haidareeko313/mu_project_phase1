<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Receipt</title>
  <style>
    body{font-family:DejaVu Sans, sans-serif; font-size:12px; color:#1f2937;}
    .header{display:flex; justify-content:space-between; margin-bottom:8px;}
    .muted{color:#6b7280;}
    table{width:100%; border-collapse:collapse; margin-top:8px;}
    th,td{border:1px solid #e5e7eb; padding:6px;}
    th{background:#f3f4f6; text-align:left;}
    .right{text-align:right;}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0;">Cafeteria Receipt</h2>
      <div class="muted">Order #{{ $order->id }}</div>
    </div>
    <div class="muted">
      Printed: {{ $printed->format('Y-m-d H:i') }}<br>
      Created: {{ \Carbon\Carbon::parse($order->created_at)->format('Y-m-d H:i') }}
    </div>
  </div>

  <div>
    <strong>Customer:</strong> {{ $order->user_name ?? '—' }}<br>
    <strong>Email:</strong> {{ $order->user_email ?? '—' }}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="right">Qty</th>
        <th class="right">Unit</th>
        <th class="right">Line Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($items as $it)
      <tr>
        <td>{{ $it->name }}</td>
        <td class="right">{{ (int)$it->quantity }}</td>
        <td class="right">{{ number_format($it->unit_price, 2) }}</td>
        <td class="right">{{ number_format($it->line_total, 2) }}</td>
      </tr>
      @endforeach
      <tr>
        <td colspan="3" class="right"><strong>Total</strong></td>
        <td class="right"><strong>{{ number_format($total, 2) }}</strong></td>
      </tr>
    </tbody>
  </table>

  <p class="muted" style="margin-top:10px">Thank you for your purchase.</p>
</body>
</html>
