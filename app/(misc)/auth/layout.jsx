"use client"

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const AuthLayout = ({ children }) => {
    const router = useRouter()
    const { data } = useSession();

    if (data) {
        return router.push("/")
    }
    
  return <>{children}</>
}

export default AuthLayout