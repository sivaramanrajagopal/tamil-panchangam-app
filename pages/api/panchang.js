// pages/api/panchang.js
import { URLSearchParams } from 'url';

// Nakshatra list in order
const NAKSHATRAS = [
  "அஸ்வினி", "பரணி", "கிருத்திகை", "ரோகிணி", "மிருகசீரிஷம்",
  "திருவாதிரை", "புனர்பூசம்", "பூசம்", "ஆயில்யம்", "மகம்",
  "பூரம்", "உத்திரம்", "அஸ்தம்", "சித்திரை", "சுவாதி",
  "விசாகம்", "அனுஷம்", "கேட்டை", "மூலம்", "பூராடம்",
  "உத்திராடம்", "திருவோணம்", "அவிட்டம்", "சதயம்", "பூரட்டாதி",
  "உத்திரட்டாதி", "ரேவதி"
];

// Nakshatra mapping between English and Tamil names
const NAKSHATRA_MAPPING = {
  "Ashwini": "அஸ்வினி",
  "Bharani": "பரணி",
  "Krittika": "கிருத்திகை",
  "Rohini": "ரோகிணி",
  "Mrigashira": "மிருகசீரிஷம்",
  "Ardra": "திருவாதிரை",
  "Punarvasu": "புனர்பூசம்",
  "Pushya": "பூசம்",
  "Ashlesha": "ஆயில்யம்",
  "Magha": "மகம்",
  "Purva Phalguni": "பூரம்",
  "Uttara Phalguni": "உத்திரம்",
  "Hasta": "அஸ்தம்",
  "Chitra": "சித்திரை",
  "Swati": "சுவாதி",
  "Vishakha": "விசாகம்",
  "Anuradha": "அனுஷம்",
  "Jyeshta": "கேட்டை",
  "Mula": "மூலம்",
  "Purva Ashadha": "பூராடம்",
  "Uttara Ashadha": "உத்திராடம்",
  "Shravana": "திருவோணம்",
  "Dhanishta": "அவிட்டம்",
  "Shatabhisha": "சதயம்",
  "Purva Bhadrapada": "பூரட்டாதி",
  "Uttara Bhadrapada": "உத்திரட்டாதி",
  "Revati": "ரேவதி"
};

// Debug logging function
function debugLog(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Panchang API Debug]', ...args);
  }
}

// Simple time formatter function
function formatTimeDisplay(timeString) {
  try {
    // Handle ISO format with T
    if (timeString.includes('T')) {
      const timePart = timeString.split('T')[1].split('+')[0].split('-')[0];
      const [hours, minutes] = timePart.split(':');
      return `${hours}:${minutes}`;
    }
    
    // Handle format like "HH:MM:SS +ZZZZ"
    if (timeString.includes(' ')) {
      const timePart = timeString.split(' ')[0];
      const [hours, minutes] = timePart.split(':');
      return `${hours}:${minutes}`;
    }
    
    // If it's already in HH:MM format, return as is
    if (timeString.includes(':') && timeString.split(':').length === 2) {
      return timeString;
    }
    
    // Return as is if we can't parse it
    return timeString;
  } catch (error) {
    debugLog('Error formatting time display:', timeString, error);
    return timeString;
  }
}

// Fix for variations in nakshatra names
function getNakshatraIndex(name) {
  // For Rohini variations
  if (name === "ரோஹிணி") {
    return 3; // Index of ரோகிணி (Rohini)
  }
  
  // For Mrigashirsha variations
  if (name === "மிருகசீரிடம்" || name.includes("மிருகசீரி")) {
    return 4; // Index of மிருகசீரிஷம் (Mrigashirsha)
  }
  
  // For regular names
  return NAKSHATRAS.indexOf(name);
}


