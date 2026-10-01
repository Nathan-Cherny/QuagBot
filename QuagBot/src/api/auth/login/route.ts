import * as bcrypt from "bcrypt-ts"

export async function POST(response: Response) {

    const reqJson = await response.json()

    const { username, password } = reqJson

    if (!username || !password) {
        return Response.json(
            { 
                success: false,
                message: "username or password is invalid",
                data: []
            },
            { status: 400 }
        )
    }

    /*
    validPassword = bcrypt.compare(password, database password here)

    if (validPassword) { */
        return Response.json(
            { 
                success: true,
                message: "Login successful",
                data: [username]
            },
            { status: 200 }
        )
    
}