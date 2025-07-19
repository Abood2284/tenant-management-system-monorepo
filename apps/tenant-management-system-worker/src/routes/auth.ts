import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "..";
import { users, sessions } from "@repo/db/schema";
import { eq } from "drizzle-orm";

const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    throw new HTTPException(400, { message: "Email and password are required" });
  }

  const user = await c.req.db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ status: 401, message: "Invalid credentials" });
  }

  // Plain text password comparison (temporary)
  const isPasswordValid = password === user.password;

  if (!isPasswordValid) {
    return c.json({ status: 401, message: "Invalid credentials" });
  }

  const sessionToken = crypto.randomUUID();
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await c.req.db.insert(sessions).values({
    sessionToken,
    userId: user.id,
    expires: sessionExpires,
  });

  const { password: _, ...userWithoutPassword } = user;

  return c.json({
    status: 200,
    data: {
      sessionToken,
      user: userWithoutPassword,
    },
  });
});

authRoutes.post("/create-user", async (c) => {
  const { name, email, password } = await c.req.json();

  if (!name || !email || !password) {
    throw new HTTPException(400, { message: "Name, email, and password are required" });
  }

  // Storing password in plain text (temporary)
  const newUser = await c.req.db.insert(users).values({
    name,
    email,
    password: password,
  }).returning();

  const { password: _, ...userWithoutPassword } = newUser[0];

  return c.json({
    status: 201,
    data: userWithoutPassword,
  });
});

authRoutes.post("/logout", async (c) => {
  const { sessionToken } = await c.req.json();

  if (!sessionToken) {
    throw new HTTPException(400, { message: "Session token is required" });
  }

  await c.req.db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));

  return c.json({ status: 200, message: "Logged out successfully" });
});

export default authRoutes;