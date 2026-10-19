import { auth } from "@/auth";
import { GoogleAuthSection } from "@/components/quizland/google-auth-section";
import { LocalProfilePicker } from "@/components/quizland/local-profile-picker";
import { QzButton } from "@/components/quizland/qz-button";

export default async function ConnexionPage() {
  const session = await auth();

  return (
    <div className="bg-[#1A0E33]">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md flex-col justify-center px-5 py-14 sm:px-8">
        <h1 className="mb-7 text-center font-heading text-xl font-extrabold text-white">
          Rejoindre l&apos;arène
        </h1>

        <GoogleAuthSection />

        {/* Once signed in with Google, that's the active profile — offering
            a second, local-only profile alongside it would be confusing, so
            the guest/local picker only makes sense before that happens. */}
        {session?.user ? (
          <QzButton href="/domaines" tone="accent" className="w-full">
            Continuer vers l&apos;arène →
          </QzButton>
        ) : (
          <LocalProfilePicker />
        )}
      </div>
    </div>
  );
}
