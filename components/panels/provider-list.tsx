"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Loader2, MessageSquare } from "lucide-react";
import { providerSupabase } from "@/lib/supabase2";
import { toast } from "sonner";
import { ProviderImages } from "./provider-images";
import { useRouter } from "next/navigation";

interface Provider {
  id: string;
  provider_id: string;
  company_name: string;
  service_type: string;
  fees: string;
  location: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export function EventProvidersList() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting to fetch providers...');
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL2);
        
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

    // Set up real-time subscription
    const subscription = providerSupabase
      .channel('provider_portfolios_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'provider_portfolios'
        },
        (payload) => {
          console.log('Change received:', payload);
          fetchProviders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // For debugging, let's also log the current state
  useEffect(() => {
    console.log('Current providers state:', providers);
  }, [providers]);

  const handleContactProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    router.push(`/messages?provider=${provider.provider_id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Service Providers</h2>
        {loading && <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />}
      </div>

      {error ? (
        <Card className="p-6">
          <CardContent>
            <p className="text-red-500">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This could be due to:
              <ul className="list-disc pl-4 mt-2">
                <li>Missing or incorrect Supabase configuration</li>
                <li>Missing RLS policies</li>
                <li>Database connection issues</li>
                <li>Table not existing</li>
              </ul>
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden opacity-50">
              <CardHeader>
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-1/4 bg-gray-200 rounded animate-pulse mt-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <Card className="p-6 text-center">
          <CardContent>
            <p className="text-muted-foreground">No service providers found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This could mean either there are no providers in the database or there was an issue fetching the data.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{provider.company_name}</CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {provider.service_type}
                </Badge>
                <CardDescription className="mt-2 line-clamp-2">
                  {provider.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {provider.location}
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4" />
                    {provider.contact_phone}
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4" />
                    {provider.contact_email}
                  </div>
                  <div className="text-sm font-medium">
                    {provider.fees}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleContactProvider(provider)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Provider
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventProvidersList;