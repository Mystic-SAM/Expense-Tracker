import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthRoute from "./AuthRoute";
import { authenticationRoutePaths, protectedRoutePaths } from "./common/routes";
import BaseLayout from "@/layouts/BaseLayout";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";

const AppRoutes = () => {
  // useAuthExpiration();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthRoute />}>
          <Route element={<BaseLayout />}>
            {authenticationRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Protected Route */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {protectedRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              >
                {route.children?.map((childRoute, idx) => (
                  <Route
                    key={'path' in childRoute ? (childRoute.path as string) : `index-${idx}`}
                    index={childRoute.index}
                    path={'path' in childRoute ? (childRoute.path as string) : undefined}
                    element={childRoute.element}
                  />
                ))}
              </Route>
            ))}
          </Route>
        </Route>

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<>404</>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
