"use client";

import { useState, useEffect } from "react";
import { providerSupabase } from "@/lib/supabase2";
import { toast } from "sonner";
import { Upload, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PortfolioData {
  id?: string;
  provider_id?: string;
  company_name: string;
  service_type: string;
  fees: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  description: string;
}

// Add type for better error handling
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
  name?: string;
}

export function Portfolio() {
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PortfolioData>({
    company_name: "",
    service_type: "",
    fees: "",
    location: "",
    contact_email: "",
    contact_phone: "",
    description: "",
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch existing portfolio data
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const { data: { session } } = await providerSupabase.auth.getSession();
        if (!session?.user) {
          toast.error('Please sign in to view your portfolio');
          return;
        }

        const { data: portfolio, error } = await providerSupabase
          .from('provider_portfolios')
          .select('*')
          .eq('provider_id', session.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No data found - this is normal for new users
            return;
          }
          throw error;
        }

        if (portfolio) {
          setPortfolioId(portfolio.id);
          setFormData({
            company_name: portfolio.company_name || '',
            service_type: portfolio.service_type || '',
            fees: portfolio.fees || '',
            location: portfolio.location || '',
            contact_email: portfolio.contact_email || '',
            contact_phone: portfolio.contact_phone || '',
            description: portfolio.description || '',
          });

          // Fetch portfolio images
          const { data: images, error: imagesError } = await providerSupabase
            .from('portfolio_images')
            .select('image_url')
            .eq('portfolio_id', portfolio.id);

          if (imagesError) {
            console.error('Error fetching images:', imagesError);
            toast.error('Failed to load portfolio images');
            return;
          }

          if (images && images.length > 0) {
            setPreviewUrls(images.map(img => img.image_url));
          }
        }
      } catch (error) {
        const supabaseError = error as SupabaseError;
        console.error('Error fetching portfolio:', {
          message: supabaseError.message,
          details: supabaseError.details,
          code: supabaseError.code
        });
        toast.error(supabaseError.message || 'Failed to load portfolio data');
      }
    };

    fetchPortfolioData();
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Validate file type and get extension
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `portfolio-images/${fileName}`

      // Upload to Supabase storage
      const { data, error: uploadError } = await providerSupabase.storage
        .from('portfolio-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!data?.path) {
        throw new Error('Upload successful but no file path returned');
      }

      // Get public URL
      const { data: { publicUrl } } = providerSupabase.storage
        .from('portfolio-images')
        .getPublicUrl(data.path);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      
      // Limit number of images (optional)
      const maxImages = 10;
      if (uploadedImages.length + filesArray.length > maxImages) {
        toast.error(`You can upload a maximum of ${maxImages} images`);
        return;
      }
      
      setUploadedImages((prev) => [...prev, ...filesArray]);
      
      // Create object URLs for preview
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    if (uploadedImages[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await providerSupabase.auth.getSession();
      if (!session?.user) {
        toast.error('Please sign in to update your portfolio');
        return;
      }

      // First create/update portfolio to get the ID
      const portfolioData = {
        provider_id: session.user.id,
        ...formData
      };

      let currentPortfolioId = portfolioId;

      if (portfolioId) {
        // Update existing portfolio
        const { error: updateError } = await providerSupabase
          .from('provider_portfolios')
          .update(portfolioData)
          .eq('id', portfolioId);

        if (updateError) {
          console.error('Portfolio update error:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details
          });
          throw new Error(`Failed to update portfolio: ${updateError.message}`);
        }
      } else {
        // Create new portfolio
        const { data, error: insertError } = await providerSupabase
          .from('provider_portfolios')
          .insert([portfolioData])
          .select()
          .single();

        if (insertError) {
          console.error('Portfolio creation error:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details
          });
          throw new Error(`Failed to create portfolio: ${insertError.message}`);
        }
        
        if (!data?.id) {
          throw new Error('Portfolio created but no ID returned');
        }
        
        setPortfolioId(data.id);
        currentPortfolioId = data.id;
      }

      // Then upload images and create records
      if (uploadedImages.length > 0 && currentPortfolioId) {
        // Use Promise.allSettled to handle multiple uploads
        const uploadResults = await Promise.allSettled(
          uploadedImages.map(async (file) => {
            try {
              const publicUrl = await uploadImage(file);
              
              // Insert image record in the database
              const { error: imageError } = await providerSupabase
                .from('portfolio_images')
                .insert({
                  portfolio_id: currentPortfolioId,
                  image_url: publicUrl
                });

              if (imageError) {
                throw new Error(`Failed to save image: ${imageError.message}`);
              }

              return publicUrl;
            } catch (error) {
              throw error;
            }
          })
        );

        // Handle any failed uploads
        const failedUploads = uploadResults.filter(result => result.status === 'rejected');
        if (failedUploads.length > 0) {
          // Log detailed error information for each failed upload
          failedUploads.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`Failed upload ${index + 1}:`, {
                error: result.reason,
                message: result.reason instanceof Error ? result.reason.message : 'Unknown error',
                name: result.reason instanceof Error ? result.reason.name : 'UnknownError',
                stack: result.reason instanceof Error ? result.reason.stack : undefined
              });
            }
          });
          
          // Show user-friendly error message
          const errorMessages = failedUploads
            .map(result => (result.reason instanceof Error ? result.reason.message : 'Unknown error'))
            .join('\n');
          
          toast.error(`${failedUploads.length} images failed to upload:\n${errorMessages}`);
        }
        
        // Clear uploaded images after successful upload
        setUploadedImages([]);
      }

      toast.success('Portfolio updated successfully');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      console.error('Portfolio submission error:', {
        type: error instanceof Error ? error.constructor.name : typeof error,
        message: errorMessage,
        error
      });
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceTypes = [
    "Photography",
    "Videography",
    "Event Planning",
    "Catering",
    "Venue Management",
    "Entertainment",
    "Decoration",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight font-aeonik-medium">Your Portfolio</h2>
        <Button className="font-aeonik" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Add New Work
        </Button>
      </div>
  
      <div className="grid gap-6 md:grid-cols-2">
        {/* Portfolio Info Card */}
        <Card className="md:row-span-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Service Provider Details</CardTitle>
            <CardDescription>Update your service information</CardDescription>
          </CardHeader>
  
          {isSuccess ? (
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium">Update Successful!</h3>
              <p className="text-muted-foreground mt-2 text-center">
                Your service information has been updated successfully.
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="Your company name"
                      className="font-aeonik"
                      required
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type</Label>
                    <Select
                      value={formData.service_type}
                      onValueChange={(value) => handleSelectChange(value, "service_type")}
                    >
                      <SelectTrigger className="w-full font-aeonik">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fees">Service Fees</Label>
                      <Input
                        id="fees"
                        name="fees"
                        value={formData.fees}
                        onChange={handleInputChange}
                        placeholder="Your service fees"
                        className="font-aeonik"
                        required
                      />
                    </div>
  
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Your service location"
                        className="font-aeonik"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email Address</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder="Your email address"
                        className="font-aeonik"
                        required
                      />
                    </div>
  
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Phone Number</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                        className="font-aeonik"
                        required
                      />
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="description">Service Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your services"
                      className="font-aeonik min-h-[120px]"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full font-aeonik">
                  {isSubmitting ? "Updating..." : "Update Portfolio"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
  
        {/* Portfolio Images Grid */}
        <Card className="md:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Portfolio Images</CardTitle>
            <CardDescription>Showcase your best work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square group">
                  <img src={url} alt={`Portfolio image ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-square hover:bg-accent cursor-pointer transition-colors">
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-aeonik">Add Image</span>
                <input 
                  type="file" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp" 
                  multiple 
                />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}