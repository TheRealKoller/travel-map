import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    external?: boolean;
}

export interface ChangelogSection {
    [sectionName: string]: string[];
}

export interface ChangelogRelease {
    version: string;
    date: string;
    sections: ChangelogSection;
}

export interface ChangelogProp {
    newReleases: ChangelogRelease[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    csrf_token: string;
    language: string;
    changelog: ChangelogProp | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    role: 'admin' | 'user';
    created_at: string;
    updated_at: string;
    last_seen_version: string | null;
    [key: string]: unknown; // This allows for additional properties...
}

export * from './trip';
