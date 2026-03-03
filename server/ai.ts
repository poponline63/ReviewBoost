import Anthropic from "@anthropic-ai/sdk";

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function generateReviewResponse(opts: {
  customerName: string;
  rating: number;
  reviewText: string;
  businessName: string;
  businessDescription: string;
  style: "professional" | "friendly" | "formal";
}): Promise<string> {
  const client = getClient();

  const styleMap = {
    professional: "professional yet warm",
    friendly: "friendly and casual",
    formal: "formal and corporate",
  };

  if (client) {
    const prompt = `You are responding to a customer review on behalf of ${opts.businessName}.

Business description: ${opts.businessDescription}

Customer: ${opts.customerName}
Rating: ${opts.rating}/5 stars
Review: "${opts.reviewText}"

Write a ${styleMap[opts.style]} response to this review. 
- Keep it concise (2-4 sentences)
- Address the customer by name
- Match the tone to the rating (grateful for positive, apologetic and action-oriented for negative)
- Do not use emojis
- Do not start with "I"
- Do not include placeholder text like [contact info] — instead say "please reach out to us directly"

Just provide the response text, nothing else.`;

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") return content.text;
  }

  // Fallback responses when API key not set
  if (opts.rating >= 4) {
    return `Hi ${opts.customerName}, thank you so much for your wonderful review! We're thrilled to hear about your positive experience at ${opts.businessName}. Your feedback truly means the world to our team, and we look forward to seeing you again soon!`;
  } else if (opts.rating === 3) {
    return `Hi ${opts.customerName}, thank you for taking the time to share your feedback. We're glad aspects of your visit went well, and we'd love the opportunity to improve your experience next time. Please don't hesitate to reach out to us directly if there's anything we can do better.`;
  } else {
    return `Hi ${opts.customerName}, we sincerely apologize that your experience at ${opts.businessName} didn't meet expectations. This is not the standard of service we strive for. We'd really appreciate the chance to make things right — please reach out to us directly so we can address your concerns personally.`;
  }
}

export function analyzeSentiment(text: string, rating: number): "positive" | "negative" | "neutral" {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

export function extractKeywords(text: string): string[] {
  const positiveWords = ["amazing", "excellent", "great", "fantastic", "outstanding", "wonderful", "professional", "friendly", "helpful", "perfect", "best", "love", "exceptional", "quality", "satisfied"];
  const negativeWords = ["terrible", "awful", "horrible", "disappointing", "slow", "rude", "poor", "bad", "worst", "unhelpful", "mediocre", "wait", "overpriced"];
  
  const lower = text.toLowerCase();
  const found: string[] = [];
  
  [...positiveWords, ...negativeWords].forEach(word => {
    if (lower.includes(word)) found.push(word);
  });
  
  return found.slice(0, 5);
}
