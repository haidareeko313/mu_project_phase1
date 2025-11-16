<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    {{-- CSRF token for AJAX / fetch requests --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- React fast-refresh preamble (REQUIRED for @vitejs/plugin-react) --}}
    @viteReactRefresh

    {{-- Your assets (make sure the JS entry is app.jsx) --}}
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    @inertiaHead
</head>
<body class="font-sans antialiased bg-slate-900 text-slate-100">
    @inertia
</body>
</html>
