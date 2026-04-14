import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Asset Management API
 * Handles listing and (future) CRUD operations for IoT equipment.
 */

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { tagId: 'asc' }
    });

    return NextResponse.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('[Asset API] Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const asset = await prisma.asset.create({
      data: {
        tagId: data.tagId,
        name: data.name,
        type: data.type,
        location: data.location,
        powerKw: parseFloat(data.powerKw) || 0,
        foundationType: data.foundationType || 'rigid',
        vibLimitWarning: parseFloat(data.vibLimitWarning) || null,
        vibLimitFault: parseFloat(data.vibLimitFault) || null,
      }
    });

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('[Asset API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}
