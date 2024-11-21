import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterAndMap from "./pages/RegisterAndMap";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterAndMap />} />
      </Routes>
    </Router>
  );
}

export default App;
