export const metadata = {
    title: 'JoblyAI – AI-Powered Job Search Platform',
    description:
        'Welcome to JoblyAI, the easiest way to search, save jobs, and build a resume with AI assistance.',
}

const LandingPage = () => {
    return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
            <h1>Welcome to Our App!</h1>
            <p>Discover the best way to get started with our new React Router app.</p>
            <div style={{ margin: '2rem 0' }}>
                <a
                    href="/search"
                    style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        background: '#0078f0',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        display: 'inline-block',
                        marginRight: '1rem',
                    }}
                >
                    Search Feature
                </a>
                <a
                    href="/"
                    style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        background: '#eee',
                        color: '#222',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        display: 'inline-block',
                    }}
                >
                    Home
                </a>
            </div>
            <section>
                <h2>Features</h2>
                <ul>
                    <li>Easy navigation with React Router</li>
                    <li>Sample search functionality</li>
                    <li>Modular and elegant UI</li>
                </ul>
            </section>
        </div>
    )
}

export default LandingPage
