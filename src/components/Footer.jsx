export default function Footer() {
    return (
        <footer className="bg-dark text-light py-3" style={{
            position: 'relative',
            zIndex: 1000
        }}>
            <div className="container text-center">
                <p>&copy; {new Date().getFullYear()} FindMovies. All rights reserved.</p>
                <p>&copy; Made with ❤️ by <a href="https://www.linkedin.com/in/skd03/" target="_blank">SKD</a>.</p>
            </div>
        </footer>
    )}
