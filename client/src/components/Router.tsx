import { Route, Routes } from "react-router-dom";
import Auth from "../pages/Auth";
import Community from "../pages/Community";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";

const Router = () => {
	return (
		<Routes>
			<Route path="*" element={<NotFound />} />
			<Route path="/" element={<Home />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/community" element={<Community />} />
			<Route path="/profile" element={<Profile />} />
			<Route path="/signup" element={<Auth mode="signup" />} />
			<Route path="/login" element={<Auth mode="login" />} />
		</Routes>
	);
};

export default Router;