// Calculate Chandrashtama Nakshatras (12 nakshatras away)
function calculateChandrashtama(currentNakshatras) {
  // Debug helper
  console.log('Calculating Chandrashtama for:', currentNakshatras.map(n => n.name).join(', '));
  
  return currentNakshatras.map((nakshatra, index) => {
    // Try to convert English name to Tamil, fallback to original name
    const tamilName = NAKSHATRA_MAPPING[nakshatra.name] || nakshatra.name;
    console.log(`Processing nakshatra: ${nakshatra.name}, Tamil name: ${tamilName}`);
    
    // Special handling for known variant names
    let currentIndex = -1;
    
    // Direct lookup for common variants
    if (nakshatra.name === "ரோஹிணி") {
      currentIndex = 3; // Index of ரோகிணி (Rohini)
      console.log(`Found variant for Rohini: ${nakshatra.name} -> index ${currentIndex}`);
    } 
    else if (nakshatra.name === "மிருகசீரிடம்" || nakshatra.name.includes("மிருகசீரி")) {
      currentIndex = 4; // Index of மிருகசீரிஷம் (Mrigashirsha)
      console.log(`Found variant for Mrigashirsha: ${nakshatra.name} -> index ${currentIndex}`);
    }
    else if (nakshatra.name === "ஸ்வாதி") {
      currentIndex = 14; // Index of சுவாதி (Swati)
      console.log(`Found variant for Swati: ${nakshatra.name} -> index ${currentIndex}`);
    }
    // Try standard lookup if no match yet
    else {
      currentIndex = NAKSHATRAS.indexOf(tamilName);
      console.log(`Standard lookup result: ${tamilName} -> index ${currentIndex}`);
    }
    
    // If still not found, try a more flexible approach
    if (currentIndex === -1) {
      // Try each nakshatra and see if there's a close match
      for (let i = 0; i < NAKSHATRAS.length; i++) {
        // Simple character overlap check (could be improved)
        let matching = 0;
        const stdName = NAKSHATRAS[i];
        for (let c of tamilName) {
          if (stdName.includes(c)) matching++;
        }
        // If more than half the characters match, consider it a match
        if (matching >= tamilName.length / 2) {
          currentIndex = i;
          console.log(`Fuzzy match found: ${tamilName} -> ${NAKSHATRAS[i]} (index ${i})`);
          break;
        }
      }
    }

    if (currentIndex === -1) {
      console.warn(`Unable to find index for nakshatra: ${nakshatra.name} (Attempted Tamil: ${tamilName})`);
      return {
        currentNakshatra: nakshatra.name,
        chandrashtamaNakshatra: "Unknown",
        caution: `⚠️ சந்திராஷ்டம: Unknown nakshatra for ${nakshatra.name}`,
        cautionInEnglish: `⚠️ Chandrashtama: Unknown nakshatra for ${nakshatra.name}`
      };
    }

    // Format the end time for display
    const formattedEndTime = formatTimeDisplay(nakshatra.end);

    // Calculate chandrashtama (11 nakshatras away)
    const chandrashtamaIndex = (currentIndex + 11) % NAKSHATRAS.length;
    console.log(`Chandrashtama calculated: ${currentIndex} + 11 = ${chandrashtamaIndex} (${NAKSHATRAS[chandrashtamaIndex]})`);

    return {
      currentNakshatra: nakshatra.name,
      currentNakshatraEndTime: formattedEndTime,
      chandrashtamaNakshatra: NAKSHATRAS[chandrashtamaIndex],
      caution: `⚠️ சந்திராஷ்டம்: ${NAKSHATRAS[chandrashtamaIndex]} நட்சத்திரத்தில் பிறந்தவர்களுக்கு கவனம் தேவை.`,
      cautionInEnglish: `⚠️ Chandrashtama: Caution advised for people born in ${NAKSHATRAS[chandrashtamaIndex]} nakshatra.`
    };
  });
}

// Process time data for display
function formatPanchangTimeRanges(data) {
  // Deep clone to avoid modifying the original
  const result = JSON.parse(JSON.stringify(data));
  
  // Handle sunrise and sunset specifically
  if (result.sunrise) {
    result.sunrise_display = formatTimeDisplay(result.sunrise);
    // Also update the main value for display
    result.sunrise = result.sunrise_display;
  }
  
  if (result.sunset) {
    result.sunset_display = formatTimeDisplay(result.sunset);
    // Also update the main value for display
    result.sunset = result.sunset_display;
  }
  
  // Format time ranges for other data
  const processArraysWithTimeRanges = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        if (item.start && item.end) {
          item.start_display = formatTimeDisplay(item.start);
          item.end_display = formatTimeDisplay(item.end);
          item.display_range = `${item.start_display} - ${item.end_display}`;
        }
        processArraysWithTimeRanges(item);
      });
    } else {
      // Handle nested objects
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          if (obj[key].start && obj[key].end) {
            obj[key].start_display = formatTimeDisplay(obj[key].start);
            obj[key].end_display = formatTimeDisplay(obj[key].end);
            obj[key].display_range = `${obj[key].start_display} - ${obj[key].end_display}`;
          }
          processArraysWithTimeRanges(obj[key]);
        }
      }
    }
  };
  
  // Process nakshatra, tithi, karana, yoga
  ['nakshatra', 'tithi', 'karana', 'yoga'].forEach(key => {
    if (Array.isArray(result[key])) {
      processArraysWithTimeRanges(result[key]);
    }
  });
  
  // Process muhurta
  if (result.muhurta) {
    processArraysWithTimeRanges(result.muhurta);
  }
  
  return result;
}

