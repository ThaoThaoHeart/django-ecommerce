import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { errorsOf } from "../api";
import { FieldGroup } from "../components/Field";
import { useAuth } from "../hooks/useAuth";

const MODES = {
  login: {
    title: "Login",
    submitLabel: "Login",
    fields: [
      { name: "email", label: "Email", type: "email", autoComplete: "email", required: true, autoFocus: true },
      { name: "password", label: "Password", type: "password", autoComplete: "current-password", required: true },
    ],
    switchPrompt: "Don't have an account?",
    switchLabel: "Create one",
    switchTo: "/register",
  },
  register: {
    title: "Create Account",
    submitLabel: "Register",
    fields: [
      { name: "email", label: "Email", type: "email", autoComplete: "email", required: true, autoFocus: true },
      { name: "password1", label: "Password", type: "password", autoComplete: "new-password", required: true },
      { name: "password2", label: "Confirm password", type: "password", autoComplete: "new-password", required: true },
    ],
    switchPrompt: "Already have an account?",
    switchLabel: "Login",
    switchTo: "/login",
  },
};

const getSafeNextPath = (nextPath) => (nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/");

export default function AuthPage({ mode }) {
  const modeConfig = MODES[mode];
  const [searchParams] = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const navigate = useNavigate();
  const auth = useAuth();
  const authMutation = auth[mode];
  const [values, setValues] = useState({});

  if (auth.user && !authMutation.isSuccess) return <Navigate to={nextPath} replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    authMutation.mutate(values, { onSuccess: () => navigate(nextPath, { replace: true }) });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-bold">{modeConfig.title}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup fields={modeConfig.fields} values={values} errors={authMutation.isError ? errorsOf(authMutation.error) : {}} onChange={setValues} />
          <button type="submit" className="btn-primary w-full py-2" disabled={authMutation.isPending}>{modeConfig.submitLabel}</button>
          <p className="text-center text-sm text-gray-600">
            {modeConfig.switchPrompt}{" "}
            <Link to={`${modeConfig.switchTo}?${new URLSearchParams({ next: nextPath })}`} className="link font-semibold">{modeConfig.switchLabel}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
