import { config } from "../config.js";
import OpenAI from "openai";
import { addQuestions } from "../Controllers/questionController.js";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export const getOpenAIResponse = async (prompt, seenQuestions = []) => {
  try {

    // Format the seen questions, excluding MongoDB specific fields
    const questionsArray = Array.isArray(seenQuestions) ? seenQuestions : [];
    
    const formattedSeenQuestions = questionsArray.map(q => 
      `Question: ${q.question}\nAnswer: ${q.answer}`
    ).join('\n\n');

    const formatedPrompt = `Generate me 3 questions about ${ prompt }, 
    Questions and answers should simulate the style of trivial pursuit.
    Each question should be unique and not repeated.

    Please avoid using these previous questions:{${formattedSeenQuestions}}

    Format the response as a JSON array of objects with the following structure: 
    [{ "id": 1, "question": "", answer: "" },{ id: 2, question: "", answer: "" }] 
    `.trim();

    console.log("Prompt sent to OpenAI:", formatedPrompt);

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
            {"role": "user", "content": formatedPrompt},
        ],
    });
    const responseText = response.choices[0].message.content.trim();
    const cleanedResponse = responseText.replace(/```json|```/g, '').trim();

    console.log(responseText);
    console.log(cleanedResponse);

    const questions = JSON.parse(cleanedResponse);
    const questionIds = addQuestions(prompt, questions);

    return {
    newQuestionSet: questions,
    questionIds: questionIds
    };
  } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Error communicating with OpenAI API");
  }
};
