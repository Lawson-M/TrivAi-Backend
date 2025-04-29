import { config } from "../config.js";
import OpenAI from "openai";
import { addQuestions } from "../Controllers/questionController.js";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export const getOpenAIResponse = async (prompt, seenQuestions = [], QuestionCount, aiModel) => {
  try {

    // Format the seen questions, excluding MongoDB specific fields
    const questionsArray = Array.isArray(seenQuestions) ? seenQuestions : [];
    
    const formattedSeenQuestions = questionsArray.map(q => 
      `Question: ${q.question}\nAnswer: ${q.answer}`
    ).join('\n\n');

    const formatedPrompt = `Generate me ${QuestionCount} questions about ${ prompt }, 
    Questions and answers should simulate the style of trivial pursuit.
    Each question should be unique and not repeated.
    Each question need a list of acceptable answers, for example if the question was "Who is the 16th president of the USA?", the answer could be "Abraham Lincoln" or "Lincoln".

    Please avoid using these previous questions:{${formattedSeenQuestions}}

    Format the response as a JSON array of objects with the following structure: 
    [{ "id": 1, "question": "", answer: ["", "", ""]},{ id: 2, question: "", answer: ["", ""]} }] 

    Here is an example:

    [{ "id": 1, "question": "Who was the 16th president of the USA?", answer: ["Abraham Lincoln", "Abe Lincoln", "Lincoln"]}, { "id": 2, "question": "Which fantasy television series, based on the novels by George R.R. Martin, features the battle for the Iron Throne among noble families?", answer: ["Game of Thrones", "GOT"]}]
    `.trim();

    console.log("Prompt sent to OpenAI:", formatedPrompt);

    const response = await openai.chat.completions.create({
        model: aiModel,
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
    const questionIds = await addQuestions(prompt, questions);

    return {
    newQuestionSet: questions,
    questionIds: questionIds
    };
  } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Error communicating with OpenAI API");
  }
};
