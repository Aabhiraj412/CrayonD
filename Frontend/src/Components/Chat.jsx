import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';

const Chat = () => {
	const navigate = useNavigate();
	const [messages, setMessages] = useState([
		{
			sender: "bot",
			text: "Hello there! Who would you like to analyze today?",
		},
	]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef(null);

	// Theme state
	const [theme, setTheme] = useState("dark");
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

	const [loading, setLoading] = useState(false);

	// Improved loadMessages function to handle the correct API response format
	const loadMessages = async () => {
		setLoading(true);

		try {
			const res = await fetch("https://crayond.onrender.com/memory", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json();
			console.log("Memory data:", data);

			if (
				res.status === 200 &&
				data.messages &&
				Array.isArray(data.messages)
			) {
				console.log("Messages loaded successfully");

				// Process the memory data to create message pairs
				const memoryMessages = [];
				memoryMessages.push({sender: "bot", text: "Hello there! Who would you like to analyze today?"})
				for (let i = 0; i < data.messages.length; i += 2) {
					if (i + 1 < data.messages.length) {
						const userMessage = data.messages[i];
						const botMessage = data.messages[i + 1].replace(
							/```$/,
							""
						); // Remove trailing code markers

						memoryMessages.push(
							{ sender: "user", text: userMessage },
							{ sender: "bot", text: botMessage }
						);
					}
				}

				if (memoryMessages.length > 0) {
					// Replace the initial greeting with the actual conversation history
					setMessages(memoryMessages);
				}
			} else {
				console.log(
					"Failed to load messages or messages format incorrect"
				);
			}
		} catch (e) {
			console.log("Error loading messages:", e);
		} finally {
			setLoading(false);
		}
	};

	const clearMemory = async () => {
		setLoading(true);
		try {
			const res = await fetch("https://crayond.onrender.com/clear-memory", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			if (res.status === 200) {
				console.log("Memory cleared successfully");
				
				// Close the settings modal after clearing memory
				setIsSettingsModalOpen(false);
				
				// Clear messages from state
				setMessages([
					{
						sender: "bot",
						text: "Hello there! Who would you like to analyze today?",
					},
				]);
			}
		} catch (e) {
			console.log("Error clearing memory:", e);
			alert("Failed to clear chat history. Please try again.");
		} finally {
			setLoading(false);	
		}
	};


	useEffect(() => {
		loadMessages();
	}, []);
	// Toggle theme function
	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
		// setIsSettingsModalOpen(false);
	};

	// Add search functionality states
	const [searchTerm, setSearchTerm] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState([]);
	const [currentResult, setCurrentResult] = useState(0);
	const searchInputRef = useRef(null);

	// Function to handle search
	const handleSearch = (term) => {
		setSearchTerm(term);
		if (!term.trim()) {
			setSearchResults([]);
			return;
		}

		// Filter messages that contain the search term
		const results = messages.reduce((acc, msg, index) => {
			if (msg.text.toLowerCase().includes(term.toLowerCase())) {
				acc.push(index);
			}
			return acc;
		}, []);

		setSearchResults(results);
		setCurrentResult(results.length > 0 ? 0 : -1);

		// Scroll to first result if exists
		if (results.length > 0) {
			scrollToMessage(results[0]);
		}
	};

	// Navigate between search results
	const navigateResults = (direction) => {
		if (searchResults.length === 0) return;

		let newResult;
		if (direction === "next") {
			newResult = (currentResult + 1) % searchResults.length;
		} else {
			newResult =
				(currentResult - 1 + searchResults.length) %
				searchResults.length;
		}

		setCurrentResult(newResult);
		scrollToMessage(searchResults[newResult]);
	};

	// Scroll to a specific message by index
	const scrollToMessage = (index) => {
		const messageElement = document.getElementById(`message-${index}`);
		if (messageElement) {
			messageElement.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	};

	// Toggle search bar
	const toggleSearchBar = () => {
		setIsSearching(!isSearching);
		if (!isSearching) {
			// Focus on search input when search bar appears
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		} else {
			// Clear search when closing
			setSearchTerm("");
			setSearchResults([]);
		}
	};

	// Highlight search terms in text
	const highlightText = (text, term) => {
		if (!term.trim() || !text.toLowerCase().includes(term.toLowerCase()))
			return text;

		const parts = text.split(new RegExp(`(${term})`, "gi"));
		return parts.map((part, i) =>
			part.toLowerCase() === term.toLowerCase() ? (
				<mark key={i} className="bg-yellow-400 text-black">
					{part}
				</mark>
			) : (
				part
			)
		);
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Fix the handleSend function to properly format bot responses
	const handleSend = async () => {
		if (!input.trim()) return;

		setMessages((prev) => [...prev, { sender: "user", text: input }]);
		setInput("");
		setIsTyping(true);

		try {
			const res = await fetch("https://crayond.onrender.com/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query: input }),
			});

			const data = await res.json();

			if (res.status === 200) {
				console.log("Bot response:", data);

				// Clean up the response by removing trailing code markers if present
				const cleanedResponse = data.response.replace(/```$/, "");

				setMessages((prev) => [
					...prev,
					{
						sender: "bot",
						text: cleanedResponse,
					},
				]);
			}
		} catch (e) {
			console.log("Error sending message:", e);
			// Show error message to user
			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: "Sorry, I encountered an error. Please try again.",
				},
			]);
		} finally {
			setIsTyping(false);
		}
	};

	// Helper function to handle suggestion chip clicks
	const handleSuggestionClick = (text) => {
		setInput(text);
		// Use setTimeout to ensure state update before sending
		setTimeout(() => {
			handleSend();
		}, 0);
	};

	// Add ref for modal content
	const modalContentRef = useRef(null);

	// Improved click-outside handler with proper event listener cleanup
	useEffect(() => {
		// Only add the event listener when the modal is open
		if (isSettingsModalOpen) {
			const handleClickOutside = (event) => {
				if (
					modalContentRef.current &&
					!modalContentRef.current.contains(event.target)
				) {
					setIsSettingsModalOpen(false);
				}
			};

			// Add event listener
			document.addEventListener("mousedown", handleClickOutside);

			// Clean up
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [isSettingsModalOpen]);

	return (
		<div
			className={`flex flex-col h-screen ${
				theme === "dark"
					? "bg-gray-900 text-white"
					: "bg-gray-100 text-gray-800"
			}`}
		>
			 {/* Loading Overlay */}
			 {loading && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg flex flex-col items-center">
						<div className="flex space-x-2 mb-3">
							<div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
							<div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
							<div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
						</div>
						<p className="text-white text-sm font-medium">Loading...</p>
					</div>
				</div>
			)}
			
			{/* Chat Header */}
			<div
				className={`${
					theme === "dark"
						? "bg-gradient-to-r from-green-500 to-green-600"
						: "bg-gradient-to-r from-green-400 to-green-500"
				} px-6 py-4 flex items-center justify-between shadow-md`}
			>
				<div className="flex items-center">
					<button
						className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
						onClick={() => navigate("/")}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 text-black"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
					</button>
					<div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 ml-5">
						<img
							src="/logo.jpg"
							alt="Logo"
							className="rounded-full w-full h-full object-cover"
						/>
					</div>
					<div>
						<h2 className="font-bold text-lg text-black">
							CI Chat Advisor
						</h2>
						<div className="text-xs text-green-900">
							Powered by Advanced Intelligence
						</div>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<button
						className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
						onClick={toggleSearchBar}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 text-black"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</button>
					<button
						className="p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
						onClick={() => setIsSettingsModalOpen(true)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 text-black"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Settings Modal */}
			{isSettingsModalOpen && (
				<div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
					<div
						ref={modalContentRef}
						className={`${
							theme === "dark"
								? "bg-gray-800/90 text-white"
								: "bg-white/90 text-gray-800"
						} rounded-lg shadow-xl p-6 w-80 backdrop-filter backdrop-blur-lg border ${
							theme === "dark"
								? "border-gray-700"
								: "border-gray-200"
						}`}
					>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-medium">Settings</h3>
						</div>

						<div className="py-2 border-b border-gray-600/20 mb-4">
							<div className="flex items-center justify-between">
								<span className="font-medium">Theme</span>
								<button
									onClick={toggleTheme}
									className={`${
										theme === "dark"
											? "bg-gray-700"
											: "bg-gray-300"
									} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500`}
								>
									<span
										className={`${
											theme === "dark"
												? "translate-x-6 bg-green-500"
												: "translate-x-1 bg-white"
										} inline-block h-4 w-4 transform rounded-full transition-transform`}
									/>
									<span className="sr-only">
										Toggle Theme
									</span>
								</button>
							</div>
							<div className="text-sm text-gray-500 mt-1">
								{theme === "dark" ? "Dark Mode" : "Light Mode"}
							</div>
						</div>

						<div className="mt-4">
							<p className="text-sm text-gray-400 mb-3">Chat History</p>
							<button
								className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md ${
									theme === "dark"
										? "bg-red-500/90 hover:bg-red-600/90"
										: "bg-red-500 hover:bg-red-600"
								} text-white font-medium transition-colors`}
								onClick={() => clearMemory()}
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
								Clear History
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Search Bar */}
			{isSearching && (
				<div
					className={`${
						theme === "dark" ? "bg-gray-800" : "bg-gray-200"
					} px-4 py-2 flex items-center gap-2 border-b ${
						theme === "dark" ? "border-gray-700" : "border-gray-300"
					}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						ref={searchInputRef}
						type="text"
						className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
						placeholder="Search in conversation..."
						value={searchTerm}
						onChange={(e) => handleSearch(e.target.value)}
					/>
					{searchResults.length > 0 && (
						<div className="flex items-center text-sm text-gray-400">
							<span>
								{currentResult + 1}/{searchResults.length}
							</span>
							<div className="flex ml-2">
								<button
									className="p-1 hover:bg-gray-700 rounded-l"
									onClick={() => navigateResults("prev")}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 19l-7-7 7-7"
										/>
									</svg>
								</button>
								<button
									className="p-1 hover:bg-gray-700 rounded-r"
									onClick={() => navigateResults("next")}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							</div>
						</div>
					)}
					<button
						className="p-1 rounded-full hover:bg-gray-700"
						onClick={toggleSearchBar}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			)}

			{/* Chat Date Indicator */}
			<div className="text-center my-4">
				<span
					className={`${
						theme === "dark"
							? "bg-gray-800 text-gray-400"
							: "bg-gray-200 text-gray-600"
					} text-xs px-3 py-1 rounded-full`}
				>
					Today
				</span>
			</div>

			{/* Chat Window */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
				{messages.map((msg, index) => (
					<div
						id={`message-${index}`}
						key={index}
						className={`flex ${
							msg.sender === "user"
								? "justify-end"
								: "justify-start"
						} ${
							searchResults.includes(index) ? "scroll-mt-20" : ""
						}`}
					>
						<div className="flex flex-col max-w-[75%]">
							{msg.sender === "bot" && (
								<div className="flex items-center mb-1 ml-2">
									<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-4 w-4 text-black"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<span
										className={`text-xs ${
											theme === "dark"
												? "text-gray-400"
												: "text-gray-500"
										}`}
									>
										CI Advisor
									</span>
								</div>
							)}
							<div
								className={`px-4 py-3 rounded-2xl shadow-sm ${
									msg.sender === "user"
										? "bg-green-500 text-black rounded-tr-none"
										: theme === "dark"
										? "bg-gray-800 text-gray-100 rounded-tl-none"
										: "bg-gray-300 text-gray-800 rounded-tl-none"
								} ${
									searchResults.includes(index) &&
									searchResults[currentResult] === index
										? "ring-2 ring-yellow-400"
										: ""
								}`}
							>
								{msg.sender === "bot" ? (
									<div className="prose prose-sm dark:prose-invert max-w-none">
										{searchTerm ? (
											<div className="text-sm md:text-base">
												{highlightText(msg.text, searchTerm)}
											</div>
										) : (
											<ReactMarkdown>
												{msg.text}
											</ReactMarkdown>
										)}
									</div>
								) : (
									<p className="text-sm md:text-base">
										{searchTerm
											? highlightText(msg.text, searchTerm)
											: msg.text}
									</p>
								)}
							</div>
						</div>
					</div>
				))}

				{isTyping && (
					<div className="flex justify-start">
						<div className="flex flex-col max-w-[75%]">
							<div className="flex items-center mb-1 ml-2">
								<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4 text-black"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<span
									className={`text-xs ${
										theme === "dark"
											? "text-gray-400"
											: "text-gray-500"
									}`}
								>
									CI Advisor
								</span>
							</div>
							<div
								className={`px-4 py-3 rounded-2xl ${
									theme === "dark"
										? "bg-gray-800 text-gray-100"
										: "bg-gray-300 text-gray-800"
								} rounded-tl-none shadow-sm`}
							>
								<div className="flex space-x-1">
									<div
										className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0s" }}
									></div>
									<div
										className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.2s" }}
									></div>
									<div
										className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.4s" }}
									></div>
								</div>
							</div>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Suggestion Chips */}
			<div className="flex gap-2 px-4 py-2 overflow-x-auto">
				<button
					className={`whitespace-nowrap px-3 py-1 ${
						theme === "dark"
							? "bg-gray-800 hover:bg-gray-700 text-gray-300"
							: "bg-gray-200 hover:bg-gray-300 text-gray-700"
					} rounded-full text-sm transition-colors`}
					onClick={() =>
						handleSuggestionClick("Analyze Competitor X")
					}
				>
					Analyze Competitor X
				</button>
				<button
					className={`whitespace-nowrap px-3 py-1 ${
						theme === "dark"
							? "bg-gray-800 hover:bg-gray-700 text-gray-300"
							: "bg-gray-200 hover:bg-gray-300 text-gray-700"
					} rounded-full text-sm transition-colors`}
					onClick={() => handleSuggestionClick("Market Trends")}
				>
					Market Trends
				</button>
				<button
					className={`whitespace-nowrap px-3 py-1 ${
						theme === "dark"
							? "bg-gray-800 hover:bg-gray-700 text-gray-300"
							: "bg-gray-200 hover:bg-gray-300 text-gray-700"
					} rounded-full text-sm transition-colors`}
					onClick={() => handleSuggestionClick("SWOT Analysis")}
				>
					SWOT Analysis
				</button>
				<button
					className={`whitespace-nowrap px-3 py-1 ${
						theme === "dark"
							? "bg-gray-800 hover:bg-gray-700 text-gray-300"
							: "bg-gray-200 hover:bg-gray-300 text-gray-700"
					} rounded-full text-sm transition-colors`}
					onClick={() => handleSuggestionClick("Pricing Strategy")}
				>
					Pricing Strategy
				</button>
			</div>

			{/* Chat Input */}
			<div
				className={`px-4 py-3 ${
					theme === "dark" ? "bg-gray-800" : "bg-gray-200"
				} flex items-center gap-2`}
			>
				<button
					className={`p-2 rounded-full ${
						theme === "dark"
							? "hover:bg-gray-700"
							: "hover:bg-gray-300"
					} transition-colors`}
					onClick={() => alert("Feature coming soon!")}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className={`h-5 w-5 ${
							theme === "dark" ? "text-gray-400" : "text-gray-600"
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
						/>
					</svg>
				</button>
				<input
					type="text"
					className={`flex-1 px-4 py-3 rounded-xl ${
						theme === "dark"
							? "bg-gray-700 text-white placeholder-gray-400"
							: "bg-white text-gray-800 placeholder-gray-500"
					} focus:outline-none focus:ring-2 focus:ring-green-500`}
					placeholder="Ask something about a competitor..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSend()}
				/>
				<button
					className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-xl transition-colors flex items-center justify-center shadow-md"
					onClick={handleSend}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
};

export default Chat;
