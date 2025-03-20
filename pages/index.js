// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

// Locations data
const LOCATIONS = [
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'California', latitude: 36.7783, longitude: 119.4179 },
  { name: 'Atlanta', latitude: 33.7490, longitude: 84.3880 },
  { name: 'London', latitude: 51.5074, longitude: 0.1278 },
  { name: 'Calgary', latitude: 51.0447, longitude: 114.0719 },
  { name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Malaysia', latitude: 4.2105, longitude: 101.9758 }
];

// Emojis for categories
const CATEGORY_EMOJIS = {
  'Basic': '📌',
  'Day': '📅',
  'Time': '⏰',
  'Nakshatra': '⭐',
  'Tithi': '🌙',
  'Karana': '🔄',
  'Yoga': '🧘',
  'Muhurta': '✨'
};

export default function Home() {
  const [date, setDate] = useState('');
  const [locationIndex, setLocationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [panchangamData, setPanchangamData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('student');
  const [recommendations, setRecommendations] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Initialize date on component mount
  useEffect(() => {
    // Set today's date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);
  }, []);

  // Format date in Tamil
  const formatTamilDate = (dateStr) => {
    const date = new Date(dateStr);
    try {
      return new Intl.DateTimeFormat('ta-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      // Fallback if Tamil locale is not supported
      return date.toLocaleDateString();
    }
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const [time] = timeStr.split(' ');
      return time;
    } catch {
      return timeStr;
    }
  };

  // Fetch Panchangam data
  const fetchPanchangam = async () => {
    if (!date) {
      setError('Please select a date');
      return;
    }

    setError('');
    setIsLoading(true);
    setPanchangamData(null);
    setRecommendations(null);

    try {
      const selectedLocation = LOCATIONS[locationIndex];
      
      const response = await fetch('/api/panchang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          ayanamsa: 1 // Default to Lahiri
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch panchangam data');
      }

      const responseData = await response.json();
      
      // Process and set the panchangam data
      setPanchangamData({
        ...responseData.data,
        formattedDate: formatTamilDate(date),
        location: selectedLocation
      });

      // Fetch recommendations for default category
      fetchRecommendations(responseData.data, 'student');
    } catch (error) {
      console.error('Error fetching panchangam:', error);
      setError('Error: ' + error.message);
      
      // Use sample data as fallback
      const sampleData = getSamplePanchangamData(date, LOCATIONS[locationIndex]);
      setPanchangamData(sampleData);
      
      // Fetch recommendations for default category with sample data
      fetchRecommendations(sampleData, 'student');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch AI recommendations
  const fetchRecommendations = async (data, category) => {
    setIsLoadingRecommendations(true);
    
    try {
      // Format data for AI
      const formattedData = {
        date: date,
        weekday: data.vaara || 'Unknown',
        nakshatra: data.nakshatra && data.nakshatra.length > 0 ? data.nakshatra[0].name : 'Unknown',
        tithi: data.tithi && data.tithi.length > 0 ? data.tithi[0].name : 'Unknown',
        yoga: data.yoga && data.yoga.length > 0 ? data.yoga[0].name : 'Unknown',
        karana: data.karana && data.karana.length > 0 ? data.karana[0].name : 'Unknown',
        sunrise: data.sunrise ? formatTime(data.sunrise) : 'Unknown',
        sunset: data.sunset ? formatTime(data.sunset) : 'Unknown',
        location: LOCATIONS[locationIndex].name
      };
      
      const response = await fetch('/api/get-ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          panchangamData: formattedData,
          category
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }
      
      const recommendationsData = await response.json();
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Use fallback recommendations
      setRecommendations(getFallbackRecommendations(category));
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (panchangamData) {
      fetchRecommendations(panchangamData, category);
    }
  };

  // Process panchangam data for display
  const processedData = () => {
    if (!panchangamData) return [];
    
    const rows = [];
    
    // Add basic info
    rows.push({ 
      category: 'Basic', 
      name: 'தேதி (Date)', 
      value: panchangamData.formattedDate
    });
    
    // Add coordinates
    if (panchangamData.coordinates) {
      rows.push({ 
        category: 'Basic', 
        name: 'ஆயக்கோடுகள் (Coordinates)', 
        value: `${panchangamData.coordinates.latitude}, ${panchangamData.coordinates.longitude}`
      });
    }
    
    // Add weekday
    if (panchangamData.vaara) {
      rows.push({ 
        category: 'Day', 
        name: 'கிழமை (Weekday)', 
        value: panchangamData.vaara
      });
    }
    
    // Add sunrise and sunset
    if (panchangamData.sunrise) {
      rows.push({ 
        category: 'Time', 
        name: 'சூரிய உதயம் (Sunrise)', 
        value: formatTime(panchangamData.sunrise)
      });
    }
    
    if (panchangamData.sunset) {
      rows.push({ 
        category: 'Time', 
        name: 'சூரிய அஸ்தமனம் (Sunset)', 
        value: formatTime(panchangamData.sunset)
      });
    }
    
    // Process array-based properties
    const arrayProps = [
      { key: 'nakshatra', label: 'நட்சத்திரம் (Nakshatra)' },
      { key: 'tithi', label: 'திதி (Tithi)' },
      { key: 'karana', label: 'கரணம் (Karana)' },
      { key: 'yoga', label: 'யோகம் (Yoga)' }
    ];
    
    arrayProps.forEach(({ key, label }) => {
      if (panchangamData[key] && Array.isArray(panchangamData[key])) {
        panchangamData[key].forEach(item => {
          const timeInfo = item.start && item.end
            ? `${formatTime(item.start)} - ${formatTime(item.end)}`
            : 'நேரம் கிடைக்கவில்லை (Time not available)';
          
          rows.push({ 
            category: key.charAt(0).toUpperCase() + key.slice(1), 
            name: `${item.name}`, 
            value: timeInfo
          });
        });
      }
    });
    
    // Add muhurtas
    if (panchangamData.muhurta) {
      const muhurtaTranslations = {
        rahu: 'ராகு காலம் (Rahu Kalam)',
        yama: 'எமகண்டம் (Yama Gandam)',
        gulika: 'குளிகை (Gulikai)'
      };
      
      Object.entries(panchangamData.muhurta).forEach(([key, value]) => {
        if (value.start && value.end) {
          rows.push({ 
            category: 'Muhurta', 
            name: muhurtaTranslations[key] || key, 
            value: `${formatTime(value.start)} - ${formatTime(value.end)}`
          });
        }
      });
    }
    
    return rows;
  };

  // Sample data for fallback
  const getSamplePanchangamData = (dateStr, location) => {
    return {
      formattedDate: formatTamilDate(dateStr),
      location: location,
      datetime: dateStr + "T00:00:00+05:30",
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude
      },
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
    };
  };

  // Fallback recommendations
  const getFallbackRecommendations = (category) => {
    const fallbacks = {
      student: {
        favorable: [
          "ஆய்வு மற்றும் கல்வி நடவடிக்கைகளுக்கு உகந்த நேரம்",
          "புதிய பாடங்களைத் தொடங்குவதற்கு ஏற்ற நாள்",
          "தேர்வுகளுக்கு தயாராவதற்கு நல்ல நாள்",
          "குழு கற்றல் செயல்பாடுகள் ஊக்குவிக்கப்படுகின்றன"
        ],
        avoid: [
          "ராகு காலத்தில் முக்கியமான படிப்பு வேலைகளைத் தவிர்க்கவும்",
          "புதிய திட்டங்களைத் தொடங்குவதைத் தவிர்க்கவும்",
          "நீண்ட பயணங்களைத் தவிர்க்கவும்",
          "முக்கிய முடிவுகளை எடுப்பதைத் தவிர்க்கவும்"
        ],
        insight: "இன்றைய நட்சத்திரம் கல்வி செயல்பாடுகளுக்கு அனுகூலமானது. நிதானமாக செயல்பட்டால் சிறந்த முடிவுகளைப் பெறலாம்."
      },
      male: {
        favorable: [
          "வணிக பேச்சுவார்த்தைகளுக்கு உகந்த நாள்",
          "திட்டமிடப்பட்ட செயல்பாடுகளுக்கு ஏற்ற நேரம்",
          "புதிய முயற்சிகளைத் தொடங்க சிறந்த நாள்",
          "உடற்பயிற்சி மற்றும் ஆரோக்கிய நடவடிக்கைகளுக்கு சிறந்த நாள்"
        ],
        avoid: [
          "ராகு காலத்தில் முக்கிய முடிவுகளை எடுப்பதைத் தவிர்க்கவும்",
          "பெரிய நிதி முதலீடுகளைத் தவிர்க்கவும்",
          "சண்டைகள் மற்றும் விவாதங்களைத் தவிர்க்கவும்",
          "முக்கியமான ஒப்பந்தங்களில் கையெழுத்திடுவதைத் தவிர்க்கவும்"
        ],
        insight: "இன்றைய யோகம் தொழில் முயற்சிகளுக்கு சாதகமானது. திட்டமிட்டு செயல்பட்டால் வெற்றி நிச்சயம்."
      },
      female: {
        favorable: [
          "படைப்பாற்றல் செயல்பாடுகளுக்கு சிறந்த நாள்",
          "குடும்ப திட்டமிடலுக்கு உகந்த நேரம்",
          "வீட்டு அமைப்பு மாற்றங்களுக்கு ஏற்ற நாள்",
          "சுகாதார பராமரிப்பு மற்றும் அழகு சிகிச்சைகளுக்கு நல்ல நாள்"
        ],
        avoid: [
          "ராகு காலத்தில் முக்கிய முடிவுகளை எடுப்பதைத் தவிர்க்கவும்",
          "பெரிய வீட்டு கொள்முதல்களைத் தவிர்க்கவும்",
          "மருத்துவ நடைமுறைகளைத் தவிர்க்கவும்",
          "குடும்ப விவாதங்களைத் தவிர்க்கவும்"
        ],
        insight: "இன்றைய திதி குடும்ப நல்லிணக்கத்திற்கு உகந்தது. படைப்பாற்றல் செயல்பாடுகளில் சிறந்த முன்னேற்றம் இருக்கும்."
      },
      elder: {
        favorable: [
          "ஆன்மீக நடைமுறைகளுக்கு சிறந்த நாள்",
          "தியானம் மற்றும் யோகாவுக்கு உகந்த நேரம்",
          "குடும்ப ஒன்றுகூடலுக்கு ஏற்ற நாள்",
          "தர்ம காரியங்களுக்கு நல்ல நாள்"
        ],
        avoid: [
          "கடுமையான உடல் செயல்பாடுகளைத் தவிர்க்கவும்",
          "நீண்ட தூர பயணங்களைத் தவிர்க்கவும்",
          "முக்கிய நிதி முடிவுகளை எடுப்பதைத் தவிர்க்கவும்",
          "மருத்துவ நடைமுறைகளைத் தவிர்க்கவும்"
        ],
        insight: "இன்றைய யோகம் ஆன்மீக செயல்பாடுகளுக்கு மிகவும் சாதகமானது. அமைதியான சூழலில் தியானம் செய்வது நன்மை பயக்கும்."
      }
    };
    
    return fallbacks[category] || fallbacks.student;
  };

  return (
    <div>
      <Head>
        <title>தமிழ் பஞ்சாங்கம் கணிப்பான் - Tamil Panchangam Calculator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-yellow-50">
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-600 text-white p-6 text-center">
              <div className="text-yellow-300 text-sm mb-1">ஓம் கணேசாய நம:</div>
              <h1 className="text-2xl font-bold mb-1">தமிழ் பஞ்சாங்கம் கணிப்பான்</h1>
              <div className="text-sm">Tamil Panchangam Calculator</div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 m-4 rounded-md">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="bg-yellow-50 p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="date" className="block font-semibold text-indigo-900 mb-2">
                    தேதியைத் தேர்ந்தெடுக்கவும் (Select Date)
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 border-2 border-orange-400 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block font-semibold text-indigo-900 mb-2">
                    இடத்தைத் தேர்ந்தெடுக்கவும் (Select Location)
                  </label>
                  <select
                    id="location"
                    value={locationIndex}
                    onChange={(e) => setLocationIndex(parseInt(e.target.value))}
                    className="w-full p-3 border-2 border-orange-400 rounded-lg appearance-none bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='%23FF9800' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '15px'
                    }}
                  >
                    {LOCATIONS.map((loc, index) => (
                      <option key={index} value={index}>
                        {loc.name} ({loc.latitude}, {loc.longitude})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
  onClick={fetchPanchangam}
  disabled={isLoading}
  className={`w-full mt-6 py-5 px-4 text-white rounded-lg font-bold text-lg uppercase transition-all shadow-lg ${
    isLoading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:-translate-y-1 active:translate-y-0'
  }`}
  style={{
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    border: '2px solid #f97316',
    minHeight: '60px'
  }}
>
  {isLoading ? 'ஏற்றுகிறது... (Loading...)' : 'பஞ்சாங்கத்தைக் காட்டு (Show Panchangam)'}
</button>
            </div>

            {/* Results */}
            {panchangamData && (
              <div className="p-4">
                <h2 className="text-xl font-bold text-center text-indigo-900 mb-4">
                  {panchangamData.formattedDate} - {panchangamData.location.name} பஞ்சாங்கம்
                </h2>

                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 bg-yellow-100">வகை (Category)</th>
                        <th className="text-left p-2 bg-yellow-100">பெயர் (Name)</th>
                        <th className="text-left p-2 bg-yellow-100">விவரம் (Value)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData().map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}>
                          <td className="p-2 font-medium">
                            {CATEGORY_EMOJIS[row.category] || '🔍'} {row.category}
                          </td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Personalized Guidance */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-center text-indigo-900 mb-4">
                    தனிப்பட்ட வழிகாட்டல் (Personalized Guidance)
                  </h2>

                  {/* Category Selection */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-indigo-50 p-2 rounded-lg inline-flex gap-2 flex-wrap">
                      {['student', 'male', 'female', 'elder'].map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`px-3 py-2 rounded-md transition-all ${
                            selectedCategory === category
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {category === 'student' && 'மாணவர் (Student)'}
                          {category === 'male' && 'ஆண் (Male)'}
                          {category === 'female' && 'பெண் (Female)'}
                          {category === 'elder' && 'மூத்தோர் (Elder)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loading */}
                  {isLoadingRecommendations && (
                    <div className="text-center py-8">
                      <div className="inline-block w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="mt-2 text-indigo-800">
                        AI பரிந்துரைகளை உருவாக்குகிறது... (Generating AI recommendations...)
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {!isLoadingRecommendations && recommendations && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Favorable Activities */}
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                          <h3 className="text-green-800 font-semibold mb-3">
                            ✅ இன்று செய்யலாம் (Do Today)
                          </h3>
                          <ul className="space-y-2 pl-5">
                            {recommendations.favorable.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-2 mr-2"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Activities to Avoid */}
                        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                          <h3 className="text-red-800 font-semibold mb-3">
                            ❌ இன்று தவிர்க்கவும் (Avoid Today)
                          </h3>
                          <ul className="space-y-2 pl-5">
                            {recommendations.avoid.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-2 mr-2"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Astrological Insight */}
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                        <h3 className="text-blue-800 font-semibold mb-2">
                          🔮 அஸ்ட்ரோலாஜிகல் பார்வை (Astrological Insight)
                        </h3>
                        <p>{recommendations.insight}</p>
                      </div>

                      {/* AI Disclaimer */}
                      <div className="bg-gray-50 border border-dashed border-gray-300 p-3 rounded-md text-sm text-gray-600">
                        <p className="font-medium mb-1">AI பரிந்துரை அறிவிப்பு (AI Recommendation Disclaimer)</p>
                        <p className="mb-1">
                          இந்த தனிப்பட்ட பரிந்துரைகள் பாரம்பரிய பஞ்சாங்க விளக்கங்களின் அடிப்படையில் செயற்கை நுண்ணறிவுத் 
                          தொழில்நுட்பத்தைப் பயன்படுத்தி உருவாக்கப்படுகின்றன. இவை தகவல் நோக்கங்களுக்காக மட்டுமே வழங்கப்படுகின்றன.
                        </p>
                        <p>
                          தனிப்பட்ட வழிகாட்டுதலுக்கு ஒரு தகுதிவாய்ந்த ஜோதிடரை ஆலோசிக்கவும்.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-gray-600 text-sm">
            © {new Date().getFullYear()} Tamil Panchangam Calculator - © Created by Sivaraman Rajagopal
          </div>
        </div>
      </div>
    </div>
  );
}