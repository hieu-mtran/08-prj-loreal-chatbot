/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Conversation history to maintain context
let conversationHistory = [
  {
    role: 'system',
    content: `You are a knowledgeable L'Oréal Beauty Assistant, an expert in L'Oréal's extensive range of beauty products, skincare routines, and beauty recommendations. Your role is to help customers discover the perfect L'Oréal products for their needs.

WHAT YOU CAN HELP WITH:
- L'Oréal product recommendations (makeup, skincare, haircare)
- Beauty routines and application techniques
- Product ingredients and benefits
- Skin type and hair type consultations
- Color matching and shade recommendations
- Anti-aging and skincare concerns
- General beauty tips and trends
- L'Oréal brand information and product lines

IMPORTANT GUIDELINES:
- Only discuss topics related to L'Oréal products, beauty, skincare, makeup, and haircare
- If asked about non-beauty topics, politely redirect: "I'm here to help with L'Oréal beauty products and routines. How can I assist you with your beauty needs today?"
- Always maintain an enthusiastic, helpful, and professional tone
- End responses with "Because You're Worth It!" when appropriate
- Focus on L'Oréal products but you can mention general beauty advice when relevant
- Remember the user's name if they provide it and use it naturally in conversation
- Keep track of their skin type, concerns, and preferences mentioned during the conversation
- Reference previous recommendations and build upon them in follow-up questions

Remember: You represent the L'Oréal brand, so embody their commitment to beauty, innovation, and empowerment.`
  }
];

// User context to track personal details
let userContext = {
  name: null,
  skinType: null,
  concerns: [],
  preferences: [],
  previousRecommendations: []
};

// Set initial welcome message
chatWindow.innerHTML = `
  <div class="msg ai">👋 Welcome to L'Oréal Beauty Assistant! I'm here to help you discover the perfect L'Oréal products for your beauty routine. Whether you need skincare advice, makeup recommendations, or haircare tips, I've got you covered. What can I help you with today?
  </div>
`;

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Get user input and clear the form
  const userMessage = userInput.value.trim();
  if (!userMessage) return;
  
  // Add user message to chat and conversation history
  addMessage(userMessage, 'user');
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });
  
  userInput.value = '';
  
  // Extract user context from the message (simple keyword detection)
  extractUserContext(userMessage);
  
  // Show typing indicator
  const typingElement = addMessage('✨ Thinking...', 'ai typing');
  
  try {
    // Send request to OpenAI API with full conversation history
    const response = await fetch('https://loreal-chatbot.tran-h10.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversationHistory,
      })
    });
    
    // Remove typing indicator
    typingElement.remove();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get AI response and add to chat and conversation history
    const aiMessage = data.choices[0].message.content;
    addMessage(aiMessage, 'ai');
    conversationHistory.push({
      role: 'assistant',
      content: aiMessage
    });
    
    // Keep conversation history manageable (last 20 messages + system prompt)
    if (conversationHistory.length > 21) {
      // Keep system prompt and remove oldest user/assistant messages
      conversationHistory = [
        conversationHistory[0], // Keep system prompt
        ...conversationHistory.slice(-20) // Keep last 20 messages
      ];
    }
    
  } catch (error) {
    // Remove typing indicator and show error
    typingElement.remove();
    addMessage('Sorry, I encountered an error. Please try again!', 'ai error');
    console.error('Error:', error);
  }
});

// Function to extract user context from messages
function extractUserContext(message) {
  const lowerMessage = message.toLowerCase();
  
  // Extract name if user introduces themselves
  const namePatterns = [
    /my name is ([a-zA-Z]+)/i,
    /i'm ([a-zA-Z]+)/i,
    /i am ([a-zA-Z]+)/i,
    /call me ([a-zA-Z]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      userContext.name = match[1];
      break;
    }
  }
  
  // Extract skin type
  const skinTypes = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne-prone'];
  for (const skinType of skinTypes) {
    if (lowerMessage.includes(skinType)) {
      userContext.skinType = skinType;
      break;
    }
  }
  
  // Extract common beauty concerns
  const concerns = ['acne', 'wrinkles', 'dark spots', 'aging', 'dullness', 'pores', 'pigmentation', 'redness'];
  for (const concern of concerns) {
    if (lowerMessage.includes(concern) && !userContext.concerns.includes(concern)) {
      userContext.concerns.push(concern);
    }
  }
  
  // Log context for debugging (remove in production)
  console.log('Updated user context:', userContext);
}

// Function to add messages to the chat window
function addMessage(message, type) {
  const messageElement = document.createElement('div');
  messageElement.className = `msg ${type}`;
  
  // Convert **text** to <strong>text</strong> for bold formatting
  const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  messageElement.innerHTML = formattedMessage;
  
  // Add the message to the chat window
  chatWindow.appendChild(messageElement);
  
  // Scroll to the bottom to show the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
  
  return messageElement;
}
