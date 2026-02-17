import { AUTH_PAGE_TYPE } from "@/features/auth/authTypes";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "./routePath";
import AuthPage from "@/pages/auth/AuthPage";
import Dashboard from "@/pages/dashboard/DashboardPage";

export const authenticationRoutePaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: <AuthPage type={AUTH_PAGE_TYPE.SIGN_IN} /> },
  { path: AUTH_ROUTES.SIGN_UP, element: <AuthPage type={AUTH_PAGE_TYPE.SIGN_UP} /> },
];

export const protectedRoutePaths = [
  { path: PROTECTED_ROUTES.DASHBOARD, element: <Dashboard /> },
];