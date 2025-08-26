'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useDocumentTitle } from '@/hooks/use-document-title';

interface ConnectionStatus {
  supabase: boolean;
  database: boolean;
  auth: boolean;
}

export default function TestConnectionPage() {
  useDocumentTitle('Test Connection - EuroFolio');
  
  const [status, setStatus] = useState<ConnectionStatus>({
    supabase: false,
    database: false,
    auth: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnections = async () => {
      const newStatus: ConnectionStatus = {
        supabase: false,
        database: false,
        auth: false,
      };

      try {
        // Test Supabase client connection
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        newStatus.supabase = !error;
        newStatus.database = !error;
      } catch (error) {
        console.error('Database connection test failed:', error);
      }

      try {
        // Test Auth connection
        const { data: { session }, error } = await supabase.auth.getSession();
        newStatus.auth = !error;
      } catch (error) {
        console.error('Auth connection test failed:', error);
      }

      setStatus(newStatus);
      setLoading(false);
    };

    testConnections();
  }, []);

  return (
    <DashboardLayout
      title="Connection Test"
      description="Testing connections to Supabase services"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Supabase Client
            </CardTitle>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : status.supabase ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status.supabase ? "default" : "destructive"}>
                {loading ? "Testing..." : status.supabase ? "Connected" : "Failed"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Supabase JavaScript client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Database
            </CardTitle>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : status.database ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status.database ? "default" : "destructive"}>
                {loading ? "Testing..." : status.database ? "Connected" : "Failed"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              PostgreSQL database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Authentication
            </CardTitle>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : status.auth ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status.auth ? "default" : "destructive"}>
                {loading ? "Testing..." : status.auth ? "Connected" : "Failed"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Supabase Auth service
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Current environment configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">NEXT_PUBLIC_APP_NAME:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {env.NEXT_PUBLIC_APP_NAME || 'EuroFolio (default)'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}