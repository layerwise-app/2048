import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '~/components/ui/input-otp';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordsMatch = password === confirmPassword;

  const requestReset = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email
      });
      if (error) throw new Error(error.message ?? 'Failed to send reset code');
    }
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password
      });
      if (error) throw new Error(error.message ?? 'Failed to reset password');
    }
  });

  if (resetPassword.isSuccess) {
    return (
      <div className='flex min-h-svh items-center justify-center p-4'>
        <Card className='w-full max-w-sm rounded-xl border-none bg-[#bbada0] text-[#776e65] shadow-[0_12px_35px_rgba(0,0,0,0.16)]'>
          <CardHeader>
            <CardTitle className='font-heading text-4xl font-bold text-[#776e65]'>Password reset</CardTitle>
            <CardDescription className='text-[#eee4da]'>
              Your password has been updated. You can now sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className='w-full rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
              <Link to='/sign-in'>Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className='flex min-h-svh items-center justify-center bg-[#faf8ef] p-4 dark:bg-[#1b1917]'>
        <Card className='w-full max-w-sm rounded-xl border-none bg-[#bbada0] text-[#776e65] shadow-[0_12px_35px_rgba(0,0,0,0.16)]'>
          <CardHeader>
            <CardTitle className='font-heading text-4xl font-bold text-[#776e65]'>Reset your password</CardTitle>
            <CardDescription className='text-[#eee4da]'>
              We’ll send a six-digit reset code to your email.
            </CardDescription>
          </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <form
            className='flex flex-col gap-4'
            onSubmit={(event) => {
              event.preventDefault();
              setOtp('');
              resetPassword.reset();
              requestReset.mutate();
            }}
          >
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='flex gap-2'>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setOtp('');
                    requestReset.reset();
                    resetPassword.reset();
                  }}
                />
                <Button type='submit' disabled={requestReset.isPending} className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'>
                  {requestReset.isPending
                    ? 'Sending…'
                    : requestReset.isSuccess
                      ? 'Resend code'
                      : 'Send code'}
                </Button>
              </div>
            </div>
            {requestReset.error ? (
              <p className='text-sm text-destructive'>
                {requestReset.error.message}
              </p>
            ) : null}
          </form>
          {requestReset.isSuccess ? (
            <form
              className='flex flex-col gap-4'
              onSubmit={(event) => {
                event.preventDefault();
                if (!passwordsMatch) return;
                resetPassword.mutate();
              }}
            >
                <p className='text-sm text-[#eee4da]'>
                Enter the code sent to {email} and choose a new password.
              </p>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  resetPassword.reset();
                }}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='password'>New password</Label>
                <Input
                  id='password'
                  type='password'
                  autoComplete='new-password'
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    resetPassword.reset();
                  }}
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='confirm-password'>Confirm new password</Label>
                <Input
                  id='confirm-password'
                  type='password'
                  autoComplete='new-password'
                  minLength={8}
                  required
                  aria-invalid={confirmPassword ? !passwordsMatch : undefined}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    resetPassword.reset();
                  }}
                />
                {confirmPassword && !passwordsMatch ? (
                  <p className='text-sm text-destructive'>
                    Passwords do not match.
                  </p>
                ) : null}
              </div>
              {resetPassword.error ? (
                <p className='text-sm text-destructive'>
                  {resetPassword.error.message}
                </p>
              ) : null}
              <Button
                type='submit'
                disabled={otp.length < 6 || !passwordsMatch || resetPassword.isPending}
                className='rounded-lg bg-[#8f7a66] text-white hover:bg-[#7d6a58]'
              >
                {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
              </Button>
            </form>
          ) : null}
          <Button variant='link' asChild className='h-auto p-0 text-[#eee4da] hover:text-[#776e65]'>
            <Link to='/sign-in'>Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
