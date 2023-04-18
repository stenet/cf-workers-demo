export interface Env {
	MY_BUCKET: R2Bucket;
	MY_QUEUE: Queue;
	MY_KV: KVNamespace;
	MY_DURABLE: DurableObjectNamespace;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname !== "/stefan") {
			return new Response("Not found", { status: 404 });
		}

		console.log("Create id");
		const id = new Date().getTime().toString();

		console.log("Send to queue");
		await env.MY_QUEUE.send({
			id
		} satisfies Data);

		console.log("Write to KV");
		await env.MY_KV.put(id, id);

		console.log("Write to bucket");
		await env.MY_BUCKET.put(`${id}.txt`, id);

		console.log("Write to durable");
		const durableId = env.MY_DURABLE.idFromName("Test");
		await env.MY_DURABLE.get(durableId).fetch(request);

		console.log("Done");
		return new Response("Hello World!");
	},

	async queue(batch: MessageBatch<Data>, env: Env): Promise<void> {
    for (const message of batch.messages) {
			console.log("queue", message.body.id);
    }
  }
};

export class Durable {
	constructor(
		private state: DurableObjectState, 
		private env: Env) {}

  async fetch(request: Request) {
		const id = new Date().getTime().toString();

		console.log("Write to Storage");
		this.state.storage.put(id, id);

		console.log("Hello from Durable");
    return new Response("Hello from Durable");
  }
}

interface Data {
	id: string;
}