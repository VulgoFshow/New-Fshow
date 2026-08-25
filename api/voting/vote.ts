import { submitVote } from "../../lib/voting";

export async function POST(request: Request) {
  return submitVote(request);
}
