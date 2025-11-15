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
        // We just render the page.
        // The chat + KPIs will be filled by the /analytics/chat endpoint.
        return Inertia::render('Analytics/Index');
    }

    /**
     * Handle chat requests from the frontend.
     * This will call the Python analytics service and return its JSON response.
     */
    public function chat(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        try {
            // URL of the Python FastAPI service
            $pythonUrl = 'http://127.0.0.1:8001/analyze';

            $response = Http::timeout(10)->post($pythonUrl, [
                'message' => $data['message'],
            ]);

            if ($response->failed()) {
                return response()->json([
                    'assistant_message' => 'Sorry, the analytics service returned an error.',
                    'kpis' => [],
                    'visualizations' => [],
                    'error' => $response->body(),
                ], 500);
            }

            // Return exactly what Python returned
            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json([
                'assistant_message' => 'Sorry, I could not reach the analytics service. Please make sure it is running.',
                'kpis' => [],
                'visualizations' => [],
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
