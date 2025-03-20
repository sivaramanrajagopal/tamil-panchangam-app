// pages/api/get-ai-recommendations.js

// Day name translation and insight generation utilities
function translateDayName(tamilDay) {
  const dayTranslations = {
    'வியாழக்கிழமை': {
      tamil: 'வியாழக்கிழமை',
      english: 'Thursday',
      description: 'Jupiter\'s day, associated with wisdom, expansion, and spiritual growth'
    },
    'புதன்கிழமை': {
      tamil: 'புதன்கிழமை',
      english: 'Wednesday',
      description: 'Mercury\'s day, associated with communication, intellect, and learning'
    },
    'திங்கட்கிழமை': {
      tamil: 'திங்கட்கிழமை',
      english: 'Monday',
      description: 'Moon\'s day, associated with emotions, intuition, and inner reflection'
    },
    'செவ்வாய்கிழமை': {
      tamil: 'செவ்வாய்கிழமை',
      english: 'Tuesday',
      description: 'Mars\' day, associated with energy, courage, and determination'
    },
    'வெள்ளிக்கிழமை': {
      tamil: 'வெள்ளிக்கிழமை',
      english: 'Friday',
      description: 'Venus\' day, associated with love, beauty, and harmony'
    },
    'சனிக்கிழமை': {
      tamil: 'சனிக்கிழமை',
      english: 'Saturday',
      description: 'Saturn\'s day, associated with discipline, responsibility, and karmic lessons'
    },
    'ஞாயிற்றுக்கிழமை': {
      tamil: 'ஞாயிற்றுக்கிழமை',
      english: 'Sunday',
      description: 'Sun\'s day, associated with vitality, leadership, and personal power'
    }
  };

  return dayTranslations[tamilDay] || {
    tamil: tamilDay,
    english: 'Unknown',
    description: 'Astrological day of cosmic significance'
  };
}

function generateAstrologicalInsight(panchangamData, category) {
  const dayInfo = translateDayName(panchangamData.weekday);
  
  const insightTemplates = {
    student: `Under the cosmic influence of ${dayInfo.tamil} (${dayInfo.english}), the ${panchangamData.nakshatra} nakshatra, ${panchangamData.tithi} tithi, and ${panchangamData.yoga} yoga, this is a profound day for academic and personal growth.

${dayInfo.description}. The current astrological configuration suggests:
- Focused learning and intellectual pursuits
- Collaborative study and knowledge sharing
- Personal skill enhancement
- Spiritual and mental development

Navigate the day with mindfulness, embracing opportunities for learning and self-improvement.`,

    male: `Guided by the celestial energies of ${dayInfo.tamil} (${dayInfo.english}), with ${panchangamData.nakshatra} nakshatra, ${panchangamData.tithi} tithi, and ${panchangamData.yoga} yoga, this day holds significant potential for personal and professional growth.

${dayInfo.description}. The planetary alignment encourages:
- Strategic planning and decision-making
- Professional networking
- Personal development
- Balancing ambition with wisdom

Harness the day's energies to make meaningful progress in your life's journey.`,

    female: `Embracing the divine feminine energy of ${dayInfo.tamil} (${dayInfo.english}), supported by ${panchangamData.nakshatra} nakshatra, ${panchangamData.tithi} tithi, and ${panchangamData.yoga} yoga, this day is rich with potential for holistic growth.

${dayInfo.description}. The cosmic configuration suggests:
- Creative expression and intuition
- Emotional healing and self-care
- Nurturing relationships
- Personal empowerment

Allow yourself to flow with the day's harmonious vibrations.`,

    elder: `Blessed by the wisdom of ${dayInfo.tamil} (${dayInfo.english}), illuminated by ${panchangamData.nakshatra} nakshatra, ${panchangamData.tithi} tithi, and ${panchangamData.yoga} yoga, this day is a canvas of spiritual reflection and inner peace.

${dayInfo.description}. The astrological landscape invites:
- Spiritual contemplation
- Sharing life wisdom
- Meditation and self-reflection
- Connecting with inner tranquility

Embrace the profound insights that come with age and experience.`
  };

  return insightTemplates[category] || insightTemplates.student;
}

// Debug logging function
function debugLog(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AI Recommendations API Debug]', ...args);
  }
}

export default async function handler(req, res) {
  debugLog('AI Recommendations API Request Received', req.body);

  // Only allow POST requests
  if (req.method !== 'POST') {
    debugLog('Method Not Allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { panchangamData, category } = req.body;

    // Validate required fields
    if (!panchangamData || !category) {
      debugLog('Missing Required Fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Define fallback recommendations
    const fallbackRecommendations = {
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
        insight: generateAstrologicalInsight(panchangamData, category)
      },
      // Include other categories similarly...
    };

    // Check Mistral API credentials
    debugLog('API Credentials Check:', {
      hasMistralApiKey: !!process.env.MISTRAL_API_KEY
    });

    // Use Mistral AI if API key is available
    if (process.env.MISTRAL_API_KEY) {
      try {
        // Format the prompt for Mistral AI
        const prompt = `
        You are a wise Vedic astrologer providing precise, actionable guidance based on today's astrological configuration.
        
        Astrological Snapshot:
        - Date: ${panchangamData.date}
        - Day: ${panchangamData.weekday}
        - Nakshatra: ${panchangamData.nakshatra}
        - Tithi: ${panchangamData.tithi}
        - Yoga: ${panchangamData.yoga}
        - Karana: ${panchangamData.karana}
        
        For a ${category}, generate:
        1. 3 concise, practical "DO" actions for today.
        2. 3 clear, actionable "DON'T" actions to avoid today.
        3. A very short, impactful insight (2-3 lines) summarizing the day's spiritual essence.
        
        Key Requirements:
        - Use bullet points for Do's and Don'ts.
        - Be specific, clear, and straightforward.
        - Keep the tone positive and empowering.
        - Avoid lengthy explanations; focus on practicality.
        
        Respond in this strict JSON format:
        {
          "favorable": ["Do activity 1", "Do activity 2", "Do activity 3"],
          "avoid": ["Don't activity 1", "Don't activity 2", "Don't activity 3"],
          "insight": "Short, impactful summary of the day's potential."
        }
        `;
        debugLog('Mistral AI Prompt:', prompt);

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            model: "mistral-small",
            messages: [
              {
                role: "system",
                content: "You are an expert Vedic astrologer providing nuanced, personalized astrological advice."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 500
          })
        });

        debugLog('Mistral API Response Status:', response.status);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          
          debugLog('Mistral AI Response Content:', content);

          // Parse the JSON response
          try {
            const recommendations = JSON.parse(content);
            
            // Override insight with our custom insight generation
            recommendations.insight = generateAstrologicalInsight(panchangamData, category);
            
            debugLog('Parsed Recommendations:', recommendations);
            return res.status(200).json(recommendations);
          } catch (e) {
            debugLog('Failed to parse AI response:', e);
            // Continue to fallback
          }
        }
      } catch (aiError) {
        debugLog('Mistral AI error:', aiError);
        // Continue to fallback
      }
    }

    // Return fallback recommendations if AI fails or is not available
    debugLog('Returning Fallback Recommendations');
    return res.status(200).json(
      fallbackRecommendations[category] || fallbackRecommendations.student
    );
  } catch (error) {
    debugLog('Unexpected Error:', error);
    return res.status(500).json({ 
      message: 'Failed to generate recommendations',
      error: error.message 
    });
  }
}