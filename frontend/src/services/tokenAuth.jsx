import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import auth from "../services/auth";

export function tokenAuth() {
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const validateToken = useCallback(async () => {
    const token = Cookies.get("userToken");
    if (!token) {
      setIsLogged(false);
      setIsAdmin(false);
      return false;
    }
    try {
      const { data } = await auth.get("/validate-token", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLogged(true);
      setIsAdmin(data.role === "admin");
      return true;
    } catch (error) {
      console.log("Error validating token in useAuth", error);
      Cookies.remove("userToken");
      setIsLogged(false);
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  return { isLogged, isAdmin, validateToken };
}
