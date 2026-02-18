import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/Home";
import Party from "./pages/Party";
import Results from "./pages/Results";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/party/:partyId", element: <Party /> },
  { path: "/party/:partyId/results", element: <Results /> },
]);

// NOTE: placeholder colorscheme: gray 100, 600, 900.
function App() {
  return <RouterProvider router={router} />;
}

export default App;
