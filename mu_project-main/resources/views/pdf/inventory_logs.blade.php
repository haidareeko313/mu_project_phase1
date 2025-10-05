<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Inventory Logs</title>
  <style>
    body{font-family:DejaVu Sans, sans-serif; font-size:12px; color:#111827;}
    h2{margin:0 0 8px 0;}
    .muted{color:#6b7280;}
    .box{border:1px solid #e5e7eb; padding:8px; margin-bottom:8px;}
    table{width:100%; border-collapse:collapse; margin-top:8px;}
    th,td{border:1px solid #e5e7eb; padding:6px;}
    th{background:#f3f4f6; text-align:left;}
    .pos{color:#059669;}
    .neg{color:#dc2626;}
  </style>
</head>
<body>
  <h2>Inventory Logs</h2>
  <div class="muted">Generated at {{ $generated_at->format('Y-m-d H:i') }}</div>

  <div class="box">
    <strong>Filters:</strong>
    From: {{ $filters['from'] ?? '—' }},
    To: {{ $filters['to'] ?? '—' }},
    Sign: {{ $filters['sign'] ?? 'all' }},
    Range: {{ $filters['min'] ?? '—' }}..{{ $filters['max'] ?? '—' }},
    Search: {{ $filters['q'] ?? '—' }}
    <br>
    <strong>Net change:</strong> {{ $net }}
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Item</th>
        <th>Change</th>
        <th>Reason</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      @foreach ($logs as $r)
      <tr>
        <td>{{ $r->id }}</td>
        <td>{{ $r->item_name }}</td>
        <td class="{{ (int)$r->change_val >= 0 ? 'pos' : 'neg' }}">{{ $r->change_val }}</td>
        <td>{{ $r->reason_val }}</td>
        <td>{{ \Carbon\Carbon::parse($r->created_at)->format('Y-m-d H:i') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
