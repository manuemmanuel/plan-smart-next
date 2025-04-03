"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { providerSupabase } from "@/lib/supabase2";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PortfolioImage {
  id: string;
  portfolio_id: string;
  image_url: string;
  created_at: string;
}

interface ProviderImagesProps {
  portfolioId: string;
}

export function ProviderImages({ portfolioId }: ProviderImagesProps) {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting to fetch images for portfolio:', portfolioId);
        
        // First, let's check if we can connect to Supabase
        const { data: testData, error: testError } = await providerSupabase
          .from('portfolio_images')
          .select('count')
          .eq('portfolio_id', portfolioId)
          .limit(1);

        console.log('Connection test result:', { testData, testError });

        if (testError) {
          console.error('Connection test failed:', testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        // Now fetch the actual data
        const { data, error: fetchError } = await providerSupabase
          .from('portfolio_images')
          .select('*')
          .eq('portfolio_id', portfolioId)
          .order('created_at', { ascending: false });

        console.log('Fetch result:', { data, error: fetchError });

        if (fetchError) {
          console.error('Fetch error details:', {
            message: fetchError.message,
            code: fetchError.code,
            details: fetchError.details,
            hint: fetchError.hint
          });
          throw new Error(`Failed to fetch images: ${fetchError.message}`);
        }

        if (!data) {
          throw new Error('No data received from the server');
        }

        console.log('Successfully fetched images:', data);
        setImages(data);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in fetchImages:', error);
        setError(errorMessage);
        toast.error(`Failed to load images: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

    // Set up real-time subscription
    const subscription = providerSupabase
      .channel('portfolio_images_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'portfolio_images',
          filter: `portfolio_id=eq.${portfolioId}`
        },
        (payload) => {
          console.log('Change received:', payload);
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [portfolioId]);

  // For debugging, let's also log the current state
  useEffect(() => {
    console.log('Current images state for portfolio', portfolioId, ':', images);
  }, [images, portfolioId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-500 text-sm">{error}</p>
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Debug Information:</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1">
            {JSON.stringify({ error, images: images.length, portfolioId }, null, 2)}
          </pre>
        </div>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="p-4 text-center">
        <p className="text-muted-foreground text-sm">No images available</p>
        <p className="text-xs text-muted-foreground mt-1">
          This could mean either there are no images for this portfolio or there was an issue fetching the data.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {images.map((image) => (
        <div key={image.id} className="relative aspect-square">
          <img
            src={image.image_url}
            alt={`Portfolio image for ${portfolioId}`}
            className="object-cover w-full h-full rounded-md"
          />
        </div>
      ))}
    </div>
  );
} 