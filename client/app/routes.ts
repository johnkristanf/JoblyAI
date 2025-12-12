import { type RouteConfig, index, layout, prefix, route } from '@react-router/dev/routes'

export default [
    index('./pages/landing.tsx'),

    ...prefix('auth', [
        route('login', './pages/auth/login.tsx'),
        route('signup', './pages/auth/signup.tsx'),
    ]),

    layout('./layout/authenticated.tsx', [
        route('job/search', './pages/job-search.tsx'),
        route('saved/jobs', './pages/saved-jobs.tsx'),
        route('resume', './pages/resume.tsx'),
        route('profile', './pages/profile.tsx'),
    ]),
] satisfies RouteConfig
