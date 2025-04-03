import { STABILITY_HOST, STABILITY_KEY } from "@/lib/constants";

export async function generateVenueImage(venueDescription: string) {
  try {
    const response = await fetch(`${STABILITY_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${STABILITY_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: `Professional venue photography: ${venueDescription}. Photorealistic, architectural photography, detailed lighting, high-end interior design, 8k quality.`,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 50,
        samples: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const generatedImage = responseData.artifacts[0].base64;
    const imageUrl = `data:image/png;base64,${generatedImage}`;

    return {
      success: true,
      imageUrl,
      requestId: responseData.artifacts[0].seed
    };

  } catch (error) {
    console.error("Venue generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate venue image"
    };
  }
}