import * as bcrypt from "bcrypt-ts"

export async function POST(request: Request) {

    const reqJson = await request.json()

    const { username, password} = reqJson

    if (!username || !password) {
        return Response.json(
            { error: "username or password is invalid" },
            { status: 400 }
        )
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // store into database 

    return Response.json(
        { 
            success: true,
            username: username
        },
        { status: 201 }
    )
}