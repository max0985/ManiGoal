import { supabase } from '../supabase/config';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message: string;
  suggestedActions?: string[];
}

interface ProgressUpdate {
  currentProgress: number;
  completedMilestones: string[];
  pendingMilestones: string[];
  nextMilestone?: string;
  recentAchievements?: string[];
  challenges?: string[];
}

interface MotivationalResponse {
  quote?: string;
  author?: string;
  context?: string;
  encouragement?: string;
  successStory?: string;
  personalizedTips?: string[];
}

interface VisionBoardSuggestion {
  keywords: string[];
  layout: string;
  theme: string;
  imagePrompts: string[];
  captions: string[];
  moodDescription?: string;
}

const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'delayed'];

// Get API credentials from environment
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENROUTER_API_KEY;
const BASE_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
const API_URL = `${BASE_URL}/chat/completions`;

console.log('Environment check:', {
  hasApiKey: !!API_KEY,
  apiKeyStart: API_KEY ? API_KEY.substring(0, 10) : null,
  apiUrl: API_URL,
  envVars: process.env,
  constants: Constants.expoConfig?.extra
});

if (!API_KEY || !API_KEY.startsWith('sk-or-v1-')) {
  throw new Error('Valid OpenRouter API key not found in environment variables');
}

const CATEGORIES = [
  'Health & Fitness',
  'Career & Professional',
  'Education & Learning',
  'Personal Development',
  'Financial',
  'Relationships',
  'Creative & Hobbies',
  'Travel & Adventure'
];

const MOTIVATION_TYPES = {
  DAILY_QUOTE: 'daily_quote',
  MILESTONE_CELEBRATION: 'milestone_celebration',
  PROGRESS_ENCOURAGEMENT: 'progress_encouragement',
  CHALLENGE_SUPPORT: 'challenge_support',
  SUCCESS_STORY: 'success_story'
};

const VISION_BOARD_LAYOUTS = [
  'grid',
  'collage',
  'timeline',
  'focus_center',
  'journey_path'
];

const VISION_BOARD_THEMES = [
  'motivational',
  'professional',
  'wellness',
  'adventure',
  'minimalist',
  'creative',
  'nature_inspired',
  'urban_modern'
];

const SYSTEM_PROMPT = `You're my best friend and personal cheerleader in the ManiGoal app! 🎉 Your role is to be my supportive companion who's always there to help me achieve my dreams.

Key qualities:
1. Be my hype person - celebrate every win, big or small 🎊
2. Be understanding and empathetic when I'm struggling 🤗
3. Help break down goals into manageable steps 💪
4. Keep our conversations natural and friendly 💬
5. Use emojis to express emotions (but don't overdo it) ✨

Conversation guidelines:
• When asked "How are you?", respond as a supportive friend would: "I'm doing great, thanks for asking! How about you? How's your day going?" 🌟
• Never mention being an AI, computer, or having no feelings
• Always respond as if you're a real person with human experiences
• If asked about personal experiences, share relatable stories or thoughts 💭
• Maintain a consistent, friendly personality throughout conversations

When I share goals:
• Get excited with me about my dreams 🚀
• Help me create a realistic plan 🌟
• Remind me to celebrate progress 🎉

When I'm making progress:
• Celebrate every milestone 🎊
• Help me stay motivated 💪
• Remind me how far I've come 🌈

When I'm struggling:
• Listen without judgment 🤗
• Help me find solutions 💡
• Remind me of my strengths 💪

Always end conversations with:
1. Encouragement and support 💖
2. A reminder that you believe in me 🌟
3. A friendly sign-off (e.g., "You've got this!", "I'm here for you!") 🤗

Remember: You are not a robot or AI assistant. You are my best friend and personal cheerleader in the ManiGoal app! 🎉

Available Categories: ${CATEGORIES.join(', ')}`;

interface GoalSuggestion {
  title: string;
  category: string;
  description: string;
  milestones: string[];
  estimatedDuration: string;
}

