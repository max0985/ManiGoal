interface QuoteResponse {
  quote_text: string;
  author: string | null;
  category: string;
}

export async function getAIQuote(): Promise<QuoteResponse> {
  try {
    // TODO: Replace with actual DeepSeek API call
    // For now, return mock quotes with categories
    const mockQuotes = [
      {
        quote_text: "Every small step forward is progress. Your journey is uniquely yours, embrace it.",
        author: "ManiGoal AI",
        category: "Personal Growth"
      },
      {
        quote_text: "Your goals are the compass that guide you through life's journey. Keep them close, but your determination closer.",
        author: "ManiGoal AI",
        category: "Success"
      },
      {
        quote_text: "Success isn't about the destination, it's about the growth you experience along the way.",
        author: "ManiGoal AI",
        category: "Motivation"
      },
      {
        quote_text: "The difference between a dream and a goal is the written plan and deadline you give it.",
        author: "ManiGoal AI",
        category: "Leadership"
      },
      {
        quote_text: "Every expert was once a beginner. Your only competition is who you were yesterday.",
        author: "ManiGoal AI",
        category: "Mindfulness"
      },
      {
        quote_text: "Build bridges of understanding, not walls of expectations.",
        author: "ManiGoal AI",
        category: "Relationships"
      },
      {
        quote_text: "Your body is a temple, treat it with respect and it will serve you well.",
        author: "ManiGoal AI",
        category: "Health"
      },
      {
        quote_text: "Innovation comes from questioning the ordinary and imagining the extraordinary.",
        author: "ManiGoal AI",
        category: "Creativity"
      },
      {
        quote_text: "True wisdom lies not in knowing all the answers, but in asking the right questions.",
        author: "ManiGoal AI",
        category: "Wisdom"
      }
    ];

    return mockQuotes[Math.floor(Math.random() * mockQuotes.length)];
  } catch (error) {
    console.error('Error generating AI quote:', error);
    throw error;
  }
} 