// Sample data for fallback
function getSamplePanchangamData(date, latitude, longitude) {
  return {
    datetime: `${date}T00:00:00+05:30`,
    coordinates: { latitude, longitude },
    vaara: "புதன்",
    sunrise: "06:15",
    sunset: "18:30",
    sunrise_display: "06:15",
    sunset_display: "18:30",
    nakshatra: [
      {
        name: "அஸ்வினி",
        start: "00:00:00 +0530",
        end: "08:45:00 +0530",
        display_range: "00:00 - 08:45"
      },
      {
        name: "பரணி",
        start: "08:45:00 +0530",
        end: "23:59:59 +0530",
        display_range: "08:45 - 23:59"
      }
    ],
    tithi: [
      {
        name: "சஷ்டி",
        start: "00:00:00 +0530",
        end: "14:20:00 +0530",
        display_range: "00:00 - 14:20"
      },
      {
        name: "சப்தமி",
        start: "14:20:00 +0530",
        end: "23:59:59 +0530",
        display_range: "14:20 - 23:59"
      }
    ],
    karana: [
      {
        name: "பவ",
        start: "00:00:00 +0530",
        end: "13:45:00 +0530",
        display_range: "00:00 - 13:45"
      },
      {
        name: "பாலவ",
        start: "13:45:00 +0530",
        end: "23:59:59 +0530",
        display_range: "13:45 - 23:59"
      }
    ],
    yoga: [
      {
        name: "சித்த",
        start: "00:00:00 +0530",
        end: "16:30:00 +0530",
        display_range: "00:00 - 16:30"
      },
      {
        name: "சாத்தியம்",
        start: "16:30:00 +0530",
        end: "23:59:59 +0530",
        display_range: "16:30 - 23:59"
      }
    ],
    muhurta: {
      rahu: {
        start: "09:15:00 +0530",
        end: "10:45:00 +0530",
        display_range: "09:15 - 10:45"
      },
      yama: {
        start: "13:30:00 +0530",
        end: "15:00:00 +0530",
        display_range: "13:30 - 15:00"
      },
      gulika: {
        start: "06:15:00 +0530",
        end: "07:45:00 +0530",
        display_range: "06:15 - 07:45"
      }
    }
  };
}

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
    
    // IMPORTANT: Always use Indian Standard Time (IST) for the API request
    // This is the key fix based on the working code
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
    
    // Log raw data for debugging
    debugLog('Raw API Response for sunrise:', data.data.sunrise);
    debugLog('Raw API Response for sunset:', data.data.sunset);
    
    // Format the time ranges for display
    const formattedData = formatPanchangTimeRanges(data.data);
    
    return formattedData;
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

    let panchangamData;

    if (useSampleData) {
      debugLog('Using Sample Panchangam Data due to missing credentials');
      panchangamData = getSamplePanchangamData(date, latitude, longitude);
    } else {
      try {
        panchangamData = await fetchPanchangamFromProkerala(
          date,
          latitude,
          longitude,
          ayanamsa
        );
      } catch (apiError) {
        debugLog('Prokerala API Error:', apiError.message);
        panchangamData = getSamplePanchangamData(date, latitude, longitude);
      }
    }

    // Calculate Chandrashtama
    const chandrashtamaInfo = calculateChandrashtama(panchangamData.nakshatra);

    // Enhance the response with Chandrashtama information
    const enhancedPanchangamData = {
      ...panchangamData,
      chandrashtama: chandrashtamaInfo
    };
    
    // Add chandrashtama info directly at the top level for easier UI access
    if (chandrashtamaInfo && chandrashtamaInfo.length > 0) {
      enhancedPanchangamData.chandrashtamaWarnings = chandrashtamaInfo.map(info => info.caution);
      enhancedPanchangamData.chandrashtamaWarningsEnglish = chandrashtamaInfo.map(info => info.cautionInEnglish);
    }

    debugLog('Responding with Enhanced Panchangam Data');
    return res.status(200).json({
      data: enhancedPanchangamData,
      ...(useSampleData ? { fallbackReason: 'Missing API credentials' } : {})
    });

  } catch (error) {
    debugLog('Unexpected Error:', error.message);
    return res.status(500).json({
      message: error.message || 'Failed to fetch panchangam data'
    });
  }
}