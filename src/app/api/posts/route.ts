import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/config";

type Post = {
  id: string;
  author: { email: string; username: string; name?: string; image?: string };
  content: string;
  createdAt: string;
};

const FEED_PATH = path.join(process.cwd(), "src", "data", "feed.json");

async function readFeed(): Promise<Post[]> {
  const txt = await fs.readFile(FEED_PATH, "utf8").catch(() => "[]");
  return JSON.parse(txt);
}
async function writeFeed(posts: Post[]) {
  await fs.writeFile(FEED_PATH, JSON.stringify(posts, null, 2), "utf8");
}

export async function GET() {
  const posts = await readFeed();
  return NextResponse.json({
    ok: true,
    posts: posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const posts = await readFeed();
  const username =
    (user.email.split("@")[0] || "rowi").toLowerCase().replace(/[^a-z0-9_]/g, "") || "rowi";

  const post: Post = {
    id: crypto.randomUUID(),
    author: { email: user.email, username, name: user.name || "", image: user.image || "" },
    content: String(content),
    createdAt: new Date().toISOString(),
  };

  posts.push(post);
  await writeFeed(posts);

  return NextResponse.json({ ok: true, post });
}
