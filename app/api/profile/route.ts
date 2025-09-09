import { auth0 } from "../../../lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    return Response.json(session.user);
  } catch (error) {
    console.error("Profile API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
