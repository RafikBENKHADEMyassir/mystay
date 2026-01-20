// backend/src/integrations/ai-concierge.mjs
// AI Assistant for concierge service during offline hours

/**
 * AI Concierge assistant using OpenAI GPT
 * Handles guest queries when human concierge is offline
 */

class AIConcierge {
  constructor(config) {
    this.apiKey = config.openaiApiKey;
    this.model = config.model || "gpt-4";
    this.baseUrl = "https://api.openai.com/v1";
    this.systemPrompt = this.buildSystemPrompt(config.hotelInfo);
  }

  buildSystemPrompt(hotelInfo) {
    return `You are a helpful and knowledgeable AI concierge assistant for ${hotelInfo?.name || "the hotel"}. 
Your role is to assist guests with:
- Local recommendations (restaurants, attractions, transportation)
- Hotel services and amenities information
- Booking assistance for hotel services
- General travel advice
- Emergency contacts and procedures

Hotel Information:
${hotelInfo?.description || "A luxury hotel"}
Location: ${hotelInfo?.location || "City Center"}
Amenities: ${hotelInfo?.amenities?.join(", ") || "Restaurant, Spa, Gym, Pool"}

Guidelines:
- Be warm, professional, and helpful
- Provide specific, actionable recommendations
- If you don't know something, admit it and offer to connect with human staff
- For urgent matters (emergencies, complaints), always escalate to human staff
- Keep responses concise but informative
- Use guest's name if provided for personalization

Important: You are assisting guests during off-hours. For reservations, payments, or urgent issues, inform guests that a staff member will follow up during business hours.`;
  }

  /**
   * Process guest message and generate AI response
   * @param {string} message - Guest's message
   * @param {Array} conversationHistory - Previous messages for context
   * @param {Object} guestInfo - Guest information for personalization
   * @returns {Promise<Object>} AI response
   */
  async processMessage(message, conversationHistory = [], guestInfo = {}) {
    const messages = [
      {
        role: "system",
        content: this.systemPrompt,
      },
    ];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "guest" ? "user" : "assistant",
        content: msg.content,
      });
    });

    // Add current message
    const userMessage = guestInfo.name
      ? `${message} (Guest: ${guestInfo.name}, Room: ${guestInfo.roomNumber || "N/A"})`
      : message;

    messages.push({
      role: "user",
      content: userMessage,
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    // Check if response requires human escalation
    const requiresEscalation = this.detectEscalationNeeded(message, aiResponse);

    return {
      response: aiResponse,
      requiresEscalation,
      tokensUsed: data.usage?.total_tokens,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect if message requires human staff escalation
   * @param {string} userMessage
   * @param {string} aiResponse
   * @returns {boolean}
   */
  detectEscalationNeeded(userMessage, aiResponse) {
    const escalationKeywords = [
      "emergency",
      "urgent",
      "complaint",
      "problem",
      "issue",
      "not working",
      "broken",
      "angry",
      "disappointed",
      "refund",
      "cancel",
      "medical",
      "police",
      "fire",
    ];

    const messageLower = userMessage.toLowerCase();
    return escalationKeywords.some((keyword) => messageLower.includes(keyword));
  }

  /**
   * Generate contextual suggestions based on guest query
   * @param {string} query
   * @param {Object} guestInfo
   * @returns {Promise<Array>} Suggested responses/actions
   */
  async generateSuggestions(query, guestInfo = {}) {
    const prompt = `Given this guest query: "${query}"
    
Guest context: ${JSON.stringify(guestInfo)}

Generate 3-5 quick action suggestions that would be helpful. Return as JSON array of objects with "label" and "action" fields.

Example format:
[
  {"label": "Show nearby restaurants", "action": "restaurants"},
  {"label": "Book spa treatment", "action": "spa_booking"}
]`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates action suggestions. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Get local recommendations
   * @param {string} category - "restaurants", "attractions", "shopping", etc.
   * @param {Object} preferences - Guest preferences
   * @returns {Promise<Object>}
   */
  async getRecommendations(category, preferences = {}) {
    const prompt = `Provide top 5 ${category} recommendations near the hotel.
    
Preferences: ${JSON.stringify(preferences)}

For each recommendation, include:
- Name
- Brief description (1-2 sentences)
- Distance from hotel
- Price range
- Why it's recommended

Format as JSON array.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: this.systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get recommendations");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      return {
        category,
        recommendations: JSON.parse(content),
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return {
        category,
        recommendations: content,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Analyze guest sentiment
   * @param {string} message
   * @returns {Promise<Object>}
   */
  async analyzeSentiment(message) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "Analyze the sentiment of the message. Respond with JSON: {\"sentiment\": \"positive|neutral|negative\", \"confidence\": 0-1, \"urgency\": \"low|medium|high\"}",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return { sentiment: "neutral", confidence: 0.5, urgency: "low" };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      return JSON.parse(content);
    } catch {
      return { sentiment: "neutral", confidence: 0.5, urgency: "low" };
    }
  }
}

export default AIConcierge;
