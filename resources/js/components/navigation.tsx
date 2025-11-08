import { Link } from '@inertiajs/react';

interface NavItem {
    name: string;
    href: string;
}

export default function Navigation() {
    const navItems: NavItem[] = [
        { name: 'Map', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Settings', href: '/settings' },
    ];

    return (
        <nav className="mb-6 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <span className="text-xl font-bold text-gray-800">
                                Travelmap
                            </span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
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
                            className="ml-4 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                            Logout
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
