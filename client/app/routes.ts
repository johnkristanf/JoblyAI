import { type RouteConfig, index, layout, prefix, route } from '@react-router/dev/routes'

export default [
    index('./pages/landing.tsx'),
    route('email/verification', './pages/email-verification.tsx'),

    ...prefix('auth', [
        route('login', './pages/auth/login.tsx'),
        route('signup', './pages/auth/signup.tsx'),
    ]),

    layout('./layout/authenticated.tsx', [
        route('job/search/resume-matching', './pages/resume-matching.tsx'),

        route('saved/jobs', './pages/saved-jobs.tsx'),
        route('interviews', './pages/interviews.tsx'),
        route('resume', './pages/resume.tsx'),
        route('profile', './pages/profile.tsx'),
    ]),

    route('job/location', './pages/job-location.tsx'),
    route('job/mock/interview', './pages/mock-interview.tsx'),
] satisfies RouteConfig
