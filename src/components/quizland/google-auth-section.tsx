import { auth, signIn, signOut } from "@/auth";
import { ImportLocalProfileButton } from "@/components/quizland/import-local-profile-button";

export async function GoogleAuthSection() {
  const session = await auth();

  if (session?.user) {
    return (
      <>
        <div className="mb-6 flex items-center justify-between gap-3 rounded-full border-2 border-[#3A1763] px-4 py-3 text-sm text-white">
          <span>
            Connecté à ton compte Google en tant que{" "}
            <strong>{session.user.name ?? session.user.email}</strong>
          </span>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="font-semibold text-[#9b8fc2] hover:text-white"
            >
              Déconnexion
            </button>
          </form>
        </div>
        <ImportLocalProfileButton />
      </>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/connexion" });
      }}
      className="mb-6"
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#3A1763] bg-white px-4 py-3 text-sm font-bold text-[#1A0E33] transition hover:bg-white/90"
      >
        Continuer avec Google
      </button>
    </form>
  );
}
