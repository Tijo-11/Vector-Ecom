import { useEffect, useState } from "react";
import { register } from "../../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export default function Register() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/");
    }
  }, []);

  const resetForm = () => {
    setFullname("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPassword2("");
  };
  return <></>;
}
