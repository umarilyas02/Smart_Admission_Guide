import { NextResponse } from 'next/server';
import { testConnection, query } from '@/lib/db';

export async function GET() {
  try {
    // Test basic connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed' 
        },
        { status: 500 }
      );
    }

    // Test table existence
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);

    // Get row counts for each table
    const counts = {};
    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(countResult.rows[0].count);
      } catch (error) {
        counts[table] = 'error';
      }
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      database: {
        connected: true,
        tables: tables.length,
        tableList: tables,
        rowCounts: counts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
