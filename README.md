# Semantic Search Playground (Node.js + Transformers + Redis)

This project is an experimental implementation of semantic search — a method for finding meaning-based similarities between text inputs rather than relying on exact keyword matches.

It reads a JSON dataset of question–answer pairs, generates vector embeddings for each question using a Transformer model, caches them in Redis, and allows interactive querying through the command line. When a user inputs a question, the program uses cosine similarity to find the most semantically similar existing question and returns its corresponding answer.

---

## Features

- **Transformer-based Embeddings** — Uses [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) for local embedding generation without external API calls.
- **Cosine Similarity Search** — Compares vectors to find the closest semantic match.
- **Redis Caching** — Stores JSON Q&A data for efficient lookup and reuse.
- **Interactive CLI** — Continuously prompts for user input until the user quits.
- **Colorized Output** — Uses [`chalk`](https://www.npmjs.com/package/chalk) for better console readability.

---

## Project Structure

```bash
.
├── data-source/
│   ├── QnA_1.json              # JSON dataset of Q&A pairs (part 1)
│   ├── QnA_2.json              # JSON dataset of Q&A pairs (part 2)
│   ├── QnA_3.json              # JSON dataset of Q&A pairs (part 3)
│   ├── QnA_4.json              # JSON dataset of Q&A pairs (part 4)
│   └── QnA_Joined.json         # Combined Q&A dataset used for semantic search
├── node_modules/               # Installed dependencies
├── .env                        # Environment variables (e.g., Redis config)
├── .gitignore                  # Ignored files and directories
├── dump.rdb                    # Redis snapshot file (can be ignored in Git)
├── package.json                # Project dependencies and scripts
├── package-lock.json           # Dependency lock file
├── README.md                   # Project documentation
├── redis-init.ts               # Redis initialization and connection logic
├── script.ts                   # Main script with semantic search logic
└── tsconfig.json               # TypeScript configuration
```

---

## How It Works

### 1. Data Loading

- The script loads Q&A pairs from `./data-source/QnA_Joined.json`.
- Each question is assigned an ID for reference and storage in Redis.

### 2. Embedding Generation

- Uses the transformer model `Xenova/all-MiniLM-L6-v2` to generate sentence embeddings.
- Each question’s embedding is stored in a local `Map<number, DataArray>`.

### 3. Redis Caching

- All Q&A data are stored in a Redis hash called `Q&As`.
- The cache is used to avoid reloading or recomputing the same dataset unnecessarily.

### 4. Semantic Matching

- When a user inputs a question:
  1. The question is converted into an embedding.
  2. Cosine similarity is computed between the query vector and all dataset vectors.
  3. The entry with the highest similarity score is fetched from Redis.
  4. If the score falls below a certain threshold (default 0.75), the program responds that no suitable match was found.

### 5. Interactive Loop

- The program continues accepting input until the user enters `q` to quit.

---

## Example CLI Session

```bash
$ node dist/main.js
Script is running
Enter your question: What is Redis?
> { id: 3, Question: "What is Redis?", Answer: "Redis is an in-memory data store..." }

Enter your question (or enter 'q' to quit): What is a vector embedding?
> { id: 7, Question: "What are embeddings?", Answer: "Embeddings are numerical representations of text..." }

Enter your question (or enter 'q' to quit): tell me about cats
Sorry, I couldn't find an answer for that.

Enter your question (or enter 'q' to quit): q
Successfully quit
```

---

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/Hairum-Qureshi/semantic-search.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
DOTENV_CONFIG_QUIET = true
REDIS_PORT = 6379
```

### 4. Prepare your dataset

Place your Q&A JSON file in `./data-source/QnA_Joined.json` with the following format (or use the one provided in the `data-source` folder):

```json
[
	{
		"id": 1,
		"Question": "What is semantic search?",
		"Answer": "Semantic search finds results based on meaning, not exact keywords."
	},
	{
		"id": 2,
		"Question": "What is a vector embedding?",
		"Answer": "A vector embedding is a numerical representation of text."
	}
]
```

### 5. Start Redis

Make sure Redis is running locally:

```bash
redis-server
```

### 6. Run the script

```bash
npm run start
```

---

## Technical Details

| Component | Purpose |
| --- | --- |
| **@xenova/transformers** | Generates embeddings from text using a local transformer model. |
| **compute-cosine-similarity** | Computes cosine similarity between two vectors. |
| **Redis** | Stores Q&A pairs for fast retrieval. |
| **chalk** | Adds colored console output. |
| **readline** | Handles command-line user input. |

---

## Similarity Threshold

You can adjust the similarity threshold (default `0.75`) inside the `main()` function:

```ts
const threshold = 0.75;
```

- Lower values make matching more lenient but may produce irrelevant results.
- Higher values make matching stricter but may yield more “no match” results.

---
