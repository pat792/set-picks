/**
 * In-page back control for /terms + /privacy.
 * When the visitor came from HTML-first `/login` signup/signin, send them
 * back to the auth door (not marketing home). Browser Back still uses the
 * sessionStorage stash consumed on LoginPage (#908).
 *
 * @param {'signup' | 'signin' | null | undefined} resumeKind
 * @returns {{ href: string, label: string, hardNav: boolean }}
 */
export function resolveLegalBackNav(resumeKind) {
  if (resumeKind === 'signup') {
    return {
      href: '/login?mode=signup',
      label: 'Back to create account',
      hardNav: true,
    };
  }
  if (resumeKind === 'signin') {
    return {
      href: '/login',
      label: 'Back to sign in',
      hardNav: true,
    };
  }
  return {
    href: '/',
    label: "Back to Setlist Pick 'Em",
    // Soft Link OK on marketing doc; hard <a> also fine from app SPA.
    hardNav: false,
  };
}
