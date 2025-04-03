const STABILITY_KEY = process.env.NEXT_PUBLIC_STABILITY_KEY;
const STABILITY_HOST = "https://api.stability.ai/v2beta";

interface GenerationParams {
  prompt: string;
  image?: File;
  mask?: File;
  [key: string]: any;
}

async function sendGenerationRequest(
  endpoint: string,
  params: GenerationParams,
  files?: FormData
): Promise<Response> {
  const headers = {
    Accept: "image/*",
    Authorization: `Bearer ${STABILITY_KEY}`,
  };

  const formData = files || new FormData();
  
  if (params.image) {
    formData.append("image", params.image);
  }
  if (params.mask) {
    formData.append("mask", params.mask);
  }
  
  // Add other params to formData
  Object.entries(params).forEach(([key, value]) => {
    if (key !== "image" && key !== "mask") {
      formData.append(key, value);
    }
  });

  const response = await fetch(`${STABILITY_HOST}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response;
}

async function sendAsyncGenerationRequest(
  endpoint: string,
  params: GenerationParams,
  files?: FormData
): Promise<Blob> {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${STABILITY_KEY}`,
  };

  const formData = files || new FormData();
  
  if (params.image) {
    formData.append("image", params.image);
  }
  if (params.mask) {
    formData.append("mask", params.mask);
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (key !== "image" && key !== "mask") {
      formData.append(key, value);
    }
  });

  const response = await fetch(`${STABILITY_HOST}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const responseData = await response.json();
  const generationId = responseData.id;

  if (!generationId) {
    throw new Error("Expected id in response");
  }

  // Poll for results
  const timeout = parseInt(process.env.NEXT_PUBLIC_WORKER_TIMEOUT || "500");
  const start = Date.now();
  let statusCode = 202;
  let lastResponse: Response | null = null;

  while (statusCode === 202) {
    console.log(`Polling results at ${STABILITY_HOST}/results/${generationId}`);
    
    lastResponse = await fetch(`${STABILITY_HOST}/results/${generationId}`, {
      headers: {
        ...headers,
        Accept: "*/*",
      },
    });

    if (!lastResponse.ok) {
      throw new Error(`HTTP ${lastResponse.status}: ${await lastResponse.text()}`);
    }

    statusCode = lastResponse.status;
    
    if (statusCode === 202) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
      
      if (Date.now() - start > timeout * 1000) {
        throw new Error(`Timeout after ${timeout} seconds`);
      }
    }
  }

  if (!lastResponse) {
    throw new Error('No response received');
  }

  return await lastResponse.blob();
}

export { sendGenerationRequest, sendAsyncGenerationRequest };