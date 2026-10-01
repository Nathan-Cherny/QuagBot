import * as bcrypt from "bcrypt-ts"

export async function POST(request: Request) {

    const reqJson = await request.json()

    const { username, password } = reqJson

    if (!username || !password) {
        return Response.json(
            { 
                success: false,
                message: "username or password is invalid",
                data: {}
            },
            { status: 400 }
        )
    }

    /*
    // find database hashed password that matches the user
    validPassword = await bcrypt.compare(password, database password here)

    if (validPassword) { */
        return Response.json(
            { 
                success: true,
                message: "Login successful",
                data: {username}
            },
            { status: 200 }
        )
    /*
    return Response.json(
        {
            success: false,
            messgae: "Invalid username or password",
            data: {}
        },
        { status: 401 }
    )
    */
}