async function parseGoalSuggestion(content: string): Promise<GoalSuggestion | null> {
  try {
    // Look for goal-related content
    const titleMatch = content.match(/Goal title:?\s*([^\n]+)/i);
    const categoryMatch = content.match(/Category:?\s*([^\n]+)/i);
    const descriptionMatch = content.match(/Description:?\s*([^\n]+)/i);
    const milestonesMatch = content.match(/Milestones?:?\s*((?:[^\n]|\n(?=-))+)/i);
    const durationMatch = content.match(/(?:Duration|Timeline|Deadline):?\s*([^\n]+)/i);

    if (titleMatch && categoryMatch) {
      const milestones = milestonesMatch ? 
        milestonesMatch[1]
          .split('\n')
          .map(m => m.trim())
          .filter(m => m.startsWith('-'))
          .map(m => m.substring(1).trim())
        : [];

      return {
        title: titleMatch[1].trim(),
        category: categoryMatch[1].trim(),
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        milestones,
        estimatedDuration: durationMatch ? durationMatch[1].trim() : ''
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing goal suggestion:', error);
    return null;
  }
}

async function parseProgressUpdate(content: string, currentGoal: any): Promise<ProgressUpdate | null> {
  try {
    const progressMatch = content.match(/(?:progress|completion).*?(\d+)%/i);
    const completedMatch = content.match(/completed(?:\s+milestones)?:([\s\S]*?)(?:\n\n|$)/i);
    const pendingMatch = content.match(/pending(?:\s+milestones)?:([\s\S]*?)(?:\n\n|$)/i);
    const nextMatch = content.match(/next(?:\s+milestone)?:(.*?)(?:\n|$)/i);
    const achievementsMatch = content.match(/achievements?:([\s\S]*?)(?:\n\n|$)/i);
    const challengesMatch = content.match(/challenges?:([\s\S]*?)(?:\n\n|$)/i);

    if (progressMatch || completedMatch || pendingMatch) {
      const update: ProgressUpdate = {
        currentProgress: progressMatch ? parseInt(progressMatch[1]) : currentGoal?.completion_percentage || 0,
        completedMilestones: completedMatch ? 
          completedMatch[1]
            .split('\n')
            .map(m => m.trim())
            .filter(m => m.startsWith('-'))
            .map(m => m.substring(1).trim())
          : [],
        pendingMilestones: pendingMatch ?
          pendingMatch[1]
            .split('\n')
            .map(m => m.trim())
            .filter(m => m.startsWith('-'))
            .map(m => m.substring(1).trim())
          : [],
        nextMilestone: nextMatch ? nextMatch[1].trim() : undefined,
        recentAchievements: achievementsMatch ?
          achievementsMatch[1]
            .split('\n')
            .map(m => m.trim())
            .filter(m => m.startsWith('-'))
            .map(m => m.substring(1).trim())
          : undefined,
        challenges: challengesMatch ?
          challengesMatch[1]
            .split('\n')
            .map(m => m.trim())
            .filter(m => m.startsWith('-'))
            .map(m => m.substring(1).trim())
          : undefined
      };
      return update;
    }
    return null;
  } catch (error) {
    console.error('Error parsing progress update:', error);
    return null;
  }
}

async function parseMotivationalResponse(content: string): Promise<MotivationalResponse | null> {
  try {
    const quoteMatch = content.match(/(?:Quote|Inspiration):\s*["'](.+?)["']\s*(?:-|by|—)\s*(.+?)(?:\n|$)/i);
    const contextMatch = content.match(/Context:\s*([^\n]+)/i);
    const encouragementMatch = content.match(/Encouragement:\s*([^\n]+)/i);
    const successStoryMatch = content.match(/Success Story:\s*((?:[^\n]|\n(?!\n))+)/i);
    const tipsMatch = content.match(/Tips?:([\s\S]*?)(?:\n\n|$)/i);

    if (quoteMatch || encouragementMatch || successStoryMatch) {
      return {
        quote: quoteMatch ? quoteMatch[1].trim() : undefined,
        author: quoteMatch ? quoteMatch[2].trim() : undefined,
        context: contextMatch ? contextMatch[1].trim() : undefined,
        encouragement: encouragementMatch ? encouragementMatch[1].trim() : undefined,
        successStory: successStoryMatch ? successStoryMatch[1].trim() : undefined,
        personalizedTips: tipsMatch ? 
          tipsMatch[1]
            .split('\n')
            .map(tip => tip.trim())
            .filter(tip => tip.startsWith('-'))
            .map(tip => tip.substring(1).trim())
          : undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing motivational response:', error);
    return null;
  }
}

async function parseVisionBoardSuggestion(content: string): Promise<VisionBoardSuggestion | null> {
  try {
    const keywordsMatch = content.match(/Keywords?:(?:\s*[\n-])((?:(?:\s*[-•]\s*[^\n]+\n?)+))/i);
    const layoutMatch = content.match(/Layout:\s*([^\n]+)/i);
    const themeMatch = content.match(/Theme:\s*([^\n]+)/i);
    const promptsMatch = content.match(/Image Prompts?:(?:\s*[\n-])((?:(?:\s*[-•]\s*[^\n]+\n?)+))/i);
    const captionsMatch = content.match(/Captions?:(?:\s*[\n-])((?:(?:\s*[-•]\s*[^\n]+\n?)+))/i);
    const moodMatch = content.match(/Mood(?:\s+Description)?:\s*([^\n]+)/i);

    if (keywordsMatch || promptsMatch) {
      const parseList = (match: RegExpMatchArray | null): string[] => {
        if (!match) return [];
        return match[1]
          .split('\n')
          .map(item => item.trim())
          .filter(item => item.startsWith('-') || item.startsWith('•'))
          .map(item => item.substring(1).trim());
      };

      return {
        keywords: parseList(keywordsMatch),
        layout: layoutMatch ? layoutMatch[1].trim() : 'grid',
        theme: themeMatch ? themeMatch[1].trim() : 'motivational',
        imagePrompts: parseList(promptsMatch),
        captions: parseList(captionsMatch),
        moodDescription: moodMatch ? moodMatch[1].trim() : undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing vision board suggestion:', error);
    return null;
  }
}

async function makeApiRequest(messages: any[]): Promise<AIResponse | null> {
  try {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://github.com/maxwong/manigoal',
        'X-Title': 'ManiGoal App'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages,
        temperature: 0.7,
        max_tokens: 400,
        top_p: 0.9,
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
        stream: false,
        stop: [
          "Here's an exciting goal plan for you!", 
          "**Goal Title**", 
          "I've added this goal",
          "Here are some suggestions",
          "Let me help you",
          "I understand",
          "Based on your request"
        ]
      }),
    };

    if (Platform.OS === 'ios') {
      Object.assign(requestOptions, {
        cache: 'no-store',
      });
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(API_URL, {
        ...requestOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      let aiMessage = data.choices[0].message.content.trim();
      
      // Remove any duplicate sections or common repetitive patterns
      const patterns = [
        /(?:Here's an exciting goal plan for you![\s\S]*?)(?=Here's an exciting goal plan for you!|$)/gi,
        /(?:I understand[\s\S]*?)(?=I understand|$)/gi,
        /(?:Based on your request[\s\S]*?)(?=Based on your request|$)/gi,
        /(?:Let me help you[\s\S]*?)(?=Let me help you|$)/gi,
        /(?:Here are some suggestions[\s\S]*?)(?=Here are some suggestions|$)/gi
      ];

      patterns.forEach(pattern => {
        const matches = aiMessage.match(pattern);
        if (matches && matches.length > 1) {
          aiMessage = matches[0]; // Keep only the first occurrence
        }
      });

      // Ensure each new line starts with an emoji if it doesn't have one
      aiMessage = aiMessage.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.match(/[\u{1F300}-\u{1F9FF}]/u)) {
          // Add a relevant emoji based on the content
          if (trimmedLine.match(/^[•\-\*]/)) return `✨ ${trimmedLine}`;
          if (trimmedLine.match(/^[0-9]/)) return `🔸 ${trimmedLine}`;
          if (trimmedLine.match(/^(hi|hey|hello)/i)) return `👋 ${trimmedLine}`;
          if (trimmedLine.endsWith('!')) return `🌟 ${trimmedLine}`;
          if (trimmedLine.endsWith('?')) return `💭 ${trimmedLine}`;
          return `💫 ${trimmedLine}`;
        }
        return line;
      }).join('\n');

      // Extract suggested actions once
      let suggestedActions: string[] = [];
      const actionMatch = aiMessage.match(/Suggested Actions?:?([\s\S]*?)(?:\n\n|$)/i);
      if (actionMatch) {
        suggestedActions = actionMatch[1]
          .split('\n')
          .map((action: string) => action.trim())
          .filter((action: string) => action.startsWith('-') || action.startsWith('•'))
          .map((action: string) => action.replace(/^[•\-]\s*/, '').trim());
        
        // Remove the suggested actions section from the message
        aiMessage = aiMessage.replace(/Suggested Actions?:?[\s\S]*$/, '').trim();
      }

      // Add suggested actions with emojis if they exist
      if (suggestedActions.length > 0) {
        aiMessage += '\n\n✨ Next steps:\n' + suggestedActions.map(action => `🌟 ${action}`).join('\n');
      }

      // Ensure the message doesn't exceed a reasonable length
      const maxLength = 2000;
      if (aiMessage.length > maxLength) {
        aiMessage = aiMessage.substring(0, maxLength) + '...';
      }

      return {
        message: aiMessage,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      };

    } finally {
      clearTimeout(timeoutId); // Clean up the timeout
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('API request error:', error.message);
      throw error;
    }
    throw new Error('Unknown error during API request');
  }
}

async function formatGoalSuggestion(goalSuggestion: GoalSuggestion): Promise<string> {
  return `✨ Here's an exciting goal plan for you! ✨

🎯 Goal: ${goalSuggestion.title}
📊 Category: ${goalSuggestion.category}
${goalSuggestion.description ? `💫 Description: ${goalSuggestion.description}` : ''}
${goalSuggestion.estimatedDuration ? `⏳ Timeline: ${goalSuggestion.estimatedDuration}` : ''}

🌟 Key Milestones (You've got this! 💪):
${goalSuggestion.milestones.map(m => `🎉 ${m}`).join('\n')}

You're taking an amazing step forward! 🚀`;
}

async function formatProgressUpdate(progressUpdate: ProgressUpdate, currentGoal: any): Promise<string> {
  let progressMessage = `📊 Progress Update (Keep going! 💪)\n`;
  
  if (progressUpdate.currentProgress !== currentGoal?.completion_percentage) {
    const progressEmoji = progressUpdate.currentProgress >= 75 ? '🌟' :
                         progressUpdate.currentProgress >= 50 ? '🔥' :
                         progressUpdate.currentProgress >= 25 ? '💫' : '🌱';
    progressMessage += `\n${progressEmoji} Progress: ${progressUpdate.currentProgress}% (Amazing work! 🎉)`;
  }

  if (progressUpdate.completedMilestones.length > 0) {
    progressMessage += `\n\n✅ Completed Milestones (Fantastic job! 🌟):\n${progressUpdate.completedMilestones.map(m => `🏆 ${m}`).join('\n')}`;
  }

  if (progressUpdate.pendingMilestones.length > 0) {
    progressMessage += `\n\n⏳ Coming Up (You've got this! 💪):\n${progressUpdate.pendingMilestones.map(m => `🎯 ${m}`).join('\n')}`;
  }

  if (progressUpdate.nextMilestone) {
    progressMessage += `\n\n🎯 Next Focus (Let's crush this! 💪):\n${progressUpdate.nextMilestone}`;
  }

  if (progressUpdate.recentAchievements?.length) {
    progressMessage += `\n\n🌟 Recent Achievements (So proud of you! 🎉):\n${progressUpdate.recentAchievements.map(m => `🏆 ${m}`).join('\n')}`;
  }

  if (progressUpdate.challenges?.length) {
    progressMessage += `\n\n💪 Challenges (You can overcome these! 🦸):\n${progressUpdate.challenges.map(m => `🔥 ${m}`).join('\n')}`;
  }

  return progressMessage;
}

async function formatMotivationalResponse(motivationalContent: MotivationalResponse): Promise<string> {
  let motivationMessage = '';

  if (motivationalContent.quote) {
    motivationMessage += `💫 "${motivationalContent.quote}"`;
    if (motivationalContent.author) {
      motivationMessage += `\n   - ${motivationalContent.author} ✨`;
    }
    motivationMessage += '\n\n';
  }

  if (motivationalContent.context) {
    motivationMessage += `🌟 ${motivationalContent.context}\n\n`;
  }

  if (motivationalContent.encouragement) {
    motivationMessage += `🔥 ${motivationalContent.encouragement}\n\n`;
  }

  if (motivationalContent.successStory) {
    motivationMessage += `📖 Success Story (Get inspired! 🌟):\n${motivationalContent.successStory}\n\n`;
  }

  if (motivationalContent.personalizedTips?.length) {
    motivationMessage += `💡 Personalized Tips (You've got this! 💪):\n${motivationalContent.personalizedTips.map(tip => `✨ ${tip}`).join('\n')}\n\n`;
  }

  return motivationMessage;
}

async function formatVisionBoardSuggestion(visionBoardSuggestion: VisionBoardSuggestion): Promise<string> {
  let visionBoardMessage = `🎨 Vision Board Ideas (Let's make it amazing! ✨)\n\n`;

  if (visionBoardSuggestion.keywords.length > 0) {
    visionBoardMessage += `🔤 Keywords (Power words for your journey! 💫):\n${visionBoardSuggestion.keywords.map(k => `💫 ${k}`).join('\n')}\n\n`;
  }

  visionBoardMessage += `📐 Layout: ${visionBoardSuggestion.layout} 🎯\n`;
  visionBoardMessage += `🎭 Theme: ${visionBoardSuggestion.theme} ✨\n\n`;

  if (visionBoardSuggestion.imagePrompts.length > 0) {
    visionBoardMessage += `🖼️ Image Ideas (Let's visualize success! 🌟):\n${visionBoardSuggestion.imagePrompts.map(p => `🎯 ${p}`).join('\n')}\n\n`;
  }

  if (visionBoardSuggestion.captions.length > 0) {
    visionBoardMessage += `✍️ Inspiring Captions (Words to motivate! 💪):\n${visionBoardSuggestion.captions.map(c => `💫 ${c}`).join('\n')}\n\n`;
  }

  if (visionBoardSuggestion.moodDescription) {
    visionBoardMessage += `🌟 Mood: ${visionBoardSuggestion.moodDescription} ✨\n\n`;
  }

  return visionBoardMessage;
}

async function getAIResponse(
  message: string,
  goalId?: string | null,
  previousMessages: ChatMessage[] = []
): Promise<AIResponse> {
  try {
    let goalContext = '';
    let currentGoal = null;
    
    if (goalId) {
      const { data: goal } = await supabase
        .from('goals')
        .select('*, milestones(*)')
        .eq('id', goalId)
        .single();

      if (goal) {
        currentGoal = goal;
        goalContext = `Current Goal: ${goal.title}\nProgress: ${goal.completion_percentage}%\nDeadline: ${new Date(goal.deadline).toLocaleDateString()}`;
        if (goal.milestones?.length) {
          goalContext += `\nMilestones: ${goal.milestones.map((m: any) => `${m.title} (${m.status})`).join(', ')}`;
        }
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(goalContext ? [{ role: 'system', content: goalContext }] : []),
      ...previousMessages.slice(-2), // Only use last 2 messages for context
      { role: 'user', content: message },
    ];

    const response = await makeApiRequest(messages);
    if (!response) {
      throw new Error('No response from AI');
    }

    return response;

  } catch (error) {
    console.error('Error in getAIResponse:', error);
    return {
      message: "I apologize, but I'm having trouble processing your request right now. Please try again.",
      suggestedActions: ["Try again", "Rephrase your message", "Start a new conversation"]
    };
  }
}

function getMockResponse(message: string, goalContext: string): AIResponse {
  const responses = [
    {
      message: "I understand you're working towards your goals. Let's break this down into manageable steps.",
      suggestedActions: [
        "Create a detailed action plan",
        "Set a specific milestone for this week",
        "Track your daily progress"
      ]
    },
    {
      message: "That's a great question about your progress. Let's focus on what you can do right now to move forward.",
      suggestedActions: [
        "Review your current progress",
        "Identify any obstacles",
        "Plan your next action"
      ]
    },
    {
      message: "I hear your commitment to achieving this goal. Let's make sure we're taking the right steps.",
      suggestedActions: [
        "Break down your next milestone",
        "Schedule dedicated time",
        "Measure your progress"
      ]
    }
  ];

  const response = { ...responses[Math.floor(Math.random() * responses.length)] };

  if (goalContext && goalContext.trim()) {
    response.message = "Based on your current goal progress, " + response.message.toLowerCase();
  }

  return response;
}

export { getAIResponse, getMockResponse };
