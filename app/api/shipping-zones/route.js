// app/api/shipping-zones/route.js
import { createClient } from '@sanity/client';
import { NextResponse } from 'next/server';

// Create server-side Sanity client
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false, // Don't use CDN for server-side requests
  apiVersion: '2023-10-01',
  token: process.env.SANITY_API_TOKEN, // Server-side token
});

export async function GET() {
  try {
    console.log('🔍 API Route: Starting shipping zones fetch...');
    console.log('📡 Sanity Config:', {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      hasToken: !!process.env.SANITY_API_TOKEN
    });

    // First, check if any shipping zones exist
    const allZones = await serverClient.fetch(`*[_type == 'shippingZone']`);
    console.log('📋 Total shipping zones found:', allZones.length);

    if (allZones.length === 0) {
      console.warn('⚠️ No shipping zones found in database');
      return NextResponse.json({
        success: false,
        message: 'No shipping zones found in database',
        data: []
      });
    }

    // Fetch active shipping zones
    const shippingZones = await serverClient.fetch(`
      *[_type == 'shippingZone' && isActive == true] | order(state asc) {
        _id,
        state,
        stateCode,
        shippingCost,
        estimatedDays,
        isActive
      }
    `);

    console.log('✅ Active shipping zones fetched:', shippingZones.length);

    if (shippingZones.length === 0) {
      console.warn('⚠️ No active shipping zones found');
      return NextResponse.json({
        success: false,
        message: 'No active shipping zones available',
        data: [],
        debug: {
          totalZones: allZones.length,
          activeZones: 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: shippingZones,
      count: shippingZones.length
    });

  } catch (error) {
    console.error('❌ Shipping zones API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch shipping zones',
      error: error.message,
      debug: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        hasToken: !!process.env.SANITY_API_TOKEN,
        errorType: error.constructor.name
      }
    }, { status: 500 });
  }
}