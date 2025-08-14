import Navbar from "./components/Navbar";
import Router from "./components/Router";

function App() {
	return (
		<div className="flex font-cabinet selection:bg-gray-5 selection:text-white-1">
			<Navbar />
			<Router />
		</div>
	);
}

export default App;
