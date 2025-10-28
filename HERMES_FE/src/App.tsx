import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AlarmListPage from "./pages/AlarmListPage";
import AlarmDetailPage from "./pages/AlarmDetailPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/alarms" element={<AlarmListPage />} />
        <Route path="/alarms/:id" element={<AlarmDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
