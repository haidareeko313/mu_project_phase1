<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Income Statement</title>
  <style>
    body{font-family:DejaVu Sans, sans-serif; font-size:12px; color:#111827;}
    h2{margin:0 0 8px 0;}
    .muted{color:#6b7280;}
    .box{border:1px solid #e5e7eb; padding:8px; margin-bottom:8px;}
    table{width:100%; border-collapse:collapse; margin-top:8px;}
    th,td{border:1px solid #e5e7eb; padding:6px;}
    th{background:#f3f4f6; text-align:left;}
    .right{text-align:right;}
  </style>
</head>
<body>
  <h2>Income Statement</h2>
  <div class="muted">Generated at {{ $generated_at->format('Y-m-d H:i') }}</div>

  <div class="box">
    <strong>Filters:</strong>
    From: {{ $filters['from'] ?? '—' }},
    To: {{ $filters['to'] ?? '—' }},
    Method: {{ $filters['method'] ?? 'All' }},
    Paid: {{ $filters['paid'] ?? 'All' }},
    Search: {{ $filters['q'] ?? '—' }}
  </div>

  <div class="box">
    <strong>Summary</strong><br>
    Orders: {{ $summary['orders'] }} • Qty: {{ $summary['qty'] }}<br>
    Total: {{ number_format($summary['total'],2) }} •
    Paid: {{ number_format($summary['paid'],2) }} •
    Unpaid: {{ number_format($summary['unpaid'],2) }}
    @if(!empty($summary['byMethod']))
      <br>By Method:
      @foreach($summary['byMethod'] as $m => $row)
        [{{ $m }}: {{ $row['orders'] }} orders, Qty {{ $row['qty'] }}, {{ number_format($row['total'],2) }}]
      @endforeach
    @endif
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>User</th>
        <th>Status</th>
        <th>Paid</th>
        <th>Method</th>
        <th class="right">Qty</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($orders as $o)
      <tr>
        <td>{{ $o->id }}</td>
        <td>{{ \Carbon\Carbon::parse($o->created_at)->format('Y-m-d H:i') }}</td>
        <td>{{ $o->user_name }}</td>
        <td>{{ $o->status ?? 'pending' }}</td>
        <td>{{ (isset($o->paid_flag) && (int)$o->paid_flag === 1) || (isset($o->paid_at) && $o->paid_at) ? 'Yes' : 'No' }}</td>
        <td>{{ strtoupper($o->method ?? 'QR') }}</td>
        <td class="right">{{ (int)$o->qty }}</td>
        <td class="right">{{ number_format($o->total,2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
