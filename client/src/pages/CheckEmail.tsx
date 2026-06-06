export default function CheckEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">
          Check Your Email
        </h1>

        <p className="text-muted-foreground">
          We've sent a verification link to your email address.
          Please click the link to activate your account.
        </p>
      </div>
    </div>
  );
}