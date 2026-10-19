import { GoogleAuthSection } from "@/components/quizland/google-auth-section";
import { LocalProfilePicker } from "@/components/quizland/local-profile-picker";

export default function ConnexionPage() {
  return (
    <div className="bg-[#1A0E33]">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md flex-col justify-center px-5 py-14 sm:px-8">
        <h1 className="mb-7 text-center font-heading text-xl font-extrabold text-white">
          Rejoindre l&apos;arène
        </h1>

        <GoogleAuthSection />
        <LocalProfilePicker />
      </div>
    </div>
  );
}
