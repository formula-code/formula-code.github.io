import path from "node:path";
import { readFile } from "node:fs/promises";

export const prerender = false;

const recordingsRoot = path.resolve("src/data/recordings");

export async function GET({ params }) {
	const { recordingPath } = params;

	if (!recordingPath) {
		return new Response("Recording not found", { status: 404 });
	}

	// Prevent directory traversal
	const safePath = recordingPath.split("/").map(segment => segment.trim()).filter(Boolean);
	const absolutePath = path.join(recordingsRoot, ...safePath);

	if (!absolutePath.startsWith(recordingsRoot)) {
		return new Response("Forbidden", { status: 403 });
	}

	try {
		const fileBuffer = await readFile(absolutePath);
		const extension = path.extname(absolutePath).toLowerCase();

		const contentType =
			extension === ".cast"
				? "text/plain; charset=utf-8"
				: extension === ".zip"
					? "application/zip"
					: "application/octet-stream";

		return new Response(fileBuffer, {
			headers: {
				"Content-Type": contentType
			}
		});
	} catch (error) {
		if (error.code === "ENOENT") {
			return new Response("Recording not found", { status: 404 });
		}

		console.error("Failed to read recording", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
