import * as Redis from "redis";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const redis = Redis.createClient({
	url: process.env.REDIS_URL // looks like this: redis://localhost:REDIS_PORT_NUMBER
});

redis.on("error", err => {
	console.error(chalk.redBright("Redis error:"), err);
});

const startRedis = (async () => {
	await redis.connect();
	console.log(chalk.yellowBright("Connected to", chalk.redBright("Redis")));
})();

export default startRedis;
