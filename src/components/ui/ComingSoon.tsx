export default function ComingSoon() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-32 text-center px-4">
            <div className="w-24 h-24 mb-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 animate-pulse">
                <i className="fas fa-rocket text-4xl text-blue-400"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-gray-400 max-w-md text-lg">
                We are working hard to bring this feature to the ReLU universe. Stay tuned!
            </p>
        </div>
    )
}
