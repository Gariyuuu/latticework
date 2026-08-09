import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles, streaks, users } from "@/lib/db/schema";

/**
 * Resolves the authenticated Clerk user to our local `users` row, creating
 * it (plus an empty profile/streak) on first sight. Every authenticated
 * server component/route handler that needs the local user id should go
 * through this rather than trusting a client-sent id.
 */
export async function getOrCreateLocalUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? "";

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      displayName: clerkUser?.firstName ?? clerkUser?.username ?? "New Learner",
      avatarUrl: clerkUser?.imageUrl,
    })
    .returning();

  await db.insert(profiles).values({ userId: created.id }).onConflictDoNothing();
  await db.insert(streaks).values({ userId: created.id }).onConflictDoNothing();

  return created;
}

export async function requireLocalUser() {
  const user = await getOrCreateLocalUser();
  if (!user) throw new Error("Unauthenticated");
  return user;
}
