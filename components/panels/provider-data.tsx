"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { providerSupabase } from "@/lib/supabase2";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProviderPortfolio {
  id: string;
  provider_id: string;
  company_name: string;
  service_type: string;
  fees: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function ProviderData() {
  const [providers, setProviders] = useState<ProviderPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting to fetch provider portfolios...');
        
        // First, let's check if we can connect to Supabase
        const { data: testData, error: testError } = await providerSupabase
          .from('provider_portfolios')
          .select('count')
          .limit(1);

        console.log('Connection test result:', { testData, testError });

        if (testError) {
          console.error('Connection test failed:', testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        // Now fetch the actual data
        const { data, error: fetchError } = await providerSupabase
          .from('provider_portfolios')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Fetch result:', { data, error: fetchError });

        if (fetchError) {
          console.error('Fetch error details:', {
            message: fetchError.message,
            code: fetchError.code,
            details: fetchError.details,
            hint: fetchError.hint
          });
          
          if (fetchError.code === '42501') {
            throw new Error('Permission denied. Please check your RLS policies.');
          }
          
          throw new Error(`Failed to fetch providers: ${fetchError.message}`);
        }

        if (!data) {
          throw new Error('No data received from the server');
        }

        console.log('Successfully fetched providers:', data);
        setProviders(data);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in fetchProviders:', error);
        setError(errorMessage);
        toast.error(`Failed to load providers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Provider Portfolios Data</h2>
        {loading && <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />}
      </div>

      {error ? (
        <Card className="p-6">
          <CardContent>
            <p className="text-red-500">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This could be due to:
              <ul className="list-disc pl-4 mt-2">
                <li>Missing RLS policies</li>
                <li>Database connection issues</li>
                <li>Table not existing</li>
              </ul>
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="p-6">
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : providers.length === 0 ? (
        <Card className="p-6">
          <CardContent>
            <p className="text-muted-foreground">No provider portfolios found in the database.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This means the table exists but doesn't contain any data yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Provider Portfolios</CardTitle>
            <CardDescription>
              Showing {providers.length} provider portfolio{providers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.company_name}</TableCell>
                      <TableCell>{provider.service_type}</TableCell>
                      <TableCell>{provider.location}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{provider.contact_email}</div>
                          <div className="text-muted-foreground">{provider.contact_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{provider.fees}</TableCell>
                      <TableCell>
                        {new Date(provider.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProviderData; 