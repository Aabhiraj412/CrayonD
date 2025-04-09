import React from "react";
import { Route, Router, Routes } from "react-router-dom";
import Chat from "./Components/Chat";
import Home from "./Components/Home";

const App = () => {
	return (
		<>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/chat" element={<Chat />} />
				<Route path="*" element={<div>404 Not Found</div>} />
			</Routes>
		</>
	);
};

export default App;
