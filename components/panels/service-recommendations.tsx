"use client"

import { useState, useEffect } from "react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, RefreshCcw, Loader2 as LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

interface TrendingItem {
  id: number
  title: string
  description: string
  image: string
  trend_score: number
  isLoading: boolean
}

interface TrendingData {
  [key: string]: TrendingItem[]
}

const mockData: TrendingData = {
  photography: [],
  decor: [],
  food: []
}

const generateTrendTitle = (category: string) => {
  const titleTemplates = {
    photography: [
      "Romantic Wedding Moments",
      "Elegant Bridal Portraits",
      "Timeless Wedding Memories",
      "Dreamy Wedding Photography",
      "Captivating Couples"
    ],
    decor: [
      "Elegant Design",
      "Stylish Arrangement",
      "Creative Setup",
      "Inspiring Decoration",
      "Aesthetic Masterpiece"
    ],
    food: [
      "Culinary Delight",
      "Gourmet Inspiration",
      "Delicious Creation",
      "Flavor Sensation",
      "Mouth-Watering Presentation"
    ]
  };

  const templates = titleTemplates[category as keyof typeof titleTemplates] || titleTemplates.photography;
  return templates[Math.floor(Math.random() * templates.length)];
}

const generateImageDescription = async (imageUrl: string, category: string): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API key is missing, using fallback description");
      return getFallbackDescription(category);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a one-line creative description for this ${category} image, focusing on its aesthetic appeal and emotional impact. Keep it concise and engaging.`
            }, {
              inline_data: {
                mime_type: "image/jpeg",
                data: await fetch(imageUrl)
                  .then(res => res.blob())
                  .then(blob => {
                    return new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                    });
                  })
              }
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.warn("Failed to generate description with Gemini API, using fallback");
      return getFallbackDescription(category);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text || getFallbackDescription(category);
  } catch (error) {
    console.warn('Error generating description:', error);
    return getFallbackDescription(category);
  }
}

const getFallbackDescription = (category: string): string => {
  const fallbackDescriptions = {
    photography: [
      "A timeless moment captured with elegance and grace",
      "Capturing the essence of love and celebration",
      "A beautiful memory frozen in time",
      "Elegant photography that tells a story",
      "A moment of pure emotion and beauty",
      "Artistic vision meets technical perfection",
      "Every frame tells a unique love story",
      "Professional expertise meets creative passion",
      "Capturing the magic of your special day",
      "Photography that speaks to the heart",
      "Masterful composition and lighting",
      "A perfect blend of style and substance",
      "Images that evoke deep emotions",
      "Timeless elegance in every shot",
      "Professional artistry at its finest"
    ],
    decor: [
      "Elegant design that transforms any space",
      "Creative arrangements that inspire",
      "A perfect blend of style and sophistication",
      "Decor that creates lasting memories",
      "Beautiful details that make the moment special",
      "Innovative design meets classic elegance",
      "Transformative decor that wows guests",
      "Every detail tells a story",
      "Stylish arrangements that captivate",
      "Decor that elevates the atmosphere",
      "Creative touches that make it unique",
      "Elegant solutions for every space",
      "Design that brings dreams to life",
      "Attention to detail in every element",
      "Decor that sets the perfect mood"
    ],
    food: [
      "A culinary masterpiece that delights the senses",
      "Exquisite flavors that create unforgettable moments",
      "Beautiful presentation meets delicious taste",
      "A feast for both the eyes and the palate",
      "Gourmet creations that elevate any celebration",
      "Artistic plating meets exceptional taste",
      "Culinary expertise that impresses",
      "Fresh ingredients, masterful preparation",
      "A symphony of flavors and textures",
      "Gourmet dining at its finest",
      "Creative cuisine that surprises and delights",
      "Perfectly balanced flavors and presentation",
      "Culinary artistry that wows guests",
      "A taste experience to remember",
      "Innovative dishes that inspire"
    ]
  };

  const descriptions = fallbackDescriptions[category as keyof typeof fallbackDescriptions] || fallbackDescriptions.photography;
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

interface ImageWithDescription {
  image: string;
  description: string;
  isLoading: boolean;
}

export function ServiceRecommendationsPanel() {
  const [trendingData, setTrendingData] = useState<TrendingData>(mockData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("photography")

  useEffect(() => {
    fetchTrendingData()
  }, [])

  const fetchLatestImages = async (category: string) => {
    try {
      if (!PIXABAY_API_KEY) {
        throw new Error("Pixabay API key is missing")
      }

      const searchQueries: { [key: string]: string } = {
        photography: "wedding bride groom elegant romantic photoshoot professional",
        decor: "modern event decorations",
        food: "gourmet event catering",
      }

      const query = searchQueries[category] || category
      const randomPage = Math.floor(Math.random() * 10) + 1
      const timestamp = Date.now()

      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=10&page=${randomPage}&timestamp=${timestamp}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} images`)
      }

      const data = await response.json()
      const images = data.hits.map((item: any) => ({
        image: item.webformatURL,
        tags: item.tags.split(", "),
      }))

      // Initialize images with loading state
      const imagesWithLoadingState = images.map((img: any) => ({
        ...img,
        description: '',
        isLoading: true
      }))

      // Generate descriptions for each image
      const imagesWithDescriptions = await Promise.all(
        imagesWithLoadingState.map(async (img: ImageWithDescription) => {
          try {
            const description = await generateImageDescription(img.image, category)
            return {
              ...img,
              description,
              isLoading: false
            }
          } catch (error) {
            console.error('Error generating description:', error)
            return {
              ...img,
              description: 'A beautiful moment captured in time',
              isLoading: false
            }
          }
        })
      )

      return imagesWithDescriptions
    } catch (error) {
      console.error(`Error fetching ${category} images:`, error)
      return []
    }
  }

  const fetchTrendingData = async (forceCategory?: string) => {
    try {
      setLoading(true)
      setError(null)

      const categories = forceCategory ? [forceCategory] : ["photography", "decor", "food"]
      const results: TrendingData = {}
      const baseId = Date.now()

      await Promise.all(
        categories.map(async (category) => {
          const images = await fetchLatestImages(category)

          results[category] = images.map((imageData, index) => ({
            id: baseId + index + Math.random(),
            title: generateTrendTitle(category),
            description: imageData.description,
            image: imageData.image || "/images/placeholder.jpg",
            trend_score: Math.floor(Math.random() * 30) + 70,
            isLoading: imageData.isLoading
          }))
        })
      )

      // If forcing a specific category, only update that category
      if (forceCategory) {
        setTrendingData(prevData => ({
          ...prevData,
          [forceCategory]: results[forceCategory]
        }))
      } else {
        setTrendingData(results)
      }

      toast.success("Recommendations refreshed!")
    } catch (error) {
      console.error("Error fetching trending ideas:", error)
      toast.error("Failed to load recommendations")
      setError("Failed to load recommendations")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchTrendingData(activeCategory)
  }

  if (loading) {
    return <div className="text-center py-10">Loading trending ideas...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>
  }

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Latest Trending Ideas</h2>
        <div className="flex gap-4">
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-600 border-rose-200">
            <TrendingUp className="h-4 w-4" />
            Updated Today
          </Badge>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-1">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="photography" 
        className="w-full"
        onValueChange={(value) => setActiveCategory(value)}
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="photography">Photography</TabsTrigger>
          <TabsTrigger value="decor">Decorations</TabsTrigger>
          <TabsTrigger value="food">Food & Catering</TabsTrigger>
        </TabsList>

        {Object.entries(trendingData).map(([category, items]) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      fallbackSrc="/images/placeholder.jpg"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-rose-500">Trending {item.trend_score}%</Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Generating description...</span>
                      </div>
                    ) : (
                      <CardDescription className="text-gray-600 line-clamp-2">{item.description}</CardDescription>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}