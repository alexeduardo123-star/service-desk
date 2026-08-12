import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { NotificationProvider } from "./store/NotificationContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
