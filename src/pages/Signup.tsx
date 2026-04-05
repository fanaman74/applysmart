import { SignupForm } from '../components/auth/SignupForm'

export function Signup() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base px-4">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-text">
        Apply<span className="text-accent">Smarter</span>
      </h1>
      <SignupForm />
    </div>
  )
}
