import Question from '../Models/questionModel.js';
import User from '../Models/userModel.js';

export const addQuestions = async (prompt, questionsData) => {
    try {

        const formattedQuestions = questionsData.map((questionData) => ({
            prompt,
            question: questionData.question,
            answer: questionData.answer,
        }));

        // Insert multiple questions at once
        const result = await Question.insertMany(formattedQuestions);

        //Get new question ids
        const questionIds = result.map((question) => question._id);

        console.log('Questions added:', result);
        return questionIds;
    } catch (error) {
        console.error('Error adding questions:', error);
        throw error;
    }
};

export const getSeenQuestionsByUsers = async (players, prompt) => {
    try {

      const usernames = players
      .filter(player => !player.isGuest)
      .map(player => player.username || player.name);


      // Get all users' seen questions
      const users = await User.find({ 
        username: { $in: usernames } 
      }).select('seenQuestions');
  
      if (!users || users.length === 0) {
        console.log('No users found');
        return [];
      }
  
      // Combine all seen questions into one array
      const allSeenQuestionIds =[...new Set(users.reduce((acc, user) => {
        return [...acc, ...(user.seenQuestions || [])];
      }, []))];
  
      // Get the actual questions that match the prompt
      const seenQuestions = await Question.find({
        _id: { $in: allSeenQuestionIds },
        prompt: prompt
      });
  
      return seenQuestions;
    } catch (error) {
      console.error('Error getting seen questions:', error);
      throw error;
    }
  };