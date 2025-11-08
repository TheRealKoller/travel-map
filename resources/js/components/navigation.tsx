import { Link } from '@inertiajs/react';

interface NavItem {
    name: string;
    href: string;
    icon?: string;
}

export default function Navigation() {
    const navItems: NavItem[] = [
        { name: 'Map', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Settings', href: '/settings' },
    ];

    return (
        <nav className="bg-white shadow-sm mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gray-800">Travelmap</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                        >
                            Logout
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
