"use client";

import { buttonDanger } from "../../ui/styles";
import { LogOut } from "lucide-react";

function LogOutButton({ className, handleLogout }) {

    return <button
        type="button"
        className={`${buttonDanger} ${className}`}
        onClick={handleLogout}
    >
        <LogOut size={16} />
        Log out
    </button>
}

export default LogOutButton