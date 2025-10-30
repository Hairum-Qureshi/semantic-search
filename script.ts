import dotenv from "dotenv";
import chalk from "chalk";
import { DataArray, pipeline } from "@xenova/transformers";
import joinedQnA from "./data-source/QnA_Joined.json";
import similarity from "compute-cosine-similarity";
import { startRedis, redis } from "./redis-init";
import readline from "readline";

dotenv.config();

function input(promptText: string): Promise<string> {
	// wrapper function around Node.js' terminal stdio reader
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise(resolve => {
		rl.question(promptText, answer => {
			rl.close();
			resolve(answer);
		});
	});
}

function useCosineSimilarity(
	userQuestionVector: DataArray,
	vectorEmbeddingHashmap: Map<number, DataArray>
): { highestScore: number; id: number } {
	let id = -1;
	let highestScore = -1;
	for (const [key] of vectorEmbeddingHashmap) {
		const vecA = Array.from(userQuestionVector as Iterable<number>);
		const vecB = Array.from(
			vectorEmbeddingHashmap.get(Number(key))! as Iterable<number>
		);

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
	const vectorEmbeddingHashmap: Map<number, DataArray> = new Map();

	// Helpful: https://www.datastax.com/blog/how-to-create-vector-embeddings-in-node-js
	const extractor = await pipeline(
		"feature-extraction",
		"Xenova/all-MiniLM-L6-v2"
	);

	const existingKeys = await redis.hKeys("Q&As");

	for (const qna of joinedQnA) {
		const embedding = await getQuestionEmbedding(extractor, qna.Question);
		const qnaID = qna.id;

		if (existingKeys.length !== joinedQnA.length) {
			redis.hSet("Q&As", qna.id, JSON.stringify(qna));
		}

		vectorEmbeddingHashmap.set(qnaID, embedding);
	}

	let userQuestion = await input("Enter your question: ");

	while (userQuestion !== "q") {
		const userQueryEmbedVector = await getQuestionEmbedding(
			extractor,
			userQuestion
		);

		const res = useCosineSimilarity(
			userQueryEmbedVector,
			vectorEmbeddingHashmap
		);
		console.log(res);
		const fromRedis = (await redis.hGet("Q&As", res.id.toString())) as string;

		const threshold = 0.75; // -1 <= n <= 1
		if (res.highestScore < threshold) {
			console.log(
				chalk.cyanBright("Sorry, I couldn't find an answer for that.")
			);
			// return;
		} else {
			console.log(">", JSON.parse(fromRedis));
		}

		userQuestion = await input("Enter your question (or enter 'q' to quit): ");
	}

	console.log("Successfully quit");
}
main();
startRedis;

console.log(chalk.yellowBright("Script is running"));
