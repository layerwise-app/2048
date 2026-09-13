import { useEffect, useState } from 'react';
import type * as React from 'react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

export function UserProfileDialog({
  user,
  trigger,
}: {
  user: {
    id: string;
    name: string;
  };
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(!user.name.trim());
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOpen(!user.name.trim());
  }, [user.name]);

  const save = async () => {
    setSaving(true);
    await authClient.updateUser({ name: name.trim() || 'Player' });
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className='rounded-xl border-none bg-[#bbada0] text-[#776e65] shadow-[0_12px_35px_rgba(0,0,0,0.16)]'
      >
        <DialogHeader>
          <DialogTitle className='font-heading text-3xl font-bold text-[#776e65]'>
            Choose your name
          </DialogTitle>
          <DialogDescription className='text-[#eee4da]'>
            Your name appears on the Top 100 leaderboard.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className='flex flex-col gap-4'
        >
          <div className='flex flex-col gap-2'>
            <Label htmlFor='profile-name'>Name</Label>
            <Input
              id='profile-name'
              autoComplete='name'
              maxLength={50}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button
            type='submit'
            disabled={saving}
            className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'
          >
            {saving ? 'Saving...' : 'Save name'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
