import LandingPage from './pages/landing'

export function meta() {
    return [
        { title: 'JoblyAI – AI-Powered Job Search Platform' },
        { name: 'Welcome to JoblyAI, the easiest way to search, save jobs, and build a resume with AI assistance.' },
    ]
}

export default function Landing() {
    return <LandingPage />
}
