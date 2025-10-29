import dotenv from "dotenv";
import chalk from "chalk";
import { DataArray, pipeline } from "@xenova/transformers";
import joinedQnA from "./data-source/QnA_Joined.json";
import similarity from "compute-cosine-similarity";
import startRedis from "./redis-init";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// enum Category {
// 	REGISTRATION = "REGISTRATION",
// 	FACILITIES = "FACILITIES",
// 	GRADUATION = "GRADUATION",
// 	DEGREE_REQUIREMENTS = "DEGREE_REQUIREMENTS",
// 	ACADEMIC_POLICIES = "ACADEMIC_POLICIES",
// 	FUNDING_AND_TRAVEL = "FUNDING_AND_TRAVEL",
// 	IMMIGRATION = "IMMIGRATION",
// 	CHANGE_OF_PROGRAM = "CHANGE_OF_PROGRAM",
// 	SEMINARS = "SEMINARS",
// 	BREADTH_REQUIREMENTS = "BREADTH_REQUIREMENTS",
// 	ADVISING = "ADVISING",
// 	LEAVE_OF_ABSENCE = "LEAVE_OF_ABSENCE",
// 	OTHER = "OTHER"
// }

interface QandA {
	id: number;
	Question: string;
	Answer: string;
	Category: string;
	Source?: string;
}

function useCosineSimilarity(
	userQuestionVector: DataArray,
	vectorEmbeddingHashmap: Map<number, DataArray>
): { highestScore: number; id: number } {
	let id = -1;
	let highestScore = -1;
	for (const [key] of vectorEmbeddingHashmap) {
		const vecA = Array.from(userQuestionVector as Iterable<number>);
		const vecB = Array.from(vectorEmbeddingHashmap.get(Number(key))!);

		const s: number = similarity(vecA, vecB) as number;

		if (s > highestScore) {
			highestScore = s;
			id = key;
		}
	}

	return { highestScore, id };
}

async function getQuestionEmbedding(
	extractor: any,
	question: string
): Promise<DataArray> {
	const response = await extractor(question, {
		pooling: "mean",
		normalize: true
	});

	return response.data;
}

async function main() {
	const dataSourceHashMap: Map<number, QandA> = new Map();
	const vectorEmbeddingHashmap: Map<number, DataArray> = new Map();

	const extractor = await pipeline(
		"feature-extraction",
		"Xenova/all-MiniLM-L6-v2"
	);

	for (const qna of joinedQnA) {
		const embedding = await getQuestionEmbedding(extractor, qna.Question);
		const qnaID = qna.id;
		dataSourceHashMap.set(qnaID, qna);
		vectorEmbeddingHashmap.set(qnaID, embedding);
	}

	const placeholderUserQuestion =
		"what are the steps for setting up my UD email address?";

	const userQueryEmbedVector = await getQuestionEmbedding(
		extractor,
		placeholderUserQuestion
	);

	// const res = useCosineSimilarity(userQueryEmbedVector, vectorEmbeddingHashmap);
	// console.log(">>", res);
	// console.log(">", dataSourceHashMap.get(res.id));
}
main();
startRedis;

console.log(chalk.yellowBright("Script is running"));
// console.log(chalk.greenBright("Thinking..."));

// const model = new ChatGoogleGenerativeAI({
// 	model: "gemini-2.5-flash",
// 	maxOutputTokens: 2048,
// 	apiKey: GEMINI_API_KEY
// });
