import axios from "axios";

const auth = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/auth`,
});

export default auth;
