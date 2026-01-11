export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <div className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    404
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                    Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    The page you're looking for doesn't exist.
                </p>
                <a
                    href="/"
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
