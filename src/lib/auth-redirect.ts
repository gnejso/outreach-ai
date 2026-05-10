// Helper to redirect to login on 401
export function handleUnauthorized(response: Response, router: { push: (path: string) => void }) {
  if (response.status === 401) {
    router.push("/login");
    return true;
  }
  return false;
}
