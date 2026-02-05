import Link from 'next/link';

type LoginPageProps = {
  searchParams?: { error?: string; next?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = Boolean(searchParams?.error);
  const nextPath = searchParams?.next ?? '/';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the admin password to access this application.
        </p>
        {hasError && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid password. Please try again.
          </p>
        )}
        <form className="mt-4 space-y-4" method="post" action="/api/login">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-500">
          Need to configure the password? Update <code>ADMIN_PASSWORD</code> in your
          environment.
        </p>
        <Link className="mt-4 block text-xs text-blue-600 hover:underline" href={nextPath}>
          Back to app
        </Link>
      </div>
    </main>
  );
}
