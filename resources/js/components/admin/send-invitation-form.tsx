import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/admin/invitations';
import { Transition } from '@headlessui/react';
import { Form } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';

export default function SendInvitationForm() {
    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-semibold">Send invitation</h3>
                <p className="text-sm text-muted-foreground">
                    Invite a new user by email address
                </p>
            </div>

            <Form
                action={store().url}
                method="post"
                resetOnSuccess
                options={{
                    preserveScroll: true,
                }}
                className="space-y-4"
            >
                {({ processing, recentlySuccessful, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="off"
                                    placeholder="user@example.com"
                                    className="pl-10"
                                    aria-invalid={!!errors.email}
                                />
                            </div>

                            <InputError message={errors.email} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>
                                <Send />
                                {processing
                                    ? 'Sending invitation...'
                                    : 'Send invitation'}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Invitation sent successfully
                                </p>
                            </Transition>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}
