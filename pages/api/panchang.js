// pages/api/panchang.js
import { URLSearchParams } from 'url';

// Debug logging function
function debugLog(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Panchang API Debug]', ...args);
  }
}

// Sample data for fallback
const getSamplePanchangamData = (date, latitude, longitude) => ({
  datetime: date + "T00:00:00+05:30",
  coordinates: { latitude, longitude },
  vaara: "புதன்",
  sunrise: "06:15:00 +0530",
  sunset: "18:30:00 +0530",
  nakshatra: [
    {
      name: "அஸ்வினி",
      start: "00:00:00 +0530",
      end: "08:45:00 +0530"
    },
    {
      name: "பரணி",
      start: "08:45:00 +0530",
      end: "23:59:59 +0530"
    }
  ],
  tithi: [
    {
      name: "சஷ்டி",
      start: "00:00:00 +0530",
      end: "14:20:00 +0530"
    },
    {
      name: "சப்தமி",
      start: "14:20:00 +0530",
      end: "23:59:59 +0530"
    }
  ],
  karana: [
    {
      name: "பவ",
      start: "00:00:00 +0530",
      end: "13:45:00 +0530"
    },
    {
      name: "பாலவ",
      start: "13:45:00 +0530",
      end: "23:59:59 +0530"
    }
  ],
  yoga: [
    {
      name: "சித்த",
      start: "00:00:00 +0530",
      end: "16:30:00 +0530"
    },
    {
      name: "சாத்தியம்",
      start: "16:30:00 +0530",
      end: "23:59:59 +0530"
    }
  ],
  muhurta: {
    rahu: {
      start: "09:15:00 +0530",
      end: "10:45:00 +0530"
    },
    yama: {
      start: "13:30:00 +0530",
      end: "15:00:00 +0530"
    },
    gulika: {
      start: "06:15:00 +0530",
      end: "07:45:00 +0530"
    }
  }
});

// Get OAuth token from Prokerala
async function getProkeralaAccessToken() {
  debugLog('Attempting to get OAuth token');
  
  try {
    const tokenResponse = await fetch('https://api.prokerala.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': process.env.PROKERALA_CLIENT_ID,
        'client_secret': process.env.PROKERALA_CLIENT_SECRET,
      }).toString(),
    });

    debugLog('Token Response Status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      debugLog('OAuth Error:', errorData);
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    debugLog('Access Token Retrieved Successfully');
    return tokenData.access_token;
  } catch (error) {
    debugLog('OAuth Token Retrieval Failed:', error.message);
    throw error;
  }
}

// Fetch Panchang data from Prokerala API
async function fetchPanchangamFromProkerala(date, latitude, longitude, ayanamsa = 1) {
  debugLog('Fetching Panchangam Data', { date, latitude, longitude, ayanamsa });
  
  try {
    const accessToken = await getProkeralaAccessToken();

    const apiUrl = new URL('https://api.prokerala.com/v2/astrology/panchang');
    apiUrl.searchParams.append('ayanamsa', ayanamsa);
    apiUrl.searchParams.append('coordinates', `${latitude},${longitude}`);
    apiUrl.searchParams.append('datetime', `${date}T00:00:00+05:30`);
    apiUrl.searchParams.append('la', 'ta'); // Tamil language

    debugLog('API Request URL:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    debugLog('API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      debugLog('API Error:', errorData);
      throw new Error('Failed to fetch panchangam data');
    }

    const data = await response.json();
    debugLog('Panchangam Data Retrieved:', JSON.stringify(data, null, 2));
    return data.data;
  } catch (error) {
    debugLog('Panchangam Fetch Failed:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  debugLog('Panchang API Request Received', req.body);

  // Only allow POST requests
  if (req.method !== 'POST') {
    debugLog('Method Not Allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { date, latitude, longitude, ayanamsa = 1 } = req.body;

    // Validate required fields
    if (!date || latitude === undefined || longitude === undefined) {
      debugLog('Missing Required Fields');
      return res.status(400).json({ 
        message: 'Missing required fields: date, latitude, longitude' 
      });
    }

    // Check API credentials
    debugLog('API Credentials Check:', {
      hasClientId: !!process.env.PROKERALA_CLIENT_ID,
      hasClientSecret: !!process.env.PROKERALA_CLIENT_SECRET
    });

    // Only use sample data if credentials are completely missing
    const useSampleData = 
      !process.env.PROKERALA_CLIENT_ID || 
      !process.env.PROKERALA_CLIENT_SECRET;
    
    if (useSampleData) {
      debugLog('Using Sample Panchangam Data due to missing credentials');
      return res.status(200).json({ 
        data: getSamplePanchangamData(date, latitude, longitude),
        fallbackReason: 'Missing API credentials'
      });
    }

    // Attempt to fetch real data from Prokerala
    try {
      const panchangamData = await fetchPanchangamFromProkerala(
        date, 
        latitude, 
        longitude, 
        ayanamsa
      );

      debugLog('Responding with Panchangam Data');
      return res.status(200).json({ data: panchangamData });
    } catch (apiError) {
      debugLog('Prokerala API Error:', apiError.message);
      
      // Fallback to sample data if API call fails
      return res.status(200).json({ 
        data: getSamplePanchangamData(date, latitude, longitude),
        fallback: true,
        error: apiError.message
      });
    }

  } catch (error) {
    debugLog('Unexpected Error:', error.message);
    return res.status(500).json({ 
      message: error.message || 'Failed to fetch panchangam data' 
    });
  }
}