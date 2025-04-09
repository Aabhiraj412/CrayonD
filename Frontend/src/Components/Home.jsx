import React from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <header className="p-6 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-green-400">CI Advisor</h1>
        <nav>
          <ul className="flex gap-6">
            <li className="hover:text-purple-400 cursor-pointer transition-colors duration-300">Home</li>
            <li className="hover:text-purple-400 cursor-pointer transition-colors duration-300">Features</li>
            <li className="hover:text-purple-400 cursor-pointer transition-colors duration-300">Contact</li>
          </ul>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <span className="bg-green-500 bg-opacity-20 text-white px-4 py-1 rounded-full text-sm font-medium mb-6 inline-block">
            COMPETITIVE INTELLIGENCE
          </span>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">
            Your Smart Competitive Intelligence Chatbot
          </h2>
          
          <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-10">
            Track your competitors, analyze strategies, and stay ahead of the game — all in real-time.
            With memory that persists across sessions, you'll never lose track of your research again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="bg-green-500 hover:bg-green-600 text-black font-medium px-8 py-3 rounded-lg transition-colors duration-300 shadow-lg" 
              onClick={() => navigate('/chat')}
            >
              Try It Now
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-lg transition-colors duration-300">
              Learn More
            </button>
          </div>
        </div>
      </main>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-green-400">
            Why Choose CI Advisor?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="w-12 h-12 bg-black bg-opacity-80 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2 text-white">Memory Persistence</h4>
              <p className="text-gray-300">Never lose track of your research with our persistent memory across all your sessions.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="w-12 h-12 bg-black bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2 text-white">Real-time Analytics</h4>
              <p className="text-gray-300">Get instant insights on competitor strategies and market trends as they happen.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="w-12 h-12 bg-black bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2 text-white">Secure Intelligence</h4>
              <p className="text-gray-300">Your competitive data stays private and secure with our advanced encryption technology.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 py-8 px-6 text-center text-gray-400">
        <div className="max-w-6xl mx-auto">
          {/* <p className="mb-2">&copy; {new Date().getFullYear()} CI Advisor. Built with ❤️ by Lord Abhiraj.</p> */}
          <div className="flex justify-center gap-4 mt-3">
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home