import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "",
});

export const getOpenAIResponse = async (prompt) => {
  try {
    const formatedPrompt = `Generate me 3 questions about  ${ prompt }, Questions and answers should simulate the style of trivial pursuit. Format the response as a JSON array of objects with the following structure: [{ "id": 1, "question": "", answer: "" },{ id: 2, question: "", answer: "" }] `;

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
      return questions;

  } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Error communicating with OpenAI API");
  }
};
