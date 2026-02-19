import '@fortawesome/fontawesome-free/css/all.min.css';
import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import i18n from './i18n/config';

// Configure Axios to send CSRF token with every request
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] =
        csrfToken.getAttribute('content');
}
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Do not prefix axios baseURL so requests go to the app root (no /public)

// Update CSRF token on every Inertia navigation
router.on('navigate', (event) => {
    const token = event.detail.page.props.csrf_token as string | undefined;
    if (token) {
        // Update meta tag
        const metaTag = document.head.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            metaTag.setAttribute('content', token);
        }
        // Update axios default header
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize i18n with language from server props
        const serverLanguage = props.initialPage.props.language as
            | string
            | undefined;
        const validLanguages = ['de', 'en'] as const;

        if (
            serverLanguage &&
            validLanguages.includes(serverLanguage as 'de' | 'en') &&
            i18n.language !== serverLanguage
        ) {
            // Intentionally not awaiting changeLanguage:
            // - changeLanguage is async but updates i18next state synchronously enough for React
            // - Making setup() async would complicate createInertiaApp initialization without benefit
            i18n.changeLanguage(serverLanguage);
        }

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
