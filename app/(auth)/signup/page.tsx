import AuthForm from '@/components/auth/AuthForm'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <AuthForm
      mode="signup"
      initialError={error === 'auth_failed' ? 'Your login link was invalid or has expired. Please try again.' : undefined}
    />
  )
}
