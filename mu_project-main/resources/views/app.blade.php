<!DOCTYPE html>
<html class="dark" lang="{{ str_replace('_','-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    {{-- Ziggy routes for route() in React --}}
    @routes

    {{-- Vite / Inertia --}}
    @viteReactRefresh
    @vite(['resources/js/app.jsx']) {{-- CSS is imported by app.jsx --}}
    @inertiaHead
  </head>
  <body class="antialiased">
    @inertia
  </body>
</html>
