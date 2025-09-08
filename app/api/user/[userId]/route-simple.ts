import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    
    // For now, return mock data to test if the route works
    const mockUserData = {
      user_id: userId,
      full_name: "Test User",
      phone: "+1234567890",
      message: "Mock data from Next.js API route"
    }
    
    return NextResponse.json(mockUserData)
  } catch (error) {
    console.error("Error in user route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
