<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    /**
     * Show the Analytics dashboard page.
     */
    public function index()
    {
        return Inertia::render('Analytics/Index');
    }

    /**
     * Handle chat requests from the frontend.
     * This will call the Python analytics service and return its JSON response.
     */
    public function chat(Request $request)
    {
        // Accept message + optional window_days from the frontend
        $data = $request->validate([
            'message'      => ['required', 'string', 'max:2000'],
            'window_days'  => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        try {
            $pythonUrl = 'http://127.0.0.1:8001/analyze';

            // Always send the message, optionally send window_days if present
            $payload = [
                'message' => $data['message'],
            ];

            if (isset($data['window_days'])) {
                $payload['window_days'] = (int) $data['window_days'];
            }

            $response = Http::timeout(20)->post($pythonUrl, $payload);

            if ($response->failed()) {
                return response()->json([
                    'assistant_message' => 'Sorry, the analytics service returned an error.',
                    'kpis'              => [],
                    'visualizations'    => [],
                    'alerts'            => [],
                    'error'             => $response->body(),
                ], 500);
            }

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json([
                'assistant_message' => 'Sorry, I could not reach the analytics service. Please make sure it is running.',
                'kpis'              => [],
                'visualizations'    => [],
                'alerts'            => [],
                'error'             => $e->getMessage(),
            ], 500);
        }
    }
}
